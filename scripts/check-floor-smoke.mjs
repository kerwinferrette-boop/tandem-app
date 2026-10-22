#!/usr/bin/env node
// check-floor-smoke.mjs — the verify suite may not silently shrink.
//
// ORIGIN (BUG-246, 2026-10-15). Merge b6356bf recorded a merge whose tree was byte-identical to its
// first parent, discarding origin/main wholesale: 19 files deleted and 9 of the 55 CHECKS
// registrations in scripts/verify.mjs removed. The next run of `npm run verify` printed
//     ALL 46 CHECKS PASS — safe to ship.
// and exited 0. Nothing objected, because nothing in the suite knew how many checks there were
// supposed to be: `results.length` is whatever survived, so the summary line reports the size of the
// damage as if it were the size of the suite. A gate that shrinks quietly is worse than a missing
// gate, because it keeps printing a green line while covering less every time (same shape as the
// "green gate on a dead value" warning in CLAUDE.md).
//
// WHAT THIS GATE DOES (static — it reads verify.mjs as text; it does not run the suite):
//   [R1] the number of `{ name: ... run: ... }` registrations parsed out of scripts/verify.mjs must
//        be >= the committed floor in scripts/fixtures/verify-check-floor.json;
//   [R2] every script path a registration passes to execFileSync must EXIST on disk — the merge
//        deleted gate SCRIPTS as well as their registrations, and a registration pointing at a
//        deleted file is a check that cannot run;
//   [R3] registration names must be unique — a deleted check replaced by a copy of its neighbour
//        keeps the count up while covering less, which R1 alone would not catch;
//   [R4] canary: fewer than 10 registrations parsed means the parse lost its target (verify.mjs was
//        reformatted and this regex no longer matches), which fails CLOSED rather than reporting a
//        vacuous pass. SC-39: a masked finding is not a fixed one.
//
// ONE HOME for the floor number: this gate and the unconditional assertion inside verify.mjs's own
// driver both read scripts/fixtures/verify-check-floor.json. Nothing hard-codes it. The driver
// assertion is not a duplicate rule — it is what closes the self-referential hole in THIS gate:
// delete this gate's own line from CHECKS and this script never runs, so the driver has to be the
// thing that still fails.
//
// HONEST LIMITS, said plainly:
//   - A floor is a COUNT. It cannot tell a real check from one whose body was gutted into a stub, and
//     it cannot tell whether a check still asserts what its name claims. It catches disappearance,
//     which is the defect BUG-246 names, and nothing more.
//   - R2 proves the file exists, not that it is non-empty or still asserts anything.
//   - Lowering `floor` in the fixture defeats this gate by design. There is no mechanical guard
//     against that — it is a judgment call, reviewable in the diff, and the fixture says so.
//
// Run: node scripts/check-floor-smoke.mjs
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);
const VERIFY = join(scriptsDir, 'verify.mjs');
const FLOOR_FILE = join(scriptsDir, 'fixtures', 'verify-check-floor.json');

const fails = [];

// ── the floor, from its one home ─────────────────────────────────────────
let floor = null;
try {
  const raw = JSON.parse(readFileSync(FLOOR_FILE, 'utf8'));
  if (!Number.isInteger(raw.floor) || raw.floor <= 0) {
    fails.push(`${relative(root, FLOOR_FILE)}: "floor" must be a positive integer, got ${JSON.stringify(raw.floor)}`);
  } else {
    floor = raw.floor;
  }
} catch (err) {
  fails.push(`${relative(root, FLOOR_FILE)}: cannot read or parse the committed floor (${err.message})`);
}

// ── parse the registrations ──────────────────────────────────────────────
const src = readFileSync(VERIFY, 'utf8');
// `run:` is either an arrow (`run: () => ...`) or a bare function reference
// (`run: syntaxCheckIndex`). Both are real registrations; an arrow-only pattern silently
// undercounts by one, which this gate's own canary caught on first run.
const REG = /\{\s*name:\s*(['"`])([\s\S]*?)\1\s*,\s*run:\s*(?:\(\)\s*=>|[A-Za-z_$][\w$]*\s*\})/g;
const names = [];
for (const m of src.matchAll(REG)) names.push(m[2]);

// [R4] canary first: a vacuous pass is the failure mode this whole file exists to prevent.
if (names.length < 10) {
  fails.push(`only ${names.length} check registration(s) parsed out of scripts/verify.mjs — the parse lost its target (expected >= 10). Fix this gate's REG pattern; do NOT lower the floor.`);
}

// [R1] the floor
if (floor !== null && names.length < floor) {
  fails.push(`scripts/verify.mjs registers ${names.length} checks, below the committed floor of ${floor} (${floor - names.length} missing). A check registration was deleted. Restore it — or, if a check was deliberately retired, lower the floor in ${relative(root, FLOOR_FILE)} IN THE SAME COMMIT and say why there.`);
}

// [R2] every registered script must exist
const PATHS = /join\(scriptsDir,\s*(['"`])([^'"`]+)\1\)/g;
let probedPaths = 0;
for (const m of src.matchAll(PATHS)) {
  probedPaths++;
  const p = join(scriptsDir, m[2]);
  if (!existsSync(p)) fails.push(`scripts/verify.mjs registers a check whose script does not exist: scripts/${m[2]}`);
}
if (probedPaths < 10) {
  fails.push(`only ${probedPaths} join(scriptsDir, ...) path(s) parsed — the path scan lost its target (expected >= 10). Fail closed.`);
}

// [R3] no duplicate names
const seen = new Map();
for (const n of names) seen.set(n, (seen.get(n) || 0) + 1);
for (const [n, c] of seen) {
  if (c > 1) fails.push(`check name registered ${c} times (a shrink can hide behind a duplicate): ${n.slice(0, 80)}`);
}

if (fails.length) {
  console.error(`FAIL — ${fails.length} problem(s):`);
  fails.forEach(x => console.error('  ' + x));
  process.exit(1);
}
console.log(`PASS — ${names.length} checks registered (floor ${floor}), all ${probedPaths} registered scripts present, names unique`);
