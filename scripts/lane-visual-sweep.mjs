#!/usr/bin/env node
// lane-visual-sweep.mjs — the P1-P3 lane's eyes. Drives the app the way a guest user would,
// screenshots every main screen, and reports objective visual/runtime defects.
//
// WHY THIS EXISTS (2026-11-03, Kerwin): the morning TPM only ever FIXES P0s; P1-P3 issues were
// listed and never moved. The daily lane batches P2/P3 fixes into one PR, and this script is how
// that PR is checked without Kerwin opening a phone for every cosmetic change. It runs in GitHub
// Actions (lane-preview-check.yml) against the Netlify DEPLOY PREVIEW of the PR, and against
// production as the baseline, then diffs the two.
//
// WHAT IT DOES
//   1. Opens the target (a URL, or the working tree on a local server when no --url is given).
//   2. Stubs supabase-js with an inert Proxy (same recipe as onboarding-lifecycle-walkthrough.mjs)
//      so it NEVER signs in, never touches real user data, and never writes to production Postgres.
//      It enters through the app's own "Look around without saving" guest path.
//   3. Walks: auth screen -> onboarding (build_muscle, 4 days) -> dashboard -> every tab -> START
//      chooser -> tracker -> expanded exercise card -> log a set -> Finish -> summary.
//   4. On every screen, at two phone widths (390 and 430), records:
//        - a full-viewport screenshot
//        - page errors and console errors
//        - horizontal overflow (page wider than the screen)
//        - visible elements that spill past the right edge of the screen
//        - clipped text (content wider than its own box with overflow hidden and no ellipsis)
//        - broken images (loaded with zero natural width)
//        - interactive controls that something else is drawn on top of (a fixed bar covering a
//          button, a modal that does not cover what it should)
//        - tap targets under 32px in either dimension (advisory; Apple's guideline is 44pt)
//   5. With --baseline <dir> (a previous run's output), computes a per-screen pixel diff and marks
//      findings NEW when the baseline run did not have them. NEW findings and NEW errors are what
//      fail the PR check; pre-existing ones are reported as backlog, never as this PR's fault.
//
// WHAT IT CANNOT SEE (say this in every report, never imply otherwise):
//   - Real iOS Safari/PWA behaviour: home-screen standalone mode, safe-area insets, the dynamic
//     toolbar, haptics, Web Push. Headless Chromium has none of these (BUG-128's own note says so).
//   - HealthKit/Shortcut biometrics, real sync, auth, RLS — the backend is stubbed on purpose.
//   - Whether something LOOKS right to a human. Pixel diffs say "this changed", not "this is good".
//
// Run:  node scripts/lane-visual-sweep.mjs [--url https://...] [--out dir] [--baseline dir] [--label name]
// Exit: 0 = flow completed and no NEW blocking findings; 1 = otherwise; 2 = harness could not run.

import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']);
  return acc;
}, []));
const OUT = path.resolve(args.out || path.join(ROOT, 'lane-out', args.label || 'run'));
const BASELINE = args.baseline ? path.resolve(args.baseline) : null;
const PORT = 26000 + Math.floor(Math.random() * 400); // (10080, 32767]: see scripts/test-port-range-smoke.mjs
const VIEWPORTS = [{ name: 'w390', width: 390, height: 844 }, { name: 'w430', width: 430, height: 932 }];

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
      const type = { '.js': 'application/javascript', '.html': 'text/html', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  return new Promise(resolve => server.listen(PORT, () => resolve(server)));
}

// Runs inside the page. Returns objective findings for what is on screen right now.
function inspectScreen() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const out = [];
  // checkVisibility() walks ANCESTORS too: a closed sheet whose parent overlay sits at opacity:0
  // (the bug-report and QA sheets) is not on screen even though its own styles say it is. The
  // first run of this sweep reported those as covered controls; that was the harness, not the app.
  const visible = el => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false;
    return r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
  };
  const interactable = el => { for (let p = el; p; p = p.parentElement) if (getComputedStyle(p).pointerEvents === 'none') return false; return true; };
  const label = el => {
    const id = el.id ? `#${el.id}` : '';
    const cls = (typeof el.className === 'string' && el.className.trim()) ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const txt = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${id}${cls}${txt ? ` "${txt}"` : ''}`;
  };
  const se = document.scrollingElement || document.documentElement;
  if (se.scrollWidth > vw + 1) out.push({ kind: 'horizontal-overflow', severity: 'P2', detail: `page is ${se.scrollWidth}px wide on a ${vw}px screen` });

  const all = [...document.body.querySelectorAll('*')].filter(visible);
  for (const el of all) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    // Spills past the right edge, and is not inside a horizontal scroller (carousels are fine).
    if (r.right > vw + 2 && r.width < vw * 3) {
      let p = el.parentElement, inScroller = false;
      while (p) { const pcs = getComputedStyle(p); if (/(auto|scroll|hidden)/.test(pcs.overflowX) && p.clientWidth < p.scrollWidth) { inScroller = true; break; } p = p.parentElement; }
      if (!inScroller && cs.position !== 'fixed') out.push({ kind: 'spills-right', severity: 'P2', target: label(el), detail: `right edge at ${Math.round(r.right)}px, screen is ${vw}px` });
    }
    // Clipped text: overflow hidden, content wider than the box, no ellipsis, element holds text.
    const ownText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2);
    if (ownText && cs.overflowX === 'hidden' && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 2) {
      out.push({ kind: 'clipped-text', severity: 'P2', target: label(el), detail: `content ${el.scrollWidth}px in a ${el.clientWidth}px box` });
    }
  }
  for (const img of document.images) {
    if (visible(img) && img.complete && img.naturalWidth === 0) out.push({ kind: 'broken-image', severity: 'P2', target: label(img), detail: img.currentSrc || img.src });
  }
  const controls = all.filter(el => el.matches('button, a[href], input, select, textarea, [onclick], [role="button"]') && interactable(el));
  for (const el of controls) {
    const r = el.getBoundingClientRect();
    const cx = Math.min(Math.max(r.left + r.width / 2, 0), vw - 1), cy = Math.min(Math.max(r.top + r.height / 2, 0), vh - 1);
    if (r.top >= 0 && r.bottom <= vh) {
      const hit = document.elementFromPoint(cx, cy);
      if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) {
        // Only report when the thing on top is not part of an open modal that is meant to cover it.
        const coverer = hit.closest('.tab-bar, .bottom-nav, [style*="position: fixed"], .fab, .bug-fab, header');
        if (coverer && !coverer.contains(el)) out.push({ kind: 'covered-control', severity: 'P2', target: label(el), detail: `covered by ${label(coverer)}` });
      }
    }
    if ((r.width < 32 || r.height < 32) && !el.matches('input[type="checkbox"], input[type="radio"]')) {
      out.push({ kind: 'small-tap-target', severity: 'P3', target: label(el), detail: `${Math.round(r.width)}x${Math.round(r.height)}px (guideline 44)` });
    }
  }
  // De-duplicate identical rows (repeated cards produce the same finding many times).
  const seen = new Map();
  for (const f of out) { const k = `${f.kind}|${f.target || ''}|${f.detail}`; seen.set(k, { ...f, count: (seen.get(k)?.count || 0) + 1 }); }
  return [...seen.values()];
}

async function sweepViewport(browser, base, vp) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push({ kind: 'page-error', text: e.message }));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_CONNECTION_RESET/.test(m.text())) errors.push({ kind: 'console-error', text: m.text().slice(0, 300) }); });
  page.on('requestfailed', r => { if (!/supabase|favicon|fonts\.g/.test(r.url())) errors.push({ kind: 'request-failed', text: `${r.failure()?.errorText} ${r.url()}` }); });
  await page.route('**/supabase.min.js', r => r.fulfill({ contentType: 'application/javascript', body: SUPABASE_STUB }));
  await page.route(/supabase\.co\//, r => r.abort()); // belt and braces: no real backend call can leave
  // Netlify injects its review drawer (a fixed toolbar plus promo videos) into DEPLOY PREVIEWS only.
  // Production never has it, so leaving it in makes every preview screen "differ" and covers the tab
  // bar. Blocked so preview and production are compared like for like.
  await page.route(/netlify-cdp-loader|app\.netlify\.com\/cdp/, r => r.abort());
  page.setDefaultTimeout(8000);
  // The loader block alone is not enough: the drawer's iframe element is still inserted and still
  // sits on top of the tab bar (second CI run). Remove it, and its body-level wrapper, as it appears.
  await page.addInitScript(() => {
    const strip = () => document.querySelectorAll('iframe[title="Netlify Drawer"], iframe[src*="app.netlify.com/cdp"]').forEach(f => {
      let n = f; while (n.parentElement && n.parentElement !== document.body) n = n.parentElement;
      (n.parentElement === document.body ? n : f).remove();
    });
    new MutationObserver(strip).observe(document, { childList: true, subtree: true });
  });

  const screens = [];
  const steps = [];
  const snap = async (name) => {
    await page.waitForTimeout(350);
    // Named by screen, not by order: a failed step on one site must not shift every later file name
    // and break the baseline pairing (the second CI run did exactly that).
    const file = `${vp.name}-${name}.png`;
    await page.screenshot({ path: path.join(OUT, file) });
    const findings = await page.evaluate(inspectScreen);
    screens.push({ name, file, findings });
  };
  // A failed step keeps the reason Playwright gives (e.g. "<div ...> intercepts pointer events"),
  // because "Timeout exceeded" alone tells nobody what is in the way.
  const step = async (name, fn) => {
    try { await fn(); steps.push({ name, ok: true }); return true; }
    catch (e) {
      const lines = e.message.split('\n').map(l => l.trim()).filter(Boolean);
      const why = lines.find(l => /intercepts pointer events|not visible|not enabled|detached|outside of the viewport/.test(l));
      steps.push({ name, ok: false, error: lines[0] + (why ? ` | ${why.slice(0, 220)}` : '') });
      await page.screenshot({ path: path.join(OUT, `${vp.name}-FAILED-${name.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.png`) }).catch(() => {});
      return false;
    }
  };

  await step('open app', async () => { await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 }); await page.waitForTimeout(800); });
  await snap('auth');
  await step('enter as guest ("Look around without saving")', async () => {
    const btn = page.locator('button.auth-skip').first();
    if (await btn.isVisible().catch(() => false)) await btn.click(); else await page.evaluate(() => skipAuth());
    await page.waitForTimeout(400);
  });
  const onboarded = await step('onboarding to Build My Program', async () => {
    await page.click('.goal-card[onclick*="build_muscle"]'); await page.waitForTimeout(150);
    await snap('onboarding-goal');
    await page.click('#obNextBtn'); await page.waitForTimeout(150);
    const gate = page.locator("button.ob-build-btn[onclick*=\"resumePath('build')\"]");
    if (await gate.isVisible().catch(() => false)) { await gate.click(); await page.waitForTimeout(150); }
    await page.fill('#ob-weight', '185'); await page.fill('#ob-target-weight', '175');
    await page.click("[onclick*=\"selectSex('M'\"]");
    await page.click("[onclick*=\"selectExperience('intermediate'\"]");
    await snap('onboarding-stats');
    await page.click('#obNextBtn'); await page.waitForTimeout(150);
    await page.fill('#ob-weeks', '12');
    await page.click('.day-dot[onclick*="selectDays(4"]');
    await page.click('#obNextBtn'); await page.waitForTimeout(150);
    await page.click("[onclick*=\"selectWorkoutTime('morning'\"]");
    await page.click('#obNextBtn'); await page.waitForTimeout(150);
    for (let i = 0; i < 4; i++) {
      const on = await page.evaluate(() => document.getElementById('view-onboard')?.classList.contains('active'));
      if (!on || !(await page.isVisible('#obNextBtn').catch(() => false))) break;
      await page.click('#obNextBtn').catch(() => {}); await page.waitForTimeout(150);
    }
    await snap('onboarding-review');
    await page.click('.ob-build-btn'); await page.waitForTimeout(700);
    const dash = await page.evaluate(() => document.getElementById('view-dashboard')?.classList.contains('active'));
    if (!dash) throw new Error('Build My Program did not land on the dashboard');
  });
  if (onboarded) {
    await snap('dashboard');
    for (const tab of ['log', 'you', 'duel', 'home']) {
      // Close whatever the previous tab opened (the Duel tab opens a sheet for an unpaired guest),
      // the way a user would: tap the dimmed area outside the sheet.
      await page.evaluate(() => document.querySelectorAll('.modal-overlay.open').forEach(o => o.click())).catch(() => {});
      await page.waitForTimeout(250);
      if (await step(`tab: ${tab}`, async () => { await page.click(`.tab-btn[data-tab="${tab}"]`); await page.waitForTimeout(400); })) await snap(`tab-${tab}`);
      else {
        // Recover so one blocked tap does not hide every screen after it: close what is open and
        // switch tabs the way the app's own handler does. The failure above is still reported.
        await page.keyboard.press('Escape').catch(() => {});
        await page.evaluate(t => { document.querySelectorAll('.open').forEach(o => o.classList.remove('open')); if (typeof goTab === 'function') goTab(t); }, tab).catch(() => {});
        await page.waitForTimeout(400);
      }
    }
    if (await step('START opens the workout chooser', async () => {
      await page.click('.tab-btn[data-tab="start"]'); await page.waitForTimeout(400);
      if (!(await page.isVisible('#modal-todaychoice.open').catch(() => false))) throw new Error('chooser did not open');
    })) await snap('start-chooser');
    if (await step('Continue Plan lands on the tracker', async () => {
      await page.click('#todayChoiceContinueBtn'); await page.waitForTimeout(500);
      if (!(await page.evaluate(() => document.getElementById('view-tracker')?.classList.contains('active')))) throw new Error('tracker not active');
    })) {
      await snap('tracker');
      if (await step('expand the first exercise card', async () => { await page.locator('.ex-card').first().click(); await page.waitForTimeout(300); })) await snap('tracker-card-open');
      await step('log one set', async () => { await page.locator('.set-btn').first().click(); await page.waitForTimeout(300); });
      if (await step('Finish the workout', async () => { await page.locator('.bnav-btn.primary').click(); await page.waitForTimeout(600); })) await snap('finish');
    }
  }
  await page.close();
  return { viewport: vp, steps, screens, errors };
}

// Pixel diff in a browser canvas: no new npm dependency needed.
async function diffAgainstBaseline(browser, results) {
  if (!BASELINE || !existsSync(path.join(BASELINE, 'report.json'))) return null;
  const page = await browser.newPage();
  const diffs = [];
  for (const r of results) for (const s of r.screens) {
    const basePath = path.join(BASELINE, s.file);
    if (!existsSync(basePath)) { diffs.push({ file: s.file, changedPct: null, note: 'no baseline screenshot' }); continue; }
    const [a, b] = await Promise.all([readFile(path.join(OUT, s.file)), readFile(basePath)]);
    const pct = await page.evaluate(async ([a64, b64]) => {
      const load = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
      const [ia, ib] = await Promise.all([load('data:image/png;base64,' + a64), load('data:image/png;base64,' + b64)]);
      const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height);
      const ctx = Object.assign(document.createElement('canvas'), { width: w, height: h }).getContext('2d');
      ctx.drawImage(ia, 0, 0); const da = ctx.getImageData(0, 0, w, h).data;
      ctx.clearRect(0, 0, w, h); ctx.drawImage(ib, 0, 0); const db = ctx.getImageData(0, 0, w, h).data;
      let changed = 0;
      for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 48) changed++;
      return +(100 * changed / (w * h)).toFixed(2);
    }, [a.toString('base64'), b.toString('base64')]);
    diffs.push({ file: s.file, changedPct: pct });
  }
  await page.close();
  return diffs;
}

function keyOf(r, s, f) { return `${r.viewport.name}|${s.name}|${f.kind}|${f.target || ''}`; }

async function main() {
  await mkdir(OUT, { recursive: true });
  let server = null, base = args.url;
  if (!base) { server = await startServer(); base = `http://localhost:${PORT}/tandem.html`; }
  let browser;
  try { browser = await chromium.launch(); }
  catch (e) { console.error(`HARNESS  could not launch Chromium (${e.message.split('\n')[0]}). Run in CI, or after npx playwright install chromium.`); process.exit(2); }
  const results = [];
  try {
    for (const vp of VIEWPORTS) results.push(await sweepViewport(browser, base, vp));
    const diffs = await diffAgainstBaseline(browser, results);

    let baseKeys = null, baseErrs = null;
    if (BASELINE && existsSync(path.join(BASELINE, 'report.json'))) {
      const prior = JSON.parse(await readFile(path.join(BASELINE, 'report.json'), 'utf8'));
      baseKeys = new Set(prior.results.flatMap(r => r.screens.flatMap(s => s.findings.map(f => keyOf(r, s, f)))));
      baseErrs = new Set(prior.results.flatMap(r => r.errors.map(e => `${e.kind}|${e.text}`)));
    }
    for (const r of results) {
      for (const s of r.screens) for (const f of s.findings) f.isNew = baseKeys ? !baseKeys.has(keyOf(r, s, f)) : null;
      for (const e of r.errors) e.isNew = baseErrs ? !baseErrs.has(`${e.kind}|${e.text}`) : null;
    }
    const failedSteps = results.flatMap(r => r.steps.filter(s => !s.ok).map(s => `${r.viewport.name}: ${s.name} — ${s.error}`));
    const allFindings = results.flatMap(r => r.screens.flatMap(s => s.findings.map(f => ({ vp: r.viewport.name, screen: s.name, ...f }))));
    const allErrors = results.flatMap(r => r.errors.map(e => ({ vp: r.viewport.name, ...e })));
    const newBlocking = allFindings.filter(f => f.isNew === true && f.severity !== 'P3');
    const newErrors = allErrors.filter(e => e.isNew === true);

    const report = { label: args.label || null, target: base, ranAt: new Date().toISOString(), results, diffs,
      summary: { failedSteps, findings: allFindings.length, newBlocking: newBlocking.length, errors: allErrors.length, newErrors: newErrors.length } };
    await writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

    const md = [];
    md.push(`### Lane visual sweep${args.label ? ` — ${args.label}` : ''}`);
    md.push(`Target: ${base}`);
    md.push(`Flow: ${failedSteps.length ? `**${failedSteps.length} step(s) failed**` : 'every step completed'} at ${VIEWPORTS.map(v => v.width).join(' and ')}px.`);
    for (const f of failedSteps) md.push(`- step failed: ${f}`);
    md.push(`Runtime errors: ${allErrors.length}${baseErrs ? ` (${newErrors.length} new vs baseline)` : ''}.`);
    for (const e of (baseErrs ? newErrors : allErrors).slice(0, 10)) md.push(`- ${e.vp} ${e.kind}: ${e.text}`);
    md.push(`Visual findings: ${allFindings.length}${baseKeys ? ` (${newBlocking.length} new P2 vs baseline)` : ''}.`);
    // Grouped by (kind, element): one line per distinct problem with the screens it shows on,
    // so a reader sees "this button is too small on 9 screens" once, not nine times.
    const show = baseKeys ? allFindings.filter(f => f.isNew) : allFindings;
    const groups = new Map();
    for (const f of show) {
      const k = `${f.severity}|${f.kind}|${f.target || ''}`;
      const g = groups.get(k) || { ...f, where: new Set() };
      g.where.add(`${f.vp}/${f.screen}`); groups.set(k, g);
    }
    const ordered = [...groups.values()].sort((x, y) => x.severity.localeCompare(y.severity) || y.where.size - x.where.size);
    for (const g of ordered.slice(0, 40)) md.push(`- ${g.severity} ${g.kind}: ${g.target || ''} ${g.detail} — on ${g.where.size} screen(s): ${[...g.where].slice(0, 6).join(', ')}${g.where.size > 6 ? ', …' : ''}${g.isNew ? ' NEW' : ''}`);
    if (ordered.length > 40) md.push(`- …and ${ordered.length - 40} more distinct finding(s) in report.json`);
    if (diffs) {
      const changed = diffs.filter(d => d.changedPct === null || d.changedPct > 0.5);
      md.push(`Screens that changed vs baseline (>0.5% of pixels): ${changed.length} of ${diffs.length}.`);
      for (const d of changed) md.push(`- ${d.file}: ${d.changedPct === null ? d.note : d.changedPct + '%'}`);
    }
    md.push('', 'Not covered by this check: iOS home-screen PWA behaviour, safe-area insets, real sync/auth, HealthKit. Those still need a device.');
    await writeFile(path.join(OUT, 'summary.md'), md.join('\n') + '\n');
    console.log(md.join('\n'));

    const fail = failedSteps.length > 0 || newBlocking.length > 0 || newErrors.length > 0;
    process.exit(fail ? 1 : 0);
  } finally {
    await browser.close();
    if (server) server.close();
  }
}

main().catch(e => { console.error('HARNESS', e); process.exit(2); });
