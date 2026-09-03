# Tandem — Engineering Prime Directives (read first, every session)

Tandem is a couples fitness-competition app (Kerwin & Dani). Its moat is a **cohesive,
science-backed, periodized program that a biometric layer adapts** — not static, not random.
Single-file app: `tandem.html` + `programs.js`, Supabase backend, ships to Netlify on push.

## THE PRIME DIRECTIVE: source-first, never plausibility-first

Every recurring error in this project has one shape: **reasoning from what sounds right in the
domain instead of checking the source.** Do not do this. For ANY exercise-science or
program-logic decision:

1. **Consult the canonical source BEFORE reasoning or writing code.** Never answer from memory
   or "what's standard." The sources are law:
   - `/DOCTRINE.md` — the binding, executable invariants (enforced by `scripts/doctrine.mjs`).
   - Notion (source of truth): **5-Goal Taxonomy**, **Programming Architecture Reference**,
     **Exercise Science Schema v0.5**, **Competitive Strategy**, the **Periodization spec**.
   - Repo research: `research-report (8).pdf`, `Exercise Science Framework…docx/.csv`.
2. **Run the should/could/did audit** (below) and only ship when *did == should*, with a citation.
3. **When the source is silent or ambiguous, SAY SO and flag it** — never invent a number,
   coefficient, or rule to fill the gap. Kerwin can pull more research. A flagged gap is correct;
   a confident fabrication is the failure mode we are eliminating.
4. **Invoke the `exercise-science-research` skill** for any program-engine change. It is not
   optional and does not relax when no one is watching.
5. **When you are confused, stuck, or about to guess — escalate to a skill, do not escalate to
   Kerwin and do not quietly pick.** Kerwin's job is to set direction and flag where the product
   is wrong; it is not to arbitrate implementation questions that a source could answer. Two
   escalation paths, and one of them is almost always right:
   - **`exercise-science-research`** — for anything the body does: rest intervals, load
     prescription, rep bands, volume, frequency, progression, starting loads. Use it *first*,
     before writing code and before asking a question.
   - **`llm-council`** — for a genuine judgment call the science does not decide: which of two
     conflicting internal sources should own a rule, whether a doctrine invariant should be
     amended, an architecture fork with no clear winner. Its output is a citable artifact
     (`council-*-<date>-<topic>.*`), which is how D16's 2026-08-15 scope ruling was made.

   "The sources conflict" is not a reason to ask — it is a reason to run the council and come
   back with a recommendation. Only escalate to Kerwin when the decision is genuinely his:
   product direction, priority, or a value judgment about what the app should feel like.

## The should / could / did audit (required artifact for program-logic changes)

Before committing any change to the program engine, write these four, briefly:
- **SHOULD** — what the research/doctrine says the correct behavior is (with the citation).
- **COULD** — the alternatives considered and why they're rejected (e.g., "supersets on all
  goals" — rejected: never on primary lifts).
- **DID** — what the code actually now does (verified by running it, not by reading it).
- **RECONCILE** — did == should? If not, it does not ship. If the doctrine itself is wrong,
  change Notion first, then `/DOCTRINE.md` and `scripts/doctrine.mjs` together.

Put this in the commit body and the Notion Epic/Bug entry. It is the audit Kerwin keeps asking
for — run it *before* shipping, not after he catches it.

## Non-negotiables

- **The doctrine gate is law.** `npm run verify` includes `scripts/doctrine.mjs`; CI runs it on
  every PR. A change that violates an ACTIVE D-invariant CANNOT ship — it is wrong by definition.
  Never weaken the gate to pass; promote a PENDING invariant to ACTIVE in the SAME change that
  makes it true.
- **The persona matrix and validate:programs check LEGALITY, not doctrine.** Passing them proves
  the program won't crash, NOT that it's scientifically correct. Always run the doctrine gate too.
- **Verify by running, not by reading.** Syntactically valid ≠ behaviorally correct. Extract the
  actual generated output and check it against the research.
- **"Wired" is not "working." Verify at the surface the USER sees, not the layer you edited.**
  A value the engine computes correctly and the render layer then discards has shipped nothing —
  and a green gate asserting that dead value is worse than no gate, because it manufactures
  confidence. This is not hypothetical: EPIC-8a's per-experience `REST_SECONDS` table has been
  computed-and-discarded since it shipped (`ex.rest` is read nowhere in `tandem.html`), and D17
  exists because a live doctrine violation sat in Postgres while `verify` reported 9/9 green.
  Trace every new value end-to-end to a pixel, or say plainly that you did not.
- **One rule, one home.** If a named table encodes a rule (`SUPERSET_CFG`, `REST_SECONDS`,
  `RECOVERY_PARAMS`, `PHASES`, `REP_BANDS`), every path reads that table. A literal that merely
  happens to match today is a silo, and silos drift. When two tables both claim the same rule,
  that is a doctrine question — run `llm-council`, do not pick.
- **No shortcuts.** If you're about to say "this is standard" or "typically," stop and cite the
  source instead. If you can't cite it, flag it as unverified.

## The self-correction protocol (added 2026-09-03, Kerwin)

**When you discover an error you made yourself, it becomes a rule before the session ends.**
Not a note, not an apology in chat — a numbered entry in `/docs/self-corrections.md` with the rule
stated imperatively and the check that enforces it named. Read that file at session start; it is
short and it is the accumulated set of mistakes you do not need to repeat.

Three conditions, all non-negotiable:

1. **Same session.** Write it while the evidence is in front of you. Batched-for-later means lost.
2. **Name the mechanism, not a trait.** "I treated a session-start read as current" is fixable;
   "I optimize for defensible completion" is unfalsifiable and lets the machinery off the hook.
3. **Say honestly whether it is enforced.** If a script can check it, wire the script and name it.
   If it is judgment, write *"judgment — not mechanically checkable"*. Never imply a guard exists.

This is the same discipline as the doctrine gate, pointed at your own reasoning: a rule nobody
checks is a suggestion. The current rules are SC-01 staleness · SC-02 retracted claims · SC-03
run-don't-simulate · SC-04 feedback is not a commit · SC-05 status docs are snapshots.

## Standing test gate (run before every commit that touches the engine)
`npm run verify` (9 checks incl. doctrine) · `npm run validate:personas` (Rules 6-9). Both green,
or it does not ship. See `.claude/loop-config.md` for the full standing sweep and doctrine-is-law
directive.
