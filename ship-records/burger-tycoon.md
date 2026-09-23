# Ship record — Burger Tycoon (remake of Molleindustria's McDonald's Videogame)

Original reference: Burger Tycoon (Molleindustria's McDonald's Videogame,
~2006) — four-pane supply-chain management sim with a dirty-action economy.
Branding precedent: ship as "Burger Tycoon" twin, no McDonald's marks.

Status: **SHIP-CANDIDATE (sr2)** — constants tuned, audio + art + flow
complete, full acceptance + flow verification PASS on the final build.
Last updated: 2026-09-23 (implementation lane: constants/audio/flow/art, sr2).

## Survey — implementations found

1. `prototypes/burger-tycoon.html` (463 lines, zero-dep, file://) — verified
   PASS: single economy `S` + per-pane action tables, rates/sec tick with
   0.25s dt clamp, 3 dirty toggles, disease accumulator→outbreak,
   backlash→rep-drain→REPUTATION COLLAPSE, two fail conditions,
   board-pressure stall detector, sim runs idle. DOM tabs/HUD/log + canvas
   pane scenes (r1). Read-only `__proto` getter hook. Caveat: 72s rep-collapse
   end-state marked [INFERENCE from proto card] — mechanism verified, exact
   end-state timing not independently reproduced.
2. `MAGA-everything/02-code/armor-games/apps/burger-tycoon` — `sim.ts` ported
   1:1 from the proto (verified mechanics); sr2 extended it into the ship
   rendition: tuned constants, r1 art port, WebAudio cues + Muzak, title /
   play / pause / settings / game-over states, best-time + audio settings
   persistence. This is the rendition reachable from the hub.

Docs: concept spec `02-concept-specs/03-mcdonalds-game.md` (four panes
farm/feedlot/restaurant/HQ, dirty-options→backlash coupling, "no clean win",
forced-failure path), audio doctrine `06-audio/README.md`, build card.

## Decision: EXTEND `apps/burger-tycoon` (carried from sr1, now executed)

App sim is a verified 1:1 port of the verified proto; strongest proof story
of the six. sr2 completed the remaining presentation + tuning work in place.

## Constants — tuned 2026-09-23 (declared guesses resolved)

Tuning method: `verification/evidence/sr2-burger-tune.mjs` compiles the real
`sim.ts` via esbuild and playtests scripted strategies (fixed dt=1/60):
IDLE (no input), CLEAN (honest play), DIRTY (all toggles at t=0), MIXED
(skilled dirty: cheapFeed pulsed against disease, cutCorners, PR/bribe
scrubbing). Targets derived from the concept spec: clean viable-but-tight,
dirty tempting with compounding backlash, no clean win, forced failure with
pressure comparable to sr1's collapse at t≈42s.

| Constant (sim.ts) | Proto guess | Tuned | Rationale |
|---|---|---|---|
| rates.crop | 1.2 | **1.8** | Clean chain was crops-starved at equilibrium; 1.8 feeds herd + patty line |
| rates.herd | 0.3 | **0.6** | Herd growth must offset slaughter drain (0.65/s at capacity) or the herd collapses to a degenerate 1.2-head attractor |
| rates.patty (capacity) | 0.9 | **1.3** | Clean income ceiling $7.8/s at $6 margin — high enough to feel viable, low enough for the squeeze |
| rates.profitPerBurger | 5 | **6** | Clean ceiling $7.8/s vs overhead $4→; dirty margin ×1.6 = $9.6 (tempting) |
| rates.overhead (base) | 4 | **4** | Unchanged; $500 float = ~2min runway if idle |
| rates.overheadEscalationS | — | **600** | Overhead doubles every 10 min — the slow squeeze that makes "no clean win" literal (clean death ≈ t=635s) |
| rates.demandFade | — | **0.008/s** | Hype fades to 1.0 — the marketing treadmill; holding demand costs ~$1/s, stockpile bursts via marketing stay profitable |
| rates.dirtySynergy | — | **0.25/s** | Each extra engaged dirty toggle compounds backlash (2→+0.25, 3→+0.75/s) |
| Graze model | herd×2×dt | **0.03/head/s, gate crops>0.1/head** | Proto graze let cattle balloon unbounded and starve the chain; the pasture gate self-limits the herd |
| Backlash rates | 1.2/0.8/1.0 | **1.2/0.6/0.8** (deforest/cheapFeed/cutCorners) | 2-toggle bl ≈1.4/s — scrubbable at real cost; 3-toggle ≈3.3/s — not |
| blStain (scrub residue) | — | **+4 (PR −25), +5 (bribe −25), cap 40, counts toward thresholds** | Compounding backlash: scrubbing buries headlines, never removes them; long dirty runs are doomed by the stain floor |
| PR spin | −15 / $100 | **−25 / $90+25·uses, +4 stain** | Scrub must outpace 2-toggle backlash; escalating cost + stain = the satire treadmill |
| Bribe | −25 / $200 / −4 rep | **−25 / $200+50·uses / −4 rep / +5 stain** | Stronger scrub, rep cost + stain keep it from being a loop |
| Disease | +0.6/s, outbreak>20, rep −12, bl +15 | **+0.6/s on, −0.8/s off, outbreak>20: cattle×0.5, rep −12, bl +12+4·outbreaks** | Toggling cheapFeed off vents disease — pulsing is a learnable skill; outbreaks compound |
| Initial state | cash 500, rep 70, crops 20, cattle 10, patties 10, demand 1.0 | **unchanged** | sr1-verified opening; tuned rates make it tight-but-fair |

Playtest outcomes (sr2-burger-tune.log, ALL TARGETS PASS):

| Strategy | End | Peak cash | Reading |
|---|---|---|---|
| IDLE (no input) | BANKRUPT t=610s | $792 | Slow bleed — the sim idles forward (AC7) but walking away is not a strategy |
| CLEAN (no dirty) | BANKRUPT t=635s | $438 | Viable-but-tight: margins oscillate near zero; the escalation squeeze ends every clean run — **no clean win** |
| DIRTY (3 toggles at t=0) | REPUTATION COLLAPSE t=40s | $908 | Full spam = fast ugly death, comparable pressure to sr1's t=42s |
| MIXED (skilled 2-toggle + scrub) | REPUTATION COLLAPSE t=280s | $670 | Dirty pays ~1.5× clean's peak and buys time, but stain + outbreaks + escalating scrub costs guarantee the end |

Satire delivered: dirty options make you richer and kill you sooner; clean
play keeps you poorer and kills you later; nothing is sustainable.

## Audio (sr2) — zero binary assets, WebAudio recipes only

- `packages/arcade-core/src/sfx.ts` extended (backward-compatible — all
  sibling apps still typecheck): sfx/music gain buses with `musicVolume` /
  `sfxVolume` multipliers over master `volume`; `blip()` gains `noise`
  (white-noise mix) + `filter` options per the doctrine recipe schema;
  `startMusic()` accepts chords (`number[]` steps); verification-readable
  `voices` counter + `running` getter. No existing API changed.
- `apps/burger-tycoon/src/audio.ts`: I-vi-IV-V triangle-wave Muzak bed
  (starts on first gesture, stops on game over) + 15 composed cues: ui
  click, cash register, sow, cattle, slaughter, dirty on/off (low saw
  drone), promo, PR "shhh" (band-passed noise), bribe, disease-outbreak
  alarm, board-intervention thud, collapse sting, run-start arpeggio.
  Wired: pane hotkeys/tabs → click; actions → per-action cue; sim events
  (DISEASE/BOARD/GAME OVER log lines, backlash >60 crossing) → stings.
- Settings (mission floor exceeded): DOM panel with MUSIC volume, SFX
  volume, MUTE ALL; persisted at `maga:burger-tycoon:audio`; reachable from
  the HUD (all states) and the title screen; applied live to the buses.

## Flow (sr2) — every state has an exit

`title → play ⇄ pause → over → retry|title`; settings overlay opens/closes
from title and play. Title: animated 2×2 scene backdrop, wordmark, best
time, START RUN / SETTINGS. Pause (Esc/P or HUD button): RESUME / RESTART
/ QUIT TO TITLE — sim frozen, muzak continues. Game over: proto-style
rotated BANKRUPT/SHUT DOWN stamp, reason, survived/best, RETRY / TITLE.
Restart resets sim + events + stings. Touch: DOM tabs + large action cards
tappable (sr1 AC4 re-proven sr2).

## Art (sr2) — proto r1 visuals brought home

`apps/burger-tycoon/src/scenes.ts` ports the proto's zero-dep drawing code:
pane scenes (farm with dirty burn variant, feedlot + disease wisps,
restaurant + queue/money-floats, HQ night tower + profit ticker + board
alarm tint), the vector icon set (12 glyphs), proto-style action cards
(hazard-stripe dirty cards, ENGAGED pulse, dynamic PR/bribe costs), sheened
gauges with red zones + change flash, rotated game-over stamp, parchment
backdrop. Desktop grid shows all four panes alive simultaneously (the
"frantic multi-panel attention" feel target); mobile single-pane uses the
proto's full-size layout. Hand-authored Canvas2D only — no external assets.
(The app's earlier pixel-sprite icons.ts remains only for the wordmark.)

## Verification

Recorded commands (last observed results, 2026-09-23):

- Tuning: `node verification/evidence/sr2-burger-tune.mjs` — **ALL TUNING
  TARGETS PASS** (`sr2-burger-tune.log`).
- App acceptance + flow: `npm run dev:burger` (port 5175) then
  `node verification/evidence/sr2-burger-run.mjs` — **ALL PASS (24 checks)**
  (`sr2-burger-run.log`): title at boot + title→play (real click); AC7
  sim-idles; AC1 four-panes-affect-economy (crops 20→36, patties 10→14,
  demand 1.0→1.9, cash 500→343); AC2 dirty=cutCorners (profit 0→$14.4/s,
  backlash 0→1.1); SFX scheduled (WebAudio running, 34 voices after clicks);
  pause Esc freezes sim (t 2.5→2.5), resume Esc unfreezes (t→4.1);
  settings volumes+mute applied and persisted (`maga:burger-tycoon:audio`),
  restored across reload (slider 29/30 rounding tolerance); back to play
  after reload; AC5 no-McD-marks (body-text scan, none); AC6 English-only
  (0 non-Latin/accented chars); AC3 forced failure via real dirty-toggle
  clicks → **REPUTATION COLLAPSE at t=40s**, rep 0, backlash 100 (sr1
  reference t=42s); restart via real RETRY click; best-time persistence
  across reload; 0 app-originated console errors. AC4 mobile (500px
  viewport, second profile): 4 DOM tabs, pane 4 reachable, single-pane art,
  0 errors. Screenshots: `sr2-burger-title.png`, `sr2-burger-grid.png`,
  `sr2-burger-collapse.png`, `sr2-burger-mobile.png`,
  `sr2-burger-settings.png`.
- Hub entry: `npm run build -w @maga/burger-tycoon` + stage to
  `games/burger-tycoon/` (clean copy of dist, same as tools/build-fleet.mjs
  does for this slug), `python3 -m http.server 8123` from the repo root,
  then `node verification/evidence/sr2-hub-run.mjs` — **ALL PASS**: hub card
  real-click navigates into the built game, title boots, real sow click
  (crops 20→36), **0 console errors, 0 non-local requests**
  (`sr2-hub-run.log`, `sr2-hub-burger.png`).
- Typecheck: `npx tsc --noEmit -p apps/burger-tycoon` clean; sibling apps
  (boxhead, impossible, chicken-invaders, cluck-horizon, swords-and-sandals)
  still typecheck against the extended arcade-core.
- Prior rounds on record: sr1 (7/7 PASS), r05, proto verdicts — superseded
  by sr2 on the final build but kept above for provenance.

Ship-gate checklist:
- [x] Four panes affect shared economy (AC1, real clicks)
- [x] Dirty action raises short-term profit + backlash (AC2)
- [x] Forced failure reachable with comparable pressure (AC3, t=40s vs 42s)
- [x] Mobile tabs one-handed (AC4)
- [x] No McDonald's marks (AC5)
- [x] English-only (AC6)
- [x] Sim idles forward (AC7)
- [x] Constants tuned from declared guesses, rationale recorded
- [x] Audio: Muzak bed + SFX cues, zero binary assets, settings persisted
- [x] Title / pause / settings / game-over / restart — all with exits
- [x] Art: proto r1 port, hand-authored, coherent
- [x] Hub entry boot-proof: 0 console errors, 0 non-local requests
- [x] Typecheck + build clean; siblings unaffected
- [ ] Public release clearance — standing meta-gate (INTERNAL-NO-PUBLIC
      badge: Molleindustria CC deed + marks review), not a game defect

## Deferrals

- Rights gate: ship stays INTERNAL-NO-PUBLIC until written clearance
  (badge shown in-game; recorded on the hub). Out of scope for code runs.
- Win state: intentionally none (satire — the concept spec's "no clean
  win"); best-time persistence is the score loop.
- Keyboard rebinding / richer difficulty tiers: not in the original's
  scope; deferred.
- Sibling-app audio (boxhead/impossible/etc.) remains on the legacy preset
  set — arcade-core extension was kept backward-compatible by design; only
  burger-tycoon adopts the new buses/chords/noise.

## Provenance declaration

Consulted: this working copy only — git history, `verification/`,
`MAGA-everything/01-design-docs/` (concept spec, audio doctrine),
`prototypes/burger-tycoon.html` (art/mechanics reference), plus my own
knowledge of the original game. No web/GitHub searches about this project,
no forks/copies, no third-party remakes of the original were consulted.
No binary assets were generated or fetched; all art is hand-authored
Canvas2D and all audio is runtime WebAudio synthesis.
