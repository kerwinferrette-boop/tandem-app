-- ═══════════════════════════════════════════════════════════════════════════
-- BUG-77, part 2 (cleanup) — retire the NULL-template_id principle scaffold.
--
-- ███ NOT APPLIED. APPLY LAST, AFTER 0009 IS APPLIED AND ASSERTED.           ███
-- ███ This is the least reversible step in the sequence: the DELETE is not   ███
-- ███ recoverable from the schema, only from the seed files.                 ███
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- WHY THIS EXISTS
--
-- The scaffold was a row in program_principles with template_id IS NULL, emitted
-- ahead of every template so the UNSCOPED D16 trigger had something to find during
-- a cold seed. Migration 0002 added the partial unique index dropped below purely
-- so that row could be upserted:
--
--   program_principles_global_key_uniq
--     UNIQUE (principle_key) WHERE (template_id IS NULL)
--
-- Once 0009 scopes the trigger to `p.template_id = new.id`, a NULL-template_id row
-- satisfies nothing — it vouches for no template. It is not a fallback, not a
-- shared library entry, and not a promotion candidate. It is a row that exists to
-- answer a question nobody asks any more.
--
-- Ruled 2026-08-15 (BUG-77 pt 2, D16 Notion page 3a7ca37f935b81ce8e88dff8a505fb12):
-- the scaffold is REMOVED OUTRIGHT — not promoted to the first template that wants
-- it, not retained until after adoption.
--
-- scripts/sync-seed-programs.mjs no longer emits it; the cold-seed ordering problem
-- it worked around is now handled by the three-statement write protocol (insert the
-- template with science_overrides = '{}', insert its principles, patch the
-- overrides on). migrations/epic031_seed_programs.sql has been regenerated with
-- zero scaffold statements — verified, not assumed.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- PRE-FLIGHT — run this ALONE first and read the output.
-- Prod audit on 2026-08-15 returned ZERO rows, so this DELETE is expected to be a
-- no-op that exists to guarantee the state rather than to change it. If it returns
-- rows now, something wrote a scaffold since — STOP and find out what, because the
-- emitter that used to do it no longer can.
--
-- select id, principle_key, created_by, left(claim, 60) as claim_head
--   from public.program_principles where template_id is null;
-- EXPECT: 0 rows.
-- ---------------------------------------------------------------------------

begin;

-- Any row here is by definition unreferenced under the scoped rule: no template can
-- cite it, because citation now requires template_id to match the citing template.
delete from public.program_principles where template_id is null;
-- EXPECT: DELETE 0 (see PRE-FLIGHT).

-- The index existed ONLY to make the scaffold upsertable. With no NULL-template_id
-- rows permitted, it indexes an empty set forever.
--
-- Note for anyone re-reading ON CONFLICT code later: a partial unique index can only
-- serve as an arbiter if the statement repeats its WHERE clause verbatim
-- (`on conflict (principle_key) where template_id is null`). That is the shape the
-- old emitter used, and dropping this index is what makes that shape un-writable —
-- which is the point. The remaining arbiter is program_principles_template_key_uniq
-- on (template_id, principle_key), which is what every writer should now use.
drop index if exists public.program_principles_global_key_uniq;

commit;

-- ---------------------------------------------------------------------------
-- ROLLBACK — restores the index. Does NOT restore deleted rows.
-- Recreating the index is one statement; the rows are only recoverable by
-- re-running the emitter from seeds/*.json, and the emitter no longer produces
-- them. That asymmetry is why this migration is sequenced last.
--
-- create unique index program_principles_global_key_uniq
--   on public.program_principles (principle_key) where (template_id is null);
-- ---------------------------------------------------------------------------

-- ═══════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION ASSERTIONS — run each inside begin; ... rollback;
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ASSERTION 1 · no scaffold rows survive. EXPECT: 0.
-- select count(*) from public.program_principles where template_id is null;

-- ── ASSERTION 2 · the index is gone. EXPECT: 0 rows.
-- select indexname from pg_indexes
--  where schemaname = 'public' and tablename = 'program_principles'
--    and indexname = 'program_principles_global_key_uniq';

-- ── ASSERTION 3 · the per-template arbiter still stands (every writer depends on
-- it for ON CONFLICT). EXPECT: 1 row, on (template_id, principle_key).
-- select indexdef from pg_indexes
--  where schemaname = 'public' and tablename = 'program_principles'
--    and indexname = 'program_principles_template_key_uniq';

-- ── ASSERTION 4 · the corpus is still D16-clean after the purge — i.e. nothing was
-- silently depending on a scaffold row. EXPECT: every row 'OK — own row'.
-- with ov as (
--   select t.id as template_id, t.slug, k.key as override_key
--     from public.workout_templates t
--     cross join lateral jsonb_object_keys(coalesce(t.science_overrides,'{}'::jsonb)) as k(key)
-- )
-- select ov.slug, ov.override_key,
--        case when exists (select 1 from public.program_principles p
--                           where p.principle_key = ov.override_key
--                             and p.template_id = ov.template_id)
--             then 'OK — own row' else 'ORPHANED BY THE PURGE' end as verdict
--   from ov order by verdict desc;

-- ── ASSERTION 5 · the regenerated seed file is idempotent against the new shape.
-- Run migrations/epic031_seed_programs.sql twice inside one rolled-back transaction
-- and confirm the principle count does not grow — the orphan-per-re-run behaviour
-- described in 0002's notes is exactly what this sequence removes.
-- EXPECT: before = after.
-- begin;
--   select count(*) as before from public.program_principles;
--   \i migrations/epic031_seed_programs.sql
--   \i migrations/epic031_seed_programs.sql
--   select count(*) as after from public.program_principles;
-- rollback;
-- ═══════════════════════════════════════════════════════════════════════════
