/* Combo Z: combo-y + one more scrap-pup in trickster */
require("./combo-y.js");
const CB = globalThis.CB;
const t = CB.cards.DECKS.trickster;
const i = t.findIndex((c) => c.id === "crowd-hush");
if (i >= 0) t[i] = CB.cards.byId["scrap-pup"];
