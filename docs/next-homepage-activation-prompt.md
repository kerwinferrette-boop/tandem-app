# Next Claude Code prompt — Homepage 3-button activation (Continue Plan / Build Me a Workout / Lift Log)

Paste everything between the lines into a fresh Claude Code session on this repo
(`kerwinferrette-boop/tandem-app`). It is self-contained — no context from any prior
conversation is assumed. This is a **collaborative UI/UX design session with Kerwin**,
not an autonomous fix-and-ship loop — pace it accordingly (see "How to run this
session" at the bottom before writing any code).

---

Read `CLAUDE.md` and `.claude/loop-config.md` first; both are binding for this repo.
Then run `node scripts/preflight.mjs` before touching anything — it's wired as a
SessionStart hook and should already have printed. Read its output before concluding
anything is missing, unstarted, or lost ("not found" is not "does not exist" — this
repo has paid for that conflation twice already).

## What Kerwin asked for

Redesign the dashboard (`view-dashboard` in `tandem.html`) to keep all the existing
health content (rings, competition scoreboard, medals, day-dots) as-is, and add
**three buttons**:

1. **Continue Plan**
2. **Build Me a Workout**
3. **Lift Log**

He was explicit this is still being workshopped — **do not push anything to `main`
without him actively confirming it in this session first.** Work in the tree, show
him what it looks like (screenshots via the `run` skill, since this is a UI change —
type-checking a UI diff proves nothing about whether it reads well), and only commit
once he says so.

## What already exists — verified by reading the code, not assumed

**Continue Plan** — already exists, just needs promoting/renaming. Today the
dashboard has exactly one CTA at the bottom (`tandem.html` ~line 1450):
```html
<button class="dash-cta" onclick="showView('tracker')">Today's Workout →</button>
```
Making it one of three peer buttons instead of the sole one is a straightforward
relabel + layout change.

**Build Me a Workout** — already fully built (EPIC-028), just buried three taps deep:
`Goal nav pill (top of dashboard) → "Your Program" modal → ⚡ Build Me a Workout →`
opens `modal-oneoff`, a two-step wizard (goal type → focus → rendered one-off day)
that renders through the *same* `buildDayHTML` path as a normal program day — it's
not a second render path, and it writes nothing back to `cfg.goal` (see
`tandem.html` ~5389-5600, `oneOffState`/`openOneOff`/`renderOneOff`). Promoting it to
a home-page button is moving the entry point, not rebuilding the feature.

**Important mismatch to raise with Kerwin before touching the focus grid:** today's
step-2 focus grid is exactly 9 cards (`ONEOFF_FACE` in `tandem.html` ~5419, keyed off
`FOCUS_SLOTS` in `programs.js` ~1896): **Chest, Back, Legs, Shoulders, Arms, Push,
Pull, Hinge, Full Body.** "Back" already trains lats + biceps (its eyebrow already
says `LATS · BIS`), so "Right back and biceps" is closer to already-covered than new.
But there is **no standalone Glutes card** — glutes only appears as a secondary
target inside Legs and Hinge (`FOCUS_SLOTS.legs`/`.hinge` both hit `glute_max`). If
Kerwin wants Glutes as its own tile, that's a real (if small) addition: a new
`FOCUS_SLOTS.glutes` entry plus a card face, not just a relabel. **Ask him before
building it** — don't silently fold Glutes into Legs or silently add a new slot
without his sign-off on what specifically it should train.

**Lift Log — this does not exist in any form today.** This is the actual new build.
His spec, verbatim:

> "The lift log should act as a journal, where I can input my own workouts with
> weights & reps, and you log that against the user. That way, if they come back to
> that lift at some point on their own, or through a workout plan, their latest set
> and 1RM calculation is updated. Can also make suggestions off of those workouts too
> with rest times, stretches, & other tips based on the workout they've constructed
> for themselves."

## Two real design forks in Lift Log — resolve these WITH Kerwin before writing code, not for him

**Fork 1 — how does a freely-typed exercise resolve to something the engine
recognizes?** 1RM tracking and "suggested weight next time" already exist and are
real — but per BUG-46/C7's history, they're keyed off the **exact exercise name** in
`EXERCISE_BANK`. A Lift Log entry only feeds forward into a future generated day or
one-off day if it resolves to a bank entry. Two honest options, not a foregone
conclusion:
  - (a) Constrain input to an autocomplete/search over the existing bank — guaranteed
    match, but less "log whatever I actually did."
  - (b) Free text, with fuzzy-matching against the bank and an explicit "this looks
    new — add it?" fallback for anything that doesn't resolve.
  Present both to Kerwin with the tradeoff above; don't pick silently.

**Fork 2 — does a Lift Log session count as a normal workout?** i.e. does it write to
the same `workout_sessions`/`sets` tables that already feed streaks, PRs, and
`npm run outcome`'s exposure counter — or does it need its own flag/path? Default
recommendation to bring to him: yes, same tables, no reason a self-directed lift
shouldn't count toward streak/PRs/the outcome gate — but this is his call to make,
not yours to assume.

**The suggestions (rest times, stretches, tips) are exercise-science content.** The
moment you're deciding what a "good rest time after this lift" or "stretch after
this movement" rule actually is, **invoke the `exercise-science-research` skill
first** — CLAUDE.md's prime directive applies here exactly as it does everywhere
else in this codebase. Do not derive a rest-time or stretch rule from what sounds
right; cite it or flag the gap.

## Schema note (READ ONLY — do not act unilaterally)

Whatever Lift Log ends up writing probably needs new columns or a new table (e.g. to
distinguish a self-logged session from a generated one, or to store which bank slug
a free-text entry resolved to). Per `.claude/loop-config.md`, schema changes are
**migration FILES only** — `apply_migration` stays human-only. Draft the migration
file, do not apply it, and say so explicitly when you get there.

## How to run this session

- This is iterative and visual. After each meaningful UI change, use the `run` skill
  to actually launch the app and look at it (or screenshot it) before telling Kerwin
  it's ready to look at — "type-checks" is not "looks right."
- Check in with Kerwin at each fork above (Glutes tile, exercise-matching strategy,
  Lift Log session table strategy) before building past that point. Don't build all
  three buttons end-to-end and present a fait accompli — he asked to work through
  this "step by step," not to review one big diff at the end.
- Nothing gets committed or pushed until Kerwin says the current state is ready,
  regardless of `.claude/loop-config.md`'s standing "green gates go straight to
  main" policy for the autonomous loop — that policy is for the unattended cycle;
  this is an attended design session and he was explicit it's still workshopping.
- If anything here turns into an Epic/Bug worth tracking for the autonomous loop
  later, file it in the Bug & QA Log / Epics & Feature Roadmap per the usual
  tracker-seeded catalog convention — don't build it silently off-book.
