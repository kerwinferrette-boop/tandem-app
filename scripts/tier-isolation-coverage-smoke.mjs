// BUG-218 guard — generalizes home-tier-isolation-coverage-smoke.mjs (BUG-119b) from three hardcoded
// assertions to a tier x focus x slot sweep over FOCUS_SLOTS. D18's empty-pool fallback (ACTIVE,
// deliberate) serves a slot with a DIFFERENT primary mover when the strict pool is empty; this
// gate makes that silent substitution visible and stops it from GROWING without a ruling.
//   [a] each filled slot's chosen exercise has a requested muscle as PRIMARY
//   [b] a focus that requests the same (muscle, category) in two slots yields DISTINCT exercises,
//       each primary-matching (a repeat slot with one entry to give is where the fallback bites)
//   [c] the per-tier x focus x slot fallback set is compared to RECORDED_FALLBACKS below and fails
//       only on an INCREASE. It does NOT assert zero: D18's fallback is allowed, only unnoticed
//       growth is not. A decrease prints a note (tighten the baseline) but does not fail.
// Slot -> exercise mapping is read from the id getSingleDay stamps (`oneoff-<focus>-<slotIdx>`).
// Scripts + bank READS only: no generator change, no bank addition. PROGRAMS_JS overrides the
// file under test so a mutation test runs on a COPY, never on the working tree (SC-40).
import fs from 'fs'; import vm from 'vm'; import { fileURLToPath } from 'url'; import path from 'path';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = process.env.PROGRAMS_JS || path.join(root, 'programs.js');
const ctx = { console, window: {}, localStorage: { getItem() { return null }, setItem() {} }, sessionStorage: { getItem() { return null }, setItem() {} } };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(src, 'utf8') + ';this.__g=getSingleDay;this.__b=EXERCISE_BANK;this.__s=FOCUS_SLOTS;', ctx);
const bank = Object.values(ctx.__b); const byName = Object.fromEntries(bank.map(e => [e.name, e]));
const SLOTS = ctx.__s; const RUNS = 15; const TIERS = ['home', 'hotel_gym', 'full_gym'];

// RECORDED BASELINE — measured 2026-10-09 at origin/main 7b3cc3a by running this script with an
// empty baseline. Key "tier|focus|slotIdx" = the slot is filled by a non-primary-mover (D18 fallback).
// Adding a key here needs a ruling + the Bug & QA Log row that files the gap (discovery_handling).
const RECORDED_FALLBACKS = {
  'home|chest|1': 'dropped',      // anterior_delt compound: only fallback candidate (Push-Up) already used by slot 0 -> day has 4 of 5 slots
  'home|push|1': 'dropped',       // same cause as home|chest|1
  'home|shoulders|0': 'Push-Up',  // zero primary-tagged shoulder compounds at home (programs.js select() comment, documented D18 soft fallback)
  'home|hinge|1': 'Bodyweight Squat', // glute_max compound at home: no glute-primary compound; quad-primary squat serves it
};

const primaryHit = (e, groups) => (e.muscleGroups.primary || []).some(a => groups.some(g => a === g || a.startsWith(g + '_')));
const EMPTY = '(slot dropped — no candidate)'; const observed = {}; const fails = []; let slotsChecked = 0;
for (const tier of TIERS) for (const focus of Object.keys(SLOTS)) {
  const slots = SLOTS[focus]; const seenKey = new Map(); // (groups|cat) -> occurrence count
  const dist = slots.map(() => new Set());
  for (let r = 0; r < RUNS; r++) {
    const d = ctx.__g(focus, { tier });
    const exs = d.blocks.flatMap(b => b.exs);
    slots.forEach((s, i) => {
      const ex = exs.find(x => x.id === `oneoff-${focus}-${i}`);
      slotsChecked++;
      if (!ex) { observed[`${tier}|${focus}|${i}`] = EMPTY; return; }  // D18 swallow: slot silently dropped
      const e = byName[ex.name]; dist[i].add(ex.name);
      if (!primaryHit(e, [s[0], s[1]].filter(Boolean))) observed[`${tier}|${focus}|${i}`] = ex.name;
    });
    const names = exs.map(x => x.name);
    if (new Set(names).size !== names.length) fails.push(`[b] ${tier}/${focus}: duplicate exercise within one day ${JSON.stringify(names)}`);
  }
}
// [a]/[b]/[c] verdicts from the observed fallback set
const repeatOf = (focus, i) => { const k = x => JSON.stringify([x[0], x[1], x[2]]); return SLOTS[focus].slice(0, i).some(p => k(p) === k(SLOTS[focus][i])); };
for (const [key, name] of Object.entries(observed)) {
  if (key in RECORDED_FALLBACKS) continue;
  const [tier, focus, i] = key.split('|'); const tag = repeatOf(focus, +i) ? '[b]' : '[a]';
  fails.push(`${tag} NEW D18 fallback ${key}: slot ${JSON.stringify(SLOTS[focus][+i])} served by "${name}"${byName[name] ? ` (primary=${JSON.stringify(byName[name].muscleGroups.primary)})` : ''} — not in RECORDED_FALLBACKS`);
}
const healed = Object.keys(RECORDED_FALLBACKS).filter(k => !(k in observed));
const perTier = TIERS.map(t => `${t}=${Object.keys(observed).filter(k => k.startsWith(t + '|')).length}`).join(' ');
// hotel_gym quad/glute isolation count (council claim "zero" was UNVERIFIED — BUG-218 row)
const iso = (tier, m) => bank.filter(e => e.tier === tier && e.category === 'isolation' && (e.muscleGroups.primary || []).some(a => a === m || a.startsWith(m + '_'))).length;
console.log(`isolation primaries in bank by tier (quad/glute): home=${iso('home', 'quad')}/${iso('home', 'glute')} hotel_gym-only=${iso('hotel_gym', 'quad')}/${iso('hotel_gym', 'glute')} full_gym-only=${iso('full_gym', 'quad')}/${iso('full_gym', 'glute')}`);
console.log(`fallback slots observed (${perTier}); recorded=${Object.keys(RECORDED_FALLBACKS).length}`);
if (healed.length) console.log(`NOTE: ${healed.length} recorded fallback(s) no longer fire — tighten RECORDED_FALLBACKS: ${healed.join(', ')}`);
if (process.env.PRINT_BASELINE) console.log(JSON.stringify(observed, null, 1));
if (fails.length) { console.error(`FAIL tier isolation coverage:\n` + fails.join('\n')); process.exit(1); }
console.log(`PASS tier x focus x slot coverage (${TIERS.length} tiers x ${Object.keys(SLOTS).length} focuses, ${slotsChecked} slot fills, ${RUNS} runs each; fallback set did not grow)`);
