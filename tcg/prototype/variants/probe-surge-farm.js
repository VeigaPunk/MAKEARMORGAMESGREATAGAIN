// Probe (d): surge farming — P1 deliberately passes the first FARM_TURNS turns,
// conceding contest points to stay >=3 CP behind and bank +1 temp mana/turn
// (SURGE_AT=3), then plays normally. Does the banked mana flip the game?
const CB = globalThis.CB;
const E = CB.engine;
const C = CB.cards.byId;
const FARM_TURNS = 5;

CB.cards.DECKS["probe-farm"] = [
  C["pit-rat"], C["pit-rat"],
  C["scrap-pup"], C["scrap-pup"],
  C["chain-dog"], C["chain-dog"],
  C["banner-crier"],
  C["hook-fighter"], C["hook-fighter"],
  C["crowd-favorite"], C["crowd-favorite"],
  C["corner-brute"], C["corner-brute"],
  C["arena-champion"],
  C["the-main-event"],
  C["sucker-punch"], C["sucker-punch"],
  C["sweep-leg"], C["sweep-leg"],
  C["crowd-surge"], C["crowd-surge"],
  C["rigged-bout"], C["rigged-bout"],
  C["roar-of-crowd"], C["last-breath"],
];
CB.simDeckHero["probe-farm"] = "vex";

// count SURGE events per player by diffing the log around startTurn
CB.__farmStats = { surgeP1: 0, surgeP2: 0, manaGiven: 0 };
const origStartTurn = E.startTurn;
E.startTurn = function (st) {
  const before = st.log.length;
  const r = origStartTurn.apply(this, arguments);
  for (let i = before; i < st.log.length; i++) {
    const m = st.log[i].match(/^T\d+ P(\d): SURGE/);
    if (m) {
      if (m[1] === "1") CB.__farmStats.surgeP1++;
      else CB.__farmStats.surgeP2++;
      CB.__farmStats.surges++;
    }
  }
  return r;
};
if (!CB.__farmStats.exitHook) {
  CB.__farmStats.exitHook = true;
  process.on("exit", () => {
    const s = CB.__farmStats;
    console.log(`[probe-farm] SURGE events: P1(farmer)=${s.surgeP1} P2=${s.surgeP2}`);
  });
}

// farmer policy: P1 passes entirely for the first FARM_TURNS turns
const origTakeTurn = CB.ai.takeTurn;
CB.ai.takeTurn = function (st, pi) {
  if (pi === 0 && st.turn <= FARM_TURNS) return; // concede board + contest early
  return origTakeTurn.apply(this, arguments);
};
