#!/usr/bin/env node
/**
 * doctrine.mjs — the DOCTRINE-CONFORMANCE gate.
 *
 * WHY THIS EXISTS (read before editing):
 * The other gates (validate:programs Rules 1-5, persona-matrix R6-R9, the smoke
 * tests) check STRUCTURAL LEGALITY — does the engine crash, is a program legal.
 * They do NOT check DOCTRINE — does the engine obey Tandem's source-of-truth in
 * Notion. That gap is how the app drifted into re-rolling exercises weekly (no
 * cohesion) while passing every gate: nothing ever asserted the doctrine.
 *
 * This gate closes that gap. It encodes Tandem's binding programming law — the
 * Notion collection mirrored in /DOCTRINE.md — as executable assertions, and it
 * runs inside `npm run verify`, so a change that violates doctrine CANNOT ship.
 *
 * Notion is the source of truth. /DOCTRINE.md is its executable mirror. This file
 * enforces it. Keep all three in sync (tandem-tpm reconciles them).
 *
 * INVARIANTS are ACTIVE (hard-fail, blocks the ship) or PENDING (documented here,
 * enforced the moment the phase that makes them true ships). The full law lives
 * here from day one; each phase flips a PENDING to ACTIVE. Never delete a PENDING
 * to make the gate pass — promote it when its phase lands.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);
const code = readFileSync(join(root, 'programs.js'), 'utf8');
const { getProgram, EXERCISE_BANK, getSingleDay, ONEOFF_FOCUSES, deloadWeeks, PHASES: GOAL_PHASES } = vm.runInNewContext(
  `(function(){ ${code}; return { getProgram, EXERCISE_BANK, getSingleDay, ONEOFF_FOCUSES, deloadWeeks, PHASES }; })()`, {});

const TIER_ORDER = ['home', 'hotel_gym', 'full_gym'];
const TIER_BY_NAME = {};
for (const e of Object.values(EXERCISE_BANK)) if (e && e.name) TIER_BY_NAME[e.name.trim().toLowerCase()] = e.tier;

const CANONICAL_GOALS = ['build_muscle', 'fat_burn', 'transform']; // 5-Goal Taxonomy: 3 live (+strength, +maintenance pending)
const DAYS = [2, 3, 4, 5, 6];     // includes 6-day PPL×2 (Phase 4, shipped)
const SEXES = ['male', 'female'];
const PHASES = [0, 1, 2, 3];      // the 4 mesocycle blocks scaledPhases spreads across the program
const gen = (goal, days, sex, week, phase) =>
  getProgram(goal, days, 12, sex, 'full_gym', 'balanced', null, null, { week, phase });
const genT = (goal, days, sex, week, T) =>
  getProgram(goal, days, T, sex, 'full_gym', 'balanced', null, null, { week, phase: Math.floor((week - 1) / 3) });
const totalSets = (p) => (p || []).reduce((n, d) => n + (d.blocks || []).reduce(
  (m, b) => m + (b.exs || []).filter(e => !e.cardioOnly).reduce((k, e) => k + (e.sets || 0), 0), 0), 0);
const dayNames = (day) => (day.blocks || []).flatMap(b => (b.exs || []).map(e => e.name));
const progNames = (p) => (p || []).map(dayNames);
const eqDeep = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const failures = [];
const fail = (id, msg) => failures.push(`${id}: ${msg}`);

// ── D1 (ACTIVE) — Exercise selection is stable WITHIN a mesocycle block ────────
// Periodization Spec Part A + Exercise-variation research: selection is a function
// of the BLOCK (phase), never of the week. Same phase + different week => identical
// program. Different phase => selection is allowed to refresh (variety at boundary).
let d1Checked = 0, d1BoundaryVaried = 0;
for (const goal of CANONICAL_GOALS) for (const days of DAYS) for (const sex of SEXES) {
  for (const phase of PHASES) {
    const wkA = phase * 3 + 1, wkB = phase * 3 + 2; // two different weeks, same block
    const a = progNames(gen(goal, days, sex, wkA, phase));
    const b = progNames(gen(goal, days, sex, wkB, phase));
    d1Checked++;
    if (!eqDeep(a, b)) fail('D1', `${goal}/${days}d/${sex} block ${phase}: exercises changed week-to-week WITHIN the block (must be stable)`);
  }
  // sanity: selection must actually be capable of refreshing at a boundary
  const p0 = progNames(gen(goal, days, sex, 1, 0));
  const p1 = progNames(gen(goal, days, sex, 4, 1));
  if (!eqDeep(p0, p1)) d1BoundaryVaried++;
}

// ── D2 (ACTIVE) — Only canonical goals, each generates a legal program ─────────
// 5-Goal Taxonomy is authoritative. Every live goal must produce a non-empty program.
for (const goal of CANONICAL_GOALS) for (const days of DAYS) for (const sex of SEXES) {
  const p = gen(goal, days, sex, 1, 0);
  if (!Array.isArray(p) || p.length === 0) fail('D2', `${goal}/${days}d/${sex}: produced no program`);
  else if (progNames(p).some(d => d.length === 0)) fail('D2', `${goal}/${days}d/${sex}: a day generated with zero exercises`);
}

// ── D3 (ACTIVE) — Compound-first ordering ──────────────────────────────────────
// Research [8] (ACSM progression models): multi-joint before single-joint. In every
// generated training day the Compound Block must precede the Accessory Block.
for (const goal of CANONICAL_GOALS) for (const days of DAYS) for (const sex of SEXES) {
  const p = gen(goal, days, sex, 1, 0) || [];
  p.forEach((day, di) => {
    const labels = (day.blocks || []).map(b => String(b.label || ''));
    const ci = labels.findIndex(l => /compound/i.test(l));
    const ai = labels.findIndex(l => /accessor/i.test(l));
    if (ci !== -1 && ai !== -1 && ci > ai) fail('D3', `${goal}/${days}d/${sex} day ${di + 1}: Accessory block precedes Compound block`);
  });
}

// ── D9 (ACTIVE) — One-off "Build Me a Workout" conformance ─────────────────────
// The one-off generator is the dynamic engine's proper home. A one-off is a single
// session with NO mesocycle progression, so it is EXEMPT BY DESIGN from D1 (block
// stability), D4 (deloads), and D7 (per-length layout) — variety is a feature here,
// not the "random program" defect. But it must still obey the structural law:
// compound-first, tier-legal, no duplicate lift, non-empty. (Notion: Home-Screen
// Program Builders. Wire the Home-Screen entry point in the app as a follow-on.)
let d9Checked = 0;
if (typeof getSingleDay === 'function' && Array.isArray(ONEOFF_FOCUSES)) {
  for (const focus of ONEOFF_FOCUSES) for (const tier of TIER_ORDER) {
    const day = getSingleDay(focus, { tier });
    d9Checked++;
    if (!day || !Array.isArray(day.blocks) || day.blocks.length === 0) { fail('D9', `one-off ${focus}/${tier}: empty`); continue; }
    const labels = day.blocks.map(b => String(b.label || ''));
    const ci = labels.findIndex(l => /compound/i.test(l));
    const ai = labels.findIndex(l => /accessor/i.test(l));
    if (ci !== -1 && ai !== -1 && ci > ai) fail('D9', `one-off ${focus}/${tier}: accessory precedes compound`);
    const exs = day.blocks.flatMap(b => (b.exs || []).map(e => e.name));
    if (new Set(exs).size !== exs.length) fail('D9', `one-off ${focus}/${tier}: duplicate lift in one session`);
    const reqIdx = TIER_ORDER.indexOf(tier);
    for (const n of exs) {
      const t = TIER_BY_NAME[String(n).trim().toLowerCase()];
      if (t && TIER_ORDER.indexOf(t) > reqIdx) fail('D9', `one-off ${focus}/${tier}: "${n}" exceeds tier (needs ${t})`);
    }
  }
  // supersets are available on the one-off (opt-in) — and never on its compound block
  for (const focus of ['chest', 'legs', 'pull']) {
    const day = getSingleDay(focus, { tier: 'full_gym', supersets: true });
    if (!(day?.blocks || []).some(b => b.superset)) fail('D9', `one-off ${focus} with supersets:true produced no superset block`);
    if ((day?.blocks || []).some(b => /compound/i.test(b.label || '') && b.superset)) fail('D9', `one-off ${focus}: compound block was supersetted`);
  }
} else {
  console.log('  (note: getSingleDay not yet exported — D9 skipped)');
}

// ── D4 (ACTIVE) — Deloads per the Part B length table ──────────────────────────
// Every mesocycle ends in a deload (every 4-6 wk, block-final): reduced volume,
// load held. Assert, for each length 4-12: no training run > 7 wk without a deload;
// each deload week has REDUCED total sets vs a non-deload week and is tagged on
// every day; a non-deload week is never tagged.
let d4Checked = 0;
for (const goal of CANONICAL_GOALS) for (const days of [3, 4, 5]) for (const T of [4, 5, 6, 7, 8, 9, 10, 11, 12]) {
  const dw = [...deloadWeeks(T)].sort((a, b) => a - b);
  if (dw.length === 0) { fail('D4', `${goal}/${days}d ${T}wk: no deload scheduled`); continue; }
  let prev = 0, maxGap = 0;
  for (const w of dw) { maxGap = Math.max(maxGap, w - prev); prev = w; }
  maxGap = Math.max(maxGap, T - prev);
  if (maxGap > 7) fail('D4', `${goal}/${days}d ${T}wk: ${maxGap}-week run with no deload (> 6-wk rule)`);
  const refWk = [1, 2, 3].find(w => !dw.includes(w)) || 1;
  const refSets = totalSets(genT(goal, days, 'male', refWk, T));
  if (genT(goal, days, 'male', refWk, T).some(d => d.deload)) fail('D4', `${goal}/${days}d ${T}wk wk${refWk}: non-deload week wrongly tagged deload`);
  for (const w of dw) {
    const p = genT(goal, days, 'male', w, T);
    d4Checked++;
    if (!p.every(d => d.deload === true)) fail('D4', `${goal}/${days}d ${T}wk wk${w}: deload not tagged on all days`);
    if (totalSets(p) >= refSets) fail('D4', `${goal}/${days}d ${T}wk wk${w}: deload did not reduce volume (${totalSets(p)} vs ${refSets})`);
  }
}

// ── D5 (ACTIVE) — Superset/circuit-driven goals (5-Goal Taxonomy) ───────────────
// Transform = antagonist supersets; Fat Burn = high-rep circuits (short-rest
// supersets). Both must contain superset blocks whose paired exercises carry a
// supersetGroup. (Supersets never touch the primary compound block — the never-on-
// primary rule; Strength's stricter version is future D8.)
let d5Checked = 0;
for (const goal of ['transform', 'fat_burn']) for (const days of [2, 3, 4, 5, 6]) for (const sex of ['male', 'female']) {
  const p = gen(goal, days, sex, 1, 0);
  d5Checked++;
  const ss = (p || []).flatMap(d => (d.blocks || []).filter(b => b.superset || /superset/i.test(b.label || '')));
  if (ss.length === 0) fail('D5', `${goal}/${days}d/${sex}: no supersets (goal is superset/circuit-driven by the 5-Goal Taxonomy)`);
  else if (!ss.some(b => (b.exs || []).some(e => e.supersetGroup))) fail('D5', `${goal}/${days}d/${sex}: superset block has no supersetGroup-tagged exercise`);
  // never-on-primary: the Compound Block must never be a superset
  if ((p || []).some(d => (d.blocks || []).some(b => /compound/i.test(b.label || '') && b.superset))) fail('D5', `${goal}/${days}d/${sex}: a Compound Block was supersetted (primary lifts must never superset)`);
}

// ── D10 (ACTIVE) — Rep schemes honor each goal's taxonomy band ─────────────────
// Science audit 2026-07-22. Fat Burn = high-rep circuits (>=10 reps); Build Muscle =
// hypertrophy 6-15 (NEVER 1-5 max-strength — that is the separate Strength goal, and
// reps 5-30 give equivalent hypertrophy volume-equated to failure); Transform = mixed
// 8-12. This is what the "Peak Strength inside a hypertrophy goal" / "6-rep Fat Burn"
// drift got wrong; the gate now blocks it.
const REP_BANDS = { fat_burn: [10, 20], build_muscle: [6, 15], transform: [8, 12] };
let d10Checked = 0;
for (const [goal, [lo, hi]] of Object.entries(REP_BANDS)) {
  for (const phase of (GOAL_PHASES[goal] || [])) {
    for (const r of String(phase.reps).split('·').map(Number)) {
      d10Checked++;
      if (!(r >= lo && r <= hi)) fail('D10', `${goal} phase "${phase.name}": ${r} reps outside its taxonomy band ${lo}-${hi}`);
    }
  }
}

// ── D6 (ACTIVE, v1) — Weekly volume scales by goal (v0.5 MEV/MRV order) ─────────
// Was: identical volume for every goal (science-audit Finding 3). Sets-per-exercise
// now scale by goal so weekly working volume follows the MEV/MRV ordering: Transform
// (concurrent) ≥ Build Muscle (hypertrophy) ≥ Fat Burn (fat loss). v1 = goal
// differentiation; per-muscle MEV balancing + the within-block MEV→MRV week ramp
// remain flagged (Finding 3 remainder + Finding 4), tied to the per-length meso work.
let d6Checked = 0;
const weeklyVol = (g, days, sex) => (gen(g, days, sex, 1, 0) || []).reduce((n, d) =>
  n + (d.blocks || []).reduce((m, b) => m + (b.exs || []).filter(e => !e.cardioOnly && !e.isCore)
    .reduce((k, e) => k + (e.sets || 0), 0), 0), 0);
for (const days of [3, 4, 5, 6]) for (const sex of ['male', 'female']) {
  const t = weeklyVol('transform', days, sex), b = weeklyVol('build_muscle', days, sex), f = weeklyVol('fat_burn', days, sex);
  d6Checked++;
  if (!(t >= b && b >= f)) fail('D6', `${days}d/${sex}: goal volume not in MEV order (transform ${t} ≥ build_muscle ${b} ≥ fat_burn ${f})`);
  if (f <= 0) fail('D6', `${days}d/${sex}: fat_burn produced zero working volume`);
}

// ── D11 (ACTIVE) — Monotonic progressive overload + earned-only 1RM ─────────────
// "Reps down, weight up." The prescribed %1RM curve (PROGRESSION in tandem.html) must
// rise-or-hold every week and NEVER dip — deloads are volume cuts (D4), not intensity
// dips. And the 1RM that drives the prescription is a MEASUREMENT of real performance,
// never a scheduled ratchet: this gate trips if the old ±2.5%/week fake-gain returns.
// (Source: research-report(8) §3 %1RM bands + progressive-overload principle; the
// sawtooth table + fabricated 1RM ratchet were the "app says stronger while prescribing
// less" defect. tandem.html is the home of both, so we read it directly here.)
let d11Checked = 0;
try {
  const tandemHtml = readFileSync(join(root, 'tandem.html'), 'utf8');
  const m = tandemHtml.match(/const PROGRESSION = (\{[\s\S]*?\n\});/);
  if (!m) fail('D11', 'could not locate the PROGRESSION table in tandem.html');
  else {
    const PROGRESSION = vm.runInNewContext('(' + m[1] + ')', {});
    for (const [goal, row] of Object.entries(PROGRESSION)) {
      const keys = Object.keys(row).map(Number).sort((a, b) => a - b);
      for (let i = 1; i < keys.length; i++) {
        d11Checked++;
        if (row[keys[i]] < row[keys[i - 1]]) {
          fail('D11', `PROGRESSION.${goal}: %1RM dips at week ${keys[i]} (${row[keys[i]]} < ${row[keys[i - 1]]}) — must be monotonic non-decreasing (reps down, weight up)`);
        }
      }
    }
  }
  // Regression tripwire: the fabricated ±2.5%/week ratchet on the working 1RM must stay
  // gone. The old code multiplied the working 1RM base by (dir === 'up' ? 1.025 : 0.975).
  if (/\?\s*1\.025\s*:\s*0\.975/.test(tandemHtml)) {
    fail('D11', 'the scheduled ±2.5%/week 1RM ratchet is back — the working 1RM must be earned (running-max Epley), never a fixed weekly step');
  }
} catch (e) {
  fail('D11', `could not verify monotonic overload: ${e.message}`);
}

// ── D12 (ACTIVE) — Multi-formula 1RM estimation, monotonic in reps ─────────────
// A single linear formula (Epley) is accurate only to ~12 reps; the estimate must
// switch to Mayhew above that, AND the estimate must never decrease for more reps
// at the same weight (a real bug found by running the numbers: raw Mayhew(w,13) <
// Epley(w,12) — doing an extra rep would show a LOWER max, the same "app says
// weaker after more work" defect D11 exists to kill). Source: research-report(9)
// (Valyu Deep Research, 2026-07-23) — the direct answer to the gap D11 flagged
// ("research is silent on high-rep accuracy"). Desgorces (cited as marginally
// better for 16-20 reps) is NOT implemented — the source names it but never gives
// its equation, and per source-first rule we do not invent a logarithmic formula
// to fill that gap. Flagged for a future Ralph pass.
let d12Checked = 0;
try {
  const tandemHtml = readFileSync(join(root, 'tandem.html'), 'utf8');
  const m = tandemHtml.match(/function calcRM\(w, r\) \{[\s\S]*?\n\}/);
  if (!m) fail('D12', 'could not locate calcRM in tandem.html');
  else {
    const calcRM = vm.runInNewContext(`(function(w, r) { ${m[0].replace(/^function calcRM\(w, r\) \{/, '').replace(/\}$/, '')} })`, {});
    // formula selection: Epley at 10 reps, Mayhew above 12
    d12Checked++;
    const epley10 = 100 * (1 + 10 / 30);
    if (Math.abs(calcRM(100, 10) - epley10) > 0.01) fail('D12', `calcRM(100,10) = ${calcRM(100, 10)}, expected Epley ${epley10.toFixed(2)}`);
    d12Checked++;
    const mayhew16 = 100 * 100 / (52.2 + 41.9 * Math.exp(-0.055 * 16));
    if (Math.abs(calcRM(100, 16) - mayhew16) > 0.01) fail('D12', `calcRM(100,16) = ${calcRM(100, 16)}, expected Mayhew ${mayhew16.toFixed(2)}`);
    // monotonicity: more reps at a fixed weight must never estimate a lower 1RM
    for (const w of [95, 135, 185, 225, 315]) {
      let prev = 0;
      for (let r = 1; r <= 25; r++) {
        d12Checked++;
        const v = calcRM(w, r);
        if (v < prev - 1e-9) fail('D12', `calcRM(${w}, ${r}) = ${v.toFixed(2)} is LESS than calcRM(${w}, ${r - 1}) = ${prev.toFixed(2)} — more reps at the same weight must never estimate a lower 1RM`);
        prev = v;
      }
    }
  }
} catch (e) {
  fail('D12', `could not verify multi-formula 1RM: ${e.message}`);
}

// ── D13 (ACTIVE) — Goal-specific deload intensity ──────────────────────────────
// research-report(9) (Valyu, 2026-07-23): Strength & Fat-Loss deloads MAINTAIN
// intensity (volume-cut only); Hypertrophy deloads ALSO drop %1RM to 60-70% so
// reps can climb at a lighter load. Kerwin's explicit call (2026-07-23): fine with
// a lower prescribed weight on deload IF the measured 1RM still only trends up —
// already guaranteed elsewhere (D11's reconcileWorking1RMs never lowers the stored
// 1RM). This gate verifies TWO things on every REAL deload week (deloadWeeks(),
// the same list applyDeload/D4 uses): a goal WITH an override actually hits that
// exact intensity; a goal WITHOUT one never dips (maintains D11's monotonic climb
// straight through the deload week) — so the hypertrophy-specific exception can
// never silently leak into Transform or Fat-Loss.
let d13Checked = 0;
try {
  const tandemHtml = readFileSync(join(root, 'tandem.html'), 'utf8');
  const progMatch = tandemHtml.match(/const PROGRESSION = (\{[\s\S]*?\n\});/);
  const overrideMatch = tandemHtml.match(/const DELOAD_INTENSITY_OVERRIDE = (\{[^}]*\});/);
  const wfMatch = tandemHtml.match(/function weekFactor\(goal, week, totalWeeks\) \{[\s\S]*?\n\}/);
  if (!progMatch || !overrideMatch || !wfMatch) {
    fail('D13', 'could not locate PROGRESSION / DELOAD_INTENSITY_OVERRIDE / weekFactor in tandem.html');
  } else {
    // IIFE-return pattern (matches D11/D12 above): const/function bindings declared
    // via vm.runInContext do NOT attach as properties of the sandbox object, so pull
    // them out via an explicit return instead of reading wfCtx.<name> directly.
    const bundle = `(function(){
      const PROGRESSION = ${progMatch[1]};
      const DELOAD_INTENSITY_OVERRIDE = ${overrideMatch[1]};
      ${wfMatch[0]}
      return { weekFactor, PROGRESSION, DELOAD_INTENSITY_OVERRIDE };
    })()`;
    const { weekFactor, PROGRESSION, DELOAD_INTENSITY_OVERRIDE } = vm.runInNewContext(bundle, { deloadWeeks });
    for (const goal of Object.keys(PROGRESSION)) {
      for (const T of [4, 5, 6, 7, 8, 9, 10, 11, 12]) {
        for (const w of deloadWeeks(T)) {
          d13Checked++;
          const prevW = w - 1;
          if (prevW < 2) continue;
          const before = weekFactor(goal, prevW, T);
          const at = weekFactor(goal, w, T);
          const overrideVal = DELOAD_INTENSITY_OVERRIDE[goal];
          if (overrideVal != null) {
            if (Math.abs(at - overrideVal) > 1e-9) fail('D13', `${goal} ${T}wk wk${w}: deload override not applied (got ${at}, expected ${overrideVal})`);
          } else if (at < before - 1e-9) {
            fail('D13', `${goal} ${T}wk wk${w}: intensity dipped on a deload week with no D13 override (${at} < ${before}) — goals without an override must maintain intensity through deload (research-report(9))`);
          }
        }
      }
    }
    for (const [goal, v] of Object.entries(DELOAD_INTENSITY_OVERRIDE)) {
      d13Checked++;
      if (v < 0.60 || v > 0.70) fail('D13', `DELOAD_INTENSITY_OVERRIDE.${goal} = ${v} outside the research-cited 60-70% hypertrophy-deload band`);
    }
  }
} catch (e) {
  fail('D13', `could not verify goal-specific deload intensity: ${e.message}`);
}

// ── PENDING invariants — the rest of the law, enforced as each phase ships ─────
// Promote to ACTIVE (write the assertion above) when the phase lands. Do NOT delete.
const PENDING = [
  ['D6b', 'Per-muscle weekly volume within goal MEV..MRV band + within-block MEV→MRV ramp (Finding 3 remainder + 4)', 'per-length meso'],
  ['D7', 'Per-length mesocycle layout (4-12 wk) matches the spec Part B table exactly', 'Phase 5'],
  ['D8', 'Strength goal uses ZERO supersets on primary lifts; Maintenance caps at MAV volume', 'when goals added'],
];

// ── Report ─────────────────────────────────────────────────────────────────────
console.log(`DOCTRINE CONFORMANCE — Notion law is enforced here (mirror: /DOCTRINE.md)\n`);
console.log(`Active checks:`);
console.log(`  D1  exercise stability within a block   — ${d1Checked} combos checked, ${d1BoundaryVaried} refresh at boundary`);
console.log(`  D2  canonical goals generate legal programs`);
console.log(`  D3  compound-first ordering`);
console.log(`  D4  deloads per Part B length table — ${d4Checked} deload weeks checked (reduced volume, tagged, block-final)`);
console.log(`  D5  superset/circuit goals (Transform + Fat Burn), never on primary — ${d5Checked} programs checked`);
console.log(`  D9  one-off "Build Me a Workout" conformance — ${d9Checked} focus×tier sessions (exempt from D1/D4/D7 by design)`);
console.log(`  D6  weekly volume scales by goal in MEV order (T≥BM≥FB) — ${d6Checked} split×sex checked`);
console.log(`  D10 rep schemes within each goal's taxonomy band — ${d10Checked} phase-week reps checked`);
console.log(`  D11 monotonic %1RM overload + earned-only 1RM (no fake ratchet) — ${d11Checked} week-steps checked`);
console.log(`  D12 multi-formula 1RM (Epley/Mayhew), monotonic in reps — ${d12Checked} checks`);
console.log(`  D13 goal-specific deload intensity (Hypertrophy dips, others maintain) — ${d13Checked} deload-weeks checked`);
console.log(`\nPending (documented law, enforced when its phase ships):`);
for (const [id, desc, phase] of PENDING) console.log(`  ⏳ ${id}  ${desc}  [${phase}]`);

if (failures.length) {
  console.log(`\n${failures.length} DOCTRINE VIOLATION(S) — a change drifted from Notion law:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  console.log(`\nFix the code to conform, or if the DOCTRINE itself changed, update Notion +`);
  console.log(`/DOCTRINE.md + this gate together (never weaken the gate to pass).`);
  process.exit(1);
}
console.log(`\nAll active doctrine invariants hold. ✓`);
process.exit(0);
