-- ═══════════════════════════════════════════════════════
-- BUG-104: give scripts/d17-db-sweep.mjs a real RPC to call from CI.
-- STATUS: DRAFT. NOT APPLIED to Supabase (zsvktcvqmppsshtpeljt).
-- apply_migration is human-only (loop-config forbidden-ops). Kerwin applies.
-- ═══════════════════════════════════════════════════════
--
-- WHY THIS EXISTS
--
-- production.yml's first live run (2026-09-03, after the SUPABASE_* secrets were
-- provisioned) proved D17's promotion note wrong: it claimed the sweep "runs against
-- production," but scripts/d17-db-sweep.mjs calls `rest/v1/rpc/exec_sql`, and this
-- project has no such RPC. Every earlier clean run of the sweep (the 2026-08-17
-- result recorded in Notion, and this session's re-check) went through the Supabase
-- MCP execute_sql tool — a human/session-attached SQL runner, not anything CI's
-- REST + service-role credential can reach. The DOCTRINE.md promotion note oversold
-- what the credential could do; this migration is the actual fix, not the workaround.
--
-- WHAT IT DOES
--
-- One narrowly-scoped, read-only RPC. Not a generic "run arbitrary SQL" endpoint —
-- that would be a materially bigger attack surface than this app needs. d17_sweep()
-- takes a PATTERN as its only argument (so scripts/d17-db-sweep.mjs keeps sole
-- ownership of the pattern text — "one rule, one home" — this function is just the
-- read path) and returns exactly the two columns migration 0008's original sweep
-- query returned: which public-schema views or functions have a body matching it.
-- No table data is readable through it — only pg_class/pg_proc/pg_get_viewdef,
-- i.e. object definitions, never rows.
--
-- Callable only by service_role. anon/authenticated are explicitly revoked, so
-- this is reachable by exactly the same credential set that can already read/write
-- every table in this database directly (service_role bypasses RLS entirely) —
-- granting it read access to view/function SOURCE TEXT is not a materially larger
-- trust boundary than what that key already holds.

create or replace function public.d17_sweep(pattern text)
returns table(kind text, name text)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select 'view'::text as kind, c.relname::text as name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'v'
     and pg_get_viewdef(c.oid, true) ~* pattern
  union all
  select 'function'::text as kind, p.proname::text as name
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.prosrc ~* pattern;
$$;

comment on function public.d17_sweep(text) is
  'D17 (no DB object may emit a prescriptive load) enforcement RPC. Read-only over '
  'pg_class/pg_proc object DEFINITIONS in the public schema — never row data. Pattern '
  'is passed in by the caller (scripts/d17-db-sweep.mjs), which is the single owner of '
  'what counts as a load-prescription signature. BUG-104.';

revoke all on function public.d17_sweep(text) from public;
revoke all on function public.d17_sweep(text) from anon;
revoke all on function public.d17_sweep(text) from authenticated;
grant execute on function public.d17_sweep(text) to service_role;

-- ── Assertions — run these after applying, do not assume ───────────────────
--
--   -- callable with the known-clean pattern, returns 0 rows (matches the
--   -- 2026-08-17 and 2026-09-03 manual sweep results)
--   select * from d17_sweep('1\.025|0\.95|1\.05|0\.975|increase weight|reduce weight');
--   -- expect 0 rows
--
--   -- grants are exactly service_role, nothing wider
--   select grantee, privilege_type from information_schema.routine_privileges
--    where routine_name = 'd17_sweep';
--   -- expect exactly one row: service_role / EXECUTE
--
-- After applying, re-run `node scripts/d17-db-sweep.mjs` locally (or let the next
-- `production.yml` run do it) — it now calls `rpc/d17_sweep` instead of the
-- nonexistent `rpc/exec_sql`. See scripts/d17-db-sweep.mjs for that change.
--
-- ── ROLLBACK ───────────────────────────────────────────────────────────────
--
--   drop function if exists public.d17_sweep(text);
--
-- Rollback is lossless for the app: nothing else calls this function, and the D17
-- sweep simply goes back to CI-unreachable (manual-only via Supabase MCP), exactly
-- today's state.
-- ═══════════════════════════════════════════════════════
