# Tandem Ingestion Brief — 2026-09-25 (Mon/Wed/Fri unattended run)

Run type: unattended (`tandem-ingestion-mwf` scheduled task). No AskUserQuestion available. Commit authority was in scope per the task instructions, but the repo's git state took it off the table this run (see below) — everything that moved, moved in Notion only.

## 1. Committed this run

**Nothing was committed to `tandem` main this run.**

Before touching any code path, I ran `git status --porcelain` on the repo (protocol requirement: dirty tree in a code path means Notion-only for the run). It came back dirty:

- Modified: `.claude/settings.json`
- Untracked: 11 musclemap PNGs under `scripts/musclemap/` (`female-check-bl.png`, `female-check-bu.png`, `female-check-fl.png`, `female-check-fu.png`, `female-labelcheck.png`, `female-overlay.png`, `male-check-bl.png`, `male-check-bu.png`, `male-check-fl.png`, `male-check-fu.png`, `male-labelcheck.png`, `male-overlay.png`)

Branch: `main`. Last commit: `1381110` ("feat: make 6-day programs selectable in onboarding + profile modal").

None of these look like ingestion artifacts — they look like leftover output from something else (likely the musclemap/labeling scripts) that never got committed or cleaned up. Per protocol I did not touch, stash, or commit through this state. That means Track A (exercises) and Track B (seed programs) had no path to main this run regardless of whether any candidates existed — and per the priority notes below, no live candidates existed anyway.

## 2. Snapshot delta

**Zero.** No code changed, so there is no 630-combo snapshot to diff. Flagging this explicitly rather than skipping the section, per protocol.

## 3. Corpus this run (Track C — research findings only)

One new finding was verified and Logged to the Engine Science Proposals database:

- **Pancar Z, Ilhan MT, et al. (2026).** *Scientific Reports* 16:10299. DOI 10.1038/s41598-026-40612-5 (PMC13031491). RCT, n=19 untrained young men, within-subject design: continuous training (2x/week, 6-8 sets/exercise, 8-12RM) vs. a deload protocol (same exercises, weeks 4 and 8 dropped to 1x/week at 2 sets/exercise, ~18% lower total volume). No significant difference in muscle thickness or 10RM strength-endurance between conditions (F(1,18)=0.563, p=0.463, partial η²=0.030; leg extension p=0.268; biceps curl p=0.331).
  - Logged to Notion: [Reduced volume/frequency deload at weeks 4 and 8 did not hinder hypertrophy or strength-endurance gains in untrained men](https://app.notion.com/p/3e6ca37f935b81e0976af563d87d328f?pvs=204)
  - **Caveat, stated plainly:** this is an untrained-only population. It does not resolve D4b's actual question (training-age-stratified deload cadence). I filed it as complementary to the existing Rong et al. 2025 finding (also Logged, also untrained-population, also non-resolving) rather than as a step toward closing D4b. D4b's live candidate ruling still rests on the Bell et al. 2025 review, which is Lane P-adjacent and sitting at "Kerwin Reviewing" — this new study doesn't change that status.

One additional finding was found and deliberately **not logged**:

- **Koopmans et al. 2026**, mouse myonuclear domain study. Excluded because it's an animal study with only indirect translational bearing on Tandem's human training-age question, and the Foundations - Muscle & Adaptation domain already has 3+ Logged findings. Didn't want to pad the corpus with a low-relevance entry just to hit a budget number.

Budget note: Track C target this run was 2-4 findings, with roughly half owed to the parked-invariant blockers (D4b, D6c, D28). One finding landed on D4b. D6c and D28 research (below) surfaced nothing new to log. Net Track C output this run: 1 Logged finding, which is under budget — reported honestly rather than forced.

## 4. Parked invariants

- **D4b** (training-age-stratified deload cadence, SCIENCE_DEFAULT): still at "Kerwin Reviewing" on the Bell et al. 2025 review. The new Pancar et al. finding adds evidence but doesn't move the needle on that specific ruling since it's untrained-only.
- **D6c** (within-block volume ramp cadence, SAFETY): researched this run — I looked for a numeric weekly ramp-rate cadence beyond what's already Logged in Notion. Found nothing new. No new Notion row created; the existing Logged finding stands as-is.
- **D28** (short-session minute cutoff, SAFETY): researched this run — looked for a resolving minute threshold beyond what's already Logged. Found nothing new. No new Notion row created.
- **D8** (superset prohibition, SAFETY): still "Kerwin Reviewing." No new research directed at this one this run (budget went to D4b/D6c/D28 per the task's emphasis); it stays parked as-is and is also surfaced below under Parked for Kerwin since it's a standing open question, not something I'm claiming progress on.

**D6d is not an open item.** It was fixed 2026-09-23 (BUG-122, commit `85bed50` baseline vs. new engine). The residual below-MEV cells documented in `docs/bug122-below-mev-cells.md` are ceiling cases — the old engine only hit MEV by stacking >11 fractional sets onto a single lift in one session, and Remmert et al. 2025 found no added hypertrophy past ~11 sets/session, so that old credit was an accounting artifact, not a real gap. Below-MEV cells went from 144 (old) to 126 (new) across the full sweep. I'm reporting this here for completeness since the task file's framing implied D6d was still open — it isn't. No action taken on it this run.

## 5. Parked for Kerwin (needs your ruling — nothing here was guessed or committed)

1. **Inclined-torso lat pulldown**: is this a new EXERCISE_BANK entry, or a cue/variation on the existing lat pulldown entry? Needs your call before it could ever become a Track A candidate.
2. **SEL-06**: should a primary muscle be REQUIRED or just PREFERRED in exercise selection logic? This is a selection-rule ruling, not something I can infer from the literature.
3. **D8 (superset prohibition)**: is the SAFETY-tier prohibition itself still correct, or should it be challenged/loosened? SAFETY invariants never auto-commit regardless of evidence strength, so this stays parked no matter what Track C turns up.
4. **Heads up on the task file's premise**: the SKILL.md that kicked off this run states "V-bar and rope-handle lat pulldowns are confirmed gaps as of 2026-09-13." That's stale — this variant avenue is already closed; it's sitting as Rejected in Notion. No action needed from you here, just flagging so the next scheduled run's instructions can be updated to drop that line.

## 6. Corpus state

Engine Science Proposals database now has, on the D4b/deload thread specifically: Bell et al. 2025 (Kerwin Reviewing), Rong et al. 2025 (Logged, non-training-age-stratified, untrained population), and the new Pancar et al. 2026 entry (Logged, same population caveat). Three data points, zero resolution — the training-age-stratified question D4b actually asks remains unanswered by any of them.

## 7. Unverified and unresolved

- The `.claude/settings.json` modification and the 11 untracked musclemap PNGs are unexplained from where I sit — I didn't create them and don't know if they're intentional work-in-progress or stray output. Flagging rather than assuming either way. This is what forced the Notion-only run.
- D6c and D28: confirmed no new *resolving* evidence this run, but that's a negative result from my search, not proof none exists — didn't want to overstate a clean search as a closed question.
- Whether the Koopmans mouse study should ever be reconsidered if the Foundations domain's existing findings later get contested — parking that judgment call rather than deciding it unilaterally.

## 8. Kerwin's exact next action

Nothing urgent needs your sign-off to keep this pipeline moving. The one thing worth a look when you have a minute: clear or explain the `.claude/settings.json` diff and the musclemap PNGs in the tandem repo so the next scheduled run isn't blocked from Track A/B commits by the same dirty-tree state.
