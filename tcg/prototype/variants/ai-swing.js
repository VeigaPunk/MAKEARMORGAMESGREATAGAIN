/* AI policy swing: prefer face damage whenever the engine permits it. */
(function () {
  const CB = globalThis.CB;
  const E = CB.engine;
  const originalAttack = E.attack;
  E.attack = function (st, pi, uid, target) {
    const legal = E.legalTargets(st, pi);
    if (target !== "hero" && legal.includes("hero")) target = "hero";
    return originalAttack.call(this, st, pi, uid, target);
  };
})();
