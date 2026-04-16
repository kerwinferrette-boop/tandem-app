'use client'

import { useState } from 'react'
import { calcRM, type RMFormula } from '@/lib/overload'

// ── Data ──────────────────────────────────────────────────────────────────────

const FORMULAS: { key: RMFormula; label: string; desc: string }[] = [
  { key: 'epley',    label: 'Epley',    desc: 'Most common' },
  { key: 'brzycki',  label: 'Brzycki',  desc: 'Conservative' },
  { key: 'lombardi', label: 'Lombardi', desc: 'Power athletes' },
  { key: 'mayhew',   label: 'Mayhew',   desc: 'High-rep focus' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function RM_Calculator() {
  const [weight,  setWeight]  = useState<string>('')
  const [reps,    setReps]    = useState<string>('')
  const [formula, setFormula] = useState<RMFormula>('epley')

  const w = parseFloat(weight)
  const r = parseInt(reps, 10)
  const result = !isNaN(w) && !isNaN(r) && r >= 1 && w > 0
    ? Math.round(calcRM(w, r, formula))
    : null

  return (
    <div className="border border-white/10 bg-white/5 p-4 space-y-4">

      <h3 className="font-tight font-bold italic uppercase tracking-tight text-[var(--user-color)] text-sm">
        1RM Calculator
      </h3>

      {/* Weight + Reps inputs */}
      <div className="flex gap-2">
        <input
          type="number"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="Weight (lbs)"
          className="
            flex-1 bg-white/5 border border-white/20 px-3 py-2
            text-sm text-white placeholder:text-white/25
            focus:outline-none focus:border-[var(--user-color)]
            transition-colors
          "
        />
        <input
          type="number"
          value={reps}
          onChange={e => setReps(e.target.value)}
          placeholder="Reps"
          className="
            w-24 bg-white/5 border border-white/20 px-3 py-2
            text-sm text-white placeholder:text-white/25
            focus:outline-none focus:border-[var(--user-color)]
            transition-colors
          "
        />
      </div>

      {/* Formula selector */}
      <div className="grid grid-cols-4 gap-1">
        {FORMULAS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFormula(key)}
            className={[
              'py-2 text-xs font-tight font-bold italic uppercase tracking-tight border transition-all duration-150',
              formula === key
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
        <div className="text-center py-4 border border-white/10">
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">
            Estimated 1RM
          </div>
          <div className="font-tight font-bold italic text-5xl text-[var(--user-color)] leading-none">
            {result}
          </div>
          <div className="text-white/40 text-sm mt-1">lbs</div>
          <div className="text-white/25 text-xs mt-2 uppercase tracking-widest">
            {FORMULAS.find(f => f.key === formula)?.desc}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 border border-white/5 text-white/20 text-sm">
          Enter weight and reps
        </div>
      )}

    </div>
  )
}
