# EPIC-18 — Wave decomposition (LIVE)

**Created:** 2026-09-07/08 (Kerwin-ruling session, Group 4). Source: `elegant-spinning-perlis`
plan, per Kerwin's delegated instruction on EPIC-16/18/22: *"Feel like this is something you can
figure out without me. Build this into a wave and let's get this going."* Same posture as
`EPIC-8-WAVE-STATE.md` Slice 2/2a: the delegation covers the decomposition, not the standing
forbidden-ops rule — anything touching the biometric/1RM layer stays carved out, Needs Human.

**Source Epic (Notion):** EPIC-18 · "Onboarding Step 4 Restructure...", Status: Scoped.
Dependency Gate (verbatim): *"WAVE 8, step 1 - opens the onboarding batch. Blocked on Wave 7
(shares tandem.html render surface). EPIC-19 is gated on this."*
**Linked tracker row:** `EPIC-18-onboarding-step4-restructure`, Status=Needs Human.

---

## Key finding — this Epic is two different pieces of scope wearing one name

Read the Epic's Agent Context Notes directly (Kerwin's product decision, 2026-06-11, CONFIRMED
2026-06-18) rather than trusting the tracker row's blanket "Needs Human" framing. It contains two
genuinely different asks:

1. **Onboarding restructure proper** — remove the equipment question from onboarding entirely
   (the per-workout tier selector already handles equipment, so asking again at onboarding is
   redundant) and replace Step 4 with four new preference questions: Session Length, Preferred
   Workout Time, Injury Limitations, Secondary Goal. **This half is a UI/onboarding-flow change
   only** — new form fields, no program-engine math. Kerwin already confirmed this product
   direction twice (2026-06-11, 2026-06-18); there is no open question left to ask about it.

2. **Strength-target intake** — new fields (bench 3×15, squat 5×5) that the Notes say explicitly
   "feed Sprint 2's formula layer (Epley 1RM calibration)." This is new input **into** the
   biometric/1RM calculation layer — exactly the territory `.claude/loop-config.md`'s 2026-08-30
   forbidden-ops rule names by name, Kerwin-only regardless of council verdict, independent of
   whether the layer it's feeding (EPIC-9, Baseline Calibration) has since shipped.

The Epic's own text does not say these two pieces have to ship together. Splitting them is the
same move as `EPIC-8-WAVE-STATE.md`'s Slice 2/2a: build what's clearly clear, carve out what
isn't.

**The Dependency Gate's "Blocked on Wave 7 (shares tandem.html render surface)" is a real,
still-open precondition** — not audited further this session (no Wave-7 tracker row was in scope
here); Fix must confirm Wave 7's status before starting Slice 1 below.

---

## 2026-09-14 audit — Slice 1 is HALF ALREADY SHIPPED, and its other half's blocker is now CLEARED

Corrected while auditing `claude/epic036-ruling-stale-base` for deltas missing from origin/main
(SC-09, `docs/self-corrections.md`). Read the live code instead of trusting this file's own step
description, per the standing audit-before-ask rule. Two findings:

### Finding 1 — all four new preference questions already exist and round-trip end-to-end

This file described Slice 1 as unbuilt. It is not. Confirmed live in current `tandem.html`: Session
Length (~1148-1169, `selectDuration`), Preferred Workout Time (~1171-1188, `selectWorkoutTime`),
Injuries or Limitations (~1190-1199, `#ob-injuries`), and Secondary Goal (~1201-1222,
`selectSecondaryGoal`) are all present and wired into onboarding.

### Finding 2 — the equipment-removal half rested on a false premise; that premise's underlying bug is now FIXED

The Epic's reasoning was that the per-workout tier selector "already handles equipment, so asking
again at onboarding is redundant." That was false as implemented: the bank's `home` tier was only
reachable via `cfg.equipment === 'bodyweight'` (the onboarding question itself), and the 5-button
selector had no path to `home` — a bodyweight-only user who touched any selector button would be
silently and permanently upgraded to `hotel_gym`. This was filed as its own Bug & QA Log entry
(page `3d5ca37f-935b-811c-a5dc-df8f7c116e3c`, P1 Wrong Data) rather than fixed opportunistically.

**That bug is now fixed** — shipped as BUG-107 (commit `4943094`, 2026-09-13): a 6th selector button
(`data-tier="bodyweight"`) was added, reusing the same key `CFG_EQ_TO_BANK` already used, so the
selector can now express `home` directly. Confirmed live (`tandem.html` selector row now has 6
buttons including "Bodyweight Only").

**This clears Slice 1b's blocker but does not itself decide Slice 1b.** Whether to actually delete
the onboarding equipment question (now that the selector doesn't need it as a proxy for `home`) is
still the open product question the Epic's Agent Context Notes name — not resolved by this docs
correction, and not this session's call to make. Flagging that the blocker is gone, not that the
decision is made.

**Superseded same day.** The above framed equipment removal as a still-open product decision. It
was not — the removal shipped later the same day (2026-09-14, commit `d7b9a32`): the Equipment
Access question was actually deleted and `applySetupSelection()` made the durable single source of
`cfg.equipment`. This section is kept for provenance (it accurately describes the state at the
moment it was written) but is not current — see Step status below for what actually shipped.

---

## Step status

- [x] **1. Onboarding Step 4 restructure — equipment removal + 4 new preference questions**
      **SHIPPED 2026-09-14, commit `d7b9a32` (main + claude/lucid-volta-xwwrbb).** Scope actually
      built: removed the Equipment Access question from Step 4 and made the per-workout tier
      selector (`applySetupSelection()`) the single durable source of `cfg.equipment` via a new
      `EQ_TIER_TO_CFG` table. The 4 new preference fields this step originally called for
      (Session Length, Preferred Workout Time, Injury Limitations, Secondary Goal) were found
      **already present** on Step 3/"Training Preferences" going into this session — only
      Preferred Workout Time remained the gated `obCanAdvance()` field once equipment was pulled
      out; Session Length/Injuries/Secondary Goal were already optional fields on that step. So
      this slice's real remaining work was narrower than originally scoped: equipment removal +
      durability, not net-new field additions.
      Verified end-to-end in a real headless-Chromium run (not just the stubbed walkthrough):
      onboarding completes with no equipment question; selecting Bodyweight Only + Apply changes
      the rendered workout to bodyweight/band exercises; the choice survives a simulated fresh
      session (both the setup-card label and the actual generated exercises stayed correct).
      Verification caught two real bugs the first-pass implementation missed — `applySetupSelection()`
      was setting `cfg.equipment` in memory and calling `syncToCloud()` but never
      `LS.set('tandem_cfg', cfg)` (every other cfg-mutation site does), and the setup card's own
      display-sync-on-load code read `sessionStorage.eq_tier` only instead of mirroring
      `resolveEquipmentTier()`'s session→cfg→default priority — both fixed in the same commit.
      Gates: `npm run verify` 12/12, `npm run validate:personas` 630/630,
      `npm run walkthrough:onboarding` 0 real findings. Notion EPIC-18 row and BUG-107
      cross-reference updated same session.
      ~~Original text below, kept for the record:~~
      **Depends on:** Wave 7 landing first (Dependency Gate — shared render surface, not
      re-verified this session, confirm before starting).
      **File/region:** onboarding flow in `tandem.html` (Step 4 render + `cfg` write-back). Remove
      the equipment question; add Session Length, Preferred Workout Time, Injury Limitations,
      Secondary Goal as new onboarding fields, written to existing/new `cfg` keys.
      **No biometric-layer contact** — none of these four fields feed `getRecommendation`/
      `getWeekTarget`/the 1RM layer. Session Length is the same input EPIC-8b (Slice 1,
      `EPIC-8-WAVE-STATE.md`) threads into duration branching — if 8b ships first, this slice
      should write into the same field 8b reads, not a second one (one rule, one home).
      **Independent verification:** confirm equipment question no longer renders at onboarding;
      confirm the per-workout tier selector is unaffected (it's the thing that already owns
      equipment, per the Epic's own reasoning); confirm all 4 new fields round-trip into `cfg`
      and persist to `users` the same way existing onboarding fields do.
      **should/could/did stub:** SHOULD — no exercise-science claim; this is a UI/data-collection
      change, Kerwin-pre-confirmed on product direction (2026-06-11, 2026-06-18) — the "should" is
      the product decision itself, already made, cited above. COULD — n/a. DID / RECONCILE —
      blank, for Fix/Verify.

- [ ] **1a. NEEDS HUMAN — strength-target intake (bench 3×15 / squat 5×5) feeding Epley calibration**
      **Not decomposed. Do not implement without Kerwin.** This is new input into the biometric/
      1RM calculation layer per the Epic's own Agent Context Notes ("feeds Sprint 2's formula
      layer (Epley 1RM calibration)") — squarely inside `.claude/loop-config.md`'s 2026-08-30
      forbidden-ops rule, Kerwin-only regardless of council verdict, same reasoning as
      `EPIC-8-WAVE-STATE.md` Slice 2a and independent of EPIC-9's Shipped status (a layer being
      shipped means the code exists and works today, not that new inputs into it are pre-approved).
      Also note: **EPIC-22** (aspirational 1RM targets) shares this exact same formula layer and
      is separately still blocked on its own open prerequisite bugs — see
      `EPIC-22-WAVE-STATE.md`. Whoever picks this carve-out up should coordinate with that file
      rather than building the intake fields twice.

---

## Invariants for whoever resumes

- **Ship gates, both green, every code slice:** `npm run verify` AND `npm run validate:personas`.
- **Slice 1b's technical blocker is cleared (BUG-107, `4943094`) but the removal decision itself
  is still open** — do not delete the onboarding equipment question without a product ruling.
- **Slice 1a stays Needs Human, full stop** — same rule as EPIC-8's Slice 2a, same source
  (`.claude/loop-config.md`, 2026-08-30 biometric/1RM forbidden-ops list).
- **One rule, one home** — if EPIC-8b's duration plumbing lands first, Slice 1's Session Length
  field must read/write the same `cfg` key 8b uses, not a parallel one.
- **should/could/did audit required** in the commit body + Notion entry for Slice 1b if/when built.

## Progress log

- **2026-09-07/08 (Kerwin-ruling session, Group 4):** File created. Audited the Epic's own Agent
  Context Notes and found two separable pieces of scope where the tracker row saw one blocked
  whole — split into Slice 1 (buildable, Kerwin already confirmed the product direction twice) and
  Slice 1a (Needs Human carve-out, feeds the Epley calibration formula). Tracker row synced Needs
  Human → Untested with Evidence pointing here (see Notion). Neither slice built this session.
- **2026-09-14 (earlier pass, dirty-tree reconciliation session):** Corrected two stale claims
  found via a branch audit (`claude/epic036-ruling-stale-base`), neither requiring new code at the
  time: (1) Slice 1's four preference fields are already fully shipped, confirmed live in
  `tandem.html` — this file wrongly still called it unbuilt. Marked `[x]`, split equipment-removal
  out as its own Slice 1b. (2) The equipment-removal proposal's stated justification was false as
  implemented (the selector couldn't express the `home` bank tier) — but that specific bug (P1,
  `3d5ca37f-935b-811c-a5dc-df8f7c116e3c`) has since been fixed independently as BUG-107
  (`4943094`, 2026-09-13, confirmed live: a 6th "Bodyweight Only" selector button now exists).
  Slice 1b's technical blocker was cleared, but removing the onboarding question was framed here
  as an open product decision — that framing did not survive the same day (see next entry).

- **2026-09-14 (later pass):** Slice 1 SHIPPED — see step 1 above for full detail. This
  retroactively closes the "1b, decision still open" framing directly above: the removal happened
  the same day, commit `d7b9a32`. Slice 1a remains untouched, Needs Human, per the standing
  forbidden-ops rule (unaffected by Slice 1 shipping). This file was NOT updated at the moment the
  commit landed, only afterward when Kerwin asked whether a future session would pick up where
  this one left off — that question is what caught the gap between "shipped and pushed" and "this
  checkpoint file actually says so." Flagging so it doesn't repeat: the checkbox flip belongs in
  the SAME turn as the push, not a follow-up correction (see `docs/self-corrections.md` SC-09).
