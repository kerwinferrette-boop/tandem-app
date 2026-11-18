#!/usr/bin/env node
/**
 * why-injury-consistency-smoke.mjs — BUG-276 guard: no EXERCISE_BANK why-string recommends an
 * exercise for an injury that the injury filter bans it for.
 *
 * Found 2026-11-18 at cf42edf: EXERCISE_BANK['landmine-press'].why called it "the most
 * shoulder-friendly pressing option for people with impingement or AC joint issues", while
 * makeInjuryBlocked bans "landmine press" for shoulder, impingement, rotator, labrum and AC-joint
 * injuries. The app told a user with impingement the lift suits them, and the generator would never
 * give it to them. The filter is SAFETY tier and is the side that stays; the copy is what moves.
 *
 * Runs the REAL makeInjuryBlocked() and EXERCISE_BANK from the WORKING-TREE programs.js in node:vm
 * (no copy of the injury rules lives here, so a rule change is seen the day it lands).
 *   W1  for every bank entry, every sentence of its why-string that reads as a recommendation
 *       (RECOMMEND below) is fed to makeInjuryBlocked as if it were the user's injury text; if the
 *       resulting filter bans that entry's own name, the sentence recommends the exercise for an
 *       injury it is banned for, and the check fails naming the entry and the sentence
 *   W2  anti-vacuity: the detector fires on a planted copy of the 2026-11-18 sentence, and the
 *       filter still bans Landmine Press for impingement (so W1 is testing a live rule)
 *   W3  coverage: every bank entry has a why-string that was read
 *   W4  the KNOWN residual list (other entries with the same contradiction, out of this row's scope)
 *       cannot go stale: each listed sentence must still occur, so a fix forces its removal
 */
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const code = readFileSync(process.env.WHY_INJURY_PROGRAMS || join(root, 'programs.js'), 'utf8');   // working tree, on purpose
const { EXERCISE_BANK, makeInjuryBlocked } = vm.runInNewContext(
  `(function(){ ${code}; return { EXERCISE_BANK, makeInjuryBlocked }; })()`, { console });

// A sentence "reads as a recommendation" for a condition when it says the lift is kind to it or
// meant for people who have it. Mentioning a body part on its own ("trains shoulder flexion") is
// not a recommendation and does not trip this.
const RECOMMEND = /(friendly|safe(?:r|st)?\b|ideal for|suit(?:s|ed|able)|recommended|gentle on|eas(?:y|ier) on|kind to|better fit|(?:people|those|lifters|anyone|someone|users?) (?:with|who\b)|whose [\w ]{0,20}\blimits?\b|issues|injur|pain\b|sensitiv|history|rehab)/i;
const sentences = (s) => String(s || '').split(/(?<=[.!?])\s+|\s+[—–]\s+/).map(t => t.trim()).filter(Boolean);
const offending = (entry) => sentences(entry.why)
  .filter(sen => RECOMMEND.test(sen) && makeInjuryBlocked(sen)(entry.name));

// KNOWN residuals, found by this guard on 2026-11-18 and NOT fixed under BUG-276, which is
// scope-locked to Landmine Press. Each is the same contradiction in another entry; they are
// reported for their own rows rather than silently edited here. Exact slug + exact sentence: a new
// case, or a reworded one, is not covered and fails W1; an entry whose sentence is gone fails W4 so
// this list cannot go stale. Remove an entry in the commit that fixes it.
const KNOWN = {
  'db-shoulder-press': ['critical for lifters with shoulder asymmetries or impingement history.'],
  'cable-upright-row': ['Attach a wide bar or EZ-bar to keep the shoulder-friendly wide grip.'],
  'reverse-lunge': [
    'far easier on the knee than a forward lunge while still loading the quad and glute hard.',
    'The knee-friendly single-leg builder and a better fit for lifters with knee sensitivity.',
  ],
  // The filter bans every "deadlift" for a lower-back injury; this entry cites a review for the
  // trap bar unloading the lower back. Which side is right is a SAFETY-tier call for Kerwin.
  'trap-bar-deadlift': ["The deadlift pattern's own answer for lifters whose lower back limits a conventional pull."],
};

const fails = [];
let read = 0, recommendSentences = 0, known = 0;
for (const [slug, e] of Object.entries(EXERCISE_BANK)) {
  if (typeof e.why !== 'string' || !e.why.trim()) { fails.push(`W3 ${slug} has no why-string to check`); continue; }
  read++;
  recommendSentences += sentences(e.why).filter(s => RECOMMEND.test(s)).length;
  for (const sen of offending(e)) {
    if ((KNOWN[slug] || []).includes(sen)) { known++; continue; }
    fails.push(`W1 ${slug} (${e.name}) recommends itself for an injury its own filter bans it for: "${sen}"`);
  }
}
// W4: the known list may only shrink by fixing an entry
for (const [slug, list] of Object.entries(KNOWN)) for (const sen of list) {
  const e = EXERCISE_BANK[slug];
  if (!e || !offending(e).includes(sen)) fails.push(`W4 known residual ${slug} "${sen}" no longer occurs: remove it from KNOWN`);
}

// W2
const planted = { name: 'Landmine Press', why: 'The landmine arc is dictated by physics, not a fixed track — the most shoulder-friendly pressing option for people with impingement or AC joint issues.' };
if (!offending(planted).length) fails.push('W2 the detector does not fire on the 2026-11-18 Landmine Press sentence: the guard would be vacuous');
if (!makeInjuryBlocked('impingement')('Landmine Press')) fails.push('W2 makeInjuryBlocked no longer bans Landmine Press for impingement: W1 has nothing live to test against');

if (fails.length) {
  for (const f of fails) console.error(`✗ ${f}`);
  console.error(`FAIL why-injury-consistency-smoke: ${fails.length} check(s)`);
  process.exit(1);
}
console.log(`✓ none of ${read} EXERCISE_BANK why-strings recommends its exercise for an injury makeInjuryBlocked bans it for beyond ${known} known residual sentence(s) in ${Object.keys(KNOWN).length} other entries left for their own rows (${recommendSentences} recommendation-style sentences checked against the live filter; detector proven on the 2026-11-18 sentence)`);
