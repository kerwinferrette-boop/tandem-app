#!/usr/bin/env node
// test-port-range-smoke.mjs — random test-server ports must be ones Chromium will load.
//
// Origin: 2026-10-13 the EPIC-63 control reachability walkthrough failed with
// `page.goto: net::ERR_UNSAFE_PORT localhost:10080`. It picked PORT = 9820 + floor(random*400),
// a range that contains 10080 — one of Chromium's restricted ports — so ~1 run in 400 went red for a
// reason unrelated to the code under test; an immediate re-run passed. A gate whose red can mean
// "the dice landed badly" teaches people to re-run it, and a real failure gets re-run away too.
// Reproduced in isolation with a real Chromium: 10080 -> ERR_UNSAFE_PORT, 10081 -> loads.
//
// FIX SHAPE (council 2026-10-14, after an earlier hard-coded-blocklist helper was rejected): no list
// to maintain. Chromium's restricted ports (net/base/port_util.cc kRestrictedPorts) top out at 10080,
// and Linux hands out ephemeral ports from 32768 up. Every random test port therefore lives in
// (10080, 32768): above every restricted port, below the OS's own outbound-socket range.
//
// WHAT THIS GATE DOES (static, no browser, no network):
//   finds every `Math.random()` that sits in a port expression in any scripts/**/*.mjs (any identifier
//   containing "port", any case, either operand order), parses base + span, and fails if
//     - the expression cannot be parsed (a form this gate cannot reason about is a failure, not a pass),
//     - base <= 10080, or base + span (+1 for an API_PORT = APP_PORT + 1 sibling) > 32767.
//   A canary fails the gate if it finds fewer than 5 such expressions (the scan lost its target).
//
// HONEST LIMIT: it trusts that 10080 is the highest restricted port. That is Chromium's published
// list as recalled from source, not fetched at run time. If Chromium ever restricts a port above
// 10080, raise FLOOR here. Ports are not checked for being free (never were).
//
// Run: node scripts/test-port-range-smoke.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const FLOOR = 10080;      // highest port in Chromium's restricted list; ports must be > FLOOR
const CEIL = 32767;       // below Linux's default ephemeral range (32768-60999)
const root = process.env.PORT_SMOKE_DIR || dirname(fileURLToPath(import.meta.url));

function* walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { if (n !== 'node_modules') yield* walk(p); }
    else if (n.endsWith('.mjs') && n !== 'test-port-range-smoke.mjs') yield p;
  }
}
const A = /(\d+)\s*\+\s*Math\.(?:floor|round|ceil|trunc)\(\s*Math\.random\(\)\s*\*\s*(\d+)\s*\)/;   // BASE + floor(random*N)
const B = /Math\.(?:floor|round|ceil|trunc)\(\s*Math\.random\(\)\s*\*\s*(\d+)\s*\)\s*\+\s*(\d+)/;   // floor(random*N) + BASE

const fails = []; let parsed = 0;
for (const f of walk(root)) {
  const rel = relative(root, f);
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (!/Math\.random\(\)/.test(line) || !/port/i.test(line)) return;
    if (/^\s*(\/\/|\*)/.test(line)) return;                       // commentary, not code
    let base, span, m;
    if ((m = A.exec(line))) { base = +m[1]; span = +m[2]; }
    else if ((m = B.exec(line))) { span = +m[1]; base = +m[2]; }
    else { fails.push(`${rel}:${i + 1} random port expression cannot be parsed: ${line.trim().slice(0, 110)}`); return; }
    parsed++;
    const hi = base + span - 1 + 1;                               // +1 covers API_PORT = APP_PORT + 1
    if (base <= FLOOR) fails.push(`${rel}:${i + 1} port range starts at ${base}, must be > ${FLOOR} (Chromium refuses ${FLOOR} with ERR_UNSAFE_PORT)`);
    if (hi > CEIL) fails.push(`${rel}:${i + 1} port range reaches ${hi}, must be <= ${CEIL} (OS ephemeral range starts at 32768)`);
  });
}
if (parsed < 5) fails.push(`only ${parsed} random-port expressions found under scripts/ - the scan lost its target (expected >= 5)`);

if (fails.length) { console.error(`FAIL - ${fails.length} problem(s):`); fails.forEach(x => console.error('  ' + x)); process.exit(1); }
console.log(`PASS - ${parsed} random test-port ranges, all within (${FLOOR}, ${CEIL}]; none can hit a Chromium-restricted port`);
