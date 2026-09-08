# EPIC-10 — Wave state (dedup closure, not a decomposition)

Created: 2026-09-07/08, Kerwin ruling session (`elegant-spinning-perlis.md`, Group 3I).
Approval: Kerwin's "Yes, create + push" (AskUserQuestion, this session) covers this file too —
see `EPIC-8-WAVE-STATE.md` for the full approval context, which this file is a companion to.

Source Epic: **EPIC-10 · Experience/Age/Bodyweight Modifiers**
(`https://app.notion.com/37aca37f935b815cacbdc23d41cb790a`, Status=Planned, Priority=P1 High).
Its own Dependency Gate, verbatim:

> "WAVE 12 - CLOSE AS SUPERSEDED. Experience/age/bodyweight modifiers are covered by EPIC-31 (8a,
> Shipped) and EPIC-34 (8d = BUG-44, Wave 5.5). Building this row duplicates both."

Linked tracker row: `EPIC-10-experience-age-bodyweight-modifiers`
(`390ca37f-935b-8142-b082-d5b101b0d448`), Status=Needs Human. Its Evidence ("Triage (Cycle 9b):
Effort = L... needs decomposition into smaller stories first") is stale for the same reason
`EPIC-8-personalized-workout-plan-engine`'s parent row is stale (see that file's "Key finding"
section): the decomposition it's asking for already happened, one level up, at the Epic layer —
on 2026-07-21, before this tracker row was ever fetched by triage.

## Why this file is short

This is **not** a fresh wave decomposition. EPIC-10's own Dependency Gate says it duplicates two
things that are already accounted for elsewhere:

| EPIC-10's scope (Expected Behavior) | Where it actually lives now |
|---|---|
| Experience-level threading into `getPhase()`/`getRecommendation()` | **EPIC-31 (EPIC-8a)** — Status=**Shipped**. Out of scope, done. |
| Age/bodyweight-relative threading into rep/load prescriptions | **EPIC-34 (EPIC-8d, = BUG-44)** — Status=Planned, now decomposed as **`EPIC-8-WAVE-STATE.md` Slice 3**. |

There is no third piece of EPIC-10 that isn't already one of these two. Writing a second,
independent decomposition here would violate CLAUDE.md's "one rule, one home" principle — Slice 3
of `EPIC-8-WAVE-STATE.md` would become two files disagreeing about the same rule the moment either
drifts. So this file's only job is to **close the duplication**, not re-litigate it.

## Disposition

- **Experience-level half**: already shipped under EPIC-31. No action.
- **Age/bodyweight half**: tracked as `EPIC-8-WAVE-STATE.md` → Slice 3 (EPIC-8d / BUG-44). Any
  future session picking up EPIC-10's tracker row should be redirected to that file, not asked to
  re-derive a threading plan for `getPhase()`/`getRecommendation()` signatures independently.
- **This Epic (EPIC-10) itself**: recommend Kerwin's Notion Epic row be left Status=Planned but
  is a candidate for a future "Closed as Superseded" pass at the Epic level (out of scope for a
  Notion-updates-only session per the plan — flagging, not doing, since the plan's Group 3I scope
  was the *tracker* row and wave-state files, not Epic-level status edits).

## Progress log

- **2026-09-07/08** — Audited EPIC-10's live Dependency Gate + linked tracker row. Confirmed via
  the same-session EPIC-31/32/33/34 status query (see `EPIC-8-WAVE-STATE.md`) that the dedup
  claim is accurate: 8a is Shipped, 8d is Planned-and-now-slice-3-of-EPIC-8-WAVE-STATE. Decided
  against writing a parallel decomposition; wrote this closure doc instead. See
  `EPIC-8-WAVE-STATE.md`'s Progress log for the corresponding tracker-row sync action taken on
  `EPIC-10-experience-age-bodyweight-modifiers` (Needs Human → Untested, Evidence pointing here).
