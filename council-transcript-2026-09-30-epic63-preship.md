# LLM Council — pre-ship gate, EPIC-63 / branch `claude/control-reachability-audit`

**Date:** 2026-09-30 · **Trigger:** `loop-config.md` `escalation.pre_ship_council_gate` — a
non-design change needs council consensus before `git push origin HEAD:main`.
**Question:** should this branch merge to main as-is, or is something on it not safe to ship?

## Process note — read this before citing the verdict

Five advisors ran (Contrarian, First Principles, Expansionist, Outsider, Executor). **The formal
anonymised peer-review round was NOT run.** The Contrarian's response contained a specific,
falsifiable claim that a defect existed *in the branch's own code*; that was verified against the
source immediately and turned out to be true, which made the "should this merge" question moot
before cross-examination could add anything. Stating the deviation rather than implying full
method. The Outsider and Executor were additionally briefed on that finding, so their responses
are post-disclosure.

---

## 1. The finding that decided it (Contrarian)

> `cfgFromUserRow()` returns a **complete replacement** cfg and does not build `maxDb`. BUG-192 just
> made `cfg.maxDb` the durable home for the dumbbell cap. `syncFromCloud()` does
> `cfg = cfgFromUserRow(userData)` then `LS.set('tandem_cfg', cfg)` — wholesale overwrite. So on the
> exact paths BUG-193 exists to serve, the cap is erased, `sessionStorage.eq_max_db` is empty in a
> fresh tab, and `resolveMaxDb()` returns 0. **Uncapped dumbbell prescriptions. The identical failure
> BUG-192 was filed for, now with a green smoke gate over it.**

**Verified true.** And worse than reported: `syncFromCloud()` runs on app boot for any signed-in user
(`tandem.html:10461`) and on scope change (`:2739`), not only on a new device — so the cap was being
erased on essentially every load. Widening the check found two more members of the class that
**pre-date** the branch: `cfg.startEpoch` (read `:8985`) and `cfg.revertedAt` (read `:9142`).

Fixed in `89ae5a2`. Mechanism gate added (`cfg-field-parity-smoke.mjs`) that enumerates every
`cfg.X =` writer and diffs it against the builder's output. Recorded as **SC-37**.

The Contrarian's second finding — notes keyed by exercise name survive `clearHistory()` — was also
true and is fixed in the same commit (BUG-91's exact precedent, cited in that function's own comment).

## 2. Where the council agreed

- **Browser verification was the real gate, not the fix count.** Four of five said so independently.
  The Outsider put it most sharply: *"you verified 'does this look connected?' by reading, again.
  Admission #1 isn't discomfort, it's the finding."*
- **The per-bug gate design was the structural weakness.** Every advisor who touched it landed on
  the same point: N single-bug gates say "each fix still does its own job" and nothing about the
  seams. The Expansionist and First Principles both named the reads-side gate — not any fix — as
  the branch's most valuable artifact, for the same reason.
- **The `reorderWeek` lying button and the injury-keyword promise should outrank the rest of the
  backlog.** Raised independently by the Contrarian and the Outsider. Both are already filed
  (BUG-191, BUG-199) with council-first / research-first prompts.

## 3. Where the council clashed

**Merge now or merge after the browser pass.** The Expansionist said merge immediately — *"the fixes
are the least valuable thing on this branch"* — on the grounds that nothing shipped is worse than
what is live, and the gate is what makes the remaining ~35 findings cheap. The Contrarian, First
Principles, Outsider and Executor all said not as-is. This was a genuine disagreement about what the
branch is *for*, not about facts.

**Chairman's resolution:** the Expansionist's premise ("nothing here is worse than what's live") was
false at the time it was written — the SC-37 regression made one fix actively worse than live. Once
that was fixed, the disagreement collapsed to cost, and the Executor priced the browser pass at one
afternoon against a template that already exists. When the cheap option is also the one four
advisors want, take it.

## 4. Blind spots the council caught that no check did

- **The SC-37 seam regression** (Contrarian) — invisible to 36 green checks.
- **`verify` wires exactly ONE Playwright check** (Executor, verified: `bug128-bottomnav-pin-smoke`
  at `verify.mjs:57`). `walkthrough:onboarding` and `walkthrough:render` exist and are **not** in
  `verify`. So the 36/36 had never opened a browser on any path this branch touches — and the
  Executor's inference was right: unwired walkthroughs rot.
- **The template already existed** (Executor) — `program-render-fidelity-walkthrough.mjs`, 423 lines,
  with the localhost server + self-mocking Supabase Proxy pattern. No harness needed building.
- **"All 36 checks pass" was being offered as reassurance inside a document arguing that green checks
  meant nothing** (Outsider). That is the sharpest single observation in the round.

## 5. The recommendation, and what was done

**Do not merge as-is → fix the seam → drive the browser → then merge.** All three done:

| Step | Commit |
|---|---|
| Seam regression fixed + mechanism gate + SC-37 | `89ae5a2` |
| Browser walkthrough, 6 assertions, wired into `verify` (37) | `38d41b3` |

**The browser pass then paid for itself twice over.** The first DOM assertion written
("no rendered dumbbell load exceeds the cap") passed — and passed again with the fix removed. It was
vacuous: the fixture seeded `cfg.equipment = 'hotel_small'`, a *button tier name* where cfg takes the
*cfg vocabulary*, so zero dumbbell exercises rendered and the filter matched an empty set. Fixing the
fixture gave real dumbbell lifts and it *still* passed under mutation, because natural week-1 seeds
already sit under 25 lb. Forcing it to bind required a 200 lb working 1RM — which moves the render
onto the calibrated branch, where `dbCap` was never designed to apply (it is consumed only in
`seedWeight`, `programs.js:232`), so the assertion then failed on correct code.

Both assertions were **deleted as non-evidence** rather than left green, and the investigation
surfaced a real new finding — an **earned** dumbbell 1RM is not clamped by the gym cap, so a
traveller is prescribed weight the gym does not have — filed against EPIC-63 with an
exercise-science-first prompt rather than clamped blind.

## 6. The one thing to do first

**Nothing further on this branch — merge it.** The next thing is the Executor's Tuesday item, which
no stub can cover: run BUG-193's restore against real Supabase using the `+test@gmail.com` accounts,
because only a live row proves the real column shape. Then BUG-191 (`reorderWeek`, the button that
lies) is the top of the remaining backlog, by agreement of two advisors.
