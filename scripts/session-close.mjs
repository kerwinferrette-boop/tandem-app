#!/usr/bin/env node
/**
 * session-close.mjs — FAILS LOUD if this session is about to strand work.
 *
 * WHY THIS EXISTS (Kerwin, 2026-08-28: "how do we fix that protocol")
 *
 * Companion to scripts/preflight.mjs, and the more important half of the pair.
 * Preflight is a safety net that FINDS stranded work; this one PREVENTS the
 * stranding. Work that never strands never has to be found, never gets declared
 * lost, and never gets rebuilt from scratch the way BUG-87 was on 2026-08-18.
 *
 * The rules below are not new. loop-config.md already states every one of them:
 *
 *   "Work is not done until `git push` succeeds. Not when the tests pass, not when
 *    the notes are written, not when a report says COMPLETE. The unit of done is a
 *    REMOTE REF, verified by reading it back."
 *
 *   "Do not build in a worktree that has no tracked remote branch. A worktree is
 *    fine for isolation; it is not a destination. Treat an unpushed worktree at
 *    end-of-turn as an incident."
 *
 * They were written down and skipped anyway. That is the entire finding. So this
 * file's job is not to say them again — it is to make them EXECUTE. A rule that
 * exits non-zero is a rule; a rule in a markdown file is a hope.
 *
 * EXIT CODE: 1 if anything would be stranded, 0 if the session is safe to end.
 * Unlike preflight (which must never block a session from STARTING), this one is
 * meant to fail and to be believed when it does.
 *
 * Usage: node scripts/session-close.mjs
 */
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function git(...args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

const incidents = [];
const ok = [];

console.log('\n═══ SESSION CLOSE — is any work about to be stranded? ═══\n');

// ── 1. Extra worktrees. The BUG-87 trap, checked at the end so it never starts. ──
const wtLines = (git('worktree', 'list') || '').split('\n').filter(Boolean);
if (wtLines.length > 1) {
  const extras = wtLines.slice(1);
  const detail = extras.map(l => {
    const path = l.split(/\s+/)[0];
    const st = git('-C', path, 'status', '--porcelain');
    const n = st ? st.split('\n').filter(Boolean).length : 0;
    return `      ${path}  — ${n} uncommitted change(s)`;
  }).join('\n');
  incidents.push(
    `${extras.length} EXTRA WORKTREE(S) still present at session close.\n${detail}\n` +
    `      Anything uncommitted here dies with the container and is invisible to\n` +
    `      \`git log\` in the main checkout. Commit and push it, or \`git worktree remove\`\n` +
    `      it deliberately. Do not just end the session.`
  );
} else {
  ok.push('no extra worktrees');
}

// ── 2. Uncommitted changes to TRACKED files ────────────────────────────────────
// Untracked files are listed separately: a scratch file is not an incident, but a
// modified tracked file at close almost always is.
const porcelain = (git('status', '--porcelain') || '').split('\n').filter(Boolean);
const modified = porcelain.filter(l => !l.startsWith('??'));
const untracked = porcelain.filter(l => l.startsWith('??'));
if (modified.length) {
  incidents.push(
    `${modified.length} uncommitted change(s) to TRACKED files:\n` +
    modified.map(l => `      ${l}`).join('\n') +
    `\n      These exist only in this container.`
  );
} else {
  ok.push('no uncommitted tracked changes');
}
if (untracked.length) {
  console.log(`  note: ${untracked.length} untracked file(s) — not an incident, but confirm none is real work:`);
  for (const l of untracked.slice(0, 10)) console.log(`      ${l}`);
  console.log('');
}

// ── 3. Stashes ─────────────────────────────────────────────────────────────────
const stashes = (git('stash', 'list') || '').split('\n').filter(Boolean);
if (stashes.length) {
  incidents.push(`${stashes.length} stash(es) — a stash does not survive the container:\n` +
                 stashes.map(l => `      ${l}`).join('\n'));
} else {
  ok.push('no stashes');
}

// ── 4. Commits that exist only here. THE headline rule. ────────────────────────
const branch = git('rev-parse', '--abbrev-ref', 'HEAD') || '(detached)';
const upstream = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}');
const base = upstream || 'origin/main';
const unpushed = (git('log', '--oneline', `${base}..HEAD`) || '').split('\n').filter(Boolean);
if (unpushed.length) {
  incidents.push(
    `${unpushed.length} commit(s) on ${branch} that are NOT on ${base}:\n` +
    unpushed.map(l => `      ${l}`).join('\n') +
    `\n      loop-config: "A commit is a private note to yourself." Push it:\n` +
    `        git push -u origin ${branch}\n` +
    `      then read it back with \`git ls-remote --heads origin ${branch}\`.`
  );
} else {
  ok.push(`nothing unpushed on ${branch}`);
}

// ── Report ─────────────────────────────────────────────────────────────────────
if (ok.length) {
  console.log('  Clean:');
  for (const o of ok) console.log(`    ✓ ${o}`);
  console.log('');
}

if (incidents.length) {
  console.log(`  ✗ ${incidents.length} INCIDENT(S) — do not end the session yet:\n`);
  for (const i of incidents) console.log(`    • ${i}\n`);
  console.log('  Per loop-config, a blocked push is a P0 report in the same turn, not a');
  console.log('  deferred to-do. If you cannot push, say plainly: "this work exists only in');
  console.log('  this container and will be lost."\n');
  console.log('  ── Notion protocol-ledger entry (paste into 🧭 Tandem — Protocol Ledger) ──');
  console.log(`  Type: Lapse — work stranded at close`);
  console.log(`  What happened: ${incidents.length} incident(s) on ${branch}`);
  console.log(`  Why it didn't fire: <fill in — was a rule missing, or present and skipped?>`);
  console.log(`  Mechanism that would have caught it earlier: <fill in>\n`);
  process.exit(1);
}

console.log('  ✓ Nothing stranded. Safe to end the session.\n');
process.exit(0);
