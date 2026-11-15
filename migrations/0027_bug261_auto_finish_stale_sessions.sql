-- migrations/0027_bug261_auto_finish_stale_sessions.sql
-- BUG-261, 2026-11-15. Kerwin: "Yes, build all of it" to a server-side 6-hour auto-finish,
-- with two details he agreed to:
--   * the 6 hours run from the LAST LOGGED SET, not from Start, so a slow session is never
--     cut off mid-workout;
--   * a session with ZERO sets is closed as not done, never credited, so a stray Start tap
--     cannot count as a workout.
--
-- WHY SERVER-SIDE: finishSession() is the only thing that ever credited a program session,
-- and it runs on the phone. When the phone never sends it, the session stays open forever.
-- VERIFIED in prod: Kerwin's 2026-11-05 day2 (20 sets) and 2026-10-05 day2 (21 sets) and
-- 2026-08-05 day3 (20 sets) all sat completed=false; for 11-05 no workout_sessions PATCH and
-- no finish-path sets read ever reached the server after the last set at 04:51:52Z.
--
-- WHAT "CREDITED LIKE finishSession()" MEANS HERE, traced against tandem.html:
--   finishSession() writes completed=true, total_volume_lbs, duration_minutes,
--   session_type='strength', notes. Everything else it "does" is derived:
--     streaks              -> streak_recompute_on_session trigger (migrations/0020)
--     points / leaderboard -> competition_leaderboard view over completed rows (0018)
--     PR count             -> read from sets.is_pr, written at set insert by trigger
--     calibration          -> computeCalibration1RMs() returns early once
--                             users.calibration_complete (true for both accounts today)
--   So this writes completed, total_volume_lbs and session_type, and lets the triggers do
--   the rest. total_volume_lbs = sum(weight_lbs * reps) over the session's sets, the same
--   dbVolume finishSession() computes (it also takes max() with the phone's local copy,
--   which the server cannot see). duration_minutes stays NULL: finishSession() measures
--   Start-to-Finish, and there was no Finish, so no honest number exists. notes untouched.
--
-- SCOPE: program sessions only. One-offs have their own finisher (finishOneOff) and are
-- excluded, as are skipped rows and rows already closed.
--
-- BACKLOG BOUNDARY: p_since defaults to the moment this shipped. Rows opened before it are
-- NOT swept — the 2026-08-05 and 2026-10-05 sessions wait for Kerwin's word, because
-- crediting them moves his program queue and week. Raise or lower p_since only on his ruling.
--
-- SECURITY: SECURITY DEFINER, and EXECUTE is revoked from every client role, so no app
-- user can finish anyone's session through RPC; only pg_cron (postgres) runs it.

create extension if not exists pg_cron;

create or replace function public.auto_finish_stale_sessions(
  p_idle  interval    default interval '6 hours',
  p_since timestamptz default '2026-11-15 19:30:00+00'
) returns table (credited integer, closed integer)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_credited integer := 0;
  v_closed   integer := 0;
begin
  -- 1. Credit: open program sessions whose LAST logged set is p_idle old.
  with stale as (
    select w.id, round(coalesce(sum(s.weight_lbs * s.reps), 0)) as vol
      from public.workout_sessions w
      join public.sets s on s.session_id = w.id
     where w.completed = false
       and coalesce(w.session_type, 'strength') not in ('oneoff', 'skipped', 'abandoned')
       and w.created_at >= p_since
     group by w.id
    having max(s.created_at) < now() - p_idle
  )
  update public.workout_sessions w
     set completed        = true,
         total_volume_lbs = stale.vol,
         session_type     = coalesce(w.session_type, 'strength')
    from stale
   where w.id = stale.id
     and w.completed = false;
  get diagnostics v_credited = row_count;

  -- 2. Close, never credit: open program sessions with ZERO sets, opened p_idle ago.
  update public.workout_sessions w
     set session_type = 'abandoned'
   where w.completed = false
     and coalesce(w.session_type, 'strength') not in ('oneoff', 'skipped', 'abandoned')
     and w.created_at >= p_since
     and w.created_at < now() - p_idle
     and not exists (select 1 from public.sets s where s.session_id = w.id);
  get diagnostics v_closed = row_count;

  return query select v_credited, v_closed;
end;
$$;

revoke all on function public.auto_finish_stale_sessions(interval, timestamptz) from public;
revoke all on function public.auto_finish_stale_sessions(interval, timestamptz) from anon, authenticated;

-- Every 15 minutes, so a session is finished at most 6h15m after its last set.
select cron.schedule(
  'tandem-auto-finish-stale-sessions',
  '*/15 * * * *',
  $cron$select public.auto_finish_stale_sessions()$cron$
);
