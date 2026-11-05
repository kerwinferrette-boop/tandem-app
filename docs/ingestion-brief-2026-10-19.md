# Tandem Ingestion Brief — 2026-10-19

Run: scheduled ("Tandem ingestion mwf"), fired 2026-10-19 18:36:49 UTC. Unattended — AskUserQuestion
unavailable. Author: Kerwin Ferrette (agent-run).

## Committed this run

**Nothing.** Zero Track A/B/D commits, zero pushes to `main`, zero CI runs triggered this run.

The one candidate attempted — a new `band-overhead-press` exercise (Track A, intended to close
D6d's home-tier anterior-delt MEV gap) — was built, verified, and then **reverted** before commit
because it tripped a real gate:

- Added the `EXERCISE_BANK` entry + appended it to `MOVEMENT_FAMILIES['overhead-press'].variants`.
- `scripts/reachability-smoke.mjs` confirmed it reachable (186/186 bank entries now reachable via
  the `push`/`shoulders` `FOCUS_SLOTS`).
- `scripts/per-exercise-cap-smoke.mjs` (BUG-231's ratchet, check A5) failed: the new exercise
  changes which cells get force-stacked, growing the live forced-cell set beyond the pinned
  132-cell `bug231-forced-stacks.json` fixture — a ratchet growth that explicitly requires either
  `--write-fixture` with written justification, or a different fix (a `muscle_tag_rescope` on the
  existing anterior-delt compounds) rather than adding a new exercise at all.
- That is exactly the kind of call this skill reserves for Kerwin, not for an unattended run:
  growing a pinned safety ratchet on your own say-so is not something to do without a human
  signing off. **Reverted cleanly** via `git show HEAD:programs.js` + file copy (not `checkout --`,
  which is blocked by the sandbox's delete-permission gate on this device). Confirmed via
  `git status --porcelain` / `git diff --stat` (both empty) and a clean re-run of `npm run verify`
  back to the known baseline (44/46 passing — see "Unverified and unresolved" below for the 2
  pre-existing, environmental failures).
- Logged as a Code Finding in Notion (`band-overhead-press` row set to `Gated`, full `Gate Result`
  text on the row) plus a standalone Engine Science Proposal describing the BUG-231/D6d
  interaction, so the next run (or Kerwin) doesn't have to rediscover this from scratch.

**Why zero, not three:** Track A/B had a 3-item ceiling this run; I only had one candidate reach
the gate stage, and it failed the gate. Zero is an explicitly sanctioned outcome for any track on
any run — this is "nothing cleared the bar," not "nothing was attempted."

## Snapshot delta

**N/A — zero commits, so nothing changed, and this section is not skipped even though the delta is
zero.** `scripts/program-snapshot.mjs` was never run in `--update` mode this run because no change
ever reached a commit. The 630-combo baseline is unchanged from before this run.

## Corpus (Track C) — 2 new findings logged to Engine Science Proposals

1. **Code Finding** (`3feca37f935b810da0c0e83581e441e7`) — Adding a reachable home-tier
   primary-`anterior_delt` compound (to close D6d's known below-MEV gap) converts that gap into a
   BUG-231 forced-stack ratchet violation instead of a clean close. In other words: D6d and
   BUG-231 are now known to interact, and closing D6d by adding exercises alone is not safe without
   either a ratchet-growth decision or a `muscle_tag_rescope` on the existing anterior-delt
   compounds. No citation attached (this is an internal-architecture finding, not literature).
2. **Research Finding** (`3feca37f935b81668c50e9c0d255a17f`) — Regional (non-uniform) hypertrophy
   extends beyond the biceps (where Tandem's corpus already had a finding) to triceps, quads, and
   calves. Domain: Foundations – Muscle & Adaptation, per Kerwin's priority emphasis on that domain
   this run. Evidence tier and sourcing are recorded on the Notion row itself (not restated here to
   avoid drifting from what's actually logged) — read the row for the exact citation and effect
   size before acting on it.

I did not pad to a 4th finding. Two well-characterized findings beat a thin third.

## Parked invariants — and a correction to this run's own framing

The scheduled task named the parked blockers as **D4b / D6b / D8**. That framing is **stale**. I
re-verified `DOCTRINE.md`'s own ⏳ markers and `scripts/doctrine.mjs`'s `TIERS` map directly this
run (never trusting a cached list, per the skill's own instruction) and found:

- **D6b and D8 are now ACTIVE/PROMOTED**, not parked. Someone (a prior run or Kerwin) already
  closed them out.
- The actual currently-parked (⏳) set is **D4b, D6c, D6d, D28**.

Status on each, this run:

- **D4b** (training-age-scaled deload cadence) — no movement. Exhaustively searched again; no
  qualifying citation for per-experience-level numbers exists yet. Still blocked exactly as
  doctrine states: needs Kerwin's ruling *and* a citation that does not currently exist.
- **D6c** (within-block MEV→MRV ramp cadence) — no movement. Worth flagging: current RP guidance
  itself now argues against the premise this invariant was written on, which is a separate thing
  Kerwin may want to weigh in on (not just "needs a citation" — may need "needs reconsideration").
- **D6d** (home-tier anterior-delt MEV gap) — no citation-level movement, but **did gain a new,
  concrete data point this run**: the BUG-231 interaction above. It's no longer just "unclosed," it's
  now "unclosed *and* the obvious fix collides with a safety ratchet." That's progress on
  understanding the blocker even though the invariant itself didn't move.
- **D28** (session-duration minute cutoff) — no movement. Exhaustively searched again; no
  qualifying citation exists.

## Parked for Kerwin — specific open questions, not guesses

1. **`band-overhead-press` (now `Gated`)** — does closing D6d's anterior-delt gap go via
   (a) growing the BUG-231 forced-stack fixture (`--write-fixture`, with justification) to admit
   this exercise, or (b) a `muscle_tag_rescope` on the existing anterior-delt compounds instead of
   adding a new exercise at all? I did not choose for you.
2. **`adductor-machine`** — `reachability-smoke.mjs`'s own KNOWN-OPEN-GAPS list confirms `adductor`
   alone is not reachable as a sole primary target under any current `FOCUS_SLOTS` entry. Is this
   worth a new slot, or does it stay an accepted gap?
3. **`suitcase-carry`** — needs a default-duration decision before it can be finished (45s is the
   recommended default from the research behind it, but I'm not setting it unilaterally).
4. **`inclined-torso-lat-pulldown`** — needs a decision on whether this is a genuinely new bank
   entry or a cue-refinement of an existing lat-pulldown variant.

## Corpus state (counts, this run vs. before)

- Exercise Intake (Status): Engine-integrated 2, Gated 1→**2** (band-overhead-press), Merged 6,
  Proposed 7→**6**, Rejected 2.
- Engine Science Proposals (Domain): null 5, Biomechanics&Measurement 4, ExerciseSelection 7,
  Foundations 9→**10**, InternalArchitecture 7→**8**, Periodization 6, Recovery&Injury 1,
  TrainingVariables 11.
- Program Intake (Goal): build_muscle 2. Zero seeds for fat_burn / strength / maintenance — still
  unaddressed; no Track B work was attempted this run (out of scope/budget).

## Unverified and unresolved

- Two PMC sources (PMC8449772, PMC7112217) were reCAPTCHA-blocked on every fetch attempt. Per the
  skill's rule, I did not route around the block (no mirrors, no alternate hosts) — they're simply
  unused, not silently substituted.
- `scripts/verify.mjs` runs 44/46 green. The 2 failures (`BUG-128`, `EPIC-63`, both Playwright
  browser-launch tests) are environmental: this device's sandbox has no root/sudo, so
  `playwright install-deps` cannot complete. Confirmed this is pre-existing and present on
  unmodified `main` too — not caused by anything this run touched. A prior run's own
  `ingestion-brief-2026-10-16.md` documents hitting the identical issue, so I'm treating 44/46 as
  the real "green" bar, consistent with that precedent, while holding the line at zero *new*
  failures.
- A harmless scratch file, `programs.js.restored`, is sitting untracked in the repo root — a
  byproduct of the revert above. I could not delete it (this sandbox disables file deletion in
  connected folders until a human approves it, and requesting that approval for a one-line cleanup
  on an unattended run felt like the wrong use of that gate). It's inert and git-ignorable; safe to
  delete by hand or on the next run.

## Kerwin's exact next action

Nothing is blocking you from the engine's perspective — nothing broke, nothing shipped. The one
decision that would unblock new work is item 1 above: rule on `band-overhead-press`
(fixture-growth vs. muscle_tag_rescope), since that's the one open thread with a concrete, ready
candidate behind it.
