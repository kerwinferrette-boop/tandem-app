#!/usr/bin/env node
/**
 * beginner-regression-smoke.mjs — BUG-44 guard: a beginner is never prescribed a full-bodyweight
 * pull or dip, and gets the regression instead.
 *
 * Kerwin 2026-11-15 ("A & C"): beginners get Lat Pulldown or an assisted version of Chin-Up /
 * Pull-Up / Dips now; bodyweight-relative scaling (EPIC-34) replaces this later. Measured on
 * HEAD before the fix (2026-11-16, this sweep): 5,600 of 25,200 beginner programs contained
 * Chin-Up or Pull-Up, all at hotel_gym. Dips was never selected.
 *
 * Runs the REAL getProgram() from the working-tree programs.js in node:vm across the persona
 * matrix (scripts/lib/persona-combos.mjs, 1050 combos) x T=24 x wall-clock weeks 1-24, once with
 * experience='beginner' and once with 'intermediate' on identical inputs.
 *   B1  no beginner program contains Chin-Up, Pull-Up or Dips
 *   B2  anti-vacuity: the intermediate twin sweep DOES contain Chin-Up or Pull-Up, so B1 is
 *       proving the rule removed something real rather than that nothing was ever there
 *   B3  every beginner day whose intermediate twin had Chin-Up or Pull-Up holds one of that
 *       lift's listed regressions (the slot keeps its movement; it is not silently a row)
 *   B4  the rule table is honest: every listed regression is a real bank compound whose primary
 *       muscle is lat_dorsi; Dips' list is empty, and if the bank ever gains an assisted or band
 *       compound dip this fails so the list is updated rather than left stale
 */
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { combos } from './lib/persona-combos.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const code = readFileSync(join(root, 'programs.js'), 'utf8');   // working tree, on purpose
const { getProgram, EXERCISE_BANK, BEGINNER_REGRESSIONS } = vm.runInNewContext(
  `(function(){ ${code}; return { getProgram, EXERCISE_BANK,
     BEGINNER_REGRESSIONS: typeof BEGINNER_REGRESSIONS === 'undefined' ? null : BEGINNER_REGRESSIONS }; })()`,
  { console });

const TARGETS = ['Chin-Up', 'Pull-Up', 'Dips'];
const fails = [];
const T = 24;
const names = (day) => (day.blocks || []).flatMap(b => (b.exs || []).map(e => e.name));

let programs = 0, beginnerHits = 0, twinHits = 0, twinDays = 0, regressedOk = 0, absentSlot = 0;
const firstFail = [];
for (const c of combos()) {
  for (let w = 1; w <= T; w++) {
    const a = [...c.args];
    a[2] = T;
    a[8] = { week: w, phase: Math.min(3, Math.floor((w - 1) / (T / 4))) };
    const beg = [...a]; beg[9] = 'beginner';
    const mid = [...a]; mid[9] = 'intermediate';
    const B = getProgram(...beg) || [], I = getProgram(...mid) || [];
    programs++;
    B.forEach((d, di) => {
      const bn = names(d);
      const bad = bn.filter(n => TARGETS.includes(n));
      if (bad.length) { beginnerHits++; if (firstFail.length < 5) firstFail.push(`B1 ${c.combo} wk${w} day${di + 1}: ${bad.join(', ')}`); }
      const twEx = I[di] ? (I[di].blocks || []).flatMap(b => b.exs || []) : [];
      const tw = twEx.map(e => e.name);
      const begIds = new Set((d.blocks || []).flatMap(b => (b.exs || []).map(e => e.id)));
      for (const t of ['Chin-Up', 'Pull-Up']) {
        if (!tw.includes(t)) continue;
        // 2026-11-17: B3 is a claim about SLOTS ("every slot whose intermediate twin had ..."),
        // and it used to be checked per DAY. That was equivalent while both tiers had the same
        // slots. The second-exposure slot (programs.js SECOND_EXPOSURE_ROLE, id suffix '-b0')
        // exists for intermediate/advanced only — beginners shed a slot, they do not gain one —
        // so a Pull-Up there has no beginner slot to regress INTO. Only that one slot is
        // exempt, only when the beginner day truly lacks it, and it is counted and printed.
        // B1 is untouched: a beginner day still may not contain Chin-Up, Pull-Up or Dips at all.
        const twinSlots = twEx.filter(e => e.name === t);
        if (twinSlots.every(e => /-b0$/.test(String(e.id)) && !begIds.has(e.id))) { absentSlot++; continue; }
        twinHits++; twinDays++;
        const alts = (BEGINNER_REGRESSIONS && BEGINNER_REGRESSIONS[t]) || [];
        if (alts.some(n => bn.includes(n))) regressedOk++;
        else if (firstFail.length < 10) firstFail.push(`B3 ${c.combo} wk${w} day${di + 1}: twin had ${t}, beginner day has none of ${alts.join(' / ')}`);
      }
    });
  }
}

if (!BEGINNER_REGRESSIONS) fails.push('B4 BEGINNER_REGRESSIONS is not declared in programs.js');
if (beginnerHits) fails.push(`B1 ${beginnerHits} beginner day(s) prescribe ${TARGETS.join('/')}`);
if (!twinHits) fails.push('B2 the intermediate twin sweep contains no Chin-Up or Pull-Up — the guard would be vacuous');
if (regressedOk !== twinDays) fails.push(`B3 ${twinDays - regressedOk} of ${twinDays} regressed slot(s) did not get a listed regression`);

if (BEGINNER_REGRESSIONS) {
  const byName = Object.fromEntries(Object.values(EXERCISE_BANK).map(e => [e.name, e]));
  for (const t of TARGETS) {
    if (!Array.isArray(BEGINNER_REGRESSIONS[t])) { fails.push(`B4 no regression list for ${t}`); continue; }
    if (!byName[t]) fails.push(`B4 ${t} is no longer in EXERCISE_BANK`);
  }
  for (const t of ['Chin-Up', 'Pull-Up']) for (const n of BEGINNER_REGRESSIONS[t] || []) {
    const e = byName[n];
    if (!e) fails.push(`B4 regression "${n}" for ${t} is not in EXERCISE_BANK`);
    else if (e.category !== 'compound' || !(e.muscleGroups.primary || []).includes('lat_dorsi'))
      fails.push(`B4 regression "${n}" for ${t} is not a lat_dorsi compound`);
    else if (TARGETS.includes(n)) fails.push(`B4 regression "${n}" is itself a regressed lift`);
  }
  const dipAlts = Object.values(EXERCISE_BANK).filter(e => e.category === 'compound' && e.name !== 'Dips'
    && /\bdip/i.test(e.name));
  if ((BEGINNER_REGRESSIONS.Dips || []).length === 0 && dipAlts.length)
    fails.push(`B4 the bank now has a compound dip variant (${dipAlts.map(e => e.name).join(', ')}): list it under Dips`);
}

if (fails.length) {
  for (const f of [...fails, ...firstFail]) console.error(`✗ ${f}`);
  console.error(`FAIL beginner-regression-smoke (${programs} beginner/intermediate program pairs)`);
  process.exit(1);
}
console.log(`✓ ${programs} beginner programs prescribe no Chin-Up, Pull-Up or Dips; all ${twinDays} slots where the intermediate twin had Chin-Up or Pull-Up hold a listed regression (${absentSlot} twin day(s) had one only in the second-exposure slot beginners do not have); the regression table is honest`);
