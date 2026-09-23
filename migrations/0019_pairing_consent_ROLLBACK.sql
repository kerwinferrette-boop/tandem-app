-- ROLLBACK for 0019 (re-opens review finding S1 — only run if Kerwin asks to revert).
-- Restores the pre-0019 definitions verbatim (captured from the live DB 2026-09-23).
drop trigger if exists users_guard_partner_id on public.users;
drop function if exists public.users_guard_partner_id();
create or replace function private.current_partner_id()
 returns uuid language sql stable security definer set search_path to 'public', 'pg_temp'
as $$ select partner_id from public.users where id = (select auth.uid()); $$;
CREATE OR REPLACE FUNCTION public.connect_partner(partner_email text)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  partner_row public.users%ROWTYPE;
  current_uid uuid;
BEGIN
  current_uid := auth.uid();
  IF current_uid IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;
  SELECT * INTO partner_row FROM public.users WHERE email = partner_email;
  IF partner_row.id IS NULL THEN
    RETURN json_build_object('error', 'No Tandem account found for that email');
  END IF;
  IF partner_row.id = current_uid THEN
    RETURN json_build_object('error', 'Cannot partner with yourself');
  END IF;
  UPDATE public.users SET partner_id = partner_row.id WHERE id = current_uid;
  UPDATE public.users SET partner_id = current_uid WHERE id = partner_row.id;
  RETURN json_build_object('success', true, 'name', partner_row.name, 'partner_id', partner_row.id);
END;
$function$;
alter table public.users drop column if exists partner_request_to;
