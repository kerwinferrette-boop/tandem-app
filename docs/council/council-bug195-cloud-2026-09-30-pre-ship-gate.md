# Council — pre-ship gate, BUG-195's cloud round-trip (2026-09-30)

Run under `.claude/loop-config.md` `escalation.pre_ship_council_gate`: a non-design change needs a
council consensus before `push origin HEAD:main`. An earlier council cleared this branch when
BUG-195 was **local-only**; this run covers the **cloud half** only.

**Question put to the council:** should the delta push to main as-is, or is something on it not safe
to ship? Six things were named as low-confidence up front: (a) no tombstones, (b) client clocks,
(c) unawaited fan-out in the hydrate loop, (d) a debounce timer outliving a hydrate, (e) whether
stub-client + live-SQL evidence is sufficient without a real signed-in round-trip, (f) the known
Wave 7 merge conflict.

## Round 1 verdicts

| Advisor | Verdict | What it turned on |
|---|---|---|
| Contrarian | do not merge as-is | **`pushExNote` forged `updated_at: now()`** on every push, so a hydrate-push relabelled an old note as fresh and could destroy a genuinely newer note on another device. Plus `clearHistory()` became a lie for notes. |
| First Principles | do not merge as-is | **`restoreFromCloud` never re-rendered** after hydrating, and the walkthrough called `renderTracker()` itself — the harness supplying the step production omitted. Also: the six worries are one choice (a journal modelled as a mutable single cell); the real answer is append-only. |
| Expansionist | merge as-is | Notes are the highest-signal adaptation input a human volunteers, and nothing downstream is reachable until they survive a device. Found the stale "LOCAL ONLY" comment and the `clearHistory` gap independently. |
| Outsider | do not merge as-is | (e) is the blocker: nobody has signed in, typed a note and opened a second device. Also sharpened (d) from "which write wins" to "does text vanish under the caret." |
| Executor | do not merge as-is | The pending-timer guard is one line and the only item that can overwrite text while the user watches. Priced tombstones at half a day to prevent one self-healing resurrection — ship without them. Argued (e) belongs against the **deployed** build minutes after push, not pre-merge on localhost. |

## Where the council agreed

- **(a) resurrection-over-loss is the right default.** Unanimous among those who addressed it. A
  resurrected note is noise; a lost one is gone, and the alternative reading would have re-created
  BUG-195's own defect for any device that had never synced.
- **(b) do not touch the clocks.** DB-stamping `updated_at` leaves local `at` on a client clock, so
  it adds a second clock rather than removing one.
- **(c) no batcher.** N is bounded by the exercise names one person has annotated.
- **(f) non-issue.** The browser assertion reads the real textarea, so a Wave 7 rewrite that drops
  the hooks fails `verify` loudly. That is the guard.
- **Two defects the framing never asked about were real**, and both were the project's own named
  failure classes: a new silent-loss path (the forged stamp) and a green gate asserting a path
  production does not have (the missing re-render). Neither was on the list of six. That is the
  case for running the gate rather than treating green gates as the gate.

## Where it clashed — (e), and it did not converge

The Outsider holds that a real signed-in cross-device round-trip is the blocker, because the one
sentence this change exists for has never been executed. The Executor holds the opposite: a manual
localhost sign-in is run once and then rots, while the same round-trip against the deployed Netlify
build tests the artifact users actually load. **Not resolved by the council.** It cannot be resolved
in this container either — there is no test-account password and no service-role key here.

**Resolved by Kerwin instead**, 2026-09-30, live: *"usage is up on netlify credits. apply all the
changes to git so it can auto deploy once it's back online."* So the merge went ahead and the
round-trip is carried as a named owed item against the deployed build, which is the Executor's
position. It is recorded in `docs/waves/EPIC-63-WAVE-STATE.md`, not treated as done.

## What changed because of this run

1. `pushExNote(name, text, at)` threads the stamp; `saveExNote` and `hydrateNotesFromCloud` pass it.
   Assertions `[J5]`, `[H5]`.
2. `restoreFromCloud()` re-renders at its tail — fixed at the caller, since the gap was identical
   for the lastsets chips and the PR figures.
3. The walkthrough drives the real `restoreFromCloud()` and renders nothing on the app's behalf.
4. `wipeCloudNotes()` + its `clearHistory()` call. Assertions `[O1]`-`[O3]`.
5. `hydrateNotesFromCloud` skips any name with a pending debounce timer. Assertion `[N]`.
6. The stale "LOCAL ONLY" comment is gone, replaced by a KNOWN LIMITS block.

Every new assertion was mutation-tested individually and watched to fail by name (SC-38).

## Round 2 — peer review and re-verification

Kerwin's instruction to ship arrived mid-round (*"usage is up on netlify credits. apply all the
changes to git so it can auto deploy once it's back online"*), so only one advisor's round-2
response landed before the push. It is recorded rather than dropped:

- **Contrarian: both blockers cleared, verified in tree, VERDICT merge.** It also credited two
  things it had checked for and NOT found: hydrate snapshots `exNotesAll()` *after* the await, so
  there is no read-modify-write window, and the `_exNoteTimers` guard sits above the comparison.
- **On peer review it named A (First Principles) strongest and reversed its own call**, having
  filed the missing re-render as "not a blocker, no data lost": with a stale textarea on screen, one
  keystroke stamps the OLD visible string with a fresh `at` and pushes it over the note hydrate just
  pulled. Same loss class after all.
- **Biggest blind spot: E (Expansionist)** — it found `clearHistory` and the stale comment and then
  voted merge as-is, and its case leaned on an uncited claim about what the adaptation layer should
  read, which is the plausibility-first reasoning the prime directive bans, used as an argument to
  ship.
- **What all five missed, and it was fixed rather than filed:** the note key was interpolated into
  the `oninput` ATTRIBUTE escaping only `'`. `escNoteHtml` guards the textarea body; nothing guarded
  the key. One exercise name containing `"` would terminate the attribute and the box would silently
  discard typing again — BUG-195 by a second route, with no gate watching. Latent when found (no
  risky char in `programs.js` or `public.exercises`) but the ingestion agent adds names routinely,
  so a DATA change would have re-opened a closed bug. Now `escNoteKey()`, with `[P]` asserting a
  full round-trip (HTML-decode, evaluate as the JS literal, require the original name back) over
  six names including `"`, `'`, `&`, `\` and `<b>`. Mutation-tested.

## Filed, not built

- Tombstones / `deleted_at` — cheapest while the table is near-empty (Expansionist), priced at half
  a day plus a human-applied migration (Executor).
- The append-only reshape (First Principles). Product decision: today, typing over a note loses the
  old text on one device, no sync involved. Kerwin's call.
- `clearHistory()` resurrection for `tandem_history` / `tandem_lastsets` / `tandem_prs` — the same
  shape, pre-dating this change, filed against all three together.
- A push that fails offline warns to console only; the user sees success (Outsider).
