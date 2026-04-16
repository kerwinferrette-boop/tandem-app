// ── WeightThermometer ──────────────────────────────────────────────────────────
// Vertical gradient bar visualising weight progress from start → current → goal.
// Pure display — no hooks, no 'use client'.

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  startLbs:   number
  currentLbs: number
  goalLbs:    number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v))
}

function fmt(lbs: number) {
  return `${Math.round(lbs).toLocaleString()} lbs`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WeightThermometer({ startLbs, currentLbs, goalLbs }: Props) {
  // Guard: if start === goal avoid divide-by-zero
  const range = Math.abs(startLbs - goalLbs)

  const fillPct = range === 0 ? 0 : clamp(
    ((startLbs - currentLbs) / (startLbs - goalLbs)) * 100,
  )

  const lbsLost      = Math.round(Math.max(startLbs - currentLbs, 0))
  const lbsRemaining = Math.round(Math.max(currentLbs - goalLbs, 0))

  // Label positions — percentage from TOP of bar (100% = bottom = start)
  // start  → 100% from top (bottom)
  // goal   → 0%   from top (top)
  // current → (1 - fillPct/100) * 100 from top
  const currentFromTop = clamp(100 - fillPct)

  return (
    <div className="border border-white/10 bg-white/5 p-4 space-y-4">

      <h3 className="font-tight font-bold italic uppercase tracking-tight text-[var(--user-color)] text-sm">
        Weight Progress
      </h3>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="space-y-1">
          <div className="text-[10px] text-white/30 uppercase tracking-widest">Lost</div>
          <div className="font-tight font-bold italic text-white text-lg tabular-nums leading-none">
            {lbsLost}
            <span className="text-white/30 text-xs font-normal not-italic ml-0.5">lbs</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] text-white/30 uppercase tracking-widest">Current</div>
          <div className="font-tight font-bold italic text-[var(--user-color)] text-lg tabular-nums leading-none">
            {Math.round(currentLbs)}
            <span className="text-[var(--user-color)]/50 text-xs font-normal not-italic ml-0.5">lbs</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] text-white/30 uppercase tracking-widest">To Go</div>
          <div className="font-tight font-bold italic text-white text-lg tabular-nums leading-none">
            {lbsRemaining}
            <span className="text-white/30 text-xs font-normal not-italic ml-0.5">lbs</span>
          </div>
        </div>
      </div>

      {/* Thermometer */}
      <div className="flex gap-4 items-stretch">

        {/* Bar column */}
        <div className="relative w-8 flex-shrink-0 flex flex-col">
          {/* Track */}
          <div className="flex-1 relative overflow-hidden" style={{ minHeight: 180 }}>
            {/* Background track */}
            <div className="absolute inset-0 bg-white/5 border border-white/10" />

            {/* Filled portion (bottom-up) */}
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-700"
              style={{
                height: `${fillPct}%`,
                background: `linear-gradient(
                  to top,
                  rgba(255,255,255,0.08) 0%,
                  var(--user-color, #CCFF00) 100%
                )`,
              }}
            />

            {/* Current weight tick mark */}
            <div
              className="absolute left-0 right-0 h-0.5 bg-[var(--user-color)] transition-all duration-700"
              style={{ bottom: `${fillPct}%` }}
            />
          </div>
        </div>

        {/* Labels column */}
        <div
          className="relative flex-1 select-none"
          style={{ minHeight: 180 }}
        >
          {/* Goal label — top */}
          <div className="absolute top-0 left-0 right-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/30 uppercase tracking-widest">Goal</span>
              <span className="font-tight font-bold italic text-xs text-white/60 tabular-nums">
                {fmt(goalLbs)}
              </span>
            </div>
            <div className="w-3 h-px bg-white/15 mt-0.5" />
          </div>

          {/* Current label — dynamic position */}
          <div
            className="absolute left-0 right-0 transition-all duration-700"
            style={{ top: `${currentFromTop}%`, transform: 'translateY(-50%)' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] uppercase tracking-widest font-tight font-bold italic"
                style={{ color: 'var(--user-color)' }}
              >
                Now
              </span>
              <span
                className="font-tight font-bold italic text-xs tabular-nums"
                style={{ color: 'var(--user-color)' }}
              >
                {fmt(currentLbs)}
              </span>
            </div>
            <div className="w-3 h-px mt-0.5" style={{ backgroundColor: 'var(--user-color)' }} />
          </div>

          {/* Start label — bottom */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="w-3 h-px bg-white/15 mb-0.5" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/30 uppercase tracking-widest">Start</span>
              <span className="font-tight font-bold italic text-xs text-white/60 tabular-nums">
                {fmt(startLbs)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress pct */}
      <div className="text-center">
        <span
          className="font-tight font-bold italic text-2xl tabular-nums"
          style={{ color: 'var(--user-color)' }}
        >
          {Math.round(fillPct)}%
        </span>
        <span className="text-[10px] text-white/30 uppercase tracking-widest ml-2">
          to goal
        </span>
      </div>

    </div>
  )
}
