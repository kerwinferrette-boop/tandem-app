'use client'

import { useState } from 'react'
import type { Exercise } from '@/lib/program'
import type { Recommendation, OverloadArrow } from '@/lib/overload'
import { useAuth } from '@/contexts/AuthContext'
import SetLogger from './SetLogger'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  exercise:       Exercise
  recommendation: Recommendation | null
  restSeconds?:   number
  defaultExpanded?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ARROW_ICON: Record<OverloadArrow, { symbol: string; color: string }> = {
  up:   { symbol: '↑', color: 'var(--user-color)' },
  same: { symbol: '→', color: 'rgba(255,255,255,0.45)' },
  down: { symbol: '↓', color: '#F87171' },
  new:  { symbol: '★', color: 'rgba(255,255,255,0.30)' },
}

const BADGE_BORDER: Record<Exercise['badge'], string> = {
  compound:  'border-[rgba(27,94,56,0.6)] text-[#1B5E38]',
  isolation: 'border-white/20 text-white/40',
  cardio:    'border-blue-400/40 text-blue-400',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExerciseCard({ exercise, recommendation, restSeconds, defaultExpanded = false }: Props) {
  const { profile } = useAuth()
  const [expanded, setExpanded] = useState(defaultExpanded)

  const arrow = recommendation ? ARROW_ICON[recommendation.arrow] : ARROW_ICON.new

  const restLabel = restSeconds
    ? restSeconds >= 60
      ? `${Math.round(restSeconds / 60)}min rest`
      : `${restSeconds}s rest`
    : null

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: '#1A2035',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* ── Card header (always visible) ─────────────────────── */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-4 pt-4 pb-3 flex items-start gap-3"
      >
        {/* Completion dot / checkbox */}
        <span
          className="mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center"
          style={{ border: '1.5px solid rgba(27,94,56,0.5)', backgroundColor: 'rgba(27,94,56,0.08)' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(27,94,56,0.5)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>

        {/* Name + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-tight font-bold italic uppercase tracking-tight text-white text-base leading-tight">
              {exercise.name}
            </h4>
            <span className={`text-[9px] font-tight font-bold italic uppercase tracking-tight border px-1.5 py-0.5 ${BADGE_BORDER[exercise.badge]}`}>
              {exercise.badge}
            </span>
          </div>

          {/* Sets × reps · rest */}
          {exercise.sets && exercise.r && (
            <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--user-color)' }}>
              {exercise.sets} × {exercise.r} reps{restLabel ? ` · ${restLabel}` : ''}
            </p>
          )}
        </div>

        {/* Expand chevron */}
        <span className="flex-shrink-0 text-white/30 mt-0.5 transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* Progression pill */}
      {recommendation && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <span className="text-base leading-none" style={{ color: arrow.color }}>{arrow.symbol}</span>
          <span
            className="text-[10px] font-tight font-bold italic uppercase tracking-tight px-2 py-0.5 rounded"
            style={{ backgroundColor: `${arrow.color}18`, color: arrow.color, border: `1px solid ${arrow.color}40` }}
          >
            {recommendation.label}
          </span>
          {recommendation.reason && (
            <span className="text-[10px] text-white/30 normal-case tracking-normal not-italic">
              {recommendation.reason}
            </span>
          )}
        </div>
      )}

      {!recommendation && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <span className="text-base" style={{ color: 'var(--user-color)' }}>★</span>
          <span
            className="text-[10px] font-tight font-bold italic uppercase tracking-tight px-2 py-0.5 rounded"
            style={{ backgroundColor: 'rgba(27,94,56,0.15)', color: 'var(--user-color)', border: '1px solid rgba(27,94,56,0.40)' }}
          >
            First session
          </span>
          <span className="text-[10px] text-white/30 not-italic">Log this session to set your baseline</span>
        </div>
      )}

      {/* Warning */}
      {exercise.warning && (
        <div className="px-4 pb-2 text-xs text-yellow-400/70 flex items-start gap-1.5">
          <span>⚠</span>
          <span>{exercise.warning}</span>
        </div>
      )}

      {/* ── Expanded section ────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-white/[0.06]">

          {/* Cardio exercise */}
          {exercise.cardioOnly ? (
            <div className="px-4 py-4 space-y-2">
              {exercise.cardioDesc && (
                <p className="text-sm text-white/60">{exercise.cardioDesc}</p>
              )}
              <div className="flex gap-4 text-xs text-white/40 uppercase tracking-widest">
                {exercise.zone && <span>{exercise.zone}</span>}
                {exercise.duration && <span>{exercise.duration} min</span>}
              </div>
            </div>
          ) : (
            <div className="px-4 py-4">
              <SetLogger
                exerciseName={exercise.name}
                isCompound={exercise.compound ?? false}
                targetSets={exercise.sets ?? 3}
                recommendation={recommendation}
                restSeconds={restSeconds}
                userId={profile?.id ?? ''}
              />
            </div>
          )}

          {/* Coaching text */}
          {exercise.why && (
            <div
              className="mx-4 mb-3 px-3 py-2.5 rounded text-sm text-white/65 leading-relaxed"
              style={{ borderLeft: '3px solid var(--user-color)', backgroundColor: 'rgba(27,94,56,0.08)' }}
            >
              {exercise.why}
            </div>
          )}

          {/* Form cues */}
          {exercise.cues && exercise.cues.length > 0 && (
            <div className="px-4 pb-4 space-y-1">
              {exercise.cues.map((cue, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-white/50">
                  <span style={{ color: 'var(--user-color)' }}>→</span>
                  <span>{cue}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
