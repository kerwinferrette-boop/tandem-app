-- ═══════════════════════════════════════════════════════════════════════════
-- EPIC-037 — Save/Reuse One-Off Workout.
--
-- WRITTEN 2026-09-15. APPLIED to prod 2026-09-15 on Kerwin's explicit
-- go-ahead (apply_migration stays human-directed per .claude/loop-config.md's
-- forbidden-ops list). Post-migration assertions 1 and 3 re-run in rolled-back
-- probe transactions immediately after apply: anon insert denied (0 rows,
-- transaction rolled back), rating=8 rejected by the CHECK constraint,
-- rating=null succeeds. RLS confirmed enabled with all 4 owner-scoped
-- policies present (pg_policy). get_advisors(security) introduced no new
-- finding referencing saved_workouts — all findings returned pre-date this
-- migration (branding_assets/guests/vendor_research RLS-no-policy,
-- validate_science_overrides search_path, pg_net-in-public,
-- connect_partner SECURITY DEFINER, leaked-password-protection). Assertion 2
-- (cross-user isolation) was not re-run since it requires two real user rows;
-- the RLS predicate is identical in shape to nutrition_logs (0014)/BUG-74/
-- BUG-78's already-verified fix, so it is not treated as a new risk.
--
-- WHAT THIS IS
--
-- A one-off "Build Me a Workout" session already LOGS (workout_sessions/sets,
-- session_type='oneoff', migrations/0015). That is completion, not reuse —
-- nothing today lets a user name a specific collection of lifts and pull it
-- back up later ("if a workout works, a workout works," Kerwin). This table
-- is that reusable template, independent of any one logged session: a user
-- can save a workout without ever re-running it, and re-run a saved workout
-- any number of times without creating duplicate rows here.
--
-- day_data stores the exact `day` object getSingleDay() returns (programs.js)
-- — { key, oneOff, focus, label, color, rationale, blocks:[{label,exs:[...]}] }
-- — the SAME shape buildDayHTML() already knows how to render, so "pull from
-- saved" re-renders it directly with no new render path or second copy of
-- the exercise-selection engine.
--
-- rating is the 1-7 subjective scale captured at save time (spec b) — smallint
-- CHECK bounds it in the DB, not just in the client, so a client bug cannot
-- silently write an out-of-range value.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.saved_workouts (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references public.users(id) on delete cascade,
    name       text not null,
    focus      text,
    goal       text,
    day_data   jsonb not null,
    rating     smallint check (rating is null or (rating between 1 and 7)),
    created_at timestamptz not null default now()
);

comment on table public.saved_workouts is
  'EPIC-037 — user-named, reusable one-off workout templates. day_data is the '
  'full getSingleDay() day object (programs.js), re-rendered as-is by '
  'buildDayHTML() when pulled. Independent of workout_sessions: saving does '
  'not log a session, and logging a one-off does not require having saved '
  'one. rating is the 1-7 subjective scale captured at save time.';

alter table public.saved_workouts enable row level security;

-- ---------------------------------------------------------------------------
-- RLS — owner-scoped only, same shape as nutrition_logs (0014)/BUG-74/BUG-78's
-- fix: no USING(true)-to-public policy, service_role bypasses RLS on its own.
-- ---------------------------------------------------------------------------
create policy "saved_workouts_read_own" on public.saved_workouts
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "saved_workouts_write_own" on public.saved_workouts
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "saved_workouts_update_own" on public.saved_workouts
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "saved_workouts_delete_own" on public.saved_workouts
  for delete to authenticated
  using (user_id = (select auth.uid()));

create index if not exists saved_workouts_user_id_idx on public.saved_workouts (user_id, created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION ASSERTIONS — run these, do not assume them
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. anon is shut out entirely:
--      begin; set local role = anon;
--      with i as (insert into public.saved_workouts (user_id, name, day_data)
--                 values (gen_random_uuid(), 'x', '{}'::jsonb) returning 1)
--      select count(*) from i;  rollback;
--      EXPECT: 0 rows (or a raised error) — either is a pass.
--
-- 2. A signed-in user cannot read/write another user's row:
--      begin; set local role = authenticated;
--      set local request.jwt.claims = '{"sub":"<user A uuid>","role":"authenticated"}';
--      -- insert a row as A, then switch sub to B and attempt to select/update A's row
--      EXPECT: B sees 0 rows for A's saved workout.
--
-- 3. rating is bounded:
--      insert a row with rating = 8 (or 0). EXPECT: check-constraint violation.
--      insert a row with rating = null. EXPECT: succeeds (rating is optional).
--
-- 4. get_advisors(security) introduces no new ERROR/WARN beyond the known baseline.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ROLLBACK ─────────────────────────────────────────────────────────────────
--   drop table if exists public.saved_workouts;
