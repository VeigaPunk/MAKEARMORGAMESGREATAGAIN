/* Clashbound — headless sim harness.
   Usage:
     node sim.js <seed> <games>                     legacy: bruiser/Vex vs bulwark/Thorn
     node sim.js --matrix [gamesPerPair]            all 3x3 ordered deck matchups
     node sim.js --deckA <id> --deckB <id> [--heroA <id>] [--heroB <id>] <seed> <games>
     --variant <file.js>   load a variant file (mutates CB before games run; path resolved from cwd)
   Plays full AI-vs-AI games, prints one game log (games=1) or aggregate stats. */
require("./engine.js");
require("./cards.js");
require("./ai.js");

const CB = globalThis.CB;
const E = CB.engine;
const path = require("path");
const DECK_HERO = { bruiser: "vex", bulwark: "thorn", trickster: "odds" };
CB.simDeckHero = DECK_HERO; // variants adding decks register a hero here

// ---- args ----
const argv = process.argv.slice(2);
const opts = { deckA: "bruiser", deckB: "bulwark", heroA: null, heroB: null, matrix: 0, variant: null, positional: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--matrix") opts.matrix = parseInt(argv[++i] || "100", 10);
  else if (a === "--variant") opts.variant = argv[++i];
  else if (a === "--deckA") opts.deckA = argv[++i];
  else if (a === "--deckB") opts.deckB = argv[++i];
  else if (a === "--heroA") opts.heroA = argv[++i];
  else if (a === "--heroB") opts.heroB = argv[++i];
  else opts.positional.push(a);
}
if (opts.variant) require(path.resolve(process.cwd(), opts.variant));

function heroFor(deckId, heroId) {
  const id = heroId || DECK_HERO[deckId];
  const h = CB.heroes.byId[id];
  if (!h) throw new Error(`unknown hero ${id} for deck ${deckId}`);
  return h;
}
function deckFor(deckId) {
  const d = CB.cards.DECKS[deckId];
  if (!d) throw new Error(`unknown deck ${deckId} (have: ${Object.keys(CB.cards.DECKS).join(",")})`);
  return d;
}

function playGame(seed, verbose, deckAId, deckBId, heroAId, heroBId) {
  const st = E.newGame(
    deckFor(deckAId), deckFor(deckBId),
    heroFor(deckAId, heroAId), heroFor(deckBId, heroBId), seed
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

function batch(games, seed, deckAId, deckBId, heroAId, heroBId) {
  const tally = {
    lethal: 0, contest: 0, "deck-out": 0, p1: 0, p2: 0, turns: [],
    decisions: 0, comebackEvents: 0, cpLeadReversals: 0,
  };
  for (let i = 0; i < games; i++) {
    const st = playGame(seed + i, false, deckAId, deckBId, heroAId, heroBId);
    tally[st.winReason] = (tally[st.winReason] || 0) + 1;
    tally[st.winner === 0 ? "p1" : "p2"]++;
    tally.turns.push(st.turn);
    tally.decisions += st.simStats.decisions;
    tally.comebackEvents += st.simStats.comebackEvents;
    tally.cpLeadReversals += st.simStats.cpLeadReversals;
  }
  const avg = tally.turns.reduce((a, b) => a + b, 0) / tally.turns.length;
  return { tally, avg, min: Math.min(...tally.turns), max: Math.max(...tally.turns) };
}

if (opts.matrix) {
  const decks = Object.keys(CB.cards.DECKS);
  const n = opts.matrix;
  console.log(`matrix: ${decks.length} decks x ${decks.length} seats, ${n} games/pair (deckA is P1)`);
  for (const a of decks) {
    for (const b of decks) {
      const r = batch(n, 1000, a, b);
      const pct = ((r.tally.p1 / n) * 100).toFixed(0);
      console.log(`${a.padEnd(9)} vs ${b.padEnd(9)} P1win=${pct}% (${r.tally.p1}/${n}) avgTurns=${r.avg.toFixed(1)} lethal=${r.tally.lethal} contest=${r.tally.contest} deckout=${r.tally["deck-out"]}`);
    }
  }
} else {
  const seed = parseInt(opts.positional[0] || "7", 10);
  const games = parseInt(opts.positional[1] || "1", 10);
  if (games === 1) {
    const st = playGame(seed, true, opts.deckA, opts.deckB, opts.heroA, opts.heroB);
    console.log(`\n=== RESULT: P${st.winner + 1} wins by ${st.winReason} on turn ${st.turn} ===`);
    console.log(`final: P1 hp=${st.players[0].hp} cp=${st.players[0].cp} | P2 hp=${st.players[1].hp} cp=${st.players[1].cp}`);
  } else {
    const r = batch(games, seed, opts.deckA, opts.deckB, opts.heroA, opts.heroB);
    const t = r.tally;
    console.log(`games=${games} ${opts.deckA}(P1)=${t.p1} ${opts.deckB}(P2)=${t.p2} | lethal=${t.lethal} contest=${t.contest} deck-out=${t["deck-out"]} | avg turns=${r.avg.toFixed(1)} min=${r.min} max=${r.max}`);
    console.log(`stats: decisions/game=${(t.decisions / games).toFixed(1)} comeback rate=${(t.comebackEvents / games).toFixed(3)} CP-lead reversals=${t.cpLeadReversals}`);
  }
}
