// r3-bulwark-curve: lower-ATK defensive bulwark. Trim chain-dog/bell-ringer attack
// density; add pit-guard, crowd-shield, second-wind, rigged-bout for grind/draw.
const CB = globalThis.CB;
const c = (id) => CB.cards.byId[id];
const ids = [
  "pit-rat", "pit-rat", "scrap-pup", "scrap-pup",
  "odds-seller", "odds-seller", "crowd-shield", "crowd-shield",
  "brick-keeper", "brick-keeper", "pit-guard", "pit-guard",
  "rust-shaman", "rust-shaman",
  "pit-medic", "pit-medic", "stubborn-mule",
  "wall-of-teeth", "wall-of-teeth", "grave-announcer", "grave-announcer",
  "corner-cut", "corner-cut", "sucker-punch",
  "second-wind", "rigged-bout",
];
CB.cards.DECKS.bulwark = ids.map(c);
