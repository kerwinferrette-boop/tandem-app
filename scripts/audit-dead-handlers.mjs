#!/usr/bin/env node
// EPIC-40 CATALOG half — mechanical, exhaustive sweep of every onclick/onchange/oninput
// handler in tandem.html. Classifies each per the Epic's own methodology:
//   Generative   — writes to Supabase, mutates program/app state, or feeds a downstream calc
//   Navigational — legitimately just opens/closes a view or modal
//   Cosmetic-only — toggles a class/highlight with no persistence and no downstream read
// Read-only: makes zero edits to tandem.html or programs.js.
import fs from 'fs';

const html = fs.readFileSync(new URL('../tandem.html', import.meta.url), 'utf8');

// 0. Collect every top-level global (let/var/const NAME = ...) declared directly under <script>.
//    Assignment to one of these names elsewhere is a real state mutation (BUG-40's "feeds a
//    downstream calc" case), not cosmetic — this is what the v1 heuristic under-caught for
//    selectedGoal/selectedDays/etc.
const globalNames = new Set();
for (const gm of html.matchAll(/^\s*(?:let|var|const)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/gm)) {
  globalNames.add(gm[1]);
}

const KEYWORDS = new Set(['if','for','while','switch','catch','function','typeof','return','new',
  'else','do','try','void','delete','in','of','instanceof','await','async']);

// 1. Extract every onclick/onchange/oninput attribute value, mechanical + exhaustive.
const attrRe = /(onclick|onchange|oninput)="([^"]*)"/g;
const handlers = [];
let m;
while ((m = attrRe.exec(html))) handlers.push({ kind: m[1], raw: m[2] });

// 2. Real function calls in a handler body: not preceded by '.', not a JS keyword.
function realCalls(js) {
  const cleaned = js.replace(/\$\{[^}]*\}/g, 'X');
  const out = [];
  const re = /(?<![.\w])([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
  let mm;
  while ((mm = re.exec(cleaned))) {
    if (!KEYWORDS.has(mm[1])) out.push(mm[1]);
  }
  return out;
}

// 3. Locate a top-level function definition's body by name, brace-matching.
const fnBodyCache = new Map();
function findFunctionBody(name) {
  if (fnBodyCache.has(name)) return fnBodyCache.get(name);
  let re = new RegExp(`function\\s+${name}\\s*\\(`, 'g');
  let mm = re.exec(html);
  if (!mm) {
    re = new RegExp(`(?:const|let|var)\\s+${name}\\s*=\\s*(?:async\\s*)?(?:function)?\\s*\\(`, 'g');
    mm = re.exec(html);
  }
  if (!mm) { fnBodyCache.set(name, null); return null; }
  const openParenIdx = html.indexOf('(', mm.index);
  let depth = 0, i = openParenIdx;
  for (; i < html.length; i++) {
    if (html[i] === '(') depth++;
    else if (html[i] === ')') { depth--; if (depth === 0) break; }
  }
  let braceStart = html.indexOf('{', i);
  if (braceStart === -1 || braceStart - i > 30) { fnBodyCache.set(name, null); return null; }
  let bd = 0, j = braceStart;
  for (; j < html.length; j++) {
    if (html[j] === '{') bd++;
    else if (html[j] === '}') { bd--; if (bd === 0) break; }
  }
  const body = html.slice(braceStart, j + 1);
  fnBodyCache.set(name, body);
  return body;
}

const NAV_FNS = new Set(['showView','openModal','closeModal','closeQAPanel','toggleSetup','toggleMob',
  'toggleExCard','toggleSW','switchTab','openProgramLibrary','closeProgramLibrary','openWorkoutHistory',
  'openQAPanel','openBugModal','closeBugModal','openExerciseHistory','openSwapPicker']);

const RANK = { 'Generative (DB write)':5, 'Generative (state mutation)':4,
  'Generative (feeds downstream calc)':3, 'Navigational':2, 'Cosmetic-only (candidate)':1,
  'NEEDS-REVIEW':0, 'UNRESOLVED':0 };

function classifyOne(fnName, body) {
  if (!body) return NAV_FNS.has(fnName) ? 'Navigational' : 'UNRESOLVED';
  const writesDB = /\bsb\.from\(/.test(body) || /supabase/i.test(body);
  const globalAssign = new RegExp(`\\b(${[...globalNames].filter(n=>n!==fnName).join('|')})\\s*=\\s*(?!=)`).test(body);
  const mutatesLocal = /localStorage\.(setItem|removeItem)/.test(body) || /\.push\(|\.splice\(/.test(body);
  const feedsCalc = /\b(calc|render|update|apply|save|submit|sync|finish|build|generate)[A-Za-z]*\s*\(/i.test(body);
  const navOnly = /\b(showView|openModal|closeModal)\s*\(/.test(body);
  const cosmeticOnly = /classList\.(toggle|add|remove)/.test(body) &&
    !writesDB && !globalAssign && !mutatesLocal;

  if (writesDB) return 'Generative (DB write)';
  if (globalAssign || mutatesLocal) return 'Generative (state mutation)';
  if (feedsCalc) return 'Generative (feeds downstream calc)';
  if (navOnly) return 'Navigational';
  if (NAV_FNS.has(fnName)) return 'Navigational';
  if (cosmeticOnly) return 'Cosmetic-only (candidate)';
  return 'NEEDS-REVIEW';
}

const uniq = new Map();
for (const h of handlers) {
  if (uniq.has(h.raw)) continue;
  const calls = realCalls(h.raw);
  if (calls.length === 0) {
    uniq.set(h.raw, { kind: h.kind, raw: h.raw, calls: [], verdict: 'Cosmetic-only (candidate)',
      note: 'no non-dot function call — inline this.*/DOM literal' });
    continue;
  }
  let best = null, bestRank = -1, bestFn = null;
  for (const fn of calls) {
    const body = findFunctionBody(fn);
    const v = classifyOne(fn, body);
    if (RANK[v] > bestRank) { bestRank = RANK[v]; best = v; bestFn = fn; }
  }
  uniq.set(h.raw, { kind: h.kind, raw: h.raw, calls, verdict: best, note: `resolved via ${bestFn}` });
}

const rows = [...uniq.values()];
const byVerdict = {};
for (const r of rows) (byVerdict[r.verdict] ??= []).push(r);

console.log(`Total unique handlers: ${rows.length}`);
for (const [k, v] of Object.entries(byVerdict).sort((a,b)=>b[1].length-a[1].length)) {
  console.log(`  ${k}: ${v.length}`);
}
console.log('');

if (process.argv.includes('--full')) {
  for (const r of rows) {
    console.log(`[${r.kind}] ${r.verdict.padEnd(34)} ${r.raw.slice(0,70).padEnd(72)} <- ${r.calls.join(',') || '(none)'}`);
  }
} else {
  for (const bucket of ['Cosmetic-only (candidate)', 'NEEDS-REVIEW', 'UNRESOLVED']) {
    console.log(`--- ${bucket} ---`);
    for (const r of (byVerdict[bucket]||[])) {
      console.log(`[${r.kind}] ${r.raw}  <- ${r.calls.join(',') || '(inline)'}`);
    }
    console.log('');
  }
}
