# Ship record — Crateheads (internal evocation of Boxhead: 2Play Rooms)

Original reference: Boxhead: 2Play Rooms (2007), top-down arena survival,
solo + local 2P co-op + deathmatch. Player-facing branding is an original
evocation: **Crateheads**. INTERNAL-NO-PUBLIC badge per fleet convention.

Status: **SHIP-CANDIDATE** — sr2 verification wave complete. Canonical
real-input suite 53/55 on the final build; both reds dispositioned (one
re-proven green by a focused probe, one honest deferral — see Verification).
Last updated: 2026-09-23 (sr2: rights sweep, constants tuning, stub/defect
closure, audio + art implementation, zombie-pathing fix, full real-input
re-verification, hub boot-proof).

## Survey — implementations found

1. `MAGA-everything/02-code/armor-games/apps/boxhead` — Pixi 8 (external via
   vendored importmap), TS/Vite. EXTENDED this run (was: ~1,416 LOC verified
   mechanics baseline; now ships rights-clean branding, tuned tables, full
   audio, procedural art). Sole rendition, staged to `games/boxhead/`.
2. `boxhead-2play-spike/` — deleted from tree pre-run; retired.
3. No `prototypes/` entry for this title.

## Decision: EXTEND (carried from sr1)

Prior verified work (B-N1/B-N2 sign-offs, sr1 37/39) outranks taste; this run
fixed forward on the same architecture. Exactly one rendition reachable from
the root hub (`games/boxhead/`, card name "Crateheads").

## Rights (sr2)

- Player-facing title "BOXHEAD — 2PLAY ROOMS (native replica)" →
  **"CRATEHEADS"** (`src/game.ts` title screen); `<title>Crateheads</title>`.
- Direct-authored title wordmark re-lettered CRATEHEADS
  (`public/art/crateheads-logo.svg`; old `boxhead-logo.svg` +
  `floor-tile.svg` deleted — floor superseded by procedural tiles).
- INTERNAL-NO-PUBLIC badge retained per fleet convention.
- Code comments / docs may reference the original by name (mission-allowed);
  no original marks in any player-facing string. Verified live: `RIGHTS-*`
  rows; grep of the shipped bundle: 0 "BOXHEAD" occurrences.

## Constants (all placeholders resolved; sr2-tuned)

Original values are a documented evidence gap (dossier §Evidence gaps), so
each is a **declared tuning value** with rationale. Iterated against a
real-input CDP player-bot across 15 suite runs (see Verification).

| Constant | Was | Final | Rationale |
|---|---|---|---|
| Wave tables | 5/9/14 @1.4/1.1/0.85 | 8/14/22 @1.3/1.1/0.9, runners 0/2/4 | First sr2 try 12/22/36 swarmed wave 2 (probe: bot died, ammo bankrupt); placeholder 5/9/14 cleared in 49s. ~1.75×/wave with runners from wave 2 = chaotic but killable; ~1.5–3 min run |
| Zombie HP | walker 2 / runner 1 (TBD) | 1 / 1 | 2hp burned a full magazine in wave 1 (economy bankruptcy, probe-verified); matches the original's feel — basics pop in one pistol hit, pressure comes from numbers + runner speed; weapons differ by rate/spread/AoE |
| Player speed | 125 (TBD) | 125 | Outruns walkers (30–42) and runners (×1.8) — kiting always possible (probe: 90s lap survival at hp 80) |
| Contact/bullet damage | 10 (TBD ×2) | 10 (`HIT_DAMAGE`) | 100hp = 10 hits; 0.8s contact invuln caps swarm DPS ≈12.5hp/s — frantic but escapable |
| Weapon thresholds | 4/8/14 (stub) | 3/6/10 | Shotgun lands inside wave 1, uzi wave 2, grenades wave 3; dossier order pistol→shotgun→uzi→grenades |
| fireDelay / ammo-per-shot | stubs | 0.34/0.5/0.14/0.8; grenades cost 2 | Original feel mapping; AoE ordnance tax |
| DM target kills | 5 (STUB) | 5, rule implemented | First-to-5 + crate economy = ~1–2 min match (observed 5–0/5–1) |
| Barrel radius/damage | 55/25 | unchanged | Quarter-life damage, readable ring; chain + credit propagation |
| Crate ammo/first/cadence | 16/8s/12s | **24**/8s/**10s** | Probe-proven economy: 16 starved wave 3 (bot reached wave 3 dry in 3 of 4 runs); 24/crate @10s clears the 3-wave slice with margin while crates still matter |
| Grenade blast | radius 60 (D-03), owner-exempt (D-19) | unchanged | Multi-kill capable; single-lob ≥3 capture deferred (below) |
| Stage size | 640×400 provisional | unchanged | D-05 doc contradiction is doc-scope; changing it would invalidate signed display proofs |

## Stubs closed (sr2)

- **DM AoE kill-credit** (`game.ts` detonate): blast kills credit the
  responsible player in all modes — grenade owner, or the player whose
  bullet lit the barrel (`Barrel.litBy`); chained barrels inherit the
  lighter's credit. Verified live in the canonical suite
  (`DM-aoe-kill-credit`, runs 13/14/15) and the focused probe
  (`sr2-boxhead-aoe-probe.log` B, 3× consecutive PASS).
- **DM_TARGET_KILLS**: implemented as first-to-5; banners/HUD free of
  "STUB/TBD". Verified: `DM-match-end` ("P1 WINS THE DEATHMATCH 5–1"),
  `DM-target-5`, `DM-rematch`.
- **Placeholder music bed**: replaced by the sound bible's recipe beds.
- **`assets/MANIFEST.md`**: rewritten — every slot resolved procedurally;
  zero binary assets (doctrine).

## Defects closed (sr2)

| ID | Fix | Verified |
|---|---|---|
| D-55 | Pause banner promises "M — menu" only (Enter=fire does nothing) | `D-55-enter-noop` (canonical) |
| D-56 | `showModeSelect` hides the frozen world (`world.visible=false`) | `D-56-world-hidden` (canonical) |
| D-57 | Crate timer only ticks under the cap — no negative-time instant respawn | `D-57-crate-timer` (canonical) |
| D-58 | `visibilitychange` resume: first 350ms wall-clock runs at ≤1/60s dt with 0.12s contact grace (`resumeGraceUntil`) | not live-reproducible headless (r05 same); fix shipped by inspection |
| D-18 | Banner bleed — already fixed on tree; re-verified | `D-18-banner-clear` (canonical) |
| **NEW (sr2)** | Zombie pathing softlock: a lone zombie exactly aligned behind an obstacle was blocked on both axes forever (wave could never end — caught as a 90s no-death anomaly) | unstick wander in `Zombie.chase` (0.45s lateral slide when fully blocked); DEATH-idle + wave-clear behavior green in all subsequent runs |

Open (doc-scope or carried): D-05 (stage-size doc contradiction), D-06
(stale ticket header), D-08 (F3 isolated 60fps scenario; `?stress` enabler
stands), D-19 (ruling owed: co-op partner grenade friendly-fire stays,
owner exempt), D-36-family cosmetic (victory HUD shows WAVE 4/3 behind the
banner — same class as shmup's D-36; end-screen only).

## Audio (sound bible implemented; zero binary)

`src/audio.ts` — all cues WebAudio recipes via arcade-core's `Sfx`
(consumed as-is; **no `packages/*` changes**):

- Weapons: pistol (noise+square bandpass), shotgun (wide noise + sub thud),
  uzi (short square tick), grenade throw, empty click.
- World: barrel/grenade explode (saw_thud + noise, **music duck 200ms**),
  ammo pickup, weapon-unlock arpeggio, wave-start sting, runner-spawn alarm
  (first runner per wave).
- Enemies/players: zombie hit, zombie death, player hurt, player death.
- UI/session: menu move/confirm, player-join arpeggio (co-op/DM pick),
  game-over descending sting, high-score arpeggio, victory sting.
- Music: menu drone (triangle, `music.menu`), combat bed (square bass
  pulse, `music.combat`), DM bed (faster step).
- **Settings** (sibling-app pattern): SETTINGS chrome button → panel with
  MUSIC/SFX sliders + MUTE, persisted `maga:boxhead:audio`; SOUND ON/OFF
  quick-toggle kept and synced. Reachable on every screen incl. pause.
  Verified: `SETTINGS-live/mute/persist-reload/restored`.
- Verified: `AUDIO-scheduled` (ctx running, voices>0 after real fire input).

## Art (native recipes §4 implemented procedurally; hit-rects unchanged)

- `src/art/palette.ts` — full token module (B-N0 deliverable).
- Entities: players (body/head/eyes + p1/p2 stripe, 2-frame walk bob),
  walkers alternate two green skins, runners read as the horned red special
  (§4.4), muzzle flash (§4.6), blood/debris specks (§4.10/§4.16), crate
  (§4.7), barrel + idle fuse blink (§4.8), blast ring + hot core.
- Arena: per-room tile sets (§4.20) — warehouse (open-yard) / lab (pillars)
  checker floors, walled border with highlight/shadow, obstacle blocks.
- HUD: HP/ammo bar chips (§4.12), streak chip with warn flash (§4.18),
  banner backdrop bar (§4.15). Touch chrome per §4.13 (panel stick,
  accent knob, labeled FIRE).
- Sim semantics identical: all hit-rects, radii, speeds preserved (only
  zombie HP + crate economy changed, tabled above). Integer letterbox
  untouched.

## Verification

Recorded commands (last observed results):
- `npm run typecheck -w @maga/boxhead` — PASS (clean).
- `npm run build -w @maga/boxhead` — PASS (dist JS 41.08 kB, pixi external
  via importmap, vendored under `dist/vendor/` → `games/boxhead/vendor/`).
- **sr2 canonical suite (2026-09-23, final build):** zero-dep node-24 CDP
  driver (`verification/evidence/sr2-boxhead-cdp.mjs` +
  `sr2-boxhead-run.mjs`, chromium 151 headless=new, CDP 9401, real
  `Input.dispatch*` events) against the built `apps/boxhead/dist` served on
  127.0.0.1:8281 — the same bytes staged to `games/boxhead/`. Result
  **53/55**, 0 console errors, 0 non-local requests. Full log:
  `verification/evidence/sr2-boxhead-run.log`.
  - Solo: **victory waves 1–3, score 39600, 76s** (ring-lap player-bot:
    close-range tap-fire, threat-gated crate runs, barrel shots);
    ladder pistol→shotgun→uzi→grenades; swarm peaks 10–12; crates; death→
    OVERRUN→retry; pause ESC/P ×world-frozen + D-55; pause→M (D-56 world
    hidden, D-18 banner clear); high-score persist across reload.
  - Co-op: simultaneous move+fire, friendly fire inert, pause.
  - DM: crates enabled, P2→P1 damage, **barrel AoE kill-credit (the sr1
    stub) P2 kills 0→1**, match to first-to-5 (5–1), rematch.
  - Touch (emulated): menus, stick, FIRE, portrait letterbox, dead-screen
    tap retry + MENU chip.
  - New checks: settings persist across reload, audio scheduled, D-55/56/57
    closed in-run, D-58 fix in place (not headless-reproducible), rights.
  - Red disposition: `SOLO-blast-kill` re-proven PASS by the focused AoE
    probe (`sr2-boxhead-aoe-probe.log` A: barrel blast +300 score credited,
    `sr2-boxhead-aoe-solo.png`; suite in-run barrel opportunities are
    bot-variance). `GRENADE-aoe-multikill` deferred (below).
- **Focused probes:** `sr2-boxhead-aoe-probe.mjs` (solo barrel blast credit
  + DM AoE credit, 3 consecutive PASSes), `sr2-boxhead-dm-probe.mjs`
  (match end 5–0), `sr2-boxhead-grenade-probe.mjs` (attempts).
- **Hub boot-proof (sr2, PASS):** `python3 -m http.server 8283` from repo
  root; real hub-card click (card name "Crateheads") → built game boots →
  real keys Space/1/1 → instrumented state `playing, solo, wave 1, zombies
  on field` — 0 console errors, 0 non-local requests. Evidence:
  `sr2-hub-boxhead.log`, `sr2-hub-boxhead.png`.
- Acceptance rows: `apps/boxhead/docs/PROOF-CHECKLIST.md` (sr2 fill).
- Evidence set (6 PNGs): `sr2-boxhead-solo-wave3.png`,
  `sr2-boxhead-victory.png`, `sr2-boxhead-coop.png`,
  `sr2-boxhead-dm-end.png`, `sr2-boxhead-touch.png`,
  `sr2-boxhead-aoe-solo.png` (+ `sr2-hub-boxhead.png` hub).

Ship-gate checklist (acceptance A–G per design pack + mission bar): green
for A–F on the sr2 canonical run (F3–F6 carried from r05 `?stress`
measurement — not re-isolated this run); G (Firefox/phone/tablet matrix)
deferred — no devices in lab (same deferral family as sr1).

## Deferrals

- **Grenade AoE single-lob multi-kill (≥3)**: mechanic reached and lobbed in
  real runs; the specific ≥3-in-one-blast capture did not align under
  automation across 15 suite runs + 3 focused probes (mult-building bots
  clear the field before clusters form; surround-waiting bots stall below
  the tier). The identical AoE credit path is proven via barrel blasts
  (+300 sr2, +500/+900 sr1) and DM barrel credit. Human-grade capture
  remains the cheapest path.
- G suite matrix (Firefox / real phone / tablet) — no lab devices.
- D-58 live reproduction (needs a genuinely throttling browser); fix shipped
  by inspection, code path in place.
- C4 dual-pad 2P touch (BH-2.2 waiver stands — no tablet).
- D-05/D-06 doc reconciliation (maga-docs scope).
- Score-popup digit sprites (§4.11) — HUD chips + banners shipped instead.
- Cosmetic: victory HUD shows "WAVE 4/3" behind the clear banner
  (D-36-family; end-screen only).

## Provenance declaration

Consulted: this working copy only — git history, `verification/` (divergence
register, runtime verdicts, sr1 evidence), `MAGA-everything/01-design-docs/`
(concept spec, dossier, visual direction, native recipes, sound bible +
recipes JSON, acceptance checklist), `MAGA-everything/02-code/` (apps +
arcade-core), plus my own knowledge of the original game. No web/GitHub
searches about this project, no forks/copies, no third-party remakes of the
original were consulted. No network use beyond localhost verification and
the pre-existing npm toolchain.
