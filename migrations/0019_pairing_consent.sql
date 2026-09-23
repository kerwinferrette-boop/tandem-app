-- migrations/0019_pairing_consent.sql
-- Review finding S1 (docs/review-2026-09-23.md), escalated to P0 on 2026-09-23.
-- Kerwin ruling 2026-09-23 ("2A — go"): prove it on the test accounts, then require the
-- other person's consent to pair.
--
-- PROVEN 2026-09-23, on the TEST accounts only, inside blocks that rolled back:
--   (a) connect_partner(): +testdani, acting alone, re-paired +test to itself. The response
--       was success, and +test's partner_id was set with no action from +test.
--   (b) THE BIGGER DOOR: policy users_write_own lets any user edit their OWN row, including
--       partner_id. private.current_partner_id() is one-sided (it only reads the caller's
--       own partner_id). So +testdani set its own partner_id to +test, and +test's sets
--       went from 0 visible to 22 visible. The same applies to sessions, PRs, health
--       snapshots and streaks.
--
-- FIX (all three are needed; any one alone leaves a door open):
--   1. private.current_partner_id() is MUTUAL. You are someone's partner only if BOTH rows
--      point at each other. This is defense in depth.
--   2. Trigger users_guard_partner_id: an app user (role authenticated/anon) can never
--      change partner_id directly. Only SECURITY DEFINER code (connect_partner, running as
--      the function owner) and the dashboard/service role can.
--   3. connect_partner() needs consent from both sides. The first call records a request
--      (users.partner_request_to). When the other person calls it back naming the first
--      person, they are paired, and any previous pairings of either person are cleared.
--      An unknown email gets the same "pending" answer as a real one, so the function no
--      longer reveals which emails have accounts.
--
-- The app does not call connect_partner() anywhere today (verified by grep). Pairing has
-- been set by hand. Existing pairs (Kerwin<->Dani, +test<->+testdani) are already mutual,
-- so nothing visible changes for them.
--
-- APPLIED by Claude on Kerwin's explicit authorization. Rollback: 0019_pairing_consent_ROLLBACK.sql

alter table public.users
  add column if not exists partner_request_to uuid references public.users(id) on delete set null;

create or replace function private.current_partner_id()
 returns uuid
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $$
  select u.partner_id
  from public.users u
  join public.users p on p.id = u.partner_id and p.partner_id = u.id
  where u.id = (select auth.uid());
$$;

create or replace function public.users_guard_partner_id()
 returns trigger
 language plpgsql
 set search_path to 'public', 'pg_temp'
as $$
begin
  if current_user in ('authenticated', 'anon')
     and NEW.partner_id is distinct from (case when TG_OP = 'UPDATE' then OLD.partner_id else null end) then
    raise exception 'partner_id can only change through connect_partner() (both people must agree)'
      using errcode = '42501';
  end if;
  return NEW;
end;
$$;

drop trigger if exists users_guard_partner_id on public.users;
create trigger users_guard_partner_id
  before insert or update on public.users
  for each row execute function public.users_guard_partner_id();

create or replace function public.connect_partner(partner_email text)
 returns json
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $$
declare
  me   uuid := auth.uid();
  them public.users%rowtype;
begin
  if me is null then
    return json_build_object('error', 'Not authenticated');
  end if;

  select * into them from public.users where lower(email) = lower(trim(partner_email));

  if them.id = me then
    return json_build_object('error', 'Cannot partner with yourself');
  end if;
  if them.id is null then
    return json_build_object('pending', true);   -- same answer as a real request: no account probing
  end if;

  if them.partner_request_to = me then
    -- Both people asked for each other: pair them. One partner each, so clear old pairings.
    update public.users set partner_id = null
      where partner_id in (me, them.id) and id not in (me, them.id);
    update public.users set partner_id = them.id, partner_request_to = null where id = me;
    update public.users set partner_id = me,      partner_request_to = null where id = them.id;
    return json_build_object('success', true, 'name', them.name, 'partner_id', them.id);
  end if;

  update public.users set partner_request_to = them.id where id = me;
  return json_build_object('pending', true);
end;
$$;

revoke execute on function public.connect_partner(text) from public, anon;
grant  execute on function public.connect_partner(text) to authenticated;
