#!/usr/bin/env node
/**
 * display-name-smoke.mjs — a lift's DISPLAY name may move; its STORAGE IDENTITY may not.
 *
 * ORIGIN (BUG-256 deliverable 4). Kerwin ruled 2026-11-06 that the flat barbell press is the main
 * chest press and should be called "Bench Press". The functional half shipped in c5296c6. The
 * rename itself could not be done the obvious way, because in Tandem an exercise's `name` IS its
 * storage key: sets.exercise_name, personal_records, lastsets, users.onboarding_estimates and SIX
 * name-keyed localStorage maps — including D11's EARNED tandem_working1rm, a MEASUREMENT — are all
 * keyed by that exact string, and a phone's localStorage cannot be reached or migrated from here.
 *
 * llm-council ruled 4-1 for a display/identity split over an identity rename + alias seam:
 *   docs/council/council-transcript-2026-11-09-bug256-rename-identity.md
 * The deciding argument was the ASYMMETRY of the failure modes, not the amount of work. Both
 * options touch a comparable number of sites (measured: 10 `ex.name` interpolations, not the "one
 * render seam" two advisors assumed). But a missed seam under the rename SILENTLY DETACHES real
 * training history and reverts an earned 1RM to a seed default; a missed seam under the split just
 * SHOWS THE OLD NAME. Only one of those can lose a measurement.
 *
 * WHAT THIS GATE ASSERTS:
 *   [N1] At least one bank entry carries `displayName`, and it DIFFERS from `name`. Zero flags, or
 *        a flag equal to the name, means the whole mechanism is INERT and every render silently
 *        falls back — which looks exactly like it working. Fails closed.
 *   [N2] exDisplayName() behaves: flagged stored name -> display; every other bank name -> itself;
 *        an unknown name -> itself unchanged; falsy -> returned unchanged (never "undefined").
 *   [N3] THE IDENTITY GUARD, and the reason this gate exists. No display string may appear on any
 *        STORAGE path: not as a bank `name`, not as a SEED_WEIGHTS key, not in OB_ESTIMATE_LISTS
 *        (whose entries become cfg.onboardingEstimates KEYS), not in the committed seed SQL, and
 *        not as a `name:` in a static template. If the display string ever reaches one of those,
 *        the split has collapsed into the second identity it exists to prevent — and THAT is the
 *        failure that would start writing history under a name the old rows do not share.
 *   [N4] No display seam regressed to a raw read. The known user-facing interpolations must go
 *        through exDisplayName(); a new `${ex.name}` in a rendered string fails here.
 *   [N5] Fail-closed canary: the parse/lookup machinery must actually find things, so a silently
 *        empty match set cannot pass by comparing nothing to nothing (SC-38/SC-39).
 *   [N6] THE PIXEL. In a real browser, on a real generated program, the exercise card for the
 *        renamed lift must DISPLAY "Bench Press" while that same card's data-orig-name attribute —
 *        the storage key the note/swap/history paths read — still says "Flat Barbell Press".
 *        This is the assertion that distinguishes "wired" from "working": N1-N4 would all pass if
 *        the resolver were correct and the render layer threw its result away.
 *
 * HONEST LIMITS: this cannot see a phone's localStorage, and it does not need to — under the split
 * nothing on a phone is rewritten, which is the entire point. It also does not assert that
 * "Bench Press" is the RIGHT label; that is Kerwin's product ruling, not a measurable property.
 *
 * Run: node scripts/display-name-smoke.mjs
 */
import vm from 'node:vm';
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const progSrc = readFileSync(join(root, 'programs.js'), 'utf8');
const htmlSrc = readFileSync(join(root, 'tandem.html'), 'utf8');

const { EXERCISE_BANK, SEED_WEIGHTS, bankEntryByName, TEMPLATES, getProgram } = vm.runInNewContext(
  // Every name is read through `typeof` on purpose. A bare identifier here would make the
// extraction THROW a ReferenceError when the one home is renamed away, and the gate would
// die with a vm stack trace instead of reporting [N5] — red for the right reason but with
// the wrong message, which is how a future reader concludes the gate is broken rather than
// the code. Caught by mutation-testing N5 individually (SC-38).
  `(function(){ ${progSrc}; return {
     EXERCISE_BANK, SEED_WEIGHTS,
     bankEntryByName: (typeof bankEntryByName !== 'undefined' ? bankEntryByName : undefined),
     TEMPLATES: (typeof TEMPLATES !== 'undefined' ? TEMPLATES : null),
     getProgram: (typeof getProgram !== 'undefined' ? getProgram : undefined),
   }; })()`,
  { console: { log() {}, warn() {}, error() {} } },
);

// exDisplayName now lives in tandem.html (it is a RENDER-tier reader; the matrix reach detector
// correctly called it dead inside the engine). It is vm-extracted from the SHIPPED text rather
// than re-implemented here, so this gate cannot drift from the function it is asserting. Failing
// to find it is an [N5] condition, reported below rather than thrown.
let exDisplayName;
{
  const i = htmlSrc.indexOf('function exDisplayName(storedName) {');
  if (i >= 0) {
    const j = htmlSrc.indexOf('\n}', i) + 2;
    exDisplayName = vm.runInNewContext(
      `(function(){ ${htmlSrc.slice(i, j)}; return exDisplayName; })()`,
      { bankEntryByName });
  }
}

const fails = [];
const entries = Object.entries(EXERCISE_BANK);
const flagged = entries.filter(([, e]) => e && typeof e.displayName === 'string');

// ── [N5] canary first: the machinery must find real things ───────────────────────────────
if (entries.length < 100) fails.push(`[N5] only parsed ${entries.length} bank entries — the loader is broken, not the bank`);
if (typeof exDisplayName !== 'function') fails.push('[N5] exDisplayName() was not exported by programs.js — the one home is missing or renamed');

// ── [N1] the mechanism is not inert ──────────────────────────────────────────────────────
if (!flagged.length) {
  fails.push('[N1] no bank entry carries a `displayName`. The resolver would fall back for every lift, which is indistinguishable from it working. If a rename was intended, this is why it is not happening.');
}
for (const [slug, e] of flagged) {
  if (!e.displayName.trim()) fails.push(`[N1] ${slug}: displayName is blank`);
  if (e.displayName === e.name) fails.push(`[N1] ${slug}: displayName === name ('${e.name}') — inert flag, delete it or change it`);
}

// ── [N2] the resolver behaves ────────────────────────────────────────────────────────────
if (typeof exDisplayName === 'function') {
  for (const [slug, e] of flagged) {
    const got = exDisplayName(e.name);
    if (got !== e.displayName) fails.push(`[N2] exDisplayName('${e.name}') returned '${got}', expected '${e.displayName}' (${slug})`);
  }
  const flaggedNames = new Set(flagged.map(([, e]) => e.name));
  for (const [slug, e] of entries) {
    if (!e || !e.name || flaggedNames.has(e.name)) continue;
    const got = exDisplayName(e.name);
    if (got !== e.name) fails.push(`[N2] exDisplayName('${e.name}') mutated an unflagged lift into '${got}' (${slug})`);
  }
  if (exDisplayName('Totally Not A Lift 9000') !== 'Totally Not A Lift 9000')
    fails.push('[N2] an unknown stored name must come back unchanged — a history row for a retired lift still has to render');
  for (const falsy of [undefined, null, '']) {
    if (exDisplayName(falsy) !== falsy) fails.push(`[N2] exDisplayName(${JSON.stringify(falsy)}) must pass through unchanged, got ${JSON.stringify(exDisplayName(falsy))}`);
  }
}

// ── [N3] THE IDENTITY GUARD: no display string on any storage path ───────────────────────
const seedSql = readFileSync(join(root, 'migrations/epic031_exercises_seed.sql'), 'utf8');
const obLists = (htmlSrc.match(/const OB_ESTIMATE_LISTS\s*=\s*\{[\s\S]*?\n\};/) || [''])[0];
if (!obLists) fails.push('[N5] could not locate OB_ESTIMATE_LISTS in tandem.html — N3 cannot check the onboarding storage keys');

for (const [slug, e] of flagged) {
  const d = e.displayName;
  if (entries.some(([, x]) => x && x.name === d))
    fails.push(`[N3] '${d}' is ALSO a bank \`name\` — two identities for one display string`);
  for (const [sexKey, tbl] of Object.entries(SEED_WEIGHTS || {})) {
    if (tbl && typeof tbl === 'object' && Object.prototype.hasOwnProperty.call(tbl, d))
      fails.push(`[N3] SEED_WEIGHTS.${sexKey} is keyed on the DISPLAY string '${d}' — keys must be storage names (D26)`);
  }
  if (obLists.includes(`'${d}'`) || obLists.includes(`"${d}"`))
    fails.push(`[N3] OB_ESTIMATE_LISTS contains '${d}'. Those entries become cfg.onboardingEstimates KEYS, so this would store an estimate under a name no history row shares (${slug})`);
  if (seedSql.includes(`'${d}'`))
    fails.push(`[N3] the committed exercises seed contains '${d}' — public.exercises.name is a storage identity and must stay '${e.name}'`);
  if (new RegExp(`name\\s*:\\s*['"]${d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`).test(progSrc))
    fails.push(`[N3] a \`name:'${d}'\` literal exists in programs.js — a static template or table is now keyed on the display string`);
}

// ── [N4] no display seam regressed to a raw read ─────────────────────────────────────────
const RAW_DISPLAY_SEAMS = [
  { rx: /<div class="cardio-title">\$\{ex\.name\}/, what: 'cardio block title' },
  { rx: /<span id="en-\$\{ex\.id\}">\$\{ex\.name\}</, what: 'exercise card name' },
  { rx: /Watch Tutorial — \$\{(?:ex|entry)\.name\}/, what: 'tutorial button label' },
  { rx: /<h3>\$\{logEsc\(c\.name\)\}<\/h3>/, what: 'lift log card heading' },
  { rx: /\$\{who\} · \$\{pr\.exercise_name\}/, what: 'partner PR row' },
  { rx: /titleEl\.textContent = name;/, what: 'lift log detail title' },
];
for (const { rx, what } of RAW_DISPLAY_SEAMS) {
  if (rx.test(htmlSrc)) fails.push(`[N4] ${what} reads a stored name RAW — wrap it in exDisplayName()`);
}
// Counted as real CALL SITES only: the declaration and prose mentions in comments are excluded,
// or the floor would be satisfied by documentation. Floor equals the measured count at the time
// this gate was written, on the same rule as scripts/fixtures/verify-check-floor.json — raise it
// in the commit that adds a seam, and never lower it to make a run go green. A seam deleted in
// silence is how the old name quietly comes back on one surface.
const SEAM_FLOOR = 18;
const wrapped = htmlSrc.split('\n')
  .filter(l => !/^\s*(\/\/|\*)/.test(l))
  .reduce((n, l) => n + (l.match(/exDisplayName\(/g) || []).length - (l.match(/function exDisplayName\(/g) || []).length, 0);
if (wrapped < SEAM_FLOOR) fails.push(`[N4] only ${wrapped} exDisplayName() call sites in tandem.html, floor is ${SEAM_FLOOR} — a render seam was dropped and that surface is showing the stored name again`);

// ── [N7] no identity may be recovered from RENDERED TEXT ─────────────────────────────────
// This is the assertion for the bug this change actually introduced, caught by
// scripts/control-reachability-walkthrough.mjs rather than by review. Before the split, several
// paths recovered "which lift is this card showing" by reading the card heading's text node,
// because the heading happened to hold the storage name. TWO of them were WRITE paths — the
// Supabase sets.exercise_name / personal_records insert, and the local tandem_prs + lastsets key.
// Once display and identity differ, those write the DISPLAY string, which detaches new history
// from every row the user already has: precisely the second identity this design exists to avoid.
// The register is data-cur-name, read through cardStorageName(). Reading the heading is banned.
const TEXT_IDENTITY = [
  /querySelector\(['"]\.ex-name['"]\)[^\n]*textContent/,
  /getElementById\('en-' \+ id\)[^\n]*textContent(?!\s*=)/,
  /nameEl\.textContent(?!\s*=)/,
];
for (const rx of TEXT_IDENTITY) {
  const hit = htmlSrc.split('\n').find(l => !/^\s*(\/\/|\*)/.test(l) && rx.test(l));
  if (hit) fails.push(`[N7] an exercise identity is being read back out of RENDERED TEXT: ${hit.trim().slice(0, 120)} — use cardStorageName(id). The heading is a display string now, so this reads the wrong lift.`);
}
if (!/function cardStorageName\(/.test(htmlSrc)) fails.push('[N7] cardStorageName() is gone — the storage register has no reader, so the write paths have nowhere correct to look');
if (!/data-cur-name="/.test(htmlSrc)) fails.push('[N7] no card carries data-cur-name — cardStorageName() would fall back to the slot id for every lift, and sets would be stored under an id instead of a name');

// If the one home is missing, N6 cannot mean anything: the page itself will throw on every
// render seam. Report the real cause and stop, rather than drowning it in page errors.
if (typeof exDisplayName !== 'function') {
  console.error('display-name-smoke FAIL');
  for (const f of fails) console.error('  ' + f);
  process.exit(1);
}

// ── [N6] THE PIXEL ───────────────────────────────────────────────────────────────────────
const PORT = 23000 + Math.floor(Math.random() * 500);
async function pixelCheck() {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { return { skipped: 'playwright not installed' }; }

  const server = await new Promise(res => {
    const s = http.createServer(async (req, rsp) => {
      try {
        const rel = req.url === '/' ? '/tandem.html' : req.url.split('?')[0];
        const fp = join(root, rel);
        if (!fp.startsWith(root)) { rsp.writeHead(403); rsp.end(); return; }
        const body = await readFile(fp);
        const ext = extname(fp);
        rsp.writeHead(200, { 'Content-Type': ext === '.js' ? 'application/javascript' : ext === '.html' ? 'text/html' : 'application/octet-stream' });
        rsp.end(body);
      } catch { rsp.writeHead(404); rsp.end('nf'); }
    });
    s.listen(PORT, () => res(s));
  });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    page.on('console', m => { if (m.type() === 'error') process.stderr.write(`  [page error] ${m.text()}\n`); });
    await page.addInitScript(() => {
      window.supabase = { createClient: () => new Proxy(function () {}, {
        get: (t, p) => (p === 'then' ? undefined : window.supabase.createClient()),
        apply: () => Promise.resolve({ data: { session: null, subscription: { unsubscribe() {} } }, error: null }),
      }) };
    });
    await page.goto(`http://localhost:${PORT}/tandem.html`);
    await page.waitForTimeout(300);
    await page.evaluate(() => skipAuth());
    await page.waitForTimeout(200);
    // Written through LS.set, NOT raw localStorage.setItem: LS_SCOPED_KEYS gives several of
    // these a per-account key, so a raw write lands somewhere LS.get() never looks and cfg
    // stays {} — which fails inside renderTracker on cfg.goal.replace, not here, and reads
    // like a bug in the page rather than in the fixture.
    // Kerwin's own saved settings — the exact combo BUG-256 was filed against.
    await page.evaluate(() => {
      LS.set('tandem_cfg', { goal: 'transform', days: 5, weeks: 12, weight: 225, targetWeight: 195, heightIn: 72, age: 35, sex: 'M', experience: 'advanced' });
      LS.set('tandem_week', 1);
      LS.set('tandem_current_day', 0);
    });
    await page.waitForTimeout(150);

    return await page.evaluate(() => {
      cfg = LS.get('tandem_cfg');
      currentWeek = 1;
      showView('tracker');
      renderTracker();
      const cards = [...document.querySelectorAll('.ex-card')];
      const target = cards.find(c => (c.getAttribute('data-orig-name') || '') === 'Flat Barbell Press');
      return {
        cardCount: cards.length,
        found: !!target,
        storageKey: target ? target.getAttribute('data-orig-name') : null,
        rendered: target ? (target.querySelector('.ex-name span')?.textContent || '').trim() : null,
        allNames: cards.map(c => (c.querySelector('.ex-name span')?.textContent || '').trim()),
      };
    });
  } finally {
    await browser.close();
    server.close();
  }
}

const pixel = await pixelCheck();
if (pixel.skipped) {
  console.log(`[N6] SKIPPED — ${pixel.skipped}`);
} else if (!pixel.cardCount) {
  fails.push(`[N6] no .ex-card rendered at all, so the pixel assertion proved nothing. Rendered names: ${JSON.stringify(pixel.allNames)}`);
} else if (!pixel.found) {
  fails.push(`[N6] no card carried data-orig-name="Flat Barbell Press" (${pixel.cardCount} cards rendered: ${JSON.stringify(pixel.allNames)}). Either the storage key moved — which this whole gate exists to forbid — or the day no longer programs that lift.`);
} else {
  const want = (EXERCISE_BANK['flat-barbell-press'] || {}).displayName;
  if (pixel.rendered !== want)
    fails.push(`[N6] the card RENDERS '${pixel.rendered}' but should render '${want}'. The resolver is correct and the render layer is discarding it — "wired is not working".`);
  if (pixel.storageKey !== 'Flat Barbell Press')
    fails.push(`[N6] data-orig-name is '${pixel.storageKey}', not 'Flat Barbell Press' — the STORAGE IDENTITY moved. Every stored artefact and both users' localStorage are keyed on the old string.`);
  if (!fails.length)
    console.log(`[N6] card renders "${pixel.rendered}" while its storage key is still "${pixel.storageKey}" (${pixel.cardCount} cards on the day)`);
}

if (fails.length) {
  console.error('display-name-smoke FAIL');
  for (const f of fails) console.error('  ' + f);
  process.exit(1);
}
console.log(`PASS — ${flagged.length} display rename(s) [${flagged.map(([, e]) => `${e.name} -> ${e.displayName}`).join('; ')}]; identity unmoved on every storage path; ${wrapped} render seams resolve`);
