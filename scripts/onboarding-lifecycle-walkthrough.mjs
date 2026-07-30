#!/usr/bin/env node
// Onboarding → dashboard → tracker lifecycle walkthrough.
//
// Origin: Kerwin's in-app bug report 2026-07-30 (BUG-61) — "Go through a plan from plan
// creation to the end of the program, note each error, instead of fixing it then and there,
// note it, finish the program, then go back & at a macro level see why the error is happening."
//
// Every other standing check (validate:programs, validate:personas, verify) tests
// getProgram() as a pure function: given an already-assembled cfg, is the *output* correct.
// None of them drive the actual UI a user has to get through to produce that cfg in the
// first place. BUG-61 (onboarding Next button permanently stuck if Weeks was filled after
// Training Days) lived entirely in that untested layer — a real user could never have
// reached a valid cfg at all, and no structural sweep of getProgram() could ever have
// caught it. This script is the standing source that closes that specific gap.
//
// Phase 1 scope (this version): onboarding wizard end-to-end (multiple field-fill orders,
// generalizing the BUG-61 class of order-dependent gating bug to every gated step) through
// Build My Program, then into the dashboard/tracker and one set-log + Finish. It does NOT
// yet fast-forward through multiple weeks to a program's real final/realization week —
// that's a known Phase 2 gap, flagged here rather than silently claimed as covered.
//
// Per loop-config.md's discovery_handling: this script only DISCOVERS and REPORTS findings.
// It never fixes anything and never writes to Notion itself — findings get filed as new
// Bug & QA Log rows (+ linked Untested stories) by whichever loop cycle consumes this output.

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

// ── Onboarding step specs: each gated step's required fields + two fill orders ──
// Order "forward" = the order a field-by-field top-to-bottom user would naturally fill.
// Order "reverse" = the last required field is touched FIRST — this is the exact shape
// of BUG-61 (a field with no re-check handler stays stale if it's the last one touched).
const STEP_SPECS = [
  {
    step: 0, label: 'Goal',
    fillForward: async page => page.click('.goal-card[onclick*="build_muscle"]'),
    fillReverse: async page => page.click('.goal-card[onclick*="build_muscle"]'), // single control, no order to vary
  },
  {
    step: 1, label: 'Stats',
    fillForward: async page => {
      await page.fill('#ob-weight', '225');
      await page.fill('#ob-target-weight', '195');
      await page.click('[onclick*="selectSex(\'M\'"]');
      await page.click('[onclick*="selectExperience(\'intermediate\'"]');
    },
    fillReverse: async page => {
      await page.click('[onclick*="selectExperience(\'intermediate\'"]');
      await page.click('[onclick*="selectSex(\'M\'"]');
      await page.fill('#ob-target-weight', '195');
      await page.fill('#ob-weight', '225'); // weight field filled LAST
    },
  },
  {
    step: 2, label: 'Schedule',
    fillForward: async page => {
      await page.fill('#ob-weeks', '12');
      await page.click('.day-dot[onclick*="selectDays(4"]');
    },
    fillReverse: async page => {
      await page.click('.day-dot[onclick*="selectDays(4"]');
      await page.fill('#ob-weeks', '12'); // weeks field filled LAST — this is BUG-61's exact repro
    },
  },
  {
    step: 3, label: 'Training Preferences',
    fillForward: async page => {
      await page.click('[onclick*="selectEquipment(\'full_gym\'"]');
      await page.click('[onclick*="selectWorkoutTime(\'morning\'"]');
    },
    fillReverse: async page => {
      await page.click('[onclick*="selectWorkoutTime(\'morning\'"]');
      await page.click('[onclick*="selectEquipment(\'full_gym\'"]'); // equipment filled LAST
    },
  },
];

async function runOnboardingPass(page, order, findings) {
  await page.goto(`http://localhost:${PORT}/tandem.html`);
  await page.waitForTimeout(300);
  await page.evaluate(() => { if (typeof skipAuth === 'function') skipAuth(); });
  await page.waitForSelector('#view-onboard.active, #view-onboard', { timeout: 5000 }).catch(() => {});
  const onboardVisible = await page.evaluate(() => document.getElementById('view-onboard')?.classList.contains('active'));
  if (!onboardVisible) {
    findings.push({ area: 'onboarding-entry', order, detail: 'skipAuth() did not land on #view-onboard as active — cannot proceed with this pass.' });
    return false;
  }

  for (const spec of STEP_SPECS) {
    const fillFn = order === 'forward' ? spec.fillForward : spec.fillReverse;
    try {
      await fillFn(page);
    } catch (e) {
      findings.push({ area: `onboarding-step-${spec.step}-${spec.label}`, order, detail: `Failed to interact with a required control: ${e.message}` });
      return false;
    }
    await page.waitForTimeout(120);
    const disabled = await page.isDisabled('#obNextBtn').catch(() => null);
    if (disabled !== false) {
      findings.push({
        area: `onboarding-step-${spec.step}-${spec.label}`,
        order,
        detail: `Next button did not enable after all required fields on this step were filled in "${order}" order (disabled=${disabled}). This is the BUG-61 class of order-dependent gating bug.`,
      });
      return false; // stuck — can't advance further this pass, but we already logged it and move to the next pass
    }
    await page.click('#obNextBtn');
    await page.waitForTimeout(150);
  }

  // Remaining ungated steps (Preferences extras, Color, Baseline Estimates, Review) — just advance.
  for (let i = 0; i < 3; i++) {
    const stillOnboarding = await page.evaluate(() => document.getElementById('view-onboard')?.classList.contains('active'));
    if (!stillOnboarding) break;
    const nextVisible = await page.isVisible('#obNextBtn').catch(() => false);
    if (!nextVisible) break;
    await page.click('#obNextBtn').catch(() => {});
    await page.waitForTimeout(150);
  }

  const buildBtnVisible = await page.isVisible('.ob-build-btn').catch(() => false);
  if (!buildBtnVisible) {
    findings.push({ area: 'onboarding-review', order, detail: 'Never reached the Review card / "Build My Program" button after advancing through all gated steps.' });
    return false;
  }
  await page.click('.ob-build-btn');
  await page.waitForTimeout(400);

  const dashboardActive = await page.evaluate(() => document.getElementById('view-dashboard')?.classList.contains('active'));
  if (!dashboardActive) {
    findings.push({ area: 'build-program', order, detail: 'Clicking "Build My Program" did not land on the dashboard view.' });
    return false;
  }
  return true;
}

async function runTrackerSmoke(page, findings) {
  const ctaVisible = await page.isVisible('.dash-cta').catch(() => false);
  if (!ctaVisible) {
    findings.push({ area: 'dashboard', order: 'n/a', detail: '"Today\'s Workout →" CTA not visible on a freshly built program.' });
    return;
  }
  await page.click('.dash-cta');
  await page.waitForTimeout(300);
  const trackerActive = await page.evaluate(() => document.getElementById('view-tracker')?.classList.contains('active'));
  if (!trackerActive) {
    findings.push({ area: 'tracker-entry', order: 'n/a', detail: '"Today\'s Workout →" did not land on the tracker view.' });
    return;
  }
  // Exercise cards render collapsed (.ex-card without .open hides .set-logger via CSS) —
  // expand the first one before its set-log buttons are interactable, same as a real user.
  const firstExCard = page.locator('.ex-card').first();
  if (await firstExCard.count() === 0) {
    findings.push({ area: 'tracker-log-set', order: 'n/a', detail: 'No .ex-card elements rendered on the tracker view for a freshly built program.' });
    return;
  }
  await firstExCard.click().catch(e => findings.push({ area: 'tracker-expand-card', order: 'n/a', detail: `Clicking the first exercise card to expand it threw: ${e.message}` }));
  await page.waitForTimeout(150);

  const firstSetBtn = page.locator('.set-btn').first();
  if (await firstSetBtn.count() === 0) {
    findings.push({ area: 'tracker-log-set', order: 'n/a', detail: 'No .set-btn elements rendered inside the expanded exercise card.' });
  } else {
    await firstSetBtn.click().catch(e => findings.push({ area: 'tracker-log-set', order: 'n/a', detail: `Clicking the first set-log button (after expanding the card) threw: ${e.message}` }));
  }
  const finishBtn = page.locator('.bnav-btn.primary');
  if (await finishBtn.count() > 0) {
    await finishBtn.click().catch(e => findings.push({ area: 'tracker-finish', order: 'n/a', detail: `Clicking "Finish" threw: ${e.message}` }));
    await page.waitForTimeout(300);
  } else {
    findings.push({ area: 'tracker-finish', order: 'n/a', detail: 'No Finish button found on the tracker view.' });
  }
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  const findings = [];

  for (const order of ['forward', 'reverse']) {
    const page = await browser.newPage();
    const jsErrors = [];
    page.on('pageerror', err => jsErrors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('ERR_CONNECTION_RESET') && !msg.text().includes('favicon')) jsErrors.push(msg.text()); });
    await page.route('**/supabase.min.js', route => route.fulfill({ contentType: 'application/javascript', body: SUPABASE_STUB }));

    const reachedDashboard = await runOnboardingPass(page, order, findings);
    if (reachedDashboard && order === 'forward') {
      // Only run the post-onboarding tracker smoke once (on the pass that succeeds) —
      // it's testing a different surface, not re-testing onboarding order sensitivity.
      await runTrackerSmoke(page, findings);
    }

    if (jsErrors.length) {
      findings.push({ area: `js-exceptions (${order} pass)`, order, detail: jsErrors.slice(0, 10).join(' | ') });
    }
    await page.close();
  }

  await browser.close();
  await new Promise(resolve => server.close(resolve));

  console.log(`\nOnboarding lifecycle walkthrough — ${findings.length} finding(s)\n`);
  if (findings.length) {
    findings.forEach((f, i) => console.log(`${i + 1}. [${f.area}] (order: ${f.order})\n   ${f.detail}\n`));
  } else {
    console.log('No stuck-gate / entry-blocking issues found across both fill orders, and the dashboard→tracker→log-set→finish smoke passed clean.');
  }
  console.log('\nNote: Phase 1 scope — does not yet fast-forward through multiple weeks to a real final/realization week. See .claude/loop-config.md self_generated_sources.\n');

  process.exit(findings.length ? 1 : 0);
}

main().catch(e => { console.error('WALKTHROUGH SCRIPT ERROR:', e); process.exit(2); });
