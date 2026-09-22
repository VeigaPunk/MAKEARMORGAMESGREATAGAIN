/* Final2: combo-final + pit-guard in trickster */
require("./combo-final.js");
const CB = globalThis.CB;
const t = CB.cards.DECKS.trickster;
const i = t.findIndex((c) => c.id === "spoilers");
if (i >= 0) t[i] = CB.cards.byId["pit-guard"];
