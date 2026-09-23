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

console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`);
process.exit(failures === 0 ? 0 : 1);
