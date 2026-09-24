// asset-freshness-smoke.mjs
// Regression guard for BUG-153: a returning device could run a cached programs.js
// against a freshly-fetched tandem.html, since the <script src="programs.js"> tag
// carried no version/cache-busting signal and netlify.toml set no Cache-Control for
// either file. That produced a FALSE device-verify of BUG-122 on 2026-09-24 — Kerwin
// read the pre-fix engine's output while looking at the post-fix HTML.
//
// This test asserts the two structural halves of the fix stay wired together:
//   1. netlify.toml carries a Cache-Control rule that revalidates the HTML document
//      on every load (so an update is never silently withheld from the browser).
//   2. tandem.html's programs.js <script> tag carries the __COMMIT_REF__ placeholder
//      that netlify.toml's build command substitutes with Netlify's own $COMMIT_REF —
//      so a stale cached programs.js can never pair with a fresh document (each
//      deploy is a distinct URL).
// A future edit that silently drops either half fails this gate.
//
// Run: node scripts/asset-freshness-smoke.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

let failures = 0;
function check(label, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) failures++;
}

const toml = readFileSync(path.join(root, 'netlify.toml'), 'utf8');
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');

// ── 1. netlify.toml revalidates the HTML document ──
const htmlHeaderBlock = /\[\[headers\]\]\s*\n\s*for\s*=\s*"\/(index\.html)?"\s*\n\s*\[headers\.values\]\s*\n\s*Cache-Control\s*=\s*"no-cache"/;
check('netlify.toml sets Cache-Control: no-cache on the HTML document', htmlHeaderBlock.test(toml));

// ── 2. the build command substitutes __COMMIT_REF__ into the deployed HTML ──
check(
  'netlify.toml build command sed-substitutes __COMMIT_REF__ using $COMMIT_REF',
  /sed -i .*__COMMIT_REF__.*COMMIT_REF/.test(toml.replace(/\n/g, ' '))
);

// ── 3. tandem.html's programs.js script tag carries the placeholder ──
const scriptTagMatch = html.match(/<script src="programs\.js\?v=([^"]+)"><\/script>/);
check('tandem.html programs.js <script> tag carries a ?v= query string', !!scriptTagMatch);
check(
  'the ?v= value is the __COMMIT_REF__ placeholder netlify.toml substitutes',
  !!scriptTagMatch && scriptTagMatch[1] === '__COMMIT_REF__'
);

// ── 4. programs.js itself can be cached long-lived now that it's versioned by URL ──
check(
  'netlify.toml sets a long-lived Cache-Control on /programs.js (safe: query string changes per deploy)',
  /for\s*=\s*"\/programs\.js"\s*\n\s*\[headers\.values\]\s*\n\s*Cache-Control\s*=\s*"[^"]*max-age/.test(toml)
);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED`);
  process.exit(1);
}
console.log('\nAll asset-freshness checks passed.');
