# Open rulings — what actually still needs Kerwin

**As of 2026-09-03.** Regenerate the bug counts by querying the Notion Bug & QA Log directly;
regenerate the outcome numbers with `node scripts/outcome.mjs` (needs `SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY`) or the equivalent SQL against `zsvktcvqmppsshtpeljt`.

> **Read this before trusting anything below.** This file is a **snapshot**, not live state.
> The previous version was stamped *2026-08-17, Cycle 56* and had gone materially wrong: two of
> its three rulings had already been made, and its headline claim — *"every remaining item is
> blocked behind one of the five rulings below"* — was false. See `docs/self-corrections.md`
> SC-05. Re-derive from Notion and `git log` before acting.

## The one ruling still open

### BUG-78 (P1, status *In Fix*) — which key do the two Edge Functions use?

The only genuine blocker in this file. Everything else below is engineering, not a decision.

Two policies are named for `service_role` but declared `TO public`:

| table | policy | grant |
|---|---|---|
| `user_bug_reports` | "Service role updates bug reports" | `UPDATE TO public USING (true)` |
| `agent_log` | "Service role inserts agent_log" | `INSERT TO public WITH CHECK (true)` |

`service_role` has `rolbypassrls = true`, so neither policy does anything *for* `service_role`.
The only thing they do is grant the capability to `public` — `anon` plus every authenticated user.
Measured on prod in rolled-back transactions: as `anon` with no JWT, `UPDATE user_bug_reports`
touches all 30 rows and `INSERT agent_log` is accepted. A caller who cannot read a single bug
report can still flip every one to `status='resolved'`, silently emptying the QA feed
(`tandem.html:5649` filters `.neq('status','resolved')`).

Fix is drafted at `migrations/0005_bug78_scope_write_policies.sql`, **written and deliberately not
applied**. Audit landed in `39f4880`.

> **THE RULING — one factual question:**
> **Do `qa-session-validator` and `expand-and-log-bug` talk to Postgres with `service_role`, or
> with the anon/publishable key?**

- **`service_role`** → `0005` is a no-op for them and ships as-is.
- **publishable key** → move those functions to `service_role` first, or `0005` breaks them *and*
  Kerwin's own QA-feed resolve button (`tandem.html:5703`), today carried solely by the blanket
  policy.

Not determinable from this repo — the functions' source is not here. Applying the migration is
human-only regardless.

## Rulings that were open and are now MADE — do not re-ask

| was | ruled | outcome |
|---|---|---|
| **BUG-79 / D17** — how to enforce a DB-side doctrine gate, and at what tier | 2026-08-17 | Option **(b)**, a DB-connected sweep. D17 is in `DOCTRINE.md`, tier SAFETY, enforcement PENDING until CI has a credential. `scripts/d17-db-sweep.mjs` exists |
| **The v0.5 schema conflict** — widen the schema, or pull the 50-term vocabulary back | 2026-08-18 (`8c966d8`) | Ruled; closed **BUG-84** and **BUG-86**. `MOVEMENT_FAMILIES` + **D19** landed (`0694308`), anchoring `groupsMatch` at the `_` separator |
| **BUG-87** — the `quad` / `quadratus_lumborum` prefix collision | fixed `4191df6` | The unanchored `startsWith` fallback is gone; D19 now forbids it |

## Not blocked on a ruling — this is engineering, and there is a lot of it

The previous version of this file said *"Nothing here is blocked on engineering."* That is no
longer true and should not be repeated. The Bug & QA Log currently holds **34 unresolved rows**,
including P1s that need no decision from anyone:

- **BUG-85** (P1, New) — Landmine Press unreachable from every chest and push slot (`upper_pec`).
  Released by the v0.5 ruling; nothing blocks the fix but the ⚠️ open question of whether Landmine
  Press actually biases the clavicular head, which is **UNVERIFIED** and needs a source before retagging.
- **BUG-101** (P1, New) — `band-external-rotation` ships dead: its only primary tag
  (`external_rotator`) is requested by no slot.
- **BUG-16 / 18 / 27 / 93** — scheduling defects (sync failures, wrong day marked done, wrong
  start day).
- **BUG-40 / 41 / 45 / 49 / 57 / 92 / 95** — generator and 1RM defects, all P1.

## The outcome gate is red, and no code change will turn it green

`npm run verify` is 11/11 and `scripts/outcome.mjs` is a **separate** gate that reads production.
It currently cannot run in this environment at all — `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` are unset — and it **fails rather than skips**, by design.

Measured directly against prod on 2026-09-03, which is the answer the gate exists to produce:

| user | total sets | training days (all time) | last set | days idle |
|---|---|---|---|---|
| **Kerwin** | 294 | 17 | 2026-08-05 | **29** |
| **Dani** | 36 | 2 | 2026-06-10 | **85** |
| Test Kerwin / Test Dani | 24 / 20 | 1 / 1 | June | 84 / 85 |

Against the gate's own thresholds (`WINDOW_DAYS` 56, `STALE_DAYS` 21, `MIN_MUSCLE_EXPOSURE` 3,
`MAX_FRAGMENTATION` 0.75) it fails on all four layers for Kerwin: **all 20 muscles are stale**
(minimum 29 days), **18 of 20** fall under the exposure floor, and **7 muscles are fragmented**
past the threshold — `lateral_delt` worst at 4 different lifts across 4 sessions.

Lift-level progression, all-time, for lifts with ≥2 sessions: **7 progressing, 6 regressing,
4 flat.** Real gains exist where a lift repeated (High Incline Barbell Press 161→207 est 1RM in
ten days; Lat Pulldown 180→203) — but only **17 of 44** tracked lifts ever got a second session,
which is the fragmentation problem the gate was built to name.

**This is not an engineering backlog item.** The gate was designed so it cannot be satisfied by
closing a Notion row or passing a synthetic matrix — the only thing that turns it green is a human
training. BUG-100 already tracks the zero-activity case for Dani; it now applies to Kerwin too.

Two things that *are* actionable:
1. **Give CI a credential** so the gate can run unattended, or accept that it is a manual check.
   Until then every "all gates green" claim silently excludes the only gate that measures a body.
2. **Fragmentation is a real engine defect** and is worth fixing regardless of training frequency —
   a muscle trained repeatedly under a different lift name each time can never accumulate a load
   history, so progression is invisible even when it happens.

---

*Maintained by hand and by the loop. Every claim here was re-derived from Notion, `git log`, or a
live query on the date stamped at the top — not copied forward from the previous version.*
