// logwindow-dst-smoke.mjs
// Regression guard for BUG-145: the Log tab's 'week' / 'month' filter cutoff was
// `now - N * 864e5` — a fixed N*24h lookback. A local calendar day is 23h on a
// spring-forward date and 25h on a fall-back one, so across a DST boundary that cutoff
// landed an hour off the local calendar-day boundary, and a session logged inside that
// hour was included or dropped wrongly. The Log tab's "X% change" is first-vs-last WITHIN
// the window, so a wrong endpoint changes a number the user reads as progress.
// This is the same defect class BUG-27 fixed in calendarDaysBetween() (see
// calendar-day-smoke.mjs); logWindowStart() was simply never brought under that rule.
//
// This extracts the LIVE logWindowStart() from tandem.html (no re-implementation) and, for
// every day of 2026 x 5 clock times x 3 zones x {week, month}, asserts:
//   (a) the cutoff is exactly local midnight of the day N calendar days earlier, where the
//       expected value comes from an INDEPENDENT oracle (UTC-noon arithmetic — UTC has no
//       DST), not from the component arithmetic the function itself uses;
//   (b) the cutoff is a local-midnight instant (00:00:00.000) in every case;
//   (c) a session 1 ms before that boundary is OUT and one AT the boundary is IN — the
//       user-visible consequence, identical on both sides of a DST transition.
// It also proves the guard has teeth: the pre-fix `now - N*864e5` form is run through the
// same assertions and MUST fail them.
//
// Run: node scripts/logwindow-dst-smoke.mjs   Exit 0 = safe.

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');

const startIdx = html.indexOf('function logWindowStart(');
if (startIdx === -1) { console.error('could not find logWindowStart'); process.exit(1); }
const endIdx = html.indexOf('\n}', startIdx);
const liveSrc = html.slice(startIdx, endIdx + 2);

// The pre-fix body, kept verbatim as the red probe.
const PRE_FIX_SRC = `function logWindowStart(win) {
  const now = new Date();
  if (win === 'week') return new Date(now.getTime() - 7 * 864e5);
  if (win === 'month') return new Date(now.getTime() - 30 * 864e5);
  return new Date(0);
}`;

// The tempting "almost right" form: anchor to local midnight FIRST, then subtract fixed ms.
// Correct except across a DST date — this is the probe that isolates the DST defect itself.
const MIDNIGHT_MS_SRC = `function logWindowStart(win) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (win === 'week') return new Date(today.getTime() - 7 * 864e5);
  if (win === 'month') return new Date(today.getTime() - 30 * 864e5);
  return new Date(0);
}`;

const ZONES = ['America/Los_Angeles', 'America/New_York', 'Australia/Sydney'];
const CLOCKS = [[0, 0, 30], [1, 30, 0], [12, 0, 0], [22, 59, 59], [23, 59, 59]];
const WINDOWS = { week: 7, month: 30 };

// Load logWindowStart into a context whose `new Date()` (no args) is a fixed instant.
function load(src, fixedNow) {
  class FixedDate extends Date {
    constructor(...a) { if (a.length === 0) super(fixedNow); else super(...a); }
  }
  const ctx = vm.createContext({ Date: FixedDate, cfg: null });
  vm.runInContext(`${src}\nthis.logWindowStart = logWindowStart;`, ctx);
  return ctx.logWindowStart;
}

// Independent oracle: local Y/M/D of `now` -> UTC noon -> minus N days (exact multiples of
// 24h, UTC has no DST) -> read the UTC Y/M/D -> that local midnight.
function oracle(now, n) {
  const noon = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const t = new Date(noon - n * 86400000);
  return new Date(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()).getTime();
}

function sweep(src) {
  const failures = { a: 0, b: 0, c: 0 };
  let scenarios = 0;
  const examples = [];
  for (const tz of ZONES) {
    const prev = process.env.TZ;
    process.env.TZ = tz;
    try {
      for (let doy = 0; doy < 365; doy++) {
        for (const [h, mi, s] of CLOCKS) {
          const now = new Date(2026, 0, 1 + doy, h, mi, s);
          const fn = load(src, now.getTime());
          for (const [win, n] of Object.entries(WINDOWS)) {
            scenarios++;
            const from = fn(win);
            const want = oracle(now, n);
            const tag = `${tz} now=${now.toString().slice(0, 33)} ${win}`;
            if (from.getTime() !== want) { failures.a++; if (examples.length < 3) examples.push(`(a) ${tag}: got ${from.toString().slice(0, 33)}`); }
            if (from.getHours() || from.getMinutes() || from.getSeconds() || from.getMilliseconds()) failures.b++;
            const atBoundaryIn = want >= from.getTime();
            const justBeforeOut = want - 1 < from.getTime();
            if (!atBoundaryIn || !justBeforeOut) failures.c++;
          }
        }
      }
    } finally {
      if (prev === undefined) delete process.env.TZ; else process.env.TZ = prev;
    }
  }
  return { failures, scenarios, examples };
}

let bad = 0;
const live = sweep(liveSrc);
console.log(`logWindowStart sweep (live): ${live.scenarios} scenarios — (a) ${live.failures.a} (b) ${live.failures.b} (c) ${live.failures.c} failures`);
if (live.failures.a + live.failures.b + live.failures.c > 0) {
  bad++;
  live.examples.forEach(e => console.log('  ' + e));
  console.log('FAIL  live logWindowStart is not a DST-safe local calendar-day boundary');
} else {
  console.log('PASS  live logWindowStart is local midnight N calendar days back in every swept zone/day/clock');
}

const red = sweep(PRE_FIX_SRC);
const redTotal = red.failures.a + red.failures.b + red.failures.c;
console.log(`logWindowStart sweep (pre-fix probe): ${red.scenarios} scenarios — (a) ${red.failures.a} (b) ${red.failures.b} (c) ${red.failures.c} failures`);
if (redTotal === 0) {
  bad++;
  console.log('FAIL  red-proof: the pre-fix fixed-ms form passed the sweep, so this guard has no teeth');
} else {
  console.log('PASS  red-proof: the pre-fix fixed-ms form fails the same assertions');
}

const mid = sweep(MIDNIGHT_MS_SRC);
const midTotal = mid.failures.a + mid.failures.b + mid.failures.c;
console.log(`logWindowStart sweep (midnight-then-fixed-ms probe): ${mid.scenarios} scenarios — (a) ${mid.failures.a} (b) ${mid.failures.b} (c) ${mid.failures.c} failures`);
if (mid.failures.a === 0 || mid.failures.a >= mid.scenarios) {
  bad++;
  console.log('FAIL  red-proof: the midnight-then-fixed-ms form must fail ONLY the DST-crossing cases (some, not all) — it did not, so the sweep does not isolate DST');
} else {
  console.log(`PASS  red-proof: midnight-then-fixed-ms fails exactly the DST-crossing windows (${mid.failures.a} of ${mid.scenarios}) and no others`);
}

if (bad) { console.error(`\nlogwindow-dst-smoke: ${bad} check(s) failed`); process.exit(1); }
console.log('\nlogwindow-dst-smoke: PASS');
