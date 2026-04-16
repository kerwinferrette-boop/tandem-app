'use client'

import type { Exercise } from '@/lib/program'
import type { Recommendation, OverloadArrow } from '@/lib/overload'
import SetLogger from './SetLogger'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  exercise:       Exercise
  recommendation: Recommendation | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ARROW_STYLES: Record<OverloadArrow, { symbol: string; className: string }> = {
  up:   { symbol: '↑', className: 'text-[var(--user-color)]' },
  same: { symbol: '→', className: 'text-white/50' },
  down: { symbol: '↓', className: 'text-red-400' },
  new:  { symbol: '★', className: 'text-white/40' },
}

const BADGE_STYLES: Record<Exercise['badge'], string> = {
  compound:  'border-[var(--user-color)]/50 text-[var(--user-color)]',
  isolation: 'border-white/20 text-white/50',
  cardio:    'border-blue-400/50 text-blue-400',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExerciseCard({ exercise, recommendation }: Props) {
  const arrow = recommendation ? ARROW_STYLES[recommendation.arrow] : null

  return (
    <div className="border border-white/10 bg-white/5 p-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-tight font-bold italic uppercase tracking-tight text-white text-base leading-tight">
            {exercise.name}
          </h4>
          {exercise.sets && exercise.r && (
            <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest">
              {exercise.sets} sets × {exercise.r} reps
            </p>
          )}
        </div>

        {/* Badge */}
        <span className={[
          'flex-shrink-0 text-[10px] font-tight font-bold italic uppercase tracking-tight border px-2 py-0.5',
          BADGE_STYLES[exercise.badge],
        ].join(' ')}>
          {exercise.badge}
        </span>
      </div>

      {/* Warning */}
      {exercise.warning && (
        <div className="mb-3 text-xs text-yellow-400/70 uppercase tracking-wide">
          ⚠ {exercise.warning}
        </div>
      )}

      {/* Recommendation row */}
      {recommendation && arrow && (
        <div className={`flex items-start gap-2 mb-3 text-xs ${arrow.className}`}>
          <span className="text-base leading-none mt-[-1px] flex-shrink-0">{arrow.symbol}</span>
          <div className="min-w-0">
            <span className="font-tight font-bold italic uppercase tracking-tight">
              {recommendation.label}
            </span>
            {recommendation.reason && (
              <span className="text-white/30 ml-1 normal-case tracking-normal not-italic font-normal">
                — {recommendation.reason}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cardio exercises */}
      {exercise.cardioOnly ? (
        <div className="space-y-2 mt-2">
          {exercise.cardioDesc && (
            <p className="text-sm text-white/60">{exercise.cardioDesc}</p>
          )}
          <div className="flex gap-4 text-xs text-white/40 uppercase tracking-widest">
            {exercise.zone && (
              <span>Zone {exercise.zone}</span>
            )}
            {exercise.duration && (
              <span>{exercise.duration} min</span>
            )}
          </div>
        </div>
      ) : (
        /* Strength set logger */
        <SetLogger
          exerciseName={exercise.name}
          isCompound={exercise.compound ?? false}
          recommendation={recommendation}
        />
      )}

    </div>
  )
}
