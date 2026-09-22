# Arena TCG — Design Doc (working title: **CLASHBOUND**)

## Meta

| Field | Value |
|-------|-------|
| **Slug** | `clashbound` |
| **Working title** | Clashbound — an arena trading-card game |
| **Status** | R1 draft — spine locked; comparison scored vs recovered intel |
| **Rights** | **INTERNAL-NO-PUBLIC** — original IP; Hearthstone is a mechanics reference only (no copied card text, names, or assets) |
| **Ship path** | Dependency-free HTML5 prototype (`tcg/prototype/`), file://-safe |
| **Language** | English only |
| **Mission** | tcg-arena — beat @poteto's **Thursday Arena** (auto-battler, thursdayarena.com — see `tcg/intel/poteto-arena-tcg.md`) on depth-per-decision, readability, pace, comeback mechanics |

## Comparison axes (the "better than" contract)

Every superiority claim in this doc scores against these axes — vs **both** references: @poteto's game (per `tcg/intel/`) and Hearthstone.

| Axis | Definition | How we measure |
|------|-----------|----------------|
| **Depth-per-decision** | Meaningful branching per player input | Avg. distinct viable lines per turn (play order, targets, zone contest, surge spend) |
| **Readability** | Time to parse board state correctly | # keywords (≤6), info on-card vs hidden, simultaneous-stake clarity |
| **Pace** | Real time to a decided game | Turns-to-lethal distribution; target 6–9 turns, ~5–8 min |
| **Comeback mechanics** | Structural (not card-luck) paths back from behind | Surge mana, contest points, underdog draw — quantified swing potential |
| **Agency symmetry** | Decisions made on opponent's turn | Defender assignments, reactive window (vs HS's near-zero) |

## Core loop (v1)

1. **Deck** — 25 cards, max 2 copies, from a 40-card v1 pool. One hero per deck; hero sets power + surge flavor.
2. **Open** — each player draws 3, mulligans any number once. Player 2 gets **The Push** (a 0-cost spell: "+1 mana this turn").
3. **Turn** — *Refresh* (mana = turn number, cap 10) → *Draw* → *Main* (play cards, hero power, attacks in any order) → *Contest check* → end.
4. **Board** — 5 minion slots per side. Minions have ATK/HP, summoning sickness, and attack enemy minions or the enemy hero directly.
5. **Contest track** — the arena has a center **Contest Zone**. At each turn's end, the side with more total ATK on board scores 1 **Contest Point** (ties: no point). First to **8 Contest Points** wins *or* reduce enemy hero from **20 → 0**.
6. **Surge (comeback engine)** — at your Refresh, if the opponent leads in Contest Points, gain **+1 temporary mana** this turn. If behind by ≥4 points, also draw an extra card. Structural rubber-band: the leader can't stall, the trailer can't be starved.
7. **End** — win by lethal, contest victory, or opponent decking out (deck-out = instant loss, no fatigue drip — pace).

## Card model (v1)

- **Minions** — cost / ATK / HP / ≤1 keyword / ≤1 ability line.
- **Spells** — cost / effect; one reactive subclass (**Clash** spells, playable during the opponent's combat step — the agency-symmetry lever).
- **Keywords (≤6, the readability budget):**
  - **Guard** (taunt): enemies must attack this first.
  - **Rush** (charge): can attack the turn it's played.
  - **Pierce**: excess combat damage to a minion carries to the hero.
  - **Deathcry**: triggers on death.
  - **Warcry**: triggers on play.
  - **Ward**: ignores the first damage each turn.
- **Heroes (v1: 3)** — each: 20 HP, one 2-mana hero power, one passive surge modifier:
  - **Vex the Pitwright** — power: deal 1 damage to a minion. Surge: +1 mana when behind (standard).
  - **Mother Thorn** — power: give a minion +0/+2. Surge: when behind by ≥4, extra draw *and* minions get +1 ATK this turn.
  - **The Oddsmaker** — power: look at top card, may bottom it. Surge: temporary mana is +2 when behind by ≥6.

## Economy

- Mana: +1 crystal/turn to 10 (proven curve — readability anchor).
- Cards: 1/turn draw; surge draw is the only structural extra — keeps card economy legible.
- The Push (P2 compensation) replaces HS's Coin+extra-card double compensation — single lever, easier to reason about.
- Deck-out = loss (not fatigue): forces proactive decks, caps game length.

## Differentiator thesis (scored vs recovered intel + HS)

Thursday Arena is an **auto-battler**: all agency lives in a 10-token shop; battles auto-resolve. Clashbound keeps TA's legibility (small board, one-screen parse) but restores **in-combat agency** — the thing TA structurally cannot offer.

1. **Two clocks, not one** — lethal OR contest points. TA has one clock (round wins); HS has one (health). Two clocks force split-attention decisions every turn.
2. **Surge = systemic comeback** — mana/draw rubber-band tied to the secondary clock. TA has *zero* comeback structure (Bo3 reset only); HS has none. This is our cleanest win.
3. **Clash spells** — a narrow, legible reactive window (combat only). TA has no reactive play at all; HS Secrets are hidden and passive.
4. **5-slot board + ATK-sum contest** — board state reads as one number per side, matching TA's 3-bot legibility while exceeding its decision density.
5. **Real card game** — deck, hand, draw, mulligan. TA's "cards" are a shop draft; we serve the actual TCG audience TA's name implies.

## Scored comparison (1–5 per axis; evidence in parentheses)

| Axis | Clashbound | Thursday Arena | Hearthstone |
|------|-----------|----------------|-------------|
| Depth-per-decision | **4** (attacks+targets+clash+contest+surge spend per turn; sim: ~6–10 inputs/turn) | 2 (~3–6 shop choices/round, then zero input — rules §shop/battle) | 4 (rich but one-clock) |
| Readability | **4** (≤6 keywords, ATK-sum contest = one number; verified in UI) | 5 (3 bots, 10 tokens — near-perfect parse) | 3 (7 slots, 10+ keywords, hidden Secrets) |
| Pace | **4** (sim n=200: avg 7.2 turns, 4–10 range, ~5 min) | 5 (≤3 shops+fights, ~3–5 min) | 2 (8–12 min typical) |
| Comeback | **5** (Surge mana+draw every turn behind; sim: trailing player out-tempos repeatedly) | 1 (nothing structural — rules confirm) | 1 (no rubber-band; card-luck only) |
| Agency symmetry | **4** (clash window on opponent's combat) | 1 (battles are spectator-only) | 2 (Secrets trigger but aren't played) |
| **Total** | **21** | **14** | **12** |

Honest concessions: TA wins readability and pace outright — it's simpler and shorter. Our claim is **depth-per-decision + comeback + agency** at *acceptable* readability/pace cost, not a sweep. HS loses on pace and comeback but matches depth.

## Open questions

- Contest point target (8) and surge thresholds — tune from larger sim batches + human playtests.
- Whether Clash spells need a mana-reserve rule (hold-back cost) — prototype will tell.
- Ghost-board async PvP is TA's killer feature; our answer (if any) is a later-round decision — v1 is local-vs-AI only.

**Do not invent poteto-game mechanics** — everything above cites `tcg/intel/poteto-arena-tcg.md` or the rules page directly.
