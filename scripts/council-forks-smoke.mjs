#!/usr/bin/env node
/**
 * council-forks-smoke.mjs — regression guard for the two code fixes shipped on the
 * unanimous llm-council verdict of 2026-10-13.
 * Verdict artifact: docs/council/council-forks-2026-10-13-bug191-197-202.md
 *
 *   BUG-191 — reorderWeek() deleted. It wrote `tandem_day_order`, a key nothing else read,
 *             then toasted "Moved to the back of this week — nothing lost". The reorder never
 *             happened and the toast said it did.
 *   BUG-197 — the user's colour has ONE home, `users.theme_color`, reached through
 *             cfg.themeColor. The Settings picker used to write `profile.colorTheme` (local
 *             only) plus `users.color_theme` — a column that DOES NOT EXIST in Postgres, so
 *             that write failed 42703 on every pick and was swallowed silently.
 *
 * WHY BOTH LIVE IN ONE FILE: they are the same defect class and the same ruling — a rule with
 * more than one home. Splitting them would imply they can be reasoned about separately, and
 * the council's whole point was that they cannot.
 *
 * BUG-202's guard is NOT here on purpose: its regression surface is the absence of assertions
 * in scripts/calibration-upsert-smoke.mjs, which that file documents itself, plus the
 * KNOWN_OPEN entry removed from scripts/column-reachability-smoke.mjs — whose [B] ratchet
 * fails if anyone reintroduces the write. The gate already exists; a second one would be
 * decoration.
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const raw = readFileSync(path.join(ROOT, 'tandem.html'), 'utf8');
// SC-35, and it bit again on the first run of this very file: strip BOTH comment syntaxes
// before matching. tandem.html now carries an HTML comment at the old button's site and a
// JS comment at the old function's site, each QUOTING the patterns under test —
// "reorderWeek", "tandem_day_order", "Moved to the back of this week". Stripping only `//`
// lines left the <!-- --> block in, and [191-b], [191-c] and [191-d] all failed against my
// own explanation of the fix. A gate that cannot tell code from prose about code is not a
// gate. `live` is the only source any absence check may use.
const stripJs = (t) => t.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
const stripHtml = (t) => t.replace(/<!--[\s\S]*?-->/g, '');
const code = stripJs(raw);                 // JS-comment-free: for shape checks
const markup = stripHtml(raw);             // HTML-comment-free: for markup checks
const live = stripJs(stripHtml(raw));      // both gone: the ONLY source for "X is absent"

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};

// ══════════════ BUG-191 — the lying button is gone, mechanism and all ══════════════

check('[191-a] reorderWeek() no longer exists', !/function\s+reorderWeek\s*\(/.test(live),
  'the function is back — it writes a key nothing reads and toasts that it worked');
check('[191-b] nothing calls reorderWeek()', !/reorderWeek\s*\(/.test(live),
  'a caller survives, so some control still invokes it');
check('[191-c] tandem_day_order is gone entirely, including the scoped-key list',
  !/tandem_day_order/.test(live),
  'the key is back. It had exactly three refs and two were inside reorderWeek itself');
// The TOAST was the real defect: a no-op button is a small lie, a toast asserting motion
// manufactures confidence, which CLAUDE.md names as worse than no gate at all.
check('[191-d] the "Moved to the back of this week" toast string is gone',
  !/Moved to the back of this week/.test(live),
  'the claim is back in the source — if some control re-earns it, it must be TRUE this time');
// And the replacement must not quietly become a button again.
const skipModal = markup.slice(markup.indexOf('id="modal-skip"'), markup.indexOf('id="modal-exhistory"'));
check('[191-e] the skip modal still offers exactly ONE action, "Skip ahead"',
  (skipModal.match(/<button/g) || []).length === 2,   // the ✕ close + skip ahead
  `found ${(skipModal.match(/<button/g) || []).length} buttons — expected 2 (close, Skip ahead). ` +
  'A third means a new action was added here without a verdict');
check('[191-f] the honest replacement line is present and is NOT clickable',
  /Your next session picks this workout back up/.test(skipModal) &&
  !/onclick[^>]*>\s*<div[^>]*>Just leave it/.test(skipModal),
  'the reassurance is true without a button — nextProgramDayKey() serves the next UNPERFORMED day');

// ══════════════ BUG-197 — one home for the user's colour ══════════════

check('[197-a] the users.color_theme write is gone (that column does not exist in Postgres)',
  !/color_theme/.test(live),
  'restored: a PostgREST write naming a nonexistent column, failing 42703 unseen on every pick');
check('[197-b] profile.colorTheme is no longer WRITTEN (one home, not two)',
  !/profile\.colorTheme\s*=/.test(live),
  'a second local home for the same rule is back');
check('[197-c] userThemeColor() exists and is the single resolver',
  /function\s+userThemeColor\s*\(/.test(code));
// Both readers must go through the owner rather than re-deriving. This is the assertion that
// catches the silo coming back, which [197-c] alone would not.
const readers = [...code.matchAll(/userThemeColor\(\)/g)].length;
check(`[197-d] every reader resolves through it (found ${readers} call sites, need >= 3)`,
  readers >= 3,
  'the definition, the boot accent and the Settings swatch state — if one re-derives locally the rule has two homes again');
check('[197-e] the picker writes cfg.themeColor and syncs it',
  /cfg\.themeColor\s*=\s*hex/.test(code) && /function applyColorTheme[\s\S]{0,900}?syncToCloud\(/.test(code),
  'the pick must reach users.theme_color — the column the duel, the dashboard and the takeover read');
// applyColorTakeover is the owner's aesthetic call; this gate must not be read as blessing a
// change to it, so it asserts only that it is still THERE and untouched by this fix.
check('[197-f] applyColorTakeover() is still present and still reads theme_color',
  /function applyColorTakeover\s*\(/.test(code) && /function applyColorTakeover[\s\S]{0,600}?theme_color/.test(code),
  'the leader-colour mechanic was deliberately NOT changed — that is Kerwin\'s design call, filed not shipped');

// ══════════════ BEHAVIOURAL — run the real functions, do not just match on them ══════════════
// Static checks above prove the shapes. These prove the behaviour, which is the difference
// between "wired" and "working".

function grab(name) {
  const at = code.indexOf(`function ${name}(`);
  if (at === -1) { console.error(`FAIL  could not slice ${name}() — has it been renamed?`); process.exit(1); }
  return code.slice(at, code.indexOf('\n}', at) + 2);
}

function run({ cfgThemeColor, legacyPick }) {
  const store = { tandem_profile: legacyPick ? { colorTheme: legacyPick } : {} };
  const ctx = {
    console, document: { querySelectorAll: () => [] },
    LS: { get: (k) => store[k], set: (k, v) => { store[k] = v; } },
    cfg: cfgThemeColor ? { themeColor: cfgThemeColor } : {},
    currentUser: { id: 'u1' },
    applyAccentColor: (hex) => { ctx.__painted = hex; },
    syncToCloud: () => { ctx.__synced = true; },
    __painted: null, __synced: false, __store: store,
  };
  vm.createContext(ctx);
  new vm.Script([grab('userThemeColor'), grab('applyColorTheme'),
    'this.__api = { userThemeColor, applyColorTheme };'].join('\n')).runInContext(ctx);
  return ctx;
}

const a = run({ cfgThemeColor: '#4A9EFF' });
check('[197-g] the owner prefers cfg.themeColor (the users.theme_color mirror)',
  a.__api.userThemeColor() === '#4A9EFF', `got ${a.__api.userThemeColor()}`);

// The migration path matters: a colour picked BEFORE this fix only ever reached
// profile.colorTheme. Reverting those users to their onboarding colour would be a silent
// regression dressed as a cleanup.
const b = run({ legacyPick: '#E85454' });
check('[197-h] a pre-fix local pick is still honoured when cfg has no colour yet',
  b.__api.userThemeColor() === '#E85454',
  `got ${b.__api.userThemeColor()} — existing users must not silently revert to onboarding's choice`);

const c = run({ cfgThemeColor: '#1B5E38' });
c.__api.applyColorTheme('#e8547a');
check('[197-i] picking a colour updates the ONE home and persists it',
  c.cfg.themeColor === '#e8547a' && c.__store['tandem_cfg']?.themeColor === '#e8547a',
  `cfg.themeColor=${c.cfg.themeColor}, stored=${JSON.stringify(c.__store['tandem_cfg'])}`);
check('[197-j] and pushes it to the cloud, so the pick reaches the competition',
  c.__synced === true,
  'without syncToCloud the pick stays on one device and Dani never sees the new colour');
check('[197-k] it paints immediately too (no reload needed)', c.__painted === '#e8547a',
  `painted ${c.__painted}`);
check('[197-l] and it does NOT write the old local home', c.__store['tandem_profile']?.colorTheme === undefined,
  `tandem_profile = ${JSON.stringify(c.__store['tandem_profile'])} — the second home is back`);

console.log(failures === 0
  ? '\ncouncil-forks-smoke: PASS — BUG-191 deleted at the mechanism, BUG-197 has one home'
  : `\ncouncil-forks-smoke: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
