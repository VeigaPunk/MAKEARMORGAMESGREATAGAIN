/* r3-push-manadraw: The Push grants +1 temp mana and draws 1 card. */
(function () {
  const CB = globalThis.CB;
  const push = CB.cards.byId["the-push"];
  push.text = "+1 mana this turn. Draw 1.";
  push.effect = (st, pi) => {
    st.players[pi].tempMana += 1;
    CB.engine.drawCard(st, st.players[pi]);
  };
})();
