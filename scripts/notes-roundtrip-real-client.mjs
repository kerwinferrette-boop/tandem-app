#!/usr/bin/env node
/**
 * notes-roundtrip-real-client.mjs — BUG-195's two-device round-trip, run with the
 * REAL supabase-js client against a PostgREST-shaped server that enforces the REAL
 * live constraints. Two independent browser contexts = two devices.
 *
 * WHY THIS EXISTS, AND WHAT IT IS NOT
 * -----------------------------------
 * The owed item on BUG-195 was "nobody has signed in on two devices, typed a note on
 * one and seen it on the other." Three things blocked doing it for real:
 *   1. The deployed build predates the fix (Netlify build credits out until 2026-10-21).
 *   2. This container's egress policy denies all external HTTPS, so the live site and
 *      zsvktcvqmppsshtpeljt.supabase.co are both unreachable.
 *   3. No test-account password is available here.
 * What is NOT blocked: registry.npmjs.org (it is in the proxy's noProxy list). So the
 * real `@supabase/supabase-js` UMD bundle can be installed and served locally in place
 * of the blocked jsdelivr CDN tag. That removes the single biggest gap in the existing
 * evidence — every previous gate used a hand-written stub whose request shape was MY
 * guess at what the client emits.
 *
 * WHAT THIS DOES PROVE, that nothing before it did:
 *   · The real client's WIRE FORMAT for this exact call: the upsert's `on_conflict`
 *     query parameter, its `Prefer: resolution=merge-duplicates` header, the select's
 *     column list, and the delete's filter params. A wrong `onConflict` string or a
 *     misspelled column shows up here as a 4xx from a server enforcing the real schema.
 *   · That the Authorization header carries the USER's token, not the anon key — the
 *     "a session whose JWT isn't attached" failure the pre-ship council named.
 *   · A genuine two-device sequence: two browser contexts with separate localStorage,
 *     each running the real page, reconciling through one shared store.
 *   · Every assertion reads the TEXTAREA, not a variable.
 *
 * WHAT IT STILL DOES NOT PROVE, stated plainly rather than implied:
 *   · That the production Netlify build serves this code (it does not, as of 2026-10-13).
 *   · That Supabase's real PostgREST and real GoTrue behave as this mock does. The mock
 *     enforces the schema and uniqueness I verified directly against live Postgres on
 *     2026-09-30 (5 NOT NULL columns, unique(user_id, exercise_name), RLS rejecting a
 *     foreign user_id with 42501) — but a mock agreeing with me is not the live host
 *     agreeing with me.
 *   · Real auth: the session is injected, not obtained from GoTrue with a password.
 * So this narrows the owed item; it does not close it. The live two-device check stays
 * owed on BUG-195 until it is run against the deployed build.
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { pickPort } from './lib/safe-port.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// The real client bundle. tandem.html loads it from jsdelivr, which this container's
// egress policy blocks — but registry.npmjs.org is reachable, so the SAME library can be
// installed and served locally. Resolved from a few places so this runs on any machine:
//   npm i @supabase/supabase-js@2        (in the repo, or anywhere, then set SB_UMD_PATH)
const SB_CANDIDATES = [
  process.env.SB_UMD_PATH,
  path.join(ROOT, 'node_modules/@supabase/supabase-js/dist/umd/supabase.js'),
  '/tmp/claude-0/rt/node_modules/@supabase/supabase-js/dist/umd/supabase.js',
].filter(Boolean);
const SB_UMD = SB_CANDIDATES.find(p => { try { return statSync(p).isFile(); } catch { return false; } });
if (!SB_UMD) {
  console.error('FAIL  could not find the real @supabase/supabase-js UMD bundle. Install it:\n' +
    '        npm i @supabase/supabase-js@2\n' +
    '      then re-run, or point SB_UMD_PATH at dist/umd/supabase.js. Looked in:\n        ' +
    SB_CANDIDATES.join('\n        '));
  process.exit(1);
}
const UID = 'e5074b4c-3808-4338-aeb7-b9db59d61f49';   // the allowlisted TEST account id
const APP_PORT = pickPort(9300, 300);
const API_PORT = APP_PORT + 1;

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};
const note = (label, detail) => console.log(`····  ${label}${detail ? `\n      ${detail}` : ''}`);

// ── a user JWT. Not signed — supabase-js does not verify signatures client side, it
// only decodes `exp`. The mock reads `sub` the way an RLS policy reads auth.uid().
const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const USER_JWT = [
  b64u({ alg: 'HS256', typ: 'JWT' }),
  b64u({ sub: UID, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 86400 }),
  'not-a-real-signature',
].join('.');
const ANON_KEY = 'sb_publishable_8gQMcE88UKwBqR9fIv0OuQ_8Xn3PGJ7';

// ── PostgREST-shaped store, enforcing the constraints verified against live Postgres ──
const rows = [];                 // the shared "cloud"
const wire = [];                 // every request the REAL client made

function conflictTargetOf(url) {
  const p = new URL(url, 'http://x').searchParams.get('on_conflict');
  return p ? p.split(',').map(s => s.trim()).sort().join(',') : null;
}
function eqFilters(url) {
  const out = {};
  for (const [k, v] of new URL(url, 'http://x').searchParams) {
    if (k === 'select' || k === 'on_conflict') continue;
    if (String(v).startsWith('eq.')) out[k] = String(v).slice(3);
  }
  return out;
}

const api = http.createServer(async (req, res) => {
  let body = '';
  for await (const c of req) body += c;
  const url = req.url || '';
  const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const prefer = req.headers.prefer || '';
  const send = (code, payload) => {
    res.writeHead(code, { 'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Expose-Headers': '*' });
    res.end(JSON.stringify(payload ?? null));
  };
  if (req.method === 'OPTIONS') return send(200, {});

  // GoTrue endpoints, just enough for setSession() not to tear the session down.
  if (url.startsWith('/auth/v1/user')) return send(200, { id: UID, aud: 'authenticated', role: 'authenticated', email: 'kerwinferrette+test@gmail.com' });
  if (url.startsWith('/auth/v1/token')) return send(200, { access_token: USER_JWT, token_type: 'bearer', expires_in: 86400, refresh_token: 'r', user: { id: UID } });

  // restoreFromCloud() also hydrates history, PRs, lastsets and cfg. Serve those as
  // empty rather than 404 so the function runs to completion exactly as it does in
  // production — a 404 would send it down a caught-error path and the notes hydrate
  // might then be passing for a reason production does not share.
  if (/^\/rest\/v1\/(users|workout_sessions|sets|personal_records|lastsets|streaks|competition_leaderboard)/.test(url)) {
    return send(200, /select=\*/.test(url) && /\.single/.test(prefer) ? null : []);
  }
  if (!url.startsWith('/rest/v1/exercise_notes')) return send(404, { message: 'no such route' });

  wire.push({ method: req.method, url, prefer, authIsUserJwt: auth === USER_JWT, authIsAnonKey: auth === ANON_KEY, body });

  // RLS equivalent: a request may only touch its own rows.
  const sub = JSON.parse(Buffer.from(auth.split('.')[1] || '', 'base64url').toString() || '{}').sub;
  if (!sub) return send(401, { message: 'no sub in token' });

  if (req.method === 'GET') {
    const f = eqFilters(url);
    if (f.user_id && f.user_id !== sub) return send(200, []);           // RLS hides others
    return send(200, rows.filter(r => r.user_id === sub));
  }

  if (req.method === 'POST') {                                          // upsert
    let payload; try { payload = JSON.parse(body); } catch { return send(400, { message: 'bad json' }); }
    const list = Array.isArray(payload) ? payload : [payload];
    const target = conflictTargetOf(url);
    const merging = /merge-duplicates/.test(prefer);
    for (const r of list) {
      // NOT NULL on all five columns (id is defaulted server side)
      for (const col of ['user_id', 'exercise_name', 'note', 'updated_at']) {
        if (r[col] === undefined || r[col] === null) {
          return send(400, { code: '23502', message: `null value in column "${col}" violates not-null constraint` });
        }
      }
      for (const col of Object.keys(r)) {
        if (!['user_id', 'exercise_name', 'note', 'updated_at'].includes(col)) {
          return send(400, { code: '42703', message: `column "${col}" of relation "exercise_notes" does not exist` });
        }
      }
      if (r.user_id !== sub) return send(403, { code: '42501', message: 'new row violates row-level security policy for table "exercise_notes"' });
      const hit = rows.find(x => x.user_id === r.user_id && x.exercise_name === r.exercise_name);
      if (hit) {
        // Without the right conflict target + merge Prefer, Postgres raises on the
        // unique index instead of updating. That is the real failure this models.
        if (target !== 'exercise_name,user_id' || !merging) {
          return send(409, { code: '23505', message: 'duplicate key value violates unique constraint "exercise_notes_user_id_exercise_name_key"' });
        }
        Object.assign(hit, r);
      } else {
        rows.push({ id: `row-${rows.length + 1}`, ...r });
      }
    }
    return send(/return=representation/.test(prefer) ? 200 : 201, /return=representation/.test(prefer) ? list : null);
  }

  if (req.method === 'DELETE') {
    const f = eqFilters(url);
    if (f.user_id && f.user_id !== sub) return send(403, { code: '42501', message: 'rls' });
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i];
      if (Object.entries(f).every(([k, v]) => String(r[k]) === v) && r.user_id === sub) rows.splice(i, 1);
    }
    return send(204, null);
  }
  return send(405, { message: 'nope' });
});

// ── serve the real page, with the BLOCKED jsdelivr tag swapped for the real local bundle ──
const app = http.createServer(async (req, res) => {
  try {
    const p = (req.url === '/' ? '/tandem.html' : req.url).split('?')[0];
    if (p === '/__supabase.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      return res.end(await readFile(SB_UMD));
    }
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

// one "device": its own browser context, so its own localStorage.
async function device(browser, label) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${APP_PORT}/tandem.html`);
  // NOT window.sb: `const sb = ...` at a script's top level lives in the global LEXICAL
  // environment and never becomes a property of window, so `window.sb` is forever
  // undefined and the wait could never succeed. `typeof sb` resolves lexically and is
  // safe even when undeclared. Cost me one timeout to notice.
  await page.waitForFunction(() => typeof setLSScope === 'function' && typeof sb !== 'undefined', { timeout: 20000 });
  const missing = [];
  // Keep these apart. A pageerror is uncaught JS — the app breaking. A 404 is this
  // harness not serving an asset (fonts are stripped, hero photos live in public/ and
  // are not needed to render a textarea). Lumping them together made [7] fail on
  // harness noise and would have trained the next person to ignore a real error.
  page.on('response', r => { if (r.status() === 404) missing.push(new URL(r.url()).pathname); });
  const booted = await page.evaluate(async ([uid, jwt]) => {
    setLSScope(uid);
    currentUser = { id: uid };
    // give the REAL client a real session, so it attaches the user's token
    try { await sb.auth.setSession({ access_token: jwt, refresh_token: 'r' }); } catch (e) { /* mock-backed */ }
    cfg = { goal: 'build_muscle', days: 4, weeks: 8, sex: 'M', experience: 'intermediate',
            equipment: 'home_dumbbells', emphasis: 'balanced', weight: 200, targetWeight: 190,
            programSource: 'generated', startDate: null };
    LS.set('tandem_cfg', cfg); LS.set('tandem_week', 1); currentWeek = 1;
    showView('tracker'); renderTracker();
    return (getActiveProgram() || []).length > 0;
  }, [UID, USER_JWT]);
  return { ctx, page, errs, missing, booted, label };
}

const keyOf = `(ta) => ((ta.getAttribute('oninput')||'').match(/saveExNote\\('([^']*)'/)||[])[1]`;
const readNote = (page, name) => page.evaluate(([n, kf]) => {
  const keyOf = eval(kf);
  return [...document.querySelectorAll('textarea.ex-notes')].find(ta => keyOf(ta) === n)?.value ?? null;
}, [name, keyOf]);

(async () => {
  await listen(api, API_PORT); await listen(app, APP_PORT);
  const browser = await chromium.launch();
  try {
    const A = await device(browser, 'A');
    const B = await device(browser, 'B');
    check('[0] both devices boot the real page with the real supabase-js client',
      A.booted && B.booted, `A=${A.booted} B=${B.booted}; A errors: ${A.errs.join(' | ')}`);

    // the lift both devices will talk about — taken from the attribute, which IS the key
    const NAME = await A.page.evaluate((kf) => eval(kf)(document.querySelector('textarea.ex-notes')), keyOf);
    note(`the lift under test: "${NAME}"`);

    // ── 1. DEVICE A types a note ──
    await A.page.evaluate(([n]) => {
      const keyOf = (ta) => ((ta.getAttribute('oninput') || '').match(/saveExNote\('([^']*)'/) || [])[1];
      const ta = [...document.querySelectorAll('textarea.ex-notes')].find(t => keyOf(t) === n);
      ta.value = 'knee felt tight at 185';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }, [NAME]);
    await A.page.waitForTimeout(1600);                         // past the 900 ms debounce

    const up = wire.filter(w => w.method === 'POST');
    check('[1a] the REAL client sent exactly one upsert for the burst', up.length === 1,
      `${up.length} POSTs: ${up.map(w => w.url).join(' , ')}`);
    check('[1b] it targets the real unique index via on_conflict=user_id,exercise_name',
      up[0] && conflictTargetOf(up[0].url) === 'exercise_name,user_id',
      `on_conflict=${up[0] ? new URL(up[0].url, 'http://x').searchParams.get('on_conflict') : '(none)'}`);
    check('[1c] it asks PostgREST to merge duplicates (without this, a second note 409s)',
      !!up[0] && /merge-duplicates/.test(up[0].prefer), `Prefer: ${up[0]?.prefer}`);
    check('[1d] the Authorization header carries the USER token, not the anon key',
      !!up[0] && up[0].authIsUserJwt && !up[0].authIsAnonKey,
      `userJwt=${up[0]?.authIsUserJwt} anonKey=${up[0]?.authIsAnonKey} — an unattached JWT is the failure the council named`);
    check('[1e] the row landed in the shared store, keyed by name', rows.length === 1 &&
      rows[0].exercise_name === NAME && rows[0].note === 'knee felt tight at 185' && rows[0].user_id === UID,
      JSON.stringify(rows));

    // ── 2. DEVICE B, a different localStorage, pulls it down through the real path ──
    const bBefore = await readNote(B.page, NAME);
    check('[2a] device B starts with an empty box (separate device, separate storage)',
      bBefore === '', `got ${JSON.stringify(bBefore)}`);
    await B.page.evaluate(() => restoreFromCloud());
    await B.page.waitForTimeout(1200);
    const bAfter = await readNote(B.page, NAME);
    check('[2b] THE ROUND-TRIP: the note typed on A is RENDERED in B\'s textarea',
      bAfter === 'knee felt tight at 185',
      `B shows ${JSON.stringify(bAfter)} — this is the sentence the whole change exists for`);

    // ── 3. DEVICE B clears it ──
    await B.page.evaluate(([n]) => {
      const keyOf = (ta) => ((ta.getAttribute('oninput') || '').match(/saveExNote\('([^']*)'/) || [])[1];
      const ta = [...document.querySelectorAll('textarea.ex-notes')].find(t => keyOf(t) === n);
      ta.value = ''; ta.dispatchEvent(new Event('input', { bubbles: true }));
    }, [NAME]);
    await B.page.waitForTimeout(1600);
    const del = wire.filter(w => w.method === 'DELETE');
    check('[3a] clearing on B issued a real DELETE scoped to user_id AND exercise_name',
      del.length === 1 && eqFilters(del[0].url).user_id === UID && eqFilters(del[0].url).exercise_name === NAME,
      `${del.length} DELETEs: ${del.map(w => w.url).join(' , ')}`);
    check('[3b] the row is gone from the shared store', rows.length === 0, JSON.stringify(rows));

    // ── 4. DEVICE A re-syncs. THIS IS THE NO-TOMBSTONE CASE. ──
    await A.page.evaluate(() => restoreFromCloud());
    await A.page.waitForTimeout(1200);
    const aAfter = await readNote(A.page, NAME);
    const resurrected = rows.length === 1 && rows[0].note === 'knee felt tight at 185';
    note('[4] NO-TOMBSTONE BEHAVIOUR, observed rather than reasoned about:',
      `A still held the note locally, saw no cloud row, and pushed it back up.\n      ` +
      `A's textarea now reads ${JSON.stringify(aAfter)}; shared store now holds ${rows.length} row(s).\n      ` +
      `So a delete made on B does NOT stick while A still holds a copy — and B will take\n      ` +
      `it back on its next sync as "new from another device". This is the documented\n      ` +
      `tradeoff (no deleted_at), and it is stronger than the wave file's wording: the\n      ` +
      `delete is not merely "resurrectable", it is reliably undone.`);
    check('[4a] CONTROL — the resurrection is real, not a test artifact',
      resurrected && aAfter === 'knee felt tight at 185',
      `rows=${JSON.stringify(rows)} aTextarea=${JSON.stringify(aAfter)} — if this fails the limitation note is wrong and should be rewritten`);

    // ── 5. a second edit on the SAME name must UPDATE, not 409 on the unique index ──
    await A.page.evaluate(([n]) => {
      const keyOf = (ta) => ((ta.getAttribute('oninput') || '').match(/saveExNote\('([^']*)'/) || [])[1];
      const ta = [...document.querySelectorAll('textarea.ex-notes')].find(t => keyOf(t) === n);
      ta.value = 'felt fine today'; ta.dispatchEvent(new Event('input', { bubbles: true }));
    }, [NAME]);
    await A.page.waitForTimeout(1600);
    check('[5] editing the same lift UPDATES the one row (no duplicate-key error)',
      rows.length === 1 && rows[0].note === 'felt fine today', JSON.stringify(rows));

    const rejected = wire.filter(w => /4\d\d|23505|42703|23502/.test(String(w.status || '')));
    check('[6] no request was rejected by the schema-enforcing server',
      rejected.length === 0, JSON.stringify(rejected));
    check('[7] zero UNCAUGHT JS ERRORS on either device (app health, not asset 404s)',
      A.errs.length === 0 && B.errs.length === 0, `A: ${A.errs.join(' | ')}\n      B: ${B.errs.join(' | ')}`);
    const miss = [...new Set([...A.missing, ...B.missing])];
    if (miss.length) note(`harness did not serve ${miss.length} asset path(s) — not app faults, listed for honesty:`, miss.join(', '));

    console.log(`\n── the real client's wire traffic (${wire.length} requests) ──`);
    for (const w of wire) console.log(`  ${w.method.padEnd(6)} ${w.url}${w.prefer ? `   [Prefer: ${w.prefer}]` : ''}`);
  } finally {
    await browser.close(); api.close(); app.close();
  }
  console.log(failures === 0
    ? '\nnotes-roundtrip-real-client: PASS — real supabase-js, two devices, schema-enforcing store'
    : `\nnotes-roundtrip-real-client: ${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
})();
