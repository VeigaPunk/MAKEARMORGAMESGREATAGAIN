/* Variant: when behind on board ATK, trade up — attack the highest-ATK enemy
   minion we can kill (or soften), instead of letting face damage accumulate. */
const CB = globalThis.CB;
const E = CB.engine;
const orig = CB.ai.chooseAttack;
CB.ai.chooseAttack = function (st, pi, boardAtk, oppAtk) {
  const p = st.players[pi], opp = st.players[1 - pi];
  const legal = E.legalTargets(st, pi).filter((t) => t !== "hero");
  if (boardAtk <= oppAtk && legal.length) {
    // pick our biggest ready attacker into the biggest killable enemy
    let best = null, bestScore = -1;
    for (const m of p.board) {
      if (m.sick || m.attacked) continue;
      for (const t of legal) {
        const kill = t.hp <= m.atk;
        const score = (kill ? 100 : 0) + t.atk * 2 - (t.atk >= m.hp ? m.atk : 0);
        if (score > bestScore) { bestScore = score; best = { m, target: t }; }
      }
    }
    if (best) return best;
  }
  return orig.apply(this, arguments);
};
