#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// PROGRAM SNAPSHOT — a change detector, NOT a correctness gate.
//
// READ THIS BEFORE TRUSTING A GREEN RESULT.
//
// This file answers exactly one question: **did the generated program change,
// and was that change intended?** It cannot tell you whether the program is
// scientifically correct — it has no idea what a good program looks like. A
// green snapshot means "identical to last ship." It does NOT mean "right."
// Correctness lives in scripts/doctrine.mjs (the science) and the outcome gate
// (a real human getting stronger). Do not let this check's green stand in for
// either. Same disclaimer, same reason, as outcome.mjs's header: what gets
// reported is what gets optimized, so the report has to say what it measures.
//
// WHY THIS EXISTS
//
// An LLM Council convened for EPIC-026 Wave 4 recommended rewriting
// buildDynamicProgram IN PLACE — no runtime feature flag — because Tandem has
// exactly two real users. Splitting them across old/new engines drops
// `npm run outcome`'s production sample to n=1, and the two users differ by
// sex, goal and training history, so the split would be perfectly confounded:
// any difference between arms is unattributable. The council made this gate the
// binding precondition of that decision. Without a flag there is no A/B to fall
// back on, so the ONLY protection against an unnoticed behavior change is a
// committed baseline of what the engine emits today.
//
// WHAT IT COVERS
//
// Both generator entry points, over the SAME 630-combo sweep that
// validate:personas uses — imported from scripts/lib/persona-combos.mjs, not
// re-declared here. Two matrices that "happen to match today" drift, and then
// the snapshot silently stops covering combos the matrix checks.
//   - getProgram()          — the public entry point every call site uses
//   - buildDynamicProgram() — the engine Wave 4 rewrites, snapshotted directly
//     so a change that getProgram()'s post-processing happens to mask is still
//     caught at its source.
//
// WHAT IS DELIBERATELY EXCLUDED, and why
//
// `why` and `cues` are copied verbatim from EXERCISE_BANK onto every emitted
// exercise. They are coaching prose, not a generator decision — including them
// would make a typo fix in a bank `why` string fail a gate about program
// STRUCTURE, and would train everyone to run --update reflexively, which is
// how a snapshot gate dies. They are hashed separately as `copyHash` so a copy
// edit is still VISIBLE (and reported) without failing the structural check.
// Everything the engine actually decides — selection, ordering, sets, reps,
// load, block layout, day labels — is in the structural hash.
//
// USAGE
//   node scripts/program-snapshot.mjs            check against the baseline
//   node scripts/program-snapshot.mjs --update   rewrite the baseline (deliberate)
//   node scripts/program-snapshot.mjs --verbose  print every changed combo
//
// WAVE 4 PROTOCOL
//
// A Wave 4 commit with an UNINTENDED snapshot diff fails this gate — that is
// the point. An INTENDED diff (fixing the bugs Wave 4 absorbs: BUG-34, BUG-40,
// BUG-41, BUG-31 — none of which may be fixed separately from Wave 4) must be
// reviewed combo-by-combo and the baseline regenerated with --update IN THE
// SAME COMMIT, with the review written into the commit body. Never silently.
// ═══════════════════════════════════════════════════════

import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { combos, COMBO_COUNT } from './lib/persona-combos.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const BASELINE = join(__dirname, 'snapshots', 'program-snapshot.json');

const UPDATE  = process.argv.includes('--update');
const VERBOSE = process.argv.includes('--verbose');

const code = readFileSync(join(root, 'programs.js'), 'utf8');
const { getProgram, buildDynamicProgram } = vm.runInNewContext(
  `(function() { ${code}; return { getProgram, buildDynamicProgram }; })()`,
  { console: { log() {}, warn() {}, error() {} } },   // generator warns on fallback; not our signal
);
if (typeof getProgram !== 'function' || typeof buildDynamicProgram !== 'function')
  throw new Error('could not extract getProgram/buildDynamicProgram from programs.js');

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

// ── Canonical serialization ─────────────────────────────────────────────────
// Explicit field lists, never JSON.stringify of the raw object: a new field
// added to an exercise should be a DELIBERATE snapshot change (add it here),
// not an accidental 630-combo diff. Field order is fixed, so the string is
// stable across V8 property-order quirks.
const EX_FIELDS = ['id', 'name', 'badge', 'sets', 'w', 'r', 'compound', 'isCore',
                   'cardioOnly', 'unit', 'equipment'];
const COPY_FIELDS = ['why', 'cues'];

const val = (v) => Array.isArray(v) ? v.join('|') : String(v);

function serializeDays(days) {
  const struct = [], copy = [];
  for (const day of days) {
    struct.push(`DAY ${day.key} :: ${day.label} :: ${day.color} :: ${day.rationale}`);
    for (const b of (day.blocks || [])) {
      struct.push(`  BLOCK ${b.label}${b.cardio ? ' [cardio]' : ''}`);
      for (const ex of (b.exs || [])) {
        struct.push('    ' + EX_FIELDS.map(f => `${f}=${val(ex[f])}`).join(' '));
        copy.push(COPY_FIELDS.map(f => `${f}=${val(ex[f])}`).join(' '));
      }
    }
  }
  return { struct: struct.join('\n'), copy: copy.join('\n') };
}

// buildDynamicProgram returns an array, but build5 also hangs `.shouldersArmsDay`
// off it. Snapshot that too — it is a real generator decision and invisible to
// a plain array walk.
function serializeEngine(out) {
  if (!out) return { struct: 'NULL', copy: '' };
  const base = serializeDays(Array.isArray(out) ? out : []);
  const extras = Object.keys(out).filter(k => !/^\d+$/.test(k) && k !== 'length').sort();
  if (!extras.length) return base;
  const parts = [base.struct];
  for (const k of extras) {
    const v = out[k];
    parts.push(`EXTRA ${k}:`);
    parts.push(Array.isArray(v) ? serializeDays(v).struct : JSON.stringify(v));
  }
  return { struct: parts.join('\n'), copy: base.copy };
}

// ── Sweep ───────────────────────────────────────────────────────────────────
const current = {};
const errors = [];
const bodies = new Map(); // combo -> full text, kept only for diffing a change

for (const { combo, args } of combos()) {
  let gp, bd;
  try { gp = getProgram(...args); }          catch (e) { errors.push(`${combo}: getProgram threw ${e}`); continue; }
  try { bd = buildDynamicProgram(...args); } catch (e) { errors.push(`${combo}: buildDynamicProgram threw ${e}`); continue; }
  if (!Array.isArray(gp)) { errors.push(`${combo}: getProgram returned non-array`); continue; }

  const g = serializeDays(gp);
  const b = serializeEngine(bd);
  current[combo] = {
    getProgram:          sha(g.struct),
    buildDynamicProgram: sha(b.struct),
    copyHash:            sha(g.copy),
  };
  bodies.set(combo, { getProgram: g.struct, buildDynamicProgram: b.struct });
}

if (errors.length) {
  console.log('PROGRAM SNAPSHOT — generator errors, cannot snapshot:\n');
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exit(1);
}

const combined = sha(Object.entries(current).sort()
  .map(([k, v]) => `${k} ${v.getProgram} ${v.buildDynamicProgram}`).join('\n'));

const payload = {
  _comment: 'Generated by scripts/program-snapshot.mjs. Do not hand-edit — regenerate with --update as a deliberate, reviewed act. See that file for the Wave 4 protocol.',
  combos: Object.keys(current).length,
  combinedHash: combined,
  perCombo: current,
};

console.log('PROGRAM SNAPSHOT — change detector (NOT a correctness gate)\n');
console.log(`  ${Object.keys(current).length}/${COMBO_COUNT} combos swept · combined hash ${combined}`);

// ── Update mode ─────────────────────────────────────────────────────────────
if (UPDATE) {
  mkdirSync(dirname(BASELINE), { recursive: true });
  const had = existsSync(BASELINE);
  writeFileSync(BASELINE, JSON.stringify(payload, null, 2) + '\n');
  console.log(`\n  baseline ${had ? 'REWRITTEN' : 'CREATED'}: ${BASELINE.replace(root + '/', '')}`);
  console.log('  This is a deliberate act. Explain the diff in the commit body.');
  process.exit(0);
}

// ── Check mode ──────────────────────────────────────────────────────────────
if (!existsSync(BASELINE)) {
  console.log(`\n✗ no baseline at ${BASELINE.replace(root + '/', '')} — create it with:  node scripts/program-snapshot.mjs --update`);
  process.exit(1);
}
const base = JSON.parse(readFileSync(BASELINE, 'utf8'));

if (base.combinedHash === combined && base.combos === Object.keys(current).length) {
  // Copy drift is reported but never fails — see "WHAT IS DELIBERATELY EXCLUDED".
  const copyDrift = Object.keys(current).filter(c => base.perCombo[c]?.copyHash !== current[c].copyHash);
  if (copyDrift.length)
    console.log(`\n  note: coaching copy (why/cues) changed in ${copyDrift.length} combo(s) — structure identical, not a failure.`);
  console.log('\nGenerated program is byte-identical to the committed baseline. ✓');
  process.exit(0);
}

const added   = Object.keys(current).filter(c => !(c in base.perCombo));
const removed = Object.keys(base.perCombo).filter(c => !(c in current));
const changed = Object.keys(current).filter(c =>
  c in base.perCombo && (base.perCombo[c].getProgram !== current[c].getProgram ||
                         base.perCombo[c].buildDynamicProgram !== current[c].buildDynamicProgram));

console.log(`\n✗ PROGRAM OUTPUT CHANGED — baseline ${base.combinedHash} → current ${combined}\n`);
console.log(`  combos changed: ${changed.length} · added: ${added.length} · removed: ${removed.length}`);

const gpOnly = changed.filter(c => base.perCombo[c].buildDynamicProgram === current[c].buildDynamicProgram);
const bdOnly = changed.filter(c => base.perCombo[c].getProgram === current[c].getProgram);
console.log(`  getProgram-only: ${gpOnly.length} · buildDynamicProgram-only: ${bdOnly.length} · both: ${changed.length - gpOnly.length - bdOnly.length}`);

for (const c of (VERBOSE ? changed : changed.slice(0, 10))) console.log(`    ~ ${c}`);
if (!VERBOSE && changed.length > 10) console.log(`    … ${changed.length - 10} more (--verbose for all)`);
for (const c of added)   console.log(`    + ${c} (new combo)`);
for (const c of removed) console.log(`    - ${c} (combo no longer generated)`);

// Show the first structural diff so the reviewer sees WHAT moved, not just that
// something did. A hash alone is not reviewable, and an unreviewable gate gets
// --update'd away.
if (changed.length) {
  const c = changed[0];
  const which = base.perCombo[c].getProgram !== current[c].getProgram ? 'getProgram' : 'buildDynamicProgram';
  console.log(`\n  first diff — ${c} (${which}):`);
  const now = bodies.get(c)[which].split('\n');
  console.log(`    baseline hash ${base.perCombo[c][which]} → current ${current[c][which]}`);
  console.log(`    current output (${now.length} lines; the baseline stores hashes only, so re-run`);
  console.log(`    --update on the previous commit if you need a line-level diff):`);
  for (const line of now.slice(0, 12)) console.log(`      ${line}`);
  if (now.length > 12) console.log(`      … ${now.length - 12} more lines`);
}

console.log('\n  If this change was INTENDED: review it, then regenerate the baseline in the');
console.log('  SAME commit with `node scripts/program-snapshot.mjs --update`, and say in the');
console.log('  commit body what changed and why. If it was NOT intended, this is a bug.');
process.exit(1);
