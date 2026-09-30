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
  // BUG-190: the fetch+merge now has ONE owner, hydrateHistoryFromCloud(). All three
  // callers must route through it — restore (manual button), sync (fresh sign-in) and
  // the on-load self-heal — so they cannot reconcile history three different ways.
  const hydrateSrc = grab('hydrateHistoryFromCloud', /async function hydrateHistoryFromCloud\([\s\S]*?\n\}/);
  check('hydrateHistoryFromCloud() is the one place cloud sessions are merged into local history',
    /mergeCloudSessionsIntoHistory\(/.test(hydrateSrc));
  check('restoreFromCloud() routes through the shared hydrator, not a re-implementation',
    /hydrateHistoryFromCloud\(/.test(restoreSrc) && !/from\('workout_sessions'\)/.test(restoreSrc));
  check('syncFromCloud() routes through the shared hydrator, not a re-implementation',
    /hydrateHistoryFromCloud\(/.test(syncSrc));
  // THE mechanism guard for BUG-190: the returning-user init path (saved cfg, the ONLY
  // path a daily user takes) must hydrate history BEFORE renderTracker() asks the queue
  // what today's workout is. This is what was missing — BUG-178 fixed the merge but left
  // it unreachable from here, so the queue ran on a cache nothing ever refreshed.
  // There are TWO saved-cfg entry points, not one — the init IIFE and the
  // onAuthStateChange handler (magic link / session restore / home-screen icon).
  // BOTH render the tracker straight off the local cache, so both must hydrate.
  // Asserting only the one the bug was found on is the BUG-73 -> BUG-114 mistake.
  // There are TWO saved-cfg entry points, not one — the init IIFE and the
  // onAuthStateChange handler (magic link / session restore / home-screen icon).
  // BOTH render the tracker straight off the local cache, so BOTH must hydrate.
  // Asserting only the one the bug was found on is the BUG-73 -> BUG-114 mistake.
  // Sliced by index rather than one clever regex: the two branches are shaped
  // differently on purpose (init awaits; the auth callback must not, or it holds the
  // Supabase auth lock), and a regex tight enough to match both is a regex that
  // silently matches neither when one is edited.
  const savedCfgBranches = [];
  for (let at = html.indexOf('if (savedCfg?.goal) {'); at !== -1; at = html.indexOf('if (savedCfg?.goal) {', at + 1)) {
    const paint = html.indexOf("renderTracker(); showView('dashboard');", at);
    if (paint === -1) continue;
    savedCfgBranches.push(html.slice(at, paint + 2000));
  }
  check(`BUG-190: found both saved-cfg entry points (got ${savedCfgBranches.length}, expected 2)`,
    savedCfgBranches.length === 2);
  const unhydrated = savedCfgBranches.filter(b => !/hydrateHistoryFromCloud\(/.test(b));
  check(`BUG-190: EVERY returning-user saved-cfg path hydrates history before trusting the queue — ${unhydrated.length} do not`,
    unhydrated.length === 0);
  const initSrc = savedCfgBranches.find(b => /await hydrateHistoryFromCloud\(/.test(b)) || '';
  // Compare against the PAINT call specifically, not a bare 'renderTracker()' — the
  // surrounding comment mentions renderTracker() by name and would match first.
  check('BUG-190: the init path AWAITS the hydrate before renderTracker() reads the queue',
    !!initSrc && initSrc.indexOf('await hydrateHistoryFromCloud(') < initSrc.indexOf("renderTracker(); showView('dashboard');"));
  check('restoreFromCloud() no longer contains the old all-or-nothing empty-guard',
    !/if \(!existing\.length\)/.test(restoreSrc));
  check('syncFromCloud() no longer contains the old all-or-nothing empty-guard',
    !/!\(LS\.get\('tandem_history'\) \|\| \[\]\)\.length/.test(syncSrc));
}

// ── 1. Extract the live functions (no re-implementation) ──
const oneoffSrc = grab('ONEOFF_SESSION_TYPE', /const ONEOFF_SESSION_TYPE = '[^']*';/);
const ldsSrc = grab('localDateStr', /function localDateStr\([\s\S]*?\n\}/);
const iphrSrc = grab('isProgramHistoryRow', /function isProgramHistoryRow\([\s\S]*?\n\}/);
const ibpsSrc = grab('isBeforeProgramStart', /function isBeforeProgramStart\([\s\S]*?\n\}/);
const cscSrc = grab('completedSessionCount', /function completedSessionCount\(\) \{[\s\S]*?\n\}/);
const npdkSrc = grab('nextProgramDayKey', /function nextProgramDayKey\(\) \{[\s\S]*?\n\}/);
const hdkSrc = grab('_historyDateKey', /function _historyDateKey\([\s\S]*?\n\}/);
const hrkSrc = grab('_historyRowKey', /function _historyRowKey\([\s\S]*?\n\}/);
const hskSrc = grab('_historySortKey', /function _historySortKey\([\s\S]*?\n\}/);
const mergeSrc = grab('mergeCloudSessionsIntoHistory', /function mergeCloudSessionsIntoHistory\([\s\S]*?\n\}/);

function buildContext() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext([oneoffSrc, ldsSrc, ibpsSrc, iphrSrc, cscSrc, npdkSrc, hdkSrc, hrkSrc, hskSrc, mergeSrc].join('\n'), ctx);
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

// ── 2(f)/(g)/(h). BUG-190: the merge must dedupe a row finishSession() WROTE LOCALLY
// against that same session's synced cloud twin.
//
// Why this gate exists on top of (a)-(e): every "local" fixture above is CLOUD-SHAPED
// (session_date + day_type + session_type) — i.e. a row that was hydrated FROM the
// cloud, not one Finish() wrote. But finishSession()/skipAhead() are the only two
// tandem_history writers that stamp neither `session_date` NOR `session_type` (the
// one-off and journal writers stamp both). For those rows the old _historyRowKey()
// fell through to 'id:'+id, and a local Date.now() id NEVER matches a cloud uuid — so
// the business-key dedupe the merge exists to perform was dead for exactly the rows
// it was built to dedupe. Every finished workout counted TWICE after a merge.
//
// The fixture is Kerwin's REAL account (Supabase zsvktcvqmppsshtpeljt, read 2026-09-30):
// program start 2026-09-10, 5 days/week, four completed program days day1..day4.
// finishSession() stamps `id: Date.now()` at the moment Finish is tapped — derive it
// from the row's own date so the fixture can never drift outside the program window
// (isBeforeProgramStart() compares that numeric id against cfg.startEpoch).
const finished = (dateStr, day) => ({ id: Date.parse(dateStr + ' 20:00:00Z'), date: dateStr, week: 1, goal: 'build_muscle', day, exercises: { squat: [{ w: 100, r: 5 }] } });
const KERWIN_CLOUD = [
  { id: 'c4', session_date: '2026-09-29', day_type: 'day4', session_type: 'strength', completed: true, created_at: '2026-09-30T03:07:33Z' },
  { id: 'c3', session_date: '2026-09-22', day_type: 'day3', session_type: 'strength', completed: true, created_at: '2026-09-23T03:52:08Z' },
  { id: 'c2', session_date: '2026-09-21', day_type: 'day2', session_type: 'strength', completed: true, created_at: '2026-09-23T06:16:51Z' },
  { id: 'c1', session_date: '2026-09-10', day_type: 'day1', session_type: 'strength', completed: true, created_at: '2026-09-10T23:24:50Z' },
];
const kerwinCfg = { goal: 'build_muscle', days: 5, weeks: 12, startDate: '2026-09-10', startEpoch: Date.parse('2026-09-10T00:00:01Z') };

// (f) Local history written entirely by finishSession() — every row has a cloud twin.
// Merging must be a NO-OP (4 rows, not 8) and must still serve day5.
{
  const ctx = buildContext();
  ctx.cfg = { ...kerwinCfg };
  ctx.LS.set('tandem_history', [
    finished('Tue, Sep 29, 2026', 'day4'),
    finished('Tue, Sep 22, 2026', 'day3'),
    finished('Mon, Sep 21, 2026', 'day2'),
    finished('Thu, Sep 10, 2026', 'day1'),
  ]);
  const merged = ctx.mergeCloudSessionsIntoHistory(ctx.LS.get('tandem_history'), KERWIN_CLOUD);
  ctx.LS.set('tandem_history', merged);
  check(`(f) finishSession-shaped local rows dedupe against their synced cloud twins (expected 4 rows, got ${merged.length})`,
    merged.length === 4);
  check(`(f) completedSessionCount() === 4 after the merge (double-counting gives 8)`,
    ctx.completedSessionCount() === 4);
  check("(f) nextProgramDayKey() === 'day5' — not a day already completed",
    ctx.nextProgramDayKey() === 'day5');
}

// (g) THE LIVE SYMPTOM. Local is missing the 09-21 day2 row (it was created out of
// order server-side on 09-23 and never existed in this browser). Pre-merge the queue
// re-serves day4 — the workout he just did, 2026-09-29. The merge must repair it to
// day5, adding exactly ONE row.
{
  const ctx = buildContext();
  ctx.cfg = { ...kerwinCfg };
  ctx.LS.set('tandem_history', [
    finished('Tue, Sep 29, 2026', 'day4'),
    finished('Tue, Sep 22, 2026', 'day3'),
    finished('Thu, Sep 10, 2026', 'day1'),
  ]);
  check("(g) pre-merge the stale local cache re-serves 'day4' — the completed workout (the reported bug)",
    ctx.nextProgramDayKey() === 'day4');
  const merged = ctx.mergeCloudSessionsIntoHistory(ctx.LS.get('tandem_history'), KERWIN_CLOUD);
  ctx.LS.set('tandem_history', merged);
  check(`(g) merge adds exactly the one missing row (expected 4, got ${merged.length})`, merged.length === 4);
  check("(g) post-merge nextProgramDayKey() === 'day5'", ctx.nextProgramDayKey() === 'day5');
}

// (h) Idempotence: merging the same cloud rows into an already-merged, finishSession-
// shaped history a second time must not grow it. This is the "self-heal runs on every
// app open" path — it runs on EVERY load, so a non-idempotent merge would inflate the
// count a little more each time the app is opened.
{
  const ctx = buildContext();
  ctx.cfg = { ...kerwinCfg };
  ctx.LS.set('tandem_history', [finished('Tue, Sep 29, 2026', 'day4')]);
  let hist = ctx.mergeCloudSessionsIntoHistory(ctx.LS.get('tandem_history'), KERWIN_CLOUD);
  hist = ctx.mergeCloudSessionsIntoHistory(hist, KERWIN_CLOUD);
  hist = ctx.mergeCloudSessionsIntoHistory(hist, KERWIN_CLOUD);
  ctx.LS.set('tandem_history', hist);
  check(`(h) three successive merges stay at 4 rows (got ${hist.length}) — self-heal-on-open is idempotent`,
    hist.length === 4);
  check("(h) nextProgramDayKey() still 'day5' after three merges", ctx.nextProgramDayKey() === 'day5');
}

// (i) A one-off must NOT collide with a program day logged the same date. D9: session_type
// is the sole discriminator, so the key's kind component must come from isProgramHistoryRow().
{
  const ctx = buildContext();
  ctx.cfg = { ...kerwinCfg };
  ctx.LS.set('tandem_history', [finished('Tue, Sep 29, 2026', 'day4')]);
  const merged = ctx.mergeCloudSessionsIntoHistory(ctx.LS.get('tandem_history'), [
    { id: 'c4', session_date: '2026-09-29', day_type: 'day4', session_type: 'strength', completed: true, created_at: '2026-09-30T03:07:33Z' },
    { id: 'o1', session_date: '2026-09-29', day_type: 'day4', session_type: 'oneoff', completed: true, created_at: '2026-09-30T04:00:00Z' },
  ]);
  check(`(i) a same-date one-off is kept as a distinct row, the program twin dedupes (expected 2, got ${merged.length})`,
    merged.length === 2);
  ctx.LS.set('tandem_history', merged);
  check('(i) the one-off does not advance program position (count stays 1)', ctx.completedSessionCount() === 1);
}

// ── 3. Source guard: every tandem_history writer stamps session_date ──
// The root cause of (f) was finishSession()/skipAhead() omitting it. Keep it omitted-
// proof: the key derivation has a `date`-parsing fallback for rows ALREADY in a user's
// localStorage, but a new writer must not rely on that fallback.
{
  const sites = [...html.matchAll(/hist\.unshift\(\{[\s\S]{0,700}?\}\);/g)];
  check(`3: found the tandem_history write sites (got ${sites.length}, expected 4)`, sites.length === 4);
  const missing = sites.filter(m => !/session_date:/.test(m[0]));
  check(`3: every hist.unshift() site stamps session_date — ${missing.length} do not`, missing.length === 0);
}

console.log('HISTORY-MERGE SMOKE — BUG-178 (cloud history hydration merge, not empty-guard overwrite)\n');
if (failures) {
  console.log(`${failures} FAILURE(S):`);
  for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log('All BUG-178 history-merge guarantees hold. ✓');
process.exit(0);
