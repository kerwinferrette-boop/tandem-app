#!/usr/bin/env node
/**
 * preflight.mjs — WHERE CAN WORK BE HIDING? Run automatically at every session start.
 *
 * WHY THIS EXISTS (Kerwin, 2026-08-28: "how do we fix that protocol")
 *
 * On 2026-08-18 a session concluded that workflow `w3q60pnhf`'s output was lost, and
 * rebuilt BUG-87 from scratch. A later session found the work intact, sitting
 * uncommitted in `.claude/worktrees/wf_026b87a8-f9d-2` and `-3` — exactly where
 * `isolation: 'worktree'` agents are supposed to leave it. Nothing was destroyed.
 * BUG-87 simply got fixed twice, independently and identically, and one copy was
 * thrown away. (docs/WAVE-STATE.md:80-110 records both the claim and its retraction.)
 *
 * The mechanical bug is small and precise: **`git log` answers "what is committed on
 * this ref", and it was used to answer "does this work exist."** Those are different
 * questions. The first has a blind spot shaped exactly like the place the work was.
 *
 * The protocol bug is the interesting one. The rule was ALREADY WRITTEN DOWN, in the
 * right file, in imperative language — docs/WAVE-STATE.md:109 says verbatim "Whoever
 * resumes a workflow-launched wave: run `git worktree list` FIRST." It was skipped
 * anyway. So the fix cannot be "write the rule down better"; writing it down is the
 * thing that already failed. Prose in a document does not execute. This script does,
 * and .claude/hooks/session-start.sh runs it before the session can decide to skip it.
 *
 * This is the same lesson as docs/2026-08-17-why-56-cycles-missed-it.md: the council
 * rejected "the agent should try harder" as a diagnosis because a character flaw is
 * unfalsifiable and lets the machinery off the hook. An agent optimizes what is
 * measurable. Make the check machinery, not a reminder.
 *
 * WHAT IT DOES: enumerates every location work can exist in, and PRINTS THE LIST OF
 * PLACES IT LOOKED. That second part is load-bearing — it means a future "the work is
 * lost" claim has to cite a complete search rather than one `git log`. Absence of
 * evidence in one place is not evidence of absence, and this project has now paid for
 * that lesson twice (EPIC-031, then BUG-87).
 *
 * EXIT CODE: always 0. This runs as a SessionStart hook and must never block a session
 * from starting. It informs; scripts/session-close.mjs is the one that fails loud.
 *
 * Usage: node scripts/preflight.mjs [--deep]
 *   --deep  also run `git fsck --lost-found` (slow; for when something is genuinely missing)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);
const DEEP = process.argv.includes('--deep');

/** Run a git command, returning trimmed stdout or null if it fails. Never throws. */
function git(...args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

const looked = [];   // every place we checked — printed even when empty
const flags = [];    // things that need a human/agent decision

function checked(where, detail) { looked.push(detail ? `${where} — ${detail}` : where); }
function flag(msg) { flags.push(msg); }

console.log('\n═══ PREFLIGHT — where can work be hiding? ═══\n');

// ── 1. Sibling worktrees. THE ONE THAT WAS MISSED on 2026-08-18. ────────────────
const wt = git('worktree', 'list');
const wtLines = wt ? wt.split('\n').filter(Boolean) : [];
checked('git worktree list', `${wtLines.length} worktree(s)`);
if (wtLines.length > 1) {
  flag(`${wtLines.length - 1} EXTRA WORKTREE(S) — this is the BUG-87 double-work trap.\n` +
       wtLines.slice(1).map(l => `        ${l}`).join('\n') +
       `\n        Work in a worktree is INVISIBLE to \`git log\` in this checkout.\n` +
       `        Inspect each before concluding anything is missing or unstarted:\n` +
       `          git -C <path> status --porcelain && git -C <path> log --oneline -5`);
}

// ── 2. Uncommitted work in THIS checkout ───────────────────────────────────────
const dirty = git('status', '--porcelain');
const dirtyLines = dirty ? dirty.split('\n').filter(Boolean) : [];
checked('git status --porcelain', `${dirtyLines.length} changed path(s)`);
if (dirtyLines.length) {
  flag(`${dirtyLines.length} uncommitted change(s) in the working tree:\n` +
       dirtyLines.slice(0, 15).map(l => `        ${l}`).join('\n') +
       (dirtyLines.length > 15 ? `\n        …and ${dirtyLines.length - 15} more` : ''));
}

// ── 3. Stashes ─────────────────────────────────────────────────────────────────
const stash = git('stash', 'list');
const stashLines = stash ? stash.split('\n').filter(Boolean) : [];
checked('git stash list', `${stashLines.length} stash(es)`);
if (stashLines.length) {
  flag(`${stashLines.length} stash(es) — invisible to git log:\n` +
       stashLines.map(l => `        ${l}`).join('\n'));
}

// ── 4. Committed locally but NOT PUSHED. loop-config: a commit is a private note. ──
const branch = git('rev-parse', '--abbrev-ref', 'HEAD') || '(detached)';
const upstream = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}');
// Compare against upstream when set, else origin/main — the two ways work goes stale here.
const base = upstream || 'origin/main';
const unpushed = git('log', '--oneline', `${base}..HEAD`);
const unpushedLines = unpushed ? unpushed.split('\n').filter(Boolean) : [];
checked(`git log ${base}..HEAD`, `${unpushedLines.length} unpushed commit(s) on ${branch}`);
if (unpushedLines.length) {
  flag(`${unpushedLines.length} commit(s) on ${branch} NOT on ${base}.\n` +
       unpushedLines.map(l => `        ${l}`).join('\n') +
       `\n        A commit lives only in this container. The container is reclaimed.\n` +
       `        Work is durable when a REMOTE REF confirms it, not when it is committed.`);
}
if (!upstream && branch !== '(detached)') {
  flag(`Branch ${branch} has NO UPSTREAM set — nothing has been pushed from it yet.`);
}

// ── 5. Branches other sessions left on the remote ──────────────────────────────
// ── SC-01: is HEAD stale relative to origin/main? ────────────────────────────
// The error this catches: a session-start `git log` treated as current for the whole
// session. In the 2026-09-03 session `main` advanced 38 commits mid-flight and an
// entire gate was rebuilt that already existed upstream, in a stronger form. See
// docs/self-corrections.md SC-01. This is the executable half of that rule.
git('fetch', 'origin', 'main');
const behind = git('rev-list', '--count', 'HEAD..origin/main');
const behindN = Number(behind || 0);
checked('staleness vs origin/main', behindN ? `${behindN} commit(s) BEHIND` : 'up to date');
if (behindN > 0) {
  flag(`SC-01 — HEAD is ${behindN} commit(s) behind origin/main. Rebase or reset BEFORE writing ` +
       `any code, and re-check what already landed: another session may have shipped this work. ` +
       `\n      git log --oneline HEAD..origin/main` +
       `\n      (docs/self-corrections.md SC-01)`);
}

const remote = git('ls-remote', '--heads', 'origin');
const remoteBranches = remote
  ? remote.split('\n').filter(Boolean).map(l => l.split('\t')[1].replace('refs/heads/', ''))
  : [];
checked('git ls-remote --heads origin', `${remoteBranches.length} remote branch(es)`);
// Classify each branch: already-merged (harmless), genuinely unmerged (the real risk),
// or unfetched (we cannot tell locally — say so rather than guessing either way).
//
// This distinction is the whole value of the check. An earlier draft flagged every
// branch whose tip sha differed from main's — 23 of 25 — which is precisely the kind
// of alarm a reader learns to scroll past. A check nobody reads is the protocol
// failure this script exists to fix, wearing a different hat.
const merged = [], unmerged = [], unfetched = [];
for (const line of (remote ? remote.split('\n').filter(Boolean) : [])) {
  const [sha, ref] = line.split('\t');
  const name = ref.replace('refs/heads/', '');
  if (name === 'main') continue;
  if (git('cat-file', '-e', `${sha}^{commit}`) === null) { unfetched.push({ sha, name }); continue; }
  // Contained in main => its work already landed, whatever its tip sha is.
  const isAncestor = (() => {
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', sha, 'origin/main'],
        { cwd: root, stdio: 'ignore' });
      return true;
    } catch { return false; }
  })();
  (isAncestor ? merged : unmerged).push({ sha, name });
}
checked('  ↳ branch triage', `${merged.length} merged · ${unmerged.length} UNMERGED · ${unfetched.length} unfetched`);
if (unmerged.length) {
  const SHOW = process.argv.includes('--branches') ? unmerged.length : 5;
  flag(`${unmerged.length} remote branch(es) carry commits NOT on main — real unmerged work:\n` +
       unmerged.slice(0, SHOW).map(b => `        ${b.sha.slice(0, 7)}  ${b.name}`).join('\n') +
       (unmerged.length > SHOW
         ? `\n        …and ${unmerged.length - SHOW} more (re-run with --branches to list all)`
         : '') +
       `\n        Check these before rebuilding anything they may already contain.`);
}
if (unfetched.length) {
  flag(`${unfetched.length} remote branch(es) not fetched locally — merge status UNKNOWN.\n` +
       `        Not a problem by itself, but do not assume they are empty. To resolve:\n` +
       `          git fetch origin '+refs/heads/*:refs/remotes/origin/*' && node scripts/preflight.mjs`);
}

// ── 6. Orphaned commits (opt-in; slow) ─────────────────────────────────────────
if (DEEP) {
  const lost = git('fsck', '--lost-found', '--no-progress');
  checked('git fsck --lost-found', lost ? 'ran' : 'unavailable');
  if (lost && lost.includes('dangling commit')) {
    flag('Dangling commits found by git fsck — inspect with `git show <sha>`:\n' +
         lost.split('\n').filter(l => l.includes('dangling commit')).slice(0, 10)
             .map(l => `        ${l}`).join('\n'));
  }
} else {
  checked('git fsck --lost-found', 'SKIPPED (re-run with --deep if something is genuinely missing)');
}

// ── 7. The ledger. WAVE-STATE.md:3 — "the next one reads THIS FILE FIRST." ──────
const wavePath = join(root, 'docs', 'WAVE-STATE.md');
if (existsSync(wavePath)) {
  const lines = readFileSync(wavePath, 'utf8').split('\n');
  const firstOpen = lines.findIndex(l => /^\s*[-*]\s*\[ \]/.test(l));
  checked('docs/WAVE-STATE.md', firstOpen >= 0 ? `first unchecked step at line ${firstOpen + 1}` : 'no unchecked steps');
  if (firstOpen >= 0) {
    console.log(`  LEDGER — first unchecked step (docs/WAVE-STATE.md:${firstOpen + 1}):`);
    console.log(`    ${lines[firstOpen].trim()}\n`);
  }
} else {
  checked('docs/WAVE-STATE.md', 'MISSING');
  flag('docs/WAVE-STATE.md is missing — the campaign ledger is the resume point.');
}

// ── Report ─────────────────────────────────────────────────────────────────────
console.log('  Places checked (a "work is lost" claim must cite ALL of these):');
for (const l of looked) console.log(`    ✓ ${l}`);
console.log('');

if (flags.length) {
  console.log(`  ⚠ ${flags.length} thing(s) need attention BEFORE you open a file or rebuild anything:\n`);
  for (const f of flags) console.log(`    • ${f}\n`);
  console.log('  Rule: "not found" is NOT "does not exist". This repo has paid for that');
  console.log('  twice — EPIC-031 (a false data-loss story, retracted in a0b7b25) and BUG-87');
  console.log('  (fixed twice because a worktree went unchecked). Search, then conclude.\n');
} else {
  console.log('  ✓ No stranded work found. Tree is clean, nothing unpushed, no extra worktrees.\n');
}

process.exit(0);
