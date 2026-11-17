#!/usr/bin/env node
/**
 * goal-chip-smoke.mjs — BUG-272 guard. The onboarding goal cards may only promise what the engine prescribes.
 * Static + vm, no browser.
 *
 * Why (handoff 2026-11-17, step 3): the five goal cards carried chips — "6–12 Reps", "2 min Rest",
 * "Wave Loading", "MRT Circuits" — that were never checked against the engine, and the hero-card
 * redesign made them the most prominent text on the screen. Checked 2026-11-17: Transform said
 * 8–15 reps (engine 8–12), Strength 1–5 reps and 85–100% 1RM (engine 2–5 and 85–95%), and three
 * chips named methods the engine does not have at all. A card is a claim about the program.
 *
 * Every chip must be one of the kinds below, and each kind is derived from its one home:
 *   "A–B Reps"           == min/max rep across PHASES[goal] (programs.js)
 *   "A–B sec|min Rest"   == min/max PHASES[goal].restComp, the primary-lift rest
 *   "A–B% 1RM"           == min/max PROGRESSION[goal] (tandem.html), rounded to whole percent
 *   "... Supersets"      only for goals SUPERSET_CFG pairs
 *   "Capped Volume"      only for maintenance (D8's MAV cap)
 *   "Zone 2 Cardio"      only when getProgram() actually attaches a cardio block for the goal
 *   "Heavy Compounds"    only when the PROGRESSION floor is >= 85% 1RM
 * An unknown chip FAILS: a new claim has to be given a derivation here before it can ship.
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(root, process.env.GOAL_CHIP_HTML || 'tandem.html'), 'utf8');
const progSrc = readFileSync(join(root, process.env.GOAL_CHIP_PROGRAMS || 'programs.js'), 'utf8');

const ctx = vm.createContext({ console: { log() {}, warn() {}, error() {} }, document: { querySelectorAll: () => [] }, window: {} });
vm.runInContext(progSrc + '\n;globalThis.__x = { PHASES, gp: getProgram };', ctx);
const { PHASES, gp } = ctx.__x;
// Zone 2: does the engine actually attach a cardio block for this goal, for either sex, on a
// 4-day full-gym intermediate program (men 25 lb to lose, so D32's fat_burn gate keeps it on)?
const hasZone2 = goal => ['female', 'male'].some(sex =>
  (gp(goal, 4, 12, sex, 'full_gym', 'balanced', null, null, null, 'intermediate', null, 60, 200, 175) || [])
    .some(day => (day.blocks || []).some(b => b.cardio)));

function extractConst(src, name) {
  const at = src.indexOf(`const ${name} = {`);
  if (at < 0) throw new Error(`cannot find const ${name}`);
  let i = src.indexOf('{', at), depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) return vm.runInNewContext('(' + src.slice(i, j + 1) + ')');
  }
  throw new Error(`unbalanced const ${name}`);
}
const PROGRESSION = extractConst(html, 'PROGRESSION');
const SUPERSET_CFG = extractConst(progSrc, 'SUPERSET_CFG');


const cards = [...html.matchAll(/selectGoal\('(\w+)',this\)">[\s\S]*?<div class="goal-tags">([\s\S]*?)<\/div>/g)]
  .map(m => ({ goal: m[1], chips: [...m[2].matchAll(/<span class="goal-tag">([^<]*)<\/span>/g)].map(x => x[1].trim()) }));

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); else console.log('  ok  ' + msg); };

ok(cards.length === 5 && new Set(cards.map(c => c.goal)).size === 5, `[G0] five goal cards found (${cards.map(c => c.goal).join(', ')})`);
const range = arr => [Math.min(...arr), Math.max(...arr)];
const num = s => Number(s.replace(/[^\d.]/g, ''));
const pair = (a, b) => (b == null ? [num(a), num(a)] : [num(a), num(b)]);

for (const { goal, chips } of cards) {
  const phases = PHASES[goal];
  if (!phases) { fails.push(`[G1] ${goal}: no PHASES row`); continue; }
  const reps = range(phases.flatMap(p => String(p.reps).split('·').map(Number)));
  const rest = range(phases.map(p => p.restComp));
  const pct = range(Object.values(PROGRESSION[goal] || {}).map(v => Math.round(v * 100)));
  for (const c of chips) {
    let m;
    if ((m = c.match(/^(\d+)(?:–(\d+))? Reps$/))) {
      const got = pair(m[1], m[2]);
      ok(got[0] === reps[0] && got[1] === reps[1], `[G2] ${goal}: "${c}" == PHASES reps ${reps.join('–')}`);
    } else if ((m = c.match(/^([\d.]+)(?:–([\d.]+))? (sec|min) Rest$/))) {
      const k = m[3] === 'min' ? 60 : 1;
      const got = pair(m[1], m[2]).map(v => v * k);
      ok(got[0] === rest[0] && got[1] === rest[1], `[G3] ${goal}: "${c}" == PHASES restComp ${rest.join('–')}s`);
    } else if ((m = c.match(/^(\d+)(?:–(\d+))?% 1RM$/))) {
      const got = pair(m[1], m[2]);
      ok(got[0] === pct[0] && got[1] === pct[1], `[G4] ${goal}: "${c}" == PROGRESSION ${pct.join('–')}%`);
    } else if (/ Supersets$/.test(c)) {
      ok(!!SUPERSET_CFG[goal], `[G5] ${goal}: "${c}" — SUPERSET_CFG pairs this goal`);
    } else if (c === 'Capped Volume') {
      ok(goal === 'maintenance', `[G6] ${goal}: "${c}" — only maintenance carries the MAV cap (D8)`);
    } else if (c === 'Zone 2 Cardio') {
      ok(hasZone2(goal), `[G7] ${goal}: "${c}" — getProgram attaches a cardio block`);
    } else if (c === 'Heavy Compounds') {
      ok(pct[0] >= 85, `[G8] ${goal}: "${c}" — PROGRESSION floor ${pct[0]}% >= 85%`);
    } else {
      fails.push(`[G9] ${goal}: "${c}" is not a chip kind this smoke can derive — give it a derivation before shipping it`);
    }
  }
}

if (fails.length) { console.log(`\nGoal-chip smoke FAILED:\n  ${fails.join('\n  ')}`); process.exit(1); }
console.log('\nGoal-chip smoke: every goal-card chip matches the engine');
