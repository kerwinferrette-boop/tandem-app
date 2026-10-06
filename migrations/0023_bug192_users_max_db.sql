-- ═══════════════════════════════════════════════════════════════════════════
-- BUG-192 — `users.max_db`: give the max-dumbbell cap a durable cloud home.
--
-- Kerwin authorized this directly (2026-09-30, in session). Applied in the same
-- session via Supabase MCP, because mcp__*__apply_migration is denied in
-- .claude/settings.json (:44); see the POST-MIGRATION block for the assertions
-- that were actually run rather than assumed.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- WHY
-- ---
-- Today's Setup lets a user say what their gym's dumbbells top out at. That value
-- reaches the engine through resolveMaxDb() -> dbCap -> seedWeight()
-- (programs.js:232), so it governs the starting load for an uncalibrated lift.
--
-- It had no cloud column, which produced two defects in sequence:
--   1. BUG-192 as originally filed: the cap lived in sessionStorage ALONE while
--      the equipment tier persisted three ways. On reload the UI still read
--      "Hotel · Small DB" while resolveMaxDb() returned 0, so dumbbell
--      prescriptions went silently UNCAPPED.
--   2. The first fix moved it to cfg.maxDb (localStorage). That was correct
--      on-device but created the SC-37 seam: cfgFromUserRow() returns a complete
--      replacement cfg and syncFromCloud() runs on app boot for any signed-in
--      user, so a field with no column behind it had to be carried by hand or it
--      died on every load.
-- This column removes the special case. maxDb becomes row-backed like every other
-- program field, so the cloud rebuild restores it instead of merely preserving it,
-- and it follows the user to a new device.
--
-- TYPE / CONSTRAINT
-- -----------------
-- integer, nullable. NULL means "no cap stated" — which resolveMaxDb() already
-- treats as uncapped, so NULL is the honest default and NOT 0. The CHECK rejects
-- 0 and negatives: a 0 lb cap is not a real gym, and silently storing it would
-- read as "uncapped" through resolveMaxDb()'s `> 0` guard, i.e. a value that
-- means the opposite of what it says. The UI's own input is min=5 max=200 step=5;
-- the constraint is deliberately looser than the widget so a legitimate
-- out-of-range gym is a product decision, not a database error.
--
-- NOT a program-engine change and NOT gated on exercise-science-research: the
-- capping RULE already exists and is unchanged (seedWeight's dbCap). This is
-- persistence plumbing for a rule that already shipped.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.users add column if not exists max_db integer;

-- Idempotent: safe to re-run after a partial apply.
alter table public.users drop constraint if exists users_max_db_positive;
alter table public.users add constraint users_max_db_positive
  check (max_db is null or max_db > 0);

comment on column public.users.max_db is
  'Heaviest dumbbell available at the user''s current gym, in lb. Set from Today''s '
  'Setup; consumed via resolveMaxDb() -> dbCap -> seedWeight() to cap the starting '
  'load for uncalibrated lifts. NULL = no cap stated (treated as uncapped). '
  'Added by BUG-192 so the cap survives a new device instead of only a reload.';

-- ═══════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION ASSERTIONS — all RUN, not assumed (results in the commit body)
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Column and constraint both exist:
--   select c.column_name, c.data_type, c.is_nullable,
--          (select count(*) from pg_constraint
--             where conname = 'users_max_db_positive') as check_present
--   from information_schema.columns c
--   where c.table_schema='public' and c.table_name='users' and c.column_name='max_db';
--   EXPECT: max_db | integer | YES | 1
--
-- 2. The CHECK actually rejects a bad value (a constraint nobody tested is a
--    comment). Run against the ALLOWLISTED TEST ACCOUNT only:
--   update users set max_db = 0 where email = 'kerwinferrette+test@gmail.com';
--   EXPECT: ERROR 23514 violates check constraint "users_max_db_positive"
--
-- 3. Round-trip: write 25 for the test account, read it back, confirm
--    cfgFromUserRow() surfaces it as cfg.maxDb = 25, then restore to NULL and
--    re-read to confirm cleanup.
--
-- 4. No existing row was disturbed: every users row should read max_db IS NULL
--    immediately after this migration (the column is added empty).
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- APPLIED 2026-09-30 (Kerwin-authorized, in session). All four assertions RUN:
--
--   1. COLUMN + CONSTRAINT  -> max_db | integer | YES | check_present = 1        PASS
--   2. CHECK HAS TEETH      -> `update users set max_db = 0` on the test account
--                              raised ERROR 23514 violates check constraint
--                              "users_max_db_positive". Not assumed — attempted.  PASS
--   3. ROUND TRIP           -> wrote 25 for the allowlisted test account, read it
--                              back, ran the LIVE cfgFromUserRow() against that real
--                              row with NO incumbent cfg (a brand-new device) and
--                              with an EMPTY sessionStorage: cfg.maxDb = 25 and
--                              resolveMaxDb() = 25. This is the case local-only
--                              storage could never serve. Restored to NULL after.    PASS
--   4. NOTHING DISTURBED    -> 0 of 4 users rows held a value immediately after the
--                              ALTER, and 0 hold one now. Both test accounts
--                              re-read as NULL. Kerwin's and Dani's real rows were
--                              never written.                                        PASS
--
-- Client side wired in the same change, both directions — a column the client reads
-- but never writes is the mirror of BUG-192 and would leave max_db NULL forever:
--   READ  cfgFromUserRow(): `u.max_db ?? keep.maxDb ?? null` (row wins; the carry
--         remains for a pre-0023 local cap sitting behind a null column).
--   WRITE syncToCloud()'s users upsert: `max_db: cfg.maxDb || null`.
-- Guarded by scripts/cfg-field-parity-smoke.mjs [E1]-[E3], each mutation-tested.
-- ═══════════════════════════════════════════════════════════════════════════
