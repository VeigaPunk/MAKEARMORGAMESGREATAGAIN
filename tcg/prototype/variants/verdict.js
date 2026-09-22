/* Variant: 'Crowd Verdict' (3) — deal damage to a minion equal to its HP. */
const CB = globalThis.CB;
const E = CB.engine;
const card = {
  id: "crowd-verdict", name: "Crowd Verdict", type: "spell", cost: 3, needsTarget: true,
  text: "Deal damage to a minion equal to its HP.",
  effect: (st, pi, target) => {
    if (target && target.hp !== undefined) E.dealDamage(st, target, target.hp);
  },
};
CB.cards.POOL.push(card);
CB.cards.byId[card.id] = card;
// AI: treat as a damage spell that kills anything
const origBest = CB.ai.bestDamageSpell;
CB.ai.bestDamageSpell = function (st, pi, targets) {
  const p = st.players[pi];
  const i = p.hand.findIndex((c) => c.id === "crowd-verdict" && E.canPlay(st, pi, c));
  if (i >= 0 && targets.length) return i;
  return origBest.apply(this, arguments);
};
const origPick = CB.ai.pickTarget;
CB.ai.pickTarget = function (st, pi, c) {
  if (c.id === "crowd-verdict") {
    const opp = st.players[1 - pi];
    const guards = opp.board.filter((m) => m.card.keywords.includes("Guard"));
    const pool = guards.length ? guards : opp.board;
    return pool.length ? pool.reduce((a, b) => (b.card.cost > a.card.cost ? b : a)) : null;
  }
  return origPick.apply(this, arguments);
};
const t = CB.cards.DECKS.trickster;
for (const id of ["last-breath", "last-breath"]) {
  const i = t.findIndex((c) => c.id === id);
  if (i >= 0) t[i] = card;
}
