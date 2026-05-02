import type { Block } from '@/lib/program'
import type { Recommendation, OverloadArrow } from '@/lib/overload'
import ExerciseCard from './ExerciseCard'

function resolveRest(block: Block, exIndex: number): number | undefined {
  if (!block.superset) return block.exs[exIndex].rest
  const isLast = exIndex === block.exs.length - 1
  return isLast ? (block.restSecs ?? block.exs[exIndex].rest) : undefined
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OverloadRow {
  recommended_next_weight_lbs: number
  recommendation:              string   // human-readable text from DB view
  min_reps_hit:                number
}

interface Props {
  blocks:      Block[]
  overloadMap: Record<string, OverloadRow>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Infer arrow direction from DB recommendation text */
function inferArrow(s: string): OverloadArrow {
  const lower = s.toLowerCase()
  if (lower.includes('increase') || lower.includes('add weight')) return 'up'
  if (lower.includes('decrease') || lower.includes('reduce') || lower.includes('deload')) return 'down'
  if (lower.includes('maintain') || lower.includes('same') || lower.includes('keep')) return 'same'
  return 'new'
}

/** Build a Recommendation object from an overload row */
function buildRec(row: OverloadRow | undefined): Recommendation | null {
  if (!row) return null

  const arrow = inferArrow(row.recommendation)

  // Split on first " - " or " — " to separate label from reason
  const dashIdx = row.recommendation.search(/ [-—] /)
  const label  = dashIdx >= 0 ? row.recommendation.slice(0, dashIdx) : row.recommendation
  const reason = dashIdx >= 0 ? row.recommendation.slice(dashIdx).replace(/^[ -—]+/, '') : ''

  return {
    weight: row.recommended_next_weight_lbs,
    arrow,
    label,
    reason,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExerciseList({ blocks, overloadMap }: Props) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <section key={block.label}>

          {/* Block header */}
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-tight font-bold italic uppercase tracking-tight text-[var(--user-color)] text-xs">
              {block.label}
            </h3>
            <div className="flex-1 h-px bg-white/10" />
            {block.cardio && (
              <span className="text-[10px] text-blue-400 uppercase tracking-widest">
                Cardio
              </span>
            )}
          </div>

          {/* Exercise cards */}
          <div className="space-y-3">
            {block.exs.map((exercise, idx) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                recommendation={buildRec(overloadMap[exercise.name])}
                restSeconds={resolveRest(block, idx)}
              />
            ))}
          </div>

        </section>
      ))}
    </div>
  )
}
