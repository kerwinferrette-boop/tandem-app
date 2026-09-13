-- ═══════════════════════════════════════════════════════
-- EPIC-036 — let a one-off "Build Me a Workout" session coexist with the
-- regular scheduled program day on the same calendar date.
-- STATUS: Kerwin authorized apply, attended session 2026-09-12 ("I think a
-- Finish button on the one-off workout is required so it can be saved to
-- the backend Supabase"). Applying per that explicit authorization —
-- apply_migration stays human-directed per .claude/loop-config.md, and this
-- is that direction, not an unattended-loop decision.
-- ═══════════════════════════════════════════════════════
--
-- WHY THIS EXISTS
--
-- workout_sessions has UNIQUE (user_id, session_date) — one session per user
-- per calendar day. That is correct for the periodized program (one
-- scheduled day per date) but fatal to EPIC-036: a one-off session has no
-- Finish/log path today PRECISELY because writing it would collide with
-- the regular day's row on the same date.
--
-- Verified against prod before writing this file (Cycle 79 audit,
-- 2026-09-08, re-confirmed here): nothing uses this constraint as an
-- ON CONFLICT arbiter. Every workout_sessions upsert in tandem.html targets
-- onConflict:'id', never onConflict:'user_id,session_date' — so dropping it
-- does not change any existing write path's conflict resolution (no 42P10
-- failure, the mechanism that killed the same kind of move in BUG-77).
--
-- session_type already exists (text NOT NULL DEFAULT 'strength'), is
-- already written by finishSession()/skipAhead(), and carries 0 NULL rows
-- in prod. No new column needed — this migration only re-scopes the
-- uniqueness rule to exclude one-off rows.
--
-- ── The change ──────────────────────────────────────────────────────────

ALTER TABLE public.workout_sessions
  DROP CONSTRAINT IF EXISTS workout_sessions_user_id_session_date_key;

-- Partial unique index: still exactly one REGULAR-program session per user
-- per day (the invariant the periodized program needs), but a one-off no
-- longer competes for that slot. Multiple one-offs on the same date are
-- deliberately NOT constrained here — "I want to do back and biceps before
-- travel" does not imply "only one extra session per day," and no source
-- says it should.
CREATE UNIQUE INDEX IF NOT EXISTS workout_sessions_user_date_program_key
  ON public.workout_sessions (user_id, session_date)
  WHERE session_type <> 'oneoff';

COMMENT ON INDEX public.workout_sessions_user_date_program_key IS
  'EPIC-036: replaces the old full UNIQUE(user_id, session_date) constraint. '
  'Scoped to session_type <> ''oneoff'' so a one-off session can coexist with '
  'the day''s regular program session without colliding. A one-off is a '
  'sibling of the program day, logged and visible, but does not participate '
  'in program-day uniqueness. Whether a one-off counts toward '
  'streak/points/volume is a SEPARATE, still-open product question (see '
  'EPIC-036 Notion evidence) — this index does not answer it, only makes '
  'the row possible to write.';

-- ── Assertions — run these after applying, do not assume ───────────────────
--
--   -- the old constraint is gone, the new partial index exists
--   SELECT conname FROM pg_constraint WHERE conrelid = 'public.workout_sessions'::regclass AND contype = 'u';
--   -- expect: 0 rows
--   SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'workout_sessions' AND indexname = 'workout_sessions_user_date_program_key';
--   -- expect: 1 row, WHERE (session_type <> 'oneoff'::text)
--
--   -- a regular-program duplicate on the same day still correctly fails
--   BEGIN;
--     INSERT INTO workout_sessions (user_id, session_date, day_type, session_type)
--       VALUES ('<any existing user id>', CURRENT_DATE, 'day1', 'strength');
--     INSERT INTO workout_sessions (user_id, session_date, day_type, session_type)
--       VALUES ('<same user id>', CURRENT_DATE, 'day1', 'strength');
--   ROLLBACK;
--   -- expect: second INSERT raises a unique_violation
--
--   -- a one-off now coexists with a regular session on the same day
--   BEGIN;
--     INSERT INTO workout_sessions (user_id, session_date, day_type, session_type)
--       VALUES ('<any existing user id>', CURRENT_DATE, 'day1', 'strength');
--     INSERT INTO workout_sessions (user_id, session_date, day_type, session_type)
--       VALUES ('<same user id>', CURRENT_DATE, 'chest', 'oneoff');
--   ROLLBACK;
--   -- expect: both INSERTs succeed
--
-- ── ROLLBACK ───────────────────────────────────────────────────────────────
--
--   DROP INDEX IF EXISTS public.workout_sessions_user_date_program_key;
--   -- Only safe to re-add the original full constraint if no (user_id,
--   -- session_date) pair has more than one row at that point:
--   --   SELECT user_id, session_date, count(*) FROM workout_sessions
--   --     GROUP BY 1,2 HAVING count(*) > 1;
--   --   -- must return 0 rows before re-adding the old UNIQUE constraint.
--   ALTER TABLE public.workout_sessions
--     ADD CONSTRAINT workout_sessions_user_id_session_date_key UNIQUE (user_id, session_date);
--
-- ═══════════════════════════════════════════════════════
-- FLAGGED — decisions this migration deliberately does NOT make
-- ═══════════════════════════════════════════════════════
--
-- 1. WHETHER A ONE-OFF COUNTS TOWARD STREAK/POINTS/VOLUME/COMPETITION.
--    Not decided here. finishSession()'s streak/points upsert and the
--    weekly-leaderboard aggregation are untouched by this migration — a
--    one-off session written after this change simply exists in the table;
--    it is the CLIENT code (a separate change) that decides whether those
--    aggregates read session_type='oneoff' rows at all. Answering that is
--    Kerwin's call, not inferred here.
--
-- 2. TWO CLIENT CALL SITES NEED A session_type <> 'oneoff' READ GUARD, NOT
--    JUST THIS SCHEMA CHANGE. tandem.html's skipAhead() and finishSession()
--    each look up "today's open row" by (user_id, session_date, completed
--    = false) to mark it skipped/complete. Without a guard, one of those
--    could now find a still-open ONE-OFF row instead of the regular day's
--    row and silently skip/complete the wrong session. Fixed in the same
--    commit as this migration file, not left dangling.
