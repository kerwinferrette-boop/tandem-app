#!/usr/bin/env node
/**
 * weekday-render-smoke.mjs — BUG-239: the weekday/date the app RENDERS is the user's local day.
 *
 * WHY THIS EXISTS
 * ---------------
 * Kerwin's 2026-06-13 report was "Friday instead of Saturday". The root cause (a UTC date-slice,
 * toISOString().split('T')[0], rolling the day across the UTC boundary) was fixed in a797bf5f and is
 * guarded at the ARITHMETIC layer by calendar-day-smoke.mjs (day counts across DST). Nobody ever read
 * the rendered pixel under a forced non-UTC timezone, so the symptom itself was never measured.
 *
 * WHAT IT DOES
 * ------------
 * For each scenario it opens a real Chromium context with the browser's own `timezoneId` (NOT the
 * container TZ env var — they are not equivalent) and a fixed wall-clock instant chosen so the LOCAL
 * calendar day differs from the UTC calendar day, then builds a program through the real wizard and reads
 * back from the DOM (never from an engine return value):
 *   [D1] #ob-start-date.value        — the start-date picker the user sees, set by the init IIFE
 *   [D2] cfg.startDate               — the date the built program is anchored to
 *   [D3] #dashDate                   — the dashboard's weekday header
 *   [D4] .dash-rhythm-seg.today .dash-rhythm-day — the rhythm strip's "today" weekday letter
 *   [D5] the dashDot0..6 carrying the today marker (2px border) — Mon-first index of today
 * Scenarios cover a UTC-negative zone (evening local, UTC already tomorrow), a UTC-positive zone (early
 * morning local, UTC still yesterday), and the exact "Friday evening" case the localDateStr() comment names.
 *
 * PROVEN RED, BY THE SCRIPT ITSELF: after the real run it re-runs every scenario with localDateStr
 * replaced (in the served copy of tandem.html) by the PRE-FIX form (toISOString().split('T')[0]) and REQUIRES at least one date check
 * to fail in every scenario. A probe that stays green with the fix removed is vacuous, and this script then
 * exits 1 itself. [D3]-[D5] derive from getDay(), not localDateStr(), so they are expected to hold in both
 * runs; they are asserted in the real run only and are not part of the red-proof.
 *
 * NOT COVERED, said plainly: the weekday label of an individual program day inside the tracker (the app
 * labels days "Day N"/by focus, not by weekday); the DST transition itself (calendar-day-smoke.mjs); a
 * device's own clock. Production is behind origin/main (BUG-215), so this reads a LOCAL build only.
 */
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 24000 + Math.floor(Math.random() * 500) /* >10080 and <32768: see scripts/test-port-range-smoke.mjs */;

const SUPABASE_STUB = `
  function autoMock() {
    return new Proxy(function(){}, {
      get: (t, prop) => { if (prop === 'then') return undefined; return autoMock(); },
      apply: () => Promise.resolve({ data: { session: null, subscription: { unsubscribe(){} } }, error: null }),
    });
  }
  window.supabase = { createClient: () => autoMock() };
`;

// instant = the fixed wall-clock; localDate/weekday = what a person in that zone sees at that instant.
// Dates verified against the calendar: 2026-06-13 is a Saturday (Kerwin's report date).
const SCENARIOS = [
  { name: 'UTC-negative evening (Los_Angeles, Sat 21:00 PDT = Sun 04:00Z)', tz: 'America/Los_Angeles',
    instant: '2026-06-14T04:00:00Z', localDate: '2026-06-13', weekday: 'Saturday', letter: 'SA', dot: 5 },
  { name: 'UTC-positive early morning (Auckland, Sat 01:00 NZST = Fri 13:00Z)', tz: 'Pacific/Auckland',
    instant: '2026-06-12T13:00:00Z', localDate: '2026-06-13', weekday: 'Saturday', letter: 'SA', dot: 5 },
  { name: 'Friday evening (New_York, Fri 20:00 EDT = Sat 00:00Z) — the case localDateStr() names', tz: 'America/New_York',
    instant: '2026-06-13T00:00:00Z', localDate: '2026-06-12', weekday: 'Friday', letter: 'FR', dot: 4 },
];

// Red-proof variant: the served page's localDateStr() body swapped for the pre-fix UTC slice. Asserts the
// anchor matched exactly once, so a mutation that missed its target cannot masquerade as a vacuous probe.
let SERVE_PREFIX = false;
const FIXED_BODY = "return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];";
function prefixVariant(html) {
  const n = html.split(FIXED_BODY).length - 1;
  if (n !== 1) { console.error(`red-proof anchor matched ${n} times (need exactly 1) — localDateStr() changed shape; update this script`); process.exit(2); }
  const out = html.replace(FIXED_BODY, "return d.toISOString().split('T')[0];");
  if (out === html) { console.error('red-proof mutation did not land'); process.exit(2); }
  return out;
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const reqPath = req.url === '/' ? '/tandem.html' : req.url.split('?')[0];
      const filePath = path.join(ROOT, reqPath);
      if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      let body = await readFile(filePath);
      if (SERVE_PREFIX && reqPath === '/tandem.html') body = prefixVariant(body.toString('utf8'));
      const ext = path.extname(filePath);
      const type = ext === '.js' ? 'application/javascript' : ext === '.html' ? 'text/html' : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  return new Promise(resolve => server.listen(PORT, () => resolve(server)));
}

async function buildProgram(page) {
  await page.goto(`http://localhost:${PORT}/tandem.html`);
  await page.waitForTimeout(250);
  await page.evaluate(() => { if (typeof skipAuth === 'function') skipAuth(); });
  await page.waitForTimeout(150);
  await page.click(`.goal-card[onclick*="selectGoal('build_muscle'"]`);
  await page.click('#obNextBtn');
  // Path Gate: first Next off the Goal step shows the Build-vs-Library fork (see onboarding-lifecycle-walkthrough)
  await page.click(`button.ob-build-btn[onclick*="resumePath('build')"]`);
  await page.fill('#ob-weight', '225');
  await page.fill('#ob-target-weight', '195');
  await page.click('[onclick*="selectSex(\'M\'"]');
  await page.click('[onclick*="selectExperience(\'intermediate\'"]');
  await page.click('#obNextBtn');
  await page.fill('#ob-weeks', '8');
  await page.click('.day-dot[onclick*="selectDays(4"]');
  // [D1] read the start-date picker the user sees on the schedule step, before Build touches it
  const pickerValue = await page.inputValue('#ob-start-date');
  await page.click('#obNextBtn');
  await page.click('[onclick*="selectWorkoutTime(\'morning\'"]');
  await page.click('#obNextBtn');
  for (let i = 0; i < 4; i++) {
    if (await page.isVisible('.ob-build-btn').catch(() => false)) break;
    if (!(await page.isVisible('#obNextBtn').catch(() => false))) break;
    await page.click('#obNextBtn').catch(() => {});
    await page.waitForTimeout(80);
  }
  if (!(await page.isVisible('.ob-build-btn').catch(() => false))) throw new Error('Build button never appeared');
  await page.click('.ob-build-btn');
  await page.waitForTimeout(350);
  return pickerValue;
}

async function measure(browser, sc, { preFix }) {
  const ctx = await browser.newContext({ timezoneId: sc.tz, locale: 'en-US' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(SUPABASE_STUB);
  await page.clock.setFixedTime(new Date(sc.instant));
  SERVE_PREFIX = !!preFix;
  let picker;
  try { picker = await buildProgram(page); } catch (e) { await ctx.close().catch(() => {}); return { error: String(e), errors }; }
  const r = await page.evaluate(() => {
    renderDashboard();
    const dots = ['dashDot0','dashDot1','dashDot2','dashDot3','dashDot4','dashDot5','dashDot6']
      .map(id => document.getElementById(id));
    const todayDots = dots.map((el, i) => (el && el.style.borderWidth === '2px') ? i : -1).filter(i => i >= 0);
    return {
      startDate: cfg && cfg.startDate,
      localDateStrNow: localDateStr(),
      dashDate: document.getElementById('dashDate')?.textContent || '',
      rhythmToday: document.querySelector('.dash-rhythm-seg.today .dash-rhythm-day')?.textContent || '',
      todayDots,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      nowIso: new Date().toISOString(),
    };
  });
  await ctx.close();
  return { picker, ...r, errors };
}

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};

const server = await startServer();
const browser = await chromium.launch();
try {
  console.log('── real run (the shipped localDateStr) ──');
  for (const sc of SCENARIOS) {
    console.log(`\n${sc.name}`);
    const m = await measure(browser, sc, { preFix: false });
    if (m.error) { check(`${sc.tz}: wizard reached Build`, false, m.error); continue; }
    console.log(`   mechanism: browser-context timezoneId=${sc.tz}; page tz=${m.tz}; fixed instant ${m.nowIso}`);
    check(`${sc.tz}: browser really is in ${sc.tz} at the fixed instant`, m.tz === sc.tz && m.nowIso === new Date(sc.instant).toISOString(), `tz=${m.tz} now=${m.nowIso}`);
    check(`[D1] #ob-start-date shows ${sc.localDate}`, m.picker === sc.localDate, `got ${m.picker}`);
    check(`[D2] cfg.startDate is ${sc.localDate}`, m.startDate === sc.localDate, `got ${m.startDate}`);
    check(`[D3] #dashDate starts with ${sc.weekday}`, m.dashDate.startsWith(sc.weekday), `got "${m.dashDate}"`);
    check(`[D4] rhythm strip today letter is ${sc.letter}`, m.rhythmToday.toUpperCase() === sc.letter, `got "${m.rhythmToday}"`);
    check(`[D5] today-marked dot is index ${sc.dot}`, m.todayDots.length === 1 && m.todayDots[0] === sc.dot, `got ${JSON.stringify(m.todayDots)}`);
    check(`${sc.tz}: no page errors`, m.errors.length === 0, m.errors.join(' | '));
  }

  console.log('\n── red-proof: same scenarios with localDateStr replaced by the PRE-FIX UTC slice; the date checks MUST fail ──');
  for (const sc of SCENARIOS) {
    const m = await measure(browser, sc, { preFix: true });
    if (m.error) { check(`red-proof ${sc.tz}: ran`, false, m.error); continue; }
    const wentRed = m.picker !== sc.localDate || m.startDate !== sc.localDate;
    check(`red-proof ${sc.tz}: pre-fix form produces a WRONG date (picker=${m.picker}, startDate=${m.startDate}, expected ${sc.localDate})`, wentRed,
      'the probe stayed green with the fix removed — it cannot detect this defect');
  }
} finally {
  await browser.close();
  server.close();
}

if (failures) { console.log(`\n${failures} FAILURE(S)`); process.exit(1); }
console.log('\nweekday-render-smoke: PASS (rendered weekday/date correct in all zones; probe proven red against the pre-fix form)');
