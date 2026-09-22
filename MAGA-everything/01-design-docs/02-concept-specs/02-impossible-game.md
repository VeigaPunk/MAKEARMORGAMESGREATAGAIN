# The Impossible Game — Native Replica Concept Spec

## Meta

| Field | Value |
|-------|-------|
| **Slug** | `impossible-game` |
| **Working title** | The Impossible Game (Lite-faithful native replica) |
| **Target version for feel** | **Lite-faithful** — Impossible Game Lite (Newgrounds Flash 2010, ~Fire Aura slice) is the v1 fidelity target per FORGE lock; full five-level commercial game deferred |
| **Status** | concept |
| **Rights** | **INTERNAL-NO-PUBLIC** — localhost OK; public needs Fluke Games clearance (sequel active). |
| **Ship path** | Native from-scratch precision platformer (**Canvas2D**). **Not** Ruffle as ship vehicle. |
| **Renderer (locked)** | **Canvas2D** (geometry + timing; tiny surface) |
| **Stack lock** | `/workspace/armor-games-research/specs/001-native-stack-and-plan.md` |
| **Language** | English only |
| **Priority** | **2** (FORGE STACK-LOCKED — cite `/workspace/armor-games-research/specs/001-native-stack-and-plan.md`) |
| **Idea** | 001 — Make Armor Games Great Again (post-pivot) |

## Core loop

1. Select level (v1: **Lite-faithful** slice — Fire Aura–like opener; geometry TBD from ARCADE / Lite reference).
2. Cube auto-runs; single input = jump.
3. Memorize spikes/gaps/rhythm; die → full restart (normal mode).
4. Optional practice mode with checkpoint flags (v1: include if cheap; else defer).
5. Clear level → medal / clear fanfare; unlock next.

## Feel targets

- Fail-fast, one-more-try addiction.
- Music-locked timing (or strongly rhythm-aligned obstacle cadence).
- Minimalist geometry; readability over spectacle.
- Jump timing must feel *exact* — no mushy variable height unless original has it (**TBD from ARCADE playtest**).

## Controls

### Desktop (keyboard/mouse)

- Jump: Space / Up / Z / Left click (any one primary; support several).
- Restart: R after death or auto.
- Pause: Esc.

### Mobile (touch mapping) — timing fidelity risk

| Scheme | Mapping | Fidelity risk |
|--------|---------|---------------|
| **Tap jump (primary)** | Whole playfield or large lower button = jump | **High risk:** touch latency + palm rejection can desync music-locked jumps. Mitigate with low-latency path, predictive audio sync, optional “input offset” calibration. |
| **Hold-to-buffer (secondary)** | Touch-down registers jump on press (not release) | Reduces release-latency errors; document as default mobile. |
| **One-handed** | Thumb zone bottom-center large hit target | Required; no dual-stick nonsense for this genre. |

**Callout:** Mobile will struggle to match desktop timing fidelity. PROOF must score desktop as canonical; mobile = “playable best-effort” with calibration.

## Content scope — Playable v1 (IN)

- 1–2 levels with original-like spike/gap vocabulary (geometry **TBD from ARCADE playtest** / Lite reference).
- Normal fail → full restart.
- Death particles + instant restart.
- English menus.

## Content scope — Deferred

- Full five classic levels + all medals.
- Level editor.
- Practice checkpoints (if not in v1).
- Sequel features.

## Art needs (for PIXEL)

- Flat colored cube; stark spikes/blocks; high-contrast BG per level.
- Do **not** Geometry Dash–ify with icon kits; keep Impossible’s stark readability.
- UI: restart prompt, progress bar optional.

## Audio needs (for MAESTRO)

- Level music that drives obstacle timing (licensed or original-inspired — **no rip without clearance**).
- Death click/crash; jump soft tick optional; clear jingle.
- Music sync is load-bearing — highest audio priority of all six titles.

## Acceptance hooks (for PROOF)

1. Desktop: expert player can clear level 1; jump responds within measured tight latency budget (FORGE sets ms target).
2. Death → respawn at start in ≤200ms feel.
3. Obstacle hits are consistent (no random tunneling).
4. Mobile tap-on-press completes first 10s of level without UI dead zones.
5. Audio/obstacle sync holds after tab backgrounding resume (or documented reset).
6. English-only.
7. No softlock if holding jump at spawn.

## Open questions / ARCADE gaps

- Hitbox sizes; coyote/jump buffer (if any).
- Lite vs full Fire Aura geometry.
- Medal criteria.
- Track-to-obstacle sync map.
- Death/restart frame counts.
- Input latency expectations vs beat.

**TBD from ARCADE playtest** for all timing constants.

## Notes for FORGE

**Stack (FORGE STACK-LOCKED — cite `/workspace/armor-games-research/specs/001-native-stack-and-plan.md`):**
- App: `armor-games/apps/impossible` — **Canvas2D** + TypeScript + Vite; consume `arcade-core` for input/scale/storage/audio helpers.
- Role in fleet: hardens core **timing + touch** after Boxhead; smallest surface.
- Lite-faithful = product promise for v1; do not silently expand into full five-level game and call it Lite.
- Ruffle/Lite SWF = reference-only if available; native is ship path.


- Fixed timestep strongly suggested for physics/timing (FORGE decides).
- Entities: `Runner`, `Spike`, `Block`, `Gap`, `Checkpoint`, `LevelTrack`, `AudioSyncClock`.
- Payload tiny (this should be the lightest title).
- **No stack prescription.**
