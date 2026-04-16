'use client'

import { useState } from 'react'
import { useWorkoutSession } from '@/contexts/WorkoutSessionContext'

// ── Component ─────────────────────────────────────────────────────────────────

export default function SessionSummary() {
  const { totalSets, newPrs, isComplete, markComplete } = useWorkoutSession()
  const [completing, setCompleting] = useState(false)

  // Only render once at least one set is logged
  if (totalSets === 0) return null

  // Post-completion state
  if (isComplete) {
    return (
      <div className="border border-[var(--user-color)] bg-[var(--user-color)]/10 p-6 text-center space-y-2">
        <h2 className="font-tight font-bold italic uppercase tracking-tight text-[var(--user-color)] text-2xl leading-none">
          SESSION COMPLETE
        </h2>
        <p className="text-white/60 text-sm">
          {totalSets} set{totalSets !== 1 ? 's' : ''} logged
          {newPrs > 0 && ` · ${newPrs} new PR${newPrs !== 1 ? 's' : ''}`}
        </p>
        <p className="text-white/30 text-xs uppercase tracking-widest pt-1">
          Streak updated
        </p>
      </div>
    )
  }

  const handleComplete = async () => {
    if (completing) return
    setCompleting(true)
    try {
      await markComplete()
    } catch (err) {
      console.error('Failed to mark session complete:', err)
      setCompleting(false)
    }
  }

  return (
    <div className="border border-white/10 bg-white/5 p-4 space-y-4">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
            Sets Logged
          </div>
          <div className="font-tight font-bold italic text-3xl text-[var(--user-color)] leading-none">
            {totalSets}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
            New PRs
          </div>
          <div className="font-tight font-bold italic text-3xl text-[var(--user-color)] leading-none">
            {newPrs}
          </div>
        </div>
      </div>

      {/* Complete button */}
      <button
        onClick={handleComplete}
        disabled={completing}
        className="
          w-full py-3
          font-tight font-bold italic uppercase tracking-tight text-sm
          border border-[var(--user-color)] text-[var(--user-color)]
          hover:bg-[var(--user-color)] hover:text-[#1A1A1A]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-150
        "
      >
        {completing ? 'SAVING...' : 'MARK COMPLETE'}
      </button>

    </div>
  )
}
