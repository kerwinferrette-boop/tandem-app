#!/usr/bin/env node
/**
 * family-default-smoke.mjs — the declared family default must be consistent, and it must DECIDE.
 *
 * ORIGIN (BUG-256). The chest compound slot served Decline Barbell Press in every week 1-12 of
 * Kerwin's own program and Flat Barbell Press was never prescribed, because Flat and Decline tie on
 * every ranked criterion in buildDynamicProgram's comparator and the last tiebreak was
 * `a.name.localeCompare(b.name)` — the letter D beats the letter F. Measured app-wide before the fix:
 * reversing that tiebreak changed all 1050 programs and 22,610 of 32,410 exercise slots, so spelling
 * was load-bearing across most of the generator's selections.
 *
 * The fix adds a rank immediately before the alphabetical tiebreak: an entry carrying
 * `familyDefault: true` outranks one that does not. Kerwin ruled "Flat as main press" on 2026-11-06;
 * that ruling is the citation, the tier is ENGINEERING_DEFAULT, and no study is claimed — the repo's
 * sources are silent on flat-vs-decline and the one plausible primary source could not be read.
 *
 * WHAT THIS GATE ASSERTS:
 *   [F1] At least one bank entry carries `familyDefault: true`. Zero means the rank is INERT — it
 *        would compare equal for every candidate and the alphabetical tiebreak would silently decide
 *        again. Fails closed, because an inert rank looks exactly like a working one.
 *   [F2] Every MOVEMENT_FAMILIES `defaultVariant` resolves to a real bank entry, AND that entry
 *        carries `familyDefault: true`. A typo in either place disables the rank without any error.
 *   [F3] At most ONE entry per family carries the flag. The rank lives on the entry (R7 forbids a
 *        second reader of MOVEMENT_FAMILIES), so nothing in the app can enforce this — the gate is
 *        where the cross-table consistency lives, and a gate may read both tables because it is not
 *        app code.
 *   [F4] Every flagged entry is actually a member of the family that declares it.
 *   [F5] IT DECIDES, in generated output rather than in principle: at Kerwin's own saved settings
 *        (transform / 5 days / male / full_gym / advanced) the Day 1 compound block serves Flat
 *        Barbell Press and NOT Decline Barbell Press, in all of weeks 1-12.
 * DELIBERATELY NOT ASSERTED HERE — "the default did not make its siblings dead inventory". That
 * invariant is owned by scripts/selection-reachability-smoke.mjs (BUG-108), which ratchets the
 * never-selected set over 25,200 programs (1050 combos x T=24 x weeks 1-24). A first draft of this
 * gate asserted it locally over 40 programs and went RED while the authoritative gate was GREEN with
 * decline-barbell-press absent from its never-selected list — the narrow slice simply could not see
 * decline's rotation. A second, weaker home for an invariant that disagrees with the real one is a
 * silo, so it was deleted rather than widened. If making a lift the family default ever does strand
 * its siblings, BUG-108's ratchet is what fails.
 *
 * HONEST LIMITS: this says nothing about whether flat SHOULD be the default — that is a product
 * ruling, not a measurable property. And it does not assert placement in the rank chain; that the
 * default may never outrank a cited rank is enforced by reading the comparator, not by this gate.
 *
 * Run: node scripts/family-default-smoke.mjs
 */
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(join(root, 'programs.js'), 'utf8');
const { EXERCISE_BANK, MOVEMENT_FAMILIES, getProgram } = vm.runInNewContext(
  `(function(){ ${src}; return { EXERCISE_BANK, MOVEMENT_FAMILIES, getProgram }; })()`,
  { console: { log() {}, warn() {}, error() {} } },
);

const fails = [];
const flagged = Object.entries(EXERCISE_BANK).filter(([, e]) => e && e.familyDefault === true).map(([slug]) => slug);

// [F1]
if (!flagged.length) {
  fails.push('no bank entry carries familyDefault: true — the rank is INERT and the alphabetical tiebreak decides again. An inert rank is indistinguishable from a working one at a glance; that is why this fails closed.');
}

// [F2] / [F4]
const declaring = Object.entries(MOVEMENT_FAMILIES).filter(([, f]) => f && f.defaultVariant);
if (!declaring.length) fails.push('no MOVEMENT_FAMILIES entry declares a defaultVariant — nothing anchors the flag to a family.');
for (const [famKey, f] of declaring) {
  const entry = EXERCISE_BANK[f.defaultVariant];
  if (!entry) { fails.push(`family ${famKey}: defaultVariant '${f.defaultVariant}' is not a bank slug — the rank is silently disabled for this family.`); continue; }
  if (entry.familyDefault !== true) fails.push(`family ${famKey}: declares defaultVariant '${f.defaultVariant}' but that entry does NOT carry familyDefault: true — the declaration and the flag disagree, and only the flag is read.`);
  if (!(f.variants || []).includes(f.defaultVariant)) fails.push(`family ${famKey}: defaultVariant '${f.defaultVariant}' is not in its own variants list.`);
}

// [F3]
for (const [famKey, f] of Object.entries(MOVEMENT_FAMILIES)) {
  const inFam = (f.variants || []).filter(sl => EXERCISE_BANK[sl] && EXERCISE_BANK[sl].familyDefault === true);
  if (inFam.length > 1) fails.push(`family ${famKey} has ${inFam.length} entries flagged familyDefault (${inFam.join(', ')}) — at most one may be the default.`);
}
// a flagged entry belonging to no declaring family is an orphan flag
for (const slug of flagged) {
  const owner = declaring.find(([, f]) => (f.variants || []).includes(slug));
  if (!owner) fails.push(`entry '${slug}' carries familyDefault: true but no family declares it as defaultVariant — an orphan flag that still outranks every sibling in its pool.`);
}

// [F5] it decides, in real generated output
const KER = (week) => getProgram('transform', 5, 12, 'male', 'full_gym', 'balanced', null, null, { week, phase: 0 }, 'advanced', null, 60, 300, 240);
let flatWeeks = 0, declineWeeks = 0;
for (let w = 1; w <= 12; w++) {
  let p; try { p = KER(w); } catch (e) { fails.push(`getProgram threw at week ${w}: ${e.message}`); break; }
  const names = (p?.[0]?.blocks || []).flatMap(b => (b.exs || []).map(e => e.name));
  if (names.includes('Flat Barbell Press')) flatWeeks++;
  if (names.includes('Decline Barbell Press')) declineWeeks++;
}
if (flatWeeks !== 12 || declineWeeks !== 0) {
  fails.push(`[F5] at Kerwin's saved settings Day 1 should serve Flat Barbell Press in all 12 weeks and Decline in none; got Flat ${flatWeeks}/12, Decline ${declineWeeks}/12. This is the exact symptom BUG-256 was filed for.`);
}

if (fails.length) {
  console.error(`FAIL — ${fails.length} problem(s):`);
  fails.forEach(f => console.error('  ' + f));
  process.exit(1);
}
console.log(`PASS — ${flagged.length} declared family default(s) (${flagged.join(', ')}), consistent with ${declaring.length} declaring family/families; ` +
            `Flat serves Kerwin's Day 1 compound slot in 12/12 weeks and Decline in 0`);
