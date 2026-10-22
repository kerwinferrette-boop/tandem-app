#!/usr/bin/env node
/**
 * bug81-principles-guard-smoke.mjs — BUG-81 (P3, ruled 2026-10-01 bug81_council =
 * downgrade_p3_build): the D16 guard must be two-sided.
 *
 * The defect: validate_science_overrides() (migrations/0009) guards workout_templates
 * INSERT/UPDATE only. program_principles had no trigger, so the citation behind a declared
 * `science_overrides` key could be deleted, re-keyed or moved while the template still named it.
 *
 * WHAT THIS GATE IS, AND IS NOT (D17, stated up front so a green line is not over-read):
 * it reads a committed .sql file. It CANNOT see Postgres, so it cannot prove the trigger is
 * installed or behaves. It proves the migration file exists and carries every clause the
 * ruling requires, so the guard cannot be silently dropped from the repo or watered down in
 * review. The closing condition for BUG-81 remains VERIFIED-APPLIED (live pg_trigger query +
 * dangling-key audit = 0), which the PROOF blocks inside the migration run at apply time.
 *
 * Assertions run against LIVE SQL only (comments stripped). The migration's header
 * deliberately names things it does not do (e.g. pg_trigger_depth); matching those would let
 * prose satisfy or violate a code check (SC-35).
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MIG = path.join(ROOT, 'migrations');
const failures = [];
const fail = (id, msg) => failures.push(`[${id}] ${msg}`);
const stripSql = (t) => t.split('\n').map(l => l.replace(/--.*$/, '')).join('\n');

// [A] the migration file exists, numbered, and is the newest of its series.
const files = readdirSync(MIG);
const hits = files.filter(f => /^\d{4}_bug81_program_principles_guard\.sql$/.test(f));
if (hits.length !== 1) {
  fail('A', `expected exactly one migrations/NNNN_bug81_program_principles_guard.sql, found ${hits.length}`);
}
const guardFile = hits[0];
let raw = '';
if (guardFile) raw = readFileSync(path.join(MIG, guardFile), 'utf8');
const live = stripSql(raw);
const L = live.replace(/\s+/g, ' ');

if (guardFile) {
  // [B] the guard function + trigger, on program_principles, covering all three operations.
  if (!/create or replace function public\.guard_program_principles_d16\(\)\s*returns trigger/i.test(live)) {
    fail('B1', 'guard_program_principles_d16() trigger function is not defined');
  }
  const trg = L.match(/create trigger trg_guard_program_principles_d16 (before [^;]*?) on public\.program_principles for each row execute function public\.guard_program_principles_d16\(\)/i);
  if (!trg) {
    fail('B2', 'trigger trg_guard_program_principles_d16 is not a BEFORE ... FOR EACH ROW trigger on public.program_principles');
  } else {
    const ev = trg[1].toLowerCase();
    if (!/\bdelete\b/.test(ev)) fail('B3', 'trigger does not cover DELETE');
    if (!/\bupdate of\b[^;]*\bprinciple_key\b/.test(ev)) fail('B4', 'trigger does not cover UPDATE of principle_key (re-key)');
    if (!/\bupdate of\b[^;]*\btemplate_id\b/.test(ev)) fail('B5', 'trigger does not cover UPDATE of template_id (reassign)');
  }

  // [C] same error vocabulary as the workout_templates path (0009), derived not hardcoded twice.
  const PREFIX = 'D16 violation: science_overrides key "%"';
  const m0009 = files.find(f => /^0009_.*science_overrides\.sql$/.test(f));
  const live0009 = m0009 ? stripSql(readFileSync(path.join(MIG, m0009), 'utf8')) : '';
  if (!live0009.includes(PREFIX)) fail('C1', `0009's INSERT/UPDATE path no longer raises "${PREFIX}" — this gate's reference text is stale`);
  if (!/raise exception\s+'D16 violation: science_overrides key "%"/i.test(live)) {
    fail('C2', `guard does not raise with the 0009 prefix "${PREFIX}"`);
  }

  // [D] the five audited design points.
  if (!/security definer/i.test(live)) fail('D1', 'not SECURITY DEFINER — under RLS the EXISTS runs as caller and fails open');
  if (!/set search_path\s*=\s*public\s*,\s*pg_temp/i.test(live)) fail('D1b', 'search_path is not pinned (public, pg_temp)');
  if (!/jsonb_exists\(.*?science_overrides.*?old\.principle_key\)/i.test(L)) {
    fail('D2', 'does not test whether the template still declares OLD.principle_key');
  }
  if (!/t\.id\s*=\s*old\.template_id/i.test(L)) fail('D2b', 'existence check is not scoped to OLD.template_id');
  if (!/tg_op = 'UPDATE' and new\.principle_key is not distinct from old\.principle_key and new\.template_id is not distinct from old\.template_id then return new/i.test(L)) {
    fail('D3', 'no early return on an UPDATE that changes neither principle_key nor template_id (seed ON CONFLICT DO UPDATE would break)');
  }
  if (/pg_trigger_depth/i.test(live)) fail('D4', 'gates the FK cascade on pg_trigger_depth; must gate on parent-template existence');
  if (!/from public\.workout_templates t where t\.id = old\.template_id/i.test(L)) {
    fail('D4b', 'cascade pass-through (parent template existence) is not the basis of the check');
  }
  if (!/\bfor update\b\s*;/i.test(L)) fail('D5', 'parent template row is not locked FOR UPDATE (READ COMMITTED race)');

  // [E] hygiene: committed-as-file, transactional, rollback documented, proofs present.
  if (!/^\s*begin;/im.test(live) || !/^\s*commit;/im.test(live)) fail('E1', 'migration body is not wrapped in begin; ... commit;');
  for (const [id, re] of [
    ['E2', /PROOF 0/], ['E3', /\(a\) DELETE refused/], ['E4', /\(b\) DELETE allowed/],
    ['E5', /\(c\) in-place edit/], ['E6', /seed re-apply/], ['E7', /savepoint a;/], ['E8', /PROOF 5/],
  ]) if (!re.test(raw)) fail(id, `apply-time proof missing from migration comments: ${re}`);
  // Nothing in this file may be an executable apply: the only live statements are the guard DDL.
  if (/\b(insert|delete from|update)\s+public\./i.test(live)) fail('E9', 'live (uncommented) DML in the migration; probes must stay commented');
}

if (failures.length) {
  console.error('BUG-81 principles-guard smoke: FAIL');
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log(`BUG-81 principles-guard smoke: PASS (${guardFile}: DELETE + UPDATE principle_key + UPDATE template_id, D16 prefix matches 0009, 5 design points + proofs present)`);
