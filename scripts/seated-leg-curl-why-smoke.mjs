#!/usr/bin/env node
// seated-leg-curl-why-smoke.mjs — BUG-282 (exercise-science ingestion).
//
// The 'seated-leg-curl' EXERCISE_BANK entry's `why` used to claim the seated position
// produces "greater EMG activity than lying leg curl", with no citation for that claim.
// It now carries the long-length rationale from Maeo et al. 2021 (MSSE 53(4):825-837,
// DOI 10.1249/MSS.0000000000002523, PMC7969179), an MRI hypertrophy trial comparing seated
// and lying (prone) leg curls within subjects.
//
// Three assertions, each must hold:
//   [a] the why carries no EMG claim (/EMG/i)
//   [b] the why states the longer-length rationale (/longer length/i)
//   [c] the SOURCE text of the seated-leg-curl entry carries the PMC7969179 citation
//       (a comment, so it is read from source, not from the evaluated object)
//
// Run: node scripts/seated-leg-curl-why-smoke.mjs   (exit 1 on any failure)
// Test hook: SLC_WHY_SRC=<path> points both reads at a copy (used to mutation-test).
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const srcPath = process.env.SLC_WHY_SRC || resolve(here, '../programs.js');
const src = readFileSync(srcPath, 'utf8');
const { EXERCISE_BANK } = vm.runInNewContext(`(function(){ ${src}; return { EXERCISE_BANK }; })()`);

const fails = [];
const e = EXERCISE_BANK['seated-leg-curl'];
if (!e) {
  // Fail closed: a missing entry must not read as a pass.
  console.error('FAIL seated-leg-curl is not in EXERCISE_BANK');
  process.exit(1);
}
const why = String(e.why || '');
if (/EMG/i.test(why)) fails.push(`[a] why still carries an EMG claim: "${why}"`);
if (!/longer length/i.test(why)) fails.push('[b] why does not state the longer-length rationale');

// [c] the entry's own source span: from its key to the first following line indented
// by exactly two spaces (the next bank key, OR a key-level comment above it). Ending at
// the next key alone let a citation placed as a comment above the NEXT entry count for
// this one (independent verifier's mutation M6, 2026-11-23).
const start = src.indexOf("  'seated-leg-curl':{");
if (start < 0) fails.push('[c] could not locate the seated-leg-curl entry in source');
else {
  const rest = src.slice(start + 5);
  const m = rest.match(/\n  (?! )/);
  const span = src.slice(start, m ? start + 5 + m.index : undefined);
  if (!span.includes('PMC7969179')) fails.push('[c] the seated-leg-curl entry does not cite PMC7969179');
}

if (fails.length) {
  for (const f of fails) console.error('FAIL ' + f);
  console.error(`seated-leg-curl why smoke: ${fails.length}/3 assertion(s) FAILED`);
  process.exit(1);
}
console.log('PASS seated-leg-curl why: no EMG claim, long-length rationale, PMC7969179 cited (3/3)');
