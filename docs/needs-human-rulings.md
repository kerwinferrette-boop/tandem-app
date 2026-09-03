# Open rulings — the loop's entire remaining backlog

**Snapshot: 2026-08-17, Cycle 56.** As of this cycle the User Story Coverage tracker holds
105 rows: **49 Resolved · 47 Needs Human · 8 Skipped · 1 Passing · 0 Untested · 0 Failing ·
0 Fixing.** With BUG-89 closed there is **no Untested or Failing work left**. Every remaining
item is blocked behind one of the five rulings below, all of which are Kerwin's to make.

This file is a decision request, not an audit. It states each question, the options, and what
each answer unblocks. It deliberately does **not** pick an answer where the source is silent —
per `CLAUDE.md`'s prime directive, a flagged gap is correct and a confident fabrication is the
failure mode being eliminated. Where a Bug Log row already carries its own recommendation, that
recommendation is reproduced and attributed rather than restated as this file's opinion.

Nothing here is blocked on engineering. All five are scoped, reproduced, and ready to execute
the moment they are ruled.

---

## 1. BUG-78 (P1) — which key do the two Edge Functions use?

**Row:** Bug & QA Log — *anon + any signed-in user can blind-overwrite ALL bug reports and forge
`agent_log` rows (write-side twin of BUG-74)*.
**State:** fix drafted as `migrations/0005_bug78_scope_write_policies.sql`, **written and
deliberately not applied**. Audit landed on `main` in `39f4880`.

Two policies are named for `service_role` but declared `TO public`:

| table | policy | grant |
|---|---|---|
| `user_bug_reports` | "Service role updates bug reports" | `UPDATE TO public USING (true)` |
| `agent_log` | "Service role inserts agent_log" | `INSERT TO public WITH CHECK (true)` |

`service_role` has `rolbypassrls = true`, so neither policy does anything *for* `service_role`.
The only thing they do is grant the capability to `public` — which includes `anon` and every
authenticated user. Measured on prod in rolled-back transactions: as `anon` with no JWT, `UPDATE
user_bug_reports` touches all 30 rows and `INSERT agent_log` is accepted; as an authenticated
non-owner, `SELECT` correctly returns 0 rows but `UPDATE` still touches all 30, and `agent_log`
accepts a row forged under another user's `user_id`. A caller who cannot see a single bug report
can still flip every one to `status='resolved'`, which silently empties the QA feed
(`tandem.html:5649` filters `.neq('status','resolved')`).

> **THE RULING NEEDED — one factual question:**
> **Which Postgres key do the `qa-session-validator` and `expand-and-log-bug` Edge Functions
> use — `service_role`, or the anon/publishable key?**

- **If `service_role`** — `0005` is a no-op for them and **ships as-is**.
- **If the publishable key** — those Edge Functions must be **moved to `service_role` first**,
  or applying `0005` breaks them *and* Kerwin's own QA-feed resolve button
  (`tandem.html:5703`), which is today carried solely by the blanket policy.

**RESOLVED 2026-09-03 (Cycle 68).** The answer was previously flagged as "not determinable
from this repo" because the Edge Function source lives in Supabase, not git, and was never
read. It has now been read directly via `mcp__Supabase__get_edge_function` (project
`zsvktcvqmppsshtpeljt`): both `qa-session-validator/index.ts` and
`expand-and-log-bug/index.ts` construct their client with
`Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`. **Both use `service_role`.** Per the table
above, `migrations/0005_bug78_scope_write_policies.sql` ships as-is with zero behavioural
change to either function. Applying the migration is still human-only regardless
(`apply_migration` is on the forbidden-ops list) — the only remaining step is Kerwin (or a
session with migration-apply authority) running the migration and its 5 post-fix assertions
already written into the file. See the BUG-78 Notion row for the full quote.

---

## 2. BUG-79 (P1) — how should D17 be enforced, and at what tier?

**Row:** Bug & QA Log — *the doctrine gate has no DB connection; a D-invariant violation can live
in Postgres indefinitely with `npm run verify` green (proposed invariant D17)*. Self-filed by
Kerwin.

`scripts/doctrine.mjs` reads repo files only. It has no database connection and cannot obtain one
in CI, so it cannot inspect a view body, a PL/pgSQL function body, a trigger, or an RLS predicate.
Anything Postgres executes is outside the gate **by construction**.

This is not hypothetical. The view `progressive_overload_recommendations` contained a fixed
±2.5% / hold / −5% ratchet emitting user-facing text ("Increase weight — try N lbs") — a direct
**D11** violation (working 1RM must be *earned*, never a scheduled ratchet; SAFETY tier). It sat
in production, reachable by any PostgREST caller, while `npm run verify` reported D11 green across
882 week-steps. Dropped 2026-08-14 (BUG-72/BUG-38, `c7d0fff`, `migrations/0008`).

Two known samples, two different invariants, one root cause:

| sample | DB artifact | invariant | file-side gate said | status |
|---|---|---|---|---|
| BUG-38 / BUG-72 | `progressive_overload_recommendations` (view) | D11 (SAFETY) | green, 882 week-steps | closed 2026-08-14 |
| BUG-77 | `validate_science_overrides()` (PL/pgSQL) | D16 — no template scope | green — the file-side twin *is* correctly scoped | see row |

**Not claimed:** that the database is full of hidden violations. The sweep found exactly one
prescriptive-load artifact in `public`. The claim is that *if there were more, nothing would tell
us.*

> **THE RULING NEEDED — two parts:**
>
> **(i) Enforcement mechanism.** The council split here:
> - **(a) Declarative rule only, enforced by review.** Costs one paragraph. Worth nothing when
>   the reviewer is tired — note this is precisely how the known violation survived: it *was*
>   reviewed, filed as harmless clutter, and left.
> - **(b) DB-connected gate.** A script sweeping `pg_get_viewdef` + `pg_proc.prosrc` for
>   prescriptive-load patterns. Actually catches it. Needs a CI credential, which CI does not
>   have today. The sweep already exists and is validated against a real positive and a real
>   negative — lift it verbatim from `migrations/0008` assertion A3.
> - **(c) Checked-in schema snapshot diffed in CI.** No credential needed, but a snapshot rots
>   silently and then passes green — the *same* failure class this bug is about, relocated.
>   Do not adopt without gating staleness itself.
>
>   *The row's own recommendation, if forced to choose:* (a) immediately, plus (b) when a CI
>   credential exists; explicitly reject (c) unless staleness is itself gated.
>
> **(ii) Tier.** SAFETY or SCIENCE_DEFAULT, argued explicitly. SAFETY is defensible because the
> one known violation was user-facing load prescription, which is what D11 protects, and D11 is
> SAFETY. The row forbids defaulting it to SCIENCE_DEFAULT without saying why.

Order is non-negotiable once ruled: **Notion → `/DOCTRINE.md` → `scripts/doctrine.mjs`, all three
in one commit.** If D17 cannot be enforced with the credentials CI actually has, it ships
**PENDING** — a documented, unenforced law is honest; a law claimed as enforced by a gate that
cannot see its subject is the exact failure this bug is about.

---

## 3. The v0.5 schema conflict — one ruling, four bugs behind it

**Source:** `EPIC-026 Phase 1 — Sub-Muscle-Group Audit + Vocabulary Proposal` (READ-ONLY, audit
complete, nothing written). Repo: `docs/epic-026-submuscle-audit.md`, `scripts/audit-muscle-tags.mjs`.
Reproduce every number with `node scripts/audit-muscle-tags.mjs`.

**Exercise Science Schema v0.5** — Tandem's own source of truth — specifies `muscle_group_primary`
as a **coarse 10-value enum**: `chest | back | shoulders | quads | hamstrings | glutes | biceps |
triceps | core | calves`. It never mentions heads or sub-groups. `research-report (8).pdf` (all 18
pages extracted) and the Framework docx contain **zero** hits for `anatom`, `clavicular`, `trapez`,
`delt`, `oblique`. `/DOCTRINE.md` has no muscle-group invariant.

The code already ships a **50-term anatomical vocabulary** (`tricep_long_head`,
`quad_rectus_femoris`, `pec_major_clavicular`, …) — 45 distinct `muscle_primary`, 32
`muscle_secondary`, identical on both the `EXERCISE_BANK` and Supabase sides (bank↔DB drift is
**zero**, canonical hash `27f7a8b03427e80df71c962743d1c77a`, n=171).

That vocabulary is **undocumented drift from Tandem's own source of truth.** Per `CLAUDE.md`,
v0.5 must be amended *first*, then `/DOCTRINE.md` — the code cannot be brought into conformance
in either direction until the schema is ruled.

> **THE RULING NEEDED:**
> **Widen v0.5 to formally sanction sub-muscle-group granularity, or treat the current 50-term
> vocabulary as out of conformance and pull it back toward the 10 coarse values?**
>
> Everything in §3 is unauthorized until this is answered — including the additive backfill,
> which is **36 exercises, not 171** (111 already fully sub-tagged, 34 mixed, 24 atomic-only,
> 2 parent-only).

Two things worth knowing before ruling:

- **The sub-head vocabulary is write-only today.** Across all 73 slot definitions and 29 distinct
  group names, **not one requests a sub-head**. Granularity has *zero* effect on selection right
  now. It becomes load-bearing the moment **D6b** (per-muscle weekly volume) ships — so this
  should be ruled *before* D6b, not after.
- **Citation-grade caveat.** Every anatomy/journal domain (Kenhub, NCBI/StatPearls, PMC, JOSPT,
  Physiopedia, ACE, NSCA) returned `403 CONNECT` at the egress gateway during the audit. Those
  citations are **search-retrieved, not fetch-and-quote**. Allowlist `ncbi.nlm.nih.gov`,
  `pmc.ncbi.nlm.nih.gov`, `jospt.org`, `tandfonline.com` and re-verify before any of this becomes
  an ACTIVE D-invariant.

### The four bugs this ruling releases

| bug | severity | defect |
|---|---|---|
| **BUG-84** | P1, live | Seated Calf Raise — the only soleus exercise — is unreachable from 3 of 4 calf slots, **and** offers the user zero swaps (`getExerciseSubstitutes` uses exact equality, not the prefix rule). A `calf_*` rename would fix only the first half. |
| **BUG-85** | P1, live | Landmine Press (`upper_pec`) is unreachable from every chest and push slot. 11 tags in total that no slot can reach. |
| **BUG-86** | P1 | Nordic Curl is tagged with the two hamstring heads the evidence says it *de-emphasises*; `hamstring_semitendinosus` appears nowhere in the bank. Called the highest-value single correction in the audit. |
| **BUG-87** | P2, latent | Prefix collisions: `quad` prefix-matches `quadratus_lumborum` (a quad slot can draw a lumbar muscle); `lat` would collide with `lateral_delt` (22 → 38 exercises). |

The audit's proposed fix for these is **additive only, zero renames** — add `calf` as a co-tag on
the 6 triceps-surae entries, add `hamstring_semitendinosus` to the three relevant curls, add
`quad_vastus` (already a request token at `:1656` with no tag behind it), and correct two
unambiguous Latin misspellings. It explicitly recommends **not** renaming delts, traps, or the
calf family: ~97 tag occurrences + 19 slot literals + a three-surface migration, for a parent
slot no template wants.

---

## What is already unblocked and done

For contrast, so this file isn't read as "everything is stuck":

- **PR #21 merged to `main`** (`d7b3b6b`) this cycle after re-running the gates green — BUG-82
  (D18 empty-candidate-pool gate, 234 call-site×tier checks, ship-blocking), BUG-83 (dead
  `lower_body` token removed), BUG-88 (4 sourced home-tier isolation entries; D18's allowlist
  shrunk to empty), plus the EPIC-40 CATALOG audit.
- **BUG-89 fixed and pushed** (`0737bff`) — the one confirmed dead handler from that audit.
- **Standing checks green this cycle:** `npm run verify` 9/9 · `npm run validate:personas` 630/630
  · `npm run walkthrough:onboarding` 0 findings.

---

*Maintained by the unattended catalog→test→fix→verify loop. Regenerate the counts with the
tracker; re-read each Bug Log row before acting, since a ruling may have landed after this
snapshot.*
