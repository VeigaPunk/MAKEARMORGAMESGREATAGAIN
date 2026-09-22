// Probe toggles selected by environment: HOARD_CLASH=1 or ALL_IN_FACE=1.
const CB = globalThis.CB;
if (process.env.HOARD_CLASH === "1") {
  CB.ai.clashResponse = () => null;
}
if (process.env.ALL_IN_FACE === "1") {
  const E = CB.engine;
  const originalAttack = E.attack;
  E.attack = function (st, pi, uid, target) {
    const legal = E.legalTargets(st, pi);
    if (legal.includes("hero")) target = "hero";
    return originalAttack(st, pi, uid, target);
  };
}
