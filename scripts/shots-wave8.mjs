#!/usr/bin/env node
// shots-wave8.mjs — Wave 8 DoD screenshots (remaining modals via shared primitives:
// profile, 1RM calc, skip decision) at 390x844, saved to docs/screenshots/wave8/.
// Same serving/stub recipe as shots-wave7.mjs.
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'docs', 'screenshots', 'wave8');
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

    // 1. Profile & Settings — 28px title, pill rows, accent save pills
    await page.evaluate(() => openModal('profile'));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'modal-profile.png') });

    // 2. 1RM calculator — shared title style + calc surfaces
    await page.evaluate(() => { closeModal('profile'); openModal('calc'); });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      document.getElementById('calc-w').value = 185;
      document.getElementById('calc-r').value = 5;
      calcORM();
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, 'modal-calc.png') });

    // 3. Skip decision tree — shared title + option cards
    await page.evaluate(() => { closeModal('calc'); openModal('skip'); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, 'modal-skip.png') });

    if (jsErrors.length) throw new Error('JS errors: ' + jsErrors.join(' | '));
    console.log('wave8 shots written to', OUT);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
