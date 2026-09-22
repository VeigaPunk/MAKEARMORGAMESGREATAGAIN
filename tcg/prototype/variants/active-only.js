/* Variant: only the active player can score contest points (no steal for defender). */
const CB = globalThis.CB;
const E = CB.engine;
const orig = E.endTurn;
E.endTurn = function (st) {
  const opp = st.players[1 - st.active];
  const savedCp = opp.cp;
  const r = orig.apply(this, arguments);
  // if the opponent scored (their cp rose), roll it back — only active player scores
  if (opp.cp > savedCp) { const d = opp.cp - savedCp; opp.cp = savedCp; st.players[st.active].cp += d; }
  return r;
};
