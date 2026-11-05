#!/usr/bin/env node
// pointer-freshness-smoke.mjs — a `tandem.html:NNNN` pointer may not silently drift away from
// the symbol it names.
//
// ORIGIN (BUG-250, filed 2026-11-01 while shipping BUG-163). tandem.html is a moving file, and the
// doctrine layer cites it by line number. Two comments had drifted thousands of lines:
//   scripts/doctrine.mjs  "tandem.html:4977"            -> RECOVERY_PARAMS is declared at ~8791
//   programs.js           "tandem.html:3516/3551 ... :3977" -> the rest render / countdown moved
// Nothing noticed, because nothing resolved a pointer against the file it points into. The row
// asked to fix the mechanism, not the instance: the two comments are rewritten to name SYMBOLS
// (which do not drift), and this gate catches the next pointer that goes stale.
//
// WHAT THIS GATE DOES (static; reads the WORKING TREE with plain fs reads — never `git show
// origin/main:<file>`, which would be blind to the change being tested):
//   [P1] scans scripts/doctrine.mjs, programs.js and DOCTRINE.md for pointers into tandem.html in
//        BOTH shapes: a prefixed `tandem.html:NNNN`, AND a bare `:NNNN` or `/NNNN` continuation on a
//        line that already names tandem.html (two of the three pointers that opened BUG-250 were
//        written that way — a prefixed-only matcher would never have seen them);
//   [P2] for each pointer, collects the identifiers the same line (or table row) names and that
//        tandem.html DECLARES (`function X(`, `const|let|var X =`). If at least one exists and none
//        is declared within TOLERANCE lines of the cited line, the pointer FAILS;
//   [P3] a pointer whose line names no resolvable identifier is reported UNCHECKED, never failed —
//        an unbounded assertion would be red on day one and get deleted (CLAUDE.md, SC-39);
//   [P4] red probe, every run: the exact pre-fix BUG-250 doctrine.mjs line is fed through the same
//        checker against the live tandem.html and MUST fail, and the pre-fix programs.js line MUST
//        yield three parsed pointers (one prefixed + two bare). If either probe passes, the checker
//        has lost its teeth and this gate fails closed.
//
// HONEST LIMITS:
//   - "Within TOLERANCE of a declaration" is the test. A pointer citing a line INSIDE a long function
//     body (not its declaration) more than TOLERANCE lines down will read as stale. None exists today;
//     if one appears, rewrite it by symbol rather than widening the tolerance.
//   - Identifiers are taken from backticks, `name(` call shapes, ALL_CAPS constants and camelCase
//     words. Plain English words are ignored on purpose (a `const rest =` somewhere must not turn
//     every sentence containing "rest" into a citation).
//   - Only tandem.html pointers are checked. programs.js:NNNN pointers are a sibling class this row
//     did not ask for.
//
// Run: node scripts/pointer-freshness-smoke.mjs   Exit 0 = safe.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SOURCES = ['scripts/doctrine.mjs', 'programs.js', 'DOCTRINE.md'];
const TOLERANCE = 30;

const tandemLines = readFileSync(path.join(root, 'tandem.html'), 'utf8').split('\n');

// name -> [1-based declaration line, ...]
const decls = new Map();
const DECL_RE = /(?:^|[^\w$.])(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|[^\w$.])(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g;
tandemLines.forEach((line, i) => {
  for (const m of line.matchAll(DECL_RE)) {
    const name = m[1] || m[2];
    if (!decls.has(name)) decls.set(name, []);
    decls.get(name).push(i + 1);
  }
});

function identifiersOn(text) {
  const out = new Set();
  for (const m of text.matchAll(/`([A-Za-z_$][\w$]*)(?:\(\))?`/g)) out.add(m[1]);
  for (const m of text.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) out.add(m[1]);
  for (const m of text.matchAll(/\b([A-Z][A-Z0-9_]{3,})\b/g)) out.add(m[1]);
  for (const m of text.matchAll(/\b([a-z][a-z0-9]*[A-Z][\w$]*)\b/g)) out.add(m[1]);
  return [...out].filter(n => decls.has(n));
}

// Returns [{ cited, shape }] for every tandem.html pointer on one line.
function pointersOn(text) {
  if (!text.includes('tandem.html')) return [];
  const found = [];
  const prefixed = /tandem\.html:(\d{2,6})/g;
  for (const m of text.matchAll(prefixed)) found.push({ cited: +m[1], shape: 'prefixed', at: m.index });
  // Bare continuations: ":NNNN" or "/NNNN" not immediately preceded by "tandem.html" and not part of
  // a time (12:30), a URL path, or another file's pointer (programs.js:123).
  // The lookbehind admits a preceding DIGIT so "3516/3551" yields 3551 — the chained form BUG-250's
  // own programs.js pointer used (this gate's first draft missed it; the [P4] probe caught that).
  for (const m of text.matchAll(/(?<=^|[^\w.]|\d)[:\/](\d{3,6})\b/g)) {
    const at = m.index;
    const before = text.slice(Math.max(0, at - 12), at);
    if (/tandem\.html$/.test(before)) continue;
    const prevTok = text.slice(0, at).match(/([\w.\-]+)$/);
    if (prevTok && /\.(js|mjs|md|sql|json)$/.test(prevTok[1])) continue;
    // A bare continuation must follow an earlier tandem.html pointer on the same line.
    const firstPrefixed = text.search(/tandem\.html:\d/);
    if (firstPrefixed === -1 || firstPrefixed > at) continue;
    found.push({ cited: +m[1], shape: 'bare', at });
  }
  return found.sort((a, b) => a.at - b.at);
}

function judge(text) {
  const ids = identifiersOn(text);
  return pointersOn(text).map(p => {
    if (!ids.length) return { ...p, verdict: 'UNCHECKED', ids };
    const hit = ids.find(n => decls.get(n).some(l => Math.abs(l - p.cited) <= TOLERANCE));
    if (hit) return { ...p, verdict: 'OK', hit, ids };
    return { ...p, verdict: 'STALE', ids };
  });
}

let failures = 0;

// [P4] red probes — run first; a checker without teeth must not report anything.
const PRE_FIX_DOCTRINE = '// Hours — tandem.html:4977, BUG-30 — getSingleDay does not read RECOVERY_PARAMS';
const PRE_FIX_PROGRAMS = '//     tandem.html:3516/3551 and the countdown at :3977. `ex.rest` is read';
const probeA = judge(PRE_FIX_DOCTRINE);
if (!(probeA.length === 1 && probeA[0].verdict === 'STALE')) {
  console.error(`FAIL  [P4] red probe: the pre-fix BUG-250 doctrine.mjs line must read STALE, got ${JSON.stringify(probeA.map(p => p.verdict))} — the checker has lost its teeth`);
  failures++;
} else console.log('  red probe OK: pre-fix doctrine.mjs pointer tandem.html:4977 reads STALE (RECOVERY_PARAMS is declared elsewhere)');
const probeB = pointersOn(PRE_FIX_PROGRAMS);
const shapes = probeB.map(p => `${p.shape}:${p.cited}`).join(',');
if (shapes !== 'prefixed:3516,bare:3551,bare:3977') {
  console.error(`FAIL  [P4] red probe: the pre-fix programs.js line must parse as prefixed:3516,bare:3551,bare:3977, got "${shapes}" — bare continuations are being missed`);
  failures++;
} else console.log('  red probe OK: pre-fix programs.js line parses all three pointers (1 prefixed + 2 bare)');

// [P1]-[P3] the live sweep.
let total = 0, ok = 0, unchecked = 0;
for (const rel of SOURCES) {
  const lines = readFileSync(path.join(root, rel), 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const r of judge(line)) {
      total++;
      const where = `${rel}:${i + 1}`;
      if (r.verdict === 'OK') { ok++; console.log(`  OK         ${where} -> tandem.html:${r.cited} (${r.hit})`); }
      else if (r.verdict === 'UNCHECKED') { unchecked++; console.log(`  UNCHECKED  ${where} -> tandem.html:${r.cited} (no identifier on the line that tandem.html declares)`); }
      else {
        failures++;
        const near = r.ids.map(n => `${n}@${decls.get(n).join('/')}`).join(', ');
        console.error(`FAIL  ${where} cites tandem.html:${r.cited} but the identifiers it names are declared at ${near} (tolerance ±${TOLERANCE}). Rewrite the pointer by symbol name, or correct the number.`);
      }
    }
  });
}
console.log(`  ${total} tandem.html pointer(s) across ${SOURCES.join(', ')}: ${ok} OK, ${unchecked} UNCHECKED, ${total - ok - unchecked} STALE`);
if (failures) { console.error(`FAIL  pointer freshness: ${failures} problem(s)`); process.exit(1); }
console.log('PASS  pointer freshness');
