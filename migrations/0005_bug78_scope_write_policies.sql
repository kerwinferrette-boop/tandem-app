-- ═══════════════════════════════════════════════════════════════════════════
-- BUG-78 — the write-side twin of BUG-74
--
-- ███ APPLIED 2026-09-04. Kerwin ruled: both Edge Functions confirmed on      ███
-- ███ service_role (read directly via mcp__Supabase__get_edge_function,      ███
-- ███ independently re-verified). All 4 applicable post-migration assertions ███
-- ███ passed against production; get_advisors(security) unchanged (6-item   ███
-- ███ baseline, none touching user_bug_reports/agent_log). See               ███
-- ███ docs/needs-human-rulings.md's BUG-78 row.                              ███
--
-- Wave 1.1 (BUG-74, migration 0004) narrowed eight permissive SELECT policies.
-- It did NOT audit the write side. This file records that audit and its fix.
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- WHAT WAS AUDITED, AND WHAT CAME BACK CLEAN
--
-- The concern was that the seven `*_write_own` policies are declared `FOR ALL`
-- (covering INSERT/UPDATE/DELETE as well as SELECT) and were written by the
-- same hand, on the same day, in the same file as the `*_read_all` policies
-- BUG-74 had to tear out. If they shared the `qual = true` shape, `anon` could
-- still `DELETE FROM sets`.
--
-- They do not. Every one reads `auth.uid() = user_id` (`auth.uid() = id` on
-- users; challenger/opponent on challenges), and none declares WITH CHECK — so
-- Postgres reuses USING as the check expression on INSERT. With no JWT,
-- auth.uid() is NULL, `NULL = user_id` is NULL, and NULL is not TRUE, so the
-- row is filtered. Verified by running it rather than by reading it, as role
-- `anon`, inside a transaction that ROLLBACKs:
--
--   anon UPDATE public.sets     ......... 0 rows   (denied)
--   anon UPDATE public.users    ......... 0 rows   (denied)
--   anon DELETE public.streaks  ......... 0 rows   (denied)
--   anon DELETE public.medals   ......... 0 rows   (denied)
--
-- So core user data is not writable by an unauthenticated caller. Good.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- WHAT DID NOT COME BACK CLEAN — two policies whose NAME is the whole bug
--
--   user_bug_reports · "Service role updates bug reports"
--       UPDATE  TO public  USING (true)
--   agent_log        · "Service role inserts agent_log"
--       INSERT  TO public  WITH CHECK (true)
--
-- Both are named for `service_role`. Neither does anything for `service_role`:
--
--   select rolbypassrls from pg_roles where rolname='service_role';  -->  t
--
-- service_role bypasses RLS entirely, so a policy can neither grant nor
-- restrict it. What these two policies actually do is grant the capability to
-- role `public` — which includes `anon` and `authenticated`. This is the exact
-- defect class BUG-74 fixed, transposed from SELECT onto UPDATE and INSERT,
-- and it hid behind a name that reads like it is already scoped.
--
-- Measured against prod, in rolled-back transactions:
--
--   as `anon`, no JWT
--     UPDATE user_bug_reports  ........ 30 rows  ← every bug report in the DB
--     INSERT agent_log         ........  1 row   ← accepted
--
--   as `authenticated`, JWT sub = Dani (a legitimate non-Kerwin signed-in user)
--     SELECT user_bug_reports  ........  0 rows   ← correctly cannot READ them
--     UPDATE user_bug_reports  ........ 30 rows   ← but can overwrite all 30
--     INSERT agent_log AS Kerwin's uid    1 row   ← forged attribution accepted
--
-- The read/write asymmetry on user_bug_reports is the sharpest edge: a caller
-- who cannot see a single bug report can still blind-overwrite all thirty,
-- including flipping `status` to 'resolved'. That silently empties the QA feed
-- (tandem.html:5649 filters `.neq('status','resolved')`) — the intake queue
-- would appear clear while real reports sat unread. agent_log accepts rows
-- attributed to any user_id, so the audit log itself is forgeable.
--
-- Severity: below BUG-74 (no PII is exposed and no user's training data can be
-- destroyed) but above hygiene — it is integrity loss on the two tables Tandem
-- uses to know that something is wrong, reachable today with the publishable
-- key shipped in tandem.html:1850. Under EPIC-30, where signup is open, the
-- `authenticated` half becomes trivially reachable too.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- BLOCKING QUESTION — why this file is written but NOT applied
--
-- Two Edge Functions exist, both `verify_jwt: false`:
--   qa-session-validator   (called by the notify_qa_on_complete pg_net webhook)
--   expand-and-log-bug     (writes expanded_description / notion_page_url /
--                           status back onto user_bug_reports — i.e. it is
--                           almost certainly the intended beneficiary of the
--                           "Service role updates bug reports" policy)
--
-- Everything below is a no-op for those functions IF they connect with
-- SUPABASE_SERVICE_ROLE_KEY, because service_role bypasses RLS. It BREAKS the
-- bug-intake enrichment pipeline if they connect with the publishable/anon key.
--
-- Their source is not in this repo and was not read, so this is not being
-- guessed at. Per CLAUDE.md: when the source is silent, flag it, do not invent.
--
--   >>> KERWIN: which key do the two Edge Functions use to talk to Postgres?
--   >>> service_role  -> apply this file as-is, zero behavioural change to them.
--   >>> anon/publishable -> do NOT apply as-is; the durable fix is to switch
--   >>>   them to service_role first (they run server-side with no JWT, so they
--   >>>   have no user identity to act on behalf of anyway), then apply.
--
-- Circumstantial, NOT sufficient to act on: both tables are dormant — newest
-- agent_log row 2026-08-05, newest user_bug_reports row 2026-08-05 — so the
-- blast radius of getting this wrong is currently small. That lowers the cost
-- of the answer being wrong; it does not substitute for the answer.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- S1 · user_bug_reports — replace the blanket UPDATE with the two real callers.
--
-- Kerwin's QA feed resolve button (tandem.html:5703,
-- `sb.from('user_bug_reports').update({status:'resolved'}).eq('id', id)`) runs
-- as `authenticated` with his uid and is TODAY carried solely by the blanket
-- policy — there is no Kerwin-scoped UPDATE policy to fall back on. Dropping
-- the blanket without this replacement would break that button, so the new
-- policy mirrors the uid literal already used by the sibling SELECT policy
-- "Kerwin reads all bug reports", and additionally lets a reporter amend their
-- own row.
-- ---------------------------------------------------------------------------
drop policy if exists "Service role updates bug reports" on public.user_bug_reports;

create policy "bug_reports_update_owner_or_triage" on public.user_bug_reports
  for update to authenticated
  using (
    user_id = (select auth.uid())
    or (select auth.uid()) = 'e636007d-194f-4440-a2cc-9bc514957c64'::uuid
  )
  with check (
    user_id = (select auth.uid())
    or (select auth.uid()) = 'e636007d-194f-4440-a2cc-9bc514957c64'::uuid
  );

comment on table public.user_bug_reports is
  'In-app bug intake. UPDATE is owner-or-triage only (BUG-78); the previous '
  '"Service role updates bug reports" policy was USING(true) TO public, which '
  'granted anon and every signed-in user blind UPDATE on all rows. service_role '
  'is unaffected by any of this — it bypasses RLS.';

-- ---------------------------------------------------------------------------
-- S2 · agent_log — an INSERT must be attributable to the caller making it.
--
-- All 26 existing rows carry a non-null user_id, so requiring one does not
-- invalidate history. WITH CHECK on user_id closes the forged-attribution path
-- shown above (Dani inserting a row stamped with Kerwin's uid).
-- ---------------------------------------------------------------------------
drop policy if exists "Service role inserts agent_log" on public.agent_log;

create policy "agent_log_insert_own" on public.agent_log
  for insert to authenticated
  with check (user_id = (select auth.uid()));

comment on table public.agent_log is
  'QA/agent audit log. INSERT is self-attributed only (BUG-78); the previous '
  '"Service role inserts agent_log" policy was WITH CHECK(true) TO public, so '
  'anon could write rows and any signed-in user could forge another user''s '
  'user_id. service_role bypasses RLS and is unaffected.';

-- ═══════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION ASSERTIONS — run these, do not assume them
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. anon is shut out of both:
--      begin; set local role = anon;
--      with u as (update public.user_bug_reports set status='x' where true returning 1),
--           i as (insert into public.agent_log (user_id,log_type,assertion)
--                 values (null,'probe','probe') returning 1)
--      select (select count(*) from u), (select count(*) from i);
--      rollback;
--      EXPECT: 0, 0  (the INSERT may instead raise — either outcome is a pass)
--
-- 2. A signed-in non-Kerwin user can no longer touch other people's reports:
--      begin; set local role = authenticated;
--      set local request.jwt.claims =
--        '{"sub":"3a6e34b7-d197-47b4-bedb-de49bbe552fb","role":"authenticated"}';
--      with u as (update public.user_bug_reports set status='x' where true returning 1)
--      select count(*) from u;  rollback;
--      EXPECT: 0   (was 30)
--
-- 3. Kerwin's QA feed resolve still works — this is the regression that matters:
--      begin; set local role = authenticated;
--      set local request.jwt.claims =
--        '{"sub":"e636007d-194f-4440-a2cc-9bc514957c64","role":"authenticated"}';
--      with u as (update public.user_bug_reports set status='resolved'
--                 where true returning 1)
--      select count(*) from u;  rollback;
--      EXPECT: 30  (all rows visible+writable to the triage uid)
--
-- 4. get_advisors(security) introduces no new ERROR and no new WARN beyond the
--    known 6-item baseline. (0004 taught this the hard way — a fix that adds
--    advisories is not finished.)
--
-- 5. Only if the Edge Functions use the anon key: re-run the bug-intake path
--    end-to-end and confirm expand-and-log-bug still writes back. If they use
--    service_role, this assertion is not applicable — nothing changed for them.
-- ═══════════════════════════════════════════════════════════════════════════
