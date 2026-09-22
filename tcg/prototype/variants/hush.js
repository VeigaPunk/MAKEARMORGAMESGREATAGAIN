/* Variant: 'Crowd Hush' (2) — enemy minions get -1 ATK. */
const CB = globalThis.CB;
const E = CB.engine;
const card = {
  id: "crowd-hush", name: "Crowd Hush", type: "spell", cost: 2,
  text: "Enemy minions get -1 ATK.",
  effect: (st, pi) => {
    for (const m of st.players[1 - pi].board) m.atk = Math.max(0, m.atk - 1);
  },
};
CB.cards.POOL.push(card);
CB.cards.byId[card.id] = card;
const t = CB.cards.DECKS.trickster;
for (const id of ["shank", "spoilers"]) {
  const i = t.findIndex((c) => c.id === id);
  if (i >= 0) t[i] = card;
}
