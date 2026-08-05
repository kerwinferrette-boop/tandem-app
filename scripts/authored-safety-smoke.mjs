// ═══════════════════════════════════════════════════════
// Authored-path SAFETY smoke (BUG-59)
//
// WHY THIS EXISTS
// EPIC-031 gave Tandem two program paths that converge on one tracker:
//   generated  → getProgram(...)          — receives tier + injuries, ends in pruneInjuries()
//   authored   → materializeTemplate(...) — an adopted library template
// /DOCTRINE.md names the injury filter and the equipment tier as SAFETY
// invariants binding EVERY path. persona-matrix.mjs sweeps 630 combos but
// exercises ONLY getProgram(), so R8/R9 reported 0 while the authored path
// ran completely unfiltered. The defect shipped green because the gate
// structurally could not see it.
//
// This harness closes that hole: it sweeps the SAME R8/R9 assertions across
// the authored path, using the real seed bundles, entirely offline.
//
// Axes: template × week × equipment tier × injury profile.
// (No goal/days/sex — an authored template fixes those itself, which is why
// this is a sibling script rather than an extension of persona-matrix.)
//
// Run: node scripts/authored-safety-smoke.mjs
// Exit 0 = all rules pass. Exit 1 = one or more failures.
// ═══════════════════════════════════════════════════════

import vm from 'vm';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const code = readFileSync(resolve(__dirname, '../programs.js'), 'utf8');
const { materializeTemplate, EXERCISE_BANK, makeInjuryBlocked } = vm.runInNewContext(
  `(function() { ${code}; return { materializeTemplate, EXERCISE_BANK, makeInjuryBlocked }; })()`,
  { console }
);

if (typeof materializeTemplate !== 'function') {
  console.error('FATAL: materializeTemplate not exported from programs.js — authored path cannot be checked.');
  process.exit(1);
}

// ── Matrix ───────────────────────────────────────────────
// Tiers and injury profiles are deliberately IDENTICAL to persona-matrix.mjs,
// so the two paths are held to the same standard. If that list changes there,
// change it here too.
const TIERS = ['full_gym', 'hotel_gym', 'home'];
const INJURY_PROFILES = [
  { label: 'none',      value: '' },
  { label: 'knee',      value: 'knee pain' },
  { label: 'lowerback', value: 'lower back injury' },
  { label: 'shoulder',  value: 'shoulder impingement' },
  { label: 'elbow',     value: 'tennis elbow' },
  { label: 'wrist',     value: 'wrist pain' },
  { label: 'hip',       value: 'hip pain' },
];
const TIER_ORDER = ['home', 'hotel_gym', 'full_gym'];

const SEEDS = ['brick-by-brick', 'redline-recomp'];

// Name → tier, from the bank itself. materializeTemplate emits `name` (resolved
// through EXERCISE_BANK[slug]) but not `tier`, so this is the only way to check
// output against the bank's own tier requirement — same approach persona-matrix
// uses for the generated path.
const TIER_BY_NAME = {};
for (const entry of Object.values(EXERCISE_BANK)) {
  if (entry && entry.name) TIER_BY_NAME[entry.name.trim().toLowerCase()] = entry.tier;
}

function allExercises(day) {
  const out = [];
  for (const b of (day.blocks || [])) for (const ex of (b.exs || [])) out.push(ex);
  return out;
}

// ── Rules ────────────────────────────────────────────────

// R8 — no exercise the injury profile contraindicates
function checkR8(days, injuries) {
  if (!injuries) return [];
  const blocked = makeInjuryBlocked(injuries);
  const fails = [];
  days.forEach((day, i) => {
    for (const ex of allExercises(day)) {
      if (blocked(ex.name)) fails.push({ day: i + 1, exercise: ex.name });
    }
  });
  return fails;
}

// R9 — no exercise requiring more equipment than the user has
function checkR9(days, tier) {
  const reqIdx = TIER_ORDER.indexOf(tier);
  const fails = [];
  days.forEach((day, i) => {
    for (const ex of allExercises(day)) {
      const exTier = TIER_BY_NAME[String(ex.name || '').trim().toLowerCase()];
      if (!exTier) continue; // slug not in bank — slug-integrity is D16's job, not this rule's
      if (TIER_ORDER.indexOf(exTier) > reqIdx) {
        fails.push({ day: i + 1, exercise: ex.name, exerciseTier: exTier, requestedTier: tier });
      }
    }
  });
  return fails;
}

// R10 — the safety pass must not empty a training day. Filtering that leaves a
// user with nothing to do has traded one failure for another.
function checkR10(days) {
  const fails = [];
  days.forEach((day, i) => {
    if (allExercises(day).length === 0) fails.push({ day: i + 1, label: day.label });
  });
  return fails;
}

// R11 — D15: a lift marked constant_across_program anchors the progression for
// the whole program. Filtering may SUBSTITUTE it, but the slot must stay filled;
// dropping it silently breaks the spine the program is built on.
function checkR11(days, expectedConstants) {
  const present = new Set();
  for (const day of days) {
    for (const ex of allExercises(day)) if (ex.constant) present.add(day.key);
  }
  const fails = [];
  for (const key of expectedConstants) {
    if (!present.has(key)) fails.push({ day: key });
  }
  return fails;
}

// ── R12: the call site must actually pass the config ─────
// Everything below this line tests materializeTemplate in isolation, which
// means it would happily pass while the REAL caller in tandem.html forgets to
// thread tier/injuries — which is exactly how BUG-59 existed in the first
// place. A function that CAN filter is worthless if the one call site doesn't
// ask it to. So assert the wiring at the source level too.
function checkCallSites() {
  const html = readFileSync(resolve(__dirname, '../tandem.html'), 'utf8');
  const fails = [];
  const re = /materializeTemplate\s*\(/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    // Grab a window past the opening paren and check the argument list mentions
    // both safety inputs before the call closes.
    const window = html.slice(m.index, m.index + 400);
    const line = html.slice(0, m.index).split('\n').length;
    if (/typeof\s+materializeTemplate/.test(html.slice(Math.max(0, m.index - 30), m.index + 25))) continue; // typeof guard, not a call
    const hasTier = /tier\s*:/.test(window);
    const hasInj  = /injuries\s*:/.test(window);
    if (!hasTier || !hasInj) {
      fails.push({ line, missing: [!hasTier && 'tier', !hasInj && 'injuries'].filter(Boolean).join(' + ') });
    }
  }
  return fails;
}

const callSiteFails = checkCallSites();

// ── Sweep ────────────────────────────────────────────────
const rows = [];
let skipped = 0;

for (const slug of SEEDS) {
  const path = resolve(__dirname, `../seeds/${slug}.json`);
  if (!existsSync(path)) { console.error(`FATAL: missing seed ${path}`); process.exit(1); }
  const bundle = JSON.parse(readFileSync(path, 'utf8'));
  const weeks = Number(bundle.template?.duration_weeks) || 12;

  // Which day-keys carry a constant_across_program lift, per week, measured on
  // the UNFILTERED output so the expectation reflects authored intent.
  for (let week = 1; week <= weeks; week++) {
    const baseline = materializeTemplate(bundle, week, { tier: 'full_gym', injuries: '' });
    if (!Array.isArray(baseline) || !baseline.length) {
      console.error(`FATAL: ${slug} week ${week} materialized to nothing at full_gym/no-injury.`);
      process.exit(1);
    }
    const expectedConstants = baseline
      .filter(d => allExercises(d).some(ex => ex.constant))
      .map(d => d.key);

    for (const tier of TIERS) {
      for (const inj of INJURY_PROFILES) {
        const combo = `${slug}/wk${week}/${tier}/${inj.label}`;
        let days;
        try {
          days = materializeTemplate(bundle, week, { tier, injuries: inj.value });
        } catch (e) {
          rows.push({ combo, error: String(e && e.message || e), r8: [], r9: [], r10: [], r11: [] });
          continue;
        }
        if (!Array.isArray(days)) { skipped++; continue; }
        rows.push({
          combo, slug, week, tier, injury: inj.label, error: null,
          r8: checkR8(days, inj.value),
          r9: checkR9(days, tier),
          r10: checkR10(days),
          r11: checkR11(days, expectedConstants),
        });
      }
    }
  }
}

// ── Report ───────────────────────────────────────────────
const errors  = rows.filter(r => r.error);
const r8Fails = rows.filter(r => r.r8.length);
const r9Fails = rows.filter(r => r.r9.length);
const r10Fails = rows.filter(r => r.r10.length);
const r11Fails = rows.filter(r => r.r11.length);

console.log(`\nAuthored-path safety: ${rows.length} combos `
  + `(${SEEDS.length} templates × 12 weeks × ${TIERS.length} tiers × ${INJURY_PROFILES.length} injury profiles)\n`);
console.log(`Errors (materialize threw / bad output):  ${errors.length}`);
console.log(`R8  (injury-contraindicated leak):        ${r8Fails.length} combos`);
console.log(`R9  (equipment-tier violation):           ${r9Fails.length} combos`);
console.log(`R10 (safety pass emptied a day):          ${r10Fails.length} combos`);
console.log(`R11 (constant_across_program slot lost):  ${r11Fails.length} combos`);
console.log(`R12 (call site not passing tier/injuries): ${callSiteFails.length} site(s)`);
if (skipped) console.log(`(skipped ${skipped} non-array results)`);

if (callSiteFails.length) {
  console.log('\nR12 failures (tandem.html call sites missing safety config):');
  callSiteFails.forEach(f => console.log(`  tandem.html:${f.line} — materializeTemplate() call omits ${f.missing}`));
}

function sample(list, name, fmt) {
  if (!list.length) return;
  console.log(`\n${name} — first 10:`);
  list.slice(0, 10).forEach(row => {
    const key = name.startsWith('R8') ? 'r8' : name.startsWith('R9') ? 'r9' : name.startsWith('R10') ? 'r10' : 'r11';
    row[key].slice(0, 3).forEach(f => console.log(`  ${row.combo} — ${fmt(f)}`));
  });
}
sample(r8Fails,  'R8 failures (injury leaks)',      f => `Day ${f.day}: "${f.exercise}" is contraindicated`);
sample(r9Fails,  'R9 failures (tier violations)',   f => `Day ${f.day}: "${f.exercise}" needs "${f.exerciseTier}" > "${f.requestedTier}"`);
sample(r10Fails, 'R10 failures (emptied days)',     f => `Day ${f.day} (${f.label}) has zero exercises`);
sample(r11Fails, 'R11 failures (lost constants)',   f => `${f.day} lost its constant_across_program anchor`);
errors.slice(0, 5).forEach(r => console.log(`  ERROR ${r.combo}: ${r.error}`));

const failed = errors.length + r8Fails.length + r9Fails.length + r10Fails.length + r11Fails.length + callSiteFails.length;
if (failed) {
  console.log(`\nAUTHORED-PATH SAFETY: FAILED — ${failed} combo(s). `
    + `SAFETY invariants must hold on the authored path exactly as they do on the generated one.\n`);
  process.exit(1);
}
console.log('\nAuthored-path safety: ALL PASS — SAFETY invariants hold on adopted templates.\n');
