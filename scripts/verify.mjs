#!/usr/bin/env node
/**
 * verify.mjs — the ship gate.
 *
 * One command that a human, a commit hook, or the morning loop can run to answer
 * a single question: "is the engine still behaving, not just parsing?"
 *
 * A pure code-read (what the morning routine did) can't see this class of bug —
 * the phantom 47.5 prescription and the phantom PR (2026-07-13) were syntactically
 * valid; they only surface when you RUN the engine against adversarial seeded state
 * (a recycled slot-id holding another movement's set, a desynced local mirror).
 * So the gate is behavioral, not just `node --check`.
 *
 * Each check is a subprocess. We run them all (never short-circuit) so one run
 * reports every failure, then exit non-zero if ANY failed. That non-zero exit is
 * the tripwire the loop keys off of.
 *
 * Add a new invariant?  Drop a *-smoke.mjs in scripts/ and add one line to CHECKS.
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);

// ── Syntax gate for the inline app block ────────────────────────────────
// tandem.html is HTML, so `node --check` can't read it directly. Extract the
// single bare <script> block (the app; the others carry a src=) and check that.
function syntaxCheckIndex() {
  const html = readFileSync(join(root, 'tandem.html'), 'utf8');
  const open = html.indexOf('<script>');
  const close = html.indexOf('</script>', open);
  if (open === -1 || close === -1) throw new Error('could not locate inline <script> block in tandem.html');
  const block = html.slice(open + '<script>'.length, close);
  const tmp = join(mkdtempSync(join(tmpdir(), 'tandem-verify-')), 'app-block.js');
  writeFileSync(tmp, block);
  execFileSync('node', ['--check', tmp], { stdio: 'inherit' });
}

const CHECKS = [
  { name: 'syntax: programs.js', run: () => execFileSync('node', ['--check', join(root, 'programs.js')], { stdio: 'inherit' }) },
  { name: 'syntax: tandem.html app block', run: syntaxCheckIndex },
  { name: 'validate:programs (24 combos, Rules 1-5)', run: () => execFileSync('node', [join(scriptsDir, 'validate-programs.mjs')], { stdio: 'inherit' }) },
  { name: 'C7 smoke (calibrated/derived override, startW precedence)', run: () => execFileSync('node', [join(scriptsDir, 'c7-smoke.mjs')], { stdio: 'inherit' }) },
  { name: 'lastsets churn smoke (name-keyed identity, no slot-id inheritance)', run: () => execFileSync('node', [join(scriptsDir, 'lastsets-churn-smoke.mjs')], { stdio: 'inherit' }) },
  { name: 'doctrine conformance (Notion law — see /DOCTRINE.md)', run: () => execFileSync('node', [join(scriptsDir, 'doctrine.mjs')], { stdio: 'inherit' }) },
];

const results = [];
for (const check of CHECKS) {
  process.stdout.write(`\n\u2500\u2500 ${check.name} \u2500\u2500\n`);
  try {
    check.run();
    results.push({ name: check.name, ok: true });
  } catch {
    results.push({ name: check.name, ok: false });
  }
}

const failed = results.filter(r => !r.ok);
console.log('\n\u2550\u2550\u2550 VERIFY SUMMARY \u2550\u2550\u2550');
for (const r of results) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`);
console.log(failed.length === 0
  ? `\nALL ${results.length} CHECKS PASS — safe to ship.`
  : `\n${failed.length}/${results.length} CHECK(S) FAILED — DO NOT SHIP.`);
process.exit(failed.length === 0 ? 0 : 1);
