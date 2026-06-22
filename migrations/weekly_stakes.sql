-- ═══════════════════════════════════════════════════════
-- EPIC-14: Weekly Stakes Layer — schema stub
-- STATUS: DRAFT. NOT APPLIED to Supabase (zsvktcvqmppsshtpeljt).
-- Apply only when EPIC-14 moves to In Progress and Kerwin approves.
-- ═══════════════════════════════════════════════════════

-- One row per couple per ISO week. Tracks the stake and the outcome.
CREATE TABLE IF NOT EXISTS weekly_stakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,                       -- Monday of the ISO week
  user_a uuid NOT NULL REFERENCES users(id),
  user_b uuid NOT NULL REFERENCES users(id),
  stake_text text NOT NULL,                       -- e.g. "Loser cooks Sunday dinner"
  metric text NOT NULL DEFAULT 'total_volume',    -- total_volume | sessions_completed | streak
  winner_user_id uuid REFERENCES users(id),       -- null until evaluated Sunday night
  evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_start, user_a, user_b)
);

-- Nudge events sent when a partner falls behind mid-week.
CREATE TABLE IF NOT EXISTS nudge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_id uuid REFERENCES weekly_stakes(id),
  from_user_id uuid NOT NULL REFERENCES users(id),
  to_user_id uuid NOT NULL REFERENCES users(id),
  nudge_type text NOT NULL DEFAULT 'behind_pace', -- behind_pace | streak_risk | manual
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: same pattern as existing tables — each user reads stakes they are part of.
ALTER TABLE weekly_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY stakes_read_own ON weekly_stakes
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY stakes_write_own ON weekly_stakes
  FOR INSERT WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY stakes_update_own ON weekly_stakes
  FOR UPDATE USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY nudge_read_own ON nudge_log
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY nudge_write_own ON nudge_log
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);
