#!/usr/bin/env node
// shots-wave5.mjs — Wave 5 DoD screenshots (session-complete celebration sheet:
// hero+stats, PR rows + heatmap, female variant) at 390x844, saved to
// docs/screenshots/wave5/. Same serving/stub recipe as shots-wave4.mjs.
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'docs', 'screenshots', 'wave5');
const PORT = 8944 + Math.floor(Math.random() * 400);

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
      const type = ext === '.js' ? 'application/javascript' : ext === '.html' ? 'text/html'
        : ext === '.webp' ? 'image/webp' : ext === '.jpg' ? 'image/jpeg' : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  return new Promise(resolve => server.listen(PORT, () => resolve(server)));
}

async function onboardToDashboard(page) {
  await page.goto(`http://localhost:${PORT}/tandem.html`);
  await page.waitForTimeout(400);
  await page.evaluate(() => { if (typeof skipAuth === 'function') skipAuth(); });
  await page.waitForTimeout(300);
  await page.click('.goal-card[onclick*="build_muscle"]');
  await page.waitForTimeout(150);
  await page.click('#obNextBtn');
  await page.waitForTimeout(150);
  const gateBtn = page.locator("button.ob-build-btn[onclick*=\"resumePath('build')\"]");
  if (await gateBtn.isVisible().catch(() => false)) { await gateBtn.click(); await page.waitForTimeout(150); }
  await page.fill('#ob-weight', '225');
  await page.fill('#ob-target-weight', '195');
  await page.click("[onclick*=\"selectSex('M'\"]");
  await page.click("[onclick*=\"selectExperience('intermediate'\"]");
  await page.click('#obNextBtn'); await page.waitForTimeout(150);
  await page.fill('#ob-weeks', '12');
  await page.click('.day-dot[onclick*="selectDays(4"]');
  await page.click('#obNextBtn'); await page.waitForTimeout(150);
  await page.click("[onclick*=\"selectWorkoutTime('morning'\"]");
  await page.click('#obNextBtn'); await page.waitForTimeout(150);
  for (let i = 0; i < 3; i++) {
    const on = await page.evaluate(() => document.getElementById('view-onboard')?.classList.contains('active'));
    if (!on) break;
    if (!(await page.isVisible('#obNextBtn').catch(() => false))) break;
    await page.click('#obNextBtn').catch(() => {});
    await page.waitForTimeout(150);
  }
  await page.click('.ob-build-btn');
  await page.waitForTimeout(500);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch();
  const jsErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', e => jsErrors.push(e.message));
    await page.route('**/supabase.min.js', r => r.fulfill({ contentType: 'application/javascript', body: SUPABASE_STUB }));
    await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: '' }));

    await onboardToDashboard(page);

    // Seed a training week (heatmap volume) + two PRs beaten today (gold rows),
    // then open the celebration sheet the way finishSession does.
    await page.evaluate(() => {
      const mk = (name, n) => Array.from({ length: n }, () => ({ name, weight: 100, reps: 8, done: true }));
      LS.set('tandem_history', [{ date: new Date().toISOString().slice(0, 10), exercises: {
        a: mk('Flat Barbell Press', 4), b: mk('Barbell Back Squat', 4),
        c: mk('Lat Pulldown', 4), d: mk('Dumbbell Lateral Raise', 3),
        e: mk('Romanian Deadlift', 3), f: mk('Barbell Curl', 3) } }]);
      LS.set('tandem_working1rm', {
        'Flat Barbell Press': { rm: 245, date: localDateStr(), dir: 'pr' },
        'Barbell Back Squat': { rm: 315, date: localDateStr(), dir: 'pr' },
      });
      showSessionSummary(18450, 52, 2, 4);
    });
    await page.waitForTimeout(400);

    // 1. Celebration sheet — hero + stats
    await page.screenshot({ path: path.join(OUT, 'summary-top.png') });

    // 2. Scrolled — gold PR rows + reused muscle heatmap + CTA
    await page.evaluate(() => { document.querySelector('.sum-sheet').scrollTop = 99999; });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, 'summary-map.png') });

    // 3. Female — photo and map both follow userSexKey()
    await page.evaluate(() => { cfg.sex = 'F'; showSessionSummary(18450, 52, 2, 4); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, 'summary-top-female.png') });
    await page.evaluate(() => { document.querySelector('.sum-sheet').scrollTop = 99999; });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, 'summary-map-female.png') });

    if (jsErrors.length) throw new Error('JS errors: ' + jsErrors.join(' | '));
    console.log('wave5 shots written to', OUT);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
