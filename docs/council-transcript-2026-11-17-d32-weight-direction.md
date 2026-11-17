# Council transcript — 2026-11-17 — D32 and weight direction

Run by Claude in the Tandem session of 2026-11-17, per CLAUDE.md ("when two tables both claim
the same rule ... run `llm-council`, do not pick").

**Deviation from the skill, stated:** 5 advisors, but 3 peer reviewers instead of 5 (general,
scientific validity, user experience), and the session agent acted as chairman instead of a
separate chairman agent. Advisor texts below are the condensed versions the reviewers were shown.

## The question

Should doctrine rule D32 be amended so weight DIRECTION (gain vs lose) changes the generated program?

Kerwin, 2026-11-17: "Adding weight should be an option... Those kinds of intentions should be
accounted for and calculated into the engine to suggest various workouts and push various 1RM %
increases, and hypertrophy implementation."

- Code: `weightDeltaLbs = Math.abs(weight - targetWeight)`. Only consumer: men on `fat_burn` skip the
  Zone 2 finisher at delta <= 20 lb. A man on `fat_burn` wanting to GAIN 25 lb was treated as having
  25 lb to lose. Every other goal attaches a 22-minute finisher to every training day.
- Source A, DOCTRINE.md D32 (active): writes `|current − goal|`, scoped to `fat_burn` only, citing the
  Notion Programming Architecture Reference men's/women's fat-burn notes.
- Source B, Notion EPIC-8 (parent row marked superseded): a SIGNED table — >20 lb to lose, 10–20,
  <10, Gaining ("pure hypertrophy, minimal cardio"). Thresholds uncited.
- Research: Murphy & Koehler 2022 (PMID 34623696) — a ~500 kcal/day deficit prevented lean-mass gain,
  strength gains preserved. Repo synthesis — moderate endurance training causes minimal interference
  at <= 2 sessions/week. No source ties progression rate to direction or defines "minimal cardio".

Decisions: (1) is the abs a defect in scope or an amendment; (2) less cardio for gainers on other
goals, and what "minimal" means; (3) build the 10–20 and <10 tiers; (4) direction-driven 1RM increases.

## Advisors

**Contrarian (shown as B).** Target weight is an aspiration, not an energy-balance measurement; using
a measured-deficit study to justify direction-based programming is a proxy leap. (1) Amendment, not a
defect: the doctrine literally says `|current − goal|`; fat_burn + gain target is an input-coherence
problem the source never answers. (2) No gainer gate: the <=2/week finding is not conditioned on
direction; the real question is whether the every-day finisher is supported for anyone. Zero is
invented. (3) No: uncited, superseded, "3 of 4 days" assumes a 4-day week, "lower starting loads"
collides with the single owner of seed weights, absolute cliffs ignore bodyweight. (4) Build nothing;
the one source cuts against it. The deliverable is a research request.

**First Principles (shown as E).** Wrong question: direction is an energy-balance intent and the
engine has no such variable; D32 should not be its home. (1) Defect, in scope: a fat-loss note's
delta can only be pounds to lose. Surface fat_burn + higher target at onboarding. (2) Do not extend
D32; a 2/week cap would belong to the GOAL, not to "gaining". (3) No. (4) Build nothing; a direction
coefficient would double-count what performance-driven progression already measures.

**Expansionist (shown as C).** (1) Defect, and the valuable one: direction becomes a first-class
input. (2) Amend: cap gainers at <=2 finishers/week on non-fat_burn goals. (3) Don't build the tiers
but build the table with the uncited rows PENDING. (4) No rate change, but wire direction into
emphasis and the "why" strings; score each partner against their own direction.

**Outsider (shown as A).** A user who types a higher target believes they said "I want to gain".
(1) Both: a defect in behaviour, but the law itself says abs, so correct the wording too. Why can
someone pick fat_burn with a gain target at all? (2) Cap at <=2, labelled as the interference
ceiling. (3) No: 9 lb vs 11 lb giving different programs is unexplainable. (4) Build nothing, say so.

**Executor (shown as D).** One small signed fix, flag the rest. (1) Defect: `lbsToLose = max(0, weight
− targetWeight)`, a gainer assertion in the gate, reword D32, confirm women's output unchanged. (2) Do
not build: <=2/week is an interference finding, not a gaining finding; open it as its own doctrine
question. (3) No. (4) Build nothing; autoregulation already responds to logged performance.

## Peer review (anonymised A–E)

- **Reviewer 1 (general).** Strongest E, D close. Biggest blind spot C. All missed: the 20 lb
  threshold is itself uncited; delta is not static (crossing 20 lb mid-block flips the program);
  null/equal target unspecified; nobody asked what supports 22 minutes every day.
- **Reviewer 2 (scientific validity).** Strongest D. Biggest blind spot C (the source never conditions
  on direction; stretches a measured-deficit finding onto an aspiration). All missed: INVERSE
  INFERENCE — "minimal interference at <=2" does not show harm above 2, and nobody checked a
  22-minute finisher against the studied dose, so even a goal-level cap is unsupported; the 20 lb
  threshold and men-only scope are unsourced; unset target weight.
- **Reviewer 3 (user experience).** Strongest D. Biggest blind spot C. All missed: who is affected —
  check the stored configs; under every recommendation the woman's target weight changes nothing;
  threshold flips; "build nothing, flag" reads as being ignored unless the app acknowledges a gain
  intent.

## Chairman's verdict

**Where the council agrees.** 5 of 5: do not build the 10–20 lb and <10 lb tiers. 5 of 5: do not tie
load progression to weight direction. 5 of 5: zero finishers for gainers is an invented number.
4 of 5 call the discarded sign a defect; the fifth agrees the behaviour is wrong and objects only to
fixing it without correcting the doctrine text.

**Where it clashes.** Whether gainers on other goals should get a 2/week cap now (Expansionist,
Outsider) or not (Contrarian, Executor, First Principles — the finding is not about gaining, so the
rule would sit in the wrong home).

**Blind spots from review.** The 2/week figure cannot support a cap at all (inverse inference). The
20 lb threshold and men-only scope are themselves unsourced. The delta moves as weight changes.

**Recommendation.**
1. Fix the sign and correct D32's wording in the same change. Pounds to lose = `max(0, current −
   goal)`. This is a correction of an encoding error against the row's own cited source, recorded as
   an amendment because the row's text changes.
2. Do NOT add a gainer cardio rule. Record the open question instead: is the every-day finisher on
   non-fat_burn goals supported by any source? That needs research, not a council.
3. Do NOT build the tiers.
4. Do NOT build direction-driven progression.
5. Surface the contradictory input (fat_burn + a target above current weight) to the user. That is a
   product decision for Kerwin.

**Checked after the council (live database, 2026-11-17):** no stored account is on `fat_burn` and no
stored account has a target above its current weight. The defect affected nobody's saved program.

**The one thing to do first.** Ship the sign fix with its gate assertion.
