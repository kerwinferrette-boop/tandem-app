#!/usr/bin/env node
/**
 * cadence-collapse-smoke.mjs — BUG-162 guard: two goals whose RECOVERY_PARAMS differ must not
 * silently produce the same weekly schedule.
 *
 * Found 2026-11-21: computeWeekCadence reads sameGroupHours as Math.ceil(hours/24) day slots,
 * so transform's 36h lands on 2 slots, the same as build_muscle's and strength's 48h. With the
 * same maxConsecutive (2), transform schedules exactly like them for every day count, though
 * the table reads as if it were a distinct "intermediate" cadence. The values are a tuning call
 * for Kerwin and are NOT changed here; this guard makes the collapse visible and stops new ones.
 *
 * Runs the REAL RECOVERY_PARAMS, muscleGroupFromLabel, canPlaceDay and computeWeekCadence from
 * the WORKING-TREE tandem.html in node:vm (no copy of the rounding lives here).
 *   K1  a goal's schedule signature = computeWeekCadence over day counts 2-6 x four label
 *       patterns (alternating upper/lower, all-lower, push/pull/legs, full body)
 *   K2  any two goals with DIFFERENT {sameGroupHours, maxConsecutive} must have different
 *       signatures, unless the pair is in KNOWN_COLLAPSE with its exact values; a known pair
 *       whose values change is no longer covered and fails, so a retune is always re-reviewed
 *   K3  KNOWN_COLLAPSE cannot go stale: each listed pair must still have those exact values and
 *       still collapse; when it stops, remove it in the commit that changed it
 *   K4  anti-vacuity: the signature separates a 1-slot gap from a 2-slot gap, and a cap of 2
 *       from a cap of 3, and the detector fires on a planted table whose new 12h goal rounds
 *       onto fat_burn's 24h
 *   K5  the table's own comment names the transform collapse (so the code says what it does)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(process.env.CADENCE_COLLAPSE_HTML || join(root, 'tandem.html'), 'utf8');   // working tree, on purpose
const grab = (name, re) => { const m = html.match(re); if (!m) throw new Error(`could not locate ${name} in tandem.html`); return m[0]; };
const recov = grab('RECOVERY_PARAMS', /const RECOVERY_PARAMS = \{[\s\S]*?\};/);
const mgfl = grab('muscleGroupFromLabel', /function muscleGroupFromLabel\(label\) \{[\s\S]*?\n\}/);
const cpd = grab('canPlaceDay', /function canPlaceDay\([\s\S]*?\n\}/);
const cwc = grab('computeWeekCadence', /function computeWeekCadence\([\s\S]*?\n\}/);

// Build an engine over a given table source (the real one, or a planted one for K4).
function engine(tableSrc) {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(`${tableSrc}\n${mgfl}\n${cpd}\n${cwc}\nthis.cwc = computeWeekCadence; this.RP = RECOVERY_PARAMS;`, ctx);
  return { cwc: ctx.cwc, RP: JSON.parse(JSON.stringify(ctx.RP)) };
}
const PATTERNS = {
  alt: (n) => Array.from({ length: n }, (_, i) => (i % 2 ? 'Lower' : 'Upper')),
  lower: (n) => Array.from({ length: n }, () => 'Lower'),
  ppl: (n) => Array.from({ length: n }, (_, i) => ['Push', 'Pull', 'Legs'][i % 3]),
  full: (n) => Array.from({ length: n }, () => 'Full Body'),
};
const signature = (cwc, goal) => JSON.stringify(Object.entries(PATTERNS).map(([p, f]) =>
  [2, 3, 4, 5, 6].map(n => cwc(n, goal, f(n).map((label, i) => ({ key: `day${i + 1}`, label }))).join(','))));
const vals = (v) => `${v.sameGroupHours}/${v.maxConsecutive}`;
function collapses({ cwc, RP }) {
  const goals = Object.keys(RP), out = [];
  for (let i = 0; i < goals.length; i++) for (let j = i + 1; j < goals.length; j++) {
    const [a, b] = [goals[i], goals[j]];
    if (vals(RP[a]) !== vals(RP[b]) && signature(cwc, a) === signature(cwc, b)) out.push({ a, b, av: vals(RP[a]), bv: vals(RP[b]) });
  }
  return out;
}

// Known, exact values. Remove an entry in the commit that retunes it.
const KNOWN_COLLAPSE = [
  { a: 'build_muscle', av: '48/2', b: 'transform', bv: '36/2' },
  { a: 'transform', av: '36/2', b: 'strength', bv: '48/2' },
];
const key = (c) => [`${c.a}@${c.av}`, `${c.b}@${c.bv}`].sort().join(' = ');
const known = new Set(KNOWN_COLLAPSE.map(key));

const fails = [];
const real = engine(recov);
const found = collapses(real);
const foundKeys = new Set(found.map(key));
// K2
for (const c of found) if (!known.has(key(c)))
  fails.push(`K2 ${c.a} (${c.av}) and ${c.b} (${c.bv}) have different recovery values but schedule identically for every day count — the difference reaches no user (BUG-162)`);
// K3
for (const c of KNOWN_COLLAPSE) if (!foundKeys.has(key(c)))
  fails.push(`K3 known collapse ${key(c)} no longer holds (values changed or schedules now differ): remove it from KNOWN_COLLAPSE`);
// K4
const synth = (gap, cap) => engine(`const RECOVERY_PARAMS = { a: { sameGroupHours: 24, maxConsecutive: 3 }, b: { sameGroupHours: ${gap}, maxConsecutive: ${cap} } };`);
{ const e = synth(48, 3); if (signature(e.cwc, 'a') === signature(e.cwc, 'b')) fails.push('K4 the signature does not separate a 1-slot gap from a 2-slot gap: K2 would be vacuous'); }
{ const e = synth(24, 2); if (signature(e.cwc, 'a') === signature(e.cwc, 'b')) fails.push('K4 the signature does not separate a cap of 3 from a cap of 2: K2 would be vacuous'); }
{
  const planted = recov.replace(/\};\s*$/, `  planted12h: { sameGroupHours: 12, maxConsecutive: 3 },\n};`);
  const hit = collapses(engine(planted)).some(c => [c.a, c.b].includes('planted12h') && [c.a, c.b].includes('fat_burn'));
  if (!hit) fails.push('K4 the detector does not fire on a planted 12h goal that rounds onto fat_burn: K2 would be vacuous');
}
// K5
const tableComment = html.slice(html.indexOf('const RECOVERY_PARAMS = {'), html.indexOf('};', html.indexOf('const RECOVERY_PARAMS = {')));
if (!/BUG-162[\s\S]*transform's 36h[\s\S]*Math\.ceil\(hours\/24\)/.test(tableComment)) fails.push("K5 the RECOVERY_PARAMS comment no longer names transform's 36h collapse (BUG-162)");

if (fails.length) {
  for (const f of fails) console.error(`✗ ${f}`);
  console.error(`FAIL cadence-collapse-smoke: ${fails.length} check(s)`);
  process.exit(1);
}
console.log(`✓ no two of ${Object.keys(real.RP).length} goals with different recovery values schedule identically beyond ${KNOWN_COLLAPSE.length} known pair(s) (${KNOWN_COLLAPSE.map(key).join('; ')}); signature proven to separate gap and cap; detector fires on a planted 12h goal`);
