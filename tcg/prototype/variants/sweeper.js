/* Variant: 'Pit Fighter' (4) 4/4 — Warcry: deal 1 to all enemy minions. */
const CB = globalThis.CB;
const E = CB.engine;
const card = {
  id: "pit-fighter", name: "Pit Fighter", type: "minion", cost: 4, atk: 4, hp: 4,
  keywords: [], text: "Warcry: deal 1 to all enemy minions.",
  warcry: (st, pi) => { for (const m of st.players[1 - pi].board.slice()) E.dealDamage(st, m, 1); },
};
CB.cards.POOL.push(card);
CB.cards.byId[card.id] = card;
const b = CB.cards.DECKS.bruiser;
for (const id of ["corner-brute", "corner-brute"]) {
  const i = b.findIndex((c) => c.id === id);
  if (i >= 0) b[i] = card;
}
