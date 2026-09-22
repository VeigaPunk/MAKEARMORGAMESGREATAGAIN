/* Variant: 'Pit Guard' (2) 1/5 Guard — cheap wall for trickster. */
const CB = globalThis.CB;
const card = {
  id: "pit-guard", name: "Pit Guard", type: "minion", cost: 2, atk: 1, hp: 5,
  keywords: ["Guard"], text: "Guard",
};
CB.cards.POOL.push(card);
CB.cards.byId[card.id] = card;
const t = CB.cards.DECKS.trickster;
for (const id of ["crowd-favorite", "spark-twins"]) {
  const i = t.findIndex((c) => c.id === id);
  if (i >= 0) t[i] = card;
}
