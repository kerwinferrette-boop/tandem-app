-- migrations/0020_streaks_derived.sql
-- Review finding C1 (docs/review-2026-09-23.md). Kerwin ruling 2026-09-23 ("1A — go"):
-- work out totals from the real workout history instead of keeping running counts.
--
-- WHY: two places each added one to the counts on every finish.
--   - The DB trigger update_streak_on_complete, which fires on UPDATE completed false->true.
--   - JS creditSessionToStreaks(), which runs after that UPDATE.
-- Program days were double-counted. Kerwin's totals read 33 sessions (actual 18) and 57 PRs
-- (actual 51); Dani's read 3 sessions (actual 2). One-offs and journals INSERT with
-- completed=true, so the trigger missed them and only JS counted them. The streak also
-- went up once per SESSION rather than once per DAY.
--
-- FIX: one owner, and it cannot drift. public.streak_recompute(user) derives every value
-- from the rows themselves:
--   total_sessions      = completed workout_sessions
--   total_prs           = personal_records rows (the same unit the leaderboard counts)
--   total_volume_lbs    = sum of completed sessions' volume
--   current_streak_days = run of consecutive calendar days ending at the latest qualifying
--                         day. Distinct dates, so two workouts on one day count as ONE day.
--   longest_streak_days = longest such run
--   last_session_date   = latest qualifying day
-- A qualifying day is a completed session that is NOT backdated. Kerwin 2026-09-14: "Past
-- date, don't count for the streak." A backdated journal entry still counts toward
-- sessions, PRs and volume; the new workout_sessions.backdated flag (set by the journal)
-- only keeps it out of the streak.
-- Triggers on workout_sessions and personal_records re-run it on every
-- insert/update/delete. Recomputing is idempotent, so a double fire or a retry can no
-- longer inflate anything. The app no longer writes to streaks at all.
-- streaks.weekly_points is left untouched: nothing reads it, and the scoreboard's points
-- live in competition_leaderboard (0018).
--
-- APPLIED by Claude on Kerwin's explicit authorization. The pre-change streaks rows are
-- backed up to private.streaks_backup_0020. Rollback: 0020_streaks_derived_ROLLBACK.sql

create table if not exists private.streaks_backup_0020 as select * from public.streaks;

alter table public.workout_sessions
  add column if not exists backdated boolean not null default false;

create or replace function public.streak_recompute(p_user uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $$
declare
  d    date;
  prev date;
  run  int := 0;
  best int := 0;
begin
  if p_user is null then return; end if;
  for d in
    select distinct session_date from public.workout_sessions
    where user_id = p_user and completed and not backdated and session_date is not null
    order by session_date
  loop
    if prev is not null and d = prev + 1 then run := run + 1; else run := 1; end if;
    best := greatest(best, run);
    prev := d;
  end loop;

  insert into public.streaks
    (user_id, current_streak_days, longest_streak_days, total_sessions, total_prs,
     total_volume_lbs, last_session_date, updated_at)
  values (
    p_user, run, best,
    (select count(*) from public.workout_sessions where user_id = p_user and completed),
    (select count(*) from public.personal_records where user_id = p_user),
    (select coalesce(sum(total_volume_lbs), 0) from public.workout_sessions where user_id = p_user and completed),
    prev, now())
  on conflict (user_id) do update set
    current_streak_days = excluded.current_streak_days,
    longest_streak_days = excluded.longest_streak_days,
    total_sessions      = excluded.total_sessions,
    total_prs           = excluded.total_prs,
    total_volume_lbs    = excluded.total_volume_lbs,
    last_session_date   = excluded.last_session_date,
    updated_at          = now();
end;
$$;

create or replace function public.streak_recompute_trg()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $$
begin
  if TG_OP in ('INSERT', 'UPDATE') then
    perform public.streak_recompute(NEW.user_id);
  end if;
  if TG_OP = 'DELETE' or (TG_OP = 'UPDATE' and OLD.user_id is distinct from NEW.user_id) then
    perform public.streak_recompute(OLD.user_id);
  end if;
  return null;
end;
$$;

-- Retire the second counter.
drop trigger if exists update_streak_on_complete on public.workout_sessions;
drop function if exists public.update_streak();

drop trigger if exists streak_recompute_on_session on public.workout_sessions;
create trigger streak_recompute_on_session
  after insert or update or delete on public.workout_sessions
  for each row execute function public.streak_recompute_trg();

drop trigger if exists streak_recompute_on_pr on public.personal_records;
create trigger streak_recompute_on_pr
  after insert or update or delete on public.personal_records
  for each row execute function public.streak_recompute_trg();

-- Only triggers call these, never the client.
revoke execute on function public.streak_recompute(uuid) from public, anon, authenticated;
revoke execute on function public.streak_recompute_trg() from public, anon, authenticated;

-- One-time correction: rebuild every user's row from their real history.
select public.streak_recompute(id) from public.users;
