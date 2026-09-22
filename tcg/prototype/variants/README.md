# Clashbound variant harness

Variant files are small, dependency-free probes loaded by the headless runner before games start. From the repository root:

```bash
node tcg/prototype/sim.js --variant tcg/prototype/variants/guard-no-contest.js --matrix 200
node tcg/prototype/sim.js --variant tcg/prototype/variants/odds-power2.js --deckA trickster --deckB bulwark 1000 300
```

`sim.js` accepts `--variant <file.js>`, resolves the path from the current working directory, and `require`s it before selecting decks and running games. A variant receives the global `CB` object and may mutate engine constants, cards/decks, heroes, or AI policy. The mutation is process-local: start a fresh Node process for every comparison. The harness exposes `--matrix`, `--deckA`, `--deckB`, `--heroA`, and `--heroB`; matrix rows are ordered seats, with deck A as P1.

## CB mutation contract

- Use `const CB = globalThis.CB` (or `const CB = globalThis.CB; const E = CB.engine`).
- Engine probes change exported values such as `CB.engine.GUARD_NO_CONTEST`, `PIERCE_BYPASS`, `SURGE_AT`, `SURGE_DRAW_AT`, `CONTEST_TARGET`, `START_HP`, `BOARD_CAP`, or `PUSH_CARD`.
- Card probes register a complete card in both `CB.cards.POOL` and `CB.cards.byId`, then replace IDs in a 25-card `CB.cards.DECKS.<name>` list. Keep card objects clone-safe: effects receive `(st, pi, target)` and must not mutate shared card definitions.
- Policy probes wrap an exported AI/engine function and should restore or compose existing behavior when the probe is only measuring a policy. A variant must not assume browser globals; the sim loads `engine.js`, `cards.js`, and `ai.js` first.
- The browser does not load variant files. Variants are sim-only experiments.

## Engine constants in the landed R2

`engine.js` exports `SURGE_AT = 3`, `SURGE_DRAW_AT = 99` (draw disabled), `PIERCE_BYPASS = true`, and `GUARD_NO_CONTEST = true`. Surge grants one temporary mana when the contest deficit reaches three; Guard ATK is excluded from contest totals; Pierce may attack past Guard. `SURGE_ODDS_AT = 99` is also disabled. These are the R2 baseline, not per-run flags.

## Card shape

A minion card has `id`, `name`, `type: "minion"`, `cost`, `atk`, `hp`, `keywords`, and optional `text`/`effect`. A spell has `id`, `name`, `type: "spell"`, `cost`, optional targeting metadata, and an `effect`. Register every new card in the pool and lookup map. Decks contain card objects in the browser and IDs in the sim-facing stock lists; preserve 25 cards and the normal two-copy limit unless the probe explicitly tests a limit.

## Variant catalogue

Status is the R2 landing decision. **Accepted** means the idea or component is represented in the final baseline; **rejected** means it remained a probe or was superseded. The key number is the decisive setting, card stat, or composition marker (not a claim that every probe used the same sample size).

| File | Finding | Key number |
|---|---|---:|
| active-only.js | rejected — removes defender steal | active scorer only |
| ai-defend.js | rejected — policy probe | highest-ATK trade |
| ai-develop.js | rejected — policy probe | minion-first |
| ai-race.js | rejected — face-rush policy | face when behind |
| ai-swing.js | rejected — face-redirection probe | face attacks |
| boardcap-4.js | rejected — cap worsened balance | 4 slots |
| bounce.js | rejected — Eject probe | cost 2 |
| bruiser-pierce.js | rejected — bespoke deck overfit | 2 Pierce cards |
| bulwark-trim.js | accepted — retained in final composition | 25 cards |
| burn-reach.js | rejected — burn skew remained | 4 hero damage |
| clash-open.js | rejected — changes Clash timing | normal-hand Clash |
| combo-a.js | rejected — intermediate composition | A |
| combo-aa.js | rejected — intermediate composition | AA |
| combo-b.js | rejected — intermediate composition | B |
| combo-c.js | rejected — AI race add-on | C |
| combo-d.js | rejected — Wallbreaker add-on | D |
| combo-e.js | rejected — develop policy add-on | E |
| combo-f.js | rejected — defend policy add-on | F |
| combo-final.js | rejected — superseded final candidate | −3 ATK |
| combo-final2.js | rejected — superseded final candidate | 1 Pit Guard |
| combo-final3.js | rejected — superseded final candidate | 2 Pit Guards |
| combo-final4.js | rejected — superseded final candidate | final4 |
| combo-final5.js | accepted — R2 landing composition | final5 |
| combo-g.js | rejected — intermediate composition | G |
| combo-h.js | rejected — intermediate composition | H |
| combo-i.js | rejected — intermediate composition | I |
| combo-j.js | rejected — intermediate composition | J |
| combo-k.js | rejected — intermediate composition | K |
| combo-l.js | rejected — intermediate composition | L |
| combo-m.js | rejected — intermediate composition | M |
| combo-n.js | rejected — intermediate composition | N |
| combo-o.js | rejected — intermediate composition | O |
| combo-p.js | rejected — intermediate composition | P |
| combo-q.js | rejected — intermediate composition | Q |
| combo-r.js | rejected — intermediate composition | R |
| combo-s.js | rejected — intermediate composition | S |
| combo-t.js | rejected — intermediate composition | T |
| combo-u.js | rejected — intermediate composition | U |
| combo-v.js | rejected — intermediate composition | V |
| combo-w.js | rejected — intermediate composition | W |
| combo-x.js | rejected — intermediate composition | X |
| combo-y.js | rejected — intermediate composition | Y |
| combo-z.js | rejected — intermediate composition | Z |
| contest-bodies.js | rejected — count-based contest is not R2 | count, not ATK |
| contest-t10.js | rejected — clock too slow | 10 points |
| contest-t6.js | rejected — clock changes matchup shape | 6 points |
| critic-degenerate.js | rejected — stress probe, not a deck | 0 ATK |
| critic-hoard-face.js | rejected — invalid seam/degenerate policy | face-only |
| crowd-shield.js | accepted — Crowd Shield landed | 0/4, cost 1 |
| guard-no-contest.js | accepted — Guard excluded from contest | true |
| guard-passive.js | rejected — pure walls remove attacks | passive=true |
| hp-18.js | rejected — pace-only alternative | 18 HP |
| hush.js | accepted — Crowd Hush landed | −1 ATK |
| no-push.js | rejected — removes P2 compensation | null |
| odds-power.js | rejected — weaker power revision | −2 ATK |
| odds-power2.js | accepted — Shave the Odds landed | −3 ATK |
| pierce-bypass.js | accepted — Pierce reaches past Guard | true |
| pit-guard.js | accepted — Pit Guard landed | 2/3 Guard |
| push-plus.js | rejected — extra P2 card overcorrects | +1 card |
| steal.js | rejected — theft probe | 2-cost steal |
| sunder-card.js | rejected — bespoke Guard removal | cost 2 |
| surge-boost.js | rejected — +2 mana overcorrects | 2 mana |
| surge-late.js | rejected — delayed Surge is weaker | late trigger |
| surge-off.js | rejected — removes comeback lever | 0 mana |
| sweeper.js | accepted — Pit Fighter landed | 3/2 sweeper |
| thorn-nerf.js | rejected — hero-specific skew | −1 Thorn |
| trickster-rebuild.js | accepted — rebuilt Trickster deck | 25 cards |
| trickster-v2.js | rejected — superseded rebuild | v2 |
| trickster-v3.js | rejected — superseded rebuild | v3 |
| trickster-v4.js | rejected — superseded rebuild | v4 |
| verdict.js | rejected — diagnostic composition | verdict probe |
| wallbreaker.js | rejected — extra Guard breaker skewed | cost 3 |

The retained R2 matrix is 300 games per ordered pair: 58/45/62, 73/60/56, and 60/63/62 P1 wins for Bruiser, Bulwark, and Trickster rows respectively. Average turns are 8.0–10.0, decisions/game 45–53, and comeback rate 0.48–0.51.
