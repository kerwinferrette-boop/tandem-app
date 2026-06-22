-- EPIC-9 · v0.5-calibration — Baseline Calibration + Per-Goal Weekly Progression
-- Drafted 2026-06-11. NOT YET APPLIED to Supabase (zsvktcvqmppsshtpeljt).
-- Dependency gate: BUG-004 merged (done). Apply before Steps C and D ship.

ALTER TABLE personal_records
  ADD COLUMN IF NOT EXISTS is_calibrated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS calibration_session_id uuid REFERENCES workout_sessions(id),
  ADD COLUMN IF NOT EXISTS week_targets jsonb DEFAULT '{}';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_estimates jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS calibration_complete boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS calibration_session_id uuid REFERENCES workout_sessions(id);

-- Verification (from epic Test Assertion SQL):
-- SELECT exercise_name, best_estimated_1rm_lbs, is_calibrated FROM personal_records
--   WHERE user_id = '3a6e34b7-d197-47b4-bedb-de49bbe552fb' ORDER BY exercise_name;
-- SELECT name, calibration_complete FROM users WHERE id = '3a6e34b7-d197-47b4-bedb-de49bbe552fb';
