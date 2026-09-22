/* Final4: combo-final + trickster gets a second pit-fighter */
require("./combo-final.js");
const CB = globalThis.CB;
const t = CB.cards.DECKS.trickster;
const i = t.findIndex((c) => c.id === "throw-sand");
if (i >= 0) t[i] = CB.cards.byId["pit-fighter"];
