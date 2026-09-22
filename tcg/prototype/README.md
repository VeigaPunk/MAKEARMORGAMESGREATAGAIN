# Clashbound prototype

A dependency-free, file://-safe arena TCG prototype. The browser game is human (P1) versus AI (P2); the headless runner plays both sides with the built-in decks and heroes.

## Run it

From the repository root:

```bash
# Play in a browser — no server or install required
xdg-open tcg/prototype/index.html

# Or open tcg/prototype/index.html directly as file://

# Headless AI-vs-AI: one verbose game
node tcg/prototype/sim.js 7 1

# Headless batch: 200 games from seed 1
node tcg/prototype/sim.js 1 200
```

The browser loads plain scripts in order (`engine.js`, `cards.js`, `ai.js`, `ui.js`); there are no packages, modules, network requests, or build steps.

## Controls

- **Play a card:** click a card in your hand. Cards that exceed your available mana are dimmed; minions enter one of the five board slots.
- **Attack:** click one of your ready minions, then click an opposing minion or the opposing hero bar. A **Guard** minion must be attacked while one is present. Newly played minions are sick unless they have **Rush**.
- **Hero power:** click **Hero power (2)** to spend 2 mana and use your hero's once-per-turn ability. Targeting uses the same board/hero click patterns where applicable.
- **End turn:** click **End turn** to resolve the contest clock and pass priority to the AI.
- **New game:** click **New game** to reset the match with a fresh random seed.

## Rules in brief

- Each player starts at **20 HP**, draws an opening hand of 3, and has a 25-card deck. Hands hold at most 10 cards; drawing from an empty deck loses by deck-out.
- You gain a normal mana refill each turn (up to 10). The board holds up to 5 minions. Minions have ATK/HP and normally attack once per turn after summoning sickness.
- **Two clocks:** reduce the opposing hero to 0 HP for a **lethal** win, or win the contest clock by reaching **8 contest points**. At end of each turn, the side with the greater total board ATK gains 1 contest point; ties score nothing.
- **Surge:** at turn start, a player behind on contest points gets +1 temporary mana. If behind by 4 or more points, Surge also draws a card. Temporary Surge mana is spent before normal mana and expires at the next turn start.
- **Clash:** when an attack is declared, the defender gets a narrow reaction window for a single Clash spell (for example, reduce the attacker, reinforce the defender, damage the attacker, or negate the attack). Clash spells cannot be played from the normal hand-play path.
- **Keywords:** Guard restricts attack targets; Rush can attack immediately; Ward absorbs the first damage instance each refresh; Pierce sends excess minion damage to the opposing hero.

## Decks and heroes

The prototype ships two 25-card stock decks (maximum two copies per card):

- **Bruiser:** aggressive Pit Rat / Chain Dog pressure, attack buffs, direct damage, and a Crowd Surge finisher.
- **Bulwark:** Guards, Ward minions, healing, removal, card draw, and defensive Clash tricks.

Available heroes:

- **Vex the Pitwright — Pit Snipe:** deal 1 damage to a minion.
- **Mother Thorn — Thick Hide:** give a minion +0/+2.
- **The Oddsmaker — Fix the Odds:** peek at the top card and put it on the bottom (the current prototype implementation always bottoms it).

The browser matchup is currently **Bruiser + Vex (you)** versus **Bulwark + Thorn (AI)**. The third hero and both stock decks are available to the engine/simulation API.

## Known limitations

- This is a focused v0.1 prototype, not a complete card-game client: there is no deck editor, collection, mulligan UI, multiplayer, persistence, or sound.
- The browser uses fixed human-vs-AI sides and does not expose hero/deck selection.
- Clash reactions are AI-controlled in the browser; there is no player-facing defensive response prompt.
- Some card effects are intentionally minimal, and target selection is inferred from clicks rather than supported by a full rules explanation or stack UI.
- The Oddsmaker hero has no peek-choice dialog yet and always bottoms the inspected card.
- Layout and controls are optimized for a desktop browser; accessibility, touch ergonomics, and responsive mobile presentation are not complete.
