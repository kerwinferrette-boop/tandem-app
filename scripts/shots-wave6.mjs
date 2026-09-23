#!/usr/bin/env node
// shots-wave6.mjs — Wave 6 DoD screenshots (workout tracker chrome: Start pill +
// day tabs + phase banner, live timer, open exercise card + #bottomNav) at
// 390x844, saved to docs/screenshots/wave6/. Same serving/stub recipe as shots-wave5.mjs.
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'docs', 'screenshots', 'wave6');
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

    // 1. Tracker top — phase banner, Start pill, tool chips, day tabs, day title
    await page.evaluate(() => { showView('tracker'); window.scrollTo({ top: 0, behavior: 'instant' }); });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'tracker-top.png') });

    // 2. Live timer state — Start pill swapped for the live timer row
    await page.evaluate(() => document.querySelector('.session-timer-start')?.click());
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: path.join(OUT, 'tracker-timer-live.png') });

    // 3. Open exercise card + set logger (untouched surface) with #bottomNav pills
    await page.evaluate(() => {
      const head = document.querySelector('.ex-header');
      if (head) head.click();
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const card = document.querySelector('.ex-card.open') || document.querySelector('.ex-card');
      if (card) window.scrollTo({ top: card.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' });
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, 'tracker-open-card.png') });

    if (jsErrors.length) throw new Error('JS errors: ' + jsErrors.join(' | '));
    console.log('wave6 shots written to', OUT);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
