/* Variant: 'Bought Allegiance' (5) — take control of an enemy minion. */
const CB = globalThis.CB;
const E = CB.engine;
const card = {
  id: "bought-allegiance", name: "Bought Allegiance", type: "spell", cost: 5, needsTarget: true,
  text: "Take control of an enemy minion.",
  effect: (st, pi, target) => {
    const opp = st.players[1 - pi], me = st.players[pi];
    if (!target || target.hp === undefined || target.owner !== 1 - pi) return;
    if (me.board.length >= E.BOARD_CAP) return;
    const i = opp.board.indexOf(target);
    if (i < 0) return;
    opp.board.splice(i, 1);
    target.owner = pi;
    target.sick = true;
    me.board.push(target);
    E.say(st, `${target.card.name} switches sides`);
  },
};
CB.cards.POOL.push(card);
CB.cards.byId[card.id] = card;
const t = CB.cards.DECKS.trickster;
for (const id of ["ring-out", "ring-out"]) {
  const i = t.findIndex((c) => c.id === id);
  if (i >= 0) t[i] = card;
}
