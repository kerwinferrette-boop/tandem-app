// BUG-257 — the day-1RM accumulator must be ORDER-INDEPENDENT.
//
// THE DEFECT THIS GATE EXISTS FOR. ACCESSORY_FACTORS derives an accessory's prescribed
// load as `compound1RMs[acc.from] * acc.factor`, where `acc.from` is a CANONICAL MOVEMENT
// PATTERN key of COMPOUND_PATTERNS. buildDayHTML fills that map by walking the day's
// exercises: a per-NAME write, then a per-CANONICAL-KEY write guarded by Math.max. When a
// bank name EXACTLY EQUALS a canonical key, both writes hit the SAME slot — and while the
// per-name write was a bare `= _rm` it DISCARDED the cross-variant maximum the canonical
// loop had already accumulated. Measured on the shipped tables before the fix:
//   Hip Abduction Machine  70 lb vs 120 lb   (0.40 x canonical 'Hip Thrust')
//   Leg Curl               85 lb vs 125 lb   (0.45 x canonical 'Romanian Deadlift')
// Same user, same day, same two lifts — only the processing order differed.
//
// WHY THE FIX IS NOT A NEW SCIENCE CLAIM, which matters because this is the biometric/1RM
// layer: tandem.html has TWO builders of this same map. The other one (the `compound1RMs`
// loop in the week-target/reason path) registers canonical keys ONLY, via Math.max, and was
// therefore already order-independent. The two disagreed; the fix moves the broken one onto
// the behaviour of the one that was already right. [O6] asserts they agree, so that
// agreement is now mechanical rather than a claim in a commit message.
//
// WHAT THIS GATE DELIBERATELY DOES NOT ASSERT. Whether a cross-variant MAXIMUM is the
// correct input at all is an UNCITED GAP, flagged twice: in tandem.html's own
// ACCESSORY_FACTORS header (2026-07-23 — a dedicated research pass found "NO authoritative
// source for accessory-to-compound starting-load ratios at all ... a coaching heuristic,
// not a studied metric"), and again by live search on 2026-11-10 (no validated %-of-parent
// figure; and the bilateral-deficit literature says a unilateral variant's absolute load is
// NOT comparable to a bilateral one at the same relative intensity, which the 'Romanian
// Deadlift' pool mixes together). This gate asserts only that the answer cannot depend on
// ARRAY ORDER, which is true under every candidate semantics. Changing WHICH variant feeds
// the derivation is Kerwin's call under the loop-config safety fence, not a gate's.
//
// Run: node scripts/accessory-derivation-order-smoke.mjs   (exit 0 = pass)

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');
const programsSrc = readFileSync(path.join(root, 'programs.js'), 'utf8');

let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}  →  ${JSON.stringify(actual)}` +
              `${ok ? '' : `  (expected ${JSON.stringify(expected)})`}`);
  if (!ok) failures++;
}
function bail(msg) { console.error(`FAIL: ${msg}`); process.exit(1); }

// ── extract the formula layer + engine (live source, no copy-paste drift) ──
const fStart = html.indexOf('const PROGRESSION = {');
const fEnd = html.indexOf('// ── END OF THE FORMULA LAYER');
if (fStart === -1 || fEnd === -1 || fEnd <= fStart) bail('could not locate the formula layer');

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(html.slice(fStart, fEnd), ctx, { filename: 'formula-layer(tandem.html)' });
vm.runInContext(programsSrc, ctx, { filename: 'programs.js' });

// ── slice BOTH builders of the day-1RM map out of the shipped file ──
// Testing a retyped replica of a loop is how a gate ends up asserting something the app
// does not do; scripts/c7-smoke.mjs's header still claims it "replicates buildDayHTML's
// dayCompound1RMs registration verbatim" and no such replica is in it any more.
const bStart = html.indexOf('  const dayCompound1RMs = {};');
const bEnd = html.indexOf('  let html = `', bStart);
if (bStart === -1 || bEnd === -1 || bEnd <= bStart) bail('could not locate the buildDayHTML accumulator');
const dayBuilderSrc = html.slice(bStart, bEnd);

const aStart = html.indexOf('  const compound1RMs = {};');
const aEnd = html.indexOf('  const tgt = getWeekTarget(', aStart);
if (aStart === -1 || aEnd === -1 || aEnd <= aStart) bail('could not locate the week-target compound1RMs builder');
const refBuilderSrc = html.slice(aStart, aEnd);

vm.runInContext(`
  var LS = { get: () => ({}) };
  var cfg = { onboardingEstimates: {} };
  function prescriptionOneRM(name, workingRm, prRm) { return workingRm ?? prRm ?? undefined; }
  // buildDayHTML's accumulator, verbatim from tandem.html
  function buildDayMap(day, _dayPrs, _dayWorking) {
${dayBuilderSrc}
    return dayCompound1RMs;
  }
  // the OTHER builder, verbatim from tandem.html — canonical keys only
  function buildRefMap(prs, working) {
${refBuilderSrc}
    return compound1RMs;
  }
`, ctx, { filename: 'accumulators(tandem.html)' });

const { buildDayMap, buildRefMap, COMPOUND_PATTERNS, ACCESSORY_FACTORS, EXERCISE_BANK, roundTo5 } =
  vm.runInContext('({ buildDayMap, buildRefMap, COMPOUND_PATTERNS, ACCESSORY_FACTORS, EXERCISE_BANK, roundTo5 })', ctx);

if (typeof buildDayMap !== 'function' || typeof buildRefMap !== 'function') bail('builders did not extract');
if (!COMPOUND_PATTERNS || !ACCESSORY_FACTORS || !EXERCISE_BANK) bail('shipped tables did not extract');

const bankNames = Object.values(EXERCISE_BANK).map(e => e.name);
const canonKeys = Object.keys(COMPOUND_PATTERNS);
const dayOf = names => ({ blocks: [{ exs: names.map(n => ({ name: n })) }] });

// deterministic shuffles — a fixed seed, so a failure is reproducible
function* orderings(names) {
  yield names.slice();
  yield names.slice().reverse();
  let seed = 257;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let k = 0; k < 12; k++) {
    const a = names.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    yield a;
  }
}
// distinct, reproducible 1RMs — spread so a lost maximum cannot coincide with the right answer
const rmFor = (n, i) => 95 + ((i * 37) % 23) * 10;

console.log('\n── [O1] the per-name write is max-guarded in the shipped source ──');
check('buildDayHTML has no bare `dayCompound1RMs[e.name] = _rm`',
  /dayCompound1RMs\[e\.name\]\s*=\s*_rm\s*;/.test(dayBuilderSrc), false);
check('buildDayHTML writes the per-name slot through Math.max',
  /dayCompound1RMs\[e\.name\]\s*=\s*Math\.max\(/.test(dayBuilderSrc), true);

console.log('\n── [O2] every canonical family: the canonical 1RM is order-independent ──');
for (const canon of canonKeys) {
  const rx = COMPOUND_PATTERNS[canon];
  const variants = bankNames.filter(n => rx.test(n));
  if (!variants.length) { check(`${canon}: has bank variants`, false, true); continue; }
  const prs = {};
  variants.forEach((n, i) => { prs[n] = rmFor(n, i); });
  const seen = new Set();
  for (const order of orderings(variants)) seen.add(buildDayMap(dayOf(order), prs, {})[canon]);
  const expected = Math.max(...variants.map((n, i) => rmFor(n, i)));
  check(`${canon} (${variants.length} variants): one value across 14 orderings, == family max`,
    [seen.size, [...seen][0]], [1, expected]);
}

console.log('\n── [O3] the DERIVED ACCESSORY LOAD is order-independent (what the user sees) ──');
for (const [accName, acc] of Object.entries(ACCESSORY_FACTORS)) {
  const rx = COMPOUND_PATTERNS[acc.from];
  if (!rx) { check(`${accName}: its from-key '${acc.from}' is a canonical key`, false, true); continue; }
  const variants = bankNames.filter(n => rx.test(n));
  const prs = {};
  variants.forEach((n, i) => { prs[n] = rmFor(n, i); });
  const loads = new Set();
  for (const order of orderings(variants)) {
    const m = buildDayMap(dayOf(order), prs, {});
    loads.add(m[acc.from] ? roundTo5(m[acc.from] * acc.factor) : null);
  }
  check(`${accName} (${Math.round(acc.factor * 100)}% of ${acc.from}): one prescribed load across 14 orderings`,
    [loads.size, [...loads][0]], [1, roundTo5(Math.max(...variants.map((n, i) => rmFor(n, i))) * acc.factor)]);
}

console.log('\n── [O4] the collision set is PINNED — a new colliding bank name must be deliberate ──');
// Not a blanket ban: a name may legitimately equal a canonical key (both of these do).
// The point is that adding a THIRD one is a decision someone makes on purpose, with this
// gate's output in front of them, rather than a silent new entry on the broken path.
const collisions = bankNames.filter(n => canonKeys.includes(n)).sort();
check('bank names that equal a COMPOUND_PATTERNS canonical key', collisions,
  ['Hip Thrust', 'Romanian Deadlift']);
check('every ACCESSORY_FACTORS from-value is a canonical key (so the per-name slot is only read on a collision)',
  Object.values(ACCESSORY_FACTORS).every(a => a.from in COMPOUND_PATTERNS), true);

console.log('\n── [O5] behaviour preserved for the non-colliding names ──');
// Math.max(0, rm) === rm, so for a name that cannot collide the guard is a no-op. Asserted
// over the WHOLE bank rather than argued: each name alone must still register its own 1RM.
let drifted = [];
bankNames.forEach((n, i) => {
  const rm = rmFor(n, i);
  const m = buildDayMap(dayOf([n]), { [n]: rm }, {});
  if (m[n] !== rm) drifted.push(n);
});
check(`all ${bankNames.length} bank names still register their own 1RM when alone`, drifted, []);

console.log('\n── [O6] ONE RULE, ONE HOME: the two builders of this map agree ──');
for (const canon of canonKeys) {
  const variants = bankNames.filter(n => COMPOUND_PATTERNS[canon].test(n));
  const prs = {};
  variants.forEach((n, i) => { prs[n] = rmFor(n, i); });
  const dayVal = buildDayMap(dayOf(variants), prs, {})[canon];
  const refVal = buildRefMap(prs, {})[canon];
  check(`${canon}: buildDayHTML == week-target builder`, dayVal, refVal);
}

console.log('\n── [O7] fail-closed canary ──');
// If the slice silently stops containing the loop, every assertion above would pass
// vacuously on an empty map. Assert the extracted text really is the accumulator.
check('day-builder slice contains the canonical Math.max loop',
  /for \(const \[canon, rx\] of Object\.entries\(COMPOUND_PATTERNS\)\)/.test(dayBuilderSrc), true);
check('day-builder slice is substantial (not an empty match)', dayBuilderSrc.split('\n').length > 10, true);
check('ref-builder slice contains its canonical Math.max write',
  /compound1RMs\[canon\] = Math\.max\(/.test(refBuilderSrc), true);

console.log(failures === 0
  ? '\nBUG-257 order-independence: ALL ASSERTIONS PASS'
  : `\nBUG-257 order-independence: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
