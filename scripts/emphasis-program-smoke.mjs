#!/usr/bin/env node
// emphasis-program-smoke.mjs — a muscle emphasis changes what the program is built around.
//
// Origin: Kerwin 2026-11-17 — "If I pick a lower-body-focused workout ... the majority ...
// should be focused on executing workouts that activate muscles in my legs ... Not that one
// extra lift is a lazy way out." Measured before: Upper Body and Lower Body moved zero sets and
// swapped zero exercises; the other three swapped at most one lift a week.
// SC-59 applies to this file: the metric is the quantity the label promises — hard SETS performed
// on lifts whose PRIMARY mover is in the emphasised area — never "the program object differs".
//
// SWEEP: 5 emphases x 5 goals x 3/4/5/6 days x 2 sexes, intermediate, full gym, 60 min, week 1.
// Each program is compared with the SAME program generated with emphasis 'balanced'.
//   [E1] the emphasised area gets strictly MORE weekly sets than under 'balanced'.
//   [E2] no major muscle (programs.js MAJOR_MUSCLE_GROUP_TOKENS, D6b's own accounting via
//        computeMuscleWeeklyVolume + muscleCeilingKey) falls below the goal's weekly MEV floor
//        that was at or above it under 'balanced'. Emphasis may not be paid for with a floor.
//   [E3] no more lifts above 6 sets (D35) than under 'balanced'.
//   [E4] canary: at least one lift differs from 'balanced' in every program swept.
// REPORTED, NOT ASSERTED: the area's share of weekly sets per emphasis (no source names a
// target share), and 2-day programs, where the emphasis program is deliberately not applied.
// NOT covered: other equipment tiers, beginners, short sessions, weeks other than 1, injuries.
//
// MUTATION RECORD (2026-11-17; each landed, engine restored from a saved copy and byte-compared):
//   emphasis program switched off                     -> E1 x160, E4 x120;
//   lower_body also re-points acc3                    -> E3 x16 (Bench Press stacks);
//   lower_body also re-points the day's primary lift  -> E3 x24;
//   lower_body re-points primary + acc3 + acc4        -> E3 x8.
//   E2 WAS NEVER DRIVEN RED at 3-6 days, said plainly: the engine's volume pass defends a floor
//   by stacking past the cap (D6b outranks D35), so every attempt to starve a muscle surfaced
//   as E3 instead. The same E2 computation did fire on real output during development — at
//   2 days the rewrite left anterior_delt at 5.5 of 10 in four goals — which is why the
//   emphasis program is not applied there.
//
// Run: node scripts/emphasis-program-smoke.mjs
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({ console: { log() {}, warn() {}, error() {} }, document: { querySelectorAll: () => [] }, window: {} });
vm.runInContext(readFileSync(join(root, 'programs.js'), 'utf8') + '\n;globalThis.__x = { gp: getProgram, be: bankEntryByName, cv: computeMuscleWeeklyVolume, bank: EXERCISE_BANK, VL: VOLUME_LANDMARKS, mk: muscleCeilingKey, MAJ: MAJOR_MUSCLE_GROUP_TOKENS };', ctx);
const { gp, be, cv, bank, VL, mk, MAJ } = ctx.__x;

// Which PRIMARY-mover tokens count as "the area" for each emphasis.
const AREA = {
  lower_body:    ['quad', 'hamstring', 'glute', 'gastrocnemius', 'soleus', 'calf', 'adductor', 'abductor'],
  glute_focused: ['glute'],
  upper_body:    ['pec', 'lat_dorsi', 'delt', 'rhomboid', 'bicep', 'tricep', 'trap'],
  back_heavy:    ['lat_dorsi', 'rhomboid', 'trap', 'posterior_delt', 'erector'],
  push_heavy:    ['pec', 'anterior_delt', 'lateral_delt', 'tricep'],
};
const GOALS = ['build_muscle', 'fat_burn', 'transform', 'strength', 'maintenance'];
const lifts = (p) => p.flatMap(d => (d.blocks || []).filter(b => !b.cardio && !/core/i.test(b.label || '')).flatMap(b => b.exs || []));
const inArea = (e, toks) => ((be(e.name) || {}).muscleGroups?.primary || []).some(t => toks.some(k => t.includes(k)));
const areaSets = (p, toks) => lifts(p).filter(e => inArea(e, toks)).reduce((n, e) => n + (e.sets || 0), 0);
const totalSets = (p) => lifts(p).reduce((n, e) => n + (e.sets || 0), 0);
const belowFloor = (p, goal) => { const g = {}; for (const [k, v] of Object.entries(cv(p, bank))) { const key = mk(k); g[key] = (g[key] || 0) + v; } return Object.keys(g).filter(k => MAJ.includes(k) && g[k] < VL[goal].mev); };
const over6 = (p) => p.flatMap(d => (d.blocks || []).filter(b => !b.cardio).flatMap(b => b.exs || [])).filter(e => e.sets > 6).length;
// No session length (null): since 2026-11-17 a chosen length TRIMS the program (getProgram TRIM TO
// FIT), and a balanced and an emphasised build can be trimmed to different depths, so comparing them
// at 60 min would measure the trim, not the emphasis. trim-to-fit-smoke.mjs owns trimming,
// emphasis included. The 30-min axis below still runs at 30 (D28's own short-session path).
const run = (goal, days, sex, em) => gp(goal, days, 12, sex, 'full_gym', em, null, null, null, 'intermediate', null, null, 185, 175) || [];

const fails = []; const shareBy = {}; let programs = 0;
for (const em of Object.keys(AREA)) {
  shareBy[em] = { before: [], after: [], gain: [] };
  for (const goal of GOALS) for (const days of [3, 4, 5, 6]) for (const sex of ['male', 'female']) {
    const base = run(goal, days, sex, 'balanced'), p = run(goal, days, sex, em); programs++;
    const tag = `${em} ${goal}/${days}d/${sex}`;
    const a0 = areaSets(base, AREA[em]), a1 = areaSets(p, AREA[em]);
    if (!(a1 > a0)) fails.push(`[E1] ${tag}: area sets ${a0} -> ${a1} (must increase)`);
    const b0 = belowFloor(base, goal), newBelow = belowFloor(p, goal).filter(k => !b0.includes(k));
    if (newBelow.length) fails.push(`[E2] ${tag}: newly below the weekly floor — ${newBelow.join(', ')}`);
    if (over6(p) > over6(base)) fails.push(`[E3] ${tag}: lifts above 6 sets ${over6(base)} -> ${over6(p)}`);
    const n0 = lifts(base).map(e => e.name).join('|'), n1 = lifts(p).map(e => e.name).join('|');
    if (n0 === n1) fails.push(`[E4] ${tag}: the lift list is identical to 'balanced'`);
    shareBy[em].before.push(a0 / totalSets(base)); shareBy[em].after.push(a1 / totalSets(p)); shareBy[em].gain.push(a1 - a0);
  }
}
// [E5] (2026-11-17, handoff step 4) — the axes the first sweep never measured. Swept before the
// EMPHASIS FLOOR GUARD existed, the rewrite left a major muscle newly below its weekly floor in 38
// beginner and 96 thirty-minute programs, and added lifts above 6 sets on beginner (94), home (52),
// 30-minute (26), lower-back (74) and shoulder-injury (16) programs. D6b and D35 are asserted here
// on every axis; whether the area still GAINS sets is reported, not asserted, because the guard's
// fallback (pool-filter-only emphasis) can legitimately gain nothing.
const AXES = {
  'home tier': { tier: 'home' }, 'hotel tier': { tier: 'hotel_gym' }, beginner: { exp: 'beginner' }, advanced: { exp: 'advanced' },
  '30-min session': { dur: 30 }, 'injury: knee': { inj: 'knee pain' }, 'injury: lower back': { inj: 'lower back injury' },
  'injury: shoulder': { inj: 'shoulder impingement' }, 'injury: elbow': { inj: 'tennis elbow' }, 'injury: wrist': { inj: 'wrist pain' }, 'injury: hip': { inj: 'hip pain' },
};
const axisReport = [];
for (const [axis, a] of Object.entries(AXES)) {
  const runA = (goal, days, sex, em) => gp(goal, days, 12, sex, a.tier || 'full_gym', em, a.inj || null, null, null, a.exp || 'intermediate', null, a.dur || null, 185, 175) || [];
  let n = 0, noGain = 0;
  for (const em of Object.keys(AREA)) for (const goal of GOALS) for (const days of [3, 4, 5, 6]) for (const sex of ['male', 'female']) {
    const base = runA(goal, days, sex, 'balanced'), p = runA(goal, days, sex, em); n++;
    const tag = `${axis} ${em} ${goal}/${days}d/${sex}`;
    const b0 = belowFloor(base, goal), newBelow = belowFloor(p, goal).filter(k => !b0.includes(k));
    if (newBelow.length) fails.push(`[E5] ${tag}: newly below the weekly floor — ${newBelow.join(', ')}`);
    if (over6(p) > over6(base)) fails.push(`[E5] ${tag}: lifts above 6 sets ${over6(base)} -> ${over6(p)}`);
    if (!(areaSets(p, AREA[em]) > areaSets(base, AREA[em]))) noGain++;
  }
  axisReport.push(`${axis}: ${n - noGain}/${n} gain`);
}
if (fails.length) {
  const tally = {}; for (const f of fails) { const k = f.slice(0, 4); tally[k] = (tally[k] || 0) + 1; }
  console.error(`emphasis-program-smoke: ${fails.length} FAILURE(S) — ` + Object.entries(tally).map(([k, n]) => `${k} x${n}`).join(', '));
  for (const f of fails.slice(0, 25)) console.error('  ' + f);
  process.exit(1);
}
const pct = (xs) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 100);
console.log(`emphasis-program-smoke: OK — ${programs} programs (5 emphases x 5 goals x 3-6 days x 2 sexes): the area gains weekly sets, no floor is newly missed, no extra lift above 6 sets`);
for (const [em, s] of Object.entries(shareBy)) { const g = [...s.gain].sort((a, b) => a - b); console.log(`  not asserted — ${em}: ${pct(s.before)}% -> ${pct(s.after)}% of weekly sets (lowest ${Math.round(Math.min(...s.after) * 100)}%); +${g[0]} to +${g[g.length - 1]} sets a week, median +${g[Math.floor(g.length / 2)]}`); }
let noop = 0, two = 0; for (const em of Object.keys(AREA)) for (const goal of GOALS) { two++; if (areaSets(run(goal, 2, 'male', em), AREA[em]) <= areaSets(run(goal, 2, 'male', 'balanced'), AREA[em])) noop++; }
console.log(`  not asserted — 2-day programs: ${noop} of ${two} emphasis x goal cells gain no sets for the area (emphasis program not applied at 2 days)`);
console.log(`  [E5] asserted on every axis: no floor newly missed, no extra lift above 6 sets. Not asserted — programs where the area gains sets: ${axisReport.join(' · ')} (weeks other than 1 still unmeasured)`);
