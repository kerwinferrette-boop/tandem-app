-- ═══════════════════════════════════════════════════════
-- BUG-91 part 2: persist the WORKING 1RM so it survives the device
-- STATUS: DRAFT. NOT APPLIED to Supabase (zsvktcvqmppsshtpeljt).
-- apply_migration is human-only (loop-config forbidden-ops). Kerwin applies.
-- ═══════════════════════════════════════════════════════
--
-- WHY THIS EXISTS
--
-- Kerwin, 2026-08-17: "Why would it not write to supabase? Wouldn't that help
-- track against the long term 1rm?" Correct on both counts, and the honest
-- answer to "why not" is that nobody built it — not that it was designed away.
--
-- Tandem keeps TWO 1RM numbers per exercise:
--
--   all-time PR    personal_records.best_estimated_1rm_lbs   -- synced, durable
--   working 1RM    localStorage tandem_working1rm            -- device-only
--
-- The working 1RM is the LIVING number: it is what actually drives the
-- prescription (getRecommendation reads it first), it is written by
-- reconcileWorking1RMs() on session finish, and it is earned-only — it rises
-- when a real set beats it and never falls. It is the better record of current
-- capability than the all-time PR, because the all-time PR can be years stale.
--
-- And it has never left the device. Zero Supabase writes, zero hydration reads
-- (verified across all 7 references in tandem.html, 2026-08-17). Consequences:
--   * a new phone starts with no working 1RM and silently falls back to the PR
--   * clearing site data destroys it with no cloud copy to restore from
--   * it cannot be charted over time, because no history of it is kept anywhere
--   * BUG-91's display bug existed precisely because one number synced and the
--     other did not, so a stale local copy could outrank a fresher cloud PR
--
-- The last point is the important one: BUG-91 was patched in the READ path
-- (earnedOneRM takes the max of the two, commit 0bca806). That stops the wrong
-- number being shown. It does NOT make the working 1RM durable. This migration
-- is the actual fix for the underlying defect.
--
-- ── Part A: make the working 1RM durable ───────────────────────────────────
--
-- Co-locating on personal_records rather than a new table: the grain is already
-- exactly right (one row per user_id + exercise_name, which is the same key
-- tandem_working1rm uses), the ON CONFLICT target already exists, and the
-- hydration path already fetches this table on login. A separate table would
-- add a join and a second round-trip for three columns.

ALTER TABLE personal_records
  ADD COLUMN IF NOT EXISTS working_1rm_lbs  numeric,      -- the living number; null = never earned one
  ADD COLUMN IF NOT EXISTS working_1rm_date date,         -- when it was last earned
  ADD COLUMN IF NOT EXISTS working_1rm_dir  text;         -- provenance: 'earned' | 'pr'

COMMENT ON COLUMN personal_records.working_1rm_lbs IS
  'Living working 1RM driving the prescription. Earned-only and monotonic per D11: '
  'raised when a logged set beats it, never lowered by a deload or a bad session. '
  'Distinct from best_estimated_1rm_lbs, which is the all-time PR. Mirrors the '
  'localStorage tandem_working1rm {rm,date,dir} shape. BUG-91.';

-- Provenance values match what reconcileWorking1RMs() and the set-log PR path
-- already write locally, so the column is a faithful copy rather than a new
-- vocabulary. 'earned' = raised by session reconciliation; 'pr' = raised by a
-- new all-time PR mid-session.
ALTER TABLE personal_records
  DROP CONSTRAINT IF EXISTS personal_records_working_1rm_dir_chk;
ALTER TABLE personal_records
  ADD CONSTRAINT personal_records_working_1rm_dir_chk
  CHECK (working_1rm_dir IS NULL OR working_1rm_dir IN ('earned','pr'));

-- D11 is SAFETY tier: the working 1RM is a MEASUREMENT of real performance and
-- may never exceed the all-time PR, which is itself a running max of the same
-- underlying calcRM estimates. A working number above the PR would mean one of
-- the two writers is fabricating. Enforced here rather than trusted to the
-- client, because the client is exactly what was wrong in BUG-91.
--
-- NOT enforced here: monotonicity over time (never decreasing). That needs a
-- trigger comparing OLD/NEW, and this migration deliberately adds no trigger —
-- see the flagged decision below.
ALTER TABLE personal_records
  DROP CONSTRAINT IF EXISTS personal_records_working_lte_best_chk;
ALTER TABLE personal_records
  ADD CONSTRAINT personal_records_working_lte_best_chk
  CHECK (working_1rm_lbs IS NULL OR working_1rm_lbs <= best_estimated_1rm_lbs);

-- ── Part B: backfill ───────────────────────────────────────────────────────
--
-- Every existing row gets its working 1RM seeded from the all-time PR. This is
-- the correct seed and not a guess: earnedOneRM() (tandem.html, BUG-91) already
-- returns max(working, pr), so a user whose device has no working entry is
-- ALREADY being prescribed off the PR today. The backfill just makes the stored
-- state match the behaviour that is already live.
--
-- dir='pr' records honestly that this value came from the PR column, not from a
-- session reconciliation — so a later audit can tell seeded rows from earned ones.
UPDATE personal_records
   SET working_1rm_lbs  = best_estimated_1rm_lbs,
       working_1rm_date = achieved_date,
       working_1rm_dir  = 'pr'
 WHERE working_1rm_lbs IS NULL;

-- ── Assertions — run these after applying, do not assume ───────────────────
--
--   -- every row seeded, none left null
--   SELECT COUNT(*) FILTER (WHERE working_1rm_lbs IS NULL) AS unseeded,
--          COUNT(*)                                         AS total
--     FROM personal_records;
--   -- expect unseeded = 0, total = 67 (as of 2026-08-17)
--
--   -- the D11 ceiling holds
--   SELECT COUNT(*) FROM personal_records
--    WHERE working_1rm_lbs > best_estimated_1rm_lbs;
--   -- expect 0
--
--   -- provenance vocabulary is closed
--   SELECT DISTINCT working_1rm_dir FROM personal_records;
--   -- expect {pr} immediately after backfill; {pr, earned} once sessions land
--
-- ── ROLLBACK ───────────────────────────────────────────────────────────────
--
--   ALTER TABLE personal_records
--     DROP CONSTRAINT IF EXISTS personal_records_working_lte_best_chk,
--     DROP CONSTRAINT IF EXISTS personal_records_working_1rm_dir_chk,
--     DROP COLUMN IF EXISTS working_1rm_lbs,
--     DROP COLUMN IF EXISTS working_1rm_date,
--     DROP COLUMN IF EXISTS working_1rm_dir;
--
-- Rollback is lossless for the app: the client falls back to the PR exactly as
-- it does today for a device with no local working entry.
--
-- ═══════════════════════════════════════════════════════
-- FLAGGED FOR KERWIN — decisions this migration deliberately does NOT make
-- ═══════════════════════════════════════════════════════
--
-- 1. LONGITUDINAL HISTORY IS NOT SOLVED BY THIS FILE.
--    Kerwin's question was whether persisting this would "help track against the
--    long term 1rm". Partly. These columns make the CURRENT working 1RM durable
--    and cross-device. They do NOT create a time series — each write overwrites
--    the previous value, so you still cannot chart the number's trajectory.
--    Saying otherwise would oversell this migration.
--    The good news is that the time series ALREADY EXISTS: sets.estimated_1rm_lbs
--    is stamped per set with a timestamp, 374 rows today. A progression chart
--    should be built from `sets`, not from a new history table. That is the
--    AUDIT REQUEST bug ("are we sure the engine is making me progressively
--    stronger") and it needs no schema change at all.
--    If a dedicated working_1rm_history table is wanted anyway, that is a
--    separate decision and should not be smuggled in here.
--
-- 2. NO TRIGGER ENFORCES MONOTONICITY.
--    D11 says the working 1RM never decreases. A BEFORE UPDATE trigger could
--    enforce it server-side. Deliberately not added, for two reasons: it is
--    exactly the class of DB-side logic BUG-79/D17 is about (the doctrine gate
--    cannot see trigger bodies, so a rule living there is invisible to
--    `npm run verify`), and a hard trigger would make a legitimate future
--    detraining/layoff regression impossible to write without a migration.
--    Rule D17 first, then decide where this belongs.
--
-- 3. THE CLIENT WIRING IS NOT IN THIS FILE.
--    Applying this migration alone changes nothing the user sees — it only adds
--    the columns and seeds them. Two client changes are still required and are
--    sync-layer work, which is forbidden scope for the unattended loop:
--      (a) WRITE: reconcileWorking1RMs() and the set-log PR path must upsert
--          working_1rm_* alongside the existing personal_records write.
--      (b) READ: both hydration paths (tandem.html ~4695 and ~4940) must merge
--          working_1rm_lbs into tandem_working1rm with the same max-guard they
--          already use for tandem_prs. Without the max-guard this reintroduces
--          BUG-91 from the other direction.
--    Sequence matters: apply the migration, ship the write side, THEN the read
--    side. Hydrating from a column nothing writes yet would pin every user's
--    working 1RM to the backfilled PR value.
