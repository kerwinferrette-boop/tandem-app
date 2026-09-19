# Council ruling — reconciling R1 (PR #22) with main's shipped primaryOnlyMatch/coverageCount

**Date:** 2026-09-18 · **Convened by:** Claude Code (scheduled loop session), per Kerwin's
go-ahead to run llm-council on this reconciliation rather than guess which mechanism wins.
**Method:** 5 advisors (Contrarian, First Principles, Expansionist, Outsider, Executor), each
independent, no peer-review round run (see note below) — chairman synthesis cross-checked
against the live code directly.
**Status:** BINDING as a decision record, per CLAUDE.md §5's citable-artifact convention.

**Method deviation, stated honestly:** the standard council protocol runs a peer-review round
(5 reviewers score all 5 anonymized responses) before the chairman synthesizes. That round was
skipped here: the 5 independent responses converged strongly enough, and one advisor's (the
Executor's) load-bearing factual claim was independently verified against the actual repo
(`git show`), that a peer-review pass was judged to add little beyond what direct code
verification already settled. Full advisor transcripts are the source of truth below; nothing
here overrides what they actually said.

## The question

Two mechanisms exist for keeping `oneRmFactor` (a load-estimation coefficient) from deciding
*which muscle gets trained* in exercise selection — the exact thing Kerwin ruled out ("we
talked about using the oneRMFactor as the deciding factor vs. science - never do it"):

- **R1** (unmerged, `claude/muscle-tag-vocabulary` PR #22, commit `12f3fcc`): removes
  `oneRmFactor` from both selection comparators, replacing it with `primaryMatchRank` (ranked
  ahead of the removed field) and a new `freeWeightRank` tiebreak (ACSM 2009, PMID 19204579).
  New invariant D29: `oneRmFactor` in zero `.sort()` bodies.
- **main's shipped mechanism** (`primaryOnlyMatch` + `coverageCount`, via BUG-116/D31): a hard
  filter restricting COMPOUND slots to primary-match candidates (with a soft empty-pool
  fallback, BUG-82), plus a coverage-count tiebreak for multi-muscle slots. `oneRmFactor`
  still sits in both comparators as a live tiebreak below `coverageCount`.

Built independently, never reconciled — until this session found that PR #22's own tip
(`1ae6ea5`, not `12f3fcc`) already attempted exactly this reconciliation once, back when main's
`primaryOnlyMatch`/`coverageCount` were newer. It's since gone stale against main's further
evolution (D27 lift-history continuity, D31 exercise variety, BUG-108b rotation-depth scaling,
EPIC-41 muscle-tag collapse) — none of which existed when `1ae6ea5` was written.

## The advisors, in one line each

| advisor | position |
|---|---|
| **Contrarian** | The "isolation/core/cardio gap" is a no-op (all-null pools). The real, live danger is `?? 0` null-coercion letting EPIC-41's backfill *coverage*, not science, decide single-muscle compound slots. |
| **First Principles** | Wrong frame — arguing which mechanism "wins" is arguing about the shape of two workarounds for a field that should never have been in a comparator. Delete the field; D29 should assert the *read site*, not ban a syntax shape. |
| **Expansionist** | 162/180 `oneRmFactor` values are `null` — the field deciding anything is a data-coverage artifact, not a science signal. The vacated sort slot is the highest-leverage unclaimed spot in the engine (flags a future `StimulusRank`, not part of this decision). |
| **Outsider** | No real behavioral difference between a hard filter+fallback and a soft rank-first ordering — they coincide everywhere except the empty-pool case, where the fallback makes them equal again. `primaryMatchRank` is a redundant restatement, not a competing rule. |
| **Executor** | The reconciliation already exists, in the repo, at PR #22's actual tip (`1ae6ea5`) — verified directly: `primaryOnlyMatch` → `coverageCount` → `primaryMatchRank` → `patternClash` → `equipmentAvailabilityRank` → `freeWeightRank`, composed, `oneRmFactor` gone from both sort bodies. It's stale against current `main`, not wrong in shape. |

## Verified independently (not taken on any advisor's say-so, per the 2026-09-14 council's own
chairman ruling that advisor citations are non-load-bearing)

- `git show origin/claude/muscle-tag-vocabulary:programs.js`, the `select()` function at
  `1ae6ea5`: confirms the Executor's claim exactly. All of `primaryOnlyMatch`, `coverageCount`,
  `primaryMatchRank`, `patternClash`, `equipmentAvailabilityRank`, `freeWeightRank` are present,
  composed in that order, with `oneRmFactor` absent from the comparator. The "third
  composition" the question asked about already exists as working code — it just predates
  main's later evolution and cannot be merged as-is.
- Current `main`'s `EXERCISE_BANK`: of 179 entries, `oneRmFactor` is non-null on only the
  compound-category chest-press family (~17-18 entries) — isolation (75/75), core (25/25), and
  cardio (7/7) are 100% null. This confirms Contrarian/Expansionist/Executor's independent
  counts: the tiebreak at `programs.js:2166-2169` (`select()`) and `:2503-2506` (`bank()`),
  guarded by `a.oneRmFactor != null || b.oneRmFactor != null`, never fires for an all-null pool.
- **The one nuance no single advisor stated precisely, found by reading `primaryOnlyMatch`'s
  own guard clause directly:** `primaryOnlyMatch` only applies `cat === 'compound'` —
  `(cat !== 'compound' || primaryOnlyMatch(e, groups))`. For non-compound (isolation/core/
  cardio) categories this filter is **skipped entirely**, so those pools still legally admit
  synergist-only matches alongside primary matches. `primaryMatchRank` would therefore NOT be
  a no-op there (contra a literal reading of Outsider's "no real behavioral difference") — it
  is the only mechanism that would ever demote a synergist-only isolation candidate below a
  primary-match one. It IS a no-op for compound slots specifically (where `primaryOnlyMatch`'s
  filter+fallback already makes it redundant, confirmed by trace: if the strict pool is empty,
  every fallback survivor is synergist-only, so `primaryMatchRank` scores them all equally).

# THE VERDICT

## Where the council agrees (5/5)

`oneRmFactor` must come out of both selection comparators, full stop — not demoted, removed.
Every advisor converged on this independently, and it matches the 2026-09-14 council's own R1
text.

## Where the council clashes, resolved by direct verification

**Is `primaryMatchRank` redundant?** Three advisors (First Principles, Expansionist, Outsider)
said yes, drop it. Verification says: **redundant for compound slots** (where
`primaryOnlyMatch`'s hard filter already achieves the same outcome, per the trace above) but
**genuinely additive for non-compound slots** (where `primaryOnlyMatch` doesn't run at all).
Neither "drop it" nor "keep it as written" is exactly right — it should land, but scoped to
where it does real work.

**Does main "already satisfy R1"?** The question's framing (and the Contrarian's sharpest
point) says no — the live-relevant gap is single-muscle COMPOUND slots (where
`coverageCount`'s `groups.length > 1` guard never fires and `primaryOnlyMatch` filters but
doesn't order within the pool), which is exactly Kerwin's original Decline-before-Flat
complaint. That gap is where `freeWeightRank` (a genuinely new, cited, currently-absent-from-
main mechanism) does its real work.

## Blind spots the direct verification caught

1. The "isolation/core/cardio gap" everyone framed around `oneRmFactor`'s legitimacy doesn't
   exist (it's 100% null there) — but a DIFFERENT, real gap exists in the same slots:
   `primaryMatchRank`'s own contribution, independent of `oneRmFactor` entirely.
2. PR #22's own commit history already contains a working, composed reconciliation
   (`1ae6ea5`) — this was never a green-field design problem, it's a "re-verify a known-good
   shape against a moved target" problem. Treating it as the former (design from scratch) or
   ignoring it (as the original question implicitly did by not checking the branch tip) both
   waste the branch's actual prior work.
3. D29 as literally specified ("`oneRmFactor` in zero `.sort()` bodies") is real, checkable,
   and currently true — but it's a syntax-shape ban, trivially defeated by hoisting the read
   into a named helper (`const rank = e => e.oneRmFactor`) that a comparator then calls. It
   should be strengthened, not replaced.

## The recommendation

Build fresh against **current** `main` (not cherry-picked from `1ae6ea5`, which predates
D27/D31/BUG-108b/EPIC-41) — same discipline as the chest fix already shipped this session:

1. Remove `oneRmFactor` entirely from `select()`'s and `bank()`'s comparators. Keep
   `primaryOnlyMatch`/`coverageCount` exactly as they are today — they're correct and don't
   need touching.
2. Add `primaryMatchRank`, but ONLY where it's live: for non-compound (isolation/core/cardio)
   categories, in the slot where `oneRmFactor` used to sit. Landing it for compound slots too
   is harmless (it'll be a no-op there) but should be documented as a no-op, not implied to be
   doing work it isn't.
3. Add `freeWeightRank` (ACSM 2009, PMID 19204579) as the tiebreak immediately before the
   final alphabetical fallback, in both comparators — this is the one piece with no existing
   analog on `main` and the one doing the most real work on the reported bug's exact case
   (single-muscle compound slots).
4. D29 should assert BOTH a behavioral check (perturb every `oneRmFactor` value; require zero
   selection-output changes across the 630-combo persona sweep — the same "verify by running"
   discipline this project already applies elsewhere) AND a structural one (`oneRmFactor` is
   read only by `defW()`/`seedWeight()`, load-derivation code — not merely absent from
   `.sort(`, but absent from every selection/ranking call path).

## The one thing to do first

Ship the `oneRmFactor` removal alone, first, as its own small commit — separate from adding
`primaryMatchRank` (isolation-scoped) and `freeWeightRank`. Removing a field from two
comparators is a different, smaller risk than adding two new ranking behaviors; CLAUDE.md's own
minimal-change principle argues against bundling a subtraction with two additions in one
commit. Verify the removal alone (630-combo sweep, before/after diff) shows the expected
near-zero output change for isolation/core/cardio (where it was null-vs-null already) and only
moves compound-slot outcomes where `coverageCount`/`primaryOnlyMatch` don't already decide —
then land `primaryMatchRank` + `freeWeightRank` as a second, separately-verified commit.
