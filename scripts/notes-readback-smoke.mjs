#!/usr/bin/env node
/**
 * notes-readback-smoke.mjs — B2 (wiring workstream): notes are READ BACK, not
 * just stored, and the note area offers a STRUCTURED action instead of the
 * engine ever parsing free text.
 *
 * WHY THIS EXISTS
 * ---------------
 * BUG-195 made per-lift notes durable (ex-notes-smoke.mjs owns that). B2 is the
 * next seam: a stored note the user cannot SEE the age of is half-wired, and a
 * note like "swap this for me" typed as free text does nothing — the engine
 * must never parse sentiment/requests out of prose (that is a heuristic the
 * sources do not license). So:
 *
 *   [A] the lift card shows the note's DATE back (`exNoteStamp`): the stored
 *       `at` stamp (BUG-195 newest-wins) becomes a visible "noted <date>" line.
 *       A legacy bare-string note has NO stamp — show nothing rather than
 *       fabricate a date.
 *   [B] the notes area carries a structured "Swap this for me" action that
 *       routes into B1's swap picker (openSwapPicker) — same card id, with
 *       stopPropagation so the card toggle does not swallow it.
 *   [C] the SESSION-notes field (226714d, workout_sessions.notes) read-back is
 *       VISIBLE: startOrResumeSession()'s cloud fallback must reach the
 *       #sessionNotesInput pixel, not just localStorage — renderTracker()'s
 *       one-shot hydrate (dataset.hydrated) has already run by the time the
 *       resume lands, so writing LS alone is a dead read on a fresh device.
 *       This is CLAUDE.md's "wired is not working" class, caught before ship.
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const raw = readFileSync(path.join(root, 'tandem.html'), 'utf8');
// SC-35: strip //-comments before matching — comments can quote the patterns.
const code = raw.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
const markup = raw.replace(/<!--[\s\S]*?-->/g, '');

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};

// ── [A]/[B] static wiring: the ex-notes-wrap block in buildDayHTML ──
const wrap = /<div class="ex-notes-wrap">[\s\S]{0,1200}?<\/textarea>[\s\S]{0,600}?<\/div>/.exec(markup);
check('[A0] the ex-notes-wrap block still exists', !!wrap);
const wrapSrc = wrap ? wrap[0] : '';
// Mutation-tested (SC-38): a bare /exNoteStamp\(/ grep passed with the ternary
// condition replaced by '' — source mentions the helper, pixel never renders.
// So pin the GUARD expression: the stamp div must be conditioned on
// exNoteStamp(ex.name) itself, and interpolate it in the body.
check('[A1] the card renders the note DATE back, guarded by exNoteStamp(ex.name)',
  /\$\{exNoteStamp\(ex\.name\)\s*\?\s*`<div class="ex-note-stamp"/.test(wrapSrc) &&
  /ex-note-stamp[^`]*\$\{exNoteStamp\(ex\.name\)\}/.test(wrapSrc),
  'the stored `at` stamp never reaches a pixel — the user cannot tell a note from last week from one from March');
check('[B1] the notes area carries a structured "Swap this for me" action',
  /Swap this for me/.test(wrapSrc),
  'free text is the only path — and the engine must never parse requests out of prose');
const swapAct = /onclick="([^"]*openSwapPicker\([^"]*)"/.exec(wrapSrc);
check('[B2] it routes into B1 (openSwapPicker) with the card id, and stops propagation',
  !!swapAct && /event\.stopPropagation\(\)/.test(swapAct[1]) && /openSwapPicker\('\$\{ex\.id\}'\)/.test(swapAct[1]),
  `got ${JSON.stringify(swapAct && swapAct[1])} — without stopPropagation the card-toggle onclick swallows the tap`);

// ── [A2]-[A5] functional: exNoteStamp against the REAL notes block ──
// Same contiguous slice as ex-notes-smoke (escNoteKey … clearHistory) so the
// helper under test is the shipped one, with its real store neighbors.
const blockStart = code.indexOf('function escNoteKey(');
const blockEnd = code.indexOf('function clearHistory(');
const NOTES_SRC = (blockStart !== -1 && blockEnd > blockStart) ? code.slice(blockStart, blockEnd) : '';
check('[A2] exNoteStamp is defined in the notes block (so it ships with the store)',
  /function exNoteStamp\(/.test(NOTES_SRC),
  'no formatter — [A1] would have to inline date logic in the template');

let api = null;
if (/function exNoteStamp\(/.test(NOTES_SRC)) {
  const store = {};
  const ctx = {
    console, setTimeout, clearTimeout, Date,
    LS: { get: (k) => store[k], set: (k, v) => { store[k] = v; } },
    currentUser: null, sb: null, __store: store,
  };
  vm.createContext(ctx);
  new vm.Script(NOTES_SRC + '\nthis.__api = { exNoteStamp, saveExNote };').runInContext(ctx);
  api = ctx.__api;
  store['tandem_ex_notes'] = {
    'Barbell Back Squat': { note: 'knee tight', at: '2026-09-20T15:00:00Z' },
    'Legacy Plain': 'written before the cloud half',   // bare string → at:null
  };
  const stamp = api.exNoteStamp('Barbell Back Squat');
  check('[A3] a stamped note yields a human-readable date', /Sep|9/.test(String(stamp)) && String(stamp).length > 2,
    `got ${JSON.stringify(stamp)}`);
  check('[A4] an unknown lift yields "", not a fabricated date', api.exNoteStamp('Never Trained') === '');
  check('[A5] a legacy un-stamped note yields "" — never invent an age',
    api.exNoteStamp('Legacy Plain') === '',
    `got ${JSON.stringify(api.exNoteStamp('Legacy Plain'))}`);
} else {
  for (const l of ['[A3]', '[A4]', '[A5]']) check(`${l} (skipped — exNoteStamp missing)`, false);
}

// ── [C] session-notes cloud fallback reaches the PIXEL ──
const sosAt = code.indexOf('async function startOrResumeSession(');
const sosSrc = sosAt === -1 ? '' : code.slice(sosAt, code.indexOf('\n}', sosAt) + 2);
check('[C0] startOrResumeSession located', !!sosSrc);
if (sosSrc) {
  const store = {}; const rawStore = {};
  const el = { value: '', dataset: {} };
  const ctx = {
    console, Date,
    LS: { get: (k) => store[k], set: (k, v) => { store[k] = v; } },
    LSraw: { get: (k) => rawStore[k], set: (k, v) => { rawStore[k] = v; }, del: (k) => { delete rawStore[k]; } },
    currentUser: { id: 'u1' },
    document: { getElementById: (id) => (id === 'sessionNotesInput' ? el : null) },
    sb: { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({
      maybeSingle: () => Promise.resolve({ data: { id: 'sess-1', notes: 'felt strong, shoulder ok' } }) }) }) }) }) }) },
    localDateStr: () => '2026-10-05',
    getPhase: () => ({ name: 'Base' }),
    cfg: { goal: 'build', weeks: 8 }, currentWeek: 1, currentDay: 'push',
    __el: el,
  };
  vm.createContext(ctx);
  rawStore['tandem_active_session_id'] = 'sess-1';   // resume path, local draft empty
  await new vm.Script(sosSrc + '\nthis.__p = startOrResumeSession();').runInContext(ctx);
  await ctx.__p;
  check('[C1] resume with empty local draft seeds the LS draft from the cloud row',
    store['tandem_session_notes_draft'] === 'felt strong, shoulder ok',
    `draft = ${JSON.stringify(store['tandem_session_notes_draft'])}`);
  check('[C2] ...and the VISIBLE #sessionNotesInput shows it (not just localStorage)',
    el.value === 'felt strong, shoulder ok',
    `textarea value = ${JSON.stringify(el.value)} — renderTracker's one-shot hydrate already ran; LS alone never reaches the pixel`);
} else {
  for (const l of ['[C1]', '[C2]']) check(`${l} (skipped — startOrResumeSession missing)`, false);
}

console.log(failures === 0 ? '\nnotes-readback-smoke: PASS' : `\nnotes-readback-smoke: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
