-- ═══════════════════════════════════════════════════════════════════════════
-- EPIC-16 — Simplified Nutrition Tracking, schema slice (Slice 1 of
-- docs/waves/EPIC-16-WAVE-STATE.md).
--
-- WRITTEN 2026-09-07/08, NOT APPLIED. Schema changes are human-apply-only per
-- .claude/loop-config.md; this session is Notion/docs-updates-only except for
-- the wave-decomposition files it was explicitly scoped to write. Same
-- posture as migrations/0013_bug72_groupA_wedding_tables_cleanup.sql — a
-- fully-formed, reviewable file, left for Kerwin (or whoever has DB access)
-- to apply.
--
-- WHAT THIS IS
--
-- EPIC-16's own Agent Context Notes (Notion) are explicit that this is NOT a
-- calorie/macro calculator: "Apple Health already ingests nutrition data from
-- MyFitnessPal if the user has that connected — that flows into
-- health_snapshots automatically. The manual nutrition log is for users who
-- don't use MFP and want something simpler." So this table is a lightweight,
-- self-reported daily log — no macro math, no derived calorie totals.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.nutrition_logs (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references public.users(id) on delete cascade,
    log_date     date not null,
    meals_logged integer,
    protein_hit  boolean,
    notes        text,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now(),

    constraint nutrition_logs_one_per_user_per_day unique (user_id, log_date)
);

comment on table public.nutrition_logs is
  'EPIC-16 manual nutrition log — self-reported, no calorie/macro math. '
  'Independent of health_snapshots (EPIC-4, Planned/unshipped): this is the '
  'fallback path for users not on the Apple Health / MyFitnessPal pipeline, '
  'per the Epic''s own Agent Context Notes. One row per user per day.';

alter table public.nutrition_logs enable row level security;

-- ---------------------------------------------------------------------------
-- RLS — owner-scoped only. Deliberately NOT the BUG-74/BUG-78 shape (a named-
-- for-service-role policy that is actually USING(true) TO public). service_role
-- bypasses RLS on its own; these policies are for anon/authenticated only.
-- ---------------------------------------------------------------------------
create policy "nutrition_logs_read_own" on public.nutrition_logs
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "nutrition_logs_write_own" on public.nutrition_logs
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "nutrition_logs_update_own" on public.nutrition_logs
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "nutrition_logs_delete_own" on public.nutrition_logs
  for delete to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.nutrition_logs_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger nutrition_logs_touch_updated_at
  before update on public.nutrition_logs
  for each row execute function public.nutrition_logs_set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION ASSERTIONS — run these, do not assume them
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. anon is shut out entirely:
--      begin; set local role = anon;
--      with i as (insert into public.nutrition_logs (user_id, log_date)
--                 values (gen_random_uuid(), current_date) returning 1)
--      select count(*) from i;  rollback;
--      EXPECT: 0 rows (or a raised error) — either is a pass.
--
-- 2. A signed-in user cannot read/write another user's row:
--      begin; set local role = authenticated;
--      set local request.jwt.claims = '{"sub":"<user A uuid>","role":"authenticated"}';
--      -- insert a row as A, then switch sub to B and attempt to select/update A's row
--      EXPECT: B sees 0 rows for A's log.
--
-- 3. One row per user per day is enforced:
--      insert the same (user_id, log_date) twice as the same user.
--      EXPECT: unique-constraint violation on the second insert.
--
-- 4. get_advisors(security) introduces no new ERROR/WARN beyond the known baseline.
-- ═══════════════════════════════════════════════════════════════════════════
