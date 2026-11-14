#!/usr/bin/env node
/**
 * bug258-start-path-diagnostic.mjs — BUG-258 (P0, Dani: "Won't let me start my workout").
 *
 * THIS IS A DIAGNOSTIC, NOT A GATE. It is deliberately NOT registered in scripts/verify.mjs:
 * it reports what the PROGRAMMED-day start path does under a stubbed backend, and exits 0
 * unless run with --strict (which turns each finding that violates an honest invariant into
 * a failure, for whoever eventually fixes the path). The BUG-258 prompt orders a
 * reproduction, not a fix — a speculative change to an unreproduced P0 is the failure mode
 * this tracker exists to prevent.
 *
 * Production evidence this works from (read-only SQL, 2026-11-14): Dani's workout_sessions
 * row 0705227e — session_type 'strength' (so NOT the skip path, which stamps 'skipped'),
 * day_type 'day2', completed false, total_volume_lbs NULL, ZERO sets — minted 11 minutes
 * before her report.
 *
 * Two code paths mint that row: the explicit "Start Workout" button (startWorkoutTimer ->
 * startOrResumeSession) and the first logged set (logSet -> startOrResumeSession). The
 * button path mints a row with no set ever required, so a zero-set row is the NORMAL
 * outcome of "tapped Start, did not log" and by itself proves nothing is broken.
 *
 * Stubbing follows control-reachability-walkthrough.mjs: the stub is SERVED AS the SDK
 * (route **\/supabase.min.js) because injecting ahead of the UMD bundle gets overwritten.
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 22400 + Math.floor(Math.random() * 400);
const STRICT = process.argv.includes('--strict');

// workout_sessions is a REAL stub (records inserts, answers the resume lookup from
// window.__open, can be told to fail); every other table is a resolving no-op.
const SUPABASE_STUB = `
  window.__ins = [];            // every workout_sessions insert row
  window.__open = {};           // id -> {id, notes}: sessions the "cloud" considers open
  window.__lookupError = false; // resume lookup answers {data:null, error}
  window.__insertError = false; // insert answers {error}
  let n = 0;
  function autoMock() {
    return new Proxy(function(){}, {
      get: (t, p) => (p === 'then' ? undefined : autoMock()),
      apply: () => Promise.resolve({ data: { session: null, subscription: { unsubscribe(){} } }, error: null }),
    });
  }
  function generic() {
    const res = { data: [], error: null };
    const c = { select: () => c, eq: () => c, neq: () => c, in: () => c, order: () => c, limit: () => c,
      gte: () => c, lte: () => c,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      insert: () => Promise.resolve({ error: null }), upsert: () => Promise.resolve({ error: null }),
      update: () => c, delete: () => c, then: (r) => Promise.resolve(r(res)) };
    return c;
  }
  function sessions() {
    let mode = null, eqId = null;
    const c = {
      select: () => c,
      eq: (k, v) => { if (k === 'id') eqId = v; return c; },
      maybeSingle: () => Promise.resolve(window.__lookupError
        ? { data: null, error: { message: 'network blip' } }
        : { data: window.__open[eqId] || null, error: null }),
      insert: (row) => { mode = 'insert'; window.__ins.push(row); c._row = row; return c; },
      single: () => {
        if (window.__insertError) return Promise.resolve({ data: null, error: { message: 'insert refused' } });
        const id = 'sess-' + (++n); window.__open[id] = { id, notes: null };
        return Promise.resolve({ data: { id }, error: null });
      },
      update: () => c, then: (r) => Promise.resolve(r({ data: [], error: null })),
    };
    return c;
  }
  window.supabase = { createClient: () => new Proxy(function(){}, {
    get: (t, p) => p === 'then' ? undefined : p === 'from' ? (tbl) => tbl === 'workout_sessions' ? sessions() : generic() : autoMock()[p],
    apply: () => Promise.resolve({ data: { session: null }, error: null }),
  }) };
`;

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const reqPath = req.url === '/' ? '/tandem.html' : req.url.split('?')[0];
      const filePath = path.join(ROOT, reqPath);
      if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      const body = await readFile(filePath);   // WORKING-TREE copy, never git show
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': ext === '.js' ? 'application/javascript' : ext === '.html' ? 'text/html' : 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  return new Promise(r => server.listen(PORT, () => r(server)));
}

async function boot(page) {
  await page.route('**/supabase.min.js', r => r.fulfill({ contentType: 'application/javascript', body: SUPABASE_STUB }));
  await page.goto(`http://localhost:${PORT}/tandem.html`);
  await page.waitForFunction(() => typeof window.setLSScope === 'function', { timeout: 15000 });
  return page.evaluate(() => {
    setLSScope('bug258-uid');
    currentUser = { id: 'bug258-uid' };       // signed in, so the cloud branch runs
    cfg = { goal: 'build_muscle', days: 4, weeks: 8, sex: 'M', experience: 'intermediate',
      equipment: 'full_gym', emphasis: 'balanced', weight: 200, targetWeight: 190,
      programSource: 'generated', startDate: null };
    LS.set('tandem_cfg', cfg); LS.set('tandem_week', 1); currentWeek = 1;
    showView('tracker'); renderTracker();
    return { exCards: document.querySelectorAll('.ex-card').length, day: currentDay,
      startBtn: !!document.querySelector('#sessionTimerRow .session-timer-start') };
  });
}

const findings = [];
let strictFailures = 0;
function report(q, answer, evidence, violatesInvariant) {
  findings.push({ q, answer, evidence });
  console.log(`${q}: ${answer}\n      ${evidence}`);
  if (violatesInvariant && STRICT) { strictFailures++; console.log(`      STRICT FAIL — invariant: ${violatesInvariant}`); }
}
const reset = (page) => page.evaluate(() => {
  window.__ins.length = 0; window.__open = {}; window.__lookupError = false; window.__insertError = false;
  LSraw.del('tandem_active_session_id'); LSraw.del('tandem_session_start_time');
  renderTracker();
});
const tapStart = async (page) => { await page.click('#sessionTimerRow .session-timer-start'); await page.waitForTimeout(300); };

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  try {
    const b = await boot(page);
    console.log(`boot: day=${b.day} exercise cards=${b.exCards} Start button present=${b.startBtn}`);
    if (!b.startBtn || !b.exCards) { console.log('FIXTURE BROKEN — findings below would be vacuous'); process.exitCode = 2; return; }

    // Baseline: the happy path really mints exactly one row and a usable tracker remains.
    await reset(page); await tapStart(page);
    const base = await page.evaluate(() => ({ ins: window.__ins.length, key: LSraw.get('tandem_active_session_id'),
      cards: document.querySelectorAll('.ex-card').length, timer: !!document.getElementById('sessionTimerDisplay') }));
    console.log(`baseline: inserts=${base.ins} active-id written=${!!base.key} exercise cards=${base.cards} timer live=${base.timer}`);
    if (base.ins !== 1 || !base.key || !base.cards) { console.log('BASELINE FAILED'); process.exitCode = 2; return; }

    // (a)/(b): a row is minted by the Start button with NO dependence on the exercise list.
    await reset(page);
    await page.evaluate(() => { window.__realGAP = getActiveProgram;
      getActiveProgram = () => [{ key: currentDay, label: 'Empty', blocks: [] }]; renderTracker(); });
    const cardsEmpty = await page.evaluate(() => document.querySelectorAll('.ex-card').length);
    const startShown = await page.evaluate(() => !!document.querySelector('#sessionTimerRow .session-timer-start'));
    if (startShown) await tapStart(page);
    const emp = await page.evaluate(() => ({ ins: window.__ins.length, key: !!LSraw.get('tandem_active_session_id') }));
    report('5a/5b  row minted while tracker has ZERO loggable rows?',
      cardsEmpty === 0 && emp.ins === 1 && emp.key ? 'YES (synthetic: day forced empty)' : `NO (cards=${cardsEmpty} inserts=${emp.ins})`,
      'startOrResumeSession never reads the exercise list; the day was forced empty by replacing getActiveProgram. '
      + 'No real goal/day-count/tier combo was shown to produce an empty day here (persona matrix R-rules cover that).',
      cardsEmpty === 0 && emp.ins === 1 ? 'a session row must not be minted for a day with no loggable exercises' : null);
    await page.evaluate(() => { getActiveProgram = window.__realGAP; });

    // (c1): stale stored id -> a NEW row is minted (documented behaviour, [C11] console.error).
    await reset(page);
    await page.evaluate(() => LSraw.set('tandem_active_session_id', 'ghost-id'));
    await page.evaluate(() => renderTracker()); await tapStart(page);
    const stale = await page.evaluate(() => ({ ins: window.__ins.length, key: LSraw.get('tandem_active_session_id') }));
    report('5c-i   stale stored id forces a new row?', stale.ins === 1 && stale.key !== 'ghost-id' ? 'YES' : 'NO',
      `inserts=${stale.ins}, active id now ${stale.key}`, null);

    // (c2): a TRANSIENT lookup error on a VALID open session is treated as "stale".
    await reset(page);
    await page.evaluate(() => { window.__open['real-open'] = { id: 'real-open', notes: null };
      LSraw.set('tandem_active_session_id', 'real-open'); window.__lookupError = true; renderTracker(); });
    await tapStart(page);
    const blip = await page.evaluate(() => ({ ins: window.__ins.length, key: LSraw.get('tandem_active_session_id'),
      stillOpen: !!window.__open['real-open'] }));
    report('5c-ii  valid open session + lookup ERROR (not "no row") mints a second row?',
      blip.ins === 1 && blip.key !== 'real-open' ? 'YES — REPRODUCED' : 'NO',
      `inserts=${blip.ins}; the original open row still exists server-side=${blip.stillOpen}; local pointer moved to ${blip.key}. `
      + 'Cause by reading: `const { data } = await ...maybeSingle()` discards `error`, so a network error is indistinguishable from "no such session". '
      + 'Effect: the original row (and any sets already on it) is orphaned and a fresh empty row is stranded.',
      'a lookup ERROR must not be treated as "session does not exist"; it must not mint a second session');

    // (c3): can it happen twice in one sitting? Second mint via the logSet path after the first row is closed elsewhere.
    await reset(page); await tapStart(page);
    await page.evaluate(() => { for (const k of Object.keys(window.__open)) delete window.__open[k]; });
    const second = await page.evaluate(async () => { await startOrResumeSession(); return window.__ins.length; });
    report('5c-iii same sitting, a second row minted?', second === 2 ? 'YES' : 'NO',
      `inserts=${second} — reachable when the first row is completed/removed from another device or tab while this one still holds its id`, null);

    // (d): row minted AND user shown no usable tracker AND no error?
    await reset(page); await page.evaluate(() => { window.__insertError = true; });
    await tapStart(page);
    const ie = await page.evaluate(() => ({ ins: window.__ins.length, key: LSraw.get('tandem_active_session_id'),
      toast: (document.getElementById('prToast')?.textContent || '').trim(),
      startAgain: !!document.querySelector('#sessionTimerRow .session-timer-start'),
      timer: !!document.getElementById('sessionTimerDisplay') }));
    report('5d-i   insert REFUSED: user told?', /could not start/i.test(ie.toast) ? 'YES (toast)' : `NO TOAST FOUND (toast="${ie.toast}")`,
      `row minted=${ie.ins === 1 && !!ie.key}; Start button shown again=${ie.startAgain}; timer live=${ie.timer}. `
      + 'On this branch the user sees "Could not start session — try again" and the same Start button, i.e. "won\'t let me start". '
      + 'But Dani\'s production row WAS created, so the insert did not fail for her at 01:12Z.', null);
    report('5d-ii  row minted + no usable tracker + no error?', 'NOT REPRODUCED',
      'Every branch exercised above either leaves the exercise cards rendered (baseline, stale id, lookup blip) or shows a toast (insert refused). '
      + 'The only no-cards case is the synthetic empty day in 5a/5b, which still shows the timer.', null);

    if (errs.length) console.log('page errors during run:', errs.slice(0, 3));
    console.log('\nWHAT DANI\'S ROW IS CONSISTENT WITH: tapped Start Workout (button mints the row with zero sets) and did not log a set on that session; '
      + 'OR a transient lookup error (5c-ii) minted a duplicate empty row behind a session she then used. '
      + 'NOT CONSISTENT WITH: the skip path (session_type is "strength", skip stamps "skipped"). '
      + 'NOT PROVEN: that either is what she experienced — no reproduction of "won\'t let me start".');
  } finally { await browser.close(); server.close(); }
  if (STRICT && strictFailures) { console.log(`\n${strictFailures} strict invariant violation(s)`); process.exitCode = 1; }
})();
