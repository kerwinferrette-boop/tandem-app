#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// D17 DB-CONNECTED SWEEP — enforcement mechanism (b), Kerwin's ruling 2026-08-17.
//
// BACKGROUND: scripts/doctrine.mjs reads repo files only. It cannot see a view body,
// a PL/pgSQL function, a trigger, or an RLS predicate. A D11 violation (a fixed
// ±2.5%/±5% ratchet emitting user-facing "Increase weight" text) sat live in
// production inside a Postgres VIEW while npm run verify reported ALL 9 CHECKS PASS
// across 882 week-steps of file-side checking. Dropped 2026-08-14 (BUG-72/BUG-38,
// migration 0008). This script is that migration's own documented A3 sweep,
// promoted from a one-off pre-drop check into a standing, re-runnable gate — Kerwin
// chose option (b) over (a) declarative-only and (c) schema-snapshot.
//
// STATUS: PENDING, not ACTIVE. It is NOT wired into `npm run verify` and cannot be,
// honestly, because CI has no SUPABASE_SERVICE_ROLE_KEY today. Per D17's own
// Claude Code Prompt: "If D17 cannot be enforced with the credentials CI actually
// has, SAY SO and ship it PENDING... A documented, unenforced law is honest. A law
// claimed as enforced by a gate that cannot see the subject is the failure this bug
// is about." Wiring this into verify.mjs before a CI credential exists would be
// exactly that failure, one layer up.
//
// RUN MANUALLY, whenever a DB-side object changes (a new view, function, or trigger
// is added), or periodically by whoever has a service-role key at hand:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/d17-db-sweep.mjs
//
// FAILS CLOSED like scripts/outcome.mjs: no credentials -> exit 1, not a silent skip.
// A gate that reports success while blind is worse than no gate — that is the exact
// BUG-79 failure mode this script exists to close.
// ═══════════════════════════════════════════════════════

const URL_ = process.env.SUPABASE_URL;
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

// D17 proposed wording (Notion, unruled on exact phrasing but this is the working
// text): "No database object may emit a prescriptive load. Load prescription is the
// client engine's job (getWeekTarget/getRecommendation, the D11/D12 path the file-side
// gate audits). A view, function, trigger or default that computes a target weight, a
// percentage step, or coaching text about load is a doctrine violation regardless of
// whether anything currently reads it."
//
// Pattern is the SAME one migration 0008 validated against a real positive (found the
// live violation) and a real negative (0 hits after the drop) — not a fresh, unproven
// regex. Widen only with a new proven positive, per the "pattern that has never
// matched anything is not evidence" warning on the BUG-79 row.
const PATTERN = String.raw`1\.025|0\.95|1\.05|0\.975|increase weight|reduce weight`;

async function sql(query) {
  const res = await fetch(`${URL_}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (res.ok) return res.json();
  // Fallback for projects without an exec_sql RPC: the two source columns read
  // directly via PostgREST's information_schema views where exposed. Most Supabase
  // projects do not expose pg_catalog over REST, so exec_sql (or an MCP SQL runner)
  // is the primary path; this project has Supabase MCP execute_sql available, which
  // is what actually ran this sweep for the 2026-08-17 result recorded in Notion.
  throw new Error(`exec_sql RPC unavailable (${res.status}) — run the query via the ` +
    `Supabase MCP execute_sql tool or psql instead: see the query in this file's SWEEP const.`);
}

const SWEEP = `
  select 'view' as kind, c.relname as name from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'v'
     and pg_get_viewdef(c.oid, true) ~* '${PATTERN}'
  union all
  select 'function', p.proname from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.prosrc ~* '${PATTERN}';
`;

async function main() {
  if (!URL_ || !KEY) {
    console.error(`
═══ D17 SWEEP — CANNOT RUN ═══

  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. This fails rather than
  skips when it cannot reach production, for the same reason scripts/outcome.mjs
  does: a blind gate reporting success is the exact failure this script exists to
  close. Set both and re-run, or run the SWEEP query in this file directly against
  Supabase (psql, the SQL editor, or the Supabase MCP execute_sql tool).
`);
    process.exit(1);
  }

  let hits;
  try {
    hits = await sql(SWEEP);
  } catch (e) {
    console.error(`\n  ✗ D17 SWEEP ERRORED: ${e.message}\n`);
    process.exit(1);
  }

  console.log(`D17 DB-connected sweep — pattern: /${PATTERN}/i, schema: public\n`);
  if (!hits.length) {
    console.log('  ✓ 0 hits — no view or function body emits a prescriptive-load pattern.');
    process.exit(0);
  }
  console.log(`  ✗ ${hits.length} hit(s):`);
  for (const h of hits) console.log(`    - ${h.kind} ${h.name}`);
  console.log('\n  A D-invariant violation may be live in the database. Investigate before shipping.');
  process.exit(1);
}

main();
