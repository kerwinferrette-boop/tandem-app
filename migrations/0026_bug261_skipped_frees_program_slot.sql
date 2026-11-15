-- migrations/0026_bug261_skipped_frees_program_slot.sql
-- BUG-261, 2026-11-15. Kerwin's ruling, verbatim: "A skipped day should not count as a
-- workout that day. It should count as me skipping it".
--
-- WHAT BROKE (VERIFIED in prod): at 18:47:33Z skipAhead() (BUG-56) inserted a
-- session_type='skipped' row for Kerwin's 2026-11-15. His two Start taps (18:47:41Z,
-- 18:47:47Z) then failed 23505 on this index, because migrations/0015 only exempted
-- one-offs: `(user_id, session_date) WHERE session_type <> 'oneoff'`. The skip held the
-- day's ONE program slot, so the real workout could not exist the same day.
--
-- FIX: the skip stays on record (his ruling), but it no longer occupies the program slot.
-- 'abandoned' is NOT listed here on purpose: an abandoned row (migrations/0027) is reopened
-- by the client's claimTodaysProgramRow() rather than duplicated, so it may keep the slot.
--
-- APPLIED BY HAND: Kerwin runs this in the Supabase SQL editor. The MCP connector's
-- approval prompt for a DROP cannot be answered from the app this was built in. The DROP and
-- the CREATE replace the same index; nothing else is touched, and no row is changed.
-- Rollback: recreate the 0015 predicate (session_type <> 'oneoff') — which will FAIL while
-- any user has both a skipped and a real program row on one day, which is the point.

drop index if exists public.workout_sessions_user_date_program_key;
create unique index workout_sessions_user_date_program_key
  on public.workout_sessions (user_id, session_date)
  where (session_type not in ('oneoff', 'skipped'));
