import { getPhase, type GoalType } from './program'

// ── Types ─────────────────────────────────────────────────────────────────────

export type RMFormula    = 'epley' | 'brzycki' | 'lombardi' | 'mayhew'
export type OverloadArrow = 'up' | 'same' | 'down' | 'new'

export interface LastSet {
  minReps: number
  weight:  number
}

export interface Recommendation {
  weight: number | null
  arrow:  OverloadArrow
  label:  string
  reason: string
}

export interface PlateSlot {
  p: number   // plate weight in lbs
  c: number   // count of this plate per side
}

export interface PlateResult {
  slots:        PlateSlot[]
  exact:        boolean
  actualWeight: number    // achievable weight (= target when exact, otherwise nearest lower)
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Standard Olympic plates (lbs), sorted largest → smallest */
export const PLATES = [45, 35, 25, 10, 5, 2.5] as const

/** Plate colours for the visual calculator (keyed by lbs) */
export const PLATE_COLORS: Record<number, string> = {
  45:  '#c0392b',
  35:  '#2980b9',
  25:  '#f39c12',
  10:  '#27ae60',
  5:   '#8e44ad',
  2.5: '#95a5a6',
}

// ── 1RM Calculator ────────────────────────────────────────────────────────────

/**
 * Estimate 1-rep max from a working weight and rep count.
 *
 * @param w        weight lifted (lbs)
 * @param r        reps performed
 * @param formula  Epley (default) | Brzycki | Lombardi | Mayhew
 */
export function calcRM(
  w: number,
  r: number,
  formula: RMFormula = 'epley',
): number {
  if (r === 1) return w
  switch (formula) {
    case 'epley':    return w * (1 + r / 30)
    case 'brzycki':  return w * (36 / (37 - r))
    case 'lombardi': return w * Math.pow(r, 0.1)
    case 'mayhew':   return (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r))
    default:         return w * (1 + r / 30)
  }
}

// ── Plate Calculator ──────────────────────────────────────────────────────────

/**
 * Compute plates per side needed to reach `target` lbs.
 * Pure function — no DOM access.
 *
 * @param target     total target weight (lbs, bar included)
 * @param barWeight  bar weight in lbs (default 45)
 */
export function calcPlates(
  target: number,
  barWeight = 45,
): PlateResult {
  if (target <= barWeight) {
    return { slots: [], exact: target === barWeight, actualWeight: barWeight }
  }

  const slots: PlateSlot[] = []
  let rem = (target - barWeight) / 2

  for (const p of PLATES) {
    const c = Math.floor(rem / p)
    if (c > 0) {
      slots.push({ p, c })
      rem = Math.round((rem - c * p) * 100) / 100
    }
  }

  const perSide      = slots.reduce((sum, { p, c }) => sum + p * c, 0)
  const actualWeight = barWeight + perSide * 2
  const exact        = rem < 0.01

  return { slots, exact, actualWeight }
}

// ── Progressive Overload Recommendation ──────────────────────────────────────

/**
 * Return a weight recommendation with directional cue based on last session
 * performance and the current training phase.
 *
 * The threshold logic mirrors the HTML prototype exactly:
 *   minReps >= pctTop         → increase weight
 *   minReps >= pctTop - 3     → hold weight
 *   else                      → reduce weight
 *
 * @param compound    true = compound lift (incComp / pctTop), false = accessory (incAcc)
 * @param goal        user's current goal type
 * @param currentWeek user's current program week (1–12)
 * @param lastSet     most recent set data for this exercise, or null if first session
 */
/**
 * Round weight to the nearest 5 lbs (standard plate increment).
 */
function roundTo5(n: number): number {
  return Math.round(n / 5) * 5
}

export function getRecommendation(
  compound:    boolean,
  goal:        GoalType,
  currentWeek: number,
  lastSet:     LastSet | null,
): Recommendation {
  if (!lastSet) {
    return {
      weight: null,
      arrow:  'new',
      label:  'First session',
      reason: 'Log this session to set your baseline',
    }
  }

  const phase    = getPhase(currentWeek, goal)
  const topRange = phase.pctTop
  const { minReps, weight } = lastSet

  // Percentage-based progression: 2.5–5% depending on compound/accessory and phase
  // phase.pctInc is already expressed as a percentage (e.g. 5 = 5%)
  const pct = (compound ? phase.pctInc : Math.max(phase.pctInc - 2, 2.5)) / 100

  let rec:    number
  let arrow:  OverloadArrow
  let reason: string

  if (minReps >= topRange) {
    const increase = Math.max(roundTo5(weight * pct), 5)
    rec    = roundTo5(weight + increase)
    arrow  = 'up'
    reason = `${minReps} reps hit — +${increase} lbs (${(pct * 100).toFixed(1)}%)`
  } else if (minReps >= topRange - 3) {
    rec    = weight
    arrow  = 'same'
    reason = `${minReps} reps — hit full range first`
  } else {
    const drop = Math.max(roundTo5(weight * 0.05), 5)
    rec    = Math.max(roundTo5(weight - drop), 5)
    arrow  = 'down'
    reason = `Only ${minReps} reps — drop ${drop} lbs`
  }

  return { weight: rec, arrow, label: `${rec} lbs`, reason }
}
