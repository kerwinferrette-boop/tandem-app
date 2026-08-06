-- ═══════════════════════════════════════════════════════════════════════════
-- EPIC-033 / EPIC-39 — Source-of-Truth Consistency Audit (2026-08-01)
-- Step 5 · schema reconciliation
-- Notion epic: 3afca37f-935b-8191-8f15-c04da36d1065
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- F4 / BUG-67 — workout_templates.duration_weeks was capped at 12; onboarding
-- has always accepted 4-24. Any authored program longer than 12 weeks was
-- unstorable — which is what blocked the staged 17-week Alex Parry candidate.
--
-- The cap was not a doctrine number. It was written (epic031_program_library.sql:66)
-- while the deload/mesocycle layer only had a literal table for 4-12
-- (SPEC_PART_B_DELOAD_TABLE, doctrine.mjs). EPIC-033 Step 1 replaced the
-- >12 fallback with the derived floor(T/4)-block rule and widened the D4/D7
-- gate loops to 4-24, so 13-24 is now generated, audited and doctrine-legal.
-- Step 4b (D15) then made primary-compound refresh cadence correct at those
-- lengths. The DB is the last artifact still asserting 12.
--
-- Kerwin's ruling 2026-08-05: "Widen it to 4-24, but the tool should be self
-- generative enough to be able to survive whatever number people put in. We
-- can cap at 24 though if it makes you feel better & the code not implode."
-- 24 is kept as the ceiling because 24 is what onboarding offers AND what the
-- doctrine gate actually audits — a template the gate has never inspected must
-- not be storable. Widening past 24 requires widening the gate first.
--
-- Conforms to: D2 (canonical goals unchanged), D4 (cadence bounds now cover
-- 4-24), D7 (spec table still frozen at 4-12), D16 (no tier change).
-- Widening a CHECK is non-destructive: every currently-stored row satisfies
-- the new predicate, so no data is revalidated away.
-- ---------------------------------------------------------------------------
alter table public.workout_templates
  drop constraint if exists workout_templates_duration_weeks_check;

alter table public.workout_templates
  add constraint workout_templates_duration_weeks_check
  check (duration_weeks between 4 and 24);

comment on column public.workout_templates.duration_weeks is
  'Program length in weeks. 4-24 (EPIC-033 F4): 24 is the ceiling because it is '
  'both what onboarding offers and the full range the doctrine gate audits '
  '(scripts/doctrine.mjs D4/D7/D11/D15 all iterate 4..24). Do not widen past 24 '
  'without widening the gate in the same change.';

-- ---------------------------------------------------------------------------
-- F6 / BUG-69 — users.program_source: the 'library' value was legal but no
-- code path ever wrote it. `adoptTemplate` wrote 'template' instead, collapsing
-- two states the EPIC-031 rebuild prompt defines as distinct
-- (.claude/EPIC-031-rebuild-prompt.md:108 "generated | template | library",
--  :122-123 "adoptTemplate — owner-scoped clone ... with program_source='library'").
--
-- Fixed in the APPLICATION layer, not here: the CHECK already permits all three
-- values, so no DDL is required and none is performed. tandem.html now writes
-- 'library' on adoption; getActiveProgram() and the library modal treat both
-- 'library' and 'template' as authored/adopted. 'template' is retained as the
-- reserved direct-assignment state (a coach- or self-assigned template that did
-- not come through the public library) — it has no producer yet, which is why
-- it must not be silently repurposed.
--
-- No backfill: `select program_source, count(*) from public.users group by 1`
-- returned only ('generated', 4) at the time of this migration, so no row is
-- stranded by the corrected semantics.
-- ---------------------------------------------------------------------------
comment on column public.users.program_source is
  'Which program path this user runs. generated = the buildDynamicProgram engine; '
  'library = a template adopted (owner-scoped clone) from the published library, '
  'written by adoptTemplate; template = reserved for direct assignment of a '
  'template that did not come through the library (no producer yet — EPIC-033 F6).';

-- ═══════════════════════════════════════════════════════════════════════════
-- F9 / BUG-72 — UNREFERENCED DB OBJECTS · PROPOSAL ONLY, NOTHING IS DROPPED
-- ═══════════════════════════════════════════════════════════════════════════
-- Method (by running, not reading): the object list came from pg_class over
-- schema `public`; the reference count came from grepping tandem.html +
-- programs.js + scripts/ for each name; every view was probed with a real
-- `select 1 from <view> limit 1`.
--
-- Result: 27 objects in `public`. 12 are referenced by the app. 4 views all
-- SELECT cleanly (none is broken). 15 objects have zero code references.
-- Zero-reference is NOT the same as dead — it splits three ways, and only the
-- first group is genuinely foreign:
--
-- GROUP A — NOT TANDEM. Wedding-planning tables sharing the Tandem project.
--   Confirmed by their columns, not by their names:
--     guests           (rsvp, plus_one, invited_engagement, has_met_dani, know_from)
--     vendor_research  (vendor_id, outreach_draft, research_notes)
--     branding_assets  (canvas_json, thumbnail_url, category, file_url)
--   All 3: 0 live rows, RLS DISABLED, no Tandem code path touches them.
--   They are also 3 of the 5 tables in the S2 RLS advisory (Step 6), which is
--   the real cost of leaving them here: they widen Tandem's attack surface for
--   a feature Tandem does not have.
--   RECOMMENDATION: move to their own Supabase project, then drop here.
--   BLOCKED ON KERWIN — cross-project, destructive, and the wedding tooling
--   (the-vendor-researcher / the-branding-designer / vendor-inbox-tracker
--   skills) may still be pointed at this project. Do not drop blind.
--
-- GROUP B — TANDEM, DEFERRED FEATURE, NOT DEAD. Keep.
--     challenges, medal_definitions, stake_options
--   These are EPIC-14 weekly-stakes / medals. `evaluateWeeklyStakes` and
--   `sendNudge` exist in tandem.html behind the FEATURES.weeklyStakes flag, so
--   the schema is ahead of the UI by design. Dropping them would delete the
--   landing zone for a planned feature. medal_definitions and stake_options
--   are read-only reference data and belong in Step 6's RLS pass (read-to-all,
--   write-to-none), NOT in a drop list.
--
-- GROUP C — TANDEM, GENUINELY UNUSED. Candidates, still not dropped here.
--     progressive_overload_recommendations  (view) — already filed as BUG-38;
--         superseded by getRecommendation() in the client, which is the D11/D12
--         path the doctrine gate actually audits. A second, ungated
--         recommendation source is a doctrine risk, not just clutter.
--     medal_comparison   (view) — selectable; medals UI reads `medals` directly.
--     weight_trend       (view) — selectable; the dashboard reads
--         health_snapshots directly (tandem.html:4943, 5018).
--     exercise_notes     (table, 0 rows) — no reader, no writer.
--   All four are also SECURITY DEFINER-semantics views/objects (no
--   security_invoker set) → they appear in the S3 advisory too.
--   RECOMMENDATION: drop the three views; keep exercise_notes pending a ruling
--   on whether per-exercise notes are still roadmapped.
--   NOT EXECUTED. The statements below are deliberately left commented out.
--
-- ---------------------------------------------------------------------------
-- APPROVED-DROP BLOCK — uncomment ONLY on Kerwin's explicit go-ahead.
-- ---------------------------------------------------------------------------
-- drop view if exists public.progressive_overload_recommendations;  -- BUG-38
-- drop view if exists public.medal_comparison;
-- drop view if exists public.weight_trend;
-- drop table if exists public.exercise_notes;
-- -- Group A, only after the wedding tooling is repointed:
-- -- drop table if exists public.guests;
-- -- drop table if exists public.vendor_research;
-- -- drop table if exists public.branding_assets;
