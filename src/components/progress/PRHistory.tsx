// ── PRHistory ──────────────────────────────────────────────────────────────────
// Displays personal records sorted by exercise name.
// Pure display — receives pre-fetched data via props.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PersonalRecord {
  exercise_name:     string
  best_weight_lbs:   number
  best_reps:         number
  estimated_1rm_lbs: number
  achieved_at:       string  // ISO datetime string
}

interface Props {
  records: PersonalRecord[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  '2-digit',
  })
}

function fmtExercise(name: string): string {
  // "barbell_bench_press" → "Barbell Bench Press"
  return name
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PRHistory({ records }: Props) {
  // Sort by exercise name alphabetically
  const sorted = [...records].sort((a, b) =>
    a.exercise_name.localeCompare(b.exercise_name),
  )

  return (
    <div className="border border-white/10 bg-white/5 p-4 space-y-4">

      <div className="flex items-center justify-between">
        <h3 className="font-tight font-bold italic uppercase tracking-tight text-[var(--user-color)] text-sm">
          Personal Records
        </h3>
        <span className="text-[10px] text-white/25 uppercase tracking-widest tabular-nums">
          {records.length} lifts
        </span>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-6 text-white/20 text-sm border border-white/5">
          Log sets to start setting PRs
        </div>
      ) : (
        <div className="space-y-px">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 pb-2 border-b border-white/8">
            <span className="text-[9px] text-white/25 uppercase tracking-widest">Exercise</span>
            <span className="text-[9px] text-white/25 uppercase tracking-widest text-right">Weight</span>
            <span className="text-[9px] text-white/25 uppercase tracking-widest text-right">Reps</span>
            <span className="text-[9px] text-white/25 uppercase tracking-widest text-right">1RM est.</span>
          </div>

          {sorted.map((pr) => (
            <div
              key={pr.exercise_name}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 py-2.5 border-b border-white/5 items-center"
            >
              {/* Exercise */}
              <div className="space-y-0.5">
                <div className="font-tight font-bold italic text-white text-xs uppercase tracking-tight leading-none">
                  {fmtExercise(pr.exercise_name)}
                </div>
                <div className="text-[9px] text-white/25 uppercase tracking-widest">
                  {fmtDate(pr.achieved_at)}
                </div>
              </div>

              {/* Weight */}
              <span className="text-xs text-white/70 tabular-nums text-right">
                {pr.best_weight_lbs}
                <span className="text-white/30 text-[9px] ml-0.5">lbs</span>
              </span>

              {/* Reps */}
              <span className="text-xs text-white/70 tabular-nums text-right">
                {pr.best_reps}
                <span className="text-white/30 text-[9px] ml-0.5">×</span>
              </span>

              {/* 1RM */}
              <span
                className="text-xs font-tight font-bold italic tabular-nums text-right"
                style={{ color: 'var(--user-color)' }}
              >
                {Math.round(pr.estimated_1rm_lbs)}
                <span className="text-[9px] font-normal not-italic ml-0.5" style={{ opacity: 0.5 }}>lbs</span>
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
