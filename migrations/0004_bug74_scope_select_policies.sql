-- ============================================================================
-- 0004 · BUG-74 (P0) — replace 8 wide-open SELECT policies with self-or-partner
-- Wave 1.1 of the Master Build Sequence. Hard gate for EPIC-5 (anon key rotation).
--
-- THE DEFECT
-- Eight tables carried a SELECT policy with `qual = true` granted to role
-- `public`. In Postgres `public` includes `anon`, and Tandem's anon key ships in
-- plaintext inside tandem.html — so anyone who viewed source could issue an
-- UNAUTHENTICATED /rest/v1/ SELECT and receive every user's rows.
--
-- Measured live before this migration, as role `anon` with no JWT at all:
--     users 4 (incl. real email addresses) · workout_sessions 25 · sets 374
--     personal_records 67 · streaks 4 · health_snapshots 0 · medals 0
--     challenges 0
-- The zeroes are empty tables, not protection.
--
-- Four of the tables carried a SECOND redundant policy,
-- `authenticated read all <table>` with qual `auth.role() = 'authenticated'`.
-- RLS policies are OR-ed, so narrowing only the `*_read_all` twin would have
-- changed nothing for signed-in users. Both are dropped.
--
-- Supabase's `get_advisors(security)` does NOT flag any of this: RLS is enabled
-- and policies do exist, they are merely permissive. The linter tests for
-- "RLS off / no policy". A clean advisor run is not proof.
--
-- THE VISIBILITY MODEL (Kerwin's ruling, BUG-74 "Expected Behavior")
--   "A user should be able to read their own rows and their partner's rows.
--    That is what the couples competition surface actually needs. No third
--    party — and certainly no unauthenticated holder of the public anon key —
--    should be able to enumerate every user's workouts, weights, PRs or health
--    snapshots."
-- Every policy below is that sentence and nothing more. No scope was invented.
--
-- WHY THIS IS BEHAVIOURAL, NOT HYGIENE
-- EPIC-033 Step 6 switched all four views to `security_invoker = on`, so
-- competition_leaderboard / medal_comparison / weight_trend /
-- progressive_overload_recommendations are now enforced with the QUERYING
-- user's rights and inherit these policies automatically. The views are
-- deliberately not touched here.
--
-- competition_leaderboard is the only view the app reads (tandem.html:4978) and
-- it aggregates users + workout_sessions + personal_records + health_snapshots
-- + streaks. That is why all five need partner scope and not merely owner
-- scope: owner-only would silently render the partner at 0 points with a 0
-- streak — the scoreboard going quietly wrong, which is worse than it going
-- blank. The app already narrows the view client-side with
-- `.in('user_id', [uid, pid])`, so what the user SEES is unchanged; what the
-- database is willing to HAND OVER is what changes.
--
-- ON connect_partner — NO CHANGE, DELIBERATELY
-- BUG-74's sequencing note asks to fold the `connect_partner` SECURITY DEFINER
-- advisor WARN (0029) into this file. It is already correctly resolved:
-- epic033_security.sql:125-129 revokes EXECUTE from PUBLIC and re-grants it to
-- `authenticated` only, and records that the residual WARN "is the intended end
-- state, not an unfixed finding" — it is the in-app pairing call and signed-in
-- users MUST be able to invoke it. Revoking it would break pairing. It also has
-- to stay SECURITY DEFINER: it writes the partner_id of the OTHER user's row,
-- and it is owned by `postgres` (rolbypassrls = true), which is precisely why
-- pairing still works after this migration locks `users` down. Verified, not
-- assumed. Nothing to do; leaving it alone is the fix.
--
-- NOT ADDRESSED HERE (flagged, not silently skipped)
--   · `extension_in_public` (pg_net) — Supabase-managed, see epic033_security.sql.
--   · `auth_leaked_password_protection` — a dashboard auth setting, not SQL.
--   · `rls_enabled_no_policy` INFO x3 (guests, vendor_research, branding_assets)
--     — non-Tandem tables, ruled out of scope on BUG-37.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- S1 · The partner lookup helper.
--
-- The naive predicate from BUG-74's Code Fix field —
--     user_id = (select partner_id from public.users where id = auth.uid())
-- — cannot be used verbatim ON `users` ITSELF: a policy on `users` whose USING
-- clause selects from `users` is infinite recursion, and Postgres raises
-- 42P17 rather than returning rows. A SECURITY DEFINER function owned by
-- `postgres` (rolbypassrls) breaks the cycle.
--
-- STABLE (not VOLATILE) so the planner evaluates it once per statement instead
-- of once per row. `search_path` is pinned for the same privilege-escalation
-- reason as epic033_security.sql S6.
--
-- WHY SCHEMA `private` AND NOT `public` — established by getting it wrong first.
-- The helper was originally created in `public` with the same
-- `revoke execute ... from public` shape epic033_security.sql S5 uses. Applying
-- it introduced TWO NEW advisor WARNs (0029, anon + authenticated variants):
-- the function was live at /rest/v1/rpc/current_partner_id.
--
-- Root cause, read out of pg_proc.proacl rather than assumed:
--     {postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
-- Supabase ships ALTER DEFAULT PRIVILEGES on schema `public`, so every NEWLY
-- CREATED function there receives a DIRECT EXECUTE grant to anon /
-- authenticated / service_role. `revoke ... from public` removes the implicit
-- PUBLIC grant and leaves those three untouched.
--
-- >>> This CORRECTS the note at epic033_security.sql:112-117. That note is true
-- >>> for functions that ALREADY EXISTED when the default privileges were set —
-- >>> those only ever held the implicit PUBLIC grant. It is NOT true for
-- >>> functions created afterwards. Both statements are correct about their own
-- >>> case; neither generalises.
--
-- The fix is the linter's own remediation: PostgREST exposes only the schemas
-- in its search path (`public`, `graphql_public`), so a helper in `private` is
-- not REST-callable at all — structurally, not by grant hygiene. `authenticated`
-- still resolves it inside a policy via USAGE on the schema. Verified after
-- applying: proacl is now {postgres,authenticated} with no anon entry, and
-- get_advisors(security) is back to the exact 6-item baseline.
-- ---------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.current_partner_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select partner_id from public.users where id = (select auth.uid());
$$;

comment on function private.current_partner_id() is
  'BUG-74: returns the calling user''s partner_id. SECURITY DEFINER to avoid RLS '
  'recursion when used inside a policy on public.users. Reveals nothing a caller '
  'cannot already read from its own users row. Lives in schema `private` because '
  'PostgREST does not expose that schema — the same function in `public` is '
  'REST-callable at /rest/v1/rpc/ and trips advisor 0029.';

revoke execute on function private.current_partner_id() from public;
grant  execute on function private.current_partner_id() to authenticated;

-- ---------------------------------------------------------------------------
-- S2 · Drop the permissive SELECT policies.
--
-- The `*_write_own` policies are FOR ALL, and in Postgres FOR ALL includes
-- SELECT — so own-row reads survive these drops even before the new policies
-- are created below. The new policies are additive partner scope.
-- ---------------------------------------------------------------------------
drop policy if exists "users_read_all"        on public.users;
drop policy if exists "sessions_read_all"     on public.workout_sessions;
drop policy if exists "sets_read_all"         on public.sets;
drop policy if exists "prs_read_all"          on public.personal_records;
drop policy if exists "health_read_all"       on public.health_snapshots;
drop policy if exists "streaks_read_all"      on public.streaks;
drop policy if exists "medals_read_all"       on public.medals;
drop policy if exists "challenges_read_all"   on public.challenges;

-- the redundant signed-in twins (OR-ed with the above; useless to leave behind)
drop policy if exists "authenticated read all workout_sessions"  on public.workout_sessions;
drop policy if exists "authenticated read all personal_records"  on public.personal_records;
drop policy if exists "authenticated read all health_snapshots"  on public.health_snapshots;
drop policy if exists "authenticated read all streaks"           on public.streaks;

-- ---------------------------------------------------------------------------
-- S3 · Self-or-partner SELECT policies.
--
-- Scoped `to authenticated` rather than `to public`: for `anon`, auth.uid() is
-- NULL and every predicate below would evaluate false anyway, but naming the
-- role means anon never evaluates them AT ALL. That matters more than it looks
-- now that the helper lives in `private`: anon holds neither USAGE on the
-- schema nor EXECUTE on the function, so had these policies been `to public`,
-- anon would hit a PERMISSION DENIED error instead of an empty result. Probed
-- as role anon after applying — all eight tables return 0 rows, no error.
-- `(select auth.uid())` is wrapped so the planner hoists it to an InitPlan
-- instead of re-calling it per row.
-- ---------------------------------------------------------------------------

-- users: the id/partner_id form of the predicate. The third disjunct covers the
-- window inside connect_partner between its two UPDATEs, when the pairing is
-- still one-directional.
create policy "users_read_self_or_partner" on public.users
  for select to authenticated
  using (
    id = (select auth.uid())
    or id = private.current_partner_id()
    or partner_id = (select auth.uid())
  );

create policy "sessions_read_self_or_partner" on public.workout_sessions
  for select to authenticated
  using (user_id = (select auth.uid()) or user_id = private.current_partner_id());

create policy "sets_read_self_or_partner" on public.sets
  for select to authenticated
  using (user_id = (select auth.uid()) or user_id = private.current_partner_id());

create policy "prs_read_self_or_partner" on public.personal_records
  for select to authenticated
  using (user_id = (select auth.uid()) or user_id = private.current_partner_id());

create policy "health_read_self_or_partner" on public.health_snapshots
  for select to authenticated
  using (user_id = (select auth.uid()) or user_id = private.current_partner_id());

create policy "streaks_read_self_or_partner" on public.streaks
  for select to authenticated
  using (user_id = (select auth.uid()) or user_id = private.current_partner_id());

create policy "medals_read_self_or_partner" on public.medals
  for select to authenticated
  using (user_id = (select auth.uid()) or user_id = private.current_partner_id());

-- challenges has no user_id column; participation is challenger_id/opponent_id.
-- This is the same predicate the existing `challenges_write_own` FOR ALL policy
-- uses, so it does not widen anything — it replaces `true` with the scope the
-- table's own write rule already declared.
create policy "challenges_read_participant" on public.challenges
  for select to authenticated
  using (
    challenger_id = (select auth.uid())
    or opponent_id = (select auth.uid())
  );

commit;

-- ============================================================================
-- POST-MIGRATION ASSERTIONS — RUN AGAINST PROD, RESULTS RECORDED
-- Applied and verified 2026-08-13. Every line below is a measurement, not a
-- prediction; re-run any of them to re-establish the claim.
--
-- 1. No wide-open SELECT survives on any of the 8 tables:
--      select tablename, policyname, roles::text, qual
--      from pg_policies
--      where schemaname = 'public'
--        and cmd = 'SELECT'
--        and qual in ('true', '(auth.role() = ''authenticated''::text)')
--        and tablename in ('users','workout_sessions','sets','personal_records',
--                          'health_snapshots','streaks','medals','challenges');
--      -- GOT: 0 rows. The 8 tables now carry 16 policies total — the 8
--      --      pre-existing FOR ALL *_write_own, plus the 8 scoped SELECTs here.
--
-- 2. anon sees nothing (this IS the BUG-74 exploit, re-run verbatim):
--      begin; set local role = anon;
--      select count(*) from public.users; ... rollback;
--      -- GOT: users 0 (was 4, incl. real email addresses) · sets 0 (was 374)
--      --      sessions 0 (was 25) · prs 0 (was 67) · streaks 0 (was 4)
--      --      health 0 · medals 0 · challenges 0 · leaderboard 0
--      -- No permission errors — empty results, which is the correct shape.
--
-- 3. Kerwin still sees Dani through the invoker-rights leaderboard:
--      begin; set local role = authenticated;
--      set local request.jwt.claims =
--        '{"sub":"e636007d-194f-4440-a2cc-9bc514957c64","role":"authenticated"}';
--      select * from public.competition_leaderboard; rollback;
--      -- GOT: exactly 2 rows — Dani current_streak 3, Kerwin current_streak 2.
--      --      Same call also returns users ["Dani","Kerwin"] and sessions 23 /
--      --      sets 330 / prs 54 / streaks 2 — i.e. the union of the two
--      --      accounts, and nothing belonging to the other 2 users in the table.
--
-- 4. An UNPAIRED account still sees its own rows and is not broken:
--      begin;
--      update public.users set partner_id = null
--        where id = 'e636007d-194f-4440-a2cc-9bc514957c64';
--      set local role = authenticated;
--      set local request.jwt.claims = '{"sub":"e636007d-...","role":"authenticated"}';
--      select count(*) from public.users;
--      rollback;                            -- MUST roll back
--      -- GOT: 1 (its own row). current_partner_id() returns NULL and the
--      --      `= NULL` disjuncts are simply never true. No error.
--
-- 5. Pairing still works from a locked-down account — connect_partner is owned
--    by `postgres` (rolbypassrls), so it writes the OTHER user's row despite
--    these policies. Proved by calling it inside a ROLLBACK, not assumed.
--
-- 6. get_advisors(security) — back to the exact pre-change 6-item baseline:
--      3x INFO rls_enabled_no_policy (guests / vendor_research / branding_assets)
--      1x WARN extension_in_public (pg_net)
--      1x WARN connect_partner executable by authenticated (BY DESIGN)
--      1x WARN auth_leaked_password_protection (dashboard toggle)
--    Zero new findings. The two 0029 WARNs this migration briefly introduced on
--    public.current_partner_id() are gone with the move to `private`.
--
-- ---------------------------------------------------------------------------
-- KNOWN COSMETIC CONSEQUENCE (accepted, not a regression to chase)
-- tandem.html:5643 loadQAFeed() — the Kerwin-only admin QA panel — does
-- `sb.from('users').select('id,name,email')` with NO filter, purely to build an
-- id→name map for the feed. It now returns self+partner only, so any third
-- user's entries render as `u.id.slice(0,8)` instead of a name. That is the
-- lockdown working as intended in an admin-only surface. Fixing it properly
-- means a service_role-backed admin read, which is EPIC-7's territory, not a
-- security migration's.
-- ============================================================================
