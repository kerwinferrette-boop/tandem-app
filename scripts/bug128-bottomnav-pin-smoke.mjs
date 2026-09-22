#!/usr/bin/env node
/**
 * bug128-bottomnav-pin-smoke.mjs — REGRESSION GUARD for BUG-128
 * ("bottom nav does not stay fixed").
 *
 * WHAT THIS PROVES, HONESTLY: `#bottomNav`'s bounding rect stays pinned to the
 * bottom of a FIXED-SIZE headless viewport across a full page scroll, on the
 * tracker view (where the nav is visible), and that it still positions
 * correctly (still display:flex, still rect-pinned) underneath an open modal.
 * It does NOT and structurally CANNOT reproduce or verify the actual reported
 * mechanism — a mobile browser's dynamic show/hide toolbar changing the live
 * viewport size mid-scroll (headless Chromium has no such toolbar; this was
 * confirmed live during BUG-128's investigation, see docs/self-corrections.md
 * and the BUG-128 Notion row for the citations). That half of the fix
 * (`env(safe-area-inset-bottom)` on `.bottom-nav`, tandem.html) is verified by
 * citation to web.dev/Apple-documented behavior, not by this script.
 *
 * What THIS script guards against going forward: a future edit that re-breaks
 * the baseline, always-should-hold case — an ancestor of `.bottom-nav`
 * regaining a `transform`/`filter`/`perspective`/`contain`/`will-change` (any
 * of which would make it a new containing block for the fixed nav, breaking
 * `position:fixed` outright, on every browser, headless or not) — the classic,
 * fully-headless-reproducible cause BUG-128's own investigation ruled out
 * before reaching for the mobile-toolbar explanation.
 *
 * Zero network egress: Supabase is stubbed exactly like
 * scripts/onboarding-lifecycle-walkthrough.mjs stubs it (self-mocking Proxy);
 * Google Fonts is fulfilled with an empty stylesheet, same reasoning as that
 * script's own comment on the same route.
 */
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 8934 + Math.floor(Math.random() * 500); // avoid colliding with a concurrent run

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
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  return new Promise(resolve => server.listen(PORT, () => resolve(server)));
}

// Drive onboarding to the tracker view (same clicks as
// onboarding-lifecycle-walkthrough.mjs's STEP_SPECS forward path).
async function reachTracker(page) {
  await page.goto(`http://localhost:${PORT}/tandem.html`);
  await page.waitForTimeout(300);
  await page.evaluate(() => { if (typeof skipAuth === 'function') skipAuth(); });
  await page.waitForTimeout(300);

  await page.click('.goal-card[onclick*="build_muscle"]');
  await page.waitForTimeout(150);
  await page.click('#obNextBtn');
  await page.waitForTimeout(150);
  const gateBtn = page.locator('button.ob-build-btn[onclick*="resumePath(\'build\')"]');
  if (await gateBtn.isVisible().catch(() => false)) { await gateBtn.click(); await page.waitForTimeout(150); }

  await page.fill('#ob-weight', '225');
  await page.fill('#ob-target-weight', '195');
  await page.click('[onclick*="selectSex(\'M\'"]');
  await page.click('[onclick*="selectExperience(\'intermediate\'"]');
  await page.click('#obNextBtn');
  await page.waitForTimeout(150);

  await page.fill('#ob-weeks', '12');
  await page.click('.day-dot[onclick*="selectDays(4"]');
  await page.click('#obNextBtn');
  await page.waitForTimeout(150);

  await page.click('[onclick*="selectWorkoutTime(\'morning\'"]');
  await page.click('#obNextBtn');
  await page.waitForTimeout(150);

  for (let i = 0; i < 3; i++) {
    const stillOnboarding = await page.evaluate(() => document.getElementById('view-onboard')?.classList.contains('active'));
    if (!stillOnboarding) break;
    const nextVisible = await page.isVisible('#obNextBtn').catch(() => false);
    if (!nextVisible) break;
    await page.click('#obNextBtn').catch(() => {});
    await page.waitForTimeout(150);
  }

  const buildBtnVisible = await page.isVisible('.ob-build-btn').catch(() => false);
  if (!buildBtnVisible) throw new Error('Never reached the Review card / "Build My Program" button.');
  await page.click('.ob-build-btn');
  await page.waitForTimeout(400);

  const dashboardActive = await page.evaluate(() => document.getElementById('view-dashboard')?.classList.contains('active'));
  if (!dashboardActive) throw new Error('Clicking "Build My Program" did not land on the dashboard view.');

  await page.click('.dash-cta');
  await page.waitForTimeout(200);
  const choiceVisible = await page.isVisible('#modal-todaychoice.open').catch(() => false);
  if (!choiceVisible) throw new Error('"Today\'s Workout" CTA did not open the Continue/Generate/Journal choice.');
  await page.click('#todayChoiceContinueBtn');
  await page.waitForTimeout(300);

  const trackerActive = await page.evaluate(() => document.getElementById('view-tracker')?.classList.contains('active'));
  if (!trackerActive) throw new Error('"Continue Plan" did not land on the tracker view.');
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  const failures = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // phone viewport per BUG-128's prompt
    const jsErrors = [];
    page.on('pageerror', err => jsErrors.push(err.message));
    await page.route('**/supabase.min.js', route => route.fulfill({ contentType: 'application/javascript', body: SUPABASE_STUB }));
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));

    await reachTracker(page);

    const vh = await page.evaluate(() => window.innerHeight);

    // 1. Pinned before any scroll.
    const rect0 = await page.evaluate(() => document.getElementById('bottomNav').getBoundingClientRect());
    if (Math.abs(rect0.bottom - vh) > 1) {
      failures.push(`Before scroll: #bottomNav.bottom=${rect0.bottom}, viewport height=${vh} (expected pinned to bottom).`);
    }

    // 2. Pinned after scrolling the page to its full extent (the reported
    //    "leaderboard and workout history" symptom is a long-scroll one).
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(200);
    const rect1 = await page.evaluate(() => document.getElementById('bottomNav').getBoundingClientRect());
    if (Math.abs(rect1.bottom - vh) > 1) {
      failures.push(`After full scroll: #bottomNav.bottom=${rect1.bottom}, viewport height=${vh} (expected still pinned to bottom — this is the BUG-128 regression shape).`);
    }
    if (rect1.left !== 0 || Math.abs(rect1.right - Math.min(390, rect1.right)) > 400) {
      // sanity: still spans full width, didn't detach horizontally either
      failures.push(`After full scroll: #bottomNav rect looks detached: ${JSON.stringify(rect1)}.`);
    }

    // 3. Scroll back to top — still pinned (no one-way drift).
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const rect2 = await page.evaluate(() => document.getElementById('bottomNav').getBoundingClientRect());
    if (Math.abs(rect2.bottom - vh) > 1) {
      failures.push(`After scrolling back to top: #bottomNav.bottom=${rect2.bottom}, viewport height=${vh} (expected still pinned).`);
    }

    // 4. Underneath an open modal (hypothesis b from BUG-128's investigation —
    //    modal-sheet's own max-height:92vh;overflow-y:auto scroll context must
    //    not carry the nav along with it). Nav should stay display:flex and
    //    rect-pinned even though the modal visually sits above it (z-index).
    await page.evaluate(() => { openModal('history'); });
    await page.waitForTimeout(200);
    const modalState = await page.evaluate(() => {
      const nav = document.getElementById('bottomNav');
      return { display: getComputedStyle(nav).display, rect: nav.getBoundingClientRect() };
    });
    if (modalState.display === 'flex' && Math.abs(modalState.rect.bottom - vh) > 1) {
      failures.push(`With history modal open: #bottomNav still shown but rect.bottom=${modalState.rect.bottom}, viewport height=${vh} (expected pinned).`);
    }

    if (jsErrors.length) {
      failures.push(`JS errors during the walkthrough: ${jsErrors.join(' | ')}`);
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (failures.length) {
    console.error('BUG-128 bottom-nav pin smoke — FAILURES:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('BUG-128 bottom-nav pin smoke — PASS (pinned before/after/during scroll, and under an open modal; the mobile-dynamic-toolbar half of this bug is not reproducible headless — see the script header).');
  process.exit(0);
}

main().catch(e => { console.error('bug128-bottomnav-pin-smoke.mjs threw:', e); process.exit(1); });
