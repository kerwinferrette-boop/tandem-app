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
 * matches a program_principles row — claim + rationale + citation). The D1-D15
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
const { getProgram, EXERCISE_BANK, getSingleDay, ONEOFF_FOCUSES, deloadWeeks, realizationWeek, PHASES: GOAL_PHASES } = vm.runInNewContext(
  `(function(){ ${code}; return { getProgram, EXERCISE_BANK, getSingleDay, ONEOFF_FOCUSES, deloadWeeks, realizationWeek, PHASES }; })()`, {});

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

// ── D15 (ACTIVE) — Primary compounds fixed for the WHOLE program ───────────────
// Periodization Spec Part A already concluded "Primary compounds: fixed for the
// whole program (progression tracked end-to-end)" but pick() never implemented
// it — compounds rotated at every block boundary same as accessories, same as
// everything else D1 governs. research-report(9) (Valyu, 2026-07-23) gave the
// number that confirms the original spec: compounds fixed 8-12wk minimum, which
// for a <=12wk Tandem program IS the whole program. This is stronger than D1
// (block-stable): the Compound Block's exercise names must be IDENTICAL across
// every phase of the program, not just within one block — verified across the
// program's full 4-phase span (phase 0 vs phase 3), unlike D1's block-adjacent check.
let d15Checked = 0;
for (const goal of CANONICAL_GOALS) for (const days of DAYS) for (const sex of SEXES) {
  d15Checked++;
  const c0 = compoundNames(gen(goal, days, sex, 1, 0));
  const c3 = compoundNames(gen(goal, days, sex, 10, 3));
  if (!eqDeep(c0, c3)) fail('D15', `${goal}/${days}d/${sex}: Compound Block exercises changed between phase 0 (wk1) and phase 3 (wk10) — primary compounds must be fixed for the whole program`);
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
  // supersets are available on the one-off (opt-in) — and never on its compound block
  for (const focus of ['chest', 'legs', 'pull']) {
    const day = getSingleDay(focus, { tier: 'full_gym', supersets: true });
    if (!(day?.blocks || []).some(b => b.superset)) fail('D9', `one-off ${focus} with supersets:true produced no superset block`);
    if ((day?.blocks || []).some(b => /compound/i.test(b.label || '') && b.superset)) fail('D9', `one-off ${focus}: compound block was supersetted`);
  }
} else {
  console.log('  (note: getSingleDay not yet exported — D9 skipped)');
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

// ── PENDING invariants — the rest of the law, enforced as each phase ships ─────
// Promote to ACTIVE (write the assertion above) when the phase lands. Do NOT delete.
const PENDING = [
  ['D4b', 'Deload cadence scales with training age (RP: 3-4wk advanced vs up to 12wk beginner); cfg.experience exists but the deload layer ignores it. Per-experience numbers deliberately NOT invented — needs a ruling + a citation', 'when ruled'],
  ['D6b', 'Per-muscle weekly volume within goal MEV..MRV band + within-block MEV→MRV ramp (Finding 3 remainder + 4)', 'per-length meso'],
  ['D8', 'Strength goal uses ZERO supersets on primary lifts; Maintenance caps at MAV volume', 'when goals added'],
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
console.log(`  D15 primary compounds fixed for the whole program — ${d15Checked} combos checked`);
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
