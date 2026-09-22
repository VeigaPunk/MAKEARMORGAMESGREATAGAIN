/* Combo AA: combo-z + pit-guard in trickster */
require("./combo-z.js");
const CB = globalThis.CB;
const t = CB.cards.DECKS.trickster;
const i = t.findIndex((c) => c.id === "crowd-favorite");
if (i >= 0) t[i] = CB.cards.byId["pit-guard"];
