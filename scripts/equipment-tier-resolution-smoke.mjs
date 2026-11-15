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
const html = readFileSync(join(root, 'tandem.html'), 'utf8');   // working tree, on purpose
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
  return html.slice(i, j + 1);
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

if (fails.length) {
  for (const f of fails.slice(0, 25)) console.error(`✗ ${f}`);
  if (fails.length > 25) console.error(`  … and ${fails.length - 25} more`);
  console.error(`FAIL equipment-tier-resolution-smoke: ${fails.length} violation(s) across ${cases} sweep cases + ${named.length} transitions`);
  process.exit(1);
}
console.log(`✓ resolveEquipmentTier honours its contract across ${cases} sweep cases (${staleCases} stale-baseline, ${absentCases} absent-baseline with an override set) and ${named.length} named transitions; session and durable tier tables agree`);
