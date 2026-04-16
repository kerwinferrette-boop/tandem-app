// ── PointsCard ─────────────────────────────────────────────────────────────────
// Per-user card showing total points + breakdown by sessions / PRs / steps.

import StreakBadge from './StreakBadge'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LeaderboardRow {
  user_id:            string
  name:               string
  theme_color:        string
  /** Composite point total (sessions × 10 + prs × 25 + steps_pts). */
  total_points:       number
  sessions_completed: number
  prs_earned:         number
  /** Average daily steps this week (from health_snapshots). */
  avg_steps:          number
  current_streak:     number
}

interface Props {
  row:           LeaderboardRow
  isCurrentUser: boolean
  isLeading:     boolean
  rank:          1 | 2
}

// ── Breakdown row ──────────────────────────────────────────────────────────────

function StatRow({
  label,
  value,
  unit,
  points,
  color,
}: {
  label:   string
  value:   number | string
  unit?:   string
  points:  number
  color:   string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/40 uppercase tracking-widest w-20">
          {label}
        </span>
        <span className="text-xs text-white/70 tabular-nums">
          {value}{unit && <span className="text-white/30 ml-0.5">{unit}</span>}
        </span>
      </div>
      <span
        className="text-[10px] font-tight font-bold italic tabular-nums"
        style={{ color }}
      >
        +{points} pts
      </span>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function PointsCard({ row, isCurrentUser, isLeading, rank }: Props) {
  const color = row.theme_color || 'var(--user-color)'

  // Point breakdown (mirrors DB scoring — adjust if view uses different weights)
  const sessionPts = row.sessions_completed * 10
  const prPts      = row.prs_earned         * 25
  const stepPts    = Math.round(Math.min(row.avg_steps / 8000, 1) * 15)

  const borderStyle = isLeading
    ? { borderColor: `${color}60` }
    : { borderColor: 'rgba(255,255,255,0.08)' }

  const bgStyle = isLeading
    ? { backgroundColor: `${color}08` }
    : { backgroundColor: 'rgba(255,255,255,0.02)' }

  return (
    <div
      className="p-4 border space-y-4 transition-all duration-300"
      style={{ ...borderStyle, ...bgStyle }}
    >

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          {/* Rank + name */}
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-tight font-bold italic uppercase tracking-widest"
              style={{ color: isLeading ? color : 'rgba(255,255,255,0.25)' }}
            >
              #{rank}
            </span>
            <span className="font-tight font-bold italic uppercase tracking-tight text-white text-base">
              {row.name.split(' ')[0]}
            </span>
            {isCurrentUser && (
              <span className="text-[9px] text-white/30 uppercase tracking-widest border border-white/15 px-1.5 py-0.5">
                You
              </span>
            )}
          </div>

          {/* Streak */}
          <StreakBadge streak={row.current_streak} color={color} />
        </div>

        {/* Total points */}
        <div className="text-right">
          <div
            className="font-tight font-bold italic text-3xl leading-none tabular-nums"
            style={{ color: isLeading ? color : 'rgba(255,255,255,0.5)' }}
          >
            {row.total_points.toLocaleString()}
          </div>
          <div className="text-[9px] text-white/25 uppercase tracking-widest mt-0.5">
            points
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-white/8" />

      {/* Breakdown */}
      <div className="space-y-2">
        <StatRow
          label="Sessions"
          value={row.sessions_completed}
          points={sessionPts}
          color={color}
        />
        <StatRow
          label="PRs"
          value={row.prs_earned}
          points={prPts}
          color={color}
        />
        <StatRow
          label="Avg Steps"
          value={row.avg_steps.toLocaleString()}
          points={stepPts}
          color={color}
        />
      </div>

    </div>
  )
}
