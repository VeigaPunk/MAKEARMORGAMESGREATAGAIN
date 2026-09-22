// Probe (a): all-in Pierce line — 6x Glass Lancer (deliberately over the 2-copy cap)
// to stress PIERCE_BYPASS + overflow. Question: does racing past guards break the game?
const CB = globalThis.CB;
const C = CB.cards.byId;
CB.cards.DECKS["probe-pierce"] = [
  C["pit-rat"], C["pit-rat"],
  C["scrap-pup"], C["scrap-pup"],
  C["glass-lancer"], C["glass-lancer"], C["glass-lancer"], C["glass-lancer"], C["glass-lancer"], C["glass-lancer"],
  C["chain-dog"], C["chain-dog"],
  C["hook-fighter"], C["hook-fighter"],
  C["crowd-favorite"], C["crowd-favorite"],
  C["arena-champion"], C["arena-champion"],
  C["the-main-event"],
  C["sucker-punch"], C["sucker-punch"],
  C["sweep-leg"], C["sweep-leg"],
  C["corner-cut"], C["corner-cut"],
  C["throw-sand"],
];
CB.simDeckHero["probe-pierce"] = "vex";
