// R3 burn reach: give bruiser a cheap original burn spell ("Coal Bomb",
// 2-cost deal 3 to the enemy hero) to close games vs bulwark before the
// Guard wall stabilizes. Replaces the two lowest-impact cards (Pit Rat x2).
const CB = globalThis.CB;
const E = () => CB.engine;
const coalBomb = {
  id: "coal-bomb", name: "Coal Bomb", type: "spell", cost: 2,
  text: "Deal 3 to the enemy hero.",
  effect: (st, pi) => E().hitHero(st, 1 - pi, 3, "Coal Bomb → hero"),
};
CB.cards.POOL.push(coalBomb);
CB.cards.byId[coalBomb.id] = coalBomb;
let removed = 0;
CB.cards.DECKS.bruiser = CB.cards.DECKS.bruiser.filter((c) => {
  if (c.id === "pit-rat" && removed < 2) { removed++; return false; }
  return true;
});
CB.cards.DECKS.bruiser.push(coalBomb, coalBomb);
