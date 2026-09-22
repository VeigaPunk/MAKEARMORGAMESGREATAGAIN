# Concept Specs INDEX — Idea 001 (post-pivot, FORGE stack-locked)

**Project:** Make Armor Games Great Again  
**Role:** IDEATOR concept specs  
**Date:** 2026-09-22 (America/Sao_Paulo / BRT)  
**Updated:** 2026-09-22 ~14:35 BRT — reordered to match **FORGE STACK-LOCKED** build order  
**Stack lock cite:** `/workspace/armor-games-research/specs/001-native-stack-and-plan.md`  
**Ship path:** Working **native** replicas (from-scratch). **Ruffle/SWF is NOT the ship vehicle** — prior EMULATE briefs are **superseded**; Ruffle/`boxhead-2play-spike` = **INTERNAL feel reference only**.  
**Rights default:** `INTERNAL-NO-PUBLIC` — localhost play OK for internal use; any public distribution still needs **per-title clearance**.  
**Language:** English only in all files / UI / asset labels.  
**Shared kit (FORGE):** TypeScript + Vite monorepo `armor-games/`; `packages/arcade-core` (input, integer letterbox scale, localStorage, WebAudio helpers). Per-title renderer below.

## Priority order (FORGE STACK-LOCKED — authoritative)

IDEATOR prior default is superseded by this lock. Do not reorder without FORGE.

| Priority | Spec file | Title | Slug | Renderer (locked) | Track |
|----------|-----------|-------|------|-------------------|-------|
| **1** | [01-boxhead.md](01-boxhead.md) | Boxhead: 2Play Rooms (native) | `boxhead` | **PixiJS 8** | Replica — deepest; start now |
| **2** | [02-impossible-game.md](02-impossible-game.md) | The Impossible Game (Lite-faithful) | `impossible-game` | **Canvas2D** | Replica |
| **3** | [03-mcdonalds-game.md](03-mcdonalds-game.md) | Burger Tycoon (McDonald's Game twin) | `mcdonalds-game` | **Canvas2D** (+ DOM chrome OK) | Replica (BT branding internal) |
| **4** | [04-chicken-invaders.md](04-chicken-invaders.md) | Chicken Invaders (CI2-era recreate) | `chicken-invaders` | **PixiJS 8** | Replica — deep |
| **5** | [05-swords-and-sandals.md](05-swords-and-sandals.md) | Swords and Sandals 2: Emperor's Reign slice | `swords-and-sandals` | **Canvas2D** (+ DOM chrome) | Replica (v1 loop slice) |
| **6** | [06-chicken-invaders-original.md](06-chicken-invaders-original.md) | Cluck Horizon (new CI-style original) | `chicken-invaders-original` | **PixiJS 8** | New IP |

## Cross-cutting constraints (all six)

1. **Playable on localhost** in a modern browser (desktop + phone).
2. **Lightweight** payload — Vite/TS; FORGE owns stack details (see stack lock).
3. **Desktop (kb/mouse) + mobile (touch)**; one-or-two-handed mobile layouts documented per title.
4. **Feel exactly like originals** for replicas; Cluck Horizon echoes loop/feel without InterAction assets.
5. Combat/economy numbers marked **TBD from ARCADE playtest** where dossiers show gaps — do not invent tables.
6. **INTERNAL-NO-PUBLIC** in every meta header.
7. No Phaser / Unity / Godot for v1 (stack lock explicit non-choices).

## Related grounding

- Stack lock: `/workspace/armor-games-research/specs/001-native-stack-and-plan.md`
- `/workspace/armor-games-research/deep-dive.md`
- `/workspace/armor-games-research/summary.json`
- `/workspace/armor-games-dossiers/*.md` (especially `boxhead.md`, `chicken-invaders.md`)
