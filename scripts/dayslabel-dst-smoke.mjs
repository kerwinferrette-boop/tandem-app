// dayslabel-dst-smoke.mjs
// Regression guard for BUG-249: the dashboard PR card's TODAY / YESTERDAY / weekday label
// computed daysAgo as Math.floor((localMidnight - when) / 86400000). A local day is 23h on a
// spring-forward date and 25h on a fall-back one, so the quotient lands short or long and the
// floor drops a whole day (a session two calendar days back labelled YESTERDAY). Same class as
// BUG-27 (calendarDaysBetween) and BUG-145 (logWindowStart; see logwindow-dst-smoke.mjs).
//
// Extracts the LIVE calendarDaysBetween() and localDaysAgo() from the WORKING TREE's
// tandem.html (never a git ref, never a re-implementation) and sweeps localDaysAgo against an
// INDEPENDENT oracle (UTC-noon calendar-day count) over every day of 2026 x 5 clock times x
// 4 zones (incl. half-hour-offset Lord Howe) x offsets 0..10 days back. Two red probes (the
// pre-fix floor/86400000 form, and a round()-based fixed-ms form) must FAIL the same sweep.
//
// Run: node scripts/dayslabel-dst-smoke.mjs   Exit 0 = safe.

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');

function grab(sig) {
  const i = html.indexOf(sig);
  if (i === -1) { console.error('could not find ' + sig); process.exit(1); }
  return html.slice(i, html.indexOf('\n}', i) + 2);
}
const LIVE = grab('function calendarDaysBetween(') + '\n' + grab('function localDaysAgo(');

// Pre-fix body (the exact defective expression), kept as the red probe.
const PRE_FIX = `function localDaysAgo(dateStr, now = new Date()) {
  const when = new Date(dateStr + 'T00:00:00');
  return Math.floor((new Date(now).setHours(0, 0, 0, 0) - when.getTime()) / 86400000);
}`;
// Tempting "almost right" form: ceil() instead of floor() — wrong the other way across DST;
// shows no fixed-ms rounding choice rescues the division.
const ROUND_PROBE = `function localDaysAgo(dateStr, now = new Date()) {
  const when = new Date(dateStr + 'T00:00:00');
  return Math.ceil((new Date(now).setHours(0, 0, 0, 0) - when.getTime()) / 86400000);
}`;

const ZONES = ['America/Los_Angeles', 'America/New_York', 'Pacific/Auckland', 'Australia/Lord_Howe'];
const CLOCKS = [[0, 0, 30], [1, 30, 0], [2, 30, 0], [12, 0, 0], [23, 59, 59]];
const pad = n => String(n).padStart(2, '0');

function load(src) {
  const ctx = vm.createContext({ Date });
  vm.runInContext(`${src}\nthis.localDaysAgo = localDaysAgo;`, ctx);
  return ctx.localDaysAgo;
}
// Independent oracle: local Y/M/D of each endpoint -> UTC noon -> exact multiple of 24h.
function oracle(now, y, m, d) {
  return Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12) - Date.UTC(y, m, d, 12)) / 86400000);
}

function sweep(src) {
  const fn = load(src);
  let scenarios = 0, failures = 0;
  const examples = [];
  for (const tz of ZONES) {
    const prev = process.env.TZ;
    process.env.TZ = tz;
    try {
      for (let doy = 0; doy < 365; doy++) {
        for (const [h, mi, s] of CLOCKS) {
          const now = new Date(2026, 0, 1 + doy, h, mi, s);
          for (let back = 0; back <= 10; back++) {
            const t = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - back, 12));
            const y = t.getUTCFullYear(), m = t.getUTCMonth(), d = t.getUTCDate();
            const str = `${y}-${pad(m + 1)}-${pad(d)}`;
            scenarios++;
            const got = fn(str, now), want = oracle(now, y, m, d);
            if (got !== want) { failures++; if (examples.length < 3) examples.push(`${tz} now=${now.toString().slice(0, 33)} date=${str}: got ${got}, want ${want}`); }
          }
        }
      }
    } finally {
      if (prev === undefined) delete process.env.TZ; else process.env.TZ = prev;
    }
  }
  return { scenarios, failures, examples };
}

let bad = 0;
const live = sweep(LIVE);
console.log(`localDaysAgo sweep (live): ${live.scenarios} scenarios — ${live.failures} failures`);
if (live.failures) { bad++; live.examples.forEach(e => console.log('  ' + e)); console.log('FAIL  live localDaysAgo is not a DST-safe calendar-day count'); }
else console.log('PASS  live localDaysAgo equals the UTC-noon calendar-day count in every swept zone/day/clock/offset');

for (const [name, src] of [['pre-fix floor/86400000', PRE_FIX], ['ceil/86400000', ROUND_PROBE]]) {
  const r = sweep(src);
  console.log(`localDaysAgo sweep (${name} probe): ${r.scenarios} scenarios — ${r.failures} failures`);
  if (r.failures === 0) { bad++; console.log(`FAIL  red-proof: the ${name} form passed the sweep, so this guard has no teeth`); }
  else console.log(`PASS  red-proof: the ${name} form fails the same sweep`);
}

if (bad) { console.error(`\ndayslabel-dst-smoke: ${bad} check(s) failed`); process.exit(1); }
console.log('\ndayslabel-dst-smoke: PASS');
