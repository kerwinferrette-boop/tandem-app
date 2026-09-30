-- ═══════════════════════════════════════════════════════════════════════════
-- BUG-195 — restore `exercise_notes` so per-exercise notes can sync to cloud.
--
-- NOT APPLIED BY THE AUTHORING SESSION. `apply_migration` is denied in
-- .claude/settings.json (:44) and loop-config reserves schema changes for a
-- human. KERWIN APPLIES THIS BY HAND. Nothing should claim per-exercise notes
-- sync to the cloud until a real round-trip against Postgres is verified —
-- a committed migration is not an applied one.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- WHY THIS TABLE IS BEING RE-CREATED RATHER THAN NEWLY DESIGNED
--
-- It existed, and it was dropped for being empty. The chain, verified:
--   1. tandem.html shipped a .ex-notes textarea on every exercise of every
--      session whose .value was read NOWHERE — every reference was a CSS rule,
--      the tag itself, or a click-suppression guard.
--   2. Because nothing wrote to it, public.exercise_notes accumulated 0 rows.
--   3. An audit saw an empty table with "no reader, no writer" and dropped it:
--      0008_bug72_dead_object_cleanup.sql:148.
--   4. epic033_source_of_truth.sql:117 flagged the open question anyway —
--      "keep exercise_notes pending a ruling on whether per-exercise notes are
--      still roadmapped" — and that ruling never came.
--   5. The textarea is still in the UI today, still collecting text, still
--      discarding it.
-- The dead control starved its own schema, and the schema's emptiness was then
-- used as evidence the feature was dead. Kerwin's ruling (2026-09-30): keep the
-- feature. Local persistence shipped first (tandem_ex_notes, keyed by exercise
-- name, gated by scripts/ex-notes-smoke.mjs); this is the cloud half.
--
-- SHAPE: restored verbatim from the rollback DDL preserved at
-- 0008_bug72_dead_object_cleanup.sql:278-290, deliberately unchanged. The
-- client keys notes by exercise NAME, which is exactly what this table's
-- unique(user_id, exercise_name) already expressed — so the local store and
-- this schema agree without either being bent to fit the other. Slot ids churn
-- as the generator reshuffles a program (see lastsets-churn-smoke.mjs); names
-- do not.
--
-- The RLS policy is restored IN THE SAME STATEMENT BLOCK, per 0008's own
-- warning: "A rollback that restores the table but not its policy is a
-- security regression disguised as a recovery."
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.exercise_notes (
  id            uuid        not null default gen_random_uuid(),
  user_id       uuid        not null,
  exercise_name text        not null,
  note          text        not null default ''::text,
  updated_at    timestamptz not null default now(),
  constraint exercise_notes_pkey primary key (id),
  constraint exercise_notes_user_id_exercise_name_key unique (user_id, exercise_name),
  constraint exercise_notes_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade
);

alter table public.exercise_notes enable row level security;

-- Idempotent: safe to re-run if the table already exists from a partial apply.
drop policy if exists "users manage own exercise notes" on public.exercise_notes;
create policy "users manage own exercise notes" on public.exercise_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.exercise_notes is
  'Per-lift user notes (feel, pain, load adjustments). Keyed by exercise NAME, not slot id: '
  'slot ids churn when the generator reshuffles a program. Dropped by BUG-72 for being empty, '
  'restored by BUG-195 once the UI that feeds it was actually wired.';

-- ═══════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION ASSERTIONS (run these; do not assume)
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Table and policy both exist:
--   select c.relname, c.relrowsecurity, count(p.polname) as policies
--   from pg_class c
--   left join pg_policy p on p.polrelid = c.oid
--   where c.relname = 'exercise_notes'
--   group by c.relname, c.relrowsecurity;
--   EXPECT: exercise_notes | true | 1
--
-- 2. Isolation actually holds — run as a TEST account, not Kerwin's or Dani's
--    (loop-config default_not_fallback). Insert one row for the test uid, then
--    confirm a different signed-in user cannot select it.
--
-- 3. Only after 1 and 2 pass may the client's cloud round-trip be wired and
--    described as working. Until then per-exercise notes are LOCAL ONLY.
-- ═══════════════════════════════════════════════════════════════════════════
