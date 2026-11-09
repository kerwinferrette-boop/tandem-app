# Council — BUG-256 deliverable 4: renaming a lift whose NAME is its storage identity

**Date:** 2026-11-09 · **Convened by:** Claude · **Trigger:** CLAUDE.md — "for a genuine judgment
call the science does not decide … an architecture fork with no clear winner: run `llm-council`,
do not pick."

**Protocol note, stated honestly:** five advisors ran independently and in parallel, as the skill
specifies. The 5-reviewer anonymized peer-review round was **compressed into this synthesis**
rather than run as five separate reviewers, because the advisors converged 4–1 on their own and the
remaining open questions were factual rather than matters of judgment — so they were answered by
running code (below) instead of by more opinion. That is a deviation from the skill's step 3 and is
recorded here rather than glossed.

## The question

Kerwin ruled 2026-11-06 "Flat as main press". The functional half shipped in `c5296c6`
(a `familyDefault` rank that outranks the alphabetical tiebreak). The remaining half is the
**rename** "Flat Barbell Press" → "Bench Press".

The obstacle: in Tandem an exercise's **display name IS its storage key**. `EXERCISE_BANK` is keyed
by slug, but every stored artefact is keyed by the `name` string.

Measured, not recalled (SELECT against prod `zsvktcvqmppsshtpeljt`, 2026-11-09):

| location | rows |
|---|---|
| `exercises.name` | 1 |
| `sets.exercise_name` | 14 |
| `personal_records.exercise_name` | 2 — **two different users** |
| `lastsets.exercise_id` (holds the literal name) | 1 |
| `users.onboarding_estimates` jsonb key | 1 (value 155) |

= **19 rows, 5 tables, 2 accounts.** No `UNIQUE(name)` collision: nothing is named "Bench Press".

Unreachable name-keyed **localStorage** on the users' phones: `tandem_working1rm`, `tandem_prs`,
`tandem_lastsets`, `tandem_ex_notes`, `tandem_swaps`, `tandem_history`. `tandem_working1rm` holds
D11's **earned** working 1RM — a measurement. Detaching that key silently reverts a real measured
1RM to a seed default.

### The fork

- **A — identity rename + alias seam.** Rename `name`; one alias home consulted at every
  stored-name read seam; migrate the 19 rows. LocalStorage heals through the alias.
- **B — display/identity split.** Keep stored identity `Flat Barbell Press`; add
  `displayName: 'Bench Press'` rendered at the UI seams. No migration.
- **C — rename + one-time client-side local key rewrite** on app load.

## Verdict: **B**, with the underlying defect filed, not fixed by stealth

**Vote: 4–1 for B or "not now" (Contrarian, First Principles, Outsider, Executor); 1 for A
rescoped as a slug resolver (Expansionist).**

### Where the council agreed, unprompted and unanimously

1. **The rename buys very little.** Every advisor answered Q4 first and said so. The functional
   complaint is already fixed and shipped; what remains is a label. The Outsider supplied the only
   real benefit, and it is a genuine one: *"At the gym Dani says 'bench.' Nobody says 'flat barbell
   press.' A couple competing against each other needs shared vocabulary, so the name is the
   product."* Cheap value — not zero value.
2. **The real defect is not the rename, it is that Tandem has no exercise identity.** Slugs exist
   for all 185 entries; the history path throws them away and keys on a mutable human string. Every
   future rename, merge, typo-fix and variant split re-opens this same fork.
3. **C is indefensible.** Destructive, no possible pre-image, heals only a device that is opened,
   and a second device opened later resurrects the old key. Rejected outright.
4. **The `COMPOUND_PATTERNS` collision is a live, separate bug.** All five flagged it independently.

### Where the council clashed

**A vs B, and the clash is worth preserving.**

The Expansionist's case for A is the strongest single argument made: this rename is the *cheapest
forcing function the project will ever get* for the slug migration it actually needs — one lift,
19 rows, zero collisions, two users who are both reachable. In six months it is 185 lifts and
thousands of rows.

The Contrarian's rebuttal is what carried: **A's advertised advantage is false.** "One true name
everywhere" does not survive contact with a permanent alias home — `Flat Barbell Press` lives
forever in the read path either way. A ends with two names for one lift *exactly as B does*, plus a
two-account cloud migration and eight new failure sites. B is honest about the duplication; A hides
it and charges more for it.

The Executor added the operational point that decided it: **the deploy and the DB write cannot be
atomic.** Netlify ships on push; the Supabase write is a separate human-applied step. A and C both
require a window in which a phone mid-session holds `tandem_working1rm['Flat Barbell Press']` in a
live JS scope while the row renames underneath it — and no gate can see that phone.

### The blind spot nobody caught, found by running the code

Two advisors asserted B is nearly free because it touches "one render seam". **That is wrong.**
Measured: `grep -cE '\$\{[^}]*\b(ex|e|s|it|exr)\.name\b' tandem.html` = **10** interpolation sites,
plus history/PR surfaces keyed on name. B is not a one-liner.

But this *strengthens* B rather than weakening it, because of the asymmetry in how each option
fails:

| | failure mode of a missed seam |
|---|---|
| **A** | **silently detaches real training history**; an earned 1RM reverts to a seed default. Invisible, harmful, possibly unrecoverable. |
| **B** | **shows the old name in one place.** Visible, harmless, fixable in a line. |

Both options touch a comparable number of sites. Only one of them can lose a measurement. That is
the whole decision, and it is why B wins despite the Expansionist being right about the long game.

### Q2 — can A's alias seam ever be verified? No, and that is itself the answer

Three advisors reached this independently. A gate can prove the *repo* contains no bypass; nothing
in CI can prove a *phone* healed. The Executor named the only check that would actually see it —
have both users paste `JSON.stringify(localStorage)` from DevTools and resolve every name-keyed
entry through the alias map, pre-deploy, both phones. That is a real check, and it requires two
humans to run it correctly before a cosmetic change. The First Principles Thinker put the
consequence plainly: *"If you cannot build the proof, you cannot claim the alias seam"* — an
unprovable seam over measured training data is precisely the "wired is not working" shape this
project's doctrine already names, and D17 exists because a green gate once asserted a value that
was dead in Postgres.

### Q3 — the collision is real, and it is NOT a rename prerequisite

**Verified by running the shipped tables** (vm-extracted from `tandem.html`, not re-typed):

```
"Hip Thrust"          siblings matching its regex: 1 (Barbell Hip Thrust)
                      accessories deriving from it: Cable Kickback, Hip Abduction Machine
"Romanian Deadlift"   siblings matching its regex: 4 (Single-Leg RDL, DB RDL, Single-Leg DB RDL, Sumo RDL)
                      accessories deriving from it: Leg Curl
```

Reproduced against the shipped accumulator loop (`tandem.html` ~5416-5429), same day, same lifts,
only the processing order differs:

```
variant FIRST : canonical 'Hip Thrust' -> 180  => Hip Abduction Machine prescribed  70 lb
literal FIRST : canonical 'Hip Thrust' -> 300  => Hip Abduction Machine prescribed 120 lb
```

The cause is `map[e.name] = _rm` — a **plain assignment** — clobbering the cross-variant
`Math.max(...)` the derived-accessory path accumulates, whenever a bank name exactly equals a
canonical key. **42% under-prescription, order-dependent, live today, for two lifts.** Nobody has
noticed because a lookup miss is not an error and an under-prescription does not hurt anyone.

Had the council chosen A, the rename would have walked a **third** victim into this hole:
`Bench Press` is a canonical key with **8** sibling bank names matching its regex and
`Tricep Pushdown` deriving from it. Under B the stored/compared name stays `Flat Barbell Press`,
so the rename adds no new victim — the bug is independent, and is filed as such.

Fix is at the accumulator, not the instance: never a bare assignment where a canonical key can
collide. That covers all three names at once rather than the one being renamed.

## The recommendation

1. **Ship B.** `displayName` on the bank entry, honoured at the render seams. Storage identity,
   every lookup table, `SEED_WEIGHTS`, the seed SQL and all 19 prod rows stay on
   `Flat Barbell Press`. **No migration, no prod write, no A2 drift, no human apply step.**
   Rollback is one `git revert`.
2. **Fix the accumulator clobber** as its own commit with its own gate — it is measured wrong data
   in the prescription path and it is not the rename's fault.
3. **File the real epic: slug-keyed history.** The Expansionist is right that this is the actual
   defect and that it gets more expensive every month. It is not a side effect of a label change,
   and it must not be smuggled in under one.
4. **Also worth having regardless, from the Outsider:** an "export my data" button. One JSON file
   per phone. It makes every future identity change reversible, which is the capability whose
   absence made this fork hard in the first place.

## The one thing to do first

Add `displayName` to the bank entry and honour it at the render seams — **changing nothing that is
written, compared, or looked up.**

## Dissent, preserved

The Expansionist's position deserves to survive this verdict: *"You will never get a cheaper,
lower-stakes forcing function for the migration this app actually needs."* True. The council's
answer is not that the slug migration is wrong — it is that a cosmetic rename is not permitted to
be its delivery vehicle, and that pairing them would make the first missed seam cost a measurement
instead of a word.
