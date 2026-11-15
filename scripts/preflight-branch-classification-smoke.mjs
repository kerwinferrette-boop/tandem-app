#!/usr/bin/env node
/**
 * preflight-branch-classification-smoke.mjs — BUG-241 guard.
 *
 * WHY: scripts/preflight.mjs sorted every remote branch into "merged" (an ancestor of
 * origin/main) or "UNMERGED — real unmerged work". A branch that is AHEAD of main but whose
 * tree is byte-identical to main's carries zero content, yet it was reported under the same
 * banner as genuine unmerged work: the exact loss pattern this project has paid for twice,
 * raised as a false alarm, which teaches readers to scroll past the real one.
 *
 * HOW: builds a throwaway repo in a temp dir (never this working tree) with a bare "origin"
 * holding main plus three fixture branches, copies the WORKING-TREE scripts/preflight.mjs into
 * it, runs it, and reads its output:
 *   content   — ahead of main, tree differs        → must be counted UNMERGED and listed
 *   identical — ahead of main, tree equals main's  → must NOT be counted UNMERGED; listed
 *                                                    as tree-identical with the shared tree
 *   merged    — an ancestor of main                → merged, as before
 * Tree equality is the only test (`<ref>^{tree}` vs `origin/main^{tree}`), never a subject line.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const tmp = mkdtempSync(join(tmpdir(), 'preflight-smoke-'));
const env = { ...process.env, GIT_AUTHOR_NAME: 'smoke', GIT_AUTHOR_EMAIL: 'smoke@example.invalid',
  GIT_COMMITTER_NAME: 'smoke', GIT_COMMITTER_EMAIL: 'smoke@example.invalid', GIT_CONFIG_NOSYSTEM: '1', HOME: tmp };
const g = (cwd, ...a) => execFileSync('git', a, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const fails = [];
try {
  const origin = join(tmp, 'origin.git'), work = join(tmp, 'work');
  g(tmp, 'init', '-q', '--bare', '-b', 'main', origin);
  g(tmp, 'clone', '-q', origin, work);
  g(work, 'checkout', '-q', '-b', 'main');
  writeFileSync(join(work, 'a.txt'), 'one\n'); g(work, 'add', '.'); g(work, 'commit', '-q', '-m', 'base');
  g(work, 'branch', 'merged-fixture');                                   // ancestor of main
  writeFileSync(join(work, 'a.txt'), 'two\n'); g(work, 'commit', '-q', '-am', 'main advances');
  g(work, 'push', '-q', 'origin', 'main', 'merged-fixture');
  g(work, 'checkout', '-q', '-b', 'identical-fixture');
  g(work, 'commit', '-q', '--allow-empty', '-m', 'restore everything (subject says content, tree says none)');
  g(work, 'push', '-q', 'origin', 'identical-fixture');
  g(work, 'checkout', '-q', '-b', 'content-fixture', 'main');
  writeFileSync(join(work, 'b.txt'), 'real work\n'); g(work, 'add', '.'); g(work, 'commit', '-q', '-m', 'real work');
  g(work, 'push', '-q', 'origin', 'content-fixture');
  g(work, 'checkout', '-q', 'main');
  g(work, 'fetch', '-q', 'origin');
  const mainTree = g(work, 'rev-parse', 'origin/main^{tree}');

  mkdirSync(join(work, 'scripts'));
  copyFileSync(join(root, 'scripts', 'preflight.mjs'), join(work, 'scripts', 'preflight.mjs'));
  const out = execFileSync('node', [join(work, 'scripts', 'preflight.mjs'), '--branches'],
    { cwd: work, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

  const triage = (out.match(/branch triage — ([^\n]+)/) || [])[1] || '';
  const unmergedN = Number((triage.match(/(\d+) UNMERGED/) || [])[1]);
  const banner = (out.match(/remote branch\(es\) carry commits NOT on main[\s\S]*?Check these before/) || [''])[0];
  if (!triage) fails.push('no "branch triage" line in preflight output');
  if (unmergedN !== 1) fails.push(`expected exactly 1 UNMERGED (content-fixture), triage says: "${triage}"`);
  if (!banner.includes('content-fixture')) fails.push('content-fixture is not listed under the unmerged-work banner');
  if (banner.includes('identical-fixture')) fails.push('identical-fixture (tree-identical to main) is listed as real unmerged work');
  if (banner.includes('merged-fixture')) fails.push('merged-fixture (an ancestor of main) is listed as unmerged');
  const identLine = out.split('\n').find(l => l.includes('identical-fixture')) || '';
  if (!identLine) fails.push('identical-fixture is not reported at all (it should be listed as tree-identical)');
  else if (!identLine.includes(mainTree.slice(0, 7))) fails.push(`identical-fixture line does not show the shared tree ${mainTree.slice(0, 7)}: "${identLine.trim()}"`);
  if (!/tree-identical/.test(triage)) fails.push(`triage line does not count tree-identical branches: "${triage}"`);
} catch (e) {
  fails.push(`harness error: ${String(e && e.message || e).split('\n')[0]}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log('PREFLIGHT BRANCH CLASSIFICATION (BUG-241): content-bearing vs tree-identical vs merged, in a throwaway repo');
if (fails.length) { console.log(`FAIL — ${fails.length} problem(s):`); fails.forEach(f => console.log('  ' + f)); process.exit(1); }
console.log('PASS — only the content-bearing branch is counted UNMERGED; the tree-identical one is listed as informational with its tree.');
