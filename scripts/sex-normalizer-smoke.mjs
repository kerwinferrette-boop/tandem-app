#!/usr/bin/env node
/**
 * sex-normalizer-smoke.mjs — BUG-271 guard. Sex is compared through ONE normalizer, never against a raw string.
 * Static, no browser.
 *
 * Why (2026-11-17): onboarding stores sex as 'F' / 'M' (selectSex('F')), the profile stores
 * 'female' / 'male' / 'other', and programs.js's isFemaleSex() accepts both spellings.
 * renderBaselineEstimates() compared `selectedSex === 'female'` — false for 'F' — so every woman
 * in onboarding was shown the men's baseline-estimate list. Same class as BUG-73/BUG-114: one
 * spelling checked, the other silently falls to the default.
 *
 * Rule: a variable whose name contains "sex" may not be compared with ===/==/!==/!= to a sex
 * literal ('f','m','female','male','F','M'). Use isFemaleSex(). The two normalizers themselves
 * are allowlisted below, each with its reason.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const files = (process.env.SEX_SMOKE_FILES || 'tandem.html,programs.js').split(',');
// [file, substring that identifies the line, reason]
const ALLOW = [
  ['programs.js', "return s === 'f' || s === 'female';", 'isFemaleSex() itself — the one normalizer'],
  ['tandem.html', "return (s === 'f' || s === 'female') ? 'female' : 'male';", 'heroSexKey(): lower-cases first, accepts both spellings (photo choice only)'],
  ['tandem.html', "p.sex==='female'?'female':p.sex==='male'?'male':'male'", 'avatar drawing reads profileState, whose values are always female/male/other'],
];
const rx = /\b\w*sex\w*\s*(?:===|!==|==|!=)\s*['"](?:f|m|female|male)['"]|['"](?:f|m|female|male)['"]\s*(?:===|!==|==|!=)\s*\w*sex\w*\b/i;

const fails = []; let scanned = 0;
for (const f of files) {
  readFileSync(join(root, f), 'utf8').split('\n').forEach((line, i) => {
    scanned++;
    if (/^\s*\/\//.test(line) || !rx.test(line)) return;
    if (ALLOW.some(([af, sub]) => f.endsWith(af) && line.includes(sub))) return;
    fails.push(`${f}:${i + 1}: ${line.trim().slice(0, 140)}`);
  });
}
if (fails.length) {
  console.log(`sex-normalizer smoke FAILED — raw sex comparison(s); use isFemaleSex():\n  ${fails.join('\n  ')}`);
  process.exit(1);
}
console.log(`sex-normalizer smoke: no raw sex-string comparison in ${files.join(', ')} (${scanned} lines; ${ALLOW.length} allowlisted normalizers)`);
