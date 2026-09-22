// Probe (b'): best-case Crowd Hush — AI casts a hush first thing every turn while
// any remain in hand (instead of highest-cost-last ordering). Tests the zero-ATK
// lock at optimal timing rather than filler priority.
const CB = globalThis.CB;
const E = CB.engine;

const origTakeTurn = CB.ai.takeTurn;
CB.ai.takeTurn = function (st, pi) {
  const p = st.players[pi];
  // open with every castable hush before the normal policy runs
  let guard = 0;
  while (guard++ < 3) {
    const i = p.hand.findIndex((c) => c.id === "crowd-hush" && E.canPlay(st, pi, c));
    if (i < 0) break;
    E.playCard(st, pi, i, null);
    if (st.winner !== null) return;
  }
  return origTakeTurn.apply(this, arguments);
};
