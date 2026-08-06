-- ═══════════════════════════════════════════════════════════════════════════
-- EPIC-033 / EPIC-39 — Step 6 · security remediation (S2 / S3 / S5 / S6)
-- Added at Kerwin's request 2026-08-05. Overlaps BUG-37 (RLS x5) — linked, not
-- duplicated. Acceptance = mcp__supabase__get_advisors before/after.
--
-- Baseline before this migration: 22 advisories —
--   ERROR 5x rls_disabled_in_public      (S2)
--   ERROR 4x security_definer_view       (S3)
--   WARN  4x *_security_definer_function_executable  (S5)
--   WARN  7x function_search_path_mutable            (S6)
--   WARN  1x extension_in_public (pg_net)  + 1x auth_leaked_password_protection
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- S2 · RLS. Two different situations, so two different treatments — enabling
-- RLS is not one decision.
--
-- (a) Tandem reference data. medal_definitions and stake_options are the
--     read-only lookup tables behind EPIC-14 weekly stakes / medals. They are
--     not user data, so the correct shape is read-to-signed-in, write-to-none:
--     writes are seeded by migration or service_role, never by a client.
-- ---------------------------------------------------------------------------
alter table public.medal_definitions enable row level security;
alter table public.stake_options     enable row level security;

drop policy if exists medal_definitions_read_signed_in on public.medal_definitions;
create policy medal_definitions_read_signed_in on public.medal_definitions
  for select to authenticated using (true);

drop policy if exists stake_options_read_signed_in on public.stake_options;
create policy stake_options_read_signed_in on public.stake_options
  for select to authenticated using (true);

comment on table public.medal_definitions is
  'EPIC-14 medal catalogue. Read-only reference data: SELECT to authenticated, '
  'no client write policy — seeded by migration/service_role only (EPIC-033 S2).';
comment on table public.stake_options is
  'EPIC-14 weekly-stake catalogue. Read-only reference data: SELECT to '
  'authenticated, no client write policy (EPIC-033 S2).';

-- ---------------------------------------------------------------------------
-- (b) NOT TANDEM. guests / vendor_research / branding_assets are the
--     wedding-planning tables identified in F9 Group A. They were reachable
--     — read AND write — by anyone holding Tandem's public anon key, which is
--     shipped in tandem.html. That is the actual vulnerability here: a
--     published client key granting write access to an unrelated project's
--     data. No Tandem code path touches them, so RLS with NO policy is the
--     correct posture: anon and authenticated are denied outright, while
--     service_role and the migration/MCP path (postgres) are unaffected,
--     because both bypass RLS.
--
--     Blast radius checked before running, not assumed: all three hold 0 live
--     rows, so nothing can be lost, and the change reverses with a single
--     `alter table ... disable row level security`. If the wedding tooling
--     turns out to connect with the anon key rather than service_role, it will
--     surface immediately as an empty result and is one GRANT away from being
--     restored. The durable fix is still F9 Group A: move them to their own
--     Supabase project.
-- ---------------------------------------------------------------------------
alter table public.guests          enable row level security;
alter table public.vendor_research enable row level security;
alter table public.branding_assets enable row level security;

comment on table public.guests is
  'NOT A TANDEM TABLE (wedding planning). RLS enabled with no policy: denied to '
  'anon/authenticated, reachable only via service_role. See EPIC-033 F9 Group A '
  '— the durable fix is moving this to its own project.';
comment on table public.vendor_research is
  'NOT A TANDEM TABLE (wedding planning). RLS enabled with no policy — see '
  'EPIC-033 F9 Group A.';
comment on table public.branding_assets is
  'NOT A TANDEM TABLE (wedding planning). RLS enabled with no policy — see '
  'EPIC-033 F9 Group A.';

-- ---------------------------------------------------------------------------
-- S3 · SECURITY DEFINER views. All four views ran with the view owner's
-- permissions, so they bypassed the RLS of whoever queried them.
--
-- Safe to switch, established by reading the actual policies rather than
-- assuming: every table these views read (users, workout_sessions, streaks,
-- personal_records, health_snapshots, medals) already carries a `*_read_all`
-- SELECT policy with qual = true. The querying user can therefore already see
-- every row the view returns, so security_invoker changes the enforcement
-- model without changing any result — the couples scoreboard
-- (competition_leaderboard, tandem.html:4957) keeps working.
--
-- medal_comparison additionally reads medal_definitions, which this migration
-- just put behind RLS — hence the read-to-authenticated policy above; without
-- it, invoker-rights medal_comparison would have started returning nothing.
-- ---------------------------------------------------------------------------
alter view public.competition_leaderboard              set (security_invoker = on);
alter view public.medal_comparison                     set (security_invoker = on);
alter view public.weight_trend                         set (security_invoker = on);
alter view public.progressive_overload_recommendations set (security_invoker = on);

-- ---------------------------------------------------------------------------
-- S5 · SECURITY DEFINER functions executable over the REST API.
--
-- Six of the seven public functions return `trigger`. A trigger function has
-- no business being exposed at /rest/v1/rpc/* at all. Revoking EXECUTE does
-- not disarm the triggers: PostgreSQL checks EXECUTE on the trigger function
-- when the TRIGGER IS CREATED, not when it fires (see the post-migration
-- assertion, which fires the workout_sessions triggers as role `authenticated`
-- after the revoke and confirms they still run).
--
-- connect_partner is the one real RPC. It must stay SECURITY DEFINER — it
-- writes the partner_id of the OTHER user's row, which no invoker-rights
-- function could do. But it is meaningless to anon: its own first act is
-- `IF auth.uid() IS NULL THEN RETURN 'Not authenticated'`. Revoking anon's
-- EXECUTE moves that check from the function body to the API boundary.
-- ---------------------------------------------------------------------------
-- The revoke must target PUBLIC, not anon/authenticated. Postgres grants
-- EXECUTE to PUBLIC by default on every new function, and anon/authenticated
-- inherit it; revoking from those two roles individually removes a grant they
-- never held and changes nothing. Established by running it the wrong way
-- first: after `revoke ... from anon, authenticated` the advisor still
-- reported all four functions as REST-executable. `from public` cleared them.
revoke execute on function public.calculate_1rm()              from public;
revoke execute on function public.compute_readiness()          from public;
revoke execute on function public.update_personal_record()     from public;
revoke execute on function public.update_streak()              from public;
revoke execute on function public.validate_science_overrides() from public;
revoke execute on function public.notify_qa_on_complete()      from public;

revoke execute on function public.connect_partner(text) from public;
grant  execute on function public.connect_partner(text) to authenticated;
-- authenticated is re-granted explicitly: this is the in-app pairing call, so
-- its remaining advisor line (0029, "signed-in users can execute") is the
-- intended end state, not an unfixed finding.

-- ---------------------------------------------------------------------------
-- S6 · mutable search_path. An unpinned search_path on a SECURITY DEFINER
-- function is a privilege-escalation path (a caller who can create objects in
-- an earlier schema can shadow an unqualified name).
--
-- `public, pg_temp` is sufficient for all seven, verified rather than guessed:
-- every cross-schema call in these bodies is already schema-qualified
-- (`auth.uid()` in connect_partner, `net.http_post` in notify_qa_on_complete,
-- `public.health_snapshots` / `public.users` elsewhere), so schema
-- qualification bypasses search_path entirely and nothing resolves differently.
-- pg_catalog is always searched implicitly and does not need listing.
-- ---------------------------------------------------------------------------
alter function public.calculate_1rm()              set search_path = public, pg_temp;
alter function public.compute_readiness()          set search_path = public, pg_temp;
alter function public.update_personal_record()     set search_path = public, pg_temp;
alter function public.update_streak()              set search_path = public, pg_temp;
alter function public.validate_science_overrides() set search_path = public, pg_temp;
alter function public.notify_qa_on_complete()      set search_path = public, pg_temp;
alter function public.connect_partner(text)        set search_path = public, pg_temp;

-- ═══════════════════════════════════════════════════════════════════════════
-- DELIBERATELY NOT DONE — flagged, not silently skipped
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. `extension_in_public` (pg_net). Relocating a Supabase-managed extension
--    can break the platform's own wiring and the qa-session-validator webhook
--    that notify_qa_on_complete calls. WARN-level, not user-data-facing.
--    Needs a maintenance window, not a drive-by ALTER.
--
-- 2. `auth_leaked_password_protection`. Not a SQL setting — it is a dashboard
--    toggle (Auth → Providers → Password → "Prevent use of leaked passwords").
--    One click for Kerwin; no migration can do it.
--
-- 3. NEW FINDING, out of Step 6's named scope, NOT fixed here:
--    users / workout_sessions / streaks / personal_records / health_snapshots /
--    medals all carry a SELECT policy with `qual = true` granted to role
--    `public` — which includes `anon`. Anyone holding the anon key shipped in
--    tandem.html can therefore read EVERY user's row, not just their own or
--    their partner's. The couples scoreboard genuinely needs cross-user reads,
--    so the fix is to narrow these to `auth.uid() = user_id OR user_id =
--    (select partner_id from users where id = auth.uid())` — a behavioural
--    change to the competition surface that needs Kerwin's ruling and its own
--    before/after test. Filing rather than fixing: quietly rewriting an auth
--    policy in a security-hygiene pass is how the scoreboard would silently
--    go blank.
--
-- 4. NEW FINDING, unrelated to security, surfaced while proving the triggers
--    still fire: `sets` carries TWO BEFORE INSERT triggers, and Postgres fires
--    same-timing triggers in NAME order — so `check_pr_on_set_insert`
--    (update_personal_record) runs BEFORE `set_1rm_before_insert`
--    (calculate_1rm) and always reads NEW.estimated_1rm_lbs as NULL. The DB's
--    own 1RM calculation is dead on the PR path. It is invisible in production
--    only because the client supplies estimated_1rm_lbs on insert
--    (tandem.html:3610, 3715, 4231) and writes personal_records itself (:3625).
--    Latent, not active. File as its own bug rather than fix it inside a
--    security migration — it touches D11/D12 (earned-only monotonic 1RM), so
--    any fix must go through the doctrine gate.
--
-- ---------------------------------------------------------------------------
-- RESULT (get_advisors before → after): 22 → 6 advisories, ZERO remaining ERRORs.
--   cleared: 5x rls_disabled_in_public (ERROR), 4x security_definer_view (ERROR),
--            2x anon_security_definer_function_executable,
--            1x authenticated_security_definer_function_executable,
--            7x function_search_path_mutable
--   remaining, all intentional: 3x INFO rls_enabled_no_policy (the deny-all
--   wedding tables), 1x WARN extension_in_public (deferred — item 1),
--   1x WARN connect_partner executable by authenticated (by design),
--   1x WARN auth_leaked_password_protection (dashboard toggle — item 2).
-- ---------------------------------------------------------------------------
