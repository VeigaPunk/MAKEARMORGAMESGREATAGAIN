const CB = globalThis.CB;
const c = (id) => CB.cards.byId[id];
const piercer = { id: "shard-rusher", name: "Shard Rusher", type: "minion", cost: 4, atk: 4, hp: 3, keywords: ["Pierce"], text: "Pierce" };
const breaker = { id: "iron-splinter", name: "Iron Splinter", type: "minion", cost: 5, atk: 5, hp: 4, keywords: ["Pierce"], text: "Pierce" };
for (const card of [piercer, breaker]) { CB.cards.POOL.push(card); CB.cards.byId[card.id] = card; }
CB.cards.byId["last-breath"].cost = 3;
CB.cards.DECKS.bruiser = [
  "pit-rat", "pit-rat", "scrap-pup", "scrap-pup", "odds-seller",
  "chain-dog", "chain-dog", "banner-crier", "hook-fighter", "hook-fighter",
  "crowd-favorite", "glass-lancer", "glass-lancer", "shard-rusher", "shard-rusher",
  "corner-brute", "corner-brute", "iron-splinter", "iron-splinter", "arena-champion",
  "sucker-punch", "last-breath", "last-breath", "ring-out", "throw-sand",
].map(c);
