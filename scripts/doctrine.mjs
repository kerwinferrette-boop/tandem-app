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
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);
const code = readFileSync(join(root, 'programs.js'), 'utf8');
const { getProgram, EXERCISE_BANK, getSingleDay, ONEOFF_FOCUSES } = vm.runInNewContext(
  `(function(){ ${code}; return { getProgram, EXERCISE_BANK, getSingleDay, ONEOFF_FOCUSES }; })()`, {});

const TIER_ORDER = ['home', 'hotel_gym', 'full_gym'];
const TIER_BY_NAME = {};
for (const e of Object.values(EXERCISE_BANK)) if (e && e.name) TIER_BY_NAME[e.name.trim().toLowerCase()] = e.tier;

const CANONICAL_GOALS = ['build_muscle', 'fat_burn', 'transform']; // 5-Goal Taxonomy: 3 live (+strength, +maintenance pending)
const DAYS = [2, 3, 4, 5];        // 6-day (ppl2) is Phase 4 — added to this list when it ships
const SEXES = ['male', 'female'];
const PHASES = [0, 1, 2, 3];      // the 4 mesocycle blocks scaledPhases spreads across the program
const gen = (goal, days, sex, week, phase) =>
  getProgram(goal, days, 12, sex, 'full_gym', 'balanced', null, null, { week, phase });
const dayNames = (day) => (day.blocks || []).flatMap(b => (b.exs || []).map(e => e.name));
const progNames = (p) => (p || []).map(dayNames);
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
} else {
  console.log('  (note: getSingleDay not yet exported — D9 skipped)');
}

// ── PENDING invariants — the rest of the law, enforced as each phase ships ─────
// Promote to ACTIVE (write the assertion above) when the phase lands. Do NOT delete.
const PENDING = [
  ['D4', 'Deload week present per the Part B length table (every 4-6 wk, block-final, reduced volume)', 'Phase 2 / 5'],
  ['D5', 'Transform is superset-driven; supersets present where the 5-Goal Taxonomy requires them', 'Phase 3'],
  ['D6', 'Weekly working-set volume per muscle stays within the goal MEV..MRV band (v0.5 table)', 'later'],
  ['D7', 'Per-length mesocycle layout (4-12 wk) matches the spec Part B table exactly', 'Phase 5'],
  ['D8', 'Strength goal uses ZERO supersets on primary lifts; Maintenance caps at MAV volume', 'when goals added'],
];

// ── Report ─────────────────────────────────────────────────────────────────────
console.log(`DOCTRINE CONFORMANCE — Notion law is enforced here (mirror: /DOCTRINE.md)\n`);
console.log(`Active checks:`);
console.log(`  D1  exercise stability within a block   — ${d1Checked} combos checked, ${d1BoundaryVaried} refresh at boundary`);
console.log(`  D2  canonical goals generate legal programs`);
console.log(`  D3  compound-first ordering`);
console.log(`  D9  one-off "Build Me a Workout" conformance — ${d9Checked} focus×tier sessions (exempt from D1/D4/D7 by design)`);
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
