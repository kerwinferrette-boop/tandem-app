-- migrations/0017_bug16_sets_uniqueness.sql
-- BUG-16. Prevents a re-sync from inserting a second copy of a set that already exists.
-- Authorized for COMMIT by Kerwin, 2026-09-22 Decision Queue (guardrail_0017).
-- APPLYING THIS IS KERWIN'S JOB ALONE. Do not run it.
--
-- WHY: on 2026-09-21 a sync replay re-wrote a whole session 3.5 hours after it was
-- logged, producing 6 duplicate (session_id, exercise_name, set_number) groups and
-- persisting a transient 905 lb value that corrupted a stored 1RM (BUG-131). This
-- constraint would have rejected that replay outright.
--
-- Schema verified live 2026-09-23: public.sets has session_id (uuid, nullable),
-- exercise_name (text, not null) and set_number (integer, not null); its only index
-- is sets_pkey (id). 0 rows have a NULL in any of the three key columns. Note that a
-- unique index treats NULL session_ids as distinct, so a NULL-session row can never
-- collide — acceptable today (0 such rows), worth knowing if that ever changes.

-- STEP 1 — PRECONDITION. This index creation WILL FAIL while BUG-131's duplicates
-- remain (6 groups as of 2026-09-23, all session 893eb33b-81f2-414e-8368-ff5b0420d9aa).
-- That is intended. Clean them first (see BUG-131); do NOT add a DISTINCT ON
-- dedupe here to force it through.
SELECT session_id, exercise_name, set_number, COUNT(*)
FROM sets GROUP BY 1,2,3 HAVING COUNT(*) > 1;
-- must return 0 rows before proceeding.

-- STEP 2 — the constraint.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS sets_session_exercise_setnum_uniq
  ON sets (session_id, exercise_name, set_number);

-- STEP 3 — verify.
SELECT indexname FROM pg_indexes WHERE tablename = 'sets';
-- expect sets_pkey + sets_session_exercise_setnum_uniq

-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction block. Run it as
-- its own statement in the Supabase SQL editor. If a runner wraps statements in a
-- transaction, drop CONCURRENTLY — at ~350 rows the lock is milliseconds.
--
-- NOTE 2: once this index exists, the app's plain .insert() on sets will start
-- raising a unique-violation error on a replayed set instead of silently
-- duplicating it. That is the point, but the app does not yet catch that error
-- specifically — expect a "Sync error" toast on a replay rather than a silent
-- duplicate. Switching those inserts to an upsert on this key is sync-layer code
-- (forbidden scope for the unattended loop) and is a separate decision.
