// Probe (b): Crowd Hush stacking — 6x Crowd Hush (over the 1-copy stock count) to test
// zeroing enemy ATK: contest lock (GUARD_NO_CONTEST makes enemy sum 0) + 2-point steals.
const CB = globalThis.CB;
const C = CB.cards.byId;
CB.cards.DECKS["probe-hush"] = [
  C["crowd-shield"], C["crowd-shield"],
  C["scrap-pup"], C["scrap-pup"],
  C["chain-dog"], C["chain-dog"],
  C["hook-fighter"], C["hook-fighter"],
  C["crowd-favorite"], C["crowd-favorite"],
  C["glass-lancer"], C["glass-lancer"],
  C["rigged-bout"], C["rigged-bout"],
  C["sucker-punch"], C["sucker-punch"],
  C["throw-sand"],
  C["cage-door"],
  C["spoilers"],
  C["crowd-hush"], C["crowd-hush"], C["crowd-hush"], C["crowd-hush"], C["crowd-hush"], C["crowd-hush"],
];
CB.simDeckHero["probe-hush"] = "odds"; // Oddsmaker power (-3 ATK) compounds the hush lock
