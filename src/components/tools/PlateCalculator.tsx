'use client'

import { useState } from 'react'
import { calcPlates, PLATE_COLORS } from '@/lib/overload'

// ── Component ─────────────────────────────────────────────────────────────────

const BAR_OPTIONS: { lbs: 45 | 35; label: string }[] = [
  { lbs: 45, label: '45 lb (Olympic)' },
  { lbs: 35, label: '35 lb (Lighter)'  },
]

export default function PlateCalculator() {
  const [target,    setTarget]    = useState<string>('')
  const [barWeight, setBarWeight] = useState<45 | 35>(45)

  const t      = parseFloat(target)
  const result = !isNaN(t) && t > 0 ? calcPlates(t, barWeight) : null

  return (
    <div className="border border-white/10 bg-white/5 p-4 space-y-4">

      <h3 className="font-tight font-bold italic uppercase tracking-tight text-[var(--user-color)] text-sm">
        Plate Calculator
      </h3>

      {/* Target weight input */}
      <input
        type="number"
        value={target}
        onChange={e => setTarget(e.target.value)}
        placeholder="Target weight (lbs)"
        className="
          w-full bg-white/5 border border-white/20 px-3 py-2
          text-sm text-white placeholder:text-white/25
          focus:outline-none focus:border-[var(--user-color)]
          transition-colors
        "
      />

      {/* Bar selector */}
      <div className="grid grid-cols-2 gap-1">
        {BAR_OPTIONS.map(({ lbs, label }) => (
          <button
            key={lbs}
            onClick={() => setBarWeight(lbs)}
            className={[
              'py-2 text-xs font-tight font-bold italic uppercase tracking-tight border transition-all duration-150',
              barWeight === lbs
                ? 'border-[var(--user-color)] bg-[var(--user-color)]/10 text-[var(--user-color)]'
                : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white/70',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Result */}
      {result !== null ? (
        <div className="space-y-3">

          {/* Actual weight */}
          <div className="text-center py-3 border border-white/10">
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">
              Load Each Side
            </div>
            <div className="font-tight font-bold italic text-4xl text-[var(--user-color)] leading-none">
              {result.actualWeight}
            </div>
            <div className="text-white/40 text-sm mt-1">lbs total</div>
            {!result.exact && (
              <div className="text-yellow-400/70 text-xs mt-2 uppercase tracking-widest">
                Closest achievable weight
              </div>
            )}
          </div>

          {/* Plate breakdown */}
          {result.slots.length > 0 ? (
            <div className="space-y-1.5">
              <div className="text-[10px] text-white/40 uppercase tracking-widest">
                Per side · {barWeight} lb bar
              </div>
              {result.slots.map(({ p, c }) => (
                <div
                  key={p}
                  className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0"
                >
                  {/* Colored plate dot */}
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0 border border-white/20"
                    style={{ backgroundColor: PLATE_COLORS[p] ?? '#555' }}
                  />
                  <span className="text-white text-sm flex-1">
                    {p} lb
                  </span>
                  <span className="font-tight font-bold italic text-[var(--user-color)] text-sm">
                    × {c}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-white/30 text-xs uppercase tracking-widest py-2">
              Bar only — no plates needed
            </div>
          )}

        </div>
      ) : (
        <div className="text-center py-4 border border-white/5 text-white/20 text-sm">
          Enter target weight
        </div>
      )}

    </div>
  )
}
