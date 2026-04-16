// ── StreakBadge ────────────────────────────────────────────────────────────────
// Displays current workout streak with an SVG flame icon.
// No emojis — inline SVG only.

interface Props {
  streak: number
  /** Accent color for flame + number. Defaults to --user-color. */
  color?: string
}

export default function StreakBadge({ streak, color = 'var(--user-color)' }: Props) {
  if (streak === 0) {
    return (
      <span className="text-[10px] text-white/25 uppercase tracking-widest italic">
        No streak yet
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Flame SVG */}
      <svg
        width="12"
        height="14"
        viewBox="0 0 12 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M6 0C6 0 6.5 2.5 5 4C3.5 5.5 2 5 2 5C2 5 2.5 8 4 9.5C4.5 10 5 10.5 5 11.5C5 12.5 4.5 13 4.5 13C4.5 13 7.5 12.5 8.5 10.5C9.5 8.5 8.5 7 8.5 7C8.5 7 10 6.5 10 4.5C10 2.5 8.5 1 8.5 1C8.5 1 8 2 7 2.5C6.5 2.75 6 2.5 6 0Z"
          fill={color}
          opacity="0.9"
        />
        <ellipse cx="6" cy="10.5" rx="2" ry="3" fill={color} opacity="0.4" />
      </svg>

      <span
        className="font-tight font-bold italic text-sm tabular-nums leading-none"
        style={{ color }}
      >
        {streak}
      </span>

      <span className="text-white/40 text-[10px] uppercase tracking-widest leading-none">
        day{streak !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
