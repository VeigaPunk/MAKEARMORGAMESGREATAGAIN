/* Variant: 'Crowd Shield' (1) 0/4 Guard — cheapest wall. */
const CB = globalThis.CB;
const card = {
  id: "crowd-shield", name: "Crowd Shield", type: "minion", cost: 1, atk: 0, hp: 4,
  keywords: ["Guard"], text: "Guard",
};
CB.cards.POOL.push(card);
CB.cards.byId[card.id] = card;
const t = CB.cards.DECKS.trickster;
for (const id of ["pit-rat", "pit-rat"]) {
  const i = t.findIndex((c) => c.id === id);
  if (i >= 0) t[i] = card;
}
