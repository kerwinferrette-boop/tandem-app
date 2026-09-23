-- migrations/0018_pr_points_15_ROLLBACK.sql
-- Kerwin, 2026-09-23: "let's take a PR 15 points. Why not?"
-- ROLLBACK for 0018: restores PR weight 25. Only run if Kerwin asks to revert.
--
-- WHY: points were scored by two rules that disagreed.
--   - The Home scoreboard reads this VIEW: 10/session + 25/PR + up to 15 for avg steps.
--   - The app's finishers (creditSessionToStreaks, one-off and journal toasts) used
--     10/session + 5/PR.
-- The app now reads POINTS_PER_SESSION / POINTS_PER_PR (10 / 15) from one place in
-- tandem.html. This brings the view to the same 15/PR. Nothing else changes: same
-- columns, same week window, same steps component (avg/8000, capped at 15 — the app
-- has no copy of that part), same security_invoker, and CREATE OR REPLACE keeps grants.
--
-- Definition copied from the live view (pg_get_viewdef, 2026-09-23); the ONLY edit is
-- `* 25` -> `* 15` on prs_earned. Run as one statement in the Supabase SQL editor.

CREATE OR REPLACE VIEW public.competition_leaderboard
WITH (security_invoker = on) AS
 WITH week_start AS (
         SELECT date_trunc('week'::text, CURRENT_DATE::timestamp with time zone)::date AS start_date
        ), sessions_this_week AS (
         SELECT workout_sessions.user_id,
            count(*) AS sessions_completed
           FROM workout_sessions,
            week_start
          WHERE workout_sessions.completed = true AND workout_sessions.session_date >= week_start.start_date
          GROUP BY workout_sessions.user_id
        ), prs_this_week AS (
         SELECT personal_records.user_id,
            count(*) AS prs_earned
           FROM personal_records,
            week_start
          WHERE personal_records.achieved_date >= week_start.start_date
          GROUP BY personal_records.user_id
        ), avg_steps_this_week AS (
         SELECT health_snapshots.user_id,
            COALESCE(avg(health_snapshots.steps), 0::numeric) AS avg_steps
           FROM health_snapshots,
            week_start
          WHERE health_snapshots.snapshot_date >= week_start.start_date AND health_snapshots.steps IS NOT NULL
          GROUP BY health_snapshots.user_id
        )
 SELECT u.id AS user_id,
    u.name,
    '#1B5E38'::text AS theme_color,
    COALESCE(s.sessions_completed, 0::bigint)::integer AS sessions_completed,
    COALESCE(p.prs_earned, 0::bigint)::integer AS prs_earned,
    round(COALESCE(a.avg_steps, 0::numeric))::integer AS avg_steps,
    COALESCE(st.current_streak_days, 0) AS current_streak,
    COALESCE(s.sessions_completed, 0::bigint) * 10 + COALESCE(p.prs_earned, 0::bigint) * 25 + round(LEAST(COALESCE(a.avg_steps, 0::numeric) / 8000.0, 1.0) * 15::numeric)::integer AS total_points
   FROM users u
     LEFT JOIN sessions_this_week s ON s.user_id = u.id
     LEFT JOIN prs_this_week p ON p.user_id = u.id
     LEFT JOIN avg_steps_this_week a ON a.user_id = u.id
     LEFT JOIN streaks st ON st.user_id = u.id;

-- VERIFY (read-only): expect total_points = sessions_completed*10 + prs_earned*15 + steps part.
-- select user_id, sessions_completed, prs_earned, avg_steps, total_points from public.competition_leaderboard;
-- select reloptions from pg_class where relname = 'competition_leaderboard';  -- expect {security_invoker=on}
