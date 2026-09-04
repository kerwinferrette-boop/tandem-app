# Open rulings — what actually still needs Kerwin

**As of 2026-09-03.** Regenerate the bug counts by querying the Notion Bug & QA Log directly;
regenerate the outcome numbers with `node scripts/outcome.mjs` (needs `SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY`) or the equivalent SQL against `zsvktcvqmppsshtpeljt`.

> **Read this before trusting anything below.** This file is a **snapshot**, not live state.
> The previous version was stamped *2026-08-17, Cycle 56* and had gone materially wrong: two of
> its three rulings had already been made, and its headline claim — *"every remaining item is
> blocked behind one of the five rulings below"* — was false. See `docs/self-corrections.md`
> SC-05. Re-derive from Notion and `git log` before acting.

## Rulings that were open and are now MADE — do not re-ask

| was | ruled | outcome |
|---|---|---|
| **BUG-78** — which key do `qa-session-validator` and `expand-and-log-bug` use? | 2026-09-03 (Cycle 68) | Read both Edge Functions directly (`mcp__Supabase__get_edge_function`, project `zsvktcvqmppsshtpeljt`): both construct their client with `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`. **Both use `service_role`.** `migrations/0005_bug78_scope_write_policies.sql` is a no-op for them and ships as-is with zero behavioural change. Independently re-verified 2026-09-03 by a second read of both function bodies — confirmed. Applying the migration is still human-only (`apply_migration` is forbidden-ops); the only remaining step is Kerwin running it and its 5 post-fix assertions already written into the file |
| **BUG-79 / D17** — how to enforce a DB-side doctrine gate, and at what tier | 2026-08-17 | Option **(b)**, a DB-connected sweep. D17 is in `DOCTRINE.md`, tier SAFETY. Its file-side tier entry is ACTIVE; the DB-connected sweep itself is now PENDING ON `migrations/0012_bug104_d17_sweep_rpc.sql` — the sweep's first live CI run (2026-09-03) found it depended on an `exec_sql` RPC this project never had, so `0012` proposes the real fix (a narrow, read-only, service-role-only RPC). Still human-only to apply |
| **The v0.5 schema conflict** — widen the schema, or pull the 50-term vocabulary back | 2026-08-18 (`8c966d8`) | Ruled; closed **BUG-84** and **BUG-86**. `MOVEMENT_FAMILIES` + **D19** landed (`0694308`), anchoring `groupsMatch` at the `_` separator |
| **BUG-87** — the `quad` / `quadratus_lumborum` prefix collision | fixed `4191df6` | The unanchored `startsWith` fallback is gone; D19 now forbids it |
| **BUG-102** — `long_head_tricep`/`tricep_long_head` drift between `EXERCISE_BANK` and the live `exercises` table | 2026-09-03 | Fixed live (3 rows: `straight-arm-pulldown`, `band-straight-arm-pulldown`, `db-pullover`); re-verified zero drift across all 179 rows programmatically after the fix |

## No open rulings remain in this file as of 2026-09-03

Every item that was genuinely a decision, not engineering, is now resolved above. Re-derive from
Notion and `git log` before trusting this claim on a later date — see the warning at the top of
this file.

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
1. **CI now has the credential** (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` provisioned
   2026-09-03) — `production.yml`'s `outcome` job runs this gate daily and on every push to
   `main`, `continue-on-error: true` so it reports red without blocking merges. Every "all gates
   green" claim must still separately check that job's own result — a passing `verify` says
   nothing about it, by design.
2. **Fragmentation is a real engine defect** and is worth fixing regardless of training frequency —
   a muscle trained repeatedly under a different lift name each time can never accumulate a load
   history, so progression is invisible even when it happens.

---

*Maintained by hand and by the loop. Every claim here was re-derived from Notion, `git log`, or a
live query on the date stamped at the top — not copied forward from the previous version.*
