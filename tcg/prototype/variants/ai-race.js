/* Variant: when behind on board ATK, prefer face damage over losing trades. */
const CB = globalThis.CB;
const orig = CB.ai.chooseAttack;
CB.ai.chooseAttack = function (st, pi, boardAtk, oppAtk) {
  const p = st.players[pi];
  const legal = CB.engine.legalTargets(st, pi);
  if (boardAtk <= oppAtk && legal.includes("hero")) {
    // race: pick the highest-ATK ready attacker to face
    let best = null;
    for (const m of p.board) {
      if (m.sick || m.attacked) continue;
      if (!best || m.atk > best.atk) best = m;
    }
    if (best) return { m: best, target: "hero" };
  }
  return orig.apply(this, arguments);
};
