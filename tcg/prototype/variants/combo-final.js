/* Final combo: guard-no-contest + pierce-bypass + surge-off + bulwark-trim +
   trickster-v2 + odds-power(-3) + pit-fighter(bruiser) + crowd-shield + scrap-pup + rigged-bout */
require("./combo-z.js");
const CB = globalThis.CB;
const t = CB.cards.DECKS.trickster;
const i = t.findIndex((c) => c.id === "feint");
if (i >= 0) t[i] = CB.cards.byId["rigged-bout"];
