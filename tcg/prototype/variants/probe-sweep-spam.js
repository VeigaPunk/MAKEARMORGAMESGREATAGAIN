// Probe (c): Pit Fighter sweep spam — 6x Pit Fighter (over the 3-copy stock count)
// stacking Warcry 1-damage boardsweeps every turn from turn 4.
const CB = globalThis.CB;
const C = CB.cards.byId;
CB.cards.DECKS["probe-sweep"] = [
  C["pit-rat"], C["pit-rat"],
  C["scrap-pup"], C["scrap-pup"],
  C["chain-dog"], C["chain-dog"],
  C["banner-crier"],
  C["hook-fighter"], C["hook-fighter"],
  C["pit-fighter"], C["pit-fighter"], C["pit-fighter"], C["pit-fighter"], C["pit-fighter"], C["pit-fighter"],
  C["arena-champion"],
  C["the-main-event"],
  C["sucker-punch"], C["sucker-punch"],
  C["sweep-leg"], C["sweep-leg"],
  C["last-breath"], C["last-breath"],
  C["crowd-favorite"], C["crowd-favorite"],
];
CB.simDeckHero["probe-sweep"] = "vex";
