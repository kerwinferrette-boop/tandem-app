#!/usr/bin/env node
// rendered-screen-smoke.mjs — what the USER SEES on Home and the workout screen is coherent.
//
// Origin: audit 2026-11-16. `npm run verify` printed ALL 77 CHECKS PASS while a five-minute
// walk of the app (Build Muscle / 4 days, look-around mode) showed, on screen:
//   - the Zone 2 cardio card printing the literal word "undefined", twice (dynamic-engine
//     cardio carries no cardioDesc/zone; the card interpolated them unconditionally);
//   - Home saying "5 lifts · about 60 min" above a workout that opened as "0 of 7 exercises"
//     under a hardcoded "90 min" chip;
//   - Home's chip naming "Flat Barbell Press" (stored identity) while the workout card showed
//     "Bench Press" (display name) — the BUG-256 display/identity seam, on a surface that fix
//     never reached;
//   - template name/tagline/description from workout_templates, and every toast message,
//     assigned to innerHTML unescaped.
// Every existing gate asserts a value in the engine or a function in a vm. None reads the
// rendered page for the things a person notices first. This one does, in a real Chromium,
// across goal x days x sex — a class check, so the next "undefined on screen" does not need
// its own bug number and its own bespoke script.
//
// ASSERTIONS (per combo unless noted)
//   [S1] no visible text node on Home or the active workout day is, or contains as a whole
//        word, undefined / NaN / null / [object Object].
//   [S2] Home's exercise count == the workout progress line's total ("0 of N exercises").
//   [S3] Home's "about N min" == the day header's "N min" chip (or both absent).
//   [S4] every exercise-name chip on Home is the name of an exercise card on today's workout.
//   [S5] (once) templateCardHTML() given markup in name/tagline/description creates no element
//        from it, and showToast() given markup creates no element from it.
//
// NOT covered, said plainly: other tabs (Log, You, Duel), modals, the one-off and journal
// flows, signed-in state, weeks other than 1, and whether the "about N min" figure is TRUE of
// the prescription (it is the length the user chose; nothing derives it from the sets).
//
// MUTATION RECORD (2026-11-16, each applied alone to tandem.html, confirmed landed by grep,
// then removed by re-applying the fix text — never a HEAD-relative revert):
//   pre-fix tandem.html (git show HEAD:tandem.html) -> 143 failures: S1 x90, S4 x50, S5 x2,
//     plus the canary (pre-fix Home said "lifts", so S2/S3 had nothing to compare there);
//   M-S2 Home counts lifts only again            -> S2 x50 ("5 exercises" vs "0 of 7");
//   M-S3 day chip back to the literal '90 min'   -> S3 x50 ("60 min" vs "90 min").
//   The fixed file was restored from a saved copy and byte-compared after each run.
//
// Run: node scripts/rendered-screen-smoke.mjs
import { chromium } from 'playwright';
import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const reqPath = req.url === '/' ? '/tandem.html' : req.url.split('?')[0];
      const filePath = path.join(ROOT, reqPath);
      if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      const body = await readFile(filePath);
      const ext = path.extname(filePath);
      const type = ext === '.js' ? 'application/javascript' : ext === '.html' ? 'text/html' : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  return new Promise(resolve => server.listen(PORT, () => resolve(server)));
}

const GOALS = ['build_muscle', 'fat_burn', 'transform', 'strength', 'maintenance'];
const DAYS = [2, 3, 4, 5, 6];
const SEXES = ['male', 'female'];

// Runs in the page. Returns everything the assertions need, read from the DOM only.
function probe() {
  const BAD = /(^|[^A-Za-z])(undefined|NaN|null|\[object Object\])([^A-Za-z]|$)/;
  const visibleBad = (root) => {
    const out = [];
    if (!root) return out;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const t = n.nodeValue.trim();
      if (!t || !BAD.test(t)) continue;
      const el = n.parentElement;
      if (!el || el.closest('script,style,textarea')) continue;
      if (el.offsetParent === null) continue; // not rendered
      out.push(`${el.className || el.tagName}: "${t.slice(0, 60)}"`);
    }
    return out;
  };
  const home = document.getElementById('view-dashboard');
  const sub = document.getElementById('dashHeroSub')?.textContent || '';
  const chips = [...document.querySelectorAll('#dashHeroChips .dash-chip')].map(c => c.textContent.trim());
  const homeBad = visibleBad(home);
  // open the workout exactly the way the "Continue your plan" card does
  showView('tracker');
  const day = document.querySelector('[id^="wv-"].active');
  const prog = document.getElementById('progLabel')?.textContent || '';
  const chipMin = day?.querySelector('.day-header .dh-chip.hi')?.textContent || '';
  const names = day ? [...day.querySelectorAll('.ex-card .ex-name > span:first-child')].map(s => s.textContent.trim()) : [];
  return {
    sub, chips, prog, chipMin, names, hasDay: !!day,
    bad: homeBad.concat(visibleBad(document.getElementById('view-tracker'))),
  };
}

const fails = [];
let combos = 0, restDays = 0;
const server = await startServer();
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.route('**/supabase.min.js', r => r.fulfill({ contentType: 'application/javascript', body: SUPABASE_STUB }));
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));

  for (const goal of GOALS) for (const days of DAYS) for (const sex of SEXES) {
    const tag = `${goal}/${days}d/${sex}`;
    await page.goto(`http://localhost:${PORT}/tandem.html`);
    await page.waitForFunction(() => typeof buildProgram === 'function' && typeof skipAuth === 'function');
    const built = await page.evaluate(({ goal, days, sex }) => {
      skipAuth();
      selectedGoal = goal; selectedDays = days; selectedSex = sex; selectedExperience = 'intermediate';
      buildProgram();
      return document.getElementById('view-dashboard')?.classList.contains('active');
    }, { goal, days, sex });
    if (!built) { fails.push(`${tag}: buildProgram() did not land on the dashboard`); continue; }
    const r = await page.evaluate(probe);
    combos++;
    for (const b of r.bad) fails.push(`[S1] ${tag}: visible junk text — ${b}`);
    if (!r.hasDay) { fails.push(`${tag}: no active workout day rendered`); continue; }
    const homeN = (r.sub.match(/^(\d+) exercise/) || [])[1];
    const progN = (r.prog.match(/of (\d+) exercises/) || [])[1];
    if (homeN == null) { restDays++; } // Home shows no count (rest day / no program day): nothing to compare
    else if (homeN !== progN) fails.push(`[S2] ${tag}: Home says ${homeN} exercises, workout says ${progN} ("${r.sub}" vs "${r.prog}")`);
    const homeMin = (r.sub.match(/about (\d+) min/) || [])[1] || null;
    const dayMin = (r.chipMin.match(/(\d+) min/) || [])[1] || null;
    if (homeN != null && homeMin !== dayMin) fails.push(`[S3] ${tag}: Home says ${homeMin} min, day header says ${dayMin} min`);
    for (const c of r.chips) {
      if (/^\+\d+ more$/.test(c)) continue;
      if (!r.names.includes(c)) fails.push(`[S4] ${tag}: Home chip "${c}" is not the name of any exercise card today (cards: ${r.names.join(', ')})`);
    }
  }
  if (combos < GOALS.length * DAYS.length * SEXES.length) fails.push(`canary: only ${combos} combos probed`);
  if (restDays === combos) fails.push('canary: Home showed an exercise count on zero combos — S2/S3 compared nothing');

  // [S5] markup in database-sourced strings must arrive as text
  const s5 = await page.evaluate(() => {
    const evil = '<img src=x onerror="window.__pwned=1"><b>x</b>';
    const host = document.createElement('div');
    host.innerHTML = templateCardHTML({ name: evil, tagline: evil, description: evil, code_goal_mapping: 'build_muscle',
      parent_goal: 'build_muscle', duration_weeks: 8, days_per_week: 4, split_type: evil, difficulty: evil }, '');
    showToast(evil);
    const toast = document.getElementById('prToast');
    return { cardEls: host.querySelectorAll('img,b').length, cardHasText: host.textContent.includes('<img'),
             toastEls: toast.querySelectorAll('img,b').length, toastHasText: toast.textContent.includes('<img') };
  });
  if (s5.cardEls !== 0 || !s5.cardHasText) fails.push(`[S5] templateCardHTML built ${s5.cardEls} element(s) from template text (text preserved: ${s5.cardHasText})`);
  if (s5.toastEls !== 0 || !s5.toastHasText) fails.push(`[S5] showToast built ${s5.toastEls} element(s) from its message (text preserved: ${s5.toastHasText})`);
  for (const e of pageErrors) fails.push(`page error: ${e}`);
} finally {
  await browser.close();
  server.close();
}

if (fails.length) {
  console.error(`rendered-screen-smoke: ${fails.length} FAILURE(S)`);
  // Per-assertion tally first: the detail list below is capped, and a cap that hides a whole
  // assertion's failures would make this output read as "only S1 broke".
  const tally = {};
  for (const f of fails) { const k = (f.match(/^\[S\d\]/) || ['other'])[0]; tally[k] = (tally[k] || 0) + 1; }
  console.error('  by assertion: ' + Object.entries(tally).map(([k, n]) => `${k} x${n}`).join(', '));
  for (const f of fails.slice(0, 40)) console.error('  ' + f);
  if (fails.length > 40) console.error(`  … and ${fails.length - 40} more`);
  process.exit(1);
}
console.log(`rendered-screen-smoke: OK — ${combos} combos (5 goals x 5 day-counts x 2 sexes), ${combos - restDays} with a Home count compared; S1-S5 hold`);
