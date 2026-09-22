/* Combo X: combo-w + pit-fighter in trickster */
require("./combo-w.js");
const CB = globalThis.CB;
const t = CB.cards.DECKS.trickster;
for (const id of ["scrap-pup", "scrap-pup"]) {
  const i = t.findIndex((c) => c.id === id);
  if (i >= 0) t[i] = CB.cards.byId["pit-fighter"];
}
