/* Combo Y: combo-w + ONE pit-fighter in trickster */
require("./combo-w.js");
const CB = globalThis.CB;
const t = CB.cards.DECKS.trickster;
const i = t.findIndex((c) => c.id === "scrap-pup");
if (i >= 0) t[i] = CB.cards.byId["pit-fighter"];
