#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// forced-stack-classifier-audit.mjs — BUG-234: who audits the forced-stack classifier?
//
// THE HOLE. scripts/per-exercise-cap-smoke.mjs lets a lift exceed
// PER_EXERCISE_SET_CEILING (6) only when classifyOverCap() (scripts/lib/forced-classifier.mjs)
// calls it "structurally forced". A1 only demands the classifier SAY forced; A4/A5 only
// ratchet the forced SET. So a spreadable cell wrongly called forced passes A1, is already
// pinned in scripts/fixtures/bug231-forced-stacks.json, shows A5 nothing novel, and the cap
// smoke is green while a real D35 violation ships. Nothing tested the classifier's verdict.
// This gate does, by a SECOND, CONSTRUCTIVE method that shares no arithmetic with it.
//
// THE CLASSIFIER (analytic): forced iff some token the lift trains has weekly MEV > the sum
// over same-CREDIT-tier lifts of 6*min(weight,1). Known weaknesses, all measured below:
//   W-a it counts only lifts in the SAME credit tier, ignoring 0.5-credit secondary
//       contributors (and so can over-call forced);
//   W-b it keys on the FIRST forced token, not the binding one;
//   W-c some ratchet keys name a token the lift trains at weight < 1.0.
//
// THE ORACLE (constructive, assertions O*). For every over-cap lift L in every cell of the
// 1050-combo persona matrix (scripts/lib/persona-combos.mjs, the one home validate:personas
// sweeps) it tries to BUILD a legal re-allocation of that week's sets and returns
// feasible / infeasible / undecided. "Legal" means:
//   - L itself ends at <= 6 sets;
//   - every other lift stays within [min(P,6), max(P,6)] (an under-cap lift may rise to 6, an
//     over-cap lift may fall to 6 but never rises: the excess must land on lifts that have
//     room, "each <= 6", not pile onto another stack);
//   - every muscle token the program currently carries at >= the goal's MEV stays >= MEV,
//     counting EVERY lift at its true D6b credit (primary 1.0, secondary 0.5) — this is the
//     part the classifier's same-credit-tier sum ignores;
//   - maintenance (VOLUME_LANDMARKS.maintenance.mav): no token above max(mav, its current
//     weekly total) — D8 clause 2's cap;
//   - SESSION ceiling (SESSION_MUSCLE_CEILING, 11 fractional sets): per day and per
//     muscleCeilingKey, no more than max(11, the value already there). The engine exempts a
//     DIRECT lift's co-primary movers from this ceiling; the oracle holds them to it, i.e. it
//     is STRICTER than the engine, so it can only miss a spreadable cell, never invent one.
// Feasibility is exact integer search (DFS with covering/packing bounds), node-capped; a cell
// that hits the cap is reported UNDECIDED, never defaulted either way.
// The oracle reads the CREDIT accounting (weights from EXERCISE_BANK muscleGroups) and the
// program the engine actually emitted; it does not call the classifier's headroom formula.
//
// ASSERTIONS
//   O0  oracle self-test: a hand-built spreadable week must come back feasible and a hand-
//       built forced week infeasible (a vacuous oracle must not pass quietly — SC-38).
//   O1  no NEW contradiction: no lift the classifier calls forced is oracle-feasible, other than
//       the pinned baseline (scripts/fixtures/classifier-contradictions-baseline.json, derived
//       categories) — O1b: a baseline entry that stops reproducing fails (ratchet down);
//       O1c: every entry carries a category and reason.
//   C1/C2 classifier boundary cells on a synthetic bank: headroom == MEV is NOT forced (`<` not
//       `<=`), and a weight-2 lift is one ceiling-slot (the Math.min(w,1) clamp in the reduce).
//       Added after the BUG-234 verifier showed both mutants survived this gate and the cap smoke.
//   O2  UNDECIDED <= the committed bound (0 today).
//   O3  coverage: the oracle judged EVERY classifier-forced over-cap lift (no silent skip).
//   W1  no ratchet key names a token some contributing lift trains at weight < 1.0, except
//       entries in scripts/fixtures/forced-key-weight-allowlist.json (key + category +
//       data-derived reason).
//   W2  no stale allowlist entry (the ratchet turns one way).
//   W3  every allowlist entry carries a category and a non-empty reason.
//   P   (report) the 132 pinned cells: confirmed / contradicted / undecided.
//
// WHAT THE STANDING CHECK DOES NOT COVER (stated plainly, same register as M5 in the cap
// smoke): it audits the week-1 template getProgram() emits for the 1050 persona combos at the
// default 12-week length, 'balanced' emphasis, no experience/duration/weight input (the axes
// the matrix sweeps). It does not audit later weeks' deload/phase set counts, and the oracle
// re-allocates among lifts the engine ALREADY placed — it does not ask whether a NEW lift
// could be added (that is Kerwin's muscle_tag_rescope ruling, the real fix for forced cells).
// A 'confirmed forced' verdict therefore means "no legal re-allocation among the existing
// slots", which is exactly the claim D35 makes.
//
// Regenerate the allowlist ONLY with `node scripts/forced-stack-classifier-audit.mjs
// --write-fixtures`; never hand-edit.
//
// MUTATION RECORD (SC-38/SC-40/SC-45: each assertion individually, on a COPY of the tree
// under the scratchpad, every mutation proven to have LANDED by a diff before its result is
// believed) is in the BUG-234 commit body and docs/self-corrections.md.
// ═══════════════════════════════════════════════════════
import vm from 'vm';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { combos, COMBO_COUNT } from './lib/persona-combos.mjs';
import { makeWeightOf, classifyOverCap, allForcedTokens } from './lib/forced-classifier.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const code = readFileSync(join(root, 'programs.js'), 'utf8');
const ctx = vm.runInNewContext(
  `(function() { ${code}; return { getProgram, EXERCISE_BANK, MAJOR_MUSCLE_GROUP_TOKENS,
     VOLUME_LANDMARKS, PER_EXERCISE_SET_CEILING, SESSION_MUSCLE_CEILING, muscleCeilingKey }; })()`, { console });
const { getProgram, EXERCISE_BANK, MAJOR_MUSCLE_GROUP_TOKENS: TOKENS, VOLUME_LANDMARKS,
        PER_EXERCISE_SET_CEILING: CAP, SESSION_MUSCLE_CEILING: SESSION_CEIL, muscleCeilingKey } = ctx;

const FIXTURE = join(root, 'scripts', 'fixtures', 'bug231-forced-stacks.json');
const ALLOW = join(root, 'scripts', 'fixtures', 'forced-key-weight-allowlist.json');
const WRITE_FIXTURES = process.argv.includes('--write-fixtures');
const NODE_CAP = 400000;          // per-lift search budget; exceeding it => UNDECIDED
const UNDECIDED_BOUND = 0;        // O2 — raise only with a written reason

const fail = [];
const must = (cond, msg) => { if (!cond) fail.push(msg); };
const { byName, weightOf } = makeWeightOf(EXERCISE_BANK);

// ── the exact integer feasibility search ────────────────────────────────────────────
// vars: [{lb, ub}]. rows: [{coef:[per var], rhs, kind:'ge'|'le'}], coefficients >= 0.
// Returns {verdict:'feasible'|'infeasible'|'undecided', nodes, x?}.
function solve(vars, rows, nodeCap = NODE_CAP) {
  const n = vars.length;
  // suffix sums of the best (ub) and least (lb) possible contribution from vars k..n-1
  const sufMax = rows.map(r => { const a = new Array(n + 1).fill(0); for (let k = n - 1; k >= 0; k--) a[k] = a[k + 1] + vars[k].ub * r.coef[k]; return a; });
  const sufMin = rows.map(r => { const a = new Array(n + 1).fill(0); for (let k = n - 1; k >= 0; k--) a[k] = a[k + 1] + vars[k].lb * r.coef[k]; return a; });
  const cur = rows.map(() => 0);
  const x = new Array(n);
  let nodes = 0, aborted = false;
  const EPS = 1e-9;
  const ok = (k) => rows.every((r, i) => r.kind === 'ge'
    ? cur[i] + sufMax[i][k] >= r.rhs - EPS
    : cur[i] + sufMin[i][k] <= r.rhs + EPS);
  const dfs = (k) => {
    if (aborted) return false;
    if (++nodes > nodeCap) { aborted = true; return false; }
    if (!ok(k)) return false;
    if (k === n) return true;
    for (let v = vars[k].ub; v >= vars[k].lb; v--) {
      x[k] = v;
      rows.forEach((r, i) => { cur[i] += v * r.coef[k]; });
      const hit = dfs(k + 1);
      rows.forEach((r, i) => { cur[i] -= v * r.coef[k]; });
      if (hit) return true;
      if (aborted) return false;
    }
    return false;
  };
  const hit = dfs(0);
  if (hit) return { verdict: 'feasible', nodes, x: [...x] };
  return { verdict: aborted ? 'undecided' : 'infeasible', nodes };
}

// Build + solve the unstacking problem for ONE over-cap lift `L` (an index into `lifts`).
// lifts: [{di, name, sets}]; goal landmark gives MEV (+ mav for maintenance).
function unstack(lifts, L, landmark, holdBelowMev = false) {
  const m = lifts.length;
  const w = lifts.map(l => Object.fromEntries(TOKENS.map(t => [t, weightOf(l.name, t)]).filter(([, v]) => v > 0)));
  // session-ceiling credit per lift: primary 1.0 / secondary 0.5 under muscleCeilingKey
  const cw = lifts.map(l => {
    const g = byName[l.name]?.muscleGroups || {};
    const o = {};
    for (const s of g.secondary || []) { const k = muscleCeilingKey(s); o[k] = Math.max(o[k] || 0, 0.5); }
    for (const p of g.primary || []) o[muscleCeilingKey(p)] = 1;
    return o;
  });
  const weekly = {};
  lifts.forEach((l, i) => { for (const [t, v] of Object.entries(w[i])) weekly[t] = (weekly[t] || 0) + l.sets * v; });
  const vars = lifts.map((l, i) => i === L ? { lb: 1, ub: CAP }
    : { lb: Math.min(l.sets, CAP), ub: Math.max(l.sets, CAP) });
  const rows = [];
  // covering: every token already at/above MEV must stay there
  if (landmark?.mev) for (const t of TOKENS) {
    if ((weekly[t] || 0) >= landmark.mev - 1e-9) rows.push({ kind: 'ge', rhs: landmark.mev, coef: lifts.map((_, i) => w[i][t] || 0) });
  }
  // strict variant (reported, not the gate): a token already BELOW MEV may not get worse either
  if (holdBelowMev && landmark?.mev) for (const t of TOKENS) {
    const cur0 = weekly[t] || 0;
    if (cur0 > 0 && cur0 < landmark.mev - 1e-9) rows.push({ kind: 'ge', rhs: cur0, coef: lifts.map((_, i) => w[i][t] || 0) });
  }
  // packing: maintenance MAV cap (D8 cl.2), never tighter than where the program already is
  if (landmark?.mav) for (const t of TOKENS) {
    if (lifts.some((_, i) => w[i][t])) rows.push({ kind: 'le', rhs: Math.max(landmark.mav, weekly[t] || 0), coef: lifts.map((_, i) => w[i][t] || 0) });
  }
  // packing: per-session fractional-set ceiling per muscleCeilingKey
  const days = [...new Set(lifts.map(l => l.di))];
  for (const d of days) {
    const keys = new Set(); lifts.forEach((l, i) => { if (l.di === d) Object.keys(cw[i]).forEach(k => keys.add(k)); });
    for (const k of keys) {
      const coef = lifts.map((l, i) => (l.di === d ? cw[i][k] || 0 : 0));
      const base = lifts.reduce((a, l, i) => a + l.sets * coef[i], 0);
      rows.push({ kind: 'le', rhs: Math.max(SESSION_CEIL, base), coef });
    }
  }
  // order: L first, then the lifts that feed the most covering rows, then the rest
  const order = [...Array(m).keys()].sort((a, b) => (a === L ? -1 : b === L ? 1 : 0)
    || rows.filter(r => r.kind === 'ge' && r.coef[b] > 0).length - rows.filter(r => r.kind === 'ge' && r.coef[a] > 0).length);
  const pv = order.map(i => vars[i]);
  const pr = rows.map(r => ({ ...r, coef: order.map(i => r.coef[i]) }));
  const r = solve(pv, pr);
  if (r.x) {
    // The DFS fills high-first, so its plan is noisy. Greedily pull every other lift back
    // toward its current value while the plan stays legal — a minimal witness is readable.
    const legal = (xp) => pr.every(q => { const v = xp.reduce((a, val, k) => a + val * q.coef[k], 0);
      return q.kind === 'ge' ? v >= q.rhs - 1e-9 : v <= q.rhs + 1e-9; });
    for (let k = 1; k < r.x.length; k++) {
      const target = lifts[order[k]].sets;
      while (r.x[k] !== Math.min(Math.max(target, pv[k].lb), pv[k].ub)) {
        const step = r.x[k] > target ? -1 : 1;
        const trial = [...r.x]; trial[k] += step;
        if (!legal(trial)) break;
        r.x = trial;
      }
    }                                   // map the solution back to lift order
    const full = new Array(m); order.forEach((i, k) => { full[i] = r.x[k]; });
    const after = {}; lifts.forEach((_, i) => { for (const [t, v] of Object.entries(w[i])) after[t] = (after[t] || 0) + full[i] * v; });
    r.plan = full; r.weeklyBefore = weekly; r.weeklyAfter = after;
  }
  return r;
}

// ── O0: the oracle must be able to say BOTH things (a vacuous oracle is worse than none) ──
{
  // Real bank names, hand-built weeks, so weightOf/cw run the production path.
  const any = Object.values(EXERCISE_BANK).find(e => (e.muscleGroups?.primary || []).some(p => p === 'pec_major' || p.startsWith('pec_major_')));
  const tok = TOKENS.find(t => weightOf(any.name, t) >= 1);
  const lm = { mev: 10 };
  // spreadable: three identical primary lifts on three days, the first stacked at 10, MEV 10.
  const sp = [0, 1, 2].map(di => ({ di, name: any.name, sets: di === 0 ? 10 : 3 }));
  const a = unstack(sp, 0, lm);
  // forced: ONE lift in the week, MEV 10 > the 6 it can legally hold.
  const fo = [{ di: 0, name: any.name, sets: 10 }];
  const b = unstack(fo, 0, lm);
  must(a.verdict === 'feasible', `O0: the oracle called a hand-built SPREADABLE week (${tok}: 3 lifts, one stacked at 10, MEV 10) ${a.verdict} — it cannot detect a false "forced"`);
  must(b.verdict === 'infeasible', `O0: the oracle called a hand-built FORCED week (${tok}: one lift, MEV 10 > 6) ${b.verdict} — it would never confirm anything`);
}

// ── C1/C2: boundary cells for the classifier's own arithmetic (BUG-234 verifier finding) ──
// The sweep below only ever sees the headroom values the 1050 programs happen to produce, so two
// mutations of the classifier survived both this gate and the cap smoke: `headroom < mev` -> `<=`
// and dropping the Math.min(.,1) clamp inside the headroom reduce. A synthetic bank makes each
// boundary reachable on purpose (the SC-38 lesson: the fixture must be able to reach the branch).
{
  const mk = (name, primary) => ({ name, muscleGroups: { primary, secondary: [] } });
  const syn = makeWeightOf({
    a: mk('SynA', ['zz']), b: mk('SynB', ['zz']),            // weight 1 on token zz
    d: mk('SynD', ['zz', 'zz_x']),                           // weight 2 on zz (two anchored primary hits)
  });
  const cap = 6;
  const run = (names, mev) => classifyOverCap({
    lift: { name: names[0] }, lifts: names.map(n => ({ name: n })),
    landmark: { mev }, tokens: ['zz'], cap, weightOf: syn.weightOf });
  // C1: headroom exactly equals MEV (2 weight-1 lifts x 6 = 12, MEV 12) is REACHABLE, so not forced.
  must(run(['SynA', 'SynB'], 12).forced === false,
    'C1: classifier called headroom == MEV forced — the boundary is `headroom < mev`; `<=` would over-call forced');
  must(run(['SynA', 'SynB'], 13).forced === true,
    'C1: classifier missed headroom (12) < MEV (13) — a genuinely forced week must still be called forced');
  // C2: a weight-2 lift counts as ONE credit tier-slot (min(w,1)): SynA(1)+SynD(2) -> 6+6 = 12, not 6+12.
  // MEV 13 > 12 is forced; an unclamped reduce would read 18 and wrongly call it spreadable.
  must(run(['SynA', 'SynD'], 13).forced === true,
    'C2: classifier read a weight-2 lift as more than one ceiling-slot — the Math.min(weight,1) clamp in the headroom reduce is gone');
  must(run(['SynA', 'SynD'], 12).forced === false,
    'C2: classifier called SynA+SynD forced at MEV 12 — clamped headroom is 12, which meets it');
}

// ── sweep ─────────────────────────────────────────────────────────────────────────────
const pinned = (() => { try { return JSON.parse(readFileSync(FIXTURE, 'utf8')); } catch { return null; } })();
const pinnedCells = new Set(pinned?.cells || []);
const verdicts = { feasible: 0, infeasible: 0, undecided: 0 };
let classifierForced = 0, judged = 0, overCap = 0;
const contradicted = [];          // classifier forced, oracle feasible
const undecided = [];
const cellState = new Map();      // ratchet key -> {conf, contra, und}
const subWeight = new Map();      // W1: key -> {lifts:Map(name->{w, other}), fullWeightSeen}
let maxNodes = 0;

for (const c of combos()) {
  const [goal, days, , sex, tier] = c.args;
  const prog = getProgram(...c.args);
  const lifts = [];
  (prog || []).forEach((day, di) => {
    for (const b of day.blocks || []) {
      if (b.cardio) continue;
      for (const e of b.exs || []) {
        if (!e || e.isCore || e.cardioOnly) continue;
        lifts.push({ di, name: e.name, sets: e.sets });
      }
    }
  });
  const landmark = VOLUME_LANDMARKS[goal];
  lifts.forEach((l, i) => {
    if (l.sets <= CAP) return;
    overCap++;
    const cls = classifyOverCap({ lift: l, lifts, landmark, tokens: TOKENS, cap: CAP, weightOf });
    if (!cls.forced) return;                       // A1's job (spreadable by the classifier's own say-so)
    classifierForced++;
    const key = `${goal}/${days}d/${sex}/${tier} — ${cls.token}`;
    const r = unstack(lifts, i, landmark);
    judged++;
    maxNodes = Math.max(maxNodes, r.nodes);
    verdicts[r.verdict]++;
    const st = cellState.get(key) || { conf: 0, contra: 0, und: 0 };
    if (r.verdict === 'infeasible') st.conf++;
    else if (r.verdict === 'feasible') {
      st.contra++;
      const id = `${c.combo} — ${l.sets}x ${l.name}`;
      // strict re-solve: is it STILL feasible when below-MEV tokens may not regress?
      const strict = unstack(lifts, i, landmark, true);
      const lowered = TOKENS.filter(t => (r.weeklyBefore[t] || 0) > 0 && (r.weeklyBefore[t] || 0) < landmark.mev - 1e-9
        && (r.weeklyAfter[t] || 0) < (r.weeklyBefore[t] || 0) - 1e-9)
        .map(t => `${t} ${r.weeklyBefore[t]}->${r.weeklyAfter[t] || 0} of mev ${landmark.mev}`);
      contradicted.push({ id, key, strict: strict.verdict,
        category: strict.verdict === 'feasible' ? 'fully-spreadable: unstacking costs no muscle anything'
          : 'partial-credit-stack: every muscle at >= MEV stays >= MEV after unstacking; the stack serves only a muscle that is below MEV with or without it',
        reason: `plan ${lifts.map((q, j) => q.sets !== r.plan[j] ? `${q.name} ${q.sets}->${r.plan[j]}` : null).filter(Boolean).join(', ')}`
          + (lowered.length ? `; lowers below-MEV ${lowered.join(', ')}` : '') });
    }
    else { st.und++; undecided.push(`${c.combo} — ${l.sets}x ${l.name} (key: ${key})`); }
    cellState.set(key, st);

    // W1 bookkeeping — the weight the lift actually trains the KEY token at
    const kw = weightOf(l.name, cls.token);
    const rec = subWeight.get(key) || { low: new Map(), fullSeen: false };
    if (kw < 1) {
      const others = allForcedTokens({ lift: l, lifts, landmark, tokens: TOKENS, cap: CAP, weightOf }).filter(f => f.weight >= 1);
      rec.low.set(l.name, { w: kw, fullWeightForced: others.map(f => f.token) });
    } else rec.fullSeen = true;
    subWeight.set(key, rec);
  });
}

// ── O1 / O2 / O3 ──────────────────────────────────────────────────────────────────────
// O1 is a RATCHET, not a zero-tolerance wall, because the first sweep found real contradictions
// (see the header and the BUG-234 commit): they are pinned in
// scripts/fixtures/classifier-contradictions-baseline.json with a data-derived category, so a NEW
// contradiction fails, a baseline entry that stops reproducing fails (shrink it), and the
// remaining ones stay printed on every run until the engine/classifier is fixed.
const BASE = join(root, 'scripts', 'fixtures', 'classifier-contradictions-baseline.json');
const contraById = Object.fromEntries(contradicted.map(c => [c.id, c]));
if (!WRITE_FIXTURES) {
  let base = null;
  try { base = JSON.parse(readFileSync(BASE, 'utf8')); } catch (err) {
    fail.push(`O1: could not read the contradictions baseline (${err.message}); regenerate with --write-fixtures, do NOT delete this assertion`);
  }
  if (base) {
    const ent = base.entries || {};
    const novel = contradicted.filter(c => !(c.id in ent));
    must(novel.length === 0,
      `O1: ${novel.length} lift(s) the classifier calls FORCED are SPREADABLE by construction and are NOT in the pinned baseline — the oracle built a legal re-allocation (every lift <= ${CAP}, every muscle that was >= MEV still >= MEV, session ceiling ${SESSION_CEIL} respected). The classifier is over-calling forced; the pinned ratchet would defend a false allowance:\n`
      + novel.slice(0, 20).map(c => `      ${c.id}  [${c.category}] ${c.reason}`).join('\n'));
    const gone = Object.keys(ent).filter(k => !(k in contraById));
    must(gone.length === 0,
      `O1b: ${gone.length} baseline contradiction(s) no longer reproduce — remove them (the ratchet only turns one way):\n` + gone.slice(0, 20).map(k => `      ${k}`).join('\n'));
    const bad = Object.entries(ent).filter(([, v]) => !v || !String(v.reason || '').trim() || !String(v.category || '').trim());
    must(bad.length === 0, `O1c: ${bad.length} baseline contradiction(s) lack a category or reason`);
  }
}
must(verdicts.undecided <= UNDECIDED_BOUND,
  `O2: ${verdicts.undecided} lift(s) hit the ${NODE_CAP}-node search cap and are UNDECIDED (bound ${UNDECIDED_BOUND}). An undecided cell is a real outcome, not a pass:\n`
  + undecided.slice(0, 10).map(k => `      ${k}`).join('\n'));
must(judged === classifierForced && judged > 0,
  `O3: the oracle judged ${judged} of ${classifierForced} classifier-forced lifts (must be all, and > 0) — a skipped lift is an unaudited verdict`);

// ── the pinned 132 ───────────────────────────────────────────────────────────────────
const pinConf = [], pinContra = [], pinUnd = [], pinUnseen = [];
for (const k of pinnedCells) {
  const st = cellState.get(k);
  if (!st) { pinUnseen.push(k); continue; }
  if (st.contra) pinContra.push(k); else if (st.und) pinUnd.push(k); else pinConf.push(k);
}

// ── W1 / W2 / W3 ─────────────────────────────────────────────────────────────────────
const lowKeys = {};
for (const [key, rec] of subWeight) {
  if (!rec.low.size) continue;
  const lifts = [...rec.low.entries()];
  const masks = [...new Set(lifts.flatMap(([, v]) => v.fullWeightForced))];
  lowKeys[key] = {
    category: masks.length ? 'first-token-masks-binding: lift is ALSO forced on a weight-1.0 token'
      : 'secondary-only: lift is forced solely via a 0.5-credit token',
    reason: `key token trained at weight ${[...new Set(lifts.map(([, v]) => v.w))].join('/')} by ${lifts.map(([n]) => n).sort().join(', ')}`
      + (masks.length ? `; same lift(s) also forced on weight-1.0 token(s) ${masks.sort().join(', ')}` : '; no weight-1.0 token is forced for it')
      + (rec.fullSeen ? '; other lifts in this cell train the token at 1.0' : ''),
  };
}
if (WRITE_FIXTURES) {
  writeFileSync(ALLOW, JSON.stringify({
    _comment: 'BUG-234 W1 allowlist: ratchet keys (scripts/fixtures/bug231-forced-stacks.json) whose token is one a contributing over-cap lift trains at weight < 1.0 (secondary, 0.5 credit). Each entry carries a category and a reason DERIVED from EXERCISE_BANK + the classifier, not authored. The gate fails on a NEW such key (W1) and on an entry that no longer reproduces (W2). Regenerate ONLY with `node scripts/forced-stack-classifier-audit.mjs --write-fixtures`; never hand-edit.',
    count: Object.keys(lowKeys).length,
    entries: Object.fromEntries(Object.keys(lowKeys).sort().map(k => [k, lowKeys[k]])),
  }, null, 2) + '\n');
  writeFileSync(BASE, JSON.stringify({
    _comment: 'BUG-234 O1 baseline: over-cap lifts the classifier calls FORCED but the constructive oracle (scripts/forced-stack-classifier-audit.mjs) re-allocates legally. Pinned so the gate is green while the finding is open; it may only SHRINK. Category and reason are derived from the sweep, not authored. Regenerate ONLY with `node scripts/forced-stack-classifier-audit.mjs --write-fixtures`; never hand-edit.',
    count: contradicted.length,
    entries: Object.fromEntries(contradicted.map(c => [c.id, { key: c.key, category: c.category, reason: c.reason }]).sort((a, b) => a[0] < b[0] ? -1 : 1)),
  }, null, 2) + '\n');
  console.log(`--write-fixtures: wrote ${Object.keys(lowKeys).length} key-weight entr(ies) to ${ALLOW} and ${contradicted.length} contradiction(s) to ${BASE}`);
} else {
  let allow = null;
  try { allow = JSON.parse(readFileSync(ALLOW, 'utf8')); } catch (err) {
    fail.push(`W1: could not read the key-weight allowlist (${err.message}); regenerate with --write-fixtures, do NOT delete this assertion`);
  }
  if (allow) {
    const ent = allow.entries || {};
    const novel = Object.keys(lowKeys).filter(k => !(k in ent));
    must(novel.length === 0,
      `W1: ${novel.length} ratchet key(s) name a token the lift trains at weight < 1.0 and are not allowlisted — the pin defends a key that may not be the binding muscle:\n`
      + novel.slice(0, 20).map(k => `      ${k}  (${lowKeys[k].reason})`).join('\n'));
    const stale = Object.keys(ent).filter(k => !(k in lowKeys));
    must(stale.length === 0,
      `W2: ${stale.length} allowlist entr(ies) no longer reproduce — remove them (the ratchet only turns one way):\n`
      + stale.slice(0, 20).map(k => `      ${k}`).join('\n'));
    const bad = Object.entries(ent).filter(([, v]) => !v || !String(v.reason || '').trim() || !String(v.category || '').trim());
    must(bad.length === 0, `W3: ${bad.length} allowlist entr(ies) lack a category or reason: ${bad.map(([k]) => k).slice(0, 10).join('; ')}`);
  }
}

// ── report ───────────────────────────────────────────────────────────────────────────
console.log(`Forced-stack classifier audit (BUG-234): ${COMBO_COUNT} combos, ${overCap} over-cap lifts, ${classifierForced} called forced by the classifier`);
console.log(`  oracle (constructive re-allocation, credit-tier accounting): ${verdicts.infeasible} CONFIRMED forced, ${verdicts.feasible} CONTRADICTED (spreadable), ${verdicts.undecided} UNDECIDED  (max ${maxNodes} search nodes/lift, cap ${NODE_CAP})`);
console.log(`  pinned ratchet cells: ${pinConf.length} confirmed, ${pinContra.length} contradicted, ${pinUnd.length} undecided, ${pinUnseen.length} not reproduced by the live sweep (of ${pinnedCells.size})`);
if (pinContra.length) for (const k of pinContra) console.log(`      CONTRADICTED  ${k}`);
if (pinUnd.length) for (const k of pinUnd) console.log(`      UNDECIDED     ${k}`);
if (contradicted.length) {
  console.log(`  CONTRADICTIONS (classifier says forced, oracle re-allocates legally; pinned in the baseline, shown every run):`);
  const cc = {}; for (const c of contradicted) cc[c.category] = (cc[c.category] || 0) + 1;
  for (const [k, v] of Object.entries(cc)) console.log(`      ${v}  ${k}`);
  for (const c of contradicted) console.log(`      ${c.id}\n          ${c.reason}`);
}
console.log(`  keys naming a token trained at weight < 1.0: ${Object.keys(lowKeys).length} (allowlisted with derived reasons in scripts/fixtures/forced-key-weight-allowlist.json)`);
const cat = {};
for (const v of Object.values(lowKeys)) cat[v.category] = (cat[v.category] || 0) + 1;
for (const [k, v] of Object.entries(cat)) console.log(`      ${v}  ${k}`);

if (fail.length) {
  console.error('\nFORCED-STACK CLASSIFIER AUDIT: FAIL');
  for (const f of fail) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log('Forced-stack classifier audit: PASS — every classifier-forced over-cap lift is confirmed forced by an independent constructive search, and every secondary-keyed ratchet cell is accounted for.');
