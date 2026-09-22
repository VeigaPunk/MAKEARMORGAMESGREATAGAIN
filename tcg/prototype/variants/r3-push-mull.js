/* r3-push-mull — seat-equity experiment: P2 keeps The Push AND gets a
   "draw 4, mulligan, trim to 3" opening (better card selection, same card
   count). Variant harness only — engine untouched. */
(function () {
  const CB = globalThis.CB;
  const E = CB.engine;
  const PUSH = E.PUSH_CARD;

  // P2 opens with 4 cards instead of 3 (in addition to The Push).
  const origNewGame = E.newGame;
  E.newGame = function (deckA, deckB, heroA, heroB, seed) {
    const st = origNewGame(deckA, deckB, heroA, heroB, seed);
    E.drawCard(st, st.players[1]);
    return st;
  };

  // After P2's mulligan resolves, trim back to a normal-sized hand,
  // never discarding The Push.
  const origMulligan = E.mulligan;
  E.mulligan = function (st, pi, indices) {
    const ok = origMulligan(st, pi, indices);
    if (ok && pi === 1) {
      const p = st.players[1];
      const cap = E.OPEN_HAND + (PUSH ? 1 : 0);
      while (p.hand.length > cap) {
        const keep = p.hand
          .map((c, i) => i)
          .filter((i) => !PUSH || p.hand[i].id !== PUSH);
        const i = keep[Math.floor(st.rand() * keep.length)];
        p.discard.push(p.hand.splice(i, 1)[0]);
        E.say(st, "P2 opening trim: 1 card discarded (drew 4, keeps 3)");
      }
    }
    return ok;
  };
})();
