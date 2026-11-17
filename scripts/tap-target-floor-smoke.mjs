#!/usr/bin/env node
/**
 * tap-target-floor-smoke.mjs — BUG-251 guard: the shared control classes give every tappable
 * control a hit area of at least 44 x 44 CSS px (Apple HIG 44pt), at the class level, so current
 * and future controls inherit it.
 *
 * Measured on production 2026-11-17 by scripts/lane-visual-sweep.mjs (Lane Preview Check run
 * 44153150067): Profile pill 37x29, Wk pill 59x26, Log range chips 28 tall, tracker Today 30 tall,
 * PRs/History/Goal 30 tall, "Swap this for me" 15 tall, rest Skip 40x22, cardio Start 53x30.
 *
 * Two shapes, both read from the WORKING-TREE tandem.html (never a git ref):
 *   GROWN   the painted box itself is at least 44 x 44: the class's own rule resolves min-height
 *           and min-width to >= 44px. Used where a hit-slop overlay would be clipped (the Log
 *           chips and tracker tools sit in overflow-x:auto rows, which clip both axes) or where
 *           the row has room.
 *   SLOP    the painted box stays as designed and a transparent ::after overlay, centred on the
 *           control, is at least 44 x 44 (max(100%,44px)); the host is position:relative. Used for
 *           the header pills only, because growing them makes the sticky header taller on every
 *           screen.
 * Checks:
 *   T1  each GROWN class resolves min-height and min-width >= 44px (last declaration wins)
 *   T2  the SLOP class has position:relative and a centred, tappable ::after of >= 44 x 44
 *   T3  nothing undoes it: no rule for these classes (any media query, any compound selector)
 *       sets height / max-height / min-height / min-width below 44px, removes the overlay
 *       (content:none, pointer-events:none) or repositions the SLOP host; no inline style on an
 *       element carrying one of these classes does either
 *   T4  anti-vacuity: every class is still used by at least one tappable control in the markup
 *   T5  the text-link control (.ex-note-swap) keeps its label vertically centred in the taller box
 *   T6  the measuring instrument sees hit-slop: lane-visual-sweep reads the ::after overlay and
 *       confirms it with elementFromPoint before it counts it
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIN = 44;
const GROWN = ['log-chip', 'tool-btn', 'wn-reset', 'rest-skip', 'sw-btn', 'ex-note-swap'];
const SLOP = ['nav-pill'];
const ALL = [...GROWN, ...SLOP];

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(process.env.TAP_FLOOR_HTML || join(root, 'tandem.html'), 'utf8');   // working tree, on purpose
const sweepSrc = readFileSync(join(root, 'scripts', 'lane-visual-sweep.mjs'), 'utf8');
const fails = [];
const ok = (label, cond, detail = '') => { if (!cond) fails.push(`${label}${detail ? ` — ${detail}` : ''}`); };

// ── CSS: every <style> block, comments stripped, flattened into [selectorList, body, media] ──
const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [];
(function walk(src, media) {
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf('{', i);
    if (open < 0) break;
    const sel = src.slice(i, open).trim();
    let depth = 1, j = open + 1;
    for (; j < src.length && depth; j++) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; }
    const body = src.slice(open + 1, j - 1);
    if (sel.startsWith('@')) walk(body, sel); else rules.push({ sels: sel.split(',').map(s => s.trim()), body, media });
    i = j;
  }
})(css, null);
const decls = (body) => Object.fromEntries(body.split(';').map(d => d.split(':')).filter(p => p.length >= 2)
  .map(([k, ...v]) => [k.trim().toLowerCase(), v.join(':').trim().replace(/\s*!important$/, '')]));
const px = (v) => { const m = /^(-?[\d.]+)px$/.exec(String(v || '').trim()); return m ? Number(m[1]) : null; };
// The size a value guarantees: a px number, or the px floor of max(100%, Npx).
const floorPx = (v) => { const p = px(v); if (p != null) return p; const m = /^max\(\s*100%\s*,\s*([\d.]+)px\s*\)$/.exec(String(v || '').trim()); return m ? Number(m[1]) : null; };
// selector targets the class (as the subject's last compound), optionally with a pseudo-element
const targets = (sel, cls, pseudo = '') => new RegExp(`\\.${cls}(?![\\w-])[\\w.:\\[\\]="'-]*${pseudo ? `::${pseudo}` : ''}$`).test(sel)
  && (pseudo || !/::/.test(sel.slice(sel.lastIndexOf(`.${cls}`))));
const plain = (sel, cls, pseudo = '') => sel === `.${cls}${pseudo ? `::${pseudo}` : ''}`;
const resolve = (cls, prop, pseudo = '') => {
  let v = null;
  for (const r of rules) if (!r.media && r.sels.some(s => plain(s, cls, pseudo))) { const d = decls(r.body); if (prop in d) v = d[prop]; }
  return v;
};

// T1
for (const c of GROWN) for (const prop of ['min-height', 'min-width']) {
  const v = resolve(c, prop);
  ok(`T1 .${c} ${prop} >= ${MIN}px`, (floorPx(v) ?? 0) >= MIN, `resolves to ${v ?? 'unset'}`);
}

// T2
for (const c of SLOP) {
  ok(`T2 .${c} is position:relative (the overlay's anchor)`, resolve(c, 'position') === 'relative', `resolves to ${resolve(c, 'position') ?? 'unset'}`);
  const a = (p) => resolve(c, p, 'after');
  ok(`T2 .${c}::after has content`, a('content') != null && a('content') !== 'none');
  ok(`T2 .${c}::after is position:absolute`, a('position') === 'absolute', `${a('position') ?? 'unset'}`);
  ok(`T2 .${c}::after width >= ${MIN}px`, (floorPx(a('width')) ?? 0) >= MIN, `${a('width') ?? 'unset'}`);
  ok(`T2 .${c}::after height >= ${MIN}px`, (floorPx(a('height')) ?? 0) >= MIN, `${a('height') ?? 'unset'}`);
  ok(`T2 .${c}::after is centred on the control`, a('left') === '50%' && a('top') === '50%'
    && /^translate\(\s*-50%\s*,\s*-50%\s*\)$/.test(a('transform') || ''), `left=${a('left')} top=${a('top')} transform=${a('transform')}`);
}

// T3: nothing undoes it
const SIZE = ['height', 'max-height', 'min-height', 'min-width', 'width', 'max-width'];
const tooSmall = (prop, v) => {
  const p = floorPx(v);
  if (prop === 'width' || prop === 'max-width') return p != null && p < MIN;
  return p != null && p < MIN;
};
for (const r of rules) for (const s of r.sels) for (const c of ALL) {
  const where = `${s}${r.media ? ` in ${r.media}` : ''}`;
  const d = decls(r.body);
  if (targets(s, c)) {
    for (const prop of SIZE) if (prop in d && tooSmall(prop, d[prop])) fails.push(`T3 ${where} sets ${prop}:${d[prop]} on .${c}`);
    if (SLOP.includes(c) && 'position' in d && d.position !== 'relative' && !plain(s, c)) fails.push(`T3 ${where} moves the .${c} overlay anchor (position:${d.position})`);
  }
  if (SLOP.includes(c) && targets(s, c, 'after') && !plain(s, c, 'after')) {
    if (d.content === 'none') fails.push(`T3 ${where} removes the .${c} hit overlay`);
    if (d['pointer-events'] === 'none') fails.push(`T3 ${where} makes the .${c} hit overlay untappable`);
    for (const prop of ['width', 'height']) if (prop in d && (floorPx(d[prop]) ?? MIN) < MIN) fails.push(`T3 ${where} shrinks the .${c} overlay ${prop} to ${d[prop]}`);
  }
}
const tags = [...html.matchAll(/<(button|div|a|span)\b[^>]*\bclass="([^"$]*)"[^>]*>/g)];
const uses = Object.fromEntries(ALL.map(c => [c, 0]));
for (const t of tags) {
  const classes = t[2].split(/\s+/);
  for (const c of ALL) {
    if (!classes.includes(c)) continue;
    uses[c]++;
    const st = /\bstyle="([^"]*)"/.exec(t[0]);
    if (!st) continue;
    const d = decls(st[1]);
    for (const prop of SIZE) if (prop in d && tooSmall(prop, d[prop])) fails.push(`T3 inline style on .${c} (${t[0].slice(0, 70)}…) sets ${prop}:${d[prop]}`);
    if (SLOP.includes(c) && 'position' in d && d.position !== 'relative') fails.push(`T3 inline style on .${c} sets position:${d.position}`);
  }
}

// T4
for (const c of ALL) ok(`T4 .${c} is used by at least one control in the markup`, uses[c] > 0);

// T5
ok('T5 .ex-note-swap centres its label in the taller box', resolve('ex-note-swap', 'display') === 'flex' && resolve('ex-note-swap', 'align-items') === 'center',
  `display=${resolve('ex-note-swap', 'display')} align-items=${resolve('ex-note-swap', 'align-items')}`);

// T6
ok('T6 lane-visual-sweep reads the ::after hit overlay', /getComputedStyle\(\s*el\s*,\s*'::after'\s*\)/.test(sweepSrc));
ok('T6 lane-visual-sweep confirms the overlay with elementFromPoint before counting it', /hitExtent\s*\(/.test(sweepSrc) && /function hitExtent[\s\S]{0,600}elementFromPoint/.test(sweepSrc));

if (fails.length) {
  for (const f of fails) console.error(`✗ ${f}`);
  console.error(`FAIL tap-target-floor-smoke: ${fails.length} check(s)`);
  process.exit(1);
}
console.log(`✓ tap-target floor ${MIN}px holds at the class level: grown ${GROWN.map(c => '.' + c).join(' ')}; hit-slop ${SLOP.map(c => '.' + c).join(' ')}; no rule or inline style undoes it; ${tags.filter(t => ALL.some(c => t[2].split(/\s+/).includes(c))).length} controls in the markup carry one of these classes; the sweep measures the overlay`);
