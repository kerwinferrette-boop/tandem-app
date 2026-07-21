// ═══════════════════════════════════════════════════════
// Tandem Persona / SKU Matrix Validator
// Extends validate-programs.mjs (goal × days × sex) with the
// other axes the generator actually branches on today —
// equipment tier and injury profile — and adds structural
// rules for core/cardio presence, injury-leak safety, and
// equipment-tier safety.
//
// Scope note: age, height, weight, and experience level are
// captured at onboarding but NOT passed into getProgram() by
// any call site in tandem.html (verified 2026-07-13) — that
// wiring is EPIC-8, still unstarted. So this harness does not
// vary those axes; doing so today would just re-run the same
// combo N times for no signal. See loop-config.md for the
// standing recommendation to unblock EPIC-8 so those axes
// become meaningful.
//
// Run: npm run validate:personas
// Exit 0 = all rules pass. Exit 1 = one or more failures.
// ═══════════════════════════════════════════════════════

import vm from 'vm';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const code = readFileSync(resolve(__dirname, '../programs.js'), 'utf8');
const { getProgram, EXERCISE_BANK, makeInjuryBlocked } = vm.runInNewContext(
  `(function() { ${code}; return { getProgram, EXERCISE_BANK, makeInjuryBlocked }; })()`,
  { console }
);

// ── Test matrix ──────────────────────────────────────────
const GOALS      = ['fat_burn', 'build_muscle', 'transform'];
const DAY_COUNTS = [2, 3, 4, 5];
const SEXES      = ['male', 'female'];
const TIERS      = ['full_gym', 'hotel_gym', 'home'];
const WEEKS      = 12; // fixed — see validate-programs.mjs R5 for week-length coverage

// One representative phrase per makeInjuryBlocked() keyword rule, plus a
// clean baseline. Not exhaustive of every synonym — enough to exercise
// every ban regex at least once.
const INJURY_PROFILES = [
  { label: 'none',      value: '' },
  { label: 'knee',      value: 'knee pain' },
  { label: 'lowerback', value: 'lower back injury' },
  { label: 'shoulder',  value: 'shoulder impingement' },
  { label: 'elbow',     value: 'tennis elbow' },
  { label: 'wrist',     value: 'wrist pain' },
  { label: 'hip',       value: 'hip pain' },
];

const TIER_ORDER = ['home', 'hotel_gym', 'full_gym'];

// Name → tier lookup from the raw bank, for the equipment-tier-safety rule.
// makeEx() strips `tier` off the output object, so this is the only way to
// check post-generation output against the bank's own tier requirement.
const TIER_BY_NAME = {};
for (const entry of Object.values(EXERCISE_BANK)) {
  if (entry && entry.name) TIER_BY_NAME[entry.name.trim().toLowerCase()] = entry.tier;
}

// ── Helpers ──────────────────────────────────────────────
function getExercises(day) {
  const out = [];
  for (const b of (day.blocks || [])) {
    if (b.cardio) continue;
    for (const ex of (b.exs || [])) {
      if (!ex.cardioOnly) out.push(ex);
    }
  }
  return out;
}

function getCardioBlocks(day) {
  return (day.blocks || []).filter(b => b.cardio);
}

function getAllExerciseNames(day) {
  const out = [];
  for (const b of (day.blocks || [])) {
    for (const ex of (b.exs || [])) out.push(ex.name);
  }
  return out;
}

// R6 — every day has at least one core-tagged exercise
function checkR6(days) {
  const fails = [];
  days.forEach((day, i) => {
    if (!getExercises(day).some(e => e.isCore)) {
      fails.push({ day: i + 1, label: day.label });
    }
  });
  return fails;
}

// R7 — every day has a non-empty cardio block
function checkR7(days) {
  const fails = [];
  days.forEach((day, i) => {
    const cardioBlocks = getCardioBlocks(day);
    const hasCardio = cardioBlocks.some(b => (b.exs || []).length > 0);
    if (!hasCardio) fails.push({ day: i + 1, label: day.label });
  });
  return fails;
}

// R8 — no injury-contraindicated exercise leaks into the program
function checkR8(days, injuryValue) {
  if (!injuryValue) return [];
  const isBlocked = makeInjuryBlocked(injuryValue);
  const fails = [];
  days.forEach((day, i) => {
    for (const name of getAllExerciseNames(day)) {
      if (isBlocked(name)) fails.push({ day: i + 1, exercise: name });
    }
  });
  return fails;
}

// R9 — no exercise exceeds the requested equipment tier
function checkR9(days, tier) {
  const reqIdx = TIER_ORDER.indexOf(tier);
  const fails = [];
  days.forEach((day, i) => {
    for (const name of getAllExerciseNames(day)) {
      const exTier = TIER_BY_NAME[name.trim().toLowerCase()];
      if (exTier == null) continue; // statically-authored exercise not in bank — out of scope for this rule
      if (TIER_ORDER.indexOf(exTier) > reqIdx) {
        fails.push({ day: i + 1, exercise: name, exerciseTier: exTier, requestedTier: tier });
      }
    }
  });
  return fails;
}

// ── Run the matrix ────────────────────────────────────────
const results = [];

for (const goal of GOALS) {
  for (const days of DAY_COUNTS) {
    for (const sex of SEXES) {
      for (const tier of TIERS) {
        for (const inj of INJURY_PROFILES) {
          const combo = `${goal}/${days}d/${sex}/${tier}/${inj.label}`;
          let program;
          try {
            program = getProgram(goal, days, WEEKS, sex, tier, 'balanced', inj.value, null, null);
          } catch (e) {
            results.push({ combo, error: String(e) });
            continue;
          }
          if (!program || !Array.isArray(program)) {
            results.push({ combo, error: 'getProgram returned non-array' });
            continue;
          }
          results.push({
            combo, goal, days, sex, tier, injury: inj.label,
            r6: checkR6(program),
            r7: checkR7(program),
            r8: checkR8(program, inj.value),
            r9: checkR9(program, tier),
          });
        }
      }
    }
  }
}

// ── Summary ──────────────────────────────────────────────
const total = results.length;
let errored = 0;
const r6Fails = [], r7Fails = [], r8Fails = [], r9Fails = [];

for (const row of results) {
  if (row.error) { errored++; continue; }
  if (row.r6.length) r6Fails.push(row);
  if (row.r7.length) r7Fails.push(row);
  if (row.r8.length) r8Fails.push(row);
  if (row.r9.length) r9Fails.push(row);
}

console.log(`\nPersona/SKU matrix: ${total} combos (${GOALS.length} goals × ${DAY_COUNTS.length} day-counts × ${SEXES.length} sexes × ${TIERS.length} tiers × ${INJURY_PROFILES.length} injury profiles)\n`);
console.log(`Errors (generator threw / bad output): ${errored}`);
console.log(`R6 (missing core block):       ${r6Fails.length} combos`);
console.log(`R7 (missing cardio block):     ${r7Fails.length} combos`);
console.log(`R8 (injury-contraindicated leak): ${r8Fails.length} combos`);
console.log(`R9 (equipment-tier violation):    ${r9Fails.length} combos`);

function summarizeByTierDay(fails, ruleName) {
  if (!fails.length) return;
  console.log(`\n${ruleName} failures — grouped by tier/days (combo counts):`);
  const grouped = {};
  for (const row of fails) {
    const key = `${row.tier}/${row.days}d`;
    grouped[key] = (grouped[key] || 0) + 1;
  }
  for (const [key, count] of Object.entries(grouped).sort()) {
    console.log(`  ${key}: ${count}`);
  }
  console.log(`  First 5 examples:`);
  for (const row of fails.slice(0, 5)) {
    console.log(`    ${row.combo}`);
  }
}

summarizeByTierDay(r6Fails, 'R6');
summarizeByTierDay(r7Fails, 'R7');

if (r8Fails.length) {
  console.log(`\nR8 failures (injury leaks) — first 10:`);
  for (const row of r8Fails.slice(0, 10)) {
    for (const f of row.r8) {
      console.log(`  ${row.combo} — Day ${f.day}: "${f.exercise}" should be banned for "${row.injury}"`);
    }
  }
}

if (r9Fails.length) {
  console.log(`\nR9 failures (equipment-tier violations) — first 10:`);
  for (const row of r9Fails.slice(0, 10)) {
    for (const f of row.r9) {
      console.log(`  ${row.combo} — Day ${f.day}: "${f.exercise}" requires tier "${f.exerciseTier}" > requested "${f.requestedTier}"`);
    }
  }
}

const allPass = errored === 0 && r6Fails.length === 0 && r7Fails.length === 0 && r8Fails.length === 0 && r9Fails.length === 0;
console.log(allPass ? '\nAll persona-matrix rules PASS.\n' : '\nOne or more persona-matrix rules FAILED.\n');
process.exit(allPass ? 0 : 1);
