#!/usr/bin/env node
/**
 * a11y-keyboard-smoke.mjs — BUG-200 regression guard.
 *
 * WHY THIS EXISTS
 * ---------------
 * The dashboard competition card carried role="button" + tabindex="0" with only an
 * onclick. tandem.html has ZERO addEventListener calls, so no keydown handler
 * existed anywhere in the file: the card took focus, announced itself as a button,
 * and could not be activated by keyboard. A write-side handler audit scored it
 * healthy because the onclick is real (see docs/control-reachability-audit-2026-09-30.md
 * §D13).
 *
 * This is the general rule, not the one instance: an element that tells assistive
 * tech it is a button must be operable as one. Today there is exactly one
 * role="button" in the file; this gate fails the moment a second is added without
 * a key handler, which is the only reason it is worth a check.
 *
 * NOT IN SCOPE — corrected 2026-09-30: the audit also claimed the one-off cards'
 * aria-pressed is "never read or updated". That was FALSE. pickOneOffGoal (:8258)
 * reads b.dataset.oneoffGoal and renderOneOff (:8308) reads b.dataset.oneoff, both
 * calling setAttribute('aria-pressed', String(on)), and openOneOff resets them.
 * Those cards are <button> elements, natively keyboard-operable, and are correctly
 * excluded here. Do not "fix" them.
 *
 * HARD (fails the gate):
 *   [A] every element with role="button" has an onkeydown/onkeyup/onkeypress
 *   [B] each such handler activates on Enter AND Space
 *   [C] and calls preventDefault (Space would otherwise scroll the page)
 */
import fs from 'fs';

const raw = fs.readFileSync(new URL('../tandem.html', import.meta.url), 'utf8');
// Strip HTML comments before extracting. The comment ABOVE the fixed element
// quotes role="button" in order to explain the fix, and check [A] flagged that
// comment as an unfixed element on the first run. This is the FOURTH time in one
// session that scanning source for a pattern matched the prose documenting the
// pattern (see docs/self-corrections.md SC-35) — strip first, always.
const html = raw.replace(/<!--[\s\S]*?-->/g, '');
let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};

// Each element that declares itself a button: take the whole tag it sits in.
const tags = [];
for (const m of html.matchAll(/role="button"/g)) {
  const open = html.lastIndexOf('<', m.index);
  const close = html.indexOf('>', m.index);
  tags.push(html.slice(open, close + 1));
}
check(`found at least one role="button" element (found ${tags.length})`, tags.length > 0,
  'if this fails the extractor is broken, not the markup');

const noKey = tags.filter(t => !/on(keydown|keyup|keypress)=/.test(t));
check('[A] every role="button" element has a key handler', noKey.length === 0,
  noKey.map(t => t.replace(/\s+/g, ' ').slice(0, 130)).join('\n      '));

const withKey = tags.filter(t => /on(keydown|keyup|keypress)=/.test(t));
const badKeys = withKey.filter(t => !(/Enter/.test(t) && /' '|"\s"|Spacebar/.test(t)));
check('[B] each key handler activates on Enter AND Space', badKeys.length === 0,
  badKeys.map(t => t.replace(/\s+/g, ' ').slice(0, 130)).join('\n      '));

const noPrevent = withKey.filter(t => !/preventDefault/.test(t));
check('[C] each key handler calls preventDefault (Space must not scroll)', noPrevent.length === 0,
  noPrevent.map(t => t.replace(/\s+/g, ' ').slice(0, 130)).join('\n      '));

console.log(failures === 0 ? '\na11y-keyboard-smoke: PASS' : `\na11y-keyboard-smoke: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
