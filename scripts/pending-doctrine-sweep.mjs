#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// PENDING DOCTRINE SWEEP — closes the gap that let D6b sit invisible for weeks.
//
// WHY THIS EXISTS (2026-09-08, Kerwin, live in-session):
// "The fact 6b has been sitting there, knowingly as a great feature, and this
// routine kept saying it had nothing to do."
//
// The catalog stage (.claude/loop-config.md catalog.mode: "tracker_seeded") only
// ever seeds work from the Bug & QA Log and open Epics — deliberately, per
// Kerwin's 2026-06-23 directive, so the loop can't invent speculative product
// opinions. But a PENDING doctrine invariant (DOCTRINE.md, status "⏳") is not
// speculative — it is already-cited, already-decided-as-worth-building science,
// sitting in a file the catalog stage never reads. D6b had a real citation
// ("v0.5 volume table; Findings 3-remainder, 4") and was blocked on nothing but
// nobody building it, yet every cycle reported "nothing buildable" because it
// wasn't a tracker row.
//
// THE RULE THIS SCRIPT ENFORCES: every PENDING invariant is either genuinely
// blocked on a decision/prerequisite (stays PENDING, correctly excluded), or it
// is buildable right now with its existing citation (gets surfaced, every
// cycle, until someone builds it or a human decides otherwise). "Nothing to
// do" is never a silent default for a row this script can see.
//
// Usage: node scripts/pending-doctrine-sweep.mjs [--json]
// Exit 0 always (this is a discovery sweep, not a pass/fail gate) — it prints
// what it found. A cycle that finds a BUILDABLE row and does nothing about it
// is the failure mode this exists to prevent, not a script failure.
// ═══════════════════════════════════════════════════════
import { readFileSync } from 'fs';

const JSON_OUT = process.argv.includes('--json');
const doctrine = readFileSync(new URL('../DOCTRINE.md', import.meta.url), 'utf8');

// A row's own STATUS cell, not its prose, is the one place this project already
// writes the blocking condition in a consistent, greppable shape — reuse that
// convention rather than inventing a second classification scheme.
const BLOCKED_STATUS = /ruled|ruling|when added/i;
const ROW_RE = /^\|\s*\*\*(D\d+[a-z]?)\*\*\s*\|(.*?)\|\s*(⏳[^|]*)\|(.*?)\|$/gm;

const rows = [];
for (const m of doctrine.matchAll(ROW_RE)) {
  const [, id, body, status, source] = m;
  const blocked = BLOCKED_STATUS.test(status);
  rows.push({
    id,
    status: status.trim(),
    blocked,
    reason: blocked
      ? 'status names a decision/prerequisite gate — correctly excluded, not buildable now'
      : 'no decision/prerequisite gate in its own status — buildable now with its existing citation',
    citation: source.trim(),
    body: body.trim().slice(0, 220) + (body.trim().length > 220 ? '…' : ''),
  });
}

const buildable = rows.filter(r => !r.blocked);
const blocked = rows.filter(r => r.blocked);

if (JSON_OUT) {
  console.log(JSON.stringify({ rows, buildable, blocked }, null, 2));
} else {
  console.log(`\n═══ PENDING DOCTRINE SWEEP — ${rows.length} PENDING invariant(s) found ═══\n`);
  for (const r of rows) {
    console.log(`  ${r.blocked ? '⏳ BLOCKED  ' : '🟢 BUILDABLE'}  ${r.id}  (${r.status})`);
    console.log(`      ${r.reason}`);
    console.log(`      cites: ${r.citation}`);
    console.log(`      ${r.body}\n`);
  }
  console.log(`  ${buildable.length} buildable-now, ${blocked.length} genuinely blocked (decision/prerequisite named in status).`);
  if (buildable.length) {
    console.log(`\n  ACTION REQUIRED: seed an Untested story per buildable row (linked to its DOCTRINE.md`);
    console.log(`  citation, not reverse-engineered) if one doesn't already exist in the tracker —`);
    console.log(`  per .claude/loop-config.md's pending_doctrine_sweep self_generated_source. A cycle`);
    console.log(`  that sees a buildable row here and reports "nothing to do" is the exact failure`);
    console.log(`  this script exists to prevent.`);
  }
}
