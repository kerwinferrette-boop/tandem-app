#!/usr/bin/env node
// Full-program UI RENDERING-FIDELITY walkthrough.
//
// Origin: Kerwin's framing 2026-07-30 — "I live in the UI when I'm actually training."
// scripts/onboarding-lifecycle-walkthrough.mjs covers ENTRY (the wizard, through Build My
// Program + one set-log on Week 1). scripts/doctrine.mjs covers the DATA LAYER (as of
// commit ae66e63, D11 executes the live weekFactor() across every goal x every length
// 4-24wk — 882 week-steps — so progressive overload / deload-intensity override /
// realization override are independently proven correct *as computed*).
//
// Nothing verified that the UI actually RENDERS those computed values as a user pages
// from week 1 to week 12. That is this script's entire job, and it is deliberately narrow:
//
//   THE GENERATOR IS THE ORACLE, NOT THE SCIENCE.
//   We do not re-derive %1RM, rep bands, or deload placement here — doctrine.mjs already
//   proved those correct. We call the app's OWN weekFactor()/deloadWeeks()/realizationWeek()
//   in-page and assert the rendered DOM matches what they return. A failure here therefore
//   means UI/data DRIFT (the render layer disagreeing with the verified engine), never a
//   science error. That distinction is what makes a clean run here meaningful instead of
//   circular.
//
// ── Week navigation: no shortcut is used ────────────────────────────────────────────────
// The task called for writing tandem_week into localStorage and reloading. I checked
// whether that renders through the same code path a real multi-week user hits, and it does:
//   - changeWeek(delta) (tandem.html:4334-4338) is the ONLY in-app week stepper and does
//     exactly `currentWeek = N; LS.set('tandem_week', N); renderTracker();`
//   - finishSession() NEVER writes tandem_week (it only advances tandem_current_day at
//     :4093). Nothing in the app auto-advances the week.
//   - the init IIFE reads tandem_week (:5473) and calls renderTracker().
// So an LS write + reload is genuinely equivalent. BUT the `›` button at tandem.html:1464
// is wired directly to changeWeek(1), so the shortcut buys nothing — this script CLICKS THE
// REAL BUTTON instead. That removes the question entirely rather than reasoning around it.
//
// KNOWN, DELIBERATE GAP (stated rather than papered over): stepping weeks this way does not
// run reconcileWorking1RMs() (tandem.html:2156-2193), which only fires from finishSession().
// That is precisely why this script SEEDS tandem_working1rm directly — with empty PRs,
// getWeekTarget() returns source:'default', the weekFactor() result is DISCARDED (:2299),
// and every card would show a week-invariant default number, making the whole %1RM assertion
// vacuous. Seeding puts the render on the calibrated path. What is NOT covered here is
// earned-1RM progression across real completed sessions — that is a separate surface.
//
// Per loop-config.md discovery_handling: DISCOVERS and REPORTS only. Never fixes, never
// writes to Notion. Findings are consumed by the loop cycle that runs this.

import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 9410 + Math.floor(Math.random() * 500);

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

// ── Which program lengths, and why ──────────────────────────────────────────────────────
// NOT the full 4-24wk range. Four lengths, chosen because they are the only four distinct
// SHAPES the deload table produces (verified against the live DELOAD_TABLE/realizationWeek(),
// not assumed). Every other length is a repeat of one of these with more blocks:
//
//   T=4  deloads [4]      realization 4     single block; deload == final == realization,
//                                           so there is NO mid-program deload at all.
//   T=8  deloads [4,8]    realization 8     one mid-program deload + a final realization.
//   T=11 deloads [5,10]   realization null  THE documented exception — the final week is
//                                           neither a deload nor a realization; week 11 is
//                                           real training. This is the only length like it.
//   T=12 deloads [4,8,12] realization 12    two mid-program deloads + a final realization.
//
// 5/6/7 repeat T=4's shape; 9/10 repeat T=8's; 13-24 repeat T=12's.
// This is explicitly NOT a claim of 4-24 coverage.
const LENGTH_SHAPES = {
  4:  { weeks: [1, 2, 3, 4],                 why: 'single block; deload == final == realization; no mid-program deload' },
  8:  { weeks: [1, 3, 4, 5, 8],              why: 'symmetric [4,8]; one mid-program deload + final realization' },
  11: { weeks: [1, 4, 5, 9, 10, 11],         why: 'THE exception — [5,10], final week is real training, no realization' },
  12: { weeks: [1, 3, 4, 7, 8, 11, 12],      why: 'three-block [4,8,12]; two mid-program deloads + final realization' },
};

// build_muscle is run at all four lengths: it is the only goal with a D13 deload-intensity
// override, so it is the only one whose curve legitimately dips — the richest D11/D13/D14
// surface. transform + fat_burn are run at two lengths each, because what they uniquely
// exercise is D5 (superset-driven) and their own D10 bands, which are length-independent.
const MATRIX = [
  { goal: 'build_muscle', T: 4 },
  { goal: 'build_muscle', T: 8 },
  { goal: 'build_muscle', T: 11 },
  { goal: 'build_muscle', T: 12 },
  { goal: 'transform',    T: 8 },
  { goal: 'transform',    T: 12 },
  { goal: 'fat_burn',     T: 8 },
  { goal: 'fat_burn',     T: 11 },
];

// D10 bands, straight from the 5-Goal Taxonomy row mirrored in /DOCTRINE.md.
const REP_BANDS = {
  fat_burn:     { min: 10, max: Infinity, label: 'Fat Burn >=10' },
  build_muscle: { min: 6,  max: 15,       label: 'Build Muscle 6-15' },
  transform:    { min: 8,  max: 12,       label: 'Transform 8-12' },
};

const SEED_RM = 225;

async function buildProgram(page, goal, T) {
  await page.goto(`http://localhost:${PORT}/tandem.html`);
  await page.waitForTimeout(250);
  await page.evaluate(() => { if (typeof skipAuth === 'function') skipAuth(); });
  await page.waitForTimeout(150);

  // Step 0 Goal
  await page.click(`.goal-card[onclick*="selectGoal('${goal}'"]`);
  await page.click('#obNextBtn');
  // Step 1 Stats
  await page.fill('#ob-weight', '225');
  await page.fill('#ob-target-weight', '195');
  await page.click('[onclick*="selectSex(\'M\'"]');
  await page.click('[onclick*="selectExperience(\'intermediate\'"]');
  await page.click('#obNextBtn');
  // Step 2 Schedule — weeks is the whole point of this script
  await page.fill('#ob-weeks', String(T));
  await page.click('.day-dot[onclick*="selectDays(4"]');
  await page.click('#obNextBtn');
  // Step 3 Training Preferences
  await page.click('[onclick*="selectEquipment(\'full_gym\'"]');
  await page.click('[onclick*="selectWorkoutTime(\'morning\'"]');
  await page.click('#obNextBtn');
  // Remaining ungated steps
  for (let i = 0; i < 4; i++) {
    if (await page.isVisible('.ob-build-btn').catch(() => false)) break;
    if (!(await page.isVisible('#obNextBtn').catch(() => false))) break;
    await page.click('#obNextBtn').catch(() => {});
    await page.waitForTimeout(80);
  }
  if (!(await page.isVisible('.ob-build-btn').catch(() => false))) return false;
  await page.click('.ob-build-btn');
  await page.waitForTimeout(350);
  return true;
}

// Seed a working 1RM for every exercise in the program so getWeekTarget() takes the
// 'calibrated' branch (tandem.html:2099-2101) and the rendered number is actually a
// function of weekFactor(). Without this the %1RM assertions are vacuous — see header.
async function seedWorkingRMs(page, rm) {
  return page.evaluate((RM) => {
    const prog = getActiveProgram();
    const working = {};
    prog.forEach(d => (d.blocks || []).forEach(b => (b.exs || []).forEach(e => {
      if (e && e.name) working[e.name] = { rm: RM, date: '2026-07-31', dir: 'earned' };
    })));
    LS.set('tandem_working1rm', working);
    renderTracker();
    return Object.keys(working).length;
  }, rm);
}

// Scrape the rendered tracker. Every day renders simultaneously as a .workout-view
// (renderProgramViews :3138-3150) — only one carries .active — so one pass captures the
// whole week without tab-switching. Block association is positional: .block-label is a
// SIBLING preceding its .ex-card set (:3218), not a parent, so we walk children in order.
async function scrapeWeek(page) {
  return page.evaluate(() => {
    const out = { week: currentWeek, days: [] };
    document.querySelectorAll('.workout-view').forEach(view => {
      const day = {
        key: view.id.replace(/^wv-/, ''),
        title: view.querySelector('.dh-title')?.textContent ?? null,
        rationale: view.querySelector('.dh-rationale')?.textContent?.trim() ?? null,
        blocks: [],
      };
      let cur = null;
      for (const node of view.children) {
        if (node.classList.contains('block-label')) {
          cur = { label: node.textContent.trim(), exercises: [] };
          day.blocks.push(cur);
        } else if (node.classList.contains('cardio-block')) {
          if (cur) cur.cardio = true;
        } else if (node.classList.contains('ex-card')) {
          if (!cur) { cur = { label: '(no block label)', exercises: [] }; day.blocks.push(cur); }
          cur.exercises.push({
            id: node.id.replace(/^ec-/, ''),
            name: node.querySelector('.ex-name span')?.textContent ?? null,
            repsText: node.querySelector('.ex-reps')?.textContent?.trim().replace(/\s+/g, ' ') ?? null,
            reason: node.querySelector('.po-reason')?.textContent?.trim() ?? null,
            setBtns: node.querySelectorAll('.set-btn').length,
          });
        }
      }
      out.days.push(day);
    });
    return out;
  });
}

// The oracle: the app's own functions, called in-page.
async function oracle(page, goal, T, week) {
  return page.evaluate(([g, t, w]) => ({
    factor: weekFactor(g, w, t),
    deloads: Array.from(deloadWeeks(t)),
    realization: realizationWeek(t),
    expectedWeight: roundTo5(225 * weekFactor(g, w, t)),
  }), [goal, T, week]);
}

async function runOne(page, goal, T, findings) {
  const tag = `${goal}/${T}wk`;
  if (!(await buildProgram(page, goal, T))) {
    findings.push({ area: `build/${tag}`, detail: 'Could not reach "Build My Program" through the onboarding wizard.' });
    return;
  }
  const ctaVisible = await page.isVisible('.dash-cta').catch(() => false);
  if (!ctaVisible) {
    findings.push({ area: `dashboard/${tag}`, detail: 'No "Today\'s Workout" CTA on a freshly built program.' });
    return;
  }
  await page.click('.dash-cta');
  await page.waitForTimeout(250);
  const seeded = await seedWorkingRMs(page, SEED_RM);
  if (!seeded) {
    findings.push({ area: `seed/${tag}`, detail: 'Seeded 0 working 1RMs — %1RM assertions would be vacuous.' });
    return;
  }
  await page.waitForTimeout(120);

  const visits = LENGTH_SHAPES[T].weeks;
  const perWeek = new Map();
  let cursor = 1;

  for (const targetWeek of visits) {
    // Drive the REAL `›` / `‹` buttons (tandem.html:1462-1464 -> changeWeek).
    while (cursor < targetWeek) { await page.click('.week-nav .wn-btn >> nth=1'); cursor++; }
    while (cursor > targetWeek) { await page.click('.week-nav .wn-btn >> nth=0'); cursor--; }
    await page.waitForTimeout(120);

    const o = await oracle(page, goal, T, targetWeek);
    const snap = await scrapeWeek(page);

    if (snap.week !== targetWeek) {
      findings.push({ area: `week-nav/${tag}`, detail: `Asked for week ${targetWeek} via the week-nav button but the app reports currentWeek=${snap.week}.` });
      continue;
    }
    perWeek.set(targetWeek, { snap, o });

    const isDeload = o.deloads.includes(targetWeek) && targetWeek !== o.realization;
    const isRealization = targetWeek === o.realization;

    for (const day of snap.days) {
      // ── D4 / D14: the deload/realization label must actually reach the screen ──
      // applyDeload (programs.js) appends " · Deload" / " · Realization" to day.label and
      // that label renders at .dh-title (:3189) and .day-tab (:3141).
      const title = day.title || '';
      if (isRealization && !/realization/i.test(title)) {
        findings.push({ area: `D14-label/${tag}`, detail: `Week ${targetWeek} is the realization week (realizationWeek(${T})=${o.realization}) but the rendered day title "${title}" (day ${day.key}) does not say Realization.` });
      }
      if (isDeload && !/deload/i.test(title)) {
        findings.push({ area: `D4-label/${tag}`, detail: `Week ${targetWeek} is a deload week (deloadWeeks(${T})=[${o.deloads}]) but the rendered day title "${title}" (day ${day.key}) does not say Deload.` });
      }
      if (!isDeload && !isRealization && /deload|realization/i.test(title)) {
        findings.push({ area: `D4-label/${tag}`, detail: `Week ${targetWeek} is normal training but the rendered day title "${title}" (day ${day.key}) claims Deload/Realization.` });
      }
      if (isRealization && /deload/i.test(title)) {
        findings.push({ area: `D14-label/${tag}`, detail: `D14: the realization week must be tagged Realization, never Deload — day ${day.key} title reads "${title}".` });
      }

      const lifting = day.blocks.filter(b => !b.cardio);

      // ── D5: superset markers, and never on the primary compound block ──
      if (goal === 'transform' || goal === 'fat_burn') {
        if (!lifting.some(b => /superset/i.test(b.label))) {
          findings.push({ area: `D5-superset/${tag}`, detail: `${goal} is superset-driven but day ${day.key} week ${targetWeek} renders no block whose label marks a superset. Labels: ${lifting.map(b => b.label).join(' | ')}` });
        }
      }
      if (lifting.length && /superset/i.test(lifting[0].label)) {
        findings.push({ area: `D5-primary/${tag}`, detail: `SAFETY violation: the PRIMARY compound block of day ${day.key} week ${targetWeek} is rendered as a superset ("${lifting[0].label}").` });
      }

      for (const block of lifting) {
        for (const ex of block.exercises) {
          // ── D11 / D13 / D14: the rendered number must equal the generator's number ──
          // .po-reason on the calibrated path reads (tandem.html:2305):
          //   "{weight} lbs — {round(factor*100)}% of your {rm} lb {name} 1RM, Week {n} {goal}"
          const m = /^(\d+(?:\.\d+)?) lbs — (\d+)% of your (\d+) lb .* 1RM, Week (\d+)/.exec(ex.reason || '');
          if (m) {
            const [, wStr, pctStr, rmStr, wkStr] = m;
            const shownPct = Number(pctStr), shownWeight = Number(wStr), shownWk = Number(wkStr);
            const expectPct = Math.round(o.factor * 100);
            if (shownPct !== expectPct) {
              findings.push({ area: `D11-render/${tag}`, detail: `Week ${targetWeek} "${ex.name}": UI shows ${shownPct}% but the app's own weekFactor('${goal}',${targetWeek},${T}) = ${o.factor.toFixed(4)} (${expectPct}%). Render/engine drift.` });
            }
            if (shownWeight !== o.expectedWeight) {
              findings.push({ area: `D11-render/${tag}`, detail: `Week ${targetWeek} "${ex.name}": UI shows ${shownWeight} lbs but roundTo5(${SEED_RM} x weekFactor) = ${o.expectedWeight} lbs.` });
            }
            if (Number(rmStr) !== SEED_RM) {
              findings.push({ area: `D11-render/${tag}`, detail: `Week ${targetWeek} "${ex.name}": UI cites a ${rmStr} lb 1RM but the seeded working 1RM is ${SEED_RM}.` });
            }
            if (shownWk !== targetWeek) {
              findings.push({ area: `D11-render/${tag}`, detail: `Week ${targetWeek} "${ex.name}": the prescription text says "Week ${shownWk}".` });
            }
          }

          // ── D10: rep band, read from the DOM ──
          // .ex-reps renders "N × M reps · Rs rest" (:3292-3296); "s hold" rows are timed
          // core work with an authored repRange and are not a rep prescription.
          const rm2 = /^(\d+)\s*×\s*([\d]+)(?:-(\d+))?\s*reps/.exec((ex.repsText || '').replace(/\u00a0/g, ' '));
          if (rm2 && !isRealization) {
            const lo = Number(rm2[2]), hi = rm2[3] ? Number(rm2[3]) : Number(rm2[2]);
            const band = REP_BANDS[goal];
            if (band && (lo < band.min || hi > band.max)) {
              findings.push({ area: `D10-reps/${tag}`, detail: `Week ${targetWeek} "${ex.name}" renders ${rm2[0]} — outside the ${band.label} band.` });
            }
          }
        }
      }
    }
  }

  // ── D4: a deload week must visibly render FEWER sets than a normal week ──
  const wk1 = perWeek.get(1);
  if (wk1) {
    const setsOf = s => s.snap.days.reduce((n, d) => n + d.blocks.filter(b => !b.cardio)
      .reduce((m, b) => m + b.exercises.reduce((k, e) => k + e.setBtns, 0), 0), 0);
    const baseline = setsOf(wk1);
    for (const [wk, rec] of perWeek) {
      const isD = rec.o.deloads.includes(wk);
      if (!isD || wk === 1) continue;
      const n = setsOf(rec);
      if (!(n < baseline)) {
        findings.push({ area: `D4-volume/${tag}`, detail: `Week ${wk} is a deload/realization week but the UI renders ${n} set rows vs ${baseline} in week 1 — no visible volume cut.` });
      }
    }
  }

  // ── D15: primary/secondary compounds are FIXED for the whole program ──
  // The first non-cardio block of each day is the primary compound block.
  const primaries = new Map();
  for (const [wk, rec] of perWeek) {
    for (const day of rec.snap.days) {
      const first = day.blocks.filter(b => !b.cardio)[0];
      if (!first) continue;
      const names = first.exercises.map(e => e.name).join(' + ');
      if (!primaries.has(day.key)) primaries.set(day.key, { wk, names });
      else if (primaries.get(day.key).names !== names) {
        const seen = primaries.get(day.key);
        findings.push({ area: `D15-primary/${tag}`, detail: `Day ${day.key}: primary compounds changed mid-program — week ${seen.wk} rendered "${seen.names}", week ${wk} renders "${names}".` });
      }
    }
  }
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  const findings = [];

  console.log('\nProgram render-fidelity walkthrough');
  console.log('The oracle is the app\'s OWN weekFactor()/deloadWeeks()/realizationWeek(), called in-page.');
  console.log('A finding here means UI/engine DRIFT, not a science error (doctrine.mjs already proves the engine).\n');
  console.log('Lengths under test (4 of the 21 in the 4-24wk range — the 4 distinct deload SHAPES):');
  for (const [T, s] of Object.entries(LENGTH_SHAPES)) console.log(`  ${T}wk  weeks ${JSON.stringify(s.weeks)} — ${s.why}`);
  console.log('  NOT full 4-24 coverage: 5/6/7 repeat 4wk\'s shape, 9/10 repeat 8wk\'s, 13-24 repeat 12wk\'s.\n');

  for (const { goal, T } of MATRIX) {
    const page = await browser.newPage();
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_CONNECTION_RESET/.test(m.text())) jsErrors.push(m.text()); });
    await page.route('**/supabase.min.js', r => r.fulfill({ contentType: 'application/javascript', body: SUPABASE_STUB }));

    process.stdout.write(`  ${goal}/${T}wk ... `);
    const before = findings.length;
    try {
      await runOne(page, goal, T, findings);
    } catch (e) {
      findings.push({ area: `harness/${goal}/${T}wk`, detail: `Walkthrough threw: ${e.message}` });
    }
    if (jsErrors.length) findings.push({ area: `js-exceptions/${goal}/${T}wk`, detail: jsErrors.slice(0, 6).join(' | ') });
    console.log(`${findings.length - before} finding(s)`);
    await page.close();
  }

  await browser.close();
  await new Promise(r => server.close(r));

  console.log(`\nRender-fidelity walkthrough — ${findings.length} finding(s)\n`);
  findings.forEach((f, i) => console.log(`${i + 1}. [${f.area}]\n   ${f.detail}\n`));
  if (!findings.length) {
    console.log('Every visited week rendered exactly what the verified generator computes:');
    console.log('  D4  deload weeks render a visible set-count cut + a Deload label');
    console.log('  D5  transform/fat_burn render superset blocks; the primary block never is one');
    console.log('  D10 rendered rep prescriptions sit inside each goal\'s band');
    console.log('  D11/D13/D14 rendered %1RM and lbs match weekFactor() exactly, incl. deload dips + the realization jump');
    console.log('  D15 primary compounds identical in every visited week\n');
  }
  console.log('Scope note: 4/8/11/12wk only (stated above). Week stepping uses the real `>` button');
  console.log('(changeWeek), not an LS jump. Earned-1RM progression via finishSession() is NOT covered.\n');

  process.exit(findings.length ? 1 : 0);
}

main().catch(e => { console.error('WALKTHROUGH SCRIPT ERROR:', e); process.exit(2); });
