# Council — pre-ship gate, 2026-11-17 — BUG-108 ratchet bank-size assertion + stale swap-migration comment

As-of 2026-11-17 (scheduled loop, unattended). Required by `.claude/loop-config.md`
`escalation.pre_ship_council_gate`. Five advisors answered independently on a FIRST draft; an
independent verifier ran the code; the batch was revised; a chairman then checked the revised diff
against each advisor's condition. **Deviation from the skill, stated plainly:** the anonymised
peer-review round was not run. The advisors' conditions were concrete and overlapping, so the
chairman checked them against the diff directly instead.

## The question

Ship to main (a) `scripts/selection-reachability-smoke.mjs` S6 — the baseline fixture's pinned
`bank` must equal the live `EXERCISE_BANK` size — and (b) a comment-only correction in
`tandem.html` replacing "wired but INERT until migrations/0024_b1_exercise_swaps.sql is applied"
(the migration was applied 2026-10-07; confirmed by live read-only query: table present, RLS on,
1 policy, recorded as version 20261007195733)?

## First-draft votes

| Advisor | A | B | Condition |
|---|---|---|---|
| Contrarian | ALTER | ALTER | S6's printed remedy (`--write-baseline`) re-records the whole fixture and could bless new dead inventory: make it refuse growth without a flag. B's "next hydrate pushes local entries" is an unproven behavioural claim: trace it or delete it. Rule on whether a comment beside sync code is in scope. |
| Outsider | ALTER | ALTER | Same laundering concern; tell the ingestion workflow; is "33 of 184" corrected? B: unproven claim; anchor "LIVE". |
| First Principles | SHIP | ALTER | The same false "until 0024 is applied" survives in the `hydrateSwapsFromCloud()` header; `swap-cloud-smoke.mjs` narrates the apply as future. |
| Expansionist | SHIP | ALTER | The header twin, plus the check-name string in `scripts/verify.mjs`. A class-level gate is the bigger prize. |
| Executor | SHIP | ALTER | Fix the header twin in the same commit and sweep for a third remnant. |

## Independent verifier (ran the code, first draft)

A: PASS (S6 catches drift both directions, has teeth alone, the be1d4e9 claim is true).
B: FAIL — the hydrate sentence was true of the function and false of the app:
`hydrateSwapsFromCloud()` has two callers, `restoreFromCloud()` (manual Restore) and
`syncFromCloud()` (no-local-cfg boot branch), so a returning user's everyday boot never runs it;
and `pushExSwap()`'s undo DELETE discards its result, so an offline undo is resurrected.

## Revision

- A: `--write-baseline` refuses to add a never-selected slug unless `--allow-growth` is passed
  (shown with a dummy never-selected entry: gate red on S1+S6, plain re-record refused with the
  fixture byte-identical, `--allow-growth` writes). S6's message says so.
- B: the comment now states only what was measured (applied per the migration header; nothing
  throws; where reconciliation runs; the unchecked DELETE) and says both defects are filed, not
  fixed. Header twin fixed. `swap-cloud-smoke.mjs` header gains a DONE note.
- Filed, not fixed (sync is forbidden scope): the Bug & QA Log "SYNC/SWAP" row of 2026-11-17.

## Chairman's verdict on the revised diff

**CONSENSUS: SHIP A AND B**, on three conditions, all applied before the push:
1. Qualify the unchanged sentence in the hydrate header that said a real undo "already deleted its
   row" (it contradicted the new comment). Done, comment-only.
2. Cite the bug ID in the B4 comment. Done.
3. Full verify on the exact final tree must print `ALL N CHECKS PASS`. The finish-path
   set-integrity check is flaky on untouched main (2 of 6 red on a pristine export of b97820e); a
   red may be retried only if it is the SOLE failure, at most twice, retry count stated in the
   commit body, never skipped or reordered. Any other red means hold.

**Scope ruling:** a comment-only edit beside sync code is in scope if it changes zero executable
lines and only removes or corrects statements about reality; it may not describe intended future
behaviour.

**Deferred, accepted, and owed to Kerwin:**
- (Superseded before the push.) The chairman accepted leaving the verify check-name string
  "…fails soft until 0024 applied" on the builder's claim that `merge-parity-smoke.mjs` R2 compares
  check names. That claim was false: R2 is keyed on the registered script basename. The second
  verifier found it; the string was renamed in the same commit.
- The ingestion skill's instructions live outside the repo; it should say "a bank change needs
  `--write-baseline` in the same commit".
- `tandem.html`'s duel-sheet note "until Kerwin applies migrations/0018_pr_points_15.sql" is stale
  (0018 was applied 2026-09-23) but sits in scoring code, which the loop does not edit.
- BUG-108's tracker title still says "33 of 184"; the live figure is 27 of 185.

## After the verdict — second independent verifier (ran the revised tree)

A: PASS. B: PASS. Three findings, all acted on before the push:
1. `--write-baseline`'s refusal could be bypassed by a fixture that exists but is unreadable
   (malformed JSON, missing or null `entries`), which a merge conflict produces with no intent.
   Fixed: an existing-but-unreadable fixture is refused the same way; only an absent file is a first
   pin. Deleting the file by hand still re-pins freely, and the script header says so.
2. `scripts/swap-cloud-smoke.mjs` check [F]'s label called syncFromCloud the "returning session"
   path. Corrected (comment-only).
3. The verify check-name string is safe to rename (see above). Renamed.

Full `npm run verify` was then re-run on the resulting tree; its result is in the commit body.
