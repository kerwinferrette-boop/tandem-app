#!/usr/bin/env node
/**
 * swap-cloud-smoke.mjs — B4 (wiring workstream): the durable exercise swap gets
 * its CLOUD half, so a swap follows the user across devices.
 *
 * WHY THIS EXISTS
 * ---------------
 * B1 made swaps durable LOCALLY (swap-persistence-smoke.mjs owns that): keyed by
 * ORIGINAL movement name in `tandem_swaps`, re-applied at the render seam via
 * resolveUserSwap(), legality re-checked every render. The council ruling on the
 * B1 merge (docs/council-*-2026-10-06-wiring-b1-merge-readiness.*) bound the two
 * halves of the cloud slice as ONE atomic unit: wire the client round-trip HERE,
 * then Kerwin applies migrations/0024_b1_exercise_swaps.sql by hand, then the
 * real round-trip is verified against Postgres — never apply 0024 alone (the
 * dead `exercise_notes` table precedent: a table nobody writes to gets dropped
 * as evidence the feature is dead).
 *
 * The design mirrors the notes cloud half (pushExNote/wipeCloudNotes/
 * hydrateNotesFromCloud) deliberately — same keying decision (NAME, not slot id),
 * same two-way newest-wins reconciliation, same one-owner rule. Differences,
 * each with a reason:
 *   - NO debounce: a swap is a discrete tap, not a keystroke stream. saveExSwap
 *     pushes immediately, so there is no pending-timer guard in hydrate either.
 *   - The 0024 CHECK constraint (substitute_name <> original_name) means a no-op
 *     must DELETE the row, never upsert it — the client already stores no no-op
 *     entries locally (saveExSwap's delete rule), and the push must match.
 *
 * HARD (fails the gate):
 *   [A] pushExSwap exists in the swap block and saveExSwap calls it — the stamp
 *       stored locally travels to the cloud row (never re-derived at push time;
 *       the forged-stamp loss path is documented at pushExNote and is identical)
 *   [B] an undo/no-op DELETEs the row (0024's CHECK would reject the upsert)
 *   [C] hydrateSwapsFromCloud is TWO-WAY newest-wins: cloud newer pulls down,
 *       local newer pushes up WITH ITS ORIGINAL STAMP, cloud-only is taken
 *       (a real undo already deleted its row, so cloud-present + local-absent
 *       means "new from another device", not "locally deleted")
 *   [D] anonymous pushes NOTHING, via the guard (a swallowed TypeError is zero
 *       calls for the wrong reason — see ex-notes-smoke [L2])
 *   [E] wipeCloudSwaps deletes by user_id and clearHistory() calls it —
 *       otherwise the next hydrate resurrects every swap "Clear all history"
 *       claimed to remove (BUG-91 / wipeCloudNotes precedent)
 *   [F] BOTH cloud paths call the reconciler: restoreFromCloud (fresh device)
 *       and syncFromCloud (returning session) — a correct reconciler no caller
 *       reaches has shipped nothing ("wired is not working")
 *   [G] a row pulled from the cloud lands in the EXACT local shape resolveUserSwap
 *       reads ({ to, at }) — cloud sync that writes a shape the render seam
 *       cannot read is a green gate on a dead value
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const raw = readFileSync(path.join(root, 'tandem.html'), 'utf8');
// SC-35: strip //-comments before matching — comments can quote the patterns.
const code = raw.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};

// ── extract the swap block: exSwapsAll … openSwapPicker ──
const blockStart = code.indexOf('function exSwapsAll(');
const blockEnd = code.indexOf('function openSwapPicker(');
if (blockStart === -1 || blockEnd <= blockStart) {
  console.log('FAIL  cannot locate the swap block (exSwapsAll … openSwapPicker)');
  process.exit(1);
}
const SWAP_SRC = code.slice(blockStart, blockEnd);
for (const needed of ['saveExSwap', 'pushExSwap', 'wipeCloudSwaps', 'hydrateSwapsFromCloud']) {
  check(`[A0] ${needed} is defined in the swap block (ships with the store)`,
    SWAP_SRC.includes(`function ${needed}(`) || SWAP_SRC.includes(`async function ${needed}(`),
    'the cloud half must live beside the local store it mirrors — one home');
}

function makeCtx({ signedIn = true } = {}) {
  const store = {};
  const calls = [];            // every Supabase operation this run performed
  const table = () => ({
    upsert: (row) => { calls.push({ op: 'upsert', row }); return Promise.resolve({ error: null }); },
    delete: () => { const f = { _eq: {}, eq(k, v) { this._eq[k] = v; return this; },
      then: (r) => { calls.push({ op: 'delete', eq: f._eq }); return Promise.resolve(r({ error: null })); } };
      return f; },
    select: () => ({ eq: () => Promise.resolve({ data: ctx.__cloudRows || [], error: null }) }),
  });
  const warns = [];
  const ctx = {
    console: { ...console, warn: (...a) => { warns.push(a.map(String).join(' ')); } },
    setTimeout, clearTimeout, Date,
    LS: { get: (k) => store[k], set: (k, v) => { store[k] = v; }, del: (k) => { delete store[k]; } },
    currentUser: signedIn ? { id: 'u1' } : null,
    sb: { from: table },
    __store: store, __calls: calls, __cloudRows: [], __warns: warns,
  };
  vm.createContext(ctx);
  try {
    new vm.Script(SWAP_SRC +
      '\nthis.__api = { exSwapsAll, exSwapFor, saveExSwap, clearExSwap, pushExSwap, wipeCloudSwaps, hydrateSwapsFromCloud };'
    ).runInContext(ctx);
  } catch (e) {
    ctx.__api = null; ctx.__err = e.message;
  }
  return ctx;
}

const c1 = makeCtx();
if (!c1.__api) {
  check('[A1] the swap block evaluates with the cloud API present', false, c1.__err);
  console.log(`\nswap-cloud-smoke: ${failures + 1} FAILURE(S)`);
  process.exit(1);
}

// ── [A] saveExSwap pushes, stamp travels ──
c1.__api.saveExSwap('Barbell Back Squat', 'Goblet Squat');
await new Promise(r => setTimeout(r, 0));   // push is fire-and-forget async
const up1 = c1.__calls.filter(c => c.op === 'upsert');
check('[A1] a saved swap upserts ONE cloud row, name-keyed to the ORIGINAL',
  up1.length === 1 && up1[0].row.original_name === 'Barbell Back Squat' &&
  up1[0].row.substitute_name === 'Goblet Squat' && up1[0].row.user_id === 'u1',
  `got ${JSON.stringify(c1.__calls)}`);
check('[A2] the pushed stamp equals the locally stored `at` for that swap',
  up1[0]?.row?.updated_at === c1.__store['tandem_swaps']?.['Barbell Back Squat']?.at,
  `pushed ${JSON.stringify(up1[0]?.row?.updated_at)} vs stored ${JSON.stringify(c1.__store['tandem_swaps']?.['Barbell Back Squat']?.at)} — a re-derived stamp is the forged-stamp loss path pushExNote documents`);

// ── [B] undo / no-op DELETEs the row ──
const c2 = makeCtx();
c2.__api.saveExSwap('Deadlift', 'Trap Bar Deadlift');
await new Promise(r => setTimeout(r, 0));
c2.__api.clearExSwap('Deadlift');
await new Promise(r => setTimeout(r, 0));
const del2 = c2.__calls.filter(c => c.op === 'delete');
check('[B1] undo DELETEs the cloud row scoped to (user, original)',
  del2.length === 1 && del2[0].eq.user_id === 'u1' && del2[0].eq.original_name === 'Deadlift',
  `got ${JSON.stringify(c2.__calls)} — 0024's CHECK rejects a self-swap upsert, and a leftover row resurrects the swap on the next hydrate`);
const c2b = makeCtx();
c2b.__api.saveExSwap('Deadlift', 'Deadlift');   // explicit no-op
await new Promise(r => setTimeout(r, 0));
check('[B2] swapping a movement to itself never upserts',
  c2b.__calls.every(c => c.op !== 'upsert'),
  `got ${JSON.stringify(c2b.__calls)}`);

// ── [C]/[G] two-way hydrate ──
const c3 = makeCtx();
c3.__store['tandem_swaps'] = {
  'Cloud Newer': { to: 'local old sub', at: '2026-09-01T00:00:00Z' },
  'Local Newer': { to: 'local new sub', at: '2026-09-20T00:00:00Z' },
};
c3.__cloudRows = [
  { original_name: 'Cloud Newer', substitute_name: 'cloud new sub', updated_at: '2026-09-15T00:00:00Z' },
  { original_name: 'Local Newer', substitute_name: 'cloud old sub', updated_at: '2026-09-02T00:00:00Z' },
  { original_name: 'Only In Cloud', substitute_name: 'from another device', updated_at: '2026-09-18T00:00:00Z' },
];
const res = await c3.__api.hydrateSwapsFromCloud('u1');
const after = c3.__store['tandem_swaps'];
check('[C1] cloud newer pulls down', after['Cloud Newer']?.to === 'cloud new sub',
  `got ${JSON.stringify(after['Cloud Newer'])}`);
check('[C2] local newer is kept AND pushed up',
  after['Local Newer']?.to === 'local new sub' &&
  c3.__calls.some(c => c.op === 'upsert' && c.row.original_name === 'Local Newer'),
  `local: ${JSON.stringify(after['Local Newer'])}; upserts: ${JSON.stringify(c3.__calls.filter(c => c.op === 'upsert').map(c => c.row.original_name))}`);
const pushedLocalNewer = c3.__calls.find(c => c.op === 'upsert' && c.row.original_name === 'Local Newer');
check('[C3] the hydrate-push carries the swap\'s ORIGINAL stamp, not a fresh one',
  pushedLocalNewer?.row?.updated_at === '2026-09-20T00:00:00Z',
  `pushed updated_at = ${JSON.stringify(pushedLocalNewer?.row?.updated_at)} — a forged "now" makes an old swap outrank a newer one on the next device`);
check('[C4] a swap only in the cloud is taken, not treated as a local undo',
  after['Only In Cloud']?.to === 'from another device',
  'a real undo already deleted its row, so cloud-present + local-absent means new-from-elsewhere');
check('[C5] hydrate reports what it did', res && res.pulled >= 2 && res.pushed >= 1,
  `got ${JSON.stringify(res)}`);
// [G] the pulled entry must be the shape resolveUserSwap/exSwapFor read: { to, at }
check('[G1] a pulled row lands in the { to, at } shape the render seam reads',
  after['Only In Cloud']?.to === 'from another device' &&
  after['Only In Cloud']?.at === '2026-09-18T00:00:00Z' &&
  c3.__api.exSwapFor('Only In Cloud') === 'from another device',
  `got ${JSON.stringify(after['Only In Cloud'])} — a cloud shape exSwapFor cannot read is a dead value with a green gate`);

// ── [D] anonymous pushes nothing, via the guard ──
const c4 = makeCtx({ signedIn: false });
await c4.__api.pushExSwap('Deadlift', 'Trap Bar Deadlift', '2026-09-20T00:00:00Z');
check('[D1] anonymous pushes NOTHING to the cloud', c4.__calls.length === 0,
  `${c4.__calls.length} calls — look-around mode saves nothing`);
check('[D2] it RETURNS on the guard, rather than throwing into its own catch',
  c4.__warns.length === 0,
  `warned: ${JSON.stringify(c4.__warns)} — that is the catch block, not the guard (ex-notes [L2] precedent)`);
const c4b = makeCtx({ signedIn: false });
await c4b.__api.hydrateSwapsFromCloud(null);
check('[D3] hydrate without a uid is a silent no-op', c4b.__calls.length === 0 && c4b.__warns.length === 0);

// ── [E] clearHistory clears the CLOUD swaps too ──
const c5 = makeCtx();
await c5.__api.wipeCloudSwaps();
check('[E1] wipeCloudSwaps DELETEs by user_id, scoped to the signed-in user',
  c5.__calls.length === 1 && c5.__calls[0].op === 'delete' &&
  c5.__calls[0].eq.user_id === 'u1' && c5.__calls[0].eq.original_name === undefined,
  `got ${JSON.stringify(c5.__calls)}`);
const chAt = code.indexOf('function clearHistory(');
const chBody = chAt === -1 ? '' : code.slice(chAt, code.indexOf('\n}', chAt) + 2);
check('[E2] clearHistory() calls wipeCloudSwaps — otherwise the next hydrate resurrects every swap',
  /wipeCloudSwaps\(/.test(chBody),
  'tandem_swaps is cleared locally but the cloud rows survive, so "Clear all history" is a lie for swaps');
const c5b = makeCtx({ signedIn: false });
await c5b.__api.wipeCloudSwaps();
check('[E3] signed out, it deletes nothing', c5b.__calls.length === 0 && c5b.__warns.length === 0);

// ── [F] the reconciler is actually CALLED on both cloud paths ──
const fnRegion = (name) => {
  const at = Math.max(code.indexOf(`async function ${name}(`), code.indexOf(`function ${name}(`));
  return at === -1 ? '' : code.slice(at, code.indexOf('\n}', at) + 2);
};
for (const caller of ['restoreFromCloud', 'syncFromCloud']) {
  const body = fnRegion(caller);
  check(`[F:${caller}] awaits hydrateSwapsFromCloud()`,
    /await\s+hydrateSwapsFromCloud\(/.test(body),
    body ? 'the reconciler exists but this path never reaches it — swaps do not sync here'
         : `could not locate ${caller}() — has it been renamed?`);
}

console.log(failures === 0 ? '\nswap-cloud-smoke: PASS' : `\nswap-cloud-smoke: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
