#!/usr/bin/env node
/**
 * ex-notes-smoke.mjs — BUG-195 regression guard: the notes textarea keeps notes.
 *
 * WHY THIS EXISTS
 * ---------------
 * The .ex-notes textarea shipped on every exercise of every session and its
 * .value was read NOWHERE — every reference was a CSS rule, the tag itself, or a
 * click-suppression guard. Everything typed into it was silently discarded on the
 * next render, and workout_sessions.notes was written as the literal null.
 *
 * It also starved its own schema, which is the part worth remembering:
 * `exercise_notes` (user_id, exercise_name) accumulated 0 rows because nothing
 * ever wrote to it; an audit then saw an empty table with "no reader, no writer"
 * and BUG-72 dropped it (0008_bug72_dead_object_cleanup.sql:148). The dead control
 * caused its own backing store to be garbage-collected, and the store's emptiness
 * was then used as evidence the feature was dead.
 *
 * HARD (fails the gate):
 *   [A] the textarea persists on input and hydrates on render
 *   [B] notes are keyed by exercise NAME, never by slot id
 *   [C] the key is account-scoped (in LS_SCOPED_KEYS, so sign-out clears it)
 *   [D] a real round-trip: save -> read back, per name, independently
 *   [E] clearing the box removes the entry rather than storing ''
 *   [F] note text is HTML-escaped — a literal </textarea> must not break out
 *
 * SCOPE, stated honestly: local persistence only. The cloud half needs
 * `exercise_notes` recreated, which is a migration and human-only in this repo.
 * This gate does NOT assert cloud sync, and nothing should claim it works until a
 * real round-trip against Postgres is verified.
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const raw = readFileSync(path.join(root, 'tandem.html'), 'utf8');
// SC-34: strip comments before matching — this file's own comments quote the
// anti-patterns being checked for.
const code = raw.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
const markup = raw.replace(/<!--[\s\S]*?-->/g, '');

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};

// ── [A] wired both ways ──
const ta = /<textarea class="ex-notes"[\s\S]{0,400}?<\/textarea>/.exec(markup);
check('[A0] the .ex-notes textarea still exists', !!ta);
const taSrc = ta ? ta[0] : '';
check('[A1] it persists on input (oninput -> saveExNote)', /oninput="saveExNote\(/.test(taSrc),
  'the textarea has no writer — anything typed is discarded on the next render');
check('[A2] it hydrates on render (inner value from exNoteFor)', /exNoteFor\(/.test(taSrc),
  'nothing reads the stored note back, so it never reappears');

// ── [B] keyed by name, not slot id ──
check('[B] keyed by exercise NAME, not slot id', /saveExNote\('\$\{\(ex\.name/.test(taSrc),
  "keying durable per-lift memory by ex.id is the churn bug lastsets-churn-smoke.mjs exists for");

// ── [C] account-scoped ──
check('[C] tandem_ex_notes is in LS_SCOPED_KEYS (sign-out clears it)',
  /LS_SCOPED_KEYS\s*=\s*\[[\s\S]*?'tandem_ex_notes'[\s\S]*?\]/.test(code),
  'an unscoped key would leak one account\'s notes into another on the same device');

// ── [D]-[F] run the real store ──
const grab = (name) => {
  const i = code.indexOf(`function ${name}(`);
  if (i === -1) { console.error(`could not find ${name}`); process.exit(1); }
  return code.slice(i, code.indexOf('\n}', i) + 2);
};
const store = {};
const ctx = { LS: { get: (k) => store[k], set: (k, v) => { store[k] = v; } } };
vm.createContext(ctx);
new vm.Script([grab('escNoteHtml'), grab('exNotesAll'), grab('exNoteFor'), grab('saveExNote'),
  'this.__api = { escNoteHtml, exNoteFor, saveExNote };'].join('\n')).runInContext(ctx);
const { escNoteHtml, exNoteFor, saveExNote } = ctx.__api;

saveExNote('Barbell Back Squat', '  knee felt tight on set 3  ');
saveExNote('Low Incline Barbell Press', 'went up 5lb');
check('[D1] a saved note reads back for its own lift',
  exNoteFor('Barbell Back Squat') === 'knee felt tight on set 3',
  `got ${JSON.stringify(exNoteFor('Barbell Back Squat'))} (also checks it is trimmed)`);
check('[D2] notes do not bleed between lifts',
  exNoteFor('Low Incline Barbell Press') === 'went up 5lb');
check('[D3] an unknown lift reads empty, not undefined',
  exNoteFor('Never Trained This') === '');

saveExNote('Barbell Back Squat', '   ');
check('[E] clearing the box deletes the entry (no stored empty string)',
  exNoteFor('Barbell Back Squat') === '' &&
  !Object.prototype.hasOwnProperty.call(store['tandem_ex_notes'], 'Barbell Back Squat'),
  `store still holds: ${JSON.stringify(store['tandem_ex_notes'])}`);

const nasty = '</textarea><script>x</script> & "quoted" <b>';
check('[F1] a literal </textarea> in a note cannot break out of the element',
  !/<\/textarea>/i.test(escNoteHtml(nasty)),
  `escaped to: ${escNoteHtml(nasty)}`);
check('[F2] ampersand escaped first (no double-encoding)',
  escNoteHtml('a & b') === 'a &amp; b' && escNoteHtml('<x>') === '&lt;x&gt;',
  `got ${escNoteHtml('a & b')} / ${escNoteHtml('<x>')}`);

// ── [G] clearable by a UI path ──
// BUG-91's own comment in clearHistory() records why this matters: a key omitted
// from that list survives the clear, outranks the now-empty stores, and cannot be
// removed by any UI path. Flagged by llm-council, 2026-09-30.
const ch = code.slice(code.indexOf('function clearHistory('));
check('[G] clearHistory() also clears tandem_ex_notes (BUG-91 precedent)',
  /'tandem_ex_notes'/.test(ch.slice(0, ch.indexOf('\n}') + 2)),
  'notes would survive a full history clear with no UI path to remove them');

console.log(failures === 0 ? '\nex-notes-smoke: PASS' : `\nex-notes-smoke: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
