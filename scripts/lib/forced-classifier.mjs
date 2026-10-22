// ═══════════════════════════════════════════════════════
// forced-classifier.mjs — the BUG-231 "is this over-cap stack structurally forced?"
// predicate, extracted from scripts/per-exercise-cap-smoke.mjs so that gate AND its
// auditor (scripts/forced-stack-classifier-audit.mjs, BUG-234) call the SAME function.
//
// WHY A SHARED MODULE: the auditor has to judge the classifier the cap smoke actually
// runs. A re-typed copy inside the auditor would audit itself (and a mutation of the
// real classifier would be invisible to it) — the one-rule-one-home silo CLAUDE.md
// forbids. Behaviour is BYTE-IDENTICAL to the inline block it replaced; the pinned
// fixture scripts/fixtures/bug231-forced-stacks.json is the regression proof.
//
// Credit accounting is D6b's: primary 1.0, secondary 0.5, anchored prefix match
// (`t` or `t_...`, D19). "Credit tier" below = the 1.0/0.5 weighting (NOT the
// equipment tier, which is part of a cell's identity).
// ═══════════════════════════════════════════════════════

// name -> bank entry, and the weekly credit weight of `name` for token `t`.
export function makeWeightOf(bank) {
  const byName = {};
  for (const e of Object.values(bank || {})) if (e && e.name) byName[e.name] = e;
  const weightOf = (name, t) => {
    const g = byName[name]?.muscleGroups || {};
    const hit = m => m === t || m.startsWith(t + '_');
    return (g.primary || []).filter(hit).length + 0.5 * (g.secondary || []).filter(hit).length;
  };
  return { byName, weightOf };
}

// Every token for which this lift is structurally forced: the token's weekly MEV
// cannot be met with every lift in the week that shares the lift's credit tier on that
// token pinned at the ceiling. headroom = sum over those lifts of cap * min(weight, 1).
export function allForcedTokens({ lift, lifts, landmark, tokens, cap, weightOf }) {
  const out = [];
  for (const t of tokens) {
    const myW = weightOf(lift.name, t);
    if (!myW || !landmark?.mev) continue;
    const tier0 = Math.min(myW, 1);
    const headroom = lifts
      .filter(x => Math.min(weightOf(x.name, t), 1) === tier0)
      .reduce((a, x) => a + cap * Math.min(weightOf(x.name, t), 1), 0);
    if (headroom < landmark.mev) out.push({ token: t, weight: myW, headroom, mev: landmark.mev });
  }
  return out;
}

// The classifier verdict. Forced iff ANY token is forced; `token` is the FIRST such
// token in MAJOR_MUSCLE_GROUP_TOKENS order (the ratchet key), not necessarily the
// binding one — the auditor reports that gap rather than the classifier hiding it.
export function classifyOverCap(args) {
  const f = allForcedTokens(args);
  if (!f.length) return { forced: false, token: null, why: null };
  const { token, headroom, mev } = f[0];
  return { forced: true, token, why: `${token}: mev ${mev} > ${headroom} reachable at <=${args.cap}/lift` };
}
