-- ═══════════════════════════════════════════════════════════════════════════
-- B1 — `exercise_swaps`: give the durable user exercise swap a cloud home.
--
-- STATUS: APPLIED 2026-10-07 on Kerwin's explicit in-session instruction
-- ("do it in this branch, then merge this branch to main"), atomically with
-- the client cloud round-trip (branch wiring-b4-swap-cloud) per the council
-- ruling of 2026-10-06. All post-migration assertions below were RUN against
-- live Postgres the same day and passed: table+RLS+1 policy; isolation held
-- between kerwinferrette+test and +testdani (owner sees 1, other sees 0,
-- cross-user insert rejected); the no-noop CHECK rejected a self-swap; the
-- client's exact upsert/delete paths round-tripped. Probe rows rolled back;
-- table left empty.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- WHY
-- ---
-- B1 (wiring workstream, 2026-10-05): openSwapPicker()/applySwap() previously
-- mutated one card's DOM and toasted — nothing persisted, so the swap
-- evaporated on the next render. The fix stores a per-user substitution keyed
-- by the ORIGINAL movement's name and re-applies it at the render seam
-- (resolveUserSwap), re-validating legality against getExerciseSubstitutes
-- (tier + injuries) on EVERY render — a stored target is never trusted from
-- store time. This table is the cloud half so a swap follows the user across
-- devices, exactly as exercise_notes (0022) does for notes.
--
-- SHAPE: deliberately parallel to exercise_notes — same keying decision for
-- the same reason. Keyed by exercise NAME, not slot id: slot ids churn when
-- the generator reshuffles a program (lastsets-churn-smoke.mjs, C7/BUG-45/
-- BUG-48 precedent); names do not. unique(user_id, original_name) expresses
-- "one active substitution per movement per user"; swapping back to the
-- original DELETES the row (the client stores no no-op entries — see
-- scripts/swap-persistence-smoke.mjs [E1]).
--
-- substitute_name is a NAME, not a foreign key into public.exercises: the
-- client re-resolves it against the live bank + the user's CURRENT tier and
-- injuries at render, so a stale or now-illegal target degrades safely to the
-- original movement rather than erroring. The DB row is a preference, not an
-- authorization.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.exercise_swaps (
  id              uuid        not null default gen_random_uuid(),
  user_id         uuid        not null,
  original_name   text        not null,
  substitute_name text        not null,
  updated_at      timestamptz not null default now(),
  constraint exercise_swaps_pkey primary key (id),
  constraint exercise_swaps_user_id_original_name_key unique (user_id, original_name),
  constraint exercise_swaps_no_noop check (substitute_name <> original_name),
  constraint exercise_swaps_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade
);

alter table public.exercise_swaps enable row level security;

-- Idempotent: safe to re-run if the table already exists from a partial apply.
drop policy if exists "users manage own exercise swaps" on public.exercise_swaps;
create policy "users manage own exercise swaps" on public.exercise_swaps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.exercise_swaps is
  'Durable user-chosen exercise substitutions (B1). Keyed by ORIGINAL exercise NAME '
  '(slot ids churn). One active substitution per movement per user; undo deletes the row. '
  'The client re-validates legality (tier + injuries) at every render — this row is a '
  'preference, never an authorization.';

-- ═══════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION ASSERTIONS (run these; do not assume)
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Table and policy both exist:
--   select c.relname, c.relrowsecurity, count(p.polname) as policies
--   from pg_class c
--   left join pg_policy p on p.polrelid = c.oid
--   where c.relname = 'exercise_swaps'
--   group by c.relname, c.relrowsecurity;
--   EXPECT: exercise_swaps | true | 1
--
-- 2. Isolation actually holds — run as a TEST account, not Kerwin's or Dani's
--    (loop-config default_not_fallback). Insert one row for the test uid, then
--    confirm a different signed-in user cannot select it.
--
-- 3. The no-noop CHECK rejects a self-swap:
--   insert ... (original_name, substitute_name) values ('X','X');  EXPECT: error.
--
-- 4. Only after 1-3 pass may the client's cloud round-trip be wired and
--    described as working. Until then swaps are LOCAL ONLY.
-- ═══════════════════════════════════════════════════════════════════════════
