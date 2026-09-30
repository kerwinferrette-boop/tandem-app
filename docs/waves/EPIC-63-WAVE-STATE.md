# EPIC-63 — Wave state · Control Reachability (reads-side audit of EPIC-40)

**Created:** 2026-09-30, live session with Kerwin.
**Source Epic (Notion):** EPIC-63 · "Control Reachability — controls that write but are never read",
Status: Scoped, P1 High, Effort L.
`https://app.notion.com/3ebca37f935b8170be4bf2d71a62e533`
**Evidence artifact:** `docs/control-reachability-audit-2026-09-30.md` (all findings, line-cited).
**Mechanism entry:** `docs/self-corrections.md` SC-34.
**Linked Bug rows:** BUG-191 … BUG-205 (15 rows, all Status=New, each carrying a SCOPE-LOCK
`Claude Code Prompt`).

## Why this Epic exists

EPIC-40's catalog reported **1 dead handler of 159** because
`scripts/audit-dead-handlers.mjs` only ever tested the WRITE side — it scores a handler
"Generative" for assigning to a global (`:82`), calling a calc/render/save-named function (`:84`),
or containing any `sb.from(` (`:81`), and never asks whether anything READS the value. A reads-side
sweep found ~40 chain breaks. The proof is inside EPIC-40's own write-up: it called the colour-theme
path "fully wired" because it upserts `users.color_theme`, a column read by nothing.

## Invariants for whoever resumes

- **Ship gate:** `npm run verify` AND `npm run validate:personas` both green; add
  `npm run walkthrough:onboarding` for anything touching onboarding (BUG-198/199/201).
  As of 2026-09-30 `verify` is **29 checks** (a QA-feed gate was added this session).
- **Verify by RUNNING, at the pixel.** Every row here is a "value goes nowhere" bug, so a green
  gate is *not* evidence the fix works. Reproduce at the surface, using the **test accounts**
  (`kerwinferrette+test@gmail.com`) per loop-config `default_not_fallback` — never Kerwin's or
  Dani's real rows.
- **Fix the mechanism, not the instance.** Most of these are one-value-two-stores. The COULD section
  must name which *other* values of the same axis were checked (CLAUDE.md's BUG-73/114 rule).
- **Line numbers are pinned to `6f339fd`.** `tandem.html` moves; re-grep before editing.
- **`apply_migration` is HUMAN-ONLY.** Author SQL, hand it to Kerwin, never apply it, and never
  claim cloud persistence works until a real round-trip is verified.
- **`safety.forbidden`:** no scoring, matchmaking or 1RM/biometric-layer change. BUG-202 (`week_targets`
  on `personal_records`) is the likely tripwire — council output there is advisory only.
- **`design_changes_hold`:** anything altering look-and-feel goes to Kerwin. BUG-203 (collapsing
  visible options) probably qualifies; when ambiguous, treat it as design and ask.
- **Do NOT start the inline-handler / CSP refactor** (223 `onclick`, 0 `addEventListener`). That is
  the one piece EPIC-40's "dead last" gate was genuinely protecting.

## Step status

- [x] **1. Zero-collision wires — BUG-192, BUG-193, BUG-194, BUG-196, BUG-200.**
      **DONE 2026-09-30, merged to main in `a2dc2c6`.** Checked off only after the browser
      verification below existed — the earlier note said this box would not be ticked on green
      static gates, and it was not.
      **ORIGINAL NOTE, kept because it was right:** All five are pushed on
      `claude/control-reachability-audit` with a gate each (`verify` 28 → 35). What is missing is
      the only thing this Epic is about: **verification at the surface the user sees.** None has
      been driven in a browser; the gates are static/vm-level. Checking this box on green gates
      would be the exact 'wired is not working' error the Epic exists to correct, so the resume
      pointer stays here. To close it, run the five live repros in Verification below against the
      test accounts, then check off.
      **Depends on:** nothing. No region roadmap Wave 7/8 rewrites.
      **File/region:** `applySetupSelection` (:4434-4463) + setup render (:5243-5255);
      `restoreFromCloud` (:7683ff) vs `syncFromCloud` (:9055-9080); `saveProfileStats` (:10099) +
      `openProfileModal` (:10004); `resetWeek` (:7146); `.dash-competition` (:1849) + one-off cards
      (:8135-8138).
      **should/could/did stub:** SHOULD — a value the UI shows as set must be the value the engine
      and the next render read; `restoreFromCloud` must reconstruct cfg identically to
      `syncFromCloud`, and `injuries` is a SAFETY invariant (`:3565`, `:8254`). COULD — patch each
      reported field individually: rejected, that is the per-case fix that lets the next field rot;
      one shared cfg builder instead. DID / RECONCILE — fill on completion, verified by running,
      not reading.
      **Suggested order:** BUG-193 first (safety), then 194, 192, 196, 200.

- [x] **2. BUG-195 — `.ex-notes` local persistence.**
      **LOCAL HALF DONE + BROWSER-VERIFIED 2026-09-30** (type a note, re-render, it survives —
      `control-reachability-walkthrough.mjs` [3], mutation-tested). Migration `0022` APPLIED, so
      `exercise_notes` now exists with RLS + the unique(user_id, exercise_name) constraint.
      **The CLIENT cloud round-trip is still unwired — notes remain LOCAL ONLY.** Do not describe
      cloud notes as working. Original note:
      (a) the browser repro (type a note, force a re-render, reopen the app);
      (b) the CLOUD half — `migrations/0022_bug195_restore_exercise_notes.sql` is written and
      staged but **Kerwin must apply it**; `apply_migration` is denied in
      `.claude/settings.json:44`. Per-exercise notes are LOCAL ONLY until a real round-trip
      against Postgres is verified. Do not describe cloud sync as working before then.
      **Depends on:** nothing for the local half.
      **File/region:** `tandem.html:5545`, inside `buildDayHTML`.
      **Kerwin's ruling (2026-09-30):** persist locally NOW; stage the `exercise_notes` migration for
      him to apply by hand. Two steps, do not merge them.
      **Key by exercise NAME**, the way `lastsets` does — never by slot id; see
      `scripts/lastsets-churn-smoke.mjs`, which exists because of exactly that bug.
      **ACCEPTED CONFLICT, recorded deliberately:** `:5545` is inside `buildDayHTML`, which roadmap
      Wave 7 rewrites. Whoever does Wave 7 must re-add three hooks. That cost was accepted over
      discarding user notes for the months Waves 0-5 will take.
      **should/could/did stub:** SHOULD — a text field the app presents must persist what is typed
      into it. COULD — remove the textarea (rejected: Kerwin wants the feature); do the cloud half
      first (rejected: blocked on a human-applied migration, and the data loss is live now).
      DID / RECONCILE — fill on completion.

- [ ] **3. Council forks — BUG-191, BUG-197, BUG-202.** Run `llm-council`, record verdict +
      citation here and on the row, THEN implement. Do not pick.
      **BUG-191** (`reorderWeek` lies): honour `tandem_day_order` in `nextProgramDayKey()`, or delete
      the button and toast? The comment above `:8931` records a deliberate BUG-93 ruling that the app
      must not skip past work — which is *why* day selection is completion-count based. Option (a)
      may reopen it.
      **BUG-197** (theme colour): which of `users.theme_color` / `users.color_theme` /
      `profile.colorTheme` owns the rule. Note `competition_leaderboard` excludes `theme_color` as
      "broken in the view" (`:9231`), and onboarding writes a fourth key that reaches nothing.
      **BUG-202** (`week_targets`): wire into the prescription path, or retire the column AND
      `calibration-upsert-smoke.mjs:119`/`:126` together — never one without the other, or `verify`
      breaks. **Advisory only:** `personal_records` is plausibly `safety.forbidden`; confirm with
      Kerwin.

- [ ] **4. Research-gated — BUG-199, BUG-198, BUG-201.** `exercise-science-research` FIRST, before
      any code. All three are program-generation changes.
      **BUG-199 first** — it is the highest-value of the three: `INJURY_RULES` covers 6 keyword
      families while the UI promises "your coach will avoid…". That is a safety promise the engine
      cannot currently keep. Consider whether an unmatched injury string should fail LOUD rather
      than silently no-op.
      **BUG-198** — if the sources are silent after a real search (canonical sources AND live
      web research; verify tool availability by trying, per SC-03), REMOVE the onboarding questions
      rather than invent a coefficient. Either way `:4666` must stop gating onboarding on a value
      nothing reads.
      **BUG-201** — one shared opts builder for the generated and authored paths.

- [ ] **5. Housekeeping — BUG-203, BUG-204, BUG-205.** Lowest value, do last.
      BUG-205's code half (3 orphan declarations + the false comment at `:6562`) is safe and small;
      its column half is a proposal for Kerwin, not a migration to run. BUG-204 changes program
      output, so expect `program-snapshot` to fire — do not silently re-baseline it.

- [ ] **6. HELD, do not start — inline-handler / CSP refactor.** 223 `onclick`, 0
      `addEventListener`, handlers re-serialised with manual quote-escaping (`:5525`, `:6193`).
      Genuinely belongs behind roadmap Waves 6/7/8. Left unchecked on purpose.

## Progress log

- **2026-09-30 — Epic opened; audit and metadata reconciliation shipped.**
  - `db2c3c0` — corrected the record: CLAUDE.md's Prime-Directive example cited `REST_SECONDS`,
    which D23 deleted and which is now honored end-to-end via `authoredRest`; replaced with three
    verified-live examples (BUG-191, BUG-202, BUG-195). Added SC-34. Annotated
    `docs/epic-40-dead-handler-audit.md` as write-side-only and retracted its "Color Takeover is
    fully wired" claim. Retracted `docs/ui-gap-audit-2026-09-23.md`'s "QA badge visible to all
    users" claim in 3 places — verified false: owner-only in the client (3 gates) AND enforced by
    RLS in Postgres.
  - `6f339fd` — **fixed** the QA-feed badge, which counted already-filed bug reports and could
    never drain. Verified against production: badge 21 → 3 (18 rows sat at `logged_to_notion`,
    already tracked in Notion; 0 were actionable). New gate
    `scripts/qa-feed-status-smoke.mjs`, `verify` 28 → 29. Teeth proved per SC-10 by regressing one
    call site and confirming the gate failed, naming the offender.
  - Notion: EPIC-39's gate cited unmerged branch `claude/epic033-source-of-truth`, which does not
    exist on origin. Verified against git + live Postgres — Step 5 merged (`bf438b3`), Step 6's RLS
    pass DONE (all 24 public tables `relrowsecurity=true`; the 3 wedding tables deny-all), Group C
    drops DONE (`to_regclass` NULL for `exercise_notes` and all 3 views). Only Group A remains and
    it is Kerwin-only. **EPIC-39 should no longer be treated as the Wave 0 blocker** — that stale
    gate is why "start at Wave 0" kept producing no work.
  - Filed BUG-191…BUG-205 against this Epic, batched (15 rows, not 40) to match
    `safety.max_items_per_cycle: 5`.
  - **Still owed to Kerwin, filed against EPIC-7 not here:** the QA panel's "take me there"
    deep-link into the affected area, and a Notion → Postgres sync so resolving in Notion clears
    the app-side row. Both need an Edge Function or a TPM step; the browser holds no Notion token.

- **2026-09-30 (cont.) — five wires shipped, all gated, none browser-verified.**
  - `b961641` **BUG-193** one `cfgFromUserRow` builder shared by `restoreFromCloud` and
    `syncFromCloud`. **The audit undercounted:** §D3 said 4 fields were dropped on restore; diffing
    the two literals showed **12** (syncFromCloud built 22, restoreFromCloud 9) — including
    `injuries`, a SAFETY invariant, plus `weeks`, `equipment`, `emphasis`, `duration`, `startDate`
    and EPIC-9's `onboardingEstimates`. Gate: `cfg-builder-smoke.mjs`.
  - `b961641` **BUG-196** `resetWeek()` moves and persists the pointer. The obvious helper
    (`currentWeekFromStorage()`) is WRONG here — `changeWeek()` persists the *browsed* week, so its
    `Math.max(stored, derived)` returns the week you are trying to leave. That trap is encoded as
    its own check so a future "simplification" cannot silently restore the no-op.
    Gate: `week-pointer-smoke.mjs`.
  - `ebd1917` **BUG-192** DB cap persists on the tier's durable path. Cloud half still owed —
    there is no `users.max_db` column and adding one is a migration.
    **BUG-194** all three `saveProfileStats` breaks. Gate: `settings-persistence-smoke.mjs`.
  - `2a89cb5` **BUG-200** keydown on the competition card. **Half of D13 RETRACTED:** the one-off
    cards' `aria-pressed`/`data-oneoff` ARE wired (`:8115`, `:8258`, `:8308`) — the sweep missed it
    because the reads go through `dataset.oneoffGoal`, the camelCase form of `data-oneoff-goal`,
    which no search for the literal attribute name finds. Row narrowed; its prompt now says
    explicitly not to touch them. Gate: `a11y-keyboard-smoke.mjs`.
  - `37ef1c5` **BUG-195** local notes persistence + staged migration `0022`.
    Gate: `ex-notes-smoke.mjs`.
  - **Two self-corrections earned:** SC-35 (four static checks written today each matched the
    comments explaining what they check for — one failed *silently*, in the safe direction) and
    SC-36 (I published a delegated sweep's "X is never read" negatives without verifying them; two
    were wrong — this wave's D13 retraction, and `estimated_1rm_lbs`/`total_volume_lbs`, which
    triggers read).
  - **Wave 0 unblocked, for real:** EPIC-39's gate cited a deleted branch. Verified against git +
    both live Supabase projects: Step 5 merged (`bf438b3`), Step 6's RLS pass DONE (24/24 tables),
    Group C drops DONE. Group A (the wedding tables) needs no decision — Kerwin already ruled
    2026-09-07 and `migrations/0013` is written with uncommented drops; it was simply never applied.
    Re-verified: all three tables 0 rows, deny-all RLS, zero refs in the codebase, **zero refs in
    any of the six wedding skills** (they use Drive/Gmail/Calendar, not Postgres), and the real 130
    guest rows live in a separate project (`xrgzaovididcizstwswy`). Kerwin applies `0013`.

- **2026-09-30 (final) — council gate cleared; merged to main.**
  - `llm-council` ran as `escalation.pre_ship_council_gate` requires. Verdict at the time of asking:
    **DO NOT MERGE** — and it was right. The Contrarian found that BUG-192 and BUG-193 cancelled
    out: `cfgFromUserRow()` returns a complete replacement cfg without `maxDb`, and
    `syncFromCloud()` runs on app boot for any signed-in user, so the dumbbell cap was erased on
    essentially every load and prescriptions went UNCAPPED. All 36 checks were green over it.
    Verified in code, fixed in `89ae5a2`, mechanism-gated, recorded as **SC-37**.
    Artifacts: `council-report-2026-09-30-epic63-preship.html` / `-transcript-…md`.
  - Browser gate built and wired in `38d41b3`: `scripts/control-reachability-walkthrough.mjs`,
    `npm run walkthrough:controls`, in `verify` (37). Six assertions, each mutation-tested.
    The Executor's verified point on why this was missing: `verify` wired exactly ONE Playwright
    check before it, and the two existing walkthroughs were never wired — which is why they rotted.
  - **Two DOM assertions were DELETED as non-evidence**, not left green: "no rendered dumbbell load
    exceeds the cap" passed with the fix removed. First because the fixture seeded a button tier
    name (`hotel_small`) where cfg takes the cfg vocabulary (`home_dumbbells`) so nothing dumbbell
    rendered; then, fixture corrected, because natural week-1 seeds already sit under the cap.
    Forcing it to bind required a 200 lb working 1RM, which moves the render onto the calibrated
    branch that `dbCap` never governed. Full account in that script's header.
  - **New finding filed, not fixed:** an EARNED dumbbell 1RM is not clamped by the gym cap
    (`dbCap` is consumed only in `seedWeight`, `programs.js:232`), so a traveller is prescribed
    weight the gym lacks. Needs an exercise-science ruling; filed against this Epic.
  - Merge resolved two real conflicts with main (BUG-190's `hydrateHistoryFromCloud` added at the
    same point as `cfgFromUserRow` — kept both; and an SC-33 numbering collision — main's number
    stands, mine renumbered to SC-34..37 with every cross-reference swept).

## Still owed on this Epic — nothing above claims these are done

1. **Real-Supabase run for BUG-193's restore.** The walkthrough stubs Supabase, so it cannot prove
   the live `users` row shape. Use the `+test@gmail.com` accounts per `default_not_fallback`.
2. **BUG-195 cloud round-trip** — table exists, client does not use it.
3. **BUG-192 cross-device** — needs a `users.max_db` column; on-device only today.
4. Steps 3-5 below (council forks, research-gated rows, housekeeping) are untouched.
5. Step 6 stays HELD.
