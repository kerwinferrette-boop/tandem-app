// BUG-255 — Settings must offer an editable display name whose handler writes users.name.
// Reads the WORKING TREE (not a git blob). Run: node scripts/profile-name-smoke.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');
const fail = [];
const modal = html.slice(html.indexOf('id="modal-profile"'));
if (!/<input[^>]*type="text"[^>]*id="profileNameInput"|<input[^>]*id="profileNameInput"[^>]*type="text"/.test(modal)) fail.push('no text input #profileNameInput in the profile modal');
if (!/onclick="saveProfileName\(\)"/.test(modal)) fail.push('no Save Name control wired to saveProfileName()');
const m = html.match(/async function saveProfileName\(\) \{[\s\S]*?\n\}\n/);
if (!m) fail.push('saveProfileName() missing');
else {
  const f = m[0];
  if (!/from\('users'\)\.upsert\(\{ id: currentUser\.id, name\b/.test(f)) fail.push('handler does not upsert users.name for the signed-in id');
  if (!/\.trim\(\)/.test(f) || !/if \(!name\)/.test(f)) fail.push('handler does not reject empty/whitespace');
  if (!/const \{ error \}/.test(f)) fail.push('handler ignores the write error');
  if (!/myLbRow\.name = name/.test(f)) fail.push('cached leaderboard row not patched (Home would show old name)');
  if (!/renderYouTab\(\)/.test(f) || !/renderDashboard\(\)/.test(f)) fail.push('surfaces not re-rendered');
}
if (!/profileNameInput'\)[\s\S]{0,80}userTargets\?\.name/.test(html)) fail.push('openProfileModal does not prefill from userTargets.name');
if (fail.length) { console.error('FAIL BUG-255 profile name:\n - ' + fail.join('\n - ')); process.exit(1); }
console.log('PASS BUG-255 profile name affordance + handler present');
