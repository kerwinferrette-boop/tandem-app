#!/usr/bin/env node
/**
 * doctrine.mjs — the DOCTRINE-CONFORMANCE gate.
 *
 * WHY THIS EXISTS (read before editing):
 * The other gates (validate:programs Rules 1-5, persona-matrix R6-R9, the smoke
 * tests) check STRUCTURAL LEGALITY — does the engine crash, is a program legal.
 * They do NOT check DOCTRINE — does the engine obey Tandem's source-of-truth in
 * Notion. That gap is how the app drifted into re-rolling exercises weekly (no
 * cohesion) while passing every gate: nothing ever asserted the doctrine.
 *
 * This gate closes that gap. It encodes Tandem's binding programming law — the
 * Notion collection mirrored in /DOCTRINE.md — as executable assertions, and it
 * runs inside `npm run verify`, so a change that violates doctrine CANNOT ship.
 *
 * Notion is the source of truth. /DOCTRINE.md is its executable mirror. This file
 * enforces it. Keep all three in sync (tandem-tpm reconciles them).
 *
 * INVARIANTS are ACTIVE (hard-fail, blocks the ship) or PENDING (documented here,
 * enforced the moment the phase that makes them true ships). The full law lives
 * here from day one; each phase flips a PENDING to ACTIVE. Never delete a PENDING
 * to make the gate pass — promote it when its phase lands.
 *
 * TWO-TIER DOCTRINE (D16, EPIC-031 — Notion page 3a7ca37f935b81ce8e88dff8a505fb12):
 * Invariants are tagged SAFETY (bind EVERY program path — generated, authored,
 * library-adopted; no override exists) or SCIENCE_DEFAULT (bind the generated
 * path; an AUTHORED program may deviate ONLY via a science_overrides key that
 * matches a program_principles row BELONGING TO THAT SAME TEMPLATE — claim +
 * rationale + citation; scope ruled 2026-08-15, BUG-77 pt 2). The D1-D15
 * assertions below run against the GENERATED engine exactly as before — nothing
 * is weakened. The D16 section additionally validates authored seed programs
 * (seeds/*.json) against SAFETY rules + override-with-citation.
 * Sovereignty without a cited principle is a D16 failure, not a loophole.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);
const code = readFileSync(join(root, 'programs.js'), 'utf8');
const { getProgram, EXERCISE_BANK, getSingleDay, ONEOFF_FOCUSES, deloadWeeks, realizationWeek, primaryBlockStarts, PHASES: GOAL_PHASES, FOCUS_SLOTS, ONEOFF_CORE_GROUPS, ONEOFF_CARDIO_GROUPS, SUPERSET_CFG, progressionPct, ACCESSORY_PROGRESSION_RATIO, PROGRESSION_PCT_MIN, PROGRESSION_PCT_MAX, LOAD_STEP_LBS, PRESCRIPTION_STEP_LBS, roundToStep, seedWeight, SEED_WEIGHTS, SEED_BASE_LBS, bankEntryByName, materializeTemplate } = vm.runInNewContext(
  `(function(){ ${code}; return { getProgram, EXERCISE_BANK, getSingleDay, ONEOFF_FOCUSES, deloadWeeks, realizationWeek, primaryBlockStarts, PHASES, FOCUS_SLOTS, ONEOFF_CORE_GROUPS, ONEOFF_CARDIO_GROUPS, SUPERSET_CFG, progressionPct, ACCESSORY_PROGRESSION_RATIO, PROGRESSION_PCT_MIN, PROGRESSION_PCT_MAX, LOAD_STEP_LBS, PRESCRIPTION_STEP_LBS, roundToStep, seedWeight, SEED_WEIGHTS, SEED_BASE_LBS, bankEntryByName, materializeTemplate }; })()`, {});

const TIER_ORDER = ['home', 'hotel_gym', 'full_gym'];
const TIER_BY_NAME = {};
for (const e of Object.values(EXERCISE_BANK)) if (e && e.name) TIER_BY_NAME[e.name.trim().toLowerCase()] = e.tier;

const CANONICAL_GOALS = ['build_muscle', 'fat_burn', 'transform']; // 5-Goal Taxonomy: 3 live (+strength, +maintenance pending)

// ── D16 tier map — every invariant's tier (Notion D16 page 3a7ca37f935b81ce8e88dff8a505fb12)
// SAFETY = binds every path (generated, authored, adopted); no override exists.
// SCIENCE_DEFAULT = binds the generated path; authored programs may deviate ONLY
// via a science_overrides key backed by a program_principles row (D16).
// D5 is split: its never-superset-the-primary-block clause is SAFETY; its
// supersets-required-for-Transform/FatBurn clause is SCIENCE_DEFAULT.
// D8 is split for the same reason: its zero-supersets-on-strength-primaries clause
// IS the never-superset-the-primary-block rule, which the Notion D16 page places in
// SAFETY with no override; its Maintenance-caps-at-MAV clause is SCIENCE_DEFAULT.
// (Corrected 2026-07-30 landing D16 on main — the EPIC-031 branch tagged D8
// wholesale SCIENCE_DEFAULT, which would read as licence to superset a strength
// primary via a cited principle. Notion forbids that outright. Enforcement was
// already correct — the seed validator rejects supersets on primary_compound
// unconditionally — so this corrects the label, not the behaviour.)
const TIERS = {
  D1: 'SCIENCE_DEFAULT',  // block-stable selection / rotation cadence
  D2: 'SAFETY',           // canonical goals only, legal non-empty programs
  D3: 'SAFETY',           // compound before isolation — every path, no override
  D4: 'SCIENCE_DEFAULT',  // deload every 4-6wk, block-final, volume cut
  D4b: 'SCIENCE_DEFAULT', // training-age cadence scaling (PENDING)
  D5: 'SPLIT',            // never-on-primary = SAFETY; superset-required = SCIENCE_DEFAULT
  D6: 'SCIENCE_DEFAULT',  // goal volume MEV order
  D6b: 'SCIENCE_DEFAULT', D7: 'SCIENCE_DEFAULT',
  D8: 'SPLIT',            // zero-supersets-on-strength-primaries = SAFETY; Maintenance MAV cap = SCIENCE_DEFAULT
  D9: 'SAFETY',           // one-off structural law (compound-first, tier-legal, dup-free)
  D10: 'SCIENCE_DEFAULT', // rep bands (overridable via cited principle, e.g. rep_floor)
  D11: 'SAFETY',          // earned-only 1RM, monotonic overload — no override ever
  D12: 'SAFETY',          // 1RM formula correctness — engineering, not preference
  D13: 'SCIENCE_DEFAULT', // deload intensity shape
  D14: 'SCIENCE_DEFAULT', // realization week shape
  D15: 'SCIENCE_DEFAULT', // fixed primary compounds
  D16: 'SAFETY',          // the override protocol itself is not overridable
  D17: 'SAFETY',          // PENDING — same class as D11, a live violation was user-facing load prescription
  D18: 'SAFETY',          // no science_overrides escape hatch for an empty candidate pool
  D19: 'SAFETY',          // a slot returns what it asked for — muscle-group matching is anchored
  D20: 'SCIENCE_DEFAULT', // one-off recency de-prioritization, same kind as D1's rotation preference
  D21: 'SCIENCE_DEFAULT', // one-off tiered-set ladder — a load-DISTRIBUTION technique, not a new physiological claim
  // SAFETY. D22 is not a preference about starting loads — it is the same rule D11
  // and D12 encode: a 1RM is arrived at by the one sanctioned formula, and a
  // self-reported number never masquerades as an earned one. Prescribing a raw
  // 8-10RM as a working load is an over-prescription no citation can license.
  D22: 'SAFETY',          // onboarding estimate is a submaximal RM — convert via calcRM, never prescribe raw
  // SAFETY, not SCIENCE_DEFAULT, and the reason is worth stating: D23 is not a claim
  // about the right rest interval — PHASES and SUPERSET_CFG make that claim, and an
  // authored program is free to disagree with them via authoredRest. D23 says only
  // that the number the app SHOWS must be the number the app USES. No citation can
  // license a heading that contradicts the line beneath it, so there is no override.
  D23: 'SAFETY',          // single rest owner; no block heading may claim a rest it does not own
  // SAFETY. Like D23, D24 makes no claim about the RIGHT rate — PHASES.pctComp makes that
  // claim, and its values sit inside ACSM's band. D24 says only that a progression is a
  // percentage of a real load, sourced from one owner, rounded through one home, and
  // displayed as what it actually is. Prescribing a flat pound step is an over- or
  // under-prescription depending only on how heavy the lift is; no citation licenses it.
  D24: 'SAFETY',          // load progression is a % of the current load, never a fixed lb increment
  // SAFETY. D25 makes no claim about how long a plank should be — it says a default
  // has one declared owner, and that an uncited fallback must be PROVED unreachable
  // rather than trusted. No citation can license two disagreeing copies of one number.
  D25: 'SAFETY',          // one owner per generated default; the uncited fallback is provably unreachable
  // SAFETY. D26 makes no claim that 135 lb is the right squat — D11 replaces it with an
  // earned number after one logged set. It says the number the app shows comes from ONE
  // owner, knows the user's sex, and is not addressed to an exercise that does not exist.
  // A sex-blind default is a 73% over-prescription for half the userbase, and a dead
  // lookup key is a silent one: a miss returns undefined and the caller falls through.
  D26: 'SAFETY',          // one sex-aware seed-weight owner; no lookup key may name a non-existent exercise
};

// A SPLIT invariant has no single tier — the caller must name the CLAUSE. These are
// the only two split invariants (see the comment block above for why).
const CLAUSE_TIERS = {
  'D5.never_on_primary':       'SAFETY',           // never superset the primary compound block
  'D5.superset_required':      'SCIENCE_DEFAULT',  // transform/fat_burn must superset
  'D8.no_supersets_on_primaries': 'SAFETY',        // identical rule to D5.never_on_primary
  'D8.maintenance_mav_cap':    'SCIENCE_DEFAULT',  // Maintenance caps at MAV
};

// EPIC-033 F7 / BUG-70. TIERS used to be decorative — nothing read it but the report
// footer, while each authored-program check hardcoded its own SAFETY-vs-overridable
// verdict. It was documentation shaped like code. Everything below now routes its
// verdict through tierOf()/tierGuard(), so a tier edit MUST change gate behaviour;
// that is the acceptance test (flip an entry, the verdict changes).
const tierOf = (clauseId) => {
  if (CLAUSE_TIERS[clauseId]) return CLAUSE_TIERS[clauseId];
  const t = TIERS[clauseId];
  if (!t) throw new Error(`doctrine gate wiring bug: no tier registered for "${clauseId}"`);
  if (t === 'SPLIT') throw new Error(`doctrine gate wiring bug: "${clauseId}" is SPLIT — name the clause (e.g. ${clauseId}.<clause>)`);
  return t;
};

// Override-key registry (D16 page §Override-key registry — Notion-first: a key is
// registered THERE before it appears here). A SCIENCE_DEFAULT clause is overridable
// only if a key speaks for it; a clause with no key has no escape hatch, deliberately.
const OVERRIDE_KEYS = {
  D10: 'rep_floor',                 // live — Brick by Brick's 3-5 rep realization phase
  D14: 'block_final_technique',     // registered, unused by any current seed
};

// The single verdict function for the authored/library path. SAFETY => always fail.
// SCIENCE_DEFAULT => fail unless the deviation is BOTH declared in science_overrides
// under the registered key AND that key carries a program_principles row. The
// principle-row check is the same D16 rule enforced at the DB by
// validate_science_overrides(); this is its file-side twin.
//
// SCOPE IS LOAD-BEARING (ruled 2026-08-15, BUG-77 part 2 — D16 Notion page).
// `principleKeys` is built from THIS seed's own `principles` array (see :731), so
// this guard asks "does THIS template cite its OWN principle?" — never "does a row
// carrying that key exist somewhere?". Do not widen it to a corpus-wide set to make
// a seed pass: a corpus-wide check is satisfied permanently by the first program
// ever admitted, which makes D16 vacuous by construction rather than by accident.
// The DB twin was the loose one (BUG-77) and was tightened to match THIS — not the
// reverse. Note this gate CANNOT see the database (D17), so its agreement with the
// trigger is a convention maintained by hand, not something `npm run verify` proves.
const tierGuard = (clauseId, { fname, overrides, principleKeys, msg }) => {
  const tier = tierOf(clauseId);
  const id = clauseId.split('.')[0];
  if (tier === 'SAFETY') {
    fail('D16', `${fname}: ${msg} — ${clauseId} is SAFETY: binds every path, no override exists`);
    return;
  }
  const key = OVERRIDE_KEYS[id];
  if (!key) {
    fail('D16', `${fname}: ${msg} — ${clauseId} is SCIENCE_DEFAULT but has no override key registered on the D16 page, so no deviation is authorized yet`);
    return;
  }
  if (overrides[key] === undefined) {
    fail('D16', `${fname}: ${msg} — ${clauseId} is SCIENCE_DEFAULT: legal only when declared as science_overrides.${key}`);
    return;
  }
  if (!principleKeys.has(key)) {
    fail('D16', `${fname}: ${msg} — declared science_overrides.${key} has no program_principles row; sovereignty without a cited principle is a D16 failure`);
  }
};
const DAYS = [2, 3, 4, 5, 6];     // includes 6-day PPL×2 (Phase 4, shipped)
const SEXES = ['male', 'female'];
const PHASES = [0, 1, 2, 3];      // the 4 mesocycle blocks scaledPhases spreads across the program
const gen = (goal, days, sex, week, phase) =>
  getProgram(goal, days, 12, sex, 'full_gym', 'balanced', null, null, { week, phase });
const genT = (goal, days, sex, week, T) =>
  getProgram(goal, days, T, sex, 'full_gym', 'balanced', null, null, { week, phase: Math.floor((week - 1) / 3) });
const totalSets = (p) => (p || []).reduce((n, d) => n + (d.blocks || []).reduce(
  (m, b) => m + (b.exs || []).filter(e => !e.cardioOnly).reduce((k, e) => k + (e.sets || 0), 0), 0), 0);
const dayNames = (day) => (day.blocks || []).flatMap(b => (b.exs || []).map(e => e.name));
const progNames = (p) => (p || []).map(dayNames);
const compoundDayNames = (day) => (day.blocks || []).filter(b => /compound/i.test(b.label || ''))
  .flatMap(b => (b.exs || []).map(e => e.name));
const compoundNames = (p) => (p || []).map(compoundDayNames);
const eqDeep = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const failures = [];
const fail = (id, msg) => failures.push(`${id}: ${msg}`);

// ── D1 (ACTIVE) — Exercise selection is stable WITHIN a mesocycle block ────────
// Periodization Spec Part A + Exercise-variation research: selection is a function
// of the BLOCK (phase), never of the week. Same phase + different week => identical
// program. Different phase => selection is allowed to refresh (variety at boundary).
let d1Checked = 0, d1BoundaryVaried = 0;
for (const goal of CANONICAL_GOALS) for (const days of DAYS) for (const sex of SEXES) {
  for (const phase of PHASES) {
    const wkA = phase * 3 + 1, wkB = phase * 3 + 2; // two different weeks, same block
    const a = progNames(gen(goal, days, sex, wkA, phase));
    const b = progNames(gen(goal, days, sex, wkB, phase));
    d1Checked++;
    if (!eqDeep(a, b)) fail('D1', `${goal}/${days}d/${sex} block ${phase}: exercises changed week-to-week WITHIN the block (must be stable)`);
  }
  // sanity: selection must actually be capable of refreshing at a boundary
  const p0 = progNames(gen(goal, days, sex, 1, 0));
  const p1 = progNames(gen(goal, days, sex, 4, 1));
  if (!eqDeep(p0, p1)) d1BoundaryVaried++;
}

// ── D15 (ACTIVE) — Primary compounds held for a whole PRIMARY BLOCK ────────────
// AMENDED 2026-08-05 (EPIC-033 Step 4b, Notion 3b3ca37f935b8100bba6c1ebb2c9ddf8).
// D15 used to assert "fixed for the WHOLE program", checked at exactly one length
// (T=12, phase 0 vs phase 3). That sentence was written when onboarding capped at
// 12wk; its own citation is narrower — Spec Part A records "compounds fixed 8-12wk
// MINIMUM, which for a <=12wk Tandem program IS the whole program." Onboarding now
// accepts 4-24 (F1), so at T>12 the old assertion extrapolated past its source and
// let a 24-week program run one squat variation for 24 straight weeks.
// Kerwin's ruling: "Primaries refresh every 8-12wk."
//
// FLAGGED: 8-12wk is a FLOOR in every located source; no source gives a CEILING (RP
// is performance-triggered: "if you are still hitting PRs ... don't change it"). The
// ceiling is a product ruling. Where the two conflict the CITED FLOOR WINS — which is
// why T=23 legitimately runs a 13-week second block (see check 3).
//
// The partition is derived, not invented: a primary block is a whole number of
// mesocycles (D1 — a refresh may only land at a block boundary) that is never shorter
// than 8 weeks (the cited floor), with a sub-8 tail absorbed. That rule returns ONE
// block for every T <= 15, so every length that shipped before EPIC-033 is unchanged.
const MIN_PRIMARY_BLOCK = 8, MAX_PRIMARY_BLOCK = 12;
const blockLens = (T) => {
  const s = primaryBlockStarts(T);
  return s.map((v, i) => (i + 1 < s.length ? s[i + 1] : T + 1) - v);
};
let d15Checked = 0;
const d15Overshoot = [];
for (let T = 4; T <= 24; T++) {
  const starts = primaryBlockStarts(T);
  const lens = blockLens(T);
  const dl = deloadWeeks(T);
  // 1. every boundary is one week after a deload week — a refresh never lands
  //    mid-mesocycle (D1). starts[0] === 1 is the program's own start, not a refresh.
  d15Checked++;
  if (starts[0] !== 1) fail('D15', `${T}wk: primary blocks start at [${starts}] — the first block must start at week 1`);
  for (const s of starts.slice(1)) {
    if (!dl.has(s - 1)) fail('D15', `${T}wk: a primary block starts at wk${s}, but wk${s - 1} is not a deload week — a primary refresh must land on a mesocycle boundary (D1)`);
  }
  // 2. the cited FLOOR. A program shorter than the floor is trivially one block.
  for (const [i, L] of lens.entries()) {
    d15Checked++;
    if (L < MIN_PRIMARY_BLOCK && lens.length > 1) fail('D15', `${T}wk: primary block ${i + 1} is ${L}wk, below the cited ${MIN_PRIMARY_BLOCK}wk floor (Spec Part A: "compounds fixed 8-12wk minimum")`);
  }
  // 3. the RULED ceiling. Overshoot is legal ONLY where the mesocycle grid leaves no
  //    legal cut (tail absorption). Today that is T=23 alone; the gate pins the list
  //    so a future change that quietly introduces a second overshoot fails here.
  if (lens.some(L => L > MAX_PRIMARY_BLOCK) && lens.length > 1) d15Overshoot.push(`${T}wk[${lens}]`);
}
if (d15Overshoot.join(',') !== '23wk[10,13]') {
  fail('D15', `primary blocks exceed the ${MAX_PRIMARY_BLOCK}wk ceiling at [${d15Overshoot.join(', ') || 'nothing'}]; the only length whose mesocycle grid forces tail absorption is 23wk[10,13] (D15 amendment page §4b)`);
}
// 4/5. behavioural: names are stable inside a block and actually refresh across one.
for (const goal of CANONICAL_GOALS) for (const days of DAYS) for (const sex of SEXES) {
  for (const T of [12, 16, 20, 24]) {   // one pre-EPIC-033 length + the multi-block lengths
    const starts = primaryBlockStarts(T);
    let prevFirst = null;
    for (const [i, s] of starts.entries()) {
      const end = (i + 1 < starts.length ? starts[i + 1] : T + 1) - 1;
      d15Checked++;
      const first = compoundNames(genT(goal, days, sex, s, T));
      const last = compoundNames(genT(goal, days, sex, end, T));
      if (!eqDeep(first, last)) fail('D15', `${goal}/${days}d/${sex} ${T}wk: Compound Block changed between wk${s} and wk${end} — primaries are fixed WITHIN a primary block`);
      if (prevFirst && eqDeep(prevFirst, first)) fail('D15', `${goal}/${days}d/${sex} ${T}wk: Compound Block is identical across the wk${s} primary-block boundary — the 8-12wk refresh never fired`);
      prevFirst = first;
    }
  }
  // 6. regression guard, verbatim: <=15wk is ONE block, wk1 == wkT, exactly as the
  //    pre-amendment invariant asserted. This is the clause that must never weaken.
  for (const T of [4, 8, 11, 12, 15]) {
    d15Checked++;
    if (primaryBlockStarts(T).length !== 1) fail('D15', `${T}wk must be a single primary block (no partition into two >=8wk blocks exists)`);
    if (!eqDeep(compoundNames(genT(goal, days, sex, 1, T)), compoundNames(genT(goal, days, sex, T, T))))
      fail('D15', `${goal}/${days}d/${sex} ${T}wk: Compound Block changed between wk1 and wk${T} — a <=15wk program is one primary block, fixed end-to-end`);
  }
}

// ── D2 (ACTIVE) — Only canonical goals, each generates a legal program ─────────
// 5-Goal Taxonomy is authoritative. Every live goal must produce a non-empty program.
for (const goal of CANONICAL_GOALS) for (const days of DAYS) for (const sex of SEXES) {
  const p = gen(goal, days, sex, 1, 0);
  if (!Array.isArray(p) || p.length === 0) fail('D2', `${goal}/${days}d/${sex}: produced no program`);
  else if (progNames(p).some(d => d.length === 0)) fail('D2', `${goal}/${days}d/${sex}: a day generated with zero exercises`);
}

// ── D3 (ACTIVE) — Compound-first ordering ──────────────────────────────────────
// Research [8] (ACSM progression models): multi-joint before single-joint. In every
// generated training day the Compound Block must precede the Accessory Block.
for (const goal of CANONICAL_GOALS) for (const days of DAYS) for (const sex of SEXES) {
  const p = gen(goal, days, sex, 1, 0) || [];
  p.forEach((day, di) => {
    const labels = (day.blocks || []).map(b => String(b.label || ''));
    const ci = labels.findIndex(l => /compound/i.test(l));
    const ai = labels.findIndex(l => /accessor/i.test(l));
    if (ci !== -1 && ai !== -1 && ci > ai) fail('D3', `${goal}/${days}d/${sex} day ${di + 1}: Accessory block precedes Compound block`);
  });
}

// ── D9 (ACTIVE) — One-off "Build Me a Workout" conformance ─────────────────────
// The one-off generator is the dynamic engine's proper home. A one-off is a single
// session with NO mesocycle progression, so it is EXEMPT BY DESIGN from D1 (block
// stability), D4 (deloads), and D7 (per-length layout) — variety is a feature here,
// not the "random program" defect. But it must still obey the structural law:
// compound-first, tier-legal, no duplicate lift, non-empty. (Notion: Home-Screen
// Program Builders. Wire the Home-Screen entry point in the app as a follow-on.)
let d9Checked = 0;
let d23Checked = 0;
if (typeof getSingleDay === 'function' && Array.isArray(ONEOFF_FOCUSES)) {
  for (const focus of ONEOFF_FOCUSES) for (const tier of TIER_ORDER) {
    const day = getSingleDay(focus, { tier });
    d9Checked++;
    if (!day || !Array.isArray(day.blocks) || day.blocks.length === 0) { fail('D9', `one-off ${focus}/${tier}: empty`); continue; }
    const labels = day.blocks.map(b => String(b.label || ''));
    const ci = labels.findIndex(l => /compound/i.test(l));
    const ai = labels.findIndex(l => /accessor/i.test(l));
    if (ci !== -1 && ai !== -1 && ci > ai) fail('D9', `one-off ${focus}/${tier}: accessory precedes compound`);
    const exs = day.blocks.flatMap(b => (b.exs || []).map(e => e.name));
    if (new Set(exs).size !== exs.length) fail('D9', `one-off ${focus}/${tier}: duplicate lift in one session`);
    const reqIdx = TIER_ORDER.indexOf(tier);
    for (const n of exs) {
      const t = TIER_BY_NAME[String(n).trim().toLowerCase()];
      if (t && TIER_ORDER.indexOf(t) > reqIdx) fail('D9', `one-off ${focus}/${tier}: "${n}" exceeds tier (needs ${t})`);
    }
  }
  // ── D23 (ACTIVE) — one rest owner, and no heading may claim a number it does not own ──
  //
  // This block REPLACES the REST_SECONDS assertion that stood here until 2026-08-23.
  // That assertion was green and meaningless: it verified that generated exercises
  // carried an experience-keyed `rest` value which tandem.html's render layer then
  // discarded (it resolves `ex.authoredRest ?? phase.restComp/restAcc` and reads
  // `ex.rest` nowhere). It was the D17 failure mode in a file the gate CAN see —
  // manufacturing confidence in a dead value. Worse, the table it asserted was itself
  // uncited: research-report (8).pdf §3 keys rest to GOAL, and §6 "Skill Level
  // Progressions" — the one section that could have licensed an experience-keyed
  // window — never mentions rest. So the fix was deletion, not connection.
  //
  // What is asserted now is the ruling: PHASES owns rest; `authoredRest` is the ONLY
  // channel a deviation may travel; a block heading may not print a rest number unless
  // the exercises under it actually carry that number as authoredRest.
  const restGoals = ['build_muscle', 'transform', 'fat_burn'];
  for (const focus of ['chest', 'legs', 'pull']) {
    for (const goal of restGoals) {
      d23Checked++;
      const day = getSingleDay(focus, { tier: 'full_gym', goal, supersets: true, cardio: goal === 'fat_burn' });
      for (const b of (day?.blocks || [])) {
        // (a) A generated exercise must not author a rest window at all. Emitting one
        // recreates the dead-value bug: the render layer ignores it, and the app then
        // holds two disagreeing answers to "how long do I rest?".
        if (!b.superset) {
          for (const e of (b.exs || [])) {
            if (e.rest != null) fail('D23', `one-off ${focus}/${goal}: generated "${e.name}" authored rest ${e.rest}s — PHASES owns rest`);
            if (e.authoredRest != null) fail('D23', `one-off ${focus}/${goal}: generated "${e.name}" set authoredRest ${e.authoredRest}s outside a superset`);
          }
        }
        // (b) The one licensed deviation — supersets — must reach the render layer.
        // 5-Goal Taxonomy: short rest is part of what a Fat Burn superset IS. Setting
        // `rest` alone made that property invisible, which is how a "Rest 30 sec"
        // superset shipped rendering its lines at 45s.
        if (b.superset) {
          const want = SUPERSET_CFG[goal]?.rest;
          if (want == null) fail('D23', `one-off ${focus}/${goal}: superset block on a goal with no SUPERSET_CFG entry`);
          for (const e of (b.exs || [])) {
            if (e.authoredRest !== want) fail('D23', `one-off ${focus}/${goal}: superset "${e.name}" authoredRest ${e.authoredRest}s, SUPERSET_CFG says ${want}s`);
          }
        }
        // (c) A heading that prints a rest number must be telling the truth. Anything
        // else is a lie printed directly above the value it contradicts.
        const claimed = /rest\s+(\d+)\s*sec/i.exec(b.label || '');
        if (claimed) {
          const n = Number(claimed[1]);
          for (const e of (b.exs || [])) {
            if (e.authoredRest !== n) fail('D23', `one-off ${focus}/${goal}: block "${b.label}" claims ${n}s but "${e.name}" renders ${e.authoredRest ?? 'phase rest'}`);
          }
        }
      }
    }
    // (d) Experience must not move rest — the positive statement of the deletion above.
    // Deep-equality also still proves normalizeExperience() has one definition of the
    // default, which the retired block checked separately.
    d23Checked++;
    const tiers = ['beginner', 'intermediate', 'advanced', 'nonsense']
      .map(x => JSON.stringify(getSingleDay(focus, { tier: 'full_gym', experience: x })));
    if (new Set(tiers).size !== 1) fail('D23', `one-off ${focus}: experience changed the generated day — rest is goal-keyed, not experience-keyed`);
  }
  // (e) The WEEKLY path, which is where the untrue headings actually lived longest:
  // "Shoulder Block · Rest 90 sec" printed a fixed number over lines that render from
  // PHASES, so a build_muscle week-9 user read 90 in the heading and 150 in the row.
  // Swept across every goal and split so a heading number cannot creep back in on one
  // path only. Same two rules as (a)/(c): generated exercises author no rest, and a
  // heading may only name a rest that its exercises actually carry.
  if (typeof getProgram === 'function') {
    for (const goal of restGoals) {
      for (const days of [2, 3, 4, 5]) {
        d23Checked++;
        const prog = getProgram(goal, days, 8, 'M', 'full_gym', null, null, null, { seed: 'd23', week: 1, phase: 0 }, 'intermediate') || [];
        for (const day of prog) {
          for (const b of (day?.blocks || [])) {
            const claimed = /rest\s+(\d+)\s*sec/i.exec(b.label || '');
            for (const e of (b.exs || [])) {
              if (!b.superset && !e.authoredRest && e.rest != null) {
                fail('D23', `weekly ${goal}/${days}d "${day.label}": generated "${e.name}" authored rest ${e.rest}s — PHASES owns rest`);
              }
              if (claimed && e.authoredRest !== Number(claimed[1])) {
                fail('D23', `weekly ${goal}/${days}d: block "${b.label}" claims ${claimed[1]}s but "${e.name}" renders ${e.authoredRest ?? 'phase rest'}`);
              }
            }
          }
        }
      }
    }
  }
  // supersets are available on the one-off (opt-in) — and never on its compound block.
  // opts.supersets is a PERMISSION, not an instruction: it says this PATH allows them,
  // while SUPERSET_CFG decides which GOALS take them and at what rest (see D5 below,
  // which now binds this path too). So the fixture has to name a goal. The assertion
  // itself — a superset block appears, and the compound block is never one — is
  // unchanged in strength.
  for (const focus of ['chest', 'legs', 'pull']) {
    const day = getSingleDay(focus, { tier: 'full_gym', goal: 'fat_burn', supersets: true });
    if (!(day?.blocks || []).some(b => b.superset)) fail('D9', `one-off ${focus} with supersets:true produced no superset block`);
    if ((day?.blocks || []).some(b => /compound/i.test(b.label || '') && b.superset)) fail('D9', `one-off ${focus}: compound block was supersetted`);
  }
} else {
  console.log('  (note: getSingleDay not yet exported — D9 skipped)');
}

// ── D24 (ACTIVE) — a progression is a PERCENTAGE of a real load, from one owner ──
//
// This block exists because the previous state of this file could not have caught the
// bug it closes. `PHASES` carried FOUR progression columns per phase; two of them
// (`pctTop`, `pctInc`) were read by nothing and had been dead since the file was
// written, and the two that were live (`incComp`, `incAcc`) were flat pound steps that
// no source prescribes. Nothing asserted either fact, so both shipped indefinitely —
// the same dead-value failure mode D23 found in REST_SECONDS, one table over.
//
// The dead pair was split on EVIDENCE, not on symmetry with D23: `pctTop` was a rep
// threshold whose job `effectiveReps` now owns (D10/D14), so it is deleted; `pctInc`
// was the "% increase signal" ACSM actually prescribes and its 12 authored values all
// sit inside ACSM's 2-10% band, so it is promoted. Assertion (2) below is what makes
// that promotion honest rather than convenient — if a future edit pushes a rate outside
// the cited band, the gate says so instead of the band quietly widening to fit.
let d24Checked = 0;
{
  const tandemHtml = readFileSync(join(root, 'tandem.html'), 'utf8');
  // Strip line comments before token-grepping. Without this, every assertion below
  // that says "this token appears nowhere" is defeated by the comments that EXPLAIN
  // the deletion — the gate would fail on its own documentation, and the natural fix
  // (delete the explanation) is exactly the wrong one.
  const stripComments = s => s.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
  const htmlCode = stripComments(tandemHtml);
  const jsCode = stripComments(code);

  for (const goal of CANONICAL_GOALS) {
    (GOAL_PHASES[goal] || []).forEach((p, i) => {
      const where = `${goal} P${i + 1}`;
      // (1) The dead and the flat columns are GONE from the data, not merely unread.
      // Asserted on the live object rather than by grepping the source, so a column
      // reintroduced by any means fails.
      d24Checked++;
      for (const dead of ['incComp', 'incAcc', 'pctTop', 'pctInc']) {
        if (dead in p) fail('D24', `PHASES.${where} still carries "${dead}" — progression is a percentage (pctComp), and pctTop/pctInc were dead columns`);
      }
      // (2) Every authored rate sits inside ACSM's cited band. This is the assertion
      // that keeps the promotion of pctInc honest: the values were licensed BECAUSE
      // they already fell in 2-10%, so the band has to keep binding them.
      d24Checked++;
      const base = p.pctComp;
      if (!Number.isFinite(base)) fail('D24', `PHASES.${where}.pctComp is not a number — every phase must name its progression rate`);
      else if (base < PROGRESSION_PCT_MIN || base > PROGRESSION_PCT_MAX) {
        fail('D24', `PHASES.${where}.pctComp = ${base}% is outside ACSM's cited ${PROGRESSION_PCT_MIN}-${PROGRESSION_PCT_MAX}% band (PMID 19204579)`);
      }
      // (3) Compound outranks accessory (NSCA: multi-joint "core" lifts progress at
      // roughly double single-joint "assistance" work), the accessory rate is DERIVED
      // from the compound one rather than tabulated separately (the D21 precedent), and
      // the clamp holds. The clamp is load-bearing, not decorative: build_muscle and
      // transform peak at 3%, and half of 3 is 1.5 — below ACSM's floor.
      d24Checked++;
      const pc = progressionPct(p, true), pa = progressionPct(p, false);
      const expected = Math.min(PROGRESSION_PCT_MAX, Math.max(PROGRESSION_PCT_MIN, base * ACCESSORY_PROGRESSION_RATIO));
      if (pa !== expected) fail('D24', `${where}: accessory rate ${pa}% is not the derived clamp(pctComp x ${ACCESSORY_PROGRESSION_RATIO}) = ${expected}% — it must not be a second authored table`);
      if (pa > pc) fail('D24', `${where}: accessory rate ${pa}% exceeds compound ${pc}% — NSCA has multi-joint work progressing FASTER, not slower`);
      if (pc < PROGRESSION_PCT_MIN || pc > PROGRESSION_PCT_MAX || pa < PROGRESSION_PCT_MIN || pa > PROGRESSION_PCT_MAX) {
        fail('D24', `${where}: progressionPct escaped the band (compound ${pc}%, accessory ${pa}%)`);
      }
    });
  }

  // (4) Garbage in still yields a legal rate, never NaN/null. A prescription site that
  // received NaN here would render "add NaN%" or silently skip the progression; the
  // conservative floor is the only safe degenerate answer.
  for (const bad of [null, undefined, {}, { pctComp: 0 }, { pctComp: -5 }, { pctComp: NaN }, { pctComp: 'eight' }]) {
    d24Checked++;
    const v = progressionPct(bad, true);
    if (!Number.isFinite(v) || v < PROGRESSION_PCT_MIN || v > PROGRESSION_PCT_MAX) {
      fail('D24', `progressionPct(${JSON.stringify(bad)}) returned ${v} — a degenerate phase must fall back to the conservative floor, not to NaN`);
    }
  }

  // (5) THE INVARIANT ITSELF, proved by running rather than by reading the constant:
  // the step must be PROPORTIONAL. Extract progressLoad out of tandem.html and inject
  // the real rounding from programs.js (the D21 contract — never a re-typed copy, which
  // would keep passing after the shipped constant changed).
  const plMatch = tandemHtml.match(/function progressLoad\(weight, pct, direction\) \{[\s\S]*?\n\}/);
  const stepFn = code.match(/function roundToStep\(w\) \{[^}]*\}/);
  const stepConst = code.match(/const LOAD_STEP_LBS = ([\d.]+);/);
  if (!plMatch || !stepFn || !stepConst) {
    fail('D24', 'could not extract progressLoad from tandem.html or LOAD_STEP_LBS/roundToStep from programs.js — the progression step must stay a top-level, stably-named helper or this invariant becomes unassertable');
  } else {
    const progressLoad = vm.runInNewContext(
      `(function(){ ${stepConst[0]} ${stepFn[0]} ${plMatch[0]} return progressLoad; })()`);
    // A flat pound step is exactly the thing that produces the SAME delta at two very
    // different loads. Assert the opposite at every live rate.
    for (const goal of CANONICAL_GOALS) {
      for (const p of (GOAL_PHASES[goal] || [])) {
        d24Checked++;
        const pct = progressionPct(p, true);
        const light = progressLoad(100, pct, 'up') - 100;
        const heavy = progressLoad(400, pct, 'up') - 400;
        if (!(heavy > light)) {
          fail('D24', `${goal}: at ${pct}% a 400 lb lift moved ${heavy} lb and a 100 lb lift moved ${light} lb — a progression that does not scale with the load is a fixed increment wearing a percent sign`);
        }
        // Above the LOAD_STEP_LBS floor the delta must actually BE the percentage,
        // to the loadable rounding — not merely bigger.
        d24Checked++;
        const want = roundToStep(400 * pct / 100);
        if (heavy !== want) fail('D24', `${goal}: 400 lb at ${pct}% moved ${heavy} lb, expected roundToStep(${400 * pct / 100}) = ${want}`);
      }
    }
    // The floor: 2% of an empty 45 lb bar is 0.9 lb. Without a floor that rounds to
    // zero and the app tells the user to add nothing, forever. Stated in the D24 row
    // as an equipment constraint rather than hidden.
    d24Checked++;
    if (progressLoad(45, PROGRESSION_PCT_MIN, 'up') !== 45 + LOAD_STEP_LBS) {
      fail('D24', `progressLoad(45, ${PROGRESSION_PCT_MIN}%) must floor at one loadable step (${LOAD_STEP_LBS} lb), not round to zero`);
    }
    // No load, no progression — the D11/D22 rule restated at the step: a percentage of
    // nothing is not a prescription.
    for (const bad of [null, 0, NaN, -20, undefined]) {
      d24Checked++;
      if (progressLoad(bad, 8, 'up') !== null) fail('D24', `progressLoad(${bad}) must return null — a progression needs a load the user actually lifted`);
    }
    // A downward step never crosses zero.
    d24Checked++;
    if (progressLoad(LOAD_STEP_LBS, PROGRESSION_PCT_MAX, 'down') < LOAD_STEP_LBS) {
      fail('D24', 'a downward progression went below one loadable step — a deload is not a negative barbell');
    }
    // (6) No private copy of the rounding rule. Same two-copies-drift guard D19/D21
    // apply: if progressLoad grows its own `2.5`, the shared constant stops being the
    // single home and the two silently diverge.
    d24Checked++;
    if (/[\d.]+\s*\)\s*\*\s*[\d.]+|Math\.round\([^)]*\/\s*[\d.]+\s*\)/.test(stripComments(plMatch[0]))) {
      fail('D24', 'progressLoad contains its own rounding arithmetic — it must call roundToStep(), the single declared home');
    }
  }

  // (7) One declared home for each granularity, and it is NOT tandem.html. Top-level
  // `const` shares one global lexical environment across classic scripts, so a second
  // declaration is a hard SyntaxError that takes the whole app down at load. This is
  // the assertion that stops a future session "fixing" the cross-file reference by
  // redeclaring the constant locally — which reads as tidier and is fatal.
  for (const name of ['PRESCRIPTION_STEP_LBS', 'LOAD_STEP_LBS']) {
    d24Checked++;
    const decls = (jsCode.match(new RegExp(`\\b(?:const|let|var)\\s+${name}\\b`, 'g')) || []).length
      + (htmlCode.match(new RegExp(`\\b(?:const|let|var)\\s+${name}\\b`, 'g')) || []).length;
    if (decls !== 1) fail('D24', `${name} is declared ${decls} time(s) across programs.js + tandem.html — it must be declared exactly once (in programs.js) and USED from tandem.html; a redeclaration is a load-time SyntaxError, not a style issue`);
  }

  // (8) The prescription sites are actually off the dead columns. Grepping the stripped
  // source catches a reference the PHASES structural check in (1) cannot see — e.g. an
  // `ex.incComp` read against an object that no longer has the key, which yields
  // undefined and fails silently rather than loudly.
  for (const dead of ['incComp', 'incAcc', 'pctTop', 'pctInc']) {
    d24Checked++;
    if (new RegExp(`\\b${dead}\\b`).test(htmlCode) || new RegExp(`\\b${dead}\\b`).test(jsCode)) {
      fail('D24', `"${dead}" is still referenced in live code — it is a deleted column; a read of it now yields undefined and fails silently`);
    }
  }

  // (9) No display advertises a pound increment. Same lying-heading class D23 closed:
  // the goal modal printed "Load progression: +5 lbs" while the engine applied a
  // percentage, so the number on screen was not the number in the math.
  d24Checked++;
  for (const line of htmlCode.split('\n')) {
    if (/Load progression/i.test(line) && /\+?\$?\{?[^%]*\blbs?\b/.test(line.replace(/Load progression[^<]*/i, m => m)) && !/%/.test(line)) {
      fail('D24', `a "Load progression" display renders pounds instead of a percentage: ${line.trim()}`);
    }
  }
}

// ── D25 (ACTIVE) — one owner per generated default; the fallback is proved unreachable ──
//
// The point of this block is the SECOND assertion, not the first. Deduplicating the
// inline `e.unit==='sec' ? (e.secs || 45) : 10` into one helper is hygiene; what makes
// keeping an UNCITED 45 defensible at all is proving nothing can ever receive it. If
// (2) ever fails, the fallback stops being a guard and becomes an invented prescription
// — which is why it fails the gate rather than quietly serving 45 seconds to a user.
let d25Checked = 0;
{
  const jsCode = code.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
  const { defaultPrescription, TIMED_HOLD_FALLBACK_SECS, DEFAULT_REPS } = vm.runInNewContext(
    `(function(){ ${code}; return { defaultPrescription, TIMED_HOLD_FALLBACK_SECS, DEFAULT_REPS }; })()`, {});

  // (1) ONE owner. Both engines must call the helper; neither may rebuild the ternary.
  d25Checked++;
  if (typeof defaultPrescription !== 'function') {
    fail('D25', 'defaultPrescription() is missing — a generated exercise\'s default prescription must have exactly one declared owner');
  }
  d25Checked++;
  // Excise the OWNER's own body before counting — it is the one place the ternary is
  // allowed to exist, and a check that fails on its own single source of truth would
  // push the next session to delete the helper rather than the duplicate.
  const withoutOwner = jsCode.replace(/function defaultPrescription\(e\) \{[\s\S]*?\n\}/, '');
  const inlineCopies = (withoutOwner.match(/unit\s*===?\s*'sec'\s*\?\s*\(?\s*\w+\.secs/g) || []).length;
  if (inlineCopies > 0) {
    fail('D25', `${inlineCopies} inline copy(ies) of the timed-hold default remain in programs.js — they must call defaultPrescription()`);
  }
  d25Checked++;
  const callSites = (jsCode.match(/\bdefaultPrescription\(/g) || []).length;
  if (callSites < 2) {
    fail('D25', `defaultPrescription() is called from ${callSites} site(s) — both engines (getSingleDay's mk() and buildDynamicProgram's emitter) must route through it, or the silo is only half closed`);
  }

  // (2) THE LOAD-BEARING ONE: the uncited 45 is unreachable. Every timed bank entry
  // declares its own hold, so the fallback is a guard rather than a prescription.
  // research-report (8).pdf and the Programming Architecture Reference are both silent
  // on isometric durations — that silence is why the number could not be promoted, and
  // why its unreachability has to be ASSERTED rather than assumed.
  for (const e of Object.values(EXERCISE_BANK)) {
    if (!e || e.unit !== 'sec') continue;
    d25Checked++;
    if (!Number.isFinite(e.secs) || e.secs <= 0) {
      fail('D25', `bank entry "${e.name}" is unit:'sec' but declares no secs — it would receive the UNCITED ${TIMED_HOLD_FALLBACK_SECS}s fallback, which no source prescribes. Declare the hold on the entry.`);
    }
    // And the helper must actually return the entry's own number, not the fallback.
    d25Checked++;
    if (defaultPrescription(e) !== e.secs) {
      fail('D25', `defaultPrescription("${e.name}") returned ${defaultPrescription(e)}, not the entry's declared ${e.secs}s`);
    }
  }

  // (3) The helper's own contract: weighted work gets the rep placeholder, and a
  // malformed entry still yields a number rather than undefined/NaN reaching a set row.
  for (const [input, want] of [[{ unit: 'reps' }, DEFAULT_REPS], [{}, DEFAULT_REPS], [null, DEFAULT_REPS],
                               [{ unit: 'sec', secs: 30 }, 30], [{ unit: 'sec' }, TIMED_HOLD_FALLBACK_SECS]]) {
    d25Checked++;
    const got = defaultPrescription(input);
    if (got !== want) fail('D25', `defaultPrescription(${JSON.stringify(input)}) = ${got}, expected ${want}`);
  }
}

// ── D26 (ACTIVE) — one sex-aware seed-weight owner; no dead lookup keys ────────
// This number had four copies. Three disagreed, and two of those were keyed by
// exercise names that do not exist — which is the failure mode the whole block is
// built around: a lookup MISS IS NOT AN ERROR. `DEFAULT_WEIGHTS['male']['Barbell
// Squat']` returned undefined, the caller fell through, and no gate could see it,
// because nothing threw. So the load-bearing assertion here is not "the numbers are
// right" (D11 replaces them with earned numbers after one set) — it is "every key
// resolves, every path is sex-aware, and all three engines agree by construction."
let d26Checked = 0;
let d26SeedCoverageGaps = [];
{
  const tandemHtml = readFileSync(join(root, 'tandem.html'), 'utf8');
  const stripComments = s => s.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
  const htmlCode = stripComments(tandemHtml);
  const jsCode = stripComments(code);

  // (1) ONE owner, and the deleted copies stay deleted.
  d26Checked++;
  if (typeof seedWeight !== 'function' || typeof bankEntryByName !== 'function') {
    fail('D26', 'seedWeight()/bankEntryByName() are missing from programs.js — the starting load must have exactly one declared owner, reachable by exercise entry AND by display name');
  }
  for (const name of ['SEED_WEIGHTS', 'SEED_BASE_LBS']) {
    d26Checked++;
    const decls = (jsCode.match(new RegExp(`\\b(?:const|let|var)\\s+${name}\\b`, 'g')) || []).length
      + (htmlCode.match(new RegExp(`\\b(?:const|let|var)\\s+${name}\\b`, 'g')) || []).length;
    if (decls !== 1) fail('D26', `${name} is declared ${decls} time(s) across programs.js + tandem.html — it must be declared exactly once (in programs.js) and USED from tandem.html`);
  }
  for (const gone of ['DEFAULT_WEIGHTS', 'NSCA_DEFAULTS']) {
    d26Checked++;
    if (new RegExp(`\\b${gone}\\b`).test(htmlCode) || new RegExp(`\\b${gone}\\b`).test(jsCode)) {
      fail('D26', `"${gone}" is back in live code — it was a divergent copy of the seed-weight matrix (${gone === 'DEFAULT_WEIGHTS' ? '5 of its 25 keys named exercises the bank does not have' : 'the same table inlined inside buildDynamicProgram'}); seedWeight() is the owner`);
    }
  }
  // The exact shape of the three deleted tables — a bare equipment ternary carrying a
  // hardcoded pound value. Any of them growing back is the silo reopening.
  d26Checked++;
  const inlineTable = /equipment\s*===?\s*'barbell'\s*\?\s*\d/;
  for (const [where, src] of [['programs.js', jsCode], ['tandem.html', htmlCode]]) {
    if (inlineTable.test(src)) {
      fail('D26', `${where} contains an inline "equipment === 'barbell' ? <lbs>" starting-weight table — that is the shape all three deleted copies had; call seedWeight() instead`);
    }
  }

  // (2) THE LOAD-BEARING ONE: no key may name an exercise that does not exist.
  for (const sexKey of ['female', 'male']) {
    for (const name of Object.keys(SEED_WEIGHTS[sexKey] || {})) {
      d26Checked++;
      if (!bankEntryByName(name)) {
        fail('D26', `SEED_WEIGHTS.${sexKey} names "${name}", which is not the name of any EXERCISE_BANK entry — the lookup silently misses and the default is dead. This is exactly how tandem.html's DEFAULT_WEIGHTS lost 'Barbell Squat' / 'Barbell Bench Press' / 'Overhead Press' / 'Leg Curl'.`);
      }
    }
    d26Checked++;
    if (!SEED_BASE_LBS[sexKey] || !['barbell', 'machine', 'cable', 'dumbbell'].every(eq => Number.isFinite(SEED_BASE_LBS[sexKey][eq]))) {
      fail('D26', `SEED_BASE_LBS.${sexKey} does not cover every loaded equipment type — a gap here silently returns 0, i.e. prescribes an empty bar as a bodyweight movement`);
    }
  }

  // (3) seedWeight's own contract.
  for (const [entry, opts, want, why] of [
    [null, {}, 0, 'a missing entry must yield 0, never NaN/undefined on a set row'],
    [{ equipment: 'bodyweight' }, {}, 0, 'bodyweight carries no load'],
    [{ equipment: 'band' }, {}, 0, 'bands are not lb-loaded'],
    [{ name: 'DB Bench Press', equipment: 'dumbbell' }, { sex: 'M', dbCap: 30 }, 30, "the user's dumbbell cap outranks the matrix (50 lb entry, 30 lb rack)"],
  ]) {
    d26Checked++;
    const got = seedWeight(entry, opts);
    if (got !== want) fail('D26', `seedWeight(${JSON.stringify(entry)}, ${JSON.stringify(opts)}) = ${got}, expected ${want} — ${why}`);
  }
  // Sex must actually change the answer, and must do so in the same direction everywhere.
  d26Checked++;
  const sexBlind = Object.values(EXERCISE_BANK)
    .filter(e => e.equipment === 'barbell' || e.equipment === 'machine')
    .filter(e => seedWeight(e, { sex: 'F' }) === seedWeight(e, { sex: 'M' }));
  if (sexBlind.length) {
    fail('D26', `${sexBlind.length} loaded exercise(s) return the same starting weight for both sexes (e.g. "${sexBlind[0].name}") — a sex-blind default is what prescribed a woman 95 lb where her own program prescribed 55`);
  }
  // An F>M inversion is only meaningful when BOTH sexes resolve through the SAME branch.
  // Where one sex has a matrix entry and the other falls through to the generic floor,
  // the two numbers come from different sources and comparing them proves nothing — so
  // asserting on it would be a check that fires on a data gap while claiming a data
  // *edit*, which is worse than no check. Scoped, and the gap surfaced separately below.
  d26Checked++;
  const inverted = Object.values(EXERCISE_BANK).filter(e => {
    const inF = SEED_WEIGHTS.female[e.name] != null, inM = SEED_WEIGHTS.male[e.name] != null;
    return inF === inM && seedWeight(e, { sex: 'F' }) > seedWeight(e, { sex: 'M' });
  });
  if (inverted.length) {
    fail('D26', `seedWeight starts a woman HEAVIER than a man on ${inverted.length} lift(s) resolved through the same branch (e.g. "${inverted[0].name}") — the matrix has been edited into an inversion`);
  }
  // ⚠️ FLAGGED, NOT FILLED (CLAUDE.md rule 3). EPIC-9's two matrices do not cover the
  // same lifts, so a lift named in one and not the other gets a curated number for one
  // sex and the generic equipment floor for the other. Inherited verbatim and shipped in
  // buildDynamicProgram for months. Not failed and not "fixed": inventing the missing
  // entries is precisely the fabrication this gate exists to prevent. Surfaced so it is
  // visible and rulable rather than silently asymmetric.
  d26SeedCoverageGaps = Object.values(EXERCISE_BANK)
    .filter(e => (SEED_WEIGHTS.female[e.name] != null) !== (SEED_WEIGHTS.male[e.name] != null))
    .map(e => `${e.name} (${SEED_WEIGHTS.female[e.name] != null ? 'female' : 'male'}-only)`);

  // (4) All three engines agree, PROVED BY RUNNING them — not by grepping for a call.
  // A caller that forgets to pass `sex` still compiles and still returns a number; the
  // only way to catch it is to compare what the user actually receives.
  const bothSexes = ['M', 'F'];
  for (const focus of Object.keys(FOCUS_SLOTS)) {
    for (const sex of bothSexes) {
      d26Checked++;
      const day = getSingleDay(focus, { tier: 'full_gym', sex });
      if (!day) continue;
      for (const ex of day.blocks.flatMap(b => b.exs)) {
        if (ex.cardioOnly) continue;
        const entry = bankEntryByName(ex.name);
        const want = entry ? seedWeight(entry, { sex }) : 0;
        if (ex.w !== want) {
          fail('D26', `one-off ${focus}/${sex}: "${ex.name}" starts at ${ex.w} lb but seedWeight says ${want} — the one-off engine is not routed through the owner`);
        }
      }
    }
  }
  for (const sex of bothSexes) {
    d26Checked++;
    const prog = getProgram('build_muscle', 3, 8, sex, 'full_gym', 'balanced', '', null, { seed: 'D26', week: 1, phase: 0 }, 'intermediate');
    for (const ex of (prog || []).flatMap(d => d.blocks.flatMap(b => b.exs))) {
      if (ex.cardioOnly) continue;
      const entry = bankEntryByName(ex.name);
      if (!entry) continue;              // static-fallback lifts author their own weight
      const want = seedWeight(entry, { sex });
      if (ex.w !== want) {
        fail('D26', `weekly ${sex}: "${ex.name}" starts at ${ex.w} lb but seedWeight says ${want} — the weekly engine and the one-off would hand the same user two different starting loads for one lift`);
      }
    }
  }
  // And the same lift, same user, must not differ BETWEEN engines. This is the check
  // that would have caught the shipped bug on its own: 95 from the one-off, 55 weekly.
  d26Checked++;
  const oneOffW = {};
  for (const focus of Object.keys(FOCUS_SLOTS)) {
    const day = getSingleDay(focus, { tier: 'full_gym', sex: 'F' });
    for (const ex of (day ? day.blocks.flatMap(b => b.exs) : [])) if (!ex.cardioOnly) oneOffW[ex.name] = ex.w;
  }
  const weekly = getProgram('build_muscle', 5, 8, 'F', 'full_gym', 'balanced', '', null, { seed: 'D26', week: 1, phase: 0 }, 'intermediate');
  for (const ex of (weekly || []).flatMap(d => d.blocks.flatMap(b => b.exs))) {
    if (ex.cardioOnly || !(ex.name in oneOffW)) continue;
    if (oneOffW[ex.name] !== ex.w) {
      fail('D26', `"${ex.name}" starts at ${oneOffW[ex.name]} lb in the one-off but ${ex.w} lb in the weekly program, for the same user — one number, one owner`);
    }
  }

  // (5) Every call site must pass sex. Grepped, because a caller that omits it produces
  // the MALE default silently — a wrong number, not a crash, for half the userbase.
  for (const [fn, rx] of [['getSingleDay', /getSingleDay\(\s*focus\s*,\s*\{[\s\S]*?\n\s*\}\)/],
                          ['materializeTemplate', /materializeTemplate\(\s*tpl\s*,\s*currentWeek\s*,\s*\{[\s\S]*?\n\s*\}\)/]]) {
    d26Checked++;
    const m = htmlCode.match(rx);
    if (!m) fail('D26', `could not locate tandem.html's ${fn}() call site — this invariant greps it, so a rename must update the gate in the same change`);
    else if (!/\bsex\s*:/.test(m[0])) {
      fail('D26', `tandem.html's ${fn}() call omits "sex:" — the engine then falls through to the male default for every user, silently`);
    }
  }
}

// ── D4 (ACTIVE) — Deloads per the Part B length table ──────────────────────────
// Every mesocycle ends in a deload (every 4-6 wk, block-final): reduced volume,
// load held. Assert, for each length onboarding actually offers (4-24 — tandem.html
// ob-weeks min=4 max=24, validated at the step gate; D11 already iterates this same
// full range, so it is the precedent): the cadence is bounded on BOTH sides —
// consecutive deloads never closer than 4 wk nor further apart than 6; each deload
// week has REDUCED total sets vs a non-deload week and is tagged on every day; a
// non-deload week is never tagged. A deload week that is ALSO the program's final
// week is a REALIZATION week instead (D14) — tagged day.realization, not day.deload
// — so "tagged" here means either flag, but never both and never neither.
//
// EPIC-033 F3 / BUG-66. The guard used to be `maxGap > 7` while its own failure
// string claimed to enforce "> 6-wk" and DOCTRINE.md D4 said 4-6 — four layers,
// four numbers. Resolving it surfaced why the bound was loose: `gap` is the
// MESOCYCLE LENGTH, not the run of consecutive loading weeks (deloadWeeks(12) =
// [4,8,12] → gaps 4,4,4 = three 4-week blocks, each loading 3 wk then deloading 1).
// Read that way, D7 (which pins the spec Part B table verbatim, and that table
// contains 7:[7], a 7-week block) and D4 (cap 6) CONTRADICT each other at exactly
// one length. The loose `> 7` was hiding a real doctrine conflict, not a typo.
// Ruling (D4 amendment page 3b3ca37f935b81e98b06e5f9516dd29c, per DOCTRINE.md:50
// Notion-first): keep the spec table and state the exemption explicitly as a NAMED
// condition — a program of <=7 weeks is a single mesocycle with no internal deload.
// Justified externally, not from memory: RP "Progressing for Hypertrophy" (the
// accumulation phase "lasts as long as it takes to hit systemic MRV" — up to 12 wk
// for beginners, 3-4 wk for very advanced, so 4-6 is a midpoint not a ceiling) and
// Coleman et al. 2024 (PMC10809978: a mid-program deload in a 9-week program showed
// "no appreciable differences" vs continuous training). Outside T<=7 the gate now
// TIGHTENS from >7 to >6, so this amendment is net stricter than what it replaces.
const SINGLE_BLOCK_EXEMPT_MAX_WEEKS = 7;   // D4 named exemption — see above
const DELOAD_CADENCE_MIN_WEEKS = 4;        // D4 lower bound (this is what catches F2)
const DELOAD_CADENCE_MAX_WEEKS = 6;        // D4 upper bound
let d4Checked = 0;
const ONBOARDING_WEEK_RANGE = Array.from({ length: 21 }, (_, i) => i + 4); // 4..24
for (const goal of CANONICAL_GOALS) for (const days of [3, 4, 5]) for (const T of ONBOARDING_WEEK_RANGE) {
  const dw = [...deloadWeeks(T)].sort((a, b) => a - b);
  if (dw.length === 0) { fail('D4', `${goal}/${days}d ${T}wk: no deload scheduled`); continue; }
  // Spacing gaps = mesocycle lengths (week 0 -> 1st deload, then deload -> deload).
  // The TRAILING tail (last deload -> T) is deliberately excluded from the LOWER
  // bound: the 11wk program legitimately ends 1 week after its last deload because
  // wk11 is its peak/test week (spec Part B, D14). It still counts toward the upper
  // bound — a long un-deloaded tail is a real violation.
  let prev = 0; const spacing = [];
  for (const w of dw) { spacing.push(w - prev); prev = w; }
  const tail = T - prev;
  const maxGap = Math.max(...spacing, tail);
  const minGap = Math.min(...spacing);
  if (T <= SINGLE_BLOCK_EXEMPT_MAX_WEEKS) {
    // D4 named exemption: a <=7wk program is ONE mesocycle. Assert it really is one
    // block rather than silently letting any layout through.
    if (dw.length !== 1 || dw[0] !== T) fail('D4', `${goal}/${days}d ${T}wk: <=${SINGLE_BLOCK_EXEMPT_MAX_WEEKS}wk programs are a single block ending in the block-final week, got [${dw}]`);
  } else {
    if (maxGap > DELOAD_CADENCE_MAX_WEEKS) fail('D4', `${goal}/${days}d ${T}wk: ${maxGap}-week mesocycle with no deload (D4 upper bound is ${DELOAD_CADENCE_MAX_WEEKS} wk)`);
    if (minGap < DELOAD_CADENCE_MIN_WEEKS) fail('D4', `${goal}/${days}d ${T}wk: deloads only ${minGap} week(s) apart in [${dw}] (D4 lower bound is ${DELOAD_CADENCE_MIN_WEEKS} wk — back-to-back deloads are not a cadence)`);
  }
  const refWk = [1, 2, 3].find(w => !dw.includes(w)) || 1;
  const refSets = totalSets(genT(goal, days, 'male', refWk, T));
  const refProg = genT(goal, days, 'male', refWk, T);
  if (refProg.some(d => d.deload || d.realization)) fail('D4', `${goal}/${days}d ${T}wk wk${refWk}: non-deload week wrongly tagged deload/realization`);
  for (const w of dw) {
    const p = genT(goal, days, 'male', w, T);
    d4Checked++;
    if (!p.every(d => d.deload === true || d.realization === true)) fail('D4', `${goal}/${days}d ${T}wk wk${w}: neither deload nor realization tagged on all days`);
    if (p.some(d => d.deload === true && d.realization === true)) fail('D4', `${goal}/${days}d ${T}wk wk${w}: a day was tagged BOTH deload and realization`);
    if (totalSets(p) >= refSets) fail('D4', `${goal}/${days}d ${T}wk wk${w}: deload/realization did not reduce volume (${totalSets(p)} vs ${refSets})`);
  }
}

// ── D7 (ACTIVE — promoted 2026-07-30) — Per-length mesocycle layout matches spec Part B ──
// Researched before promoting (source-first, not assumed): the recovered spec (Notion
// "Periodization & Structured Program Engine Spec — Parts A-C, residue transcription")
// Part B IS, verbatim, programs.js's DELOAD_TABLE — Parts D-H are explicitly flagged
// unrecoverable in that page, with no further scope claimed. D4 above already asserts
// deloadWeeks(T)'s STRUCTURAL properties (max gap, correct tagging, reduced volume) but
// never pinned the literal per-length values — a table typo (e.g. 8wk -> [3,7] instead of
// the spec's [4,8]) could still ship with D4 fully green. This is the one concrete gap D4
// didn't already close, so it's what D7 promotion actually adds — not new scope, a literal
// verbatim-match check. Per CLAUDE.md: the phase that makes a PENDING invariant true
// promotes it to ACTIVE in the same change; this table has been true in code since D4/D14
// shipped, it was just never independently pinned.
const SPEC_PART_B_DELOAD_TABLE = { 4: [4], 5: [5], 6: [6], 7: [7], 8: [4, 8], 9: [5, 9], 10: [5, 10], 11: [5, 10], 12: [4, 8, 12] };
let d7Checked = 0;
for (const T of Object.keys(SPEC_PART_B_DELOAD_TABLE).map(Number)) {
  d7Checked++;
  const actual = [...deloadWeeks(T)].sort((a, b) => a - b);
  const expected = SPEC_PART_B_DELOAD_TABLE[T];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail('D7', `${T}wk: deloadWeeks() returned [${actual}] but spec Part B requires [${expected}] verbatim`);
  }
}

// ── D5 (ACTIVE) — Superset/circuit-driven goals (5-Goal Taxonomy) ───────────────
// Transform = antagonist supersets; Fat Burn = high-rep circuits (short-rest
// supersets). Both must contain superset blocks whose paired exercises carry a
// supersetGroup. (Supersets never touch the primary compound block — the never-on-
// primary rule; Strength's stricter version is future D8.)
let d5Checked = 0;
for (const goal of ['transform', 'fat_burn']) for (const days of [2, 3, 4, 5, 6]) for (const sex of ['male', 'female']) {
  const p = gen(goal, days, sex, 1, 0);
  d5Checked++;
  const ss = (p || []).flatMap(d => (d.blocks || []).filter(b => b.superset || /superset/i.test(b.label || '')));
  if (ss.length === 0) fail('D5', `${goal}/${days}d/${sex}: no supersets (goal is superset/circuit-driven by the 5-Goal Taxonomy)`);
  else if (!ss.some(b => (b.exs || []).some(e => e.supersetGroup))) fail('D5', `${goal}/${days}d/${sex}: superset block has no supersetGroup-tagged exercise`);
  // never-on-primary: the Compound Block must never be a superset
  if ((p || []).some(d => (d.blocks || []).some(b => /compound/i.test(b.label || '') && b.superset))) fail('D5', `${goal}/${days}d/${sex}: a Compound Block was supersetted (primary lifts must never superset)`);
}

// D5 binds the ONE-OFF path too. D9's exemption is enumerated and finite — D1/D4/D7,
// the periodization invariants — and D5 is deliberately not in it: a one-off is exempt
// from the PROGRAM's structure, not from its GOAL's shape. This was a live violation
// until 2026-08-23: getSingleDay hardcoded `pairIntoSupersets(acc, 45)`, so the one-off
// supersetted every goal that asked, at a rest value that appears in no table, while the
// weekly path read SUPERSET_CFG. One rule, two answers, depending on which function
// built the day. These assertions pin the two paths to the SAME table rather than to
// each other's current output, so the table stays the only place the rule is written.
if (typeof getSingleDay === 'function' && SUPERSET_CFG) {
  for (const focus of ['chest', 'legs', 'pull']) {
    for (const goal of Object.keys(SUPERSET_CFG)) {
      d5Checked++;
      const day = getSingleDay(focus, { tier: 'full_gym', goal, supersets: true });
      const ss = (day?.blocks || []).filter(b => b.superset);
      if (!ss.length) { fail('D5', `one-off ${focus}/${goal}: no supersets (goal is superset-driven)`); continue; }
      // Rest must be SUPERSET_CFG's value, not a literal that merely happens to match.
      const want = SUPERSET_CFG[goal].rest;
      for (const b of ss) {
        if (!new RegExp(`Rest ${want} sec`).test(b.label || '')) fail('D5', `one-off ${focus}/${goal}: superset label "${b.label}" does not carry SUPERSET_CFG rest ${want}s`);
        if ((b.exs || []).some(e => e.rest !== want)) fail('D5', `one-off ${focus}/${goal}: a supersetted exercise carries rest ${(b.exs || []).map(e => e.rest)}, not SUPERSET_CFG's ${want}`);
      }
      if ((day?.blocks || []).some(b => /compound/i.test(b.label || '') && b.superset)) fail('D5', `one-off ${focus}/${goal}: a Compound Block was supersetted`);
    }
    // The converse, and the half that actually caught the old bug: a goal with NO
    // SUPERSET_CFG entry gets no supersets on this path either, rather than getting
    // them at some third arbitrary rest. Asking is not the same as being eligible.
    for (const goal of CANONICAL_GOALS.filter(g => !SUPERSET_CFG[g])) {
      d5Checked++;
      const day = getSingleDay(focus, { tier: 'full_gym', goal, supersets: true });
      if ((day?.blocks || []).some(b => b.superset)) fail('D5', `one-off ${focus}/${goal}: supersetted despite having no SUPERSET_CFG entry (the weekly path gives it none)`);
    }
  }
  // And the source-level half: getSingleDay must READ the table, not re-type its values.
  // Comments are stripped first. A prose mention of SUPERSET_CFG in the very comment
  // explaining the fix would otherwise satisfy this check while the code below it went
  // back to a literal — verified by RUNNING that exact regression, which the behavioural
  // assertions above caught but this one did not until the strip was added.
  d5Checked++;
  const gsd = code.match(/function getSingleDay\(focus, opts = \{\}\) \{[\s\S]*?\n\}/);
  if (!gsd) fail('D5', 'could not locate getSingleDay in programs.js to check its superset rest source');
  else {
    const body = gsd[0].replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
    if (!/SUPERSET_CFG\s*\[/.test(body)) fail('D5', 'getSingleDay does not index SUPERSET_CFG in executable code — its superset rest is hardcoded again');
  }
}

// ── D10 (ACTIVE) — Rep schemes honor each goal's taxonomy band ─────────────────
// Science audit 2026-07-22. Fat Burn = high-rep circuits (>=10 reps); Build Muscle =
// hypertrophy 6-15 (NEVER 1-5 max-strength — that is the separate Strength goal, and
// reps 5-30 give equivalent hypertrophy volume-equated to failure); Transform = mixed
// 8-12. This is what the "Peak Strength inside a hypertrophy goal" / "6-rep Fat Burn"
// drift got wrong; the gate now blocks it.
const REP_BANDS = { fat_burn: [10, 20], build_muscle: [6, 15], transform: [8, 12] };
let d10Checked = 0;
for (const [goal, [lo, hi]] of Object.entries(REP_BANDS)) {
  for (const phase of (GOAL_PHASES[goal] || [])) {
    for (const r of String(phase.reps).split('·').map(Number)) {
      d10Checked++;
      if (!(r >= lo && r <= hi)) fail('D10', `${goal} phase "${phase.name}": ${r} reps outside its taxonomy band ${lo}-${hi}`);
    }
  }
}

// ── D6 (ACTIVE, v1) — Weekly volume scales by goal (v0.5 MEV/MRV order) ─────────
// Was: identical volume for every goal (science-audit Finding 3). Sets-per-exercise
// now scale by goal so weekly working volume follows the MEV/MRV ordering: Transform
// (concurrent) ≥ Build Muscle (hypertrophy) ≥ Fat Burn (fat loss). v1 = goal
// differentiation; per-muscle MEV balancing + the within-block MEV→MRV week ramp
// remain flagged (Finding 3 remainder + Finding 4), tied to the per-length meso work.
let d6Checked = 0;
const weeklyVol = (g, days, sex) => (gen(g, days, sex, 1, 0) || []).reduce((n, d) =>
  n + (d.blocks || []).reduce((m, b) => m + (b.exs || []).filter(e => !e.cardioOnly && !e.isCore)
    .reduce((k, e) => k + (e.sets || 0), 0), 0), 0);
for (const days of [3, 4, 5, 6]) for (const sex of ['male', 'female']) {
  const t = weeklyVol('transform', days, sex), b = weeklyVol('build_muscle', days, sex), f = weeklyVol('fat_burn', days, sex);
  d6Checked++;
  if (!(t >= b && b >= f)) fail('D6', `${days}d/${sex}: goal volume not in MEV order (transform ${t} ≥ build_muscle ${b} ≥ fat_burn ${f})`);
  if (f <= 0) fail('D6', `${days}d/${sex}: fat_burn produced zero working volume`);
}

// ── D11 (ACTIVE — strengthened 2026-07-30) — Monotonic progressive overload + earned-only 1RM ──
// "Reps down, weight up." The prescribed %1RM curve must rise-or-hold every week and NEVER
// dip outside a sanctioned D13 deload/D14 realization week — deloads are volume cuts (D4),
// not intensity dips (except Build Muscle's D13-cited 60-70% exception, which itself must
// hit its exact documented value, not just "not decreasing"). The 1RM driving the
// prescription is a MEASUREMENT of real performance, never a scheduled ratchet.
// (Source: research-report(8) §3 %1RM bands + progressive-overload principle; the sawtooth
// table + fabricated 1RM ratchet were the "app says stronger while prescribing less" defect.)
//
// PRIOR VERSION of this check only validated that the static 7-key PROGRESSION table
// (weeks 2-8) was internally monotonic — it never called the actual weekFactor() function
// tandem.html uses at render time, so it never proved the INTERPOLATION math (which
// stretches that 7-point table across the real 4-24wk onboarding range), the D13
// deload-override precedence, or the D14 realization-override precedence were correct for
// any real program length. Kerwin asked (2026-07-30) whether the generator might be wrong
// given how often bugs surface; independently re-deriving and running weekFactor() itself
// (not trusting the old table-only check) across every goal x every length 4-24 found ZERO
// monotonicity/range/deload-intensity/realization-intensity violations — but the fact the
// OLD check couldn't have caught a real interpolation bug if one existed is itself the
// finding. This replaces it with the real function, exercised across the real range.
let d11Checked = 0;
try {
  const tandemHtml = readFileSync(join(root, 'tandem.html'), 'utf8');
  const progressionMatch = tandemHtml.match(/const PROGRESSION = (\{[\s\S]*?\n\});/);
  const overrideMatch = tandemHtml.match(/const DELOAD_INTENSITY_OVERRIDE = (\{[\s\S]*?\});/);
  const realizationMatch = tandemHtml.match(/const REALIZATION_INTENSITY = ([\d.]+);/);
  const weekFactorMatch = tandemHtml.match(/function weekFactor\(goal, week, totalWeeks\) \{[\s\S]*?\n\}\n/);
  if (!progressionMatch || !overrideMatch || !realizationMatch || !weekFactorMatch) {
    fail('D11', 'could not locate PROGRESSION / DELOAD_INTENSITY_OVERRIDE / REALIZATION_INTENSITY / weekFactor() in tandem.html');
  } else {
    const wf = vm.runInNewContext(`
      (function() {
        ${code}
        const PROGRESSION = ${progressionMatch[1]};
        const DELOAD_INTENSITY_OVERRIDE = ${overrideMatch[1]};
        const REALIZATION_INTENSITY = ${realizationMatch[1]};
        ${weekFactorMatch[0]}
        return { weekFactor, deloadWeeks, realizationWeek, DELOAD_INTENSITY_OVERRIDE, REALIZATION_INTENSITY };
      })()
    `, {});
    for (const goal of CANONICAL_GOALS) for (let T = 4; T <= 24; T++) {
      const dw = wf.deloadWeeks(T), rw = wf.realizationWeek(T);
      const curve = [];
      for (let wkNum = 1; wkNum <= T; wkNum++) {
        curve.push({ wkNum, f: wf.weekFactor(goal, wkNum, T), isDeload: dw.has(wkNum) && wkNum !== rw, isRealization: wkNum === rw });
      }
      for (const p of curve) {
        d11Checked++;
        if (!Number.isFinite(p.f) || p.f <= 0 || p.f > 1.2) fail('D11', `${goal}/${T}wk wk${p.wkNum}: weekFactor returned ${p.f} — not a sane %1RM fraction`);
      }
      let lastNormal = null;
      for (const p of curve) {
        if (p.isDeload || p.isRealization) continue;
        if (lastNormal && p.f < lastNormal.f - 1e-9) fail('D11', `${goal}/${T}wk: wk${p.wkNum} (${p.f.toFixed(4)}) dips below wk${lastNormal.wkNum} (${lastNormal.f.toFixed(4)}) with no sanctioned deload/realization between them`);
        lastNormal = p;
      }
      for (let i = 1; i < curve.length; i++) {
        const prev = curve[i - 1], cur = curve[i];
        if (prev.isDeload && !cur.isDeload && !cur.isRealization) {
          let j = i - 1; while (j >= 0 && curve[j].isDeload) j--;
          if (j >= 0 && cur.f < curve[j].f - 1e-9) fail('D11', `${goal}/${T}wk: wk${cur.wkNum} (${cur.f.toFixed(4)}) after the deload at wk${prev.wkNum} does not exceed the pre-deload wk${curve[j].wkNum} (${curve[j].f.toFixed(4)}) — overload did not survive the deload`);
        }
      }
      for (const p of curve) {
        if (p.isDeload && goal === 'build_muscle' && Math.abs(p.f - wf.DELOAD_INTENSITY_OVERRIDE.build_muscle) > 1e-9) {
          fail('D11', `${goal}/${T}wk wk${p.wkNum}: deload week returned ${p.f.toFixed(4)}, not the documented D13 override ${wf.DELOAD_INTENSITY_OVERRIDE.build_muscle}`);
        }
        if (p.isRealization && Math.abs(p.f - wf.REALIZATION_INTENSITY) > 1e-9) {
          fail('D11', `${goal}/${T}wk wk${p.wkNum}: realization week returned ${p.f.toFixed(4)}, not ${wf.REALIZATION_INTENSITY}`);
        }
      }
    }
  }
  // Regression tripwire: the fabricated ±2.5%/week ratchet on the working 1RM must stay
  // gone. The old code multiplied the working 1RM base by (dir === 'up' ? 1.025 : 0.975).
  if (/\?\s*1\.025\s*:\s*0\.975/.test(tandemHtml)) {
    fail('D11', 'the scheduled ±2.5%/week 1RM ratchet is back — the working 1RM must be earned (running-max Epley), never a fixed weekly step');
  }
} catch (e) {
  fail('D11', `could not verify monotonic overload: ${e.message}`);
}

// ── D12 (ACTIVE) — Multi-formula 1RM estimation, monotonic in reps ─────────────
// A single linear formula (Epley) is accurate only to ~12 reps; the estimate must
// switch to Mayhew above that, AND the estimate must never decrease for more reps
// at the same weight (a real bug found by running the numbers: raw Mayhew(w,13) <
// Epley(w,12) — doing an extra rep would show a LOWER max, the same "app says
// weaker after more work" defect D11 exists to kill). Source: research-report(9)
// (Valyu Deep Research, 2026-07-23) — the direct answer to the gap D11 flagged
// ("research is silent on high-rep accuracy"). Desgorces (cited as marginally
// better for 16-20 reps) is NOT implemented — the source names it but never gives
// its equation, and per source-first rule we do not invent a logarithmic formula
// to fill that gap. Flagged for a future Ralph pass.
let d12Checked = 0;
try {
  const tandemHtml = readFileSync(join(root, 'tandem.html'), 'utf8');
  const m = tandemHtml.match(/function calcRM\(w, r\) \{[\s\S]*?\n\}/);
  if (!m) fail('D12', 'could not locate calcRM in tandem.html');
  else {
    const calcRM = vm.runInNewContext(`(function(w, r) { ${m[0].replace(/^function calcRM\(w, r\) \{/, '').replace(/\}$/, '')} })`, {});
    // formula selection: Epley at 10 reps, Mayhew above 12
    d12Checked++;
    const epley10 = 100 * (1 + 10 / 30);
    if (Math.abs(calcRM(100, 10) - epley10) > 0.01) fail('D12', `calcRM(100,10) = ${calcRM(100, 10)}, expected Epley ${epley10.toFixed(2)}`);
    d12Checked++;
    const mayhew16 = 100 * 100 / (52.2 + 41.9 * Math.exp(-0.055 * 16));
    if (Math.abs(calcRM(100, 16) - mayhew16) > 0.01) fail('D12', `calcRM(100,16) = ${calcRM(100, 16)}, expected Mayhew ${mayhew16.toFixed(2)}`);
    // monotonicity: more reps at a fixed weight must never estimate a lower 1RM
    for (const w of [95, 135, 185, 225, 315]) {
      let prev = 0;
      for (let r = 1; r <= 25; r++) {
        d12Checked++;
        const v = calcRM(w, r);
        if (v < prev - 1e-9) fail('D12', `calcRM(${w}, ${r}) = ${v.toFixed(2)} is LESS than calcRM(${w}, ${r - 1}) = ${prev.toFixed(2)} — more reps at the same weight must never estimate a lower 1RM`);
        prev = v;
      }
    }
  }
} catch (e) {
  fail('D12', `could not verify multi-formula 1RM: ${e.message}`);
}

// ── D13 (ACTIVE) — Goal-specific deload intensity ──────────────────────────────
// research-report(9) (Valyu, 2026-07-23): Strength & Fat-Loss deloads MAINTAIN
// intensity (volume-cut only); Hypertrophy deloads ALSO drop %1RM to 60-70% so
// reps can climb at a lighter load. Kerwin's explicit call (2026-07-23): fine with
// a lower prescribed weight on deload IF the measured 1RM still only trends up —
// already guaranteed elsewhere (D11's reconcileWorking1RMs never lowers the stored
// 1RM). This gate verifies TWO things on every REAL deload week (deloadWeeks(),
// the same list applyDeload/D4 uses): a goal WITH an override actually hits that
// exact intensity; a goal WITHOUT one never dips (maintains D11's monotonic climb
// straight through the deload week) — so the hypertrophy-specific exception can
// never silently leak into Transform or Fat-Loss.
let d13Checked = 0;
try {
  const tandemHtml = readFileSync(join(root, 'tandem.html'), 'utf8');
  const progMatch = tandemHtml.match(/const PROGRESSION = (\{[\s\S]*?\n\});/);
  const overrideMatch = tandemHtml.match(/const DELOAD_INTENSITY_OVERRIDE = (\{[^}]*\});/);
  const wfMatch = tandemHtml.match(/function weekFactor\(goal, week, totalWeeks\) \{[\s\S]*?\n\}/);
  if (!progMatch || !overrideMatch || !wfMatch) {
    fail('D13', 'could not locate PROGRESSION / DELOAD_INTENSITY_OVERRIDE / weekFactor in tandem.html');
  } else {
    // IIFE-return pattern (matches D11/D12 above): const/function bindings declared
    // via vm.runInContext do NOT attach as properties of the sandbox object, so pull
    // them out via an explicit return instead of reading wfCtx.<name> directly.
    const bundle = `(function(){
      const PROGRESSION = ${progMatch[1]};
      const DELOAD_INTENSITY_OVERRIDE = ${overrideMatch[1]};
      ${wfMatch[0]}
      return { weekFactor, PROGRESSION, DELOAD_INTENSITY_OVERRIDE };
    })()`;
    const { weekFactor, PROGRESSION, DELOAD_INTENSITY_OVERRIDE } = vm.runInNewContext(bundle, { deloadWeeks, realizationWeek });
    for (const goal of Object.keys(PROGRESSION)) {
      for (const T of [4, 5, 6, 7, 8, 9, 10, 11, 12]) {
        for (const w of deloadWeeks(T)) {
          if (w === realizationWeek(T)) continue; // D14 owns the realization week, not D13
          d13Checked++;
          const prevW = w - 1;
          if (prevW < 2) continue;
          const before = weekFactor(goal, prevW, T);
          const at = weekFactor(goal, w, T);
          const overrideVal = DELOAD_INTENSITY_OVERRIDE[goal];
          if (overrideVal != null) {
            if (Math.abs(at - overrideVal) > 1e-9) fail('D13', `${goal} ${T}wk wk${w}: deload override not applied (got ${at}, expected ${overrideVal})`);
          } else if (at < before - 1e-9) {
            fail('D13', `${goal} ${T}wk wk${w}: intensity dipped on a deload week with no D13 override (${at} < ${before}) — goals without an override must maintain intensity through deload (research-report(9))`);
          }
        }
      }
    }
    for (const [goal, v] of Object.entries(DELOAD_INTENSITY_OVERRIDE)) {
      d13Checked++;
      if (v < 0.60 || v > 0.70) fail('D13', `DELOAD_INTENSITY_OVERRIDE.${goal} = ${v} outside the research-cited 60-70% hypertrophy-deload band`);
    }
  }
} catch (e) {
  fail('D13', `could not verify goal-specific deload intensity: ${e.message}`);
}

// ── D14 (ACTIVE) — Realization weeks (final-week strength test, not a light week) ──
// Kerwin, 2026-07-23: "Why would week 12 of a build muscle plan be a deload, instead
// of an all out max week?" Every length except 11wk previously ended its ENTIRE
// program on a light deload (D13's own hypertrophy dip made this concretely wrong:
// week 12 was prescribing 6 reps at 65% 1RM, far too light for a real 6-rep set).
// realizationWeek() (programs.js) identifies the program's final week whenever it
// would otherwise be a light deload; weekFactor/effectiveReps (tandem.html) override
// it to HIGH intensity + LOW reps for EVERY goal — a true top single/triple/five —
// regardless of any D13 goal-specific deload behavior. Verifies: realizationWeek()
// matches the expected week per length (T itself for 4-10,12; null for 11, which was
// never a deload week and needs no realization treatment); weekFactor returns the
// realization intensity on that week for every goal; effectiveReps returns the
// realization rep target regardless of the phase's normal rep scheme; applyDeload
// tags realization weeks with day.realization (not day.deload) and vice versa.
let d14Checked = 0;
try {
  const tandemHtml = readFileSync(join(root, 'tandem.html'), 'utf8');
  const progMatch = tandemHtml.match(/const PROGRESSION = (\{[\s\S]*?\n\});/);
  const overrideMatch = tandemHtml.match(/const DELOAD_INTENSITY_OVERRIDE = (\{[^}]*\});/);
  const realIntensityMatch = tandemHtml.match(/const REALIZATION_INTENSITY = ([\d.]+);/);
  const realRepsMatch = tandemHtml.match(/const REALIZATION_REPS = (\d+);/);
  const wfMatch = tandemHtml.match(/function weekFactor\(goal, week, totalWeeks\) \{[\s\S]*?\n\}/);
  const pwrMatch = tandemHtml.match(/function phaseWeekRep\(phase, week\) \{[\s\S]*?\n\}/);
  const erMatch = tandemHtml.match(/function effectiveReps\(phase, week, totalWeeks\) \{[\s\S]*?\n\}/);
  if (!progMatch || !overrideMatch || !realIntensityMatch || !realRepsMatch || !wfMatch || !pwrMatch || !erMatch) {
    fail('D14', 'could not locate realization-week machinery in tandem.html');
  } else {
    const bundle = `(function(){
      const PROGRESSION = ${progMatch[1]};
      const DELOAD_INTENSITY_OVERRIDE = ${overrideMatch[1]};
      const REALIZATION_INTENSITY = ${realIntensityMatch[1]};
      const REALIZATION_REPS = ${realRepsMatch[1]};
      ${pwrMatch[0]}
      ${wfMatch[0]}
      ${erMatch[0]}
      return { weekFactor, effectiveReps, REALIZATION_INTENSITY, REALIZATION_REPS };
    })()`;
    const { weekFactor, effectiveReps, REALIZATION_INTENSITY, REALIZATION_REPS } = vm.runInNewContext(bundle, { deloadWeeks, realizationWeek });

    if (REALIZATION_INTENSITY < 0.85 || REALIZATION_INTENSITY > 0.95) fail('D14', `REALIZATION_INTENSITY ${REALIZATION_INTENSITY} outside the research-cited 85-90% strength-test band`);
    if (REALIZATION_REPS < 1 || REALIZATION_REPS > 5) fail('D14', `REALIZATION_REPS ${REALIZATION_REPS} outside top single-to-five territory`);

    const EXPECTED = { 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: null, 12: 12 };
    for (const [Tstr, expected] of Object.entries(EXPECTED)) {
      const T = Number(Tstr);
      d14Checked++;
      const got = realizationWeek(T);
      if (got !== expected) { fail('D14', `realizationWeek(${T}) = ${got}, expected ${expected}`); continue; }
      if (expected == null) continue;
      for (const goal of CANONICAL_GOALS) {
        d14Checked++;
        const f = weekFactor(goal, expected, T);
        if (Math.abs(f - REALIZATION_INTENSITY) > 1e-9) fail('D14', `${goal} ${T}wk wk${expected} (realization): weekFactor = ${f}, expected ${REALIZATION_INTENSITY}`);
      }
      d14Checked++;
      const dummyPhase = { reps: '99', weeks: [1, 99] }; // any phase — realization must win regardless of content
      const reps = effectiveReps(dummyPhase, expected, T);
      if (reps !== REALIZATION_REPS) fail('D14', `${T}wk wk${expected} (realization): effectiveReps = ${reps}, expected ${REALIZATION_REPS}`);
    }
  }
} catch (e) {
  fail('D14', `could not verify realization weeks: ${e.message}`);
}

// applyDeload tagging: realization weeks get day.realization (never day.deload) and
// vice versa — checked directly against the live engine, not the regex-extracted copy.
for (const goal of CANONICAL_GOALS) for (const days of [3, 4, 5]) for (const T of [4, 8, 12]) {
  const rw = realizationWeek(T);
  if (rw == null) continue;
  d14Checked++;
  const p = genT(goal, days, 'male', rw, T);
  if (!p.every(d => d.realization === true && d.deload !== true)) fail('D14', `${goal}/${days}d ${T}wk wk${rw}: applyDeload did not tag realization correctly`);
}

// ── D16 (ACTIVE) — Authored-program validation: SAFETY always, overrides cited ──
// EPIC-031. Authored seed programs (seeds/*.json → template/blocks/days/exercises)
// are the library path. SAFETY invariants bind them with no escape hatch;
// SCIENCE_DEFAULT deviations are legal ONLY when a science_overrides key names a
// program_principles row shipped in the same seed (claim + rationale + citation).
// The same rule is enforced at the DB by validate_science_overrides() — this is
// the file-side twin so a bad seed never reaches SQL. Checks per seed:
//   1. every science_overrides key has a matching principles[].principle_key
//   2. every exercise slug exists in EXERCISE_BANK (canonical library integrity)
//   3. SAFETY/D3: within each day, compound roles precede accessory/core/cardio
//   4. SAFETY/D5-clause: superset-type techniques (cardioacceleration, staggered)
//      never appear on a primary_compound exercise
//   5. Clean block-final weeks (Kerwin 2026-07-24): technique_by_week never lands
//      on a deload or realization week (global week = block.week_start + k - 1)
//   6. D10 override protocol: a rep floor below the goal band requires
//      science_overrides.rep_floor <= that floor, backed by a principle row
//   7. blocks are contiguous and cover weeks 1..duration_weeks exactly
let d16Checked = 0, d16Seeds = 0;
const SUPERSET_TECHNIQUES = new Set(['cardioacceleration', 'staggered']);
const COMPOUND_ROLES = new Set(['primary_compound', 'secondary_compound']);
const seedsDir = join(root, 'seeds');
if (existsSync(seedsDir)) {
  for (const fname of readdirSync(seedsDir).filter(f => f.endsWith('.json')).sort()) {
    d16Seeds++;
    let seed;
    try { seed = JSON.parse(readFileSync(join(seedsDir, fname), 'utf8')); }
    catch (e) { fail('D16', `${fname}: unparseable JSON (${e.message})`); continue; }
    const t = seed.template || {};
    const overrides = t.science_overrides || {};
    const principleKeys = new Set((seed.principles || []).map(p => p.principle_key));

    const guard = (clauseId, msg) => tierGuard(clauseId, { fname, overrides, principleKeys, msg });

    // 1 — every override key must be a cited principle (the D16 invariant itself,
    //     tier SAFETY: the override protocol is not itself overridable)
    for (const key of Object.keys(overrides)) {
      d16Checked++;
      if (!principleKeys.has(key)) guard('D16', `science_overrides key "${key}" has no program_principles row`);
    }
    // principles must be complete rows, not stubs
    for (const p of (seed.principles || [])) {
      d16Checked++;
      if (!p.principle_key || !p.claim || !p.rationale || !p.source_citation) guard('D16', `principle "${p.principle_key || '?'}" missing claim/rationale/source_citation — a principle row must carry its evidence`);
    }

    // 7 — block layout: contiguous, covering 1..duration_weeks. A program whose blocks
    //     do not tile its own duration is not a legal non-empty program (D2, SAFETY).
    const blocks = (seed.blocks || []).slice().sort((a, b) => (a.block_order || 0) - (b.block_order || 0));
    d16Checked++;
    if (blocks.length === 0) guard('D2', 'no blocks');
    let expectStart = 1;
    for (const b of blocks) {
      d16Checked++;
      if (b.week_start !== expectStart) guard('D2', `block ${b.block_order} starts week ${b.week_start}, expected ${expectStart} (blocks must be contiguous)`);
      if (b.week_end < b.week_start) guard('D2', `block ${b.block_order} week_end < week_start`);
      expectStart = (b.week_end || 0) + 1;
    }
    d16Checked++;
    if (blocks.length && expectStart - 1 !== t.duration_weeks) guard('D2', `blocks cover weeks 1..${expectStart - 1} but duration_weeks is ${t.duration_weeks}`);

    // 5 — clean block-final weeks: no technique on deload/realization weeks
    const T = t.duration_weeks;
    const dload = new Set(typeof deloadWeeks === 'function' ? deloadWeeks(T) : []);
    const realW = typeof realizationWeek === 'function' ? realizationWeek(T) : null;
    if (realW != null) dload.add(realW);
    for (const b of blocks) {
      for (const [wk, tech] of Object.entries(b.technique_by_week || {})) {
        d16Checked++;
        if (tech == null || tech === 'none') continue;
        const globalWk = b.week_start + Number(wk) - 1;
        if (dload.has(globalWk)) guard('D14', `block ${b.block_order} schedules technique "${tech}" on global week ${globalWk} — block-final deload/realization weeks run CLEAN (Kerwin 2026-07-24)`);
      }
    }

    // per-day checks
    const goal = t.code_goal_mapping;
    const band = REP_BANDS[goal];
    let minRepSeen = Infinity;
    for (const b of blocks) {
      // rep floor across the block's week schemes
      for (const scheme of Object.values(b.rep_scheme_by_week || {})) {
        const nums = String(scheme).match(/\d+/g);
        if (nums) minRepSeen = Math.min(minRepSeen, ...nums.map(Number));
      }
      for (const day of (b.days || [])) {
        const exs = (day.exercises || []).slice().sort((a, z) => (a.ex_order || 0) - (z.ex_order || 0));
        d16Checked++;
        if (exs.length === 0) { guard('D2', `block ${b.block_order} day ${day.day_order} has zero exercises`); continue; }
        let seenNonCompound = false;
        for (const ex of exs) {
          d16Checked++;
          // 2 — slug integrity against the canonical bank. An exercise the engine cannot
          //     resolve cannot be filtered for injury or equipment tier either (SAFETY).
          if (!EXERCISE_BANK[ex.slug]) guard('D2', `slug "${ex.slug}" not in EXERCISE_BANK (day ${day.day_order}, block ${b.block_order})`);
          // 3 — D3 compound-first (role ordering)
          if (COMPOUND_ROLES.has(ex.role)) {
            if (seenNonCompound) guard('D3', `block ${b.block_order} day ${day.day_order}: compound "${ex.slug}" appears after accessory/core/cardio`);
          } else seenNonCompound = true;
          // 4 — the never-superset-the-primary-block clause (D5 and D8 name the same rule)
          if (ex.role === 'primary_compound' && SUPERSET_TECHNIQUES.has(ex.technique)) {
            guard('D5.never_on_primary', `block ${b.block_order} day ${day.day_order}: primary compound "${ex.slug}" carries superset technique "${ex.technique}"`);
          }
          // exercise-level rep floors count too
          const nums = String(ex.reps || '').match(/\d+/g);
          if (nums) minRepSeen = Math.min(minRepSeen, ...nums.map(Number));
        }
      }
    }
    // 6 — D10 band deviation: SCIENCE_DEFAULT, so it needs the registered rep_floor
    //     override AND its principle row — tierGuard checks both. The extra check
    //     below is the value test the tier map cannot express: a declared floor of 3
    //     does not license prescribing 2.
    if (band && Number.isFinite(minRepSeen) && minRepSeen < band[0]) {
      d16Checked++;
      guard('D10', `min prescribed reps ${minRepSeen} below the ${goal} band floor ${band[0]}`);
      const floor = overrides.rep_floor;
      if (floor != null && minRepSeen < floor) fail('D16', `${fname}: min prescribed reps ${minRepSeen} below the declared rep_floor override ${floor}`);
    }
  }
}

// ── D16 completeness — the tier map covers every invariant, both directions ────
// EPIC-033 F8 / BUG-71. The DOCTRINE.md D16 row and the TIERS map drifted apart:
// D2, D6b, D7, D9 and D16 itself had no stated tier anywhere in the prose, so six of
// eighteen invariants were untiered while the gate silently assumed one. Pin it in
// both directions so the mirror cannot drift again: every invariant declared in the
// DOCTRINE.md table must have a TIERS entry, and every TIERS entry must be a real
// invariant. This is what makes the F8 fix permanent rather than a one-time edit.
try {
  const doctrineMd = readFileSync(join(root, 'DOCTRINE.md'), 'utf8');
  const declared = [...doctrineMd.matchAll(/^\|\s*\*\*(D\d+b?)\*\*\s*\|/gm)].map(m => m[1]);
  if (declared.length === 0) fail('D16', 'could not parse the invariant table out of DOCTRINE.md');
  for (const id of declared) {
    d16Checked++;
    if (!TIERS[id]) fail('D16', `${id} is declared in DOCTRINE.md but has no tier in the TIERS map — every invariant sits in exactly one tier (D16 page §Completeness rule)`);
  }
  for (const id of Object.keys(TIERS)) {
    d16Checked++;
    if (!declared.includes(id)) fail('D16', `TIERS declares a tier for ${id}, which is not an invariant in DOCTRINE.md`);
  }
  // SPLIT invariants must have BOTH clauses registered, or the SPLIT tag is a stub.
  for (const [id, tier] of Object.entries(TIERS)) {
    if (tier !== 'SPLIT') continue;
    d16Checked++;
    const clauses = Object.keys(CLAUSE_TIERS).filter(k => k.startsWith(`${id}.`));
    const tiers = new Set(clauses.map(k => CLAUSE_TIERS[k]));
    if (!(tiers.has('SAFETY') && tiers.has('SCIENCE_DEFAULT'))) {
      fail('D16', `${id} is tagged SPLIT but its clauses do not cover both tiers (found: ${clauses.join(', ') || 'none'})`);
    }
  }
} catch (e) {
  if (!/DOCTRINE/.test(String(e.message))) fail('D16', `tier-map completeness check failed: ${e.message}`);
}

// ── D18 (ACTIVE) — Every slot's candidate pool is non-empty at every tier ──────
// BUG-82 (Notion 3beca37f935b815c88bcc58f10bd2b8b, filed 2026-08-16, EPIC-026 Phase 1
// audit): pick()/select() return null on an empty candidate pool and every caller is
// `if (chosen) { ... }` — the slot is silently dropped, no warning, every other gate
// stays green. The pre-existing `usable` guard in buildDynamicProgram only checks
// slots[0] (the primary compound) for the ONE tier a given generation call happens to
// request. Tier SAFETY per D2's existing "each live goal generates a legal, non-empty
// program" principle (BUG-82 is that same principle applied per-slot instead of
// per-program) — an empty pool drops a prescribed exercise on every path (generated,
// authored, adopted), so no science_overrides escape hatch applies. This is a pure
// selection-mechanism / string-matching correctness question (does group g match any
// bank entry's muscleGroups tag), not an exercise-science content question, so it needs
// no external research citation — see BUG-82's should/could/did audit in the Cycle 54
// commit body.
//
// Extraction mirrors scripts/audit-muscle-tags.mjs's proven technique (regex over the
// live source + FOCUS_SLOTS/ONEOFF_* read from the running engine, self-checked against
// the live groupsMatch string) so this gate and that audit can never silently diverge.
let d18Checked = 0;
{
  // BUG-87 (2026-08-18): the bare `|| a.startsWith(g)` fallback was removed from the
  // live rule (it let 'quad' collide with 'quadratus_lumborum', a lower-back muscle,
  // in a leg slot) — this copy and its self-check follow suit. See programs.js's
  // groupsMatch (getSingleDay + buildDynamicProgram) for the fix + verification.
  const fixedPattern = /a === g \|\| a\.startsWith\(g\s*\+\s*'_'\)\)\)/g;
  const staleFallback = /a\.startsWith\(g\s*\+\s*'_'\)\s*\|\|\s*a\.startsWith\(g\)\)/;
  const liveMatch = [...code.matchAll(fixedPattern)].length >= 2 && !staleFallback.test(code);
  if (!liveMatch) fail('D18', 'live groupsMatch prefix rule differs from the copy this gate uses — update D18 before trusting its verdict');
  const groupsMatchD18 = (ex, groups) => {
    const all = [...(ex.muscleGroups?.primary || []), ...(ex.muscleGroups?.secondary || [])];
    return groups.some(g => all.some(a => a === g || a.startsWith(g + '_')));
  };
  const callSites = [];
  for (const [focus, slots] of Object.entries(FOCUS_SLOTS || {})) {
    slots.forEach(([a, b, cat], i) => callSites.push({ where: `FOCUS_SLOTS.${focus}[${i}]`, groups: [a, b].filter(Boolean), cat }));
  }
  callSites.push({ where: 'ONEOFF_CORE_GROUPS', groups: ONEOFF_CORE_GROUPS || [], cat: 'core' });
  callSites.push({ where: 'ONEOFF_CARDIO_GROUPS', groups: ONEOFF_CARDIO_GROUPS || [], cat: 'cardio' });
  for (const m of code.matchAll(/role:\s*'[^']*',\s*groups:\s*\[([^\]]*)\]\s*,\s*cat:\s*'([^']*)'/g)) {
    const groups = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
    if (groups.length) callSites.push({ where: `slot literal @line${code.slice(0, m.index).split('\n').length}`, groups, cat: m[2] });
  }
  for (const m of code.matchAll(/cardioGroups:\s*\[([^\]]*)\]/g)) {
    const groups = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
    if (groups.length) callSites.push({ where: `cardioGroups @line${code.slice(0, m.index).split('\n').length}`, groups, cat: 'cardio' });
  }
  {
    const i = code.indexOf('const CORE_GROUPS');
    if (i !== -1) {
      const span = code.slice(i, code.indexOf('];', i));
      const groups = [...span.matchAll(/'([^']+)'/g)].map(x => x[1]);
      if (groups.length) callSites.push({ where: 'CORE_GROUPS', groups, cat: 'core' });
    }
  }
  if (callSites.length < 20) fail('D18', `only found ${callSites.length} call sites — extraction likely broken (expected 30+)`);

  // KNOWN_GAPS — a bounded, cited exception list. Discovered while building this gate
  // (BUG-82, Cycle 54): at 'home' tier, EXERCISE_BANK had zero isolation-category
  // exercises tagged lat_dorsi, bicep, upper_trap, or brachialis/brachioradialis.
  // Filed as BUG-88 (Notion Bug & QA Log, 2026-08-16) and CLOSED same day (Cycle 55,
  // exercise-science-research pass): added band-curl, band-hammer-curl,
  // band-straight-arm-pulldown, band-shrug to EXERCISE_BANK (programs.js) — sourced,
  // cited entries (Aboodarda et al. 2019 SAGE Open Medicine band-modality equivalence;
  // Washif et al. 2022 MDPI straight-arm-pulldown lat EMG; hammer-curl brachioradialis
  // EMG corroboration — full citations in each entry's code comment). All four D18
  // gaps this allowlist covered are now genuinely closed, not just widened around, so
  // the set is empty. Left as a Set (not deleted) so a FUTURE bounded, cited exception
  // has a place to go without restructuring the gate — this list must never grow to
  // cover a NEW empty-pool defect; that is exactly what D18 exists to catch.
  const KNOWN_GAPS = new Set([]);
  for (const site of callSites) {
    for (const t of TIER_ORDER) {
      d18Checked++;
      const reqIdx = TIER_ORDER.indexOf(t);
      const n = Object.values(EXERCISE_BANK).filter(e =>
        TIER_ORDER.indexOf(e.tier) <= reqIdx && e.category === site.cat && groupsMatchD18(e, site.groups)).length;
      const key = `${site.groups.join(',')}|${site.cat}|${t}`;
      if (n === 0 && !KNOWN_GAPS.has(key)) {
        fail('D18', `${site.where} [${site.groups.join(',')}] cat=${site.cat}: 0 candidates at tier=${t} — an empty pool silently drops this slot (BUG-82)`);
      }
    }
  }
}

// ── D19 (ACTIVE) — muscle-group matching is ANCHORED at the taxonomy separator ─
// BUG-87 (2026-08-18, EPIC-026 Phase 2; docs/epic-026-submuscle-audit.md §3 Defect 1).
// groupsMatch used to read `a === g || a.startsWith(g+'_') || a.startsWith(g)`. The
// third clause strictly SUBSUMES the first two, so what actually executed was a bare
// unanchored prefix test: a request token matched any bank tag merely BEGINNING with
// the same characters, ignoring the '_' boundary the sub-muscle vocabulary is built on.
// Live consequence: a bare 'quad' slot matched 'quadratus_lumborum' — a lower-back
// muscle — so a quadriceps slot could be filled with lumbar work.
//
// TIER + CITATION (state this precisely, it is the subtle part): this is an
// ENGINEERING-CORRECTNESS invariant, not an exercise-science finding. "A quad slot must
// not return a lumbar muscle" needs no research citation because quadratus lumborum
// being a lower-back muscle is DEFINITIONAL anatomy, not a training-science claim. It
// sits under existing doctrine rather than new doctrine: D2's "each live goal generates
// a LEGAL program" and the same slot-returns-what-it-asked-for principle D18 encodes
// (D18 says the pool is non-empty; D19 says the pool is the RIGHT pool). Tier SAFETY for
// D18's reason — a mis-targeted slot ships on every path (generated, authored, adopted),
// so no science_overrides escape hatch applies. What is NOT settled here, and is
// deliberately not asserted: whether the sub-muscle VOCABULARY itself is scientifically
// correct. That is EPIC-026 Phase 3's exercise-science-research pass
// (docs/epic-026-submuscle-audit.md:522-525), still owed.
//
// TEETH: this does not regex the source and call it a day. It EXTRACTS the live matching
// expression from programs.js, compiles it, and tests the real shipped predicate against
// an independently-written reference over the full cross-product of every request token
// and every muscle tag in EXERCISE_BANK. Re-adding the unanchored clause makes the
// quad/quadratus_lumborum pair diverge and the gate goes red.
let d19Checked = 0;
{
  // Both copies must exist and must be byte-identical in rule text — getSingleDay's
  // one-off engine and buildDynamicProgram's bank() are required to select alike.
  const rules = [...code.matchAll(/const groupsMatch = \((?:e|ex), groups\) => \{[\s\S]*?return groups\.some\(g => all\.some\(a => (.+?)\)\);\s*\};/g)].map(m => m[1]);
  if (rules.length !== 2) {
    fail('D19', `expected exactly 2 groupsMatch definitions in programs.js, found ${rules.length} — the one-off and generated engines must both be gated`);
  }
  const norm = (s) => s.replace(/\s+/g, '');
  if (rules.length === 2 && norm(rules[0]) !== norm(rules[1])) {
    fail('D19', `the two groupsMatch rules differ — getSingleDay and buildDynamicProgram would select differently:\n      one-off: ${rules[0]}\n      generated: ${rules[1]}`);
  }
  // Reference rule, written independently of the source expression: a tag satisfies a
  // request token iff it IS that token, or is one of its children below the '_' separator.
  const reference = (a, g) => a === g || a.startsWith(g + '_');

  // Request-token extraction, done independently of D18's copy on purpose: two
  // independent extractions that agree are worth more than one shared helper.
  const tokens = new Set();
  for (const slots of Object.values(FOCUS_SLOTS || {})) for (const [a, b] of slots) { if (a) tokens.add(a); if (b) tokens.add(b); }
  for (const t of (ONEOFF_CORE_GROUPS || [])) tokens.add(t);
  for (const t of (ONEOFF_CARDIO_GROUPS || [])) tokens.add(t);
  for (const m of code.matchAll(/(?:groups|cardioGroups):\s*\[([^\]]*)\]/g)) {
    for (const q of m[1].matchAll(/'([^']+)'/g)) tokens.add(q[1]);
  }
  {
    const i = code.indexOf('const CORE_GROUPS');
    if (i !== -1) for (const q of code.slice(i, code.indexOf('];', i)).matchAll(/'([^']+)'/g)) tokens.add(q[1]);
  }
  if (tokens.size < 20) fail('D19', `only extracted ${tokens.size} request tokens — extraction likely broken (expected 25+)`);

  // Every muscle tag the bank actually uses.
  const tags = new Set();
  for (const e of Object.values(EXERCISE_BANK)) {
    for (const a of [...(e.muscleGroups?.primary || []), ...(e.muscleGroups?.secondary || [])]) tags.add(a);
  }

  for (const [idx, expr] of rules.entries()) {
    let live;
    try { live = new Function('a', 'g', `return ${expr};`); }
    catch (err) { fail('D19', `could not compile live groupsMatch rule #${idx + 1} (${expr}): ${err.message}`); continue; }
    for (const g of tokens) {
      for (const a of tags) {
        d19Checked++;
        if (live(a, g) !== reference(a, g)) {
          fail('D19', `groupsMatch copy #${idx + 1} is not anchored: request token '${g}' ${live(a, g) ? 'MATCHES' : 'fails to match'} bank tag '${a}' — expected ${reference(a, g)}. An unanchored prefix lets a slot return a different parent muscle (BUG-87: bare 'quad' matched 'quadratus_lumborum', a lower-back muscle).`);
        }
      }
    }
  }
}

// ── D20 (ACTIVE) — getSingleDay SOFT-deprioritizes a recently-trained muscle ────
// EPIC-028 (widened), 2026-08-22. `getSingleDay`'s FOCUS_SLOTS candidate selection
// now reads opts.recentExposure ({tag: hoursSinceTrained}, PRIMARY tags only — the
// exact shape recentMuscleLoad() produces in tandem.html) and opts.recencyThreshold-
// Hours (a plain number the CALLER resolves from RECOVERY_PARAMS[goal].sameGroup-
// Hours — tandem.html:4977, BUG-30 — getSingleDay does not read RECOVERY_PARAMS
// itself, deliberately: that constant lives in tandem.html, and this engine also
// runs standalone under this very gate's vm sandbox). When a slot's own group is
// under threshold, its candidate pool WIDENS (never narrows) to the other muscle
// groups the SAME focus's FOCUS_SLOTS array already asks for at the same category,
// and a fresher (non-recent) match ranks ahead of the existing oneRmFactor/alpha
// tiebreak — soft de-prioritization, never a hard exclusion (D20's own text: "if
// nothing fresher is legally available for that slot, still fill it with the
// original group"). Tier SCIENCE_DEFAULT (same class as D1's rotation preference) —
// see DOCTRINE.md D20 row for the full citation chain.
//
// TEETH, mirroring D18/D19's technique: this does not just call getSingleDay once
// and eyeball it. It (1) extracts RECOVERY_PARAMS' three live sameGroupHours values
// out of tandem.html so the thresholds this gate tests are the actual shipped
// numbers, not a hand-copied duplicate that could drift; (2) proves NO-OP
// backward-compatibility — recentExposure/threshold absent produces byte-identical
// output to a call with an empty/zero one, across every focus×tier; (3) proves the
// mechanism actually STEERS at least once across the matrix when a fresh legal
// alternative exists (catches a regression where the widening/ranking silently
// stops firing — e.g. the BUG caught while building this gate, where scoring
// freshness on primary+secondary tags let a curl's co-tagged brachialis secondary
// falsely mark a bicep-primary exercise "fresh" and defeat steering entirely —
// fixed by scoring PRIMARY tags only); (4) proves NEVER-EMPTY under a maximal
// stress case (every muscle tag in EXERCISE_BANK flagged recent at 1 hour, so no
// fresh alternative can exist anywhere) — D9's structural properties (non-empty,
// compound-before-accessory, dup-free, tier-legal) must still hold for every
// focus×tier×threshold, proving "soft" never degrades into "the slot goes unfilled."
let d20Checked = 0;
if (typeof getSingleDay === 'function' && Array.isArray(ONEOFF_FOCUSES)) {
  const tandemHtml = readFileSync(join(root, 'tandem.html'), 'utf8');
  const rpMatch = tandemHtml.match(/const RECOVERY_PARAMS = \{([\s\S]*?)\n\};/);
  if (!rpMatch) fail('D20', 'could not locate RECOVERY_PARAMS in tandem.html — the shared BUG-30 threshold table this gate tests against');
  const thresholds = [...(rpMatch ? rpMatch[1] : '').matchAll(/sameGroupHours:\s*(\d+)/g)].map(m => Number(m[1]));
  if (thresholds.length < 3) fail('D20', `expected 3 RECOVERY_PARAMS.sameGroupHours values (build_muscle/fat_burn/transform), found ${thresholds.length} — extraction likely broken`);

  // Isolation-only-scoring regression guard: the live isFresh() must read PRIMARY
  // tags only. Re-adding secondary tags reintroduces the exact defect this D20
  // build caught (a synergist-tagged exercise from the RECENT group scoring as
  // "fresh" and silently defeating steering).
  const isFreshLine = code.match(/const isFresh = \(e\) => freshSet && \(e\.muscleGroups\.primary \|\| \[\]\)\.some\(a => freshSet\.has\(a\)\);/);
  if (!isFreshLine) fail('D20', 'getSingleDay\'s freshness scoring no longer reads PRIMARY tags only — a secondary-tag synergist (e.g. every curl co-tagging brachialis) can silently defeat steering again');

  const namesOf = (day) => (day?.blocks || []).flatMap(b => (b.exs || []).map(e => e.name));

  for (const focus of ONEOFF_FOCUSES) {
    for (const tier of TIER_ORDER) {
      d20Checked++;
      // (1) NO-OP backward compatibility — absent vs explicit-empty must agree.
      const noOpts = getSingleDay(focus, { tier });
      const explicitEmpty = getSingleDay(focus, { tier, recentExposure: {}, recencyThresholdHours: thresholds[0] });
      if (JSON.stringify(namesOf(noOpts)) !== JSON.stringify(namesOf(explicitEmpty))) {
        fail('D20', `${focus}/${tier}: recentExposure:{} changed output vs opts absent entirely — steering must be a strict no-op when there is nothing recent`);
      }
    }
  }

  // (3) Steering actually fires somewhere across the matrix — build_muscle's 48h
  // threshold, every focus, every own-slot muscle flagged recent at 1 hour (well
  // under all three thresholds) one at a time, at full_gym tier (richest pool).
  // recentExposure is keyed by the FOCUS_SLOTS token itself here (an exact-key
  // hit), which exercises isRecent's "tag === g" branch; the parent/child branch
  // ("tag.startsWith(g + '_')") is exercised separately below.
  let steeredAtLeastOnce = false;
  for (const focus of ONEOFF_FOCUSES) {
    const slots = FOCUS_SLOTS[focus] || [];
    const ownGroups = new Set(slots.flatMap(s => [s[0], s[1]].filter(Boolean)));
    const base = getSingleDay(focus, { tier: 'full_gym' });
    for (const g of ownGroups) {
      const steered = getSingleDay(focus, { tier: 'full_gym', recentExposure: { [g]: 1 }, recencyThresholdHours: thresholds[0] });
      if (JSON.stringify(namesOf(base)) !== JSON.stringify(namesOf(steered))) { steeredAtLeastOnce = true; break; }
    }
    if (steeredAtLeastOnce) break;
  }
  if (!steeredAtLeastOnce) fail('D20', 'flagging a muscle group recent (1h, under every RECOVERY_PARAMS threshold) never changed getSingleDay\'s output anywhere across every focus — the steering mechanism appears to be disabled/dead');

  // (3b) The parent/child anchoring branch specifically — recentMuscleLoad()
  // (tandem.html) keys its real output by whatever fine-grained tag the trained
  // exercise's OWN .primary carries (e.g. 'quad_rectus_femoris'), while a
  // FOCUS_SLOTS token is often the coarser PARENT ('quad'). An exact-key lookup
  // would silently never match this pair and leave every parent-level slot
  // permanently inert — the exact defect caught while building this gate. Prove
  // a real leaf tag (drawn from EXERCISE_BANK, not invented) steers a legs slot.
  {
    const legsBase = getSingleDay('legs', { tier: 'full_gym' });
    const legsSteered = getSingleDay('legs', { tier: 'full_gym', recentExposure: { quad_rectus_femoris: 1, quad_vastus: 1 }, recencyThresholdHours: thresholds[0] });
    if (JSON.stringify(namesOf(legsBase)) === JSON.stringify(namesOf(legsSteered))) {
      fail('D20', 'a leaf/child muscle tag (quad_rectus_femoris) recent did not steer the "legs" focus\'s parent-token "quad" slot — isRecent() must anchor on the taxonomy separator the same way groupsMatch (D19) does, not do an exact-key lookup');
    }
  }

  // (4) Never-empty AND byte-identical-to-baseline under maximal stress — every
  // muscle tag EXERCISE_BANK uses is flagged recent, so literally no fresh
  // alternative can exist anywhere in ANY focus family. Per the D20 Notion mirror
  // page §5 clause 2 ("output is identical to the no-history output"), this must
  // not just hold D9's shape — it must reproduce the exact no-history exercise
  // list, because every slot's freshGroups computation is required to come back
  // empty (every candidate group is itself recent) and take the untouched,
  // pre-D20 code path.
  const allTags = new Set();
  for (const e of Object.values(EXERCISE_BANK)) for (const t of [...(e.muscleGroups?.primary || []), ...(e.muscleGroups?.secondary || [])]) allTags.add(t);
  const stressExposure = {};
  for (const t of allTags) stressExposure[t] = 1;
  for (const focus of ONEOFF_FOCUSES) {
    for (const tier of TIER_ORDER) {
      const base = getSingleDay(focus, { tier });
      for (const thr of thresholds) {
        d20Checked++;
        const day = getSingleDay(focus, { tier, recentExposure: stressExposure, recencyThresholdHours: thr });
        if (!day || !Array.isArray(day.blocks) || day.blocks.length === 0) { fail('D20', `${focus}/${tier}/thr=${thr}: maximal-recency stress produced an EMPTY session — soft de-prioritization must never leave a slot unfilled`); continue; }
        const labels = day.blocks.map(b => String(b.label || ''));
        const ci = labels.findIndex(l => /compound/i.test(l));
        const ai = labels.findIndex(l => /accessor/i.test(l));
        if (ci !== -1 && ai !== -1 && ci > ai) fail('D20', `${focus}/${tier}/thr=${thr}: maximal-recency stress broke compound-before-accessory ordering (D3/D9)`);
        const exs = day.blocks.flatMap(b => (b.exs || []).map(e => e.name));
        if (new Set(exs).size !== exs.length) fail('D20', `${focus}/${tier}/thr=${thr}: maximal-recency stress produced a duplicate lift`);
        const reqIdx = TIER_ORDER.indexOf(tier);
        for (const n of exs) {
          const t = TIER_BY_NAME[String(n).trim().toLowerCase()];
          if (t && TIER_ORDER.indexOf(t) > reqIdx) fail('D20', `${focus}/${tier}/thr=${thr}: "${n}" exceeds tier under maximal-recency stress`);
        }
        if (JSON.stringify(namesOf(base)) !== JSON.stringify(namesOf(day))) {
          fail('D20', `${focus}/${tier}/thr=${thr}: maximal-recency stress (every tag recent, so no fresh alternative exists anywhere) did not reproduce the no-history exercise list byte-for-byte — D20 Notion page §5 clause 2 requires exact identity here, not just D9 shape`);
        }
      }
    }
  }
  // (5) INERT under EVERY malformed/absent permutation, not just the one pair in
  // (1). Merged in from the parallel D20 build (EPIC-028, 2026-08-21). D20 invents
  // no fallback number, so a missing window, a zero window and a NaN window must
  // each be as inert as no exposure at all — otherwise the D9/D18 matrices, which
  // all call getSingleDay without these opts, are no longer testing what they claim.
  for (const focus of ONEOFF_FOCUSES) {
    for (const tier of TIER_ORDER) {
      const baseNames = namesOf(getSingleDay(focus, { tier }));
      if (!baseNames.length) continue; // D9/D18 own emptiness; nothing for D20 to say
      for (const inert of [{ recentExposure: null },
                           { recentExposure: {} },
                           { recentExposure: { pec_major_sternal: 1 } },            // exposure, no window
                           { recencyThresholdHours: thresholds[0] },                // window, no exposure
                           { recentExposure: { pec_major_sternal: 1 }, recencyThresholdHours: 0 },
                           { recentExposure: { pec_major_sternal: 1 }, recencyThresholdHours: NaN }]) {
        d20Checked++;
        const got = namesOf(getSingleDay(focus, { tier, ...inert }));
        if (JSON.stringify(got) !== JSON.stringify(baseNames)) {
          fail('D20', `${focus}/${tier}: opts ${JSON.stringify(inert)} changed the output — D20 must be INERT without a well-formed exposure AND window (it invents no fallback number)`);
        }
      }
    }
  }

  // (6) STEERING NEVER COSTS A SLOT. This is the "soft, never hard-excludes"
  // guarantee enforced on the OUTPUT — where it is actually falsifiable — rather
  // than argued from the mechanism. Neither steering rank filters a pool, so D20
  // cannot empty a slot DIRECTLY; but slots fill in order against a shared `used`
  // set, so REORDERING can make an earlier slot consume the one exercise a later,
  // scarcer slot had left. That slot's pool then comes back empty and the caller
  // silently drops it (`if (chosen) {...}` — the exact swallow-the-gap pattern D18
  // exists to police).
  //
  // Found by RUNNING the merged engine, not by reading it: 48 of 552
  // focus×tier×window×flagged cases came back one exercise short, concentrated at
  // the sparse `home` tier. Check (4)'s saturation stress is structurally BLIND to
  // this, because saturation drives steering inert and so never exercises the
  // reordering path at all — which is precisely why this clause exists separately.
  const bankByName = {};
  for (const e of Object.values(EXERCISE_BANK)) bankByName[e.name] = e;
  for (const focus of ONEOFF_FOCUSES) {
    for (const tier of TIER_ORDER) {
      const baseNames = namesOf(getSingleDay(focus, { tier }));
      if (!baseNames.length) continue;
      // Flag every PRIMARY tag the unsteered day actually uses: maximal steering
      // pressure that still leaves fresh alternatives reachable elsewhere in the
      // bank — the regime saturation can never reach.
      const exposure = {};
      for (const n of baseNames) for (const t of (bankByName[n]?.muscleGroups?.primary || [])) exposure[t] = 1;
      for (const thr of thresholds) {
        d20Checked++;
        const steered = namesOf(getSingleDay(focus, { tier, recentExposure: exposure, recencyThresholdHours: thr }));
        if (steered.length !== baseNames.length) {
          fail('D20', `${focus}/${tier}/thr=${thr}: steering changed the EXERCISE COUNT (${baseNames.length} → ${steered.length}) — D20 reorders, it must never cost a slot. D20 is SCIENCE_DEFAULT; D9's structural law is SAFETY, and a preference never outranks SAFETY`);
        }
      }
    }
  }

  // (7) THE THRESHOLD IS NOT INVENTED — the CALL SITE, not just the engine.
  // getSingleDay takes the window as a parameter, so the engine alone can never
  // prove the RULED source is what reaches it. A gate that only tests the engine
  // cannot see a caller that quietly invented its own 72.
  {
    // Every argument site, not "somewhere nearby": a proximity window would pass a
    // file that reads RECOVERY_PARAMS for the banner text and then hands the engine
    // a hand-typed number. Each `recencyThresholdHours:` RHS, to its line end, must name it.
    const sites = [...tandemHtml.matchAll(/recencyThresholdHours\s*:\s*([^\n]*)/g)];
    d20Checked++;
    if (!sites.length) {
      fail('D20', 'tandem.html never passes recencyThresholdHours to getSingleDay — the one-off entry point is not wired to D20');
    }
    for (const [, rhs] of sites) {
      d20Checked++;
      if (!/\bRECOVERY_PARAMS\b/.test(rhs)) {
        fail('D20', `tandem.html passes \`recencyThresholdHours: ${rhs.trim()}\` — not sourced from RECOVERY_PARAMS. The ruled threshold is RECOVERY_PARAMS hours-by-goal (48/24/36, BUG-30; Kerwin 2026-08-21), never an invented number`);
      }
    }
    d20Checked++;
    if (/const\s+RECOVERY_PARAMS/.test(code)) {
      fail('D20', 'programs.js has grown its own RECOVERY_PARAMS copy — one table, passed in (this is the two-copies drift D19 had to police in groupsMatch)');
    }
  }
} else {
  console.log('  (note: getSingleDay/FOCUS_SLOTS not available — D20 skipped)');
}

// ── D21 — the one-off tiered-set ladder ────────────────────────────────────────
// SCIENCE_DEFAULT, not SAFETY. Ascending-load/descending-rep ("pyramid") sequencing is
// a real, peer-reviewed technique whose outcomes are COMPARABLE TO, not superior to,
// straight sets when volume is equated. Honest gap, flagged not filled: NO repo-canonical
// source names this protocol — `research-report (8).pdf` is silent on pyramid/wave/tiered
// schemes (0 hits). The corroboration is external (2024 bench-press literature) and the
// compound-only scoping is convention, not a cited mechanism. It is therefore a
// load-DISTRIBUTION technique layered on D10's band, never a new physiological claim,
// and it sits at the same tier as D10/D20 rather than at D11/D12's SAFETY tier.
//
// ── D22 (ACTIVE, SAFETY) — the onboarding estimate is a submaximal RM ──────────────
//
// Onboarding asks "what can you lift for 8-10 reps?", has persisted the answer since
// EPIC-9 Step A, and used it in exactly one place: as the raw week-1 working weight.
// That prescribes an 8-10RM for a 12- or 15-rep week. Its second-order effect was the
// larger one — nothing ever became a 1RM, so getWeekTarget returned source:'none' for
// every new user and getRecommendation fell through to its flat pound-step branch,
// leaving the whole %1RM engine (D11) idle. Same tandem.html-resident, regex-extract
// contract as D21: the helpers stay top-level, stably named and calcRM-only so this
// invariant is assertable rather than merely documented.
let d22Checked = 0;
{
  const tandemHtml = readFileSync(join(root, 'tandem.html'), 'utf8');
  const calcMatch = tandemHtml.match(/function calcRM\(w, r\) \{[\s\S]*?\n\}/);
  const seedMatch = tandemHtml.match(/function seedOneRMFromEstimate\(lbs, reps\) \{[\s\S]*?\n\}\n/);
  const repsMatch = tandemHtml.match(/const ONBOARDING_ESTIMATE_REPS = (\d+);/);
  if (!calcMatch || !seedMatch || !repsMatch) {
    fail('D22', 'could not locate seedOneRMFromEstimate/ONBOARDING_ESTIMATE_REPS/calcRM in tandem.html — the conversion must stay a top-level, stably-named, calcRM-only helper or this invariant becomes unassertable');
  } else {
    const { calcRM, seedOneRMFromEstimate, ONBOARDING_ESTIMATE_REPS } = vm.runInNewContext(`(function(){
      ${calcMatch[0]}
      const ONBOARDING_ESTIMATE_REPS = ${repsMatch[1]};
      ${seedMatch[0]}
      return { calcRM, seedOneRMFromEstimate, ONBOARDING_ESTIMATE_REPS };
    })()`);

    // (1) CONVERSION IDENTITY — the seeded 1RM is D12's calcRM, not a second model.
    for (const lbs of [45, 95, 135, 185, 225, 315]) {
      for (const reps of [6, 8, 10, 12, 15]) {
        d22Checked++;
        const got = seedOneRMFromEstimate(lbs, reps);
        if (got !== Math.round(calcRM(lbs, reps))) {
          fail('D22', `seedOneRMFromEstimate(${lbs}, ${reps}) = ${got}, but D12's calcRM says ${Math.round(calcRM(lbs, reps))} — the estimate must convert through the app's one 1RM model`);
        }
        // And it must be a CONVERSION, not a pass-through: a submaximal RM is strictly
        // below the 1RM it implies, so prescribing the raw number over-prescribes.
        d22Checked++;
        if (got <= lbs) fail('D22', `seedOneRMFromEstimate(${lbs}, ${reps}) = ${got} did not exceed the entered weight — a ${reps}-rep max implies a HIGHER 1RM; returning the raw number is the over-prescription this invariant exists to stop`);
      }
    }

    // (2) THE RANGE BOTTOM IS THE CONSERVATIVE CHOICE. The card names 8-10 and stores no
    // rep count, so a point must be picked. calcRM is monotonic in reps (D12), so the
    // bottom yields the lowest 1RM the user's own answer supports — it under-prescribes.
    // Asserted as a PROPERTY (>= no other in-range choice) rather than pinned to 8, so
    // re-ruling the range does not require re-typing a literal here.
    d22Checked++;
    if (ONBOARDING_ESTIMATE_REPS !== 8) {
      fail('D22', `ONBOARDING_ESTIMATE_REPS is ${ONBOARDING_ESTIMATE_REPS}; the onboarding card asks for 8-10 reps and the conservative (under-prescribing) choice is the range BOTTOM, 8`);
    }
    d22Checked++;
    if (seedOneRMFromEstimate(225, ONBOARDING_ESTIMATE_REPS) > seedOneRMFromEstimate(225, 10)) {
      fail('D22', 'the chosen rep count yields a HIGHER 1RM than the top of the stated range — that manufactures strength the user never claimed');
    }

    // (3) NO INVENTED RM. D11 is SAFETY: absent a real entry there is no number, not a
    // guess. Every non-weight must return null, never 0, NaN or a default.
    for (const bad of [null, undefined, 0, -5, NaN, 'abc', '']) {
      d22Checked++;
      if (seedOneRMFromEstimate(bad, 8) !== null) {
        fail('D22', `seedOneRMFromEstimate(${JSON.stringify(bad)}, 8) did not return null — an absent or invalid estimate must yield NO 1RM (D11: never synthesize one)`);
      }
      d22Checked++;
      if (seedOneRMFromEstimate(225, bad) !== null) {
        fail('D22', `seedOneRMFromEstimate(225, ${JSON.stringify(bad)}) did not return null — an unusable rep count must yield NO 1RM`);
      }
    }

    // (4) FORMULA SINGLE-SOURCE — same two-copies-drift guard D19/D20/D21 apply. A
    // private Epley here would silently diverge from D12 exactly on the Mayhew branch.
    d22Checked++;
    if (!/\bcalcRM\s*\(/.test(seedMatch[0])) {
      fail('D22', 'seedOneRMFromEstimate does not call calcRM — the conversion must be D12\'s live formula, not a re-derivation');
    }
    for (const lit of ['1 + r / 30', '1 + r/30', '52.2', '41.9', '/ 30', '/30']) {
      d22Checked++;
      if (seedMatch[0].includes(lit)) {
        fail('D22', `seedOneRMFromEstimate contains a hardcoded 1RM coefficient (${lit}) — that is a second copy of D12 that will drift`);
      }
    }

    // (5) EARNED ALWAYS WINS. A self-reported guess must never outrank a measured lift,
    // even a LOW one — otherwise an optimistic estimate sits above real performance and
    // the user can never earn past it. Asserted on the live resolution order, which is
    // the single site every prescription path calls.
    const presMatch = tandemHtml.match(/function prescriptionOneRM\(name, workingRm, prRm\) \{[\s\S]*?\n\}/);
    d22Checked++;
    if (!presMatch) {
      fail('D22', 'could not locate prescriptionOneRM in tandem.html — the earned-then-estimate resolution order must live in exactly one named place');
    } else {
      d22Checked++;
      if (!/earnedOneRM\([\s\S]*?\)\s*\?\?/.test(presMatch[0])) {
        fail('D22', 'prescriptionOneRM does not resolve earnedOneRM FIRST with ?? — an estimate may only fill a blank, never outrank a measured lift (D11 is SAFETY)');
      }
      d22Checked++;
      if (!/estimatedOneRM\(/.test(presMatch[0])) {
        fail('D22', 'prescriptionOneRM never consults estimatedOneRM — the estimate would be collected, stored and ignored, which is the defect this invariant closes');
      }
    }

    // (6) THE RAW-PREFILL BRANCH IS GONE, not merely bypassed. This is the actual bug:
    // the onboarding number assigned STRAIGHT to the week-1 working weight.
    d22Checked++;
    if (/startW\s*=\s*(cfg\.)?onboardingEstimates/.test(tandemHtml) ||
        /startW\s*=\s*\(?\s*cfg\s*&&\s*cfg\.onboardingEstimates/.test(tandemHtml)) {
      fail('D22', 'tandem.html still assigns an onboarding estimate directly to startW — the estimate must enter as a 1RM through prescriptionOneRM, never as a working load');
    }
    // And the estimate must never be written into the EARNED stores.
    d22Checked++;
    if (/(tandem_prs|tandem_working1rm)[\s\S]{0,200}?onboardingEstimates/.test(tandemHtml)) {
      fail('D22', 'an onboarding estimate is being written into an EARNED 1RM store (tandem_prs / tandem_working1rm) — a self-reported number must never become an earned one');
    }
  }
}

// The ladder lives in tandem.html because it needs the user's EARNED working RM, which
// the headless engine cannot see (the boundary D20 drew). "It lives in tandem.html" is
// NOT an excuse for an unassertable invariant — this block regex-extracts the helper and
// vm-evals it, the same way D12 tests calcRM and D14 tests effectiveReps.
let d21Checked = 0;
{
  const tandemHtml = readFileSync(join(root, 'tandem.html'), 'utf8');
  const calcMatch = tandemHtml.match(/function calcRM\(w, r\) \{[\s\S]*?\n\}/);
  const bandMatch = tandemHtml.match(/const TIER_REP_BAND = (\[[^\]]*\]);/);
  const ceilMatch = tandemHtml.match(/const TIER_REP_CEILING = (\d+);/);
  const tierMatch = tandemHtml.match(/function tierSetsFor\(rm, anchorReps, sets\) \{[\s\S]*?\n\}\n/);
  // D24: the ladder rounds through programs.js's shared roundToStep. Inject the REAL
  // source rather than a copy — a hardcoded `Math.round(x/2.5)*2.5` here would be a
  // second implementation of the rounding rule living inside the gate that exists to
  // stop exactly that, and it would keep passing after the shipped constant changed.
  const stepFnMatch = code.match(/function roundToStep\(w\) \{[^}]*\}/);
  const stepConstMatch = code.match(/const LOAD_STEP_LBS = ([\d.]+);/);
  if (!calcMatch || !bandMatch || !ceilMatch || !tierMatch || !stepFnMatch || !stepConstMatch) {
    // Deliberately a FAILURE, not a skip. D9 can legitimately skip when getSingleDay is
    // not exported; a missing tierSetsFor means the shipped feature has no gate at all.
    fail('D21', 'could not locate tierSetsFor/TIER_REP_BAND/TIER_REP_CEILING/calcRM in tandem.html, or LOAD_STEP_LBS/roundToStep in programs.js — the ladder must stay a top-level, stably-named helper depending only on calcRM and the shared rounding, or this invariant becomes unassertable');
  } else {
    const bundle = `(function(){
      ${calcMatch[0]}
      ${stepConstMatch[0]}
      ${stepFnMatch[0]}
      const TIER_REP_BAND = ${bandMatch[1]};
      const TIER_REP_CEILING = ${ceilMatch[1]};
      ${tierMatch[0]}
      return { calcRM, tierSetsFor, TIER_REP_BAND, TIER_REP_CEILING };
    })()`;
    const { calcRM, tierSetsFor, TIER_REP_BAND, TIER_REP_CEILING } = vm.runInNewContext(bundle);

    // (1) THE BAND IS D10'S BAND, not a second copy that can drift.
    d21Checked++;
    const bmBand = REP_BANDS.build_muscle;
    if (TIER_REP_BAND[0] !== bmBand[0] || TIER_REP_BAND[1] !== bmBand[1]) {
      fail('D21', `TIER_REP_BAND ${JSON.stringify(TIER_REP_BAND)} != D10's build_muscle band ${JSON.stringify(bmBand)} — the ladder clamps to D10, it does not get its own band`);
    }
    // The ceiling is a CONSEQUENCE of D12, not a preference: above it, calcRM is floored
    // and returns the same value, so the inverse cannot tell two loads apart.
    d21Checked++;
    if (calcRM(1, TIER_REP_CEILING) >= calcRM(1, TIER_REP_CEILING + 1)) {
      // expected — the floor is engaged exactly here
    } else {
      fail('D21', `TIER_REP_CEILING ${TIER_REP_CEILING} is not where calcRM stops discriminating loads — it must be the last rep count above which calcRM is flat, or the ladder emits equal weights at different reps`);
    }

    // (2) APPLIED — a plausible earned RM at the canonical anchor yields the classic cadence.
    d21Checked++;
    const ladder = tierSetsFor(225, 9, 4);
    if (!ladder || ladder.length !== 4) {
      fail('D21', `tierSetsFor(225, 9, 4) returned ${ladder ? ladder.length + ' rungs' : 'null'} — an anchor of 9 over 4 sets must derive the full 12·10·8·6 cadence`);
    } else {
      const reps = ladder.map(t => t.reps);
      if (reps.join('·') !== '12·10·8·6') fail('D21', `anchor 9 derived ${reps.join('·')}, expected the derived pyramid cadence 12·10·8·6`);
      for (let i = 1; i < ladder.length; i++) {
        d21Checked++;
        if (ladder[i].reps >= ladder[i - 1].reps) fail('D21', `anchor 9 rung ${i}: reps ${ladder[i].reps} not strictly below ${ladder[i - 1].reps} — a tiered ladder descends in reps`);
        if (ladder[i].weight <= ladder[i - 1].weight) fail('D21', `anchor 9 rung ${i}: weight ${ladder[i].weight} not strictly above ${ladder[i - 1].weight} — at a plausible RM the load must climb as reps fall`);
      }
    }

    // (3) EVERY reachable build_muscle anchor: in-band, no duplicate rung, reps strictly
    // descending, weight NON-DECREASING. Non-decreasing rather than strictly ascending is
    // deliberate and is not a weakened gate: 2.5 lb is the smallest loadable increment, so
    // on a light lift two adjacent rungs can honestly round to the same weight. Forcing a
    // synthetic bump to make the assertion prettier would be fabricating a prescription.
    for (const anchor of [6, 7, 8, 9, 10, 11, 12]) {
      for (const rm of [45, 95, 135, 225, 405]) {
        const l = tierSetsFor(rm, anchor, 4);
        d21Checked++;
        if (!l || l.length < 2) { fail('D21', `tierSetsFor(${rm}, ${anchor}, 4) returned ${l ? l.length + ' rungs' : 'null'} — every in-band anchor with an earned RM must yield a real (>=2 rung) ladder`); continue; }
        const seen = new Set();
        for (let i = 0; i < l.length; i++) {
          const { reps, weight } = l[i];
          if (reps < bmBand[0] || reps > Math.min(bmBand[1], TIER_REP_CEILING)) fail('D21', `anchor ${anchor}/rm ${rm}: rung of ${reps} reps escapes D10's clamped band`);
          if (seen.has(reps)) fail('D21', `anchor ${anchor}/rm ${rm}: duplicate rung at ${reps} reps — a band-edge clamp collision must be de-duplicated, not emitted twice`);
          seen.add(reps);
          if (i > 0 && reps >= l[i - 1].reps) fail('D21', `anchor ${anchor}/rm ${rm}: reps ${reps} not below ${l[i - 1].reps}`);
          if (i > 0 && weight < l[i - 1].weight) fail('D21', `anchor ${anchor}/rm ${rm}: weight ${weight} DROPS below ${l[i - 1].weight} as reps fall — the ladder must never descend in load`);
        }
        // The user-visible claim: heaviest rung is the last one.
        d21Checked++;
        if (l[l.length - 1].weight < l[0].weight) fail('D21', `anchor ${anchor}/rm ${rm}: final rung is lighter than the first — this is not an ascending-load ladder`);
      }
    }

    // (4) CLAMPED at the band edges — still in-band, still no duplicate (covered above for
    // anchor 6); an anchor OUTSIDE the band derives nothing rather than being forced.
    d21Checked++;
    if (tierSetsFor(225, 3, 4) !== null) {
      fail('D21', 'tierSetsFor with a realization-week anchor (REALIZATION_REPS = 3) returned a ladder — a max test is not a pyramid, and an out-of-band anchor must be flagged out, not clamped in');
    }
    d21Checked++;
    if (tierSetsFor(225, 16, 4) !== null) fail('D21', 'tierSetsFor accepted an anchor above D10\'s build_muscle band');

    // (5) NO INVENTED RM — D11 is SAFETY and outranks this whole invariant.
    for (const bad of [null, undefined, 0, -5, NaN, '225']) {
      d21Checked++;
      if (tierSetsFor(bad, 9, 4) !== null) {
        fail('D21', `tierSetsFor(${String(bad)}, 9, 4) returned a ladder — without an EARNED 1RM there is no ladder (D11 is SAFETY: an unearned 1RM is never synthesized)`);
      }
    }

    // (6) FORMULA SINGLE-SOURCE — the ladder inverts D12's live calcRM; it must not have
    // grown a private copy of Epley/Mayhew. Same two-copies-drift guard D19/D20 apply.
    d21Checked++;
    if (!/\bcalcRM\s*\(/.test(tierMatch[0])) {
      fail('D21', 'tierSetsFor does not call calcRM — rung weights must be the exact inverse of D12\'s live formula, not a re-derivation');
    }
    for (const lit of [/1\s*\+\s*r\s*\/\s*30/, /\b52\.2\b/, /\b41\.9\b/, /1\s*\+\s*reps\s*\/\s*30/]) {
      d21Checked++;
      if (lit.test(tierMatch[0])) {
        fail('D21', `tierSetsFor contains a hardcoded 1RM coefficient (${lit}) — that is a second copy of D12 that will silently diverge, exactly at the clamped high-rep rungs where the Mayhew branch takes over`);
      }
    }
    // Inversion is EXACT, verified by running both directions — not argued from linearity.
    for (const rm of [95, 225, 405]) {
      for (const r of [6, 8, 10, 12]) {
        d21Checked++;
        const l = tierSetsFor(rm, 9, 4);
        const rung = l && l.find(t => t.reps === r);
        if (rung && rung.weight !== Math.round((rm / calcRM(1, r)) / 2.5) * 2.5) {
          fail('D21', `rm ${rm} rung ${r}: weight ${rung.weight} != rm / calcRM(1, ${r}) rounded to the 2.5 lb loadable increment`);
        }
      }
    }

    // (7) SCOPED AND INERT ELSEWHERE — the call site, not just the helper. A correct helper
    // called unconditionally would put a ladder on the entire weekly periodized program and
    // on isolation work. Both scope tokens must appear in the guard expression itself.
    const guard = tandemHtml.match(/const tierSets = \(([^)]*)\)/);
    d21Checked++;
    if (!guard) {
      fail('D21', 'could not locate the tierSets guard expression in tandem.html — D21\'s scope is part of the invariant, not an implementation detail (the D16 scope ruling, applied here)');
    } else {
      for (const tok of ['ex.compound', "goalKey === 'build_muscle'", 'day.oneOff']) {
        d21Checked++;
        if (!guard[1].includes(tok)) {
          fail('D21', `the tierSets guard \`${guard[1].trim()}\` does not gate on ${tok} — the ladder is scoped to the ONE-OFF build_muscle wizard's COMPOUNDS only; fat_burn, transform, isolation and the weekly program must never acquire one`);
        }
      }
    }
    // buildSetRows must actually consume the ladder, or the guard gates a no-op.
    d21Checked++;
    if (!/function buildSetRows\(id, sets, w, r, unit, tierSets\)/.test(tandemHtml)) {
      fail('D21', 'buildSetRows does not take a tierSets parameter — the derived per-set prescription never reaches the rendered rows');
    }
  }
}

// ── PENDING invariants — the rest of the law, enforced as each phase ships ─────
// Promote to ACTIVE (write the assertion above) when the phase lands. Do NOT delete.
const PENDING = [
  ['D4b', 'Deload cadence scales with training age (RP: 3-4wk advanced vs up to 12wk beginner); cfg.experience exists but the deload layer ignores it. Per-experience numbers deliberately NOT invented — needs a ruling + a citation', 'when ruled'],
  ['D6b', 'Per-muscle weekly volume within goal MEV..MRV band + within-block MEV→MRV ramp (Finding 3 remainder + 4)', 'per-length meso'],
  ['D8', 'Strength goal uses ZERO supersets on primary lifts; Maintenance caps at MAV volume', 'when goals added'],
  ['D17', 'No database object (view/function/trigger) may emit a prescriptive load — closes the blind spot that let a fixed +/-2.5% ratchet live in a Postgres view (BUG-38/BUG-72) while file-side D11 reported 882/882 green. Tier SAFETY (same class as D11). Enforcement: Kerwin ruled option (b) 2026-08-17 — a DB-connected sweep, scripts/d17-db-sweep.mjs, run manually until a CI service-role credential exists. Ran live 2026-08-17: 0 hits. NOT wired into this gate — doing so today would itself be the failure this invariant is about, a check claiming to see what it cannot', 'when a CI DB credential exists'],
];

// ── Report ─────────────────────────────────────────────────────────────────────
console.log(`DOCTRINE CONFORMANCE — Notion law is enforced here (mirror: /DOCTRINE.md)\n`);
console.log(`Active checks:`);
console.log(`  D1  exercise stability within a block   — ${d1Checked} combos checked, ${d1BoundaryVaried} refresh at boundary`);
console.log(`  D2  canonical goals generate legal programs`);
console.log(`  D3  compound-first ordering`);
console.log(`  D4  deloads per Part B length table — ${d4Checked} deload weeks checked (reduced volume, tagged, block-final)`);
console.log(`  D7  per-length mesocycle layout matches spec Part B verbatim — ${d7Checked} lengths pinned`);
console.log(`  D5  superset/circuit goals (Transform + Fat Burn), never on primary — ${d5Checked} programs checked`);
console.log(`  D9  one-off "Build Me a Workout" conformance — ${d9Checked} focus×tier sessions (exempt from D1/D4/D7 by design)`);
console.log(`  D6  weekly volume scales by goal in MEV order (T≥BM≥FB) — ${d6Checked} split×sex checked`);
console.log(`  D10 rep schemes within each goal's taxonomy band — ${d10Checked} phase-week reps checked`);
console.log(`  D11 monotonic %1RM overload + earned-only 1RM, live weekFactor() across the full 4-24wk range — ${d11Checked} week-steps checked`);
console.log(`  D12 multi-formula 1RM (Epley/Mayhew), monotonic in reps — ${d12Checked} checks`);
console.log(`  D13 goal-specific deload intensity (Hypertrophy dips, others maintain) — ${d13Checked} deload-weeks checked`);
console.log(`  D14 realization weeks (final-week strength test, not a light week) — ${d14Checked} checks`);
console.log(`  D15 primary compounds held for a whole primary block (>=8wk, mesocycle-aligned; <=15wk = one block) — ${d15Checked} assertions over T=4..24`);
console.log(`  D18 every slot's candidate pool is non-empty at every tier (BUG-82) — ${d18Checked} call-site×tier checks (0 allowlisted gaps — BUG-88's 4 pre-existing home-tier gaps closed Cycle 55)`);
console.log(`  D19 muscle-group matching is anchored at '_' — a slot returns what it asked for (BUG-87) — ${d19Checked} token×tag checks against the live compiled rule, both engines`);
console.log(`  D20 one-off soft-deprioritizes a recently-trained muscle, reuses RECOVERY_PARAMS, inert by default (EPIC-028) — ${d20Checked} assertions over focus×tier×window (no-op + inert permutations + steer-fires, exact-key and anchored-parent + never-empty and byte-identical under saturation + never costs a slot + call site sources the ruled threshold)`);
console.log(`  D22 onboarding estimate is a submaximal RM — converted via D12's live calcRM, never prescribed raw, never outranks an earned number — ${d22Checked} assertions (conversion identity + conservative range-bottom + no invented RM + no private copy of the formula + earned-always-wins resolution order + the raw-prefill branch is gone)`);
console.log(`  D23 one rest owner (PHASES; authoredRest is the only deviation channel) + no heading claims a rest it does not own — ${d23Checked} assertions over one-off focus×goal and weekly goal×split (generated days author no rest + supersets surface SUPERSET_CFG where the renderer can see it + heading numbers match their lines + experience cannot move rest)`);
console.log(`  D24 load progression is a PERCENTAGE of the load actually lifted, from one owner, rounded in one home — ${d24Checked} assertions over goal×phase (dead incComp/incAcc/pctTop/pctInc columns gone + every rate inside ACSM's 2-10% band + accessory rate derived not tabulated + degenerate phase falls back to the floor + the step provably scales with the load + no private copy of the rounding + each granularity declared exactly once + no display advertises pounds)`);
console.log(`  D25 one owner per generated default; the uncited timed-hold fallback is proved unreachable — ${d25Checked} assertions (both engines route through defaultPrescription + no inline copy survives + every unit:'sec' bank entry declares its own secs + the helper returns the entry's number, never the fallback)`);
console.log(`  D26 one sex-aware seed-weight owner; no lookup key names an exercise that does not exist — ${d26Checked} assertions (seedWeight/bankEntryByName own it + SEED_WEIGHTS/SEED_BASE_LBS declared once + DEFAULT_WEIGHTS/NSCA_DEFAULTS stay deleted + no inline equipment-ternary table regrows + every matrix key resolves in EXERCISE_BANK + no loaded lift is sex-blind + all three engines hand the same user the same number, proved by running them + every call site passes sex)`);
if (d26SeedCoverageGaps.length) {
  console.log(`      ⚠️ D26 flagged gap (not a violation, deliberately unfilled): EPIC-9's two seed matrices cover different lifts, so ${d26SeedCoverageGaps.length} lift(s) get a curated number for one sex and the generic equipment floor for the other — ${d26SeedCoverageGaps.join(', ')}. Filling these means inventing numbers no source states. Needs a ruling + a citation.`);
}
console.log(`  D21 one-off tiered-set ladder: compounds only, build_muscle only, weight derived by inverting D12's live calcRM against an EARNED RM — ${d21Checked} assertions (derived cadence + band clamp + no duplicate rung + never-descending load + no invented RM + no private copy of the 1RM formula + call-site scope)`);
if (d16Seeds > 0) {
  console.log(`  D16 authored seeds: SAFETY always, overrides cited — ${d16Seeds} seed(s), ${d16Checked} checks`);
} else {
  console.log(`  D16 authored-seed gate ARMED (no seeds/ dir yet — 0 seeds validated)`);
}
console.log(`\nTiers (D16 two-tier doctrine): SAFETY = every path, no override; SCIENCE_DEFAULT = generated`);
console.log(`path default, authored programs may deviate only via cited science_overrides.`);
const tierList = (t) => [
  ...Object.entries(TIERS).filter(([, v]) => v === t).map(([k]) => k),
  ...Object.entries(CLAUSE_TIERS).filter(([, v]) => v === t).map(([k]) => `+${k}`),
].join(' ');
console.log(`  SAFETY: ${tierList('SAFETY')}`);
console.log(`  SCIENCE_DEFAULT: ${tierList('SCIENCE_DEFAULT')}`);
console.log(`  overridable via cited principle: ${Object.entries(OVERRIDE_KEYS).map(([id, k]) => `${id}→${k}`).join(', ')} (registry: D16 Notion page)`);
console.log(`\nPending (documented law, enforced when its phase ships):`);
for (const [id, desc, phase] of PENDING) console.log(`  ⏳ ${id}  ${desc}  [${phase}]`);

if (failures.length) {
  console.log(`\n${failures.length} DOCTRINE VIOLATION(S) — a change drifted from Notion law:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  console.log(`\nFix the code to conform, or if the DOCTRINE itself changed, update Notion +`);
  console.log(`/DOCTRINE.md + this gate together (never weaken the gate to pass).`);
  process.exit(1);
}
console.log(`\nAll active doctrine invariants hold. ✓`);
process.exit(0);
