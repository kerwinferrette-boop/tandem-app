# LLM Council — EPIC-27 Custom Template Builder: schema-fit fork

**Date:** 2026-09-06 · Cycle 72 · Convened by: Plan stage (feature-loop), unattended

**PROCESS DISCLOSURE (read first):** This environment has no Agent/subagent-spawn tool available
(confirmed this cycle — no `Task`-creation tool, no `ListAgents`, only `SendMessage` which targets
an already-live session). The council protocol calls for 5 independent parallel sub-agents plus an
anonymized peer-review round. That could not run as specified. What follows is the same 5-lens
structure and chairman synthesis, performed by one agent sequentially rather than 5 agents in
parallel with true independent peer review. Flagged honestly, same class of gap as this cycle's
BUG-56 Verify-stage disclosure — treat this as a reasoned single-author verdict with a citation
trail, not a literal multi-model council, and re-run properly if/when a real fan-out tool exists.

## The framed question

Tandem's `workout_templates` table has NOT NULL columns `duration_weeks` (integer), `parent_goal`
(text), `code_goal_mapping` (text), `difficulty` (text). `template_blocks` has NOT NULL
`week_start`/`week_end` (integer). `template_days.block_id` is a NOT NULL FK to `template_blocks`.
Verified live via Supabase MCP against project `zsvktcvqmppsshtpeljt`, 2026-09-06.

The only existing writer, `adoptTemplate()` (tandem.html:2709-2798), populates every one of these
by copying them verbatim from an existing **published** source template it clones. EPIC-27's actual
scope (Notion Epic + linked user story, both read in full) is a user building their OWN split from
scratch — no source row to copy from — where periodization is explicitly framed as a later
opt-in overlay, not the base case.

Also verified: `openProgramLibrary()` (tandem.html:2619-2648), the only reader of
`parent_goal`/`code_goal_mapping`/`difficulty` for display, filters
`.eq('is_published', true)` — so these fields are write-only/dead for any row with
`is_published=false`, which every EPIC-27 self-authored template will be.

Question: what convention satisfies the existing NOT NULL/FK constraints for a from-scratch,
non-periodized personal template, with no schema change (migrations stay human-only) and without
silently misrepresenting data?

## Five lenses

**The Contrarian:** Don't invent a fake "52-week" or any other nominal `week_end` — a NOT NULL
integer column with a made-up magic number IS a fabricated duration, full stop, indistinguishable
in the DB from a real programmed length. That's exactly the BUG-79/D18 "silent fabrication"
failure mode this project has been burned by twice already. If you can't tell the truth in an
existing column, don't write a truth-shaped lie into it — pick the option that is honest even if
it's less elegant.

**First Principles:** What is a "custom template" actually FOR? Per the Epic text itself, it's
Dani logging her own known split, indefinitely, on her own terms — there is no natural "week 12 it
ends" moment for that use case at all. The schema's week-bounded shape is inherited from EPIC-031's
library-program concept (a *finite, structured, periodized* thing you browse and adopt), which is
a fundamentally different object from "my ongoing personal log." Forcing the personal-log object
through the periodized-program schema is the actual root tension — pick the smallest, most honest
approximation, don't over-engineer a "renewal" feature nobody asked for yet.

**The Expansionist:** A real bounded duration (Option B) isn't just a workaround — it's a hook.
Every published-library program already advances via `currentWeek`/`tandem_week` and the tracker
UI. If a self-authored template gets a real `duration_weeks`, the *existing* week-advance,
block-final "realization week," and even a later opt-in periodization overlay all attach for free,
with zero new plumbing. Picking a real, bounded number now is what makes the "opt-in periodization
hook" the Epic explicitly wants *actually* opt-in later, instead of a second schema fork.

**The Outsider:** Reading only the schema and the Epic text with no history here: a NOT NULL
integer column named `duration_weeks` obviously means "how many weeks is this program," and a
non-technical user was never going to be asked "pick a nominal placeholder like 52 to mean
forever" — that's an engineer's workaround leaking into user-facing semantics nobody chose. If the
product doesn't want to ask the user for a duration, that's a UI-copy problem to solve (e.g.
default silently to a real number, never surface it as a decision), not a data-modeling license to
write a fake one.

**The Executor:** Ship Monday-morning-simple: `duration_weeks = 12`, one `template_blocks` row
`week_start=1, week_end=12`, empty `rep_scheme_by_week`/`technique_by_week` (already the column
default, so "no periodization" costs nothing), `parent_goal = code_goal_mapping = 'custom'`,
`difficulty = 'custom'`. All five values are real, all five are inert (the row is
`is_published=false`, so no browse/library UI ever reads them), and D15 already gives you a
citable 12-week number for free instead of inventing one. Ship that; punt "what happens at week
13" to its own later slice (renew, extend, or just let the user open the builder again) — don't
block the whole Wave on a feature nobody has asked for yet.

## Where the lenses agree

All five converge on: **do not use a nominal/placeholder duration that pretends to be real data**
(the Contrarian's and Outsider's objection to "week_end=52 standing in for forever"). All five also
converge on: **a real, bounded, D15-anchored 12-week duration is honest, cheap, and reuses existing
week-advance machinery** rather than inventing a new "unstructured" template shape.

## Where they'd clash if pushed

The Expansionist would build the "what happens at week 13 / renew" flow now, while the Executor and
First Principles lens would explicitly defer it as its own future slice. Given `max_items_per_cycle`
discipline and the "smallest independently-shippable slice" rule in this project's Wave mechanism,
the deferral position wins — it is called out as its own numbered slice below, not silently dropped.

## Verdict (adopted into the EPIC-27 Wave)

**Option B, not Option A.** A from-scratch custom template gets:
- `duration_weeks = 12` — cites D15 (`/DOCTRINE.md`, primary compounds held a whole primary block,
  "never shorter than 8 weeks," 8-12 week refresh cadence) as the anchor for the number, not an
  invented figure.
- One `template_blocks` row: `week_start=1, week_end=12, rep_scheme_by_week={}, technique_by_week={}`
  — the existing empty-jsonb default already means "no periodization," so this is zero new schema
  behavior, just an honest single-block program.
- `parent_goal = code_goal_mapping = 'custom'`, `difficulty = 'custom'` — literal sentinel values,
  proven inert by `openProgramLibrary()`'s `is_published=true` filter (verified above), so this
  does not misrepresent anything into the 5-Goal Taxonomy the way a fabricated `build_muscle`/etc.
  would.
- **Deferred, its own future slice, not built now:** what happens when the user reaches week 13 —
  renew/extend the block, or simply let them reopen the builder and add more. Recorded as an open
  slice in the Wave file, not silently dropped.

## The one thing to do first

Wire the from-scratch write path (a new function, e.g. `createCustomTemplate()`, parallel in shape
to `adoptTemplate()`) to write exactly those five sentinel/D15-anchored values — do not touch
`adoptTemplate()` itself, and do not add a UI control asking the user to "pick a duration" for v1;
the 12-week default is silent, matching the Executor's and Outsider's shared point that this is an
implementation detail, not a decision the user should be handed.
