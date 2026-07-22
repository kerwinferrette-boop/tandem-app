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
- **No shortcuts.** If you're about to say "this is standard" or "typically," stop and cite the
  source instead. If you can't cite it, flag it as unverified.

## Standing test gate (run before every commit that touches the engine)
`npm run verify` (6 checks incl. doctrine) · `npm run validate:personas` (Rules 6-9). Both green,
or it does not ship. See `.claude/loop-config.md` for the full standing sweep and doctrine-is-law
directive.
