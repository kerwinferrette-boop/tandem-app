#!/usr/bin/env node
/**
 * ex-notes-smoke.mjs — BUG-195 regression guard: the notes textarea keeps notes,
 * locally AND across devices.
 *
 * WHY THIS EXISTS
 * ---------------
 * The .ex-notes textarea shipped on every exercise of every session and its
 * .value was read NOWHERE — every reference was a CSS rule, the tag itself, or a
 * click-suppression guard. Everything typed was silently discarded.
 *
 * It also starved its own schema, which is the part worth remembering:
 * `exercise_notes` (user_id, exercise_name) accumulated 0 rows because nothing
 * ever wrote to it; an audit then saw an empty table with "no reader, no writer"
 * and BUG-72 dropped it (0008_bug72_dead_object_cleanup.sql:148). The dead control
 * caused its own backing store to be garbage-collected, and that emptiness was
 * then used as evidence the feature was dead. Migration 0022 restored the table.
 *
 * HARD (fails the gate):
 *   [A] the textarea persists on input and hydrates on render
 *   [B] notes are keyed by exercise NAME, never by slot id
 *   [C] the key is account-scoped (in LS_SCOPED_KEYS, so sign-out clears it)
 *   [D] round-trip through the local store, per name, independently
 *   [E] clearing removes the entry rather than storing ''
 *   [F] note text is HTML-escaped — a literal </textarea> must not break out
 *   [G] clearHistory() clears it (BUG-91's precedent: a key omitted from that list
 *       survives the clear with no UI path to remove it)
 *   [H] the cloud push is DEBOUNCED — oninput fires per keystroke
 *   [I] a cleared note DELETEs its row (leave it and the next hydrate resurrects
 *       the note the user just deleted)
 *   [J] hydrate is TWO-WAY newest-wins: cloud newer pulls down, local newer pushes up
 *   [K] a legacy bare-string note (written before the cloud half) normalizes and
 *       loses to a timestamped cloud copy
 *   [L] anonymous pushes NOTHING — "look-around mode saves nothing" is a ruling
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const raw = readFileSync(path.join(root, 'tandem.html'), 'utf8');
// SC-35: strip comments before matching — this file's comments quote the patterns.
const code = raw.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
const markup = raw.replace(/<!--[\s\S]*?-->/g, '');

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};

// ── [A]-[C], [G] static wiring ──
const ta = /<textarea class="ex-notes"[\s\S]{0,400}?<\/textarea>/.exec(markup);
check('[A0] the .ex-notes textarea still exists', !!ta);
const taSrc = ta ? ta[0] : '';
check('[A1] it persists on input (oninput -> saveExNote)', /oninput="saveExNote\(/.test(taSrc),
  'no writer — anything typed is discarded on the next render');
check('[A2] it hydrates on render (inner value from exNoteFor)', /exNoteFor\(/.test(taSrc),
  'nothing reads the stored note back, so it never reappears');
// The key must be ex.name and must NOT be ex.id — asserted both ways, because the
// interpolation is wrapped (escNoteKey, [P] below) and a pattern pinned to the old
// unwrapped spelling would have failed on correct code instead of catching a real regression.
const keyExpr = /saveExNote\('\$\{([^}]*)\}'/.exec(taSrc);
check('[B] keyed by exercise NAME, not slot id',
  !!keyExpr && /\bex\.name\b/.test(keyExpr[1]) && !/\bex\.id\b/.test(keyExpr[1]),
  `key expression is ${JSON.stringify(keyExpr && keyExpr[1])} — keying durable per-lift memory by ex.id is the churn bug lastsets-churn-smoke.mjs exists for`);
check('[C] tandem_ex_notes is in LS_SCOPED_KEYS (sign-out clears it)',
  /LS_SCOPED_KEYS\s*=\s*\[[\s\S]*?'tandem_ex_notes'[\s\S]*?\]/.test(code),
  "an unscoped key would leak one account's notes to another on a shared device");
const ch = code.slice(code.indexOf('function clearHistory('));
check('[G] clearHistory() also clears tandem_ex_notes (BUG-91 precedent)',
  /'tandem_ex_notes'/.test(ch.slice(0, ch.indexOf('\n}') + 2)),
  'notes would survive a full history clear with no UI path to remove them');

// ── run the real store + the real cloud functions ──
// ONE contiguous slice, not per-function grabs. `exNoteFor` is a one-liner, so a
// per-function grab that ends at the next line-start `}` swallowed everything
// through pushExNote — including `const _exNoteTimers`, which this harness then
// re-declared, and the whole script died on a duplicate-declaration SyntaxError.
// Taking the region from escNoteKey through wipeCloudNotes/hydrateNotesFromCloud gets the
// module-scope consts for free and cannot desync from the shipped source.
const blockStart = code.indexOf('function escNoteKey(');
const blockEnd = code.indexOf('function clearHistory(');
if (blockStart === -1 || blockEnd <= blockStart) {
  console.error('FAIL  could not slice the notes block (escNoteKey … clearHistory) — has it moved?');
  process.exit(1);
}
const NOTES_SRC = code.slice(blockStart, blockEnd);
for (const needed of ['escNoteKey', 'exNotesAll', 'exNoteFor', '_exNoteTimers', 'EX_NOTE_PUSH_MS',
  'saveExNote', 'pushExNote', 'wipeCloudNotes', 'hydrateNotesFromCloud']) {
  if (!NOTES_SRC.includes(needed)) {
    console.error(`FAIL  the sliced notes block is missing ${needed} — the slice bounds are wrong`);
    process.exit(1);
  }
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
    LS: { get: (k) => store[k], set: (k, v) => { store[k] = v; } },
    currentUser: signedIn ? { id: 'u1' } : null,
    sb: { from: table },
    __store: store, __calls: calls, __cloudRows: [], __warns: warns,
  };
  vm.createContext(ctx);
  new vm.Script(NOTES_SRC +
    '\nthis.__api = { escNoteHtml, escNoteKey, exNoteFor, exNotesAll, saveExNote, pushExNote, wipeCloudNotes, hydrateNotesFromCloud, _exNoteTimers };'
  ).runInContext(ctx);
  return ctx;
}

const c1 = makeCtx();
const { escNoteHtml, exNoteFor, saveExNote } = c1.__api;

saveExNote('Barbell Back Squat', '  knee felt tight on set 3  ');
saveExNote('Low Incline Barbell Press', 'went up 5lb');
check('[D1] a saved note reads back for its own lift, trimmed',
  exNoteFor('Barbell Back Squat') === 'knee felt tight on set 3',
  `got ${JSON.stringify(exNoteFor('Barbell Back Squat'))}`);
check('[D2] notes do not bleed between lifts', exNoteFor('Low Incline Barbell Press') === 'went up 5lb');
check('[D3] an unknown lift reads empty, not undefined', exNoteFor('Never Trained This') === '');
check('[D4] the stored entry carries a timestamp (newest-wins needs one)',
  !!c1.__store['tandem_ex_notes']['Barbell Back Squat'].at,
  'without `at`, a cloud hydrate cannot decide which side is newer');

saveExNote('Barbell Back Squat', '   ');
check('[E] clearing the box deletes the entry (no stored empty string)',
  exNoteFor('Barbell Back Squat') === '' &&
  !Object.prototype.hasOwnProperty.call(c1.__store['tandem_ex_notes'], 'Barbell Back Squat'));

const nasty = '</textarea><script>x</script> & "q" <b>';
check('[F1] a literal </textarea> cannot break out of the element', !/<\/textarea>/i.test(escNoteHtml(nasty)),
  `escaped to: ${escNoteHtml(nasty)}`);
check('[F2] ampersand escaped first (no double-encoding)',
  escNoteHtml('a & b') === 'a &amp; b' && escNoteHtml('<x>') === '&lt;x&gt;');

// ── [P] the note KEY is safe in the oninput ATTRIBUTE, not just the textarea body ──
// [F] covers the body. The key goes into a single-quoted JS string inside a double-quoted
// HTML attribute, and escaping only `'` left `"` free to terminate the attribute — the box
// would silently discard typing again for any lift whose name carried one. This is a
// ROUND-TRIP check, not a "does it contain a quote" check: decode the HTML entities the way
// the parser does, evaluate the result as the JS literal it becomes, and require the
// original name back. Anything less would pass on an escaper that mangles the key.
const { escNoteKey } = c1.__api;
const htmlDecode = (t) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const roundTrip = (name) => {
  const attr = escNoteKey(name);
  if (/"/.test(attr)) return { err: 'a bare " survived — it would terminate the attribute' };
  // eslint-disable-next-line no-new-func
  try { return { got: Function(`return '${htmlDecode(attr)}'`)() }; }
  catch (e) { return { err: `the JS literal does not parse: ${e.message}` }; }
};
for (const name of ['Dumbbell "Hammer" Curl', "Farmer's Walk", 'Squat & Press',
                    'Back\\Slash Row', '<b>Bench</b>', 'Plain Barbell Row']) {
  const r = roundTrip(name);
  check(`[P] "${name}" survives the oninput attribute intact`, r.got === name,
    r.err || `got ${JSON.stringify(r.got)} — the note key would key off a mangled name`);
}

// ── [H] debounce ──
const c2 = makeCtx();
for (const ch2 of 'sore'.split('')) c2.__api.saveExNote('Deadlift', ch2);   // 4 keystrokes
check('[H1] four keystrokes do not fire four upserts immediately', c2.__calls.length === 0,
  `${c2.__calls.length} Supabase calls fired synchronously — oninput runs per keystroke`);
check('[H2] a push is scheduled', Object.keys(c2.__api._exNoteTimers).length === 1);
await new Promise(r => setTimeout(r, 1100));
const upserts = c2.__calls.filter(c => c.op === 'upsert');
check('[H3] exactly ONE upsert lands after the burst settles', upserts.length === 1,
  `${upserts.length} upserts for one burst`);
check('[H4] it carries the final text, name-keyed', upserts[0]?.row?.note === 'e' &&
  upserts[0]?.row?.exercise_name === 'Deadlift' && upserts[0]?.row?.user_id === 'u1');
// [H5] the DEBOUNCED push must carry the stamp stored locally, not one derived when the
// timer happens to fire ~900 ms later. Same rule as [J5], other path: two stamps for one
// note means the next hydrate sees cloud > local and pulls a copy of what is already
// there. Without this assertion nothing broke when saveExNote stopped threading `at` —
// which per SC-38 made the claim decoration.
check('[H5] the pushed stamp equals the locally stored `at` for that note',
  upserts[0]?.row?.updated_at === c2.__store['tandem_ex_notes']?.['Deadlift']?.at,
  `pushed ${JSON.stringify(upserts[0]?.row?.updated_at)} vs stored ${JSON.stringify(c2.__store['tandem_ex_notes']?.['Deadlift']?.at)}`);

// ── [I] clearing DELETEs the row ──
const c3 = makeCtx();
await c3.__api.pushExNote('Deadlift', '');
check('[I] a cleared note DELETEs its row rather than upserting ""',
  c3.__calls.length === 1 && c3.__calls[0].op === 'delete' &&
  c3.__calls[0].eq.exercise_name === 'Deadlift',
  `got ${JSON.stringify(c3.__calls)} — leaving the row means the next hydrate resurrects a deleted note`);

// ── [J]/[K] two-way hydrate ──
const c4 = makeCtx();
c4.__store['tandem_ex_notes'] = {
  'Cloud Newer':  { note: 'local old', at: '2026-09-01T00:00:00Z' },
  'Local Newer':  { note: 'local new', at: '2026-09-20T00:00:00Z' },
  'Legacy Plain': 'written before the cloud half',      // bare string, no timestamp
};
c4.__cloudRows = [
  { exercise_name: 'Cloud Newer',  note: 'cloud new',  updated_at: '2026-09-15T00:00:00Z' },
  { exercise_name: 'Local Newer',  note: 'cloud old',  updated_at: '2026-09-02T00:00:00Z' },
  { exercise_name: 'Legacy Plain', note: 'cloud copy', updated_at: '2026-09-10T00:00:00Z' },
  { exercise_name: 'Only In Cloud', note: 'from another device', updated_at: '2026-09-18T00:00:00Z' },
];
const res = await c4.__api.hydrateNotesFromCloud('u1');
const after = c4.__store['tandem_ex_notes'];
check('[J1] cloud newer pulls down', after['Cloud Newer'].note === 'cloud new');
check('[J2] local newer is kept AND pushed up', after['Local Newer'].note === 'local new' &&
  c4.__calls.some(c => c.op === 'upsert' && c.row.exercise_name === 'Local Newer'),
  `local kept: ${after['Local Newer'].note}; pushed: ${c4.__calls.filter(c=>c.op==='upsert').map(c=>c.row.exercise_name)}`);
check('[J3] a note only in the cloud is taken, not treated as a local delete',
  after['Only In Cloud'].note === 'from another device',
  'a real delete already removes the row, so cloud-present + local-absent means new-from-elsewhere');
check('[K] a legacy bare string normalizes and loses to the timestamped cloud copy',
  after['Legacy Plain'].note === 'cloud copy',
  `got ${JSON.stringify(after['Legacy Plain'])} — an unknown-age local note must not beat a stamped one`);
check('[J4] hydrate reports what it did', res && res.pulled >= 2 && res.pushed >= 1,
  `got ${JSON.stringify(res)}`);

// [J5] THE STAMP THAT TRAVELS. [J2] only proved an upsert happened for the locally-newer
// note; it never looked at what the row carried. pushExNote() originally hardcoded
// `updated_at: new Date().toISOString()`, so a hydrate-push relabelled a Sep-1 note as
// today — and on the next device that forged stamp beats a genuinely newer note and
// destroys it. One clock, no skew. Found by llm-council (Contrarian), 2026-09-30.
const pushedLocalNewer = c4.__calls.find(c => c.op === 'upsert' && c.row.exercise_name === 'Local Newer');
check('[J5] a hydrate-push carries the note\'s ORIGINAL stamp, not a fresh one',
  pushedLocalNewer?.row?.updated_at === '2026-09-20T00:00:00Z',
  `pushed updated_at = ${JSON.stringify(pushedLocalNewer?.row?.updated_at)} — a forged "now" makes an old note outrank a newer one on the next device`);

// ── [N] a box the user is typing in right now is left alone ──
const c6 = makeCtx();
c6.__store['tandem_ex_notes'] = { 'Mid Sentence': { note: 'typing right n', at: '2026-09-01T00:00:00Z' } };
c6.__api.saveExNote('Mid Sentence', 'typing right no');   // leaves a pending debounce timer
c6.__cloudRows = [{ exercise_name: 'Mid Sentence', note: 'CLOBBERED', updated_at: '2099-01-01T00:00:00Z' }];
await c6.__api.hydrateNotesFromCloud('u1');
check('[N] hydrate skips a name with a pending push — it does not overwrite text mid-keystroke',
  c6.__api.exNotesAll()['Mid Sentence'].note === 'typing right no',
  `got ${JSON.stringify(c6.__api.exNotesAll()['Mid Sentence'])} — a newer cloud row must not win against a box still being typed in`);

// ── [O] clearing history clears the CLOUD notes, not just the local key ──
const c7 = makeCtx();
await c7.__api.wipeCloudNotes();
check('[O1] wipeCloudNotes DELETEs by user_id, scoped to the signed-in user',
  c7.__calls.length === 1 && c7.__calls[0].op === 'delete' &&
  c7.__calls[0].eq.user_id === 'u1' && c7.__calls[0].eq.exercise_name === undefined,
  `got ${JSON.stringify(c7.__calls)}`);
const chBody = ch.slice(0, ch.indexOf('\n}') + 2);
check('[O2] clearHistory() calls it — otherwise the next hydrate resurrects every note',
  /wipeCloudNotes\(/.test(chBody),
  'the local key is cleared and the cloud rows survive, so "Clear all history" is a lie for notes');
const c8 = makeCtx({ signedIn: false });
await c8.__api.wipeCloudNotes();
check('[O3] signed out, it deletes nothing', c8.__calls.length === 0 && c8.__warns.length === 0,
  `calls ${JSON.stringify(c8.__calls)}, warns ${JSON.stringify(c8.__warns)}`);

// ── [L] anonymous saves nothing ──
const c5 = makeCtx({ signedIn: false });
await c5.__api.pushExNote('Deadlift', 'typed while signed out');
check('[L1] anonymous pushes NOTHING to the cloud', c5.__calls.length === 0,
  `${c5.__calls.length} calls — "look-around mode saves nothing" is a standing ruling`);
// [L1] alone has NO teeth and mutation-testing proved it: delete the `!currentUser`
// guard and it still passes, because `currentUser.id` then throws a TypeError that the
// function's own try/catch swallows. Zero calls for the WRONG reason. So [L2] pins the
// mechanism instead of the outcome: a guarded return is SILENT, an exception is not.
// This matters beyond tidiness — control flow by caught TypeError breaks the moment
// `currentUser` becomes `{}` rather than null, and would then upsert rows keyed
// user_id: undefined on every keystroke of look-around mode.
check('[L2] it RETURNS on the guard, rather than throwing into its own catch',
  c5.__warns.length === 0,
  `warned: ${JSON.stringify(c5.__warns)} — that is the catch block, not the guard`);

// ── [M] the round-trip is actually CALLED — "wired is not working" ──
// Everything above proves hydrateNotesFromCloud behaves. None of it proves anything
// invokes it. A correct reconciler no caller reaches has shipped nothing, and that is
// the exact failure class this whole epic was opened for (CLAUDE.md, reorderWeek).
// BOTH cloud paths must call it: restoreFromCloud (fresh device) and syncFromCloud
// (returning session). One caller means notes reconcile on one path only.
const fnRegion = (name) => {
  const at = Math.max(code.indexOf(`async function ${name}(`), code.indexOf(`function ${name}(`));
  return at === -1 ? '' : code.slice(at, code.indexOf('\n}', at) + 2);
};
for (const caller of ['restoreFromCloud', 'syncFromCloud']) {
  const body = fnRegion(caller);
  check(`[M:${caller}] awaits hydrateNotesFromCloud()`,
    /await\s+hydrateNotesFromCloud\(/.test(body),
    body ? 'the reconciler exists but this path never reaches it — notes do not sync here'
         : `could not locate ${caller}() — has it been renamed?`);
}

console.log(failures === 0 ? '\nex-notes-smoke: PASS' : `\nex-notes-smoke: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
