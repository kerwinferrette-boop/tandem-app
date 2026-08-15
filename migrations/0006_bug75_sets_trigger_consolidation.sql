-- ═══════════════════════════════════════════════════════════════════════════
-- BUG-75 — the two BEFORE INSERT triggers on public.sets fire in the wrong
-- order, because Postgres orders same-timing triggers by NAME.
--
-- ███ APPLIED to prod 2026-08-14. All six POST-MIGRATION ASSERTIONS below  ███
-- ███ were run and passed. The client-side half shipped first in 618cdeb.  ███
-- ███ NOTE: applied via execute_sql, so it is NOT registered in            ███
-- ███ supabase_migrations.schema_migrations. Verify against pg_trigger.    ███
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- WHAT IS ACTUALLY WRONG (measured on prod, in rolled-back transactions —
-- not inferred from reading the function bodies)
--
--   check_pr_on_set_insert   ROW BEFORE INSERT          -> update_personal_record()
--   set_1rm_before_insert    ROW BEFORE INSERT/UPDATE   -> calculate_1rm()
--
-- 'c' < 's', so the trigger that READS NEW.estimated_1rm_lbs runs before the
-- trigger that WRITES it. Three distinct failure modes follow, all reproduced:
--
--   A. HARD ABORT / DATA LOSS. INSERT a set with estimated_1rm_lbs omitted for
--      an exercise with no personal_records row -> NULL is inserted into
--      personal_records.best_estimated_1rm_lbs (NOT NULL) -> ERROR 23502 and
--      the WHOLE set INSERT fails. Error context named
--      "PL/pgSQL function update_personal_record() line 10".
--      The database cannot accept a set on its own.
--
--   B. SILENT PR LOSS. Same omission WITH an existing PR row: the guard reads
--      `elsif NEW.estimated_1rm_lbs > existing_pr`, and `NULL > 63` is NULL,
--      which is not TRUE, so the branch is skipped without error. Measured on
--      exercise 'tr-row': inserted 135 lbs x 5 reps against a prior PR of 63.
--      Result: sets.estimated_1rm_lbs = 157.5, is_pr = false,
--      personal_records still 63. A real PR, silently dropped.
--
--   C. SPLIT-BRAIN + D12 VIOLATION. A 20-rep set carrying the client's
--      D12-correct 151.2 lands in personal_records as 151.2 (PR trigger ran
--      first and captured the client value), then calculate_1rm() overwrites
--      sets.estimated_1rm_lbs with pure Epley 166.7. +10.3% disagreement on
--      one physical set, and the sets value violates D12.
--
-- calculate_1rm() is PURE EPLEY AT ALL REP COUNTS and is therefore NOT
-- D12-compliant. That has never produced a wrong number in production only
-- because max(reps) across all 374 rows is 12, and D12 specifies Epley at <=12.
-- The Mayhew branch has never executed in prod. The first 13-rep set changes
-- that. This is latent, not absent.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- THIS IS NOT LATENT — the "masked by the client" framing in the build plan is
-- wrong. Two live client paths send estimated_1rm_lbs off a CACHED SNAPSHOT
-- rather than recomputing it:
--     tandem.html  saveExerciseToCloud   `estimated_1rm_lbs: s.est1rm || null`
--     tandem.html  C11 session rescue    `estimated_1rm_lbs: s.est1rm || null`
-- A snapshot written by a build predating est1rm carries no est1rm, so `|| null`
-- sends NULL and mode A fires. Session health is consistent with this having
-- already happened: 4 of 5 incomplete sessions have zero sets; 1 of 20
-- completed sessions has zero sets. Consistent with — not proof of.
--
-- What IS proof: personal_records is ALREADY WRONG. Recomputing every PR from
-- the 374 stored sets with the D12 formula and diffing against the table shows
-- six exercises recorded BELOW what was actually earned:
--     Tricep Rope Pushdown        112.0 earned / 103 recorded   -9.0
--     Tricep Overhead Extension    91.0 earned /  83 recorded   -8.0
--     Cable Crunch                 70.0 earned /  64 recorded   -6.0
--     Cable Low-to-High Fly        56.0 earned /  51 recorded   -5.0
--     Arnold Press                 56.0 earned /  51 recorded   -5.0
--     Cable Lateral Raise          35.0 earned /  32 recorded   -3.0
-- (~18 further rows differ by <=0.3 — that is Math.round vs round(x,1) noise,
-- not this bug.) See 0007 for the reconciliation, which is a separate decision.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- WHY CONSOLIDATION AND NOT A RENAME
--
-- The cheap fix is to rename set_1rm_before_insert to a_set_1rm_before_insert
-- so it sorts first. It works, today, and it is behaviour-identical on 100% of
-- current traffic. It is still rejected: it re-encodes a hard ordering
-- dependency in a NAME, where nothing enforces it and nothing tests it. The
-- next migration that adds, say, `audit_sets_before_insert` re-opens this bug
-- with no diff to review. The defect is not "the names sort wrong", it is
-- "ordering is controlled by names at all".
--
-- One trigger, one function, explicit sequence. The dependency becomes a line
-- of code instead of a lexical accident.
--
-- ALSO REJECTED: making estimated_1rm_lbs a GENERATED ... STORED column.
-- Postgres cannot ALTER an existing column into a generated one (drop/re-add
-- only), and once generated, ANY insert that SENDS the column errors — both
-- live client paths send it. That is a breaking change dressed as a cleanup.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- AUTHORITY MODEL, stated explicitly because it was previously implicit
--
-- The CLIENT computes estimated_1rm_lbs (tandem.html calcRM, gated by D12 in
-- scripts/doctrine.mjs). The DATABASE fills it ONLY when it arrives NULL, and
-- fills it with the same D12 formula so the two can never disagree.
--
-- Honest limitation, recorded rather than papered over: the doctrine gate is a
-- Node script that reads repo files. It parses calcRM out of tandem.html and
-- runs it in a vm sandbox. It has NO database connection and CANNOT read a live
-- PL/pgSQL body. So the copy of D12 below is, structurally, ungated — a golden
-- .sql diff would only prove the repo agrees with itself, and per this repo's
-- own standing gotcha, files in /migrations are not necessarily what is applied
-- to prod. Do not pretend otherwise. scripts/db-doctrine-probe.mjs (see the
-- ASSERTIONS block) is the manual closer; wiring it into `npm run verify`
-- requires a CI database credential and is a separate decision.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- SEQUENCING — the client half MUST already be live before this is applied.
-- Migrations here are human-applied and can lag a Netlify push by days. If this
-- lands first, nothing breaks (the DB gets strictly more tolerant). If the
-- client half lands first, nothing breaks either (it stops sending NULL). The
-- order is not load-bearing; the overlap is. Do not apply this and revert the
-- client in the same window.
-- ---------------------------------------------------------------------------

begin;

-- SECURITY INVOKER, not DEFINER. An earlier draft of this file said DEFINER and
-- claimed it "matched the two it replaces". That claim was false and the advisor
-- caught it: check_pr_on_set_insert/set_1rm_before_insert were both INVOKER with
-- proacl = {postgres, service_role} only. Applying the DEFINER version raised two
-- NEW advisor WARNs (anon + authenticated can execute it via /rest/v1/rpc/),
-- because a bare CREATE FUNCTION grants EXECUTE to PUBLIC by default. A BEFORE
-- trigger function never needs to be callable directly. The REVOKEs below restore
-- byte-identical privileges to the pair being replaced.
create or replace function public.sets_apply_1rm_and_pr()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_1rm      numeric;
  existing_pr numeric;
begin
  -- ── Step 1 · estimated_1rm_lbs ──────────────────────────────────────────
  -- Client is authority. Fill only when absent. This ordering (fill BEFORE the
  -- PR read) is the entire point of this migration.
  if NEW.estimated_1rm_lbs is null
     and NEW.weight_lbs is not null and NEW.weight_lbs > 0
     and NEW.reps is not null and NEW.reps > 0 then
    if NEW.reps = 1 then
      v_1rm := NEW.weight_lbs;
    elsif NEW.reps <= 12 then
      -- Epley
      v_1rm := NEW.weight_lbs * (1 + NEW.reps::numeric / 30);
    else
      -- Mayhew, floored at the 12-rep Epley value. Run raw, Mayhew(w,13) is
      -- LESS than Epley(w,12) — more reps at the same weight would estimate a
      -- LOWER max. The floor is what makes calcRM monotonic-non-decreasing in
      -- reps. Mirrors tandem.html calcRM exactly; D12 in scripts/doctrine.mjs
      -- asserts that shape on the client copy across 125 (weight, rep) pairs.
      v_1rm := greatest(
        100 * NEW.weight_lbs / (52.2 + 41.9 * exp(-0.055 * NEW.reps::numeric)),
        NEW.weight_lbs * (1 + 12::numeric / 30)
      );
    end if;
    NEW.estimated_1rm_lbs := round(v_1rm, 1);
  end if;

  -- ── Step 2 · personal_records maintenance ───────────────────────────────
  -- Now, and only now, is it safe to read NEW.estimated_1rm_lbs.
  -- The NULL guard is not defensive padding: without it a malformed row takes
  -- down the entire set INSERT (failure mode A). A set with no usable 1RM must
  -- still be storable — losing the log is worse than losing the estimate.
  if NEW.estimated_1rm_lbs is null then
    return NEW;
  end if;

  select best_estimated_1rm_lbs into existing_pr
    from public.personal_records
   where user_id = NEW.user_id and exercise_name = NEW.exercise_name;

  if existing_pr is null then
    insert into public.personal_records
      (user_id, exercise_name, best_estimated_1rm_lbs,
       achieved_weight_lbs, achieved_reps, achieved_date)
    values
      (NEW.user_id, NEW.exercise_name, NEW.estimated_1rm_lbs,
       NEW.weight_lbs, NEW.reps, current_date)
    on conflict (user_id, exercise_name) do nothing;
    NEW.is_pr := true;
  elsif NEW.estimated_1rm_lbs > existing_pr then
    update public.personal_records
       set best_estimated_1rm_lbs = NEW.estimated_1rm_lbs,
           achieved_weight_lbs    = NEW.weight_lbs,
           achieved_reps          = NEW.reps,
           achieved_date          = current_date
     where user_id = NEW.user_id and exercise_name = NEW.exercise_name;
    NEW.is_pr := true;
  end if;

  return NEW;
end;
$$;

revoke all on function public.sets_apply_1rm_and_pr() from public;
revoke all on function public.sets_apply_1rm_and_pr() from anon;
revoke all on function public.sets_apply_1rm_and_pr() from authenticated;

comment on function public.sets_apply_1rm_and_pr() is
  'BUG-75. Single BEFORE INSERT/UPDATE trigger on public.sets. Replaces the pair '
  'check_pr_on_set_insert + set_1rm_before_insert, which Postgres fired in NAME '
  'order — putting the reader of estimated_1rm_lbs before its writer. Step 1 fills '
  'the 1RM only when the client sent NULL, using the D12 formula (Epley <=12 reps, '
  'Mayhew above, floored at the 12-rep Epley value). Step 2 maintains '
  'personal_records and tolerates a NULL 1RM instead of aborting the set INSERT.';

-- Order matters here too: drop both BEFORE creating the replacement, so there is
-- no window in which three triggers race.
drop trigger if exists check_pr_on_set_insert on public.sets;
drop trigger if exists set_1rm_before_insert  on public.sets;

create trigger sets_apply_1rm_and_pr_before_write
  before insert or update on public.sets
  for each row execute function public.sets_apply_1rm_and_pr();

-- The two old FUNCTIONS are deliberately left in place, now unattached. They are
-- dropped in the BUG-72 dead-object sweep, not here — a rollback of this
-- migration should be `drop trigger` + `create trigger` on the originals, with
-- nothing else to restore.
comment on function public.calculate_1rm() is
  'SUPERSEDED by sets_apply_1rm_and_pr() (BUG-75). No longer attached to any '
  'trigger. Retained only as the rollback target for 0006; pure Epley at all rep '
  'counts and therefore NOT D12-compliant. Drop in the BUG-72 sweep.';
comment on function public.update_personal_record() is
  'SUPERSEDED by sets_apply_1rm_and_pr() (BUG-75). No longer attached to any '
  'trigger. Retained only as the rollback target for 0006; aborts the set INSERT '
  'on a NULL 1RM and silently no-ops on the NULL > existing comparison. Drop in '
  'the BUG-72 sweep.';

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION ASSERTIONS — run them, do not assume them
-- ═══════════════════════════════════════════════════════════════════════════
-- 0. Exactly one trigger remains on sets:
--      select tgname from pg_trigger
--       where tgrelid = 'public.sets'::regclass and not tgisinternal;
--      EXPECT: sets_apply_1rm_and_pr_before_write  (one row)
--
-- 1. Failure mode A is closed — a set with NO 1RM and NO prior PR now STORES:
--      begin;
--      insert into public.sets (session_id,user_id,exercise_name,set_number,weight_lbs,reps)
--      values (null,'e636007d-194f-4440-a2cc-9bc514957c64','bug75-probe',1,135,5);
--      select estimated_1rm_lbs, is_pr from public.sets where exercise_name='bug75-probe';
--      rollback;
--      EXPECT: 157.5, true   (was: ERROR 23502, whole INSERT lost)
--
-- 2. Failure mode B is closed — a genuine PR against an existing row registers:
--      begin;
--      insert into public.sets (session_id,user_id,exercise_name,set_number,weight_lbs,reps)
--      values (null,'e636007d-194f-4440-a2cc-9bc514957c64','tr-row',1,135,5);
--      select best_estimated_1rm_lbs from public.personal_records
--       where user_id='e636007d-194f-4440-a2cc-9bc514957c64' and exercise_name='tr-row';
--      rollback;
--      EXPECT: 157.5   (was: still 63, silently)
--
-- 3. Failure mode C is closed — a client-supplied value survives untouched:
--      begin;
--      insert into public.sets (session_id,user_id,exercise_name,set_number,weight_lbs,reps,estimated_1rm_lbs)
--      values (null,'e636007d-194f-4440-a2cc-9bc514957c64','bug75-probe',1,135,20,151.2);
--      select estimated_1rm_lbs from public.sets where exercise_name='bug75-probe';
--      rollback;
--      EXPECT: 151.2   (was: overwritten to 166.7 by pure Epley)
--
-- 4. D12 in the DB matches D12 in the client — THE assertion the doctrine gate
--    structurally cannot make for you. Compare across the 12->13 boundary,
--    which is where a regression would read to a user as one more silently
--    dropped PR:
--      begin;
--      with r as (select generate_series(1,25) as reps)
--      select reps,
--             round(case when reps = 1 then 225::numeric
--                        when reps <= 12 then 225 * (1 + reps::numeric/30)
--                        else greatest(100*225/(52.2+41.9*exp(-0.055*reps::numeric)),
--                                      225*(1+12::numeric/30)) end, 1) as db_1rm
--        from r order by reps;
--      rollback;
--      EXPECT: strictly non-decreasing, and identical to running calcRM(225, r)
--      in tandem.html for every r. 12 -> 315.0, 13 -> 315.0 (the floor holding).
--
-- 5. No new advisor findings:
--      get_advisors(security) introduces no new ERROR and no new WARN over the
--      known 6-item baseline (3 INFO rls_enabled_no_policy + pg_net in public +
--      connect_partner DEFINER + leaked-password-protection).
--      RESULT: this assertion FAILED on first application and is the reason the
--      function is INVOKER with explicit REVOKEs. Do not treat this step as a
--      formality — it is the only thing that caught the privilege regression.
--      Confirm proacl matches the replaced pair exactly:
--        select proname, prosecdef, array_to_string(proacl,' | ')
--          from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--         where n.nspname='public' and proname='sets_apply_1rm_and_pr';
--        EXPECT: false | postgres=X/postgres | service_role=X/postgres
--
-- 6. Live smoke, after the client is deployed: log one real set in the app and
--    confirm sets.estimated_1rm_lbs is non-null and personal_records moved if it
--    should have. Verify by running it, not by reading it.
-- ═══════════════════════════════════════════════════════════════════════════
