#!/usr/bin/env node
// design-token-parity-smoke.mjs — BUG-127 / BUG-123 / BUG-190 / BUG-254 (2026-11-15).
//
// WHAT IT GUARDS: Kerwin named Home as the one reference look for the whole app
// ("This is the aesthetic I'm talking about", 2026-11-15), picked FLAT main buttons
// ("Flat is fine") and Finish as a raised circle in the middle of the workout bar
// ("Circle in the middle would be great"). The fix lifted Home's values into :root
// tokens and gave each component family ONE grouped rule that lists Home's own
// selector next to every other screen's selector. This gate fails when:
//   [T1] a token the look depends on disappears from :root;
//   [T2] a Home reference rule goes back to a literal instead of the token (the
//        reference would then move without the rest of the app);
//   [T3] a component group stops listing Home's selector together with the screen
//        selectors, or stops reading the token for the property it owns;
//   [T4] a screen's own rule re-declares a property its group owns (the literal
//        would silently win or drift — the exact failure BUG-127 describes);
//   [T5] a button-family selector declares monospace or ALL CAPS (BUG-127's
//        screenshots: "tiny uppercase monospaced labels" on buttons);
//   [T6] the workout bar stops being built from Home's .tab-btn buttons, Finish
//        stops being the .tab-start circle in the middle, or a bar action is lost.
//
// It asserts SHARED TOKENS, never a literal pixel value: if Kerwin changes the look
// in :root, this stays green and every screen follows. A gate that pinned "22px"
// would pass forever while the reference moved underneath it.
//
// WHAT IT CANNOT SEE: the rendered pixel. It reads CSS text, not the cascade a
// browser computes, so an inline style="" or a higher-specificity rule elsewhere
// could still override a group. The before/after screenshots on the PR are the
// pixel check; this is the drift check.
//
// Run: node scripts/design-token-parity-smoke.mjs   (exit 0 = pass, 1 = fail)

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(process.env.TANDEM_HTML || join(root, 'tandem.html'), 'utf8');
const css = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>')).replace(/\/\*[\s\S]*?\*\//g, '');
const fails = [];

// ── tiny CSS reader: every rule (also inside @media) as {sels:[...], decls:Map} ──
function rules(text) {
  const out = []; let i = 0;
  while (i < text.length) {
    const open = text.indexOf('{', i); if (open < 0) break;
    const head = text.slice(i, open).trim();
    if (head.startsWith('@')) {           // descend into @media / @supports; skip @keyframes
      let d = 1, j = open + 1; while (d && j < text.length) { if (text[j] === '{') d++; else if (text[j] === '}') d--; j++; }
      if (!head.startsWith('@keyframes')) out.push(...rules(text.slice(open + 1, j - 1)));
      i = j; continue;
    }
    const close = text.indexOf('}', open);
    const decls = new Map();
    for (const d of text.slice(open + 1, close).split(';')) {
      const k = d.indexOf(':'); if (k < 0) continue;
      decls.set(d.slice(0, k).trim(), d.slice(k + 1).trim());
    }
    out.push({ sels: head.split(',').map(s => s.trim().replace(/\s+/g, ' ')), decls });
    i = close + 1;
  }
  return out;
}
const R = rules(css);
const rootRule = R.find(r => r.sels.includes(':root'));
const rulesFor = sel => R.filter(r => r.sels.includes(sel));

// [T1] tokens exist
const TOKENS = ['--r-card', '--r-pill', '--r-field', '--r-tile', '--card-bg', '--card-border', '--on-accent',
  '--btn-font', '--btn-weight', '--btn-shadow', '--ghost-bg', '--ghost-border', '--chip-font', '--chip-size',
  '--chip-weight', '--title-font', '--title-weight', '--title-track', '--nav-font', '--nav-size', '--nav-weight',
  '--eyebrow-font', '--eyebrow-size', '--eyebrow-track', '--navbar-bg', '--navbar-blur', '--navbar-border'];
for (const t of TOKENS) if (!rootRule || !rootRule.decls.has(t)) fails.push(`[T1] :root is missing the token ${t}`);

// [T2] Home's own rules read the tokens
const REF = [
  ['.dash-hero', 'border-radius', 'var(--r-card)'], ['.dash-hero', 'background', 'var(--card-bg)'],
  ['.dash-panel', 'border-radius', 'var(--r-card)'], ['.dash-panel', 'border', 'var(--card-border)'],
  ['.dash-chip', 'border-radius', 'var(--r-pill)'], ['.dash-chip', 'background', 'var(--ghost-bg)'],
  ['.tab-btn', 'font-family', 'var(--nav-font)'], ['.tab-btn', 'font-weight', 'var(--nav-weight)'],
  ['.tab-btn.tab-start', 'color', 'var(--on-accent)'],
];
for (const [sel, prop, want] of REF) {
  const got = rulesFor(sel).map(r => r.decls.get(prop)).filter(Boolean);
  if (!got.includes(want)) fails.push(`[T2] Home's ${sel} ${prop} is ${JSON.stringify(got)}, expected ${want} — the reference left the token`);
}

// [T3] + [T4] component groups: Home's selector and the screens' selectors share ONE rule
const GROUPS = [
  { name: 'main button', ref: '.dash-cta',
    members: ['.ob-next-btn', '.ob-build-btn', '.session-timer-start', '.sum-cta', '.auth-send-btn', '.profile-save-btn', '.duel-nudge', '.bug-send-btn', '.eq-set-btn', '.tc-card.primary .tc-cta'],
    owns: { 'background': 'var(--accent)', 'color': 'var(--on-accent)', 'border-radius': 'var(--r-pill)', 'font-family': 'var(--btn-font)', 'font-weight': 'var(--btn-weight)', 'box-shadow': 'var(--btn-shadow)' } },
  { name: 'chip', ref: '.nav-pill',
    members: ['.tool-btn', '.day-tab', '.log-chip', '.profile-pill', '.eq-btn', '.ftab'],
    owns: { 'border-radius': 'var(--r-pill)', 'font-family': 'var(--chip-font)', 'font-size': 'var(--chip-size)' } },
  { name: 'card', ref: '.ex-card',
    members: ['.day-header', '.setup-card', '.goal-card', '.auth-form', '.cardio-block', '.phase-banner', '.finish-banner', '.log-card', '.you-nutri-card'],
    owns: { 'border-radius': 'var(--r-card)' } },
  { name: 'tile', ref: '.dash-ring-card',
    members: ['.ob-toggle', '.day-dot', '.review-item', '.summary-stat', '.you-tile', '.mob-item', '.rest-timer'],
    owns: { 'border-radius': 'var(--r-tile)' } },
  { name: 'title', ref: '.dash-greet',
    members: ['.ob-card-title', '.goal-name', '.pb-name', '.dh-title', '.tc-title', '.modal-title', '.log-title', '.duel-title', '.auth-heading'],
    owns: { 'font-family': 'var(--title-font)', 'font-weight': 'var(--title-weight)', 'letter-spacing': 'var(--title-track)' } },
  { name: 'eyebrow', ref: '.dash-label',
    members: ['.ob-label', '.ob-field-label', '.ob-step-label', '.pb-eyebrow', '.block-label', '.set-hdr-cell', '.profile-section-label', '.auth-field-label', '.summary-stat-lbl'],
    owns: { 'font-family': 'var(--eyebrow-font)', 'font-size': 'var(--eyebrow-size)', 'letter-spacing': 'var(--eyebrow-track)' } },
  { name: 'nav bar', ref: '.tab-bar', members: ['.bottom-nav'],
    owns: { 'background': 'var(--navbar-bg)', 'border-top': 'var(--navbar-border)' } },
];
for (const g of GROUPS) {
  const all = [g.ref, ...g.members];
  const shared = R.filter(r => all.every(s => r.sels.includes(s)) && Object.keys(g.owns).every(p => r.decls.has(p)));
  if (shared.length !== 1) {
    const missing = all.filter(s => !R.some(r => r.sels.includes(s) && Object.keys(g.owns).every(p => r.decls.has(p))));
    fails.push(`[T3] ${g.name}: expected ONE rule listing ${g.ref} with every screen selector and owning ${Object.keys(g.owns).join(', ')}; found ${shared.length}. Not in it: ${missing.join(' ') || '(the group rule itself split or lost a property)'}`);
    continue;
  }
  for (const [p, want] of Object.entries(g.owns)) {
    if (shared[0].decls.get(p) !== want) fails.push(`[T3] ${g.name}: ${p} is ${shared[0].decls.get(p)}, expected ${want}`);
  }
  for (const s of all) {
    for (const r of rulesFor(s)) {
      if (r === shared[0] || r.sels.length > 1 && r.sels.every(x => all.includes(x))) continue;
      for (const p of Object.keys(g.owns)) {
        if (r.decls.has(p) && r.sels.length === 1) fails.push(`[T4] ${s} re-declares ${p}:${r.decls.get(p)} — the ${g.name} group owns it; delete it there`);
      }
    }
  }
}

// [T5] buttons are never monospace or ALL CAPS
const BUTTONS = new Set([...GROUPS[0].members, GROUPS[0].ref, ...GROUPS[1].members, GROUPS[1].ref,
  '.btn-secondary', '.log-more', '.auth-skip', '.you-settings-btn', '.wn-reset', '.rest-skip', '.sw-btn', '.set-act',
  '.clear-btn', '.ex-video-btn', '.tab-btn', '.bnav-btn', '.ob-toggle-label']);
for (const r of R) {
  const btnSels = r.sels.filter(s => BUTTONS.has(s.replace(/:(hover|active|disabled|focus)$|\.(on|active|primary|selected)$/g, '')));
  if (!btnSels.length) continue;
  if (r.decls.get('font-family') === 'var(--font-mono)') fails.push(`[T5] ${btnSels.join(',')} sets monospace on a button`);
  if (r.decls.get('text-transform') === 'uppercase') fails.push(`[T5] ${btnSels.join(',')} sets ALL CAPS on a button`);
}

// [T6] the workout bar is Home's tab-bar buttons, Finish is the middle circle, no action lost
const navHtml = (html.match(/<div class="bottom-nav" id="bottomNav">([\s\S]*?)<\/div>/) || [])[1] || '';
const btns = [...navHtml.matchAll(/<button class="([^"]*)" onclick="([^"]*)"/g)].map(m => ({ cls: m[1].split(/\s+/), on: m[2] }));
const WANT = ["showView('dashboard')", "openModal('plates')", "openModal('calc')", 'finishSession()', "openModal('history')", 'skipWorkout()'];
if (btns.length !== WANT.length) fails.push(`[T6] #bottomNav has ${btns.length} buttons, expected ${WANT.length}`);
for (const w of WANT) if (!btns.some(b => b.on === w)) fails.push(`[T6] #bottomNav lost the ${w} action`);
for (const b of btns) if (!b.cls.includes('tab-btn')) fails.push(`[T6] #bottomNav button ${b.on} is not a .tab-btn — it no longer shares Home's nav rule`);
const fin = btns.findIndex(b => b.on === 'finishSession()');
if (fin < 0 || !btns[fin].cls.includes('tab-start')) fails.push('[T6] Finish is not the .tab-start circle');
const left = btns.slice(0, fin).length, right = btns.slice(fin + 1).length;
const leftFlex = left, rightFlex = btns.slice(fin + 1).filter(b => b.cls.includes('bnav-right')).length * 1.5;
if (fin >= 0 && Math.abs(leftFlex - rightFlex) > 1e-9) fails.push(`[T6] Finish is off-centre: ${left} buttons left (flex ${leftFlex}) vs ${right} right (flex ${rightFlex}); the right side needs .bnav-right`);
if (!R.some(r => r.sels.includes('.bottom-nav .tab-btn.bnav-right') && r.decls.get('flex') === '1.5')) fails.push('[T6] .bottom-nav .tab-btn.bnav-right{flex:1.5} is gone — Finish would sit off-centre');

if (fails.length) {
  console.error(`design-token-parity-smoke — FAIL (${fails.length}):`);
  for (const f of fails) console.error('  ' + f);
  process.exit(1);
}
console.log(`design-token-parity-smoke — PASS: ${TOKENS.length} tokens, ${REF.length} Home reference reads, ${GROUPS.length} shared groups, button type, workout bar (${btns.length} actions, Finish centred)`);
