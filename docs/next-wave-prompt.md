# Next Claude Code prompt — Wave 2 reachability + program-snapshot gate

Paste everything between the lines into a fresh Claude Code session on this repo
(`kerwinferrette-boop/tandem-app`). It is self-contained — no context from any prior
conversation is assumed.

---

Read `.claude/loop-config.md` and `CLAUDE.md` first; both are binding for this repo.
Then run `node scripts/preflight.mjs` before touching anything — it is also wired as
a SessionStart hook, so it should already have printed on session start; read its
output before concluding anything is missing, unstarted, or lost. If it flags
unmerged branches or stranded work, resolve what it flags before proceeding.

## Two pieces of work, in order. Do not start the second before the first ships.

### Part 1 — Close the 11 orphan muscle tags (Wave 2 completion)

`node scripts/audit-muscle-tags.mjs` currently reports **11 muscle tags that exist
in `EXERCISE_BANK` but that no generator slot can ever select**: `adductor, core,
external_rotator, hip_flexor, long_head_tricep, lower_trap, middle_trap, psoas,
serratus_anterior, supraspinatus, upper_pec`. This is not a tagging gap — the bank
already has 179 entries and a 54-term hierarchical vocabulary. It is a
**reachability** gap in the slot-matching rule.

**BUG-85** in the Notion Bug & QA Log ("Landmine Press is unreachable from every
chest and push slot because `upper_pec` has no prefix relation to `pec`") is one
filed instance of this eleven-instance class. Do not fix `upper_pec` alone and stop
— that would leave 10 siblings broken and the audit would still fail.

**Where the fix goes:** `programs.js` has two `groupsMatch` closures — line 1932 and
line 2176 — asserted byte-identical by doctrine invariant D19
(`scripts/doctrine.mjs`). Fix the prefix/hierarchy rule in **both**, identically, or
D19 fails correctly. `audit-muscle-tags.mjs` already confirms today which copy the
live rule matches — read its "fixed-pattern copies found" line before you start so
you know you're editing the rule the audit will actually re-check.

**Before writing any matching-rule code, invoke `exercise-science-research`.** This
is a muscle-taxonomy/exercise-selection change and CLAUDE.md's prime directive is
non-negotiable here: consult the canonical source (5-Goal Taxonomy / Exercise
Science Schema v0.5 in Notion) for how these 11 terms should relate to their parent
groups before writing the matching logic. Do not invent a hierarchy from what looks
plausible.

**Assertion (the thing that proves this is done):**
```
node scripts/audit-muscle-tags.mjs
```
must report **0 orphan tags**, not 10, not 1.

**Add a permanent regression guard.** loop-config's "regression stop" rule requires
a structural fix like this to get a `*-smoke.mjs` guard added to `npm run verify`'s
`CHECKS` array (`scripts/verify.mjs:43`) so orphans can never silently regrow. Model
it on the existing smoke scripts in `scripts/` (e.g. `cadence-smoke.mjs`) for style.

**Ship gate for Part 1** — all must be green, run and shown, not asserted:
```
npm run verify
npm run validate:personas
node scripts/audit-muscle-tags.mjs   # 0 orphans
```
Independent verification: a **fresh** agent that did not write the fix re-runs the
audit and must show it **RED before / GREEN after** (check out the pre-fix commit,
confirm the audit still reports 11, restore, confirm 0). A verification with no red
phase is not accepted — the fix may be fixing nothing.

**Ship policy:** push straight to `main` once green, per loop-config's standing
"green gates go straight to main" policy — this is additive and gate-guarded, not
the high-blast-radius engine work Part 2 sets up.

**Close BUG-85** in Notion with the commit sha once verified, and log the cycle per
loop-config's standing sweep (Files Modified / Code Fix on the bug row).

---

### Part 2 — `scripts/program-snapshot.mjs` (gate #10, prerequisite for Wave 4)

This is **not** the Wave 4 engine rewrite itself. It is the single binding
precondition an LLM council put on Wave 4, and it must land and be promoted to a
`verify` check *before anyone touches `buildDynamicProgram`* (programs.js
2155-2469).

**Council finding, for context (2026-08-28, question was: in-place rewrite of
`buildDynamicProgram` vs. a parallel engine behind a feature flag):** the council
recommended **in-place, no runtime flag**, on grounds specific to this app — a
feature flag's value is staged rollout across a population, and Tandem has exactly
two real users. Splitting them across old/new engines drops `npm run outcome`'s
already-fragile production sample to n=1, perfectly confounded (the two users
differ by sex, goal, and training history) — destroying the app's only real-person
signal to buy an uninterpretable comparison. The council also corrected a premise:
a parallel engine is not categorically forbidden by doctrine's "one owner, no
second copy" invariants (D19 already tolerates two call sites of one rule, asserted
byte-identical) — but *reimplementing* a rule in a second place is exactly what
those invariants exist to catch, which is why the sequence below exists.

**What to build:** `scripts/program-snapshot.mjs` — extracts and hashes/diffs the
full generated output of `buildDynamicProgram` and `getProgram` across a
representative sweep of inputs (reuse `persona-matrix.mjs`'s combo matrix rather
than inventing a new one). Its job is to answer one question on every future
commit: **did the generated program change, and was that change intended?** It is
explicitly a **change-detector, not a correctness gate** — say so in its own header,
the same way `outcome.mjs`'s header explains what it is and is not.

**Wire it in:** add one line to the `CHECKS` array in `scripts/verify.mjs:43-52` so
it becomes ship-gate check **#10**. `npm run verify` should then report `ALL 10
CHECKS PASS`.

**Baseline commit:** the first commit is the snapshot script plus a **committed
baseline snapshot of today's output** — before any Wave 4 code changes. This is the
reference every subsequent Wave-4 commit diffs against. A Wave-4 commit with an
**unintended** snapshot diff fails the gate; an **intended** one (fixing one of the
absorbed bugs — BUG-34, BUG-40, BUG-41, BUG-31, all of which Wave 4 is scoped to
absorb, per Notion's EPIC-23 Dependency Gate — do not fix any of these four
separately from Wave 4) must be reviewed and the baseline updated deliberately in
the same commit, never silently.

**Ship gate for Part 2:**
```
npm run verify   # now 10/10, including the new snapshot check
```
Independent verification: fresh agent confirms the snapshot script actually detects
a change — inject a one-line deliberate diff to `buildDynamicProgram`'s output,
confirm check #10 fails, revert, confirm it passes. Same red-then-green discipline
as Part 1.

**Do not proceed to the actual Wave 4 rewrite of `buildDynamicProgram` in this
session** unless Part 2's gate is landed, green, and independently verified first.
If you reach that point with room left in the session, stop and hand off — Wave 4
itself is high blast radius (it generates the real periodized program for two real
people) and deserves its own dedicated session per the council's sequencing, not a
rider on this one.

---

## Standing rules that apply regardless of which part you're on

- Scope-lock: `tandem.html` / `programs.js` / `scripts/` only. Never touch
  schema/auth/RLS/sync/calibration — escalate to Needs Human in Notion.
- `npm run outcome` needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, which are not
  provisioned in this container as of this handoff. It correctly fails rather than
  skipping. If you have those credentials, run it first, every cycle — its numbers
  about real people lead any report, not gate counts. If you don't, say so plainly
  rather than silently skipping the Outcome Rule.
- Every batch, before claiming anything done: `git log origin/main` (or your PR
  branch) — the remote ref, never the local branch — is what "done" means.
- If you hit a genuine judgment call the science doesn't decide, or two sources
  conflict, run `llm-council`. Don't guess and don't defer it to a tracker row —
  CLAUDE.md is explicit that filing it instead of resolving it is deferral, not
  delegation.
- Record what happened — lapses, near-misses, and things that worked well — in the
  🧭 Tandem — Protocol Ledger Notion database (parent: Product Roadmap). It exists
  specifically so this kind of session-to-session knowledge doesn't evaporate.
