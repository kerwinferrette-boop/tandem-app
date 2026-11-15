#!/usr/bin/env node
/**
 * equipment-label-mirror-smoke.mjs — BUG-132 guard: the setup card names the tier the engine uses.
 *
 * WHY THIS EXISTS: tandem.html has two readers of the equipment tier. resolveEquipmentTier()
 * (the engine's) has distrusted a stale sessionStorage override since BUG-118. The setup-card
 * restore block kept reading sessionStorage raw, so after a durable equipment change the card
 * said one tier while the workout was built from another; and its full_gym early-out never
 * repainted the label at all.
 *
 * Reads the WORKING-TREE tandem.html (never a git revision), extracts the tier constants, the
 * three tier functions and the restore label block, and runs them in node:vm against a fake
 * document across {eq_tier unset / each selector tier} x {baseline fresh / stale / absent} x
 * {each durable cfg.equipment value, and none}. For every case:
 *   M1  the .eq-btn marked active maps (EQ_TIER_TO_BANK) to resolveEquipmentTier()'s return
 *   M2  setupStatus names that same tier
 *   M3  eqActiveLabel is '' for full_gym, else names that same tier
 * The stale-baseline case is in the matrix explicitly and counted on its own line.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(root, 'tandem.html'), 'utf8');   // working tree, on purpose
const fails = [];

function grabConst(name) {
  const m = html.match(new RegExp(`const ${name} = [\\[{][\\s\\S]*?[\\]}];`));
  if (!m) fails.push(`could not extract const ${name}`);
  return m ? m[0] : '';
}
function grabFn(name, required = true) {
  const i = html.indexOf(`function ${name}(`);
  if (i < 0) { if (required) fails.push(`could not extract function ${name}`); return ''; }
  let depth = 0, j = html.indexOf('{', i);
  for (; j < html.length; j++) { if (html[j] === '{') depth++; else if (html[j] === '}' && --depth === 0) break; }
  return html.slice(i, j + 1);
}
// The label block, located by text that exists before AND after the fix, so reverting the fix
// in the working tree makes this guard go red rather than fail to extract.
function grabBlock() {
  const start = html.indexOf('const _eTier =');
  if (start < 0) { fails.push('could not find the restore label block (const _eTier =)'); return ''; }
  const endMarker = "lbs max` : ''}`;";
  let end = html.indexOf(endMarker, start);
  if (end < 0) { fails.push('could not find the end of the restore label block'); return ''; }
  end += endMarker.length;
  const rest = html.slice(end).match(/^\s*\n\s*}\s*\n/);   // pre-fix: the guard's closing brace
  if (rest && html.slice(start, end).includes('if (_eTier')) end += rest[0].length;
  return html.slice(start, end);
}

const src = [
  grabConst('EQ_NEEDS_DB'), grabConst('EQ_LABELS'), grabConst('EQ_TIER_TO_BANK'),
  grabConst('CFG_EQ_TO_BANK'), grabConst('EQ_TIER_TO_CFG'),
  grabFn('resolveEquipmentTier'), grabFn('selectorTierFromCfg'),
  grabFn('selectorTierForDisplay', false), grabFn('resolveMaxDb'),
].join('\n');
const block = grabBlock();

const SELECTOR = ['full_gym', 'standard_gym', 'hotel_full', 'hotel_small', 'dumbbells', 'bodyweight'];
const CFG_EQ = [null, 'full_gym', 'barbell_rack', 'home_dumbbells', 'bodyweight'];

function run(sessTier, baselineMode, cfgEq) {
  const store = {};
  if (sessTier) store.eq_tier = sessTier;
  if (baselineMode === 'fresh') store.eq_tier_baseline = cfgEq || '';
  if (baselineMode === 'stale') store.eq_tier_baseline = cfgEq === 'bodyweight' ? 'full_gym' : 'bodyweight';
  const el = (id) => ({ id, textContent: 'STALE-RENDER', value: '', classList: { s: new Set(['show']), add(c) { this.s.add(c); }, remove(c) { this.s.delete(c); }, toggle(c, on) { on ? this.s.add(c) : this.s.delete(c); } } });
  const nodes = { setupStatus: el('setupStatus'), eqActiveLabel: el('eqActiveLabel'), eqDbRow: el('eqDbRow'), eqDbWeight: el('eqDbWeight') };
  const btns = SELECTOR.map(t => ({ dataset: { tier: t }, classList: { on: t === 'full_gym', toggle(c, v) { this.on = !!v; } } }));
  const ctx = {
    cfg: cfgEq ? { equipment: cfgEq } : {},
    sessionStorage: { getItem: k => (k in store ? store[k] : null) },
    document: { getElementById: id => nodes[id] || null, querySelectorAll: () => btns },
  };
  vm.runInNewContext(`${src}\n;(function(){ ${block} })(); this.__resolved = resolveEquipmentTier(); this.__b = EQ_TIER_TO_BANK; this.__l = EQ_LABELS;`, ctx);
  const active = btns.filter(b => b.classList.on).map(b => b.dataset.tier);
  return { resolved: ctx.__resolved, active, status: nodes.setupStatus.textContent, label: nodes.eqActiveLabel.textContent, EQ: { b: ctx.__b, l: ctx.__l } };
}

let cases = 0, staleCases = 0, staleBad = 0;
if (!fails.length) {
  for (const sess of [null, ...SELECTOR]) for (const bm of ['fresh', 'stale', 'absent']) for (const cfgEq of CFG_EQ) {
    if (!sess && bm !== 'absent') continue;
    cases++; if (bm === 'stale') staleCases++;
    const r = run(sess, bm, cfgEq);
    const tag = `eq_tier=${sess} baseline=${bm} cfg.equipment=${cfgEq} -> engine ${r.resolved}`;
    const before = fails.length;
    if (r.active.length !== 1 || r.EQ.b[r.active[0]] !== r.resolved) fails.push(`M1 ${tag}: active button [${r.active}]`);
    const named = Object.keys(r.EQ.l).find(k => r.EQ.l[k] === r.status);
    if (!named || r.EQ.b[named] !== r.resolved) fails.push(`M2 ${tag}: setupStatus "${r.status}"`);
    if (r.resolved === 'full_gym' && named === 'full_gym' ? r.label !== '' : !(named && r.label.startsWith(`Active: ${r.EQ.l[named]}`)))
      fails.push(`M3 ${tag}: eqActiveLabel "${r.label}"`);
    if (bm === 'stale' && fails.length > before) staleBad++;
  }
}
console.log(`EQUIPMENT LABEL MIRROR (BUG-132): ${cases} cases, ${staleCases} with a STALE baseline (${staleBad} disagreeing)`);
if (fails.length) {
  console.log(`FAIL — ${fails.length} problem(s); first 10:`);
  fails.filter(f=>f.startsWith("M1") && f.includes("stale")).concat(fails).slice(0, 10).forEach(f => console.log('  ' + f));
  process.exit(1);
}
console.log('PASS — the setup card names the tier resolveEquipmentTier() builds from, stale baseline included.');
