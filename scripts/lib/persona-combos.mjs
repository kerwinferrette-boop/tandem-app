// ═══════════════════════════════════════════════════════
// THE persona/SKU combo matrix — one definition, two consumers.
//
// Extracted from persona-matrix.mjs on 2026-08-30 so that
// scripts/program-snapshot.mjs sweeps the SAME inputs the legality
// matrix does, rather than inventing a parallel one. Two matrices that
// "happen to match today" is the silo pattern CLAUDE.md forbids: they
// drift, and then the snapshot stops covering combos the matrix checks.
//
// Consumers:
//   - scripts/persona-matrix.mjs   (legality: R6-R9)
//   - scripts/program-snapshot.mjs (change detection)
//
// Scope note, inherited verbatim from persona-matrix.mjs: age, height,
// weight and experience are captured at onboarding but NOT passed into
// getProgram() by any call site in tandem.html (verified 2026-07-13) —
// that wiring is EPIC-8, still unstarted. So this matrix does not vary
// those axes; doing so today would re-run the same combo N times for no
// signal.
// ═══════════════════════════════════════════════════════

export const GOALS      = ['fat_burn', 'build_muscle', 'transform'];
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
