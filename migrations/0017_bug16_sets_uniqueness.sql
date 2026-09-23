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
-- is sets_pkey (id). 0 rows have a NULL in any of the three key columns. A unique
-- index treats NULL session_ids as distinct, so a NULL-session row never collides —
-- acceptable today (0 such rows), worth knowing if that ever changes.
--
-- ═══ READ BEFORE APPLYING — TWO PRECONDITIONS, NOT ONE ═══
--
-- (A) DATA: the 6 duplicate groups from BUG-131 (all session
--     893eb33b-81f2-414e-8368-ff5b0420d9aa) must be cleaned first. Step 1 below
--     refuses to continue until they are. This file deliberately does NOT dedupe —
--     that is a destructive write on live user data.
--
-- (B) APP CODE: the app's writes to `sets` are not yet conflict-tolerant, and this
--     index turns today's silent duplicates into hard errors. Verified in
--     tandem.html on origin/main 9221657:
--       - saveExerciseToCloud() (~:5510) sends EVERY set of the exercise in one plain
--         .insert(). logSet() has usually already inserted those rows one by one, so
--         with this index the whole batch is rejected on the first conflicting row —
--         including any set whose own logSet() insert had failed (e.g. offline). That
--         set then never reaches the cloud; the user only sees "Sync error — saved
--         locally".
--       - The C11 session-merge at finish (~:6411) repoints sets from one session to
--         another in a single UPDATE. On a key collision it fails, the error is
--         swallowed, and those sets stay on the unfinished session — the split-session
--         state C11 exists to repair.
--     Making these writes conflict-tolerant (upsert on this key, or insert with
--     ignoreDuplicates, and a collision-aware merge) is sync-layer code — forbidden
--     scope for the unattended loop, Kerwin's decision. Apply this index AFTER that
--     change ships, not before.
--
-- Run each STEP as its own statement in the Supabase SQL editor. CREATE INDEX
-- CONCURRENTLY cannot run inside a transaction block, and a multi-statement run is one.

-- STEP 1 — PRECONDITION (A). Raises and stops if any duplicate group remains.
DO $$
DECLARE dup_groups integer;
BEGIN
  SELECT count(*) INTO dup_groups FROM (
    SELECT 1 FROM public.sets
    GROUP BY session_id, exercise_name, set_number
    HAVING count(*) > 1
  ) d;
  IF dup_groups > 0 THEN
    RAISE EXCEPTION 'BUG-16/0017: % duplicate (session_id, exercise_name, set_number) group(s) remain in public.sets — clean them (see BUG-131) before creating the unique index.', dup_groups;
  END IF;
END $$;

-- STEP 2 — RECOVERY, only if a previous attempt at Step 3 failed partway. A failed
-- CONCURRENTLY build leaves an INVALID index behind under this name; IF NOT EXISTS in
-- Step 3 would then silently skip and keep the broken one. Drop it first.
-- DROP INDEX CONCURRENTLY IF EXISTS public.sets_session_exercise_setnum_uniq;

-- STEP 3 — the constraint.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS sets_session_exercise_setnum_uniq
  ON public.sets (session_id, exercise_name, set_number);

-- STEP 4 — verify it is VALID, not merely present. pg_indexes lists invalid indexes too,
-- so it cannot tell a finished build from a failed one.
SELECT i.indexrelid::regclass AS index_name, i.indisvalid, i.indisready
FROM pg_index i
WHERE i.indexrelid = 'public.sets_session_exercise_setnum_uniq'::regclass;
-- expect one row with indisvalid = true AND indisready = true.
-- If indisvalid = false: run Step 2 (uncommented), fix the cause, re-run Steps 1, 3, 4.
--
-- At this table size (~350 rows) a plain (non-CONCURRENTLY) build holds its lock for
-- milliseconds, so if a runner insists on a transaction, dropping CONCURRENTLY from
-- Step 3 is safe.
