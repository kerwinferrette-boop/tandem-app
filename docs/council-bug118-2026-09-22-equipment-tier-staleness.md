# Council record — BUG-118 equipment-tier staleness fix (pre-ship gate)

**Date:** 2026-09-22
**Topic:** Pre-ship consensus verdict for the BUG-118 fix (`resolveEquipmentTier()` /
`applySetupSelection()`, `tandem.html`), per `.claude/loop-config.md`'s
`pre_ship_council_gate`.

**Mechanism disclosure (read before trusting this as "5 independent advisors"):**
This session's tool inventory was checked twice (`ToolSearch` for `Task`/`Agent`/
`SpawnSubagent`/`SubagentCreate`/`GeneralAgent`, and again for `select:Agent,Task,
SpawnSubagent`) and returned no agent-spawning tool. The `llm-council` skill's
protocol calls for 5 parallel independent sub-agents; that mechanism does not exist
in this environment. Rather than assert "no council available" (the flagging-without-
trying failure CLAUDE.md/SC-16 warn against) or silently fabricate "5 agents agreed"
language, this record is a structured single-session adversarial analysis: the same
5 thinking styles, argued as strongly as the protocol asks, by one session, with no
inter-advisor anonymization/peer-review round performed by separate processes. It is
weaker evidence than a real multi-agent council and is labeled as such everywhere it
is cited (commit body, Notion row).

## The question put to each lens

Does the BUG-118 fix (baseline-stamp `cfg.equipment` at the moment
`applySetupSelection()` writes `sessionStorage.eq_tier`; `resolveEquipmentTier()`
distrusts the session override whenever the live `cfg.equipment` has since diverged
from that baseline) reach consensus as safe to `git push origin HEAD:main`? Is the
scope boundary (never editing `syncFromCloud()`/`restoreFromCloud()`) honored? Is
fail-safe treatment of a missing baseline (distrust) the right default? Should the
UI-label mirror gap be filed separately rather than fixed here?

## The Contrarian

The fix is real but incomplete honesty-wise: it treats "baseline missing" as stale,
which quietly changes behavior for every session created before this deploy ships —
any tab that already has `sessionStorage.eq_tier` set under old code will, on its
very next `resolveEquipmentTier()` call post-deploy, silently drop its override and
fall back to `cfg.equipment`, with no user-facing explanation. That's the *correct*
call given BUG-118's own failure mode, but it is a real, if minor, behavior change
being shipped without a release note, and if any legitimate stale-but-still-open tab
exists in the wild right now it will lose its override silently. Also: the fix only
protects `resolveEquipmentTier()`'s callers, not the `renderTracker()` UI-label
mirror at ~line 4650, which reads `sessionStorage.eq_tier` directly with the same
"session → cfg → full_gym" priority comment — that mirror can now DISAGREE with what
`resolveEquipmentTier()` actually serves (label says one tier, engine serves
another) in exactly the post-fix-deploy transition window, which is a new,
fix-induced inconsistency that didn't exist before (pre-fix, both were equally
wrong together; post-fix, they can diverge from each other for one page load).

## The First Principles Thinker

Strip it back: what is `sessionStorage.eq_tier` FOR? It's meant to represent "this
browser tab's current equipment-tier choice, as of the moment it was set." The
actual defect was that nothing ever asked "is this still true" — it was read as an
eternal fact instead of a fact-as-of. The fix correctly turns an unscoped fact into
a scoped one by pairing it with the value it was true relative to
(`cfg.equipment`) and checking that pairing on every read. That is the right
primitive, not a patch — it's the same shape as an optimistic-concurrency version
stamp. The only question worth asking from first principles: is `cfg.equipment`
really the right "as of" reference, or should it be something narrower like a
session/login identity? Given the confirmed failure mode is specifically
`syncFromCloud()` changing `cfg.equipment`, and `cfg.equipment` is the only thing
`resolveEquipmentTier()` ever falls back to anyway, keying the baseline off
`cfg.equipment` itself (not a proxy for it) is the minimal correct choice — no
smaller primitive would have caught the actual bug, and nothing bigger was needed.

## The Expansionist

This fix is worth more than BUG-118 alone. The `eq_tier_baseline` pattern —
"stash what durable state a session override assumed, distrust the override once
that assumption breaks" — is a general answer to any future session-vs-durable-state
race in this file, not just equipment. If `cfg.injuries`, `cfg.goal`, or any other
field ever grows a session-level override the way equipment did, this is the
template to reuse rather than reinvent. Worth a one-line note in `CLAUDE.md` or
`docs/self-corrections.md` flagging the pattern for reuse, though that's a "nice to
have," not a blocker — don't gold-plate this ship. Also: the flagged UI-label gap is
upside hiding in plain sight — it's a two-line follow-up (`renderTracker()`'s mirror
could call the same baseline check, or just call `resolveEquipmentTier()` and derive
the display tier from ITS return value instead of re-deriving independently) and
would retire a second, smaller "one rule two homes" violation in the same file.

## The Outsider

Reading this cold: a boolean `baselineFresh` gate added to a 4-line function, guarded
by a new sessionStorage key nobody else in the file writes but one function. The
naming is clear enough to follow without needing tribal knowledge (`eq_tier_baseline`
reads as "what cfg.equipment was baselined to"). The one thing that would confuse a
future reader with zero context: the comment block above `resolveEquipmentTier()` is
now 13 lines for a 4-statement function — correct and thorough, but a future editor
skimming for the ACTUAL logic has to read past a wall of prose to find the 2 lines
that matter. Not a blocker, just a legibility note. Separately: nothing here explains
WHY `EQ_TIER_TO_BANK`/`CFG_EQ_TO_BANK` are two separate tables to a reader without
prior context, but that's pre-existing and out of this bug's scope, not something
this fix needs to resolve.

## The Executor

Can this ship Monday morning? Yes, with nothing left to do: gates are green (12/12
`verify`, 630/630 `validate:personas`), the harness reproduced the exact failure
before the fix and stopped reproducing after it (proved, not asserted), the two
adjacent scenarios the prompt explicitly demanded (full_gym/no-override,
legitimate hotel-override) both pass, the diff is small (31/-1) and confined to the
two functions the investigation named, and the forbidden-scope boundary
(`syncFromCloud`/`restoreFromCloud`) was never touched — confirmed by grep showing
only 2 total writers of `cfg.equipment` in the file, one of which is the edited
function. The one open action item: the UI-label mirror gap should be filed as its
own Bug & QA Log row right now (2 minutes of Notion work), not fixed inline — fixing
it now would widen this diff into a second, unreviewed change and delay a ship that
is otherwise done.

## Peer-review synthesis (single-session, not independently blind)

- Strongest point: the Executor's and First Principles Thinker's agreement that the
  fix is minimal, correctly scoped, and the right primitive (a freshness pairing,
  not a patch) — corroborated by the actual grep-verified fact that only 2 writers
  of `cfg.equipment` exist.
- Real, convergent blind spot: **both** the Contrarian and the Expansionist
  independently flagged the same UI-label mirror (`renderTracker()`, ~line 4650) as
  a live, separate gap this fix does not close and could make momentarily more
  visible (label/engine disagreement in the transition window) — this is corroborating
  evidence it should be filed as its own row, not folded into this fix.
- What all lenses under-weighted: none flagged a way to test the "missing baseline"
  fail-safe path is what actually ships (it was verified in Scenario runs, but the
  council text above discusses it only in prose) — already covered by the harness
  runs, not a gap in the fix itself, just a gap in this record's own rigor. Noted
  here rather than silently omitted.

## Verdict

**Where the council agrees:** the fix is minimal, correctly scoped, doesn't touch
forbidden sync code, is proven (not asserted) via a real repro that flips from
reproducing to not-reproducing across the same harness, and the adjacent legitimate-
override scenario still passes. Gates are green. Safe to ship.

**Where it clashes:** none of the 5 lenses actually disagreed on the ship/no-ship
question — the Contrarian's points were about honesty-of-scope (flag the UI-label
gap, don't fix it here) rather than a reason to block.

**Recommendation:** SHIP. File the UI-label mirror gap (`renderTracker()` ~line 4650)
as a new, separate Bug & QA Log row rather than fixing it in this change — it's a
real but distinct staleness gap in a display-only code path, not an accessory-
selection defect, and folding it in would widen this diff past what was
investigated and gated.

**The one thing to do first:** push this exact diff, then open a follow-up Bug Log
row for the `renderTracker()` label-mirror gap so it doesn't get lost the way BUG-118
itself sat as a hypothesis for two prior cycles before this one actually proved it.

---
*Mechanism note repeated for anyone citing this file later: this is a single-session
structured analysis performed because no agent-spawning tool was available in this
environment, not a run of 5 independently-instantiated sub-agents with blind peer
review. Treat its confidence accordingly — weaker than a real council, stronger than
a single unstructured opinion.*
