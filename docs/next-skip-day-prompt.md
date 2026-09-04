# Next Claude Code prompt — Skip Day control (BUG-56)

Paste everything between the lines into a fresh Claude Code session on this repo
(`kerwinferrette-boop/tandem-app`). It is self-contained — no context from any prior
conversation is assumed.

---

Read `CLAUDE.md` and `.claude/loop-config.md` first; both are binding for this repo.
Then run `node scripts/preflight.mjs` before touching anything — it's wired as a
SessionStart hook and should already have printed. Read its output before concluding
anything is missing, unstarted, or lost.

## The decision is already made — do not re-litigate it

BUG-56 (Notion page `3a7ca37f935b8179b336cbdd70966f22`, Tandem User Story Coverage)
sat at Needs Human since 2026-07-24 on two questions. Kerwin ruled on both directly,
2026-09-04, recorded on that page's Evidence field:

1. **A skip ADVANCES the weekly schedule pointer.** The next training day does not
   wait for the skipped day to be made up — the program moves forward.
2. **A skip is NOT purely client-side, and NOT a zero-volume completed session**
   (his words: "putting it at zeros messes the numbers up"). It persists as its own
   real state so the engine can later reference it — e.g. surfacing "you skipped leg
   day last week" or basing next session's suggested weight on the last REAL logged
   1RM rather than a phantom zero-volume session.

Read the full ruling on that Notion page before starting — don't rebuild the
reasoning from scratch, and don't ask Kerwin these two questions again.

## Three separable pieces of work — build and ship in this order

### Part 1 — Skip Day UI control (small, no schema dependency to START, but needs Part 2 to be MEANINGFUL)

Add a "Skip Day" affordance somewhere in the tracker view (`view-tracker` in
`tandem.html`) alongside the existing session-completion flow. Model the
day-advance logic on `finishSession()` (`tandem.html:4653`) — specifically its
`dayIdx`/`nextDay` computation and `LS.set('tandem_current_day', nextDay)` call —
but a skip must NOT run the rest of `finishSession()`'s completion path: no
`sessionSetsMap` history entry, no `syncToCloud()` volume push, no
`reconcileWorking1RMs()` call (there's nothing to reconcile — nothing was logged).

Relevant functions and their CURRENT line numbers (verified 2026-09-04 — a 2026-08-13
sequencing note on the linked bugs below cites stale line numbers from an earlier
revision; trust a fresh grep over that note, not its cited numbers):
- `finishSession()` — `tandem.html:4653`
- `localDateStr()` — `tandem.html:5269`
- `getWeekSchedule()` — `tandem.html:5668`
- `getProgramDayNumber()` — `tandem.html:5807`
- `renderDashboard()` — `tandem.html:6094`

### Part 2 — Schema: a real "skipped" state (migration FILE only — do not apply)

`workout_sessions` today (confirmed live via `information_schema.columns`,
2026-09-04) has no `status` column — only a `completed boolean` (default false) and
a `session_type text` (`NOT NULL`, default `'strength'`, no DB-level check
constraint found, so it's free text today even though the app presumably only ever
writes `'strength'`/`'cardio'`). Two honest options, not a foregone conclusion —
**pick one and say why, don't silently default:**
  - (a) Add a new nullable `status` text column (e.g. `'completed' | 'skipped'`),
    leave `completed` boolean as-is for backward compat, or deprecate it in favor
    of the new column — decide which and document it.
  - (b) Reuse `session_type`, adding `'skipped'` as a new value, with
    `completed=false`. Cheaper (no new column), but first grep every read site
    that branches on `session_type` (dashboard rendering, streak logic, `npm run
    outcome`'s exposure counter, `scripts/prod-integration.mjs`'s A4 check) to
    confirm none of them assume it's always `'strength'`/`'cardio'` and would
    silently mis-handle a third value.

Whichever you pick: per `.claude/loop-config.md`, this is a migration FILE
(`migrations/NNNN_*.sql`) committed in the same change as the code that uses it.
`apply_migration` stays human-only — draft it, do not apply it, and say so
explicitly when you get there. Read the live schema yourself
(`information_schema.columns`/`pg_constraint` via Supabase MCP) before writing the
migration — don't trust this prompt's description of the schema as gospel by the
time you're building; re-verify.

### Part 3 — Skip-aware program logic (the part that makes Part 1+2 worth building)

This is the actual point of Kerwin's ruling: once a skip is recorded, something
needs to READ that history and produce a catch-up suggestion or an adjusted next
weight. This is a periodization/program-logic decision, not a UI decision.

**Invoke the `exercise-science-research` skill BEFORE writing any of this logic.**
CLAUDE.md's prime directive is not optional here. Do not invent a "how to make up a
skipped session" rule, or a "how much to adjust next week's weight after a skip"
rule, from what sounds plausible. Consult the canonical sources (DOCTRINE.md,
Notion's Programming Architecture Reference / Periodization Spec) for what they
actually say about a missed session inside a periodized block. If they're silent,
say so explicitly and flag it rather than fabricating a number — per CLAUDE.md,
Kerwin can pull more research; a flagged gap is correct, a confident fabrication is
the failure mode this whole repo's process exists to eliminate.

Write the should/could/did audit (CLAUDE.md) into the commit for this part
specifically — it is the part most likely to get "shipped" without actually being
grounded in a source.

## Sequencing context — read before assuming this is standalone

BUG-56 was scoped 2026-08-13 as the last item in a four-bug sequencing batch
("Wave 6"): **BUG-18 → BUG-27 → BUG-16 → BUG-56**, all contesting the same four
functions listed above. Status as of 2026-09-04:

- **BUG-18** and **BUG-27** (Notion: `37cca37f935b812db463eaba3926e7e3`,
  `381ca37f935b817ead8df465724e6a2e`) — both marked "Code-complete 2026-06-29,
  pending device/deploy verify" in their Resolved In field, but Notion Status still
  reads **"New"**. The described fix (`localDateStr()` helper) IS confirmed present
  in `tandem.html` today. This is stale bookkeeping, not open work — but confirm
  with a real verify pass (`npm run verify`, and re-read the bugs' own repro steps
  against the live app) before flipping their Status to Resolved yourself; a grep
  confirming a function exists is not the same as confirming the bug's behavior is
  fixed. Do this reconciliation FIRST, since Part 1 builds directly on
  `getWeekSchedule`/`getProgramDayNumber`, and you want to know their real state
  before adding a fifth consumer.
- **BUG-16** (Notion: `37cca37f935b81deadd1d4798bb9d06a`) — sync/write-path bug
  (duplicate `sets` rows on repeated Save), explicitly **forbidden scope** for an
  unattended loop per `.claude/loop-config.md` (touches the sync write path) and
  its own Notion row says "Leave Status as Investigating." It doesn't block BUG-56
  functionally, but it claims the same `saveExerciseToCloud()` function
  (`tandem.html:3650` as of the 2026-08-13 note — re-verify the current line) that
  a future skip-related change might also touch. If this session is attended with
  Kerwin present (which building BUG-56 requires anyway, given the schema/program-
  logic pieces), it's fine to also look at BUG-16, but treat it as a SEPARATE,
  separately-verified fix — don't fold it into the BUG-56 commit.

## Ship gate

All must be green, run and shown, not asserted:
```
npm run verify
npm run validate:personas
```
Independent verification per `.claude/loop-config.md`'s
`live_test_account_verification` source: use `npm run integration`
(`scripts/prod-integration.mjs`) if `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are
set in this container; if not (they were not as of 2026-09-04 — same gap
`outcome.mjs` has had for weeks), replicate the check by hand via Supabase MCP:
log a skip as the Test Kerwin account, confirm the row lands with the state Part 2
chose, confirm `completed`/whatever else the dashboard reads is correct, confirm
`getWeekSchedule`/`getProgramDayNumber` actually advance the pointer per decision
(1), then clean up the test row and verify it's gone (same allowlisted-UUID,
verified-cleanup discipline `prod-integration.mjs` itself uses — do not skip the
cleanup-verification step).

Migration file: committed, never applied — say so explicitly in the session's
final report to Kerwin.

Ship policy: this is code + a migration FILE, both gated. Per loop-config's
standing "green gates go straight to main" policy, the code half (Parts 1+3, and
Part 2's migration file itself) can push once green — but say plainly that the
migration is unapplied and needs Kerwin (or a migration-authorized session) to run
it before Skip Day actually functions end-to-end in production.

## Record the outcome

Update BUG-56's Notion row (Status → Resolved once independently verified, Code Fix
field with the commit sha and what was built) and log the cycle per
`.claude/loop-config.md`'s standing sweep. If Part 2's schema-option fork (a) vs
(b) or Part 3's catch-up rule needed a judgment call the sources didn't settle, run
`llm-council` and record the verdict + citation on the row per
`escalation.direct_ask`/`wave_decomposition.conglomeration.verification_gate` —
don't guess and don't silently pick one.
