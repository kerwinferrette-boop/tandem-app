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

## Step status

- [ ] **1. Onboarding Step 4 restructure — equipment removal + 4 new preference questions**
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
- **Confirm Wave 7's status before starting Slice 1** — this file did not re-verify it.
- **Slice 1a stays Needs Human, full stop** — same rule as EPIC-8's Slice 2a, same source
  (`.claude/loop-config.md`, 2026-08-30 biometric/1RM forbidden-ops list).
- **One rule, one home** — if EPIC-8b's duration plumbing lands first, Slice 1's Session Length
  field must read/write the same `cfg` key 8b uses, not a parallel one.
- **should/could/did audit required** in the commit body + Notion entry for Slice 1 when built.

## Progress log

- **2026-09-07/08 (Kerwin-ruling session, Group 4):** File created. Audited the Epic's own Agent
  Context Notes and found two separable pieces of scope where the tracker row saw one blocked
  whole — split into Slice 1 (buildable, Kerwin already confirmed the product direction twice) and
  Slice 1a (Needs Human carve-out, feeds the Epley calibration formula). Tracker row synced Needs
  Human → Untested with Evidence pointing here (see Notion). Neither slice built this session.
