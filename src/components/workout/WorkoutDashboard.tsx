'use client'

import { useState } from 'react'
import type { GoalType } from '@/lib/program'
import type { OverloadRow } from '@/components/workout/ExerciseList'
import { getProgram } from '@/lib/program'
import { WorkoutSessionProvider } from '@/contexts/WorkoutSessionContext'
import GoalSelector from './GoalSelector'
import PhaseBanner from './PhaseBanner'
import ExerciseList from './ExerciseList'
import SessionSummary from './SessionSummary'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  user: {
    id:           string
    program_type: string
    current_week: number
  }
  overloadMap: Record<string, OverloadRow>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_GOALS: GoalType[] = ['fat_burn', 'build_muscle', 'transform']

function safeGoal(g: string): GoalType {
  return VALID_GOALS.includes(g as GoalType) ? (g as GoalType) : 'build_muscle'
}

/**
 * Map JS getDay() (0 = Sun) → 4-day program index.
 * Mon = 0, Tue = 1, Thu = 2, Fri = 3.
 * Weekend / Wed → undefined → fall back to 0.
 */
const DAY_MAP: Partial<Record<number, number>> = { 1: 0, 2: 1, 4: 2, 5: 3 }

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorkoutDashboard({ user, overloadMap }: Props) {
  const todayIdx = DAY_MAP[new Date().getDay()] ?? 0

  const [goal,           setGoal]          = useState<GoalType>(safeGoal(user.program_type))
  const [currentWeek]                      = useState<number>(user.current_week)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(todayIdx)

  const days       = getProgram(goal, 4, currentWeek)
  const selectedDay = days[selectedDayIdx] ?? days[0]

  return (
    <div className="space-y-6">

      {/* Goal selector */}
      <GoalSelector
        currentGoal={goal}
        userId={user.id}
        onGoalChange={setGoal}
      />

      {/* Day tabs — A / B / C / D */}
      <div className="grid grid-cols-4 gap-1">
        {days.map((day, idx) => (
          <button
            key={day.key}
            onClick={() => setSelectedDayIdx(idx)}
            className={[
              'py-2 text-xs font-tight font-bold italic uppercase tracking-tight border transition-all duration-150',
              selectedDayIdx === idx
                ? 'border-[var(--user-color)] bg-[var(--user-color)]/10 text-[var(--user-color)]'
                : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white/70',
            ].join(' ')}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Phase banner */}
      <PhaseBanner goal={goal} currentWeek={currentWeek} />

      {/*
        Session provider wraps the exercise list + summary.
        Re-mounts when the selected day changes so each day gets a fresh session
        context keyed to that day's dayType (e.g. 'mon', 'tue', 'thu', 'fri').
      */}
      <WorkoutSessionProvider
        key={selectedDay.key}
        dayType={selectedDay.key}
        userId={user.id}
      >
        <ExerciseList blocks={selectedDay.blocks} overloadMap={overloadMap} />
        <SessionSummary />
      </WorkoutSessionProvider>

    </div>
  )
}
