const CB = globalThis.CB;
const c = (id) => CB.cards.byId[id];
const ids = [
  "pit-rat", "pit-rat", "scrap-pup", "scrap-pup", "odds-seller", "odds-seller",
  "brick-keeper", "brick-keeper", "rust-shaman", "rust-shaman",
  "pit-medic", "pit-medic", "stubborn-mule", "stubborn-mule",
  "wall-of-teeth", "wall-of-teeth", "grave-announcer", "grave-announcer",
  "chain-dog", "chain-dog", "bell-ringer", "bell-ringer",
  "corner-cut", "sucker-punch", "blood-money"
];
CB.cards.DECKS.bulwark = ids.map(c);
