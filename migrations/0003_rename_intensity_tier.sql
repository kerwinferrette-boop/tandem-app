-- =====================================================================================
-- 0003_rename_intensity_tier.sql  (BUG-60)
-- Fixes: workout_templates.intensity_tier holds an EQUIPMENT value, not an intensity.
-- Status: NOT APPLIED. Review and run manually — apply_migration is human-only.
-- =====================================================================================
--
-- THE PROBLEM
--
-- Both published templates carry `intensity_tier = 'full_gym'`. That is an
-- equipment tier, not an intensity. The value is hardcoded at
-- scripts/author-seeds.mjs lines 64 and 90 — not authored per program, not
-- derived from anything. The column is unconstrained text (no CHECK, no enum),
-- and the runtime never reads it: the single reference in the app is a
-- pass-through copy during adoption in tandem.html.
--
-- Downstream consequence already observed: the Notion "Named Program Variants"
-- rows for Brick by Brick and Redline Recomp both have Intensity Tier blank,
-- because 'full_gym' has no match against the Taxing / Moderate / Gentle
-- taxonomy and was left empty rather than guessed at.
--
-- THE FIX — Option 1 from BUG-60, recommended there and chosen 2026-08-04
--
-- Rename the column to say what the data actually is. One migration, one line in
-- scripts/author-seeds.mjs, one line in tandem.html.
--
-- SCOPE NOTE — this is INDEPENDENT of BUG-59, despite BUG-60's original note
-- suggesting the rename would "hand the sibling bug the field it needs."
-- It doesn't. The BUG-59 safety filter compares the USER's resolved equipment
-- tier (resolveEquipmentTier(), from sessionStorage/cfg) against each
-- EXERCISE_BANK entry's own `tier`. It never consults this column, and should
-- not: a template-level tier says what the author assumed, not what the user in
-- front of us actually has. This column's real job is library-browser
-- display/filtering ("show me programs I can run at home").
--
-- NOT DONE HERE: adding a real `intensity_tier` on the Taxing/Moderate/Gentle
-- taxonomy. That needs Kerwin's per-program judgement on which tier each program
-- is, and BUG-60 is explicit that it must not be guessed. Separate migration.

BEGIN;

ALTER TABLE public.workout_templates
    RENAME COLUMN intensity_tier TO equipment_tier;

-- Constrain it now that the name is honest. Values match EXERCISE_BANK.tier and
-- the exercises_tier_check on public.exercises.
ALTER TABLE public.workout_templates
    ADD CONSTRAINT workout_templates_equipment_tier_check
    CHECK (equipment_tier IS NULL OR equipment_tier IN ('home', 'hotel_gym', 'full_gym'));

COMMIT;

-- CODE CHANGES REQUIRED IN THE SAME DEPLOY (do not run this migration alone):
--   scripts/author-seeds.mjs:64,90   intensity_tier -> equipment_tier
--   tandem.html (adoption copy)      intensity_tier -> equipment_tier
--   migrations/epic031_program_library.sql is the historical authored record and
--   should NOT be edited; this migration is the forward change.
--
-- Verify after running:
--   SELECT slug, equipment_tier FROM workout_templates WHERE is_published;
-- Expect both rows to return 'full_gym' under the new column name.
