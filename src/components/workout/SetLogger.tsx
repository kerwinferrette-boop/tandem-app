'use client'

import { useState } from 'react'
import { useWorkoutSession, type LoggedSet } from '@/contexts/WorkoutSessionContext'
import type { Recommendation } from '@/lib/overload'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  exerciseName:   string
  isCompound:     boolean
  recommendation: Recommendation | null
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SetLogger({ exerciseName, recommendation }: Props) {
  const { logSet } = useWorkoutSession()

  const [weight,  setWeight]  = useState<string>(
    recommendation?.weight != null ? String(recommendation.weight) : ''
  )
  const [reps,    setReps]    = useState<string>('')
  const [logging, setLogging] = useState(false)
  const [sets,    setSets]    = useState<LoggedSet[]>([])

  const handleLog = async () => {
    const w = parseFloat(weight)
    const r = parseInt(reps, 10)
    if (isNaN(w) || isNaN(r) || r < 1 || w < 0) return

    setLogging(true)
    try {
      const result = await logSet(exerciseName, w, r)
      setSets(prev => [...prev, result])
      setReps('')
    } catch (err) {
      console.error('Failed to log set:', err)
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className="space-y-3 mt-3">

      {/* Logged sets history */}
      {sets.length > 0 && (
        <div className="space-y-1">
          {sets.map((s) => (
            <div
              key={s.setNumber}
              className="flex items-center gap-3 text-sm py-1.5 border-b border-white/5 last:border-0"
            >
              <span className="text-white/40 w-10 flex-shrink-0">
                Set {s.setNumber}
              </span>
              <span className="text-white flex-1">
                {s.weightLbs} lbs × {s.reps}
              </span>
              <span className="text-white/30 text-xs">
                ~{Math.round(s.estimated1rm)} lbs 1RM
              </span>
              {s.isPr && (
                <span className="
                  bg-[var(--user-color)] text-[#1A1A1A]
                  text-[10px] font-tight font-bold italic uppercase tracking-tight
                  px-2 py-0.5
                  animate-[scale-in_0.15s_ease-out]
                ">
                  PR
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <input
          type="number"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="Weight (lbs)"
          className="
            flex-1 bg-white/5 border border-white/20 px-3 py-2
            text-sm text-white placeholder:text-white/25
            focus:outline-none focus:border-[var(--user-color)]
            transition-colors
          "
        />
        <input
          type="number"
          value={reps}
          onChange={e => setReps(e.target.value)}
          placeholder="Reps"
          onKeyDown={e => e.key === 'Enter' && handleLog()}
          className="
            w-24 bg-white/5 border border-white/20 px-3 py-2
            text-sm text-white placeholder:text-white/25
            focus:outline-none focus:border-[var(--user-color)]
            transition-colors
          "
        />
        <button
          onClick={handleLog}
          disabled={logging || !weight || !reps}
          className="
            px-4 py-2 font-tight font-bold italic uppercase tracking-tight text-sm
            bg-[var(--user-color)] text-[#1A1A1A]
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:opacity-90 transition-opacity
          "
        >
          {logging ? '...' : 'LOG SET'}
        </button>
      </div>

    </div>
  )
}
