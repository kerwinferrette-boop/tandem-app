#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// per-exercise-cap-smoke.mjs — REGRESSION GUARD for BUG-231.
//
// THE RULE (the SHOULD), cited — three PRIMARY-tier sources, all of which stop
// their recommended per-exercise range at 6 sets in one session:
//
//   1. Ratamess N.A., Alvar B.A., Evetoch T.K., Housh T.J., Kibler W.B.,
//      Kraemer W.J., Triplett N.T. "Progression Models in Resistance Training
//      for Healthy Adults" (ACSM position stand). Med Sci Sports Exerc.
//      2009;41(3):687-708. doi:10.1249/MSS.0b013e3181915670 — per EXERCISE:
//      1-3 sets untrained, 3-6 sets advanced.
//   2. Krieger J.W. "Single vs. multiple sets of resistance exercise for muscle
//      hypertrophy: a meta-analysis." J Strength Cond Res. 2010;24(4):1150-9.
//      doi:10.1519/JSC.0b013e3181d4d436 (PMID 20300012). 55 effect sizes, 19
//      treatment groups, 8 studies. Bins are PER EXERCISE: ES 0.24 (1 set) ->
//      0.34 (2-3) -> 0.44 (4-6), and "no meaningful differences emerged between
//      2-3 and 4-6 sets". It measures NOTHING above 6. Strength companion:
//      Krieger 2009, J Strength Cond Res 23(6):1890-901,
//      doi:10.1519/JSC.0b013e3181b370be.
//   3. Hackett D.A., Amirthalingam T., Mitchell L., et al. "Effects of a 12-Week
//      Modified German Volume Training Program on Muscle Strength and
//      Hypertrophy — A Pilot Study." Sports. 2018;6(1):7.
//      doi:10.3390/sports6010007 — the only DIRECT test above 6: 10 sets vs 5
//      sets of the SAME exercise for 12 weeks. "10 sets compared to five sets
//      per resistance exercise over 12 weeks is no more effective for increasing
//      muscle strength and hypertrophy"; concludes "4-6 sets per resistance
//      exercise is advised to maximize muscle strength and hypertrophy for
//      trained individuals."
//
// THE DEFECT (the DID, before the fix — measured by running this sweep, not
// inferred): applyGoalVolume()'s D6b MEV raise loop spread correctly WITHIN a
// compound/isolation partition (it always picks the fewest-sets slot) but
// exhausted the whole weekly MEV deficit on compounds before isolation slots
// became eligible. Where a muscle had only ONE compound in the week, that lift
// absorbed the entire deficit: 1040 of 19780 working lifts sat above 6 sets
// across the 1050-combo matrix (5.3%), topping out at 11 x Push-Up,
// 10 x Decline Barbell Press, 10 x Band Lateral Raise.
//
// WHAT THIS GATE ASSERTS, and why it is not a flat cap:
//
// A flat "no lift above 6 sets, ever" assertion would be FALSE, and shipping it
// would mean weakening either it or D6b later. Some cells genuinely cannot reach
// the goal's weekly MEV floor at <=6 sets per lift, because the week contains too
// few slots training that muscle at all (2-day full_gym carries exactly ONE chest
// slot and ONE shoulder slot for the entire week; chest MEV 10 is unreachable at
// 6). The cited cap is a PLATEAU bound — no source shows harm above 6, only no
// measured benefit — while D6b's MEV floor is a measured DEFICIT, so the floor
// wins that conflict. That is the same precedence programs.js already applies to
// SESSION_MUSCLE_CEILING ("past ~11 that is no added benefit, not harm, and
// withholding it would leave lats under MEV").
//
// So the real invariant is the SPREAD rule, which is what the bug actually
// reported: a lift may exceed the cap ONLY when the week offers no alternative.
// Stated as the assertion:
//
//   Every lift above PER_EXERCISE_SET_CEILING must be STRUCTURALLY FORCED —
//   there must exist some muscle token it trains whose weekly MEV is
//   arithmetically unreachable with EVERY top-weight slot in that week held at
//   the ceiling. Zero exceptions, zero allowlist.
//
// The forced-ness test is computed INDEPENDENTLY of the raise loop — from
// EXERCISE_BANK's muscle tags and VOLUME_LANDMARKS' MEV only — so this gate does
// not reimplement (and therefore cannot rubber-stamp) the code under test.
//
// MECHANISM, NOT INSTANCE (CLAUDE.md): BUG-231 named chest/Decline. The axis the
// defect lives on is goal x day-count x sex x tier x injury, so this sweeps the
// whole 1050-combo matrix out of scripts/lib/persona-combos.mjs — the same one
// home validate:personas uses — and additionally pins that the residue is
// shrinking, never growing.
//
// MUTATION-TESTED before being wired into verify (SC-38 — each assertion
// individually, never as a batch; mutations applied to a COPY of programs.js so
// the live tree is never left mutated, SC-40):
//   M1 delete the `capped && s.sets >= PER_EXERCISE_SET_CEILING` line in fits()
//      => A1 fails, 318 spreadable stacks (the bug, reinstated).
//   M2 collapse the raise loop's two-pass sweep to `[false]` (cap never on)
//      => A1 fails, 282 spreadable stacks.
//   M3 collapse it to `[true]` (cap never yields to the floor)
//      => A2 fails, 32 muscle-weeks below D6b's MEV floor.
//   M4 raise PER_EXERCISE_SET_CEILING to 11
//      => A3 fails (the ceiling left the cited range).
//   M6 edit `count` in scripts/fixtures/bug231-forced-stacks.json without touching
//      `cells` (the shape a hand-edit takes)  => A4 fails (fixture integrity).
//   M7 drop 10 cells from that fixture's `cells`  => A5 fails, 10 novel cells
//      (the ratchet refuses to let the forced residue grow back).
//
// AND ONE MUTATION THIS GATE DELIBERATELY DOES NOT CATCH, stated plainly rather
// than implied away:
//   M5 put the cap back ON inside canRestore() => this gate still PASSES.
// That mutation is a real defect — it was found by running the doctrine gate
// during this fix: with the cap in that look-ahead, mevSafe() went false, the D8
// MAV trim pool emptied, and maintenance 2-day quad sat at 27 weekly sets against
// a MAV of 15 (3-day: 21). It is D8 clause 2's job, and `scripts/doctrine.mjs`
// catches it with 4 violations. Division of labour, do not collapse it: this gate
// owns the per-exercise CEILING and the floor that outranks it; D8 owns
// maintenance's MAV CAP. Do not add a MAV assertion here — it would be a second
// home for a rule D8 already owns (CLAUDE.md, "one rule, one home").
// ═══════════════════════════════════════════════════════
import vm from 'vm';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { combos, COMBO_COUNT } from './lib/persona-combos.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const code = readFileSync(join(root, 'programs.js'), 'utf8');
const ctx = vm.runInNewContext(
  `(function() { ${code}; return { getProgram, EXERCISE_BANK, MAJOR_MUSCLE_GROUP_TOKENS,
     VOLUME_LANDMARKS, PER_EXERCISE_SET_CEILING }; })()`, { console });
const { getProgram, EXERCISE_BANK, MAJOR_MUSCLE_GROUP_TOKENS, VOLUME_LANDMARKS,
        PER_EXERCISE_SET_CEILING: CAP } = ctx;

const fail = [];
const must = (cond, msg) => { if (!cond) fail.push(msg); };

// ── A3: the ceiling itself must stay inside the cited range. A gate on a number
// nobody pinned is a gate that can be silently tuned until it passes.
must(CAP === 6, `A3: PER_EXERCISE_SET_CEILING is ${CAP}; the cited range (ACSM 2009 advanced, `
  + `Krieger 2010's top bin, Hackett 2018's explicit advice) tops out at 6. Changing it needs a `
  + `source, not a tweak.`);

// Weekly credit weight of `name` for token `t`, exactly as D6b/applyGoalVolume
// score it: primary 1.0, secondary 0.5, anchored at '_' (D19).
const byName = {};
for (const e of Object.values(EXERCISE_BANK || {})) if (e && e.name) byName[e.name] = e;
const weightOf = (name, t) => {
  const g = byName[name]?.muscleGroups || {};
  const hit = m => m === t || m.startsWith(t + '_');
  return (g.primary || []).filter(hit).length + 0.5 * (g.secondary || []).filter(hit).length;
};

// ── A4/A5 ratchet (council Decision 5, 2026-10-06). The forced residue is a real
// gap, not a pass: the week has too few slots training that muscle to reach MEV at
// <=CAP sets each, so the floor (measured) outranks the plateau (unmeasured) and one
// lift gets stacked. Leaving that merely PRINTED means it can grow silently, which is
// how BUG-231 itself survived — D33 printed a known gap and 1040 stacks accumulated
// inside it. So the exception set is PINNED to a fixture and the gate asserts the live
// set is (A4) no larger and (A5) a subset. That makes the gap a monotonic burn-down:
// muscle_tag_rescope / D6d work can only shrink it, and a NEW forced cell — whether
// from an engine change or a new persona axis — fails loudly and has to be justified.
//
// The key is the PERSONA-level structural gap (goal / day-count / sex / tier — muscle),
// deliberately NOT the lift name or the injury profile. Which lift the allocator picked
// inside a forced cell is an allocator detail that A1 already governs, and the 7 injury
// profiles multiply the same structural gap ~5x with no new information. The key names
// exactly the thing a fix would close: this split at this tier has nowhere else to put
// that muscle's volume.
//
// Regenerate ONLY with `node scripts/per-exercise-cap-smoke.mjs --write-fixture`, and
// only when the set SHRANK or a growth has a written justification. Never hand-edit —
// same convention as scripts/fixtures/db-muscle-tag-vocabulary.json (check #25).
const FIXTURE = join(root, 'scripts', 'fixtures', 'bug231-forced-stacks.json');
const WRITE_FIXTURE = process.argv.includes('--write-fixture');

let liftCount = 0, overCap = 0;
const forced = new Map();       // persona-level forced cells (the ratchet set)
const spreadable = new Map();   // A1 violations
const belowMev = new Map();     // A2 violations
const histogram = {};

for (const c of combos()) {
  const [goal, days, , sex, tier] = c.args;
  const prog = getProgram(...c.args);
  const lifts = [];
  for (const day of prog || []) {
    for (const b of day.blocks || []) {
      if (b.cardio) continue;
      for (const e of b.exs || []) {
        if (!e || e.isCore || e.cardioOnly) continue;
        lifts.push(e);
      }
    }
  }
  const landmark = VOLUME_LANDMARKS[goal];
  const label = c.combo;

  for (const e of lifts) {
    liftCount++;
    histogram[e.sets] = (histogram[e.sets] || 0) + 1;
    if (e.sets <= CAP) continue;
    overCap++;
    // Is this stack structurally forced? Forced iff SOME token this lift trains
    // has a weekly MEV that cannot be met with every top-weight slot in the week
    // pinned at the ceiling.
    let why = null, whyToken = null;
    for (const t of MAJOR_MUSCLE_GROUP_TOKENS) {
      const myW = weightOf(e.name, t);
      if (!myW || !landmark?.mev) continue;
      const tier0 = Math.min(myW, 1);
      const headroom = lifts
        .filter(x => Math.min(weightOf(x.name, t), 1) === tier0)
        .reduce((a, x) => a + CAP * Math.min(weightOf(x.name, t), 1), 0);
      if (headroom < landmark.mev) {
        whyToken = t;
        why = `${t}: mev ${landmark.mev} > ${headroom} reachable at <=${CAP}/lift`;
        break;
      }
    }
    if (why) forced.set(`${goal}/${days}d/${sex}/${tier} — ${whyToken}`, why);
    else spreadable.set(`${label} — ${e.sets}x ${e.name}`, 1);
  }

  // ── A2: the cap must never have been bought by dropping under D6b's floor.
  // The cap yielding to the floor is the whole point of the two-pass raise; this
  // is the assertion that proves pass 2 is still there and still works. (D6b's
  // own gate sweeps full_gym/default only — this sweeps all 3 tiers x 7 injury
  // profiles, so a tier-specific regression shows up here first.)
  if (landmark?.mev && tier === 'full_gym' && c.injury.label === 'none') {
    const weekly = {};
    for (const e of lifts) for (const t of MAJOR_MUSCLE_GROUP_TOKENS) {
      const w = weightOf(e.name, t);
      if (w) weekly[t] = (weekly[t] || 0) + e.sets * w;
    }
    for (const [t, v] of Object.entries(weekly)) {
      if (v < landmark.mev) belowMev.set(`${label} — ${t} ${v}/${landmark.mev}`, 1);
    }
  }
}

must(spreadable.size === 0,
  `A1: ${spreadable.size} lift(s) exceed the ${CAP}-set per-exercise ceiling while the week still `
  + `had a slot that could have taken the set — that is BUG-231, the stack the raise loop is `
  + `supposed to spread:\n` + [...spreadable.keys()].slice(0, 20).map(k => `      ${k}`).join('\n'));

must(belowMev.size === 0,
  `A2: ${belowMev.size} muscle-week(s) fell BELOW the goal's D6b MEV floor — the per-exercise cap `
  + `must yield to the floor (plateau bound vs measured deficit), so pass 2 of the raise loop is `
  + `missing or broken:\n` + [...belowMev.keys()].slice(0, 20).map(k => `      ${k}`).join('\n'));

// ── A4/A5: the ratchet.
const liveForced = [...forced.keys()].sort();
if (WRITE_FIXTURE) {
  writeFileSync(FIXTURE, JSON.stringify({
    _comment: 'Pinned structurally-forced per-exercise stacks (doctrine D35 ratchet, council '
      + 'Decision 5 2026-10-06). Key: goal/day-count/sex/tier — muscle token whose weekly MEV is '
      + 'unreachable at <=PER_EXERCISE_SET_CEILING sets per lift. The gate asserts the live set is '
      + 'no larger than this and a subset of it, so the gap can only shrink. Regenerate ONLY via '
      + '`node scripts/per-exercise-cap-smoke.mjs --write-fixture`; never hand-edit. Growth needs a '
      + 'written justification, not a refresh.',
    ceiling: CAP,
    generated: new Date().toLocaleDateString('en-CA'),   // local date, not UTC — the repo's dates are Kerwin's

    count: liveForced.length,
    cells: liveForced,
  }, null, 2) + '\n');
  console.log(`--write-fixture: pinned ${liveForced.length} forced cell(s) to ${FIXTURE}`);
} else {
  let pinned = null;
  try { pinned = JSON.parse(readFileSync(FIXTURE, 'utf8')); } catch (err) {
    fail.push(`A4/A5: could not read the forced-stack fixture (${err.message}) — the ratchet is the `
      + `only thing keeping the forced residue from growing silently. Regenerate it deliberately with `
      + `--write-fixture; do NOT delete this assertion.`);
  }
  if (pinned) {
    const pinnedSet = new Set(pinned.cells || []);
    // A4 — fixture integrity. Note what this does NOT assert: the council's Decision 5
    // asked for "<= N AND a subset", but a subset can never be larger than its superset,
    // so a separate size bound could never fire independently of A5 and would be a gate
    // on a dead value. A4 instead guards the fixture itself: a hand-edit that drops cells
    // and leaves `count` behind, or a fixture pinned against a different ceiling, makes
    // A5's verdict meaningless. The size bound lives in A5, where it is real.
    must(pinned.count === pinnedSet.size && pinned.ceiling === CAP,
      `A4: the forced-stack fixture is inconsistent — it records count=${pinned.count} / `
      + `ceiling=${pinned.ceiling} but carries ${pinnedSet.size} unique cell(s) against a live `
      + `ceiling of ${CAP}. It was hand-edited or left stale; regenerate it with --write-fixture `
      + `(and justify any growth in writing first).`);
    const novel = liveForced.filter(k => !pinnedSet.has(k));
    must(novel.length === 0,
      `A5: ${novel.length} forced cell(s) are NOT in the pinned set of ${pinnedSet.size} — the `
      + `forced residue is a RATCHET and may only shrink, so a new structural gap appeared. Fix the `
      + `engine (add a related lift for that muscle, per Kerwin's standing ruling), or justify the `
      + `growth in writing and then --write-fixture:\n`
      + novel.slice(0, 20).map(k => `      ${k}  (${forced.get(k)})`).join('\n'));
    const closed = [...pinnedSet].filter(k => !forced.has(k));
    if (closed.length) {
      console.log(`  ratchet: ${closed.length} pinned cell(s) no longer forced — re-run with `
        + `--write-fixture to lock the improvement in:`);
      for (const k of closed.slice(0, 10)) console.log(`      ${k}`);
    }
  }
}

console.log(`Per-exercise set ceiling (BUG-231): ${COMBO_COUNT} combos, ${liftCount} working lifts`);
console.log('  sets histogram: ' + Object.keys(histogram).sort((a, b) => a - b)
  .map(k => `${k}:${histogram[k]}`).join(', '));
console.log(`  ceiling = ${CAP} sets/exercise/session (ACSM 2009 · Krieger 2010 · Hackett 2018)`);
console.log(`  above the ceiling: ${overCap} lift-instance(s) (${(100 * overCap / liftCount).toFixed(1)}%), `
  + `all structurally forced, ${spreadable.size} spreadable — ${forced.size} distinct forced cell(s) `
  + `(goal/days/sex/tier — muscle), ratcheted against scripts/fixtures/bug231-forced-stacks.json`);
console.log(`  forced residue = the gap D33/D6d already record: the week has too few slots training`);
console.log(`  that muscle to reach MEV at <=${CAP} sets each. Kerwin's standing ruling is that the`);
console.log(`  engine should add a RELATED LIFT there (muscle_tag_rescope), not more sets on the one`);
console.log(`  lift present. Until then the MEASURED floor outranks the unmeasured plateau.`);

if (fail.length) {
  console.error('\nPER-EXERCISE CAP: FAIL');
  for (const f of fail) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log('Per-exercise cap: PASS — every over-ceiling lift is structurally forced, and no '
  + 'muscle-week fell below its MEV floor to achieve it.');
