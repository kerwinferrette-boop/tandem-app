---
name: exercise-science-research
description: MANDATORY source-first protocol for ANY exercise-science or program-logic decision in Tandem — reps, rest, volume (MEV/MAV/MRV), periodization, deloads, splits, supersets/circuits, exercise selection, muscle-group tagging, load coefficients, sex/skill adjustments, goal definitions. Forces consulting the canonical research BEFORE reasoning, runs the should/could/did audit, forbids answering from memory/plausibility, and promotes hard rules to executable doctrine invariants. Trigger on any change to programs.js/tandem.html program logic, any "is this right per the science" question, any new exercise/goal/coefficient, or any bug about wrong programming behavior. Use it BEFORE writing code, not after Kerwin catches the error.
---

# exercise-science-research

This skill exists because the project's recurring failure has ONE shape: **reasoning from what
sounds standard instead of checking the source.** (Examples caught the hard way: exercises re-rolled
weekly while passing every gate; supersets scoped only to Transform when Fat Burn is *defined* as
circuits.) Its job is to make source-first rigor + a written audit unavoidable, every time.

**Golden rule: you may not state an exercise-science fact, or ship a program-logic change, from
memory. Cite the source or flag it unverified. "Typically / standard / usually" is a red flag —
stop and go read.**

## Step 1 — Identify the governing source(s)

Program logic is governed by these, in priority order. Open the relevant one(s) FIRST:
1. **`/DOCTRINE.md`** — the binding invariants already made executable (D1…). If your change touches
   one, it must still pass `scripts/doctrine.mjs`.
2. **Notion (source of truth)** — fetch the specific doc:
   - **5-Goal Taxonomy** — the ONLY valid goals + each goal's signature (rep range, rest, superset
     behavior). *This is what supersets-in-Transform-only got wrong: read the WHOLE goal row.*
   - **Programming Architecture Reference** — skill-level exercise library, men-vs-women structure.
   - **Exercise Science Schema v0.5** — MEV/MAV/MRV per goal, deload cadence, splits, load
     coefficients, the weight formula.
   - **Periodization & Structured Program Engine spec** — mesocycle sizing 4-12 wk, block themes.
3. **Repo research (primary literature synthesis)** — extract text and quote it:
   - `research-report (8).pdf` (Valyu synthesis — rep ranges, RPE/RIR, volume landmarks, ordering,
     sex differences, skill progressions, biometric adaptation). Extract with:
     `python3 -c "import fitz;d=fitz.open('research-report (8).pdf');print('\n'.join(p.get_text() for p in d))"`
     (install once: `pip install --quiet pymupdf`).
   - `Exercise Science Framework…docx` (unzip `word/document.xml`) and `…csv` (HRV/recovery table).
4. **External corroboration** — when the repo/Notion sources are thin, WebSearch REPUTABLE sources
   (Renaissance Periodization, NSCA, Schoenfeld/Baz-Valle meta-analyses, ACSM position stands) and
   cite the URL. Do NOT treat a random blog as authority.

If, after Steps 1-3, the source does not answer the question: **STOP. Flag the gap to Kerwin
explicitly** ("the research doesn't specify X; options are A/B; I recommend A but this needs a
source before we lock it"). He can pull more research. Never fabricate a number or rule.

## Step 2 — The should / could / did audit (write it down)

- **SHOULD** — what the source says, with the citation (doc name + section, or file + page, or URL).
- **COULD** — alternatives considered and why rejected. Name the trap you might have fallen into.
- **DID** — what the code now does, established by **running it** (extract generated output; do not
  infer from reading). E.g. `node -e "…load programs.js…; print blocks of getProgram(...)"`.
- **RECONCILE** — `did === should`? If yes, ship with the citation. If no, fix the code. If the
  doctrine itself is wrong, change Notion → `/DOCTRINE.md` → `scripts/doctrine.mjs` together.

Put the audit in the commit body AND the Notion Epic/Bug entry.

## Step 3 — Make the rule permanent (promote to doctrine)

If the SHOULD is a hard rule (not a soft preference), it must become an executable invariant so it
can never silently regress:
- Add/extend an assertion in `scripts/doctrine.mjs` (ACTIVE) and a row in `/DOCTRINE.md`.
- If a PENDING invariant (D4-D8) is what your change makes true, PROMOTE it in the same change.
- Never weaken the gate to pass. The gate is the memory that survives across sessions.

## Step 4 — Verify, the right way

- `npm run verify` (6 checks incl. doctrine) AND `npm run validate:personas`. Both green or no ship.
- Remember: **the persona matrix / validate:programs check LEGALITY, not doctrine.** Green there
  does NOT mean scientifically correct. The doctrine gate is the science check.
- Prove behavior by running the engine and inspecting output — never "node --check passed, so it's
  correct."

## The anti-shortcut checklist (self-audit before every program-logic commit)
- [ ] Did I open the actual source, or did I answer from memory? (If memory → go read.)
- [ ] Did I read the WHOLE relevant unit (e.g. the full goal row), not just the label?
- [ ] Is there a citation in my commit/Notion entry for the SHOULD?
- [ ] Did I run the engine and check the DID against the SHOULD?
- [ ] Is the hard rule now enforced by the doctrine gate?
- [ ] If the source was silent, did I FLAG the gap instead of inventing?
