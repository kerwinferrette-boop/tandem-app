#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// AXIS PARITY — static booby traps for goal-shaped loose ends.
//
// Sibling of matrix-reach-detector.mjs (dynamic: what runs for which combo).
// This one is static: it looks at the SHAPE of the code for the goal axis.
// Legality/reachability gates cannot see these; each is a way a sixth, ghost
// or half-wired goal sneaks in or a table quietly stops covering a goal.
//
// RULES
//   P1  Every top-level per-goal table (an object literal in programs.js with
//       2+ canonical goal keys) carries ALL 5 goals, unless it is on
//       PARTIAL_BY_DESIGN with a cited reason.
//   P2  No comparison against a non-canonical goal name, in programs.js or
//       tandem.html (`goal === 'x'`, `'x' === goal`, `case` inside a goal
//       switch is NOT covered — stated limit).
//   P3  The UI exposes exactly the 5 canonical goals: every
//       selectGoal('x') / selectProfileGoal('x') argument and every
//       data-goal="x" is canonical, AND each of the 5 appears in BOTH the
//       onboarding goal cards and the profile pills (a goal "live" in code
//       but unclickable, or clickable but absent from the generator, fails).
//   P4  GOALS in scripts/lib/persona-combos.mjs IS the canonical list — it
//       must equal the keys of PHASES in programs.js (one rule, one home).
//
// Run: node scripts/axis-parity-smoke.mjs   (wired into npm run verify)
// Env overrides for mutation tests only: PARITY_PROGRAMS, PARITY_HTML.
// ═══════════════════════════════════════════════════════
import vm from 'vm';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { GOALS } from './lib/persona-combos.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROGRAMS = process.env.PARITY_PROGRAMS || resolve(root, 'programs.js');
const HTML = process.env.PARITY_HTML || resolve(root, 'tandem.html');
const progSrc = readFileSync(PROGRAMS, 'utf8');
const htmlSrc = readFileSync(HTML, 'utf8');

// A table may omit goals only with a reason that cites the rule that made the
// omission correct. Adding an entry here is a reviewed act, never a silent edit.
const PARTIAL_BY_DESIGN = {
  SUPERSET_CFG: 'D8 (SAFETY): strength and maintenance are deliberately ABSENT so applySupersets() no-ops for them; build_muscle gets none by default (programs.js comment above SUPERSET_CFG).',
};

const fails = [];
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(progSrc, ctx);

// P1 ── per-goal tables
const names = [...progSrc.matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\{/gm)].map(m => m[1]);
let goalTables = 0;
for (const n of names) {
  let v; try { v = vm.runInContext(n, ctx); } catch { continue; }
  if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
  const have = Object.keys(v).filter(k => GOALS.includes(k));
  if (have.length < 2) continue;
  goalTables++;
  const missing = GOALS.filter(g => !have.includes(g));
  if (missing.length && !PARTIAL_BY_DESIGN[n]) fails.push(`P1 ${n}: per-goal table is missing ${missing.join(', ')} (has ${have.length}/${GOALS.length}) and is not on PARTIAL_BY_DESIGN`);
  if (!missing.length && PARTIAL_BY_DESIGN[n]) fails.push(`P1 ${n}: is on PARTIAL_BY_DESIGN but is now complete — remove the stale allowlist entry`);
}
for (const n of Object.keys(PARTIAL_BY_DESIGN)) if (!names.includes(n)) fails.push(`P1 ${n}: on PARTIAL_BY_DESIGN but no such table exists — stale entry`);
// Tripwire on the tripwire: the sweep must find the tables it is meant to guard.
for (const must of ['PHASES', 'GOAL_VOLUME', 'VOLUME_LANDMARKS', 'SUPERSET_CFG']) {
  if (!names.includes(must)) fails.push(`P1 sweep sanity: expected per-goal table ${must} not found — regex no longer locates tables (SC-33 shape)`);
}
if (goalTables < 4) fails.push(`P1 sweep sanity: found only ${goalTables} per-goal tables, expected >= 4`);

// P2 ── non-canonical goal literals in comparisons
const GOALISH = '[A-Za-z_.]*[gG]oal[A-Za-z_]*';
const reLeft = new RegExp(`\\b(${GOALISH})\\s*[!=]==?\\s*'([^']+)'`, 'g');
const reRight = new RegExp(`'([^']+)'\\s*[!=]==?\\s*(${GOALISH})\\b`, 'g');
// The SECONDARY (ancillary) goal is a different axis with its own 'none'
// sentinel (selectedSecondaryGoal === 'none'); it is not a primary goal.
const isSecondary = (id) => /econdary|ncillary/.test(id);
let literalUses = 0;
for (const [file, src] of [['programs.js', progSrc], ['tandem.html', htmlSrc]]) {
  for (const [re, litIdx, idIdx] of [[reLeft, 2, 1], [reRight, 1, 2]]) {
    for (const m of src.matchAll(re)) {
      if (isSecondary(m[idIdx])) continue;
      literalUses++;
      if (!GOALS.includes(m[litIdx])) fails.push(`P2 ${file}: compares ${m[idIdx]} to non-canonical '${m[litIdx]}' (canonical: ${GOALS.join(', ')})`);
    }
  }
}
if (literalUses < 3) fails.push(`P2 sweep sanity: only ${literalUses} goal comparisons found — expected several; regex may have stopped matching`);

// P3 ── UI exposes exactly the canonical goals, in both pickers
const argsOf = (re) => [...htmlSrc.matchAll(re)].map(m => m[1]);
const cardArgs = argsOf(/class="goal-card"[^>]*onclick="selectGoal\('([^']+)'/g);
const pillArgs = argsOf(/class="profile-pill"[^>]*data-goal="([^"]+)"/g);
const allCalls = [...argsOf(/\bselectGoal\('([^']+)'/g), ...argsOf(/\bselectProfileGoal\('([^']+)'/g), ...argsOf(/data-goal="([^"]+)"/g)];
for (const g of new Set(allCalls)) if (!GOALS.includes(g)) fails.push(`P3 tandem.html: UI references non-canonical goal '${g}'`);
for (const [label, list] of [['onboarding goal-card', cardArgs], ['profile pill', pillArgs]]) {
  const missing = GOALS.filter(g => !list.includes(g));
  const extra = list.filter(g => !GOALS.includes(g));
  const dup = list.filter((g, i) => list.indexOf(g) !== i);
  if (missing.length) fails.push(`P3 ${label}: canonical goal(s) not clickable: ${missing.join(', ')}`);
  if (extra.length) fails.push(`P3 ${label}: non-canonical goal(s) present: ${extra.join(', ')}`);
  if (dup.length) fails.push(`P3 ${label}: duplicate goal(s): ${dup.join(', ')}`);
}

// P4 ── GOALS (matrix) == PHASES keys (generator)
const phaseKeys = Object.keys(vm.runInContext('PHASES', ctx)).filter(k => k !== '_meta');
const sym = (a, b) => [...a.filter(x => !b.includes(x)).map(x => `+${x}`), ...b.filter(x => !a.includes(x)).map(x => `-${x}`)];
const d = sym(phaseKeys, GOALS);
if (d.length) fails.push(`P4 persona-combos GOALS vs programs.js PHASES keys disagree (${d.join(' ')}): the matrix would sweep a different goal set than the generator has`);

console.log(`Axis parity: ${goalTables} per-goal tables, ${literalUses} goal comparisons, ${cardArgs.length} goal cards, ${pillArgs.length} profile pills checked against ${GOALS.length} canonical goals.`);
if (fails.length) {
  for (const f of fails) console.log('  FAIL  ' + f);
  console.log('AXIS PARITY: FAIL');
  process.exit(1);
}
console.log('AXIS PARITY: ALL PASS');
