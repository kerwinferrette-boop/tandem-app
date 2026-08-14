-- ═══════════════════════════════════════════════════════════════════════════
-- BUG-75, part 2 — repair the personal_records rows that the trigger-order bug
-- already got wrong.
--
-- ███ NOT APPLIED. And unlike 0006, this one is NOT purely an engineering    ███
-- ███ call — see "THE DECISION THIS NEEDS" before running it.                ███
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- 0006 stops the bleeding. It does not touch history. History is wrong.
--
-- Recomputing every personal record from the 374 rows already in public.sets,
-- using the D12 formula, and diffing against what personal_records actually
-- holds, returns six exercises recorded BELOW what was earned:
--
--     exercise                     earned   recorded   drift
--     Tricep Rope Pushdown          112.0      103     -9.0
--     Tricep Overhead Extension      91.0       83     -8.0
--     Cable Crunch                   70.0       64     -6.0
--     Cable Low-to-High Fly          56.0       51     -5.0
--     Arnold Press                   56.0       51     -5.0
--     Cable Lateral Raise            35.0       32     -3.0
--
-- Every drift is negative. That is the signature of failure mode B, not of
-- rounding: a rounding disagreement would scatter in both directions and stay
-- under a pound. (~18 other rows do exactly that — |drift| <= 0.3, from
-- Math.round on the client vs round(x,1) in the DB. Those are NOISE. Leave
-- them alone; "fixing" them would churn rows for no user-visible gain.)
--
-- The 0.5 threshold below is what separates the two populations. It is not a
-- tuned constant — the gap between 0.3 and 3.0 is an order of magnitude.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- THE DECISION THIS NEEDS — Kerwin, not an engineer
--
-- Tandem is a two-person competition. A personal record is not just a number in
-- a table; it is a thing one person showed the other. streaks awards points per
-- PR. So there are two defensible answers and they are not interchangeable:
--
--   (i)  CORRECT FORWARD (what this file does). Set the six rows to what was
--        actually lifted, stamp achieved_date with the date of the set that
--        earned it, and leave every already-awarded point alone. The scoreboard
--        going forward is honest; the past is left as it was scored.
--
--   (ii) FULL RESTATEMENT. Also recompute the streak points those six PRs
--        should have generated and re-award them. This retroactively changes a
--        competition result between two people, days or weeks after the fact.
--
-- (i) is the default and the recommendation: the drifted PRs are all Kerwin's
-- accessory lifts, the point delta is small, and silently restating a
-- head-to-head score is a worse product failure than the one being fixed. But
-- this is a call about the competition, so it is Kerwin's to make, and it is
-- written down here rather than decided by whoever runs the migration.
--
-- >>> KERWIN: (i) or (ii)? If (i), apply as-is. If (ii), do NOT apply as-is —
-- >>> the point re-award has to be designed against streaks, and Dani should
-- >>> know her opponent's score moved before it moves.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ORDERING — apply 0006 FIRST.
-- If this runs while the old triggers are still attached, it repairs rows that
-- the very next logged set can silently re-break. Repair after the cause is
-- gone, not before.
-- ---------------------------------------------------------------------------

begin;

-- Dry run. Run this ALONE first, read the output, and only then run the update
-- below. Expect exactly the six rows in the table above; if a seventh appears,
-- something changed since this was written — stop and re-derive.
with earned as (
  select distinct on (s.user_id, s.exercise_name)
         s.user_id,
         s.exercise_name,
         round(case
           when s.reps = 1  then s.weight_lbs::numeric
           when s.reps <= 12 then s.weight_lbs * (1 + s.reps::numeric / 30)
           else greatest(100 * s.weight_lbs / (52.2 + 41.9 * exp(-0.055 * s.reps::numeric)),
                         s.weight_lbs * (1 + 12::numeric / 30))
         end, 1) as best_1rm,
         s.weight_lbs,
         s.reps,
         s.created_at::date as earned_date
    from public.sets s
   where s.weight_lbs > 0 and s.reps > 0
   order by s.user_id, s.exercise_name,
            round(case
              when s.reps = 1  then s.weight_lbs::numeric
              when s.reps <= 12 then s.weight_lbs * (1 + s.reps::numeric / 30)
              else greatest(100 * s.weight_lbs / (52.2 + 41.9 * exp(-0.055 * s.reps::numeric)),
                            s.weight_lbs * (1 + 12::numeric / 30))
            end, 1) desc,
            s.created_at asc
)
select pr.exercise_name,
       e.best_1rm                          as earned,
       pr.best_estimated_1rm_lbs           as recorded,
       e.best_1rm - pr.best_estimated_1rm_lbs as drift
  from public.personal_records pr
  join earned e
    on e.user_id = pr.user_id and e.exercise_name = pr.exercise_name
 where e.best_1rm - pr.best_estimated_1rm_lbs > 0.5
 order by drift desc;

rollback;

-- ---------------------------------------------------------------------------
-- THE REPAIR. Uncomment and run only after the dry run above matches, and only
-- after the (i)/(ii) decision above is made.
--
-- Deliberately one-directional: `> 0.5` only. A recorded PR HIGHER than
-- anything in `sets` is not this bug — it is a set that was logged locally and
-- never synced, or logged before the sets table existed. Lowering it would
-- delete a real achievement to satisfy a consistency check. Never do that
-- silently.
-- ---------------------------------------------------------------------------
-- with earned as ( ...same CTE as above... )
-- update public.personal_records pr
--    set best_estimated_1rm_lbs = e.best_1rm,
--        achieved_weight_lbs    = e.weight_lbs,
--        achieved_reps          = e.reps,
--        achieved_date          = e.earned_date
--   from earned e
--  where e.user_id = pr.user_id
--    and e.exercise_name = pr.exercise_name
--    and e.best_1rm - pr.best_estimated_1rm_lbs > 0.5;
-- EXPECT: UPDATE 6

-- ═══════════════════════════════════════════════════════════════════════════
-- AFTER
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Re-run the dry-run SELECT. EXPECT: 0 rows.
-- 2. Tell Dani. Six of Kerwin's records moved up. On a two-person scoreboard
--    that is a conversation, not a changelog entry. This is listed as a step
--    because it is the step most likely to be skipped.
-- ═══════════════════════════════════════════════════════════════════════════
