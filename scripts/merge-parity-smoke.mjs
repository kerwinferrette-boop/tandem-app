#!/usr/bin/env node
/**
 * merge-parity-smoke.mjs — a merge may not quietly drop what either parent had.
 *
 * ORIGIN (BUG-246, the PRIMARY mechanism). Merge b6356bf recorded a merge whose tree was
 * byte-identical to its FIRST parent, discarding origin/main's 18 commits while reporting them as
 * merged: 19 files gone, 9 of 55 verify registrations gone, and `npm run verify` then printed
 * `ALL 46 CHECKS PASS`, exit 0, with nothing objecting.
 *
 * WHY THIS CHECK AND NOT THE COUNT FLOOR. 393ad10 shipped a committed check-count floor
 * (scripts/check-floor-smoke.mjs). That is the SECONDARY mechanism, and the BUG-246 row said so
 * before it was built: a guard whose reference data is a FILE IN THE TREE is defeated by the same
 * stroke that deletes what it guards — a `-s ours` merge reverts the floor fixture and the
 * registrations together, leaving a self-consistent smaller suite with a matching smaller floor and
 * nothing that knows it used to be bigger. This check compares against the PARENT COMMITS' TREES,
 * which live in append-only git history. A merge cannot revert its own parents, so it cannot fake
 * parity. That is the whole point, and it is the only part of this that a tree-level revert cannot
 * reach into and make consistent.
 *
 * RULES (all read the commit graph; the only file read is the allowlist):
 *   [R1] For every merge commit reachable from HEAD: no path present in ANY parent may be absent
 *        from the merge result — unless the commit body names that path, or the merge is allowlisted
 *        with a reason.
 *   [R2] Same for the SUITE'S MEMBERSHIP: no check name registered in any parent's
 *        scripts/verify.mjs may be absent from the merge result's. This is the assertion that would
 *        have caught the nine dropped registrations at the moment b6356bf landed, independently of
 *        R1 catching the nine deleted script files.
 *   [R3] Allowlist hygiene, so an exception cannot rot into a blanket: every entry must name a real
 *        merge commit, must STILL be an offender (a stale entry fails, like the BUG-218 fallback
 *        baseline and the BUG-234 contradiction set), and must carry a non-empty reason.
 *   [R4] Canary — fail CLOSED. If git cannot be read, if zero merge commits are found, or if the
 *        allowlist is missing or unparseable, this FAILS rather than reporting a vacuous pass.
 *        Deleting the allowlist buys a red run, not a green one.
 *
 * HONEST LIMITS, stated rather than discovered later:
 *   - PRESENCE ONLY, for paths and for check names. A merge that quietly reverts the CONTENT of a
 *     file that still exists passes this check. That is not hypothetical: the same b6356bf took
 *     `rxBasis` in programs.js from 107 matching lines to 0, and this gate would not have seen it.
 *     Content-level revert detection across a merge is a different and harder instrument and is NOT
 *     covered here.
 *   - A RENAME shows up as a missing old path. That is the expected false-positive class; name the
 *     path in the commit body, or allowlist the merge with the reason.
 *   - This script lives in the tree it guards. A revert that deletes THIS FILE stops it running, and
 *     a revert older than this file cannot be caught retroactively. What the graph buys is that the
 *     reference data cannot be reverted — not that the gate is immortal. Said plainly because
 *     overselling a guard is the failure BUG-246 is about.
 *   - It inspects merges reachable from HEAD only, so it says nothing about branches never merged.
 *
 * Run: node scripts/merge-parity-smoke.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);
const ALLOWLIST = join(scriptsDir, 'fixtures', 'merge-parity-allowlist.json');

const fails = [];
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });

// ── [R4] the allowlist, and failing closed without it ───────────────────
let allow = null;
try {
  const raw = JSON.parse(readFileSync(ALLOWLIST, 'utf8'));
  if (!raw || typeof raw.allow !== 'object' || raw.allow === null) throw new Error('missing an "allow" object');
  allow = raw.allow;
} catch (err) {
  console.error(`FAIL — cannot read ${relative(root, ALLOWLIST)}: ${err.message}`);
  console.error('      That file records the cited historical exceptions. Restore it; deleting it does not');
  console.error('      produce a green run, by design — this gate fails closed without it.');
  process.exit(1);
}

// ── the graph ────────────────────────────────────────────────────────────
let merges;
try {
  merges = git('rev-list', '--merges', 'HEAD').trim().split('\n').filter(Boolean);
} catch (err) {
  console.error(`FAIL — cannot read the commit graph: ${err.message}`);
  process.exit(1);
}
if (!merges.length) {
  console.error('FAIL — zero merge commits reachable from HEAD. Either this is not the Tandem history or');
  console.error('      the graph read lost its target. Failing closed rather than reporting a vacuous pass.');
  process.exit(1);
}

const pathsOf = (ref) => new Set(git('ls-tree', '-r', '--name-only', ref).trim().split('\n').filter(Boolean));
// KEYED ON THE REGISTERED SCRIPT BASENAME, deliberately — not on the check's prose name.
// Measured over this history before choosing: keying on the `name:` string reports 6 offenders, 5 of
// which are pure PROSE EDITS to a label that was never removed ('SC-33 column reachability' ->
// 'SC-34 …', 'validate:programs (24 combos, Rules 1-5)' -> '(Rules 1-5, all day-counts 2-6)', and
// three more). A gate that goes red whenever someone rewords a check's description teaches people to
// allowlist reflexively, which is how an exception list rots into a blanket. The basename is what
// actually identifies a check, it is stable under rewording, and it is the same instrument the
// BUG-246 row's own 2026-10-18 checkpoint used ("distinct .mjs basenames referenced by
// scripts/verify.mjs: 55 at 15bc1cc, 46 at origin/main"). Under this key the same history yields
// exactly ONE offender: b6356bf, dropping exactly its 9 registrations.
const REG = /join\(scriptsDir,\s*(['"`])([^'"`]+)\1\)/g;
const checkNamesOf = (ref) => {
  let src;
  // stderr ignored: for refs predating scripts/verify.mjs, `git show` writes a 'path exists on disk,
  // but not in <ref>' fatal that is an expected miss here, not a problem to surface.
  try { src = execFileSync('git', ['-C', root, 'show', `${ref}:scripts/verify.mjs`], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['pipe', 'pipe', 'ignore'] }); }
  catch { return null; }
  return new Set([...src.matchAll(REG)].map(m => m[2]));
};

const offenders = new Set();
let scanned = 0, namePairsCompared = 0, maxNamesInAnyRef = 0;

for (const sha of merges) {
  const parents = git('rev-list', '--parents', '-n', '1', sha).trim().split(/\s+/).slice(1);
  if (parents.length < 2) continue;
  scanned++;
  const body = git('log', '-1', '--format=%B', sha);
  const entry = allow[sha];

  // [R1] path presence
  const result = pathsOf(sha);
  const missing = [];
  for (const p of parents) for (const f of pathsOf(p)) if (!result.has(f)) missing.push(f);
  const uniqMissing = [...new Set(missing)].filter(f => !body.includes(f));

  // [R2] suite membership
  const resultNames = checkNamesOf(sha);
  const lostNames = [];
  if (resultNames) {
    maxNamesInAnyRef = Math.max(maxNamesInAnyRef, resultNames.size);
    for (const p of parents) {
      const pn = checkNamesOf(p);
      if (!pn) continue;
      namePairsCompared++;
      maxNamesInAnyRef = Math.max(maxNamesInAnyRef, pn.size);
      for (const n of pn) if (!resultNames.has(n)) lostNames.push(n);
    }
  }
  const uniqLostNames = [...new Set(lostNames)];

  if (uniqMissing.length || uniqLostNames.length) {
    offenders.add(sha);
    if (!entry) {
      const subject = git('log', '-1', '--format=%s', sha).trim().slice(0, 70);
      if (uniqMissing.length) {
        fails.push(`merge ${sha.slice(0, 7)} (${subject}) drops ${uniqMissing.length} path(s) present in a parent and names none of them in its body:\n        ` +
          uniqMissing.slice(0, 12).join('\n        ') + (uniqMissing.length > 12 ? `\n        … ${uniqMissing.length - 12} more` : ''));
      }
      if (uniqLostNames.length) {
        fails.push(`merge ${sha.slice(0, 7)} (${subject}) drops ${uniqLostNames.length} registered verify check script(s) present in a parent:\n        ` +
          uniqLostNames.slice(0, 12).join('\n        ') + (uniqLostNames.length > 12 ? `\n        … ${uniqLostNames.length - 12} more` : ''));
      }
      fails.push(`  ^ if that loss was deliberate, name the paths in the merge commit body, or add ${sha.slice(0, 7)} to ${relative(root, ALLOWLIST)} with a reason IN THE SAME COMMIT.`);
    }
  }
}

// [R3] allowlist hygiene — a stale exception is a hole
for (const [sha, entry] of Object.entries(allow)) {
  let type = null;
  try { type = git('cat-file', '-t', sha).trim(); } catch { /* unknown object */ }
  if (type !== 'commit') {
    fails.push(`${relative(root, ALLOWLIST)}: "${sha.slice(0, 12)}…" is not a commit in this repository — a typo or a fabricated sha, not an exception.`);
    continue;
  }
  if (!entry || typeof entry.reason !== 'string' || !entry.reason.trim()) {
    fails.push(`${relative(root, ALLOWLIST)}: ${sha.slice(0, 7)} carries no reason. An exception without a written reason is a blanket.`);
  }
  if (!offenders.has(sha)) {
    fails.push(`${relative(root, ALLOWLIST)}: ${sha.slice(0, 7)} is allowlisted but is no longer an offender — remove the entry (stale exceptions quietly widen the gate).`);
  }
}

// [R4] canary on R2. TWO conditions, because the first one alone is not enough and a mutation test
// proved it: counting only the PAIRS COMPARED passes with a registration pattern that matches
// nothing, since every comparison is then empty-set against empty-set and reports no loss. A canary
// that cannot tell "parsed nothing" from "lost nothing" masks the very failure it exists to catch
// (SC-39). So assert the parse actually resolved registrations somewhere, too.
if (namePairsCompared === 0) {
  fails.push('no parent/result pair of scripts/verify.mjs was ever compared — R2 asserted nothing. The path lost its target; failing closed.');
}
if (maxNamesInAnyRef < 10) {
  fails.push(`the registration parse resolved at most ${maxNamesInAnyRef} registered script(s) in any single ref (expected >= 10) — REG has lost its target, so R2 compared empty sets and proved nothing. Fix the pattern; do NOT allowlist around this.`);
}

if (fails.length) {
  console.error(`FAIL — ${fails.length} problem(s):`);
  fails.forEach(f => console.error('  ' + f));
  process.exit(1);
}
console.log(`PASS — ${scanned} merge commits checked against their parents' trees (${namePairsCompared} verify.mjs parent/result comparisons, up to ${maxNamesInAnyRef} registrations parsed per ref); ` +
            `${Object.keys(allow).length} cited historical exception(s), all still offenders; no undeclared path or check-registration loss`);
