#!/usr/bin/env node
// why-availability-smoke.mjs — FEAT "context-aware exercise rationale per equipment tier"
// (in-app report 382243a7, Kerwin, 2026-07-03: a full-gym workout showed
// "accessible anywhere"-style rationale).
//
// MECHANISM: the tier ladder re-serves home / hotel_gym bank entries to full_gym users
// (tierOrder = home, hotel_gym, full_gym), and every exercise carries ONE tier-agnostic
// `why`. So an availability sentence ("anywhere", "zero equipment", "accessible with just a
// pair of dumbbells") is written for one tier and reads wrong for the tier that receives it.
// A `why` states WHY the movement trains the muscle; where it can be performed is not a
// training rationale, so it does not belong in a string every tier shares.
//
// SCOPE (corrected 2026-10-13 after an independent verifier found the first version was
// narrower than this header claimed): TWO independent checks, both must pass.
//   [bank]   every EXERCISE_BANK entry's `why` (evaluated, so a computed string is covered)
//   [source] EVERY `why:'…'` string literal anywhere in programs.js — this reaches the
//            filler / substitution pools and static fallback programs that sit outside
//            EXERCISE_BANK but are rendered through the same ex.why path.
// Hyphenated forms ("no-equipment", "zero-equipment") are matched. Deliberately NOT matched:
// bare "travel" (movement cues: "knees travel forward") and "any gym" (names a venue the
// user is already in). ALLOWED, with the reason: "only accessible with bent knee" is
// anatomy (the soleus is only reachable with the knee flexed), not availability.
//
// Not covered, said plainly: copy built at runtime in tandem.html, and any `why` whose text
// is assembled from non-literal parts in programs.js (the [bank] check covers the bank's).
//
// Run: node scripts/why-availability-smoke.mjs   (exit 1 on any hit)
// Test hook: WHY_SMOKE_SRC=<path> points both checks at a copy (used to mutation-test).
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const file = process.env.WHY_SMOKE_SRC || join(root, 'programs.js');
const src = readFileSync(file, 'utf8');
const { EXERCISE_BANK } = vm.runInNewContext(
  `(function(){ ${src}; return { EXERCISE_BANK }; })()`, { console });

const AVAILABILITY = /\banywhere\b|\bzero[- ]equipment\b|\bno[- ]equipment\b|\bno (?:gym|machine) access\b|\bno cable required\b|\baccessible\b|\bneeds only\b|\bequipment beyond\b|\btravels? anywhere\b|\bnothing but bodyweight\b|\brequiring nothing\b/i;
const ANATOMY_OK = /only accessible with bent knee/i;
const hit = (t) => { const m = AVAILABILITY.exec(t); return m && !ANATOMY_OK.test(t.slice(Math.max(0, m.index - 10), m.index + m[0].length + 20)) ? m : null; };

const bad = [];
for (const [slug, ex] of Object.entries(EXERCISE_BANK)) {
  const m = hit(ex.why || '');
  if (m) bad.push(`[bank]   ${slug} (${ex.tier}): "…${ex.why.slice(Math.max(0, m.index - 25), m.index + m[0].length + 25)}…"`);
}
let literals = 0;
for (const mm of src.matchAll(/why:\s*'((?:[^'\\]|\\.)*)'/g)) {
  literals++;
  const m = hit(mm[1]);
  if (m) bad.push(`[source] line ${src.slice(0, mm.index).split('\n').length}: "…${mm[1].slice(Math.max(0, m.index - 25), m.index + m[0].length + 25)}…"`);
}
if (literals < 150) bad.push(`[source] only ${literals} why:'…' literals found — the scan lost its target (expected >150)`);
if (bad.length) {
  console.error(`FAIL — ${bad.length} availability-phrasing hit(s) in shared \`why\` copy:`);
  bad.forEach(b => console.error('  ' + b));
  process.exit(1);
}
console.log(`PASS — 0 availability phrasing in ${Object.keys(EXERCISE_BANK).length} EXERCISE_BANK whys and ${literals} why:'…' literals in programs.js`);
