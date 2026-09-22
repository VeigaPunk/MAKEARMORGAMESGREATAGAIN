/* Final3: combo-final + bruiser loses one pit-rat for a chain-dog */
require("./combo-final.js");
const CB = globalThis.CB;
const b = CB.cards.DECKS.bruiser;
const i = b.findIndex((c) => c.id === "pit-rat");
if (i >= 0) b[i] = CB.cards.byId["chain-dog"];
