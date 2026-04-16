import { getPhase } from '@/lib/program'
import type { GoalType } from '@/lib/program'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  goal:        GoalType
  currentWeek: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format seconds into readable rest label */
function fmtRest(s: number): string {
  return s >= 60 ? `${Math.round(s / 60)} min` : `${s} sec`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PhaseBanner({ goal, currentWeek }: Props) {
  const phase = getPhase(currentWeek, goal)

  return (
    <div className="border border-white/10 bg-white/5 p-4 space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-tight font-bold italic uppercase tracking-tight text-[var(--user-color)] text-lg leading-none">
          {phase.name}
        </h2>
        <span className="font-tight font-bold italic text-sm text-white/50 uppercase tracking-tight">
          WEEK {currentWeek}
        </span>
      </div>

      {/* Intent */}
      <p className="text-sm text-white/60 leading-snug">{phase.intent}</p>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/5 p-2">
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Rep Range</div>
          <div className="font-tight font-bold text-sm text-white">{phase.reps}</div>
        </div>
        <div className="bg-white/5 p-2">
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Compound Rest</div>
          <div className="font-tight font-bold text-sm text-white">{fmtRest(phase.restComp)}</div>
        </div>
        <div className="bg-white/5 p-2">
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Accessory Rest</div>
          <div className="font-tight font-bold text-sm text-white">{fmtRest(phase.restAcc)}</div>
        </div>
      </div>

    </div>
  )
}
