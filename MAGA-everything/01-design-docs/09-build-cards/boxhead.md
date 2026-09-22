# BUILD CARD — Boxhead: 2Play Rooms (native replica)
**Slug:** `boxhead` · **Priority:** 1 (FORGE STACK-LOCKED) · **Renderer:** PixiJS 8 · **App:** `02-code/armor-games/apps/boxhead`
**Card sources:** `02-concept-specs/01-boxhead.md` (SPEC), `02-concept-specs/001-boxhead-native-placeholder-recipes.md` (ART), `02-concept-specs/001-boxhead-2play-visual-direction.md` (CHROME), `05-dossiers/boxhead.md` (DOSSIER), `06-audio/boxhead-2play-sound-bible.md` + `06-audio/boxhead-2play-recipes.json` (AUDIO), `07-acceptance/boxhead-playability-checklist.md` (PROOF), `03-stack-and-tickets/001-boxhead-native-tickets.md` (TICKETS), `03-stack-and-tickets/001-native-stack-and-plan.md` (STACK)
**Build state (2026-09-22):** BH-0 + BH-1 FORGE REVIEW PASS; BH-2 acceptance signed (see `02-code/…/docs/ACCEPTANCE-BN2.md`); BH-3 open. Divergences vs docs → `11-divergence/divergence-log.md`.

## 1. Core loop (SPEC §Core loop)
1. Boot/menu → mode select: **Solo Survival | Local Co-op | Local Deathmatch**.
2. Room pick — v1: **2–3 rooms**, shared top-down camera.
3. Spawn with starting pistol + limited ammo.
4. Survive escalating zombie waves (+ specials if ARCADE confirms); pick up **ammo crates**; use **explosive barrels**.
5. Kill-streak multipliers → **weapon unlock/upgrade** (pistol → shotgun → uzi → grenades); thresholds **TBD ARCADE**.
6. Death/wipe → wave + score screen → instant restart.
7. Optional deathmatch — same arenas, PvP; scoring **TBD ARCADE**.

Session target: **~5–20 min/run** (SPEC §Core loop; DOSSIER §Controls).

## 2. Controls
### Desktop (SPEC §Controls)
- Dual keyboard maps on one shared keyboard; **mouse not required** for combat.
- P1: WASD move + right-cluster shoot (exact defaults **TBD ARCADE**). P2: arrows + shoot cluster (**TBD**).
- Rebinds: v1 should support user-definable maps (original 2Play claimed this — DOSSIER §Controls).
- **Shipped provisional defaults** (`apps/boxhead/README.md`): solo P1 WASD/arrows + Space/J; versus P1 WASD + Space/J, P2 arrows + IJKL/numpad-8456 directional fire; rebind JSON in localStorage `boxhead/keymaps`.

### Mobile (SPEC §Controls — layouts A/B/C)
- **A dual virtual pads** (tablet landscape 2P) — shipped: **WAIVED** (ACCEPTANCE-BN2; no tablet).
- **B shared + AI** (solo phone) — optional, label non-original.
- **C solo one-handed** — shipped: virtual stick + FIRE + auto-aim (`src/touch.ts`; ACCEPTANCE-BN2 PASS-structure, human phone run pending).

## 3. Entities (SPEC §Notes for FORGE; code `src/entities.ts`, `src/world.ts`)
`Player`, `Zombie`, `SpecialEnemy` (stub — devil pending ARCADE confirm), `Projectile`, `AmmoCrate`, `Barrel`, `Pickup`, `WaveDirector`, `ScoreSystem`, `ArenaRoom`, `VirtualStick`.
Shipped extras: `BlastRing` VFX; rooms `open-yard` + `pillars` (2 = spec minimum).

## 4. Progression (SPEC §Core loop; code `world.ts` — ALL TBD ARCADE placeholders)
- Score: kill = 100 × mult; mult +1/kill cap 20, decays after 3.5s.
- Weapon ladder on mult: shotgun ≥4, uzi ≥8, grenades ≥14 (placeholder thresholds).
- Waves 1–3: counts 5/9/14, speed 34/40/46, runners 0/2/4, spawnEvery 1.4/1.1/0.85.
- Crate +16 ammo; barrel radius 55, player damage 25; DM first-to-5 stub, respawn 1.4s.
- Persist: `boxhead/highscore` localStorage (BH-2.6 PASS).

## 5. Win/lose
- Solo: death → score screen → restart <~3s (SPEC hook 9; BH-1.7 PASS).
- Co-op: shared score, both must fall (app README).
- Deathmatch: first to 5 kills (stub, TBD ARCADE).
- No campaign win — arcade score chase.

## 6. Art direction
- **In-game (ART doc):** chunky procedural boxes via Pixi `Graphics`, NEAREST scaleMode, no hand-painted PNGs for MVP; 16×16 cells; full palette tokens (`zombie #6B8F4E`, `devil #8B2E2E`, `crate #8B6914`, `barrel #5A5E62`, `p1 #4DA3FF`, `p2 #FF7A4D`, etc.); per-entity draw recipes §4.1–4.8+; atlas naming `bh_<category>_<name>_<frame>`.
- **Chrome (CHROME doc):** MAGA palette (`void #0B0B0C`, `panel #161618`, `accent #C4F04D`…), click-to-start overlay that releases focus, control-legend chips, mute top-right, credit strip (string TBD legal), portal card `NATIVE` badge.
- **Display:** integer scale 1x/2x/3x + letterbox `#0B0B0C`; stage **640×480 provisional in docs — code uses 640×400** (divergence D-01; both UNVERIFIED pending ARCADE).

## 7. Audio recipes (AUDIO bible + recipes.json; zero binary assets)
- Implement via `arcade-core` WebAudio; cue ids `sfx.*`/`ui.*`/`music.*`; all **provisional** until ARCADE clips.
- B-N1 priority subset (recipes.json `bn1Priority`): `sfx.pistol_fire`, `sfx.zombie_death`, `sfx.ammo_pickup`, `sfx.player_hurt`, `sfx.player_death`, `ui.menu_confirm`, `ui.game_over`, `music.combat`.
- Mix: SFX weapons 0.22–0.35, enemies 0.18–0.28, world 0.25–0.40, UI 0.12–0.18, music 0.08–0.14, master clamp 0.9; duck music ~200ms on explosions.
- Gaps: `sfx.empty_click`, `sfx.zombie_attack`, `ui.wave_clear`, `sfx.special_death`, `music.deathmatch`.
- **Shipped:** generic `Sfx.preset` blips (shoot/hit/pickup/death/ui) — recipe-id wiring is BH-3.2 scope.

## 8. Acceptance criteria (PROOF checklist + SPEC hooks)
- Gate map: B-N0 = A+F; B-N1 = A+B-solo+E+F; B-N2 = A+B+C+D+F; B-N3/G3 = all A–G.
- G3 minimum: desktop Chrome + one more desktop browser green A+B-solo+E+D+F; touch solo C1–C3,C5 on one phone; co-op B12 desktop green. DM/dual-pad may WAIVE.
- Perf: ~60fps desktop w/ 50–100 movers; 30–60 mobile; no ≥500ms hitch; sub-few-MB transfer.
- Signed: ACCEPTANCE-BN1 (all PASS placeholder), ACCEPTANCE-BN2 (PASS except BH-2.2 waived).

## 9. Open TBDs (SPEC §Open questions; DOSSIER evidence gaps)
Default P1/P2 keymaps · weapon unlock thresholds/damage · spawn tables/wave composition · barrel radius/damage + friendly fire · deathmatch scoring · 2P camera rules · native stage size (640×480 vs 640×400 — UNVERIFIED) · screen shake/hit flash/SFX timing · reference captures (blocked on cleared SWF) · rights chain (Cooper/Crazy Monkey/Fire Source).

## 10. Out of scope (SPEC §Deferred; TICKETS §Out of scope)
Networked LAN/online · full room roster · Zombie Wars turrets · HD remaster · cloud accounts · Ruffle/SWF as product · Phaser/Unity/Godot · public deploy.
