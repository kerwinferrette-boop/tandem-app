// C7 headless smoke test — proves the calibrated/derived formula-layer
// override WINS over static bank weights for bank-generated exercise names.
// Closes C7 (Code Contradictions DB) per Kerwin's 2026-07-06 call:
// "Headless smoke test (Recommended)" instead of device verify.
//
// What it does:
//   1. Extracts the formula layer (PROGRESSION → computeWeekTargets) straight
//      out of tandem.html and evals it in a vm — no copy-paste drift.
//   2. Loads programs.js the same way scripts/validate-programs.mjs does.
//   3. Replicates buildDayHTML's dayCompound1RMs registration (C7
//      COMPOUND_PATTERNS canonicalization) and startW override logic verbatim.
//   4. Asserts, using REAL bank exercise names:
//      - calibrated path: logged 1RM × weekFactor overrides ex.w
//      - C7 canonical registration: 'Flat Barbell Press' → 'Bench Press'
//      - derived path: 'Tricep Rope Pushdown' derives from that canonical key
//      - ACCESSORY_ALIASES: 'Lying Leg Curl' → 'Leg Curl' row
//      - guardrails: 'default'/'none' sources do NOT override ex.w
//      - weekFactor: 8-week reproduces authored table; 12-week interpolates;
//        burn_fat normalizes to fat_burn
//
// Run: node scripts/c7-smoke.mjs   (exit 0 = C7 verified)

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');
const programsSrc = readFileSync(path.join(root, 'programs.js'), 'utf8');

// ── 1. Extract the formula layer from tandem.html (live source, no drift) ──
const start = html.indexOf('const PROGRESSION = {');
const end = html.indexOf('async function persistWeekTargets');
if (start === -1 || end === -1 || end <= start) {
  console.error('FAIL: could not locate formula layer in tandem.html');
  process.exit(1);
}
const formulaSrc = html.slice(start, end);

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(formulaSrc, ctx, { filename: 'formula-layer(tandem.html)' });
vm.runInContext(programsSrc, ctx, { filename: 'programs.js' });
const {
  PROGRESSION, ACCESSORY_FACTORS, COMPOUND_PATTERNS, ACCESSORY_ALIASES,
  roundTo5, weekFactor, getWeekTarget, getProgram
} = vm.runInContext(
  '({ PROGRESSION, ACCESSORY_FACTORS, COMPOUND_PATTERNS, ACCESSORY_ALIASES, roundTo5, weekFactor, getWeekTarget, getProgram })',
  ctx
);

let failures = 0;
function check(label, actual, expected) {
  const ok = Object.is(actual, expected) ||
    (typeof expected === 'number' && Math.abs(actual - expected) < 1e-9);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  →  ${JSON.stringify(actual)}${ok ? '' : `  (expected ${JSON.stringify(expected)})`}`);
  if (!ok) failures++;
}

// ── 2. weekFactor sanity ──
check('weekFactor build_muscle wk5 / 8wk == authored 0.68', weekFactor('build_muscle', 5, 8), PROGRESSION.build_muscle[5]);
check('weekFactor burn_fat wk2 normalizes to fat_burn 0.52', weekFactor('burn_fat', 2, 8), PROGRESSION.fat_burn[2]);
check('weekFactor build_muscle wk12 / 12wk clamps to final 0.62', weekFactor('build_muscle', 12, 12), PROGRESSION.build_muscle[8]);

// ── 3. Calibrated path ──
const cal = getWeekTarget('Barbell Squat', 3, 'build_muscle', 200, 'male', {}, 8);
check('calibrated source', cal.source, 'calibrated');
check('calibrated weight = roundTo5(200 × 0.68)', cal.weight, roundTo5(200 * PROGRESSION.build_muscle[3]));

// ── 4. C7 canonical registration + derived path, with REAL bank names ──
// Verify the variant names actually exist in the generated bank output.
// getProgram(goal, days, weeks, sex) returns an ARRAY of days (validate-programs.mjs L140-148).
// build_muscle/5d generates BOTH bench variants — lets us test Math.max registration.
const prog = getProgram('build_muscle', 5, 12, 'male');
const allNames = new Set();
prog.forEach(d => d.blocks.forEach(b => (b.exs || []).forEach(e => e && allNames.add(e.name))));
check("bank generates 'Flat Barbell Press' (build_muscle/5d/male)", allNames.has('Flat Barbell Press'), true);
check("bank generates 'Low Incline Barbell Press'", allNames.has('Low Incline Barbell Press'), true);

// Replicate buildDayHTML's dayCompound1RMs registration verbatim (L2841-2854).
// Two variants of the same pattern seeded — canonical key must take the MAX.
const _dayWorking = { 'Flat Barbell Press': { rm: 150 }, 'Low Incline Barbell Press': { rm: 130 } };
const _dayPrs = {};
const dayCompound1RMs = {};
prog.forEach(day => day.blocks.forEach(b => (b.exs || []).forEach(e => {
  const _rm = e && (_dayWorking[e.name]?.rm ?? _dayPrs[e.name] ?? _dayPrs[e.id]);
  if (!_rm) return;
  dayCompound1RMs[e.name] = _rm;
  for (const [canon, rx] of Object.entries(COMPOUND_PATTERNS)) {
    if (rx.test(e.name)) dayCompound1RMs[canon] = Math.max(dayCompound1RMs[canon] || 0, _rm);
  }
})));
check("C7: canonical 'Bench Press' = max(Flat 150, Low Incline 130)", dayCompound1RMs['Bench Press'], 150);

const der = getWeekTarget('Tricep Rope Pushdown', 3, 'build_muscle', null, 'male', dayCompound1RMs, 8);
check('derived source (via ACCESSORY_ALIASES → Tricep Pushdown)', der.source, 'derived');
check("derived from 'Bench Press'", der.from, 'Bench Press');
check('derived weight = roundTo5(150 × 0.35)', der.weight, roundTo5(150 * ACCESSORY_FACTORS['Tricep Pushdown'].factor));

const alias = getWeekTarget('Lying Leg Curl', 3, 'build_muscle', null, 'male', { 'Romanian Deadlift': 185 }, 8);
check("alias 'Lying Leg Curl' derives from RDL", alias.source, 'derived');
check('alias weight = roundTo5(185 × 0.45)', alias.weight, roundTo5(185 * ACCESSORY_FACTORS['Leg Curl'].factor));

// ── 5. Override precedence — replicate buildDayHTML startW logic (L2898-2912) ──
function resolveStartW(ex, recWeight, pr1rm, compound1RMs) {
  let startW = recWeight || ex.w;
  if (recWeight == null && !ex.isCore) {
    const tgt = getWeekTarget(ex.name, 3, 'build_muscle', pr1rm || null, 'male', compound1RMs, 8);
    if (tgt.weight != null && (tgt.source === 'calibrated' || tgt.source === 'derived')) startW = tgt.weight;
  }
  return startW;
}
// (a) calibrated override WINS over bank seed
check('startW: calibrated 1RM=200 overrides bank ex.w=95',
  resolveStartW({ name: 'Barbell Squat', w: 95, isCore: false }, null, 200, {}), roundTo5(200 * 0.68));
// (b) derived override WINS over bank seed
check('startW: derived (Bench 150) overrides bank ex.w=40',
  resolveStartW({ name: 'Tricep Rope Pushdown', w: 40, isCore: false }, null, null, dayCompound1RMs),
  roundTo5(150 * 0.35));
// (c) default source does NOT override — curated ex.w kept
check('startW: default source keeps curated ex.w=80',
  resolveStartW({ name: 'Lat Pulldown', w: 80, isCore: false }, null, null, {}), 80);
// (d) core exercise never overridden
check('startW: isCore keeps ex.w even with 1RM present',
  resolveStartW({ name: 'Barbell Squat', w: 95, isCore: true }, null, 200, {}), 95);
// (e) logged history (rec.weight) always wins over everything
check('startW: rec.weight=105 (logged history) beats formula',
  resolveStartW({ name: 'Barbell Squat', w: 95, isCore: false }, 105, 200, {}), 105);

console.log(failures === 0
  ? '\nC7 SMOKE TEST: ALL PASS — calibrated/derived override verified headlessly.'
  : `\nC7 SMOKE TEST: ${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
