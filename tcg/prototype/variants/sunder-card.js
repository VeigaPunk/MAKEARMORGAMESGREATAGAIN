// Round 2 variant: a focused anti-Guard tool for bruiser.
const CB = globalThis.CB;
const sunderCard = {
  id: "sunder-card", name: "Sunder Card", type: "spell", cost: 2, keywords: [],
  text: "Enemy minions lose Guard.",
  effect: (st, pi) => { for (const m of st.players[1 - pi].board) if (m.card && m.card.keywords.includes("Guard")) m.card = { ...m.card, keywords: m.card.keywords.filter((k) => k !== "Guard") }; },
};
CB.cards.POOL.push(sunderCard); CB.cards.byId[sunderCard.id] = sunderCard;
CB.cards.DECKS.bruiser = CB.cards.stockDeck([
  "pit-rat", "pit-rat", "scrap-pup", "scrap-pup", "odds-seller", "chain-dog", "chain-dog", "banner-crier", "hook-fighter", "hook-fighter", "crowd-favorite", "crowd-favorite", "glass-lancer", "glass-lancer", "corner-brute", "corner-brute", "arena-champion", "the-main-event", "sucker-punch", "sucker-punch", "sunder-card", "sunder-card", "last-breath", "last-breath", "throw-sand",
]);
