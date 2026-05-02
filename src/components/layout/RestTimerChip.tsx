'use client'

import { useRestTimer } from '@/contexts/RestTimerContext'

export default function RestTimerChip() {
  const { secondsLeft, durationSecs, exerciseName, isActive, cancelTimer } = useRestTimer()

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const display = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}`
    : `${secondsLeft}s`

  const progress = durationSecs && durationSecs > 0
    ? Math.max(0, Math.min(1, secondsLeft / durationSecs))
    : 0

  return (
    <div
      className={[
        'fixed bottom-16 left-0 right-0 z-40 transition-all duration-200',
        isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
      ].join(' ')}
    >
      <div className="max-w-lg mx-auto px-4">
        <div className="relative overflow-hidden border border-[var(--user-color)]/40 bg-[#1A1A1A]">

          {/* Progress bar — fills from left as time remains */}
          <div
            className="absolute inset-y-0 left-0 bg-[var(--user-color)]/10 transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />

          <div className="relative flex items-center justify-between px-4 h-10">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-tight font-bold italic uppercase tracking-tight text-[var(--user-color)] text-sm tabular-nums">
                REST · {display}
              </span>
              {exerciseName && (
                <span className="text-white/40 text-xs uppercase tracking-widest truncate hidden sm:block">
                  {exerciseName}
                </span>
              )}
            </div>

            <button
              onClick={cancelTimer}
              aria-label="Cancel rest timer"
              className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none ml-3 flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
