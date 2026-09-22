# Arena TCG — Design Doc (working title: **CLASHBOUND**)

## Meta

| Field | Value |
|-------|-------|
| **Slug** | `clashbound` |
| **Working title** | Clashbound — an arena trading-card game |
| **Status** | R3 — balance + seat-equity landed; all gates green; K3 visuals-polish handoff next |
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

1. **Deck** — 25 cards, max 3 copies, from a 44-card pool (R2: +Pit Fighter, Crowd Shield, Pit Guard, Crowd Hush). One hero per deck; hero sets power + surge flavor.
2. **Open** — each player draws 3, mulligans any number once. Player 2 gets **The Push** (a 0-cost spell: "+1 mana this turn. Draw a card." — R3: draw added; +1 mana alone left a ~10pp P1 seat skew).
3. **Turn** — *Refresh* (mana = turn number, cap 10) → *Draw* → *Main* (play cards, hero power, attacks in any order) → *Contest check* → end.
4. **Board** — 5 minion slots per side. Minions have ATK/HP, summoning sickness, and attack enemy minions or the enemy hero directly.
5. **Contest track** — the arena has a center **Contest Zone**. At each turn's end, the side with more total ATK on board scores 1 **Contest Point** (ties: no point). **Contest steal:** if the loser led by ≥2 CP, the winner steals a point instead (−1/+1 swing). **Guard minions hold ground — their ATK does not count toward the contest sum** (R2: prevents walls from double-dipping as both defense and contest offense). First to **8 Contest Points** wins *or* reduce enemy hero from **20 → 0**.
6. **Surge (comeback engine)** — at your Refresh, if the opponent leads in Contest Points **by ≥3**, gain **+1 temporary mana** this turn. Structural rubber-band: the leader can't stall, the trailer can't be starved. (R2: flat surge subsidized the stronger deck's recovery — the ≥3 threshold makes it a true comeback lever.)
7. **End** — win by lethal, contest victory, or opponent decking out (deck-out = instant loss, no fatigue drip — pace).

## Card model (v1)

- **Minions** — cost / ATK / HP / ≤1 keyword / ≤1 ability line.
- **Spells** — cost / effect; one reactive subclass (**Clash** spells, playable during the opponent's combat step — the agency-symmetry lever).
- **Keywords (≤6, the readability budget):**
  - **Guard** (taunt): enemies must attack this first.
  - **Blitz** (charge): can attack the turn it's played.
  - **Pierce**: excess combat damage to a minion carries to the hero; **Pierce attackers may ignore Guard** (R2: reach — the anti-wall lever).
  - **Deathcry**: triggers on death.
  - **Warcry**: triggers on play.
  - **Ward**: ignores the first damage each turn.
- **Heroes (v1: 3)** — each: 20 HP, one 2-mana hero power, one passive surge modifier:
  - **Vex the Pitwright** — power: deal 1 damage to a minion. Surge: +1 mana when behind (standard).
  - **Mother Thorn** — power: give a minion +0/+1. Surge: standard (+1 mana when behind by ≥3). (R3: +0/+2 power + board-wide surge ATK was the bulwark skew's biggest single lever.)
  - **The Oddsmaker** — power: **Shave the Odds** — enemy minion with highest ATK gets −3 ATK. Surge: standard.

## Economy

- Mana: +1 crystal/turn to 10 (proven curve — readability anchor).
- Cards: 1/turn draw; Rigged Bout and Warcry/Deathcry draws are the only extras — keeps card economy legible.
- The Push (P2 compensation) replaces HS's Coin+extra-card double compensation — single lever, easier to reason about. R3 sizing: +1 mana + 1 card ≈ HS's Coin+card combined into one spell.
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
| Depth-per-decision | **4** (attacks+targets+clash+contest+surge spend per turn; sim: ~4.5–7.2 inputs/round, 4.1–7.8 legal lines/turn) | 2 (~3-6 shop choices/round, then zero input - rules §shop/battle) | 4 (rich but one-clock) |
| Readability | **4** (≤6 keywords, ATK-sum contest = one number; verified in UI) | 5 (3 bots, 10 tokens — near-perfect parse) | 3 (7 slots, 10+ keywords, hidden Secrets) |
| Pace | **4** (sim n=300/pair: avg 8.0–10.0 turns, ~5 min) | 5 (≤3 shops+fights, ~3–5 min) | 2 (8–12 min typical) |
| Comeback | **5** (Surge mana when behind ≥3 CP + contest steal; sim: trailing player reverses the CP lead ~1.1×/game) | 1 (nothing structural — rules confirm) | 1 (no rubber-band; card-luck only) |
| Agency symmetry | **4** (clash window on opponent's combat) | 1 (battles are spectator-only) | 2 (Secrets trigger but aren't played) |
| **Total** | **21** | **14** | **12** |

Honest concessions: TA wins readability and pace outright — it's simpler and shorter. Our claim is **depth-per-decision + comeback + agency** at *acceptable* readability/pace cost, not a sweep. HS loses on pace and comeback but matches depth.

## R3 balance + seat-equity pass (sim-verified)

R2 left two violations: bulwark>bruiser symmetrized ≈64% (ordered 72/46) and a ~10pp P1 seat skew (mirrors 58–62%). A 16-lane variant search (m_kcode quota died mid-wave; L1 completed the search directly) tested 11 variants + 3 combos; the accepted combo:

| Change | Rationale (evidence) |
|---|---|
| **The Push: +1 mana → +1 mana + draw 1** | Pure +2 mana did nothing for seat equity (mirrors unchanged 57–58%); +mana+draw lands mirrors at 45–53% P1 and pulls bulwark>bruiser sym to 62.5% as a side effect. |
| **Guard minions −1 HP (all six)** | Walls were over-efficient: brick-keeper 4→3, pit-guard 5→4, wall-of-teeth 6→5, iron-barker 5→4, last-bell 7→6, bone-colossus 8→7. Alone: bulwark>bruiser sym 63→52% but bulwark>trickster slides to 36% floor. |
| **Mother Thorn: power +0/+2 → +0/+1; surge 'thorn' → 'standard'** | Thorn's board-wide surge ATK + fat power was the bulwark leg's biggest single lever (thorn-nerf alone: bulwark>bruiser 72→69% ordered). |

**R3 matrix (300 games/pair, seed 1000+, integrated):**

| P1 \ P2 | bruiser | bulwark | trickster |
|---|---|---|---|
| bruiser | 46% | 41% | 56% |
| bulwark | 53% | 46% | 44% |
| trickster | 47% | 58% | 53% |

Symmetrized non-mirror legs: bulwark>bruiser **56%**, trickster>bulwark **57%**, bruiser>trickster **54%** — all inside 35–65%, clustered 54–57 (corrected R5: R3/R4 reported 53/51/53.5, which were the pre-integration variant-combo numbers, not this matrix's derivation). Mirrors 46–53% P1 (seat skew fixed). Avg turns 8.4–9.9, decisions/game 48–57, comeback rate 0.57–0.68, CP-lead reversals ~1.2/game.

Rejected in R3: contest target 7 (mirrors worsen, lethal gutted) and 9 (bulwark entrenches, pace out of band); Push +2 mana (no seat effect); Push +extra card (over-corrects 2 mirrors to 44% P1); bulwark curve rebuild (bulwark>trickster collapses to 15%); bruiser Pierce/burn packages (bulwark leg worsens — the problem was wall efficiency + Thorn, not bruiser's tools).

## Open questions

- Whether Clash spells need a mana-reserve rule (hold-back cost) — prototype will tell.
- Ghost-board async PvP is TA's killer feature; our answer (if any) is a later-round decision — v1 is local-vs-AI only.
- Card art: 44 cards still text-only in hand/board (hero portraits + card back + keyword strip exist). K3 polish owns this — see `.ufo/handoff/clashbound-k3-handoff.md`.

**Do not invent poteto-game mechanics** — everything above cites `tcg/intel/poteto-arena-tcg.md` or the rules page directly.
