-- ============================================================================
-- EPIC-031 — Living Program Library: schema migration
-- Author: Kerwin Ferrette (drafted with Claude, 2026-07-24)
-- Status: DRAFT — file only. DO NOT apply to live Supabase (zsvktcvqmppsshtpeljt)
--         until Kerwin has reviewed this SQL (Phase 2 gate).
-- Source of truth: /mnt/Tandem/EPIC-031-Architecture-Plan-2026-07-24.md §2
--                  (approved by Kerwin 2026-07-24)
-- Governing docs: DOCTRINE.md D1–D15 + D16 (new); .claude/loop-config.md
--                 §Two-tier doctrine + §Daily-run ingestion (table names below
--                 match what the ingestion loop expects, verbatim).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 exercises — canonical exercise source (EPIC-026)
-- Seeded by full sync from EXERCISE_BANK in programs.js (Kerwin's decision:
-- full sync). EPIC-026 tags are populated ONLY where a source names them;
-- unknown = NULL, never guessed (source-first rule).
-- ---------------------------------------------------------------------------
-- Full-fidelity sync (Kerwin decision: full EXERCISE_BANK sync — 171 entries,
-- profiled live from programs.js 2026-07-24: fields name/videoId/muscleGroups
-- {primary,secondary}/emphasis/equipment/tier/category/oneRmFactor/why/cues on
-- all 171; unit+secs on 4 timed core holds). Nothing flattened or dropped.
create table if not exists public.exercises (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,   -- stable EXERCISE_BANK key, e.g. 'flat-barbell-press'
  name             text not null unique,
  tier             text not null check (tier in ('home', 'hotel_gym', 'full_gym')),
  category         text not null check (category in ('compound','isolation','core','cardio')),
  muscle_primary   text[] not null default '{}',
  muscle_secondary text[] not null default '{}',
  emphasis         text[] not null default '{}',
  one_rm_factor    numeric,                -- fraction of same-implement baseline 1RM; null for isolation/core/cardio
  unit             text not null default 'reps' check (unit in ('reps', 'sec', 'bw')),
  secs             int,                    -- default hold duration for timed entries
  video_id         text,
  why              text,                   -- selection rationale (authored)
  cues             text[] not null default '{}',
  equipment        text check (equipment in ('barbell','dumbbell','cable','machine','bodyweight','band')),
  -- EPIC-026 tags (nullable by design — fill only from cited sources)
  movement_pattern text check (movement_pattern in
                     ('hinge','squat','push_h','push_v','pull_h','pull_v',
                      'lunge','carry','core','iso','rotation','cardio')),
  unilateral       boolean,
  complexity       text check (complexity in ('low','med','high')),
  position_bias    text check (position_bias in ('lengthened','shortened','mid')),
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2.2 workout_templates — authored program header (EPIC-027 baseline + 031 ext)
-- ---------------------------------------------------------------------------
create table if not exists public.workout_templates (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,          -- display name, e.g. 'Brick by Brick'
  slug               text not null unique,   -- stable key for seeds/upserts, e.g. 'brick-by-brick'
  author_id          uuid not null references auth.users(id),
  is_published       boolean not null default false,
  author_attribution text,
  parent_goal        text not null check (parent_goal in
                       ('build_muscle','fat_burn','transform','strength','maintenance')),
  code_goal_mapping  text not null check (code_goal_mapping in
                       ('build_muscle','fat_burn','transform')),
    -- parent_goal = canonical 5-Goal Taxonomy goal (incl. not-yet-live strength/
    -- maintenance so authored programs can precede code support);
    -- code_goal_mapping = which live PROGRESSION/superset chassis it runs through.
  duration_weeks     int not null check (duration_weeks between 4 and 12),
  days_per_week      int not null check (days_per_week between 2 and 6),
  split_type         text,                -- data, not code: body_part | upper_lower | ppl | full_body | ...
  intensity_tier     text,
  difficulty         text not null check (difficulty in ('beginner','intermediate','advanced')),
  tagline            text,
  description        text,
  coaching_notes     text,
  science_overrides  jsonb not null default '{}'::jsonb,
    -- D16: every key here MUST match a program_principles.principle_key row
    -- (enforced by doctrine gate + validate_science_overrides() below).
  source_provenance  jsonb,               -- author/era/why — own-brand rebuild only, never verbatim
  cloned_from        uuid references public.workout_templates(id),
    -- adopt-as-clone lineage: user copies point at the published original.
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2.3 template_blocks — the periodization overlay (NEW).
-- One row per mesocycle phase. This is where the authoring standard lives:
-- every program 2–6d × 4–12wk carries a real periodization arc — volume ramp,
-- never flat weeks (Kerwin directive 2026-07-24).
-- ---------------------------------------------------------------------------
create table if not exists public.template_blocks (
  id                 uuid primary key default gen_random_uuid(),
  template_id        uuid not null references public.workout_templates(id) on delete cascade,
  block_order        int not null,
  week_start         int not null,
  week_end           int not null,
  name               text,               -- e.g. 'Phase 2 — Build'
  rep_scheme_by_week jsonb not null default '{}'::jsonb,  -- {"1":"12-15","4":"deload"} keyed by week-in-block
  technique_by_week  jsonb not null default '{}'::jsonb,  -- {"1":"rest_pause","3":"drop_set"}
    -- Kerwin decision 2026-07-24: block-final (deload/realization) week runs
    -- CLEAN — no intensifier techniques on recovery weeks (D4 conformance).
  unique (template_id, block_order),
  check (week_end >= week_start)
);

-- ---------------------------------------------------------------------------
-- 2.4 template_days — day identity persists across blocks (Day 2 = Back+Bi)
-- while its accessories rotate; both FKs keep that queryable.
-- ---------------------------------------------------------------------------
create table if not exists public.template_days (
  id             uuid primary key default gen_random_uuid(),
  template_id    uuid not null references public.workout_templates(id) on delete cascade,
  block_id       uuid not null references public.template_blocks(id) on delete cascade,
  day_order      int not null,
  label          text not null,          -- e.g. 'Chest + Triceps'
  muscle_targets text[] not null default '{}',  -- split-as-data
  unique (block_id, day_order)
);

-- ---------------------------------------------------------------------------
-- 2.5 template_exercises — exercise_id FK is the ONE canonical source (EPIC-026)
-- ---------------------------------------------------------------------------
create table if not exists public.template_exercises (
  id                      uuid primary key default gen_random_uuid(),
  day_id                  uuid not null references public.template_days(id) on delete cascade,
  exercise_id             uuid not null references public.exercises(id),
  ex_order                int not null,
  sets                    int not null check (sets between 1 and 10),
  reps                    text not null,  -- '12-15', '3-5', '60' (sec), 'AMRAP'
  rest                    int not null,   -- seconds
  role                    text not null check (role in
                            ('primary_compound','secondary_compound','accessory','core','cardio')),
  technique               text check (technique in
                            ('rest_pause','drop_set','cardioacceleration','staggered')),
  constant_across_program boolean not null default false,
    -- Brick by Brick's fixed first lift per muscle = true → D15 satisfied by data.
  unique (day_id, ex_order)
);

-- ---------------------------------------------------------------------------
-- 2.6 program_principles — the reasoning corpus. D16's other half.
-- ---------------------------------------------------------------------------
create table if not exists public.program_principles (
  id              uuid primary key default gen_random_uuid(),
  principle_key   text not null unique,   -- what science_overrides entries reference
  claim           text not null,
  rationale       text not null,
  source_citation text not null,
  created_by      uuid references auth.users(id),
  template_id     uuid references public.workout_templates(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2.7 users.program_source — which program path the user runs
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists program_source text not null default 'generated'
  check (program_source in ('generated','template','library'));

-- ---------------------------------------------------------------------------
-- D16 database-side backstop: every science_overrides key must reference an
-- existing program_principles.principle_key. Primary enforcement is the
-- doctrine gate (scripts/doctrine.mjs); this trigger makes the DB refuse the
-- write too — sovereignty without a cited principle is a D16 failure, not a
-- loophole (loop-config.md §Two-tier doctrine).
-- ---------------------------------------------------------------------------
create or replace function public.validate_science_overrides()
returns trigger language plpgsql as $$
declare
  k text;
begin
  for k in select jsonb_object_keys(coalesce(new.science_overrides, '{}'::jsonb)) loop
    if not exists (select 1 from public.program_principles p where p.principle_key = k) then
      raise exception 'D16 violation: science_overrides key "%" has no program_principles row', k;
    end if;
  end loop;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_validate_science_overrides on public.workout_templates;
create trigger trg_validate_science_overrides
  before insert or update on public.workout_templates
  for each row execute function public.validate_science_overrides();

-- ---------------------------------------------------------------------------
-- RLS — plan §2: SELECT for authenticated; INSERT/UPDATE/DELETE only author
-- (or service role, which bypasses RLS by design).
-- exercises + program_principles: curated tables — authenticated read,
-- service-role-only writes (no author_id concept on exercises).
-- ---------------------------------------------------------------------------
alter table public.exercises          enable row level security;
alter table public.workout_templates  enable row level security;
alter table public.template_blocks    enable row level security;
alter table public.template_days      enable row level security;
alter table public.template_exercises enable row level security;
alter table public.program_principles enable row level security;

-- exercises: read-only to app users
create policy exercises_select on public.exercises
  for select to authenticated using (true);

-- program_principles: readable (the UI cites reasoning); writes by creator
create policy principles_select on public.program_principles
  for select to authenticated using (true);
create policy principles_write on public.program_principles
  for all to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

-- workout_templates: published rows visible to all; unpublished only to owner
create policy templates_select on public.workout_templates
  for select to authenticated
  using (is_published or author_id = auth.uid());
create policy templates_write on public.workout_templates
  for all to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- child tables inherit visibility/ownership from their template
create policy blocks_select on public.template_blocks
  for select to authenticated
  using (exists (select 1 from public.workout_templates t
                 where t.id = template_id and (t.is_published or t.author_id = auth.uid())));
create policy blocks_write on public.template_blocks
  for all to authenticated
  using (exists (select 1 from public.workout_templates t
                 where t.id = template_id and t.author_id = auth.uid()))
  with check (exists (select 1 from public.workout_templates t
                 where t.id = template_id and t.author_id = auth.uid()));

create policy days_select on public.template_days
  for select to authenticated
  using (exists (select 1 from public.workout_templates t
                 where t.id = template_id and (t.is_published or t.author_id = auth.uid())));
create policy days_write on public.template_days
  for all to authenticated
  using (exists (select 1 from public.workout_templates t
                 where t.id = template_id and t.author_id = auth.uid()))
  with check (exists (select 1 from public.workout_templates t
                 where t.id = template_id and t.author_id = auth.uid()));

create policy exs_select on public.template_exercises
  for select to authenticated
  using (exists (select 1 from public.template_days d
                 join public.workout_templates t on t.id = d.template_id
                 where d.id = day_id and (t.is_published or t.author_id = auth.uid())));
create policy exs_write on public.template_exercises
  for all to authenticated
  using (exists (select 1 from public.template_days d
                 join public.workout_templates t on t.id = d.template_id
                 where d.id = day_id and t.author_id = auth.uid()))
  with check (exists (select 1 from public.template_days d
                 join public.workout_templates t on t.id = d.template_id
                 where d.id = day_id and t.author_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Indexes for the resolver + browse paths
-- ---------------------------------------------------------------------------
create index if not exists idx_templates_browse
  on public.workout_templates (parent_goal, days_per_week, duration_weeks, difficulty)
  where is_published;
create index if not exists idx_templates_author on public.workout_templates (author_id);
create index if not exists idx_blocks_template  on public.template_blocks (template_id, block_order);
create index if not exists idx_days_template    on public.template_days (template_id, block_id, day_order);
create index if not exists idx_exs_day          on public.template_exercises (day_id, ex_order);
