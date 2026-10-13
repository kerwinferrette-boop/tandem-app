#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// CORE PRESCRIPTION PROVENANCE — a FORM-ONLY gate (BUG-95, plumbing).
//
// WHAT THIS ASSERTS: every core movement declares where its prescription comes from
// (an `rxBasis` tag from a closed vocabulary), and the tag is consistent with the
// movement's unit. That is all.
//
// WHAT THIS DELIBERATELY DOES NOT ASSERT: any numeric rep or seconds band. A band would
// require the exercise science that does not exist (the BUG-95 audit, 2026-08-17: DOCTRINE,
// research-report (8).pdf, the Framework docx/csv, and Notion are all silent on core
// reps), which is the entire reason BUG-95 is still open. The flat default of 10 is
// UNCITED; this gate neither blesses nor constrains it. When Kerwin ratifies values, THAT
// change adds the tag value and the numeric assertions together, with the citation.
//
// A green here means "every core entry says what its prescription is". It does NOT mean
// the prescription is right. Same disclaimer as scripts/program-snapshot.mjs.
//
// Test hook: PROGRAMS_JS=<path> points the gate at a copy of programs.js, so mutation
// tests never touch the working tree (SC-40).
// ═══════════════════════════════════════════════════════
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { combos } from './lib/persona-combos.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const path = process.env.PROGRAMS_JS || join(root, 'programs.js');
const code = readFileSync(path, 'utf8');

const failures = [];
let checked = 0;
const fail = (m) => failures.push(m);
const ok = (cond, m) => { checked++; if (!cond) fail(m); };

const api = vm.runInNewContext(
  `(function(){ ${code}; return { EXERCISE_BANK, RX_BASES, prescriptionBasis, defaultPrescription, getProgram, buildDynamicProgram }; })()`,
  { console: { log() {}, warn() {}, error() {} } });
const { EXERCISE_BANK, RX_BASES, prescriptionBasis, defaultPrescription, getProgram, buildDynamicProgram } = api;

ok(Array.isArray(RX_BASES) && RX_BASES.length > 0, 'RX_BASES vocabulary is missing');
ok(typeof prescriptionBasis === 'function', 'prescriptionBasis() is missing');
// Provenance, not value: no tag may smuggle a number in.
for (const t of RX_BASES) ok(!/\d/.test(t), `RX_BASES tag "${t}" contains a digit - a tag names a provenance, never a value`);

// (1) Every bank core entry declares a tag from the vocabulary, consistent with its unit.
const bankCore = Object.entries(EXERCISE_BANK).filter(([, e]) => e && e.category === 'core');
ok(bankCore.length > 0, 'found no core entries in EXERCISE_BANK');
for (const [key, e] of bankCore) {
  ok(RX_BASES.includes(e.rxBasis), `bank core entry "${key}" (${e.name}) declares no valid rxBasis (got ${JSON.stringify(e.rxBasis)})`);
  if (e.unit === 'sec') ok(e.rxBasis === 'authored-secs-uncited', `bank core entry "${key}" is timed (unit:'sec') but its rxBasis is ${JSON.stringify(e.rxBasis)}`);
  else ok(e.rxBasis === 'flat-default-uncited', `bank core entry "${key}" is rep-based but its rxBasis is ${JSON.stringify(e.rxBasis)}`);
  ok(!('reps' in e), `bank core entry "${key}" declares a numeric reps key - values are not authorable by the plumbing (BUG-95)`);
}
// The tag belongs to core only.
for (const [key, e] of Object.entries(EXERCISE_BANK)) {
  if (e && e.category !== 'core') ok(!('rxBasis' in e), `non-core bank entry "${key}" carries rxBasis`);
}

// (2) Every static authored core literal (isCore:true) declares the legacy tag, in the source.
const staticLines = code.split('\n').map((l, i) => ({ l: l.replace(/\/\/.*$/, ''), n: i + 1 }))
  .filter(x => /\bisCore\s*:\s*true\b/.test(x.l));
ok(staticLines.length > 0, 'found no static isCore:true literals');
for (const { l, n } of staticLines) {
  ok(/\brxBasis\s*:\s*'legacy-static-uncited'/.test(l), `programs.js:${n} static core entry declares no rxBasis:'legacy-static-uncited'`);
  ok(/\br\s*:\s*\d+/.test(l) && /\bunit\s*:\s*'(reps|sec)'/.test(l), `programs.js:${n} static core entry does not declare its own r and unit`);
}

// (3) Fallback contract: a tagless entry keeps the EXISTING behaviour (flat default / own secs).
ok(prescriptionBasis({ unit: 'reps' }) === 'flat-default-uncited', 'tagless rep-based entry did not fall back to flat-default-uncited');
ok(prescriptionBasis({ unit: 'sec', secs: 30 }) === 'authored-secs-uncited', 'tagless timed entry did not fall back to authored-secs-uncited');
ok(prescriptionBasis(null) === 'flat-default-uncited', 'null entry did not fall back');

// (4) Reach: every core movement either generator EMITS across the persona matrix resolves to a
// tagged bank core entry (so "every core entry" includes the ones users actually receive).
const bankByName = new Map(bankCore.map(([, e]) => [e.name, e]));
const emitted = new Set();
for (const { args } of combos()) {
  for (const fn of [getProgram, buildDynamicProgram]) {
    for (const day of (fn(...args) || [])) for (const b of day.blocks || []) for (const e of b.exs || []) {
      if (e && e.isCore) emitted.add(e.name);
    }
  }
}
ok(emitted.size > 0, 'the matrix emitted no core movements');
for (const name of emitted) ok(bankByName.has(name) && RX_BASES.includes(bankByName.get(name).rxBasis),
  `generator emitted core movement "${name}" that has no tagged bank core entry`);

if (failures.length) {
  console.error(`FAIL core-rx-provenance: ${failures.length} of ${checked} assertions failed`);
  for (const f of failures.slice(0, 20)) console.error('  - ' + f);
  if (failures.length > 20) console.error(`  ... and ${failures.length - 20} more`);
  process.exit(1);
}
console.log(`PASS core-rx-provenance: ${checked} assertions - ${bankCore.length} bank core entries + ${staticLines.length} static core literals declare a prescription basis; ${emitted.size} emitted movements all resolve to a tagged entry (form only, no numeric band)`);
