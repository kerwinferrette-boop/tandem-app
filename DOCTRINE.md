# Tandem Programming Doctrine — the law every code change obeys

**Notion is the source of truth. This file is its executable mirror. `scripts/doctrine.mjs`
enforces it in `npm run verify`. All three stay in sync — `tandem-tpm` reconciles them.**

This exists because the app once drifted into re-rolling exercises weekly (incoherent, un-trackable)
while passing every structural gate — because nothing tested *doctrine*, only *legality*. That can no
longer happen: a change that violates the ACTIVE invariants below cannot ship.

## Source-of-truth Notion docs (authoritative — read before touching the program engine)
- **5-Goal Taxonomy** — the only valid goals + each goal's signature · `399ca37f935b81f193b4dd0d13775888`
- **Programming Architecture Reference** — skill-level exercise library, men-vs-women structure · `37aca37f935b811b90c7c880631c66a8`
- **Exercise Science Schema v0.5** — MEV/MAV/MRV, deload cadence, splits, superset schema, formula · `37bca37f935b81cb9478e4906ada58c9`
- **Competitive Strategy** — the brand/moat this all serves · `37aca37f935b814da680d8af798d51a0`
- **Periodization & Structured Program Engine spec** — this session's approved spec (Parts A–H)

## The binding invariants (mirrored into `scripts/doctrine.mjs`)

| ID | Invariant | Status | Source |
|----|-----------|--------|--------|
| **D1** | Exercise selection is stable **within a mesocycle block** and refreshes only at block boundaries — never re-rolled weekly. | ✅ ACTIVE | Spec Part A; variation research |
| **D2** | Only the canonical goals exist; each live goal generates a legal, non-empty program. | ✅ ACTIVE | 5-Goal Taxonomy |
| **D3** | Compound (multi-joint) work precedes isolation within every training day. | ✅ ACTIVE | ACSM progression models [8] |
| **D4** | A deload appears every 4–6 weeks, as the block-final week, at reduced volume. | ⏳ Phase 2/5 | Spec Part B; v0.5 deload table |
| **D5** | Transform is superset-driven; supersets appear where the taxonomy requires. | ⏳ Phase 3 | 5-Goal Taxonomy; v0.5 |
| **D6** | Weekly working-set volume per muscle stays within the goal's MEV..MRV band. | ⏳ later | v0.5 volume table |
| **D7** | Per-length mesocycle layout (4–12 wk) matches the spec Part B table. | ⏳ Phase 5 | Spec Part B |
| **D8** | Strength uses zero supersets on primary lifts; Maintenance caps at MAV. | ⏳ when added | 5-Goal Taxonomy |
| **D9** | One-off "Build Me a Workout" is compound-first, tier-legal, dup-free — but EXEMPT by design from D1/D4/D7 (a single session is *allowed* to vary; that's its purpose). | ✅ ACTIVE | Home-Screen Program Builders |

PENDING invariants are law already — they're documented in the gate and become blocking the moment the
phase that makes them true ships. **Never weaken the gate to make a change pass. Never delete a PENDING.**
If the doctrine itself changes, change it in Notion first, then mirror here and in `doctrine.mjs` together.

## The rule for every Epic / Bug / QA entry
Every program-touching change must (a) name the governing Notion doc above, (b) state how it conforms to
the relevant D-invariant(s), and (c) pass `npm run verify` (which now includes the doctrine gate). A change
that re-rolls lifts weekly, drops a required deload/superset, or invents a non-canonical goal is **wrong by
definition** — not a judgment call.
