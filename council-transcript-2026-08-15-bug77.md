# LLM Council — BUG-77 part 2 · the D16 scope ruling

**Date:** 2026-08-15
**Convened by:** Wave 3.3 of the Master Build Sequence (the only remaining Wave 3 blocker).
**Standing directive:** *"Continue to push through the bugs & epics in waves as you are now… If needed,
use the llm council skill for advice, not me."* — this ruling was routed to the council, not to Kerwin.

---

## The original question

Does doctrine invariant **D16** mean *"a principle exists somewhere in the corpus"* or *"THIS template
cites ITS OWN principle"*? And, following from that: what should happen to the NULL-`template_id`
"scaffold" rows the seed generator writes?

The code comment left in `scripts/sync-seed-programs.mjs` states the open question verbatim:

> whether the scaffold should be promoted, deleted after adoption, or removed outright depends on
> whether D16 means "a principle exists somewhere" or "this template cites its own principle" — the
> exact question BUG-77 part 2 is waiting on. Do not invent the answer inline.

---

## The framed question (as issued to all five advisors)

### System context

**Tandem** is a two-person couples fitness-competition web app (Kerwin and Dani are the only real users
today), with an aspiration to open a community program library. Programs enter the system two ways:
**generated** (`buildDynamicProgram` in `programs.js`) or **authored** (a JSON seed in `seeds/*.json`
loaded into `workout_templates` / `template_blocks` / `template_days` / `template_exercises` /
`program_principles`).

**Doctrine** is a set of numbered invariants (D1…D16) in `/DOCTRINE.md`, enforced by
`scripts/doctrine.mjs` in CI on every PR. Rule #1: *"the doctrine gate is law — never weaken the gate
to pass."*

**D16 is the two-tier doctrine.** It tags every other invariant as either **SAFETY** (binds every path,
no override ever) or **SCIENCE_DEFAULT** (an authored program MAY deviate, but ONLY by declaring an
explicit key in `science_overrides`, AND that key must be backed by a `program_principles` row carrying
a claim, a rationale, and a source citation). Canonical line: *"Sovereignty without a cited principle is
a D16 failure, not a loophole."*

One live override key exists: `rep_floor`, letting an authored program run a 3–5 rep block inside a
hypertrophy program (D10 otherwise mandates 6–15 for "build muscle"). One seed, **Brick by Brick**,
declares `science_overrides: {"rep_floor": 3}` and ships one matching principle row.

### The defect

D16 is enforced in two places and they do not agree.

**(a) File-side — `scripts/doctrine.mjs`.** Correctly scoped: per seed, checks that seed's own
`principles[]` against that seed's own `science_overrides`. A seed cannot borrow another seed's
citation. **This path is SAFE.**

**(b) DB-side — trigger `validate_science_overrides()` on `workout_templates`.** Body, verbatim:

```sql
if not exists (select 1 from public.program_principles p
               where p.principle_key = k) then
  raise exception 'D16 violation: science_overrides key "%" has no program_principles row', k;
```

**No template scope.** Any row anywhere carrying the key satisfies it — another template's, or a
NULL-`template_id` placeholder. Proven live against prod in a rolled-back transaction: a brand-new
template declaring `rep_floor` with zero principles of its own passes by riding Brick by Brick's
citation.

Three writers bypass the file gate and hit Postgres directly: `scripts/ingest-program.mjs`, the
**adoption clone** path, and manual SQL / future Edge Functions.

### The entangled second problem — the NULL-template_id scaffold

`scripts/sync-seed-programs.mjs` emits, at the top of the generated migration, a scaffold insert for
every principle with `template_id` NULL, before any template row. Why: the trigger fires on the
`workout_templates` write, and on a cold DB no principle exists yet. **Because the trigger is unscoped,
the scaffold works.** Scope it, and the scaffold stops working — a template's own principle cannot exist
before the template row (FK).

Migration 0002 (BUG-77 part 1) changed `UNIQUE (principle_key)` → `UNIQUE (template_id, principle_key)`
plus a partial unique index on `(principle_key) WHERE template_id IS NULL`. Consequence discovered
2026-08-15: the scaffold row and the real row are now **different rows** (the per-template insert used
to PATCH the scaffold; now it inserts alongside), so re-running the generator leaves **one permanent
orphan per principle**.

### Options tabled

1. **Strict scope** — `p.template_id = NEW.id`. Requires solving the chicken-and-egg.
2. **Loose scope** — allow `p.template_id is null` as well.
3. **Delete the scaffold concept**, defer the trigger to end-of-transaction.
4. **Advisory trigger**, rely on the file gate.
5. Something else.

### What's at stake

Community library (EPIC-30) + daily ingestion are planned; an unscoped check makes the "cited principle"
guarantee decorative at scale. Conversely, over-tightening breaks the seed pipeline — the only working
authoring path today — for a threat with zero real users. Doctrine changes must go **Notion →
DOCTRINE.md → doctrine.mjs**; deciding inline in code is forbidden. Hard rule: *"when the source is
silent, flag the gap — never invent."* One engineer + an AI agent, no staging, migrations verified in
rolled-back transactions against prod.

---

## Round 1 — advisor responses

### The Contrarian *(anonymized as Response B)*

Everyone in this thread is arguing about the trigger's WHERE clause. The WHERE clause is not the bug.
Three things nobody has asked:

**1. The trigger is a snapshot check, not an invariant.** It fires on `workout_templates` insert/update
and asks "does a row exist right now?" Nothing guards `program_principles` on DELETE or UPDATE. Delete
the citation tomorrow and the override survives forever, unaudited. Perfectly scope option 1 and you
have still built a turnstile with no wall. If D16 means anything enforceable in Postgres, it needs the
*principles* side locked too — and nobody has proposed that, which tells me the group is optimizing the
artifact it can see.

**2. The adoption clone will break or launder, and nobody has checked which.** Cloning a template row
copies `science_overrides`. Does it copy principles? If no: strict scoping breaks every adoption of
Brick by Brick on day one — your only shipping feature path. If yes: it manufactures citations at
user-click rate, which is worse than the ingest threat everyone is worried about. This is the near-term
path; community ingest is hypothetical. You are hardening the door of a building you haven't poured yet.

**3. `claim`, `rationale`, `source` are free text.** A row reading `source: 'trust me'` satisfies both
enforcement paths today. The guarantee was already decorative; scoping only makes it decorative
per-template.

And the meta-flaw: D16's canonical line does not specify scope. Picking option 1 or 2 *is* inventing the
answer — the exact failure mode this project claims to be eliminating. Correct move: flag the gap,
freeze the three direct-DB writers, and take scope + lifecycle + clone semantics to Notion as one
ruling.

### The First Principles Thinker *(anonymized as Response E)*

You're asking a schema question. The real question is: **what is a principle a property of?**

You've been treating `program_principles` as a citation registry — a shared bibliography keyed by
`principle_key`. That's why the original constraint was `UNIQUE(principle_key)` globally, why the
scaffold with NULL `template_id` felt natural, and why the trigger checks existence rather than
ownership. The data model says "a principle is a library-wide fact."

But D16's text says something else. "Sovereignty without a cited principle" — sovereignty is exercised
*by a template*. The thing being justified is not "3-rep blocks are scientifically defensible in
general." It's "**this** program, for **these** reasons, deviates here." A citation isn't a fact you
look up; it's an argument a specific author makes about a specific program. Two programs can cite the
same PDF page and one can still be wrong — because the justification is contextual (Brick by Brick earns
`rep_floor` via a strength-phase mesocycle; a random ingested program might just want heavy singles).

So the answer to your question is: **D16 means THIS template cites ITS OWN principle.** Not because
that's the safer reading, but because the other reading makes D16 meaningless by construction — a
corpus-wide existence check is satisfied by the first program ever admitted, forever.

Which dissolves the scaffold problem. The scaffold isn't a chicken-and-egg workaround to preserve. It's
a **fossil of the wrong model** — it only ever made sense when principles were library-wide facts. A
principle with no template isn't a principle; it's an orphan claim about nothing. Delete the concept
(option 3), defer the trigger to end-of-transaction, and the ordering problem evaporates.

Write the doctrine line in Notion first: *a principle row is meaningless without an owning template.*

### The Expansionist *(anonymized as Response D)*

**The NULL-`template_id` row is not an orphan. It's the feature you accidentally built and are about to
delete.**

Read it again: a principle that belongs to the *corpus* rather than to one template. That is exactly the
object a community library needs — a citation registry. Per-template principle rows are copy-paste
evidence; the hundredth program citing Schoenfeld 2021 re-types the claim, the rationale, and probably
mangles the source. When that paper is superseded in 2028 you have a hundred divergent strings and no
way to find them.

So don't choose between scoped and unscoped. **Split the concept.** `principles` = library-level,
reviewed, versioned, one row per citation, `template_id` gone entirely (your NULL rows, promoted).
`template_principle_claims` = this template invokes principle P for key K, plus *its own applicability
rationale* — why a 3-rep block is justified in **this** program. D16 then reads: an override requires a
registered principle **and** a template-scoped claim of applicability. Borrowing becomes legal,
explicit, and auditable, instead of accidental and silent. The chicken-and-egg dissolves: the registry
is populated before any template exists, which is what the scaffold was already doing.

The undervalued upside: this makes doctrine *user-facing*. Every published program carries a visible
"why this deviates" panel with sources. No fitness app ships that. It's the difference between "a
program library" and "the only program library where you can audit the science." Ingestion stops being a
threat vector and becomes a citation-harvesting engine — the corpus gets more trustworthy as it grows,
not less.

One override key exists today. That's the cheapest moment this refactor will ever cost. Write the
registry ruling into Notion now.

### The Outsider *(anonymized as Response C)*

Reading the canonical line cold, with no history: *"Sovereignty without a cited principle is a D16
failure."* A citation is something **someone cites**. A bibliography sitting in a shared table that
nobody's paper points to is not a citation — it's a pile of paper. The plain-English answer is already
"THIS template cites ITS OWN," and you don't need a Notion ruling to discover that; you need one to
*record* it. Don't invoke the "flag ambiguity, never invent" rule here. That rule protects you from
fabricating rep ranges you can't source. It is not a license to call your own sentence ambiguous because
the fix is inconvenient.

The scaffold is not a second problem entangled with the first. It's the first problem leaving
fingerprints. Ask what a NULL-`template_id` principle row *means* in the domain: "a scientific override
belonging to no program." No author would ever write that. It exists solely because a check got attached
to the wrong table — you put the validation on `workout_templates`, so it fires before the thing it
validates can exist, so you invented a placeholder to lie to it. The orphan rows are the system telling
you the concept is fake. Delete it (option 3), and validate at transaction end or from the
`program_principles` side.

Two framings I'd reject outright. Option 2's "loose scope" — you'd be writing down, in SQL, that one
unowned row licenses the entire library. That's not a compromise, that's option 4 with extra steps. And
option 4's "advisory trigger": a trigger that raises exceptions isn't advisory. Pick enforcing or delete
it; a rule enforced 90% of the time is mostly a story you tell yourself.

### The Executor *(anonymized as Response A)*

D16 means "THIS template cites ITS OWN principle." That's not a judgment call — the file-side gate
already implements it, and the DB side is just wrong. You don't need a philosophy debate; you need the
two enforcers to agree.

Monday morning, in this order:

1. **Notion + DOCTRINE.md, one sentence**: "A `science_overrides` key is satisfied only by a
   `program_principles` row whose `template_id` equals the template's own id. `template_id IS NULL`
   never satisfies D16." Ten minutes. It unblocks everything else and it's the rule that already exists
   in `doctrine.mjs`, so you're documenting reality, not inventing.
2. **Migration A — make the trigger a `CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY DEFERRED`** with the
   current unscoped body. Behavior-identical, zero risk, but now it fires at COMMIT. This is the whole
   chicken-and-egg fix: template insert, then principle insert, same transaction, check runs after both.
   Verify in a rolled-back txn: insert template+principle together (passes), insert template alone
   (fails at commit).
3. **Migration B — scope the body** to `p.template_id = NEW.id`. Only safe after A. Verify with the same
   live rollback trick: re-run the Brick by Brick seed (must pass), then the borrow attack from the bug
   report (must now fail).
4. **Regenerate `epic031_seed_programs.sql`** with the scaffold block deleted — never hand-edit it,
   `sync-seed-programs.mjs` owns it.
5. **Migration C — `DELETE FROM program_principles WHERE template_id IS NULL`**, then drop the partial
   unique index. Do this last; it's the rollback-safest step to defer.

Rollback for each: keep the prior trigger definition in the migration header as a commented
`CREATE OR REPLACE`. A/B are two statements each.

Option 2 (allow NULL) is the trap — it ships a permanent hole to save one migration. Option 4 is worse:
an advisory trigger is a lie in the schema. Do A→B→regenerate→C.

---

## Round 2 — anonymized peer review

**Anonymization map (revealed):** A = Executor · B = Contrarian · C = Outsider · D = Expansionist ·
E = First Principles Thinker. Letters were shuffled relative to advisor order so reviewers could not
infer thinking style from position.

### Review 1

**1. Strongest: A.** It's the only response that converts the reading into a safe execution order under
the real constraints — `CONSTRAINT TRIGGER ... DEFERRABLE` first (behavior-identical, zero-risk), *then*
scope the body, then regenerate via `sync-seed-programs.mjs`, then delete scaffolds and drop the partial
index. Each step is independently rollback-testable in a prod txn, which is the whole ballgame with no
staging. E argues the *why* better ("a corpus-wide existence check is satisfied by the first program
ever admitted"); A is E plus a shippable plan.

**2. Biggest blind spot: D.** It designs a community citation registry for a corpus with **one** override
key, and never notices its own split still leaves the trigger unscoped — `template_principle_claims`
needs exactly the `p.template_id = NEW.id` fix D avoids choosing. Worse, "community library" appears in
no cited source; per the project's own rule that's inventing doctrine to justify a refactor. B is right
that scope alone is a turnstile with no wall, but B then freezes shipping over free-text `source` fields
— perfect as the enemy of enforced.

**3. All five missed:** nothing prevents recurrence. The gate can't see Postgres (the D17 problem), yet
no one proposes a CI check that diffs live trigger/function bodies against `doctrine.mjs`. Also unasked:
do existing prod templates re-validate on UPDATE once scaffolds are deleted?

### Review 2

**1. Strongest: A.** It's the only one that pairs the correct reading (own-template scope) with an
ordered, individually-rollbackable plan that fits the actual constraints: no staging,
rolled-back-txn verification, regenerate `epic031_seed_programs.sql` rather than hand-edit. C and E reach
the same reading more persuasively — E's "existence check is satisfied by the first program ever
admitted, forever" is the sharpest one-line argument — but neither ships. A's
`CONSTRAINT TRIGGER ... DEFERRABLE` step is the key insight: it dissolves the chicken-and-egg *before*
scoping, so the scaffold deletion is a cleanup, not a prerequisite.

**2. Biggest blind spot: D.** It proposes a two-table refactor for a one-engineer team with no staging,
and — worse — it makes borrowing *legal by design*, which is the exact hole under discussion.
Registry-plus-applicability-claim may be right at 100 programs; at one override key it's speculative work
that leaves the live bypass open meanwhile.

**3. All five missed:** nobody proposes auditing existing rows. A scoped trigger only fires on future
template INSERT/UPDATE — templates already violating D16 stay violating, silently. And per the standing
finding that the gate can't see Postgres, none proposed making trigger-body scope itself a checked
artifact (dump schema to repo, or a verify step that runs the borrow attack in a rolled-back txn). B
gets closest with lifecycle gaps on DELETE/UPDATE of `program_principles`.

### Review 3

**1. Strongest: A.** It's the only response that converts the ruling into an ordered, verifiable
migration sequence with the ordering problem solved *first* (deferrable constraint trigger) so the
scaffold can be deleted rather than justified — and it does it inside the real constraint (rolled-back
txns against prod, per-step rollback text). E has the better argument (a corpus-wide existence check is
satisfied forever by the first program admitted — D16 vacuous by construction); A is what you actually
execute. Pair E's reasoning as the Notion line with A's plan.

**2. Biggest blind spot: D.** It designs a two-table citation registry for a community library that
doesn't exist, at one engineer with no staging, while leaving the live borrow hole open during the
refactor. Its "registry + claims" model reintroduces exactly the existence check E shows is vacuous
unless the claims row carries the real per-template rationale — in which case it's option 1 with extra
tables.

**3. All five missed:** whether prod's *existing* principle rows are patched to a template_id or still
NULL. If any live template is satisfied only by a NULL row, strict scoping breaks prod on apply. Query
that before writing the migration. Also: no one added a repo-side assertion snapshotting the trigger
body, so the file/DB gates can silently diverge again — the known D17 gap.

### Review 4

**1. Strongest: A.** It's the only response that converts the ruling into an ordered,
individually-rollbackable migration sequence (defer first, *then* scope — the correct order, since
scoping before deferring breaks every seed insert), with a live rolled-back verification for each step
and the borrow attack as the acceptance test. E gives the sharpest reasoning for the same conclusion ("a
corpus-wide existence check is satisfied by the first program ever admitted, forever"), and C correctly
kills B's misuse of the flag-the-gap rule — that rule guards against fabricating unsourced science, not
against reading your own sentence.

**2. Biggest blind spot: D.** It proposes a two-table registry refactor without a migration path,
without fixing the live hole in the interim, and without noticing that its "library-level principle"
model *is* the model producing the borrow bug — it legalizes the vulnerability and calls it a feature.
It also invents user-facing product scope for a one-engineer team with no staging.

**3. All five missed** that deferral assumes template and principle land in the *same transaction* —
nobody checked whether `ingest-program.mjs` or the adoption clone wrap their writes in one. And nobody
proposed a DB-aware check; per memory, `doctrine.mjs` cannot see Postgres, so file/trigger drift will
recur silently.

### Review 5

**1. Strongest: A.** It's the only response that answers the question *and* sequences the fix safely.
The key insight nobody else has: make the trigger `DEFERRABLE INITIALLY DEFERRED` **first**, as a
behavior-identical migration, then scope the body. That decouples the chicken-and-egg from the scope
ruling, so each migration is independently verifiable in a rolled-back txn — which matters enormously
with no staging. E has the best reasoning ("the other reading makes D16 meaningless by construction")
but stops at the ruling; A reaches production.

**2. Biggest blind spot: D.** It proposes a two-table refactor while a live hole is open, and its
registry design *legalizes borrowing* — the exact exploit in the bug report — trading a silent hole for
a sanctioned one. It also never says what enforces claim quality, so `source: 'trust me'` (B's point)
survives the refactor.

**3. All five missed:** nobody proposed **auditing prod before choosing**. Query which existing templates
have `science_overrides` keys with no own-`template_id` principle row. If any adopted/cloned templates
fail, strict scoping breaks live data on deploy — that finding should drive the ruling, not follow it.
Also unaddressed: per MEMORY's D17 finding, `doctrine.mjs` can't see Postgres, so nothing prevents this
trigger silently regressing again.

---

## Chairman synthesis

### Where the council agrees

**Four of five advisors independently reached the same reading: D16 means "THIS template cites ITS OWN
principle."** They arrived by different routes, which is what makes it a high-confidence signal:

- *First Principles* by construction: "a corpus-wide existence check is satisfied by the first program
  ever admitted, forever" — the loose reading makes D16 vacuous by definition, not merely weak.
- *Outsider* by plain English: "a citation is something someone cites. A bibliography sitting in a
  shared table that nobody's paper points to is not a citation — it's a pile of paper."
- *Executor* by consistency: `doctrine.mjs` already implements per-seed scope. The DB side isn't
  ambiguous, it's **wrong**. Writing the rule down documents reality rather than inventing it.
- *Expansionist* concurs a template-scoped claim is required — it only disputes where the citation text
  should live.

**Options 2 and 4 were rejected by every advisor who addressed them.** Option 2 (allow NULL) writes into
SQL that one unowned row licenses the entire library — the Outsider's verdict, "that's not a compromise,
that's option 4 with extra steps," went unchallenged. Option 4's "advisory trigger" is self-contradictory:
a trigger that raises exceptions is not advisory.

**Peer review was unanimous, 5/5, that the Executor's plan is the strongest response** — specifically the
`CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY DEFERRED` step. Three reviewers independently identified
the same reason: **deferring must come BEFORE scoping.** Scope first and every seed insert breaks; defer
first and the migration is behavior-identical and zero-risk, after which scoping is a one-line change and
the scaffold becomes cleanup rather than a prerequisite. That ordering was not obvious and no other
advisor found it.

### Where the council clashes

**The real disagreement is the Expansionist against everyone else, and it is not about scope — it is
about where citation *text* lives.**

The Expansionist's case is genuinely strong on a long enough horizon: per-template principle rows are
copy-paste evidence. The hundredth program citing the same paper re-types the claim and mangles the
source; when the paper is superseded there are a hundred divergent strings and no way to find them. A
`principles` registry + `template_principle_claims` join is the normalized answer, and the moment to pay
for it is now, at one override key, not at a hundred.

Four of five peer reviewers named it the biggest blind spot anyway, and their objection is decisive on
two counts. First, **the registry model is the model that produced this bug.** "Borrowing becomes legal,
explicit and auditable" trades a silent hole for a sanctioned one; unless the claims row carries a real
per-template applicability rationale, it is option 1 with extra tables — and if it does carry one, the
join row is just the principle row with a different name. Second, and more serious for this project
specifically: **the community library justifying the refactor appears in no cited source.** Building a
two-table normalization for a corpus of one override key, for a planned feature with zero users, on a
one-engineer team with no staging, is inventing doctrine to justify a refactor — the failure mode
CLAUDE.md exists to prevent.

**The second clash is the Contrarian's meta-objection: that picking any option *is* inventing the
answer, so the correct move is to flag the gap.** The Outsider answered this directly and the answer
holds: *"That rule protects you from fabricating rep ranges you can't source. It is not a license to
call your own sentence ambiguous because the fix is inconvenient."* D16's own canonical line, plus the
already-shipping file-side implementation, plus the fact that the loose reading is vacuous by
construction, constitute the source. This is reading the doctrine, not writing it. But it goes to Notion
first regardless, because that is the process — not because the answer is in doubt.

### Blind spots the council caught

These emerged only in peer review; no advisor raised them in round 1.

1. **Audit prod BEFORE choosing — flagged independently by three reviewers, and it is a genuine
   gating step.** If any live template's override is satisfied *only* by a NULL-`template_id` row or by
   another template's row, then Migration B breaks live data the moment it lands. This finding should
   drive the migration's shape, not follow it. It is now the first action item.
2. **The trigger is one-sided (Contrarian's round-1 point, upgraded by two reviewers).** It fires on
   `workout_templates` only. Nothing guards `program_principles` on DELETE or UPDATE: delete the
   citation tomorrow and the override survives forever, unaudited. Scope alone is "a turnstile with no
   wall."
3. **A scoped trigger does not repair existing rows.** It fires on future INSERT/UPDATE only. Templates
   already in violation stay in violation, silently, until something touches them.
4. **Deferral assumes template and principle land in the same transaction.** True for the generated seed
   SQL. **Unverified for `ingest-program.mjs` and for the adoption clone** — and if the clone copies
   `science_overrides` without copying principles, Migration B breaks adoption on day one. Two
   reviewers plus the Contrarian converged here.
5. **Nothing prevents recurrence.** This is the standing D17 finding: `doctrine.mjs` has no DB
   connection and structurally cannot get one in CI, so the file gate and the trigger can silently
   diverge again exactly as they did here. Four reviewers raised it unprompted. The council's suggestion
   — a verify step that runs the borrow attack in a rolled-back transaction, or snapshots the live
   trigger body into the repo — is the only proposal on the table that would have *caught* BUG-77 part 2
   rather than fixed it.
6. **`claim`, `rationale`, `source_citation` are free text.** `source: 'trust me'` passes both gates
   today. Scoping makes the guarantee decorative per-template rather than decorative globally. Real, but
   correctly deprioritized — it is a corpus-quality problem, not a correctness hole, and it does not
   block this ruling.

### The recommendation

**Rule: D16 is satisfied only by a `program_principles` row whose `template_id` equals the template's
own id. `template_id IS NULL` never satisfies D16. Borrowing another template's citation is a D16
failure.** The NULL scaffold is deleted outright — not promoted, not retained after adoption. It was a
workaround for a check attached to the wrong point in the transaction, and once the trigger is deferred
it has no reason to exist.

Adopt the Executor's sequence, amended by the peer review. Reject the Expansionist's registry — but
**record it in Notion as the designated revisit**, with an explicit trigger condition rather than a
vague "someday": *when the corpus exceeds ~10 templates or a second override key goes live, re-open the
registry-vs-per-template question.* Its diagnosis (citation text will drift across programs) is correct;
only its timing is wrong, and the wrong response to a correct-but-early idea is to lose it.

Amended sequence:

- **Step 0 (NEW — gating).** Audit prod: which templates have `science_overrides` keys with no
  own-`template_id` principle row? Include the adoption-clone question — does the clone path copy
  principles, or only `science_overrides`? If anything fails, that determines whether Migration B needs
  a backfill companion. **Do not write B before this returns.**
- **Step 1.** Notion → `DOCTRINE.md` → `doctrine.mjs`, in that order, one sentence. The file gate
  already behaves this way; this documents it and makes the DB side answerable to it.
- **Step 2 (Migration A).** `CONSTRAINT TRIGGER … DEFERRABLE INITIALLY DEFERRED`, body unchanged.
  Behavior-identical, zero-risk, fires at COMMIT. This is the whole chicken-and-egg fix.
- **Step 3 (Migration B).** Scope the body to `p.template_id = NEW.id`. Acceptance test: Brick by Brick
  seeds clean; the borrow attack from the bug report now fails.
- **Step 4.** Regenerate `epic031_seed_programs.sql` from `sync-seed-programs.mjs` with the scaffold
  block deleted. Never hand-edit the generated file.
- **Step 5 (Migration C).** `DELETE FROM program_principles WHERE template_id IS NULL`, then drop the
  partial unique index. Last, because it is the least reversible.
- **Step 6.** Add the recurrence guard the council flagged — a check that runs the borrow attack in a
  rolled-back transaction, or snapshots the trigger body into the repo. File the `program_principles`
  DELETE/UPDATE guard (blind spot 2) as its own bug rather than folding it in silently.

Each migration keeps its predecessor's definition as a commented `CREATE OR REPLACE` in the header, so
every step has a one-statement rollback.

### The one thing to do first

**Run the prod audit — the single query that answers whether any live template is currently satisfied
only by a NULL-`template_id` or another template's principle row.**

Not the Notion write-up, not Migration A. Three reviewers independently identified this as the step that
should *drive* the ruling rather than follow it, and it is the only cheap way to find out whether
Migration B is a clean tightening or a data-breaking change. Everything else in the sequence is already
decided; this is the only remaining unknown.
