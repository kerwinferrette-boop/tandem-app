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
 * SECTION 4 — BUG-209, the PER-LIFT half. Everything above concerns the SESSION row,
 * which is all the program queue needs. It is not what the user opens History to see.
 * Per-lift detail lived ONLY in localStorage: the sync engine pushed `sets` rows up and
 * had no path to bring one back down, so on a cleared browser or a new device every
 * logged lift was unreachable while sitting safely in Postgres (verified on the live
 * account: 24 sessions, 305 set rows, zero lifts rendered). Section 4 asserts the
 * restore now rebuilds `exercises` from `sets`, BACKFILLS the exercise-less rows an
 * already-broken account is stuck with, and never overwrites a local map that has
 * sets in it (an offline-logged set that has not synced up yet).
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
  // BUG-207: the fetch+merge now has ONE owner, hydrateHistoryFromCloud(). All three
  // callers must route through it — restore (manual button), sync (fresh sign-in) and
  // the on-load self-heal — so they cannot reconcile history three different ways.
  const hydrateSrc = grab('hydrateHistoryFromCloud', /async function hydrateHistoryFromCloud\([\s\S]*?\n\}/);
  check('hydrateHistoryFromCloud() is the one place cloud sessions are merged into local history',
    /mergeCloudSessionsIntoHistory\(/.test(hydrateSrc));
  check('restoreFromCloud() routes through the shared hydrator, not a re-implementation',
    /hydrateHistoryFromCloud\(/.test(restoreSrc) && !/from\('workout_sessions'\)/.test(restoreSrc));
  check('syncFromCloud() routes through the shared hydrator, not a re-implementation',
    /hydrateHistoryFromCloud\(/.test(syncSrc));
  // THE mechanism guard for BUG-207: the returning-user init path (saved cfg, the ONLY
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
  check(`BUG-207: found both saved-cfg entry points (got ${savedCfgBranches.length}, expected 2)`,
    savedCfgBranches.length === 2);
  const unhydrated = savedCfgBranches.filter(b => !/hydrateHistoryFromCloud\(/.test(b));
  check(`BUG-207: EVERY returning-user saved-cfg path hydrates history before trusting the queue — ${unhydrated.length} do not`,
    unhydrated.length === 0);
  const initSrc = savedCfgBranches.find(b => /await hydrateHistoryFromCloud\(/.test(b)) || '';
  // Compare against the PAINT call specifically, not a bare 'renderTracker()' — the
  // surrounding comment mentions renderTracker() by name and would match first.
  check('BUG-207: the init path AWAITS the hydrate before renderTracker() reads the queue',
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
const twinSrc = grab('_historyIsMidnightTwin', /const HISTORY_TWIN_MAX_MS[\s\S]*?function _historyIsMidnightTwin\([\s\S]*?\n\}/);
const hdkSrc = grab('_historyDateKey', /function _historyDateKey\([\s\S]*?\n\}/);
const hrkSrc = grab('_historyRowKey', /function _historyRowKey\([\s\S]*?\n\}/);
const hskSrc = grab('_historySortKey', /function _historySortKey\([\s\S]*?\n\}/);
const dedupSrc = grab('dedupeLocalHistory', /function dedupeLocalHistory\([\s\S]*?\n\}/);
const mergeSrc = grab('mergeCloudSessionsIntoHistory', /function mergeCloudSessionsIntoHistory\([\s\S]*?\n\}/);
// BUG-209: the merge now calls these unconditionally, so they belong in the BASE
// context — every section below, including the BUG-178/190 ones, exercises the same
// live function and none of them get a stubbed stand-in.
const hddSrc = grab('historyDisplayDate', /function historyDisplayDate\([\s\S]*?\n\}/);
const exFromSetsSrc = grab('exercisesFromCloudSets', /function exercisesFromCloudSets\([\s\S]*?\n\}/);
const rowFromCloudSrc = grab('historyRowFromCloudSession', /function historyRowFromCloudSession\([\s\S]*?\n\}/);
const exLabelSrc = grab('historyExLabel', /function historyExLabel\([\s\S]*?\n\}/);

function buildContext() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext([oneoffSrc, ldsSrc, ibpsSrc, iphrSrc, cscSrc, npdkSrc, hdkSrc, hrkSrc, hskSrc,
    twinSrc, dedupSrc, hddSrc, exFromSetsSrc, rowFromCloudSrc, exLabelSrc, mergeSrc].join('\n'), ctx);
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

// ── 2(f)/(g)/(h). BUG-207: the merge must dedupe a row finishSession() WROTE LOCALLY
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

// ── 4. BUG-209: the PER-LIFT half of the restore ─────────────────────────────
//
// BUG-178/BUG-207 above make sure the SESSION rows come down and reconcile, which is
// what the program queue needs. They say nothing about what the user actually opens
// History to see: the lifts. Those live in `sets`, one table over, and nothing ever
// read them back — so a restored row rendered as a bare date, findExerciseHistorySessions()
// returned [] for every movement, and buildLiftSeries() `return`ed on the missing
// `exercises` key. Verified against the live account before the fix: 24 sessions and
// 305 set rows in Postgres, zero lifts reachable in the browser.
//
// Fixtures below are REAL rows read from Supabase zsvktcvqmppsshtpeljt on 2026-09-30,
// not invented shapes — the column names are the thing under test, so a fixture that
// spelled them the way the code expects would assert nothing.
const CLOUD_0929 = { id: '9de35536-0a66-4d5f-ba61-14be2649ef2f', session_date: '2026-09-29', day_type: 'day4', session_type: 'strength', week_number: 1, program_goal: 'transform', completed: true, created_at: '2026-09-30T03:07:33.283663+00:00', user_id: 'THE-DB-UID' };
const SETS_0929 = [
  { session_id: '9de35536-0a66-4d5f-ba61-14be2649ef2f', exercise_name: 'Assisted Pull-Up', set_number: 2, weight_lbs: 90, reps: 12, rpe: null, estimated_1rm_lbs: 126 },
  { session_id: '9de35536-0a66-4d5f-ba61-14be2649ef2f', exercise_name: 'Assisted Pull-Up', set_number: 1, weight_lbs: 90, reps: 12, rpe: null, estimated_1rm_lbs: 126 },
  { session_id: '9de35536-0a66-4d5f-ba61-14be2649ef2f', exercise_name: 'Barbell Curl', set_number: 1, weight_lbs: 60, reps: 12, rpe: null, estimated_1rm_lbs: 84 },
];

// 4.0 Structural: the hydrator must actually FETCH the sets and hand them to the merge.
// Without this the three behavioural cases below would all pass on a builder nobody calls
// — the "wired is not working" shape CLAUDE.md names, inverted.
{
  const hydrateSrc = grab('hydrateHistoryFromCloud', /async function hydrateHistoryFromCloud\([\s\S]*?\n\}/);
  check('4.0 hydrateHistoryFromCloud() reads the `sets` table (sessions alone cannot carry lifts)',
    /from\('sets'\)/.test(hydrateSrc));
  check('4.0 hydrateHistoryFromCloud() passes the grouped sets to the merge as its 3rd argument',
    /mergeCloudSessionsIntoHistory\([^)]*,[^)]*,[^)]*\)/.test(hydrateSrc));
  check('4.0 the sets query is keyed on session_id, the only column tying a set to its row',
    /session_id/.test(hydrateSrc));
  const mergeSrcNow = grab('mergeCloudSessionsIntoHistory', /function mergeCloudSessionsIntoHistory\([\s\S]*?\n\}/);
  check('4.0 the merge builds the exercises map through the one shared builder',
    /exercisesFromCloudSets\(/.test(mergeSrcNow));
  // The label derivation must not be a second, private copy inside the modal.
  const modalSrc = grab('buildHistoryModal', /function buildHistoryModal\(\) \{[\s\S]*?\n\}/);
  check('4.0 buildHistoryModal() derives its lift label through historyExLabel(), not an inline regex',
    /historyExLabel\(/.test(modalSrc) && !/replace\(\/\^\\w\+-\//.test(modalSrc));
}

const buildContext209 = buildContext; // same live layer; the alias just reads better below

// 4(a) THE REPORTED SYMPTOM, on an EMPTY browser: sign in on a new device and the lifts
// must come back. Pre-fix this produced a row with no `exercises` key at all.
{
  const ctx = buildContext209();
  const merged = ctx.mergeCloudSessionsIntoHistory([], [CLOUD_0929], { [CLOUD_0929.id]: SETS_0929 });
  // Read through `?.` on purpose: the whole point of this section is that `exercises`
  // used to be ABSENT, so the un-fixed code must make the gate REPORT a named failure,
  // not crash on the first dereference and hide every assertion after it (mutation-
  // tested: dropping the rebuild yields 5 named 4(a) failures, not one TypeError).
  const row = merged[0] || {};
  check('4(a) a restored row carries an exercises map', !!row.exercises && Object.keys(row.exercises).length === 2);
  check('4(a) it is keyed by canonical exercise NAME (the cloud has no slot id to restore)',
    !!row.exercises?.['Assisted Pull-Up'] && !!row.exercises?.['Barbell Curl']);
  const pull = row.exercises?.['Assisted Pull-Up'] || [];
  check('4(a) every set of a lift is restored, ordered by set number regardless of fetch order',
    pull.length === 2 && pull[0].set === 1 && pull[1].set === 2);
  check('4(a) the set carries the local field names the readers use (w/r/est1rm), not the DB ones',
    pull[0]?.w === 90 && pull[0]?.r === 12 && pull[0]?.est1rm === 126);
  check('4(a) BUG-48: every restored set is stamped with its canonical name',
    pull.length > 0 && pull.every(x => x.name === 'Assisted Pull-Up'));
  // The header fields. Pre-fix these were all undefined and the modal rendered the
  // literal string "undefined" / "Wkundefined · " to the user.
  check('4(a) week/goal are aliased from week_number/program_goal', row.week === 1 && row.goal === 'transform');
  check('4(a) day is aliased from day_type', row.day === 'day4');
  check('4(a) a human `date` is derived so the modal header is not "undefined"',
    typeof row.date === 'string' && /2026/.test(row.date) && !/undefined|null|NaN/.test(row.date));
  check('4(a) the DB user_id never lands in localStorage', row.user_id === undefined);
  // The dedupe key must be UNCHANGED by the aliasing, or BUG-178/190 silently regress.
  check('4(a) aliasing does not move the dedupe key (session_date/day_type still preferred)',
    ctx._historyRowKey(row) === ctx._historyRowKey(CLOUD_0929));
}

// 4(b) THE ACCOUNT ALREADY BROKEN. Anyone who ran the old hydrate holds rows that exist
// but are exercise-less. The merge is ADD-ONLY, so those would be skipped forever as
// "already seen" and the repair would never reach the users who need it.
{
  const ctx = buildContext209();
  const stale = { id: 'pre-existing', session_date: '2026-09-29', day_type: 'day4', session_type: 'strength', completed: true, created_at: CLOUD_0929.created_at };
  const merged = ctx.mergeCloudSessionsIntoHistory([stale], [CLOUD_0929], { [CLOUD_0929.id]: SETS_0929 });
  check(`4(b) backfill adds no ROW (expected 1, got ${merged.length}) — it repairs in place`, merged.length === 1);
  check('4(b) an already-present but exercise-less local row gets its lifts backfilled',
    !!merged[0]?.exercises && Object.keys(merged[0].exercises).length === 2);
}

// 4(c) OVER-BREADTH CONTROL. A local row that HAS sets may hold a set logged offline
// that has not synced up yet. The backfill must never overwrite it. Without this clause
// the repair would be a data-loss bug wearing a restore's clothes.
{
  const ctx = buildContext209();
  const offline = { id: 987, session_date: '2026-09-29', day_type: 'day4', session_type: 'strength', completed: true, exercises: { 'Barbell Curl': [{ set: 1, w: 999, r: 3, est1rm: 1, name: 'Barbell Curl' }] } };
  const merged = ctx.mergeCloudSessionsIntoHistory([offline], [CLOUD_0929], { [CLOUD_0929.id]: SETS_0929 });
  check(`4(c) no row added when the local twin already has sets (expected 1, got ${merged.length})`, merged.length === 1);
  check('4(c) a NON-empty local exercises map is never overwritten by the cloud',
    merged[0]?.exercises?.['Barbell Curl']?.[0]?.w === 999 && !merged[0]?.exercises?.['Assisted Pull-Up']);
}

// 4(d) IDEMPOTENCE, with sets. The hydrate runs on EVERY app open.
{
  const ctx = buildContext209();
  const setsBy = { [CLOUD_0929.id]: SETS_0929 };
  let hist = ctx.mergeCloudSessionsIntoHistory([], [CLOUD_0929], setsBy);
  hist = ctx.mergeCloudSessionsIntoHistory(hist, [CLOUD_0929], setsBy);
  hist = ctx.mergeCloudSessionsIntoHistory(hist, [CLOUD_0929], setsBy);
  check(`4(d) three successive set-bearing merges stay at 1 row (got ${hist.length})`, hist.length === 1);
  check('4(d) and the lifts are still there, not duplicated',
    (hist[0]?.exercises?.['Assisted Pull-Up'] || []).length === 2);
}

// 4(e) DEGRADED, NOT FAILED. If the sets query fails the session merge must still work
// — the program queue depends on it, and dates/streaks/position stay correct without lifts.
{
  const ctx = buildContext209();
  const merged = ctx.mergeCloudSessionsIntoHistory([], [CLOUD_0929]); // 3rd arg absent
  check('4(e) omitting the sets argument still merges the session (degraded, not broken)',
    merged.length === 1 && merged[0]?.session_date === '2026-09-29');
  check('4(e) and adds no empty exercises key that would look like a completed-but-empty log',
    merged[0]?.exercises === undefined);
}

// 4(f) THE LABEL. The old derivation `id.replace(/^\w+-/,'').replace(/-/g,' ')` is
// destructive on a real hyphenated NAME, which is what a restored row is keyed by:
// verified by running it — 'Pull-Up' -> 'Up', 'T-Bar Row' -> 'Bar Row'. A restored
// history entry titled "Up" is not a cosmetic defect, it is the wrong lift.
{
  const ctx = buildContext209();
  const named = [{ set: 1, w: 90, r: 12, name: 'Pull-Up' }];
  check("4(f) a name-stamped set labels itself 'Pull-Up', not the mangled 'Up'",
    ctx.historyExLabel('Pull-Up', named) === 'Pull-Up');
  check("4(f) a name-stamped set wins even when the KEY is a slot id (BUG-45: ids are recycled)",
    ctx.historyExLabel('bw-pullup', named) === 'Pull-Up');
  check("4(f) a legacy row with no stamped name still de-mangles its slug",
    ctx.historyExLabel('fb-curl', [{ set: 1, w: 60, r: 12 }]) === 'curl');
  check('4(f) the mangling this replaces is real, not hypothetical (fixture is honest)',
    'Pull-Up'.replace(/^\w+-/, '').replace(/-/g, ' ') === 'Up');
}

// ── 2(j)-(m). BUG-178 PART 3 — repair rows already written to localStorage ──
//
// Parts 1 and 2 stop NEW duplicates; they do nothing about the ones fdb5b31 already
// persisted. Between 2026-09-27 and this change every Restore tap wrote a second copy
// of every session present on both sides, and mergeCloudSessionsIntoHistory() only ever
// compared CLOUD rows against existing ones — never existing against existing — so they
// never self-healed. Proven before the fix: 4 real sessions held twice counted 8 and
// served day4, and the self-heal merge left it at 8.
{
  const cloudish = (sd, day, id) => ({ id, session_date: sd, day_type: day, session_type: 'strength', completed: true, created_at: sd + 'T20:00:00Z' });
  const poisoned = [
    finished('Tue, Sep 29, 2026', 'day4'), cloudish('2026-09-29', 'day4', 'c4'),
    finished('Tue, Sep 22, 2026', 'day3'), cloudish('2026-09-22', 'day3', 'c3'),
    finished('Mon, Sep 21, 2026', 'day2'), cloudish('2026-09-21', 'day2', 'c2'),
    finished('Thu, Sep 10, 2026', 'day1'), cloudish('2026-09-10', 'day1', 'c1'),
  ];

  // (j) the repair itself
  {
    const ctx = buildContext();
    ctx.cfg = { ...kerwinCfg };
    ctx.LS.set('tandem_history', poisoned);
    check("(j) a history poisoned by the pre-fix Restore serves 'day4' before repair (the fdb5b31 symptom)",
      ctx.completedSessionCount() === 8 && ctx.nextProgramDayKey() === 'day4');
    const repaired = ctx.dedupeLocalHistory(poisoned);
    ctx.LS.set('tandem_history', repaired);
    check(`(j) dedupeLocalHistory() collapses 8 rows to 4 (got ${repaired.length})`, repaired.length === 4);
    check("(j) post-repair nextProgramDayKey() === 'day5'",
      ctx.completedSessionCount() === 4 && ctx.nextProgramDayKey() === 'day5');
  }

  // (k) the repair reaches every caller through the merge, and stays idempotent across boots
  {
    const ctx = buildContext();
    ctx.cfg = { ...kerwinCfg };
    let hist = ctx.mergeCloudSessionsIntoHistory(poisoned, KERWIN_CLOUD);
    hist = ctx.mergeCloudSessionsIntoHistory(hist, KERWIN_CLOUD);
    hist = ctx.mergeCloudSessionsIntoHistory(hist, KERWIN_CLOUD);
    ctx.LS.set('tandem_history', hist);
    check(`(k) the merge repairs pre-existing duplicates too, idempotently across 3 boots (got ${hist.length}, expected 4)`,
      hist.length === 4);
    check("(k) nextProgramDayKey() === 'day5' after three repaired merges", ctx.nextProgramDayKey() === 'day5');
  }

  // (l) what the repair must never do: drop per-set data, or drop a row it cannot identify
  {
    const ctx = buildContext();
    ctx.cfg = { ...kerwinCfg };
    // Genuinely unkeyable: no session_date, no date AND no id. An earlier draft of this
    // fixture carried `id: 999`, which _historyRowKey() happily keys as 'id:999' — so the
    // row was never unkeyable and the assertion below was vacuous (it passed with the
    // drop-unkeyable-rows mutation live). Caught by mutation-testing the gate, not by
    // reading it; see docs/self-corrections.md SC-33.
    const unkeyable = { week: 1, goal: 'build_muscle', day: 'day3', exercises: { bench: [{ w: 95, r: 5 }] } };
    const localRow = finished('Tue, Sep 29, 2026', 'day4');
    const out = ctx.dedupeLocalHistory([localRow, cloudish('2026-09-29', 'day4', 'c4'), unkeyable]);
    check(`(l) a row with no date, no session_date and no id is never dropped (got ${out.length}, expected 2)`, out.length === 2);
    const survivor = out.find(r => r.day === 'day4' || r.day_type === 'day4');
    check('(l) the survivor keeps the per-set data the History modal renders',
      !!(survivor && survivor.exercises && survivor.exercises.squat));
    check('(l) the survivor also inherits session_date from the cloud twin it absorbed',
      !!(survivor && survivor.session_date === '2026-09-29'));
    // The keeper must be the LOCAL row, and the load-bearing proof of that is the id:
    // isBeforeProgramStart()'s same-day refinement only fires for `typeof h.id === 'number'`
    // (program-start-smoke.mjs's R5 floor), so letting the cloud twin's uuid win would
    // silently disable that guard. `exercises` alone cannot prove it — only one side ever
    // has that key, so it survives either choice of keeper.
    check(`(l) the survivor keeps the LOCAL numeric Date.now() id, not the cloud uuid (got ${JSON.stringify(survivor && survivor.id)})`,
      !!survivor && typeof survivor.id === 'number' && survivor.id === localRow.id);
    check('(l) the unidentifiable row survived intact', out.some(r => r.exercises && r.exercises.bench));
  }

  // (m) one owner: the merge repairs through dedupeLocalHistory(), not its own copy
  {
    const mergeBody = grab('mergeCloudSessionsIntoHistory', /function mergeCloudSessionsIntoHistory\([\s\S]*?\n\}/);
    check('(m) mergeCloudSessionsIntoHistory() repairs via the shared dedupeLocalHistory()',
      /dedupeLocalHistory\(/.test(mergeBody));
    const hydrateBody = grab('hydrateHistoryFromCloud', /async function hydrateHistoryFromCloud\([\s\S]*?\n\}/);
    // Computing the repair is not performing it — an earlier draft only grepped for the
    // dedupe CALL, and passed with the LS.set deleted. Require the write, and require it
    // before the uid guard, which is what makes the offline/signed-out path repair too.
    check('(m) hydrateHistoryFromCloud() computes the repair', /dedupeLocalHistory\(/.test(hydrateBody));
    const wroteAt = hydrateBody.indexOf("LS.set('tandem_history'");
    const guardAt = hydrateBody.indexOf('if (!uid');
    check('(m) hydrateHistoryFromCloud() WRITES the repair back to localStorage', wroteAt !== -1);
    check('(m) that write happens BEFORE the uid guard, so an offline/signed-out boot still repairs',
      wroteAt !== -1 && guardAt !== -1 && wroteAt < guardAt);
  }
}

// ── 2(n)-(q). BUG-207 residual: the MIDNIGHT-CROSSING twin ──
//
// Ported from claude/fervent-mendel-sveri6, which fixed BUG-178 in parallel and caught
// what 1acb874 missed. Verified against the writers, not the claim: startOrResumeSession()
// stamps the CLOUD row's session_date at the first logged set (start day); finishSession()
// stamps the local row at finish. A session begun 23:30 and finished 00:15 has twins one
// day apart, so the exact keys never match and it double-counts.
{
  const startedLateFinishedAfterMidnight = () => ({
    // cloud row: created 23:30 on the 22nd, session_date = the 22nd (start day)
    cloud: { id: 'cX', session_date: '2026-09-22', day_type: 'day3', session_type: 'strength',
             completed: true, created_at: '2026-09-23T06:30:00Z' },
    // local row finishSession() wrote at 00:15 on the 23rd — 45 min later
    local: { id: Date.parse('2026-09-23T07:15:00Z'), date: 'Wed, Sep 23, 2026', week: 1,
             goal: 'build_muscle', day: 'day3', exercises: { squat: [{ w: 100, r: 5 }] } },
  });

  // (n) the defect itself
  {
    const ctx = buildContext();
    ctx.cfg = { ...kerwinCfg };
    const { cloud, local } = startedLateFinishedAfterMidnight();
    const out = ctx.dedupeLocalHistory([local, cloud]);
    check(`(n) a midnight-crossing session and its cloud twin collapse to ONE row (got ${out.length})`,
      out.length === 1);
    ctx.LS.set('tandem_history', out);
    check('(n) it counts as one completed session, not two', ctx.completedSessionCount() === 1);
    check('(n) the LOCAL row survives (numeric Date.now() id — isBeforeProgramStart needs a real instant)',
      typeof out[0].id === 'number');
  }

  // (o) the guard against over-collapsing: a genuine next-day repeat must NOT be eaten
  {
    const ctx = buildContext();
    ctx.cfg = { ...kerwinCfg, days: 1 };
    // A 1-day program legitimately repeats day1 on consecutive dates, ~24h apart.
    const cloudDay1 = { id: 'c1', session_date: '2026-09-22', day_type: 'day1', session_type: 'strength',
                        completed: true, created_at: '2026-09-22T18:00:00Z' };
    const localDay1Next = { id: Date.parse('2026-09-23T18:00:00Z'), date: 'Wed, Sep 23, 2026', week: 1,
                            goal: 'build_muscle', day: 'day1', exercises: { squat: [{ w: 100, r: 5 }] } };
    const out = ctx.dedupeLocalHistory([localDay1Next, cloudDay1]);
    check(`(o) a genuine next-day repeat 24h apart is NOT eaten as a twin (expected 2, got ${out.length})`,
      out.length === 2);
  }

  // (p) a local row that already has its own exact-key partner is complete — a nearby
  // cloud row is then a DIFFERENT session and must survive.
  {
    const ctx = buildContext();
    ctx.cfg = { ...kerwinCfg };
    const { cloud, local } = startedLateFinishedAfterMidnight();
    const ownPartner = { id: 'cY', session_date: '2026-09-23', day_type: 'day3', session_type: 'strength',
                         completed: true, created_at: '2026-09-23T07:20:00Z' };
    const out = ctx.dedupeLocalHistory([local, ownPartner, cloud]);
    check(`(p) a local row with its own exact-key partner keeps the nearby cloud row as a separate session (expected 2, got ${out.length})`,
      out.length === 2);
  }

  // (q) one-off rows are never collapsed — two legitimate same-day one-offs under one
  // focus label are two sessions, and they never move the queue.
  {
    const ctx = buildContext();
    ctx.cfg = { ...kerwinCfg };
    const oneOff = n => ({ id: n, session_date: '2026-09-29', day: 'chest', session_type: 'oneoff',
                           completed: true, exercises: { bench: [{ w: 135, r: 5 }] } });
    const out = ctx.dedupeLocalHistory([oneOff(1), oneOff(2)]);
    check(`(q) two same-day one-offs under one label stay TWO rows (got ${out.length})`, out.length === 2);
    ctx.LS.set('tandem_history', out);
    check('(q) and neither moves the program queue', ctx.completedSessionCount() === 0);
  }
}

console.log('HISTORY-MERGE SMOKE — BUG-178/207 (session merge reaches the queue) + BUG-209 (the LIFTS come down too)\n');
if (failures) {
  console.log(`${failures} FAILURE(S):`);
  for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log('All BUG-178/207/209 history-restore guarantees hold. ✓');
process.exit(0);
