// BUG-119b guard — home-tier one-off focus days must fill each requested isolation slot with an
// exercise whose PRIMARY mover is that muscle (D18's empty-pool fallback hides a bank gap by
// silently serving a different muscle). Runs getSingleDay against the real programs.js.
import fs from 'fs'; import vm from 'vm'; import { fileURLToPath } from 'url'; import path from 'path';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { console, window: {}, localStorage: { getItem() { return null }, setItem() {} }, sessionStorage: { getItem() { return null }, setItem() {} } };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'programs.js'), 'utf8') + ';this.__g=getSingleDay;this.__b=EXERCISE_BANK;', ctx);
const bank = Object.values(ctx.__b); const fails = [];
const prim = (e, m) => (e.muscleGroups.primary || []).includes(m);
// [A] bank coverage: home tier needs >=2 distinct bicep_brachii-primary isolations (arms focus asks for two bicep slots)
const homeBi = bank.filter(e => e.tier === 'home' && e.category === 'isolation' && prim(e, 'bicep_brachii'));
if (homeBi.length < 2) fails.push(`[A] home-tier bicep_brachii-primary isolations: ${homeBi.length} (<2)`);
// [B] arms focus home x20: the accessory block must contain >=2 distinct bicep_brachii-primary exercises
const byName = Object.fromEntries(bank.map(e => [e.name, e]));
for (let i = 0; i < 20; i++) {
  const d = ctx.__g('arms', { tier: 'home' });
  const names = d.blocks.flatMap(b => b.exs).map(x => x.name);
  const n = new Set(names.filter(nm => byName[nm] && prim(byName[nm], 'bicep_brachii'))).size;
  if (n < 2) { fails.push(`[B] arms/home run ${i}: ${n} bicep_brachii-primary exercise(s) in ${JSON.stringify(names)}`); break; }
}
// [C] shoulders focus home x20: some exercise is anterior_delt-primary (the 119b shoulders half)
for (let i = 0; i < 20; i++) {
  const d = ctx.__g('shoulders', { tier: 'home' });
  const names = d.blocks.flatMap(b => b.exs).map(x => x.name);
  if (!names.some(nm => byName[nm] && prim(byName[nm], 'anterior_delt'))) { fails.push(`[C] shoulders/home run ${i}: no anterior_delt-primary in ${JSON.stringify(names)}`); break; }
}
if (fails.length) { console.error('FAIL home-tier isolation coverage:\n' + fails.join('\n')); process.exit(1); }
console.log('PASS home-tier isolation coverage (>=2 bicep-primary, arms x20, shoulders x20)');
