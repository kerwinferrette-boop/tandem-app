#!/usr/bin/env node
/**
 * cfg-builder-smoke.mjs — BUG-193 regression guard: one cfg builder, two callers.
 *
 * WHY THIS EXISTS
 * ---------------
 * restoreFromCloud() and syncFromCloud() both reconstruct cfg from the same
 * `users` row. They were two separate object literals and had drifted badly:
 * syncFromCloud built 22 fields, restoreFromCloud built 9. A cloud RESTORE
 * therefore silently dropped twelve fields, including `injuries` — which
 * tandem.html twice labels a SAFETY invariant (:3565, :8254) because it is what
 * makeInjuryBlocked()/pruneInjuries() filter on. Restoring on a new device
 * re-enabled contraindicated exercises for an injured user, and defaulted phase
 * maths to 12 weeks regardless of the real program length.
 *
 * Note the audit that found this (docs/control-reachability-audit-2026-09-30.md
 * §D3) said FOUR fields were dropped. Diffing the two literals properly showed
 * TWELVE. That undercount is the reason this is a gate and not a one-line patch.
 *
 * HARD (fails the gate):
 *   [A] cfgFromUserRow is defined exactly once
 *   [B] neither cloud path re-inlines a cfg literal (no `program_goal`-keyed
 *       object literal outside the builder)
 *   [C] the builder, executed for real against a fixture row, carries every
 *       safety- and program-shaping field — injuries above all
 *   [D] a row with an injury produces cfg.injuries (the specific regression)
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');
const code = html.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};

// [A] one home
const defs = [...code.matchAll(/function\s+cfgFromUserRow\s*\(/g)];
check('[A] cfgFromUserRow defined exactly once', defs.length === 1, `found ${defs.length}`);

// [B] no re-inlined cfg literal in either cloud path
const inlined = [...code.matchAll(/\{[^{}]*canonicalGoal\(\s*\w+\.program_goal\s*\)[^{}]*\}/g)];
check('[B] no cloud path re-inlines a cfg literal', inlined.length === 0,
  `${inlined.length} inline literal(s) keyed on program_goal remain outside the builder`);

// Extract and actually RUN the builder — verify by running, not reading.
const start = code.indexOf('function cfgFromUserRow(');
if (start === -1) { console.error('cfgFromUserRow not found'); process.exit(1); }
const end = code.indexOf('\n}', start);
const src = code.slice(start, end + 2);
const ctx = { canonicalGoal: (g) => (g === 'burn_fat' ? 'fat_burn' : g) };
vm.createContext(ctx);
new vm.Script(src + '\nthis.__fn = cfgFromUserRow;').runInContext(ctx);
const cfgFromUserRow = ctx.__fn;

const row = {
  program_goal: 'burn_fat', program_days_per_week: 5, program_weeks: 8, sex: 'F',
  fitness_level: 'advanced', equipment: 'hotel_small', muscle_emphasis: 'glute_focused',
  workout_duration_minutes: 30, preferred_workout_time: 'morning',
  injuries: 'left knee, achilles', secondary_goal: 'run_5k',
  current_weight_lbs: 150, goal_weight_lbs: 140, height_inches: 66, age: 31,
  program_start_date: '2026-09-01', theme_color: '#FF6B35',
  onboarding_estimates: { bench: 100 }, program_source: 'library', current_week: 3,
};
const got = cfgFromUserRow(row);

// [C] every field a program depends on survives the rebuild
const expect = {
  goal: 'fat_burn', days: 5, weeks: 8, sex: 'F', experience: 'advanced',
  equipment: 'hotel_small', emphasis: 'glute_focused', workout_duration_minutes: 30,
  preferred_workout_time: 'morning', injuries: 'left knee, achilles',
  secondary_goal: 'run_5k', weight: 150, targetWeight: 140, goalWeight: 140,
  heightIn: 66, height: 66, age: 31, startDate: '2026-09-01', themeColor: '#FF6B35',
  programSource: 'library',
};
const wrong = Object.entries(expect).filter(([k, v]) => got[k] !== v)
  .map(([k, v]) => `${k}: expected ${JSON.stringify(v)}, got ${JSON.stringify(got[k])}`);
check(`[C] builder carries all ${Object.keys(expect).length} program-shaping fields`,
  wrong.length === 0, wrong.join('\n      '));
check('[C2] onboardingEstimates survives (EPIC-9 week-1 prefill)',
  got.onboardingEstimates && got.onboardingEstimates.bench === 100);

// [D] the specific safety regression, stated as its own check so a failure names it
check('[D] SAFETY — an injured user\'s cfg.injuries survives the rebuild',
  got.injuries === 'left knee, achilles',
  'this is the BUG-193 regression: a cloud restore that drops injuries re-enables contraindicated lifts');
// and defaults must not silently override a real value
check('[D2] weeks is the real program length, not the 12-week default', got.weeks === 8);

console.log(failures === 0 ? '\ncfg-builder-smoke: PASS' : `\ncfg-builder-smoke: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
