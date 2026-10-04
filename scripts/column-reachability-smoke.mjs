#!/usr/bin/env node
/**
 * column-reachability-smoke.mjs — the READS-SIDE gate. (SC-34's enforcement.)
 *
 * WHY THIS EXISTS
 * ---------------
 * scripts/audit-dead-handlers.mjs only ever tested the WRITE side: it scores a
 * handler "Generative" for assigning to a global (:82), for calling a
 * calc/render/save-named function (:84), or for containing any sb.from( (:81).
 * None of those asks whether anything READS the value. On that basis EPIC-40
 * reported 1 dead handler out of 159 and the colour-theme path was declared
 * "fully wired" because it upserts users.color_theme — a column read by nothing.
 * A reads-side sweep (docs/control-reachability-audit-2026-09-30.md) found ~40
 * chain breaks. This gate stops that class from recurring silently.
 *
 * WHAT IT CHECKS
 * --------------
 * Every column this app WRITES (keys of .insert/.upsert/.update payloads in
 * tandem.html) must have at least one READ: a property access, a bracket access,
 * a name in a .select() list, or a PostgREST filter column. Anything written and
 * never read is reported.
 *
 * WHAT IT IS NOT — READ THIS BEFORE ADDING AN ENTRY
 * -------------------------------------------------
 * It is STATIC and client-only. It cannot see Postgres, so it CANNOT know that a
 * column is read by a trigger, a view, or an RLS policy. Several columns here are
 * read exactly that way and are NOT defects — that is what SERVER_SIDE below is
 * for, and each of those entries was verified by querying pg_proc / pg_policy,
 * not assumed. Building this gate is what caught two columns the 2026-09-30 audit
 * had WRONGLY listed as write-only (sets.estimated_1rm_lbs and
 * workout_sessions.total_volume_lbs — both read by triggers); that correction is
 * recorded in the audit doc. Do not add a SERVER_SIDE entry without naming the
 * database object that reads it and how you confirmed it.
 *
 * THE RATCHET (same shape as reachability-smoke.mjs)
 * --------------------------------------------------
 * HARD (fails the gate):
 *   [A] no NEW write-only column beyond ALLOW
 *   [B] every ALLOW entry still reproduces — a stale allowlist fails too, so the
 *       ratchet only turns one way. Fix a column, and you must remove its entry.
 *   [C] self-test: the detector must still catch the four known-dead fixtures.
 *       This exists because the first three drafts of this detector each produced
 *       a reassuringly short list by accident (one counted a console.warn string
 *       as a read). A low finding count from a weak detector is indistinguishable
 *       from a healthy codebase — SC-34's actual lesson.
 */
import fs from 'fs';

// ── Columns that are written and not read BY THE CLIENT, with why that is OK ──
// SERVER_SIDE: verified 2026-09-30 against pg_proc/pg_policy on project
// zsvktcvqmppsshtpeljt. These are real reads; the gate simply cannot see them.
const SERVER_SIDE = {
  'personal_records.achieved_reps':        'trigger sets_apply_1rm_and_pr',
  'personal_records.achieved_weight_lbs':  'trigger sets_apply_1rm_and_pr',
  // `sets.estimated_1rm_lbs` sat here (trigger sets_apply_1rm_and_pr). Removed
  // 2026-09-30: BUG-209's history restore reads it CLIENT-side now, so the gate can
  // see the read itself and the exemption no longer reproduces. The trigger read was
  // real and still is — the entry is simply no longer needed.
  'workout_sessions.backdated':            'trigger streak_recompute (streak exclusion)',
  'workout_sessions.total_volume_lbs':     'trigger streak_recompute',
  'workout_templates.author_id':           'RLS: templates_select/write, blocks_*, days_*, exs_*',
};
// KNOWN_OPEN: genuine chain breaks, each with its tracker row. Removing an entry
// is the deliberate act of closing it.
const KNOWN_OPEN = {
  'personal_records.week_targets':      'BUG-202 (D5) — written, read by nothing, yet ASSERTED by calibration-upsert-smoke.mjs:119',
  'users.calibration_session_id':       'BUG-202 (D5)',
  'users.color_theme':                  'BUG-197 (D9) — readers use theme_color; three homes for one rule',
  'workout_sessions.notes':             'BUG-205 (D15) — holds real journal text with no read path; D6 shape on another surface',
  'workout_sessions.phase_name':        'BUG-205 (D15)',
  // `workout_sessions.week_number` CLOSED 2026-09-30 by BUG-209: the history restore
  // reads it into the row's `week`, which is what the History modal's "Wk3" badge
  // renders. It was write-only for the same reason the lifts were missing — nothing
  // ever read a cloud session row back.
  'workout_sessions.duration_minutes':  'BUG-205 (D15) — candidate denormalisation, not necessarily dead',
  'sets.exercise_category':             'BUG-205 (D15) — found by this gate, added to that row 2026-09-30',
  'users.start_weight_lbs':             'BUG-205 (D15) — found by this gate, added to that row 2026-09-30',
  'personal_records.updated_at':        'BUG-205 (D15) — audit timestamp, likely keep; verdict owed',
  'agent_log.resolved_at':              'BUG-205 (D15) — audit timestamp written by resolveQAItem; likely keep',
};
const ALLOW = { ...SERVER_SIDE, ...KNOWN_OPEN };

// The detector's self-test runs against a SYNTHETIC snippet, not against live
// columns. An earlier draft used four real columns as fixtures; that is wrong,
// because fixing any of them would then fail the self-test forever and pressure
// the next person to weaken it. The synthetic case has a known answer that never
// changes: `dead_col` is written and never read, `live_col` is written and read
// back, so the matcher must report exactly one.
const SELF_TEST_SRC = `
  await sb.from('t').insert({ dead_col: 1, live_col: 2 });
  console.warn('dead_col persist skipped');   // a log string is NOT a read
  const x = row.live_col;
`;

function analyze(rawSrc) {
// Strip whole-line comments: prose that names a column is not a read of it.
const code = rawSrc.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');

// 1. Every write payload, with the table it targets.
const writes = [];
const re = /\.(insert|upsert|update)\(\s*\{/g;
let m;
while ((m = re.exec(code))) {
  let i = code.indexOf('{', m.index), d = 0, j = i;
  for (; j < code.length; j++) {
    if (code[j] === '{') d++;
    else if (code[j] === '}') { d--; if (!d) break; }
  }
  const before = code.slice(Math.max(0, m.index - 300), m.index);
  const t = [...before.matchAll(/\.from\(\s*'([a-z_]+)'/g)].pop();
  writes.push({ table: t ? t[1] : '?', body: code.slice(i, j + 1) });
}

// 2. Top-level keys of a payload object literal.
function payloadKeys(body) {
  const out = []; let d = 0;
  for (let k = 0; k < body.length; k++) {
    const c = body[k];
    if (c === '{' || c === '[' || c === '(') d++;
    else if (c === '}' || c === ']' || c === ')') d--;
    else if (d === 1) {
      const mm = /^([A-Za-z_][A-Za-z0-9_]*)\s*:/.exec(body.slice(k));
      if (mm && (k === 0 || /[{,\s]/.test(body[k - 1]))) { out.push(mm[1]); k += mm[0].length - 1; }
    }
  }
  return out;
}

const written = new Map();
for (const w of writes) {
  for (const k of payloadKeys(w.body)) {
    if (!written.has(k)) written.set(k, new Set());
    written.get(k).add(w.table);
  }
}

// 3. Read surfaces. Only select() lists and PostgREST filter args count as
//    string reads — an earlier draft counted ANY string containing the name and
//    a console.warn('week_targets persist skipped') masked a real dead column.
const selectCols = new Set(
  [...code.matchAll(/\.select\(\s*['"]([^'"]*)['"]/g)]
    .map(x => x[1]).join(',').split(/[\s,()]+/).filter(Boolean));
const filterCols = new Set(
  [...code.matchAll(/\.(?:eq|neq|gt|gte|lt|lte|is|in|not|like|ilike|order|contains|overlaps|filter)\(\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g)]
    .map(x => x[1]));

function isRead(col) {
  if (selectCols.has(col) || filterCols.has(col)) return true;
  // property access, but not the `col:` key position (that is the write itself)
  if (new RegExp(`\\.${col}\\b(?!\\s*:)`).test(code)) return true;
  if (new RegExp(`\\[\\s*['"]${col}['"]\\s*\\]`).test(code)) return true;
  return false;
}

const deadNow = new Set();
for (const [col, tables] of written) {
  if (!isRead(col)) for (const t of tables) deadNow.add(`${t}.${col}`);
}
return { deadNow, writes, written };
}

const html = fs.readFileSync(new URL('../tandem.html', import.meta.url), 'utf8');
const { deadNow, writes, written } = analyze(html);

let failed = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failed++; };

console.log(`write payloads: ${writes.length} · distinct written columns: ${written.size}`);
console.log(`write-only columns detected: ${deadNow.size} (allowlisted: ${Object.keys(ALLOW).length})\n`);

// [C] self-test first — if the detector is broken, nothing else means anything.
const st = analyze(SELF_TEST_SRC).deadNow;
const stOk = st.has('t.dead_col') && !st.has('t.live_col') && st.size === 1;
if (!stOk) fail(`[C] detector self-test FAILED — the matcher is broken or has been weakened. Expected exactly {t.dead_col}, got {${[...st].join(', ')}}`);
else console.log('  ok    [C] detector self-test (synthetic: catches the dead column, ignores the read one and the log string)');

// [A] nothing new
const novel = [...deadNow].filter(c => !ALLOW[c]).sort();
if (novel.length) {
  fail(`[A] ${novel.length} NEW write-only column(s) — each is written by the app and read by nothing:`);
  for (const c of novel) console.log(`          ${c}`);
  console.log('        If a trigger/view/RLS policy reads it, add it to SERVER_SIDE naming that object');
  console.log('        (verify with pg_proc/pg_policy — do not assume). Otherwise file it and add to KNOWN_OPEN.');
} else console.log('  ok    [A] no new write-only columns');

// [B] no stale allowlist
const stale = Object.keys(ALLOW).filter(c => !deadNow.has(c)).sort();
if (stale.length) {
  fail(`[B] ${stale.length} allowlist entry/entries no longer reproduce — remove them (the ratchet turns one way):`);
  for (const c of stale) console.log(`          ${c}  (${ALLOW[c]})`);
} else console.log('  ok    [B] every allowlist entry still reproduces');

console.log('\nOPEN, carried deliberately:');
for (const [c, why] of Object.entries(KNOWN_OPEN)) if (deadNow.has(c)) console.log(`  · ${c} — ${why}`);

console.log(failed === 0 ? '\ncolumn-reachability-smoke: PASS' : `\ncolumn-reachability-smoke: ${failed} FAILURE(S)`);
process.exit(failed === 0 ? 0 : 1);
