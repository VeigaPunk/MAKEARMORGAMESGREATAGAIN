/* Variant: Guard minions cannot attack — pure walls. AI must also skip them. */
const CB = globalThis.CB;
CB.engine.GUARD_PASSIVE = true;
const orig = CB.ai.chooseAttack;
CB.ai.chooseAttack = function (st, pi, boardAtk, oppAtk) {
  const p = st.players[pi];
  const saved = p.board;
  p.board = saved.filter((m) => !m.card.keywords.includes("Guard"));
  const r = orig.apply(this, arguments);
  p.board = saved;
  return r;
};
