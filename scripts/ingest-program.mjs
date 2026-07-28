#!/usr/bin/env node
/**
 * ingest-program.mjs — Phase B scaffold for the daily program-ingestion loop (EPIC-031).
 *
 * WHY THIS EXISTS (see .claude/loop-config.md "Daily-run program ingestion" + CLAUDE.md
 * Prime Directive): the eventual daily loop has Claude find one acclaimed program online,
 * structure it, and write it into the Living Program Library own-brand with provenance.
 * This script is the deterministic, testable skeleton that write step runs through — it does
 * NOT do the research/structuring itself (that's a future phase's job). It takes a structured
 * JSON payload and safely, idempotently, auditably gets it into the schema, or refuses to.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * SOURCE-FIRST FLAG (read this before trusting any column name below): the task brief that
 * commissioned this script described template_blocks/template_days/template_exercises/
 * program_principles columns that do NOT match the live schema. Per CLAUDE.md's Prime
 * Directive ("consult the canonical source before reasoning or writing code"), this file was
 * written against the LIVE schema, verified read-only via Supabase MCP `list_tables` against
 * project zsvktcvqmppsshtpeljt on 2026-07-28 — not against the brief. Concretely, the brief
 * was wrong about:
 *   - template_blocks: column is `block_order`, not `block_index`.
 *   - template_days: no `theme_tags` column exists at all; `muscle_targets` is a text[]
 *     (Postgres ARRAY), not jsonb.
 *   - template_exercises: FK column is `day_id`, not `template_day_id`; order column is
 *     `ex_order`, not `order_index`; volume columns are `sets` (int) and `reps` (text, e.g.
 *     "8-12"), not `target_sets`/`target_reps`; there is NO `target_rpe` column and NO
 *     `superset_group` column; there IS a required `rest` (int, seconds) column the brief
 *     never mentioned.
 *   - program_principles: columns are `principle_key` (unique), `claim`, `rationale`,
 *     `source_citation`, `created_by`, `template_id`, `created_at`. There is NO `category`
 *     column and NO `confidence` column and NO `provenance_url` column — the "valid
 *     categories" list in the brief does not correspond to anything persisted.
 *   - workout_templates: matches fairly well, but `author_id` (FK -> auth.users) is REQUIRED
 *     (NOT NULL, no default) and `days_per_week` (int, checked 2-6) is REQUIRED — neither is
 *     mentioned in the brief at all. `duration_weeks` is checked 4-12 in the DB, not just >0.
 * This is exactly the failure mode the Prime Directive exists to catch — a plausible-sounding
 * briefing that was never checked against the source. Flagging it here in-line rather than
 * silently "fixing" it, per CLAUDE.md: "when the source is silent or ambiguous, SAY SO."
 *
 * D16 JUSTIFICATION LINKAGE — also verified against a live row, not invented: the existing
 * "Brick by Brick" template (id 3b4093c6-11d3-45f4-a068-9304a0a0979d) carries
 * science_overrides = {"rep_floor": 3} and a program_principles row with
 * principle_key = "rep_floor" for that same template_id. So the established convention is:
 * a science_overrides key is justified by a program_principles row on the SAME template
 * whose principle_key equals that key, exactly. This script enforces that convention — it
 * does not invent a category/confidence scheme the schema has no room for.
 *
 * WHAT THIS SCRIPT DOES, IN ORDER (see main() at the bottom):
 *   1. Parse args / --help (no DB touched).
 *   2. Read + parse the --file JSON payload.
 *   3. Structural validation (Requirement 6) — shape, enums, ranges. No DB needed yet.
 *   4. Own-brand guard (Requirement 5) — denylist + source_provenance non-empty.
 *   5. D16 precondition (Requirement 4) — science_overrides keys vs. principle_key match.
 *   6. Connect to Supabase via env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
 *   7. Schema-guard (Requirement 1) — verify every required table/column exists live.
 *   8. Resolve every exercise reference against the live `exercises` table (Requirement 6).
 *   9. Idempotency check by slug (Requirement 2).
 *   10. Print the dry-run plan (Requirement 3) — always printed, even when --commit is passed.
 *   11. If --commit: write (insert, or update-in-place behind --update); otherwise exit 0.
 *
 * Supabase access: this script is standalone — it does NOT import tandem.html's `sb` client
 * (that's a browser global wired to `@supabase/supabase-js` via a CDN <script> tag, not
 * reachable from Node) and there is no existing server-side Supabase client pattern anywhere
 * in scripts/*.mjs to follow. So the DB layer here is a single injectable factory,
 * `createDbClient()`, built on Node's built-in `fetch` against Supabase's PostgREST REST API
 * (no new dependency). Credentials are supplied ONLY via environment variables — this file
 * never hardcodes or invents a key:
 *   - SUPABASE_URL                 e.g. https://zsvktcvqmppsshtpeljt.supabase.co
 *   - SUPABASE_SERVICE_ROLE_KEY    required. Every ingest-relevant table has RLS enabled
 *                                  (verified live); the anon/publishable key tandem.html uses
 *                                  cannot write here, and schema introspection reads are
 *                                  also safest with the service role. Kerwin supplies this;
 *                                  never commit it.
 *
 * Exit codes: 0 = success (including "dry run OK" and "already exists, skipped"). 1 = any
 * failure (bad args, bad JSON, failed validation, failed guard, schema missing, DB error).
 *
 * This is NOT added to `npm run verify` — it needs network + live credentials, and the ship
 * gate must never depend on network access (CLAUDE.md instruction).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);

// ── The live schema this script guards against (verified 2026-07-28, see header) ──────────
const REQUIRED_SCHEMA = {
  workout_templates: ['id', 'slug', 'name', 'author_id', 'is_published', 'author_attribution',
    'parent_goal', 'code_goal_mapping', 'duration_weeks', 'days_per_week', 'split_type',
    'intensity_tier', 'difficulty', 'tagline', 'description', 'coaching_notes',
    'science_overrides', 'source_provenance'],
  template_blocks: ['id', 'template_id', 'block_order', 'week_start', 'week_end', 'name',
    'rep_scheme_by_week', 'technique_by_week'],
  template_days: ['id', 'template_id', 'block_id', 'day_order', 'label', 'muscle_targets'],
  template_exercises: ['id', 'day_id', 'exercise_id', 'ex_order', 'sets', 'reps', 'rest',
    'role', 'technique', 'constant_across_program'],
  program_principles: ['id', 'principle_key', 'claim', 'rationale', 'source_citation',
    'created_by', 'template_id', 'created_at'],
  exercises: ['id', 'slug', 'name', 'tier', 'category'],
};

// Live CHECK constraints worth failing fast on (avoids an opaque Postgres 400 mid-write).
const PARENT_GOALS = ['build_muscle', 'fat_burn', 'transform', 'strength', 'maintenance'];
const CODE_GOAL_MAPPINGS = ['build_muscle', 'fat_burn', 'transform'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const ROLES = ['primary_compound', 'secondary_compound', 'accessory', 'core', 'cardio'];
const TECHNIQUES = ['rest_pause', 'drop_set', 'cardioacceleration', 'staggered'];
// split_type has NO live DB check constraint — this is an app-level rule (Requirement 6 only).
const SPLIT_TYPES = ['body_part', 'push_pull_legs', 'upper_lower', 'full_body', 'custom'];

// ── Own-brand guard denylist (Requirement 5) — simple and honest, not exhaustive ───────────
const TRADEMARK_DENYLIST = [
  'starting strength', '5/3/1', '531', 'stronglifts', 'phul', 'phat', 'gzclp', 'gzcl',
  'smolov', 'sheiko', 'candito', 'texas method', 'madcow', 'bulgarian method',
  'westside barbell', 'conjugate method', 'nsuns', 'greyskull', 'juggernaut method',
  'wendler', 'p90x', 'insanity', 'crossfit', 'orangetheory', 'f45', 'beachbody',
];

const HELP = `
ingest-program.mjs — Phase B scaffold for the Tandem program-ingestion loop (EPIC-031)

USAGE
  node scripts/ingest-program.mjs --file <path.json> [--commit] [--update]
  node scripts/ingest-program.mjs --help

FLAGS
  --file <path>   Required (unless --help). Path to a structured program JSON payload.
  --commit        Actually write to Supabase. Without this flag the script is a DRY RUN:
                  it prints exactly what it would do and exits 0 without touching the DB.
  --update        If a workout_templates row with this slug already exists, replace its
                  blocks/days/exercises/principles and update its own columns in place,
                  instead of skipping. Has no effect without --commit. Without --update,
                  an existing slug is always skipped (safe to re-run — Requirement 2).
  --help, -h      Print this message and exit 0.

ENVIRONMENT (never hardcoded — see the file header for why)
  SUPABASE_URL                Supabase project REST URL, e.g. https://<ref>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY   Service-role key. Every table this script touches has RLS
                              enabled; writes need this, not the anon/publishable key.

EXAMPLE
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \\
    node scripts/ingest-program.mjs --file scripts/fixtures/example-ingest.json
  # add --commit (and --update, if re-running against an existing slug) once the dry run
  # output looks right.

DOCUMENTED JSON SHAPE (see scripts/fixtures/example-ingest.json for a full worked example)
  {
    "slug": "string, required, unique",
    "name": "string, required",
    "author_id": "uuid, required — a real auth.users id. This script validates the FORMAT
                  only; it cannot check the auth schema over the public REST API, so an
                  invalid id surfaces as a DB error at write time, not a pre-flight one.",
    "is_published": false,
    "author_attribution": "string, optional",
    "parent_goal": "one of ${PARENT_GOALS.join('|')}",
    "code_goal_mapping": "one of ${CODE_GOAL_MAPPINGS.join('|')}",
    "duration_weeks": "int, 4-12 (live DB CHECK constraint)",
    "days_per_week": "int, 2-6 (live DB CHECK constraint; NOT in the original brief)",
    "split_type": "one of ${SPLIT_TYPES.join('|')} (app-level rule; no live DB constraint)",
    "intensity_tier": "string, optional",
    "difficulty": "one of ${DIFFICULTIES.join('|')}",
    "tagline": "string, optional",
    "description": "string, optional",
    "coaching_notes": "string, optional",
    "science_overrides": "object, optional, default {}. Each key MUST be justified — see
                          D16 below.",
    "source_provenance": "non-empty object, REQUIRED by the own-brand guard (Requirement 5)",
    "blocks": [{
      "block_order": "int, required, 1-based",
      "name": "string, optional",
      "week_start": "int, required, >=1",
      "week_end": "int, required, <= duration_weeks, >= week_start",
      "rep_scheme_by_week": "object, optional, default {}",
      "technique_by_week": "object, optional, default {}",
      "days": [{
        "day_order": "int, required, 1-based within the block",
        "label": "string, required",
        "muscle_targets": "array of strings, optional, default []",
        "exercises": [{
          "exercise_slug": "string — looked up against the live exercises table",
          "exercise_id": "uuid — alternative to exercise_slug, validated against the live table",
          "ex_order": "int, required, 1-based within the day",
          "sets": "int, 1-10, required",
          "reps": "string, required, e.g. \\"8-12\\"",
          "rest": "int (seconds), required",
          "role": "one of ${ROLES.join('|')}",
          "technique": "one of ${TECHNIQUES.join('|')} or null",
          "constant_across_program": "boolean, optional, default false"
        }]
      }]
    }],
    "principles": [{
      "principle_key": "string, required, unique within the template",
      "claim": "string, required",
      "rationale": "string, required",
      "source_citation": "string, required",
      "created_by": "uuid, optional"
    }]
  }

  D16 (science_overrides justification): every key in science_overrides must exactly match
  the principle_key of at least one entry in "principles" on the SAME template — verified
  against a live worked example (the "Brick by Brick" template, science_overrides.rep_floor
  <-> program_principles.principle_key "rep_floor"). This is NOT a category/confidence
  scheme — the live schema has no such columns. An unjustified key refuses the whole ingest.
`;

// ── CLI args ────────────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { file: null, commit: false, update: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--commit') args.commit = true;
    else if (a === '--update') args.update = true;
    else if (a === '--file') { args.file = argv[++i]; }
    else if (a.startsWith('--file=')) { args.file = a.slice('--file='.length); }
    else { console.error(`Unrecognized argument: ${a}\n`); args.help = true; args.badArg = true; }
  }
  return args;
}

// ── Structural validation (Requirement 6, minus the exercise_id/live-table piece) ─────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isPlainObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v);

function validateStructure(p) {
  const errors = [];
  const req = (cond, msg) => { if (!cond) errors.push(msg); };

  req(isPlainObject(p), 'payload must be a JSON object');
  if (!isPlainObject(p)) return errors; // nothing else is checkable

  req(isNonEmptyString(p.slug), 'slug: required non-empty string');
  req(isNonEmptyString(p.name), 'name: required non-empty string');
  req(isNonEmptyString(p.author_id) && UUID_RE.test(p.author_id),
    'author_id: required, must be a UUID (required NOT NULL FK in the live schema — cannot be verified against auth.users over REST, but the format is checked here)');
  req(PARENT_GOALS.includes(p.parent_goal), `parent_goal: must be one of ${PARENT_GOALS.join('|')}`);
  req(CODE_GOAL_MAPPINGS.includes(p.code_goal_mapping), `code_goal_mapping: must be one of ${CODE_GOAL_MAPPINGS.join('|')}`);
  req(Number.isInteger(p.duration_weeks) && p.duration_weeks > 0, 'duration_weeks: must be a positive integer');
  if (Number.isInteger(p.duration_weeks) && (p.duration_weeks < 4 || p.duration_weeks > 12)) {
    errors.push(`duration_weeks: ${p.duration_weeks} is outside the live DB's CHECK constraint (4-12) — the write would be rejected by Postgres`);
  }
  req(Number.isInteger(p.days_per_week) && p.days_per_week >= 2 && p.days_per_week <= 6,
    'days_per_week: required integer 2-6 (live DB CHECK constraint — not in the original brief, but NOT NULL in the live schema)');
  if (p.split_type !== undefined && p.split_type !== null) {
    req(SPLIT_TYPES.includes(p.split_type), `split_type: must be one of ${SPLIT_TYPES.join('|')}`);
  }
  req(DIFFICULTIES.includes(p.difficulty), `difficulty: must be one of ${DIFFICULTIES.join('|')}`);
  req(p.science_overrides === undefined || isPlainObject(p.science_overrides), 'science_overrides: must be an object if present');
  req(isPlainObject(p.source_provenance) && Object.keys(p.source_provenance).length > 0,
    'source_provenance: required, must be a non-empty object (own-brand guard, Requirement 5)');

  req(Array.isArray(p.blocks) && p.blocks.length > 0, 'blocks: required non-empty array');
  const durationWeeks = Number.isInteger(p.duration_weeks) ? p.duration_weeks : null;
  (p.blocks || []).forEach((b, bi) => {
    const tag = `blocks[${bi}]`;
    req(isPlainObject(b), `${tag}: must be an object`);
    if (!isPlainObject(b)) return;
    req(Number.isInteger(b.block_order) && b.block_order >= 1, `${tag}.block_order: required positive integer`);
    req(Number.isInteger(b.week_start) && b.week_start >= 1, `${tag}.week_start: required integer >= 1`);
    req(Number.isInteger(b.week_end) && b.week_end >= (b.week_start ?? 1), `${tag}.week_end: required integer >= week_start`);
    if (durationWeeks != null && Number.isInteger(b.week_end) && b.week_end > durationWeeks) {
      errors.push(`${tag}: week_end (${b.week_end}) exceeds duration_weeks (${durationWeeks})`);
    }
    req(b.rep_scheme_by_week === undefined || isPlainObject(b.rep_scheme_by_week), `${tag}.rep_scheme_by_week: must be an object if present`);
    req(b.technique_by_week === undefined || isPlainObject(b.technique_by_week), `${tag}.technique_by_week: must be an object if present`);
    req(Array.isArray(b.days) && b.days.length > 0, `${tag}.days: required non-empty array (every template_day belongs to a declared block by construction — nested here, not cross-referenced)`);
    (b.days || []).forEach((d, di) => {
      const dtag = `${tag}.days[${di}]`;
      req(isPlainObject(d), `${dtag}: must be an object`);
      if (!isPlainObject(d)) return;
      req(Number.isInteger(d.day_order) && d.day_order >= 1, `${dtag}.day_order: required positive integer`);
      req(isNonEmptyString(d.label), `${dtag}.label: required non-empty string`);
      req(d.muscle_targets === undefined || (Array.isArray(d.muscle_targets) && d.muscle_targets.every((m) => typeof m === 'string')),
        `${dtag}.muscle_targets: must be an array of strings if present`);
      req(Array.isArray(d.exercises) && d.exercises.length > 0, `${dtag}.exercises: required non-empty array`);
      (d.exercises || []).forEach((e, ei) => {
        const etag = `${dtag}.exercises[${ei}]`;
        req(isPlainObject(e), `${etag}: must be an object`);
        if (!isPlainObject(e)) return;
        req(isNonEmptyString(e.exercise_slug) || (isNonEmptyString(e.exercise_id) && UUID_RE.test(e.exercise_id)),
          `${etag}: must supply exercise_slug or a UUID exercise_id`);
        req(Number.isInteger(e.ex_order) && e.ex_order >= 1, `${etag}.ex_order: required positive integer`);
        req(Number.isInteger(e.sets) && e.sets >= 1 && e.sets <= 10, `${etag}.sets: required integer 1-10 (live DB CHECK constraint)`);
        req(isNonEmptyString(e.reps), `${etag}.reps: required non-empty string (e.g. "8-12")`);
        req(Number.isInteger(e.rest) && e.rest >= 0, `${etag}.rest: required non-negative integer (seconds)`);
        req(ROLES.includes(e.role), `${etag}.role: must be one of ${ROLES.join('|')}`);
        if (e.technique !== undefined && e.technique !== null) {
          req(TECHNIQUES.includes(e.technique), `${etag}.technique: must be one of ${TECHNIQUES.join('|')} or null`);
        }
      });
    });
  });

  if (p.principles !== undefined) {
    req(Array.isArray(p.principles), 'principles: must be an array if present');
    (p.principles || []).forEach((pr, pi) => {
      const tag = `principles[${pi}]`;
      req(isPlainObject(pr), `${tag}: must be an object`);
      if (!isPlainObject(pr)) return;
      req(isNonEmptyString(pr.principle_key), `${tag}.principle_key: required non-empty string`);
      req(isNonEmptyString(pr.claim), `${tag}.claim: required non-empty string`);
      req(isNonEmptyString(pr.rationale), `${tag}.rationale: required non-empty string`);
      req(isNonEmptyString(pr.source_citation), `${tag}.source_citation: required non-empty string`);
    });
  }

  return errors;
}

// ── Own-brand guard (Requirement 5) ────────────────────────────────────────────────────────
function ownBrandGuard(p) {
  const errors = [];
  const haystack = [p.name, p.description, p.tagline].filter(isNonEmptyString).join(' \n ').toLowerCase();
  for (const denied of TRADEMARK_DENYLIST) {
    if (haystack.includes(denied)) {
      errors.push(`name/description/tagline appears to reference a known commercial program name ("${denied}") — refusing. Rebuild the concept own-brand instead of importing it verbatim.`);
    }
  }
  if (!isPlainObject(p.source_provenance) || Object.keys(p.source_provenance).length === 0) {
    errors.push('source_provenance must be a non-empty object — sovereignty requires provenance, not a nicety.');
  }
  return errors;
}

// ── D16 precondition (Requirement 4) ───────────────────────────────────────────────────────
// Verified convention (not invented): science_overrides key <-> program_principles.principle_key
// on the SAME template, exact match. See the live "Brick by Brick" example in the file header.
function checkD16(p) {
  const errors = [];
  const overrides = isPlainObject(p.science_overrides) ? p.science_overrides : {};
  const principles = Array.isArray(p.principles) ? p.principles : [];
  const principleKeys = new Set(principles.filter(isPlainObject).map((pr) => pr.principle_key));
  for (const key of Object.keys(overrides)) {
    if (!principleKeys.has(key)) {
      errors.push(`science_overrides["${key}"] has no matching program_principles entry with principle_key === "${key}" on this template — D16 requires sovereignty with provenance. Add a principles[] entry or remove the override.`);
    }
  }
  return errors;
}

// Distinguishes a genuine "schema is missing X" PostgREST error from an auth/network/other
// failure that merely LOOKS like a missing table/column. A permission-denied or unreachable
// response must never be reported as "column missing" — that would be a false, misleading
// diagnosis (this exact confusion was caught and fixed in testing: a network-egress 403 with
// a plain-text body was initially misread as "every column is missing").
function classifyPostgrestError(r) {
  const body = r.body;
  if (isPlainObject(body) && typeof body.code === 'string') {
    if (body.code === '42P01') return { kind: 'table_missing', message: body.message };
    if (body.code === '42703') return { kind: 'column_missing', message: body.message };
    return { kind: 'not_schema', message: `DB error ${body.code}: ${body.message || JSON.stringify(body)}` };
  }
  return { kind: 'not_schema', message: `request failed with HTTP ${r.status}: ${typeof body === 'string' ? body.slice(0, 300) : JSON.stringify(body)}` };
}

// ── DB layer (single injectable factory) ───────────────────────────────────────────────────
function createDbClient({ url, key }) {
  if (!isNonEmptyString(url) || !isNonEmptyString(key)) return null;
  const base = url.replace(/\/+$/, '');

  async function request(method, path, { body, headers = {}, prefer } = {}) {
    let res;
    try {
      res = await fetch(`${base}/rest/v1/${path}`, {
        method,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          ...(prefer ? { Prefer: prefer } : {}),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new Error(`could not reach Supabase at ${base}: ${e.message} (check SUPABASE_URL and network access)`);
    }
    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : null; } catch { json = text; }
    return { ok: res.ok, status: res.status, body: json };
  }

  return {
    /** Probes whether `columns` exist on `table`, live. Never writes. */
    async probeColumns(table, columns) {
      const all = await request('GET', `${table}?select=${columns.join(',')}&limit=1`);
      if (all.ok) return { ok: true, tableExists: true, missing: [], diagnostic: null };
      const classified = classifyPostgrestError(all);
      if (classified.kind === 'not_schema') return { ok: false, tableExists: null, missing: [], diagnostic: classified.message };
      if (classified.kind === 'table_missing') return { ok: false, tableExists: false, missing: columns, diagnostic: null };
      // Table exists but the joint select failed on a column — isolate which one(s).
      const missing = [];
      for (const col of columns) {
        const r = await request('GET', `${table}?select=${col}&limit=1`);
        if (r.ok) continue;
        const c = classifyPostgrestError(r);
        if (c.kind === 'not_schema') return { ok: false, tableExists: null, missing: [], diagnostic: c.message };
        missing.push(col);
      }
      return { ok: missing.length === 0, tableExists: true, missing, diagnostic: null };
    },
    async findTemplateBySlug(slug) {
      const r = await request('GET', `workout_templates?select=id,slug&slug=eq.${encodeURIComponent(slug)}&limit=1`);
      if (!r.ok) throw new Error(`lookup by slug failed: ${JSON.stringify(r.body)}`);
      return Array.isArray(r.body) && r.body.length ? r.body[0] : null;
    },
    async fetchExercisesBySlug(slugs) {
      if (!slugs.length) return [];
      const r = await request('GET', `exercises?select=id,slug&slug=in.(${slugs.map(encodeURIComponent).join(',')})`);
      if (!r.ok) throw new Error(`exercise slug lookup failed: ${JSON.stringify(r.body)}`);
      return r.body || [];
    },
    async fetchExercisesById(ids) {
      if (!ids.length) return [];
      const r = await request('GET', `exercises?select=id&id=in.(${ids.join(',')})`);
      if (!r.ok) throw new Error(`exercise id lookup failed: ${JSON.stringify(r.body)}`);
      return r.body || [];
    },
    async insertTemplate(row) {
      const r = await request('POST', 'workout_templates', { body: row, prefer: 'return=representation' });
      if (!r.ok) throw new Error(`insert workout_templates failed: ${JSON.stringify(r.body)}`);
      return r.body[0];
    },
    async updateTemplate(id, row) {
      const r = await request('PATCH', `workout_templates?id=eq.${id}`, { body: row, prefer: 'return=representation' });
      if (!r.ok) throw new Error(`update workout_templates failed: ${JSON.stringify(r.body)}`);
      return r.body[0];
    },
    async insertBlock(row) {
      const r = await request('POST', 'template_blocks', { body: row, prefer: 'return=representation' });
      if (!r.ok) throw new Error(`insert template_blocks failed: ${JSON.stringify(r.body)}`);
      return r.body[0];
    },
    async insertDay(row) {
      const r = await request('POST', 'template_days', { body: row, prefer: 'return=representation' });
      if (!r.ok) throw new Error(`insert template_days failed: ${JSON.stringify(r.body)}`);
      return r.body[0];
    },
    async insertExercises(rows) {
      if (!rows.length) return [];
      const r = await request('POST', 'template_exercises', { body: rows, prefer: 'return=representation' });
      if (!r.ok) throw new Error(`insert template_exercises failed: ${JSON.stringify(r.body)}`);
      return r.body;
    },
    async insertPrinciples(rows) {
      if (!rows.length) return [];
      const r = await request('POST', 'program_principles', { body: rows, prefer: 'return=representation' });
      if (!r.ok) throw new Error(`insert program_principles failed: ${JSON.stringify(r.body)}`);
      return r.body;
    },
    async deleteTemplateChildren(templateId) {
      const days = await request('GET', `template_days?select=id&template_id=eq.${templateId}`);
      const dayIds = (days.ok && days.body) ? days.body.map((d) => d.id) : [];
      if (dayIds.length) {
        const r = await request('DELETE', `template_exercises?day_id=in.(${dayIds.join(',')})`);
        if (!r.ok) throw new Error(`delete template_exercises failed: ${JSON.stringify(r.body)}`);
      }
      let r = await request('DELETE', `template_days?template_id=eq.${templateId}`);
      if (!r.ok) throw new Error(`delete template_days failed: ${JSON.stringify(r.body)}`);
      r = await request('DELETE', `template_blocks?template_id=eq.${templateId}`);
      if (!r.ok) throw new Error(`delete template_blocks failed: ${JSON.stringify(r.body)}`);
      r = await request('DELETE', `program_principles?template_id=eq.${templateId}`);
      if (!r.ok) throw new Error(`delete program_principles failed: ${JSON.stringify(r.body)}`);
    },
  };
}

// ── Schema-guard (Requirement 1) ───────────────────────────────────────────────────────────
async function schemaGuard(db) {
  const failures = [];
  for (const [table, columns] of Object.entries(REQUIRED_SCHEMA)) {
    const result = await db.probeColumns(table, columns);
    if (!result.ok) {
      if (result.diagnostic) {
        failures.push(`could not verify table "${table}" — ${result.diagnostic} (this looks like a credentials/permissions/network problem, NOT necessarily a missing-schema problem — check SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and connectivity before assuming the schema is absent)`);
      } else if (result.tableExists === false) {
        failures.push(`table "${table}" does not exist`);
      } else {
        failures.push(`table "${table}" is missing column(s): ${result.missing.join(', ')}`);
      }
    }
  }
  return failures;
}

// ── Exercise resolution (Requirement 6, live-table piece) ─────────────────────────────────
async function resolveExercises(db, program) {
  const errors = [];
  const bySlugNeeded = new Set();
  const byIdNeeded = new Set();
  for (const b of program.blocks || []) {
    for (const d of b.days || []) {
      for (const e of d.exercises || []) {
        if (isNonEmptyString(e.exercise_slug)) bySlugNeeded.add(e.exercise_slug);
        else if (isNonEmptyString(e.exercise_id)) byIdNeeded.add(e.exercise_id);
      }
    }
  }
  const slugRows = await db.fetchExercisesBySlug([...bySlugNeeded]);
  const slugToId = new Map(slugRows.map((r) => [r.slug, r.id]));
  const idRows = await db.fetchExercisesById([...byIdNeeded]);
  const validIds = new Set(idRows.map((r) => r.id));

  for (const slug of bySlugNeeded) {
    if (!slugToId.has(slug)) errors.push(`exercise_slug "${slug}" does not resolve against the live exercises table`);
  }
  for (const id of byIdNeeded) {
    if (!validIds.has(id)) errors.push(`exercise_id "${id}" does not resolve against the live exercises table`);
  }
  return { errors, slugToId };
}

// ── Dry-run plan ────────────────────────────────────────────────────────────────────────────
function buildPlan(program, { existing, mode }) {
  const blockCount = (program.blocks || []).length;
  const dayCount = (program.blocks || []).reduce((n, b) => n + (b.days || []).length, 0);
  const exerciseCount = (program.blocks || []).reduce((n, b) =>
    n + (b.days || []).reduce((m, d) => m + (d.exercises || []).length, 0), 0);
  const principleCount = (program.principles || []).length;
  const overrideKeys = Object.keys(program.science_overrides || {});

  let action;
  if (existing && !mode.update) action = 'SKIP (slug already exists — pass --update to replace in place)';
  else if (existing && mode.update) action = 'UPDATE IN PLACE (delete + reinsert blocks/days/exercises/principles, patch template row)';
  else action = 'INSERT (new template)';

  return {
    action,
    willWrite: mode.commit && !(existing && !mode.update),
    slug: program.slug,
    existingId: existing ? existing.id : null,
    counts: { blocks: blockCount, days: dayCount, exercises: exerciseCount, principles: principleCount },
    scienceOverrideKeys: overrideKeys,
  };
}

function printPlan(plan, mode) {
  console.log(`\n── INGEST PLAN (${mode.commit ? 'COMMIT' : 'DRY RUN — nothing will be written'}) ──`);
  console.log(`  slug: ${plan.slug}`);
  console.log(`  action: ${plan.action}`);
  if (plan.existingId) console.log(`  existing row id: ${plan.existingId}`);
  console.log(`  would write: blocks=${plan.counts.blocks} days=${plan.counts.days} exercises=${plan.counts.exercises} principles=${plan.counts.principles}`);
  if (plan.scienceOverrideKeys.length) {
    console.log(`  science_overrides keys (D16-justified): ${plan.scienceOverrideKeys.join(', ')}`);
  }
}

// ── Write path ──────────────────────────────────────────────────────────────────────────────
async function writeProgram(db, program, { existing, update }, slugToId) {
  const resolveId = (e) => (e.exercise_slug ? slugToId.get(e.exercise_slug) : e.exercise_id);
  const templateRow = {
    slug: program.slug,
    name: program.name,
    author_id: program.author_id,
    is_published: !!program.is_published,
    author_attribution: program.author_attribution ?? null,
    parent_goal: program.parent_goal,
    code_goal_mapping: program.code_goal_mapping,
    duration_weeks: program.duration_weeks,
    days_per_week: program.days_per_week,
    split_type: program.split_type ?? null,
    intensity_tier: program.intensity_tier ?? null,
    difficulty: program.difficulty,
    tagline: program.tagline ?? null,
    description: program.description ?? null,
    coaching_notes: program.coaching_notes ?? null,
    science_overrides: program.science_overrides ?? {},
    source_provenance: program.source_provenance,
  };

  let templateId;
  if (existing && update) {
    await db.deleteTemplateChildren(existing.id);
    const updated = await db.updateTemplate(existing.id, templateRow);
    templateId = updated.id;
  } else {
    const inserted = await db.insertTemplate(templateRow);
    templateId = inserted.id;
  }

  for (const b of program.blocks || []) {
    const block = await db.insertBlock({
      template_id: templateId,
      block_order: b.block_order,
      name: b.name ?? null,
      week_start: b.week_start,
      week_end: b.week_end,
      rep_scheme_by_week: b.rep_scheme_by_week ?? {},
      technique_by_week: b.technique_by_week ?? {},
    });
    for (const d of b.days || []) {
      const day = await db.insertDay({
        template_id: templateId,
        block_id: block.id,
        day_order: d.day_order,
        label: d.label,
        muscle_targets: d.muscle_targets ?? [],
      });
      const exerciseRows = (d.exercises || []).map((e) => ({
        day_id: day.id,
        exercise_id: resolveId(e),
        ex_order: e.ex_order,
        sets: e.sets,
        reps: e.reps,
        rest: e.rest,
        role: e.role,
        technique: e.technique ?? null,
        constant_across_program: !!e.constant_across_program,
      }));
      await db.insertExercises(exerciseRows);
    }
  }

  const principleRows = (program.principles || []).map((pr) => ({
    principle_key: pr.principle_key,
    claim: pr.claim,
    rationale: pr.rationale,
    source_citation: pr.source_citation,
    created_by: pr.created_by ?? null,
    template_id: templateId,
  }));
  await db.insertPrinciples(principleRows);

  return templateId;
}

// ── Main ────────────────────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    process.exit(args.badArg ? 1 : 0);
  }
  if (!args.file) {
    console.error('Missing required --file <path.json>. Run with --help for usage.');
    process.exit(1);
  }

  let raw;
  try {
    raw = readFileSync(resolve(process.cwd(), args.file), 'utf8');
  } catch (e) {
    console.error(`Could not read --file "${args.file}": ${e.message}`);
    process.exit(1);
  }
  let program;
  try {
    program = JSON.parse(raw);
  } catch (e) {
    console.error(`--file "${args.file}" is not valid JSON: ${e.message}`);
    process.exit(1);
  }

  // Requirement 6 (structural piece) — never touch the DB with a malformed payload.
  const structuralErrors = validateStructure(program);
  if (structuralErrors.length) {
    console.error(`\n${structuralErrors.length} STRUCTURAL VALIDATION ERROR(S):`);
    for (const e of structuralErrors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  // Requirement 5 — own-brand guard.
  const brandErrors = ownBrandGuard(program);
  if (brandErrors.length) {
    console.error(`\n${brandErrors.length} OWN-BRAND GUARD FAILURE(S):`);
    for (const e of brandErrors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  // Requirement 4 — D16 precondition.
  const d16Errors = checkD16(program);
  if (d16Errors.length) {
    console.error(`\n${d16Errors.length} D16 PRECONDITION FAILURE(S) — sovereignty requires provenance:`);
    for (const e of d16Errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  const db = createDbClient({ url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY });
  if (!db) {
    console.error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY environment variables. See --help.');
    process.exit(1);
  }

  // Requirement 1 — schema-guard, before any read/write against the ingest tables.
  let schemaFailures;
  try {
    schemaFailures = await schemaGuard(db);
  } catch (e) {
    console.error(`Schema-guard could not run: ${e.message}`);
    process.exit(1);
  }
  if (schemaFailures.length) {
    console.error(`\n${schemaFailures.length} SCHEMA-GUARD FAILURE(S) — refusing to write to a half-present schema:`);
    for (const f of schemaFailures) console.error(`  ✗ ${f}`);
    process.exit(1);
  }

  // Requirement 6 — exercise_id resolution against the live table.
  let exerciseErrors, slugToId;
  try {
    ({ errors: exerciseErrors, slugToId } = await resolveExercises(db, program));
  } catch (e) {
    console.error(`Exercise resolution failed: ${e.message}`);
    process.exit(1);
  }
  if (exerciseErrors.length) {
    console.error(`\n${exerciseErrors.length} EXERCISE RESOLUTION ERROR(S):`);
    for (const e of exerciseErrors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  // Requirement 2 — idempotency by slug.
  let existing;
  try {
    existing = await db.findTemplateBySlug(program.slug);
  } catch (e) {
    console.error(`Slug lookup failed: ${e.message}`);
    process.exit(1);
  }

  // Requirement 3 — always print the plan, dry run or not.
  const plan = buildPlan(program, { existing, mode: args });
  printPlan(plan, args);

  if (!args.commit) {
    console.log('\nDry run complete — nothing was written. Pass --commit to write.');
    process.exit(0);
  }

  if (existing && !args.update) {
    console.log(`\nSlug "${program.slug}" already exists (id ${existing.id}) — skipping (idempotent no-op). Pass --update to replace it in place.`);
    process.exit(0);
  }

  try {
    const templateId = await writeProgram(db, program, { existing, update: args.update && !!existing }, slugToId);
    console.log(`\n✓ ${existing ? 'Updated' : 'Inserted'} workout_templates row ${templateId} ("${program.slug}").`);
    console.log('Note: writes are per-table REST calls, not a single DB transaction — this is a known Phase B scaffold limitation, not a silent atomicity guarantee.');
    process.exit(0);
  } catch (e) {
    console.error(`\nWRITE FAILED: ${e.message}`);
    console.error('The write may be partially applied (no cross-table transaction in this scaffold — see the note above). Re-run with --update once the payload is fixed.');
    process.exit(1);
  }
}

main();
