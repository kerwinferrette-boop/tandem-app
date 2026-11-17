// ═══════════════════════════════════════════════════════
// THE persona/SKU combo matrix — one definition, two consumers.
//
// Extracted from persona-matrix.mjs on 2026-08-30 so that
// scripts/program-snapshot.mjs sweeps the SAME inputs the legality
// matrix does, rather than inventing a parallel one. Two matrices that
// "happen to match today" is the silo pattern CLAUDE.md forbids: they
// drift, and then the snapshot stops covering combos the matrix checks.
//
// Consumers (combos()): persona-matrix, program-snapshot, matrix-reach-detector,
// selection-reachability and other sweeps. experienceDurationCombos(): persona-matrix.
//
// Scope note (BUG-141, rewritten 2026-11-17 — the 2026-07-13 note it replaces said
// experience is not passed to getProgram(); that stopped being true when EPIC-8a shipped):
// tandem.html's getActiveProgram() passes cfg.experience (getProgram arg 10) and
// cfg.workout_duration_minutes (arg 12), and the generator branches on both
// (normalizeExperience: beginner / intermediate / advanced; SHORT_SESSION_MAX_MINUTES for
// the short-session accessory drop). combos() below still holds those two axes at their
// defaults, ON PURPOSE: program-snapshot, matrix-reach and selection-reachability key their
// committed baselines by combo(), so widening combos() would rewrite every baseline at once.
// The two axes are swept by experienceDurationCombos() instead, which the persona matrix
// runs through the same legality rules. Age, height and weight are still not swept: they
// are not read for exercise selection (weight/targetWeight feed only the D32 cardio gate,
// covered by its own smoke).
// ═══════════════════════════════════════════════════════

export const GOALS      = ['fat_burn', 'build_muscle', 'transform', 'strength', 'maintenance']; // 5-Goal Taxonomy: all 5 live (D8 promoted 2026-09-24)
export const DAY_COUNTS = [2, 3, 4, 5, 6];
export const SEXES      = ['male', 'female'];
export const TIERS      = ['full_gym', 'hotel_gym', 'home'];
export const WEEKS      = 12; // fixed — see validate-programs.mjs R5 for week-length coverage

// One representative phrase per makeInjuryBlocked() keyword rule, plus a
// clean baseline. Not exhaustive of every synonym — enough to exercise
// every ban regex at least once.
export const INJURY_PROFILES = [
  { label: 'none',      value: '' },
  { label: 'knee',      value: 'knee pain' },
  { label: 'lowerback', value: 'lower back injury' },
  { label: 'shoulder',  value: 'shoulder impingement' },
  { label: 'elbow',     value: 'tennis elbow' },
  { label: 'wrist',     value: 'wrist pain' },
  { label: 'hip',       value: 'hip pain' },
];

export const TIER_ORDER = ['home', 'hotel_gym', 'full_gym'];

export const COMBO_COUNT =
  GOALS.length * DAY_COUNTS.length * SEXES.length * TIERS.length * INJURY_PROFILES.length;

// Deterministic iteration order. Both consumers depend on this being stable:
// persona-matrix reports "first 5 examples", program-snapshot keys its baseline
// by combo label. Never reorder the loops without regenerating the baseline.
export function* combos() {
  for (const goal of GOALS)
    for (const days of DAY_COUNTS)
      for (const sex of SEXES)
        for (const tier of TIERS)
          for (const injury of INJURY_PROFILES)
            yield {
              combo: `${goal}/${days}d/${sex}/${tier}/${injury.label}`,
              goal, days, sex, tier, injury,
              // The exact argument list every consumer must use, so the two
              // never diverge on e.g. maxDb or rotation defaults:
              // getProgram(goal, days, weeks, sex, equipment, emphasis, injuries, maxDb, rotation)
              args: [goal, days, WEEKS, sex, tier, 'balanced', injury.value, null, null],
            };
}

// BUG-141 — the experience x duration axes. Every value normalizeExperience() tells apart,
// plus an absent value (an account that never answered); durations on BOTH sides of
// SHORT_SESSION_MAX_MINUTES plus an absent value. scripts/persona-axes-coverage-smoke.mjs
// fails if programs.js grows an experience tier or moves the threshold past these values.
export const EXPERIENCES = ['beginner', 'intermediate', 'advanced', null];
export const DURATIONS   = [null, 30, 60];

// Full cross-product with combos(): 1050 x 4 x 3 = 12600 programs. Same argument list,
// with getProgram's experience (index 9) and durationMinutes (index 11) filled in.
export function* experienceDurationCombos() {
  for (const c of combos())
    for (const experience of EXPERIENCES)
      for (const duration of DURATIONS) {
        const args = [...c.args, experience, null, duration];
        yield { ...c, experience, duration,
          combo: `${c.combo}/exp=${experience ?? 'unset'}/min=${duration ?? 'unset'}`, args };
      }
}
