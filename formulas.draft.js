// ═══════════════════════════════════════════════════════
// TANDEM — Formula Layer DRAFT (EPIC-9 · v0.5-calibration)
// Drafted 2026-06-11 for Kerwin's review. NOT loaded by tandem.html yet.
// This is the "Excel formulas" layer: pure functions that COMPUTE weights
// from user inputs (1RM, week, goal) instead of reading typed values.
// On approval, this merges into tandem.html (logic) — programs.js stays data.
// Source of truth: Notion EPIC-9 "07 · Baseline Calibration + Per-Goal
// Weekly Progression Formula" — all numbers below come from that epic.
// ═══════════════════════════════════════════════════════

// ── Epley estimated 1RM: the "input cell" every formula reads ──
// 1RM = weight × (1 + reps / 30)
function epley1RM(weight, reps) {
  if (!weight || !reps) return null;
  return weight * (1 + reps / 30);
}

// ── Weekly intensity factors per goal (week 1 = calibration, no factor) ──
// Each value is the % of 1RM to prescribe that week.
const PROGRESSION = {
  fat_burn:     { 2: 0.52, 3: 0.55, 4: 0.50, 5: 0.55, 6: 0.58, 7: 0.61, 8: 0.52 },
  build_muscle: { 2: 0.65, 3: 0.68, 4: 0.60, 5: 0.68, 6: 0.72, 7: 0.75, 8: 0.62 },
  transform:    { 2: 0.68, 3: 0.58, 4: 0.72, 5: 0.55, 6: 0.72, 7: 0.75, 8: 0.58 }
};

// Transform goal also undulates reps weekly (strength vs metabolic)
const TRANSFORM_REPS = { 2: 10, 3: 15, 4: 8, 5: 15, 6: 10, 7: 8, 8: 12 };

// ── Accessory derivation: accessory weight = compound 1RM × factor ──
const ACCESSORY_FACTORS = {
  'Leg Curl':              { from: 'Romanian Deadlift', factor: 0.45 },
  'Leg Extension':         { from: 'Squat',             factor: 0.50 },
  'Cable Kickback':        { from: 'Hip Thrust',        factor: 0.25 },
  'Lateral Raise':         { from: 'Overhead Press',    factor: 0.20 },
  'Face Pull':             { from: 'Row',               factor: 0.35 },
  'Hammer Curl':           { from: 'Row',               factor: 0.40 },
  'Tricep Pushdown':       { from: 'Bench Press',       factor: 0.35 },
  'Hip Abduction Machine': { from: 'Hip Thrust',        factor: 0.40 }
};

// ── Sex-aware fallback defaults (used when user skips onboarding estimate
//    AND has no calibrated 1RM yet). From epic's Default Weight Matrix. ──
const DEFAULT_WEIGHTS = {
  female: {
    'Hip Thrust': 45, 'Romanian Deadlift': 35, 'Goblet Squat': 25,
    'Bulgarian Split Squat': 15, 'DB Bench Press': 20, 'Dumbbell Row': 25,
    'Lat Pulldown': 40, 'Arnold Press': 15, 'Cable Lateral Raise': 7.5,
    'Leg Curl': 30, 'Cable Kickback': 15, 'Leg Extension': 30
  },
  male: {
    'Barbell Squat': 135, 'Hack Squat': 135, 'Romanian Deadlift': 135,
    'Leg Press': 180, 'Barbell Bench Press': 135, 'DB Bench Press': 50,
    'Barbell Row': 95, 'Dumbbell Row': 50, 'Lat Pulldown': 80,
    'Overhead Press': 75, 'Cable Lateral Raise': 15, 'Leg Curl': 60,
    'Leg Extension': 70
  }
};

// ── Round to nearest 5 lbs (plate-loadable) ──
function roundTo5(w) { return Math.round(w / 5) * 5; }

// ═══════════════════════════════════════════════════════
// getWeekTarget(exerciseName, currentWeek, goal, oneRM, sex)
// The =A2*B2 cell. Resolution order:
//   1. calibrated 1RM × week intensity factor (the real formula path)
//   2. accessory derivation from adjacent compound 1RM × factor
//   3. sex-aware default (no calibration yet)
// Returns { weight, source } so the UI can show WHY a number was prescribed.
// ═══════════════════════════════════════════════════════
function getWeekTarget(exerciseName, currentWeek, goal, oneRM, sex, compound1RMs) {
  const table = PROGRESSION[goal] || PROGRESSION.build_muscle;
  // Clamp weeks past 8 to the last defined factor (12-week programs repeat the back half pattern)
  const wk = Math.min(Math.max(currentWeek, 2), 8);
  const factor = table[wk];

  // Path 1: calibrated 1RM exists for this exercise
  if (oneRM && factor) {
    return { weight: roundTo5(oneRM * factor), source: 'calibrated' };
  }

  // Path 2: accessory derived from a compound 1RM
  const acc = ACCESSORY_FACTORS[exerciseName];
  if (acc && compound1RMs && compound1RMs[acc.from]) {
    return { weight: roundTo5(compound1RMs[acc.from] * acc.factor), source: 'derived' };
  }

  // Path 3: sex-aware default fallback
  const sexKey = (sex === 'female' || sex === 'F' || sex === 'f') ? 'female' : 'male';
  const def = DEFAULT_WEIGHTS[sexKey][exerciseName];
  if (def != null) return { weight: def, source: 'default' };

  return { weight: null, source: 'none' };
}

// Node smoke test (run: node formulas.draft.js)
if (typeof module !== 'undefined' && require.main === module) {
  const rm = epley1RM(95, 10); // 95 lbs x 10 reps -> ~126.7
  console.log('Epley 95x10 ->', rm.toFixed(1));
  console.log('build_muscle wk2 @', rm.toFixed(0), '1RM ->', getWeekTarget('Barbell Bench Press', 2, 'build_muscle', rm, 'male'));
  console.log('fat_burn wk7 @', rm.toFixed(0), '1RM ->', getWeekTarget('Barbell Bench Press', 7, 'fat_burn', rm, 'male'));
  console.log('Tricep Pushdown derived ->', getWeekTarget('Tricep Pushdown', 3, 'build_muscle', null, 'male', { 'Bench Press': 127 }));
  console.log('No calibration, female Hip Thrust ->', getWeekTarget('Hip Thrust', 2, 'build_muscle', null, 'female'));
}
