// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReadinessInput {
  /** Today's HRV (ms). */
  hrv_ms:          number
  /** 7-day rolling average HRV (ms). Used as baseline. */
  hrv_7day_avg_ms: number
  /** Sleep hours last night. */
  sleep_hours:     number
  /** Today's resting heart rate (bpm). */
  rhr_bpm:         number
  /** Baseline resting heart rate (bpm). */
  baseline_rhr_bpm: number
  /** Steps taken today. */
  steps:           number
}

export type ReadinessLevel = 'green' | 'yellow' | 'red'

export interface ReadinessResult {
  /** Composite score 0–100. */
  score:       number
  /** green ≥70 | yellow 50–69 | red <50 */
  level:       ReadinessLevel
  /** Human-readable label. */
  label:       string
  /** Training guidance based on level. */
  guidance:    string
  /** Component scores (0–100 each). */
  components: {
    hrv:   number
    sleep: number
    rhr:   number
    steps: number
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val))
}

// ── Algorithm ─────────────────────────────────────────────────────────────────

/**
 * Composite readiness score.
 *
 * Weights:
 *   HRV   — 35 %   (today_hrv / 7day_avg * 100)
 *   Sleep — 30 %   (sleep_hours / 8 * 100)
 *   RHR   — 25 %   (baseline_rhr / today_rhr * 100)
 *   Steps — 10 %   (min(steps / 8000, 1) * 100)
 *
 * Output levels:
 *   ≥70 → green  (full intensity)
 *   50–69 → yellow (moderate)
 *   <50  → red   (recovery only)
 */
export function calcReadiness(input: ReadinessInput): ReadinessResult {
  const {
    hrv_ms,
    hrv_7day_avg_ms,
    sleep_hours,
    rhr_bpm,
    baseline_rhr_bpm,
    steps,
  } = input

  // Component scores (each 0–100)
  const hrvScore   = hrv_7day_avg_ms > 0
    ? clamp((hrv_ms / hrv_7day_avg_ms) * 100)
    : 50 // neutral if no baseline

  const sleepScore = clamp((sleep_hours / 8) * 100)

  const rhrScore   = rhr_bpm > 0
    ? clamp((baseline_rhr_bpm / rhr_bpm) * 100)
    : 50 // neutral if no reading

  const stepsScore = clamp(Math.min(steps / 8000, 1) * 100)

  // Weighted composite
  const score = Math.round(
    hrvScore   * 0.35 +
    sleepScore * 0.30 +
    rhrScore   * 0.25 +
    stepsScore * 0.10,
  )

  // Level classification
  const level: ReadinessLevel =
    score >= 70 ? 'green' :
    score >= 50 ? 'yellow' :
    'red'

  const LABELS: Record<ReadinessLevel, string> = {
    green:  'Ready to Train',
    yellow: 'Moderate Readiness',
    red:    'Recovery Day',
  }

  const GUIDANCE: Record<ReadinessLevel, string> = {
    green:  'Full intensity — hit your targets and push for PRs.',
    yellow: 'Moderate effort — complete your session but don\'t max out.',
    red:    'Recovery only — light movement, mobility, or rest today.',
  }

  return {
    score,
    level,
    label:    LABELS[level],
    guidance: GUIDANCE[level],
    components: {
      hrv:   Math.round(hrvScore),
      sleep: Math.round(sleepScore),
      rhr:   Math.round(rhrScore),
      steps: Math.round(stepsScore),
    },
  }
}

// ── Score colour helpers ───────────────────────────────────────────────────────

export const READINESS_COLORS: Record<ReadinessLevel, string> = {
  green:  '#4ade80', // green-400
  yellow: '#facc15', // yellow-400
  red:    '#f87171', // red-400
}

export const READINESS_BG: Record<ReadinessLevel, string> = {
  green:  'rgba(74,222,128,0.08)',
  yellow: 'rgba(250,204,21,0.08)',
  red:    'rgba(248,113,113,0.08)',
}
