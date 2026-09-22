/* Variant: AI develops board before spells — when behind on board ATK, prefer
   the best affordable minion over any spell. */
const CB = globalThis.CB;
const E = CB.engine;
const orig = CB.ai.takeTurn;
// Patch takeTurn's card-choice step by wrapping playCard selection is hard;
// instead wrap at the policy level: pre-play a minion when behind before delegating.
CB.ai.takeTurn = function (st, pi) {
  const p = st.players[pi], opp = st.players[1 - pi];
  const boardAtk = p.board.reduce((s, m) => s + m.atk, 0);
  const oppAtk = opp.board.reduce((s, m) => s + m.atk, 0);
  if (boardAtk <= oppAtk && p.board.length < E.BOARD_CAP) {
    // play the highest-cost affordable minion first
    let best = -1, bestCost = -1;
    for (let i = 0; i < p.hand.length; i++) {
      const c = p.hand[i];
      if (c.type === "minion" && E.canPlay(st, pi, c) && c.cost > bestCost) { best = i; bestCost = c.cost; }
    }
    if (best >= 0) E.playCard(st, pi, best, null);
  }
  return orig.apply(this, arguments);
};
