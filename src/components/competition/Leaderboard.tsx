'use client'

// ── Leaderboard ────────────────────────────────────────────────────────────────
// Fetches competition_leaderboard view, subscribes to real-time changes,
// and renders two PointsCard components sorted by total_points.

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import PointsCard, { type LeaderboardRow } from './PointsCard'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  /** Pre-fetched on server to avoid loading flash. */
  initialRows:   LeaderboardRow[]
  currentUserId: string
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function Leaderboard({ initialRows, currentUserId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [rows, setRows] = useState<LeaderboardRow[]>(initialRows)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Re-fetch helper ──────────────────────────────────────────────────────────

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('competition_leaderboard')
      .select('*')

    if (!error && data) {
      setRows(data as LeaderboardRow[])
    }
  }, [supabase])

  // ── Debounced trigger — prevents hammering the view on every set logged ───────

  const scheduleRefetch = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(refetch, 2500)
  }, [refetch])

  // ── Realtime subscription ────────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel('competition-live')
      // Any new set logged → could affect sessions_completed + PRs
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sets' },
        scheduleRefetch,
      )
      // Session marked complete → affects sessions_completed + streak
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workout_sessions' },
        scheduleRefetch,
      )
      // Health snapshots → affects avg_steps
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'health_snapshots' },
        scheduleRefetch,
      )
      .subscribe()

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      supabase.removeChannel(channel)
    }
  }, [supabase, scheduleRefetch])

  // ── Sort ─────────────────────────────────────────────────────────────────────

  const sorted = [...rows].sort((a, b) => b.total_points - a.total_points)
  const leader = sorted[0]
  const trailer = sorted[1]

  // ── Empty state ──────────────────────────────────────────────────────────────

  if (sorted.length === 0) {
    return (
      <div className="border border-white/10 bg-white/5 p-8 text-center text-white/20 text-sm uppercase tracking-widest">
        No competition data yet
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Live badge */}
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--velocity-lime, #CCFF00)' }}
        />
        <span className="text-[10px] text-white/30 uppercase tracking-widest">
          Live
        </span>
      </div>

      {/* Points gap */}
      {sorted.length === 2 && (
        <div className="text-center py-3 border border-white/5 bg-white/2">
          <span className="font-tight font-bold italic text-white/60 text-sm tabular-nums">
            {Math.abs(leader.total_points - trailer.total_points).toLocaleString()}
          </span>
          <span className="text-[10px] text-white/25 uppercase tracking-widest ml-2">
            point gap
          </span>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-3">
        {sorted.map((row, idx) => (
          <PointsCard
            key={row.user_id}
            row={row}
            isCurrentUser={row.user_id === currentUserId}
            isLeading={idx === 0}
            rank={(idx + 1) as 1 | 2}
          />
        ))}
      </div>

    </div>
  )
}
