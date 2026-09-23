#!/usr/bin/env node
// shots-wave7.mjs — Wave 7 DoD screenshots (sign-in hero + pills, onboarding goal
// step, onboarding nav pills) at 390x844, saved to docs/screenshots/wave7/.
// Same serving/stub recipe as shots-wave6.mjs.
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'docs', 'screenshots', 'wave7');
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

    await page.goto(`http://localhost:${PORT}/tandem.html`);
    await page.waitForTimeout(500);

    // 1. Sign-in — duotone hero band, display heading, accent pill CTA
    await page.screenshot({ path: path.join(OUT, 'auth-top.png') });

    // 2. Onboarding goal step — hero + display title + goal cards
    await page.evaluate(() => { if (typeof skipAuth === 'function') skipAuth(); });
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: path.join(OUT, 'onboard-goal.png') });

    // 3. Onboarding nav — goal selected, enabled accent Next pill + circular Back
    await page.click('.goal-card[onclick*="build_muscle"]');
    await page.waitForTimeout(200);
    await page.evaluate(() => document.getElementById('obNextBtn')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, 'onboard-nav.png') });

    if (jsErrors.length) throw new Error('JS errors: ' + jsErrors.join(' | '));
    console.log('wave7 shots written to', OUT);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
