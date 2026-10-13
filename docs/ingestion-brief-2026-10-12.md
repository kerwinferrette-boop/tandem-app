# Tandem Ingestion Brief — 2026-10-12 (scheduled run: tandem-ingestion-mwf)

Unattended run. AskUserQuestion unavailable. Working tree was dirty at preflight
(`scripts/_ghost-contamination-audit.tmp.mjs` untracked in the protected `scripts/` path, plus two
untracked `docs/` files) — per the skill's commit protocol, step 1, that means **this entire run is
Notion-only. No git commits, no pushes, regardless of what cleared the bar.** Nothing below was
committed to `main`.

## Committed this run

None. Moot by the dirty-tree rule above — nothing was eligible to commit even if it had cleared the
bar.

## Snapshot delta

N/A — no code changed this run.

## Corpus (Track C)

**New this run — Code Finding, logged to Engine Science Proposals (page
[3f8ca37f-935b-8186-9900-c144d321da15](https://app.notion.com/p/3f8ca37f935b81869900c144d321da15?pvs=204),
Status = Logged, Kind = Code Finding, Evidence Tier = Internal code finding):**

`inclined-torso-lat-pulldown` is live in `programs.js` (lines 818-830), committed on `main` at SHA
`061e357c` on 2026-10-05, with an inline comment citing Exercise Intake Notion row
`3dbca37f-935b-8170-bc4f-e22ebf368856` and Fonseca et al. (PMC12452428) as the source for its
posterior-deltoid-vs-torso-angle claim. I re-read the live code first, then queried that exact
Exercise Intake row fresh this run — it still reads Status = `Proposed`, with `Branch` and `Merged
Commit` both empty. The code and Notion have drifted: the commit happened, the row was never
advanced. This is a bookkeeping gap, not a doctrine or science issue, and it does not touch any
invariant. Confidence: High (directly verified against both sources this run, not carried over).

**Already in the corpus, not duplicated this run:**

- Two prior findings against D6c (within-block MEV→MRV weekly volume ramp cadence), both correctly
  logged as "no numeric cadence found" in the literature searched so far. I did not add a new D6c
  finding this run — an honest null result, not a gap in effort. Re-attempting the same searches
  without a new angle would have padded the corpus rather than extended it.

I did not log additional new Track C findings this run. The research agenda (Foundations - Muscle
& Adaptation, rest intervals, per-muscle frequency, etc.) was not worked fresh this run; this run's
research effort went to verifying the inclined-torso-lat-pulldown status gap and attempting to
pull corpus state (blocked — see below) rather than sourcing new literature. That is a shortfall
against the skill's 2-4-finding-per-run target, and I'm flagging it plainly rather than padding the
count with a thin or recycled finding.

## Parked invariants

Doctrine's parked (⏳) list, confirmed earlier this run at exactly four markers: **D4b, D6c, D6d,
D28.**

- **D4b** (per-experience numeric deload/progression figures): not moved this run. Still blocked on
  the same thing `DOCTRINE.md` states verbatim — "needs Kerwin's ruling AND a cited source for the
  per-experience numbers." No new candidate citation was found or searched for this run.
- **D6c** (weekly volume ramp cadence, MEV→MRV): not moved this run. The corpus holds exactly the
  two prior "no numeric cadence found" findings; no new search was run against this specific gap
  this session.
- **D6d** (MEV floor holding across all axes, post `band-front-raise`): not moved this run.
  `docs/bug122-below-mev-cells.md` documents 72 below-MEV cells, all "ceiling" cases per D33's
  per-session set-count mechanism, all pre-dating the `band-front-raise` addition that closed the
  literal "no home anterior-delt entry" gap. `DOCTRINE.md`'s D6d prose is still stale relative to
  that addition, and no automated sweep tool exists to mechanically re-confirm the 72 cells now
  clear (or don't) across the full tier × experience × duration axis set. Building that tool is
  outside this run's scope but is the concrete next step to actually close D6d.
- **D28**: not worked this run; no new information to report.

Against the skill's "half the research budget owed to the parked-invariant blockers" instruction:
this run did not meet that bar. No new literature search was run against D4b, D6c, or D28 this
session — the run's attention went to Notion bookkeeping (the lat-pulldown status fix) and the
blocked corpus-count queries instead. Naming that gap plainly rather than claiming otherwise.

## Parked for Kerwin

Nothing new reaches SAFETY tier or a novel-field-combination question this run. The one open item
needing Kerwin's attention is procedural, not scientific: the `inclined-torso-lat-pulldown`
Exercise Intake row (`3dbca37f-935b-8170-bc4f-e22ebf368856`) should be advanced from `Proposed` to
`Merged` with `Branch = main` and `Merged Commit = 061e357c` to match what's actually on `main`.
That's a Notion status edit, not a Supabase write, so it's within a future run's authority to fix
directly — flagging it here since this run chose to log it as a finding rather than silently
correct it.

## Corpus state

**Could not be refreshed this run.** I attempted three SQL queries against Notion (Engine Science
Proposals grouped by Kind/Status, Exercise Intake grouped by Status, Program Intake grouped by
Status) to report current row counts here, and all three failed with the same error:

```
usage_limit_reached — "The Query Data Source usage limit has been reached."
```

Per that tool's own guidance: I did not retry automatically. Notion Business provides higher Query
Data Source usage than this workspace currently has. You can try the queries again later, or read
more here: [Learn about Notion plans](https://www.notion.com/help/pricing-upgrade-faqs).

Because of this, I'm not reporting row counts for any of the three databases this run — doing so
from memory would mean presenting possibly-stale numbers as fresh, which the verify-never-assume
rule rules out. Next run should re-attempt these counts once the quota resets.

## Unverified and unresolved

- **Notion query quota exhausted** (above) — blocked all corpus-count reporting this run.
- **D6d sweep tooling** — no automated way exists yet to mechanically re-check the 72
  `bug122-below-mev-cells.md` cells against the current `band-front-raise`-inclusive bank across the
  full tier × experience × duration axis set. This is a tooling gap, not a finding, and it's the
  concrete blocker on actually closing D6d rather than just noting it's probably better.
- **This run's Track C output fell short of budget** — one Code Finding logged (bookkeeping, not
  literature), zero new literature findings against the standing research agenda or against D4b /
  D6c / D28. Flagging rather than backfilling with a rushed finding.
- No Track A or Track B candidates were evaluated this run.

## Kerwin's exact next action

1. Clean up the dirty working tree (the untracked `scripts/_ghost-contamination-audit.tmp.mjs` and
   the two untracked `docs/` files) so the next run can resume committing instead of staying
   Notion-only.
2. Either confirm the `inclined-torso-lat-pulldown` Notion row should be advanced to `Merged`
   (Branch `main`, SHA `061e357c`) so the record matches `main`, or tell me why it was held back —
   I didn't find a reason in the code or Notion, so I logged the gap rather than guessing.
3. No decision needed on D4b, D6c, D6d, or D28 this run — nothing new surfaced for you to rule on.
4. Nothing else requires your sign-off from this run.
