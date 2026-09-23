# LLM Council: BUG-122 pre-ship gate (2026-09-23, ~07:10 UTC)

**Question:** Should the per-muscle rewrite of `applyGoalVolume()` (BUG-122) ship to main as it stands?

The rewrite:
- Allocates sets per MUSCLE, spreading them across all of that muscle's lifts in the week.
- Caps each muscle at 11 fractional sets per session (Remmert et al. 2025, a preprint).
- Adds a new ACTIVE invariant, D33.
- Keeps short sessions' compound sets identical to full-length ones (D28).

The evidence was presented as follows. Old-vs-new output differs in `sets` only across 1,350 programs. The largest single-exercise count fell from 20 to 11. Exercises at 16 or more sets fell from 882 to 0. verify passes 14/14. A pixel check showed Kerwin's Rear Delt Fly rendering 4 sets (it was 10). One gap is known: when a lift is the only one for its muscle in a session, it can still carry 10–11 sets.

## Advisors (verdicts)

- **Contrarian:** SHIP WITH CHANGES.
  - Don't call it fixed. 2-day and home sessions still carry 10–11 sets.
  - D33 applies a per-muscle number to a single exercise.
  - 682 co-primary cells spill over the 11 cap.
  - Verify the stored program rows.
  - Keep BUG-122 open.
- **First Principles:** SHIP WITH CHANGES (text only).
  - Weekly MEV is treated as mandatory whatever slots are available. The fix removes the stacking, not that premise.
  - Mark 11 as PROVISIONAL.
  - Record which wins when the available slots can't reach MEV.
- **Expansionist:** SHIP.
  - The allocator is the hook for biometric adaptation.
  - Proposed a PENDING D34 invariant: "sole lift capped at 6 sets".
- **Outsider:** SHIP WITH CHANGES.
  - 11 is a preprint guess being locked in as law. Label it provisional and give it a revisit date.
  - Tell Kerwin his push-up worry is only partly fixed.
- **Executor:** SHIP today.
  - Commit the audit, push, confirm on the live account, and open the related-lift ticket.

## Peer review (3 reviewers, anonymized)

- All three named the Contrarian strongest: it found real defects in the gate.
- All three named the Expansionist's "D34 = 6 sets" the biggest blind spot. **The number is fabricated and uncited, so it was rejected.**
- Things every advisor missed:
  1. Nobody checked weekly volume after redistribution.
  2. Nobody ran research first.
  3. Nobody checked whether phase multipliers can push a lift past the cap.
  4. Dani's row was never checked.

## Implementer checks run in response

- **Phase multipliers.** `applyDeload` only halves sets. `flagDropSet` adds no sets. The cap holds in every phase.
- **Weekly MEV across tier × experience × duration** (7,290 muscle-checks). Cells below MEV rose from **144 to 304**, so 160 are new. Tagged by cause:
  - **72 ceiling.** The old engine reached MEV only through a lift above 11 sets in one session.
  - **88 D28 compound freeze.** In a session under 45 minutes, the isolation lift covering the muscle is dropped, and D28 freezes the compounds. **This is a regression this change introduced.**
  - The full list is in `docs/bug122-below-mev-cells.md`.
- **Stored rows.** Both real accounts use `program_source = generated`, `full_gym`, 60 min. The tracker recomputes from the engine, and neither account is on the D28 regression path.
- **Per-exercise cap vs per-muscle number.** The cap is a logical consequence, not a unit shift. N sets of one lift give N fractional sets to its primary muscle. So the per-exercise cap is necessary but not sufficient, and the invariant text now says so.

## Chairman verdict: SHIP WITH CHANGES

The following were adopted in the same commit:

- D33 is ACTIVE with PROVISIONAL wording. It carries the preprint caveats, the co-primary exception and a revisit date of 2027-03-23. There is no D34.
- A new PENDING **D6d** covers the all-axis MEV sweep. The 160 cells are committed, each tagged by cause. When the available slots can't reach MEV, the default is that the ceiling wins and the deficit is surfaced (Kerwin's ruling, 2026-09-23).
- The D28 freeze is named as a regression that needs a D28 × MEV ruling.
- BUG-122 stays **open as partial**. The related-lift slice (muscle_tag_rescope) is still to be done.
- SC-23 is logged.
