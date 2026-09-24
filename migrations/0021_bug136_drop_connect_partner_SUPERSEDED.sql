-- migrations/0021_bug136_drop_connect_partner_SUPERSEDED.sql
-- (was 0019_bug136_drop_connect_partner.sql; renumbered 2026-09-23 — a different
-- 0019, pairing_consent, was written and APPLIED in a parallel session.)
--
-- ═══ SUPERSEDED — DO NOT APPLY ═══
-- 0019_pairing_consent.sql (APPLIED to prod 2026-09-23) fixed the same BUG-136
-- exploit by REPLACING connect_partner() with a two-sided-consent version and
-- adding a users_guard_partner_id() trigger. connect_partner() is now the ONLY
-- sanctioned write path for partner_id — running this DROP today would delete
-- the fixed, load-bearing function, not the exploitable one this file targeted.
-- Kept for the record of the original exploit analysis only.
--
-- BUG-136. Removes the connect_partner() RPC after a confirmed live exploit.
-- PROPOSED — not yet authorized. APPLYING THIS IS KERWIN'S JOB ALONE
-- (apply_migration is human-only per .claude/loop-config.md).
--
-- WHY: connect_partner(partner_email text) is SECURITY DEFINER, granted EXECUTE
-- to `authenticated` (proacl confirmed live 2026-09-23), and unconditionally does:
--   UPDATE public.users SET partner_id = partner_row.id WHERE id = current_uid;
--   UPDATE public.users SET partner_id = current_uid WHERE id = partner_row.id;
-- with no check whether partner_row (the TARGET, looked up by email, not by the
-- caller's own consent) already has a different partner_id. Confirmed live
-- 2026-09-23 (BUG-136): a throwaway test account with partner_id NULL was made
-- the target of a simulated authenticated call from a paired account; the RPC
-- returned {success:true}, silently repointed the caller's partner AND the
-- target's partner, and orphaned the caller's original (consensual) partner's
-- row, which was left pointing at a partner who no longer points back. No
-- notification, no consent step, no trigger-level guard exists anywhere in the
-- write path (pg_trigger on public.users returns zero rows).
--
-- ═══ WHY DROP INSTEAD OF PATCH — VERIFIED, NOT ASSUMED ═══
-- Repo-wide search (`grep -rn "connect_partner" --include=*.html --include=*.js
-- --include=*.mjs --include=*.sql`, excludes /migrations) returns ZERO matches
-- outside this migrations directory. tandem.html contains no `.rpc(` call at
-- all. The only app-side touch of `partner_id` (tandem.html ~8522-8535) is a
-- plain SELECT that reads an already-set value — nothing in the shipped app
-- ever calls this function. The two real accounts' partner_id values were set
-- by some other means (manual SQL, per repo history), not this RPC.
-- This is therefore DEAD CODE that is simultaneously a live, exploitable attack
-- surface reachable by any authenticated user directly via
-- /rest/v1/rpc/connect_partner, bypassing the app entirely. Per the D17
-- precedent (0008 dropped 6 similarly dead/dangerous DB objects), removing an
-- unused prescriptive/mutating DB object is the correct fix, not patching it —
-- patching would mean guessing at a consent/invite UX that does not exist
-- anywhere in the app today, which is exactly the kind of invented rule
-- CLAUDE.md's prime directive forbids. If a real partner-connect feature is
-- built later, it needs its own explicit two-step invite/accept design
-- (a pending-invite column or table, accepted only by the invitee's own
-- authenticated call) — that is new product surface, not a security patch, and
-- is out of scope here.
--
-- Run each STEP as its own statement (or the whole file in one transaction —
-- there is no CONCURRENTLY step here, so a single `begin; ... commit;` is fine).

begin;

-- STEP 1 — confirm what is being dropped matches what was audited (defensive:
-- fails loudly instead of silently no-op'ing if the function was already
-- changed or removed since this file was written).
DO $$
DECLARE fn_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO fn_def
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'connect_partner';

  IF fn_def IS NULL THEN
    RAISE EXCEPTION 'BUG-136/0019: public.connect_partner() not found — already dropped? Verify before proceeding.';
  END IF;

  IF fn_def NOT LIKE '%SECURITY DEFINER%' OR fn_def NOT LIKE '%UPDATE public.users SET partner_id%' THEN
    RAISE EXCEPTION 'BUG-136/0019: public.connect_partner() body does not match the audited version — re-verify before dropping.';
  END IF;
END $$;

-- STEP 2 — revoke first (belt and suspenders; DROP would remove the grants
-- anyway, but an explicit revoke makes the exposure being closed unambiguous
-- in the statement log).
revoke all on function public.connect_partner(text) from public;
revoke all on function public.connect_partner(text) from anon;
revoke all on function public.connect_partner(text) from authenticated;

-- STEP 3 — the fix.
drop function public.connect_partner(text);

commit;

-- VERIFY (read-only): expect 0 rows.
-- select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--   where n.nspname='public' and p.proname='connect_partner';
--
-- VERIFY (read-only): confirm the two real accounts' existing pairing is
-- untouched — this migration never writes to public.users, only drops a
-- function definition.
-- select id, email, partner_id from public.users
--   where email in ('kerwinferrette@gmail.com','dgaumer03@gmail.com');
