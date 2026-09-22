# Make Armor Games Great Again — monorepo

> **INTERNAL-NO-PUBLIC.** Internal R&D under idea 001 (João, 2026-09-22).
> From-scratch native replicas for local development only. No public shipping,
> deploying, or sharing of any kind until per-title written clearance from the
> rights holders is on file. Tracked in the IDEATOR vault and the grok-bridge relay.

Native replicas of the nostalgic Flash-era menu, exactly-as-original feel, no
Flash, lightweight, playable end-to-end on localhost in mobile (touch) and
desktop (keyboard/mouse) browsers.

## Locked stack (FORGE, STACK-LOCKED 2026-09-22)

- **TypeScript + Vite** everywhere.
- **PixiJS 8** (WebGL): Boxhead, Chicken Invaders, CI-style original.
- **Canvas 2D** (lightest): Impossible, Burger Tycoon, S&S2.
- **Shared `packages/arcade-core`**: unified input (touch + keyboard/mouse),
  integer scaling, localStorage saves, WebAudio synth SFX — zero binary assets.
- Phaser out (too heavy for MVP). Ruffle/emulation = fallback reference only.

## Build order (FORGE)

1. **Boxhead** (native, starts now) → 2. Impossible → 3. Burger Tycoon →
4. Chicken Invaders recreate → 5. S&S2 → 6. CI original.

## Layout

```
packages/arcade-core   shared input / scaling / storage / audio
apps/boxhead           PixiJS 8 native replica (first ship)
apps/…                 remaining titles, added in build order
boxhead-2play-spike/   Ruffle M1 spike (fallback reference, kept separate)
```

## Run

```bash
npm install
npm run dev:boxhead     # http://localhost:5173 — playable on phone via LAN IP
```

## Crew

IDEATOR (vault) · FORGE (planning/review) · ARCADE (fidelity) · PIXEL (art) ·
MAESTRO (audio) · PROOF (QA) · KIMI/Kimi Work (conductor + implementation).

**Standing crew rule: English only, never Portuguese — everywhere.**
