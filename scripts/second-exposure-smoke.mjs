#!/usr/bin/env node
// second-exposure-smoke.mjs — chest and lats are each trained on at least two days a week.
//
// Origin: audit 2026-11-17. Kerwin flagged six sets of Bench Press on a week-1 intermediate
// Build Muscle day. Measured over 5 goals x 5 day-counts x 2 sexes: chest was trained as a
// primary mover ONE day a week at 2, 3, 4 and 5 days in every goal, lats one day a week at 3-5.
// With one chest day the weekly MEV floor (D6b) could only be met by stacking the same lift.
// D35 says a floor is met by spreading across exercises, never by stacking one lift;
// research-report (8).pdf Section 1: higher frequency "distributes this volume across more
// sessions, reducing per-session fatigue" [4]. programs.js now gives each upper day a Balance
// Block (see the SECOND-EXPOSURE note above TEMPLATES).
//
// ASSERTIONS — intermediate and advanced, 60-minute sessions, 3/4/5 days, every goal, both sexes:
//   [X1] full_gym: pec AND lat_dorsi are each a PRIMARY mover on >= 2 distinct days.
//   [X2] full_gym: no CHEST or LAT lift sits AT or above the 6-set ceiling (D35) in those
//        programs — with two exposures the volume pass has no reason to fill one lift to the
//        cap. (First written as "> 6"; mutation-testing showed that version could not go red:
//        even with the cap deleted no chest or lat lift exceeded 6, so it asserted nothing.)
//        MAINTENANCE IS EXCLUDED and reported instead: its MAV trim-and-restore pass cuts
//        isolations to 2 sets and fills the two presses to 6 regardless of exposure count
//        (Bench Press 6 + Overhead Press 6 + Fly 2 on a 3-day week). Different mechanism, still
//        open, printed every run. Scoped to the two muscles this change is about: a lower-body lift can
//        still exceed 6 (maintenance 3-day Barbell Deadlift at 8, hamstrings once a week) —
//        that is a separate, open defect and is counted and printed below, not hidden.
//   [X3] the borrowed lift never sits in the Compound Block (D15 owns that block) and never in
//        the Accessory Block (D28 and the superset pairs own that one).
//   [X4] canary: the sweep found a Balance Block on at least one day of every program.
// REPORTED, NOT ASSERTED (printed every run so the gap stays visible): the same count for the
// other equipment tiers, for 2-day and 6-day weeks, and for beginners and short sessions, which
// deliberately do not gain the slot. Hamstrings at 2-3 days are out of scope here.
//
// MUTATION RECORD (2026-11-17; each landed, fixed file restored from a saved copy and byte-compared):
//   slot never filled (gainsSecondExposure = false) -> X1 x20 and X2 x10 (Bench back at 6);
//   borrowed lift pushed into the Accessory Block  -> X3 x30;
//   cap deleted (PER_EXERCISE_SET_CEILING = 99)    -> nothing: the reason X2 was rewritten.
//   X4 fires on the first mutation too but was not isolated on its own.
//
// Run: node scripts/second-exposure-smoke.mjs
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({ console, document: { querySelectorAll: () => [] }, window: {} });
vm.runInContext(readFileSync(join(root, 'programs.js'), 'utf8') + '\n;globalThis.__gp = getProgram; globalThis.__be = bankEntryByName;', ctx);
const gp = ctx.__gp, be = ctx.__be;

const GOALS = ['build_muscle', 'fat_burn', 'transform', 'strength', 'maintenance'];
const TARGETS = ['pec', 'lat_dorsi'];
const lifts = (p) => p.flatMap((d, di) => (d.blocks || []).filter(b => !b.cardio).flatMap(b => (b.exs || []).map(e => ({ di, block: b.label, e }))));
const daysTrained = (p, token) => new Set(lifts(p).filter(({ e }) => ((be(e.name) || {}).muscleGroups?.primary || []).some(t => t.includes(token))).map(x => x.di)).size;
const run = (goal, days, sex, tier, exp, dur) => gp(goal, days, 12, sex, tier, 'balanced', null, null, null, exp, null, dur, 185, 175) || [];

const fails = [], otherOver = [], maintAtCap = []; let programs = 0, withBalance = 0;
for (const goal of GOALS) for (const days of [3, 4, 5]) for (const sex of ['male', 'female']) for (const exp of ['intermediate', 'advanced']) {
  const p = run(goal, days, sex, 'full_gym', exp, 60); programs++;
  const tag = `${goal}/${days}d/${sex}/${exp}`;
  for (const t of TARGETS) { const n = daysTrained(p, t); if (n < 2) fails.push(`[X1] ${tag}: ${t} is a primary mover on ${n} day(s), need >= 2`); }
  for (const { e, di } of lifts(p)) {
    if (e.sets < 6) continue;
    const prim = (be(e.name) || {}).muscleGroups?.primary || [];
    if (prim.some(t => TARGETS.some(x => t.includes(x)))) {
      if (goal === 'maintenance') maintAtCap.push(`${tag} ${e.name} ${e.sets}`);
      else fails.push(`[X2] ${tag}: day ${di + 1} ${e.name} carries ${e.sets} sets (at or above the 6-set ceiling)`);
    }
    else if (e.sets > 6) otherOver.push(`${tag} ${e.name} ${e.sets}`);
  }
  const borrowed = lifts(p).filter(({ e }) => /-b0$/.test(String(e.id)));
  if (borrowed.length) withBalance++;
  for (const { e, block } of borrowed) if (block !== 'Balance Block') fails.push(`[X3] ${tag}: borrowed lift ${e.name} sits in "${block}", not the Balance Block`);
}
if (withBalance !== programs) fails.push(`[X4] canary: ${withBalance} of ${programs} programs carry a Balance Block — the sweep is not exercising the slot`);

// reported, not asserted
const report = [];
const tally = (label, combos) => { let ok = 0, n = 0; for (const c of combos) { const p = run(...c); for (const t of TARGETS) { n++; if (daysTrained(p, t) >= 2) ok++; } } report.push(`${label}: ${ok}/${n} muscle-weeks at >= 2 days`); };
for (const tier of ['home', 'hotel_gym']) tally(`tier ${tier}, 3-5d`, GOALS.flatMap(g => [3, 4, 5].map(d => [g, d, 'male', tier, 'intermediate', 60])));
tally('2-day', GOALS.map(g => [g, 2, 'male', 'full_gym', 'intermediate', 60]));
tally('6-day', GOALS.map(g => [g, 6, 'male', 'full_gym', 'intermediate', 60]));
tally('beginner, 3-5d (no slot by design)', GOALS.flatMap(g => [3, 4, 5].map(d => [g, d, 'male', 'full_gym', 'beginner', 60])));
tally('30-min session, 3-5d (no slot by design)', GOALS.flatMap(g => [3, 4, 5].map(d => [g, d, 'male', 'full_gym', 'intermediate', 30])));

if (fails.length) {
  console.error(`second-exposure-smoke: ${fails.length} FAILURE(S)`);
  for (const f of fails.slice(0, 30)) console.error('  ' + f);
  process.exit(1);
}
console.log(`second-exposure-smoke: OK — ${programs} programs (5 goals x 3/4/5 days x 2 sexes x intermediate/advanced, full gym): chest and lats each trained >= 2 days, no chest or lat lift at the 6-set ceiling (maintenance excepted, see below), borrowed lift only in the Balance Block`);
for (const r of report) console.log('  not asserted — ' + r);
console.log(`  not asserted — maintenance: ${maintAtCap.length} chest or lat lift(s) still at the 6-set ceiling (MAV trim pass, open)`);
console.log(`  not asserted — ${otherOver.length} non-chest, non-lat lift(s) above 6 sets in the asserted sweep${otherOver.length ? ': ' + [...new Set(otherOver.map(x => x.split(' ').slice(1).join(' ')))].join(', ') : ''}`);
