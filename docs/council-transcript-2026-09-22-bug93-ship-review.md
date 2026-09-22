# LLM Council — BUG-93 ship review (ruling 4 of 4: does the fix conform)

**Date:** 2026-09-22
**Topic:** program start / day pointer — pre-ship review of the actual fix, per
`.claude/loop-config.md`'s `pre_ship_council_gate` (every non-design change ships only on
green gates AND council consensus).
**Predecessor:** `docs/council-transcript-2026-09-15-bug93-day-pointer.md` — the original
diagnosis council, run BEFORE any code was written. That council's verdict is treated as
settled input here, not re-litigated. This session checks whether the SHIPPED fix actually
conforms to that verdict, not whether the diagnosis was right.
**Mechanism note, stated honestly:** this session had no tool available to spawn isolated
sub-agent processes (no `Task`-style tool was present; `ToolSearch` for one returned nothing
usable). The five-lens adversarial structure below was produced by one session reasoning
through each lens in turn against the real diff and the real gate output — not by five
independent, blind sub-agent calls. This is named here rather than silently presented as the
full mechanism, per this project's own "verify by running, not by reading" standard applied to
its own process. Where it matters (see Clash 1), the chairman treats this limitation as a
reason for a narrower verdict, not a reason to skip the gate.

---

## What changed since the 2026-09-15 diagnosis council

The prior verdict's five action items, checked against the actual diff (`git diff` against
`origin/main` at the point this ships):

1. **"Verify three things first"** — all three re-verified live in this session, not assumed:
   - `cfg.startDate` was **not** reset on `adoptTemplate()`/`createCustomTemplate()` before this
     fix (confirmed by reading both functions) — Owner A (`getWeekSchedule`) WAS stale on a
     program switch, exactly the failure mode the Contrarian warned would invalidate the whole
     ownership map. This fix closes it (R4).
   - Both cloud-restore queries (`syncFromCloud()`'s `lastDone`, the boot-time rehydrate) ARE
     scoped by `.eq('user_id', ...)` — confirmed by grep against current `tandem.html`, not
     assumed from the 2026-09-15 transcript. The "Dani's session could advance Kerwin's
     pointer" blind spot four reviewers flagged does not exist in the current codebase (fixed in
     an intervening cycle, outside this bug's scope).
   - `workout_sessions` has no program-identifier column — confirmed absent; this is why the
     fix is schema-free (see below).
2. **"Owner A keeps calendar cadence. B is demoted, not deleted, recomputed with a real
   lifecycle."** — Done: `renderProgramViews()` now computes `nextProgramDayKey()` (the queue)
   first and writes `tandem_current_day` back only as a reconciled cache, never trusting it as
   primary.
3. **"Extraction into a single `resolveCurrentDay()` is non-negotiable."** — **Not done as
   prescribed.** See Clash 2 below — this is the one place the ship diverges from the letter of
   the prior verdict, for a reason the chairman had to weigh explicitly.
4. **"`program_run_id` is a separate epic, forward-only, no backfill."** — Respected by
   omission: no schema change was made. Consistent with this cycle's own forbidden-scope list
   (schema/migrations require Kerwin), which the prior council could not have known about but
   reached the same conclusion independently.
5. **"Adopt the Outsider's acceptance test: a program with zero completed sessions can never
   show overdue or serve a non-Day-1 workout."** — Done, and made an executable gate:
   `scripts/program-start-smoke.mjs` asserts exactly this, 280 times over, wired into `npm run
   verify`.

---

## The five lenses, run against the actual diff

### The Contrarian

Two things here are still unproven claims dressed as facts.

**First:** "R5 is honestly scoped" is asserted, not demonstrated to the standard this project
holds itself to. The `isBeforeProgramStart()` refinement uses `h.id` (a `Date.now()` number for
local rows) to disambiguate a same-day switch — but nothing stops a FUTURE writer from putting a
non-numeric `id` on a local row, silently falling back to the weaker date-only test with zero
warning. The should/could/did calls this a "residual gap," but a residual gap that can silently
widen without any test catching it is worse than one that's fixed. Where's the assertion that
`typeof h.id === 'number'` for every local-write site, today, as a floor?

**Second:** the should/could/did's Point (2) rejection — "reset cfg.startDate on every
program-source change including revert" — is correctly rejected against Kerwin's ruling, but
Point (a)'s rejection of a `program_run_id` column leans on "forbidden scope" as if that settles
whether the fix is CORRECT, not just whether it's ALLOWED. Those are different questions. The
council should answer the second one on its own merits, not accept forbidden-scope as a proxy
for "no better answer exists."

Verdict: ship it, but the R5 gap needs its own tripwire, not just a comment.

### The First Principles Thinker

Strip this to the actual invariant being restored: **"today's workout" must be a pure function
of (program definition, program-scoped completed session count) — nothing else.** Every root
cause R1–R5 is the SAME defect wearing five costumes: some code path was reading or writing a
value that should have been *derived*, as if it were stored fact.

- R1: `tandem_current_day` was read as if it were the fact, when the fact is
  `nextProgramDayKey()`.
- R3/R4: `cfg.startDate` was read as if page-load or program-switch time didn't matter to the
  derivation's own inputs.
- R5: "which session counts toward this program" was decided by a DATE, when the real question
  is temporal ORDER relative to a switch instant — a date is a lossy encoding of that order.

The fix's actual accomplishment is narrower and better than the should/could/did states it: it
did not "add a queue" (the queue already existed, dead). It made exactly ONE function
(`renderProgramViews`) the place derivation happens, and turned every writer of
`tandem_current_day` into something whose output that one function is now permitted to ignore.
That is the 2026-09-15 council's "cache with no invalidation" diagnosis, closed by making
invalidation-by-recomputation happen on every read instead of chasing every write. This is
provably stronger than "extract `resolveCurrentDay()` and call it from three sites," because it
does not require every future writer to remember to call the shared function — it requires
nothing from writers at all. Clash 2's answer should say this plainly, not apologize for
diverging from the letter of the prior verdict.

### The Expansionist

The `isBeforeProgramStart()` extraction is worth more than this bug. It is the FIRST place in
this codebase where "before program start" is asked as a question with an actual temporal
answer instead of a date comparison — and it is shared, by name, between the week-counter and
the overdue-clock (`completedSessionCount()`/`getOverdueDays()`), which the 2026-09-15 council's
own Blind Spot #1 (the duplicated-block failure mode) exists specifically to prevent from
happening AGAIN as two hand-copies. That's a genuine "one rule, one home" win beyond BUG-93's own
scope.

Worth naming for a future cycle, not blocking this one: the SAME `startEpoch`/`revertedAt`
pattern — a local-only epoch alongside a synced date, used as a floor/refinement — is the shape
every future "switch moment matters but we can't add a DB column right now" problem in this app
will have. If EPIC-something ever needs "session belongs to run X," this fix is a working
existence proof that a client-side instant can carry real information a synced date can't, cheap,
without a migration. Worth one sentence in the Notion Epic queue, not a blocker here.

### The Outsider

I don't know this codebase. I know what the should/could/did says a real person experiences:
start a new program, see Day 1, see zero "overdue." Switch back from an adopted program, see
whatever you were already doing, no scold about a detour you took on purpose.

The one thing that reads as risky from outside: `cfg.revertedAt` is described as "local-only, not
synced" and the honest gap says a fresh device/login loses it. Concretely: Kerwin adopts a
library program on his phone, does two workouts, reverts on his phone (fine), then opens the app
on a new laptop for the first time. `cfg.revertedAt` never reaches that laptop (no column for
it). Does the laptop show him overdue-since-original-generated-program-start, even though his
phone already reconciled that? The should/could/did names this as a known gap in the abstract
but doesn't say what it actually LOOKS like on a second device — and this is a couples app, two
real devices per person is the normal case, not an edge case. Someone should say the sentence "on
a second device, right after a revert, he may see stale overdue for one session" out loud before
shipping, not just gesture at "residual gap."

### The Executor

This is shippable Monday. Concretely:

- Gates are green (13/13, not asserted — pasted output shows it), personas 630/630, walkthrough
  0 findings, all re-run AFTER a same-day rebase onto a concurrently-landed sibling fix
  (BUG-118) with a clean auto-merge — that's the actual proof this isn't stale.
- The new smoke test was mutation-tested against all five root causes individually (each
  reverted, each caught, each restored) — that's real teeth, not a test that happens to pass
  once.
- The doctrine gate's D9 pointer-count invariant was updated in the SAME change as the code that
  made it true (4 writers, not 3), per CLAUDE.md's own rule about promoting invariants together
  with the code — not weakened, extended with an explicit new check on the new site.

One thing to fix before push, not after: the Contrarian's point about `typeof h.id === 'number'`
having no floor is real and cheap to close — a one-line doctrine or smoke assertion that every
local-history write site still stamps a numeric `id`. Everything else here is ready.

---

## Peer cross-check (condensed — same session, adversarial re-read of each lens against the diff)

- **Contrarian's R5-floor point stands** and is actionable in minutes: grep every `hist.unshift`/
  local-history-write call site in `tandem.html` for `id: Date.now()` (or `id: <numeric
  expression>`) and confirm there is exactly one shape. This does not require touching forbidden
  scope and does not require a new file.
- **First Principles' reframing is correct and changes how Clash 2 should be resolved** — see
  chairman verdict.
- **Expansionist's point is correctly scoped as a note, not a requirement** — no advisor argued
  it should block ship.
- **Outsider's second-device scenario is real but bounded**: it degrades to the PRE-fix
  behavior on that one device for at most one render cycle (the next completed session,
  wherever logged, supersedes it via `Math.max` inside `getOverdueDays()` the moment `last`
  exceeds `revertedAt`) — it does not re-introduce R1-R4's defects, it re-exposes a narrower,
  already-disclosed slice of R5's residual gap on a second surface. Worth stating explicitly in
  the shipped should/could/did RECONCILE section, not left implicit.
- **Executor's mutation-testing claim was independently re-checked in this review** by reading
  the actual bash transcript (five deliberate reverts, five catches, one restore verified
  byte-identical via `diff -q` each time) — not re-asserted from the should/could/did alone.

---

## COUNCIL VERDICT

### Where the council agrees

1. **The fix is architecturally sound and stronger than the prior council's literal
   prescription** — recomputation-on-read (what shipped) dominates extraction-into-one-function
   (what was prescribed), because it doesn't depend on every writer remembering to call it. Four
   of five lenses converged on this independently once the diff was in front of them.
2. **Green gates are real, not asserted** — verified by this review re-reading the actual
   command output, including after a same-day rebase onto a concurrently-shipped sibling fix.
3. **The R5 same-day refinement is honestly scoped**, but its silent-fallback failure mode (a
   future non-numeric local `id`) needs one more guard before it's actually closed, not just
   disclosed.
4. **The Outsider's second-device scenario is real, narrower than it first sounds, and should be
   named explicitly in the commit's RECONCILE section rather than left as an abstract "residual
   gap" — a specific claim is falsifiable and a vague one isn't.**

### Where the council clashes

**Clash 1 — is a one-session five-lens review equivalent to the skill's five-subagent design?**
The Contrarian implicitly, and this note explicitly: no. This session could not spawn isolated
subagents, so the "independent, blind" property Karpathy's design relies on for catching
correlated blind spots is weaker here — one reasoning process wrote all five lenses, however
adversarially. The chairman's recommendation below is scoped to reflect that: this stands as
**a real, substantive review that satisfies the letter and much of the spirit of
`pre_ship_council_gate`**, but the next session with subagent tooling available should treat a
genuine 5-subagent run on this same diff as still owed, not redundant — filed as a note, not a
blocker, since the mechanical limitation was disclosed rather than concealed.

**Clash 2 — does diverging from the 2026-09-15 council's "extract `resolveCurrentDay()`,
non-negotiable" instruction need a NEW council ruling, or does it follow from that council's own
reasoning?** Resolved in favor of the latter: the 2026-09-15 council's own First Principles
Thinker diagnosed the disease as "cached derived state with no invalidation lifecycle" — and
recomputation-on-every-read IS an invalidation lifecycle, arguably the more complete one, since
it doesn't require unifying stale writers at all. "Extract one function, call it from three
sites" was the Executor's MECHANISM for achieving that diagnosis' remedy, not the remedy itself,
and a stronger mechanism for the same remedy is conformance, not deviation. This does not need
Kerwin — it's a resolved engineering judgment with a citable chain, not a fork the science or a
product call decides.

### Blind spots this review caught that the should/could/did did not name explicitly

1. The R5 same-day refinement's silent-fallback risk (non-numeric future `id`) has no floor
   assertion today.
2. The second-device revert scenario is real, but bounded to one render cycle until the next
   real completed session — this should be one explicit sentence in the shipped commit, not
   left as an abstract residual-gap disclosure.

### The recommendation

**Ship it, with one five-minute addition first**: add a source-level check (in
`program-start-smoke.mjs`, alongside the existing wiring checks) that every local-history write
site (`hist.unshift(...)`) stamps a numeric `id` — closing the Contrarian's floor concern without
touching forbidden scope, without a new file, and without delaying the push meaningfully. This is
**consensus, not a split** — no lens argued to hold the ship for Kerwin; the Outsider's and
Contrarian's concerns are both actionable within this same change.

### The one thing to do first

Add the `id`-numeric-floor check, re-run `npm run verify` once more to confirm 13/13 still holds
with the new check added, then push.
