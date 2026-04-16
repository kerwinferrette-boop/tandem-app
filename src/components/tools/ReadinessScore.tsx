'use client'

import { calcReadiness, READINESS_COLORS, READINESS_BG } from '@/lib/readiness'
import type { ReadinessInput } from '@/lib/readiness'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  data: ReadinessInput | null
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function ComponentBar({
  label,
  score,
  color,
}: {
  label: string
  score: number
  color: string
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-white/40 uppercase tracking-widest font-tight font-bold italic">
          {label}
        </span>
        <span className="text-[10px] text-white/40 tabular-nums">{score}</span>
      </div>
      <div className="h-1 bg-white/10 w-full">
        <div
          className="h-1 transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReadinessScore({ data }: Props) {
  // No data yet — prompt for entry
  if (!data) {
    return (
      <div className="border border-white/10 bg-white/5 p-4 space-y-3">
        <h3 className="font-tight font-bold italic uppercase tracking-tight text-[var(--user-color)] text-sm">
          Readiness Score
        </h3>
        <div className="text-center py-6 text-white/20 text-sm border border-white/5">
          Log today&apos;s health data to see your readiness score
        </div>
      </div>
    )
  }

  const result = calcReadiness(data)
  const color  = READINESS_COLORS[result.level]
  const bg     = READINESS_BG[result.level]

  return (
    <div className="border border-white/10 bg-white/5 p-4 space-y-4">

      <h3 className="font-tight font-bold italic uppercase tracking-tight text-[var(--user-color)] text-sm">
        Readiness Score
      </h3>

      {/* Score block */}
      <div
        className="py-5 text-center border"
        style={{ borderColor: `${color}30`, backgroundColor: bg }}
      >
        <div
          className="font-tight font-bold italic text-6xl leading-none"
          style={{ color }}
        >
          {result.score}
        </div>
        <div
          className="mt-2 text-xs font-tight font-bold italic uppercase tracking-widest"
          style={{ color }}
        >
          {result.label}
        </div>
        <p className="mt-2 text-white/40 text-xs px-4 leading-relaxed">
          {result.guidance}
        </p>
      </div>

      {/* Component bars */}
      <div className="space-y-3">
        <ComponentBar label="HRV"   score={result.components.hrv}   color={color} />
        <ComponentBar label="Sleep" score={result.components.sleep} color={color} />
        <ComponentBar label="RHR"   score={result.components.rhr}   color={color} />
        <ComponentBar label="Steps" score={result.components.steps} color={color} />
      </div>

    </div>
  )
}
