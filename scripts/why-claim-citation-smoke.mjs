#!/usr/bin/env node
// why-claim-citation-smoke.mjs — BUG-283.
//
// A user-facing `why` string that makes a MEASURED or COMPARATIVE claim (an EMG
// result, or "more than lying/prone/seated <x>") must carry a primary-tier citation
// on its own entry, or not make the claim. BUG-282 fixed one such claim on the
// EXERCISE_BANK 'seated-leg-curl' entry; its sibling sweep grepped one spelling and
// missed the same seated-vs-lying claim on the static-library 'bm-slc' entry and 17
// uncited EMG lines (SC-60: sweep by the claim, not the spelling). This gate sweeps by
// the claim, over every why in programs.js.
//
// Assertions:
//   [a] every why matching CLAIM has a CITE marker inside its own entry span
//       (entry start = nearest preceding `{id:'…'` or two-space-indented bank key
//       `'key':{`, entry end = the why line). Fail closed: a claim-bearing why whose
//       entry start cannot be found FAILS, it is never skipped.
//   [b] inventory cross-check (SC-65): the per-line walk and a whole-source regex
//       find the same number of why strings and the same number of claim-bearing
//       ones. A why the walk cannot see makes the counts differ and fails the gate.
//   [c] the allowlist is live: every allowlisted entry still exists and still
//       matches CLAIM. A stale allowlist entry fails.
//
// Run: node scripts/why-claim-citation-smoke.mjs   (exit 1 on any failure)
// Test hook: WHY_CITE_SRC=<path> reads a copy instead (used to mutation-test).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const srcPath = process.env.WHY_CITE_SRC || resolve(here, '../programs.js');
const src = readFileSync(srcPath, 'utf8');
const lines = src.split('\n');

const CLAIM = /EMG|than (lying|prone|seated)/i;
// A citation marker: a PMC/PMID id, a DOI, or an author-year ("Smith et al. 2014",
// "(Coratella et al., 2022)", "(Martín-Fuentes, Oliva-Lozano & Muyor, 2020)").
const CITE = /PMC\d{5,}|PMID:?\s*\d{6,}|\bDOI\b|\b10\.\d{4,}\/|et al\.?,?\s*\(?(19|20)\d{2}|\([^()]*,\s*(19|20)\d{2}\)/i;

// Entries whose why mentions EMG only to say NO such study exists — a statement of
// absence, not a measured claim, so there is nothing to cite. Keyed by entry id.
const ALLOW = {
  'band-lat-pulldown': 'states that no EMG study has compared band and cable pulldowns; a claim of absence, not a measurement',
};

const WHY_LINE = /\bwhy:\s*'((?:[^'\\]|\\.)*)'/;
const START = /\{id:'([^']+)'|^  '([\w-]+)':\{/;

const fails = [];
let walkWhys = 0, walkClaims = 0;
const seenAllow = new Set();
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(WHY_LINE);
  if (!m) continue;
  walkWhys++;
  const why = m[1];
  if (!CLAIM.test(why)) continue;
  walkClaims++;
  let s = -1, id = null;
  for (let j = i; j >= 0 && j >= i - 60; j--) {
    const sm = lines[j].match(START);
    if (sm) { s = j; id = sm[1] || sm[2]; break; }
  }
  if (s < 0) { fails.push(`[a] line ${i + 1}: claim-bearing why with no locatable entry start: "${why.slice(0, 80)}"`); continue; }
  if (ALLOW[id]) { seenAllow.add(id); continue; }
  const span = lines.slice(s, i + 1).join('\n');
  if (!CITE.test(span)) fails.push(`[a] line ${i + 1} (${id}): uncited claim: "${why.slice(0, 110)}"`);
}

// [b] second, differently-derived count over the whole source text.
const all = [...src.matchAll(/\bwhy:\s*'((?:[^'\\]|\\.)*)'/g)].map(x => x[1]);
const allClaims = all.filter(w => CLAIM.test(w)).length;
if (all.length !== walkWhys) fails.push(`[b] per-line walk saw ${walkWhys} why strings, whole-source regex saw ${all.length}`);
if (allClaims !== walkClaims) fails.push(`[b] per-line walk saw ${walkClaims} claim-bearing whys, whole-source regex saw ${allClaims}`);
if (walkWhys === 0) fails.push('[b] found zero why strings — the walk is broken, not the source clean');

// [c] allowlist must be live.
for (const id of Object.keys(ALLOW)) if (!seenAllow.has(id)) fails.push(`[c] allowlisted '${id}' no longer has a claim-bearing why — remove it from ALLOW`);

if (fails.length) {
  for (const f of fails) console.error('FAIL ' + f);
  console.error(`why claim citation smoke: ${fails.length} failure(s) over ${walkClaims} claim-bearing of ${walkWhys} why strings`);
  process.exit(1);
}
console.log(`PASS why claim citation: ${walkClaims} claim-bearing why strings of ${walkWhys}, all cited or allowlisted (${seenAllow.size} allowlisted)`);
