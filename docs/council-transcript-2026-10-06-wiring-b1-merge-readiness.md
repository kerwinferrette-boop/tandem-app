# Council transcript — 2026-10-06 — `wiring-b1-swap-persistence` merge readiness

**Trigger:** fable-prompt-1-wiring mandates "an llm-council consensus before any push to main."
**Branch:** `wiring-b1-swap-persistence` at `8fc9723` (← `0732d2e` ← `e542082` ← `b4efd96` ← `10df9b4` ← `e354510` ← main `867e442`).

## Framed question

Is the branch ready for Kerwin to approve a merge to main, given:
- **B1** — durable exercise swap: localStorage `tandem_swaps` keyed by movement NAME, re-applied every
  render via `resolveUserSwap()`, legality re-validated via `getExerciseSubstitutes` (tier + injuries)
  every render, D6b volume credits the substitute, visible Undo. Migration `0024_b1_exercise_swaps.sql`
  WRITTEN, NOT APPLIED (human-only); client cloud round-trip deliberately unwired — swaps LOCAL ONLY.
- **B2** — lift-note date read back on the card (`exNoteStamp`; legacy un-stamped notes show nothing);
  structured "Swap this for me" action routes into B1's picker (engine never parses free text);
  session-notes cloud fallback reaches the visible textarea. "Too hard/too easy" NOT built — citation gap.
- **B3** — walkthrough gate extended +7 real-Chromium assertions (full swap journey + note features);
  8 mutations individually RED; gate caught + fixed a real bug (JSON.stringify inside a double-quoted
  onclick attribute truncated every swap handler).
- `npm run verify` = ALL 41 CHECKS PASS; independent fresh-agent re-verification clean (own mutation,
  byte-clean restore). Netlify OUT OF CREDITS — live site stale at `200fa8d`; all verification local.

## Advisor responses

### The Contrarian (= Response B in peer review)
Not ready as-is. Four blockers/caveats:
1. **"Durable" is a misrepresentation in a couples app.** localStorage swaps are device-siloed; the
   cloud half is unwritten client-side and unapplied server-side. Merging ships a dead migration file —
   the "regenerated, not applied" trap MEMORY already warns about (0021_SUPERSEDED precedent).
2. **Keying by movement NAME, not slug, is a time bomb.** Names have been edited before; a rename
   silently orphans stored swaps, and "a lookup miss is not an error" means nothing screams.
3. **Legality re-validation covers tier + injuries only.** Does a swapped program still pass
   VOLUME_LANDMARKS/doctrine? Was doctrine.mjs extended to see swapped programs? If not, verify stays
   green while a user swaps out of compliance — the D17 shape.
4. **Zero verification at the surface Kerwin sees.** Merge will auto-deploy UNOBSERVED when credits
   refresh; decouple approval from deploy with a post-deploy live diff required.
Also unverified: does a stored swap survive goal/day-count regeneration?

### The First Principles Thinker (= Response E)
The goal is not "merge a branch" but "Kerwin's lived workout changes in a way the science endorses."
The branch is three things in one label. What works end-to-end: B1 local swap and B2 note stamp are
traced to pixels, mutation-tested in real Chromium — merge-ready; the gate catching a real bug is the
strongest evidence it is load-bearing. What is honest scaffolding: the unapplied migration is the exact
shape that produced the dead `exercise_notes` table and the `week_targets` green-gate-on-dead-value
failure — if 0024 is applied without client wiring landing in the same motion, you've manufactured a
dead table with a paper trail saying it was intentional. The merge should carry an explicit tracked
item binding "apply 0024" and "wire round-trip" as one atomic unit. Netlify is outside the branch's
control — merge anyway; main is integration truth, not delivery. **Verdict: approve**, with one
tracked atomic cloud-wiring follow-up stated in the merge commit.

### The Expansionist (= Response D)
Merge it. The gate already paid for itself. Local-only swaps with visible Undo is a complete product;
0024 is pure upside later. Undersold: this branch quietly builds Tandem's preference layer —
(1) `tandem_swaps` is the first durable record of revealed user preference (adaptive-programming fuel
once 0024 lands); (2) `resolveUserSwap()` is a general substitution seam (equipment availability,
injury-week auto-substitution, travel mode are config away); (3) B2's structured-action pattern is the
template for every future note-driven action including "too hard/too easy" when the citation gap
closes; (4) the browser gate is now a journey-level harness — next feature gets end-to-end coverage
for the cost of assertions.

### The Outsider (= Response C)
Reading cold: (1) name-keyed, per-device storage with the DB half unapplied is a landmine — in a
couples *competition* app, "my program looks different on each device" reads as a bug; does scoring
care which exercise was done? (2) "Unapplied migration the owner must run by hand" is the riskiest
sentence — is the code safe if the migration is NEVER run? Needs an explicit yes/no. (3) Nobody can
see it work — approval-before-experience inverts the normal order; merge but defer "done" until Kerwin
taps through a swap live. Smaller: "Swap this for me" inside a NOTES area is odd placement; the
quote-escaping bug implies every swap tap was broken — was that ever live? If so, say so.
**Verdict: approvable as code, not as a finished feature** — the approval message must state migration
unapplied, single-device persistence, zero live verification.

### The Executor (= Response A)
Yes — merge it. Correctly-scoped increment; the only real risk (code reading a nonexistent table) is
neutralized because the round-trip isn't wired. Monday sequence: (1) `git merge --no-ff` + push, watch
CI to green (feature branches trigger no CI — this is the branch's first CI run); (2) apply 0024 by
hand, assert table/RLS/round-trip, record "applied"; (3) deploy = wait for credits, then diff live vs
local and tap a swap live; (4) cloud wiring = NEW branch, same discipline — do NOT fold into this
merge. Flag: track "too hard/too easy" in Notion so it doesn't silently die.

## Peer reviews (anonymization: A=Executor, B=Contrarian, C=Outsider, D=Expansionist, E=First Principles)

- **Reviewer 1:** Strongest **B** (tested against the repo's actual failure catalog). Biggest blind
  spot **D** (vision pitch, not a review). All missed: partner sync / competition integrity — what
  does Dani's device show for Kerwin's swapped day, and does scoring/PR comparison treat the swapped
  movement correctly? Also: does the picker respect pruneInjuries (the SECOND injury layer)?
- **Reviewer 2:** Strongest **E** (names the dead-table failure mode with repo precedent, converts it
  to an actionable merge condition). Blind spot **D**. All missed: whether the *science* permits a
  swap — is the substitute constrained per the taxonomy (D30 comparator), or can swaps silently break
  the periodized program?
- **Reviewer 3:** Strongest **E**; notes A's "apply Monday, wire later" is exactly the sequence E
  proves dangerous. Blind spot **D**. All missed: doctrine process compliance — did the swap mechanism
  go through exercise-science-research + should/could/did? Does any gate execute against a *swapped*
  program state?
- **Reviewer 4:** Strongest **E**. Blind spot **D**. All missed: the fix-the-mechanism audit — do the
  browser assertions sweep the goal × days × exercise axis or only the demoed combo? What happens to a
  stored swap when the swapped-in exercise is later injury-filtered out mid-program?
- **Reviewer 5:** Strongest **E**. Blind spot **D**. All missed: is swapping itself doctrine-legal —
  can a user swap a strength primary into a superset-eligible movement (D8)? Does the substitution
  rule have a SHOULD citation?

## Chairman synthesis (verdict)

### Where the council agrees
1. **Merge the code.** 4 of 5 advisors say merge (Contrarian alone says "not as-is", and two of his
   four blockers are conditions, not defects). The local slices are traced to pixels, mutation-tested
   in a real browser, and independently re-verified — the project's own "wired is not working" bar is
   met.
2. **The unapplied migration is the live risk, not the localStorage half.** Everyone lands on the same
   precedent: `exercise_notes` died as a table nobody wrote to. Applying 0024 without the client
   round-trip in the same motion recreates it.
3. **Approval ≠ delivery.** Netlify is stale; merging is correct anyway (main is integration truth),
   but "done" is deferred until Kerwin taps a swap on the live site.

### Where the council clashes
- **Apply-0024 sequencing.** Executor: apply Monday, wire on a later branch. First Principles (backed
  by 3 reviewers): that exact sequence manufactures a dead table — bind "apply 0024" and "wire the
  round-trip" as ONE atomic unit. The chairman sides with First Principles: 0024's own header already
  says swaps stay LOCAL ONLY until applied AND round-trip-verified; the safe order is *wire the client
  behind the existing seam on a follow-up branch, then apply + verify + merge together*.
- **Name-keying.** Contrarian calls it a time bomb. Chairman's correction from the record: it is a
  *documented, deliberate* decision (0024 header: slot ids churn, names do not — BUG-45/48 precedent),
  and an orphaned swap **degrades safely to the original movement** by design, it does not corrupt.
  Residual truth: the degradation is silent. Accepted trade-off, noted for the cloud-wiring slice.

### Blind spots the council caught (and the chairman's factual corrections)
1. **Partner-view / competition integrity** (reviewer 1): what Dani sees for Kerwin's swapped day, and
   whether scoring cares, was not verified this branch. → Open question for Kerwin / cloud-wiring slice.
2. **No gate executes a *swapped* program against doctrine** (reviewers 3/5): true. Render-time
   legality (tier + injuries, same category, ≥1 shared primary group) is enforced per-card, but
   doctrine.mjs never sees post-swap program state. → Candidate assertion for the cloud-wiring slice.
3. **"Did the science license the swap rule?"** — CORRECTION: the `exercise-science-research` skill
   WAS invoked on exactly this question (does `getExerciseSubstitutes`' criterion suffice as the
   equivalence rule; is there a cited rule for volume crediting after substitution). The audit lives
   in the B1 commit body (`10df9b4`). What remains honestly open there stays flagged, not fabricated.
4. **"Was the onclick bug ever live?"** (Outsider) — CORRECTION: no. The swap picker's persistent form
   was introduced ON this branch; the bug never reached main or the live site. The gate caught it
   pre-merge — that is the system working.
5. **"Is the code safe if 0024 is never run?"** (Outsider) — explicit YES: the client cloud round-trip
   is not wired; nothing reads or writes the table.

### The recommendation
**APPROVE the merge** — with the approval message required to state, verbatim-level plainly:
(a) swaps are LOCAL ONLY (single-device) until 0024 is applied AND the client round-trip ships;
(b) migration 0024 must NOT be applied on its own Monday — it gets applied together with the
cloud-wiring follow-up branch, as one atomic tracked unit;
(c) the live site is stale (Netlify credits) — zero live verification; merge queues, deploy catches up;
(d) known accepted limits: name-keyed (safe-degrade), no doctrine gate on swapped program state,
partner-view behavior unverified — all assigned to the cloud-wiring slice.

### The one thing to do first
Kerwin reviews and merges the branch (`git merge --no-ff wiring-b1-swap-persistence`), then watches
the push-to-main CI run to green — the branch's first CI execution. Nothing else (no 0024, no deploy
chasing) until that is green.
