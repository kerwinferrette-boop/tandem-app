-- =====================================================================================
-- 0001_baseline_live_schema.sql — EPIC-031 program library, RECONSTRUCTED FROM LIVE
-- =====================================================================================
--
-- WHAT THIS IS, AND WHY IT READS BACKWARDS
--
-- This file was reverse-engineered from the LIVE Supabase project (zsvktcvqmppsshtpeljt)
-- on 2026-07-28 by reading information_schema, pg_constraint and pg_policies. It is NOT
-- the migration that created the schema — that migration was written on 2026-07-24 inside
-- an ephemeral container, applied to the live project, and then lost when the container
-- was reclaimed without ever being pushed. The database kept the effect; git kept nothing.
--
-- So the dependency currently runs the wrong way: Supabase is the source of truth and this
-- file is derived from it. The correct direction is the reverse — a migration exists as a
-- committed file FIRST, and the live database is its effect. This baseline exists to make
-- that inversion recoverable: from here forward, schema changes get a numbered file in this
-- directory in the SAME change that applies them.
--
-- ALREADY APPLIED. Do not run this against zsvktcvqmppsshtpeljt — every object below
-- already exists there. It is a restore point and a review surface, not a pending change.
--
-- Verified live row counts at capture: exercises 171, workout_templates 2 (both published),
-- template_blocks 6, template_days 24, template_exercises 162, program_principles 1.
-- =====================================================================================

-- ---------- exercises (EPIC-026 canonical library) ----------
CREATE TABLE IF NOT EXISTS public.exercises (
    id                uuid NOT NULL DEFAULT gen_random_uuid(),
    slug              text NOT NULL,
    name              text NOT NULL,
    tier              text NOT NULL,
    category          text NOT NULL,
    muscle_primary    text[] NOT NULL DEFAULT '{}'::text[],
    muscle_secondary  text[] NOT NULL DEFAULT '{}'::text[],
    emphasis          text[] NOT NULL DEFAULT '{}'::text[],
    one_rm_factor     numeric,
    unit              text NOT NULL DEFAULT 'reps'::text,
    secs              integer,
    video_id          text,
    why               text,
    cues              text[] NOT NULL DEFAULT '{}'::text[],
    equipment         text,
    -- EPIC-026 deep tags: columns EXIST but are 0/171 populated as of 2026-07-28.
    movement_pattern  text,
    unilateral        boolean,
    complexity        text,
    position_bias     text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT exercises_pkey PRIMARY KEY (id),
    CONSTRAINT exercises_slug_key UNIQUE (slug),
    CONSTRAINT exercises_name_key UNIQUE (name),
    CONSTRAINT exercises_tier_check CHECK (tier = ANY (ARRAY['home','hotel_gym','full_gym'])),
    CONSTRAINT exercises_category_check CHECK (category = ANY (ARRAY['compound','isolation','core','cardio'])),
    CONSTRAINT exercises_unit_check CHECK (unit = ANY (ARRAY['reps','sec','bw'])),
    CONSTRAINT exercises_equipment_check CHECK (equipment = ANY (ARRAY['barbell','dumbbell','cable','machine','bodyweight','band'])),
    CONSTRAINT exercises_movement_pattern_check CHECK (movement_pattern = ANY (ARRAY['hinge','squat','push_h','push_v','pull_h','pull_v','lunge','carry','core','iso','rotation','cardio'])),
    CONSTRAINT exercises_complexity_check CHECK (complexity = ANY (ARRAY['low','med','high'])),
    CONSTRAINT exercises_position_bias_check CHECK (position_bias = ANY (ARRAY['lengthened','shortened','mid']))
);

-- ---------- workout_templates ----------
CREATE TABLE IF NOT EXISTS public.workout_templates (
    id                 uuid NOT NULL DEFAULT gen_random_uuid(),
    name               text NOT NULL,
    slug               text NOT NULL,
    author_id          uuid NOT NULL,
    is_published       boolean NOT NULL DEFAULT false,
    author_attribution text,
    parent_goal        text NOT NULL,
    code_goal_mapping  text NOT NULL,
    duration_weeks     integer NOT NULL,
    days_per_week      integer NOT NULL,
    split_type         text,
    intensity_tier     text,   -- BUG-60: currently holds an EQUIPMENT value ('full_gym'), unconstrained, unread
    difficulty         text NOT NULL,
    tagline            text,
    description        text,
    coaching_notes     text,
    science_overrides  jsonb NOT NULL DEFAULT '{}'::jsonb,
    source_provenance  jsonb,
    cloned_from        uuid,   -- adoption lineage (EPIC-030 Phase A)
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT workout_templates_pkey PRIMARY KEY (id),
    CONSTRAINT workout_templates_slug_key UNIQUE (slug),
    CONSTRAINT workout_templates_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id),
    CONSTRAINT workout_templates_cloned_from_fkey FOREIGN KEY (cloned_from) REFERENCES public.workout_templates(id),
    CONSTRAINT workout_templates_parent_goal_check CHECK (parent_goal = ANY (ARRAY['build_muscle','fat_burn','transform','strength','maintenance'])),
    CONSTRAINT workout_templates_code_goal_mapping_check CHECK (code_goal_mapping = ANY (ARRAY['build_muscle','fat_burn','transform'])),
    CONSTRAINT workout_templates_duration_weeks_check CHECK (duration_weeks >= 4 AND duration_weeks <= 12),
    CONSTRAINT workout_templates_days_per_week_check CHECK (days_per_week >= 2 AND days_per_week <= 6),
    CONSTRAINT workout_templates_difficulty_check CHECK (difficulty = ANY (ARRAY['beginner','intermediate','advanced']))
);

-- ---------- template_blocks (periodization overlay) ----------
CREATE TABLE IF NOT EXISTS public.template_blocks (
    id                 uuid NOT NULL DEFAULT gen_random_uuid(),
    template_id        uuid NOT NULL,
    block_order        integer NOT NULL,
    week_start         integer NOT NULL,
    week_end           integer NOT NULL,
    name               text,
    rep_scheme_by_week jsonb NOT NULL DEFAULT '{}'::jsonb,
    technique_by_week  jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT template_blocks_pkey PRIMARY KEY (id),
    CONSTRAINT template_blocks_template_id_block_order_key UNIQUE (template_id, block_order),
    CONSTRAINT template_blocks_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.workout_templates(id) ON DELETE CASCADE,
    CONSTRAINT template_blocks_check CHECK (week_end >= week_start)
);

-- ---------- template_days (split-as-data) ----------
CREATE TABLE IF NOT EXISTS public.template_days (
    id             uuid NOT NULL DEFAULT gen_random_uuid(),
    template_id    uuid NOT NULL,
    block_id       uuid NOT NULL,
    day_order      integer NOT NULL,
    label          text NOT NULL,
    muscle_targets text[] NOT NULL DEFAULT '{}'::text[],
    CONSTRAINT template_days_pkey PRIMARY KEY (id),
    CONSTRAINT template_days_block_id_day_order_key UNIQUE (block_id, day_order),
    CONSTRAINT template_days_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.workout_templates(id) ON DELETE CASCADE,
    CONSTRAINT template_days_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.template_blocks(id) ON DELETE CASCADE
);

-- ---------- template_exercises ----------
CREATE TABLE IF NOT EXISTS public.template_exercises (
    id                      uuid NOT NULL DEFAULT gen_random_uuid(),
    day_id                  uuid NOT NULL,
    exercise_id             uuid NOT NULL,
    ex_order                integer NOT NULL,
    sets                    integer NOT NULL,
    reps                    text NOT NULL,   -- range string, e.g. '8-12'
    rest                    integer NOT NULL,-- seconds
    role                    text NOT NULL,
    technique               text,
    constant_across_program boolean NOT NULL DEFAULT false,  -- D15 fixed-first-lift rule
    CONSTRAINT template_exercises_pkey PRIMARY KEY (id),
    CONSTRAINT template_exercises_day_id_ex_order_key UNIQUE (day_id, ex_order),
    CONSTRAINT template_exercises_day_id_fkey FOREIGN KEY (day_id) REFERENCES public.template_days(id) ON DELETE CASCADE,
    CONSTRAINT template_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id),
    CONSTRAINT template_exercises_sets_check CHECK (sets >= 1 AND sets <= 10),
    CONSTRAINT template_exercises_role_check CHECK (role = ANY (ARRAY['primary_compound','secondary_compound','accessory','core','cardio'])),
    CONSTRAINT template_exercises_technique_check CHECK (technique = ANY (ARRAY['rest_pause','drop_set','cardioacceleration','staggered']))
);

-- ---------- program_principles (the reasoning corpus) ----------
--
-- !! DESIGN DEFECT CAPTURED AS-IS — see the note at the bottom of this file.
-- principle_key is GLOBALLY unique, not unique per template.
--
CREATE TABLE IF NOT EXISTS public.program_principles (
    id              uuid NOT NULL DEFAULT gen_random_uuid(),
    principle_key   text NOT NULL,
    claim           text NOT NULL,
    rationale       text NOT NULL,
    source_citation text NOT NULL,
    created_by      uuid,
    template_id     uuid,
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT program_principles_pkey PRIMARY KEY (id),
    CONSTRAINT program_principles_principle_key_key UNIQUE (principle_key),
    CONSTRAINT program_principles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
    CONSTRAINT program_principles_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.workout_templates(id) ON DELETE SET NULL
);

-- =====================================================================================
-- ROW LEVEL SECURITY
-- Shape: SELECT is "published OR mine", chained to the owning template for child tables.
-- Writes are author-scoped, chained the same way. This is the multi-user-safe part that
-- survived the EPIC-031 loss, and it is the most valuable thing in this file.
-- =====================================================================================

ALTER TABLE public.exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_blocks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_days      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_principles ENABLE ROW LEVEL SECURITY;

-- exercises: readable by all; NO write policy exists, so only the service role can seed.
CREATE POLICY exercises_select ON public.exercises
    FOR SELECT USING (true);

CREATE POLICY templates_select ON public.workout_templates
    FOR SELECT USING (is_published OR author_id = auth.uid());
CREATE POLICY templates_write ON public.workout_templates
    FOR ALL USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY blocks_select ON public.template_blocks
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.workout_templates t
        WHERE t.id = template_blocks.template_id AND (t.is_published OR t.author_id = auth.uid())));
CREATE POLICY blocks_write ON public.template_blocks
    FOR ALL USING (EXISTS (SELECT 1 FROM public.workout_templates t
        WHERE t.id = template_blocks.template_id AND t.author_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.workout_templates t
        WHERE t.id = template_blocks.template_id AND t.author_id = auth.uid()));

CREATE POLICY days_select ON public.template_days
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.workout_templates t
        WHERE t.id = template_days.template_id AND (t.is_published OR t.author_id = auth.uid())));
CREATE POLICY days_write ON public.template_days
    FOR ALL USING (EXISTS (SELECT 1 FROM public.workout_templates t
        WHERE t.id = template_days.template_id AND t.author_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.workout_templates t
        WHERE t.id = template_days.template_id AND t.author_id = auth.uid()));

CREATE POLICY exs_select ON public.template_exercises
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.template_days d
        JOIN public.workout_templates t ON t.id = d.template_id
        WHERE d.id = template_exercises.day_id AND (t.is_published OR t.author_id = auth.uid())));
CREATE POLICY exs_write ON public.template_exercises
    FOR ALL USING (EXISTS (SELECT 1 FROM public.template_days d
        JOIN public.workout_templates t ON t.id = d.template_id
        WHERE d.id = template_exercises.day_id AND t.author_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.template_days d
        JOIN public.workout_templates t ON t.id = d.template_id
        WHERE d.id = template_exercises.day_id AND t.author_id = auth.uid()));

CREATE POLICY principles_select ON public.program_principles
    FOR SELECT USING (true);
CREATE POLICY principles_write ON public.program_principles
    FOR ALL USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- =====================================================================================
-- DEFECTS CAPTURED AT BASELINE — recorded, not fixed here. Fixing needs a NEW migration.
-- =====================================================================================
--
-- 1. program_principles.principle_key is GLOBALLY UNIQUE, not unique per template.
--    D16 matches a science_overrides key to a principle_key on the same template, so the
--    moment a SECOND program needs its own 'rep_floor' justification, the insert fails on
--    the unique constraint. The reasoning corpus is meant to grow one program per day; this
--    constraint caps it at one principle per key across the entire library. Almost certainly
--    should be UNIQUE (template_id, principle_key). File as a bug before ingestion starts.
--
-- 2. program_principles.principles_write requires created_by = auth.uid(), but created_by is
--    NULLABLE. Any row seeded with a null created_by can never be updated or deleted by any
--    authenticated user — only the service role.
--
-- 3. workout_templates.intensity_tier holds an equipment value ('full_gym') and is
--    unconstrained text. That is BUG-60. The Notion taxonomy is Taxing/Moderate/Gentle.
--
-- 4. exercises deep tags (movement_pattern, unilateral, complexity, position_bias) are
--    0/171 populated. The EPIC-026 columns exist; the tagging work does not.
-- =====================================================================================
