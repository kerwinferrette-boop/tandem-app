'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GoalType } from '@/lib/program'

// ── Data ──────────────────────────────────────────────────────────────────────

const GOALS: { key: GoalType; label: string; desc: string }[] = [
  { key: 'fat_burn',     label: 'FAT BURN',     desc: 'High reps · Shorter rest' },
  { key: 'build_muscle', label: 'BUILD MUSCLE',  desc: 'Moderate reps · Progressive overload' },
  { key: 'transform',    label: 'TRANSFORM',     desc: 'Balanced strength + conditioning' },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  currentGoal:  GoalType
  userId:       string
  onGoalChange: (g: GoalType) => void
}

export default function GoalSelector({ currentGoal, userId, onGoalChange }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState<GoalType | null>(null)

  const select = async (goal: GoalType) => {
    if (goal === currentGoal || loading) return
    setLoading(goal)
    const { error } = await supabase
      .from('users')
      .update({ program_type: goal })
      .eq('id', userId)
    setLoading(null)
    if (!error) onGoalChange(goal)
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {GOALS.map(({ key, label, desc }) => {
        const active = key === currentGoal
        return (
          <button
            key={key}
            onClick={() => select(key)}
            disabled={loading !== null}
            className={[
              'flex flex-col gap-1 p-3 border text-left transition-all duration-150 disabled:opacity-60',
              active
                ? 'border-[var(--user-color)] bg-[var(--user-color)]/10'
                : 'border-white/20 hover:border-white/40',
            ].join(' ')}
          >
            <span className="font-tight font-bold italic uppercase tracking-tight text-sm text-[var(--user-color)]">
              {label}
            </span>
            <span className="text-xs text-white/50">{desc}</span>
          </button>
        )
      })}
    </div>
  )
}
