// ═══════════════════════════════════════════════════════
// THE live progression layer, extracted once — one definition, two consumers.
//
// D34 (loadless progression) is enforced in two places on purpose, and the
// 2026-09-29 council made the dedup a condition of the promotion: unowned, the
// doctrine gate and the smoke fork, and then one of them quietly stops covering
// what the other checks. Same reasoning as scripts/lib/exercise-seed.mjs (one
// emitter, two callers) and scripts/lib/persona-combos.mjs (one matrix).
//
// Consumers:
//   - scripts/doctrine.mjs                    (D34 — the LAW: adversarial
//     non-load inputs, the weight-keyed clause, the single-trigger clause)
//   - scripts/loadless-progression-smoke.mjs  (verify check #27 — the BREADTH:
//     every loadless bank movement × goal × week × rep case)
//
// WHY vm-EXTRACTION AND NOT A PORT: getRecommendation lives inside tandem.html's
// inline <script>, so it cannot be imported. Copy-pasting it into a test makes
// the test assert a FOSSIL — it would have passed on the day BUG-188 shipped and
// every day after, no matter what the app did. We slice the LIVE bytes out of
// tandem.html by stable top-level markers and eval them, so the gate can only
// ever be testing what actually ships. If a marker moves, we fail loudly with
// the marker name rather than silently testing nothing.
// ═══════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

// Two slices, both anchored on stable top-level declarations:
//   A) the PROGRESSIVE OVERLOAD ENGINE banner → the EQUIPMENT SELECTOR banner
//      (getRecommendation, the subject under test, plus phaseWeekRep /
//      effectiveReps / getPhase / PROGRESSION / progressLoad / canonicalGoal /
//      getWeekTarget / PROGRESSION_REP_SURPLUS).
//   B) earnedOneRM → the D21 ladder banner (the 1RM resolution order
//      getRecommendation calls out to; it lives further down the file).
const MARKERS = {
  progression: {
    start: '\n// PROGRESSIVE OVERLOAD ENGINE',
    end: '\n// ═══════════════════════════════════════════════════════\n// EQUIPMENT SELECTOR',
    label: 'progression layer',
  },
  oneRm: {
    start: '\nfunction earnedOneRM(',
    end: '\n// D21 — the one-off tiered-set ladder',
    label: '1RM resolution layer',
  },
};

function slice(html, { start, end, label }) {
  const a = html.indexOf(start);
  const b = html.indexOf(end, a);
  if (a === -1 || b === -1 || b <= a) {
    throw new Error(
      `could not locate ${label} in tandem.html (markers moved? start=${a} end=${b}) ` +
      '— fix the marker, do not weaken the gate'
    );
  }
  return html.slice(a, b);
}

/**
 * Evaluate the live progression layer in a fresh vm context.
 *
 * The context is FIXTURE STATE, not a re-implementation: an account with no PRs,
 * no working 1RMs and no onboarding estimates. That is what forces getWeekTarget
 * to source:'none' and routes to the percentage-progression tail — the code under
 * test. The calibrated/derived path has its own gate (scripts/c7-smoke.mjs).
 *
 * @returns {{ getRecommendation, EXERCISE_BANK, PROGRESSION_REP_SURPLUS, ctx,
 *             setLast, recommend, sources }}
 */
export function loadProgressionLayer({ goal = 'build_muscle', week = 1 } = {}) {
  const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');
  const programsSrc = readFileSync(path.join(root, 'programs.js'), 'utf8');
  const progressionSrc = slice(html, MARKERS.progression);
  const oneRmSrc = slice(html, MARKERS.oneRm);

  const store = {};
  const ctx = {
    console,
    LS: { get: (k) => store[k], set: (k, v) => { store[k] = v; } },
    currentWeek: week,
    cfg: { weeks: 8, goal, onboardingEstimates: {} },
    localStorage: { getItem: () => null, setItem: () => {} },
  };
  vm.createContext(ctx);
  vm.runInContext(programsSrc, ctx, { filename: 'programs.js' });
  vm.runInContext(progressionSrc, ctx, { filename: 'progression-layer(tandem.html)' });
  vm.runInContext(oneRmSrc, ctx, { filename: '1rm-layer(tandem.html)' });

  const { EXERCISE_BANK } = vm.runInContext('({ EXERCISE_BANK })', ctx);
  const getRecommendation = vm.runInContext('getRecommendation', ctx);
  const PROGRESSION_REP_SURPLUS = vm.runInContext('PROGRESSION_REP_SURPLUS', ctx);

  // Seed the one-entry-per-exercise history mirror getRecommendation reads.
  const setLast = (name, weight, minReps, date = '2026-09-29') => {
    store['tandem_lastsets'] = { [name]: { name, weight, minReps, date } };
  };

  // One call shape for both consumers, so a signature change breaks in one place.
  // inputMode mirrors the renderer's 3-way model (tandem.html buildDayHTML):
  // 'sec' timed hold | 'bw' bodyweight/band | 'reps' loaded. BUG-208: the row's
  // modality is what tells the read path whether a non-positive stored weight is
  // a TRUE zero external load ('bw' → rep coaching) or MISSING DATA on a loaded
  // lift ('reps' → prompt, never a fabricated prescription).
  const recommend = (ex, { goal: g = goal, week: w = week, sex = 'female' } = {}) => {
    ctx.currentWeek = w;
    ctx.cfg.goal = g;
    return getRecommendation(ex.slug, ex.category === 'compound', g, ex.name, sex, ex.repRange ? ex.r : null, inputModeOf(ex));
  };

  return {
    getRecommendation, EXERCISE_BANK, PROGRESSION_REP_SURPLUS, ctx, setLast, recommend,
    sources: { progressionSrc, oneRmSrc, html, programsSrc },
  };
}

/** Bank entries that have no external load to add, by equipment. */
export const LOADLESS_EQUIPMENT = new Set(['bodyweight', 'band']);

/**
 * The renderer's 3-way input model, mirrored (tandem.html buildDayHTML computes
 * the same expression to pick the weight cell and passes it to getRecommendation).
 * Equipment picks the ROW RENDERING here — the progression rule itself stays
 * weight-keyed (D34 clause b): any weight > 0 ladders regardless of this value.
 */
export const inputModeOf = (ex) =>
  ex.unit === 'sec' ? 'sec' : LOADLESS_EQUIPMENT.has(ex.equipment) ? 'bw' : 'reps';

export const bankEntries = (EXERCISE_BANK) =>
  Object.entries(EXERCISE_BANK).map(([slug, e]) => ({ slug, ...e }));

export const loadlessEntries = (EXERCISE_BANK) =>
  bankEntries(EXERCISE_BANK).filter(e => LOADLESS_EQUIPMENT.has(e.equipment));

export const weightedEntries = (EXERCISE_BANK) =>
  bankEntries(EXERCISE_BANK).filter(e => !LOADLESS_EQUIPMENT.has(e.equipment) && e.unit !== 'sec');

// Every way a logged set can fail to be a real load. The app's guard is
// `!(Number(weight) > 0)`, so all of these must route AWAY from a fabricated
// prescription. Where they route depends on the ROW (BUG-208, Kerwin ruling
// 2026-09-29): on a 'bw' row a non-load is a TRUE zero external load → rep
// coaching; on a 'reps' row it is MISSING DATA → prompt for the load. The gate
// feeds the whole set to both row kinds; the smoke sweeps the whole bank.
export const NON_LOAD_INPUTS = [0, -5, -0.5, NaN, null, undefined, ''];

// A label or reason must never show the user a non-load dressed up as a load.
const BAD = /\bnull\b|\bNaN\b|\bundefined\b/;
const FAKE_ZERO = /(^|\s)-?0(\.0+)?\s*lbs?\b/;
const ARROWS = ['up', 'same', 'down', 'new'];

/**
 * D34 clause (a), as a predicate: is this recommendation an honest loadless
 * prescription? Returns [] when it is, or a list of human-readable violations.
 * ONE definition of "load-shaped output", shared by the gate and the smoke.
 */
export function loadlessViolations(rec, where) {
  const out = [];
  if (!rec || typeof rec !== 'object') return [`${where}: no recommendation object returned`];
  if (rec.weight !== null) out.push(`${where}: weight must be null (no load to prescribe), got ${JSON.stringify(rec.weight)}`);
  for (const [field, val] of [['label', rec.label], ['reason', rec.reason]]) {
    const s = String(val ?? '');
    if (BAD.test(s)) out.push(`${where}: ${field} leaks a non-value → "${s}"`);
    if (FAKE_ZERO.test(s)) out.push(`${where}: ${field} fabricates a zero load → "${s}"`);
  }
  // The chip must still coach SOMETHING — a blank is a different bug, not a fix.
  if (!rec.label || !String(rec.label).trim()) out.push(`${where}: empty label`);
  if (!ARROWS.includes(rec.arrow)) out.push(`${where}: bad arrow ${JSON.stringify(rec.arrow)}`);
  return out;
}

/**
 * BUG-208 / D34 caveat-1 resolution, as a predicate: a LOADED lift ('reps' row)
 * whose stored weight is not a real load is MISSING DATA, not a loadless
 * modality. Answering it with rep coaching is itself a fabricated
 * recommendation (advice premised on a load never lifted), and answering it
 * with a number is a fabricated load. The only honest chip is a PROMPT:
 * weight:null, ask for the datum. Kerwin's ruling 2026-09-29: store null, not
 * 0; chip prompts rather than falling back to seed/1RM.
 */
const REP_COACHING_LABELS = /add reps|hold steady|build reps/i;
export function missingLoadViolations(rec, where) {
  const out = [];
  if (!rec || typeof rec !== 'object') return [`${where}: no recommendation object returned`];
  if (rec.weight !== null) out.push(`${where}: weight must be null (load unknown, never fabricated), got ${JSON.stringify(rec.weight)}`);
  for (const [field, val] of [['label', rec.label], ['reason', rec.reason]]) {
    const s = String(val ?? '');
    if (BAD.test(s)) out.push(`${where}: ${field} leaks a non-value → "${s}"`);
    if (FAKE_ZERO.test(s)) out.push(`${where}: ${field} fabricates a zero load → "${s}"`);
    if (REP_COACHING_LABELS.test(s)) out.push(`${where}: ${field} coaches reps on a LOADED lift with a missing weight — that is BUG-208's wrongness, not a fix → "${s}"`);
  }
  if (!rec.label || !String(rec.label).trim()) out.push(`${where}: empty label`);
  if (!ARROWS.includes(rec.arrow)) out.push(`${where}: bad arrow ${JSON.stringify(rec.arrow)}`);
  return out;
}

/**
 * D34 clause (b), as a predicate: a REAL logged load on the same movement must
 * still ladder UP under D24. This is the half that keeps the guard from being
 * over-broad — see BUG-42 (the bodyweight cell is editable on purpose).
 */
export function loadedViolations(rec, logged, where) {
  const out = [];
  if (typeof rec?.weight !== 'number' || !Number.isFinite(rec.weight)) {
    out.push(`${where}: a real logged load must yield a numeric prescription, got ${JSON.stringify(rec?.weight)}`);
  } else if (rec.weight <= logged) {
    out.push(`${where}: reps far over target — load must go UP from ${logged}, got ${rec.weight}`);
  }
  for (const [field, val] of [['label', rec?.label], ['reason', rec?.reason]]) {
    if (BAD.test(String(val ?? ''))) out.push(`${where}: ${field} leaks a non-value → "${val}"`);
  }
  return out;
}
