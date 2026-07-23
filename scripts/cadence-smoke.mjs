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
 * HARD (fails the gate) for days 2-5, every goal:
 *   - all N training days are placed (no dropped day)
 *   - never more than the goal's maxConsecutive training days in a row
 *   - a 4-day plan is NOT 4 consecutive days (>=1 rest interspersed) — BUG-30 headline
 *   - every scheduled slot is a real program day (no phantom Day 5/6/7 — BUG-30 root)
 *
 * SOFT (flags, does NOT fail — needs Kerwin's confirmed spread per BUG-30's own
 * "propose a spread and SURFACE it for Kerwin, do not guess silently"):
 *   - 6-day build_muscle/transform currently under-schedule (5/6) because
 *     maxConsecutive=2 can't fit 6 days in 7 slots. Flagged here, filed as a bug.
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
vm.runInContext(`${recov}\n${mgfl}\n${cpd}\n${cwc}\nthis.computeWeekCadence = computeWeekCadence; this.RECOVERY_PARAMS = RECOVERY_PARAMS;`, ctx);
const { getProgram, computeWeekCadence, RECOVERY_PARAMS } = ctx;

const GOALS = ['build_muscle', 'fat_burn', 'transform'];
const failures = [];
const flags = [];
let checked = 0;

for (const goal of GOALS) {
  const cap = (RECOVERY_PARAMS[goal] || RECOVERY_PARAMS.build_muscle).maxConsecutive;
  for (const days of [2, 3, 4, 5, 6]) {
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

    const training = cadence.filter(s => s !== 'rest').length;

    if (days <= 5) {
      // HARD: all N days placed, no drop
      if (training !== days) failures.push(`${goal}/${days}d: scheduled ${training} training days, expected ${days} (a day was dropped)`);
      // HARD: a 4-day plan is not 4 consecutive days — BUG-30 headline
      if (days === 4 && !cadence.includes('rest')) failures.push(`${goal}/4d: no rest day interspersed (BUG-30: 4-day must not be 4 consecutive days)`);
    } else {
      // SOFT: 6-day under-scheduling is a known, flagged gap (needs Kerwin's confirmed spread)
      if (training !== days) flags.push(`${goal}/${days}d schedules ${training}/${days} training days — maxConsecutive=${cap} can't fit ${days} days in 7 slots. Needs a confirmed 6-day spread (do not guess).`);
    }
  }
}

console.log('CADENCE REGRESSION GUARD — BUG-30 weekday spread stays fixed\n');
console.log(`  ${checked} goal×day-count cadences checked (2-5 day: hard; 6 day: flagged)`);
if (flags.length) {
  console.log(`\n  ⚠ FLAGGED (not a gate failure — needs Kerwin's confirmed spread):`);
  for (const f of flags) console.log(`    - ${f}`);
}
if (failures.length) {
  console.log(`\n${failures.length} CADENCE REGRESSION(S) — BUG-30 has drifted back:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log('\nAll BUG-30 cadence guarantees hold (no consecutive-days regression, no phantom days). ✓');
process.exit(0);
