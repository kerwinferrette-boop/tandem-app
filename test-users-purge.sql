-- ═══════════════════════════════════════════════════════
-- TANDEM TEST USERS — PURGE SCRIPT (run between test rounds)
--
-- Wipes all WORKOUT DATA for the two test users but KEEPS
-- their accounts (auth + users rows + partner pairing), so
-- no re-signup or re-onboarding is needed.
--
-- Safety: scoped to ids resolved from the +test emails only.
-- Kerwin (e636007d-...) and Dani (3a6e34b7-...) are untouchable
-- by this script — their emails do not match the filter.
--
-- competition_leaderboard is a VIEW — it recalculates to zero
-- automatically once the underlying rows are deleted.
-- ═══════════════════════════════════════════════════════

DO $$
DECLARE
  test_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO test_ids
  FROM users
  WHERE email IN ('kerwinferrette+test@gmail.com', 'kerwinferrette+testdani@gmail.com');

  IF test_ids IS NULL THEN
    RAISE EXCEPTION 'No test users found — nothing purged.';
  END IF;

  -- Child rows first (sets reference workout_sessions)
  DELETE FROM sets              WHERE user_id = ANY(test_ids);
  DELETE FROM lastsets          WHERE user_id = ANY(test_ids);
  DELETE FROM workout_sessions  WHERE user_id = ANY(test_ids);
  DELETE FROM personal_records  WHERE user_id = ANY(test_ids);
  DELETE FROM streaks           WHERE user_id = ANY(test_ids);
  DELETE FROM health_snapshots  WHERE user_id = ANY(test_ids);
  DELETE FROM medals            WHERE user_id = ANY(test_ids);
  -- exercise_notes dropped by migrations/0008_bug72_dead_object_cleanup.sql
  DELETE FROM agent_log         WHERE user_id = ANY(test_ids);
  DELETE FROM user_bug_reports  WHERE user_id = ANY(test_ids);
  DELETE FROM challenges        WHERE challenger_id = ANY(test_ids) OR opponent_id = ANY(test_ids);

  RAISE NOTICE 'Purged workout data for % test user(s).', array_length(test_ids, 1);
END $$;

-- Verify clean slate:
SELECT u.email,
  (SELECT COUNT(*) FROM workout_sessions w WHERE w.user_id = u.id) AS sessions,
  (SELECT COUNT(*) FROM sets s WHERE s.user_id = u.id)             AS sets,
  (SELECT COUNT(*) FROM personal_records p WHERE p.user_id = u.id) AS prs,
  (SELECT COUNT(*) FROM streaks st WHERE st.user_id = u.id)        AS streaks
FROM users u
WHERE u.email LIKE 'kerwinferrette+test%';
