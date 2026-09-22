// r3-guard-hp.js — global Guard minion HP trim (-1 hp on all Guard minions).
// Hypothesis: bulwark's wall efficiency (Guard + high HP) over-performs vs bruiser;
// shaving 1 HP from every Guard minion weakens the bulwark leg without breaking
// bulwark>trickster (trickster minions are low-stat, rely on tricks not combat).
const TRIM = {
  "brick-keeper": 3,   // 4 -> 3
  "pit-guard": 4,      // 5 -> 4
  "wall-of-teeth": 5,  // 6 -> 5
  "iron-barker": 4,    // 5 -> 4
  "last-bell": 6,      // 7 -> 6
  "bone-colossus": 7,  // 8 -> 7
};
for (const [id, hp] of Object.entries(TRIM)) {
  const c = CB.cards.byId[id];
  if (!c) throw new Error("missing card " + id);
  c.hp = hp;
}
