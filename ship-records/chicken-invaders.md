# Ship record — Chicken Storm (CI2-era formula evocation) + Cluck Horizon pack

Original reference: Chicken Invaders 2: The Next Wave (2002) — vertical
shmup: formation waves, weapon gifts, missiles, bosses. (Not Flash-era;
no official SWF — fan Flash clones are explicitly unacceptable references.)
The shmup engine also carries **Cluck Horizon**, an original-IP second
content pack: the dual-pack architecture is kept (one engine, two packs).
Player-facing branding is original evocation; INTERNAL-NO-PUBLIC watermarks
stay on both apps per fleet convention.

Status: **SHIP-CANDIDATE** — rights sweep, constants resolution, composed
audio, authored art (both packs), defect burn (D-36/39/41/42/43/44), and
full sr2 verification on the final build recorded below.
Last updated: 2026-09-23 (sr2 ship-candidate wave).

## Survey — implementations found

1. `prototypes/chicken-invaders.html` (1,084 lines, zero-dep, file://) —
   richest proto, verified PASS: one engine + `PACKS{replica,cluck}`
   content-swap table; 2 chapters × 2 formation waves + boss; 3 weapon
   flavors via deterministic gift cycle; food→missiles; lives/1.2s
   respawn/2s invuln; boss telegraph-then-radial; descent clamps
   300/320/280; both mobile layouts (B one-thumb drag+auto-fire, A
   twin-thumb stick+hold-fire; toggle persisted `ci_proto_layout`;
   `touch-action:none` load-bearing). Null-guarded `__proto` getter hook
   (D-22 lesson).
2. `MAGA-everything/02-code/armor-games/packages/shmup-core` +
   `apps/chicken-invaders` (replica pack) + `apps/chicken-invaders-original`
   (cluck pack). Chapter select 1–2 with unlock persist, 2 waves +
   boss/chapter, 3 gift weapons, missiles/food, 3 lives + invuln, win after
   CH2, unified touch A/B, pause, settings, `?debug`. Proto crash
   divergences P-1/P-2 fixed + recorded. **ADOPTED/EXTENDED — this is the
   ship vehicle.**

Docs: concept specs `04-chicken-invaders.md` + `06-chicken-invaders-original.md`
(CI2 formula recreate; Cluck: 2 sectors × 1 boss, ≥3 original weapon kits,
3 enemy types + 2 bosses, visibly distinct teal/orange palette, G2 =
originality audit), build cards.

## Decision: EXTEND `shmup-core` + both pack apps (unchanged architecture)

One engine, two content packs — the mission-mandated architecture. All
changes below land in `packages/shmup-core/` (sim/render/art/boot/packs)
plus the two apps' `index.html` chrome.

## Rights sweep (2026-09-23)

- Replica pack player-facing title `CHICKEN INVADERS` → **CHICKEN STORM**
  (`packs.ts`), sub → "a storm of feathers — formula-replica slice".
  The original's episode subtitle ("The Next Wave") no longer appears
  player-facing anywhere in the twin-pack apps. App `index.html` titles:
  "Chicken Storm — MAGA native replica" / "Cluck Horizon — MAGA original".
- INTERNAL badges/watermarks unchanged per fleet convention: badge bar on
  both apps, title-screen INTERNAL line, HUD `[REPLICA]`/`[CLUCK]` pack id.
  Code comments/doc references to the original by name remain (allowed).
- Boss names: THE HENERAL (ch1) / HER EGGSCELLENCY (ch2) — original
  evocations fixed earlier (D-37), unchanged. Enemy names CHICKEN /
  CHICKEN SCOUT / CHICKEN ACE (generic poultry words, original pairing).
- Cluck strings verified original: CLUCK HORIZON, FLOCKBIRD/GLIDER/
  BRUISER, MOTHER GOOSE/ROOSTER REGENT, SOUP LASER/SPATULA SPREAD/WHISK
  BARRAGE, CRATE/RATIONS, courier-log jokes (spec 06 authored).
- Hub card (root index.html) already shipped as "Chicken Storm" / "Cluck
  Horizon" — now matches the in-game titles.

## Constants resolution (sim.ts — every guess marker closed)

Tuning method: both packs were full-cleared deathless by an input-only
driver under the pre-tune constants; the restored proto clamps and the
weapon-cadence table are the only behavioral changes, and the flows were
re-proven under them (sr2, below). Rationale per value group:

| Group | Values | Rationale |
|---|---|---|
| Fixed step / stage | DT 1/120, 960×540 | proto-proven; render-rate-independent sim |
| Ship feel | ACC 2600, DAMP 7.5, MAXV 400, R 13 | proto values; "float, not tank" feel target (spec 04) |
| Weapons | pea 0.15s/1dmg single · twin 0.18s/1dmg×2 · tri 0.20s/1dmg×3 spread | flavors read distinct (cadence + pattern), single-target DPS 6.7/11.1/15.0 sits inside the proven-clear band (~5.9–17.6 old flat 0.17) |
| Missiles | V −330, DMG 12, start 2, cap 6 | start 2 = immediate boss option; 12 dmg ≈ 12 bullets; cap reachable via food |
| Eggs | V 170, R 6 | sr1 deathless clears under 170 (proto 150 felt thin at 960×540); readable aimed patterns |
| Pickups | V 95; deterministic 1st gift / 2nd food; 12% chance after | deterministic cycle = gift→weapon escalation guaranteed early; food feeds missile economy |
| Lives | 3, respawn 1.2s, invuln 2.0s | spec acceptance #6: back in fight ≤2s |
| Formation grid | CW 72, CH 56, OY 70 | P-1 fix values, proven |
| **Descent floors** | straight 300 / swoop 320 / dive 280 | **proto's proven clamps, restored** — the shmup-core port dropped them (formations descended unbounded into the ship lane) |
| Chapters | ch1 straight/swoop hp2 · ch2 dive/swoop hp3; boss hp 60/100 | wave→boss cadence proven; ch2 dive+density = chapter punctuation |

## Audio (zero binary assets — arcade-core Sfx consumed as-is, FROZEN)

- Music beds (composed, distinct): replica = jaunty C-major root+fifth
  march, square wave, 140ms step; cluck = original A-minor-pentatonic
  courier groove, triangle, 160ms step. Both loop via `startMusic` only.
- SFX cue list (per pack shot flavors): shoot×3 weapons, missile launch,
  missile boom, bullet hit (non-fatal), chicken pop, egg splat (floor),
  player death, gift pickup, food pickup, UI, boss spawn, boss telegraph
  (rising), boss radial burst, boss down, chapter-clear sting (triad),
  game over (descending saw), win (major cluster).
- New sim events to feed cues: `pop`, `hit` (non-fatal), `eggSplat`,
  `missileBoom`, `bossTelegraph`, `bossRadial`, `food`.
- Settings: MUSIC/SFX sliders + MUTE checkbox + SOUND ON/OFF button,
  DOM panel on both apps, persisted `maga:<app>:audio`
  `{master,music,sfx,muted}` (burger-tycoon pattern), reachable from
  title/chapter select and during play/pause (DOM chrome is always live).

## Art (zero binary assets introduced)

- New `packages/shmup-core/src/art.ts`: baked canvas sprites ported from
  the proto's sanctioned r1 look — layered space backdrop (nebula blobs +
  galactic band + vignette), drifting ringed planet (replica) / cratered
  moon (cluck), twinkling parallax stars, per-type bird silhouettes
  (round/swept/heavy builds — comb size, wing sweep, body bulk), ship per
  weapon level + engine flame frames, glowing capsules, finned missiles,
  specular eggs, ribboned gift / drumstick vs ration crate, banner strip.
- Cluck pack: the 5 authored-but-orphaned SVGs are WIRED —
  `enemy-flockbird/glider/bruiser`, `boss-mother-goose/boss-rooster-regent`,
  `ship-courier` loaded via Pixi Assets (same path as the title wordmark,
  vite plugin rewrites to `./art/`, fallback = baked recipes). Enraged boss
  = tint over the authored sprite; weapon-level barrels drawn over the
  courier; wing-bob instead of flap frames.
- Renderer rewritten (`render.ts`) on sprite pools + baked textures:
  ship banking, missile smoke trail, death shockwave + flash, segmented
  boss gauge + on-field boss name, pickup glow rings. Hit-boxes/sim
  semantics untouched (draw-only layer).
- Title: pack wordmark (cluck SVG), flanking birds, ship fly-in, hostiles
  roster line (D-44 names render), gift/food economy line (D-39 strings
  live), INTERNAL badge line.

## Defects

- **D-36 FIXED** — HUD `WAVE 3/2` gone: `sim.waveShown` clamps past the
  wave list during the boss phase; renderer uses it.
- **D-37 FIXED (kept)** — boss names render (HUD + on-field under gauge):
  THE HENERAL / HER EGGSCELLENCY / MOTHER GOOSE / ROOSTER REGENT.
- **D-39 FIXED** — gift/food strings live on title + pickup art uses pack
  palette (`giftCol`, `belly`, `beak`, `comb` now per-pack fields driving
  the baked art); cluck comb/beak mismatch gone.
- **D-41 FIXED** — `snapshot()` wave clamped (same `waveShown`).
- **D-42 FIXED** — speed≤0 enemy type now settles into its formation slot
  (was: froze off-stage at spawn y, unshootable, blocked wave clear →
  latent softlock).
- **D-43 FIXED** — per-type kill score (CHICKEN 100 / SCOUT 125 / ACE 250;
  FLOCKBIRD 100 / GLIDER 125 / BRUISER 200) — hp tanks pay more.
- **D-44 FIXED** — replica SCOUT/ACE are real types (D-38 stats) and their
  names render on the title hostiles line; distinct silhouettes per build.
- Kept fixed: D-21, D-22, D-32 (touch release regression re-proven in sr2).

## Verification (sr2 — this lane, 2026-09-23)

Environment: built apps staged to `games/chicken-invaders/` +
`games/cluck-horizon/`, served by `python3 -m http.server 8282` from the
repo root (port verified free; lane-concurrent). Zero-dep CDP driver
`verification/evidence/sr2-shmup-driver.mjs` — own headless chromium per
run, fresh `--user-data-dir` per app (D-63), CDP port 9501+pid%180, real
`Input.dispatchKeyEvent/dispatchMouseEvent/dispatchTouchEvent` only; state
via `?debug` → `window.__maga` (now also exposes `sfx`). Run log:
`verification/evidence/sr2-shmup-run.log`.

Commands + last observed results:
- `node verification/evidence/sr2-shmup-driver.mjs pause "http://127.0.0.1:8282/games/chicken-invaders/?debug" …` — **PASS**: Esc pauses (world frozen, waveT static 800ms), Esc resumes, Esc+R quits to title; 0 console errors.
- `… types …` (replica) — **PASS**: per-type ω fit 0.700/0.805/0.595 = pack speeds 1/1.15/0.85; spawn hp 2/2/4; descent clamp: max chicken y 183.2 ≤ floor 300; 0 console errors.
- `… touch …` (replica) — **PASS**: layout B drag moves ship (480→672), release-outside clears stick (D-32), layout A FIRE hold = fireHeld, MISSILE button 2→1; 0 console errors.
- `… settings …` (replica + cluck) — **PASS** ×2: gear click opens panel; music 0.30 / sfx 0.45 / mute applied live; all persist across reload from `maga:<app>:audio`; 0 console errors.
- `… audio …` (cluck) — **PASS**: 4s held fire → 57 voices scheduled, AudioContext running; 0 console errors.
- `… gameover …` (replica + cluck) — **PASS** ×2: 3 egg deaths → GAME OVER → R → title → Enter → restart lives 3; 0 console errors.
- `… fullclear …` (replica) — **PASS** (retry-wrapper attempt 3; attempts 1–2
  lost to fleet-box chromium kills, recorded in the run log): CH1 2 waves +
  THE HENERAL → CHAPTER 1 CLEAR → CH2 dive waves + HER EGGSCELLENCY → WIN
  score 10925, 1 death (ch2 egg, t=64.2s), unlock persisted
  (`maga:chicken-invaders:chapter-unlocked`="2"), R → title, Digit2+Enter →
  ch2 restarts; 0 console errors, 0 non-local requests.
- `… fullclear …` (cluck) — **PASS** (attempt 1): CH1 + MOTHER GOOSE → CH2 +
  ROOSTER REGENT → WIN score 10025, **0 deaths**, unlock persisted
  (`maga:chicken-invaders-original:chapter-unlocked`="2"), restart works;
  0 console errors, 0 non-local requests.
- Hub boot-proof: `python3 -m http.server 8282` from repo root (bind
  verified; lane-concurrent) + `node verification/evidence/sr2-shmup-hub.mjs`
  — **PASS**: real hub-card clicks for both games → each boots (canvas up,
  zero errors without ?debug) → START click → mode=play ch1 wave 1 (12
  chickens each); 0 console errors, 0 non-local requests across both loads.
  Log: `verification/evidence/sr2-shmup-hub-run.log`.

Evidence PNGs (verification/evidence/, 6 gameplay + 2 hub):
`sr2-shmup-replica-art.png` (wave-1 combat, 3 distinct silhouettes),
`sr2-shmup-cluck-art.png` (authored SVG flock in action),
`sr2-shmup-replica-boss.png` (THE HENERAL + crown + name),
`sr2-shmup-cluck-boss.png` (MOTHER GOOSE SVG + name),
`sr2-shmup-replica-win.png` (win banner, score 10925),
`sr2-shmup-replica-gameover.png` (game-over banner),
plus `sr2-shmup-hub-chicken-storm.png` / `sr2-shmup-hub-cluck-horizon.png`.
Driver + helpers: `sr2-shmup-driver.mjs`, `sr2-shmup-retry.sh`
(fleet-box chromium kills are environmental; retries recorded, only the
PASS runs counted), `sr2-shmup-hub.mjs`; logs `sr2-shmup-run.log`,
`sr2-shmup-hub-run.log`.

## Ship-gate checklist

- [x] Rights: player-facing titles original evocations (Chicken Storm /
  Cluck Horizon); INTERNAL badges retained; boss/enemy/weapon names original.
- [x] Constants: no declared guesses remain in shmup-core (grep-clean);
  rationale table above; both packs re-proven under final constants.
- [x] Audio: composed beds (distinct per pack) + full cue list + settings
  (music/SFX/mute) persisted per app; voices/running proven live.
- [x] Art: proto's canvas-sprite look ported; cluck's 6 authored SVGs wired
  (title + 5 gameplay); layered space parallax; per-type silhouettes; boss
  scale + names; zero binary assets.
- [x] Defects: D-36/39/41/42/43/44 closed in-tree; dispositions above.
- [x] Flows: title → chapter select → waves → boss → chapter clear → win;
  game over → restart; pause (ESC) + quit-to-title; every state has an exit.
- [x] Touch: layouts A/B smoke (drag + hold-fire + missile); D-32 re-proven.
- [x] Verification: real-input CDP on the final build; 0 console errors;
  0 non-local requests (Pixi SVG loads resolve to local data: URLs).
- [x] Hub: both cards boot the staged games from the repo-root server.
- [x] G2 originality self-audit (cluck): no InterAction marks, names,
  silhouettes, or audio reused; teal/orange palette vs replica purple;
  authored SVGs are original designs (ship-courier, flockbird/glider/
  bruiser, mother-goose/rooster-regent); wordmark original hand-lettered;
  music bed original composition; jokes original copy. Side-by-side shots
  (replica-art vs cluck-art) show visibly distinct reads.

## Deferrals

- Public ship of the replica still requires InterAction/Prouskas written
  clearance (spec 04 rights line) — INTERNAL-NO-PUBLIC stands.
- Cluck trademark search before public brand (spec 06 open item).
- Cluck enemy flap animation: authored SVGs are single-frame; wing-bob
  substitution in-engine (documented; would need multi-frame SVG sets).
- GIFT_CHANCE 12% tail odds and boss pattern sheets remain ARCADE-capture
  TBD by design-pack convention; current values proven in replay.

## Provenance declaration

Consulted: this working copy only — git history, `verification/`,
`MAGA-everything/01-design-docs/`, `prototypes/`, plus my own knowledge of
the original game. No web/GitHub searches about this project, no
forks/copies, no third-party remakes/clones of the original were consulted
(fan Flash clones explicitly off-limits as references per the design pack).
No external assets of any kind; all art is code-drawn canvas or in-repo
authored SVGs, all audio is WebAudio synthesis.
