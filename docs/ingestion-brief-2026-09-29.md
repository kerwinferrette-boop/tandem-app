# Tandem Ingestion Brief — 2026-09-29 (Mon/Wed/Fri unattended run)

Run type: unattended (`tandem-ingestion-mwf` scheduled task). No AskUserQuestion available. Commit authority was in scope per the task instructions, but the repo's git state took it off the table this run, same as 2026-09-25 — everything that moved, moved in Notion only.

## 1. Committed this run

**Nothing was committed to `tandem` main this run.**

`git status --porcelain` came back dirty, same shape as the 2026-09-25 run plus one new untracked file:

- Modified: `.claude/settings.json`
- Untracked: 11 musclemap PNGs under `scripts/musclemap/` (unchanged from 2026-09-25)
- Untracked: `docs/ingestion-brief-2026-09-25.md` (the prior run's own brief, never committed)

Branch: `main`. Last commit: `1381110` ("feat: make 6-day programs selectable in onboarding + profile modal") — unchanged since 2026-09-25, confirming no one has pushed to main in the interim either.

This is now the **second consecutive scheduled run** blocked from Track A/B/D commits by the identical dirty-tree state. It was flagged to Kerwin on 2026-09-25 and has not been cleared.

## 2. Snapshot delta

**Zero.** No code changed, so there is no 630-combo snapshot to diff. Stating this explicitly rather than skipping the section, per protocol.

## 3. Corpus this run (Track C — Notion only)

Two rows logged to Engine Science Proposals:

- **Buonsenso et al. (2025)**, *Journal of Functional Morphology and Kinesiology* — Research Finding, Domain: Biomechanics & Measurement, Evidence Tier: Non-randomized/cross-sectional/EMG. n=40 trained males (23.88±3.56 yrs, ≥5 yrs training), repeated-measures EMG across 7 lat-pulldown grip/forearm-orientation variants. Five of six muscles tested showed no significant activation difference across variants: lat dorsi F(1,6)=0.415 p=0.868, mid trap F=0.919 p=0.484, low trap F=1.225 p=0.298, biceps F=1.023 p=0.414, infraspinatus F=0.500 p=0.807. Only posterior deltoid differed, and the authors attribute that to trunk-angle differences, not the handle or grip. **Why this matters for the standing agenda**: it's a direct, cited answer to the STEP 1C variant-depth question — grip/attachment-only lat-pulldown variants (the V-bar/rope-handle candidates already Rejected in Exercise Intake) don't have a biomechanical consequence for the target muscle per this study, which supports treating that class of variant as low-priority going forward rather than reopening it. [Logged row](https://app.notion.com/p/3eaca37f935b8170a843c578f646096d)

- **Internal correction (Code Finding, not a literature finding)**: the 2026-09-25 brief's claim that "D6d is not an open item... fixed 2026-09-23 (BUG-122, commit 85bed50)" is **false**. See Section 4 below for the full verification. Logged as a standing correction so no future run inherits it. [Logged row](https://app.notion.com/p/3eaca37f935b81f8afc9f8faefcdb009)

**Budget note**: Track C target was 2-4 findings, roughly half owed to the parked-invariant blockers (D4b, D6c, D28). Neither row landed directly on those three this run — Buonsenso is a variant-depth/biomechanics finding, and the D6d correction is architecture housekeeping, not a literature finding at all. This is under the "half owed to blockers" guidance and I'm reporting that honestly rather than forcing a padded literature search to hit a number. The prior run (2026-09-25) already logged three findings directly against D4b (Rong et al. 2025, Bell et al. 2025, Pancar et al. 2026) plus one each against D6c (Barsuhn et al. 2024) and D28 (Bonder et al. 2021) — five rows total, all still sitting at `Logged` or `Kerwin Reviewing`, none superseded. Re-running fresh searches against the same three questions this run risked padding the corpus with weaker duplicate coverage rather than genuinely advancing them; the real blocker on all three is Kerwin's ruling, not more literature (see Section 4).

## 4. Parked invariants — re-verified against current `DOCTRINE.md`, not assumed

I re-read `DOCTRINE.md` directly this run rather than trusting the skill file's 2026-09-13 snapshot or the prior brief's claims. Current state (grep + targeted line reads):

- **D4b** (deload cadence by training age, SCIENCE_DEFAULT) — still `⏳ when ruled`. Unmoved this run. Blocker unchanged: needs Kerwin's ruling plus a cited per-experience numeric source, which the corpus still doesn't have (Bell et al. 2025's own conclusion, already logged, is that the literature doesn't give per-experience numbers — a precise negative result, not a gap in searching).
- **D6b** — **no longer parked.** It's `✅ ACTIVE` in current `DOCTRINE.md` (the BUG-122 per-muscle allocation fix). The skill file's "as of 2026-09-13" list is stale on this point; DOCTRINE.md is the law per its own instructions, not the skill snapshot.
- **D6c** (within-block MEV→MRV ramp cadence, SAFETY-adjacent) — still `⏳ needs numeric ramp cadence`. Unmoved this run. No new research directed at it this run; the existing Barsuhn et al. 2024 finding (already logged, `Doctrine Tier = SAFETY - parks for Kerwin`) stands.
- **D6d** — **newly confirmed still open, correcting the record.** DOCTRINE.md line 55 marks it `⏳ PENDING` in plain text: *"the only home-tier bank entry with a primary anterior-delt tag is Jumping Jacks"* is still the blocker, closing only when `muscle_tag_rescope` lands. I checked this three ways because the prior brief said otherwise: (1) grepped and read DOCTRINE.md line 55 directly — PENDING; (2) read `docs/bug122-below-mev-cells.md`, whose own first line says "Tracked by PENDING doctrine D6d"; (3) ran `git show` on commit `85bed50`, the commit the prior brief cited as the fix — its actual content is an unrelated DOM-identity bug fix ("exercise ids unique across every program"), not a D6d closure. All three sources agree with each other and disagree with the 2026-09-25 brief. I logged this as a Code Finding in Notion so it doesn't get repeated.
- **D8** — **no longer parked.** Promoted to `✅ ACTIVE` (SPLIT tier) on 2026-09-24, per DOCTRINE.md's own text: strength/maintenance shipped as first-class goals, zero-supersets-on-strength-primaries is SAFETY-enforced structurally, maintenance-caps-at-MAV is SCIENCE_DEFAULT. The prior brief's "Parked for Kerwin" item #3 ("is the SAFETY-tier prohibition itself still correct") is about whether the now-ACTIVE rule is right, not about D8's tier status — still worth carrying forward as a standing question, see Section 5.
- **D28** (short-session minute cutoff, SAFETY) — still `⏳ needs threshold ruling`. Unmoved this run. No new research directed at it.

**Net: four invariants are currently parked (D4b, D6c, D6d, D28), not the three the skill file's stale 2026-09-13 snapshot names.** D6b and D8 have graduated to ACTIVE since that snapshot was written; D6d didn't exist as a concept until BUG-122 surfaced it on 2026-09-21/23. Flagging this so the skill file itself gets updated rather than continuing to mislead the next run's search priorities.

## 5. Parked for Kerwin (nothing here was guessed or committed)

Carried forward from 2026-09-25, still open as far as I can verify:

1. **Inclined-torso lat pulldown**: new EXERCISE_BANK entry, or a cue/variation on the existing lat pulldown entry? Still needs your call before it could become a Track A candidate. (The new Buonsenso finding above is adjacent — it's about grip/forearm orientation, not torso angle — so it doesn't resolve this one, though it does note torso angle is what drove the one activation difference the study did find, for posterior delt.)
2. **SEL-06**: should a primary muscle be REQUIRED or just PREFERRED in exercise selection logic? Selection-rule ruling, not inferable from literature.
3. **D8's now-ACTIVE superset prohibition**: is the SAFETY-tier zero-supersets-on-strength-primaries rule itself correct, or should it be challenged/loosened now that it's shipped? SAFETY invariants never auto-commit regardless of evidence strength, so this stays parked no matter what Track C turns up.
4. **New this run — the dirty-tree state itself**: the `.claude/settings.json` modification and the 11 musclemap PNGs under `scripts/musclemap/` have now blocked Track A/B/D commits across two consecutive scheduled runs (2026-09-25 and today). I still don't know if this is intentional in-progress work or stray output, and per protocol I won't touch, stash, or commit through it. If it's safe to clear, clearing it (or telling me it's fine to `git checkout` / `rm` those paths) is the single highest-leverage thing that would unblock the next run's Track A/B work.
5. **New this run — skill file staleness**: the ingestion skill's "as of 2026-09-13" parked-invariant list (D4b, D6b, D8) is now wrong on two of three entries (D6b and D8 are ACTIVE) and missing D6d entirely. Worth a note in the skill file itself so future runs don't start from a stale snapshot before re-verifying against DOCTRINE.md — which I did this run, but it's easy for a future run to skip that step if the skill file looks authoritative.

## 6. Corpus state

- **Exercise Intake**: 17 rows total — 4 Merged, 11 Proposed, 2 Rejected. Unchanged this run (no code path was open).
- **Program Intake**: 2 rows total — 2 Proposed. Unchanged this run.
- **Engine Science Proposals**: was ~27 rows before this run; now +2 (Buonsenso Research Finding, D6d-correction Code Finding) = ~29. On the D4b/D6c/D28 thread specifically, still five substantive rows from the 2026-09-25 run (Bell et al. 2025 at Kerwin Reviewing; Rong et al. 2025, Pancar et al. 2026, Barsuhn et al. 2024, Bonder et al. 2021 all at Logged) — none superseded, none newly resolved this run.
- Research-agenda domains still with little or nothing logged against them, per the skill's standing agenda: fiber-type/rep-band justification, rest-interval length vs. hypertrophy/strength, regional (submuscle) hypertrophy validity, RIR/proximity-to-failure modeling, rep-max formula accuracy by rep range, exercise-order effects on later lifts. None of these were pursued this run; noting them so the next run has a starting list rather than reasoning from scratch.

## 7. Unverified and unresolved

- The `.claude/settings.json` diff and the musclemap PNGs remain unexplained from where I sit, now across two runs. Flagging again rather than assuming either way.
- D6c and D28: confirmed no new resolving evidence surfaced this run, but I didn't run fresh literature searches against them this run either (budget went to variant-depth and the D6d correction) — this is an honest "not searched," not a "searched and found nothing."
- Whether the Koopmans mouse myonuclear-domain study (declined for logging on 2026-09-25) should ever be reconsidered if Foundations - Muscle & Adaptation's existing findings get contested later — still an open judgment call, not decided unilaterally.
- The Buonsenso finding's `Generalizes across programs?` is set to No — it's a single EMG study with no replication, consistent with how the skill treats single-study evidence, but flagging that as a judgment call rather than something the source itself states.

## 8. Kerwin's exact next action

Same ask as 2026-09-25, now more urgent since it's blocked two runs in a row: clear or explain the `.claude/settings.json` diff and the musclemap PNGs in the tandem repo so the next scheduled run isn't stopped at Track A/B/D commits by the same dirty-tree state. Everything else above is informational — nothing needs your sign-off to keep Track C moving, but Track A/B/D has now been idle across two runs for a reason that's still sitting in your working tree.
