/* Variant: clash spells are also playable from hand as normal spells.
   Effect adapts: attacker→highest-ATK enemy minion, defender→your lowest-HP minion. */
const CB = globalThis.CB;
const E = CB.engine;
for (const c of CB.cards.POOL) {
  if (!c.clashOnly) continue;
  const orig = c.effect;
  c.clashOnly = false;
  c.effect = (st, pi, target) => {
    const opp = st.players[1 - pi], me = st.players[pi];
    const ctx = {
      attacker: opp.board.reduce((a, b) => (b.atk > (a ? a.atk : -1) ? b : a), null),
      defender: me.board.reduce((a, b) => (b.hp < (a ? a.hp : 99) ? b : a), null),
      negate: false,
    };
    orig(st, pi, ctx);
  };
}
