/* Variant: surge only when behind ≥3 CP (true comeback, not constant subsidy). */
const CB = globalThis.CB;
CB.engine.SURGE_MANA = 1;
CB.engine.SURGE_DRAW_AT = 99;
CB.engine.SURGE_ODDS_AT = 99;
// patch startTurn to require deficit >= 3
const E = CB.engine;
const orig = E.startTurn;
E.startTurn = function (st) {
  const me = st.players[st.active], opp = st.players[1 - st.active];
  const deficit = opp.cp - me.cp;
  if (deficit > 0 && deficit < 3) {
    // suppress surge for small deficits
    const saved = E.SURGE_MANA;
    E.SURGE_MANA = 0;
    const r = orig.apply(this, arguments);
    E.SURGE_MANA = saved;
    return r;
  }
  return orig.apply(this, arguments);
};
