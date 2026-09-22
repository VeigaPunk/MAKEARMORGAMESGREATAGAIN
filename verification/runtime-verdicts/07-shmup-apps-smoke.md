# RUNTIME VERDICT — shmup-core apps smoke (round 3)

**Apps:** `apps/chicken-invaders` (replica pack, :5176 canonical / probed on :5181) · `apps/chicken-invaders-original` (cluck pack, :5177 / probed on :5182)
**Shared engine:** `packages/shmup-core` (`boot.ts` 167 · `sim.ts` 453 · `render.ts` 221 · `touch.ts` 166 · `packs.ts` 67 lines)
**Build:** uncommitted forge work · 2026-09-22
**Method:** headless Chromium, `?debug` `__maga.state` hook + keyboard input.
**Evidence:** `evidence/r03-ci-replica.png`, `evidence/r03-ci-cluck.png`

## Checks

| Check | replica | cluck | Evidence |
|-------|---------|-------|----------|
| Boot, no fatal console error | PASS | PASS | `tab.errors()` empty both sessions |
| Correct pack loaded | PASS (`pack:'replica'`, PEA SHOOTER) | PASS (`pack:'cluck'`, SOUP LASER) | `__maga.state.pack`/`weaponName` |
| Title → play | PASS | PASS | Enter → `mode='play'`, 12 chickens spawn |
| Fire → kills → score | PASS (4 kills, 400) | PASS (5 kills, 500) | `__maga.state.kills`/`score` |
| Death → respawn | PASS (`shipAlive` false→true, lives 3→2) | not hit | state hook |
| Distinct identity | — | — | screenshots: purple bg + yellow chickens + `[REPLICA]` vs teal bg + orange flockbirds + `[CLUCK]` + courier-log jokes |

## Findings

- **NOTE — port collision:** `apps/chicken-invaders/package.json` claims
  `--port 5176`, which is also where a stray boxhead vite instance landed
  (auto-bump). With all forge servers up, canonical map is
  5173 boxhead · 5174 impossible · 5175 burger · 5176 CI replica ·
  5177 cluck · 5178 sas. No code defect — environment note only.
- **NOTE — `dev` script missing from root package.json** for the three new
  apps (only `dev:boxhead`, `dev:impossible`, `dev:burger` exist). Cosmetic;
  `npm run dev -w @maga/chicken-invaders` works.

## Verdict: **PASS** — both packs boot and play through the shared shmup skeleton; the port from `prototypes/chicken-invaders.html` (post-D-21-fix) is faithful and functional.
