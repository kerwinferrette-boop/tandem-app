#!/usr/bin/env node
/**
 * authored-experience-smoke.mjs — BUG-201 guard: experience reaches the authored path.
 *
 * WHY THIS EXISTS: an advanced user who adopted a library program got the same
 * coaching as a beginner. getActiveProgram() passed tier/injuries/sex/maxDb into
 * materializeTemplate() but never cfg.experience, and materializeTemplate() had no
 * use for it anyway — so the "Advanced tier: push to RPE 8-9" cue that the generated
 * engine (makeEx) puts on every compound lift never appeared on an adopted program.
 *
 * HARD (fails the gate):
 *   E1  every seed, every week, experience 'advanced': every compound exercise carries
 *       the advanced cue exactly once, and no non-compound exercise carries it.
 *   E2  experience 'beginner', 'intermediate', and omitted: no exercise carries it
 *       (the author's cues are passed through untouched).
 *   E3  the cue is ONE string with the generated engine: the authored path and makeEx
 *       both read ADVANCED_RPE_CUE, so the two cannot drift apart in wording.
 *   E4  the real call site in tandem.html passes `experience:` into materializeTemplate.
 *
 * DELIBERATELY NOT ASSERTED: flagDropSet. Authored programs do not get the generated
 * engine's drop-set annotation — see the 2026-07-31 note above materializeTemplate in
 * programs.js (it would overwrite the authors' own technique/deload shape).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const programsSrc = readFileSync(join(root, 'programs.js'), 'utf8');
const html = readFileSync(join(root, 'tandem.html'), 'utf8');

const ctx = vm.runInNewContext(
  `(function() { ${programsSrc}; return {
     materializeTemplate,
     cue: (typeof ADVANCED_RPE_CUE === 'string') ? ADVANCED_RPE_CUE : null,
   }; })()`,
  { console },
);
const failures = [];

// E3 — one owner for the wording, read by both paths.
if (!ctx.cue) failures.push('E3: ADVANCED_RPE_CUE is not defined in programs.js — the cue has no single owner');
const CUE = ctx.cue || 'Advanced tier: push to RPE 8-9 on working sets.';
const literalCount = programsSrc.split("'Advanced tier: push to RPE 8-9 on working sets.'").length - 1;
if (literalCount > 1) failures.push(`E3: the advanced cue literal appears ${literalCount} times in programs.js — use ADVANCED_RPE_CUE`);
const cueReads = (programsSrc.match(/ADVANCED_RPE_CUE/g) || []).length;
if (ctx.cue && cueReads < 3) failures.push(`E3: ADVANCED_RPE_CUE is read ${cueReads - 1} time(s); expected both makeEx and materializeTemplate`);

const allEx = (day) => (day.blocks || []).flatMap(b => b.exs || []);
const seeds = readdirSync(join(root, 'seeds')).filter(f => f.endsWith('.json')).sort();
if (!seeds.length) failures.push('no seeds/*.json — this gate would pass vacuously');

let compoundsChecked = 0;
for (const file of seeds) {
  const tpl = JSON.parse(readFileSync(join(root, 'seeds', file), 'utf8'));
  const weeks = Number(tpl?.template?.duration_weeks) || 12;
  for (let w = 1; w <= weeks; w++) {
    const adv = ctx.materializeTemplate(tpl, w, { tier: 'full_gym', injuries: '', experience: 'advanced' }) || [];
    for (const day of adv) for (const ex of allEx(day)) {
      const n = (ex.cues || []).filter(c => c === CUE).length;
      if (ex.compound) {
        compoundsChecked++;
        if (n !== 1) failures.push(`E1: ${file} wk${w} ${day.key} "${ex.name}" (compound) carries the advanced cue ${n} time(s), expected 1`);
      } else if (n) {
        failures.push(`E1: ${file} wk${w} ${day.key} "${ex.name}" (not compound) carries the advanced cue`);
      }
    }
    for (const experience of ['beginner', 'intermediate', undefined]) {
      const days = ctx.materializeTemplate(tpl, w, { tier: 'full_gym', injuries: '', experience }) || [];
      for (const day of days) for (const ex of allEx(day)) {
        if ((ex.cues || []).includes(CUE)) failures.push(`E2: ${file} wk${w} "${ex.name}" carries the advanced cue at experience=${experience}`);
      }
    }
  }
}
if (!compoundsChecked) failures.push('E1: zero compound exercises checked — vacuous');

// E4 — the call site must pass it, or E1 is true of a function nobody asks.
const sites = [...html.matchAll(/materializeTemplate\s*\(/g)]
  .filter(m => !/typeof\s+materializeTemplate/.test(html.slice(Math.max(0, m.index - 30), m.index + 25)));
if (!sites.length) failures.push('E4: no materializeTemplate( call site found in tandem.html');
for (const m of sites) {
  const line = html.slice(0, m.index).split('\n').length;
  if (!/experience\s*:/.test(html.slice(m.index, m.index + 900))) failures.push(`E4: tandem.html:${line} — materializeTemplate() call omits experience`);
}

console.log(`AUTHORED-PATH EXPERIENCE (BUG-201): ${seeds.length} seed(s), ${compoundsChecked} advanced compound slot(s), ${sites.length} call site(s)`);
if (failures.length) {
  console.log(`FAIL — ${failures.length} problem(s); first 10:`);
  failures.slice(0, 10).forEach(f => console.log('  ' + f));
  process.exit(1);
}
console.log('PASS — advanced users get the compound RPE cue on adopted programs; other tiers get the author\'s cues untouched.');
