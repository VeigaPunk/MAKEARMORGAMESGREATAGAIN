/* Variant: new spell 'Crowd Surge Past' — destroy a Guard minion (3 cost).
   Gives trickster/bruiser a real answer to the wall. */
const CB = globalThis.CB;
const E = CB.engine;
const card = {
  id: "siege-horn", name: "Siege Horn", type: "spell", cost: 3, needsTarget: true,
  text: "Destroy a Guard minion.",
  effect: (st, pi, target) => {
    if (target && target.hp !== undefined && target.card.keywords.includes("Guard")) target.hp = 0;
  },
};
CB.cards.POOL.push(card);
CB.cards.byId[card.id] = card;
// trickster: swap 2 last-breath for 2 siege-horn (keeps removal density, adds wall answer)
const t = CB.cards.DECKS.trickster;
const i1 = t.findIndex((c) => c.id === "last-breath");
if (i1 >= 0) t[i1] = card;
const i2 = t.findIndex((c) => c.id === "last-breath");
if (i2 >= 0) t[i2] = card;
// bruiser: swap 1 last-breath
const b = CB.cards.DECKS.bruiser;
const i3 = b.findIndex((c) => c.id === "last-breath");
if (i3 >= 0) b[i3] = card;
