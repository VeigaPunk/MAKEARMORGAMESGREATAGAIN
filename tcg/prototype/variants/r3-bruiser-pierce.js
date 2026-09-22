/* Variant r3-bruiser-pierce: give bruiser more Pierce reach vs bulwark walls.
   - Adds "Shard Rusher": 4-cost 4/3 Pierce (original design, curve filler).
   - Adds a 3rd Glass Lancer (5/1 Pierce for 3).
   - Cuts banner-crier, one pit-fighter, throw-sand (lowest-value slots). */
const CB = globalThis.CB;
const c = (id) => CB.cards.byId[id];
const shard = { id: "shard-rusher", name: "Shard Rusher", type: "minion", cost: 4, atk: 4, hp: 3, keywords: ["Pierce"], text: "Pierce" };
CB.cards.POOL.push(shard);
CB.cards.byId[shard.id] = shard;
CB.cards.DECKS.bruiser = [
  "pit-rat", "pit-rat", "scrap-pup", "scrap-pup",
  "chain-dog", "chain-dog", "hook-fighter", "hook-fighter",
  "crowd-favorite", "crowd-favorite", "glass-lancer", "glass-lancer", "glass-lancer",
  "pit-fighter", "pit-fighter", "shard-rusher", "shard-rusher", "arena-champion", "the-main-event",
  "sucker-punch", "sucker-punch", "sweep-leg", "sweep-leg",
  "last-breath", "last-breath",
].map(c);
