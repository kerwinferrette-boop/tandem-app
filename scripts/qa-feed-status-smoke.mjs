#!/usr/bin/env node
/**
 * qa-feed-status-smoke.mjs — REGRESSION GUARD for the QA feed's "still open" rule.
 *
 * WHY THIS EXISTS
 * ---------------
 * The QA badge used to filter user_bug_reports with .neq('status','resolved').
 * That made it UN-DRAINABLE: a bug report's terminal app-side state is
 * 'logged_to_notion' (an Epic/Bug row now tracks it), and resolution then
 * happens in Notion and is never synced back to Postgres. Measured 2026-09-30:
 * 18 rows sat at 'logged_to_notion' forever, so the badge read 21 when only 3
 * items (all agent_log) were actionable. Kerwin's report: "how do I move things
 * through my QA feed so I don't see those notifications?"
 *
 * The rule now lives in ONE place, `QA_BUG_OPEN`, read by BOTH the badge count
 * (refreshQACount) and the list (loadQAFeed). This gate exists because those are
 * two call sites for one rule — exactly the shape CLAUDE.md's "one rule, one
 * home" warns drifts. If someone re-inlines a status literal at either site, the
 * badge and the feed start disagreeing and nobody notices.
 *
 * WHAT IT IS NOT
 * --------------
 * This is a STATIC guard: it reads tandem.html, it does not touch Postgres. It
 * proves the two call sites share one rule; it cannot prove what the live row
 * counts are. (This container's egress policy blocks supabase.co, which is also
 * why the query uses the .in(col, array) form proven elsewhere in the file
 * rather than an unverifiable not-in.)
 *
 * HARD (fails the gate):
 *   [A] QA_BUG_OPEN is declared exactly once
 *   [B] every user_bug_reports status filter goes through QA_BUG_OPEN
 *   [C] no .neq('status', 'resolved') survives anywhere (the old, wrong rule)
 *   [D] the agent_log side still filters on resolved=false
 */
import fs from 'fs';

const html = fs.readFileSync(new URL('../tandem.html', import.meta.url), 'utf8');
// Strip whole-line `//` comments before pattern-matching. Without this the gate
// matches its own prose: the comment above QA_BUG_OPEN documents the old, wrong
// filter verbatim, and check [C] flagged that sentence as a live call site on
// the first run. Scanning comments for code is exactly the false positive this
// gate is supposed to be better than.
const code = html.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
let failed = 0;
const check = (name, ok, detail) => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`);
  if (!ok) failed++;
};

// [A] one home
const decls = [...code.matchAll(/^\s*const\s+QA_BUG_OPEN\s*=/gm)];
check('[A] QA_BUG_OPEN declared exactly once', decls.length === 1,
  `found ${decls.length} declarations`);

// [B] both user_bug_reports status filters read the constant.
// Find every query chain that touches user_bug_reports and filters on status.
const bugStatusFilters = [...code.matchAll(/user_bug_reports'\)[\s\S]{0,220}?\.(?:in|eq|neq|not)\(\s*'status'[^)]*\)/g)]
  .map(m => m[0]);
const viaConstant = bugStatusFilters.filter(f => /\.in\(\s*'status'\s*,\s*QA_BUG_OPEN\s*\)/.test(f));
check('[B] every user_bug_reports status filter uses QA_BUG_OPEN',
  bugStatusFilters.length >= 2 && viaConstant.length === bugStatusFilters.length,
  `${viaConstant.length}/${bugStatusFilters.length} via the constant; offenders:\n        ` +
  bugStatusFilters.filter(f => !viaConstant.includes(f))
    .map(f => f.replace(/\s+/g, ' ').slice(0, 150)).join('\n        '));

// [C] the old rule is gone for good
const oldRule = [...code.matchAll(/\.neq\(\s*'status'\s*,\s*'resolved'\s*\)/g)];
check("[C] no .neq('status','resolved') remains (the un-drainable rule)",
  oldRule.length === 0, `found ${oldRule.length} occurrence(s)`);

// [D] agent_log half untouched — it has a working Resolve button, so resolved=false is correct
check('[D] agent_log still filters resolved=false',
  /agent_log'\)[\s\S]{0,200}?\.eq\(\s*'resolved'\s*,\s*false\s*\)/.test(code),
  'the agent_log open-items filter is missing or changed');

console.log(failed === 0
  ? '\nqa-feed-status-smoke: PASS'
  : `\nqa-feed-status-smoke: ${failed} FAILURE(S)`);
process.exit(failed === 0 ? 0 : 1);
