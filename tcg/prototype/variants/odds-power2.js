/* Variant: Oddsmaker power = -3 ATK to strongest enemy minion (was -2). */
const CB = globalThis.CB;
CB.heroes.byId.odds.power = (st, pi) => {
  const opp = st.players[1 - pi];
  const t = opp.board.reduce((a, b) => (b.atk > (a ? a.atk : -1) ? b : a), null);
  if (t) t.atk = Math.max(0, t.atk - 3);
};
CB.heroes.byId.odds.powerName = "Shave the Odds (-3 ATK to strongest enemy minion)";
