#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// MATRIX REACH DETECTOR — a booby trap for "loose" programs.js code.
//
// WHAT THIS IS, AND IS NOT
//
// It answers one question: **which lines of programs.js does each persona
// combo actually execute, and is any code live for only a sliver of the
// matrix (or none of it)?** It is a reachability map, not a correctness
// check. Green means "no NEW dead or pinpoint code since the committed
// baseline." It does NOT mean the code is right — doctrine.mjs owns that.
//
// WHY IT EXISTS (Kerwin, 2026-10-07): "trying to catch code that is only
// live on [e.g.] transform 5-day programs." persona-matrix.mjs proves every
// combo produces a LEGAL program; it cannot see that a branch only ever
// runs for one goal x day-count. This sweeps the SAME 1050 combos
// (scripts/lib/persona-combos.mjs — one matrix, one home) with V8 precise
// coverage taken PER COMBO, then classifies every code line by which goals /
// day-counts / sexes / tiers / injury profiles reach it.
//
// CLASSES (per code line)
//   COLD      ran only during warm-up (lazy-init/memoize code). Reached, not gated.
//   DEAD      reached by 0 combos. Either truly dead, or reachable only from
//             tandem.html / authored paths / axes the matrix does not vary
//             (age, height, weight, experience — see persona-combos.mjs).
//   PINPOINT  reached by exactly ONE goal AND exactly ONE day-count — the
//             "only live for transform 5-day" shape. Gated.
//   *_EXCL    reached by exactly one value on one axis. Reported, counted,
//             not gated alone (strength-only code is legitimately goal-
//             exclusive); a per-function increase is surfaced in the diff.
//
// THE TRAP (what fails the gate)
//   For each top-level function, vs scripts/snapshots/matrix-reach-baseline.json:
//     - dead lines or pinpoint lines INCREASED
//     - the set of goals or day-counts that reach the function SHRANK
//     - a NEW function is entirely unreached, or contains pinpoint lines
//   Fix = make the code reachable for the whole matrix, or — if the narrow
//   reach is genuinely intended — run with --update and put the reason in
//   the commit body. The baseline diff is the audit trail. Never edit the
//   baseline by hand.
//
// KNOWN LIMITS (stated, not hidden)
//   - programs.js only. tandem.html code is not driven by getProgram().
//   - A line counts as executed if its first non-space character is covered;
//     single-line blocks/closures inside it are tracked as separate sub-line
//     units. Multi-line zero blocks are caught via their own lines. A branch
//     V8 merges into its parent's count (same count) cannot be separated.
//   - A closure V8 does not report when its parent never ran shows as part
//     of the parent. Dead-function detection relies on V8 listing top-level
//     functions at load (verified: 35 of 39 listed with count 0).
//   - Block coverage reflects the engine's own branching: a branch keyed on
//     a value the matrix never passes (experience, age) is DEAD here even
//     though a real user can reach it. That is a finding about the matrix.
//
// Run:   node scripts/matrix-reach-detector.mjs            (gate)
//        node scripts/matrix-reach-detector.mjs --update   (re-baseline)
//        node scripts/matrix-reach-detector.mjs --report   (full listing, exit 0)
// ═══════════════════════════════════════════════════════

import inspector from 'inspector';
import vm from 'vm';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { combos, GOALS, DAY_COUNTS, SEXES, TIERS, INJURY_PROFILES, COMBO_COUNT } from './lib/persona-combos.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = process.env.REACH_SRC || resolve(__dirname, '../programs.js');
const BASELINE = process.env.REACH_BASELINE || resolve(__dirname, 'snapshots/matrix-reach-baseline.json');
const UPDATE = process.argv.includes('--update');
const REPORT = process.argv.includes('--report');
const URL_TAG = '/tandem/programs.js';

const code = readFileSync(SRC, 'utf8');

// ── line index: char offset -> line number, and which lines are "code" ──
const lineStart = [0];
for (let i = 0; i < code.length; i++) if (code[i] === '\n') lineStart.push(i + 1);
const NLINES = lineStart.length;
const lines = code.split('\n');
const isCodeLine = lines.map(l => {
  const t = l.trim();
  if (!t) return false;
  if (t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) return false;
  if (/^[\s{}\[\]();,]*$/.test(t)) return false; // pure punctuation
  return true;
});
const firstNonSpace = lines.map((l, i) => lineStart[i] + (l.length - l.trimStart().length));

// ── coverage session ──
const session = new inspector.Session();
session.connect();
const post = (m, p) => new Promise((res, rej) => session.post(m, p || {}, (e, x) => (e ? rej(e) : res(x))));
await post('Profiler.enable');
await post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });

const ctx = { console };
vm.createContext(ctx);
new vm.Script(code, { filename: URL_TAG }).runInContext(ctx);

const mineOf = (t) => (t.result.find(r => r.url.endsWith(URL_TAG))?.functions) || [];
const loadFns = mineOf(await post('Profiler.takePreciseCoverage'));

// Top-level functions = load-listed functions not nested inside another.
const spans = loadFns
  .map(f => ({ name: f.functionName, start: f.ranges[0].startOffset, end: f.ranges[0].endOffset }))
  .filter(f => f.name && f.end > f.start);
spans.sort((a, b) => a.start - b.start || b.end - a.end);
const topFns = [];
for (const s of spans) {
  const last = topFns[topFns.length - 1];
  if (last && s.start >= last.start && s.end <= last.end) continue; // nested
  topFns.push(s);
}
const lineOf = (off) => { // binary search
  let lo = 0, hi = NLINES - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStart[mid] <= off) lo = mid; else hi = mid - 1; }
  return lo;
};
const fnOfLine = new Array(NLINES).fill(null);
for (const f of topFns) {
  const a = lineOf(f.start), b = lineOf(Math.max(f.start, f.end - 1));
  for (let l = a; l <= b; l++) if (isCodeLine[l]) fnOfLine[l] = f.name;
}
// Same-named top-level functions would collide in the baseline; fail loudly.
const nameCount = {};
for (const f of topFns) nameCount[f.name] = (nameCount[f.name] || 0) + 1;
const dupes = Object.keys(nameCount).filter(n => nameCount[n] > 1);
if (dupes.length) { console.error('Duplicate top-level function names (baseline key collision):', dupes.join(', ')); process.exit(1); }

// ── per-line axis hit tables ──
const A = { goal: GOALS, days: DAY_COUNTS, sex: SEXES, tier: TIERS, injury: INJURY_PROFILES.map(i => i.label) };
const axisKeys = Object.keys(A);
const hit = { total: new Uint16Array(NLINES) };
for (const k of axisKeys) hit[k] = A[k].map(() => new Uint16Array(NLINES)); // [valueIdx][line]

const covered = new Uint8Array(code.length + 1);
// TWO PASSES in one context. Pass 0 warms every lazy-init / memoize cache and
// records only which lines ran at all ("cold"). Pass 1 is the measurement.
// Without this, one-time init code (e.g. movementPatternOf's __built cache)
// is attributed to whichever combo happens to run first and reads as
// "pinpoint" — a false trap that would teach people to ignore the trap.
const cold = new Uint8Array(NLINES);
const topSpan = new Set(topFns.map(f => f.start + ':' + f.end));
// Sub-line units (added after mutation testing showed a single-line
// `if (goal==='transform' && days===5) { ... }` hid its body: the line's first
// character is always covered). Every count-0 block / nested-function range that
// sits on ONE line is its own unit; its reach = the line's reach minus the
// combos where V8 reported that range unexecuted.
const units = new Map(); // key "start:end" -> { line, zero: {axis:[counts]}, zero0: n, head0: n }
const head0 = new Uint16Array(NLINES); // pass-0: combos whose line head ran
const unitOf = (key, line) => {
  let u = units.get(key);
  if (!u) { u = { line, zero0: 0, zero: {} }; for (const k of axisKeys) u.zero[k] = A[k].map(() => 0); u.zeroTotal = 0; units.set(key, u); }
  return u;
};
let ran = 0;
for (const pass of [0, 1]) {
  for (const c of combos()) {
    ctx.__args = c.args;
    vm.runInContext('__r = getProgram.apply(null, __args)', ctx);
    const fns = mineOf(await post('Profiler.takePreciseCoverage'));
    covered.fill(0);
    fns.sort((x, y) => x.ranges[0].startOffset - y.ranges[0].startOffset || y.ranges[0].endOffset - x.ranges[0].endOffset);
    for (const f of fns) for (const r of f.ranges) covered.fill(r.count > 0 ? 1 : 0, r.startOffset, r.endOffset);
    // single-line zero ranges whose line head DID execute this combo
    const zeroKeys = [];
    for (const f of fns) {
      f.ranges.forEach((r, i) => {
        if (r.count !== 0 || r.endOffset <= r.startOffset) return;
        if (i === 0 && topSpan.has(r.startOffset + ':' + r.endOffset)) return; // top-level fn: whole-line handling
        const l = lineOf(r.startOffset);
        if (l !== lineOf(r.endOffset - 1) || !fnOfLine[l] || !covered[firstNonSpace[l]]) return;
        if (r.startOffset <= firstNonSpace[l]) return; // range starts at the head: that is the whole line
        zeroKeys.push([r.startOffset + ':' + r.endOffset, l]);
      });
    }
    if (pass === 0) {
      for (let l = 0; l < NLINES; l++) if (fnOfLine[l] && covered[firstNonSpace[l]]) { cold[l] = 1; head0[l]++; }
      for (const [k, l] of zeroKeys) unitOf(k, l).zero0++;
      continue;
    }
    const gi = A.goal.indexOf(c.goal), di = A.days.indexOf(c.days), si = A.sex.indexOf(c.sex),
      ti = A.tier.indexOf(c.tier), ii = A.injury.indexOf(c.injury.label);
    for (let l = 0; l < NLINES; l++) {
      if (!fnOfLine[l] || !covered[firstNonSpace[l]]) continue;
      hit.total[l]++; hit.goal[gi][l]++; hit.days[di][l]++; hit.sex[si][l]++; hit.tier[ti][l]++; hit.injury[ii][l]++;
    }
    for (const [k, l] of zeroKeys) {
      const u = unitOf(k, l); u.zeroTotal++;
      u.zero.goal[gi]++; u.zero.days[di]++; u.zero.sex[si]++; u.zero.tier[ti]++; u.zero.injury[ii]++;
    }
    ran++;
  }
}
if (ran !== COMBO_COUNT) { console.error(`Ran ${ran} measured combos, expected ${COMBO_COUNT}`); process.exit(1); }

// ── classify ──
const reachedValues = (k, l) => A[k].filter((_, v) => hit[k][v][l] > 0);
const perFn = {};
const dead = [], pinpoint = [];
for (let l = 0; l < NLINES; l++) {
  const name = fnOfLine[l];
  if (!name) continue;
  const f = (perFn[name] ||= { codeLines: 0, dead: 0, coldOnly: 0, pinpoint: 0, goalExcl: 0, daysExcl: 0, tierExcl: 0, sexExcl: 0, injuryExcl: 0, goals: new Set(), days: new Set() });
  f.codeLines++;
  if (hit.total[l] === 0) {
    if (cold[l]) { f.coldOnly++; continue; } // one-time init: ran in warm-up only, not dead
    f.dead++; dead.push({ line: l + 1, fn: name }); continue;
  }
  const g = reachedValues('goal', l), d = reachedValues('days', l);
  g.forEach(x => f.goals.add(x)); d.forEach(x => f.days.add(x));
  if (g.length === 1 && d.length === 1) { f.pinpoint++; pinpoint.push({ line: l + 1, fn: name, goal: g[0], days: d[0] }); }
  if (g.length === 1) f.goalExcl++;
  if (d.length === 1) f.daysExcl++;
  if (reachedValues('tier', l).length === 1) f.tierExcl++;
  if (reachedValues('sex', l).length === 1) f.sexExcl++;
  if (reachedValues('injury', l).length === 1) f.injuryExcl++;
}
// ── sub-line units: reach = line head reach - combos where the range was unexecuted ──
for (const [key, u] of units) {
  const l = u.line, name = fnOfLine[l];
  const f = perFn[name];
  const reach = {};
  for (const k of axisKeys) reach[k] = A[k].filter((_, v) => hit[k][v][l] - u.zero[k][v] > 0);
  const total = hit.total[l] - u.zeroTotal;
  f.codeLines++; // a sub-line unit counts as one more code unit
  if (total <= 0) {
    // ran in warm-up only? cold if head ran in pass 0 on a combo where this range was NOT zero
    if (head0[l] - u.zero0 > 0) { f.coldOnly++; continue; }
    f.dead++; dead.push({ line: l + 1, fn: name, sub: true }); continue;
  }
  if (reach.goal.length === 1 && reach.days.length === 1) { f.pinpoint++; pinpoint.push({ line: l + 1, fn: name, goal: reach.goal[0], days: reach.days[0], sub: true }); }
  if (reach.goal.length === 1) f.goalExcl++;
  if (reach.days.length === 1) f.daysExcl++;
  if (reach.tier.length === 1) f.tierExcl++;
  if (reach.sex.length === 1) f.sexExcl++;
  if (reach.injury.length === 1) f.injuryExcl++;
  reach.goal.forEach(x => f.goals.add(x)); reach.days.forEach(x => f.days.add(x));
}
const current = {};
for (const [name, f] of Object.entries(perFn).sort(([a], [b]) => a.localeCompare(b))) {
  current[name] = {
    codeLines: f.codeLines, dead: f.dead, coldOnly: f.coldOnly, pinpoint: f.pinpoint,
    goalExcl: f.goalExcl, daysExcl: f.daysExcl, tierExcl: f.tierExcl, sexExcl: f.sexExcl, injuryExcl: f.injuryExcl,
    goals: [...f.goals].sort((a, b) => GOALS.indexOf(a) - GOALS.indexOf(b)),
    days: [...f.days].sort((a, b) => a - b),
  };
}
const sum = (k) => Object.values(current).reduce((n, f) => n + f[k], 0);
const totals = { combos: ran, functions: Object.keys(current).length, codeLines: sum('codeLines'), dead: sum('dead'), coldOnly: sum('coldOnly'), pinpoint: sum('pinpoint'), goalExcl: sum('goalExcl'), daysExcl: sum('daysExcl') };

function ranges(items) { // collapse consecutive line numbers
  const out = []; let s = null, p = null;
  for (const n of [...new Set(items.map(i => i.line))]) {
    if (s === null) { s = p = n; } else if (n === p + 1) { p = n; } else { out.push(s === p ? `${s}` : `${s}-${p}`); s = p = n; }
  }
  if (s !== null) out.push(s === p ? `${s}` : `${s}-${p}`);
  return out;
}
function listBy(items, label) {
  const by = {};
  for (const i of items) (by[i.fn] ||= []).push(i);
  for (const [fn, arr] of Object.entries(by)) {
    const extra = label === 'PINPOINT' ? `  [${[...new Set(arr.map(a => a.goal + '/' + a.days + 'd'))].join(', ')}]` : '';
    console.log(`    ${label.padEnd(8)} ${fn}  lines ${ranges(arr).join(', ')}${arr.some(a => a.sub) ? ' (incl. in-line block)' : ''}${extra}`);
  }
}

console.log(`Matrix reach: ${totals.combos}/${COMBO_COUNT} combos swept over programs.js (${totals.functions} top-level functions, ${totals.codeLines} code lines)`);
console.log(`  dead (0 combos): ${totals.dead}   cold-init-only: ${totals.coldOnly}   pinpoint (1 goal AND 1 day-count): ${totals.pinpoint}   goal-exclusive: ${totals.goalExcl}   day-exclusive: ${totals.daysExcl}`);

if (REPORT) {
  listBy(dead, 'DEAD'); listBy(pinpoint, 'PINPOINT');
  process.exit(0);
}

if (UPDATE) {
  mkdirSync(dirname(BASELINE), { recursive: true });
  writeFileSync(BASELINE, JSON.stringify({ _readme: 'Generated by scripts/matrix-reach-detector.mjs --update. Never edit by hand; the diff of this file is the audit trail for any change in which goals/day-counts reach which code.', totals, functions: current }, null, 2) + '\n');
  console.log(`Baseline written: ${BASELINE}`);
  process.exit(0);
}

let base;
try { base = JSON.parse(readFileSync(BASELINE, 'utf8')); }
catch { console.error(`No baseline at ${BASELINE}. Run with --update once and commit it.`); process.exit(1); }

const fails = [];
for (const [name, c] of Object.entries(current)) {
  const b = base.functions[name];
  if (!b) {
    if (c.codeLines && c.dead === c.codeLines) fails.push(`NEW function ${name} is unreached by all ${ran} combos (${c.codeLines} lines) — dead on arrival`);
    else if (c.pinpoint > 0) fails.push(`NEW function ${name} has ${c.pinpoint} pinpoint line(s) — live for exactly one goal AND one day-count`);
    continue;
  }
  if (c.dead > b.dead) fails.push(`${name}: dead lines ${b.dead} -> ${c.dead}`);
  if (c.pinpoint > b.pinpoint) fails.push(`${name}: pinpoint lines ${b.pinpoint} -> ${c.pinpoint}`);
  const lostG = b.goals.filter(g => !c.goals.includes(g)), lostD = b.days.filter(d => !c.days.includes(d));
  if (lostG.length) fails.push(`${name}: no longer reached for goal(s) ${lostG.join(', ')}`);
  if (lostD.length) fails.push(`${name}: no longer reached for day-count(s) ${lostD.join(', ')}`);
}
const removed = Object.keys(base.functions).filter(n => !current[n]);

if (fails.length) {
  console.log('\nREACH REGRESSION — code became narrower or dead since the baseline:');
  for (const f of fails) console.log('  FAIL  ' + f);
  listBy(dead, 'DEAD'); listBy(pinpoint, 'PINPOINT');
  console.log('\nFix: make the code reachable across the matrix. If the narrow reach is intended, run');
  console.log('  node scripts/matrix-reach-detector.mjs --update');
  console.log('and state WHY in the commit body (the baseline diff is the audit trail).');
  process.exit(1);
}
if (removed.length) console.log(`  note: ${removed.length} baselined function(s) no longer exist (${removed.slice(0, 5).join(', ')}) — run --update to prune.`);
console.log('Matrix reach: PASS — no new dead or pinpoint code, no function lost a goal or day-count.');
