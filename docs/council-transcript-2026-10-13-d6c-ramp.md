# Council — D6c within-block MEV→MRV ramp (2026-10-13)

**Question.** D6c is PENDING ("needs numeric ramp cadence"). Options: (A) build now with
"+1 set/muscle/week" as SCIENCE_DEFAULT, dissent recorded; (B) wait for the full text of
Israetel, Feather, Faleiro, Juneau, *Strength Cond J* 2020;42(5):2-6 (10.1519/SSC.0000000000000518);
(C) retire / rewrite D6c as optional or experience-gated, or leave PENDING.
Facts: `docs/research/d6c-ramp-cadence-2026-10-13.md`.

**Process disclosure.** 5 advisors ran in parallel. Peer review ran with **2 reviewers, not 5**
(both saw the same anonymized A-E set; mapping: A=Executor, B=Contrarian, C=Outsider,
D=Expansionist, E=First Principles). The advisor responses were passed to reviewers as
condensed paraphrases, not verbatim. The Outsider ran from the question text only.
The chairman synthesis below was written by the orchestrating session, not a separate agent.

## Advisors
- **Contrarian — reject A; do C as a rewrite, not "leave PENDING"; B is a distraction.** "+1/wk" is a
  commercial-secondary number; labelling it SCIENCE_DEFAULT is laundering. The dissenting letters object
  to the exact behavior A builds. +1/wk from a floor of 10 reaches 14-15 in a 5-wk block, colliding with
  D33's ~11/session: silently clamped (fiction) or breaks D35. 1050-combo green proves legality, not
  correctness. Even the full text gives an argument, not a validated cadence. "Toward MRV" is itself the
  contested claim. Residual risk: the "periodized" moat is a Kerwin product call.
- **First Principles — wrong question; narrowed C; drop the ramp as a hard rule.** The goal is "don't
  under-stimulate early / overshoot late"; floor (D6b), ceilings (D33/D35) and deload (D4) already bound
  that. Rewrite D6c as a recorded OPEN QUESTION with no gate; use load/rep progression inside existing
  bands if progression is wanted now; record the search trail; reopen if the PDF arrives.
- **Expansionist — A, but as a readiness-gated ramp.** Make D6b/D33/D35/D4 the bound and let the readiness
  score decide advance / hold / back off; first consumer of readiness; couples mode; log outcomes to build
  own evidence. Label +1/wk UNVERIFIED_DEFAULT, not SCIENCE_DEFAULT.
- **Outsider (question text only) — modified A with C's scoping.** Cite the paper for direction only;
  step as a single named constant labelled "unsourced default, +1 pending evidence"; re-openable. Flags:
  the MRV endpoint is never numerically sourced; whether the caps are sourced is unstated; the letters
  dissent from the *doubling*, not from +1.
- **Executor — C, scoped.** Ask Kerwin for the PDF + letters; rewrite D6c in Notion to what the sources
  support (progress allowed between MEV and the caps, drop the MRV mandate, cadence UNSOURCED); update
  DOCTRINE.md + doctrine.mjs in one commit as a bounds-only invariant; no ramp code; verify + personas;
  if the PDF gives a cadence, small experience-gated build, else close D6c "no sourced cadence".

## Peer review (2 reviewers, consistent)
- Strongest: **B (Contrarian)** — concrete arithmetic on the cap collision; A (Executor) close second.
- Biggest blind spot: **D (Expansionist)** — builds on a readiness score nothing reads ("wired is not
  working") and adds new unsourced advance/hold/back-off thresholds.
- Missed by all: nobody tested whether the caps leave room for a ramp; reviewers also claimed nobody
  tried live research and that "full texts unreadable" was unverified.

## Orchestrator checks on the reviewers' claims
1. **"Nobody tried live research."** Incorrect. WebSearch was run (several queries) and WebFetch was
   attempted on pubmed.ncbi.nlm.nih.gov, rpstrength.com, renaissanceperiodization.com and
   lida.sport-iat.de; curl confirmed `CONNECT tunnel failed, response 403` / "connect_rejected
   (organization policy)". The reviewers saw only a condensed summary. (The reviewers' underlying point —
   verify tool availability by trying — was satisfied before the council ran.)
2. **"Does the cap leave room for a ramp?"** Measured (script run 2026-10-13, current `programs.js`,
   all 1050 combos, one generated week, 6220 major-muscle cells). Room = sum over that muscle's sessions of
   `SESSION_MUSCLE_CEILING(11) − session fractional sets`:
   cells with < k extra fractional sets of room: k=1: 724 (11.6%), k=2: 1672 (26.9%), k=3: 1870 (30.1%),
   k=4: 2184 (35.1%). Mean weekly volume is already above MEV in every goal (build_muscle +1.98,
   fat_burn +1.87, transform +2.75, strength +7.87, maintenance +0.64). So a flat +1/wk would be clamped
   in roughly 12-35% of muscle-weeks by D33 alone, before D35. **Caveat:** this checks the D33 session
   ceiling only (not D35's per-exercise 6), uses one week's output, and is a headroom estimate, not a
   ramp simulation.

## Chairman's verdict (orchestrator synthesis)
**Agree:** no advisor defends "+1/wk" as science; four of five (incl. the Outsider's own conditions)
require it be labelled unsourced if used at all; waiting on the paper (B) buys a direction citation, not
a number; the engine already bounds floor/ceiling/deload.
**Clash:** Expansionist wants a readiness-adaptive ramp now; Contrarian/First Principles/Executor want no
ramp code. Resolved against the Expansionist: its design depends on a consumer-less readiness score and
adds unsourced thresholds, and the measured headroom shows a fixed step is already clamped in a
material share of cells.
**Recommendation: C, as a rewrite — do not build a ramp and do not adopt +1/wk.**
Rewrite D6c from a PENDING "ramp toward MRV" mandate into a recorded open question: *no primary-source
numeric cadence; direction supported by Israetel et al. 2020 but contested by same-issue letters; not
engine-binding*, with the search trail. Do **not** add the Executor's bounds-only invariant — D6b (floor),
D33/D35 (ceilings) and D4 (deload) already assert those bounds; a fourth check on the same bounds is the
dead-gate shape CLAUDE.md warns about. Order: Notion first, then DOCTRINE.md + scripts/doctrine.mjs
(lines ~84 and ~2895) together.
**Not decided here (Kerwin's call):** whether "periodized" as a product claim needs a within-block
volume progression at all; and whether to pursue the Expansionist's readiness-driven adjustment as its
own Epic (it is the same gap as "nothing reads compute_readiness()").
**One thing first:** ask Kerwin for the 2020 SCJ PDF and the letters — cheap, and it could change this.
