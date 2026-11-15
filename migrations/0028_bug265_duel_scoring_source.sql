-- migrations/0028_bug265_duel_scoring_source.sql
-- BUG-265, 2026-11-15. Kerwin, on the duel sheet: "The scoring system didn't change with the
-- rule. Still reads how like I didn't log a workout, then also says that I did, & counts
-- skipped workout as a workout." His ruling from earlier the same day: "A skipped day should
-- not count as a workout that day. It should count as me skipping it".
--
-- Two server-side changes, both at the shared source the duel (and the multi-duel design
-- that will reuse this weekly formula) reads:
--
-- 1. competition_leaderboard: a session counts only when it is completed AND is not a void
--    attempt ('skipped' from skipAhead(), 'abandoned' from the auto-finish sweep). Today a
--    skip row is always completed=false, so it already scored 0 — this makes the rule
--    explicit in the one place points are computed, instead of resting on another writer
--    never setting completed=true on a void row. theme_color now reads users.theme_color;
--    it was a hard-coded '#1B5E38' for every user (0018), which is why the client never
--    selected it. Columns, order and types are unchanged (CREATE OR REPLACE requires it).
--    current_streak stays (a view column cannot be dropped in place) but it is the RAW
--    last-credited streak: the client no longer reads it and renders streaks through
--    liveStreak() instead (tandem.html duelStreak()).
--
-- 2. auto_finish_stale_sessions: the p_since boundary from 0027 was 19:30Z, the moment it
--    shipped. Kerwin's day3 session today was opened at 19:08Z (VERIFIED: 5d5d92e8, 17 sets,
--    last set 19:46Z), so the sweep he asked for would never have finished it. The boundary
--    moves to the start of 2026-11-15 UTC. Older open rows still wait for his word (the
--    zero-set May rows and Dani's 2026-11-12 row are NOT swept by this change).
--
-- No uuid or account literal anywhere: this applies to every user.

create or replace view public.competition_leaderboard
with (security_invoker = on) as
with week_start as (
  select date_trunc('week', current_date::timestamptz)::date as start_date
), sessions_this_week as (
  select ws.user_id, count(*) as sessions_completed
    from public.workout_sessions ws, week_start
   where ws.completed = true
     and coalesce(ws.session_type, 'strength') not in ('skipped', 'abandoned')
     and ws.session_date >= week_start.start_date
   group by ws.user_id
), prs_this_week as (
  select pr.user_id, count(*) as prs_earned
    from public.personal_records pr, week_start
   where pr.achieved_date >= week_start.start_date
   group by pr.user_id
), avg_steps_this_week as (
  select hs.user_id, coalesce(avg(hs.steps), 0::numeric) as avg_steps
    from public.health_snapshots hs, week_start
   where hs.snapshot_date >= week_start.start_date and hs.steps is not null
   group by hs.user_id
)
select u.id as user_id,
       u.name,
       coalesce(u.theme_color, '#1B5E38')::text as theme_color,
       coalesce(s.sessions_completed, 0::bigint)::integer as sessions_completed,
       coalesce(p.prs_earned, 0::bigint)::integer as prs_earned,
       round(coalesce(a.avg_steps, 0::numeric))::integer as avg_steps,
       coalesce(st.current_streak_days, 0) as current_streak,
       coalesce(s.sessions_completed, 0::bigint) * 10
         + coalesce(p.prs_earned, 0::bigint) * 15
         + round(least(coalesce(a.avg_steps, 0::numeric) / 8000.0, 1.0) * 15::numeric)::integer as total_points
  from public.users u
  left join sessions_this_week s on s.user_id = u.id
  left join prs_this_week p on p.user_id = u.id
  left join avg_steps_this_week a on a.user_id = u.id
  left join public.streaks st on st.user_id = u.id;

create or replace function public.auto_finish_stale_sessions(
  p_idle  interval    default interval '6 hours',
  p_since timestamptz default '2026-11-15 00:00:00+00'
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
