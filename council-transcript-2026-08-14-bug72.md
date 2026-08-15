# LLM Council — BUG-72 · Group C dead-object drops

**Date:** 2026-08-14
**Convened by:** standing directive — *"If needed, use the llm council skill for advice, not me."*
**Wave:** 1.4 (final item of the security/cleanup wave)

---

## The question as framed

Tandem is a couples fitness-competition app used daily by two real people, on a Supabase/Postgres
backend. The doctrine gate `scripts/doctrine.mjs` enforces invariants D1–D16 in CI and is LAW.

**Critical structural fact:** that gate is a Node script that reads **repo files only**. It has no
database connection and cannot inspect a live Postgres view body or PL/pgSQL function. Anything
living only in the database is invisible to it.

- **D11** — the working 1RM must be EARNED, never a fixed weekly step.
- **D12** — multi-formula 1RM, monotonic in reps.

BUG-72 is dead-Supabase-object cleanup. Four objects in schema `public` have zero references in
`tandem.html` / `programs.js` / `scripts/` and zero dependent views:

1. `VIEW progressive_overload_recommendations`
2. `VIEW medal_comparison`
3. `VIEW weight_trend`
4. `TABLE exercise_notes` (0 rows; only repo reference is a `DELETE` line in `test-users-purge.sql`)

**The finding that changed the question.** The body of view #1 is:

```sql
WHEN min_reps_hit >= 10 THEN round(weight_lbs * 1.025 / 5.0) * 5   -- +2.5%
WHEN min_reps_hit >= 7  THEN weight_lbs                            -- hold
ELSE GREATEST(round(weight_lbs * 0.95 / 5.0) * 5, 5)               -- -5%
```

…plus a text column literally rendering `'Increase weight — try N lbs'`.

That is a **fixed ±2.5% ratchet**, which D11 forbids by name. A separate ticket, **BUG-38**, was
filed as "the ±2.5% ratchet still exists" and later marked *"VERIFY BEFORE BUILDING; likely stale"*
because the JS function it named (`nudgeWorking1RMs`) does not exist anywhere in the repo. The
ratchet was never missing — **it lives in the database as a view**, PostgREST-addressable, with no
consumer today.

**Decision:** drop each object now, or keep it?

---

## Advisor responses

### The Contrarian *(anonymised as Response B)*

Drop all four. That's the easy part, and it's also a trap — shipping only the DROP lets everyone
declare victory over a problem you haven't touched. The ratchet view is not the bug. The bug is that
a doctrine-violating recommendation engine lived in production for months and your LAW-grade gate
returned green the entire time, because the gate reads files and the violation lived in Postgres.
Delete the view and the gate is still green for the same wrong reason. Anyone with `execute_sql` can
recreate it tomorrow. You'll have burned the one piece of evidence proving the gate has a blind spot,
and proven nothing about the blind spot itself. This must not merge without a DB-connected inventory
assertion in `npm run verify` — an allowlist of objects in `public`, failing on anything unlisted —
and a PENDING→ACTIVE invariant promoted in the same commit, per your own rule.

Two things you're taking on faith: **"Zero references" is a grep of THIS repo** — it doesn't cover
Supabase saved queries, edge functions, Netlify functions, untracked bundles in your working tree, or
the other app sharing this project. And **"reversible via rollback block" is false in your
environment**: your own notes say `execute_sql` DDL never lands in `schema_migrations`, so a rollback
block in a file nobody applied is a comment, not a safety net. Also, `security_invoker = on` is not
the same as "not exposed" — **check the actual GRANTs to `anon`.**

### The First Principles Thinker *(Response D)*

You're asking "drop or keep four objects?" The actual problem is that you have two engines and only
one is governed. Doctrine is enforced against files because doctrine was *written* against files — an
accident of tooling, not a principle. The principle is "every surface that can tell a human what
weight to lift is bound by D11/D12." Postgres is such a surface and has never once been gated. This
view isn't a bug you found; it's the first sample from a blind spot of unknown size.

Rebuild the question: what is the smallest change that makes the database a *governed* surface? The
ratchet view: drop — not because it's unused, but because "unused" is the weakest possible defense of
a thing that violates law. It's one `.from()` call from being real. `medal_comparison`,
`weight_trend`, `exercise_notes`: not the same category, shouldn't ride the same decision. They
compute nothing prescriptive. Cost of existence zero, cost of deletion zero — that symmetry means the
question is genuinely uninteresting, and spending council cycles on it is how you avoid the
interesting one. The deliverable that matters isn't the migration. It's a new invariant — D17 —
asserting no database object emits prescriptive load, plus a schema snapshot committed to the repo so
`doctrine.mjs` can read the database the only way it knows how: as a file.

### The Expansionist *(Response E)*

Drop all four — but BUG-72's real deliverable is the **blind hemisphere** you just found. You've
proven with a concrete artifact that the doctrine gate audits half the system. Everything in Postgres
— view bodies, PL/pgSQL, triggers, RLS predicates — is invisible. An entire class of violations that
can never be caught, and you found one on the first look. Build `scripts/doctrine-db.mjs`: introspect
`pg_get_viewdef` / `pg_proc.prosrc` / `pg_policy`, write a checked-in `db-snapshot.sql`, let the
existing file-reading gate audit it. One afternoon, and D1–D16 suddenly apply to the whole system. It
retroactively covers the still-open BUG-77 scope hole and catches every future DDL applied via
`execute_sql` that never lands in the migration ledger.

Second: that view body isn't trash, it's a **fixture** — check it into the doctrine tests as the
canonical negative example, and BUG-38 closes with evidence rather than a shrug. Third: the view's
*shape* is a free spec — `user_id × exercise × progression × human-readable recommendation` is exactly
the server-side read model needed to push recommendations without the client running, which unlocks
cron nudges and notifications. Rebuild it D11-compliant later. `exercise_notes`: drop the table, keep
the idea. `medal_comparison`, `weight_trend`: pure drop.

### The Outsider *(Response C)*

Drop all four. Your own brief contains the answer and you talked past it: every drop is reversible
from a captured rollback block. When undo is one migration away, "keep it just in case" isn't caution,
it's a decision you're declining to make. You are convening a council over an action with a two-minute
undo button.

Two pieces of reasoning I don't buy. *"Deletes a future feature's landing zone"* — an empty view is
not a landing zone; nothing lands on it. What you'd preserve is not capability, it's the feeling of
having already started. *"Evidence needed to close BUG-38"* — evidence is a paragraph and a
definition, not a live production object. You wrote the evidence in the question I'm reading. Paste it
into BUG-38 and close it. Keeping a running artifact as its own exhibit is how a two-person app
accumulates a museum. `exercise_notes` is circular: the only thing referencing it is the script that
deletes it.

The thing nobody is saying: the ratchet didn't survive because someone was careless. It survived
because your gate reads files and your team reads gate output, and **"the gate is green" quietly
became "the system is compliant."** That substitution is the actual bug.

### The Executor *(Response A)*

Drop all four. One migration, this afternoon.

1. Copy the four `CREATE` bodies into the migration's rollback block — that's your BUG-38 evidence,
   pasted into the ticket too. Evidence lives in the migration file and the ticket, not in prod.
2. `DROP VIEW progressive_overload_recommendations` — not a judgment call. A doctrine violation in
   prod behind PostgREST where the gate can't reach it; zero consumers means zero blast radius.
3. Drop `medal_comparison` and `weight_trend` in the same migration. "Cheap to keep" is wrong framing
   — the cost isn't storage, it's that **every future audit re-litigates them.** You already spent a
   wave inventorying 27 objects; drop them and the next inventory is 23.
4. Drop `exercise_notes`, and **in the same commit delete the `DELETE` line from
   `test-users-purge.sql`**, or your purge script errors on a missing table and someone burns 20
   minutes next month.
5. Run via `execute_sql` and record it in the ticket, since the migration ledger will under-report.
6. Close BUG-38 citing this commit; its premise was wrong and the real artifact is now gone.

On "future feature landing zone": a three-column notes table is fifteen minutes to recreate. That's a
rounding error, not a landing zone.

---

## Peer review (anonymisation: A=Executor, B=Contrarian, C=Outsider, D=First Principles, E=Expansionist)

### Reviewer 1

**Strongest: B.** The only one that treats the brief's own claims as falsifiable — "zero references"
is a grep of *this* repo, and "reversible via rollback block" is false given `execute_sql` DDL never
lands in `schema_migrations`. It also binds the fix to the project's own rule: promote the invariant
in the *same* commit.

**Biggest blind spot: A.** Pure hygiene framing — object counts, purge-script tidiness. It ships the
DROP and leaves the gate green for exactly the reason that let a D11 violation live in prod. C names
the problem but stops at "a written rule," which is the failure mode again: rules the gate can't see.

**All five missed:** no one proposes *runtime* evidence of disuse (`pg_stat_statements`, PostgREST
logs) before asserting zero consumers. D/E's checked-in schema snapshot silently drifts — a stale
snapshot passing green is the same failure class, so freshness must itself be gated. And **CLAUDE.md
requires Notion-first before D17 lands in `DOCTRINE.md`/`doctrine.mjs`; every response skips it.**

### Reviewer 2 *(skeptical brief)*

**Strongest: B.** The only one that attacks the two load-bearing premises rather than the decision.

**Biggest blind spot: A.** Treats a live D11 violation as janitorial, never mentions the gate blind
spot, and recommends running DDL via `execute_sql` and tracking it in a ticket — normalising the exact
ungoverned path that let the ratchet hide.

**All five missed:** nobody checks whether the ratchet *ever ran*. Nor does anyone **sweep `pg_proc`
and triggers for sibling ±2.5% logic while the signature is still in hand — you're deleting the search
key.** And D17 requires Notion first, per CLAUDE.md.

### Reviewer 3 *(pragmatic brief)*

**Strongest: A.** The only response that produces a shippable sequence today, and the only one that
catches the actual breakage: dropping `exercise_notes` orphans the `DELETE` line in
`test-users-purge.sql`. B's grep-scope warning should be folded in, but B conditions the merge on a
whole new DB-connected gate — **that's a wave, not a cleanup ticket.**

**Biggest blind spot: E.** It agrees to drop, then proposes rebuilding the view as a server-side read
model for cron nudges, preserving `exercise_notes`' "idea," and a new `doctrine-db.mjs`. That is three
hypothetical features attached to a four-object deletion, in a project with an explicit
anti-over-engineering rule. D has the same defect, milder: it makes the drop wait on inventing D17. E
also ignores that **a checked-in schema snapshot rots silently and passes green.**

**All five missed:** nobody proposed *verifying* zero consumers against the database. Nobody noted two
real users are mid-program — sequence the drop off-hours.

---

## CHAIRMAN'S VERDICT

### Where the council agrees

**Unanimous, 5/5: drop all four.** Not one advisor argued to keep any object. The three stated
reasons for keeping — "future feature landing zone," "evidence for BUG-38," "views are cheap" — were
each rejected independently by multiple advisors. The Outsider's framing was the cleanest: *an empty
view is not a landing zone; what you'd preserve is not capability, it's the feeling of having already
started.*

Also unanimous: `progressive_overload_recommendations` is the one that is **not** a judgment call. It
is a live D11 violation in production, reachable via PostgREST, in a place the gate structurally
cannot see.

### Where the council clashes

**The clash was never about the drop. It was about scope.**

- **B, D, E (+ Reviewers 1 and 2):** the drop must not merge alone. Delete the view and `npm run
  verify` is still green *for the same wrong reason*. The real deliverable is a DB-connected gate —
  an object allowlist, a `doctrine-db.mjs`, a new invariant D17.
- **A and Reviewer 3:** that is a wave, not a cleanup ticket. And the proposed remedy has a defect its
  proponents didn't notice — a checked-in schema snapshot **rots silently and passes green**, which is
  the same failure class it claims to fix.

### Blind spots the council caught

Four things emerged only in peer review, and three were verifiable rather than arguable:

1. **`anon` GRANTs were never checked.** *(B)* — **VERIFIED, and B was right and it was worse than
   assumed.** All four objects carry `anon=arwdDxtm` — **full** privileges, not read-only. Supabase's
   default grant. `exercise_notes` turns out to have RLS + 1 policy backstopping it, so this is not a
   live hole — but the reasoning in the brief ("security_invoker means own-rows-only") was not the
   thing actually protecting it.
2. **Sweep for siblings before deleting the search key.** *(Reviewer 2)* — **DONE.** Swept every view
   body and every `pg_proc.prosrc` in `public` for `1.025 / 0.95 / 1.05 / 'increase weight' /
   'reduce weight'`. Exactly one hit: the view itself. **The blind spot has exactly one sample.**
3. **Nobody verified disuse at runtime.** *(all three reviewers)* — **DONE.** 0 PostgREST hits across
   all four objects in the available log window, on top of 0 code references and 0 `pg_depend`
   dependents.
4. **D17 cannot land in this commit.** *(Reviewers 1 and 2, independently)* — CLAUDE.md mandates
   Notion → `DOCTRINE.md` → `doctrine.mjs`, in that order. Inventing an invariant inline to satisfy a
   cleanup ticket would violate the very doctrine-is-law rule being invoked to justify it. **This is
   what breaks the tie.**

### The recommendation

**Drop all four now. File the blind spot; do not build it into this commit.**

The scope argument (B/D/E) is *correct about the diagnosis* and *wrong about the vehicle*. The gate's
inability to see Postgres is real, is the more important finding, and deserves its own ticket — but
Reviewer 3 is right that it is a wave, and Reviewers 1 and 2 are right that the project's own rules
forbid landing a new invariant here. Holding a four-object cleanup hostage to an unbuilt gate would
leave a known D11 violation live in prod while the "proper" fix is designed. That trade is backwards.

The Contrarian's fear — "you'll have burned the one piece of evidence" — is answered by the migration
itself: the verbatim `CREATE VIEW` body is preserved in the rollback block, in git, permanently. The
evidence survives; only the executable artifact dies.

Reject the Expansionist's rebuild-as-read-model and keep-the-idea proposals outright. Three
hypothetical features attached to a deletion, in a repo whose standing rule is "don't design for
hypothetical future requirements."

**Per-object ruling:**

| Object | Ruling | Why |
|---|---|---|
| `progressive_overload_recommendations` | **DROP** | Live D11 violation, PostgREST-reachable, gate-invisible |
| `medal_comparison` | **DROP** | Correct but unused; cost is that every future audit re-litigates it |
| `weight_trend` | **DROP** | Same |
| `exercise_notes` | **DROP** | 0 rows; its only referrer is the script that deletes it |
| `calculate_1rm()`, `update_personal_record()` | **DROP** | 0 triggers, 0 dependents; 0006's rollback target, now applied and asserted |

### The one thing to do first

**Sweep `pg_proc` and every view body for sibling ±2.5% logic — before the DROP deletes the search
key.** *(Done: exactly one hit, the view itself.)*

### Carried forward, not closed by this council

- **The gate's DB blind spot** — file to Notion as a proposed invariant (D17: no database object may
  emit prescriptive load). Notion first. Do not write it into `DOCTRINE.md` or `doctrine.mjs` inline.
- Reviewer 1's warning about any future schema-snapshot approach: **a stale snapshot passing green is
  the same failure class.** Freshness must itself be gated, or don't build it.
- **Residual risk, stated plainly:** the two Edge Functions (`qa-session-validator`,
  `expand-and-log-bug`) were not read — their source was not inspected. Both are QA/bug-logging
  tooling and neither plausibly consumes a progression view, and 0 runtime hits corroborate that. If
  one did, the rollback block restores the object in one statement.
