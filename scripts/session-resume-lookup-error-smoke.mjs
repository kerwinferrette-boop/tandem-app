#!/usr/bin/env node
/**
 * session-resume-lookup-error-smoke.mjs — BUG-260 guard.
 *
 * startOrResumeSession() resumes a stored open workout_sessions row. It used to do
 * `const { data } = await ...maybeSingle()` and DISCARD `error`, so a transient network
 * error on a VALID open session was read as "no such session": the local pointer was
 * deleted and a second empty row minted, orphaning the first and any sets on it.
 * A lookup ERROR is "unknown", not "absent".
 *
 * Asserts (Playwright, Supabase SDK served as a stub, working-tree tandem.html):
 *   [S1] baseline  — Start with no stored id mints exactly 1 row.
 *   [S2] stale id  — a stored id the server answers "no row" for STILL mints one new row
 *                    (the documented [C11] behaviour must survive the fix).
 *   [S3] lookup ERROR on a valid open session mints NOTHING and keeps the stored id.
 *   [S4] ...and the user is told (toast), not silently left with a dead Start button.
 *   [S5] the error path reaches the logSet caller too: startOrResumeSession() rejects.
 *   [S6] a deterministic 22P02 (malformed stored id) is stale by construction: mints one new row,
 *        clears the bad pointer (council 2026-11-15 — fail closed only for UNKNOWN errors).
 *   [S7] RLS 42501 stays unknown: no mint, id kept.
 * Harness lifted from the BUG-258 diagnostic (branch claude/keen-lovelace-nrql2r, 863cd43).
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { blankToast, waitForToast } from './lib/toast-wait.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 22400 + Math.floor(Math.random() * 400);

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
        ? { data: null, error: (typeof window.__lookupError === 'object' ? window.__lookupError : { message: 'network blip' }) }
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
    setLSScope('bug260-uid');
    currentUser = { id: 'bug260-uid' };       // signed in, so the cloud branch runs
    cfg = { goal: 'build_muscle', days: 4, weeks: 8, sex: 'M', experience: 'intermediate',
      equipment: 'full_gym', emphasis: 'balanced', weight: 200, targetWeight: 190,
      programSource: 'generated', startDate: null };
    LS.set('tandem_cfg', cfg); LS.set('tandem_week', 1); currentWeek = 1;
    showView('tracker'); renderTracker();
    return { exCards: document.querySelectorAll('.ex-card').length, day: currentDay,
      startBtn: !!document.querySelector('#sessionTimerRow .session-timer-start') };
  });
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
  const fails = [];
  const check = (id, ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${id} ${msg}`); if (!ok) fails.push(id); };
  try {
    const b = await boot(page);
    if (!b.startBtn || !b.exCards) { console.log('FIXTURE BROKEN — assertions would be vacuous'); process.exit(2); }

    await reset(page); await tapStart(page);
    const base = await page.evaluate(() => ({ ins: window.__ins.length, key: LSraw.get('tandem_active_session_id') }));
    check('[S1]', base.ins === 1 && !!base.key, `baseline mints exactly one row (inserts=${base.ins})`);

    await reset(page);
    await page.evaluate(() => { LSraw.set('tandem_active_session_id', 'ghost-id'); renderTracker(); });
    await tapStart(page);
    const stale = await page.evaluate(() => ({ ins: window.__ins.length, key: LSraw.get('tandem_active_session_id') }));
    check('[S2]', stale.ins === 1 && stale.key && stale.key !== 'ghost-id', `stale id (server says no row) still mints one new row (inserts=${stale.ins}, key=${stale.key})`);

    await reset(page);
    await page.evaluate(() => { window.__open['real-open'] = { id: 'real-open', notes: null };
      LSraw.set('tandem_active_session_id', 'real-open'); window.__lookupError = true; renderTracker(); });
    // BUG-278: blank the toast first, then wait for THIS action's terminal text (fail closed),
    // instead of trusting the 300 ms inside tapStart to have been long enough.
    await blankToast(page);
    await tapStart(page);
    await waitForToast(page, /could not start/i, { mode: 'throw' });
    const blip = await page.evaluate(() => ({ ins: window.__ins.length, key: LSraw.get('tandem_active_session_id'),
      toast: (document.getElementById('prToast')?.textContent || '').trim() }));
    check('[S3]', blip.ins === 0 && blip.key === 'real-open', `lookup ERROR mints nothing and keeps the stored id (inserts=${blip.ins}, key=${blip.key})`);
    check('[S4]', /could not start/i.test(blip.toast), `user is told (toast="${blip.toast}")`);

    const rejected = await page.evaluate(async () => {
      try { await startOrResumeSession(); return false; } catch (e) { return true; } });
    const after = await page.evaluate(() => ({ ins: window.__ins.length, key: LSraw.get('tandem_active_session_id') }));
    check('[S5]', rejected && after.ins === 0 && after.key === 'real-open', `startOrResumeSession rejects on lookup error, no mint (rejected=${rejected}, inserts=${after.ins})`);

    await reset(page);
    await page.evaluate(() => { LSraw.set('tandem_active_session_id', 'not-a-uuid');
      window.__lookupError = { code: '22P02', message: 'invalid input syntax for type uuid' }; renderTracker(); });
    await tapStart(page);
    const bad = await page.evaluate(() => ({ ins: window.__ins.length, key: LSraw.get('tandem_active_session_id') }));
    check('[S6]', bad.ins === 1 && bad.key && bad.key !== 'not-a-uuid', `22P02 malformed id self-heals: one new row, bad pointer replaced (inserts=${bad.ins}, key=${bad.key})`);

    await reset(page);
    await page.evaluate(() => { window.__open['real-open'] = { id: 'real-open', notes: null };
      LSraw.set('tandem_active_session_id', 'real-open');
      window.__lookupError = { code: '42501', message: 'permission denied' }; renderTracker(); });
    await tapStart(page);
    const rls = await page.evaluate(() => ({ ins: window.__ins.length, key: LSraw.get('tandem_active_session_id') }));
    check('[S7]', rls.ins === 0 && rls.key === 'real-open', `RLS 42501 stays unknown: no mint, id kept (inserts=${rls.ins}, key=${rls.key})`);
  } finally { await browser.close(); server.close(); }
  if (fails.length) { console.log(`\nBUG-260 smoke FAILED: ${fails.join(' ')}`); process.exit(1); }
  console.log('\nBUG-260 session-resume lookup-error smoke: all assertions hold');
})();
