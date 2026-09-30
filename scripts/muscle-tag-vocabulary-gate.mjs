#!/usr/bin/env node
/**
 * muscle-tag-vocabulary-gate.mjs — BUG-173: the standing check Kerwin's ruling ordered
 * (Decision Queue 2026-09-26, card `bug102_close`, choice `add_a_guard`:
 * "Close it, but add a standing check so drift fails loudly").
 *
 * WHAT IT ENFORCES: the muscle-tag vocabulary (union of every muscleGroups.primary[]
 * and muscleGroups.secondary[] element) in EXERCISE_BANK stays in exact agreement with
 * the production `exercises` table's vocabulary. The two agreeing was a FACT, not an
 * INVARIANT — the last divergence was found by a user-filed bug report (BUG-102) whose
 * own premise was then wrong for 23 days.
 *
 * DESIGN (BUG-173's "honest design question", answered as option b):
 *   - OFFLINE (always, inside `npm run verify`): bank vocabulary is diffed against a
 *     committed DB-derived snapshot, scripts/fixtures/db-muscle-tag-vocabulary.json.
 *     Deterministic, credential-free, fails at commit time.
 *   - LIVE (only when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are present — CI):
 *     fetches the real table and diffs bank↔live AND snapshot↔live (stale-snapshot
 *     detection). When creds are absent it prints an explicit SKIPPED line — never a
 *     silent pass, because a check that silently passes when it cannot reach the
 *     database reports safety it never verified.
 *   - Refresh: with creds set, `node scripts/muscle-tag-vocabulary-gate.mjs
 *     --write-snapshot` regenerates the fixture. Never hand-edit it.
 *
 * METHOD NOTE (the BUG-102 trap, verbatim requirement): comparison is exact set
 * membership in JS. NO SQL LIKE/ILIKE anywhere — `_` is a single-character wildcard
 * in LIKE, and `ILIKE '%long_head_tricep%'` once matched the substring
 * `long_head,tricep` spanning two adjacent array elements, reporting 2 hits where the
 * true count is 0. The live half fetches raw arrays over REST and compares in JS, so
 * no pattern matching ever touches a tag.
 *
 * Both directions are reported separately because they have different causes:
 *   - code-only tags → a bank edit whose seed regen/apply was skipped;
 *   - db-only tags   → an out-of-band database change (or a bank deletion not applied).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const SNAPSHOT_PATH = join(root, 'scripts', 'fixtures', 'db-muscle-tag-vocabulary.json');

// ── Code-side vocabulary, extracted from EXERCISE_BANK itself (same vm loader as
//    reachability-smoke.mjs — never a hand-maintained duplicate list).
const src = readFileSync(join(root, 'programs.js'), 'utf8');
const ctx = { window: {}, document: { querySelectorAll: () => [] },
              localStorage: { getItem: () => null, setItem: () => {} } };
vm.createContext(ctx);
vm.runInContext(src + ';globalThis.__X = { bank: EXERCISE_BANK };', ctx);
const bank = ctx.__X.bank;
const slugs = Object.keys(bank);
if (slugs.length < 100) throw new Error(`Bank suspiciously small (${slugs.length}) — extraction broken?`);

const bankVocab = new Set();
for (const s of slugs) {
  for (const t of bank[s].muscleGroups?.primary || []) bankVocab.add(t);
  for (const t of bank[s].muscleGroups?.secondary || []) bankVocab.add(t);
}

const sorted = (set) => [...set].sort();
const diff = (a, b) => sorted(a).filter((t) => !b.has(t)); // exact membership, no patterns

let failed = false;
function report(label, onlyA, onlyB, dirA, dirB) {
  if (!onlyA.length && !onlyB.length) {
    console.log(`✓ ${label}: vocabularies identical (${bankVocab.size} tags).`);
    return;
  }
  failed = true;
  console.error(`✗ ${label}: vocabularies DIFFER.`);
  if (onlyA.length) console.error(`    ${dirA} (${onlyA.length}): ${onlyA.join(', ')}`);
  if (onlyB.length) console.error(`    ${dirB} (${onlyB.length}): ${onlyB.join(', ')}`);
}

// ── 1. OFFLINE: bank ↔ committed snapshot ──────────────────────────────────
const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
const snapVocab = new Set(snapshot.tags);
report(
  'bank ↔ committed DB snapshot',
  diff(bankVocab, snapVocab), diff(snapVocab, bankVocab),
  'in EXERCISE_BANK but not the DB snapshot — bank edit not yet applied to prod (regen seed via sync-exercise-bank.mjs, apply it, then --write-snapshot)',
  'in the DB snapshot but not EXERCISE_BANK — tag removed from bank, or out-of-band DB change; reconcile, then --write-snapshot'
);

// ── 2. LIVE: only when credentials are present (CI) ────────────────────────
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url && key) {
  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/exercises?select=muscle_primary,muscle_secondary&limit=1000`, {
    headers: { apikey: key, authorization: `Bearer ${key}` },
  });
  if (!res.ok) { console.error(`✗ live fetch failed: HTTP ${res.status} ${await res.text()}`); process.exit(1); }
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length < 100) { console.error(`✗ live fetch returned ${rows?.length} rows — refusing to compare against a suspiciously small table.`); process.exit(1); }
  const liveVocab = new Set();
  for (const r of rows) for (const t of [...(r.muscle_primary || []), ...(r.muscle_secondary || [])]) liveVocab.add(t);

  if (process.argv.includes('--write-snapshot')) {
    snapshot.tags = sorted(liveVocab);
    snapshot._generated = `${new Date().toISOString().slice(0, 10)} via --write-snapshot (live REST fetch, ${rows.length} rows)`;
    writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n');
    console.log(`✓ snapshot rewritten from live DB (${liveVocab.size} tags, ${rows.length} rows). Commit it.`);
  }

  report('bank ↔ LIVE exercises table', diff(bankVocab, liveVocab), diff(liveVocab, bankVocab),
    'in EXERCISE_BANK but not the live DB', 'in the live DB but not EXERCISE_BANK');
  report('committed snapshot ↔ LIVE exercises table (stale-snapshot check)',
    diff(new Set(snapshot.tags), liveVocab), diff(liveVocab, new Set(snapshot.tags)),
    'in snapshot but not live DB', 'in live DB but not snapshot — refresh with --write-snapshot');
} else {
  console.log('⚠ SKIPPED live DB comparison — SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set (CI-only secret).');
  console.log('  The offline half above still ran. The live per-slug tag comparison also runs in CI as the A2 gate (prod-integration.mjs), which subsumes vocabulary agreement.');
}

process.exit(failed ? 1 : 0);
