-- ROLLBACK for 0020 (re-opens review finding C1 — only run if Kerwin asks to revert).
-- NOTE: the app code after 0020 no longer writes streaks and sends `backdated` on journal
-- inserts; revert the app commit too, or journal saves will fail once the column is dropped.
drop trigger if exists streak_recompute_on_session on public.workout_sessions;
drop trigger if exists streak_recompute_on_pr on public.personal_records;
drop function if exists public.streak_recompute_trg();
drop function if exists public.streak_recompute(uuid);
CREATE OR REPLACE FUNCTION public.update_streak()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  last_date   date;
  cur_streak  int;
  long_streak int;
begin
  if NEW.completed = true and (OLD.completed = false or OLD.completed is null) then
    select last_session_date, current_streak_days, longest_streak_days
    into last_date, cur_streak, long_streak
    from public.streaks where user_id = NEW.user_id;
    if last_date is null then
      insert into public.streaks
        (user_id, current_streak_days, longest_streak_days, total_sessions, last_session_date)
      values (NEW.user_id, 1, 1, 1, NEW.session_date)
      on conflict (user_id) do update set
        current_streak_days = 1, longest_streak_days = 1,
        total_sessions = streaks.total_sessions + 1,
        last_session_date = NEW.session_date, updated_at = now();
    elsif NEW.session_date = last_date + 1 then
      update public.streaks set
        current_streak_days = cur_streak + 1,
        longest_streak_days = greatest(long_streak, cur_streak + 1),
        total_sessions      = total_sessions + 1,
        last_session_date   = NEW.session_date,
        updated_at          = now()
      where user_id = NEW.user_id;
    elsif NEW.session_date > last_date + 1 then
      update public.streaks set
        current_streak_days = 1,
        total_sessions      = total_sessions + 1,
        last_session_date   = NEW.session_date,
        updated_at          = now()
      where user_id = NEW.user_id;
    end if;
  end if;
  return NEW;
end;
$function$;
CREATE TRIGGER update_streak_on_complete AFTER UPDATE ON public.workout_sessions FOR EACH ROW EXECUTE FUNCTION update_streak();
-- Restore the pre-0020 values.
update public.streaks s set current_streak_days=b.current_streak_days, longest_streak_days=b.longest_streak_days,
  total_sessions=b.total_sessions, total_prs=b.total_prs, total_volume_lbs=b.total_volume_lbs,
  weekly_points=b.weekly_points, last_session_date=b.last_session_date, updated_at=now()
from private.streaks_backup_0020 b where b.user_id = s.user_id;
alter table public.workout_sessions drop column if exists backdated;
