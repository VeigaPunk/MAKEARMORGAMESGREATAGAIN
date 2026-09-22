# r05 ShmupTypes — D-38 per-type enemy visuals, live verification

## Verdict

**PASS** — the D-38 fix (per-type enemy visuals consumed from the content pack) is live and correct on cluck (:5177). Replica (:5176) remains a documented placeholder: its three types are still stat- AND color-identical, exactly as the open D-38 NOTE records — schedule fact, not a regression.

## Evidence

### Static (current uncommitted bytes, read-only)
- `packages/shmup-core/src/render.ts:118-122` — `drawBird(x, y, k, type=0, boss=false)` resolves `variant = boss ? pack.bosses[type] : pack.enemyTypes[type]`; body filled `variant.color` (:121), head `variant.headColor` (:122). Call sites: chickens `render.ts:169` (`drawBird(c.x, c.y, 1, c.type)`), boss `render.ts:176` (`drawBird(b.x, b.y, 3.2, b.type, true)`).
- `packages/shmup-core/src/packs.ts:70-78` (cluck): FLOCKBIRD `0xffa94d/0xffe066` speed 1 hp 2 · FLOCKBIRD GLIDER `0xffe066/0xffa94d` speed **1.15** hp 2 · FLOCKBIRD BRUISER `0xffe677/0xffc92a` speed **0.85** hp **3**; bosses MOTHER GOOSE / ROOSTER REGENT distinct per index.
- `packs.ts:45-53` (replica): CHICKEN / SCOUT / ACE all `0xffd43b/0xff8787, speed 1, hp 2` — placeholder unchanged.
- `sim.ts:178-182` — `type = (r*cols+c) % 3`, `hp = Math.max(w.hp, variant.hp)`; `sim.ts:297/301/305` — `motionT = waveT * variant.speed` (per-type speed consumed).

### Live — replica :5176 (`?debug` → `window.__maga.sim`)
- Wave 1 (straight, 2×6): 12 chickens, types cycle 0/1/2 → all three types on screen simultaneously.
- Live pack read: all three types `color 0xffd43b, headColor 0xff8787, speed 1, hp 2` — identical.
- Motion fit (42 samples @100ms, per-chicken least-squares on `x = bx + sin(0.7·speed·t)·130`): **ω = 0.7025 for every type** (expected 0.7·1.0), amp 129.3 ≈ 130, vy 3.996 ≈ 4×1.0. All types in lockstep — stat-identical confirmed.
- Screenshot `verification/evidence/r05-ShmupTypes-replica-wave1.png`: vision read — "No distinct color variants visible — all 12 identical yellow body / pink head"; HUD `[REPLICA] CH 1 · WAVE 1/2`.
- → Types NOT differentiated on replica; D-38 NOTE stands (`verification/divergence.md:322-324`, build card r08). Schedule fact, not a new defect.

### Live — cluck (:5177)
- Wave 1: 12 chickens, types 0/1/2 cycling; live sim hp by type: **type0 = 2, type1 = 2, type2 = 3** (wave hp 2 → BRUISER `max(2,3)=3`, `sim.ts:182`).
- Motion fit per type (4 chickens/type, all settled, no dives; ω = 0.7·speed expected):

| type | name | ω measured | ω expected | vy measured (exp) |
|---|---|---|---|---|
| 0 FLOCKBIRD | 4/4 | 0.715 | 0.700 | 4.02 (4.0) |
| 1 GLIDER | 4/4 | **0.820** | 0.805 (0.7×1.15) | 4.623 (4.6) |
| 2 BRUISER | 4/4 | **0.605** | 0.595 (0.7×0.85) | 3.417 (3.4) |

  Ratios: GLIDER/base = **1.147** (pack 1.15, −0.3%), BRUISER/base = **0.846** (pack 0.85, −0.5%). GLIDER measurably faster, BRUISER measurably slower.
- Hits-to-kill (real `KeyZ` fire held via CDP; ship tracked under target; BULLET_DMG=1): BRUISER (bx444/by126) hp **3→2 (t=121.56s) → 2→1 (t=122.67s) → dead** = 3 hits; FLOCKBIRD (bx300/by126) hp **2→1 (t=127.96s) → dead** = 2 hits. BRUISER tankier confirmed. (Collateral hits on the same-column row-0 bruiser 3→2→1 also logged — consistent hp 3.)
- Screenshot `verification/evidence/r05-ShmupTypes-cluck-wave1.png`: vision read confirms **three distinct color variants** (~4 each): orange body/yellow head (FLOCKBIRD), yellow body/orange head (GLIDER — swapped), pale-yellow body/dark-gold head (BRUISER); HUD `[CLUCK]`.

### Boss variant path
- Static only: `render.ts:176` passes `b.type` → `pack.bosses[type]` (cluck bosses MOTHER GOOSE `0xffa94d/0xffe066` vs ROOSTER REGENT `0xffe677/0xffc92a` — per-chapter distinction). Not live-verified (requires clearing chapter 1: 2 waves + 60hp boss); same code path as the verified chicken branch.

## Defects

None new. Status of known items touched by this scope:
- **D-38 replica side: still OPEN by design** — replica `enemyTypes` remain stat- and color-identical (`packs.ts:45-49`, live-confirmed). Matches the documented NOTE (`verification/divergence.md:322-324`) and build-card r08 ("replica types remain stat-identical — verify D-38 stands"). Schedule fact: replica differentiation was not part of this fix; do not re-file.
- D-39 observed in passing (cluck birds carry hardcoded replica-palette comb `0xff8787` / beak `0xffa94d`, `render.ts:123-124`; visible in cluck screenshot) — already registered, not re-filed.

## Notes

- Method: `?debug` boot hook exposes `window.__maga.sim`; per-chicken position series (42 samples @100ms, formation-settled, no dives in ch1w1 'straight') fit to `x = bx + sin(0.7·speed·t)·130` via least squares; ω ratios give the pack's speed multipliers to ±0.3%. hp read live from `sim.chickens` (spawn `hp = max(wave.hp, variant.hp)`, `sim.ts:182`); hits-to-kill driven with real keydown fire (`KeyZ`), ship x-position tracked under target — same input path as a player.
- Contamination: the shared browser's global tab-name registry crosswired my first handle (`ShmupTypesReplica`) to a :5173 target once — read-only evaluates only; one Space press may have landed on a sibling :5173 tab before the call errored (courtesy notice sent to BoxheadStress; do not file their unexplained menu-advance as a defect). Two `Tab busy` errors referenced other lanes' tabs (BurgerGrid) — the shared browser serializes across lanes; retried clean. All evidence above comes from fresh lane-prefixed tabs (`ShmupTypes-*`) captured in single cells.
- One earlier cluck sample run was invalidated by background-tab rAF throttling (sim advanced ~1.3s during a 4.2s wall window); discarded and recollected in a fresh foreground cell — all reported measurements come from fully-settled, unthrottled captures.
- Screenshots: `verification/evidence/r05-ShmupTypes-replica-wave1.png`, `verification/evidence/r05-ShmupTypes-cluck-wave1.png` (both 1200×675, verified PNG).
