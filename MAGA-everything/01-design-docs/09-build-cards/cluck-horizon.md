# BUILD CARD — Cluck Horizon (new CI-style original)
**Slug:** `chicken-invaders-original` · **Priority:** 6 (FORGE STACK-LOCKED) · **Renderer:** PixiJS 8 · **App:** `02-code/armor-games/apps/chicken-invaders-original` (not yet scaffolded)
**Card sources:** `02-concept-specs/06-chicken-invaders-original.md` (SPEC), `03-stack-and-tickets/001-native-stack-and-plan.md` (STACK); CI replica card/spec for shared skeleton (SPEC §Core loop cites `02-chicken-invaders.md` — i.e. `04-chicken-invaders.md` in this pack)
**Build state:** not started. No tickets exist yet. New IP — **not** a replica claim; no fidelity dossier (CI dossier is reference only).
**Pitch (SPEC §Meta):** campy vertical shmup — courier pilot defends solar suburbs from space poultry + egg artillery; supply crates remix guns into kitchen-tech weapons; overgrown-bird chapter bosses. Echoes CI *feel* with original characters/jokes/systems.

## 1. Core loop (SPEC §Core loop — same skeleton as CI replica, original content)
1. Choose chapter sector (v1: **2 sectors**).
2. Fly bottom-lane ship; auto-scroll or fixed-lane vertical shmup space.
3. Destroy flock formations; dodge eggs/yolk globs.
4. Grab **Supply Crates** → cycle weapon kits; **Rations** → specials/missiles.
5. Clear wave sets → sector boss → unlock next sector.
6. Die → retry; chase clean clears/score.

## 2. Controls (SPEC §Controls — identical skeleton to CI replica)
- Desktop: arrows/WASD move; Space/Z/LMB fire; X/Shift/RMB special; Esc pause.
- Mobile: layouts A/B as CI replica (twin-thumb landscape; one-thumb drag + auto-fire). Shared control code encouraged; content packs differ.

## 3. Entities (SPEC §Notes for FORGE — shared shmup skeleton w/ CI replica)
`Ship`, `FlockEnemy`, `Boss`, `Projectile`, `Crate`, `WaveSpawner`, `SectorDirector` + content packs.
Prefer shared codebase with CI replica (SPEC §Open questions — recommended, not decided).

## 4. Progression
- ≥3 original weapon kits via crates (e.g. "Soup Laser", "Spatula Spread" — SPEC §Feel targets).
- 3 enemy flock types + 2 bosses (original designs).
- Score, lives, English interstitial jokes (1–2 lines between chapters, non-blocking >3s — SPEC hook 7).
- Sector unlock progression.

## 5. Win/lose
- Win: clear sector waves → boss → next sector unlock.
- Lose: death → retry; game-over screen offers retry (SPEC hook 8).
- Score increments on kills; clean-clear chase.

## 6. Art direction (SPEC §Art needs)
- Arcade-bright sprites; original bird invaders (different proportions/hats/props from CI); courier ship distinct profile.
- Palette: **teal/orange courier accents vs flock yellows** — must differ from CI replica palette if both ship side-by-side.
- v1 assets: ship, 3 enemies, 2 bosses, eggs, bullets, crates, rations, 2 backgrounds, UI, VFX.
- **NOT:** photoreal, "almost CI" chicken clones, any InterAction silhouettes/logos/names/OST (SPEC §Feel targets).

## 7. Audio recipes (SPEC §Audio needs)
- Original SFX set: fire, egg splat, crate jingle, boom, boss sting + 2 upbeat comedy loops.
- **No** InterAction tracks. English VO one-liners optional.
- Author per `06-audio/README.md` schema.

## 8. Acceptance criteria (SPEC §Acceptance hooks)
1. Sector 1 boss finishable on desktop.
2. Weapon-kit change obvious ≤1s after crate pickup.
3. Side-by-side vs CI replica: art/audio/names clearly distinct (no asset reuse).
4. Mobile one-thumb clears one wave.
5. Cold boot → combat <5s localhost.
6. English-only; title screen says **Cluck Horizon**.
7. Joke interstitial once per sector, never blocks input >3s.
8. Score increments; game-over offers retry.

## 9. Open TBDs (SPEC §Open questions)
Comedy tone vs serious shmup (João call) · shared codebase vs fork (recommended shared) · difficulty curve vs replica (tune after replica playtests) · "Cluck Horizon" trademark search before public · combat numbers align with replica TBD tables then retune for identity.

## 10. Out of scope (SPEC §Deferred)
Long campaign (8+ sectors) · local multiplayer · roguelike meta tree · seasonal packs · cutscenes >15s · any InterAction assets/marks.
