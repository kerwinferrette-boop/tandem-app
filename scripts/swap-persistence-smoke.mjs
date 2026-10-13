#!/usr/bin/env node
/**
 * swap-persistence-smoke.mjs — B1 regression guard: the Swap button's choice is
 * DURABLE, re-applied at render, legality-checked at apply time, and undoable.
 *
 * WHY THIS EXISTS
 * ---------------
 * openSwapPicker()/applySwap() shipped mutating one card's DOM + a toast and
 * persisting NOTHING — reload the page (or reach the same slot next week) and
 * the swap silently reverts. Classic "wired is not working" (CLAUDE.md): the UI
 * says "Swapped to X" and the program engine never hears about it.
 *
 * THE DESIGN THIS PINS
 *   - LS key `tandem_swaps`: { [originalExerciseName]: { to, at } } — keyed by
 *     the engine-served exercise NAME, never the slot id (slot ids churn; see
 *     lastsets-churn-smoke.mjs / BUG-45/48 precedent).
 *   - swapTargetFor(origName) re-validates the stored target against
 *     getExerciseSubstitutes(origName, resolveEquipmentTier(), cfg.injuries, …)
 *     EVERY time — a swap stored before an injury was declared, or on a better-
 *     equipped device, must NOT bypass the injury/tier filter (SAFETY: the bank
 *     injury filter is one of the two layers; a stale stored swap is a hole in it).
 *   - resolveUserSwap(ex) applies at the buildDayHTML seam AFTER phase.subs, so
 *     every downstream name-keyed system — getRecommendation, PRs (C7/BUG-48),
 *     computeMuscleWeeklyVolume (D6b) — sees the SUBSTITUTE's name automatically.
 *   - Choosing the original in the picker (or the undo control) CLEARS the entry.
 *
 * HARD (fails the gate):
 *   [A] static wiring: resolver called at the render seam; applySwap persists;
 *       key scoped + cleared by clearHistory; undo control exists in markup
 *   [D] round-trip per original name, timestamped, no bleed
 *   [E] swap-to-original and clearExSwap both DELETE the entry (no stored no-op)
 *   [R] resolveUserSwap swaps identity fields, stamps userSwappedFrom, keeps the
 *       slot's structural fields (id/sets/reps), and is an IDENTITY pass-through
 *       when no swap is stored (zero-diff for every non-swapped card)
 *   [S] legality is evaluated NOW, not at store time: injury-blocked and
 *       above-tier stored targets are refused (and the same stored rows apply
 *       cleanly when the block is lifted — proves [S] fails for the right reason)
 *   [V] muscle-volume crediting (D6b, computeMuscleWeeklyVolume) credits the
 *       SUBSTITUTE's muscles after the swap — identical to logging it directly
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const raw = readFileSync(path.join(root, 'tandem.html'), 'utf8');
const programsSrc = readFileSync(path.join(root, 'programs.js'), 'utf8');
// SC-35: strip comments before matching — comments quote the patterns.
const code = raw.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
const markup = raw.replace(/<!--[\s\S]*?-->/g, '');

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};

// ── [A] static wiring ──
// The resolver must run at the buildDayHTML seam, downstream of phase.subs, so
// the rest of the card render (rec, PR, volume, log) sees the substitute.
const seamAt = code.indexOf('phase.subs[_ex.id]');
const seamRegion = seamAt === -1 ? '' : code.slice(seamAt, seamAt + 400);
check('[A1] resolveUserSwap() is applied at the render seam (after phase.subs)',
  /resolveUserSwap\(/.test(seamRegion),
  'the stored swap exists but no render path applies it — the card reverts on every reload');
const applySwapAt = code.indexOf('function applySwap(');
const applySwapBody = applySwapAt === -1 ? '' : code.slice(applySwapAt, code.indexOf('\n}', applySwapAt) + 2);
check('[A2] applySwap() persists via saveExSwap — not DOM-only',
  /saveExSwap\(/.test(applySwapBody),
  'applySwap mutates the card and saves nothing — the toast is lying');
check('[A3] tandem_swaps is in LS_SCOPED_KEYS (sign-out clears it)',
  /LS_SCOPED_KEYS\s*=\s*\[[\s\S]*?'tandem_swaps'[\s\S]*?\]/.test(code),
  "an unscoped key would leak one account's swaps to another on a shared device");
const chAt = code.indexOf('function clearHistory(');
const chBody = chAt === -1 ? '' : code.slice(chAt, code.indexOf('\n}', chAt) + 2);
check('[A4] clearHistory() clears tandem_swaps (BUG-91 precedent)',
  /'tandem_swaps'/.test(chBody),
  'swaps would survive a full history clear with no UI path to remove them');
check('[A5] the card carries the ORIGINAL name (data-orig-name) so applySwap can key the store',
  /data-orig-name/.test(markup),
  'after one swap the heading shows the substitute — without the original on the card, a second swap keys off the wrong name');
check('[A6] a visible undo path exists (clearExSwap wired to a control)',
  /onclick="[^"]*clearExSwap\(/.test(markup),
  'no way to see/undo a swap — "until cleared" requires a clear control');

// ── behavioral: run the REAL helpers against the REAL bank ──
const blockStart = code.indexOf('function exSwapsAll(');
const blockEnd = code.indexOf('function openSwapPicker(');
if (blockStart === -1 || blockEnd <= blockStart) {
  console.error('FAIL  could not slice the swap block (exSwapsAll … openSwapPicker) — helpers missing or moved');
  console.log(`\nswap-persistence-smoke: ${failures + 1} FAILURE(S)`);
  process.exit(1);
}
const SWAP_SRC = code.slice(blockStart, blockEnd);
for (const needed of ['exSwapsAll', 'exSwapFor', 'saveExSwap', 'clearExSwap', 'swapTargetFor', 'resolveUserSwap']) {
  if (!SWAP_SRC.includes(`function ${needed}(`)) {
    console.error(`FAIL  the sliced swap block is missing ${needed} — the slice bounds are wrong`);
    process.exit(1);
  }
}

function makeCtx({ tier = 'full_gym', injuries = [] } = {}) {
  const store = {};
  const ctx = {
    console, Date,
    window: {}, document: { querySelectorAll: () => [] },
    localStorage: { getItem: () => null, setItem: () => {} },
    LS: { get: (k) => store[k], set: (k, v) => { store[k] = v; } },
    cfg: { injuries },
    resolveEquipmentTier: () => tier,
    __store: store,
  };
  vm.createContext(ctx);
  // programs.js first (real bank + real getExerciseSubstitutes — source-first, never
  // a copied list). Top-level consts are script-scoped in vm, so bridge explicitly.
  new vm.Script(programsSrc +
    '\n;globalThis.EXERCISE_BANK = EXERCISE_BANK;' +
    'globalThis.getExerciseSubstitutes = getExerciseSubstitutes;' +
    'globalThis.computeMuscleWeeklyVolume = computeMuscleWeeklyVolume;'
  ).runInContext(ctx);
  new vm.Script(SWAP_SRC +
    '\nthis.__api = { exSwapsAll, exSwapFor, saveExSwap, clearExSwap, swapTargetFor, resolveUserSwap };'
  ).runInContext(ctx);
  return ctx;
}

// Fixture facts (probed live against programs.js, 2026-10-05, bank @ 184 entries):
//   'Flat Barbell Press'        full_gym compound, oneRmFactor 1.0
//     subs @ full_gym ⊇ { DB Bench Press (orf .88), Machine Chest Press (full_gym) }
//     subs @ home     = { Push-Up } — Machine Chest Press is tier-invalid at home
//   'High Incline Barbell Press': 'Arnold Press' is a valid sub with no injuries
//     and is REMOVED when injuries = ['shoulder']
const ORIG = 'Flat Barbell Press';
const SUB = 'DB Bench Press';

// ── [D] round-trip ──
const c1 = makeCtx();
const api = c1.__api;
api.saveExSwap(ORIG, SUB);
api.saveExSwap('High Incline Barbell Press', 'Arnold Press');
check('[D1] a saved swap reads back for its own lift', api.exSwapFor(ORIG) === SUB,
  `got ${JSON.stringify(api.exSwapFor(ORIG))}`);
check('[D2] swaps do not bleed between lifts', api.exSwapFor('High Incline Barbell Press') === 'Arnold Press');
check('[D3] an unswapped lift reads null', api.exSwapFor('Never Swapped This') === null);
check('[D4] the stored entry carries a timestamp (future cloud merge needs one)',
  !!c1.__store['tandem_swaps'][ORIG].at,
  'without `at`, a later cloud hydrate cannot decide which side is newer');

// ── [E] clearing ──
api.saveExSwap(ORIG, ORIG);
check('[E1] swapping back to the original DELETES the entry (no stored no-op)',
  api.exSwapFor(ORIG) === null &&
  !Object.prototype.hasOwnProperty.call(c1.__store['tandem_swaps'], ORIG));
api.clearExSwap('High Incline Barbell Press');
check('[E2] clearExSwap removes the entry', api.exSwapFor('High Incline Barbell Press') === null);

// ── [R] the resolver ──
const c2 = makeCtx();
c2.__api.saveExSwap(ORIG, SUB);
// Fixture mirrors a REAL generated slot object (probed: id,name,badge,sets,w,r,
// compound,isCore,cardioOnly,unit,equipment,why,cues — NO oneRmFactor; all
// render-layer load scaling reads the bank by name, see D29).
const slotEx = { id: 'd1b2e0', name: ORIG, s: 4, r: 8, compound: true, why: 'orig why', cues: ['orig cue'] };
const resolved = c2.__api.resolveUserSwap(slotEx);
const bankSub = Object.values(
  // read the sub's bank entry through the ctx so the expectation can never
  // desync from the shipped bank
  (() => { const o = {}; new vm.Script('this.__b = EXERCISE_BANK;').runInContext(c2); return c2.__b; })()
).find(e => e.name === SUB);
check('[R1] identity fields come from the substitute', resolved.name === SUB &&
  resolved.why === bankSub.why && JSON.stringify(resolved.cues) === JSON.stringify(bankSub.cues),
  `got name=${resolved.name}`);
check('[R1b] the resolver does NOT add an oneRmFactor property (D29: oneRmFactor is read ' +
  'only by load-derivation code, bank-by-name — a copy here would be a dead value and a new read site)',
  resolved.oneRmFactor === undefined,
  `resolved.oneRmFactor = ${resolved.oneRmFactor}`);
check('[R2] slot structure is kept (id/sets/reps unchanged)',
  resolved.id === slotEx.id && resolved.s === 4 && resolved.r === 8,
  'the slot id keys the DOM; sets/reps come from the program, not the movement');
check('[R3] the swap is disclosed (userSwappedFrom = original name)',
  resolved.userSwappedFrom === ORIG,
  'the card must be able to show "swapped from X" and offer undo');
const untouched = { id: 'z9', name: 'Never Swapped This', s: 3, r: 10 };
check('[R4] no stored swap ⇒ the SAME object back (zero-diff render for every other card)',
  c2.__api.resolveUserSwap(untouched) === untouched);

// ── [S] legality re-validated at APPLY time, not store time ──
// Stored swap target blocked by an injury declared AFTER the swap was stored:
const c3 = makeCtx({ injuries: ['shoulder'] });
c3.__store['tandem_swaps'] = { 'High Incline Barbell Press': { to: 'Arnold Press', at: '2026-10-01T00:00:00Z' } };
const inj = c3.__api.resolveUserSwap({ id: 'a', name: 'High Incline Barbell Press', s: 3, r: 10 });
check('[S1] an injury-blocked stored target is REFUSED (original served)',
  inj.name === 'High Incline Barbell Press' && !inj.userSwappedFrom,
  `served ${inj.name} — a stale stored swap must not bypass the injury filter (SAFETY)`);
// Stored swap target above the CURRENT device's tier:
const c4 = makeCtx({ tier: 'home' });
c4.__store['tandem_swaps'] = { [ORIG]: { to: 'Machine Chest Press', at: '2026-10-01T00:00:00Z' } };
const tiered = c4.__api.resolveUserSwap({ id: 'b', name: ORIG, s: 4, r: 8 });
check('[S2] an above-tier stored target is REFUSED at home tier',
  tiered.name === ORIG && !tiered.userSwappedFrom,
  `served ${tiered.name} — home tier has no Machine Chest Press`);
// Same stored rows with the block lifted — proves S1/S2 refused for the RIGHT reason:
const c5 = makeCtx();
c5.__store['tandem_swaps'] = {
  'High Incline Barbell Press': { to: 'Arnold Press', at: '2026-10-01T00:00:00Z' },
  [ORIG]: { to: 'Machine Chest Press', at: '2026-10-01T00:00:00Z' },
};
check('[S3] the SAME stored rows apply cleanly with no injury at full_gym',
  c5.__api.resolveUserSwap({ id: 'a', name: 'High Incline Barbell Press', s: 3, r: 10 }).name === 'Arnold Press' &&
  c5.__api.resolveUserSwap({ id: 'b', name: ORIG, s: 4, r: 8 }).name === 'Machine Chest Press');

// ── [V] volume crediting (D6b): resolveUserSwap output credits the SUBSTITUTE ──
// computeMuscleWeeklyVolume is name-keyed into the bank; equality against a day
// logged directly under the substitute is the whole claim.
const volOf = (ctx, exs) => {
  ctx.__volArg = [{ blocks: [{ exs }] }];
  new vm.Script('this.__vol = computeMuscleWeeklyVolume(this.__volArg, EXERCISE_BANK);').runInContext(ctx);
  return ctx.__vol;
};
const viaSwap = volOf(c2, [c2.__api.resolveUserSwap({ id: 'c', name: ORIG, s: 3, r: 8, sets: 3 })]);
const direct = volOf(c2, [{ name: SUB, sets: 3 }]);
check('[V1] weekly muscle volume after the swap === volume of the substitute logged directly',
  JSON.stringify(viaSwap) === JSON.stringify(direct) && Object.keys(direct).length > 0,
  `viaSwap=${JSON.stringify(viaSwap)} direct=${JSON.stringify(direct)}`);

console.log(failures === 0 ? '\nswap-persistence-smoke: PASS' : `\nswap-persistence-smoke: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
