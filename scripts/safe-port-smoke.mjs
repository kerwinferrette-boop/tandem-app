#!/usr/bin/env node
// safe-port-smoke.mjs — the Playwright gates must never pick a port Chromium refuses.
//
// Origin: 2026-10-13 the EPIC-63 walkthrough failed with `net::ERR_UNSAFE_PORT localhost:10080`
// (its range 9820-10219 contained 10080); an immediate re-run passed. A gate that goes red about
// 1 run in 400 for a reason unrelated to the code is worse than none: people learn to re-run it.
//
//   [P1] no scripts/*.mjs picks a port with the raw `BASE + Math.floor(Math.random()*N)` pattern
//        (use pickPort from scripts/lib/safe-port.mjs) — the static guard against reversion.
//   [P2] pickPort never returns a restricted port, exhaustively: every one of the N possible draws
//        for every range the scripts actually use is fed through it.
//   [P3] real Chromium still refuses 10080 and loads 10081 — keeps the list honest on the one entry
//        that collided in practice. (The full list is Chromium's kRestrictedPorts; see the helper.)
//
// Run: node scripts/safe-port-smoke.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';
import { pickPort, CHROMIUM_RESTRICTED_PORTS } from './lib/safe-port.mjs';

const dir = dirname(fileURLToPath(import.meta.url));
const fails = [];

// P1
const RAW = /\b[A-Z_]*PORT\s*=\s*\d+\s*\+\s*Math\.floor\(\s*Math\.random\(\)/;
const ranges = new Set();
for (const f of readdirSync(dir).filter(f => f.endsWith('.mjs') && f !== 'safe-port-smoke.mjs')) {
  const s = readFileSync(join(dir, f), 'utf8');
  if (RAW.test(s)) fails.push(`[P1] ${f} picks a port with the raw random pattern — use pickPort() from scripts/lib/safe-port.mjs`);
  for (const m of s.matchAll(/pickPort\(\s*(\d+)\s*,\s*(\d+)\s*\)/g)) ranges.add(`${m[1]},${m[2]}`);
}
if (ranges.size < 5) fails.push(`[P1] only ${ranges.size} pickPort ranges found across scripts/ — the scan lost its target (expected >= 5)`);

// P2 — exhaustive over every draw of every range in use
let draws = 0;
for (const r of ranges) {
  const [base, span] = r.split(',').map(Number);
  for (let k = 0; k < span; k++) {
    draws++;
    // stateful stub: first call yields draw k, each re-draw advances to the next draw (wrapping),
    // so a restricted draw is retried against a DIFFERENT value, as Math.random would
    let j = k; const rand = () => (j++ % span) / span;
    const p = pickPort(base, span, rand);
    if (CHROMIUM_RESTRICTED_PORTS.has(p)) fails.push(`[P2] pickPort(${base}, ${span}) returned restricted port ${p} for draw ${k}`);
    if (p < base) fails.push(`[P2] pickPort(${base}, ${span}) returned ${p} below its base`);
  }
}

// P3 — a real browser
async function tryLoad(port) {
  const s = http.createServer((q, r) => r.end('ok'));
  await new Promise(r => s.listen(port, r));
  const b = await chromium.launch(); const p = await b.newPage();
  try { await p.goto(`http://localhost:${port}/`); return 'loaded'; }
  catch (e) { return /ERR_UNSAFE_PORT/.test(e.message) ? 'unsafe' : 'other:' + e.message.split('\n')[0]; }
  finally { await b.close(); s.close(); }
}
const a = await tryLoad(10080), c = await tryLoad(10081);
if (a !== 'unsafe') fails.push(`[P3] expected Chromium to refuse 10080 with ERR_UNSAFE_PORT, got ${a} — the restricted-port premise changed`);
// the set must contain every port the real browser was just observed to refuse — otherwise P2 would
// pass against a set that had silently lost the one entry that actually collided
if (a === 'unsafe' && !CHROMIUM_RESTRICTED_PORTS.has(10080)) fails.push('[P3] Chromium refuses 10080 but CHROMIUM_RESTRICTED_PORTS no longer contains it');
if (c !== 'loaded') fails.push(`[P3] expected 10081 to load, got ${c}`);

if (fails.length) { console.error(`FAIL — ${fails.length} problem(s):`); fails.forEach(f => console.error('  ' + f)); process.exit(1); }
console.log(`PASS — ${ranges.size} port ranges, ${draws} draws, none restricted; no raw random-port pattern in scripts/; Chromium refuses 10080 (ERR_UNSAFE_PORT) and loads 10081`);
