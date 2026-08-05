-- =====================================================================================
-- 0002_principle_key_per_template.sql
-- Fixes: program_principles.principle_key is GLOBALLY unique, not per-template.
-- Status: NOT APPLIED. Review and run manually — apply_migration is human-only.
-- =====================================================================================
--
-- THE PROBLEM
--
-- The baseline schema carries:
--     CONSTRAINT program_principles_principle_key_key UNIQUE (principle_key)
--
-- D16 enforces sovereignty-requires-provenance by matching a template's
-- `science_overrides` key to a `program_principles` row with the SAME
-- `principle_key`, scoped to that template. "Brick by Brick" sets
-- `science_overrides.rep_floor` and is justified by a principle row with
-- `principle_key = 'rep_floor'`.
--
-- Because the uniqueness is global rather than per-template, the SECOND program
-- that needs its own `rep_floor` justification cannot be inserted at all — the
-- constraint rejects it. The reasoning corpus is designed to grow by roughly one
-- acclaimed program per day (see the ingestion loop in .claude/loop-config.md);
-- this constraint caps it at ONE principle per key for the entire library,
-- forever. It blocks the ingestion loop before it starts, and it silently makes
-- D16 unsatisfiable for any program that shares a doctrinal override with an
-- existing one — which is the common case, not the edge case.
--
-- Verified 2026-08-04: program_principles holds 1 row.
--
-- THE FIX
--
-- Scope uniqueness to the owning template. Two programs may each justify their
-- own `rep_floor`; neither may carry two conflicting `rep_floor` principles.
--
-- NOTE on the nullable template_id: a NULL template_id means a corpus-wide
-- principle not tied to a program. Postgres treats NULLs as distinct in a UNIQUE
-- constraint, so several global principles could share a key. A partial unique
-- index closes that, and is included below.

BEGIN;

ALTER TABLE public.program_principles
    DROP CONSTRAINT IF EXISTS program_principles_principle_key_key;

ALTER TABLE public.program_principles
    ADD CONSTRAINT program_principles_template_key_uniq
    UNIQUE (template_id, principle_key);

-- Template-less (corpus-wide) principles: still one row per key.
CREATE UNIQUE INDEX IF NOT EXISTS program_principles_global_key_uniq
    ON public.program_principles (principle_key)
    WHERE template_id IS NULL;

COMMIT;

-- Verify after running:
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conrelid = 'public.program_principles'::regclass;
-- Expect program_principles_template_key_uniq UNIQUE (template_id, principle_key),
-- and NO program_principles_principle_key_key.
--
-- Then confirm D16 still passes end-to-end:  npm run verify
