// Probe (a'): best-case Pierce — patch chooseAttack to enumerate targets WITH the
// attacker (engine bypass applies). Gives the AI the pierce-bypass reach the shipped
// AI never uses (ai.js calls legalTargets without the attacker).
const CB = globalThis.CB;
const E = CB.engine;

function chooseAttackBypass(st, pi, boardAtk, oppAtk) {
  const p = st.players[pi];
  let best = null, bestScore = -Infinity;
  for (const m of p.board) {
    if (m.sick || m.attacked) continue;
    const legal = E.legalTargets(st, pi, m); // attacker-aware: pierce bypass live
    for (const target of legal) {
      const isHero = target === "hero";
      const targetDies = !isHero && target.hp <= m.atk;
      const attackerDies = !isHero && target.atk >= m.hp;
      const projectedOwn = boardAtk - (attackerDies ? m.atk : 0);
      const projectedOpp = oppAtk - (targetDies ? target.atk : 0);
      const flips = boardAtk <= oppAtk && projectedOwn > projectedOpp;
      let score = (flips ? 10000 : 0) + (projectedOwn - projectedOpp) * 10;
      if (isHero) score += m.atk * 0.5;
      if (ahead(boardAtk, oppAtk) && attackerDies) score -= 5000;
      if (!isHero && targetDies) score += target.atk * 4;
      if (score > bestScore) { bestScore = score; best = { m, target }; }
    }
  }
  return best;
}
function ahead(boardAtk, oppAtk) { return boardAtk > oppAtk; }

CB.__pierceAI = true;
const orig = CB.ai.chooseAttack;
CB.ai.chooseAttack = function (st, pi, boardAtk, oppAtk) {
  return chooseAttackBypass(st, pi, boardAtk, oppAtk);
};
