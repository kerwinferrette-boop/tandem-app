#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// selection-reachability-smoke.mjs — BUG-108: does getProgram() ever actually SELECT
// each EXERCISE_BANK entry?
//
// scripts/reachability-smoke.mjs answers a different, weaker question: "does some slot
// REQUEST one of this entry's muscle tags?" (TAG reachability). An entry can pass that and
// still never appear in any generated program because the ranked candidate pool always puts
// a peer ahead of it. That is dead inventory the tag gate cannot see (BUG-108's residue).
// This gate runs the real generator across the persona matrix and asks the question the user
// would: which bank entries has no program ever contained?
//
// THE SWEEP (scripts/lib/persona-combos.mjs is the one home for the matrix):
//   goal x days x sex x equipment tier x injury profile  (1050 combos)
//   x program length T=24 x wall-clock week 1..24, rotation {week, phase}
// Selection reads the WALL-CLOCK week, never rotation.phase (programs.js BUG-108b; phase is
// passed anyway, scaled to T, so a future reader of it cannot silently escape the sweep).
// T=24 is the length at which the deepest rotation is visible: measured 2026-10-13, T=12
// weeks 1-12 selects 127 bank entries, T=12 weeks 1-24 selects 131, T=24 weeks 1-24 selects
// 151 and adding T=12 on top of T=24 adds none, so T=24 alone is the superset.
//
// AXES NOT SWEPT BY THE ASSERTION (stated, not implied away): `experience`, `emphasis`,
// `durationMinutes`, `maxDb`, `liftHistory`, `weight`. The app passes none of the first two
// to getProgram() today (experience is captured at onboarding and consumed by no call site —
// EPIC-10, unstarted), so sweeping them would assert reachability of inputs no user can
// supply. They ARE swept, for injury-free combos, to CLASSIFY: a never-selected entry that
// does appear under experience='beginner' is categorised as such, which is data, not a pass.
//
// THE RATCHET (mirrors OPEN_GAPS in reachability-smoke.mjs):
//   S1  the never-selected set may not GROW: a slug absent from every program and absent from
//       scripts/fixtures/selection-reachability-baseline.json fails (new dead inventory).
//   S2  a baseline slug that IS now selected (or left the bank) fails: ratchet it down by
//       regenerating the baseline — the improvement is locked in, not left to rot.
//   S3  every baseline entry carries a reason category from the closed set below + a reason.
//   S4  the committed category still equals the re-derived one (a drifting category is a
//       changed fact about the engine and must be re-recorded deliberately).
//   S5  anti-vacuity: the sweep generated >= the committed floor of programs, covered all 5
//       goals / 3 tiers / 5 day-counts, and selected a plausible share of the bank — so a
//       sweep that silently produced nothing cannot read as "everything is reachable".
// CATEGORIES are DERIVED from the data, never authored (CLAUDE.md: do not invent):
//   experience-gated    appears only when experience='beginner'/'advanced' is supplied
//   tier-ladder-outranked  >=1 selected peer shares a primary muscle token and is available at
//                       every equipment tier this entry is (tier rank <=): peers win every slot
//   unclassified - BUG-108 residual   neither of the above explains it (no peer found)
// A category is a description of WHY the data says it is unselected, not a verdict that it
// should stay unselected — whether any of these should be reachable is Kerwin's call.
//
// Regenerate ONLY with `node scripts/selection-reachability-smoke.mjs --write-baseline`
// (and only when the set SHRANK, or growth has a written justification). Never hand-edit.
//
// MUTATION RECORD (each assertion individually, on a COPY of the tree, every mutation proven
// to have LANDED by a diff before its result was believed — SC-38/SC-40/SC-45) is in the
// BUG-108 commit body.
// ═══════════════════════════════════════════════════════
import vm from 'vm';
import { readFileSync, writeFileSync } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { combos, GOALS, DAY_COUNTS, TIERS, TIER_ORDER } from './lib/persona-combos.mjs';

const here = fileURLToPath(import.meta.url);
const root = join(dirname(here), '..');
const BASELINE = join(root, 'scripts', 'fixtures', 'selection-reachability-baseline.json');
const WRITE = process.argv.includes('--write-baseline');
const WORKER = (process.argv.find(a => a.startsWith('--worker=')) || '').slice('--worker='.length);
const T = 24;                         // program length of the sweep (see header)
const COMBO_FLOOR = 1050;             // S5 — the committed matrix size; shrinking it needs a reason
const CATEGORIES = ['experience-gated', 'tier-ladder-outranked', 'unclassified - BUG-108 residual'];

const code = readFileSync(join(root, 'programs.js'), 'utf8');
const ctx = vm.runInNewContext(
  `(function() { ${code}; return { getProgram, EXERCISE_BANK, makeInjuryBlocked }; })()`, { console });
const { getProgram, EXERCISE_BANK: BANK, makeInjuryBlocked } = ctx;
const slugOfName = {};
for (const [s, e] of Object.entries(BANK)) slugOfName[e.name] = s;

// ── worker: sweep ONE goal, print JSON ─────────────────────────────────────────────────
function sweepGoal(goal) {
  const out = { main: new Set(), beginner: new Set(), advanced: new Set(), unknownNames: new Set(),
                programs: 0, goals: new Set(), tiers: new Set(), days: new Set() };
  const take = (prog, into) => {
    for (const d of prog || []) for (const b of d.blocks || []) for (const e of b.exs || []) {
      const s = slugOfName[e.name];
      if (s) into.add(s); else out.unknownNames.add(e.name);
    }
  };
  for (const c of combos()) {
    if (c.goal !== goal) continue;
    for (let w = 1; w <= T; w++) {
      const a = [...c.args];
      a[2] = T;
      a[8] = { week: w, phase: Math.min(3, Math.floor((w - 1) / (T / 4))) };
      take(getProgram(...a), out.main);
      out.programs++; out.goals.add(c.goal); out.tiers.add(c.tier); out.days.add(c.days);
      if (c.injury.label === 'none') {          // classification-only axes
        for (const exp of ['beginner', 'advanced']) {
          const b = [...a]; b[9] = exp;
          take(getProgram(...b), out[exp]);
        }
      }
    }
  }
  return out;
}

if (WORKER) {
  const r = sweepGoal(WORKER);
  console.log(JSON.stringify({ ...r, main: [...r.main], beginner: [...r.beginner], advanced: [...r.advanced],
    unknownNames: [...r.unknownNames], goals: [...r.goals], tiers: [...r.tiers], days: [...r.days] }));
  process.exit(0);
}

// ── parent: fan the 5 goals out over child processes (a serial sweep is ~40s) ───────────
const run = promisify(execFile);
const parts = await Promise.all(GOALS.map(async g => {
  const { stdout } = await run(process.execPath, [here, `--worker=${g}`], { maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(stdout);
}));
const union = k => new Set(parts.flatMap(p => p[k]));
const selected = union('main'), selBeginner = union('beginner'), selAdvanced = union('advanced');
const unknownNames = [...union('unknownNames')].sort();
const programs = parts.reduce((a, p) => a + p.programs, 0);
const goalsSeen = union('goals'), tiersSeen = union('tiers'), daysSeen = union('days');

// ── derive the never-selected set + its categories ─────────────────────────────────────
const slugs = Object.keys(BANK);
const never = slugs.filter(s => !selected.has(s)).sort();
const tierRank = s => TIER_ORDER.indexOf(BANK[s].tier);
const primaryTokens = s => new Set((BANK[s].muscleGroups?.primary || []));
const profiles = ['knee pain', 'lower back injury', 'shoulder impingement', 'tennis elbow', 'wrist pain', 'hip pain'];

function derive(s) {
  const e = BANK[s];
  const facts = [`tier ${e.tier}`, `primary ${[...primaryTokens(s)].join('/')}`];
  const banned = profiles.filter(p => makeInjuryBlocked(p)(e.name));
  if (banned.length) facts.push(`banned under: ${banned.join(', ')}`);
  const gate = [selBeginner.has(s) && 'beginner', selAdvanced.has(s) && 'advanced'].filter(Boolean);
  if (gate.length) {
    return { category: 'experience-gated',
      reason: `selected only when experience=${gate.join('/')} is supplied (no app call site passes experience — EPIC-10); ${facts.join('; ')}` };
  }
  const mine = primaryTokens(s);
  const peers = slugs.filter(p => p !== s && selected.has(p) && tierRank(p) <= tierRank(s)
    && [...primaryTokens(p)].some(t => mine.has(t))).sort();
  if (peers.length) {
    return { category: 'tier-ladder-outranked',
      reason: `${peers.length} selected peer(s) share a primary token and are available at every tier this entry is (e.g. ${peers.slice(0, 3).join(', ')}); ${facts.join('; ')}` };
  }
  return { category: 'unclassified - BUG-108 residual', reason: `no selected peer shares a primary token at equal-or-lower tier; ${facts.join('; ')}` };
}
const derived = Object.fromEntries(never.map(s => [s, derive(s)]));

if (WRITE) {
  writeFileSync(BASELINE, JSON.stringify({
    _comment: 'BUG-108 selection-reachability baseline: EXERCISE_BANK slugs that NO getProgram() output contains across the sweep in scripts/selection-reachability-smoke.mjs. Category + reason are DERIVED from the data (never authored). The gate fails if this set grows (S1) and if an entry here is now selected (S2) — it ratchets down only. Regenerate ONLY with `node scripts/selection-reachability-smoke.mjs --write-baseline`; never hand-edit.',
    sweep: `${COMBO_FLOOR} persona combos x T=${T} x weeks 1-${T}`,
    bank: slugs.length,
    count: never.length,
    entries: derived,
  }, null, 2) + '\n');
  console.log(`--write-baseline: pinned ${never.length} never-selected slug(s) of ${slugs.length} to ${BASELINE}`);
  process.exit(0);
}

const fail = [];
const must = (cond, msg) => { if (!cond) fail.push(msg); };
let base = null;
try { base = JSON.parse(readFileSync(BASELINE, 'utf8')); } catch (err) {
  fail.push(`could not read ${BASELINE} (${err.message}) — regenerate with --write-baseline; do NOT delete this gate`);
}
if (base) {
  const ent = base.entries || {};
  const grown = never.filter(s => !(s in ent));
  must(grown.length === 0,
    `S1: ${grown.length} bank entr(ies) are never selected by getProgram() and are NOT in the baseline — new dead inventory (the tag gate cannot see this):\n`
    + grown.map(s => `      ${s}  [${derived[s].category}] ${derived[s].reason}`).join('\n'));
  const stale = Object.keys(ent).filter(s => !(s in BANK) || selected.has(s));
  must(stale.length === 0,
    `S2: ${stale.length} baseline entr(ies) are now SELECTED (or left the bank) — the gap closed; ratchet it down with --write-baseline:\n`
    + stale.map(s => `      ${s}`).join('\n'));
  const bad = Object.entries(ent).filter(([, v]) => !v || !CATEGORIES.includes(v.category) || !String(v.reason || '').trim());
  must(bad.length === 0, `S3: ${bad.length} baseline entr(ies) have a category outside ${JSON.stringify(CATEGORIES)} or an empty reason: ${bad.map(([k]) => k).join(', ')}`);
  const drift = Object.keys(ent).filter(s => s in derived && ent[s]?.category !== derived[s].category);
  must(drift.length === 0,
    `S4: ${drift.length} baseline entr(ies) now derive a DIFFERENT category than committed — a changed fact about the engine; re-record with --write-baseline:\n`
    + drift.map(s => `      ${s}: committed ${ent[s].category} -> now ${derived[s].category}`).join('\n'));
}
must(programs >= COMBO_FLOOR * T && goalsSeen.size === 5 && tiersSeen.size === TIERS.length && daysSeen.size === DAY_COUNTS.length,
  `S5: the sweep is vacuous or shrank — ${programs} programs (floor ${COMBO_FLOOR * T}), ${goalsSeen.size}/5 goals, ${tiersSeen.size}/${TIERS.length} tiers, ${daysSeen.size}/${DAY_COUNTS.length} day-counts`);
must(selected.size >= slugs.length / 2,
  `S5: only ${selected.size} of ${slugs.length} bank entries were selected at all — the sweep is not exercising the generator`);

// ── report ─────────────────────────────────────────────────────────────────────────────
console.log(`Selection reachability (BUG-108): ${slugs.length} bank entries, ${programs} programs swept (${COMBO_FLOOR} combos x T=${T} x weeks 1-${T})`);
console.log(`  selected: ${selected.size}/${slugs.length}   never selected: ${never.length}   (baseline: ${base ? base.count : '?'})`);
const byCat = {};
for (const s of never) (byCat[derived[s].category] ||= []).push(s);
for (const [c, l] of Object.entries(byCat)) console.log(`    ${l.length}  ${c}: ${l.join(', ')}`);
if (unknownNames.length) console.log(`  program names NOT in EXERCISE_BANK (static-program literals, not asserted): ${unknownNames.join(', ')}`);

if (fail.length) {
  console.error('\nSELECTION REACHABILITY: FAIL');
  for (const f of fail) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log('Selection reachability: PASS — the never-selected set did not grow, and no baseline entry is stale.');
