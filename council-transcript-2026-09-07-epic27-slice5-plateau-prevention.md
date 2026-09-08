# LLM Council — EPIC-27 Slice 5: block-renewal muscle-rebalancing mechanism

**Date:** 2026-09-07 · Cycle 78 (live, attended session) · Convened by: Kerwin's explicit direction
("push you in that direction, or the council's direction... citing actual scientific research")

**PROCESS DISCLOSURE (read first):** Unlike the 2026-09-06 EPIC-27 schema-fit council (which ran
single-author because no subagent-spawn tool was reachable that cycle), this session confirmed the
Agent tool genuinely works. All 5 advisor lenses below are real, independent, parallel subagents —
not one agent role-playing five in sequence. What did **not** run to the letter of the skill: the
anonymized 5-reviewer peer-review round. Given the five raw responses already exposed a clear,
legible disagreement (see below) without needing anonymized cross-grading to surface it, the
chairman synthesis was performed directly against the five raw responses rather than spawning a
second wave of 5 peer-review agents. Flagged honestly rather than silently skipped — re-run the
formal peer-review round if a future session judges the stakes warrant the extra rigor.

## The framed question

EPIC-27 Slice 5 (Custom Template Builder, week-13 block renewal) — an implementation fork, not a
pure science question, so routed to council rather than guessed or bounced back to Kerwin a second
time.

**Kerwin's product direction (confirmed, this session):** when a custom template's 12-week block
ends, generate a suggested next-wave program that (a) shifts emphasis toward whichever muscles
underperformed in the outgoing block relative to their peers, and (b) for those lagging muscles,
also adds supporting/synergist-lift work (e.g. delts or lower-pec work supporting a lagging chest)
so the region gets a fully rounded stimulus — not just more direct volume on the weak muscle alone.

**What the research establishes (cited, not in question):**
- Tandem's canonical Exercise Science Research Reference (Notion `399ca37f935b8172acaafc541b703726`,
  §1): total weekly volume per muscle — not frequency — is the primary hypertrophy driver.
- D20 (ACTIVE doctrine, `programs.js` `getSingleDay`): shipped precedent for softly steering
  exercise selection toward under-trained muscle groups within a focus family — never hard-excludes,
  always falls back rather than emptying a slot.
- 2026-07-22 internal Science Audit (Notion `3a5ca37f935b817d8357d06471e1cf7a`), **Finding 4**:
  direct weekly sets for triceps/biceps/delts run under MEV; "partly mitigated by indirect volume
  ... which this count excludes"; never resolved, never ruled on, 7 weeks stale.
- research-report(8).pdf §6 "Plateau-Breaking Logic": cited mechanisms are rep-range shift, same-
  movement variation, added volume, added frequency, deload. Silent on synergist reinforcement as
  a named mechanism.
- Exercise bank/intake schema already tags `muscle_primary`/`muscle_secondary` per exercise.

**What the research does not decide — the actual council question:**
(a) How should "lagging muscle" be defined?
(b) Should indirect/secondary-mover volume count toward a muscle's weekly total (Finding 4), and
    does that question need resolving to answer (a)?
(c) What's the concrete selection mechanism for "supporting" exercises?
(d) Does block-level rebalancing conflict with D1/D15/D27 (per-slot lift continuity)?

## Five lenses (independent, parallel, real subagents)

**The Contrarian:** Fatal-flaw framing: (b) can't be answered in isolation from (a). Finding 4
already says direct-set counting is wrong for exactly triceps/biceps/delts — undercounts their real
stimulus. Ranking muscles as "lagging" off that same broken metric means the feature could flag
delts as lagging *because of a measurement blind spot*, not real undertraining, then prescribe
synergist volume to backfill an error. Recommends: sequence (b) before (a), don't answer them in
parallel — and don't let this ticket invent its own fractional-credit formula independent of
whatever eventually resolves Finding 4 ("one rule, one home" risk).

**The First Principles Thinker:** Reframe: this isn't four independent design choices, it's asking
whether Slice 5 needs a *new* mechanism at all when D20 already answers "which muscle is behind, and
what do I do about it" — just at a different timescale. A second, differently-defined "lagging"
concept living at the block layer would itself be a doctrine violation. Separately: (b) is being
smuggled into this ticket but isn't required by what Kerwin actually asked for — supporting-lift
*selection* is solvable entirely off `muscle_secondary` tags without ever crediting a fractional set
value toward anyone's weekly total. Resolving Finding 4 is a separate, wider-blast-radius decision
(it touches every goal's floor math) — split it out.

**The Expansionist:** This is the feature that makes Tandem's "adaptive moat" claim literally true —
a visible, narratable "the app got smarter about you" moment at a natural retention beat (block
renewal). Ship (a) as direct-set-count-relative-to-siblings now (cheapest, most narratable — "your
chest grew slower than your shoulders, here's your rebalanced wave"); bank 1RM-growth-rate as a v2
metric once multi-block history exists. Use this as the forcing function to finally close Finding 4
rather than let it ship as a workaround. Extend D20 rather than invent new machinery — "same
intelligence, bigger grain" is the product story. Flags, as a separate future opportunity not part
of this build: this data is the seed of a couples-competitive muscle-balance leaderboard.

**The Outsider:** (a) isn't really one choice among four options — sibling-relative, MEV-floor-
relative, and 1RM-growth-rate measure three genuinely different things (relative underperformance,
absolute deficiency, trend), and the ticket should say so explicitly rather than picking one
silently. The literal product ask ("underperformed... relative to their peers") points at
sibling-relative directly. On (b): agrees with the Contrarian that this can't be skipped — "relative
to peers" requires a volume number, and Finding 4 already says the current number is wrong — but
recommends explicitly escalating/flagging Finding 4 rather than quietly defaulting to primary-only
counting as if that were neutral. On (c): reusing D20 is the option that avoids inventing new
machinery, which matters more than getting (a)/(b) perfectly precise.

**The Executor:** Build order: (a) direct-set count vs. sibling muscles — buildable today with data
already logged (`muscle_primary`), no new dependency. (b) do **not** touch Finding 4 in this slice —
it's a 7-week-old open question with its own design work and blast radius; use `muscle_primary`-only
for lagging-detection, flag Finding 4 as still-open in the ticket, not resolved-by-implication. (c)
extend D20 — it already does exactly this shape, just at per-day grain instead of per-block; don't
reuse antagonist-superset pairing, that's Transform-goal-specific machinery, wrong tool. (d) different
layers, no conflict: rebalancing decides block emphasis once at renewal; D1/D15/D27 govern per-slot
lift selection *inside* that block exactly as today, unchanged. Judgment calls being made, not cited:
(a)'s definition choice and (b)'s scope cut.

## Chairman synthesis

**Where the council agrees:** Reuse D20's existing steering mechanism rather than inventing a second
one (all 5, independently — the single strongest cross-cutting signal). Lagging = direct-set count
relative to sibling muscles in the outgoing block (4 of 5 land here directly; the Outsider agrees
this is what the literal product ask points at, once the three candidate metrics are named as
measuring different things). No real doctrine conflict on (d) — block-level rebalancing and D27's
per-slot continuity operate at different layers, sequenced rather than colliding.

**Where the council clashes:** Contrarian and Outsider hold that Finding 4 must be resolved (or at
minimum explicitly, loudly flagged as a live caveat) *before or alongside* answering (a), because
the ranking metric IS the metric Finding 4 already called broken for exactly the muscles most likely
to get flagged as lagging (arms). First Principles and Executor hold the opposite: decouple
entirely — what Kerwin asked for (supporting-lift *selection*) never actually required crediting
indirect volume, and merging the two turns a template-renewal feature into a volume-accounting
rewrite with a much wider blast radius than this Epic.

**Blind spot that resolves the clash:** Nobody weighed the fact that the mechanism is *soft*, in
exactly D20's shape — it reorders emphasis, it never hard-excludes, it never empties a slot. Under
that mechanism, a miscalibrated "how lagging" costs very little: the worst case is a muscle gets
somewhat more emphasis than its true deficit warrants, not a wrong or missing prescription. That
asymmetry is why shipping now on `muscle_primary`-only counting is safe — but only if the
approximation is written down as a known limitation, not silently presented as if Finding 4 no
longer exists.

## The recommendation

1. **(a)** Lagging muscle = direct-set count (`muscle_primary`-tagged sets), ranked relative to
   sibling muscles trained in the outgoing block. No 1RM-growth-rate, no MEV-floor lookup for this
   slice — simplest, matches the literal product ask, buildable today.
2. **(b)** Do **not** resolve Finding 4 in this slice. Use primary-tagged sets only for the ranking.
   Document explicitly in the Wave file (not buried in a code comment) that this is a known
   approximation — arms/delts may be somewhat over-flagged as lagging because indirect volume isn't
   counted — accepted because the steering mechanism is soft (D20-shaped), not because the gap is
   invisible. Finding 4 stays open, tracked separately, with its own ruling still owed.
3. **(c)** Extend D20's steering mechanism to run at block-generation time instead of building a
   second mechanism. "Supporting" exercise selection for a lagging muscle comes from the exercise
   bank's existing `muscle_secondary` tags — not the Transform-goal antagonist-superset machinery,
   which is a different tool built for a different job.
4. **(d)** Sequence, don't merge: the rebalancing step runs once, at renewal, to set the new block's
   region/slot emphasis. D1/D15/D27 continue to govern which specific lift fills each slot *inside*
   that block, unchanged from today. Rebalancing must not re-run mid-block.
5. Not required for this build, but worth carrying forward: the Expansionist's framing of this as a
   visible, narratable "your program just got smarter about you" moment for the UI, and the
   couples-competitive muscle-balance angle as a genuinely separate future opportunity.

**Engineering judgment calls made here, not cited to a source (flagged per this project's own
honest-caveat convention):** the choice of sibling-relative direct-set-count as "lagging" (Executor,
Outsider); the decision to leave Finding 4 open rather than resolve it inline (Executor, First
Principles, with the Contrarian/Outsider's caveat preserved as a documented limitation rather than
overridden).

## The one thing to do first

Write this verdict into a proper EPIC-27 Slice 5 scope (replacing the vague "week-13 renewal,
something else" placeholder) naming D20-extension as the mechanism, and file Finding 4 as its own
still-open, explicitly-separate decision in the Bug & QA Log so a future cycle doesn't silently treat
it as closed by implication.
