/* Variant: 'Eject' (2) — return an enemy minion to its owner's hand. */
const CB = globalThis.CB;
const E = CB.engine;
const card = {
  id: "eject", name: "Eject", type: "spell", cost: 2, needsTarget: true,
  text: "Return an enemy minion to its owner's hand.",
  effect: (st, pi, target) => {
    const opp = st.players[1 - pi];
    if (!target || target.hp === undefined || target.owner !== 1 - pi) return;
    const i = opp.board.indexOf(target);
    if (i < 0) return;
    opp.board.splice(i, 1);
    if (opp.hand.length < 10) opp.hand.push(target.card); else opp.discard.push(target.card);
    E.say(st, `${target.card.name} is ejected`);
  },
};
CB.cards.POOL.push(card);
CB.cards.byId[card.id] = card;
// AI: treat eject as a damage-ish spell so it gets cast at guards
const origPick = CB.ai.pickTarget;
CB.ai.pickTarget = function (st, pi, c) {
  if (c.id === "eject") {
    const opp = st.players[1 - pi];
    const guards = opp.board.filter((m) => m.card.keywords.includes("Guard"));
    const pool = guards.length ? guards : opp.board;
    return pool.length ? pool.reduce((a, b) => (b.card.cost > a.card.cost ? b : a)) : null;
  }
  return origPick.apply(this, arguments);
};
const origBest = CB.ai.bestDamageSpell;
CB.ai.bestDamageSpell = function (st, pi, targets) {
  const p = st.players[pi];
  const i = p.hand.findIndex((c) => c.id === "eject" && E.canPlay(st, pi, c));
  if (i >= 0 && targets.length) return i;
  return origBest.apply(this, arguments);
};
const t = CB.cards.DECKS.trickster;
for (const id of ["corner-cut", "corner-cut"]) {
  const i = t.findIndex((c) => c.id === id);
  if (i >= 0) t[i] = card;
}
