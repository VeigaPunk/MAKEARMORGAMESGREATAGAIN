// P2 compensation experiment: retain The Push and add one extra deck draw.
const E = CB.engine;
const originalNewGame = E.newGame;
E.newGame = function (...args) {
  const st = originalNewGame.apply(this, args);
  E.drawCard(st, st.players[1]);
  return st;
};
