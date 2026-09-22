// Burn reach: trade two low-impact Pit Rats for original cheap hero pressure.
const CB = globalThis.CB;
const E = () => CB.engine;
const emberJab = {
  id: "ember-jab", name: "Ember Jab", type: "spell", cost: 1,
  text: "Deal 4 to the enemy hero.",
  effect: (st, pi) => E().hitHero(st, 1 - pi, 4, "Ember Jab → hero"),
};
CB.cards.POOL.push(emberJab);
CB.cards.byId[emberJab.id] = emberJab;
const base = CB.cards.DECKS.bruiser.slice();
let removed = 0;
CB.cards.DECKS.bruiser = base.filter(c => {
  if (c.id === "pit-rat" && removed < 2) { removed++; return false; }
  return true;
});
CB.cards.DECKS.bruiser.push(emberJab, emberJab);
