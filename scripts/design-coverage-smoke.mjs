// design-coverage-smoke.mjs
// Standing enforcement for the 2026-10-05 warm/modern redesign (branch
// design/warm-modern). The last redesign attempt failed in a specific way:
// it restyled the showpiece screens and left the rest of the app in the old
// all-caps/mono/wide-tracked language. "The entire app" is therefore proven
// here mechanically, not by feeling. Inventory of every surface this gate
// covers: docs/redesign-surface-inventory.md.
//
// FOUR assertion families, each mutation-tested individually before this was
// wired into verify (SC-38 — a vacuous assertion that passes with the defect
// live is worse than none). Mutations were done with cp save/restore, never
// a HEAD-relative git revert (SC-40).
//
//   [A] zero `text-transform` to uppercase anywhere in tandem.html.
//       (baseline before the redesign: 46 — all removed, none allowlisted)
//   [B] no wide positive letter-spacing. Negative display tracking on large
//       headings is a modern-type convention and stays; small positive
//       tracking below the threshold is tolerated; anything at/over 0.04em
//       must carry an allowlist marker with a reason below.
//       (baseline: 93 letter-spacing sites, most at .12-.2em)
//   [C] every use of the mono font variable is attributable to the keep-mono
//       allowlist (genuinely tabular/code-like content only: weight & rep
//       inputs, timers, plate math, OTP entry, hex readout, chart axes), AND
//       the TOTAL count is pinned (SC-33) so a new mono use cannot hide
//       behind an existing marker. (baseline: 121)
//   [D] no hardcoded multi-word ALL-CAPS runs in user-facing text — the
//       uppercase look must not sneak back in as literal capitalized copy
//       once text-transform is gone. User-facing text lives in exactly two
//       places in this codebase: JS string literals and HTML markup. So a
//       caps run only counts if its line (a) has a quote character before
//       the run (string literal) or (b) contains an HTML tag bracket pair
//       (markup line). This deliberately skips CSS/JS section-banner
//       comments like the PROGRESSIVE-OVERLOAD slice markers that other
//       gates vm-extract on — those are developer-only and must not be
//       touched. Whole-line `//` comments are also excluded outright (same
//       narrow exclusion as no-emoji-smoke.mjs; the two broader comment-
//       exclusion strategies both silently under-scanned real UI text).
//       Known, accepted gap: bare HTML text content on a line with no tag
//       and no quote would be missed — mutation-tested that realistic
//       insertions (caps copy on a tag line, caps in a template literal)
//       are caught.
//
// programs.js is also scanned and is expected clean (it carries zero styling
// — verified at baseline: 0 hits for all four families).
//
// Run: node scripts/design-coverage-smoke.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

let failures = 0;
function check(label, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) failures++;
}

// ---------------------------------------------------------------------------
// Allowlists. Every entry needs a marker (a substring that identifies the
// line) and a one-line reason. Adding an entry silently is the failure mode
// this file exists to prevent — mirror docs/redesign-surface-inventory.md
// "Deliberate exceptions" when editing.
// ---------------------------------------------------------------------------

// [B] positive letter-spacing at/over the threshold that is FUNCTIONAL, not
// aesthetic-matrix tracking.
const TRACKING_THRESHOLD_EM = 0.04;
const ALLOWED_WIDE_TRACKING = [
  { marker: 'id="authOTPCode"', reason: 'OTP code entry — spacing separates the digits functionally' },
];

// [C] keep-mono markers: tabular numbers, code entry, timers. A mono use is
// attributed to its CSS selector (brace-aware walk of the <style> block, so
// multi-line rules attribute correctly) or, outside the style block, to its
// own line; the attribution must contain one of these.
const ALLOWED_MONO = [
  // numeric form inputs
  { marker: '.ob-input', reason: 'onboarding numeric stat inputs (weight/height/age)' },
  { marker: '.eq-db-input', reason: 'equipment max-dumbbell numeric input' },
  { marker: '.calc-input', reason: '1RM calculator numeric inputs' },
  { marker: 'j-sets', reason: 'journal sets numeric input' },
  { marker: 'j-reps', reason: 'journal reps numeric input' },
  { marker: 'j-weight', reason: 'journal weight numeric input' },
  { marker: 'j-rpe', reason: 'journal RPE numeric select' },
  { marker: 'id="journalDate"', reason: 'journal date input — tabular date entry' },
  { marker: 'authOTPCode', reason: 'OTP code entry' },
  // timers
  { marker: '.session-timer-live', reason: 'live session timer — ticking digits' },
  // plate math
  { marker: '.plate-select', reason: 'plate-math weight selector' },
  { marker: '.pl-item', reason: 'plate-math per-side plate list' },
  { marker: '.bar-icon', reason: 'plate-math bar figure' },
  { marker: 'id="plateDisplay"', reason: 'plate-math resolved weight readout' },
  { marker: 'id="plateBreakdown"', reason: 'plate-math per-side breakdown' },
  // tabular/figures in history & charts
  { marker: '.pr-data', reason: 'PR list weight x reps figures' },
  { marker: '.hist-sets', reason: 'history set-count figure' },
  { marker: '.hist-date', reason: 'history date column — fixed-width alignment' },
  { marker: '.log-delta', reason: 'trend delta figure' },
  { marker: '.log-axis', reason: 'chart axis labels' },
  { marker: '.log-bars .b span', reason: 'chart bar value labels' },
  { marker: '.i1rm-pct', reason: '1RM percent figure' },
  { marker: 'selectedThemeColor', reason: 'accent color hex readout in onboarding review' },
];
// SC-33: pin the total so the allowlist cannot quietly absorb new sites.
// Recount and update deliberately when a keep-mono surface is added/removed.
// 29 -> 27 on 2026-11-17: the lift-card prescription line (.ex-reps) and the phase banner's
// rep line (.pb-reps) left the mono face on Kerwin's call — sentences that contain numbers are
// prose; tabular-nums keeps the digits aligned. Both allowlist entries were removed with them.
// 27 -> 23 the same day: the set logger's four cells (.set-input, .set-rpe, .set-num, .set-vol)
// followed, on Kerwin's explicit pick ("Monospace numbers"). tabular-nums keeps columns aligned.
const EXPECTED_MONO_TOTAL = { 'tandem.html': 23, 'programs.js': 0 };

// [D] legitimate all-caps runs, if any ever appear (acronym pairs etc.).
// Single ALL-CAPS words (TANDEM, RPE, AMRAP, PR, OTP) are not matched by the
// run pattern and need no entry.
const ALLOWED_CAPS_RUNS = [
  { marker: 'LEAN BACK', reason: 'rower cue "LEGS → LEAN BACK → ARMS" — EXERCISE_BANK content, mirrored in the committed seed SQL and the prod exercises table. Sentence-casing it is a DATA change (bank↔seed freshness goes red), out of design-only scope. Restyle via CSS if ever needed, never by editing the bank.' },
];

// ---------------------------------------------------------------------------

const CAPS_RUN = /\b[A-Z]{3,}(?: [A-Z]{2,})+\b/g;

for (const file of ['tandem.html', 'programs.js']) {
  const src = readFileSync(path.join(root, file), 'utf8');
  const lines = src.split('\n');

  // [A] text-transform to uppercase — zero, no allowlist.
  const upper = [];
  lines.forEach((line, i) => {
    if (/text-transform\s*:\s*uppercase/.test(line)) upper.push(i + 1);
  });
  check(`[A] ${file} — zero text-transform:uppercase (found ${upper.length})`, upper.length === 0);
  upper.slice(0, 10).forEach(n => console.log(`     ${file}:${n}  ${lines[n - 1].trim().slice(0, 90)}`));

  // [B] wide positive tracking.
  const wide = [];
  lines.forEach((line, i) => {
    const re = /letter-spacing\s*:\s*(-?\.?\d*\.?\d+)em/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      const v = parseFloat(m[1]);
      if (v >= TRACKING_THRESHOLD_EM && !ALLOWED_WIDE_TRACKING.some(a => line.includes(a.marker))) {
        wide.push({ n: i + 1, v, text: line.trim().slice(0, 90) });
      }
    }
  });
  check(`[B] ${file} — no positive letter-spacing >= ${TRACKING_THRESHOLD_EM}em outside allowlist (found ${wide.length})`, wide.length === 0);
  wide.slice(0, 10).forEach(h => console.log(`     ${file}:${h.n}  (${h.v}em)  ${h.text}`));

  // [C] mono attribution + pinned total. Inside the <style> block, a use on a
  // continuation line of a multi-line rule is attributed to the rule's
  // SELECTOR via a brace-depth walk (never cross-line comment state — this is
  // brace state, which `accept="image/*"` cannot poison because it holds no
  // braces); outside, to the line itself.
  const styleStart = lines.findIndex(l => l.includes('<style>'));
  const styleEnd = lines.findIndex(l => l.includes('</style>'));
  const monoLines = [];
  let depth = 0, curSel = '';
  lines.forEach((line, i) => {
    const inStyle = i > styleStart && i < styleEnd && styleStart >= 0;
    if (inStyle && depth === 0) {
      const b = line.indexOf('{');
      if (b >= 0) curSel = line.slice(0, b).trim() || curSel;
    }
    const count = (line.match(/var\(--font-mono\)/g) || []).length;
    if (count) monoLines.push({ n: i + 1, count, line, attribution: inStyle ? curSel + ' ' + line : line });
    if (inStyle) for (const ch of line) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  });
  const monoTotal = monoLines.reduce((s, l) => s + l.count, 0);
  const unattributed = monoLines.filter(l =>
    // the token definition line itself is the one home, not a use site
    !/--font-mono\s*:/.test(l.line) &&
    !ALLOWED_MONO.some(a => l.attribution.includes(a.marker)));
  check(`[C] ${file} — every mono use attributable to keep-mono allowlist (found ${unattributed.length} unattributed)`, unattributed.length === 0);
  unattributed.slice(0, 15).forEach(h => console.log(`     ${file}:${h.n}  ${h.line.trim().slice(0, 90)}`));
  check(`[C] ${file} — mono total pinned at ${EXPECTED_MONO_TOTAL[file]} (found ${monoTotal})`, monoTotal === EXPECTED_MONO_TOTAL[file]);

  // [D] hardcoded ALL-CAPS runs in string literals or markup lines only.
  const caps = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    // whole-line comments only (never cross-line state — see header). Covers
    // `//`, `/* ... */` banner lines and their `*`-continuation lines, and
    // `<!-- -->` HTML comments. An apostrophe inside a comment otherwise
    // reads as a string-opening quote (found at tandem.html:632).
    if (t.startsWith('//') || t.startsWith('/*') || t.startsWith('*') || t.startsWith('<!--')) return;
    const re = new RegExp(CAPS_RUN.source, 'g');
    const isMarkup = /<[a-zA-Z!/]/.test(line);
    let m;
    const real = [];
    while ((m = re.exec(line)) !== null) {
      if (ALLOWED_CAPS_RUNS.some(a => a.marker === m[0])) continue;
      const before = line.slice(0, m.index);
      const inString = /['"`]/.test(before);
      if (isMarkup || inString) real.push(m[0]);
    }
    if (real.length) caps.push({ n: i + 1, runs: real, text: line.trim().slice(0, 90) });
  });
  check(`[D] ${file} — no hardcoded multi-word ALL-CAPS copy (found ${caps.length} lines)`, caps.length === 0);
  caps.slice(0, 15).forEach(h => console.log(`     ${file}:${h.n}  [${h.runs.join(' | ')}]  ${h.text}`));
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED — old design language present. Restyle at the token/class level, or add an allowlist entry IN THIS SCRIPT with a one-line reason (and update the pinned mono total deliberately), never silently.`);
  process.exit(1);
}
console.log('\nDesign-coverage check passed — warm/modern language holds app-wide.');
