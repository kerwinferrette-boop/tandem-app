#!/usr/bin/env node
/**
 * persona-axes-coverage-smoke.mjs — BUG-141 guard: the persona matrix sweeps the experience and
 * workout-duration axes the generator actually branches on.
 *
 * The matrix (scripts/lib/persona-combos.mjs) said for four months that experience is not passed
 * to getProgram(). EPIC-8a made that false, so a defect that only shows for a beginner, an
 * advanced lifter or a short session could pass validate:personas. Proven 2026-11-17: a planted
 * "beginner + 30 min drops the injury filter" mutation left the old matrix green (R8: 0) and the
 * new sweep red (R8: 390 combos).
 *
 * Reads programs.js (working tree) in node:vm and the matrix module:
 *   A1  every experience value programs.js compares against (`experience === '…'` / `exp === '…'`)
 *       and every value normalizeExperience() returns is in EXPERIENCES, and an unset value is too
 *   A2  DURATIONS has a value below SHORT_SESSION_MAX_MINUTES, one at or above it, and an unset one
 *   A3  experienceDurationCombos() is the full cross-product and fills getProgram's experience
 *       (index 9) and durationMinutes (index 11) arguments
 *   A4  persona-matrix.mjs actually runs experienceDurationCombos() (imported AND iterated)
 *   A5  the stale "not passed into getProgram()" scope note is gone
 */
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { combos, EXPERIENCES, DURATIONS, experienceDurationCombos } from './lib/persona-combos.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const code = readFileSync(join(root, 'programs.js'), 'utf8');
const combosSrc = readFileSync(join(root, 'scripts', 'lib', 'persona-combos.mjs'), 'utf8');
const matrixSrc = readFileSync(join(root, 'scripts', 'persona-matrix.mjs'), 'utf8');
const fails = [];
const ok = (label, cond, detail = '') => { if (!cond) fails.push(`${label}${detail ? ` — ${detail}` : ''}`); };

const { normalizeExperience, SHORT } = vm.runInNewContext(
  `(function(){ ${code}; return { normalizeExperience, SHORT: SHORT_SESSION_MAX_MINUTES }; })()`, { console });

// A1
const codeNoComments = code.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
const compared = new Set([...codeNoComments.matchAll(/\b(?:experience|exp)\s*===\s*'([a-z_]+)'/g)].map(m => m[1]));
const returned = new Set(['beginner', 'intermediate', 'advanced', undefined, null, 'x'].map(v => normalizeExperience(v)));
for (const v of new Set([...compared, ...returned]))
  ok(`A1 EXPERIENCES includes '${v}'`, EXPERIENCES.includes(v));
ok('A1 EXPERIENCES includes an unset value', EXPERIENCES.some(v => v == null));

// A2
ok('A2 SHORT_SESSION_MAX_MINUTES is a number', Number.isFinite(SHORT), String(SHORT));
ok(`A2 a duration below ${SHORT}`, DURATIONS.some(d => Number.isFinite(d) && d < SHORT), JSON.stringify(DURATIONS));
ok(`A2 a duration at or above ${SHORT}`, DURATIONS.some(d => Number.isFinite(d) && d >= SHORT), JSON.stringify(DURATIONS));
ok('A2 an unset duration', DURATIONS.some(d => d == null));

// A3
const base = [...combos()].length;
const sweep = [...experienceDurationCombos()];
ok('A3 full cross-product', sweep.length === base * EXPERIENCES.length * DURATIONS.length,
  `${sweep.length} vs ${base} x ${EXPERIENCES.length} x ${DURATIONS.length}`);
const pairs = new Set(sweep.map(s => `${s.args[9]}|${s.args[11]}`));
for (const e of EXPERIENCES) for (const d of DURATIONS)
  ok(`A3 args carry experience=${e} duration=${d}`, pairs.has(`${e}|${d}`));

// A4
ok('A4 persona-matrix imports experienceDurationCombos', /import\s*\{[^}]*\bexperienceDurationCombos\b[^}]*\}\s*from\s*'\.\/lib\/persona-combos\.mjs'/.test(matrixSrc));
ok('A4 persona-matrix iterates experienceDurationCombos()', /\.\.\.experienceDurationCombos\(\)|of experienceDurationCombos\(\)/.test(matrixSrc));

// A5
ok('A5 the stale "NOT passed into getProgram()" note is gone', !/NOT passed into\s*\/\/?\s*getProgram\(\)/.test(combosSrc) && !/are captured at onboarding but NOT passed/.test(combosSrc));

if (fails.length) {
  for (const f of fails) console.error(`✗ ${f}`);
  console.error(`FAIL persona-axes-coverage-smoke: ${fails.length} check(s)`);
  process.exit(1);
}
console.log(`✓ persona matrix sweeps experience ${JSON.stringify(EXPERIENCES)} x duration ${JSON.stringify(DURATIONS)} (short-session threshold ${SHORT} min) over all ${base} base combos = ${sweep.length} extra programs, and persona-matrix runs them`);
