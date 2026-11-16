#!/usr/bin/env node
/**
 * rest-day-suggestion-smoke.mjs — BUG-160 guard: a rest day shows a light, display-only
 * suggestion unless the Settings choice turns it off.
 *
 * Kerwin 2026-11-15, "C, but build A": a choice in Settings, with the light suggestion (a walk
 * or mobility work) built and on by default. The approval rules out logging or crediting rest-day
 * work and any new volume or intensity number.
 *
 * Reads the WORKING-TREE tandem.html and checks, by running the extracted code in node:vm where
 * it can and by static reads where it must:
 *   R1  default on: a cfg with no restDaySuggestion (and null, as cfgFromUserRow carries it)
 *       gets a suggestion; restDaySuggestion === false gets none
 *   R2  the onboarding secondary goal picks the line: improve_mobility -> the mobility line,
 *       every other value (run_5k, 10k_steps, none, unset) -> the walk line
 *   R3  content stays inside what Kerwin named (walk, stretching, mobility, yoga): every line
 *       names one of them, and the only number is his own "30-minute"
 *   R4  display only: restDaySuggestionText writes nothing (no LS/sb/sync/log call), and the
 *       hero's rest branch renders it — run against a fake DOM for both settings
 *   R5  the Settings control exists, both pills call setRestDaySuggestion, the modal hydrates
 *       them, and the setter persists only cfg.restDaySuggestion
 *   R6  the choice survives a cloud rebuild: cfgFromUserRow carries it (run, not read)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(root, 'tandem.html'), 'utf8');   // working tree, on purpose
const fails = [];
const ok = (label, cond, detail = '') => { if (!cond) fails.push(`${label}${detail ? ` — ${detail}` : ''}`); };

function grabConst(name) {
  const m = html.match(new RegExp(`const ${name} = [\\[{][\\s\\S]*?[\\]}];`));
  ok(`extract const ${name}`, !!m);
  return m ? m[0] : '';
}
function grabFn(name) {
  const i = html.indexOf(`function ${name}(`);
  if (i < 0) { ok(`extract function ${name}`, false); return ''; }
  let depth = 0, j = html.indexOf('{', i);
  for (; j < html.length; j++) { if (html[j] === '{') depth++; else if (html[j] === '}' && --depth === 0) break; }
  return html.slice(i, j + 1);
}

const tableSrc = grabConst('REST_DAY_SUGGESTIONS');
const textSrc = grabFn('restDaySuggestionText');
const setterSrc = grabFn('setRestDaySuggestion');
const heroSrc = grabFn('renderDashHero');
const builderSrc = grabFn('cfgFromUserRow');
const openSrc = grabFn('openProfileModal');
if (fails.length) { for (const f of fails) console.error(`✗ ${f}`); process.exit(1); }

// R1-R3: run the table + helper
const ctx = {};
vm.createContext(ctx);
vm.runInContext(`${tableSrc}\n${textSrc}\nthis.__t = { REST_DAY_SUGGESTIONS, restDaySuggestionText };`, ctx);
const { REST_DAY_SUGGESTIONS: T, restDaySuggestionText: txt } = ctx.__t;
ok('R1 unset counts as on', !!txt({}));
ok('R1 null (carried value) counts as on', !!txt({ restDaySuggestion: null }));
ok('R1 explicit true is on', !!txt({ restDaySuggestion: true }));
ok('R1 false turns it off', txt({ restDaySuggestion: false }) === null);
ok('R2 improve_mobility -> mobility line', txt({ secondary_goal: 'improve_mobility' }) === T.mobility);
for (const g of ['run_5k', '10k_steps', 'none', null, undefined])
  ok(`R2 secondary_goal ${g} -> walk line`, txt({ secondary_goal: g }) === T.walk);
const NAMED = /\b(walk|stretch\w*|mobility|yoga)\b/i;
for (const [k, line] of Object.entries(T)) {
  ok(`R3 line "${k}" names a modality Kerwin named`, NAMED.test(line), line);
  const nums = (line.match(/\d+(?:[-\s]\w+)?/g) || []);
  ok(`R3 line "${k}" has no number but "30-minute"`, nums.every(n => n === '30-minute'), nums.join(', '));
}

// R4: display only
ok('R4 restDaySuggestionText writes nothing',
  !/\b(LS\.set|sb\.from|syncToCloud|logSet|finishSession|localStorage|fetch)\b/.test(textSrc));
const restBranch = heroSrc.slice(heroSrc.indexOf("dayKey === 'rest'"), heroSrc.indexOf('return;', heroSrc.indexOf("dayKey === 'rest'")));
ok('R4 the hero rest branch reads restDaySuggestionText(cfg)', /restDaySuggestionText\(cfg\)/.test(restBranch));
ok('R4 the hero rest branch writes nothing',
  !/\b(LS\.set|sb\.from|syncToCloud|logSet|finishSession)\b/.test(restBranch));
function runHero(cfgValue) {
  const els = {};
  const el = () => ({ textContent: '', innerHTML: '', append() {} });
  for (const id of ['dashHeroTitle', 'dashHeroMeta', 'dashHeroSub', 'dashHeroChips', 'dashHeroCta']) els[id] = el();
  const c = {
    cfg: cfgValue,
    document: { getElementById: id => els[id] || null, createElement: () => el() },
    applyHeroImages() {},
    getWeekSchedule: () => ({ program: [], labelFor: () => '' }),
    getProgramDayLabel: () => ({ dayKey: 'rest', num: 3, denom: 7 }),
  };
  vm.createContext(c);
  vm.runInContext(`${tableSrc}\n${textSrc}\n${heroSrc}\nrenderDashHero();`, c);
  return els;
}
const on = runHero({ secondary_goal: '10k_steps' });
ok('R4 hero shows the walk suggestion by default', on.dashHeroSub.textContent.startsWith(T.walk), on.dashHeroSub.textContent);
ok('R4 hero keeps the Rest & Recover title', on.dashHeroTitle.textContent === 'Rest & Recover');
const offEls = runHero({ restDaySuggestion: false, secondary_goal: '10k_steps' });
ok('R4 hero shows no suggestion when off', !offEls.dashHeroSub.textContent.includes('Suggestion'), offEls.dashHeroSub.textContent);
const mob = runHero({ secondary_goal: 'improve_mobility' });
ok('R4 hero shows the mobility line for improve_mobility', mob.dashHeroSub.textContent.startsWith(T.mobility));

// R5: the Settings control
const row = html.match(/<div class="profile-pill-row" id="profileRestDayRow">([\s\S]*?)<\/div>/);
ok('R5 Profile has the Rest Days pill row', !!row);
if (row) {
  ok('R5 "suggest" pill calls setRestDaySuggestion(true)', /data-restday="suggest"[^>]*onclick="setRestDaySuggestion\(true\)"/.test(row[1]));
  ok('R5 "blank" pill calls setRestDaySuggestion(false)', /data-restday="blank"[^>]*onclick="setRestDaySuggestion\(false\)"/.test(row[1]));
}
ok('R5 openProfileModal hydrates the rest-day pills', /#profileRestDayRow/.test(openSrc));
const cfgWrites = [...setterSrc.matchAll(/\bcfg\.([a-zA-Z_]\w*)\s*=(?!=)/g)].map(m => m[1]);
ok('R5 the setter writes only cfg.restDaySuggestion', cfgWrites.length === 1 && cfgWrites[0] === 'restDaySuggestion', cfgWrites.join(', '));
ok('R5 the setter persists to tandem_cfg', /LS\.set\('tandem_cfg', cfg\)/.test(setterSrc));
ok('R5 the setter makes no cloud or log write', !/\b(sb\.from|syncToCloud|logSet|finishSession)\b/.test(setterSrc));

// R6: carried across a cloud rebuild
const b = {};
vm.createContext(b);
vm.runInContext(`function canonicalGoal(g){return g;}\n${builderSrc}\nthis.__b = cfgFromUserRow;`, b);
const row1 = { program_goal: 'transform', program_days_per_week: 4 };
ok('R6 an "off" choice survives cfgFromUserRow', b.__b(row1, { restDaySuggestion: false }).restDaySuggestion === false);
ok('R6 no choice stays unset (= on)', b.__b(row1, {}).restDaySuggestion == null);

if (fails.length) {
  for (const f of fails) console.error(`✗ ${f}`);
  console.error(`FAIL rest-day-suggestion-smoke: ${fails.length} check(s)`);
  process.exit(1);
}
console.log('✓ rest days show a display-only suggestion by default (walk, or mobility for improve_mobility), Settings can turn it off, the choice persists locally and survives a cloud rebuild, and nothing is logged or credited');
