// D34 / BUG-188 — loadless-progression render contract. THE BREADTH HALF.
//
// WHAT THIS PROVES: getRecommendation() never hands the card a load prescription
// that isn't a real load — across the WHOLE bank. For every movement that has no
// external load to add (equipment bodyweight/band) and whose logged history is
// therefore a 0-lb set, the chip must coach REPS and carry weight:null — never
// "null lbs", never "NaN lbs", never a fabricated "0 lbs".
//
// DIVISION OF LABOUR (set by the 2026-09-29 council that approved the promotion):
//   - scripts/doctrine.mjs D34 block = the LAW. Adversarial non-load inputs
//     beyond 0, the weight-keyed clause, the single-trigger clause.
//   - THIS FILE = the BREADTH. Every loadless bank entry × 5 goals × 3 weeks ×
//     3 rep cases, plus every weighted entry as a negative control.
//   - scripts/lib/progression-layer.mjs = the ONE home for the vm-extraction,
//     the fixture context and the honest-output predicate, so the two callers
//     above cannot fork. Do not re-inline any of it here.
//
// WHY IT EXISTS: the 2026-09-29 hip-thrust-family council mandated a render
// measurement instead of a taxonomy change. That measurement found the defect:
// logSet stores weight 0 when the bodyweight cell is left blank (parseFloat('')||0),
// progressLoad() correctly refuses to ladder a 0 (returns null), and the up/down
// branches then interpolated that null straight into the chip — label "null lbs",
// reason "15 reps — 2 over target, add 4% (0 lbs)". Fixed in cdbcf19, promoted to
// doctrine D34 on 2026-09-29. A fix verified only by a throwaway probe is a fix
// that regresses the next time someone touches the progression tail.
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
//   D24 governs load progression and is SILENT on loadless movements; D34 is the
//   loadless complement, and it reuses D24's PROGRESSION_REP_SURPLUS trigger rather
//   than inventing a threshold.
//
// SCOPE — what this gate deliberately does NOT assert: whether the REP TARGET itself
// should scale with bodyweight. That is BUG-44/EPIC-34, unspecified in every source,
// and inventing a formula for it is exactly the failure mode the prime directive bans.
//
// Run: node scripts/loadless-progression-smoke.mjs   (exit 0 = contract holds)

import {
  loadProgressionLayer, loadlessEntries, weightedEntries,
  loadlessViolations, loadedViolations, missingLoadViolations,
} from './lib/progression-layer.mjs';

let layer;
try {
  layer = loadProgressionLayer();
} catch (err) {
  console.error(`FAIL: ${err.message}`);
  process.exit(1);
}
const { EXERCISE_BANK, setLast, recommend } = layer;

const loadless = loadlessEntries(EXERCISE_BANK);
const weighted = weightedEntries(EXERCISE_BANK);

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
const report = (violations) => { for (const v of violations) { console.log(`FAIL  ${v}`); failures++; } };

// ── 1. Loadless movements with a 0-lb logged set ────────────────────────
let loadlessChecks = 0;
for (const ex of loadless) {
  for (const goal of GOALS) {
    for (const week of WEEKS) {
      for (const minReps of REP_CASES) {
        setLast(ex.name, 0, minReps);
        const rec = recommend(ex, { goal, week });
        loadlessChecks++;
        report(loadlessViolations(rec, `${ex.name} [${ex.equipment}/${ex.category}] ${goal} wk${week} minReps=${minReps}`));
      }
    }
  }
}
console.log(`PASS  ${loadlessChecks} loadless prescriptions (${loadless.length} bank movements × ${GOALS.length} goals × ${WEEKS.length} weeks × ${REP_CASES.length} rep cases) — all weight:null, no "null lbs", no fabricated 0 lbs`);

// ── 2. The negative control: a real load must STILL progress ────────────
// D34 clause (b). This is the half that keeps the fix from being over-broad.
// BUG-42 deliberately left the bodyweight cell editable so weighted pull-ups/dips
// stay loggable; a guard keyed on equipment instead of on the measured weight would
// silently kill load progression for those. So: a logged 100 lb set must produce a
// numeric prescription with a NON-zero delta.
let controlChecks = 0;
for (const ex of weighted) {
  for (const goal of GOALS) {
    setLast(ex.name, 100, 30);
    const rec = recommend(ex, { goal, week: 4, sex: 'male' });
    controlChecks++;
    report(loadedViolations(rec, 100, `${ex.name} [${ex.equipment}] ${goal} logged 100 lb × 30 reps`));
  }
}
console.log(`PASS  ${controlChecks} weighted controls (${weighted.length} movements × ${GOALS.length} goals) — real loads still ladder UP by percentage (guard is weight-keyed, not equipment-keyed)`);

// ── 3. A loadless movement that IS loaded must progress too ─────────────
// The mechanism claim, stated as a test: a weighted pull-up (bodyweight equipment,
// user typed 25 lbs) is NOT a loadless case and must get normal load progression.
{
  const pullup = loadless.find(e => /pull-?up|chin-?up|dip/i.test(e.name));
  if (!pullup) {
    console.log('FAIL  fixture: expected at least one pull-up/chin-up/dip in the loadless set — selector or bank changed');
    failures++;
  } else {
    setLast(pullup.name, 25, 30);
    const rec = recommend(pullup, { goal: 'build_muscle', week: 4, sex: 'male' });
    const v = loadedViolations(rec, 25, `weighted ${pullup.name} (25 lb logged) must still ladder up — the guard is over-broad`);
    report(v);
    if (v.length === 0) {
      console.log(`PASS  weighted ${pullup.name}: 25 lb logged → ${rec.weight} lbs ("${rec.label}") — added load is respected on a bodyweight-equipment movement`);
    }
  }
}

// ── 4. BUG-208: a LOADED lift with a MISSING weight is not a loadless case ──
// "Logged 0 because it's a band pull-apart" and "logged blank on a barbell
// squat" are different events. The first deserves rep coaching (sections 1-3);
// the second is missing data, and the chip must PROMPT for the load — never
// coach reps premised on a load that was never lifted, never fabricate a
// number (Kerwin's Option-1 ruling, 2026-09-29). Both the new null capture and
// the read-path coercion of legacy 0 rows land on the same guard, so both
// stored shapes are swept.
let missingChecks = 0;
for (const ex of weighted) {
  for (const stored of [null, 0]) {
    for (const minReps of [30, 12, 2]) {
      setLast(ex.name, stored, minReps);
      const rec = recommend(ex, { goal: 'build_muscle', week: 4 });
      missingChecks++;
      report(missingLoadViolations(rec, `${ex.name} [${ex.equipment}] stored weight=${JSON.stringify(stored)} minReps=${minReps}`));
    }
  }
}
console.log(`PASS  ${missingChecks} missing-load prompts (${weighted.length} loaded movements × {null, legacy 0} × 3 rep cases) — loaded lift with no recorded load prompts, never rep-coaches or fabricates`);

console.log(failures === 0
  ? `\nLOADLESS PROGRESSION SMOKE: ALL PASS — ${loadlessChecks + controlChecks + missingChecks + 1} assertions, no non-load ever reaches a chip.`
  : `\nLOADLESS PROGRESSION SMOKE: ${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
