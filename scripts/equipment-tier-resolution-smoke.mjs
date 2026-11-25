#!/usr/bin/env node
/**
 * equipment-tier-resolution-smoke.mjs — BUG-187 guard: resolveEquipmentTier() keeps its contract.
 *
 * WHY THIS EXISTS: resolveEquipmentTier() decides which equipment tier every generated workout
 * is built for. BUG-118 made it distrust a sessionStorage override (eq_tier) once the durable
 * choice (cfg.equipment) has moved since the override was set, by comparing eq_tier_baseline to
 * cfg.equipment. equipment-label-mirror-smoke.mjs checks that the setup card AGREES with this
 * resolver; nothing checked that the resolver itself returns the right tier. A regression here
 * would move the label and the workout together, so the mirror guard would stay green.
 *
 * Reads the WORKING-TREE tandem.html (never a git revision), extracts the tier tables and
 * resolveEquipmentTier(), and runs it in node:vm against a fake sessionStorage. The contract,
 * as written in the resolver's own comment block:
 *   C1  a session override is honoured only when eq_tier_baseline is present AND equals
 *       cfg.equipment ('' when unset); then the result is EQ_TIER_TO_BANK[eq_tier]
 *   C2  otherwise a known cfg.equipment wins: CFG_EQ_TO_BANK[cfg.equipment]
 *   C3  otherwise 'full_gym'
 *   C4  the result is always one of the three bank tiers
 *   C5  the two write paths agree: EQ_TIER_TO_BANK[t] === CFG_EQ_TO_BANK[EQ_TIER_TO_CFG[t]]
 * Swept over cfg.equipment {unset, '', each known value, unknown} x eq_tier {unset, each selector
 * tier, unknown} x baseline {fresh, stale, absent, ''}, plus named transition cases (a hotel
 * override followed by a durable change to bodyweight must resolve to home, not hotel_gym).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
// TANDEM_HTML / PROGRAMS_JS override the files under test so a mutation runs on a COPY, never on
// the working tree (SC-40). Default is the working tree, on purpose — never a git revision.
const html = readFileSync(process.env.TANDEM_HTML || join(root, 'tandem.html'), 'utf8');
const fails = [];

function grabConst(name) {
  const m = html.match(new RegExp(`const ${name} = [\\[{][\\s\\S]*?[\\]}];`));
  if (!m) fails.push(`could not extract const ${name}`);
  return m ? m[0] : '';
}
function grabFn(name) {
  const i = html.indexOf(`function ${name}(`);
  if (i < 0) { fails.push(`could not extract function ${name}`); return ''; }
  let depth = 0, j = html.indexOf('{', i);
  for (; j < html.length; j++) { if (html[j] === '{') depth++; else if (html[j] === '}' && --depth === 0) break; }
  // keep an `async ` prefix: dropping it turns an async function's body into a SyntaxError
  const isAsync = html.slice(Math.max(0, i - 6), i) === 'async ';
  return (isAsync ? 'async ' : '') + html.slice(i, j + 1);
}

const src = [
  grabConst('EQ_TIER_TO_BANK'), grabConst('CFG_EQ_TO_BANK'), grabConst('EQ_TIER_TO_CFG'),
  grabFn('resolveEquipmentTier'),
  'globalThis.__t = { EQ_TIER_TO_BANK, CFG_EQ_TO_BANK, EQ_TIER_TO_CFG, resolveEquipmentTier };',
].join('\n');

if (fails.length) { for (const f of fails) console.error(`✗ ${f}`); process.exit(1); }

const store = new Map();
const ctx = {
  cfg: {},
  sessionStorage: { getItem: k => (store.has(k) ? store.get(k) : null) },
};
vm.createContext(ctx);
vm.runInContext(src, ctx);
const { EQ_TIER_TO_BANK, CFG_EQ_TO_BANK, EQ_TIER_TO_CFG, resolveEquipmentTier } = ctx.__t;
const BANK = new Set(['full_gym', 'hotel_gym', 'home']);

function run(cfgEq, sess, baseline) {
  store.clear();
  ctx.cfg = cfgEq === undefined ? {} : { equipment: cfgEq };
  if (sess !== null) store.set('eq_tier', sess);
  if (baseline !== null) store.set('eq_tier_baseline', baseline);
  return resolveEquipmentTier();
}
// The contract, written from the comment block, not from the function body.
function expected(cfgEq, sess, baseline) {
  const durable = cfgEq || '';
  if (sess && Object.hasOwn(EQ_TIER_TO_BANK, sess) && baseline !== null && baseline === durable) return EQ_TIER_TO_BANK[sess];
  if (cfgEq && Object.hasOwn(CFG_EQ_TO_BANK, cfgEq)) return CFG_EQ_TO_BANK[cfgEq];
  return 'full_gym';
}

// C5
for (const t of Object.keys(EQ_TIER_TO_BANK)) {
  if (EQ_TIER_TO_BANK[t] !== CFG_EQ_TO_BANK[EQ_TIER_TO_CFG[t]])
    fails.push(`C5 selector tier ${t}: session path ${EQ_TIER_TO_BANK[t]} ≠ durable path ${CFG_EQ_TO_BANK[EQ_TIER_TO_CFG[t]]}`);
}

// Sweep C1-C4
const cfgVals = [undefined, '', ...Object.keys(CFG_EQ_TO_BANK), 'not_a_tier'];
const sessVals = [null, ...Object.keys(EQ_TIER_TO_BANK), 'not_a_tier'];
let cases = 0, staleCases = 0, absentCases = 0;
for (const c of cfgVals) for (const s of sessVals) {
  const durable = c || '';
  const stale = durable === 'bodyweight' ? 'full_gym' : 'bodyweight';
  for (const [kind, b] of [['fresh', durable], ['stale', stale], ['absent', null], ['empty', '']]) {
    const got = run(c, s, b), want = expected(c, s, b);
    cases++;
    if (kind === 'stale' && s) staleCases++;
    if (kind === 'absent' && s) absentCases++;
    if (!BANK.has(got)) fails.push(`C4 cfg=${c} eq_tier=${s} baseline=${kind}: returned ${got}, not a bank tier`);
    else if (got !== want) fails.push(`cfg=${c} eq_tier=${s} baseline=${kind}: got ${got}, contract says ${want}`);
  }
}

// Named transitions, the cases a user actually walks through.
const named = [
  ['hotel override set while cfg=full_gym, then durable change to bodyweight', 'bodyweight', 'hotel_full', 'full_gym', 'home'],
  ['bodyweight override set while cfg=home_dumbbells, then durable change to full_gym', 'full_gym', 'bodyweight', 'home_dumbbells', 'full_gym'],
  ['override from a session that predates BUG-118 (no baseline)', 'full_gym', 'bodyweight', null, 'full_gym'],
  ['fresh override still wins ("I\'m at a hotel today")', 'full_gym', 'hotel_small', 'full_gym', 'hotel_gym'],
  ['fresh override with no durable choice yet', undefined, 'dumbbells', '', 'hotel_gym'],
  ['durable choice changed back to what the override saw', 'full_gym', 'bodyweight', 'full_gym', 'home'],
  ['unknown override falls through to the durable choice', 'bodyweight', 'not_a_tier', 'bodyweight', 'home'],
  ['nothing set anywhere', undefined, null, null, 'full_gym'],
];
for (const [label, c, s, b, want] of named) {
  const got = run(c, s, b);
  if (got !== want) fails.push(`transition "${label}": got ${got}, want ${want}`);
}

// ── F/G/H — the two axes BUG-187's Code Fix scope named and the first version of this guard
// left out (ledger 2026-11-25): FOCUS, and the two TRANSITIONS change-tier-then-regenerate and
// open-a-saved-workout. Every function below is the REAL one extracted from the working tree;
// only its DOM/network collaborators are stubbed, and the stubs RECORD what they were handed.
//   F1  renderOneOff(focus) hands getSingleDay EXACTLY resolveEquipmentTier()'s answer, for
//       every focus x every resolution state of the sweep above (stale/absent overrides included)
//   F2  the real programs.js getSingleDay(focus, {tier}) never serves an exercise above that tier
//   G1  applySetupSelection() with selector tier T (from every prior state) leaves the resolver
//       answering EQ_TIER_TO_BANK[T], writes a baseline equal to the new cfg.equipment, and
//       regenerates (renderProgramViews called); a one-off built right after uses T's bank tier
//   H1  pickSavedWorkout() writes NONE of eq_tier / eq_tier_baseline / cfg.equipment, so the
//       resolver's answer is identical before and after opening a saved workout, and the next
//       fresh one-off is still built at the live tier, not the saved workout's
// What H does NOT assert, on purpose: whether a saved workout built at one tier SHOULD be
// re-filtered when opened at another. The shipped code replays it verbatim (day_data as saved);
// changing that is a product call, not this guard's to encode.
const sessW = new Map();
// Goal axis: renderOneOff branches on oneOffGoalKey() (cardio only for fat_burn), so F sweeps every
// goal rather than stubbing one (verifier I, 2026-11-25). Read from programs.js, not hand-listed.
let curGoal = 'build_muscle';
const ctx2 = {
  cfg: {}, console,
  sessionStorage: {
    getItem: k => (sessW.has(k) ? sessW.get(k) : null),
    setItem: (k, v) => { sessW.set(k, String(v)); },
    // removeItem/clear recorded too: a stub without them would crash a removal (failing by
    // accident) or, guarded, silently miss it (verifier E2/E3, 2026-11-25).
    removeItem: k => { sessW.delete(k); },
    clear: () => { sessW.clear(); },
  },
};
const progSrc = readFileSync(process.env.PROGRAMS_JS || join(root, 'programs.js'), 'utf8');
const pctx = { console, window: {}, localStorage: { getItem() { return null; }, setItem() {} }, sessionStorage: { getItem() { return null; }, setItem() {} } };
pctx.globalThis = pctx; vm.createContext(pctx);
vm.runInContext(progSrc + ';this.__g=getSingleDay;this.__b=EXERCISE_BANK;this.__f=ONEOFF_FOCUSES;this.__goals=Object.keys(PHASES);', pctx);
const realGetSingleDay = pctx.__g;
const bankByName = Object.fromEntries(Object.values(pctx.__b).map(e => [e.name, e]));
const FOCUSES = [...pctx.__f];
const GOALS = [...pctx.__goals];
if (GOALS.length !== 5) fails.push(`F: PHASES has ${GOALS.length} goal keys, expected the 5 canonical goals — extraction broke or the goal list changed`);
const TIER_RANK = { home: 0, hotel_gym: 1, full_gym: 2 };
if (FOCUSES.length < 5) fails.push(`F: ONEOFF_FOCUSES has ${FOCUSES.length} entries — extraction broke or the focus list collapsed`);

const els = new Map();
const el = id => { if (!els.has(id)) els.set(id, { id, value: '', textContent: '', innerHTML: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {} }); return els.get(id); };
let activeTier = null; const calls = { renderProgramViews: 0, getSingleDay: [], sbSaved: 0 };
Object.assign(ctx2, {
  document: {
    getElementById: el,
    querySelector: q => (q === '.eq-btn.active' && activeTier ? { dataset: { tier: activeTier } } : null),
    querySelectorAll: () => [],
  },
  LS: { set() {}, get() { return null; } },
  syncToCloud() {}, renderProgramViews() { calls.renderProgramViews++; },
  // The stub runs the REAL getSingleDay with the EXACT opts renderOneOff built (goal, supersets,
  // cardio, injuries...), so F2's tier-legality check sees the cardio finisher and superset paths
  // too — a bare getSingleDay(focus,{tier}) never reached them (verifier G2, 2026-11-25).
  getSingleDay(focus, opts) { const day = realGetSingleDay(focus, opts); calls.getSingleDay.push({ focus, tier: opts && opts.tier, opts, day }); return day; },
  oneOffState: {}, oneOffGoalKey: () => curGoal, currentWeek: 1,
  getPhase: () => ({}), buildDayHTML: () => '', showOneOffStep() {}, renderIcons() {}, showToast() {},
  recentMuscleLoad: () => ({}), recentExerciseNames: () => new Set(), resolveMaxDb: () => 0,
  RECOVERY_PARAMS: { build_muscle: { sameGroupHours: 48 } },
  _oneoffSets: [], _oneoffHistorySets: [], _savedWorkouts: [],
  sb: { from: () => ({ select: () => ({ eq: () => ({ single: async () => { calls.sbSaved++; return { data: { day_data: { name: 'saved', blocks: [] } }, error: null }; } }) }) }) },
});
vm.createContext(ctx2);
const src2 = [
  grabConst('EQ_TIER_TO_BANK'), grabConst('CFG_EQ_TO_BANK'), grabConst('EQ_TIER_TO_CFG'), grabConst('EQ_LABELS'),
  grabFn('resolveEquipmentTier'), grabFn('applySetupSelection'), grabFn('renderOneOff'), grabFn('pickSavedWorkout'),
  'globalThis.__u = { resolveEquipmentTier, applySetupSelection, renderOneOff, pickSavedWorkout };',
].join('\n');
if (fails.length) { for (const f of fails) console.error(`✗ ${f}`); process.exit(1); }
vm.runInContext(src2, ctx2);
const U = ctx2.__u;
function setState(cfgEq, sess, baseline) {
  sessW.clear(); ctx2.cfg = cfgEq === undefined ? {} : { equipment: cfgEq };
  if (sess !== null) sessW.set('eq_tier', sess);
  if (baseline !== null) sessW.set('eq_tier_baseline', baseline);
}
function legalAt(day, tier, label) {
  for (const ex of (day && day.blocks ? day.blocks.flatMap(b => b.exs || []) : [])) {
    const e = bankByName[ex.name];
    if (!e) { fails.push(`F2 ${label}: "${ex.name}" is not in EXERCISE_BANK — cannot classify its tier (fail closed)`); continue; }
    if ((TIER_RANK[e.tier] ?? 99) > TIER_RANK[tier]) fails.push(`F2 ${label}: "${ex.name}" needs ${e.tier}, resolved tier is ${tier}`);
  }
}

// F — focus axis over every resolution state
let fCases = 0, cardioDays = 0; const legalMemo = new Map();
for (const c of cfgVals) for (const s of sessVals) {
  const durable = c || '';
  const stale = durable === 'bodyweight' ? 'full_gym' : 'bodyweight';
  for (const [kind, b] of [['fresh', durable], ['stale', stale], ['absent', null], ['empty', '']]) {
    for (const goal of GOALS) for (const focus of FOCUSES) {
      curGoal = goal;
      setState(c, s, b);
      const want = expected(c, s, b);
      calls.getSingleDay.length = 0;
      U.renderOneOff(focus);
      fCases++;
      const seen = calls.getSingleDay.map(x => x.tier);
      if (seen.length !== 1) fails.push(`F1 goal=${goal} focus=${focus} cfg=${c} eq_tier=${s} baseline=${kind}: renderOneOff called getSingleDay ${seen.length}x`);
      else if (seen[0] !== want) fails.push(`F1 goal=${goal} focus=${focus} cfg=${c} eq_tier=${s} baseline=${kind}: one-off built at ${seen[0]}, resolver contract says ${want}`);
      else {
        legalMemo.set(`${goal}|${focus}|${want}`, (legalMemo.get(`${goal}|${focus}|${want}`) || 0) + 1);
        legalAt(calls.getSingleDay[0].day, want, `goal=${goal} focus=${focus} tier=${want}`);
        if (goal === 'fat_burn' && calls.getSingleDay[0].opts.cardio) cardioDays++;
      }
    }
  }
}

if (cardioDays === 0) fails.push('F2: no fat_burn one-off was built with cardio:true — the cardio finisher path was never checked (vacuous)');

// G — change tier, then regenerate
let gCases = 0;
const priors = [[undefined, null, null], ['full_gym', null, null], ['bodyweight', 'hotel_full', 'full_gym'], ['home_dumbbells', 'bodyweight', 'home_dumbbells']];
for (const [c, s, b] of priors) for (const T of Object.keys(EQ_TIER_TO_BANK)) {
  setState(c, s, b); activeTier = T; calls.renderProgramViews = 0;
  U.applySetupSelection(); gCases++;
  const label = `prior cfg=${c} eq_tier=${s} baseline=${b} -> select ${T}`;
  const got = U.resolveEquipmentTier();
  if (got !== EQ_TIER_TO_BANK[T]) fails.push(`G1 ${label}: resolver answers ${got}, want ${EQ_TIER_TO_BANK[T]}`);
  // Not circular: the durable choice must be the selector's own mapping, and a FRESH TAB (no
  // sessionStorage) must still resolve to the tier the user picked (verifier D, 2026-11-25).
  if (ctx2.cfg.equipment !== (EQ_TIER_TO_CFG[T] || null)) fails.push(`G1 ${label}: cfg.equipment saved as ${ctx2.cfg.equipment}, selector mapping is ${EQ_TIER_TO_CFG[T]}`);
  { const keep = new Map(sessW); sessW.clear(); const fresh = U.resolveEquipmentTier(); for (const [k, v] of keep) sessW.set(k, v);
    if (fresh !== EQ_TIER_TO_BANK[T]) fails.push(`G1 ${label}: a fresh tab resolves ${fresh}, the user picked ${T} (${EQ_TIER_TO_BANK[T]})`); }
  if (sessW.get('eq_tier_baseline') !== (ctx2.cfg.equipment || '')) fails.push(`G1 ${label}: baseline ${sessW.get('eq_tier_baseline')} ≠ new cfg.equipment ${ctx2.cfg.equipment}`);
  if (calls.renderProgramViews !== 1) fails.push(`G1 ${label}: renderProgramViews called ${calls.renderProgramViews}x, want 1 (no regenerate)`);
  calls.getSingleDay.length = 0; U.renderOneOff(FOCUSES[0]);
  if (calls.getSingleDay[0]?.tier !== EQ_TIER_TO_BANK[T]) fails.push(`G1 ${label}: next one-off built at ${calls.getSingleDay[0]?.tier}, want ${EQ_TIER_TO_BANK[T]}`);
}
activeTier = null;

// H — open a saved workout
let hCases = 0;
for (const c of cfgVals) for (const s of sessVals) for (const b of [c || '', null]) {
  setState(c, s, b);
  ctx2._savedWorkouts = [{ id: 'w1', goal: 'strength', focus: FOCUSES[0] }];
  const before = { t: U.resolveEquipmentTier(), eq: sessW.get('eq_tier') ?? null, bl: sessW.get('eq_tier_baseline') ?? null, cf: ctx2.cfg.equipment };
  calls.sbSaved = 0;
  await U.pickSavedWorkout('w1'); hCases++;
  const label = `cfg=${c} eq_tier=${s} baseline=${b}`;
  if (calls.sbSaved !== 1) fails.push(`H1 ${label}: pickSavedWorkout never reached its load (stub hit ${calls.sbSaved}x) — vacuous`);
  if ((sessW.get('eq_tier') ?? null) !== before.eq || (sessW.get('eq_tier_baseline') ?? null) !== before.bl || ctx2.cfg.equipment !== before.cf)
    fails.push(`H1 ${label}: opening a saved workout changed tier state (eq_tier ${before.eq}->${sessW.get('eq_tier')}, baseline ${before.bl}->${sessW.get('eq_tier_baseline')}, cfg.equipment ${before.cf}->${ctx2.cfg.equipment})`);
  const after = U.resolveEquipmentTier();
  if (after !== before.t) fails.push(`H1 ${label}: resolver answered ${before.t} before opening a saved workout and ${after} after`);
  calls.getSingleDay.length = 0; U.renderOneOff(FOCUSES[1]);
  if (calls.getSingleDay[0]?.tier !== before.t) fails.push(`H1 ${label}: fresh one-off after a saved one built at ${calls.getSingleDay[0]?.tier}, live tier is ${before.t}`);
}

if (fails.length) {
  for (const f of fails.slice(0, 25)) console.error(`✗ ${f}`);
  if (fails.length > 25) console.error(`  … and ${fails.length - 25} more`);
  console.error(`FAIL equipment-tier-resolution-smoke: ${fails.length} violation(s) across ${cases} sweep cases + ${named.length} transitions + F ${fCases} focus cases + G ${gCases} tier-change cases + H ${hCases} saved-workout cases`);
  process.exit(1);
}
console.log(`✓ resolveEquipmentTier honours its contract across ${cases} sweep cases (${staleCases} stale-baseline, ${absentCases} absent-baseline with an override set) and ${named.length} named transitions; session and durable tier tables agree; F1/F2 ${fCases} goal x focus x state one-offs built at the resolved tier and tier-legal with renderOneOff's real opts (${GOALS.length} goals, ${FOCUSES.length} focuses, ${legalMemo.size} goal x focus x tier combos, ${cardioDays} fat_burn days with the cardio finisher); G1 ${gCases} tier-change-then-regenerate cases; H1 ${hCases} open-a-saved-workout cases leave the tier untouched`);
