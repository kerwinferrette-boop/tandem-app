// calendar-day-smoke.mjs
// Regression guard for BUG-27's DST-day-math defect.
//
// Root cause it locks down: getWeekSchedule() and getOverdueDays() used to compute
// Math.floor((today - start) / 86400000) over local-midnight Dates. A day that
// crosses a DST transition is 23h (spring-forward) or 25h (fall-back), not 24h, so
// that division comes out one calendar day short (spring-forward) or is masked by
// floor() (fall-back). Confirmed live: America/Los_Angeles, start 2026-03-08, today
// 2026-03-09 00:30 -> 23.5h elapsed -> floor gives 0 instead of 1. A 20,130-scenario
// sweep (every day of 2026 x 5 clock times x start dates) found 2,585 LA failures.
//
// This test extracts the LIVE calendarDaysBetween() from tandem.html (no
// re-implementation) and asserts it stays correct across both 2026 US DST
// transitions and for an ordinary span. Exit 0 = safe.
//
// Run: node scripts/calendar-day-smoke.mjs

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

// ── 1. Extract the live calendarDaysBetween function body ──
const startMarker = 'function calendarDaysBetween(';
const startIdx = html.indexOf(startMarker);
if (startIdx === -1) { console.error('could not find calendarDaysBetween'); process.exit(1); }
const endIdx = html.indexOf('\n}', startIdx);
const fnSrc = html.slice(startIdx, endIdx + 2);

function run(tz, fn) {
  const prevTZ = process.env.TZ;
  process.env.TZ = tz;
  try {
    const ctx = vm.createContext({ Date, Math });
    vm.runInContext(`${fnSrc}\nthis.calendarDaysBetween = calendarDaysBetween;`, ctx);
    return fn(ctx.calendarDaysBetween);
  } finally {
    process.env.TZ = prevTZ;
  }
}

const localMidnight = s => new Date(s + 'T00:00:00');

// ── 2. Spring-forward: 2026-03-08, America/New_York loses an hour ──
run('America/New_York', (calendarDaysBetween) => {
  check('spring-forward span (2026-03-07 -> 2026-03-09) = 2 days, not 1',
    calendarDaysBetween(localMidnight('2026-03-07'), localMidnight('2026-03-09')) === 2);
  check('spring-forward single day (2026-03-08 -> 2026-03-09) = 1 day',
    calendarDaysBetween(localMidnight('2026-03-08'), localMidnight('2026-03-09')) === 1);
});

// ── 3. Fall-back: 2026-11-01, America/New_York gains an hour ──
run('America/New_York', (calendarDaysBetween) => {
  check('fall-back span (2026-10-31 -> 2026-11-02) = 2 days, not 3',
    calendarDaysBetween(localMidnight('2026-10-31'), localMidnight('2026-11-02')) === 2);
  check('fall-back single day (2026-11-01 -> 2026-11-02) = 1 day',
    calendarDaysBetween(localMidnight('2026-11-01'), localMidnight('2026-11-02')) === 1);
});

// ── 4. Ordinary span, no DST boundary crossed — must stay unchanged ──
run('America/New_York', (calendarDaysBetween) => {
  check('ordinary span (2026-01-01 -> 2026-01-05) = 4 days',
    calendarDaysBetween(localMidnight('2026-01-01'), localMidnight('2026-01-05')) === 4);
  check('same day = 0', calendarDaysBetween(localMidnight('2026-06-01'), localMidnight('2026-06-01')) === 0);
});

// ── 5. A timezone with NO DST (UTC itself) must also be unaffected ──
run('UTC', (calendarDaysBetween) => {
  check('UTC ordinary span (2026-03-07 -> 2026-03-09) = 2 days',
    calendarDaysBetween(localMidnight('2026-03-07'), localMidnight('2026-03-09')) === 2);
});

console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`);
process.exit(failures === 0 ? 0 : 1);
