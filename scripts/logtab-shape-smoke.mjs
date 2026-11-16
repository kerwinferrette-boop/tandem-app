// logtab-shape-smoke.mjs
// Regression guard for BUG-135 — the Log tab rendered permanently empty after any
// device change / cloud restore.
//
// Root cause it locks down: tandem_history holds two row shapes.
//   1. finishSession()-written: { date: <locale string>, exercises: {...} }
//   2. restoreFromCloud()-written: raw workout_sessions rows — { session_date: 'YYYY-MM-DD',
//      completed, ... }, no date field, no exercises map at all (per-set data lives in
//      the sets table, which this read-side fix does not touch).
// buildLiftSeries() used to do `new Date(sess.date)` unconditionally, so every
// restored row failed the isNaN date guard and was silently dropped — same
// session_date-vs-date shape gap completedSessionCount()/:8231 and getOverdueDays()/:8329
// already defend against.
//
// This test extracts the LIVE buildLiftSeries() from tandem.html (no re-implementation)
// and asserts neither shape is silently dropped for a date reason, and that a restored
// row (no exercises map) contributes zero points rather than a fabricated zero-value one.
//
// BUG-149 (section 8) extends this guard rather than adding a second one: the All time window
// is the all-lifts index, one-offs and pre-program sessions included.
//
// Run: node scripts/logtab-shape-smoke.mjs

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');

let failures = 0;
function check(label, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) failures++;
}

// ── 1. Extract the live buildLiftSeries function body ──
const startMarker = 'function buildLiftSeries(';
const startIdx = html.indexOf(startMarker);
if (startIdx === -1) { console.error('could not find buildLiftSeries'); process.exit(1); }
const endIdx = html.indexOf('\n}', startIdx);
const buildLiftSeriesSrc = html.slice(startIdx, endIdx + 2);

// ── 2. Run it against an in-memory LS stub ──
const store = {};
const LS = {
  get: (k) => (k in store ? JSON.parse(JSON.stringify(store[k])) : null),
  set: (k, v) => { store[k] = JSON.parse(JSON.stringify(v)); },
};
const ctx = vm.createContext({ LS, Object, Number, Math, Date, isNaN });
vm.runInContext(`${buildLiftSeriesSrc}\nthis.buildLiftSeries = buildLiftSeries;`, ctx);
const buildLiftSeries = ctx.buildLiftSeries;

// ── 3. finishSession()-shaped row: must still produce a point (no regression) ──
const finishSessionRow = {
  id: 1, date: 'Tue, Sep 23, 2026', week: 1, goal: 'build_muscle', day: 'push',
  exercises: { slot1: [{ name: 'Bench Press', w: 135, r: 8, est1rm: 168 }] },
};

// ── 4. restoreFromCloud()-shaped row: bare session_date, no exercises map ──
const restoredRow = {
  id: 'uuid-1', session_date: '2026-09-20', completed: true, week: 2, day: 'push',
};

LS.set('tandem_history', [finishSessionRow, restoredRow]);
const lifts1 = buildLiftSeries();
check('finishSession-shaped row still yields a point (no regression)',
  Array.isArray(lifts1['Bench Press']) && lifts1['Bench Press'].length === 1);
check('restored row (no exercises map) is skipped, not crashed or faked',
  Object.keys(lifts1).length === 1 && lifts1['Bench Press'].length === 1);

// ── 5. restored row ALONE must not throw and must yield nothing (not a wrong chart) ──
LS.set('tandem_history', [restoredRow]);
let threw = false;
let lifts2 = {};
try { lifts2 = buildLiftSeries(); } catch (e) { threw = true; }
check('restored-only history does not throw', !threw);
check('restored-only history yields no fabricated points', Object.keys(lifts2).length === 0);

// ── 6. bare session_date parses as LOCAL midnight, not UTC (same DST-safety class as
//        completedSessionCount()/getOverdueDays()) — restore a row WITH exercises to
//        observe the date it assigns.
const restoredWithExercises = {
  id: 'uuid-2', session_date: '2026-09-20', completed: true,
  exercises: { slot1: [{ name: 'Squat', w: 225, r: 5, est1rm: 253 }] },
};
LS.set('tandem_history', [restoredWithExercises]);
const lifts3 = buildLiftSeries();
const when = lifts3['Squat']?.[0]?.date;
check('session_date parsed as local midnight (matches new Date("2026-09-20T00:00:00"))',
  when instanceof Date && when.getTime() === new Date('2026-09-20T00:00:00').getTime());

// ── 7. BUG-144: buildHistoryModal() is a SECOND reader of the same two row shapes. A
//        restored row has session_date and no `date`, so its header rendered blank (and
//        literally "undefined" before the BUG-209 `|| ''` guard). Extract the LIVE
//        function + the one display-date owner and assert the header carries a real date.
function liveFn(name) {
  const i = html.indexOf('function ' + name + '(');
  if (i === -1) { console.error('could not find ' + name); process.exit(1); }
  return html.slice(i, html.indexOf('\n}', i) + 2);
}
const listEl = { innerHTML: '' };
const modalCtx = vm.createContext({
  LS, Object, Number, Date, String,
  document: { getElementById: () => listEl },
  escNoteHtml: (x) => String(x),
  historyExLabel: (id) => String(id),
});
vm.runInContext(`${liveFn('historyDisplayDate')}\n${liveFn('buildHistoryModal')}\nthis.buildHistoryModal = buildHistoryModal;`, modalCtx);
LS.set('tandem_history', [finishSessionRow, restoredRow]);
modalCtx.buildHistoryModal();
check('History modal: finishSession-shaped row still shows its own date string',
  listEl.innerHTML.includes('<span>Tue, Sep 23, 2026</span>'));
check('History modal: restored row (session_date only) shows a real date, not blank/"undefined"',
  listEl.innerHTML.includes('<span>Sun, Sep 20, 2026</span>') && !listEl.innerHTML.includes('undefined'));
LS.set('tandem_history', [{ id: 'uuid-3' }]);
modalCtx.buildHistoryModal();
check('History modal: a row with neither field renders an empty header, never "undefined"',
  !listEl.innerHTML.includes('undefined'));

// ── 8. BUG-149 (Kerwin 2026-11-15, "C"): the All time window is the all-lifts index — every
//        exercise ever logged, one-offs and pre-program sessions included. Run the LIVE
//        renderLogTab() + logWindowStart() against a fake DOM with a program row, a one-off and
//        a row from before the program started, and read what it renders.
const grid = { innerHTML: '' };
const chips = [];
const markup = html.match(/<div class="log-filters" id="logFilters">([\s\S]*?)<\/div>/);
check('BUG-149: the Log tab has an "All time" window chip calling setLogWindow(\'all\')',
  !!markup && /data-win="all"[^>]*onclick="setLogWindow\('all'\)"/.test(markup[1]));
const renderCtx = vm.createContext({
  LS, Object, Number, Math, Date, isNaN, String,
  cfg: { startDate: '2026-10-01' },
  EXERCISE_BANK: {},
  exDisplayName: (n) => n,
  applyHeroImages: () => {},
  document: { getElementById: (id) => (id === 'logGrid' ? grid : null), querySelectorAll: () => chips },
});
vm.runInContext([buildLiftSeriesSrc, liveFn('logDelta'), liveFn('logDeltaHtml'), liveFn('logWindowStart'),
  liveFn('renderLogTab'), html.match(/const logEsc = [^\n]+/)[0],
  'let logWindow = "month";', 'this.show = (w) => { logWindow = w; renderLogTab(); };'].join('\n'), renderCtx);
const today = new Date();
const daysAgo = (n) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n).toString();
LS.set('tandem_history', [
  { id: 'p', date: daysAgo(2), session_type: 'program', exercises: { a: [{ name: 'Bench Press', w: 135, r: 8, est1rm: 168 }] } },
  { id: 'o', date: daysAgo(5), session_type: 'oneoff', exercises: { a: [{ name: 'Goblet Squat', w: 50, r: 10, est1rm: 66 }] } },
  { id: 'old', date: new Date('2026-06-01T12:00:00').toString(), exercises: { a: [{ name: 'Deadlift', w: 225, r: 5, est1rm: 253 }] } },
  { id: 's', date: daysAgo(1), skipped: true, exercises: { a: [{ name: 'Skipped Lift', w: 100, r: 5 }] } },
]);
renderCtx.show('all');
const allHtml = grid.innerHTML;
check('BUG-149: All time lists the program lift', allHtml.includes('data-name="Bench Press"'));
check('BUG-149: All time lists the one-off lift (no isProgramHistoryRow filter)', allHtml.includes('data-name="Goblet Squat"'));
check('BUG-149: All time lists the pre-program lift (no isBeforeProgramStart filter)', allHtml.includes('data-name="Deadlift"'));
check('BUG-149: a skipped session is still not a lift', !allHtml.includes('Skipped Lift'));
check('BUG-149: each card names the last day it was logged', (allHtml.match(/ · last /g) || []).length === 3);
check('BUG-149: each card still opens the per-lift series', (allHtml.match(/onclick="openLogDetail\(this\.dataset\.name\)"/g) || []).length === 3);
renderCtx.show('program');
check('BUG-149: the This program window still leaves out the pre-program lift', !grid.innerHTML.includes('data-name="Deadlift"'));
check('BUG-149: the Log readers never apply the program-progress filters',
  !/isProgramHistoryRow|isBeforeProgramStart/.test((buildLiftSeriesSrc + liveFn('renderLogTab') + liveFn('logWindowStart'))
    .split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n')));

console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`);
process.exit(failures === 0 ? 0 : 1);
