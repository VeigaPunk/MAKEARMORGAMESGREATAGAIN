/* r3-push-mana2: The Push grants +2 temp mana instead of +1. */
(function () {
  const CB = globalThis.CB;
  const push = CB.cards.byId["the-push"];
  push.text = "+2 mana this turn.";
  push.effect = (st, pi) => { st.players[pi].tempMana += 2; };
})();
