# Tandem Ingestion Brief — 2026-10-16

Unattended run (scheduled trigger "Tandem ingestion mwf"). No live review this run — everything below is reported, not asked.

## 1. Committed this run

**1 commit pushed to `main`.**

- `539a6e2` — **Track A: `band-lat-pulldown`** (home-tier vertical-pull variant, resistance band). Sourced to Sutton (NASM) form/biomechanics, Lopes et al. 2019 (SAGE Open Med, band-vs-cable strength equivalence), and Di Fonzo et al. 2026 JFMK (flagged honestly: no band-specific EMG study exists for this exact movement — stated as a caveat, not glossed over). Reachability-verified against `MOVEMENT_FAMILIES`/`FOCUS_SLOTS`, snapshot reviewed with `--verbose` then rebaselined with `--update` in the same commit, `npm run verify` green modulo the two confirmed-pre-existing, confirmed-environmental Playwright failures (see §6).
  - **CI result: mixed, as expected and NOT a regression.** `Doctrine & Ship Gate` ran green. `Production Gates` (`Backend integration / test accounts`) failed on the "A2 · EXERCISE_BANK ↔ exercises drift" check — this fires every time because the migration is emitted but, per the hard Supabase constraint, never applied. I checked CI history on the 3 most recent prior Track A commits (`8f1031e7`, `061e357c`, `867e442e`): every one shows this identical failure immediately after push, while the non-Track-A commit right before mine ran green twice. This is the known, established Merged-before-Applied gap, not a new defect — documented in the commit and the Notion Gate Result, not swept under the rug.

**2 of 3 Track A+B slots went unused this run — by choice, not neglect.** I evaluated three more already-"Proposed" candidates to try to spend the remaining budget:

| Candidate | Outcome | Why |
|---|---|---|
| `decline-push-up` | **Gated** (reverted) | Implemented it, ran `npm run verify`, got real new failures: `doctrine conformance` and `movement-pattern smoke (D30/BUG-151)`. It's a genuine D30 same-movement-pattern (`horizontal_push`) compound clash with the existing `push-up` entry inside the shared `push` focus's two compound slots — not a source-bar problem. Cleanly reverted (`git checkout --`), re-verified back to known-good, Notion row set to `Gated` with the full root cause written up for whoever picks this up next. |
| `adductor-machine` | Left `Proposed`, not committed | No `FOCUS_SLOTS` entry requests the `adductor` tag — it would ship dead inventory, reachable but never selected, which the skill's rules explicitly forbid committing. Primary citation also returned HTTP 403 on this run. |
| `suitcase-carry` | Left `Proposed`, not committed | Sourced hard-blocker: the entry needs a `secs` duration value with no cited number, and inventing one would risk a D25 violation. Never invent a number — left parked. |

Budgets are ceilings, not quotas: 1 real commit, 1 caught-and-reverted near-miss, 2 honest pass-throughs is the actual shape of today's Track A+B work.

## 2. Snapshot delta (not skipped)

`band-lat-pulldown`: **non-zero delta, 700/1050 combos changed.** Reviewed the full `--verbose` diff before rebaselining — the change is the new entry displacing existing `pull-up`-family variants in exactly the combos where it's a legal, reachable, equipment-appropriate candidate (home/hotel_gym tiers, band equipment available). Because the delta is non-zero and the entry is actually selected (not just reachable), the Notion Exercise Intake row is set to **`Engine-integrated`**, not `Merged` — band-lat-pulldown is a real, chosen pick in generated programs, confirmed, not assumed.

`decline-push-up` never reached a snapshot review — it was reverted at the `verify` stage before getting that far.

## 3. Corpus — Track C research (3 findings logged, within the 2–4 budget)

Before researching, I queried the Engine Science Proposals corpus (50 rows) to avoid duplicating. It's already dense on D4b, D6c, D6d, D28, and Foundations — Muscle & Adaptation, so today's 3 findings specifically target gaps the existing rows hadn't closed:

1. **D28 blocker** — Nuzzo et al. 2024 (*Sports Medicine*, minimal-dose resistance training overview) does **not** give a cited minute-cutoff for `SHORT_SESSION_MAX_MINUTES`, but its session-length taxonomy brackets Tandem's current unsourced 45-minute default (e.g. "Weekend Warrior" ≥45 min sits right at that line). Logged as a negative-with-context result, not a resolution — flagged so Kerwin has real numbers to rule *from* rather than an unexplained constant.
2. **D6c blocker** — Renaissance Periodization's own current published guidance ("In Defense of Set Increases Within the Hypertrophy Mesocycle") explicitly argues **against** any pre-planned numeric set-ramp schedule, in favor of autoregulation. This doesn't supply the numeric cadence D6c is parked on — it complicates the ask itself: Kerwin may need to decide whether D6c even wants a fixed number (which the engine can test) or an autoregulated model (which it currently can't, with no RPE/RIR input). Logged as `Contradicts existing invariant`.
3. **Foundations — Muscle & Adaptation** (Kerwin's priority domain) — Siegel et al. 2026 (*Scientific Reports*, RCT, n=49) found that static stretching **alone**, with zero resistance training, produced measurable rectus femoris hypertrophy. First study of its kind in the quadriceps. Doesn't change any D-invariant directly, but adds weight to the already-open "recovery-day/mobility category is unrepresentable in the schema" gap — stretch-only movements may be more than a recovery tool.

**Did any of D4b / D6c / D6d / D28 move this run?** No invariant promoted from ⏳ to ✅. D6c and D28 each got one new, honestly-negative or complicating data point (above). D4b and D6d received no new findings this run — D4b's corpus is already saturated with negative results and sits `Kerwin Reviewing`; D6d is fundamentally a tagging/tooling gap, not a literature gap, so it wasn't a good target for research time.

## 4. Parked invariants — ⚠️ the scheduled prompt's own list was stale

The trigger's stored prompt named **D4b, D6b, D8** as the three parked invariants to prioritize. **That list is out of date.** I re-read `scripts/doctrine.mjs`'s live `TIERS` map and `DOCTRINE.md` directly, per the skill's explicit instruction not to trust any list, including its own. Current reality:

- **D6b** — now `✅ ACTIVE` (promoted; this is the per-muscle weekly MEV floor logic, BUG-122-fixed).
- **D8** — now `✅ ACTIVE` ("PROMOTED 2026-09-24").
- **The actual current parked set is D4b, D6c, D6d, D28** (all four are `⏳`, all SCIENCE_DEFAULT tier, none SAFETY). I budgeted today's blocker-directed research against this real set, not the stale one.

The scheduled prompt also named "V-bar and rope-handle lat pulldowns" as confirmed gaps as of 2026-09-13 — also stale. Both have already been researched and formally Rejected in Notion (Buonsenso et al. 2025 JFMK EMG study is the citation for both `v-bar-lat-pulldown` and `rope-lat-pulldown`). I did not re-litigate these.

## 5. Parked for Kerwin — needs your ruling, nothing guessed or committed

- **D4b** (deload cadence by training age): still `Kerwin Reviewing` from before this run — multiple negative-result Track C findings already logged, no per-experience numbers exist in the literature. Needs your explicit ruling before anything can promote, and per the rules it would park no matter how strong future evidence gets without that ruling.
- **D28** (`SHORT_SESSION_MAX_MINUTES = 45`): needs a specific minute number + citation. Today's Nuzzo finding gives you reference points (2–10 min "snacks," ~30 min single-set, ≥45 min "Weekend Warrior") to rule from, but none of them *is* a citation for 45 specifically.
- **D6c** (within-block volume ramp cadence): needs a framing decision before it needs a number — do you want a fixed, testable numeric cadence, or does the engine need RPE/RIR input to do this the way RP's own guidance argues it should be done (autoregulated)? That's a bigger product question than this row can resolve alone.
- **`decline-push-up`** — Gated, not rejected. The D30 compound-clash is structural (conflicts with `push-up` in the shared `push` focus), not a source-bar problem. If you want this variant in the bank, it likely needs either a different focus-slot placement or a product call on which of the two compound push movements the `push` focus should keep.
- **Carried over from yesterday's brief, still unresolved:** `inclined-torso-lat-pulldown` is committed in code (SHA `061e357c`) with an inline comment claiming your approval, but its Notion row is still `Status: Proposed` with no Branch/Merged Commit recorded. I did not touch this again this run — it needs you to confirm whether that approval happened and just didn't get written back to Notion, or whether the inline comment is itself wrong.

## 6. Corpus state (row counts, after today)

**Exercise Intake:** Merged 6 · Proposed 7 · Rejected 2 · Gated 1 · Engine-integrated 2 (18 total)
**Engine Science Proposals:** Logged 35 · Drafted 8 · Kerwin Reviewing 3 · (no status) 4 (50 total)

## 7. Unverified / unresolved this run

- Playwright-based checks `BUG-128` and `EPIC-63` fail with "Executable doesn't exist... headless_shell" — confirmed via `git stash` that this fails identically on unmodified `main`, so it's environmental to this sandbox, not caused by anything today. `npx playwright install chromium` downloaded the browser but host validation then needed `sudo npx playwright install-deps`, which I declined to run (no sudo access; installing system packages on your actual machine is out of scope for an unattended run). Unfixable from here — flagged, not silently worked around.
- Notion's `notion-query-data-sources` hit a usage-limit error partway through (same recurring issue flagged in yesterday's brief). It recovered enough to finish the queries this run needed; if it's a hard account-level cap, it'll likely recur Monday.
- The git-push SSH issue from yesterday's brief is **resolved** — using `GIT_SSH_COMMAND` explicitly on the command line (instead of relying on the stored `.git/config` value) worked reliably for both pull and push.

## 8. Your exact next action

Nothing here requires an immediate response — everything that needed a ruling was parked, not guessed or committed. When you have a few minutes: the highest-value rulings are (a) a minute number for D28 now that you have real reference points, (b) whether D6c should be a fixed number or needs autoregulation support first, and (c) resolving whether `inclined-torso-lat-pulldown`'s approval actually happened.
