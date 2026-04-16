// ── /competition ───────────────────────────────────────────────────────────────
// Server component — fetches initial leaderboard data + auth-guards.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Leaderboard from '@/components/competition/Leaderboard'
import type { LeaderboardRow } from '@/components/competition/PointsCard'

export const dynamic = 'force-dynamic'

export default async function CompetitionPage() {
  const supabase = await createClient()

  // ── Auth guard ───────────────────────────────────────────────────────────────

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Fetch leaderboard ────────────────────────────────────────────────────────

  const { data: rows, error } = await supabase
    .from('competition_leaderboard')
    .select('*')

  const leaderboardRows = (error || !rows) ? [] : (rows as LeaderboardRow[])

  // ── Derive week label ────────────────────────────────────────────────────────

  const now       = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)) // Monday
  const weekEnd   = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const weekLabel = `${fmt(weekStart)} – ${fmt(weekEnd)}`

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--carbon-grey,#1A1A1A)] text-white">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Page header */}
        <div className="space-y-1">
          <h1 className="font-tight font-bold italic uppercase tracking-tight text-2xl text-white">
            Competition
          </h1>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">
            {weekLabel}
          </p>
        </div>

        {/* Scoring legend */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Session', value: '10 pts' },
            { label: 'PR',      value: '25 pts' },
            { label: 'Steps',   value: 'up to 15 pts/day' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="border border-white/8 bg-white/3 p-3 text-center space-y-1"
            >
              <div className="text-[10px] text-white/30 uppercase tracking-widest">
                {label}
              </div>
              <div className="text-xs font-tight font-bold italic text-white/60 tabular-nums">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Live leaderboard */}
        <Leaderboard
          initialRows={leaderboardRows}
          currentUserId={user.id}
        />

      </div>
    </div>
  )
}
