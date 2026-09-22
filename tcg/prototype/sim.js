/* Clashbound — headless sim harness. Run: node sim.js [seed] [games]
   Plays full AI-vs-AI games, prints one game log + aggregate stats. */
require("./engine.js");
require("./cards.js");
require("./ai.js");

const CB = globalThis.CB;
const E = CB.engine;

function playGame(seed, verbose) {
  const st = E.newGame(
    CB.cards.DECKS.bruiser, CB.cards.DECKS.bulwark,
    CB.heroes.byId.vex, CB.heroes.byId.thorn, seed
  );
  const stats = { decisions: 0, comebackEvents: 0, cpLeadReversals: 0 };
  let previousNonZeroDiff = 0;
  let reachedThreeBehind = [false, false];
  let comebackCounted = [false, false];
  const original = {
    playCard: E.playCard,
    attack: E.attack,
    heroPower: E.heroPower,
    endTurn: E.endTurn,
    clashResponse: CB.ai.clashResponse,
  };
  E.playCard = function (...args) {
    const result = original.playCard.apply(this, args);
    if (result) stats.decisions++;
    return result;
  };
  E.attack = function (...args) {
    const result = original.attack.apply(this, args);
    if (result) stats.decisions++;
    return result;
  };
  E.heroPower = function (...args) {
    const result = original.heroPower.apply(this, args);
    if (result) stats.decisions++;
    return result;
  };
  CB.ai.clashResponse = function (...args) {
    const result = original.clashResponse.apply(this, args);
    if (result) stats.decisions++;
    return result;
  };
  E.endTurn = function (...args) {
    const result = original.endTurn.apply(this, args);
    const diff = st.players[0].cp - st.players[1].cp;
    if (diff <= -3) reachedThreeBehind[0] = true;
    if (diff >= 3) reachedThreeBehind[1] = true;
    if (reachedThreeBehind[0] && !comebackCounted[0] && diff >= 0) {
      stats.comebackEvents++;
      comebackCounted[0] = true;
    }
    if (reachedThreeBehind[1] && !comebackCounted[1] && diff <= 0) {
      stats.comebackEvents++;
      comebackCounted[1] = true;
    }
    if (previousNonZeroDiff !== 0 && diff !== 0 && Math.sign(previousNonZeroDiff) !== Math.sign(diff)) {
      stats.cpLeadReversals++;
    }
    if (diff !== 0) previousNonZeroDiff = diff;
    previousDiff = diff;
    return result;
  };
  let guard = 0;
  while (st.winner === null && guard++ < 200) {
    E.startTurn(st);
    if (st.winner !== null) break;
    CB.ai.takeTurn(st, st.active);
    E.endTurn(st);
  }
  E.playCard = original.playCard;
  E.attack = original.attack;
  E.heroPower = original.heroPower;
  E.endTurn = original.endTurn;
  CB.ai.clashResponse = original.clashResponse;
  if (verbose) console.log(st.log.join("\n"));
  st.simStats = stats;
  return st;
}

const seed = parseInt(process.argv[2] || "7", 10);
const games = parseInt(process.argv[3] || "1", 10);

if (games === 1) {
  const st = playGame(seed, true);
  console.log(`\n=== RESULT: P${st.winner + 1} wins by ${st.winReason} on turn ${st.turn} ===`);
  console.log(`final: P1 hp=${st.players[0].hp} cp=${st.players[0].cp} | P2 hp=${st.players[1].hp} cp=${st.players[1].cp}`);
} else {
  const tally = {
    lethal: 0, contest: 0, "deck-out": 0, p1: 0, p2: 0, turns: [],
    decisions: 0, comebackEvents: 0, cpLeadReversals: 0,
  };
  for (let i = 0; i < games; i++) {
    const st = playGame(seed + i, false);
    tally[st.winReason] = (tally[st.winReason] || 0) + 1;
    tally[st.winner === 0 ? "p1" : "p2"]++;
    tally.turns.push(st.turn);
    tally.decisions += st.simStats.decisions;
    tally.comebackEvents += st.simStats.comebackEvents;
    tally.cpLeadReversals += st.simStats.cpLeadReversals;
  }
  const avg = tally.turns.reduce((a, b) => a + b, 0) / tally.turns.length;
  console.log(`games=${games} P1=${tally.p1} P2=${tally.p2} | lethal=${tally.lethal} contest=${tally.contest} deck-out=${tally["deck-out"]} | avg turns=${avg.toFixed(1)} min=${Math.min(...tally.turns)} max=${Math.max(...tally.turns)}`);
  console.log(`stats: decisions/game=${(tally.decisions / games).toFixed(1)} comeback rate=${(tally.comebackEvents / games).toFixed(3)} CP-lead reversals=${tally.cpLeadReversals}`);
}
