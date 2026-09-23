# Crateheads (internal evocation of the Boxhead 2Play arena formula)

**INTERNAL-NO-PUBLIC** — localhost-only build. No ship/public deploy until
written per-title rights clearance (Cooper / Crazy Monkey / Fire Source).

Native TypeScript + PixiJS 8 rebuild of the local-2P arena zombie shooter:
solo survival, local co-op, local deathmatch, touch layout C. Combat tables
were tuned 2026-09-23 (sr2) — rationale in `ship-records/boxhead.md` and
`src/world.ts`. Feel targets and fidelity notes live in
`MAGA-everything/01-design-docs/`.

## Run

```bash
# monorepo root
npm install
npm run dev:boxhead        # dev server (localhost)
npm run build -w @maga/boxhead && npm run preview -w @maga/boxhead
```

Serve `dist/` statically and open with `?debug` to expose `window.__maga`
(game/input/touch/sfx) for automated acceptance.

## Default controls

| Action | Solo (P1) | Versus P1 | Versus P2 |
|--------|-----------|-----------|-----------|
| Move   | WASD or arrows | WASD | Arrow keys |
| Fire   | Space / J (facing dir; mouse hover = optional aim) | Space / J | IJKL or numpad 8/4/5/6 = up/left/down/right |
| Action / menu-back | E / K / M | E / K / M | — |
| Slots (menus) | 1 / 2 / 3 | 1 / 2 / 3 | — |
| Pause  | Esc / P | Esc / P | — |
| Touch (solo, layout C) | left virtual stick = move · right FIRE button = fire (auto-aims nearest zombie) | — | — |

Modes: **Solo Survival** (waves 1–3 slice), **Local Co-op** (shared score,
both must fall), **Local Deathmatch** (first to 5 kills; blast kills credit
the shooter who lit the fuse or threw the grenade).

Audio: SETTINGS button (page chrome) — music/SFX volume + mute, persisted in
localStorage under `maga:boxhead:audio`.

## Rebinds (BH-2.5 stub)

Keymap JSON lives in localStorage under `maga:boxhead:keymaps` (arcade-core
storage). Shape: `{ "p1": { "<KeyboardEvent.code>": "<action>" }, "p2": {...} }`
merged over mode defaults at boot. Actions: `up down left right fire action
slot1 slot2 slot3 pause fireUp fireLeft fireDown fireRight`. Edit the JSON to
rebind; there is no in-game UI yet.

## Structure

- `src/main.ts` — bootstrap: Pixi app (WebGL), integer letterbox, input, settings
- `src/game.ts` — states (title/mode/room/playing/dead/victory), modes, systems
- `src/world.ts` — rooms (2 + 2P spawns), wave tables, score/weapon ladder (tuned sr2)
- `src/entities.ts` — Player/Zombie/Projectile/AmmoCrate/Barrel/BlastRing/MuzzleFlash/Speck
- `src/art/palette.ts` — palette tokens (native recipes §2)
- `src/audio.ts` — WebAudio cue recipes (sound bible) + music beds
- `src/touch.ts` — layout C virtual stick + fire button (coarse pointers)
- `docs/ACCEPTANCE-BN1.md` / `ACCEPTANCE-BN2.md` — signed acceptance records
- `docs/PROOF-CHECKLIST.md` — proof rows (sr1/sr2)
- `proofs/` — headless smoke screenshots + raw evidence
