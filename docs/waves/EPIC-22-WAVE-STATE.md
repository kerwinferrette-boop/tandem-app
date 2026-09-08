# EPIC-22 — Wave state (stays blocked, not a decomposition)

**Created:** 2026-09-07/08, Kerwin-ruling session, Group 4. Companion to `EPIC-18-WAVE-STATE.md`
(Slice 1a) and `EPIC-8-WAVE-STATE.md` (Slice 2a) — same forbidden-scope reasoning, restated here
rather than re-litigated, per CLAUDE.md's "one rule, one home."

**Source Epic (Notion):** EPIC-22 · "Aspirational 1RM Targets - Goal-Lift Intake + Periodized
Ramp to a True Single", Status: Scoped. Dependency Gate (verbatim): *"WAVE 5.4 - blocked on Wave
5.2 (BUG-45 %1RM target display) and Wave 5.3 (BUG-57 is_calibrated). Those two establish the
ramp's start point; building the aspirational target first means rebuilding it once they land.
Shares getRecommendation (tandem.html:2257), getWeekTarget (2095), computeWeekTargets (2116) with
BUG-38/45/57 - one owner, one batch."*
**Linked tracker row:** `EPIC-22-aspirational-1rm-targets`, Status=Needs Human.

## Why this file does not decompose the Epic

Kerwin's instruction this segment ("figure out without me... build this into a wave") was
answered honestly for EPIC-16 and EPIC-18 — both had buildable scope once audited. **EPIC-22 does
not.** Two independent blockers, checked directly against live sources rather than assumed:

1. **Its own named prerequisite bugs are still open.** Queried the Bug & QA Log directly:

   | Bug | Title | Status |
   |---|---|---|
   | BUG-45 | 1RM· Flat "add 2.5 lbs" progression still shows instead of a %1RM target | **In Fix** |
   | BUG-57 | EPIC-9 · personal_records.is_calibrated stays 0 despite users.calibration_complete=true | **New** |

   The Epic's own Dependency Gate says these establish "the ramp's start point" and building
   before they land means rebuilding after — that is a real technical precondition, not a stale
   framing (unlike EPIC-16's mistaken `health_snapshots` block or EPIC-18's overbroad "whole Epic
   is blocked" framing). It is unmet today.

2. **The feature is not separable from forbidden scope the way EPIC-18 was.** EPIC-18 had a clean
   UI-only half (Slice 1) and a formula-layer half (Slice 1a) that could be carved apart. EPIC-22
   has no such split — its entire mechanism (goal-lift intake feeding a periodized ramp toward a
   true single, sharing `getRecommendation`/`getWeekTarget`/`computeWeekTargets` with BUG-38/45/57)
   **is** the biometric/1RM calculation layer. There is no UI-only remainder to slice off; the
   Epic's whole value proposition lives inside the forbidden territory named in
   `.claude/loop-config.md`'s 2026-08-30 rule.

Per CLAUDE.md's directive on gaps: flag honestly rather than force a decomposition that doesn't
exist. Building a partial wave for EPIC-22 anyway would misrepresent both the open bugs and the
forbidden-scope boundary as solved when they are not.

## Disposition

- **Stays Needs Human.** Not requeued as Untested — unlike EPIC-16/18/25, there is no unblocked
  piece to test yet.
- **Real next steps, in order:** (1) BUG-45 and BUG-57 need to ship first (their own owners, not
  this Epic's), (2) once both land, the "start point" the Gate references exists, and (3) *then*
  the biometric-layer design question (how the aspirational target's ramp coexists with the
  calibrated %1RM layer BUG-45/57 establish) is a real Kerwin decision — not one this session can
  make on his behalf, and not one llm-council can make either, per the standing rule.

## Progress log

- **2026-09-07/08 (Kerwin-ruling session, Group 4):** Audited EPIC-22 alongside EPIC-16/18 per
  Kerwin's delegated instruction. Confirmed BUG-45 (In Fix) and BUG-57 (New) both still open via
  direct Bug & QA Log query, and confirmed the Epic's mechanism is not separable from the
  biometric/1RM layer. Wrote this closure doc instead of a wave decomposition. Tracker row Status
  left at Needs Human; Evidence updated to cite this file and the BUG-45/BUG-57 audit (see
  Notion).
