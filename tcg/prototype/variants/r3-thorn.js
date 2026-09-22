/* r3-thorn.js — isolate Mother Thorn's contribution to the bulwark skew.
   Two knobs: hero power (+0/+2 -> +0/+1) and surge kind 'thorn' -> 'standard'
   (removes the board-wide +1 ATK on surge). Toggle via env:
     THORN_POWER=weak   (default on)  power gives +0/+1
     THORN_SURGE=std    (default on)  surge becomes standard (+1 draw only)
*/
const CB = globalThis.CB;
const T = CB.heroes.byId.thorn;

if (process.env.THORN_POWER !== "stock") {
  T.power = (st, pi, target) => {
    const t = target && target.owner === pi ? target : st.players[pi].board[0];
    if (t) { t.hp += 1; t.maxHp += 1; }
  };
  T.powerName = "Thick Hide (+0/+1 to a friendly minion)";
}

if (process.env.THORN_SURGE !== "stock") {
  T.surge = "standard";
}
