#!/usr/bin/env node
// why-availability-smoke.mjs — FEAT "context-aware exercise rationale per equipment tier"
// (in-app report 382243a7, Kerwin, 2026-07-03: a full-gym workout showed "accessible
// anywhere"-style rationale copy).
//
// MECHANISM: the tier ladder re-serves home / hotel_gym bank entries to full_gym users
// (tierOrder = home, hotel_gym, full_gym), and every EXERCISE_BANK entry carries ONE
// tier-agnostic `why`. So an availability sentence ("anywhere", "zero equipment",
// "accessible with just a pair of dumbbells") is true for the tier it was written for and
// false-sounding for the tier that receives it. A `why` states WHY the movement trains the
// muscle; where it can be performed is not a training rationale, so it does not belong in
// the one string every tier shares.
//
// This gate fails if any EXERCISE_BANK `why` carries availability phrasing. It checks the
// bank entry itself (not one rendered program) so a lift served only on a rare path cannot
// hide. A real per-tier rationale would need a tier-keyed field; if one is ever added, this
// gate is the thing to relax, deliberately, with a reason.
//
// Run: node scripts/why-availability-smoke.mjs   (exit 1 on any hit)
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = process.env.WHY_SMOKE_SRC || join(root, 'programs.js');
const { EXERCISE_BANK } = vm.runInNewContext(
  `(function(){ ${readFileSync(src, 'utf8')}; return { EXERCISE_BANK }; })()`, { console });

// Availability / accessibility phrasing only. NOT bare "travel" (movement cues use it:
// "knees travel forward") and NOT "any gym" (names a venue the user is already in).
const AVAILABILITY = /\banywhere\b|\bzero[- ]equipment\b|\bno equipment\b|\bno (?:gym|machine) access\b|\bno cable required\b|\baccessible\b|\bneeds only\b|\bequipment beyond\b|\btravels? anywhere\b/i;

const bad = [];
for (const [slug, ex] of Object.entries(EXERCISE_BANK)) {
  const m = AVAILABILITY.exec(ex.why || '');
  if (m) bad.push(`${slug} (${ex.tier}): "…${(ex.why).slice(Math.max(0, m.index - 25), m.index + m[0].length + 25)}…"`);
}
if (bad.length) {
  console.error(`FAIL — ${bad.length} of ${Object.keys(EXERCISE_BANK).length} EXERCISE_BANK entries carry availability phrasing in their shared \`why\`:`);
  bad.forEach(b => console.error('  ' + b));
  process.exit(1);
}
console.log(`PASS — 0 of ${Object.keys(EXERCISE_BANK).length} EXERCISE_BANK \`why\` strings carry availability phrasing`);
