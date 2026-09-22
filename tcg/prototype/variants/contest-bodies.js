/* Variant: contest scores by minion COUNT, not ATK sum. */
const CB = globalThis.CB;
const E = CB.engine;
const orig = E.endTurn;
E.endTurn = function (st) {
  const saved = [];
  for (const p of st.players) for (const m of p.board) { saved.push([m, m.atk]); m.atk = 1; }
  const r = orig.apply(this, arguments);
  for (const [m, a] of saved) m.atk = a;
  return r;
};
