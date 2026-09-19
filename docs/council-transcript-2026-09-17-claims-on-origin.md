# LLM Council Transcript — claims-on-origin.mjs (SC-18 / Part 0 durability gate)

**Date:** 2026-09-17
**Question owner:** Kerwin (present, session authorized)

> **Renumbering note (2026-09-18, at merge with origin/main):** this session and a concurrent one
> both independently claimed the SC-18 slot in `docs/self-corrections.md`. The council discussion
> below, held before the collision was discovered, refers throughout to "SC-18" — left as-is since
> it's a historical record of what was actually said. The rule it produced now lives at **SC-19**
> in `docs/self-corrections.md`; `.claude/loop-config.md` and `scripts/claims-on-origin.mjs` were
> updated to cite SC-19. Nothing in the council's reasoning or verdict changed.

## Original question

Should Tandem ship this change: a new mechanical gate `scripts/claims-on-origin.mjs`
(+ `npm run claims:check`) that checks whether a commit sha is an ancestor of
`origin/main`, plus `docs/self-corrections.md` SC-18 and a `loop-config.md` rule
requiring every Notion "In Fix/Resolved" status write to pass this check first?

## Framed question (given to all 5 advisors verbatim)

> Should Tandem ship this change: a new mechanical gate scripts/claims-on-origin.mjs
> (+ npm run claims:check) that checks whether a commit sha is an ancestor of
> origin/main, plus docs/self-corrections.md SC-18 and a loop-config.md rule
> requiring every Notion "In Fix/Resolved" status write to pass this check first.
> Context: BUG-49 and BUG-57's Notion pages both described completed, gate-green
> fixes that turned out to not exist on any remote ref (the work was done in a
> working tree that was never committed). This is a small, mechanical, non-design
> change (a script + two doc edits), gates (npm run verify, npm run validate:personas)
> are green, no app code (tandem.html/programs.js) touched. Is this the right
> mechanism, is anything unsafe or missing, and should it ship?

---

## Advisor responses

### The Contrarian
This gate checks the wrong thing at the wrong time. `git merge-base --is-ancestor <sha> origin/main`
only proves a commit exists on the remote — it says nothing about whether it's the commit that
actually implements the claimed fix. BUG-49/57 didn't fail because someone cited a nonexistent sha;
they failed because someone wrote "done" without ever citing a sha, or cited one from a local
branch that was never pushed. So the real gap is upstream: does the Notion write path even require
a sha field to be populated before status flips to In Fix/Resolved? If claims-on-origin.mjs runs
against an empty or optional field, this ships as decoration — green because there was nothing to
check.

Second hole: timing. "Ancestor of origin/main" as of when? If this check runs once at write-time
and someone later force-pushes, rebases, or the branch gets deleted after a squash-merge, the sha
silently stops being an ancestor and nothing re-verifies it. If BUG-49/57's fixes were simply never
pushed at all (not rebased away), then the fix under-scopes: it catches "not on origin" but not
"not committed at all, on any branch, ever" — a strictly bigger set of false claims.

Third: who runs this, and can it be skipped? A script that's mechanically available but not wired
into the actual Notion-write tool call is exactly the "green gate asserting a dead value" pattern
this codebase's own CLAUDE.md warns about (EPIC-8a's rest_seconds). If `claims:check` is invocable
but not enforced at the moment of the status transition, SC-18 becomes a rule that describes a
habit, not a gate that blocks a violation.

Before shipping: confirm the sha field is mandatory and wired into the actual write, not advisory.

### The First Principles Thinker
The question being asked is "does this script correctly check ancestry?" The question that
actually matters is "why did anyone believe a commit existed before checking?" Those are different
failure points, and the proposed fix only addresses the second-order one.

BUG-49 and BUG-57 weren't caused by an absence of tooling. They were caused by treating a Notion
status field as a place to record intent-that-feels-done rather than verified-done. `git log
origin/main | grep <sha>` was always available; the failure was social/procedural, not mechanical.
A gate that enforces "run the check" doesn't touch the reason the check wasn't run: a status update
was written from working-tree confidence instead of from evidence.

So: does this ship? Yes — but not because it "solves" the problem. Ship it because it's cheap,
mechanical, additive, and converts a manual discipline lapse into an automatic one, which is
strictly better even though it's not sufficient. The real fix is upstream: the habit of writing
"Resolved" should itself require pointing at a sha, at which point the check becomes a tautological
confirmation rather than a gate on new information. If loop-config.md's rule is "run claims:check
before writing Resolved," that's backwards — the natural order is "you already have a sha because
that's what resolution means; the script just verifies it."

One gap: this only catches the origin-vs-local case. It does nothing for a commit that's on
origin/main but reverted, or a claim about behavior that's technically committed but not deployed
(Netlify build failure, stale CDN). Ancestor-of-origin/main is necessary, not sufficient — don't
let this gate's green status quietly imply "shipped and live."

### The Expansionist
Ship it — but you're thinking about this too small. This isn't just a fix for BUG-49/57, it's the
first piece of a "claims must be provable against reality" infrastructure that Tandem badly needs
everywhere.

The doctrine gate can't see the database (a D-invariant can violate live in Postgres while verify
reports 9/9 green). The preview-server false negative (fetch is fresh, JS scope isn't). SC-03's
"run, don't simulate" rule. These are all the same disease as BUG-49/57: a claim of completion that
nothing actually mechanically verifies against the artifact it claims to describe.
`claims-on-origin.mjs` is a specific instance of a general pattern — "is-ancestor-of-remote-truth"
— and once it exists, the marginal cost of pointing it at other claim surfaces is tiny.

The bigger opportunity: extend this same ancestor-check idea to (1) the should/could/did audit
itself, and (2) `program-snapshot.mjs`'s baseline hash. You could also make `claims:check` a
required CI step, not just a local npm script — otherwise it's trivially skippable by exactly the
failure mode that created BUG-49/57.

Don't stop at gating "In Fix/Resolved." Gate every status transition that asserts existence-on-
remote, including Epic "Done" and doctrine promotions from PENDING to ACTIVE.

### The Outsider
I have no idea what BUG-49 or BUG-57 are, and I don't need to — that's the point. Strip away the
project jargon: someone claimed work was "done" and it wasn't actually saved anywhere durable. The
fix is a script that checks "does this commit actually exist on the remote before you're allowed to
mark it done." That's version control hygiene, boringly standard.

Evaluated with zero context: yes, ship it. It's cheap, mechanical, touches no product logic, and
closes a real hole (twice — two incidents is a pattern).

But: "gates are green" gets invoked as evidence this is safe. Green gates are exactly what didn't
catch BUG-49 and BUG-57 — the whole failure mode was work that was locally correct and never
reached the place the gates check. Citing gate-greenness as reassurance for a fix to
"gate-greenness lied to us twice" is circular. I'd want the actual test to be: did anyone try to
reproduce the BUG-49/57 scenario against this new script and watch it fail loudly? "We wrote a
check" is not the same claim as "we verified the check catches the thing" — apply this project's
own "verify by running, not by reading" rule to this change too.

### The Executor
Ship it. This is Monday-morning-shippable in an hour, tops.

The actual build: (1) `scripts/claims-on-origin.mjs` runs `git merge-base --is-ancestor <sha>
origin/main`, exits 0/1. (2) `npm run claims:check` calling that script. (3) Two doc edits — text
changes, no logic.

Gaps in the "first step," not theoretical concerns:
- Where does the sha come from at the call site? If the Notion write is manual, a human must run
  the check before typing "Resolved." If ever automated, the check needs to be called BY that
  script, not just documented as a rule a human remembers. Loop-config.md saying "requires X" is
  not enforcement if nothing actually invokes it.
- `origin/main` requires a fresh `git fetch` — stale local refs give a false pass.

Both fixable in the same PR. Ship today.

---

## Peer review (5 reviewers, anonymized A–E)

Anonymization key: A = Contrarian, B = First Principles Thinker, C = Expansionist,
D = Outsider, E = Executor.

All 5 reviewers converged independently on the same three findings:

1. **Response E (The Executor) is strongest** — the only response that turned criticism into a
   concrete, testable checklist (sha provenance at the call site, stale-ref `git fetch`) while
   still committing to ship.
2. **Response C (The Expansionist) has the biggest blind spot** — proposing scope expansion (CI
   wiring, should/could/did audits, program-snapshot, doctrine promotions) without first
   confirming the narrow BUG-49/57 fix actually works. One reviewer called this "premature
   generalization dressed as ambition," a violation of the project's own "fix the mechanism, not
   the instance" principle applied backwards (scaling before verifying the base case).
3. **What all five advisors missed:** nobody proposed actually running the script against a real
   BUG-49/57-shaped sha (or a synthetic never-committed sha) to confirm it fails loudly. The
   Outsider gestures at "verify by running, not by reading" as a principle but never turns it into
   a shipping precondition. Several reviewers also flagged that no advisor made "does a non-zero
   exit actually block the Notion write, or is it just a documented habit" a hard shipping
   blocker — which is the entire point of the change.

Individual reviewer notes (abbreviated, full text preserved above in the agent outputs):
- Reviewer 1: flagged the enforcement-mechanism question as the single biggest council-wide gap.
- Reviewer 2: same strongest/blind-spot picks; explicitly named "test the failure case" as the
  missing precondition.
- Reviewer 3: same picks; framed C's gap as "scope creep substituting for verification."
- Reviewer 4: same picks; also noted nobody asked whether `origin/main` could false-positive-reject
  legitimate in-progress branch work if the check were ever applied outside the Notion-status
  context.
- Reviewer 5: same picks; explicitly separated the "does it fail correctly" question from the
  "does failure actually block anything" question as two distinct missing pieces.

---

## Chairman synthesis

### Where the Council Agrees

Ship it. All five advisors converge on this even after cataloguing real gaps — the script is
cheap, mechanical, touches zero app code (`tandem.html`/`programs.js`), and closes a hole that has
now bitten Tandem twice (BUG-49, BUG-57). Nobody argued for blocking the merge.

There's also unanimous (if variously worded) agreement on the actual weak point:
`merge-base --is-ancestor` is *necessary but not sufficient*. It proves a sha exists on
`origin/main`; it proves nothing about whether that sha implements the claimed fix, whether it's
still live after a rebase/force-push, or whether it's deployed (Netlify build could still be
broken). And every advisor who addressed enforcement (Contrarian, Executor) converged on the same
specific failure mode: a check that's *invocable* but not *invoked at the moment of the Notion
status transition* is exactly the "wired but not working" pattern this repo's own CLAUDE.md names
for EPIC-8a's `rest_seconds`. A rule in `loop-config.md` that says "run this first" is a habit, not
a gate, unless something actually calls it.

### Where the Council Clashes

The real split is scope, not shippability. The Expansionist wants this to become general "claims
must be provable against reality" infrastructure — CI wiring, should/could/did audits,
`program-snapshot.mjs`, doctrine PENDING→ACTIVE promotions, all gated the same way. Every other
advisor and all five peer reviewers push back hard on this, and correctly: BUG-49/57 is a narrow,
specific failure (uncommitted work claimed as done), and the Expansionist's proposal generalizes
before the narrow fix has even been shown to work.

Secondary disagreement: the First Principles Thinker argues the ordering in `loop-config.md` is
backwards — resolution should *require* a sha as evidence, and `claims:check` should be the
confirming step on evidence that already exists, not a pre-flight a human remembers to run before
typing "Resolved." The Executor's framing ("where does the sha come from at the call site") is
functionally the same objection from the implementation side. Not contradicted by anyone — a real
design point about where in the write path the check sits, unresolved by the group.

### Blind Spots the Council Caught

The one thing every single advisor missed, and all five peer reviewers caught independently:
**nobody proposed running the script against the actual BUG-49/57 shas (or a synthetic
never-committed sha) to confirm it fails loudly.** The Outsider gestures at "verify by running, not
by reading" but doesn't turn it into a shipping precondition.

Second, related gap: no advisor made "does a non-zero exit actually block the Notion write, or does
it just sit there as a documented step" a hard blocker before shipping. A gate that's mechanically
correct but socially optional reproduces BUG-49/57's root cause (a status field updated on
confidence, not verification) inside the very mechanism built to stop it.

Third (minor, one reviewer): nobody checked whether "ancestor of origin/main" could misfire if ever
applied outside the narrow Notion-status context.

### The Recommendation

Ship the script and the doc edits, with scope held to exactly BUG-49/57's failure mode — not the
Expansionist's broader vision. Before merging, close two concrete gaps:

1. **Prove it fails loudly.** Run `claims-on-origin.mjs` against a real uncommitted/unpushed sha
   and confirm non-zero exit with a clear message. Put that transcript in the commit body.
2. **Name the enforcement mechanism explicitly in `loop-config.md`.** State plainly whether this is
   currently enforced or procedural. If procedural, say so honestly.

Do not fold in CI wiring, should/could/did audit gating, or doctrine-promotion gating in this same
change. File those as a follow-up if the Expansionist's instinct is right, but verify the narrow
case first.

### The One Thing to Do First

Take a real sha, run it through `claims-on-origin.mjs`, and confirm the script rejects it with a
clear failure — then write that result into SC-18 and the commit body as verification evidence.

---

## Post-council execution (2026-09-17)

Both recommendation items were completed before committing:

1. **Live 3-case test run** (real merged sha / real local-only unpushed commit / fake sha) — all
   three behaved correctly (pass / "not an ancestor" / "not a known commit"). Results captured in
   the commit body and in `docs/self-corrections.md` SC-18's "Enforced by" line.
2. **`loop-config.md` rule 6 amended** to state explicitly that the check is procedural (no single
   controlled Notion-write code path exists to call it automatically) rather than implying an
   automatic gate exists — per self-corrections.md's own condition #3 ("say honestly whether it is
   enforced").

Scope was held to exactly the council's recommendation — no CI wiring, audit gating, or
doctrine-promotion gating bundled into this change.
