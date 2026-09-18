#!/usr/bin/env node
/**
 * claims-on-origin.mjs — a Notion status claim needs a commit origin/main actually has.
 *
 * WHY THIS EXISTS (docs/self-corrections.md SC-18; filed 2026-09-17, Kerwin present)
 *
 * BUG-49 and BUG-57's Notion pages (2026-09-08) both described completed, gate-green
 * fixes. Neither fix exists on any remote ref. BUG-49's fix string (`s.name || id`) is
 * absent from every remote branch; BUG-57's buggy filter is still live at
 * tandem.html:2805 on main. The work was done in a working tree that was never
 * committed — a private note (a local commit, or nothing at all) mistaken for a
 * durable one. `scripts/preflight.mjs` already flags UNPUSHED commits in the CURRENT
 * checkout; it has no way to check a CLAIM made in Notion, in a different session,
 * possibly in a working tree that no longer exists.
 *
 * WHAT IT DOES: takes one or more commit shas (arg or --file) and exits non-zero if
 * any of them is NOT an ancestor of origin/main. This is the mechanical form of the
 * rule: "a Notion status of In Fix / code-complete / Resolved must cite a commit sha
 * that `git merge-base --is-ancestor <sha> origin/main` confirms. No sha on origin =
 * the fix does not exist; status stays New/Investigating."
 *
 * Usage:
 *   node scripts/claims-on-origin.mjs <sha> [<sha> ...]
 *   node scripts/claims-on-origin.mjs --file path/to/shas.json   # JSON array of strings
 *   npm run claims:check -- <sha>
 *
 * Exit code: 0 if every sha is an ancestor of origin/main (after a fresh fetch).
 *            1 if any sha is missing, unknown, or not an ancestor.
 *            2 on usage error (no shas given).
 *
 * Honest limit: this only proves the sha is REACHABLE from origin/main — it does not
 * verify the sha's diff actually contains the claimed fix. Pair it with a grep for the
 * specific fix string (as BUG-49/BUG-57's own investigations already did) before
 * writing "Resolved".
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);

function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function usageError(msg) {
  console.error(`claims-on-origin: ${msg}\n`);
  console.error('Usage: node scripts/claims-on-origin.mjs <sha> [<sha> ...]');
  console.error('       node scripts/claims-on-origin.mjs --file path/to/shas.json');
  process.exit(2);
}

const argv = process.argv.slice(2);
if (argv.length === 0) usageError('no commit sha(s) given.');

let shas;
if (argv[0] === '--file') {
  const filePath = argv[1];
  if (!filePath) usageError('--file requires a path.');
  const resolved = join(root, filePath);
  if (!existsSync(resolved)) usageError(`file not found: ${filePath}`);
  const parsed = JSON.parse(readFileSync(resolved, 'utf8'));
  if (!Array.isArray(parsed) || parsed.some(s => typeof s !== 'string')) {
    usageError(`${filePath} must be a JSON array of sha strings.`);
  }
  shas = parsed;
} else {
  shas = argv;
}

if (shas.length === 0) usageError('sha list is empty.');

console.log('\n═══ CLAIMS-ON-ORIGIN — does origin/main actually contain this fix? ═══\n');

// Fresh fetch, not a trust of whatever origin/main happened to be at session start —
// same SC-01 discipline preflight.mjs already applies.
try {
  git('fetch', 'origin', 'main');
} catch (e) {
  console.error(`  Could not fetch origin/main: ${e.message}`);
  process.exit(1);
}

const results = [];
for (const sha of shas) {
  let commitExists = true;
  try {
    git('cat-file', '-e', `${sha}^{commit}`);
  } catch {
    commitExists = false;
  }
  if (!commitExists) {
    results.push({ sha, ok: false, reason: 'not a known commit in this checkout (fetch it first)' });
    continue;
  }
  let isAncestor = false;
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', sha, 'origin/main'], { cwd: root, stdio: 'ignore' });
    isAncestor = true;
  } catch {
    isAncestor = false;
  }
  results.push({ sha, ok: isAncestor, reason: isAncestor ? null : 'not an ancestor of origin/main' });
}

let allOk = true;
for (const r of results) {
  if (r.ok) {
    console.log(`  ✓ ${r.sha}  is on origin/main`);
  } else {
    allOk = false;
    console.log(`  ✗ ${r.sha}  ${r.reason}`);
  }
}

console.log('');
if (allOk) {
  console.log(`  All ${results.length} sha(s) confirmed on origin/main — safe to write the Notion status.\n`);
  process.exit(0);
} else {
  console.log('  At least one claimed sha is NOT on origin/main. Per docs/self-corrections.md SC-18:');
  console.log('  the fix does not exist yet. Do not write In Fix / code-complete / Resolved to Notion');
  console.log('  until every cited sha passes this check.\n');
  process.exit(1);
}
