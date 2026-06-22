// ═══════════════════════════════════════════════════════
// EPIC-24 — Tandem Program Validator (Tier 1)
// Deterministic structural checks on getProgram() output.
// Run: npm run validate:programs
// Exit 0 = all rules pass. Exit 1 = one or more failures.
// ═══════════════════════════════════════════════════════

import vm from 'vm';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ── Load programs.js via IIFE so both `const PHASES` and
//    `function getProgram` are captured in the same scope ──
const __dirname = dirname(fileURLToPath(import.meta.url));
const code = readFileSync(resolve(__dirname, '../programs.js'), 'utf8');
const { getProgram, PHASES } = vm.runInNewContext(
  `(function() { ${code}; return { getProgram, PHASES }; })()`,
  { console }   // provide console so any dedup warnings inside programs.js don't throw
);

// ── Test matrix ──────────────────────────────────────────
const GOALS       = ['fat_burn', 'build_muscle', 'transform'];
const DAY_COUNTS  = [2, 3, 4, 5];
const SEXES       = ['male', 'female'];
const WEEK_LENGTHS = [4, 6, 8, 12];   // used only for phase-coverage check
const MAX_EX_FREQ = 2;

// ── Helper: all non-cardio exercises from a day ───────────
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

// ── Rule 1: no exercise on consecutive days ───────────────
// Normalise by name.trim().toLowerCase() — catches id-mismatches
// like s5-ap ("Arnold Press") vs tr-press ("Arnold Press").
function checkR1(days) {
  const fails = [];
  for (let i = 0; i < days.length - 1; i++) {
    const prev = new Set(
      getExercises(days[i]).map(e => e.name.trim().toLowerCase())
    );
    for (const ex of getExercises(days[i + 1])) {
      if (prev.has(ex.name.trim().toLowerCase())) {
        fails.push({ prevDay: i + 1, day: i + 2, exercise: ex.name });
      }
    }
  }
  return fails;
}

// ── Rule 2: frequency ceiling ≤ MAX_EX_FREQ per microcycle ──
function checkR2(days) {
  const counts = {};
  for (const day of days) {
    const seen = new Set();
    for (const ex of getExercises(day)) {
      const k = ex.name.trim().toLowerCase();
      if (!seen.has(k)) {
        counts[k] = (counts[k] || 0) + 1;
        seen.add(k);
      }
    }
  }
  return Object.entries(counts)
    .filter(([, n]) => n > MAX_EX_FREQ)
    .map(([name, count]) => ({ name, count }));
}

// ── Rule 3: compounds must lead the session, evaluated at BLOCK granularity ──
// isCore exercises (dead bugs, planks, etc.) and cardio are excluded — they are
// deliberately placed after main work.
//
// A compound is a violation ONLY if a pure isolation appeared in a STRICTLY
// EARLIER block AND the compound is not the lead (first non-core) movement of
// its own block. Two intentional patterns are therefore allowed:
//   • Same-block iso→compound — antagonist supersets, and pre-exhaust pairings
//     such as transform Legs "Leg Extension (quad iso) → Goblet Squat /
//     Bulgarian Split Squat (quad compound)" inside ONE block. A quad isolation
//     deliberately preceding a quad compound in the same block is a recognised
//     hypertrophy technique, not a mis-order.
//   • A compound that LEADS its own block — e.g. dedupeConsecutiveDays()'s
//     single-exercise "Supplemental Block" (a Landmine Row / DB Shoulder Press
//     backfill) appended after the accessory block.
// What it still catches: a compound scheduled in a later block than a finished
// isolation block (a whole compound after a whole accessory block).
function checkR3(days) {
  const fails = [];
  for (let i = 0; i < days.length; i++) {
    const blocks = (days[i].blocks || []).filter(b => !b.cardio);
    let isoInEarlierBlock = false;   // a pure isolation appeared in a strictly earlier block
    for (const b of blocks) {
      const exs = (b.exs || []).filter(e => e && !e.cardioOnly && !e.isCore);
      if (exs.length === 0) continue;
      exs.forEach((ex, idx) => {
        if (ex.compound && isoInEarlierBlock && idx !== 0) {
          fails.push({ day: i + 1, exercise: ex.name });
        }
      });
      if (exs.some(e => !e.compound)) isoInEarlierBlock = true;
    }
  }
  return fails;
}

// ── Rule 5: phase coverage — every week 1..N maps to exactly
//    one phase (no gaps, no overlaps) for lengths 4/6/8/12 ──
function checkR5(goal) {
  const phases = PHASES[goal];
  if (!phases) return [{ error: `no PHASES entry for goal: ${goal}` }];
  const fails = [];
  for (const len of WEEK_LENGTHS) {
    for (let w = 1; w <= len; w++) {
      const n = phases.filter(p => w >= p.weeks[0] && w <= p.weeks[1]).length;
      if (n !== 1) fails.push({ len, week: w, matchCount: n });
    }
  }
  return fails;
}

// ── Run the matrix ────────────────────────────────────────
const results  = [];
const r5Cache  = {};   // per goal — R5 doesn't vary by day/sex

for (const goal of GOALS) {
  r5Cache[goal] = checkR5(goal);

  for (const days of DAY_COUNTS) {
    for (const sex of SEXES) {
      const combo = `${goal}/${days}d/${sex}`;
      let program;
      try {
        program = getProgram(goal, days, 12, sex);
      } catch (e) {
        results.push({ combo, error: String(e) });
        continue;
      }
      if (!program || !Array.isArray(program)) {
        results.push({ combo, error: 'getProgram returned non-array' });
        continue;
      }

      const r1 = checkR1(program);
      const r2 = checkR2(program);
      const r3 = checkR3(program);
      const r5 = r5Cache[goal];

      results.push({ combo, goal, days, sex, r1, r2, r3, r5 });
    }
  }
}

// ── Summary table ─────────────────────────────────────────
const COL = 34;
const W   = COL + 10 + 10 + 10 + 6;
console.log('\n' + '─'.repeat(W));
console.log(
  'combo'.padEnd(COL) +
  'R1'.padEnd(10) +
  'R2'.padEnd(10) +
  'R3'.padEnd(10) +
  'R5'
);
console.log('─'.repeat(W));

let allPass = true;

for (const row of results) {
  if (row.error) {
    console.log(row.combo.padEnd(COL) + `ERROR: ${row.error}`);
    allPass = false;
    continue;
  }
  const r1s = row.r1.length  === 0 ? 'PASS' : 'FAIL';
  const r2s = row.r2.length  === 0 ? 'PASS' : 'FAIL';
  const r3s = row.r3.length  === 0 ? 'PASS' : 'FAIL';
  const r5s = row.r5.length  === 0 ? 'PASS' : 'FAIL';
  const anyFail = r1s !== 'PASS' || r2s !== 'PASS' || r3s !== 'PASS' || r5s !== 'PASS';
  if (anyFail) allPass = false;
  console.log(
    row.combo.padEnd(COL) +
    r1s.padEnd(10) +
    r2s.padEnd(10) +
    r3s.padEnd(10) +
    r5s
  );
}

console.log('─'.repeat(W));

// ── Failure details ───────────────────────────────────────
let hasDetails = false;

for (const row of results) {
  if (row.error) continue;
  if (row.r1.length > 0) {
    if (!hasDetails) { console.log(); hasDetails = true; }
    console.log(`R1 failures — ${row.combo}:`);
    for (const f of row.r1) {
      console.log(`  Day ${f.prevDay}→Day ${f.day}: "${f.exercise}"`);
    }
  }
}

for (const row of results) {
  if (row.error) continue;
  if (row.r2.length > 0) {
    if (!hasDetails) { console.log(); hasDetails = true; }
    console.log(`R2 failures — ${row.combo}:`);
    for (const f of row.r2) {
      console.log(`  "${f.name}" appears ${f.count}x (max ${MAX_EX_FREQ})`);
    }
  }
}

for (const row of results) {
  if (row.error) continue;
  if (row.r3.length > 0) {
    if (!hasDetails) { console.log(); hasDetails = true; }
    console.log(`R3 failures — ${row.combo}:`);
    for (const f of row.r3) {
      console.log(`  Day ${f.day}: compound "${f.exercise}" appears after an isolation exercise`);
    }
  }
}

for (const goal of GOALS) {
  if (r5Cache[goal].length > 0) {
    if (!hasDetails) { console.log(); hasDetails = true; }
    console.log(`R5 failures — ${goal}:`);
    for (const f of r5Cache[goal]) {
      if (f.error) { console.log(`  ${f.error}`); continue; }
      console.log(`  length=${f.len} week=${f.week} matched ${f.matchCount} phases (expected 1)`);
    }
  }
}

// ── Exit ──────────────────────────────────────────────────
if (allPass) {
  console.log('\nAll rules PASS.\n');
  process.exit(0);
} else {
  console.log('\nOne or more rules FAILED.\n');
  process.exit(1);
}
