#!/usr/bin/env node
/**
 * materializer-smoke.mjs — REGRESSION GUARD for the authored-program path (EPIC-031).
 *
 * WHY THIS EXISTS (2026-07-31, porting EPIC-031 onto main): the other six verify
 * checks all exercise the GENERATED engine. Every one of them can stay green while
 * materializeTemplate() is broken, because none of them ever call it. Shipping the
 * authored-program runtime behind a suite that structurally cannot see it would be
 * the same vacuous-gate problem the D16 seed validator had before seeds/ was tracked
 * (a gate that reports "0 items validated" has not been exercised).
 *
 * materializeTemplate() is the seam the whole library feature rests on: it converts
 * an authored seed into the exact day-array shape getProgram() emits, so the render
 * layer (buildDayHTML, tabs, logging, PRs) works unchanged. If its output shape
 * drifts, adopted programs break silently for anyone running one — the generated
 * path keeps working, so nothing else goes red.
 *
 * HARD (fails the gate), for every seed in seeds/ across all of its weeks:
 *   - every week materializes to a non-empty day array (no dead week)
 *   - every day carries key/label/blocks; every exercise carries name/sets/r
 *   - authoredRest is present on every exercise — the data-rest render hook and the
 *     rest-timer override both read it; if it goes missing, authored rests silently
 *     revert to generated phase rests
 *   - repRange is present on every exercise — drives set-row prefill AND progression
 *     (getRecommendation measures against the authored target, not the phase rep)
 *   - techniques surface on at least one week, and at least one week runs clean.
 *     Both directions matter: all-clean means technique_by_week stopped being read,
 *     all-tagged means deload weeks lost their D4/D14 shape.
 *   - out-of-range weeks clamp instead of throwing (week 0 and week 999)
 *   - null / block-less templates return null rather than a malformed program
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);
const programsSrc = readFileSync(join(root, 'programs.js'), 'utf8');

const { materializeTemplate } = vm.runInNewContext(
  `(function() { ${programsSrc}; return { materializeTemplate }; })()`,
  { console },
);
if (typeof materializeTemplate !== 'function') {
  console.log('✗ materializeTemplate is not exported from programs.js — the authored path is gone');
  process.exit(1);
}

const seedsDir = join(root, 'seeds');
let seedFiles = [];
try { seedFiles = readdirSync(seedsDir).filter(f => f.endsWith('.json')).sort(); } catch { /* handled below */ }

// A seed-less run is a vacuous run. Refuse to report green on zero coverage.
if (!seedFiles.length) {
  console.log('✗ no seeds/*.json found — this gate would pass vacuously; seeds must be tracked');
  process.exit(1);
}

const failures = [];
let weeksChecked = 0;
let exercisesChecked = 0;

console.log('AUTHORED-PROGRAM MATERIALIZER GUARD — EPIC-031 render contract holds\n');

for (const file of seedFiles) {
  const tpl = JSON.parse(readFileSync(join(seedsDir, file), 'utf8'));
  const name = tpl?.template?.name || file;
  const weeks = Number(tpl?.template?.duration_weeks) || 0;
  if (!weeks) { failures.push(`${file}: template.duration_weeks missing or zero`); continue; }

  let techniqueWeeks = 0;
  let cleanWeeks = 0;

  for (let w = 1; w <= weeks; w++) {
    const days = materializeTemplate(tpl, w);
    if (!Array.isArray(days) || !days.length) { failures.push(`${file} wk${w}: materialized to an empty program`); continue; }
    weeksChecked++;

    let weekHasTechnique = false;
    for (const d of days) {
      if (!d.key || !d.label || !Array.isArray(d.blocks) || !d.blocks.length) {
        failures.push(`${file} wk${w}: day "${d.key || '?'}" is missing key/label/blocks`);
        continue;
      }
      for (const b of d.blocks) {
        for (const ex of (b.exs || [])) {
          exercisesChecked++;
          if (!ex.name)              failures.push(`${file} wk${w} ${d.key}: an exercise has no name`);
          if (!ex.sets)              failures.push(`${file} wk${w} ${d.key}: "${ex.name}" has no sets`);
          if (ex.r == null)          failures.push(`${file} wk${w} ${d.key}: "${ex.name}" has no rep target (ex.r)`);
          if (ex.authoredRest == null) failures.push(`${file} wk${w} ${d.key}: "${ex.name}" has no authoredRest — data-rest + rest-timer hooks would fall back to generated rests`);
          if (!ex.repRange)          failures.push(`${file} wk${w} ${d.key}: "${ex.name}" has no repRange — set-row prefill + progression would use the generated phase rep`);
          if (ex.technique) weekHasTechnique = true;
        }
      }
    }
    if (weekHasTechnique) techniqueWeeks++; else cleanWeeks++;
  }

  // Both directions, per the D16 acceptance-test style: a gate that only proves
  // one direction can't tell "working" from "stuck".
  if (!techniqueWeeks) failures.push(`${file}: no week surfaces a technique — technique_by_week is not being read`);
  if (!cleanWeeks)     failures.push(`${file}: every week is technique-tagged — deload/realization weeks lost their clean shape (D4/D14)`);

  // Clamping: the render layer can ask for any week (stale currentWeek, week 0 on
  // a fresh adopt). It must never throw and never return a malformed program.
  for (const w of [0, weeks + 999]) {
    const clamped = materializeTemplate(tpl, w);
    if (!Array.isArray(clamped) || !clamped.length) failures.push(`${file}: week ${w} did not clamp to a valid program`);
  }

  console.log(`  ${name} — ${weeks} wks, ${techniqueWeeks} technique / ${cleanWeeks} clean`);
}

// Negative cases: a bad template must degrade to null so getActiveProgram()'s
// fallback fires and the user still gets the generated workout.
if (materializeTemplate(null, 1) !== null)          failures.push('null template did not return null — getActiveProgram fallback would not fire');
if (materializeTemplate({ template: {} }, 1) !== null) failures.push('block-less template did not return null — getActiveProgram fallback would not fire');

console.log(`\n  ${seedFiles.length} seed(s), ${weeksChecked} week-renders, ${exercisesChecked} exercise slots checked`);
if (failures.length) {
  console.log(`\n${failures.length} MATERIALIZER FAILURE(S) — the authored-program render contract has drifted:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log('\nAuthored programs materialize to the generated-program contract. ✓');
process.exit(0);
