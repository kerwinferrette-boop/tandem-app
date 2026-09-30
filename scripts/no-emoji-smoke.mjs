// no-emoji-smoke.mjs
// Standing enforcement for Kerwin's rule (affirmed 2026-09-30, re-affirmed after a
// scoping question): no colorful pictograph emoji anywhere in the app's user-facing
// text. This is NOT the first time this got fixed — commit ea3ccb9 (2026-06-02)
// "Replace emoji icons with an inline Lucide-style SVG registry" already did this
// once, app-wide, and new feature work quietly reintroduced 10 fresh instances onto
// onboarding-path and quick-action buttons between then and 2026-09-23 (fixed in
// ae87813). A rule that isn't checked is a suggestion — this makes it a gate.
//
// SCOPE, confirmed explicitly via AskUserQuestion (2026-09-30) after flagging the
// boundary rather than guessing: colorful/pictograph emoji only. Monochrome
// typographic glyphs used as core UI chrome are EXPLICITLY OUT OF SCOPE and must
// stay allowlisted, or this check would fail on ~80 legitimate call sites (CTA
// arrows, close buttons, state checkmarks, the sex selector) and either block real
// work or get silently disabled — worse than not having the gate at all:
//   → ← ↑ ↓ ↻   (navigation / trend arrows)
//   ✓ ✕          (state / close)
//   ★            (1RM trend "new" indicator)
//   ♂ ♀          (sex selector / display)
// Code comments (// ... and /* ... */) are also out of scope — a developer-only
// note is never "in the app", per Kerwin's own framing ("next to text" in the UI).
//
// Run: node scripts/no-emoji-smoke.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Full pictograph ranges (Misc Symbols & Pictographs, Emoticons, Transport & Map,
// Supplemental Symbols & Pictographs, Symbols & Pictographs Extended-A, dingbats
// block minus the allowlisted glyphs below, variation selector-16) — deliberately
// broad so a NEW emoji introduced later still trips this, not just the ones seen
// so far.
const EMOJI_RANGE = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{FE0F}]/gu;

// The confirmed-allowlisted monochrome glyphs — never flagged even though some
// fall inside the broad ranges above (e.g. ↻ U+21BB, ★ U+2605 sit outside the
// ranges already; ✓ U+2713 / ✕ U+2715 sit inside ☀-➿ and must be
// explicitly excluded).
const ALLOWLIST = new Set(['✓', '✕', '★', '♂', '♀', '↻']);

// Comment exclusion, deliberately narrow. TWO earlier versions of this function
// were caught by mutation-testing this exact script before wiring it in (per
// CLAUDE.md "verify by running" — a gate that doesn't catch a real regression is
// worse than no gate, because it manufactures confidence):
//   v1: a whole-file greedy /\/\*[\s\S]*?\*\// regex collapsed 10534 lines to
//       6338 by matching from one unrelated /* to a much-later */.
//   v2: a line-by-line /* */ state machine saw `accept="image/*"` (tandem.html,
//       an ordinary HTML MIME-type attribute, nothing to do with a comment) as an
//       unclosed block-comment START and silently treated the rest of the file
//       (85% of it) as "inside a comment" from that point on.
// Both failed in the SAME direction — silently under-scanning real UI text — which
// is the dangerous direction for this check. This version tracks no cross-line
// state at all: it only excludes a line that, once trimmed, BEGINS with `//` (a
// whole-line comment). That is the only pattern any real emoji-bearing comment in
// this codebase actually uses (checked directly: both known cases, programs.js
// :159/:221, are whole-line `//` comments) and it cannot misfire the way block-
// comment tracking did. Known, accepted gap: an emoji inside a `/* block */`
// comment or a trailing `// ...` after real code on the same line would still be
// FLAGGED (a false positive, forcing a human look) rather than silently passed —
// the safe failure direction, and not a real case that exists in the file today.
function findEmoji(label, src) {
  const lines = src.split('\n');
  const hits = [];
  lines.forEach((line, i) => {
    if (line.trim().startsWith('//')) return;
    const matches = line.match(EMOJI_RANGE);
    if (!matches) return;
    const real = matches.filter(ch => !ALLOWLIST.has(ch));
    if (real.length) hits.push({ line: i + 1, chars: real, text: line.trim().slice(0, 100) });
  });
  return hits;
}

let failures = 0;
function check(label, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) failures++;
}

for (const file of ['tandem.html', 'programs.js']) {
  const src = readFileSync(path.join(root, file), 'utf8');
  const hits = findEmoji(file, src);
  check(`${file} — no pictograph emoji in user-facing text (arrows/checks/star/gender symbols allowlisted)`, hits.length === 0);
  for (const h of hits) {
    console.log(`  ${file}:${h.line}  [${h.chars.join(' ')}]  ${h.text}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED — pictograph emoji found in UI text. Strip it or add the exact glyph to ALLOWLIST in this script with a one-line reason, never silently.`);
  process.exit(1);
}
console.log('\nNo-emoji check passed — no pictograph emoji in user-facing text.');
