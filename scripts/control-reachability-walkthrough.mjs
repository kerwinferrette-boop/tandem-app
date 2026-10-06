#!/usr/bin/env node
/**
 * control-reachability-walkthrough.mjs — EPIC-63's browser gate.
 *
 * WHY THIS EXISTS
 * ---------------
 * EPIC-63 fixed controls that LOOKED wired and were not. Every gate written for
 * it was static text-matching or Node-`vm` execution of an extracted function —
 * i.e. the same category of evidence that produced the original wrong answer
 * ("1 dead handler of 159"), one level up. CLAUDE.md is explicit: "Verify at the
 * surface the USER sees, not the layer you edited."
 *
 * Two facts that forced this file, both verified rather than assumed:
 *   · `scripts/verify.mjs` wired exactly ONE Playwright check before this one
 *     (bug128-bottomnav-pin-smoke). Neither `walkthrough:onboarding` nor
 *     `walkthrough:render` is in `verify` — so a 36/36 green run had never opened
 *     a browser on any path this branch touches.
 *   · BUG-192 and BUG-193 cancelled each other out and ALL gates stayed green
 *     (see docs/self-corrections.md SC-37). Assertion [1] below is that exact
 *     regression, observed in the DOM. It is the merge gate.
 *
 * SHAPE. The program is built as a FIXTURE in-page (seed cfg, call the real
 * generator, render). The CONTROLS are then driven with real clicks/keys and every
 * assertion reads the rendered DOM. Fixture-by-JS is deliberate: driving 20
 * onboarding steps to reach the tracker makes this script fail for reasons that
 * have nothing to do with the controls under test.
 *
 * Signed-in scope via setLSScope(): anonymous mode is backed by an in-memory Map
 * that is never persisted (by design — "look-around mode"), so a reload-persistence
 * assertion under skipAuth() would be vacuous.
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 9820 + Math.floor(Math.random() * 400);

const SUPABASE_STUB = `
  function autoMock() {
    return new Proxy(function(){}, {
      get: (t, prop) => { if (prop === 'then') return undefined; return autoMock(); },
      apply: () => Promise.resolve({ data: { session: null, subscription: { unsubscribe(){} } }, error: null }),
    });
  }
  // exercise_notes gets a REAL table stub, not the auto-mock: BUG-195's cloud half
  // is a two-way reconcile, so the gate has to be able to hand the page a cloud row
  // and then watch what it pushes back. Every other table keeps the auto-mock.
  window.__notesCloud = [];
  window.__notesCalls = [];
  function notesTable() {
    return {
      select: () => ({ eq: () => Promise.resolve({ data: window.__notesCloud || [], error: null }) }),
      upsert: (row) => { window.__notesCalls.push({ op: 'upsert', row }); return Promise.resolve({ error: null }); },
      delete: () => { const f = { _eq: {}, eq(k, v) { this._eq[k] = v; return this; },
        then: (r) => { window.__notesCalls.push({ op: 'delete', eq: f._eq }); return Promise.resolve(r({ error: null })); } };
        return f; },
    };
  }
  // Every other table restoreFromCloud() touches needs to resolve, or the function
  // throws before it reaches the notes hydrate and the assertion proves nothing.
  function genericTable() {
    const res = { data: [], error: null };
    const chain = {
      select: () => chain, eq: () => chain, neq: () => chain, in: () => chain,
      order: () => chain, limit: () => chain, gte: () => chain, lte: () => chain,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      insert: () => Promise.resolve({ error: null }),
      upsert: () => Promise.resolve({ error: null }),
      update: () => chain, delete: () => chain,
      then: (r) => Promise.resolve(r(res)),
    };
    return chain;
  }
  function stubClient() {
    const base = autoMock();
    return new Proxy(function(){}, {
      get: (t, prop) => {
        if (prop === 'then') return undefined;
        if (prop === 'from') return (tbl) => (tbl === 'exercise_notes' ? notesTable() : genericTable());
        return base[prop];
      },
      apply: () => Promise.resolve({ data: { session: null, subscription: { unsubscribe(){} } }, error: null }),
    });
  }
  window.supabase = { createClient: () => stubClient() };
`;

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const reqPath = req.url === '/' ? '/tandem.html' : req.url.split('?')[0];
      const filePath = path.join(ROOT, reqPath);
      if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      let body = await readFile(filePath);
      const ext = path.extname(filePath);
      const type = ext === '.js' ? 'application/javascript' : ext === '.html' ? 'text/html' : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  return new Promise(resolve => server.listen(PORT, () => resolve(server)));
}

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};

// Boot the app with a DURABLE storage scope and a generated program in place.
async function boot(page) {
  // The stub must be served AS the CDN script, not injected via addInitScript.
  // tandem.html:8 loads the UMD supabase-js build, which assigns window.supabase
  // AFTER every init script has run — so an init-script stub silently loses the
  // race and `sb` (tandem.html:2731) becomes a REAL client pointed at prod.
  // That is exactly how [3b]/[3c] shipped red: they passed only in a sandbox
  // with no egress (CDN load failed, stub survived) and failed on CI and on any
  // networked machine from the day they were added (2ac354c; first red run
  // 2353d07, 2026-09-30) — while ALSO firing live HTTP at prod from CI, all
  // rejected 400 on the non-uuid walkthrough id. Routing the CDN URL to the
  // stub removes the race in both directions: no network, no real client.
  // URL predicate, not a glob: `*` cannot cross `/` in Playwright globs, and the
  // real URL continues `…supabase-js@2/dist/umd/supabase.min.js` past the package name.
  await page.route(u => u.href.includes('/@supabase/supabase-js'), route =>
    route.fulfill({ contentType: 'application/javascript', body: SUPABASE_STUB }));
  await page.goto(`http://localhost:${PORT}/tandem.html`);
  await page.waitForFunction(() => typeof window.setLSScope === 'function', { timeout: 15000 });
  return page.evaluate(() => {
    setLSScope('walkthrough-uid');           // durable scope, not the anon in-memory map
    cfg = {
      goal: 'build_muscle', days: 4, weeks: 8, sex: 'M', experience: 'intermediate',
      // 'home_dumbbells', NOT 'hotel_small'. cfg.equipment takes the CFG vocabulary;
      // 'hotel_small' is a BUTTON tier name (EQ_TIER_TO_CFG maps one to the other,
      // tandem.html:3484). Seeding the button name silently fell through to full-gym,
      // so the fixture generated barbell/cable/machine work and the dumbbell-cap
      // assertions below matched an EMPTY SET and passed vacuously. Caught only by
      // mutation-testing them — the first draft of this gate proved nothing at the
      // pixel while appearing to. Do not "simplify" this back to the tier name.
      equipment: 'home_dumbbells', emphasis: 'balanced', weight: 200, targetWeight: 190,
      programSource: 'generated', startDate: null,
    };
    LS.set('tandem_cfg', cfg);
    LS.set('tandem_week', 1);
    currentWeek = 1;
    showView('tracker');
    renderTracker();
    return !!(getActiveProgram() || []).length;
  });
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => { check(`no uncaught page error (${e.message.slice(0, 90)})`, false); });

  try {
    const ok = await boot(page);
    check('[0] app boots with a generated program rendered', ok, 'fixture failed — later assertions would be vacuous');

    // ── [1] THE MERGE GATE: the BUG-192/193 seam, observed in the DOM ──
    // Drive the REAL Today's Setup controls, then simulate exactly what
    // syncFromCloud() does on boot (cfg = cfgFromUserRow(row, cfg)) and assert the
    // cap still holds in the rendered prescription.
    await page.evaluate(() => { document.getElementById('setupCard')?.classList.add('open'); });
    await page.click('.eq-btn[data-tier="hotel_small"]');
    await page.fill('#eqDbWeight', '25');
    await page.click('.eq-set-btn');
    await page.waitForTimeout(400);

    // WHY THERE IS NO DOM-LEVEL "rendered load <= cap" ASSERTION HERE
    // ------------------------------------------------------------------
    // One was written, and it was REMOVED as non-evidence rather than left green.
    // `dbCap` is consumed in exactly one place — seedWeight() (programs.js:232, via
    // :2484/:2933/:3787) — so it governs the STARTING load for an uncalibrated lift.
    // On that path the generator's natural dumbbell seeds already sit under 25 lb, so
    // "no rendered load exceeds 25" is true whether the cap works or not; mutation-
    // testing confirmed it passed with the cap fix removed.
    // Forcing the rendered number above the cap required seeding a 200 lb working 1RM,
    // which pushes the render onto the CALIBRATED branch that dbCap was never designed
    // to clamp — so the assertion then failed on correct code. Either way it measures
    // something other than the fix. [1c] below is the real detector: it reads
    // resolveMaxDb() after the exact cloud rebuild that caused SC-37, and it does
    // discriminate (mutation-tested).
    // The investigation did surface a genuine separate gap — an EARNED dumbbell 1RM is
    // not clamped by the gym's cap, so a traveller with an earned 60 lb press is
    // prescribed 60 lb at a 25 lb gym. Filed rather than fixed here: it needs an
    // exercise-science ruling on whether progression should yield to equipment
    // availability, which is not this gate's call.

    const capBefore = await page.evaluate(() => resolveMaxDb());
    check('[1a] the cap the user typed is in force after Apply', capBefore === 25, `resolveMaxDb() = ${capBefore}`);

    // Now the cloud rebuild that runs on app boot for any signed-in user.
    const afterSync = await page.evaluate(() => {
      const row = { program_goal: 'build_muscle', program_days_per_week: 4, program_weeks: 8,
        sex: 'M', fitness_level: 'intermediate', equipment: 'hotel_small', program_source: 'generated' };
      cfg = cfgFromUserRow(row, cfg);          // exactly syncFromCloud()'s assignment
      LS.set('tandem_cfg', cfg);
      sessionStorage.removeItem('eq_max_db');  // a fresh tab has no session override
      renderTracker();
      return { maxDb: cfg.maxDb, resolved: resolveMaxDb() };
    });
    check('[1c] SEAM: the cap survives the cloud rebuild + a fresh tab', afterSync.resolved === 25,
      `cfg.maxDb=${JSON.stringify(afterSync.maxDb)}, resolveMaxDb()=${afterSync.resolved} — 0 means UNCAPPED dumbbell prescriptions, the BUG-192 defect restored by BUG-193 (SC-37)`);

    // ── [2] BUG-196: the "Today" button actually moves the week ──
    await page.evaluate(() => { currentWeek = 1; LS.set('tandem_week', 1); renderTracker(); });
    await page.click('.wn-btn[onclick*="changeWeek(1)"]');
    await page.click('.wn-btn[onclick*="changeWeek(1)"]');
    await page.waitForTimeout(200);
    const browsed = await page.evaluate(() => currentWeek);
    await page.click('.wn-reset');
    await page.waitForTimeout(250);
    const afterToday = await page.evaluate(() => ({ cw: currentWeek, stored: LS.get('tandem_week') }));
    check(`[2] "Today" moves the pointer back (browsed to ${browsed})`,
      browsed === 3 && afterToday.cw === 1 && afterToday.stored === 1,
      `after Today: currentWeek=${afterToday.cw}, stored=${afterToday.stored} — expected 1/1`);

    // ── [3] BUG-195: a typed note survives a re-render ──
    const noteRT = await page.evaluate(async () => {
      const ta = document.querySelector('textarea.ex-notes');
      if (!ta) return { err: 'no .ex-notes rendered' };
      const card = ta.closest('.ex-card');
      const name = card?.querySelector('.ex-name')?.textContent?.trim();
      ta.value = 'left knee twinged at 185';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      renderTracker();
      const again = [...document.querySelectorAll('.ex-card')]
        .find(c => c.querySelector('.ex-name')?.textContent?.trim() === name)
        ?.querySelector('textarea.ex-notes');
      return { name, back: again ? again.value : null };
    });
    check('[3] a typed note is still there after a re-render',
      noteRT.back === 'left knee twinged at 185',
      `got ${JSON.stringify(noteRT.back)} for "${noteRT.name}" ${noteRT.err || ''} — the pre-fix behaviour was silent discard`);

    // ── [3b] BUG-195 CLOUD HALF, at the pixel ──
    // [3] only proves the LOCAL store survives a re-render. The cloud half is what
    // 0022 was applied for, and "a value written to Supabase is not evidence it is
    // read" (CLAUDE.md, SC-33) cuts the other way too: a reconciler that resolves
    // correctly in a node-vm is not evidence the tracker ever shows the other device's
    // note. So: hand the page a NEWER cloud row for the lift whose note [3] just typed
    // locally, run the real hydrate through the real client, re-render, and read the
    // textarea the user looks at. Then check the reverse direction pushed.
    const seeded = await page.evaluate(async () => {
      // Take the note key from the textarea's own oninput attribute, NOT from
      // .ex-name's textContent: that element also contains a "compound" badge, so its
      // textContent is "Decline Barbell Presscompound" while the store is keyed on
      // ex.name. The first draft of this assertion seeded the cloud under the polluted
      // string, hydrate wrote a row nothing rendered, and the check failed on correct
      // code. The attribute IS the key the app uses.
      window.__keyOf = (ta) => ((ta.getAttribute('oninput') || '').match(/saveExNote\('([^']*)'/) || [])[1];
      const notes = [...document.querySelectorAll('textarea.ex-notes')];
      const name = window.__keyOf(notes[0]);
      // a second lift whose LOCAL note is newer than anything in the cloud
      const other = notes.map(window.__keyOf).filter(n => n && n !== name)[0];
      saveExNote(other, 'logged on this phone just now');
      currentUser = { id: 'walkthrough-uid' };
      window.__wt = { name, other };
      return { name, other };
    });
    // Let both debounce timers drain. hydrateNotesFromCloud() deliberately SKIPS a name
    // with a pending push (the user is typing in that box right now), so hydrating inside
    // the 900 ms window would measure the guard, not the reconcile.
    await page.waitForTimeout(1200);

    const cloudRT = await page.evaluate(async () => {
      const { name, other } = window.__wt;
      window.__notesCalls = [];
      window.__notesCloud = [
        { exercise_name: name,  note: 'typed on the other phone', updated_at: '2099-01-01T00:00:00Z' },
        { exercise_name: other, note: 'stale cloud copy',          updated_at: '2020-01-01T00:00:00Z' },
      ];
      // Drive the REAL production path, not hydrateNotesFromCloud() directly. An earlier
      // draft called the hydrate and then renderTracker() ITSELF — and restoreFromCloud()
      // did not re-render at all, so the harness was supplying the step production omitted
      // and the green tick asserted a path no user has. That is exactly the "green gate on
      // a value the render layer discards" case CLAUDE.md names. Found by llm-council
      // (First Principles + Contrarian), 2026-09-30. Nothing below renders on the app's
      // behalf: if restoreFromCloud() stops re-rendering, these two checks fail.
      await restoreFromCloud();
      const valueOf = (n) => [...document.querySelectorAll('textarea.ex-notes')]
        .find(ta => window.__keyOf(ta) === n)?.value;
      return { shown: valueOf(name), mine: valueOf(other),
               pushed: window.__notesCalls.filter(c => c.op === 'upsert')
                 .map(c => ({ n: c.row.exercise_name, at: c.row.updated_at })) };
    });
    check('[3b] a note from another device is RENDERED in the textarea after a real Restore',
      cloudRT.shown === 'typed on the other phone',
      `textarea for "${seeded.name}" shows ${JSON.stringify(cloudRT.shown)} — either the cloud half reaches no pixel, or restoreFromCloud() hydrates without re-rendering`);
    check('[3c] a newer LOCAL note is not clobbered by a stale cloud row, and is pushed up',
      cloudRT.mine === 'logged on this phone just now' &&
      cloudRT.pushed.some(x => x.n === seeded.other),
      `"${seeded.other}" shows ${JSON.stringify(cloudRT.mine)}; upserts: ${JSON.stringify(cloudRT.pushed)} — one-way hydrate silently eats the newer side`);

    // ── [4] BUG-200: Enter on the role=button element does what a click does ──
    const kb = await page.evaluate(async () => {
      showView('dashboard');
      await new Promise(r => setTimeout(r, 150));
      const el = document.querySelector('.dash-competition[role="button"]');
      if (!el) return { err: 'element not found' };
      el.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise(r => setTimeout(r, 250));
      return { duelActive: !!document.querySelector('#view-duel.active, #modal-duel.open, [data-tab="duel"].active') };
    });
    check('[4] Enter on the competition card activates it (not just the handler existing)',
      kb.duelActive === true, `${kb.err || 'duel surface did not become active'} — keyboard users could not reach it`);

  } finally {
    await browser.close();
    server.close();
  }

  console.log(failures === 0
    ? '\ncontrol-reachability-walkthrough: PASS'
    : `\ncontrol-reachability-walkthrough: ${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
})();
