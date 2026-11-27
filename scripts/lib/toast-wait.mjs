// ═══════════════════════════════════════════════════════
// BUG-278 — one shared way for a Playwright harness to wait on the app's toast.
//
// WHY: tandem.html's showToast() only ever SETS #prToast's text (it never clears
// it; only the .show class is removed after 3.5 s). So a harness that taps a
// button, sleeps a fixed time, then reads #prToast cannot tell "the message for
// THIS action arrived" from "an older message is still sitting there" or "the
// action has not finished yet". The fix that needs no app change: blank the
// element BEFORE the action, then wait for a caller-supplied terminal pattern.
//
// TWO MODES, BY CALLER CHOICE — not a fixed policy:
//   mode 'throw'  — fail closed: if the pattern never arrives, throw an Error
//                   naming the pattern, the timeout and the text that WAS there.
//   mode 'report' — return { arrived:false, text, ms } and let the caller's own
//                   assertions fail with their own named reason. Required because
//                   some gates (finish-set-integrity-smoke.mjs) deliberately do
//                   not throw on timeout.
//
// DO NOT use this to wait on an action whose SUCCESS path shows no toast (the
// start-session path toasts only in its catch branch): in 'throw' mode that is a
// guaranteed false red. Wait on a non-toast predicate there instead.
// ═══════════════════════════════════════════════════════

export const TOAST_SELECTOR = '#prToast';

// Blank the toast so any text seen afterwards was written after this call.
// Fails loudly if the element is missing: a wait on an absent element would
// otherwise time out and read as "the app never answered".
export async function blankToast(page, selector = TOAST_SELECTOR) {
  const found = await page.evaluate((sel) => {
    const t = document.querySelector(sel);
    if (!t) return false;
    t.textContent = '';
    return true;
  }, selector);
  if (!found) throw new Error(`toast-wait: no element matches ${selector} — fixture broken, wait would be vacuous`);
}

// Wait until the toast's trimmed text matches `pattern` (a RegExp).
export async function waitForToast(page, pattern, { mode = 'throw', timeout = 5000, selector = TOAST_SELECTOR } = {}) {
  if (!(pattern instanceof RegExp)) throw new Error('toast-wait: pattern must be a RegExp');
  if (mode !== 'throw' && mode !== 'report') throw new Error(`toast-wait: unknown mode "${mode}" (use 'throw' or 'report')`);
  const t0 = Date.now();
  let arrived = true;
  try {
    await page.waitForFunction(({ sel, src, flags }) => {
      const t = document.querySelector(sel);
      return !!t && new RegExp(src, flags).test((t.textContent || '').trim());
    }, { sel: selector, src: pattern.source, flags: pattern.flags }, { timeout });
  } catch (e) {
    if (!/timeout/i.test(String(e && e.message))) throw e; // a real error is never a "not arrived"
    arrived = false;
  }
  const text = await page.evaluate((sel) => (document.querySelector(sel)?.textContent || '').trim(), selector);
  const ms = Date.now() - t0;
  if (!arrived && mode === 'throw') {
    throw new Error(`toast-wait: ${pattern} did not appear in ${selector} within ${timeout} ms (text="${text}")`);
  }
  return { arrived, text, ms };
}
