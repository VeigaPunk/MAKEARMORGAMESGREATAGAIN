// R3 PushCard lane: P2 keeps The Push AND draws one extra card at game start
// (hand 4 + push vs P1's 3), to test whether over-compensating P2 inverts seat skew.
const E = CB.engine;
const originalNewGame = E.newGame;
E.newGame = function (...args) {
  const st = originalNewGame.apply(this, args);
  E.drawCard(st, st.players[1]);
  return st;
};
