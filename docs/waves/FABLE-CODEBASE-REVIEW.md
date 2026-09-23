# Fresh-eyes codebase review — Fable handoff prompt (2026-09-23)

Paste this into a new Fable session. It is **read-only**: it finds and proves problems, it
does not fix them. Fixes happen afterwards, one finding at a time, after Kerwin triages.

---

You are reviewing Tandem, a couples fitness app: `tandem.html` + `programs.js`, with a
Supabase backend, deployed on Netlify. Read these first:
- `/CLAUDE.md`
- `docs/self-corrections.md` (the mistakes previous sessions made, so you don't repeat them)
- `/DOCTRINE.md`

**Rules**
1. **Do not edit app code, schema or data.** Your only output is
   `docs/review-<date>.md`, committed on a branch.
2. **Prove every finding by running it**, not by reading it (SC-03).
   - Use a node script against `programs.js`, a Playwright run of `tandem.html` (see
     `scripts/onboarding-lifecycle-walkthrough.mjs` for the Supabase stub), or a
     read-only SQL query.
   - A finding you could not reproduce goes under **Suspected**, never **Confirmed**.
3. **Cite each finding.** Give `file:line`, the exact input that triggers it, what happens,
   what should happen, and the severity:
   - **P0**: data loss, security, or wrong numbers shown to the user.
   - **P1**: a broken flow.
   - **P2**: polish.
4. **Fix the mechanism, not the instance.** For each finding, say what shared function or
   table it lives in, and which other goals, day-counts or screens hit the same path.
5. **Deduplicate against Notion's Bug & QA Log** (data source
   `caaf2179-c4e4-4ce1-9a32-eb46ffdbd6a0`). Mark a finding "already logged as BUG-x" rather
   than re-reporting it.
6. **Exercise-science claims** go through the `exercise-science-research` skill with
   citations. Do not report a number from memory.
7. Use test accounts only: `kerwinferrette+test@gmail.com` and `+testdani`.

**Where previous sessions found drift. Start here, then go wider:**
- **Rules copied in two places.** PR points were 5 in JS and 25 in the SQL view (unified
  2026-09-23; both halves applied). Hunt for any other rule that lives in both a
  view or trigger and JS: points, streaks, PRs, 1RM, week counting.
- **Sync layer.**
  - `sets` writes are not conflict-tolerant; see the header of
    `migrations/0017_bug16_sets_uniqueness.sql`.
  - The C11 session merge.
  - `syncPRs()` re-uploading stale PRs (BUG-131).
  - Offline-then-online ordering.
- **Dates.** Day counts use `Math.floor` over milliseconds (BUG-27, DST). Also check local vs
  UTC dates everywhere a "week" or "today" is computed.
- **Ids.** Exercise ids must be unique per program (persona rule R10). Follow-up:
  `phase.subs` still matches on raw ids.
- **Security.**
  - RLS on every table.
  - The `anon` role currently holds INSERT, UPDATE, DELETE and TRUNCATE grants on the
    `competition_leaderboard` view. Confirm this is inert, or flag it.
  - Any Supabase key or secret in the client beyond the publishable key.
- **Log tab** (`renderLogTab`) reads only localStorage history, capped at 100 sessions. Is
  that the right source of truth versus the `sets` table?
- **Engine.**
  - PENDING doctrine items D6d, D30 and D28.
  - Single-lift sessions can reach up to 11 sets (D33, known gap).
  - Anything that the persona matrix (`npm run validate:personas`) doesn't sweep: experience
    × duration × injury combinations.
- **Dead code and silent failures.** Errors swallowed in `catch {}`, and handlers wired to
  nothing (`scripts/audit-dead-handlers.mjs`).

**Output format** for `docs/review-<date>.md`:
- A one-screen summary: counts by severity, and the top 5 findings to fix first.
- **Confirmed** findings, most severe first, each with its repro command and output.
- **Suspected** findings, with what would confirm them.
- **Holes**: what's missing that the app's goals need (Home/Plan/Log/Duel/You, competition,
  program engine). These are gaps, not bugs.

Before you finish, run `npm run verify` and `npm run validate:personas`, and report both
results as a baseline.
