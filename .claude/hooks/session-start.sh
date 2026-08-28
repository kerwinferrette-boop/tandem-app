#!/bin/bash
# session-start.sh — runs automatically at every session start.
#
# WHY (Kerwin, 2026-08-28: "how do we fix that protocol"):
# docs/WAVE-STATE.md:109 already said "run `git worktree list` FIRST" and a session
# skipped it anyway, rebuilding BUG-87 from scratch. Prose in a doc does not execute.
# The harness runs this file, so no session can forget it, be in a hurry, or reason
# its way past it. That is the whole point — this is the only layer the model cannot skip.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-/home/user/tandem-app}" || exit 0

# 1. Dependencies. `npm run walkthrough:onboarding` (a standing per-cycle gate) fails
#    with ERR_MODULE_NOT_FOUND on a fresh container until playwright is installed —
#    this happened during the 2026-08-28 session and cost a manual step. Idempotent,
#    and the container image is cached after the hook completes.
if [ -f package.json ]; then
  npm install --no-audit --no-fund >/dev/null 2>&1 || echo "  ⚠ npm install failed — walkthrough:onboarding may not run"
fi

# 2. State report. Never blocks: preflight always exits 0 by design.
node scripts/preflight.mjs 2>&1 || true
