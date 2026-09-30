// Bank ↔ seed-file freshness gate (credential-free, runs in `npm run verify`).
//
// WHAT THIS PROVES: the committed migrations/epic031_exercises_seed.sql is
// exactly what scripts/sync-exercise-bank.mjs would emit from the CURRENT
// EXERCISE_BANK in programs.js. In other words: "you edited the bank and
// forgot to regenerate the seed" is caught at the moment you make it.
//
// WHAT THIS DOES NOT PROVE — say it plainly, because a gate that overclaims is
// worse than no gate: it says NOTHING about the database. The seed file can be
// perfectly fresh and still unapplied, which is exactly the state that kept A2
// red on main from 2026-09-25 to 2026-09-29. Only `npm run integration`
// (CI-only, needs SUPABASE_SERVICE_ROLE_KEY) can see Postgres. This gate green
// + A2 red means "regenerated, not yet applied" — go apply it.
//
// WHY IT EXISTS: two bank edits (0e5f25f BUG-103, 4aa1add BUG-119b) shipped
// without regenerating the seed. `npm run verify` stayed green 24/24 for four
// days while every single push to main went red on A2, because nothing local
// compared the bank to the seed. This is that missing comparison.
import fs from 'node:fs';
import { buildSeedSql, SEED_PATH, normalise } from './lib/exercise-seed.mjs';

const rel = 'migrations/epic031_exercises_seed.sql';

if (!fs.existsSync(SEED_PATH)) {
  console.error(`✗ ${rel} is missing entirely.`);
  console.error('  Run: node scripts/sync-exercise-bank.mjs');
  process.exit(1);
}

const committed = fs.readFileSync(SEED_PATH, 'utf8');

// buildSeedSql() throws when the bank itself is un-emittable: a bad tier/category/
// equipment/unit, or a duplicate name that `on conflict (slug)` could not absorb at
// apply time. That is a real gate failure and must read as one — an uncaught stack
// trace in the middle of a 25-check run tells you Node crashed, not what you broke.
let expected;
try {
  expected = buildSeedSql();
} catch (err) {
  console.error('✗ EXERCISE_BANK cannot be emitted as a seed at all:');
  console.error(`    ${err.message}`);
  console.error('\n  Fix the bank entry in programs.js, then: node scripts/sync-exercise-bank.mjs');
  process.exit(1);
}

if (normalise(committed) === normalise(expected)) {
  const entries = (committed.match(/^-- Generated: .* · entries: (\d+)$/m) || [])[1] ?? '?';
  console.log(`✓ ${rel} matches EXERCISE_BANK (${entries} entries).`);
  console.log('  NOTE: this says nothing about whether the seed has been APPLIED to prod —');
  console.log('  only the A2 integration gate in CI can see the database.');
  process.exit(0);
}

// Drifted. Report WHICH slugs, not just "files differ" — the whole point is to
// name the bank edit whose regeneration was skipped.
const rowsOf = (sql) => {
  const map = new Map();
  for (const line of sql.split('\n')) {
    const m = line.match(/^\('([^']+)', /);
    if (m) map.set(m[1], line.replace(/,$/, ''));
  }
  return map;
};
const want = rowsOf(expected), have = rowsOf(committed);

const added = [...want.keys()].filter(s => !have.has(s));
const removed = [...have.keys()].filter(s => !want.has(s));
const changed = [...want.keys()].filter(s => have.has(s) && have.get(s) !== want.get(s));

console.error(`✗ ${rel} is STALE — it does not match the current EXERCISE_BANK.`);
console.error(`  committed: ${have.size} rows · bank: ${want.size} rows\n`);
for (const s of added)   console.error(`    + ${s}  (in bank, missing from seed file)`);
for (const s of removed) console.error(`    - ${s}  (in seed file, no longer in bank)`);
for (const s of changed) console.error(`    ~ ${s}  (row content differs)`);
if (!added.length && !removed.length && !changed.length) {
  console.error('    (no per-slug difference — the file header or SQL scaffold differs)');
}
console.error('\n  You edited the bank without regenerating the seed. Fix:');
console.error('    node scripts/sync-exercise-bank.mjs');
console.error('  then commit the regenerated SQL — and remember it still has to be');
console.error('  APPLIED to Supabase by hand before the A2 gate in CI goes green.');
process.exit(1);
