# BUILD CARD — Boxhead: 2Play Rooms (native replica)
**Slug:** `boxhead` · **Priority:** 1 (FORGE STACK-LOCKED) · **Renderer:** PixiJS 8 · **App:** `02-code/armor-games/apps/boxhead` · SPEC scope/feel/rights: §Meta, §Feel targets, §Content scope—Playable v1 (IN)
**Card sources:** `02-concept-specs/01-boxhead.md` (SPEC), `02-concept-specs/001-boxhead-native-placeholder-recipes.md` (ART), `02-concept-specs/001-boxhead-2play-visual-direction.md` (CHROME), `05-dossiers/boxhead.md` (DOSSIER), `06-audio/boxhead-2play-sound-bible.md` + `06-audio/boxhead-2play-recipes.json` (AUDIO), `07-acceptance/boxhead-playability-checklist.md` (PROOF), `03-stack-and-tickets/001-boxhead-native-tickets.md` (TICKETS), `03-stack-and-tickets/001-native-stack-and-plan.md` (STACK)
**Build state (2026-09-22):** BH-0 + BH-1 FORGE REVIEW PASS; BH-2 acceptance signed; BH-3.1/3.2/3.3 DONE, BH-3.4/3.5 prepared-pending (`02-code/…/docs/BH3-HANDOFF.md`). Per-ticket status → `10-ticket-xref/boxhead-tickets.md`; divergences → `11-divergence/divergence-log.md` (ids `DD-NN`; code comments citing `D-NN` mean `verification/divergence.md`).

## 1. Core loop (SPEC §Core loop)
1. Boot/menu → mode select: **Solo Survival | Local Co-op | Local Deathmatch**.
2. Room pick — v1: **2–3 rooms**, shared top-down camera.
3. Spawn with starting pistol (original: **unlimited** pistol ammo — spec's "limited ammo" is a known divergence, DD-24; crates feed unlocked weapons).
4. Survive escalating zombie waves (+ specials if ARCADE confirms); pick up **ammo crates**; use **explosive barrels**.
5. Kill-streak multipliers → **weapon unlock/upgrade** — spec order "pistol → shotgun → uzi → grenades" is **wrong per external docs**: documented 2Play order is pistol → **Uzi (5×) → shotgun (10×)** → barrels → grenades (20×) → … → rocket launcher (50×) (DD-23); thresholds **TBD ARCADE**.
6. Death/wipe → wave + score screen → instant restart.
7. Optional deathmatch — same arenas, PvP; scoring **TBD ARCADE**.

Session target: **~5–20 min/run** (SPEC §Core loop; DOSSIER §Controls).

## 2. Controls
### Desktop (SPEC §Controls)
- Dual keyboard maps on one shared keyboard; **mouse not required** for combat.
- P1: WASD move + right-cluster shoot (exact defaults **TBD ARCADE**). P2: arrows + shoot cluster (**TBD**).
- Rebinds: v1 should support user-definable maps (original 2Play claimed this — DOSSIER §Controls).
- **Shipped provisional defaults** (`apps/boxhead/README.md`): solo P1 WASD/arrows + Space/J; versus P1 WASD + Space/J, P2 arrows + IJKL/numpad-8456 directional fire; rebind JSON in localStorage `maga:boxhead:keymaps`. ⚠ versus-mode KeyJ/KeyK double-bind defect → DD-21. Documented original defaults invert the proposal (P1 arrows, P2 WASD — DD-25).

### Mobile (SPEC §Controls — layouts A/B/C)
- **A dual virtual pads** (tablet landscape 2P) — shipped: **WAIVED** (ACCEPTANCE-BN2; no tablet).
- **B shared + AI** (solo phone) — optional, label non-original.
- **C solo one-handed** — shipped: virtual stick + FIRE + auto-aim (`src/touch.ts`; ACCEPTANCE-BN2 PASS-structure, human phone run pending).

## 3. Entities (SPEC §Notes for FORGE; code `src/entities.ts`, `src/world.ts`)
`Player`, `Zombie`, `SpecialEnemy` (stub — devil **confirmed** in 2Play, shoots energy balls; ranged recipe missing, DD-26), `Projectile`, `AmmoCrate`, `Barrel`, `Pickup`, `WaveDirector`, `ScoreSystem`, `ArenaRoom`, `VirtualStick`.
Shipped (differ from spec suggestions — DD-08): `BlastRing` VFX + `TouchControls` (`src/touch.ts`); no `SpecialEnemy`/`Pickup`/`VirtualStick` classes; rooms `open-yard` + `pillars` (2 = spec minimum).

## 4. Progression (SPEC §Core loop; code `world.ts` — ALL TBD ARCADE placeholders)
- Score: kill = 100 × mult; mult +1/kill cap 20, decays after 3.5s.
- Weapon ladder on mult: shotgun ≥4, uzi ≥8, grenades ≥14 (placeholder thresholds).
- Waves 1–3: counts 5/9/14, speed 34/40/46, runners 0/2/4, spawnEvery 1.4/1.1/0.85.
- Crate +16 ammo; barrel radius 55, player damage 25; DM first-to-5 stub, respawn 1.4s.
- Persist: `maga:boxhead:highscore` localStorage (BH-2.6 PASS; namespace `maga:<game>:<key>` — DD-74).

## 5. Win/lose
- Solo: death → score screen → restart <~3s (SPEC hook 9; BH-1.7 PASS).
- Co-op: shared score, both must fall (app README).
- Deathmatch: first to 5 kills (stub, TBD ARCADE).
- No campaign win — arcade score chase.
- **Shipped facts (post-BN2, `src/game.ts`/`world.ts`):** grenade tier = lobbed AoE shell (radius 60, 2 ammo, detonates on hit/wall/expiry — self-damage open, verify-log D-19); DM barrel kills grant no credit (stub); crate cadence 8s/12s max 2; wave break 2.5s; player hp 100 / ammo 24 / speed 125; zombie hp 2, runner hp 1 ×1.8 speed. Slice caps at `MAX_WAVE=3` with a victory screen — **invented vs spec's endless waves** (DD-19). DM ships **no pickups** (DD-18); shotgun 3 pellets vs ART's 5 (DD-17). **r04 live (verify):** DM ammo economy can deadlock a match — 24 rounds/life vs 50 hits needed, refill only on respawn, no crates/melee/timer (DD-77); Esc/P bound to `'pause'` but never consumed — no pause, no mid-run exit (DD-83); B13 PARTIAL live (mutual damage + kill counter + 1.4s respawn verified; match-end unexercised due to DD-77).
- **r06 WIP (uncommitted `git diff`, DD-94):** `'paused'` GameState consumes Esc/P + M/ENTER/tap exits to mode select (DD-83 fix); gameplay `dt` capped 0.05 (verify D-16); DM crate gate removed — crates now spawn in deathmatch pending ARCADE ruling on DD-18 (DD-77 fix); `?stress` tops field to ~100 movers (verify D-08 partial); touch pointerup/cancel moved to `window` (DD-82-class fix). Still open in-tree: grenade owner exemption (verify D-19), DD-01 stage size.

## 6. Art direction
- **In-game (ART doc):** chunky procedural boxes via Pixi `Graphics`, NEAREST scaleMode, no hand-painted PNGs for MVP; 16×16 cells; full palette tokens (`zombie #6B8F4E`, `devil #8B2E2E`, `crate #8B6914`, `barrel #5A5E62`, `p1 #4DA3FF`, `p2 #FF7A4D`, etc.); per-entity draw recipes §4.1–4.8+; atlas naming `bh_<category>_<name>_<frame>`.
- **Chrome (CHROME doc):** MAGA palette (`void #0B0B0C`, `panel #161618`, `accent #C4F04D`…), click-to-start overlay that releases focus, control-legend chips, mute top-right, credit strip (string TBD legal), portal card `NATIVE` badge. **Shipped chrome = INTERNAL badge + text mute button only** — overlay/legend/credits/portal unimplemented (DD-20); shipped in-game colors are off-token (DD-16).
- **Display:** integer scale 1x/2x/3x + letterbox `#0B0B0C` per docs; code ships uniform **fractional downscale <1x** + maxFactor 4 (DD-15); stage **640×480 provisional in docs — code uses 640×400** (DD-01; both UNVERIFIED pending ARCADE).

## 7. Audio recipes (AUDIO bible + recipes.json; zero binary assets)
- Implement via `arcade-core` WebAudio; cue ids `sfx.*`/`ui.*`/`music.*`; all **provisional** until ARCADE clips.
- B-N1 priority subset (recipes.json `bn1Priority`): `sfx.pistol_fire`, `sfx.zombie_death`, `sfx.ammo_pickup`, `sfx.player_hurt`, `sfx.player_death`, `ui.menu_confirm`, `ui.game_over`, `music.combat`.
- Mix: SFX weapons 0.22–0.35, enemies 0.18–0.28, world 0.25–0.40, UI 0.12–0.18, music 0.08–0.14, master clamp 0.9; duck music ~200ms on explosions.
- Gaps: `sfx.empty_click`, `sfx.zombie_attack`, `ui.wave_clear`, `sfx.special_death`, `music.deathmatch`.
- **Shipped:** 5 generic `Sfx.preset` blips + `startMusic/stopMusic` raw-Hz slot + chrome mute (BH-3.2 DONE); recipe-id loader/buses/ducking still owed (DD-09; scheduling conflict DD-49; acceptance surface missing DD-48).

## 8. Acceptance criteria (PROOF checklist + SPEC hooks)
- Gate map: B-N0 = A+F; B-N1 = A+B-solo+E+F; B-N2 = A+B+C+D+F; B-N3/G3 = all A–G. ⚠ map is unpassable as written at B-N0/B-N1 (preconditions land in B-N2 — DD-22); B-Modes placement + B-N3/G3 conflation → DD-46/DD-47.
- G3 minimum: desktop Chrome + one more desktop browser green A+B-solo+E+D+F; touch solo C1–C3,C5 on one phone; co-op B12 desktop green. DM/dual-pad may WAIVE.
- Perf: ~60fps desktop w/ 50–100 movers; 30–60 mobile; no ≥500ms hitch; sub-few-MB transfer.
- Signed: ACCEPTANCE-BN1 (all PASS placeholder), ACCEPTANCE-BN2 (PASS except BH-2.2 waived).

## 9. Open TBDs (SPEC §Open questions; DOSSIER evidence gaps)
Default P1/P2 keymaps (documented original inverts proposal — DD-25) · weapon unlock thresholds/damage (order wrong — DD-23) · spawn tables/wave composition · barrel radius/damage + friendly fire · deathmatch scoring · 2P camera rules · native stage size (640×480 vs 640×400 — UNVERIFIED, DD-01) · screen shake/hit flash/SFX timing · reference captures (dossier plan gated on dead M1.6 — DD-65) · rights chain (Cooper/Crazy Monkey/Fire Source) · chrome implementation (DD-20) · palette.ts + retint (DD-16) · wave-3 victory vs endless (DD-19).

## 10. Out of scope (SPEC §Deferred; TICKETS §Out of scope)
Networked LAN/online · full room roster · Zombie Wars turrets · HD remaster · cloud accounts · Ruffle/SWF as product · Phaser/Unity/Godot · public deploy.

**Posture:** INTERNAL-NO-PUBLIC — localhost/internal OK; public ship needs written Cooper/Crazy Monkey/Fire Source clearance (SPEC §Meta). **PROOF hook:** `?debug` → `window.__maga` (`src/main.ts:57-60`; DD-62).

**r08 (uncommitted forge burn, DD-94/DD-103):** `'paused'` state now consumes Esc/P (verify D-26 → DD-83 fix in-tree); `gameplayDt` cap 0.05 (verify D-16); `?stress` tops ~100 movers incl. runners (verify D-08 partial); **DM crates enabled** as the D-25 deadlock fix — this *inverts* DD-18 (spec says no DM pickups; code now adds them pending ARCADE ruling → DD-103). Still open in-tree: verify D-19 grenade owner exemption (design ruling owed), DD-01 stage size.
