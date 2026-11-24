#!/usr/bin/env node
/**
 * dead-output-smoke.mjs — BUG-205 / BUG-204 guard: values the app computed and nothing read
 * stay deleted, the comment that misdescribed a data path stays honest, and the four outputs
 * that LOOK dead but are live stay in place.
 *
 * Reader map built 2026-11-21 at origin/main a808fab (tandem.html, programs.js, scripts/).
 * A gate script that asserts a value counts as a reader for this map, recorded apart from a
 * real consumer (BUG-202's lesson): ex.constant and ex.supersetGroup are read ONLY by gates
 * (scripts/authored-safety-smoke.mjs, scripts/doctrine.mjs D5/D8), so they were left, not
 * deleted, and are listed on BUG-204 instead.
 *
 * Reads the WORKING-TREE tandem.html and programs.js (never a git ref).
 *   T1  BUG-205 comment: the renderStrengthTrend block names both routes `est1rm` takes into
 *       local history (logSet() at log time; exercisesFromCloudSets() copying
 *       sets.estimated_1rm_lbs on hydrate, which is checked to be real), and the function itself
 *       reads `est1rm`, makes no Supabase call and calls no calcRM (so "reads the local copy,
 *       recomputes nothing" is true)
 *   T2  BUG-205 orphans stay gone: recentSetsFor() (zero callers) and finishSession()'s
 *       `const todayDate` (assigned, never read) — no declaration, no call, no stale pointer
 *   T3  BUG-204 discarded outputs stay gone:
 *         rotationContext() returns { week } only (run in vm) — buildDynamicProgram and
 *         applyDeload read rotation.week alone, so the phase lookup it used to pay for
 *         reached nothing; and getProgram output is identical for any rotation.phase
 *         (anti-vacuity: proves the field really was unread, not just removed)
 *         materializeTemplate() writes no day.authored, day.templateSlug or ex.role (no
 *         reader anywhere; isCore still derives from the template's own role)
 *         HERO_MOMENTS carries only keys some data-hero attribute actually requests
 *   T4  the report-and-leave list is intact (BUG-204's four exceptions): the drop-set flag and
 *       the drop_set technique tip, the pull_heavy / core_focused emphasis keys, the
 *       avatarStyle profile field, and EXERCISE_BANK videoId — deleting any of these would
 *       remove live or user-visible behaviour, which this batch may not do
 */
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(process.env.DEAD_OUTPUT_HTML || join(root, 'tandem.html'), 'utf8');   // working tree, on purpose
const code = readFileSync(process.env.DEAD_OUTPUT_PROGRAMS || join(root, 'programs.js'), 'utf8');
const fails = [];
const ok = (label, cond, detail = '') => { if (!cond) fails.push(`${label}${detail ? ` — ${detail}` : ''}`); };
const noComments = (s) => s.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
function grabFn(src, name) {
  const i = src.indexOf(`function ${name}(`);
  if (i < 0) return '';
  let depth = 0, j = src.indexOf('{', i);
  for (; j < src.length; j++) { if (src[j] === '{') depth++; else if (src[j] === '}' && --depth === 0) break; }
  return src.slice(i, j + 1);
}

// T1
const trendAt = html.indexOf('function renderStrengthTrend(');
const blockStart = html.lastIndexOf('renderStrengthTrend() —', trendAt);
const block = blockStart >= 0 ? html.slice(blockStart, trendAt) : '';
const trendFn = grabFn(html, 'renderStrengthTrend');
ok('T1 renderStrengthTrend and its comment block exist', trendAt >= 0 && blockStart >= 0 && trendFn.length > 0);
ok('T1 the comment names both routes est1rm takes into local history (logSet at log time, exercisesFromCloudSets on hydrate)',
  /logSet\(\) stamps it/.test(block) && /exercisesFromCloudSets\(\)\s*(?:\/\/\s*)?copies sets\.estimated_1rm_lbs/.test(block));
const ecs = noComments(grabFn(html, 'exercisesFromCloudSets'));
ok('T1 the hydrate route the comment names is real: exercisesFromCloudSets() maps estimated_1rm_lbs to est1rm',
  /est1rm\s*:[^\n]*estimated_1rm_lbs/.test(ecs));
ok('T1 the renderer reads est1rm', /\.est1rm\b/.test(trendFn));
ok('T1 the renderer makes no Supabase call and recomputes nothing', !/\bsb\.from\b|\bcalcRM\(|estimated_1rm_lbs/.test(noComments(trendFn)));

// T2
const htmlCode = noComments(html);
ok('T2 recentSetsFor() stays deleted (no declaration, no call)', !/\brecentSetsFor\s*\(/.test(htmlCode));
ok('T2 no comment still points at recentSetsFor() as a live function', !/recentSetsFor\(\) does/.test(html));
const finish = grabFn(html, 'finishSession');
ok('T2 finishSession() exists', finish.length > 0);
ok("T2 finishSession()'s unread `const todayDate` stays deleted", !/\bconst todayDate\b/.test(finish));

// T3 — rotationContext, run
const rc = grabFn(html, 'rotationContext');
ok('T3 rotationContext() exists', rc.length > 0);
if (rc) {
  const c = { currentWeek: 5, cfg: { goal: 'build_muscle', weeks: 12 }, getPhase() { throw new Error('rotationContext must not look up the phase'); }, scaledPhases() { throw new Error('rotationContext must not scale phases'); } };
  vm.createContext(c);
  let out = null, err = null;
  try { out = vm.runInContext(`${rc}\nrotationContext();`, c); } catch (e) { err = e; }
  ok('T3 rotationContext() does no phase lookup', !err, err && err.message);
  ok('T3 rotationContext() returns { week } only', out && JSON.stringify(Object.keys(out)) === '["week"]' && out.week === 5, JSON.stringify(out));
}
// T3 — getProgram ignores rotation.phase (the field was unread before it was removed)
const P = vm.runInNewContext(`(function(){ ${code}; return { getProgram, materializeTemplate: typeof materializeTemplate === 'function' ? materializeTemplate : null }; })()`, { console });
let phaseSame = 0, phaseDiff = 0;
for (const goal of ['build_muscle', 'fat_burn', 'transform', 'strength', 'maintenance'])
  for (const days of [3, 4, 5]) for (const week of [1, 7]) {
    const a = JSON.stringify(P.getProgram(goal, days, 12, 'M', 'full_gym', 'balanced', '', null, { week, phase: 0 }, 'intermediate'));
    const b = JSON.stringify(P.getProgram(goal, days, 12, 'M', 'full_gym', 'balanced', '', null, { week, phase: 3 }, 'intermediate'));
    if (a === b) phaseSame++; else phaseDiff++;
  }
ok('T3 getProgram output does not depend on rotation.phase', phaseDiff === 0, `${phaseDiff} of ${phaseSame + phaseDiff} programs changed with phase`);
// T3 — materializeTemplate's unread keys
const mt = noComments(grabFn(code, 'materializeTemplate'));
ok('T3 materializeTemplate() exists', mt.length > 0);
ok('T3 materializeTemplate() writes no day.authored', !/\bauthored\s*:/.test(mt));
ok('T3 materializeTemplate() writes no day.templateSlug', !/\btemplateSlug\s*:/.test(mt));
ok('T3 materializeTemplate() writes no ex.role (isCore still reads the template role)', !/[{,\s]role\s*:/.test(mt) && /isCore\s*:\s*ex\.role === 'core'/.test(mt));
// T3 — HERO_MOMENTS keys are all requested somewhere
const hm = html.match(/const HERO_MOMENTS = (\{[^}]*\});/);
ok('T3 HERO_MOMENTS exists', !!hm);
if (hm) {
  const keys = Object.keys(vm.runInNewContext(`(${hm[1]})`));
  const requested = new Set([...html.matchAll(/data-hero="([a-z]+)"/g)].map(m => m[1]));
  for (const k of keys) ok(`T3 HERO_MOMENTS.${k} is requested by a data-hero attribute`, requested.has(k));
  for (const r of requested) ok(`T3 data-hero="${r}" has a HERO_MOMENTS entry`, keys.includes(r));
}

// T4 — the four exceptions stay
ok('T4 flagDropSet() still sets the drop-set intensity', /function flagDropSet\(/.test(code) && /intensity\s*[:=]\s*'drop-set'/.test(code));
ok('T4 TECHNIQUE_TIPS.drop_set still renders', /const TECHNIQUE_TIPS = \{[\s\S]*?\bdrop_set\s*:/.test(html));
ok('T4 the pull_heavy and core_focused emphasis keys stay', /pull_heavy\s*:\s*'pull'/.test(code) && /core_focused\s*:\s*'core'/.test(code));
ok('T4 profile.avatarStyle stays (an override bug, not an unread value)', /profile\.avatarStyle/.test(html));
ok('T4 EXERCISE_BANK videoId stays (documented as authoritative)', (code.match(/videoId\s*:/g) || []).length >= 100);

if (fails.length) {
  for (const f of fails) console.error(`✗ ${f}`);
  console.error(`FAIL dead-output-smoke: ${fails.length} check(s)`);
  process.exit(1);
}
console.log(`✓ the strength-trend comment names the data it plots; recentSetsFor, todayDate, rotation.phase, day.authored, day.templateSlug, materialized ex.role and HERO_MOMENTS.pr stay deleted (getProgram identical across rotation.phase in ${phaseSame} programs); BUG-204's four live look-alikes are intact`);
