#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// d6b-mutation-smoke.mjs — BUG-233: does D6b's MEV-floor gate have teeth?
//
// D6b (DOCTRINE.md row D6b; scripts/doctrine.mjs block "D6b (ACTIVE, MEV floor)") asserts
// every major muscle token meets its goal's cited MEV floor (build_muscle 10, fat_burn 8,
// transform 10 sets/muscle/wk; strength/maintenance per VOLUME_LANDMARKS) across goal x
// day-count x sex at full_gym. It had no mutation record, and BUG-231 raised the question
// whether that green was partly BECAUSE the allocator was free to stack one lift.
//
// METHOD (loader-override route; no carve-out needed, programs.js is NEVER edited):
// for each mutation, apply ONE string substitution to an IN-MEMORY copy of programs.js,
// write that copy under os.tmpdir(), and run the REAL gate (scripts/doctrine.mjs) against
// it via TANDEM_DOCTRINE_PROGRAMS_JS. The override makes doctrine.mjs exit 3 even when
// clean, so it can never be mistaken for a pass. Per SC-45 every substitution is asserted
// to have LANDED (anchor found exactly once, text changed) before its result is read.
// Per SC-38 each mutation is judged on its own; nothing is batched.
//
// EXPECTATIONS ARE PINNED BOTH WAYS. A "caught" mutation must make D6b report at least one
// violation; a "survives" mutation must make D6b report none. The survivors are documented
// blind spots, pinned so the record cannot silently rot: if D6b ever starts catching one,
// this script fails and the record below must be updated by a human, not auto-accepted.
//
// MUTATION RECORD (measured on origin/main f47b259, 2026-10-24):
//   BASE   unmutated copy through the override       => D6b 0 violations, exit 3 (override). Pipeline neutral.
//   M-A    delete the per-exercise cap test in fits() (`capped && s.sets >= PER_EXERCISE_SET_CEILING`)
//          => D6b 0 violations: SURVIVES. D6b is a pure FLOOR gate and is INSENSITIVE to
//          stacking; removing the cap only makes floors easier to reach. That is by design
//          (D35 / per-exercise-cap-smoke own the spread rule) but it means D6b's green says
//          nothing about distribution. Stated plainly rather than treated as reassurance.
//   M-C    raise PER_EXERCISE_SET_CEILING to 11 (cap inert, pre-BUG-231 stacking freedom)
//          => D6b 0 violations: SURVIVES. D6b's green does NOT depend on BUG-231 either way.
//   M-D    collapse the MEV raise loop's two-pass sweep to the capped pass only (`[true]`),
//          i.e. stacked allocation broken so the floor can no longer override the plateau cap
//          => D6b FAILS (below-MEV cells appear). This is the mutation the row asks for:
//          D6b fails when stacked allocation is broken.
//   M-E    disable the MEV raise loop outright (`< landmark.mev` -> `< 0`, first occurrence)
//          => D6b FAILS across many cells. The floor assertion is live.
//   M-B    computeMuscleWeeklyVolume returns one credit short for one token (pec_major; the
//          tokens are MAJOR_MUSCLE_GROUP_TOKENS, there is no 'chest' token — a first draft
//          mutated 'chest', matched nothing, and read as a false survivor; SC-45's shape)
//          => D6b FAILS naming pec_major. The assertion is live, not dead.
//   Gate counts differ run to run for M-E (111 vs 116 seen across two runs) — the generator is
//   not bit-stable under that mutation — so only caught/silent is pinned, never a tally.
//
// WHAT THIS DOES NOT PROVE (stated, not implied away): D6b stays silent on M-A and M-C, so a
// regression that re-introduces unbounded stacking is invisible to D6b by construction. That
// is owned by D35 / scripts/per-exercise-cap-smoke.mjs (under M-A the doctrine gate as a whole did
// exit 1 with zero D6b lines, so some OTHER invariant noticed — not D6b). Do not add a distribution assertion to D6b: it would be
// a second home for D35's rule.
// ═══════════════════════════════════════════════════════
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { execFile } from 'child_process';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);
const pristine = readFileSync(join(root, 'programs.js'), 'utf8');
const work = mkdtempSync(join(tmpdir(), 'd6b-mut-'));

const MUTATIONS = [
  { id: 'BASE', desc: 'unmutated copy (override pipeline must be neutral)', expect: 'clean', apply: s => s },
  {
    id: 'M-A', desc: 'delete the per-exercise cap test in fits()', expect: 'survives',
    anchor: "      if (capped && s.sets >= PER_EXERCISE_SET_CEILING) return false;\n",
    to: '',
  },
  {
    id: 'M-C', desc: 'raise PER_EXERCISE_SET_CEILING to 11 (cap inert)', expect: 'survives',
    anchor: 'const PER_EXERCISE_SET_CEILING = 6;', to: 'const PER_EXERCISE_SET_CEILING = 11;',
  },
  {
    id: 'M-D', desc: 'MEV raise loop sweeps only the capped pass (floor can no longer override the cap)', expect: 'caught',
    anchor: '    for (const capped of [true, false]) {\n      for (const compound of [true, false]) {\n        for (const t of MAJOR_MUSCLE_GROUP_TOKENS) {\n          while ((weekly[t] || 0) < landmark.mev) {\n            const pool = slots.filter(s => s.compound === compound && !s.fixed && s.mevW[t] && fits(s, t, capped));',
    to: '    for (const capped of [true]) {\n      for (const compound of [true, false]) {\n        for (const t of MAJOR_MUSCLE_GROUP_TOKENS) {\n          while ((weekly[t] || 0) < landmark.mev) {\n            const pool = slots.filter(s => s.compound === compound && !s.fixed && s.mevW[t] && fits(s, t, capped));',
  },
  {
    id: 'M-E', desc: 'disable the MEV raise loop outright (first `< landmark.mev` while-condition)', expect: 'caught',
    anchor: '          while ((weekly[t] || 0) < landmark.mev) {\n            const pool = slots.filter(s => s.compound === compound && !s.fixed && s.mevW[t] && fits(s, t, capped));',
    to: '          while ((weekly[t] || 0) < 0) {\n            const pool = slots.filter(s => s.compound === compound && !s.fixed && s.mevW[t] && fits(s, t, capped));',
  },
  {
    id: 'M-B', desc: 'computeMuscleWeeklyVolume returns one credit short for the pec_major token', expect: 'MB',
    anchor: '        for (const m of entry.muscleGroups.secondary || []) totals[m] = (totals[m] || 0) + sets * 0.5;\n      }\n    }\n  }\n  return totals;\n}',
    to: '        for (const m of entry.muscleGroups.secondary || []) totals[m] = (totals[m] || 0) + sets * 0.5;\n      }\n    }\n  }\n  { const k = Object.keys(totals).find(t => t === \'pec_major\' || t.startsWith(\'pec_major_\')); if (k) totals[k] -= 1; }\n  return totals;\n}',
  },
];

function runGate(file) {
  return new Promise(resolve => {
    execFile('node', [join(scriptsDir, 'doctrine.mjs')], {
      env: { ...process.env, TANDEM_DOCTRINE_PROGRAMS_JS: file },
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    }, (err, stdout, stderr) => {
      const out = (stdout || '') + (stderr || '');
      resolve({ status: err ? (typeof err.code === 'number' ? err.code : 1) : 0, out,
        d6b: out.split('\n').filter(l => /^\s*✗ D6b:/.test(l)) });
    });
  });
}

const problems = [];
const report = [];
try {
  // Each mutation is still judged ON ITS OWN against its own temp copy (SC-38); they only run
  // concurrently for wall-clock, results are reported in declaration order.
  const prepared = [];
  for (const m of MUTATIONS) {
    let text = pristine;
    if (m.anchor !== undefined) {
      // SC-45: prove the mutation LANDED before reading any result.
      const hits = typeof m.anchor === 'string' ? text.split(m.anchor).length - 1 : (text.match(new RegExp(m.anchor.source, 'g')) || []).length;
      if (hits !== 1) { problems.push(`${m.id}: anchor matched ${hits} times (need exactly 1) — mutation did not land, result would be meaningless`); continue; }
      text = typeof m.anchor === 'string' ? text.replace(m.anchor, () => m.to) : text.replace(m.anchor, m.to);
      if (text === pristine) { problems.push(`${m.id}: mutated text identical to pristine — mutation did not land`); continue; }
    }
    const file = join(work, `programs.${m.id}.js`);
    writeFileSync(file, text);
    prepared.push({ m, p: runGate(file) });
  }
  for (const { m, p } of prepared) {
    const g = await p;
    if (!g.out.includes('ENGINE OVERRIDE ACTIVE')) { problems.push(`${m.id}: gate did not report the override — it ran the real engine, result meaningless`); continue; }
    if (g.status === 0) { problems.push(`${m.id}: override run exited 0 — the override may never yield a pass`); continue; }
    report.push(`  ${m.id.padEnd(5)} ${String(g.d6b.length).padStart(3)} D6b violation(s), gate exit ${g.status}  — ${m.desc}`);
    if (m.expect === 'clean' || m.expect === 'survives') {
      if (g.d6b.length !== 0) problems.push(`${m.id}: expected D6b to stay silent (${m.expect}) but it reported ${g.d6b.length}: ${g.d6b[0]}`);
      if (m.expect === 'clean' && g.status !== 3) problems.push(`${m.id}: clean override run should exit 3, got ${g.status}`);
    } else if (m.expect === 'caught') {
      if (g.d6b.length === 0) problems.push(`${m.id}: D6b did NOT fail — this mutation (${m.desc}) is a surviving mutant; the gate has no teeth against it`);
    } else if (m.expect === 'MB') {
      const named = g.d6b.filter(l => /'pec_major'/.test(l));
      if (named.length === 0) problems.push(`${m.id}: D6b did not fail naming 'pec_major' (reported ${g.d6b.length} D6b line(s))`);
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log('D6b mutation record (each mutation run on its own against a temp COPY of programs.js):');
for (const l of report) console.log(l);
if (problems.length) {
  console.log(`\nD6b MUTATION SMOKE FAILED:`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log('\nD6b mutation smoke OK — the MEV gate fails when stacked allocation is broken; documented survivors still survive.');
