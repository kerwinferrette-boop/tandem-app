// EPIC-031 Phase 2b — EXERCISE_BANK → exercises seed generator
// Thin CLI over scripts/lib/exercise-seed.mjs, which owns the emitter (shared
// with the freshness gate so the two can never disagree). Re-run after any
// bank edit; commit the regenerated SQL.
//
// Regenerating is only half the job: the file still has to be APPLIED to
// Supabase by a human (apply_migration is human-only per .claude/loop-config.md).
// Until it is, `npm run integration` A2 stays red on main — the drift lives in
// Postgres, where no local gate can see it.
//
// Usage: node scripts/sync-exercise-bank.mjs
import fs from 'node:fs';
import { buildSeedSql, buildRows, SEED_PATH } from './lib/exercise-seed.mjs';

let sql;
try {
  sql = buildSeedSql();
} catch (err) {
  // Un-emittable bank (bad tier/category/unit, or a duplicate name that
  // `on conflict (slug)` cannot absorb). Say what is wrong and write nothing —
  // a half-valid seed on disk is worse than no regeneration.
  console.error(`✗ cannot emit seed: ${err.message}`);
  process.exit(1);
}
fs.writeFileSync(SEED_PATH, sql);
console.log(`Wrote ${SEED_PATH} — ${buildRows().length} exercises upserted on slug.`);
console.log('NOT yet applied to prod — a human must run it against Supabase before A2 goes green.');
