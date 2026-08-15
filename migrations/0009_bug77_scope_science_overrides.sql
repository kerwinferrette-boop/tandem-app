-- ═══════════════════════════════════════════════════════════════════════════
-- BUG-77, part 2 — scope validate_science_overrides() to the template's OWN
-- program_principles rows.
--
-- ███ NOT APPLIED. GATED ON THE CODE FIX — see ORDERING below. Applying this  ███
-- ███ before adoptTemplate + sync-seed-programs.mjs ship WILL break adoption. ███
--
-- Migration 0002 split the constraint into UNIQUE (template_id, principle_key) plus
-- a partial unique index on (principle_key) WHERE template_id IS NULL. It did NOT
-- touch the trigger that enforces D16. So the constraint became per-template while
-- the check stayed global. This closes that half.
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- THE DEFECT (live definition, read from pg_proc 2026-08-15, verbatim)
--
--   for k in select jsonb_object_keys(coalesce(new.science_overrides, '{}'::jsonb)) loop
--     if not exists (select 1 from public.program_principles p
--                    where p.principle_key = k) then        -- <<< no template scope
--       raise exception 'D16 violation: science_overrides key "%" has no program_principles row', k;
--     end if;
--   end loop;
--   new.updated_at := now();
--
-- Two consequences, both proven live and rolled back (2026-08-13):
--   1. ANY template can cite ANY other template's principle and pass. D16 says
--      "sovereignty without a cited principle is a D16 failure, not a loophole" —
--      a citation that belongs to someone else is not this template's citation.
--   2. The check is satisfied permanently by the first row ever inserted with that
--      key. It cannot fail again. That is not a leak in the invariant; it makes the
--      invariant vacuous BY CONSTRUCTION.
--
-- scripts/doctrine.mjs's file-side twin was ALREADY correctly scoped — it builds
-- principleKeys from each seed's own `principles` array (doctrine.mjs:731). So the
-- two halves of one invariant disagreed, and the DB half — the one that governs
-- every non-seed writer (ingest, adoption clone, manual SQL) — was the wrong one.
-- This migration makes the DB agree with the gate, not the reverse.
--
-- Ruled 2026-08-15 (LLM Council; D16 Notion page 3a7ca37f935b81ce8e88dff8a505fb12;
-- report + transcript in repo as council-*-2026-08-15-bug77.*):
--   D16 is satisfied ONLY by a program_principles row whose template_id equals the
--   id of the template carrying the override. template_id IS NULL never satisfies
--   D16. Another template's row never satisfies D16.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- PROD AUDIT BEFORE THE CHANGE (2026-08-15, read-only) — run BEFORE, not after.
-- The whole live corpus, checked rather than assumed:
--
--   template          override key   own rows   NULL rows   borrowed   verdict
--   brick-by-brick    rep_floor      1          0           0          already compliant
--
-- One program_principles row exists in total. ZERO scaffold (NULL template_id) rows
-- survive in prod. So this is a clean tightening: it breaks no live row, it writes
-- down the state prod is already in. Re-run the audit query in ASSERTION 0 before
-- applying — if it returns any row whose verdict is not 'OK', STOP and re-derive.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ORDERING — THIS IS THE PART THAT BITES.
--
-- The trigger is BEFORE INSERT OR UPDATE on workout_templates. A writer that
-- inserts the template row FIRST and its principles SECOND cannot pass a scoped
-- check: at the moment the trigger fires, the template's own principles do not
-- exist yet. Two writers are in exactly that shape today:
--
--   1. tandem.html adoptTemplate() — copies science_overrides into the clone
--      (:2543) and clones blocks/days/exercises, but NEVER clones
--      program_principles. It passes today ONLY because the unscoped trigger sees
--      the ORIGINAL's row. Adoption has been silently relying on this bug.
--   2. scripts/sync-seed-programs.mjs — emits a NULL-template_id scaffold row up
--      front precisely to satisfy the unscoped check during a cold seed.
--
-- The rejected fix was CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY DEFERRED, so
-- both rows land before the check runs at COMMIT. It does not work here, for two
-- independent reasons, each verified rather than assumed:
--   (a) The live trigger is BEFORE ... FOR EACH ROW and its final statement is
--       `new.updated_at := now();`. A constraint trigger must be AFTER and cannot
--       mutate NEW, so the conversion would silently DROP updated_at maintenance.
--       "Body unchanged" is not available.
--   (b) supabase-js issues each .upsert() as its own transaction. Adoption is
--       therefore CROSS-transaction, and INITIALLY DEFERRED resolves at COMMIT —
--       it cannot span the two calls at all.
--
-- The fix is write ORDER, not deferral. Every writer of a template carrying
-- science_overrides uses this three-statement protocol, which needs no deferral and
-- is identical in SQL and in the client:
--     1. INSERT the template with science_overrides = '{}'::jsonb   -- passes trivially
--     2. INSERT its program_principles with template_id = <new template id>
--     3. UPDATE the template to set the real science_overrides       -- passes on OWN rows
--
-- APPLY THIS FILE ONLY AFTER both writers use that protocol:
--   [ ] tandem.html adoptTemplate() clones program_principles
--   [ ] scripts/sync-seed-programs.mjs drops the NULL scaffold + regenerated
--       migrations/epic031_seed_programs.sql (GENERATED — never hand-edit)
-- ---------------------------------------------------------------------------

begin;

create or replace function public.validate_science_overrides()
returns trigger
language plpgsql
as $$
declare
  k text;
begin
  -- D16 scope ruling 2026-08-15 (BUG-77 pt 2): the citation must belong to THIS
  -- template. `and p.template_id = new.id` is the entire fix; everything else in
  -- this body is preserved verbatim from the definition it replaces.
  for k in select jsonb_object_keys(coalesce(new.science_overrides, '{}'::jsonb)) loop
    if not exists (select 1 from public.program_principles p
                   where p.principle_key = k
                     and p.template_id = new.id) then
      raise exception
        'D16 violation: science_overrides key "%" has no program_principles row for this template (id %). A row belonging to another template, or one with template_id IS NULL, does not satisfy D16.',
        k, new.id;
    end if;
  end loop;
  -- Preserved. Do NOT move this into a separate trigger without checking the
  -- ordering against every other BEFORE trigger on this table — today there is
  -- exactly one trigger here, so there is no ordering question to get wrong.
  new.updated_at := now();
  return new;
end
$$;

commit;

-- ---------------------------------------------------------------------------
-- ROLLBACK — the definition this replaces, verbatim from pg_proc on 2026-08-15.
-- One statement. Restores the unscoped (vulnerable) behaviour exactly.
--
-- create or replace function public.validate_science_overrides()
-- returns trigger language plpgsql as $$
-- declare k text;
-- begin
--   for k in select jsonb_object_keys(coalesce(new.science_overrides, '{}'::jsonb)) loop
--     if not exists (select 1 from public.program_principles p where p.principle_key = k) then
--       raise exception 'D16 violation: science_overrides key "%" has no program_principles row', k;
--     end if;
--   end loop;
--   new.updated_at := now();
--   return new;
-- end $$;
--
-- No trigger DDL is needed either way: CREATE OR REPLACE FUNCTION keeps the
-- existing trg_validate_science_overrides binding intact.
-- ---------------------------------------------------------------------------

-- ═══════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION ASSERTIONS — run each one INSIDE begin; ... rollback;
-- These are the checks scripts/doctrine.mjs structurally CANNOT make: it is a Node
-- script that reads repo files and has no database connection, and none is possible
-- in CI (standing finding D17). A green `npm run verify` is NOT evidence that this
-- trigger is correct. Run these by hand.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ASSERTION 0 · the audit, re-run. EXPECT: every row verdict = 'OK — own row'.
-- Run this BEFORE applying as the go/no-go, and again AFTER as the regression check.
-- begin;
-- with ov as (
--   select t.id as template_id, t.slug, k.key as override_key
--     from public.workout_templates t
--     cross join lateral jsonb_object_keys(coalesce(t.science_overrides,'{}'::jsonb)) as k(key)
-- )
-- select ov.slug, ov.override_key,
--        case when exists (select 1 from public.program_principles p
--                           where p.principle_key = ov.override_key
--                             and p.template_id = ov.template_id)
--             then 'OK — own row' else 'VIOLATES scoped D16' end as verdict
--   from ov order by verdict desc, ov.slug;
-- rollback;

-- ── ASSERTION 1 · the compliant case still passes. EXPECT: UPDATE 1, no exception.
-- Brick by Brick owns its rep_floor row, so touching it must remain legal.
-- begin;
--   update public.workout_templates set tagline = tagline where slug = 'brick-by-brick';
-- rollback;

-- ── ASSERTION 2 · THE BORROW ATTACK — the bug this migration exists to close.
-- Give a second template Brick by Brick's override WITHOUT its own principle row.
-- EXPECT (before this migration): succeeds — that is the bug.
-- EXPECT (after):  ERROR  D16 violation: ... has no program_principles row for this template
-- begin;
--   update public.workout_templates
--      set science_overrides = '{"rep_floor": 3}'::jsonb
--    where slug = 'redline-recomp';
-- rollback;

-- ── ASSERTION 3 · a NULL-template_id row must NOT satisfy the check.
-- This is the clause that decides the scaffold's fate, so prove it rather than
-- assume it. EXPECT: ERROR (the scaffold row vouches for nobody).
-- begin;
--   insert into public.program_principles (principle_key, claim, rationale, source_citation, template_id)
--   values ('assert3_key', 'assertion probe', 'assertion probe', 'assertion probe', null);
--   update public.workout_templates
--      set science_overrides = '{"assert3_key": 1}'::jsonb
--    where slug = 'redline-recomp';
-- rollback;

-- ── ASSERTION 4 · the three-statement write protocol works end to end.
-- This is the acceptance test for the ordering fix. EXPECT: all three succeed.
-- begin;
--   with t as (
--     insert into public.workout_templates
--       (name, slug, author_id, parent_goal, code_goal_mapping, duration_weeks,
--        days_per_week, split_type, equipment_tier, difficulty, science_overrides)
--     select 'assert4 probe', 'assert4-probe', author_id, parent_goal, code_goal_mapping,
--            duration_weeks, days_per_week, split_type, equipment_tier, difficulty,
--            '{}'::jsonb                              -- step 1: EMPTY overrides
--       from public.workout_templates where slug = 'brick-by-brick'
--     returning id
--   )
--   insert into public.program_principles                -- step 2: OWN principles
--     (principle_key, claim, rationale, source_citation, template_id)
--   select 'rep_floor', 'probe', 'probe', 'probe', t.id from t;
--
--   update public.workout_templates                      -- step 3: overrides ON
--      set science_overrides = '{"rep_floor": 3}'::jsonb
--    where slug = 'assert4-probe';
-- rollback;

-- ── ASSERTION 5 · updated_at maintenance survived the rewrite.
-- The one thing a careless "convert it to a constraint trigger" would have dropped.
-- EXPECT: changed = true.
-- begin;
--   update public.workout_templates set updated_at = 'epoch' where slug = 'brick-by-brick';
--   update public.workout_templates set tagline = tagline  where slug = 'brick-by-brick';
--   select updated_at > now() - interval '1 minute' as changed
--     from public.workout_templates where slug = 'brick-by-brick';
-- rollback;

-- ═══════════════════════════════════════════════════════════════════════════
-- KNOWN LIMITS OF THIS FIX — stated, not glossed
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. The guard is ONE-SIDED. It fires on workout_templates INSERT/UPDATE only.
--    Nothing guards program_principles on DELETE or UPDATE, so a citation can still
--    be deleted out from under a template that depends on it, leaving a template
--    whose override cites a row that no longer exists. Filed as its own bug — it is
--    a different trigger on a different table, not a line missing from this one.
-- 2. A scoped trigger does not repair rows that already violate it; it only governs
--    future writes. ASSERTION 0 is what proves there are none (there are none).
-- 3. claim / rationale / source_citation are free text. `source_citation = 'trust
--    me'` satisfies both this trigger and the doctrine gate. D16 enforces that a
--    citation EXISTS and belongs to the right template; it cannot enforce that the
--    citation is true. That is a review problem, deliberately not a trigger problem.
-- ═══════════════════════════════════════════════════════════════════════════
