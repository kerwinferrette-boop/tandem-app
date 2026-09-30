// BUG-188 — loadless-progression render contract.
//
// WHAT THIS PROVES: getRecommendation() never hands the card a load prescription
// that isn't a real load. Concretely, for every bank movement that has no external
// load to add (equipment bodyweight/band) and whose logged history is therefore a
// 0-lb set, the chip must coach REPS and carry weight:null — never "null lbs",
// never "NaN lbs", never a fabricated "0 lbs".
//
// WHY IT EXISTS: the 2026-09-29 hip-thrust-family council mandated a render
// measurement instead of a taxonomy change. That measurement found the defect:
// logSet stores weight 0 when the bodyweight cell is left blank (parseFloat('')||0),
// progressLoad() correctly refuses to ladder a 0 (returns null), and the up/down
// branches then interpolated that null straight into the chip — label "null lbs",
// reason "15 reps — 2 over target, add 4% (0 lbs)". Fixed in cdbcf19. This is the
// gate, because a fix verified only by a throwaway probe is a fix that regresses
// the next time someone touches the progression tail.
//
// THE SCIENCE (the SHOULD this gate encodes):
//   No external load ⇒ no load progression; progress by REPS instead. Primary
//   source: Plotkin et al., "Progressive overload without progressing load? The
//   effects of load or repetition progression on muscular adaptations", PeerJ 2022
//   (PMID 36199287, doi 10.7717/peerj.14142) — 8 weeks, resistance-trained, LOAD
//   arm vs REPS arm: "Both progressions of repetitions and load appear to be viable
//   strategies for enhancing muscular adaptations over an 8-week training cycle."
//   Also Kerwin, 2026-07-13 (BUG-42), on weighted vs unweighted core: "For weighted
//   ones ... those can have the progressive weight overload. Otherwise, no need."
//   D24 governs load progression and is SILENT on loadless movements; this is the
//   loadless complement, and it reuses D24's PROGRESSION_REP_SURPLUS trigger rather
//   than inventing a threshold.
//
// SCOPE — what this gate deliberately does NOT assert: whether the REP TARGET itself
// should scale with bodyweight. That is BUG-44/EPIC-34, unspecified in every source,
// and inventing a formula for it is exactly the failure mode the prime directive bans.
//
// Run: node scripts/loadless-progression-smoke.mjs   (exit 0 = contract holds)

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');
const programsSrc = readFileSync(path.join(root, 'programs.js'), 'utf8');

// ── Extract the LIVE progression layer, no copy-paste drift ──────────────
// Two slices, both anchored on stable top-level declarations:
//   A) the PROGRESSIVE OVERLOAD ENGINE banner → end of getRecommendation (the
//      subject under test plus phaseWeekRep/effectiveReps/getPhase/PROGRESSION/
//      progressLoad/canonicalGoal/getWeekTarget).
//   B) earnedOneRM → end of prescriptionOneRM (the 1RM resolution order
//      getRecommendation calls out to; it lives further down the file).
function slice(startMarker, endMarker, label) {
  const a = html.indexOf(startMarker);
  const b = html.indexOf(endMarker, a);
  if (a === -1 || b === -1 || b <= a) {
    console.error(`FAIL: could not locate ${label} in tandem.html`);
    console.error(`  (markers moved? start=${a} end=${b}) — fix the marker, do not weaken the gate.`);
    process.exit(1);
  }
  return html.slice(a, b);
}
const progressionSrc = slice('\n// PROGRESSIVE OVERLOAD ENGINE', '\n// ═══════════════════════════════════════════════════════\n// EQUIPMENT SELECTOR', 'progression layer');
const oneRmSrc = slice('\nfunction earnedOneRM(', '\n// D21 — the one-off tiered-set ladder', '1RM resolution layer');

// Fixture state, NOT a re-implementation: an account with no PRs, no working 1RMs
// and no onboarding estimates. That is what forces getWeekTarget to source:'none'
// and routes to the percentage-progression tail, which is the code under test. The
// calibrated/derived path has its own gate (scripts/c7-smoke.mjs).
const store = {};
const ctx = {
  console,
  LS: { get: (k) => store[k], set: (k, v) => { store[k] = v; } },
  currentWeek: 1,
  cfg: { weeks: 8, goal: 'build_muscle', onboardingEstimates: {} },
  localStorage: { getItem: () => null, setItem: () => {} },
};
vm.createContext(ctx);
vm.runInContext(programsSrc, ctx, { filename: 'programs.js' });
vm.runInContext(progressionSrc, ctx, { filename: 'progression-layer(tandem.html)' });
vm.runInContext(oneRmSrc, ctx, { filename: '1rm-layer(tandem.html)' });

const { EXERCISE_BANK } = vm.runInContext('({ EXERCISE_BANK })', ctx);
const getRecommendation = vm.runInContext('getRecommendation', ctx);

// ── The movements with no external load to add ──────────────────────────
// Keyed on EQUIPMENT (which movements are loadless by nature) purely to pick the
// FIXTURES. The fix itself is keyed on the measured logged weight, which is why the
// weighted control below must still progress — see COULD in the commit body.
const loadless = Object.entries(EXERCISE_BANK)
  .filter(([, e]) => e.equipment === 'bodyweight' || e.equipment === 'band')
  .map(([slug, e]) => ({ slug, ...e }));
const weighted = Object.entries(EXERCISE_BANK)
  .filter(([, e]) => e.equipment !== 'bodyweight' && e.equipment !== 'band' && e.unit !== 'sec')
  .map(([slug, e]) => ({ slug, ...e }));

if (loadless.length === 0 || weighted.length === 0) {
  console.error(`FAIL: fixture selection collapsed (loadless=${loadless.length}, weighted=${weighted.length}).`);
  console.error('  EXERCISE_BANK shape changed — fix the selector, do not weaken the gate.');
  process.exit(1);
}

const GOALS = ['fat_burn', 'build_muscle', 'transform', 'strength', 'maintenance'];
const WEEKS = [1, 4, 8];
// Straddle all three branches of the progression tail: well over the top of the
// range, inside it, and well under.
const REP_CASES = [30, 12, 2];

let failures = 0;
const fail = (msg) => { console.log(`FAIL  ${msg}`); failures++; };

// A label or reason must never show the user a non-load dressed up as a load.
const BAD = /\bnull\b|\bNaN\b|\bundefined\b/;
const FAKE_ZERO = /(^|\s)-?0(\.0+)?\s*lbs?\b/;

function logEntry(name, weight, minReps) {
  store['tandem_lastsets'] = { [name]: { name, weight, minReps, date: '2026-09-29' } };
}

// ── 1. Loadless movements with a 0-lb logged set ────────────────────────
let loadlessChecks = 0;
for (const ex of loadless) {
  for (const goal of GOALS) {
    for (const week of WEEKS) {
      for (const minReps of REP_CASES) {
        ctx.currentWeek = week;
        ctx.cfg.goal = goal;
        logEntry(ex.name, 0, minReps);
        const rec = getRecommendation(ex.slug, ex.category === 'compound', goal, ex.name, 'female', ex.repRange ? ex.r : null);
        const where = `${ex.name} [${ex.equipment}/${ex.category}] ${goal} wk${week} minReps=${minReps}`;
        loadlessChecks++;

        if (rec.weight !== null) fail(`${where}: weight must be null (no load to prescribe), got ${JSON.stringify(rec.weight)}`);
        if (BAD.test(rec.label)) fail(`${where}: label leaks a non-value → "${rec.label}"`);
        if (FAKE_ZERO.test(rec.label)) fail(`${where}: label fabricates a zero load → "${rec.label}"`);
        if (BAD.test(rec.reason)) fail(`${where}: reason leaks a non-value → "${rec.reason}"`);
        if (FAKE_ZERO.test(rec.reason)) fail(`${where}: reason fabricates a zero load → "${rec.reason}"`);
        // The chip must still coach SOMETHING — a blank is a different bug, not a fix.
        if (!rec.label || !rec.label.trim()) fail(`${where}: empty label`);
        if (!['up', 'same', 'down', 'new'].includes(rec.arrow)) fail(`${where}: bad arrow ${JSON.stringify(rec.arrow)}`);
      }
    }
  }
}
console.log(`PASS  ${loadlessChecks} loadless prescriptions (${loadless.length} bank movements × ${GOALS.length} goals × ${WEEKS.length} weeks × ${REP_CASES.length} rep cases) — all weight:null, no "null lbs", no fabricated 0 lbs`);

// ── 2. The negative control: a real load must STILL progress ────────────
// This is the half that keeps the fix from being over-broad. BUG-42 deliberately
// left the bodyweight cell editable so weighted pull-ups/dips stay loggable; a
// guard keyed on equipment instead of on the measured weight would silently kill
// load progression for those. So: a logged 100 lb set must produce a numeric
// prescription with a NON-zero delta.
let controlChecks = 0;
for (const ex of weighted) {
  for (const goal of GOALS) {
    ctx.currentWeek = 4;
    ctx.cfg.goal = goal;
    logEntry(ex.name, 100, 30);
    const rec = getRecommendation(ex.slug, ex.category === 'compound', goal, ex.name, 'male', ex.repRange ? ex.r : null);
    const where = `${ex.name} [${ex.equipment}] ${goal} logged 100 lb × 30 reps`;
    controlChecks++;
    if (typeof rec.weight !== 'number' || !Number.isFinite(rec.weight)) {
      fail(`${where}: a real logged load must yield a numeric prescription, got ${JSON.stringify(rec.weight)}`);
    } else if (rec.weight <= 100) {
      fail(`${where}: 30 reps is far over target — load must go UP, got ${rec.weight}`);
    }
    if (BAD.test(rec.label) || BAD.test(rec.reason)) fail(`${where}: leaks a non-value → "${rec.label}" / "${rec.reason}"`);
  }
}
console.log(`PASS  ${controlChecks} weighted controls (${weighted.length} movements × ${GOALS.length} goals) — real loads still ladder UP by percentage (guard is weight-keyed, not equipment-keyed)`);

// ── 3. A loadless movement that IS loaded must progress too ─────────────
// The mechanism claim, stated as a test: a weighted pull-up (bodyweight equipment,
// user typed 25 lbs) is NOT a loadless case and must get normal load progression.
{
  const pullup = loadless.find(e => /pull-?up|chin-?up|dip/i.test(e.name));
  if (!pullup) {
    fail('fixture: expected at least one pull-up/chin-up/dip in the loadless set — selector or bank changed');
  } else {
    ctx.currentWeek = 4;
    ctx.cfg.goal = 'build_muscle';
    logEntry(pullup.name, 25, 30);
    const rec = getRecommendation(pullup.slug, pullup.category === 'compound', 'build_muscle', pullup.name, 'male', pullup.repRange ? pullup.r : null);
    if (typeof rec.weight !== 'number' || rec.weight <= 25) {
      fail(`weighted ${pullup.name} (25 lb logged) must still ladder up, got ${JSON.stringify(rec.weight)} — the guard is over-broad`);
    } else {
      console.log(`PASS  weighted ${pullup.name}: 25 lb logged → ${rec.weight} lbs ("${rec.label}") — added load is respected on a bodyweight-equipment movement`);
    }
  }
}

console.log(failures === 0
  ? `\nLOADLESS PROGRESSION SMOKE: ALL PASS — ${loadlessChecks + controlChecks + 1} assertions, no non-load ever reaches a chip.`
  : `\nLOADLESS PROGRESSION SMOKE: ${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
