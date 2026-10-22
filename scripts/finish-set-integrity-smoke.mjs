#!/usr/bin/env node
/**
 * finish-set-integrity-smoke.mjs — a finished session may not claim volume its sets
 * table cannot account for, and may not report success when sets did not land.
 *
 * ORIGIN (BUG-230 / BUG-16). A read-only prod audit on 2026-10-21 found 15 of 24
 * completed sessions whose workout_sessions.total_volume_lbs EXCEEDS the sum of
 * weight_lbs*reps over their own sets rows — 71,530 lbs unaccounted for, all between
 * 2026-06-09 and 2026-08-04, every session from 2026-09-10 on reconciling exactly. The
 * loss is at WHOLE-EXERCISE granularity: survivors keep complete contiguous set_number
 * blocks, so nothing was truncated mid-exercise; whole exercises are simply absent.
 *
 * WHAT THIS GATE DRIVES. The REAL finishSession() in a REAL browser against a
 * PostgREST-shaped mock that can reject `sets` inserts the way live Postgres did
 * (BUG-75 mode A: a NULL estimated_1rm_lbs made the PR trigger violate NOT NULL on
 * personal_records and ERROR 23502 aborted the WHOLE batch INSERT — one statement, so
 * one rejected row takes that entire exercise with it; that is where whole-exercise
 * granularity comes from). The harness asserts the completion contract, not the cause:
 *
 * THE CONTRACT THIS ASSERTS — and the one it deliberately does NOT.
 * It does NOT assert `total_volume_lbs <= SUM(sets)`. Kerwin's standing call on the audit
 * is that total_volume_lbs is the TRUSTWORTHY number and `sets` is the incomplete one, so
 * an invariant demanding they match could only be satisfied by reducing a session's volume
 * to a short table — deleting real training history to make a gate look tidy. (This gate's
 * first draft did assert exactly that, and the fix "failed" it by keeping the lifted
 * volume. The assertion was wrong, not the fix.) What the app owes the user is not equal
 * numbers; it is that an unaccountable session is LOUD and RECOVERABLE:
 *
 *   [A1] sets are missing after the repair pass -> the tandem_history row that holds the
 *        only remaining copy carries setsUnsynced, and volumeUnaccounted equal to the
 *        shortfall. An unmarked loss is the defect.
 *   [A2] sets are missing -> the save message must NOT claim success. "Session saved" over
 *        12 sets that never left the device is the "reports success" defect itself.
 *   [A3] the marker reaches a PIXEL: the History modal renders a visible not-synced badge.
 *        A marker nothing renders is a dead value (CLAUDE.md), so this is not optional.
 *   [A4] the lifted volume is NOT reduced to match the short table — no training history is
 *        deleted to satisfy A1.
 *   [A5] all of A1-A4 hold when the loss is PARTIAL, not just total. The pre-fix rescue
 *        only fired on an EMPTY table, so a partial loss was accepted in silence.
 *   [A6] with every insert accepted: completes, all 12 sets land, stored == summed, and
 *        there is NO marker, NO badge and a success message. Without A6 this gate could be
 *        passed by refusing to save anything, or by crying wolf on every session.
 *   [A7] the repair pass actually repairs and is idempotent: sets the live sync dropped are
 *        inserted at finish, exactly once, with no duplicate (exercise_name, set_number).
 *
 * NOT covered, said plainly: this proves the CLIENT contract against a mock. It cannot see
 * prod, so it says nothing about whether the 15 damaged rows are repairable, and it does
 * not assert WHY a given insert fails — only what the app must do when one does. The
 * 2026-06..08 rows were written by a build this harness does not run.
 *
 * Run: node scripts/finish-set-integrity-smoke.mjs
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SB_CANDIDATES = [
  process.env.SB_UMD_PATH,
  path.join(ROOT, 'node_modules/@supabase/supabase-js/dist/umd/supabase.js'),
].filter(Boolean);
const SB_UMD = SB_CANDIDATES.find(p => { try { return statSync(p).isFile(); } catch { return false; } });
if (!SB_UMD) { console.error('FAIL  install @supabase/supabase-js@2 (npm ci) or set SB_UMD_PATH'); process.exit(1); }

const UID = 'e5074b4c-3808-4338-aeb7-b9db59d61f49';
const APP_PORT = 22900 + Math.floor(Math.random() * 300); /* >10080, <32768 — scripts/test-port-range-smoke.mjs */
const API_PORT = APP_PORT + 1;
const SESSION_ID = '11111111-2222-4333-8444-555555555555';

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const USER_JWT = [b64u({ alg: 'HS256', typ: 'JWT' }),
  b64u({ sub: UID, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 86400 }), 'sig'].join('.');

// ── the "cloud" ──────────────────────────────────────────────────────────
let setRows = [];        // public.sets
let sessionRow = null;   // the one public.workout_sessions row under test
let rejectSetInserts = false;
let setInsertAttempts = 0, setInsertRejections = 0;

const resetCloud = () => {
  setRows = [];
  sessionRow = { id: SESSION_ID, user_id: UID, completed: false, total_volume_lbs: null };
  rejectSetInserts = false; setInsertAttempts = 0; setInsertRejections = 0;
};

const eqFilters = (url) => {
  const out = {};
  for (const [k, v] of new URL(url, 'http://x').searchParams) {
    if (String(v).startsWith('eq.')) out[k] = String(v).slice(3);
  }
  return out;
};

const api = http.createServer(async (req, res) => {
  let body = ''; for await (const c of req) body += c;
  const url = req.url || '';
  const send = (code, payload) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Expose-Headers': '*' });
    res.end(JSON.stringify(payload ?? null));
  };
  if (req.method === 'OPTIONS') return send(200, {});
  if (url.startsWith('/auth/v1/user')) return send(200, { id: UID, aud: 'authenticated', role: 'authenticated' });
  if (url.startsWith('/auth/v1/token')) return send(200, { access_token: USER_JWT, token_type: 'bearer', expires_in: 86400, refresh_token: 'r', user: { id: UID } });

  // ── sets ──
  if (url.startsWith('/rest/v1/sets')) {
    if (req.method === 'POST') {
      setInsertAttempts++;
      if (rejectSetInserts) {
        setInsertRejections++;
        // The live shape: one statement, so the WHOLE batch is refused.
        return send(400, { code: '23502', message: 'null value in column "best_estimated_1rm_lbs" violates not-null constraint' });
      }
      const incoming = JSON.parse(body || '[]');
      (Array.isArray(incoming) ? incoming : [incoming]).forEach((r, i) =>
        setRows.push({ id: `set-${setRows.length + i}`, is_pr: false, ...r }));
      return send(201, Array.isArray(incoming) ? incoming.map((_, i) => ({ id: `set-${setRows.length - 1 + i}` })) : [{ id: `set-${setRows.length - 1}` }]);
    }
    if (req.method === 'GET') {
      const f = eqFilters(url);
      let out = setRows.filter(r => !f.session_id || r.session_id === f.session_id);
      if (f.is_pr === 'true') out = out.filter(r => r.is_pr === true);
      return send(200, out);
    }
    if (req.method === 'PATCH' || req.method === 'DELETE') return send(200, []);
  }

  // ── workout_sessions ──
  if (url.startsWith('/rest/v1/workout_sessions')) {
    if (req.method === 'PATCH') { Object.assign(sessionRow, JSON.parse(body || '{}')); return send(200, [sessionRow]); }
    if (req.method === 'POST') { Object.assign(sessionRow, JSON.parse(body || '{}'), { id: SESSION_ID }); return send(201, [{ id: SESSION_ID }]); }
    if (req.method === 'GET') return send(200, /Accept: *application\/vnd/.test(req.headers.accept || '') ? sessionRow : [sessionRow]);
    if (req.method === 'DELETE') return send(200, []);
  }

  // everything else restoreFromCloud/syncToCloud touches: empty, so each path runs to completion
  if (/^\/rest\/v1\//.test(url)) return send(200, []);
  return send(404, { message: 'no such route' });
});

const app = http.createServer(async (req, res) => {
  try {
    const p = (req.url === '/' ? '/tandem.html' : req.url).split('?')[0];
    if (p === '/__supabase.js') { res.writeHead(200, { 'Content-Type': 'application/javascript' }); return res.end(await readFile(SB_UMD)); }
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    let buf = await readFile(file);
    if (p === '/tandem.html') {
      buf = Buffer.from(String(buf)
        .replace('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js', '/__supabase.js')
        .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/g, '')
        .replace(/const SUPABASE_URL = '[^']*'/, `const SUPABASE_URL = 'http://localhost:${API_PORT}'`));
    }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': ext === '.js' ? 'application/javascript' : ext === '.html' ? 'text/html' : 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404); res.end('nope'); }
});
const listen = (s, port) => new Promise(r => s.listen(port, () => r(s)));

// 3 exercises x 4 sets. Every row carries w>0 and r>0 so nothing is dropped by a
// bodyweight filter — the audit ruled bodyweight accounting out, and so does this.
const SEED = {
  'bm-bench':  [1, 2, 3, 4].map(n => ({ set: n, w: 185, r: 8, name: 'Flat Barbell Press', est1rm: 230 })),
  'bm-row':    [1, 2, 3, 4].map(n => ({ set: n, w: 135, r: 10, name: 'Barbell Row',       est1rm: 180 })),
  'bm-curl':   [1, 2, 3, 4].map(n => ({ set: n, w: 40,  r: 12, name: 'Dumbbell Curl',     est1rm: 56  })),
};
const EXPECTED_LOCAL_VOLUME = Object.values(SEED).flat().reduce((s, x) => s + x.w * x.r, 0);

async function runScenario(browser, { label, preSeedCloudExercise, reject }) {
  resetCloud();
  if (preSeedCloudExercise) {
    SEED[preSeedCloudExercise].forEach((s, i) => setRows.push({
      id: `pre-${i}`, session_id: SESSION_ID, user_id: UID, exercise_name: s.name,
      set_number: s.set, weight_lbs: s.w, reps: s.r, is_pr: false }));
  }
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${APP_PORT}/tandem.html`);
  await page.waitForFunction(() => typeof setLSScope === 'function' && typeof sb !== 'undefined', { timeout: 20000 });

  const booted = await page.evaluate(async ([uid, jwt, sid, seed]) => {
    setLSScope(uid);
    currentUser = { id: uid };
    try { await sb.auth.setSession({ access_token: jwt, refresh_token: 'r' }); } catch (e) {}
    cfg = { goal: 'build_muscle', days: 4, weeks: 8, sex: 'M', experience: 'intermediate',
            equipment: 'home_dumbbells', emphasis: 'balanced', weight: 200, targetWeight: 190,
            programSource: 'generated', startDate: null };
    LS.set('tandem_cfg', cfg); LS.set('tandem_week', 1); currentWeek = 1;
    LS.set('tandem_history', []);
    showView('tracker'); renderTracker();
    // the session the workout was logged under, as logSet()/startOrResumeSession() leave it
    LSraw.set('tandem_active_session_id', sid);
    LSraw.set('tandem_session_start_time', String(Date.now() - 45 * 60000));
    Object.keys(sessionSetsMap).forEach(k => delete sessionSetsMap[k]);
    Object.entries(seed).forEach(([k, v]) => { sessionSetsMap[k] = v.map(s => ({ ...s })); });
    return (getActiveProgram() || []).length > 0;
  }, [UID, USER_JWT, SESSION_ID, SEED]);

  rejectSetInserts = reject;

  // Run the REAL completion path. finishSession() is synchronous and fires its cloud
  // work in an un-awaited async IIFE, so settle on network quiet rather than on return.
  await page.evaluate(() => finishSession());
  let quiet = 0, lastAttempts = -1;
  for (let i = 0; i < 60 && quiet < 6; i++) {
    await page.waitForTimeout(100);
    if (setInsertAttempts === lastAttempts) quiet++; else { quiet = 0; lastAttempts = setInsertAttempts; }
  }
  await page.waitForTimeout(400);

  const bannerShown = await page.evaluate(() =>
    !!document.getElementById('finishBanner')?.classList.contains('show'));
  const toastText = await page.evaluate(() =>
    [...document.querySelectorAll('.toast, #toast, [class*=toast]')].map(t => t.textContent || '').join(' | '));
  // the marker on the row that holds the only remaining copy of an unsynced set
  const marker = await page.evaluate(() => {
    const h = (LS.get('tandem_history') || [])[0] || {};
    return { setsUnsynced: h.setsUnsynced ?? null, volumeUnaccounted: h.volumeUnaccounted ?? null,
             exerciseCount: Object.keys(h.exercises || {}).length };
  });
  // A3: drive the real renderer and read what a human would see.
  const badgeText = await page.evaluate(() => {
    try { buildHistoryModal(); } catch (e) { return `RENDER THREW: ${e.message}`; }
    return [...document.querySelectorAll('#historyList .hist-badge')]
      .map(b => b.textContent || '').filter(t => /not synced/i.test(t)).join(' | ');
  });

  await ctx.close();

  const summed = setRows.filter(r => r.session_id === SESSION_ID)
    .reduce((s, r) => s + (r.weight_lbs || 0) * (r.reps || 0), 0);
  const dupKeys = setRows.map(r => `${r.exercise_name}\u0000${r.set_number}`);
  const duplicated = dupKeys.length !== new Set(dupKeys).size;
  return { label, errs, booted, stored: sessionRow.total_volume_lbs, summed,
           completed: sessionRow.completed, setCount: setRows.length, bannerShown, toastText,
           marker, badgeText, duplicated, setInsertAttempts, setInsertRejections };
}

(async () => {
  await listen(api, API_PORT); await listen(app, APP_PORT);
  const browser = await chromium.launch();
  const SUCCESS = /session saved\s*✓/i;
  try {
    // ── A1-A4: nothing reached the cloud and every repair insert is refused ──
    const z = await runScenario(browser, { label: 'all set inserts rejected', reject: true });
    console.log(`····  ${z.label}: stored=${z.stored} summed=${z.summed} sets=${z.setCount} ` +
      `marker=${JSON.stringify(z.marker)} attempts=${z.setInsertAttempts} rejected=${z.setInsertRejections}`);
    check('[boot] the app booted with a real program', z.booted);
    check('[A1] a total set-write loss is MARKED on the history row that holds the only copy',
      z.marker.setsUnsynced === 12 && z.marker.volumeUnaccounted === EXPECTED_LOCAL_VOLUME,
      `setsUnsynced=${z.marker.setsUnsynced} (expected 12), volumeUnaccounted=${z.marker.volumeUnaccounted} (expected ${EXPECTED_LOCAL_VOLUME})`);
    check('[A2] the save message does not claim success when no set reached the cloud',
      !SUCCESS.test(z.toastText) && /did not reach the cloud/i.test(z.toastText),
      `message was: ${z.toastText || '(none)'}`);
    check('[A3] the marker reaches a pixel — History renders a visible not-synced badge',
      /not synced/i.test(z.badgeText), `rendered badges: ${z.badgeText || '(none)'}`);
    check('[A4] the lifted volume is NOT reduced to match the short sets table',
      z.stored === EXPECTED_LOCAL_VOLUME,
      `stored=${z.stored}, expected the lifted ${EXPECTED_LOCAL_VOLUME} — reducing it would delete real training history`);
    check('[A4b] the local sets are still on the device, i.e. recoverable',
      z.marker.exerciseCount === 3, `history row carries ${z.marker.exerciseCount} exercises (expected 3)`);

    // ── A5: the loss is PARTIAL — the case the old rescue guard could not see ──
    const p = await runScenario(browser, { label: 'one exercise in cloud, rest rejected',
                                           preSeedCloudExercise: 'bm-bench', reject: true });
    const partialShort = EXPECTED_LOCAL_VOLUME - p.summed;
    console.log(`····  ${p.label}: stored=${p.stored} summed=${p.summed} sets=${p.setCount} marker=${JSON.stringify(p.marker)}`);
    check('[A5] a PARTIAL loss is marked, with the shortfall, not silently accepted',
      p.marker.setsUnsynced === 8 && p.marker.volumeUnaccounted === partialShort,
      `setsUnsynced=${p.marker.setsUnsynced} (expected 8), volumeUnaccounted=${p.marker.volumeUnaccounted} (expected ${partialShort})`);
    check('[A5b] a PARTIAL loss does not claim success either',
      !SUCCESS.test(p.toastText), `message was: ${p.toastText || '(none)'}`);
    check('[A5c] a PARTIAL loss renders the badge too', /not synced/i.test(p.badgeText),
      `rendered badges: ${p.badgeText || '(none)'}`);

    // ── A7: the repair actually repairs, exactly once ──
    const r = await runScenario(browser, { label: 'live sync missed 2 exercises, repair allowed',
                                           preSeedCloudExercise: 'bm-bench', reject: false });
    console.log(`····  ${r.label}: stored=${r.stored} summed=${r.summed} sets=${r.setCount} ` +
      `marker=${JSON.stringify(r.marker)} duplicated=${r.duplicated}`);
    check('[A7] finish repairs the sets the live sync dropped', r.setCount === 12 && r.summed === EXPECTED_LOCAL_VOLUME,
      `${r.setCount} sets rows summing ${r.summed} (expected 12 / ${EXPECTED_LOCAL_VOLUME})`);
    check('[A7b] the repair is idempotent — no duplicate (exercise_name, set_number)', !r.duplicated);
    check('[A7c] a fully repaired session is NOT marked and NOT badged',
      !r.marker.setsUnsynced && !/not synced/i.test(r.badgeText),
      `setsUnsynced=${r.marker.setsUnsynced} badges=${r.badgeText || '(none)'}`);

    // ── A6: the happy path (a gate that just refuses to save is not a fix) ──
    const ok = await runScenario(browser, { label: 'nothing rejected', reject: false });
    console.log(`····  ${ok.label}: stored=${ok.stored} summed=${ok.summed} sets=${ok.setCount} marker=${JSON.stringify(ok.marker)}`);
    check('[A6] every insert accepted -> completes, all sets land, stored == summed',
      ok.completed === true && ok.setCount === 12 && ok.stored === ok.summed && ok.stored === EXPECTED_LOCAL_VOLUME,
      `stored=${ok.stored} summed=${ok.summed} sets=${ok.setCount} (expected 12 / ${EXPECTED_LOCAL_VOLUME})`);
    check('[A6b] a clean session is not marked, not badged, and DOES say it saved',
      !ok.marker.setsUnsynced && !/not synced/i.test(ok.badgeText) && SUCCESS.test(ok.toastText),
      `setsUnsynced=${ok.marker.setsUnsynced} badges=${ok.badgeText || '(none)'} message=${ok.toastText || '(none)'}`);
    check('[A6c] no uncaught page errors on the happy path', ok.errs.length === 0, ok.errs.join(' | '));
  } finally {
    await browser.close(); api.close(); app.close();
  }
  console.log(failures ? `\n${failures} CHECK(S) FAILED` : '\nAll finish-path set-integrity checks hold.');
  process.exit(failures ? 1 : 0);
})();
