#!/usr/bin/env node
/**
 * duration-smoke.mjs — REGRESSION GUARD for EPIC-8b duration branching
 * (docs/waves/EPIC-8-WAVE-STATE.md Slice 1, DOCTRINE.md D28).
 *
 * WHY THIS EXISTS: getProgram()/buildDynamicProgram() gained a new trailing
 * `durationMinutes` parameter. Two properties must hold forever:
 *   1. REGRESSION-SAFE — every existing caller (none of which passes
 *      durationMinutes) must see byte-identical output. This is what makes
 *      threading a new axis into an 11-arg engine safe to ship.
 *   2. THE CITED SHAPE — a session under SHORT_SESSION_MAX_MINUTES drops the
 *      isolation block's 3rd slot (acc3): for goals with an active
 *      SUPERSET_CFG entry (transform/fat_burn) this leaves exactly ONE
 *      superset block and NO leftover plain accessory block (the Epic's own
 *      "keep 2 compounds + 1 superset finisher"); for goals without one
 *      (build_muscle — D5 never supersets it) the Accessory Block shrinks
 *      from 3 to 2 exercises, the honest consequence of that same doctrine.
 * The exact 45-minute cutoff itself is an UNSOURCED engineering default
 * (D28, PENDING) — this gate does not assert it as science, only that the
 * shape behaves the way the code says it does.
 */
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);
const code = readFileSync(join(root, 'programs.js'), 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(code, ctx);
const { getProgram } = ctx;

const failures = [];
let checked = 0;

function accBlock(day) {
  return (day.blocks || []).find(b => !b.superset && !b.cardio && /accessor/i.test(b.label || ''));
}
function compoundBlock(day) {
  return (day.blocks || []).find(b => /^compound block$/i.test(b.label || ''));
}
function supersetBlocks(day) {
  return (day.blocks || []).filter(b => b.superset);
}

const BASE_ARGS = (goal, dur) => [goal, 4, 12, 'male', 'full_gym', 'balanced', null, null, { week: 1, phase: 0 }, 'intermediate', null, dur];

// ── 1. Regression safety — omitted / undefined / null all match the pre-Slice-1 baseline ──
for (const goal of ['build_muscle', 'transform', 'fat_burn']) {
  const withoutArg = getProgram(...BASE_ARGS(goal, undefined).slice(0, 11)); // 11 args = no durationMinutes at all
  const explicitUndefined = getProgram(...BASE_ARGS(goal, undefined));
  const explicitNull = getProgram(...BASE_ARGS(goal, null));
  checked += 3;
  if (JSON.stringify(withoutArg) !== JSON.stringify(explicitUndefined)) {
    failures.push(`${goal}: omitting durationMinutes differs from passing it as undefined — not regression-safe`);
  }
  if (JSON.stringify(explicitUndefined) !== JSON.stringify(explicitNull)) {
    failures.push(`${goal}: durationMinutes=null differs from undefined — both must mean "no preference stated"`);
  }
  const long = getProgram(...BASE_ARGS(goal, 60));
  checked++;
  if (JSON.stringify(explicitUndefined) !== JSON.stringify(long)) {
    failures.push(`${goal}: durationMinutes=60 (>=60min, "keep full structure") must match the no-preference baseline`);
  }
}

// ── 2. Short session shape, per the Epic's own cited structure ──
for (const goal of ['build_muscle', 'transform', 'fat_burn']) {
  const full = getProgram(...BASE_ARGS(goal, undefined));
  const short = getProgram(...BASE_ARGS(goal, 30)); // 30 < SHORT_SESSION_MAX_MINUTES (45)
  const dFull = full[0], dShort = short[0];
  checked++;

  // Compound Block (the 2 compounds) must be completely unaffected.
  const cFull = compoundBlock(dFull), cShort = compoundBlock(dShort);
  if (!cFull || !cShort || JSON.stringify(cFull) !== JSON.stringify(cShort)) {
    failures.push(`${goal}: Compound Block changed under a short session — duration must never touch D3's compound-first structure`);
  }

  const supersFull = supersetBlocks(dFull).length;
  const supersShort = supersetBlocks(dShort).length;
  const accFull = accBlock(dFull);
  const accShort = accBlock(dShort);

  if (supersFull > 0) {
    // transform/fat_burn: short session keeps exactly the same superset count
    // (the pair itself is untouched — only the 3rd, non-paired slot is cut)
    // and loses its leftover plain Accessory Block entirely — "1 superset
    // finisher", nothing else isolation-shaped survives.
    checked++;
    if (supersShort !== supersFull) {
      failures.push(`${goal}: short session changed superset count (${supersFull} -> ${supersShort}) — the paired slots must be untouched`);
    }
    checked++;
    if (accShort) {
      failures.push(`${goal}: short session still has a leftover plain Accessory Block (${accShort.exs.length} ex) — expected it fully absorbed into the single superset finisher`);
    }
  } else {
    // build_muscle (and any future non-superset goal): D5 forbids inventing
    // a superset that doesn't exist by design — the Accessory Block just
    // shrinks by exactly one exercise (acc3 dropped).
    checked++;
    if (!accFull || !accShort) {
      failures.push(`${goal}: expected an Accessory Block in both the full and short program`);
    } else if (accFull.exs.length - accShort.exs.length !== 1) {
      failures.push(`${goal}: expected the Accessory Block to shrink by exactly 1 exercise under a short session (acc3 only), got ${accFull.exs.length} -> ${accShort.exs.length}`);
    }
    checked++;
    if (supersShort !== 0) {
      failures.push(`${goal}: a short session invented a superset where none exists by design (D5) — build_muscle must never superset`);
    }
  }
}

console.log(`Duration-branching smoke (EPIC-8b, D28): ${checked} assertions`);
if (failures.length) {
  console.log(`\n${failures.length} FAILURE(S):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('All duration-branching assertions PASS.');
process.exit(0);
