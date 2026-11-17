#!/usr/bin/env node
/**
 * trim-to-fit-smoke.mjs — the chosen session length trims the program, and never at a floor's expense.
 * vm, no browser.
 *
 * Kerwin 2026-11-17: "Trim to fit." Measured before: 45, 60 and 90 minutes produced the identical
 * program; a 60-minute Build Muscle day estimated ~84-90 min (estimateSessionMinutes, Schoenfeld 2019
 * time model, slowest phase). getProgram's TRIM TO FIT loop now drops isolation accessories in D28's
 * order while the longest day is over the chosen length, keeping a drop only if it costs no D6b floor
 * and adds no D35 stack.
 *
 *   [T1] a trimmed build never leaves a major muscle newly below the goal's weekly MEV, and never
 *        carries more lifts above 6 sets, than the same user's untrimmed build (no length set)
 *   [T2] a shorter choice never estimates LONGER than a longer one (30 <= 45 <= 60 <= 90)
 *   [T3] the trim does something: for every goal there is a program where a 45- or 60-minute
 *        choice estimates shorter than the untrimmed build
 *   Reported, not asserted: how far over the chosen length the floors leave each goal.
 */
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ctx = vm.createContext({ console: { log() {}, warn() {}, error() {} }, document: { querySelectorAll: () => [] }, window: {} });
vm.runInContext(readFileSync(join(root, process.env.TRIM_SMOKE_PROGRAMS || 'programs.js'), 'utf8') +
  '\n;globalThis.__x = { gp: getProgram, est: estimateSessionMinutes, cv: computeMuscleWeeklyVolume, bank: EXERCISE_BANK, VL: VOLUME_LANDMARKS, mk: muscleCeilingKey, MAJ: MAJOR_MUSCLE_GROUP_TOKENS };', ctx);
const { gp, est, cv, bank, VL, mk, MAJ } = ctx.__x;

const GOALS = ['build_muscle', 'fat_burn', 'transform', 'strength', 'maintenance'];
// Emphasis included: a trim must not cost floors for an emphasised program either (getProgram also
// refuses a trim that costs the emphasis itself).
const EMPHASES = ['balanced', 'lower_body', 'glute_focused', 'upper_body', 'back_heavy', 'push_heavy'];
const below = (p, g) => { const o = {}; for (const [k, v] of Object.entries(cv(p, bank))) { const kk = mk(k); o[kk] = (o[kk] || 0) + v; } return Object.keys(o).filter(k => MAJ.includes(k) && o[k] < VL[g].mev); };
const over6 = p => p.flatMap(d => (d.blocks || []).filter(b => !b.cardio).flatMap(b => b.exs || [])).filter(e => e.sets > 6).length;
const longest = (p, g) => Math.max(...p.map(d => est(d, g)));

const fails = []; const report = {}; let n = 0;
for (const goal of GOALS) {
  let trimmedSomewhere = false; report[goal] = [];
  for (const days of [2, 3, 4, 5, 6]) for (const sex of ['male', 'female']) for (const exp of ['beginner', 'intermediate', 'advanced']) for (const tier of ['full_gym', 'home']) for (const em of EMPHASES) {
    const run = dur => gp(goal, days, 12, sex, tier, em, null, null, null, exp, null, dur, 200, 175) || [];
    const ref = run(null), L = {}, Lref = longest(ref, goal);
    for (const dur of [30, 45, 60, 90]) {
      const p = run(dur); n++; L[dur] = longest(p, goal);
      const tag = `${goal}/${days}d/${sex}/${exp}/${tier}/${em}/${dur}min`;
      if (dur !== 30) { // 30 already sheds D28's slot below SHORT_SESSION_MAX_MINUTES; compare like with like
        const nb = below(p, goal).filter(k => !below(ref, goal).includes(k));
        if (nb.length) fails.push(`[T1] ${tag}: newly below the weekly floor — ${nb.join(', ')}`);
        if (over6(p) > over6(ref)) fails.push(`[T1] ${tag}: lifts above 6 sets ${over6(ref)} -> ${over6(p)}`);
      }
    }
    if (!(L[30] <= L[45] && L[45] <= L[60] && L[60] <= L[90])) fails.push(`[T2] ${goal}/${days}d/${sex}/${exp}/${tier}/${em}: estimates 30/45/60/90 = ${L[30]}/${L[45]}/${L[60]}/${L[90]}`);
    if (L[60] < Lref || L[45] < Lref) trimmedSomewhere = true;
    if (days === 4 && sex === 'male' && exp === 'intermediate' && tier === 'full_gym' && em === 'balanced') report[goal].push(`60 min chosen -> ${L[60]}`);
  }
  if (!trimmedSomewhere) fails.push(`[T3] ${goal}: no 45/60-minute program estimates shorter than the untrimmed build — the trim never fires`);
}
if (fails.length) {
  console.log(`trim-to-fit smoke: ${fails.length} FAILURE(S)`); for (const f of fails.slice(0, 25)) console.log('  ' + f); process.exit(1);
}
console.log(`trim-to-fit smoke: OK — ${n} programs (5 goals x 2-6 days x 2 sexes x 3 levels x 2 tiers x 6 emphases x 4 lengths): no floor or stack cost, estimates monotone in the chosen length, the trim fires for every goal`);
console.log('  not asserted — longest day (slowest phase), 4-day intermediate full gym, men: ' + GOALS.map(g => `${g} ${report[g].join('')}`).join(' · ') + ' (the floors and the 22-min Zone 2 finisher stop the trim above 60)');
