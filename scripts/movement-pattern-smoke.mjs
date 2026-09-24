#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// movement-pattern-smoke.mjs — REGRESSION GUARD for BUG-151 / D30.
//
// D30 (promoted PENDING → ACTIVE the same commit this script shipped in — see
// /DOCTRINE.md): no two COMPOUND exercises of the same movement pattern in one
// SESSION. BUG-151 was the reported symptom — a one-off "Muscle Gain / Back"
// workout served Barbell Row AND Pendlay Row, the same horizontal-pull pattern
// twice, orphaning the bank's only vertical-pull compounds. Root cause: the
// select()/bank() comparators had no movement-pattern awareness — and MEASURED,
// not assumed: a first placement attempt (patternClash ranked between
// equipmentAvailabilityRank and freeWeightRank, matching a literal reading of
// "thread it in ABOVE FREE_WEIGHT_RANK") left the bug UNFIXED, because back's
// 2-muscle slot's coverageCount tiebreak decides the winner before patternClash
// is ever reached. Fix ships with patternClash ranked ABOVE coverageCount too
// (see its declaration in programs.js for the full comparison), verified by
// re-running this exact sweep before and after moving it.
//
// This gate sweeps BOTH engines broadly, not just the reported back/full_gym
// case — the exact axis this project has paid for skipping twice (BUG-73 fixed
// one label's muscle-group vocabulary; BUG-114 was the identical defect
// recurring under a different label 5 weeks later, CLAUDE.md's "fix the
// mechanism, not the instance" rule exists because of it):
//   - getSingleDay: every FOCUS_SLOTS key (9) × every TIERS value (3) ×
//     every GOALS value (3) = 81 combos.
//   - buildDynamicProgram, called DIRECTLY (see SCOPE note below): every
//     GOALS × DAY_COUNTS × SEXES × TIERS combo = 90 combos.
//
// SCOPE OF THE ASSERTION, stated honestly (this is not the whole story of
// what a real user sees — see the KNOWN GAP section below):
//
// 1. patternClash is scoped PER SESSION — one getSingleDay() call, or one
//    buildDynamicProgram() TEMPLATES-day / Shoulders+Arms-day (reset per day,
//    not shared across the week — D30 says "one session," a session is one
//    training day, and buildDynamicProgram is called once per FULL PROGRAM).
//
// 2. This script calls buildDynamicProgram() DIRECTLY, not getProgram(). That
//    is a deliberate, measured choice, not an oversight: getProgram() wraps
//    buildDynamicProgram()'s output through build2()/ppl()/build5()/build6()
//    (day-count-specific RECOMBINATION of the 4 canonical template days into
//    2/3/5/6-day splits) and then through pruneInjuries()/applyGoalVolume()/
//    applySupersets()/applyDeload() — none of which are patternClash-aware,
//    because none of them select exercises through select()/bank() at all;
//    they operate on already-built day objects. Calling buildDynamicProgram()
//    directly isolates exactly what the comparator mechanism this bug fixes
//    can promise: no clash WITHIN one generated session, at generation time.
//    Measured directly (2026-09-24): buildDynamicProgram() itself, called for
//    every goal×day-count×sex×tier combo, produces the home-tier gap below and
//    NOTHING else — 0 unexplained clashes. Calling getProgram() (the full
//    pipeline) on the SAME matrix instead shows 432 residual clashing days —
//    entirely attributable to the wrap/pipeline layer, not to the comparator,
//    confirmed by this A/B (same inputs, only the call target differs).
//
// KNOWN GAP #1 — bank coverage, not a comparator defect (disclosed, not an
// allowlisted failure): at 'home' tier, EVERY back/pull compound in
// EXERCISE_BANK is horizontal_pull-pattern (Band Row, Table Inverted Row) —
// even bodyweight Pull-Up/Chin-Up are tagged tier:'hotel_gym', not 'home'.
// patternClash is SOFT (D18/D20/D31's "never hard-excludes" shape) — it can
// only reorder existing candidates, never invent one, so a slot with no
// alternative-pattern candidate at all cannot be fixed by this mechanism.
// Same root cause, same shape, in both engines. ALLOWLISTED below by exact
// combo, not silently ignored — any NEW clash outside this exact set fails.
//
// KNOWN GAP #2 — the wrap/pipeline layer (build2/ppl/build5/build6 recombining
// canonical days, plus pruneInjuries' static injury-block substitution, which
// getProgram()'s own comment already names as bypassing "the bank-level
// filter inside the generator"). Measured at 432/630 combos' worth of
// clashing days in REAL getProgram() output — larger than this bug's own
// scope-lock (select()/bank() comparator mechanism only). NOT asserted against
// here; reported informationally so the number is on record. Filed as its own
// Bug Log row (BUG-154) rather than fixed off-book, per this project's
// discovery_handling rule.
//
// Run: node scripts/movement-pattern-smoke.mjs
// ═══════════════════════════════════════════════════════
import vm from 'vm';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const code = readFileSync(resolve(__dirname, '../programs.js'), 'utf8');
const { getProgram, getSingleDay, buildDynamicProgram, EXERCISE_BANK, FOCUS_SLOTS, movementPatternOf } = vm.runInNewContext(
  `(function() { ${code}; return { getProgram, getSingleDay, buildDynamicProgram, EXERCISE_BANK, FOCUS_SLOTS, movementPatternOf }; })()`,
  { console }
);

import { GOALS, DAY_COUNTS, SEXES, TIERS, combos } from './lib/persona-combos.mjs';

let failures = 0;
const fails = [];
function check(label, cond) {
  if (!cond) { failures++; fails.push(label); }
}

// Sanity: movementPatternOf must actually resolve real bank entries (proves
// the vm extraction picked up the real function, not a stale/empty one).
check('movementPatternOf resolves Barbell Row to horizontal_pull',
  movementPatternOf(EXERCISE_BANK['barbell-row']) === 'horizontal_pull');
check('movementPatternOf resolves Pull-Up to vertical_pull',
  movementPatternOf(EXERCISE_BANK['pull-up']) === 'vertical_pull');
check('movementPatternOf resolves Barbell Back Squat to squat',
  movementPatternOf(EXERCISE_BANK['barbell-back-squat']) === 'squat');

function compoundPatternsInDay(day) {
  const patterns = [];
  for (const b of (day.blocks || [])) {
    if (b.cardio) continue;
    for (const ex of (b.exs || [])) {
      if (!ex.compound) continue;
      const p = movementPatternOf({ name: ex.name });
      if (p) patterns.push({ name: ex.name, pattern: p });
    }
  }
  return patterns;
}

function findClash(patterns) {
  const seen = new Map();
  for (const { name, pattern } of patterns) {
    if (seen.has(pattern)) return { pattern, a: seen.get(pattern), b: name };
    seen.set(pattern, name);
  }
  return null;
}

// KNOWN GAP #1's exact, itemized allowlist — any clash NOT matching one of
// these predicates is a real failure, not an expected one.
const isKnownHomeTierBackPullGap = (clash) =>
  clash.pattern === 'horizontal_pull' &&
  /Row$/.test(clash.a) && /Row$/.test(clash.b); // the bank's only home-tier back/pull compounds are both row variants

// ── 1. getSingleDay sweep: every focus × every tier × every goal ──
const focuses = Object.keys(FOCUS_SLOTS);
let oneOffChecked = 0;
const oneOffUnexpected = [];
const oneOffKnownGap = [];
for (const focus of focuses) {
  for (const tier of TIERS) {
    for (const goal of GOALS) {
      oneOffChecked++;
      let day;
      try {
        day = getSingleDay(focus, { tier, goal, sex: 'male' });
      } catch (e) {
        oneOffUnexpected.push({ combo: `${focus}/${tier}/${goal}`, error: String(e) });
        continue;
      }
      if (!day) continue; // some focuses may legitimately return null at some tier/goal combos
      const clash = findClash(compoundPatternsInDay(day));
      if (!clash) continue;
      const row = { combo: `${focus}/${tier}/${goal}`, ...clash };
      if (tier === 'home' && isKnownHomeTierBackPullGap(clash)) oneOffKnownGap.push(row);
      else oneOffUnexpected.push(row);
    }
  }
}
check(`getSingleDay: 0 UNEXPECTED same-pattern-compound clashes across ${oneOffChecked} focus×tier×goal combos (found ${oneOffUnexpected.length}; ${oneOffKnownGap.length} matched the disclosed home-tier back/pull bank-coverage gap)`,
  oneOffUnexpected.length === 0);

// ── 2. buildDynamicProgram sweep — called DIRECTLY, see the SCOPE note above ──
let weeklyChecked = 0;
const weeklyUnexpected = [];
const weeklyKnownGap = [];
for (const goal of GOALS) {
  for (const days of DAY_COUNTS) {
    for (const sex of SEXES) {
      for (const tier of TIERS) {
        weeklyChecked++;
        let program;
        try {
          program = buildDynamicProgram(goal, days, 12, sex, tier, 'balanced', '', null, null);
        } catch (e) {
          weeklyUnexpected.push({ combo: `${goal}/${days}d/${sex}/${tier}`, error: String(e) });
          continue;
        }
        if (!Array.isArray(program)) continue;
        for (const day of program) {
          const clash = findClash(compoundPatternsInDay(day));
          if (!clash) continue;
          const row = { combo: `${goal}/${days}d/${sex}/${tier} / ${day.key}`, ...clash };
          if (tier === 'home' && isKnownHomeTierBackPullGap(clash)) weeklyKnownGap.push(row);
          else weeklyUnexpected.push(row);
        }
      }
    }
  }
}
check(`buildDynamicProgram (called directly): 0 UNEXPECTED same-pattern-compound clashes across ${weeklyChecked} goal×day-count×sex×tier combos (found ${weeklyUnexpected.length}; ${weeklyKnownGap.length} matched the disclosed home-tier back/pull bank-coverage gap)`,
  weeklyUnexpected.length === 0);

// ── 3. getProgram() full pipeline — INFORMATIONAL ONLY, does not gate ──
// See KNOWN GAP #2 above. Filed as BUG-154, not fixed here.
let pipelineChecked = 0, pipelineClashDays = 0;
for (const { args } of combos()) {
  pipelineChecked++;
  let program;
  try { program = getProgram(...args); } catch { continue; }
  if (!Array.isArray(program)) continue;
  for (const day of program) if (findClash(compoundPatternsInDay(day))) pipelineClashDays++;
}

// ── Report ───────────────────────────────────────────────
console.log('── movement-pattern-smoke (D30 / BUG-151) ──');
for (const c of oneOffUnexpected.slice(0, 10)) console.log(`  UNEXPECTED getSingleDay clash: ${JSON.stringify(c)}`);
for (const c of weeklyUnexpected.slice(0, 10)) console.log(`  UNEXPECTED buildDynamicProgram clash: ${JSON.stringify(c)}`);
console.log(`  (disclosed home-tier gap matched: ${oneOffKnownGap.length} one-off, ${weeklyKnownGap.length} weekly)`);
console.log(`  INFORMATIONAL — getProgram() full pipeline (KNOWN GAP #2, BUG-154, not gated here): ${pipelineClashDays} clashing days across ${pipelineChecked} persona combos`);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED: ${fails.join('; ')}`);
  process.exit(1);
}
console.log(`\nPASS — 0 unexpected same-pattern-compound clashes: ${oneOffChecked} getSingleDay combos, ${weeklyChecked} buildDynamicProgram combos.`);
