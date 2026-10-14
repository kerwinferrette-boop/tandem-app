// safe-port.mjs — pick a random local test-server port that Chromium will actually load.
//
// WHY THIS EXISTS: Chromium refuses to navigate to a fixed list of "restricted" ports
// (net/base/port_util.cc, kRestrictedPorts) with net::ERR_UNSAFE_PORT, no matter what is
// listening there. The Playwright walkthroughs picked `BASE + Math.floor(Math.random()*N)`.
// control-reachability-walkthrough.mjs drew from 9820-10219, which contains 10080, so that
// gate failed on roughly 1 run in 400 for a reason unrelated to the code under test (seen
// 2026-10-13: `page.goto: net::ERR_UNSAFE_PORT localhost:10080` while an immediate re-run
// passed). Reproduced in isolation: port 10080 -> ERR_UNSAFE_PORT, 10081 -> loads.
//
// Fix at the mechanism: one helper, never returns a restricted port. Applied to every script
// that used the raw pattern (only one range actually collided today, but the pattern was
// copy-pasted into ten scripts and the next range edit would re-open it).
//
// SOURCE of the list: Chromium's net/base/port_util.cc kRestrictedPorts, as recalled from the
// source; it is not fetched at run time. scripts/safe-port-smoke.mjs proves the one entry that
// matters here (10080) against a real browser, and fails if a script reverts to the raw pattern.
export const CHROMIUM_RESTRICTED_PORTS = new Set([
  1, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53, 69, 77, 79, 87, 95, 101, 102,
  103, 104, 109, 110, 111, 113, 115, 117, 119, 123, 135, 137, 139, 143, 161, 179, 389, 427, 465,
  512, 513, 514, 515, 526, 530, 531, 532, 540, 548, 554, 556, 563, 587, 601, 636, 989, 990, 993,
  995, 1719, 1720, 1723, 2049, 3659, 4045, 4190, 5060, 5061, 6000, 6566, 6665, 6666, 6667, 6668,
  6669, 6679, 6697, 10080,
]);

// Same call shape as the expression it replaces: pickPort(base, span) === base + floor(rand*span),
// re-drawn while the result is restricted.
export function pickPort(base, span, rand = Math.random) {
  for (;;) {
    const p = base + Math.floor(rand() * span);
    if (!CHROMIUM_RESTRICTED_PORTS.has(p)) return p;
  }
}
