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
// WHAT THIS GATE DOES (static, no browser, no network). For every scripts/**/*.mjs:
//   [R1] each `BASE + Math.floor(Math.random()*N)` / `Math.floor(Math.random()*N) + BASE` expression (floor/round/
//        ceil/trunc; operands may span lines; any identifier) is parsed, and must satisfy BASE > 10080 and
//        BASE + N + 1 <= 32767 (the +1 covers an API_PORT = APP_PORT + 1 sibling);
//   [R2] in a script that serves HTTP (contains `.listen(`), ANY other use of `Math.random` - an alias such as
//        `const r = Math.random`, a draw assigned to a variable and added to a base later, a form that does not
//        match R1 - is a failure, because this gate cannot reason about it (fail closed, not open);
//   [R3] in a script that does not serve HTTP, a leftover `Math.random` on a line that mentions "port" fails too;
//   [R4] a canary fails the gate if it parses fewer than 10 R1 expressions (the scan lost its target).
// NOT covered, said plainly: a port taken from the environment or computed without Math.random, and a script
// that serves HTTP through something other than a `.listen(` call.
// A `Math.random` that follows a `//` inside a string literal on the same line (e.g. after 'http://') is hidden by
// the comment stripper; no script does this today.
//
// SOURCE OF THE PREMISE (checked 2026-10-14, not fetched at run time): Chromium's net/base/port_util.cc
// `kRestrictedPorts` ends with `10080, // Amanda` (seen via search of
// https://chromium.googlesource.com/chromium/src/+/main/net/base/port_util.cc; the host itself was not
// fetchable from this sandbox), and it follows the WHATWG Fetch Standard's blocked-ports list. Observed
// empirically: a real Chromium returned net::ERR_UNSAFE_PORT for 10080 and loaded 10081. 32767 is one below
// the Linux default ephemeral start (32768); macOS/Windows start at 49152, higher still. Do not 'tidy' the
// ceiling upward.
//
// HONEST LIMIT: if Chromium ever restricts a port above 10080, raise FLOOR here. Ports are not checked for
// being free (never were).
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
const A = /(\d+)\s*\+\s*Math\.(?:floor|round|ceil|trunc)\(\s*Math\.random\(\)\s*\*\s*(\d+)\s*\)/g;   // BASE + floor(random*N)
const B = /Math\.(?:floor|round|ceil|trunc)\(\s*Math\.random\(\)\s*\*\s*(\d+)\s*\)\s*\+\s*(\d+)/g;   // floor(random*N) + BASE
const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
const lineOf = (t, i) => t.slice(0, i).split('\n').length;

const fails = []; let parsed = 0;
for (const f of walk(root)) {
  const rel = relative(root, f);
  const text = strip(readFileSync(f, 'utf8'));
  const serves = /\.listen\(/.test(text);
  let left = text;
  const check = (base, span, idx) => {
    parsed++;
    const hi = base + span - 1 + 1;                               // +1 covers API_PORT = APP_PORT + 1
    if (base <= FLOOR) fails.push(`${rel}:${lineOf(text, idx)} port range starts at ${base}, must be > ${FLOOR} (Chromium refuses ${FLOOR} with ERR_UNSAFE_PORT)`);
    if (hi > CEIL) fails.push(`${rel}:${lineOf(text, idx)} port range reaches ${hi}, must be <= ${CEIL} (OS ephemeral range starts at 32768)`);
  };
  for (const m of text.matchAll(A)) { check(+m[1], +m[2], m.index); left = left.replace(m[0], ' '.repeat(m[0].length)); }
  for (const m of text.matchAll(B)) { check(+m[2], +m[1], m.index); left = left.replace(m[0], ' '.repeat(m[0].length)); }
  // R2 / R3: whatever Math.random is left over
  left.split('\n').forEach((line, i) => {
    if (!/Math\.random\b/.test(line)) return;
    if (serves || /port/i.test(line)) fails.push(`${rel}:${i + 1} Math.random is used in a way this gate cannot parse${serves ? ' in a script that serves HTTP' : ''}: ${line.trim().slice(0, 100)}`);
  });
}
if (parsed < 10) fails.push(`only ${parsed} random-port expressions parsed under scripts/ - the scan lost its target (expected >= 10)`);

if (fails.length) { console.error(`FAIL - ${fails.length} problem(s):`); fails.forEach(x => console.error('  ' + x)); process.exit(1); }
console.log(`PASS - ${parsed} random test-port ranges, all within (${FLOOR}, ${CEIL}]; none can hit a Chromium-restricted port`);
