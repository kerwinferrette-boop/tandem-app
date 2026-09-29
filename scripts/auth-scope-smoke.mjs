#!/usr/bin/env node
/**
 * auth-scope-smoke.mjs — REGRESSION GUARD for per-account local storage scoping.
 *
 * Kerwin, 2026-09-26, after signing out on his phone: "I just signed out from my
 * profile, but it didn't actually sign me out of anything... same workout, the same
 * day, the same everything... lets me know that the program is not tied to the user
 * itself, but tied to the IP address of the phone. That's not what we were going for
 * at all."
 *
 * He was right about the symptom and close on the mechanism. Every tandem_* key was a
 * FLAT, browser-global localStorage key. Identity (`currentUser`) gated only the
 * cloud-sync functions — syncFromCloud/syncToCloud/restoreFromCloud — and never the
 * local render path, so:
 *   - signOut() dropped the token and left the dashboard rendering the signed-out
 *     account's program from storage, because nothing on that path reads currentUser;
 *   - a second account signing in on the same device inherited whatever program the
 *     device already held;
 *   - the in-progress session pointer (tandem_active_session_id) was shared too, via 26
 *     raw localStorage calls that bypassed the LS wrapper entirely — a route for one
 *     account's logged sets to attach to another's open session.
 *
 * Kerwin's ruling on the anonymous path, same day: "if we just want to continue without
 * signing in, it just wouldn't allow them to save any data... but in order to track data
 * and track everything else, they should have to sign in." So the anonymous scope is
 * backed by an in-memory map and MUST NOT touch localStorage at all.
 *
 * Extracts and exercises the REAL storage layer from tandem.html (no re-implementation),
 * the same discipline program-start-smoke.mjs and lastsets-churn-smoke.mjs use.
 *
 * Run: node scripts/auth-scope-smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);
const html = readFileSync(join(root, 'tandem.html'), 'utf8');

let failures = 0;
const fails = [];
function check(label, cond) {
  if (!cond) { failures++; fails.push(label); }
}

// ── 0. Source-level guard: nothing outside the storage layer may touch localStorage ──
// This is the check with the longest reach. The scoping is only airtight while EVERY
// access goes through LS/LSraw; one stray localStorage.getItem('tandem_foo') silently
// escapes the namespace and re-opens the exact leak this gate exists to prevent. The
// legal occurrences are confined to the helper block (LS, LSraw, claimLegacyKeysInto).
{
  const helperStart = html.indexOf('// ── LS helpers ──');
  const helperEnd = html.indexOf('function setLSScope');
  check('storage layer is locatable (LS helpers block + setLSScope)', helperStart !== -1 && helperEnd > helperStart);
  const outside = html.slice(0, helperStart) + html.slice(helperEnd);
  const strays = [...outside.matchAll(/localStorage\s*\.\s*(getItem|setItem|removeItem)\s*\(/g)];
  check(`no raw localStorage access outside the storage layer (found ${strays.length}, expected 0)`, strays.length === 0);
}

// ── 0b. Wiring guards: the paths that change identity must re-point storage ──
{
  const grabFn = (name) => {
    const i = html.indexOf(`function ${name}(`);
    if (i === -1) return '';
    return html.slice(i, i + 2200);
  };
  const signOutSrc = grabFn('signOut');
  check('signOut() re-scopes storage (setLSScope)', /setLSScope\s*\(\s*null\s*\)/.test(signOutSrc));
  check('signOut() re-hydrates in-memory state', /rehydrateFromScope\s*\(\)/.test(signOutSrc));
  check('signOut() leaves the signed-in view', /showView\s*\(\s*['"]auth['"]\s*\)/.test(signOutSrc));

  const skipSrc = grabFn('skipAuth');
  check('skipAuth() enters the anonymous scope', /setLSScope\s*\(\s*null\s*\)/.test(skipSrc));
  check('skipAuth() does NOT resurrect a saved program', !/showView\s*\(\s*['"]dashboard['"]\s*\)/.test(skipSrc));

  const authListener = html.slice(html.indexOf('sb.auth.onAuthStateChange'), html.indexOf('// ── LS helpers ──'));
  check('auth listener scopes storage to the signed-in user', /setLSScope\s*\(\s*currentUser\.id\s*\)/.test(authListener));
  check('auth listener re-scopes on SIGNED_OUT', /setLSScope\s*\(\s*null\s*\)/.test(authListener));

  // Sign-out lands on the auth view, so the auth view must be at its ENTRY state.
  // sendOTP() hides authFormInner / shows authOTPState and nothing restored it, so a
  // signed-out user was dropped onto a stale "Enter Your Code" screen with no way back
  // (Kerwin, device test, 2026-09-29). Centralised in showView so the two buried entry
  // points (History > Account, Goal modal's "Sign in") are covered too.
  const showViewSrc = html.slice(html.indexOf('function showView(id)'), html.indexOf('function showView(id)') + 1400);
  check('showView() resets the auth view on entry', /id === ['"]auth['"]\s*\)\s*resetAuthView\(\)/.test(showViewSrc));

  // Bounded to the function's OWN body: a fixed-size window ran past it into sendOTP,
  // whose error branch also sets disabled = false, so the button assertion passed on
  // the wrong function's code and survived a deliberate mutation (caught 2026-09-29
  // while mutation-testing this very check — the window, not the fix, was at fault).
  const resetStart = html.indexOf('function resetAuthView() {');
  const resetEnd = html.indexOf('\n}', resetStart);
  check('resetAuthView() body is locatable', resetStart !== -1 && resetEnd > resetStart);
  const resetSrc = html.slice(resetStart, resetEnd);
  check('resetAuthView() shows the email form', /authFormInner[\s\S]{0,120}display\s*=\s*['"]block['"]/.test(resetSrc));
  check('resetAuthView() hides the code screen', /authOTPState[\s\S]{0,120}display\s*=\s*['"]none['"]/.test(resetSrc));
  check('resetAuthView() clears the stale code field', /authOTPCode[\s\S]{0,120}value\s*=\s*['"]{2}/.test(resetSrc));
  check('resetAuthView() re-enables the send button (sendOTP only restores it on error)',
    /disabled\s*=\s*false/.test(resetSrc));
  check('the "Back" button uses the shared reset rather than its own inline toggle',
    /onclick="resetAuthView\(\)"/.test(html));

  const init = html.slice(html.indexOf('// INIT — check auth session then restore program'));
  const scopeAt = init.search(/setLSScope\s*\(\s*currentUser\.id\s*\)/);
  const cfgReadAt = init.search(/LS\.get\(\s*['"]tandem_cfg['"]\s*\)/);
  check('init scopes storage BEFORE reading tandem_cfg', scopeAt !== -1 && cfgReadAt !== -1 && scopeAt < cfgReadAt);
}

// ── 1. Extract and run the REAL storage layer ──
const helperStart = html.indexOf('const ANON_SCOPE');
const helperEnd = html.indexOf('// Re-reads the in-memory mirrors');
const storageSrc = html.slice(helperStart, helperEnd);

function makeLocalStorage() {
  const map = new Map();
  return {
    _map: map,
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
  };
}

function loadLayer(localStorageShim) {
  const sandbox = { localStorage: localStorageShim, console };
  vm.createContext(sandbox);
  vm.runInContext(storageSrc, sandbox);
  return vm.runInContext('({LS, LSraw, setLSScope, claimLegacyKeysInto, lsKey, ANON_SCOPE, _anonStore})', sandbox);
}

const UID_A = 'e636007d-194f-4440-a2cc-9bc514957c64'; // Kerwin
const UID_B = '3a6e34b7-d197-47b4-bedb-de49bbe552fb'; // Dani

// ── 2. Two accounts on one device cannot see each other's program ──
{
  const store = makeLocalStorage();
  const { LS, setLSScope } = loadLayer(store);

  setLSScope(UID_A);
  LS.set('tandem_cfg', { goal: 'build_muscle', days: 5 });
  LS.set('tandem_history', [{ session_date: '2026-09-21', day_type: 'day2', completed: true }]);

  setLSScope(UID_B);
  check('account B cannot read account A cfg', LS.get('tandem_cfg') === null);
  check('account B cannot read account A history', LS.get('tandem_history') === null);

  LS.set('tandem_cfg', { goal: 'fat_burn', days: 3 });
  check("account B's own write is isolated", LS.get('tandem_cfg').goal === 'fat_burn');

  setLSScope(UID_A);
  check('account A cfg survives B writing its own', LS.get('tandem_cfg').goal === 'build_muscle');
  check('account A history intact', LS.get('tandem_history').length === 1);
}

// ── 3. The in-progress session pointer is scoped too (the raw-key path) ──
// This is the one that could cross-attach logged sets between accounts, the same shape
// as the 2026-09-21 incident where sets landed on a session that did not own them.
{
  const store = makeLocalStorage();
  const { LSraw, setLSScope } = loadLayer(store);

  setLSScope(UID_A);
  LSraw.set('tandem_active_session_id', 'session-belonging-to-A');
  LSraw.set('tandem_session_start_time', '1758000000000');

  setLSScope(UID_B);
  check('account B does not inherit A open session id', LSraw.get('tandem_active_session_id') === null);
  check('account B does not inherit A session start time', LSraw.get('tandem_session_start_time') === null);

  setLSScope(UID_A);
  check('account A open session id intact', LSraw.get('tandem_active_session_id') === 'session-belonging-to-A');
}

// ── 4. Anonymous mode saves NOTHING durable (Kerwin's ruling) ──
{
  const store = makeLocalStorage();
  const { LS, LSraw, setLSScope } = loadLayer(store);

  setLSScope(null);
  LS.set('tandem_cfg', { goal: 'build_muscle', days: 4 });
  LS.set('tandem_history', [{ session_date: '2026-09-29' }]);
  LSraw.set('tandem_active_session_id', 'anon-session');

  check('anonymous mode is usable within the session', LS.get('tandem_cfg').goal === 'build_muscle');
  check('anonymous mode writes NOTHING to localStorage', store._map.size === 0);

  // ...and it does not survive a scope change (sign-in), nor leak into the account.
  setLSScope(UID_A);
  check('anonymous data does not leak into a signed-in account', LS.get('tandem_cfg') === null);
  setLSScope(null);
  check('anonymous data does not survive leaving the scope', LS.get('tandem_cfg') === null);
}

// ── 5. Sign-out leaves nothing readable, but destroys nothing ──
{
  const store = makeLocalStorage();
  const { LS, setLSScope } = loadLayer(store);

  setLSScope(UID_A);
  LS.set('tandem_cfg', { goal: 'build_muscle', days: 5 });

  setLSScope(null); // what signOut() does
  check('after sign-out the program is not readable', LS.get('tandem_cfg') === null);

  setLSScope(UID_A); // signing back in
  check('signing back in restores the account program', LS.get('tandem_cfg').goal === 'build_muscle');
}

// ── 6. Legacy flat keys are claimed ONCE, by the first real account ──
// Every existing install has flat keys holding real training history. They must survive
// the upgrade for their owner, and must NOT be handed to a second account that later
// signs in on the same device.
{
  const store = makeLocalStorage();
  store.setItem('tandem_cfg', JSON.stringify({ goal: 'build_muscle', days: 5 }));
  store.setItem('tandem_history', JSON.stringify([{ session_date: '2026-09-21' }]));
  store.setItem('tandem_active_session_id', 'legacy-open-session');
  const { LS, LSraw, setLSScope } = loadLayer(store);

  setLSScope(UID_A);
  check('legacy cfg is claimed by the first signed-in account', LS.get('tandem_cfg')?.goal === 'build_muscle');
  check('legacy history is claimed', LS.get('tandem_history')?.length === 1);
  check('legacy raw session pointer is claimed', LSraw.get('tandem_active_session_id') === 'legacy-open-session');
  check('legacy flat cfg key is removed after claiming', store.getItem('tandem_cfg') === null);

  setLSScope(UID_B);
  check('a second account does NOT inherit the claimed legacy data', LS.get('tandem_cfg') === null);
}

// ── 6b. An anonymous session must never consume the previous owner's legacy data ──
//
// NOTE ON REACHABILITY, stated rather than implied: the layer boots already in the
// anonymous scope, so the setLSScope(null) calls in init/skipAuth early-return and
// never reach the claim at all. The guard is therefore defense-in-depth on the
// scope-CHANGE path (sign-out, token expiry), not a currently-reachable end-to-end
// bug. It is asserted directly below rather than through a contrived flow that would
// misrepresent how it is reached — an honest unit assertion beats a staged one.
{
  const store = makeLocalStorage();
  store.setItem('tandem_cfg', JSON.stringify({ goal: 'build_muscle', days: 5 }));
  const { LS, setLSScope, claimLegacyKeysInto, ANON_SCOPE } = loadLayer(store);

  // Direct: the claim must refuse the anonymous scope outright.
  claimLegacyKeysInto(ANON_SCOPE);
  check('claimLegacyKeysInto refuses the anonymous scope', store.getItem('tandem_cfg') !== null);
  check('claimLegacyKeysInto(anon) sets no claim marker', store.getItem('tandem_legacy_claimed') === null);

  // Via the scope-change path: a real account, then sign-out, with legacy still unclaimed.
  setLSScope(UID_A);
  store.setItem('tandem_history', JSON.stringify([{ session_date: '2026-09-10' }])); // unclaimed legacy
  setLSScope(null); // sign-out transition — must not consume it
  check('sign-out transition does not consume legacy data', store.getItem('tandem_history') !== null);
  check('anonymous scope cannot read legacy data', LS.get('tandem_cfg') === null);

  setLSScope(UID_A); // the real owner signs back in
  check('the real owner still reads their claimed program', LS.get('tandem_cfg')?.goal === 'build_muscle');
}

// ── Report ──
const total = 37;
if (failures) {
  console.error(`auth scope smoke — FAIL (${failures} of ${total})`);
  fails.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
console.log('auth scope smoke — PASS (per-account isolation, scoped session pointer, anonymous saves nothing, sign-out clears the view, legacy claimed once)');
