-- 0029 — only a privileged role may publish a workout template.
--
-- APPLIED 2026-11-17 on Kerwin's go-ahead (via execute_sql; the drop-if-exists line was omitted
-- because the trigger did not exist). All five post-apply assertions below passed; before the
-- apply, assertions 1 and 2 FAILED (an authenticated account could publish), proving they can fail.
--
-- WHY (audit 2026-11-16)
--   templates_write is `FOR ALL TO authenticated USING/WITH CHECK (author_id = auth.uid())`.
--   That constrains WHOSE row it is and nothing else, so any signed-in account could insert
--   or update its own template with is_published = true. templates_select then shows that
--   row to every signed-in user (`is_published OR author_id = auth.uid()`), which made the
--   program library a channel from any one account to all the others. The client rendered
--   the template's name/tagline/description unescaped, so the channel carried markup; the
--   client is fixed in the same change, but the database must not rely on the client.
--
-- WHAT
--   A BEFORE INSERT OR UPDATE trigger, same shape as users_guard_partner_id (0019): when the
--   statement runs as `authenticated` or `anon`, is_published may not be set true on insert
--   and may not change on update. Privileged roles (postgres / service_role — how the
--   published seeds in epic031_seed_programs.sql are written) are unaffected.
--
-- WHAT THE APP DOES TODAY (checked, tandem.html)
--   Every client write of this column is the literal `false` (clone in adoptTemplate,
--   createCustomTemplate). No client path publishes. So this blocks no existing behaviour.
--
-- PRE-FLIGHT (run first; every published row must be a seed from epic031_seed_programs.sql —
-- anything else is a template some account published itself and needs a human decision).
-- NOTE: an earlier draft filtered on `cloned_from is not null`, which misses a self-created
-- template (createCustomTemplate leaves cloned_from null). Seeds also carry an author_id.
--   select id, name, author_id, cloned_from from public.workout_templates where is_published;
--
-- POST-APPLY ASSERTIONS (each in a transaction ending in ROLLBACK; execute_sql autocommits):
--   1. as authenticated, insert own template with is_published = true      -> 42501
--   2. as authenticated, update own template set is_published = true       -> 42501
--   3. as authenticated, insert own template with is_published = false     -> succeeds
--   4. as authenticated, update own template set name = 'x'                -> succeeds
--   5. as postgres, update a seed row's is_published and set it back       -> succeeds

create or replace function public.workout_templates_guard_is_published()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
begin
  if current_user in ('authenticated', 'anon')
     and NEW.is_published is distinct from
         (case when TG_OP = 'UPDATE' then OLD.is_published else false end) then
    raise exception 'is_published can only be changed by an administrator'
      using errcode = '42501';
  end if;
  return NEW;
end;
$function$;

drop trigger if exists workout_templates_guard_is_published on public.workout_templates;
create trigger workout_templates_guard_is_published
  before insert or update on public.workout_templates
  for each row execute function public.workout_templates_guard_is_published();

-- ROLLBACK
--   drop trigger if exists workout_templates_guard_is_published on public.workout_templates;
--   drop function if exists public.workout_templates_guard_is_published();
