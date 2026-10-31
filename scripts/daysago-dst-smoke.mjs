// daysago-dst-smoke.mjs
// Regression guard for BUG-249: the dashboard PR tag ("NEW PR · TODAY / YESTERDAY /
// <WEEKDAY> / <DATE>") computed its day count as
//   Math.floor((new Date().setHours(0,0,0,0) - when.getTime()) / 86400000)
// A local calendar day is 23h on a spring-forward date, so a session two calendar days back
// floored to 1 and labelled itself YESTERDAY. Same defect class as BUG-27
// (calendarDaysBetween) and BUG-145 (logWindowStart, see logwindow-dst-smoke.mjs).
//
// This loads the LIVE calendarDaysBetween() and daysAgoFrom() out of the WORKING-TREE
// tandem.html (no re-implementation, never a git ref) and sweeps them over every day of
// 2026 x 5 clock times (incl. inside the transition hour) x 4 zones x 13 lookbacks, against an
// INDEPENDENT oracle: it walks local calendar days one `new Date(y, m, d + 1)` at a time and
// counts steps until the Y/M/D components match. It uses neither UTC arithmetic nor ms division,
// so it shares no code path with the function under test.
// It also proves the guard has teeth: the pre-fix expression is run through the same sweep and
// MUST fail it (red probe).
//
// Run: node scripts/daysago-dst-smoke.mjs   Exit 0 = safe.

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8'); // working tree, on purpose

function extract(name) {
  const i = html.indexOf(`function ${name}(`);
  if (i === -1) { console.error(`FAIL  could not find function ${name} in tandem.html`); process.exit(1); }
  const j = html.indexOf('\n}', i);
  return html.slice(i, j + 2);
}
const liveSrc = extract('calendarDaysBetween') + '\n' + extract('daysAgoFrom');

// The pre-fix expression, verbatim, as the red probe.
const PRE_FIX_SRC = `function daysAgoFrom(when, now) {
  return Math.floor((new Date(now).setHours(0, 0, 0, 0) - when.getTime()) / 86400000);
}`;
const ZONES = ['America/Los_Angeles', 'America/New_York', 'Pacific/Auckland', 'Australia/Lord_Howe'];
const CLOCKS = [[0, 0, 30], [1, 30, 0], [2, 15, 0], [12, 0, 0], [23, 59, 59]];
const LOOKBACKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 14, 30, 90, 200];

function load(src) {
  const ctx = vm.createContext({});
  vm.runInContext(`${src}\nthis.daysAgoFrom = daysAgoFrom;`, ctx);
  return ctx.daysAgoFrom;
}

// Independent oracle: step local calendar days forward from `when` until Y/M/D equals now's.
function oracle(when, now) {
  let steps = 0;
  let d = new Date(when.getFullYear(), when.getMonth(), when.getDate());
  const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const nowAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() >= d.getTime();
  if (!nowAfter) return null; // not used: lookbacks are all >= 0
  while (!same(d, now)) { steps++; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); if (steps > 1000) throw new Error('oracle runaway'); }
  return steps;
}

function sweep(src) {
  const fn = load(src);
  let scenarios = 0, failures = 0;
  const examples = [];
  const prev = process.env.TZ;
  try {
    for (const tz of ZONES) {
      process.env.TZ = tz;
      for (let doy = 0; doy < 365; doy++) {
        for (const [h, mi, s] of CLOCKS) {
          const now = new Date(2026, 0, 1 + doy, h, mi, s);
          for (const k of LOOKBACKS) {
            // `when` exactly as the call site builds it: new Date(localDateStr + 'T00:00:00')
            const wd = new Date(2026, 0, 1 + doy - k);
            const ds = `${wd.getFullYear()}-${String(wd.getMonth() + 1).padStart(2, '0')}-${String(wd.getDate()).padStart(2, '0')}`;
            const when = new Date(ds + 'T00:00:00');
            scenarios++;
            const got = fn(when, now);
            if (got !== k || oracle(when, now) !== k) {
              failures++;
              if (examples.length < 3) examples.push(`${tz} now=${now.toString().slice(0, 33)} lookback=${k}: got ${got}`);
            }
          }
        }
      }
    }
  } finally {
    if (prev === undefined) delete process.env.TZ; else process.env.TZ = prev;
  }
  return { scenarios, failures, examples };
}

let bad = 0;
// Call-site wiring (council 2026-10-31): the sweep proves the helper; this proves renderLatestPR USES it.
{
  const a = html.indexOf('function renderLatestPR(');
  const b = a === -1 ? -1 : html.indexOf('\n}', a);
  const body = a === -1 ? '' : html.slice(a, b);
  if (!body.includes('daysAgoFrom(') || body.includes('86400000')) {
    bad++;
    console.log('FAIL  renderLatestPR does not call daysAgoFrom() or still divides by 86400000');
  } else {
    console.log('PASS  renderLatestPR computes daysAgo via daysAgoFrom() with no inline 86400000');
  }
}
const live = sweep(liveSrc);
console.log(`daysAgoFrom sweep (live): ${live.scenarios} scenarios — ${live.failures} failures`);
if (live.failures > 0) {
  bad++;
  live.examples.forEach(e => console.log('  ' + e));
  console.log('FAIL  live daysAgoFrom is not a DST-safe whole-local-calendar-day count');
} else {
  console.log('PASS  live daysAgoFrom counts whole local calendar days in every swept zone/day/clock/lookback');
}

for (const [label, src] of [['pre-fix floor/86400000', PRE_FIX_SRC]]) {
  const red = sweep(src);
  if (red.failures === 0) {
    bad++;
    console.log(`FAIL  red probe (${label}) passed the sweep — the guard has no teeth`);
  } else {
    console.log(`PASS  red probe (${label}) fails ${red.failures}/${red.scenarios} scenarios, as it must`);
  }
}

process.exit(bad ? 1 : 0);
