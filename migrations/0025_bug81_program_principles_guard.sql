-- ═══════════════════════════════════════════════════════════════════════════
-- 0025_bug81_program_principles_guard.sql
-- BUG-81 (P3, ruled 2026-10-01 bug81_council = downgrade_p3_build): the D16 guard is
-- one-sided. validate_science_overrides() (0009) is attached to workout_templates only.
-- Nothing guarded program_principles, so the citation behind a declared deviation could
-- be DELETED, RE-KEYED (UPDATE principle_key) or MOVED (UPDATE template_id) while a
-- template still names that key in science_overrides. This migration makes the pair
-- inseparable in both directions.
--
-- FILE-ONLY. Committed, NOT applied. Applying is Kerwin's step (apply_migration is
-- human-only). A committed migration is not an enforced invariant: this row closes on
-- VERIFIED-APPLIED — the pg_trigger query in PROOF 0 below returning one row AND the
-- dangling-key audit (PROOF 5) returning zero rows. Not on this file being committed.
--
-- HONEST LIMIT: scripts/doctrine.mjs and scripts/bug81-principles-guard-smoke.mjs read
-- repo files; neither can see Postgres (standing finding D17). A green `npm run verify`
-- proves this file is well-formed and carries the intended clauses. It does NOT prove
-- the trigger works. The proofs below do, and they run at apply time.
--
-- READ-ONLY OBSERVATIONS THIS DESIGN RESTS ON (project zsvktcvqmppsshtpeljt, 2026-10-13):
--   * pg_trigger, non-internal, on program_principles + workout_templates: exactly ONE,
--     trg_validate_science_overrides ON workout_templates (BEFORE INSERT OR UPDATE).
--     program_principles has none — that emptiness IS the defect.
--   * program_principles_template_id_fkey is ON DELETE SET NULL, NOT CASCADE. The task
--     brief's "does it cascade?" check therefore resolves to: dropping a template does
--     not delete its principles, it fires an UPDATE setting template_id = NULL on each.
--     That UPDATE reaches this trigger as a template_id change, so the guard must let it
--     through. It does so by asking whether the PARENT TEMPLATE STILL EXISTS (it does not,
--     the delete already happened in the same statement), never by pg_trigger_depth().
--   * workout_templates 2 rows, program_principles 1 row. Dangling keys today: 0.
--
-- DESIGN (five points from the council's post-verdict audit, each load-bearing):
--   1. SECURITY DEFINER + pinned search_path. Under RLS the EXISTS below would run as the
--      CALLER; a workout_templates row hidden from that caller by policy would make it
--      return false and the guard would SILENTLY PASS. A guard that fails open while
--      reporting success is worse than none. search_path is pinned against hijacking.
--   2. The existence check is scoped to the OLD row's template_id. An unscoped check would
--      false-block a legitimate delete because some OTHER template declares the same key.
--   3. UPDATE returns early unless principle_key or template_id actually changed. The seed
--      emitter (scripts/sync-seed-programs.mjs -> migrations/epic031_seed_programs.sql)
--      runs ON CONFLICT (template_id, principle_key) DO UPDATE SET claim/rationale/
--      source_citation on every re-apply; a guard that fires on those breaks every re-seed.
--      The trigger is also declared UPDATE OF principle_key, template_id so those edits do
--      not even enter the function; the early return is the belt to that suspender.
--   4. The SET NULL cascade passes because the parent template is gone, not because of
--      trigger depth (see observation above).
--   5. The template row is locked FOR UPDATE before the check. Under READ COMMITTED a
--      concurrent UPDATE of workout_templates could add the key (its own D16 check sees
--      this principle row as still present) while this statement removes the principle;
--      each sees the other's precondition as true. Locking the template row serialises
--      the two. (The principle row itself is already row-locked by the DELETE/UPDATE that
--      fired us, so it is not locked a second time.)
-- REJECTED: join-table normalisation. ON DELETE RESTRICT fires immediately and would block
-- the legitimate template-delete cascade; this needs NO ACTION semantics a trigger gives.
--
-- ERROR VOCABULARY: same `D16 violation: science_overrides key "%"` prefix the
-- workout_templates path raises (0009), because it is the same invariant seen from the
-- other side. scripts/bug81-principles-guard-smoke.mjs fails if the two prefixes drift.
--
-- TEMPLATE SIDE: already mirrored. 0009 guards workout_templates INSERT and UPDATE (a key
-- needs an own-template principle row); this migration guards the principle side. Deleting
-- a template needs no guard of its own: its principles go to template_id NULL by FK, and a
-- NULL-template row never satisfies D16 (0009), so no override survives its template.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create or replace function public.guard_program_principles_d16()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  declaring_template uuid;
begin
  -- (3) An UPDATE that touches neither the key nor the owning template (claim,
  -- rationale, source_citation: the seed emitter's ON CONFLICT DO UPDATE) is legal.
  if tg_op = 'UPDATE'
     and new.principle_key is not distinct from old.principle_key
     and new.template_id  is not distinct from old.template_id then
    return new;
  end if;

  -- A template-less row cannot be what any template's D16 citation rests on (0009).
  if old.template_id is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  -- (5) Serialise against a concurrent write to the parent template. If the template
  -- is already gone (the FK ON DELETE SET NULL action, point 4), this finds nothing and
  -- the guard steps aside.
  select t.id into declaring_template
    from public.workout_templates t
   where t.id = old.template_id
     and jsonb_exists(coalesce(t.science_overrides, '{}'::jsonb), old.principle_key)
     for update;

  -- (2) scoped to OLD.template_id. Found => that template still declares this key.
  if declaring_template is not null then
    raise exception
      'D16 violation: science_overrides key "%" is still declared by template (id %); its program_principles row cannot be deleted, re-keyed or moved to another template while that override stands. Clear the override on the template first.',
      old.principle_key, old.template_id;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

-- Trigger functions are never callable as RPC, but SECURITY DEFINER code should not
-- carry a default PUBLIC execute grant either.
revoke all on function public.guard_program_principles_d16() from public;

drop trigger if exists trg_guard_program_principles_d16 on public.program_principles;
create trigger trg_guard_program_principles_d16
  before delete or update of principle_key, template_id
  on public.program_principles
  for each row
  execute function public.guard_program_principles_d16();

commit;

-- ---------------------------------------------------------------------------
-- ROLLBACK (one transaction):
--   begin;
--   drop trigger if exists trg_guard_program_principles_d16 on public.program_principles;
--   drop function if exists public.guard_program_principles_d16();
--   commit;
-- 0009's validate_science_overrides() and its trigger are untouched either way.
-- ---------------------------------------------------------------------------

-- ═══════════════════════════════════════════════════════════════════════════
-- PROOFS — Kerwin runs these in the apply session. NOT run by the author.
-- Every probe batch ends in an explicit `rollback;` (see the PROCESS NOTE in 0009:
-- MCP execute_sql autocommits, and an unrolled probe once leaked rows into prod).
-- Negative cases sit behind SAVEPOINTs: the first RAISE aborts the transaction, so a
-- flat script could not run PROOF 2 after PROOF 1. After each expected error, issue
-- `rollback to savepoint <name>;` before continuing. Run in psql / SQL editor, not a
-- driver that auto-wraps each statement.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── PROOF 0 · the guard exists. EXPECT: 1 row, tgenabled = 'O'.
-- select tgname, tgenabled, pg_get_triggerdef(oid)
--   from pg_trigger
--  where tgrelid = 'public.program_principles'::regclass and not tgisinternal;

-- ── PROOF 1-4 · one fixture, four cases. Uses a probe template; touches no real row.
-- begin;
--   insert into public.workout_templates
--     (name, slug, author_id, parent_goal, code_goal_mapping, duration_weeks,
--      days_per_week, split_type, equipment_tier, difficulty, science_overrides)
--   values ('bug81 probe', 'bug81-probe', 'e636007d-194f-4440-a2cc-9bc514957c64',
--           'build_muscle', 'build_muscle', 8, 4, 'body_part', 'full_gym',
--           'intermediate', '{}'::jsonb);
--   insert into public.program_principles
--     (principle_key, claim, rationale, source_citation, created_by, template_id)
--   select 'probe_key', 'c', 'r', 's', 'e636007d-194f-4440-a2cc-9bc514957c64', id
--     from public.workout_templates where slug = 'bug81-probe';
--   update public.workout_templates set science_overrides = '{"probe_key": 1}'::jsonb
--    where slug = 'bug81-probe';
--
--   -- (a) DELETE refused while the override stands.
--   -- EXPECT: ERROR  D16 violation: science_overrides key "probe_key" is still declared ...
--   savepoint a;
--   delete from public.program_principles where principle_key = 'probe_key';
--   rollback to savepoint a;
--   -- (a2) re-key and (a3) move are refused too. EXPECT: the same ERROR each time.
--   savepoint a2;
--   update public.program_principles set principle_key = 'renamed' where principle_key = 'probe_key';
--   rollback to savepoint a2;
--   savepoint a3;
--   update public.program_principles set template_id = null where principle_key = 'probe_key';
--   rollback to savepoint a3;
--
--   -- (c) in-place edit of claim / rationale / source_citation stays legal.
--   -- EXPECT: UPDATE 1, no error.
--   update public.program_principles
--      set claim = 'edited', rationale = 'edited', source_citation = 'edited'
--    where principle_key = 'probe_key';
--
--   -- (b) DELETE allowed once the override is cleared. EXPECT: DELETE 1, no error.
--   update public.workout_templates set science_overrides = '{}'::jsonb where slug = 'bug81-probe';
--   delete from public.program_principles where principle_key = 'probe_key';
--
--   -- (b2) cascade path: dropping a template still releases its principles.
--   insert into public.program_principles
--     (principle_key, claim, rationale, source_citation, created_by, template_id)
--   select 'probe_key2', 'c', 'r', 's', 'e636007d-194f-4440-a2cc-9bc514957c64', id
--     from public.workout_templates where slug = 'bug81-probe';
--   delete from public.workout_templates where slug = 'bug81-probe';
--   -- EXPECT: DELETE 1; probe_key2 now has template_id NULL, no error.
--   select principle_key, template_id from public.program_principles where principle_key = 'probe_key2';
-- rollback;

-- ── PROOF 4d · seed re-apply (case d). migrations/epic031_seed_programs.sql must apply
-- cleanly TWICE with no row growth. EXPECT: identical counts after run 1 and run 2, no error.
-- begin;
--   select (select count(*) from public.workout_templates)  as templates,
--          (select count(*) from public.program_principles) as principles;
--   -- paste the full contents of migrations/epic031_seed_programs.sql here, then again,
--   -- then re-run the count query after each paste.
-- rollback;

-- ── PROOF 5 · dangling-key audit (the closing condition). EXPECT: ZERO rows.
-- select t.slug, k.key as dangling_override_key
--   from public.workout_templates t
--  cross join lateral jsonb_object_keys(coalesce(t.science_overrides,'{}'::jsonb)) as k(key)
--  where not exists (select 1 from public.program_principles p
--                     where p.principle_key = k.key and p.template_id = t.id);
