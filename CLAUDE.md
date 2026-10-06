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
   a confident fabrication is the failure mode we are eliminating. **Flagging is the fallback after
   research fails, not the default move the moment a claim looks uncited** (2026-09-16, Kerwin,
   correcting BUG-110's fix: *"find the answer & note the fix, don't just note that one was
   wrong"* — see `docs/self-corrections.md` SC-16). Before flagging a fabricated or uncited claim:
   (a) invoke `exercise-science-research` and check the canonical sources above for the specific
   claim, (b) attempt live research (`WebSearch`/`WebFetch`) for a real citable source if the tools
   are available — verify availability by trying, don't assert "no egress" from memory (SC-03's
   rule applied to your own tool access). Only once both genuinely fail, flag the gap and state
   plainly what was searched and why it came up empty — removing an unsupported claim is a
   consolation, not the goal.
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
  confidence. This is not hypothetical, and the live examples are these (the `REST_SECONDS` example
  this bullet carried until 2026-09-30 was STALE and has been replaced — D23 deleted that table
  (`programs.js:1917-1940`) and `ex.rest` is now honored end-to-end: `honorAuthoredRest()`
  (`programs.js:3618`) promotes it to `authoredRest`, rendered as `data-rest` (`tandem.html:5487`)
  and read by the rest timer (`tandem.html:6124`). That chain is what "traced to a pixel" looks
  like):
    - **`reorderWeek()` (`tandem.html:6790`) — the worst shape, because the UI says it worked.**
      It writes `tandem_day_order`, then toasts *"Moved to the back of this week — nothing lost."*
      Nothing reads that key except `reorderWeek()` itself; `nextProgramDayKey()`
      (`tandem.html:8931`) derives the day from `completedSessionCount() % perWeek` and never
      consults the order. The reorder does not happen.
    - **`personal_records.week_targets` — a green gate on a dead value.** Written
      (`tandem.html:3166`, `:3297`), read by nothing, and *asserted* by
      `scripts/calibration-upsert-smoke.mjs:119`. This is the "worse than no gate" case, in tree.
    - **`.ex-notes` (`tandem.html:5545`)** — a textarea on every exercise of every session whose
      `.value` is never read. Its backing table `exercise_notes` was then dropped for being empty
      (`migrations/0008_bug72_dead_object_cleanup.sql:148`): the dead control starved its own schema.
  D17 exists because a live doctrine violation sat in Postgres while `verify` reported 9/9 green.
  Trace every new value end-to-end to a pixel, or say plainly that you did not. **A value being
  written — even written to Supabase — is not evidence it is read.** `scripts/audit-dead-handlers.mjs`
  made exactly that mistake and reported 1 dead handler out of 159; see `docs/self-corrections.md`
  SC-34.
- **One rule, one home.** If a named table encodes a rule (`SUPERSET_CFG`, `RECOVERY_PARAMS`,
  `PHASES`, `REP_BANDS` — not `REST_SECONDS`, deleted under D23), every path reads that table. A literal that merely
  happens to match today is a silo, and silos drift. When two tables both claim the same rule,
  that is a doctrine question — run `llm-council`, do not pick.
- **Fix the mechanism, not the instance (added 2026-09-11, Kerwin).** A bug report names ONE
  symptom (one label, one goal, one day-count, one exercise) but the defect almost always lives in
  a function/table shared across the whole app. Ship the fix at the level the defect actually lives
  at — every goal, every day-count, every label the same code path can see — never scoped to just
  the reported case. Kerwin's words: *"I'm tired of these bugs being fixed for one particular day...
  There's no reason why it should just be chest, just be transform, just be this."*
  **The worked example that forced this rule:** BUG-73 (2026-08-05) fixed `muscleGroupFromLabel()`
  so leg-day labels ("Quad Focus", "Glutes + Hamstrings") stopped falling through to the
  gap-exempt `'full'` default. The fix was correct but scoped to leg vocabulary only. BUG-114
  (2026-09-10) was the *identical* defect recurring for chest/back vocabulary
  ("Chest + Triceps", "Back + Biceps + Abs") — the same function, the same silent hole, just a
  different label the first fix never generalized past. Same shape as `one_rule_one_home` above,
  aimed at fix SCOPE instead of rule OWNERSHIP.
  **Enforced by:** before shipping any bug fix to a function/table that branches on goal, day-count,
  label text, or any other enumerable axis, the should/could/did audit's COULD section must name
  which other values of that same axis were checked against the fix (not just the reported one),
  and DID must state the fix applies at the shared-function level, not a per-case patch. Where the
  axis is one `validate:personas`/`validate:programs` already sweeps (goal × days × sex × tier ×
  injury), that gate re-run IS the check — a fix that only makes ITS OWN reported combo pass while
  others stay silently exposed to the same bug is not done. Where the axis is something the
  standing sweeps don't cover (arbitrary label text, as both BUG-73 and BUG-114 were), the audit
  must enumerate the other real values that axis takes across the codebase/production data (grep
  the templates, query the table) and confirm the fix covers them, the way BUG-114's fix was
  checked against BOTH live `workout_templates` rows before shipping, not assumed from one example.
- **No shortcuts.** If you're about to say "this is standard" or "typically," stop and cite the
  source instead. If you can't cite it, flag it as unverified.
- **No pictograph emoji in the UI, ever (Kerwin, 2026-09-30).** Scope, confirmed explicitly rather
  than assumed: colorful/pictograph emoji (🛠️📚⚡✨🔁☁⬇, etc.) are banned from every user-facing
  string. Monochrome typographic glyphs used as core UI chrome are explicitly NOT in scope and stay
  as-is: arrows (→ ← ↑ ↓ ↻), checkmark/X (✓ ✕), the 1RM-trend star (★), and the sex-selector gender
  symbols (♂ ♀). This is a repeat offender: commit `ea3ccb9` (2026-06-02) already did an app-wide
  emoji-to-SVG-icon pass once, and new feature work quietly reintroduced 10 fresh instances onto
  onboarding-path and quick-action buttons before 2026-09-23 (fixed in `ae87813`) — the exact
  fix-the-instance-not-the-mechanism failure this file already warns about elsewhere.
  **Enforced by:** `scripts/no-emoji-smoke.mjs`, wired into `npm run verify`. Mutation-tested before
  being wired in (an emoji injected into `tandem.html` must fail the check, not just "look right" —
  two earlier drafts of that script's comment-exclusion logic both silently swallowed real UI text
  and passed anyway; see the script's own header for what broke and why). A new pictograph emoji
  anywhere in `tandem.html` or `programs.js` outside a `//`-commented line fails the gate. Adding a
  glyph to the allowlist requires a one-line reason in the script itself, never a silent edit.

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
checks is a suggestion. This list names the first five and the most recent block only — read the
file, it is the authority: SC-01 staleness · SC-02 retracted claims · SC-03 run-don't-simulate ·
SC-04 feedback is not a commit · SC-05 status docs are snapshots · … · SC-38 mutation-test each
assertion individually · SC-39 a masked finding is not a fixed one · SC-40 never undo a mutation
test with a HEAD-relative git revert.

## Where the code lives — ask, never guess (added 2026-09-29, Kerwin)

**You probably cannot see Kerwin's machine.** Most sessions run in a cloud container whose
filesystem is a fresh clone from GitHub, not his Mac. Saying "run this in your repo" and
handing over a `/path/to/repo` placeholder wastes his time — he has to go find it, and a
placeholder pasted literally just errors. Two rules:

1. **State the limitation before asking.** "I can't see your machine" is one line and it stops
   him assuming you are withholding effort while you quietly guess.
2. **Never assume there is one clone.** As of 2026-09-29 there were ELEVEN working copies on
   his Mac — several sibling clones with different names (not all called `tandem-app`), plus
   git worktrees under one of them, some not repos at all. "Your repo" is ambiguous; ask which,
   or have the finder below report all of them.

To locate them, send this — it is null-delimited because **the parent folder name contains a
space**, and the naive `find … | head -1 | xargs dirname` version silently corrupts the path
(learned the hard way, 2026-09-29):

```sh
find ~ -maxdepth 6 -name tandem.html -not -path "*/node_modules/*" -print0 2>/dev/null |
while IFS= read -r -d '' f; do
  d=$(dirname "$f")
  printf '%s | %s\n' "$(git -C "$d" log --oneline -1 2>/dev/null || echo not-a-repo)" "$d"
done
```

Add a `grep -c <marker> "$f"` column when you need to know which copy actually contains a given
change. That check is not paranoia: on 2026-09-29 a patch believed to be applied turned out to
be present in **zero** of the eleven copies, and several rounds of "the fix doesn't work" were
really "the fix was never there." **Confirm the code under test is the code you think it is,
by a marker grep, before drawing any conclusion from a manual test.**

Prefer `git fetch origin <branch> && git checkout <branch>` over sending a patch file — the
branch is already on GitHub, and checkout either succeeds or fails loudly, where `git am` can
fail quietly. Run `git status --short` first and never move branches over uncommitted work.

Local paths are deliberately not recorded here: **this repository is public.**

## Standing test gate (run before every commit that touches the engine)
`npm run verify` (26 checks incl. doctrine) · `npm run validate:personas` (Rules 6-9). Both green,
or it does not ship. See `.claude/loop-config.md` for the full standing sweep and doctrine-is-law
directive.

**`verify` green does NOT mean prod is consistent.** It cannot see Postgres. The bank↔seed
freshness check proves the committed `migrations/epic031_exercises_seed.sql` matches
`EXERCISE_BANK`; it proves nothing about whether that SQL was ever APPLIED. Only
`npm run integration` (CI-only, needs `SUPABASE_SERVICE_ROLE_KEY`) sees the database. Freshness
green + A2 red = "regenerated, not applied" — go apply it by hand.
