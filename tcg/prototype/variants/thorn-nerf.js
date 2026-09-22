/* Variant: Thick Hide +0/+1 (was +0/+2). */
const CB = globalThis.CB;
CB.heroes.byId.thorn.power = (st, pi, target) => {
  const t = target && target.owner === pi ? target : st.players[pi].board[0];
  if (t) { t.hp += 1; t.maxHp += 1; }
};
CB.heroes.byId.thorn.powerName = "Thick Hide (+0/+1 to a friendly minion)";
