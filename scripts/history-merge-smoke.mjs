#!/usr/bin/env node
/**
 * history-merge-smoke.mjs — REGRESSION GUARD for BUG-178 (cloud history hydration).
 *
 * BUG-178 (P0, third report of the same symptom after BUG-154/BUG-156, 2026-09-26):
 * restoreFromCloud() and syncFromCloud() each hydrated tandem_history behind an
 * ALL-OR-NOTHING EMPTY GUARD — `if (sessions?.length && !(LS.get('tandem_history') ||
 * []).length)`. Once local history was non-empty, no cloud workout_sessions row could
 * ever reach completedSessionCount()/nextProgramDayKey() again. A server-side-only row
 * (BUG-131's repair insert, written directly in Postgres, never present on the
 * device) sat permanently invisible, so a completed workout was re-served as "next."
 *
 * The fix replaces both guards with mergeCloudSessionsIntoHistory() — the SAME shape
 * of change the PR merge (higher-1RM-wins) and the lastsets merge (newest-date-wins)
 * already got from the 2026-07-13 C-fix, one field over. This gate extracts and
 * exercises the REAL function from tandem.html (no re-implementation), same
 * discipline as program-start-smoke.mjs/lastsets-churn-smoke.mjs/cadence-smoke.mjs.
 *
 * Asserts, per the BUG-178 Claude Code Prompt's step 5:
 *   (a) a cloud-only session row reaches completedSessionCount() when local history
 *       is non-empty (the exact thing the old empty-guard defeated);
 *   (b) nextProgramDayKey() returns 'day4' for the three-session fixture (day1 09-10,
 *       day2 09-21 cloud-only, day3 09-22 local) that reproduced the live symptom —
 *       previously 'day3', the already-completed workout re-served as next;
 *   (c) a local-only unsynced row (Finish() wrote it offline, not yet synced up) is
 *       NOT dropped by the merge.
 *
 * Also locks structurally: both restoreFromCloud() and syncFromCloud() call the SAME
 * merge helper (one rule, one home — no two behaviours), and neither guard site
 * regresses to the old empty-guard shape.
 *
 * Run: node scripts/history-merge-smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);
const html = readFileSync(join(root, 'tandem.html'), 'utf8');

let failures = 0;
const fails = [];
function check(label, cond) {
  if (!cond) { failures++; fails.push(label); }
}

const grab = (name, re) => { const m = html.match(re); if (!m) throw new Error(`could not locate ${name} in tandem.html`); return m[0]; };

// ── 0. Structural guards — the mechanism, not just the fixture ──
{
  const restoreSrc = grab('restoreFromCloud', /async function restoreFromCloud\(\) \{[\s\S]*?\n\}\n/);
  const syncSrc = grab('syncFromCloud', /async function syncFromCloud\(\) \{[\s\S]*?\n  \}\n\}/);
  check('restoreFromCloud() calls the shared merge helper, not a re-implementation',
    /mergeCloudSessionsIntoHistory\(/.test(restoreSrc));
  check('syncFromCloud() calls the shared merge helper, not a re-implementation',
    /mergeCloudSessionsIntoHistory\(/.test(syncSrc));
  check('restoreFromCloud() no longer contains the old all-or-nothing empty-guard',
    !/if \(!existing\.length\)/.test(restoreSrc));
  check('syncFromCloud() no longer contains the old all-or-nothing empty-guard',
    !/!\(LS\.get\('tandem_history'\) \|\| \[\]\)\.length/.test(syncSrc));
}

// ── 1. Extract the live functions (no re-implementation) ──
const oneoffSrc = grab('ONEOFF_SESSION_TYPE', /const ONEOFF_SESSION_TYPE = '[^']*';/);
const iphrSrc = grab('isProgramHistoryRow', /function isProgramHistoryRow\([\s\S]*?\n\}/);
const ibpsSrc = grab('isBeforeProgramStart', /function isBeforeProgramStart\([\s\S]*?\n\}/);
const cscSrc = grab('completedSessionCount', /function completedSessionCount\(\) \{[\s\S]*?\n\}/);
const npdkSrc = grab('nextProgramDayKey', /function nextProgramDayKey\(\) \{[\s\S]*?\n\}/);
const hrkSrc = grab('_historyRowKey', /function _historyRowKey\([\s\S]*?\n\}/);
const hskSrc = grab('_historySortKey', /function _historySortKey\([\s\S]*?\n\}/);
const mergeSrc = grab('mergeCloudSessionsIntoHistory', /function mergeCloudSessionsIntoHistory\([\s\S]*?\n\}/);

function buildContext() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext([oneoffSrc, ibpsSrc, iphrSrc, cscSrc, npdkSrc, hrkSrc, hskSrc, mergeSrc].join('\n'), ctx);
  const store = { tandem_history: [] };
  ctx.LS = {
    get: k => (k in store ? JSON.parse(JSON.stringify(store[k])) : null),
    set: (k, v) => { store[k] = JSON.parse(JSON.stringify(v)); },
    del: k => { delete store[k]; },
  };
  return ctx;
}

// ── 2(b). The exact BUG-178 fixture: local = [day1 09-10, day3 09-22], cloud = all 3 ──
{
  const ctx = buildContext();
  ctx.cfg = { goal: 'build_muscle', days: 5, weeks: 12, startDate: '2026-09-01', startEpoch: 0 };
  ctx.LS.set('tandem_history', [
    { id: 893, session_date: '2026-09-22', day_type: 'day3', session_type: null, completed: true, created_at: '2026-09-23T03:52:00Z' },
    { id: 892, session_date: '2026-09-10', day_type: 'day1', session_type: null, completed: true, created_at: '2026-09-10T23:24:00Z' },
  ]);
  const cloudSessions = [
    { id: 'd9249bb3', session_date: '2026-09-21', day_type: 'day2', session_type: null, completed: true, created_at: '2026-09-23T06:16:00Z' },
    { id: '8e058465', session_date: '2026-09-22', day_type: 'day3', session_type: null, completed: true, created_at: '2026-09-23T03:52:00Z' },
    { id: '893eb33b', session_date: '2026-09-10', day_type: 'day1', session_type: null, completed: true, created_at: '2026-09-10T23:24:00Z' },
  ];
  const merged = ctx.mergeCloudSessionsIntoHistory(ctx.LS.get('tandem_history'), cloudSessions);
  ctx.LS.set('tandem_history', merged);
  check('(b) BUG-178 fixture: merge adds exactly the missing day2 row (length 3, no dup)', merged.length === 3);
  check('(b) BUG-178 fixture: completedSessionCount() === 3', ctx.completedSessionCount() === 3);
  check("(b) BUG-178 fixture: nextProgramDayKey() === 'day4' (was 'day3' pre-fix — the live symptom)",
    ctx.nextProgramDayKey() === 'day4');
}

// ── 2(a). A cloud-only session row reaches completedSessionCount() with local non-empty ──
{
  const ctx = buildContext();
  ctx.cfg = { goal: 'build_muscle', days: 3, weeks: 12, startDate: '2026-01-01', startEpoch: 0 };
  ctx.LS.set('tandem_history', [
    { id: 1, session_date: '2026-01-02', day_type: 'day1', completed: true },
  ]);
  const cloudSessions = [
    { id: 'x', session_date: '2026-01-03', day_type: 'day2', completed: true, created_at: '2026-01-03T10:00:00Z' },
    { id: 'y', session_date: '2026-01-02', day_type: 'day1', completed: true, created_at: '2026-01-02T10:00:00Z' },
  ];
  const merged = ctx.mergeCloudSessionsIntoHistory(ctx.LS.get('tandem_history'), cloudSessions);
  ctx.LS.set('tandem_history', merged);
  check('(a) cloud-only row reaches completedSessionCount() when local history is non-empty (count=2)',
    ctx.completedSessionCount() === 2);
}

// ── 2(c). A local-only unsynced row is not dropped by the merge ──
{
  const ctx = buildContext();
  const localOnlyRow = { id: 1758950400000, date: 'Fri, Sep 26, 2026', week: 3, goal: 'build_muscle', day: 'day4', exercises: { squat: [{ w: 100, r: 5 }] } };
  ctx.LS.set('tandem_history', [localOnlyRow]);
  const cloudSessions = [
    { id: '893eb33b', session_date: '2026-09-10', day_type: 'day1', session_type: null, completed: true, created_at: '2026-09-10T23:24:00Z' },
  ];
  const merged = ctx.mergeCloudSessionsIntoHistory(ctx.LS.get('tandem_history'), cloudSessions);
  check('(c) local-only unsynced row (no session_date, Date.now() id) survives the merge',
    merged.some(r => r.id === localOnlyRow.id && r.exercises && r.exercises.squat));
  check('(c) the cloud-only row is also present (both preserved, length 2)', merged.length === 2);
}

// ── 2(d). Re-syncing the SAME cloud rows twice must not duplicate them (id fast-path) ──
{
  const ctx = buildContext();
  ctx.LS.set('tandem_history', []);
  const cloudSessions = [
    { id: 'abc', session_date: '2026-02-01', day_type: 'day1', completed: true, created_at: '2026-02-01T10:00:00Z' },
  ];
  let hist = ctx.mergeCloudSessionsIntoHistory(ctx.LS.get('tandem_history'), cloudSessions);
  ctx.LS.set('tandem_history', hist);
  hist = ctx.mergeCloudSessionsIntoHistory(ctx.LS.get('tandem_history'), cloudSessions); // re-sync, same rows
  check('(d) merging the same cloud rows twice does not duplicate (idempotent re-sync)', hist.length === 1);
}

// ── 2(e). Newest-first ordering is preserved after a merge ──
{
  const ctx = buildContext();
  ctx.LS.set('tandem_history', [
    { id: 2, session_date: '2026-03-10', day_type: 'day2', completed: true },
  ]);
  const cloudSessions = [
    { id: 'old', session_date: '2026-03-01', day_type: 'day1', completed: true, created_at: '2026-03-01T10:00:00Z' },
  ];
  const merged = ctx.mergeCloudSessionsIntoHistory(ctx.LS.get('tandem_history'), cloudSessions);
  check('(e) newest-first order preserved after merge (03-10 before 03-01)',
    merged[0].session_date === '2026-03-10' && merged[1].session_date === '2026-03-01');
}

console.log('HISTORY-MERGE SMOKE — BUG-178 (cloud history hydration merge, not empty-guard overwrite)\n');
if (failures) {
  console.log(`${failures} FAILURE(S):`);
  for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log('All BUG-178 history-merge guarantees hold. ✓');
process.exit(0);
