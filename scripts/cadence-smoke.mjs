#!/usr/bin/env node
/**
 * cadence-smoke.mjs — REGRESSION GUARD for the weekly training-day cadence (BUG-30).
 *
 * WHY THIS EXISTS (Kerwin, 2026-07-23): "put the stops in play... I'm tired of going
 * backwards." BUG-30 ("4-day plan schedules consecutive days instead of mapping to
 * weekdays") was fixed 2026-06-29 with a science-based cadence engine
 * (computeWeekCadence in tandem.html). Nothing tested that it STAYS fixed — a revert
 * or an EXERCISE_BANK/label change could silently bring back the consecutive-days
 * defect or the phantom "Day 5/6/7". This gate makes that impossible: it re-runs the
 * live cadence engine every ship and asserts the BUG-30 guarantees hold.
 *
 * HARD (fails the gate) for ALL day counts 2-6, every goal:
 *   - all N training days are placed (no dropped day) — 6-day fixed 2026-07-23
 *     (Kerwin: "6 on / 1 off"; high-frequency plans relax the consecutive cap)
 *   - never more than the allowed consecutive training days (goal cap; = N for ≥6-day)
 *   - a 4-day plan is NOT 4 consecutive days (>=1 rest interspersed) — BUG-30 headline
 *   - every plan has ≥1 rest slot; every scheduled slot is a real program day
 *     (no phantom Day 5/6/7 — the BUG-30 root defect)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);
const html = readFileSync(join(root, 'tandem.html'), 'utf8');
const programsSrc = readFileSync(join(root, 'programs.js'), 'utf8');

const grab = (name, re) => { const m = html.match(re); if (!m) throw new Error(`could not locate ${name} in tandem.html`); return m[0]; };
const recov = grab('RECOVERY_PARAMS', /const RECOVERY_PARAMS = \{[\s\S]*?\};/);
const mgfl = grab('muscleGroupFromLabel', /function muscleGroupFromLabel\(label\) \{[\s\S]*?\n\}/);
const cpd = grab('canPlaceDay', /function canPlaceDay\([\s\S]*?\n\}/);
const cwc = grab('computeWeekCadence', /function computeWeekCadence\([\s\S]*?\n\}/);

const ctx = {};
vm.createContext(ctx);
vm.runInContext(programsSrc, ctx);
vm.runInContext(`${recov}\n${mgfl}\n${cpd}\n${cwc}\nthis.computeWeekCadence = computeWeekCadence; this.RECOVERY_PARAMS = RECOVERY_PARAMS; this.muscleGroupFromLabel = muscleGroupFromLabel;`, ctx);
const { getProgram, computeWeekCadence, RECOVERY_PARAMS, muscleGroupFromLabel } = ctx;

// All 5 first-class goals (strength + maintenance added 2026-09-24, D8 promotion) — the
// cadence mechanism branches on goal, so the sweep must cover every value of that axis.
const GOALS = ['build_muscle', 'fat_burn', 'transform', 'strength', 'maintenance'];
const failures = [];
let checked = 0;

// BUG-73 regression guard: non-canonical lower-body labels ("Quad Focus", "Glutes +
// Hamstrings") must classify as 'lower', not fall through to the gap-exempt 'full' default —
// otherwise canPlaceDay() lets same-emphasis lower-body days stack with zero recovery gap.
{
  const nonCanonicalLowerLabels = ['Quad Focus', 'Glutes + Hamstrings', 'Hip Thrust Day'];
  for (const label of nonCanonicalLowerLabels) {
    if (muscleGroupFromLabel(label) !== 'lower') {
      failures.push(`muscleGroupFromLabel("${label}") returned "${muscleGroupFromLabel(label)}", expected "lower" (BUG-73 regression)`);
    }
  }
  // Feed a 3-day build_muscle cadence entirely through non-canonical lower-body labels —
  // it must respect the same sameGroupHours/maxConsecutive gap as canonical "Lower"/"Legs" labels.
  const rec = RECOVERY_PARAMS.build_muscle;
  const sameGroupMinGap = Math.ceil(rec.sameGroupHours / 24);
  const program = [
    { key: 'day1', label: 'Quad Focus' },
    { key: 'day2', label: 'Glutes + Hamstrings' },
    { key: 'day3', label: 'Quad Focus' },
  ];
  const cadence = computeWeekCadence(3, 'build_muscle', program);
  let maxRun = 0, run = 0;
  for (const s of cadence) { if (s !== 'rest') { run++; maxRun = Math.max(maxRun, run); } else run = 0; }
  if (maxRun > rec.maxConsecutive) {
    failures.push(`BUG-73: non-canonical lower-body labels scheduled ${maxRun} consecutive days > cap ${rec.maxConsecutive} — recovery gap not enforced`);
  }
  checked++;
}

for (const goal of GOALS) {
  const baseCap = (RECOVERY_PARAMS[goal] || RECOVERY_PARAMS.build_muscle).maxConsecutive;
  for (const days of [2, 3, 4, 5, 6]) {
    // mirror computeWeekCadence's derived feasible cap (BUG-159): circularly, (7−N) rest
    // days allow at most (7−N) training runs, so min achievable max-run = ceil(N/(7−N)).
    // Subsumes the old ≥6-day special case (ceil(6/1) = 6 = "6 on / 1 off", 2026-07-23).
    const cap = days >= 7 ? days : Math.max(baseCap, Math.ceil(days / (7 - days)));
    const program = getProgram(goal, days, 12, 'male', 'full_gym', 'balanced', null, null, { week: 1, phase: 0 });
    if (!program?.length) { failures.push(`${goal}/${days}d: getProgram returned nothing`); continue; }
    const validKeys = new Set(program.map(d => d.key));
    const cadence = computeWeekCadence(days, goal, program);
    checked++;

    // length is always a 7-slot week
    if (cadence.length !== 7) failures.push(`${goal}/${days}d: cadence length ${cadence.length} !== 7`);

    // no phantom day — every scheduled slot is a real program day (BUG-30 root defect)
    for (const slot of cadence) {
      if (slot !== 'rest' && !validKeys.has(slot)) failures.push(`${goal}/${days}d: phantom day "${slot}" not in program (BUG-30 regression)`);
    }

    // max consecutive training days
    let maxRun = 0, run = 0;
    for (const s of cadence) { if (s !== 'rest') { run++; maxRun = Math.max(maxRun, run); } else run = 0; }
    if (maxRun > cap) failures.push(`${goal}/${days}d: ${maxRun} consecutive training days > cap ${cap}`);

    // BUG-159 regression guards (2026-09-24):
    // (a) WRAP-AROUND: getWeekSchedule() repeats this same 7-slot pattern every week
    //     (startDate-anchored, diffDays % 7), so consecutive runs must be measured
    //     CIRCULARLY — a run spanning slot 7 → next week's slot 1 is real training with
    //     no rest between. Cap is the derived feasible cap max(goalCap, ceil(N/(7-N))):
    //     (7-N) rest days can split the circle into at most (7-N) runs, so a 5-day week
    //     mathematically cannot keep every run ≤ 2 (min feasible = 3).
    const feasibleCap = days >= 7 ? days : Math.max(baseCap, Math.ceil(days / (7 - days)));
    let cMax = 0, cRun = 0;
    for (const s of cadence.concat(cadence)) { if (s !== 'rest') { cRun++; cMax = Math.max(cMax, cRun); } else cRun = 0; }
    cMax = Math.min(cMax, 7);
    if (cMax > feasibleCap) failures.push(`${goal}/${days}d: ${cMax} consecutive training days ACROSS THE WEEK SEAM > feasible cap ${feasibleCap} (BUG-159: cadence repeats weekly — the wrap is real)`);
    // (b) A plan with ≥2 rest days (N ≤ 5) closes the week on rest — Kerwin 2026-09-24
    //     (BUG-159): the slot-7 training day is why "Day 7 of 7" looked broken, and it is
    //     what creates the hidden 3-day run across the seam for 5-day build/transform.
    if (days <= 5 && cadence[6] !== 'rest') failures.push(`${goal}/${days}d: slot 7 is "${cadence[6]}", expected rest (BUG-159: ≤5-day weeks must close on rest — no seam run, no "Day 7 of 7")`);

    const training = cadence.filter(s => s !== 'rest').length;

    // HARD (all day counts 2-6): every training day is placed, none dropped.
    // 6-day fixed 2026-07-23 (Kerwin: "6 on / 1 off") — no longer a soft flag.
    if (training !== days) failures.push(`${goal}/${days}d: scheduled ${training} training days, expected ${days} (a day was dropped)`);
    // HARD: a 4-day plan is not 4 consecutive days — BUG-30 headline
    if (days === 4 && !cadence.includes('rest')) failures.push(`${goal}/4d: no rest day interspersed (BUG-30: 4-day must not be 4 consecutive days)`);
    // HARD: every plan has at least one rest slot in the 7-day week
    if (!cadence.includes('rest')) failures.push(`${goal}/${days}d: no rest day in the 7-day week`);
  }
}

console.log('CADENCE REGRESSION GUARD — BUG-30 weekday spread stays fixed\n');
console.log(`  ${checked} goal×day-count cadences checked (2-6 day, all hard — 6-day fixed 2026-07-23)`);
if (failures.length) {
  console.log(`\n${failures.length} CADENCE REGRESSION(S) — BUG-30 has drifted back:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log('\nAll BUG-30 cadence guarantees hold (no consecutive-days regression, no phantom days). ✓');
process.exit(0);
