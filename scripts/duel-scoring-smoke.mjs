#!/usr/bin/env node
/**
 * duel-scoring-smoke.mjs — BUG-265 guard. Static + vm, no browser.
 *
 * Kerwin, 2026-11-15, on the duel sheet: "The scoring system didn't change with the rule.
 * Still reads how like I didn't log a workout, then also says that I did, & counts skipped
 * workout as a workout." And on the Home duel card: "This also was supposed to be our 2
 * colors battling it out, not pink & grey?" His earlier ruling: "A skipped day should not
 * count as a workout that day. It should count as me skipping it".
 *
 *   [S1] duelSideColors(): each side is its own users.theme_color; identical picks fall back
 *        to grey on the partner side so the split stays readable.
 *   [S2] duelBarBackground(): a two-colour split sized by each side's share (30 v 100 ->
 *        23.1%), 50/50 at 0-0, both colours present.
 *   [S3] both renderers take colours from duelSideColors(), never grey a side's points by
 *        who is losing, and paint the bar with duelBarBackground() at full width.
 *   [S4] duelStreak() goes through liveStreak(): a streak last credited 10 days ago reads 0,
 *        one credited yesterday keeps its value; the duel's srcOf() uses it.
 *   [S5] the raw view column current_streak is read nowhere in the client and not selected.
 *   [S6] migrations/0028: the view counts a session only when completed AND not skipped or
 *        abandoned; theme_color is the user's own; the sweep boundary covers 2026-11-15;
 *        no account id; the sweep still writes only workout_sessions.
 * This gate CANNOT see Postgres. That 0028 was applied is checked live, not here.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(root, 'tandem.html'), 'utf8');
const code = html.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
const fails = [];
const check = (id, ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${id} ${msg}`); if (!ok) fails.push(id); };
const fn = (name) => { const m = html.match(new RegExp(`(?:async )?function ${name}\\([\\s\\S]*?\\n\\}`)); if (!m) throw new Error(`could not locate ${name}`); return m[0]; };
const slice = (name) => { const at = code.indexOf(`function ${name}(`); return at === -1 ? '' : code.slice(at, code.indexOf('\nfunction ', at + 1)); };

const ctx = { Date, Math, String, dashboardData: {} };
vm.createContext(ctx);
vm.runInContext(['localDateStr', 'liveStreak', 'duelSideColors', 'duelBarBackground', 'duelStreak'].map(fn).join('\n'), ctx);

{ // [S1]
  ctx.dashboardData = { userTargets: { theme_color: '#1B5E38' }, partnerTargets: { theme_color: '#e8547a' } };
  const a = ctx.duelSideColors();
  ctx.dashboardData = { userTargets: { theme_color: '#E8547A' }, partnerTargets: { theme_color: '#e8547a' } };
  const b = ctx.duelSideColors();
  check('[S1]', a.mine === '#1B5E38' && a.theirs === '#e8547a' && b.mine === '#E8547A' && b.theirs === '#888888',
    `own colours per side (${a.mine}/${a.theirs}); same pick -> partner grey (${b.mine}/${b.theirs})`);
}
{ // [S2]
  const c = { mine: '#1B5E38', theirs: '#e8547a' };
  const lose = ctx.duelBarBackground(30, 100, c), even = ctx.duelBarBackground(0, 0, c);
  check('[S2]', lose === 'linear-gradient(90deg, #1B5E38 0 23.1%, #e8547a 23.1% 100%)'
    && even.includes('50%') && even.includes(c.mine) && even.includes(c.theirs),
    `two-colour split: ${lose}`);
}
{ // [S3]
  const ok = ['renderDashboard', 'renderDuelSheet'].map(n => {
    const b = slice(n);
    return /duelSideColors\(\)/.test(b) && !/iWin \? myColor|!iWin \? theirColor/.test(b)
      && /PtsEl\.style\.color = myColor/.test(b) && /PtsEl\.style\.color = theirColor/.test(b);
  });
  const dash = slice('renderDashboard');
  const bar = /barFill\.style\.width = '100%'/.test(dash) && /barFill\.style\.background = duelBarBackground\(/.test(dash);
  check('[S3]', ok.every(Boolean) && bar, `both renderers use duelSideColors and keep each side's colour (${ok.join('/')}), bar split=${bar}`);
}
{ // [S4]
  const d = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return ctx.localDateStr(x); };
  ctx.dashboardData = { streakRows: { k: { current_streak_days: 2, last_session_date: d(10) }, y: { current_streak_days: 3, last_session_date: d(1) } } };
  const stale = ctx.duelStreak('k'), live = ctx.duelStreak('y'), none = ctx.duelStreak('nobody');
  const wired = /streak: duelStreak\(row\.user_id\)/.test(slice('renderDuelSheet'));
  check('[S4]', stale === 0 && live === 3 && none === 0 && wired, `stale streak -> ${stale}, yesterday -> ${live}, missing -> ${none}, duel wired=${wired}`);
}
{ // [S5]
  const reads = (code.match(/\bcurrent_streak\b(?!_)/g) || []).length;
  check('[S5]', reads === 0, `the view's raw current_streak is read ${reads} time(s) in client code`);
}
{ // [S6]
  const m = readFileSync(join(root, 'migrations', '0028_bug265_duel_scoring_source.sql'), 'utf8').replace(/--.*$/gm, '');
  const sessCte = (m.match(/sessions_this_week as \(([\s\S]*?)\)\s*,/) || [])[1] || '';
  const voidOut = /completed = true/.test(sessCte) && /not in \('skipped', 'abandoned'\)/.test(sessCte);
  const color = /coalesce\(u\.theme_color/.test(m) && !/'#1B5E38'::text as theme_color/.test(m);
  const since = /p_since timestamptz default '2026-11-15 00:00:00\+00'/.test(m);
  const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(m);
  const updates = [...m.matchAll(/\bupdate\s+([a-z_.]+)/gi)].map(x => x[1]);
  const invoker = /with \(security_invoker = on\)/.test(m);
  check('[S6]', voidOut && color && since && !uuid && invoker && updates.length > 0 && updates.every(t => t === 'public.workout_sessions'),
    `skips/abandons never score=${voidOut}, own colour=${color}, sweep covers today=${since}, no account id=${!uuid}, invoker=${invoker}, writes ${[...new Set(updates)].join(', ')}`);
}

if (fails.length) { console.log(`\nBUG-265 duel scoring smoke FAILED: ${fails.join(' ')}`); process.exit(1); }
console.log('\nBUG-265 duel scoring smoke: all assertions hold');
