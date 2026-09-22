# Make Armor Games Great Again — Idea 001 pack
**For local work on Omarchy (plazir27)**  
**Packed:** 2026-09-22 America/Sao_Paulo  
**Language:** English only  
**Posture:** INTERNAL-NO-PUBLIC until per-title rights clearance

## What this is
Everything the swarm has produced so far for **Make Armor Games Great Again**: vault evolution, concept specs, FORGE stack lock + Boxhead native tickets, research, ARCADE dossiers, MAESTRO audio, PROOF acceptance. This is **design + planning**, not a playable game binary yet (implementation lives with KIMI on AMDPORRADA when scaffolded).

## Read order (start here)
1. `01-vault/001-make-armor-games-great-again.md` — living idea record + evolution log  
2. `03-stack-and-tickets/001-native-stack-and-plan.md` — **STACK-LOCKED** (PixiJS 8 / Canvas2D + arcade-core)  
3. `02-concept-specs/INDEX.md` then `01-boxhead.md` — build Boxhead first  
4. `03-stack-and-tickets/001-boxhead-native-tickets.md` — FORGE ticket epics BH-0…BH-3  
5. `05-dossiers/boxhead.md` — fidelity (numbers still TBD from playtest)  
6. `06-audio/` + `07-acceptance/` — MAESTRO / PROOF Boxhead hooks  

## FORGE implementation order
1. Boxhead: 2Play Rooms (native) — PixiJS 8 — **start now**  
2. The Impossible Game (Lite-faithful) — Canvas2D  
3. Burger Tycoon — Canvas2D  
4. Chicken Invaders recreate — PixiJS 8  
5. Swords and Sandals 2 slice — Canvas2D  
6. Cluck Horizon (new CI-style original) — PixiJS 8  

## Stack (locked)
- TypeScript + Vite monorepo `armor-games/`  
- `packages/arcade-core` — input, integer letterbox scale, localStorage, WebAudio helpers  
- Sprite-heavy: **PixiJS 8** (Boxhead, CI, Cluck Horizon)  
- UI/geometry-light: **Canvas2D** (Impossible, Burger Tycoon, S&S2)  
- **No** Phaser / Unity / Godot for v1  
- Ruffle/SWF = **reference only** (see `08-history-superseded/`)  

## Rights
Native replicas = from-scratch reimplementations (not ROM/SWF distribution). Localhost OK under INTERNAL-NO-PUBLIC. Public ship needs per-title clearance.

## Suggested Omarchy layout
```text
~/Projects/make-armor-games-great-again/
  pack/          ← this archive extracted
  armor-games/   ← future monorepo (scaffold from FORGE tickets)
```

## Menu titles
Swords and Sandals · The McDonald's Game / Burger Tycoon · The Impossible Game · Boxhead · Chicken Invaders · Cluck Horizon (original)
