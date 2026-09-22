# Mechanics digest — cross-title synthesis for maga-forge

**Audience:** `maga-forge` builder. **Source:** the four `prototypes/*.md` cards + `prototypes/*.html` (all browser-verified, zero-dep, `file://`-openable) + `verification/divergence.md` r4 findings.
**Scope:** what the prototypes proved about mechanics, stated as build rules. Every rule cites where it was proven. Constants are declared guesses — mechanisms are the deliverable.

## 1. Shared architecture patterns (proven across ≥2 titles)

| Pattern | Proven in | Rule for monorepo |
|---|---|---|
| Fixed-timestep accumulator, sim decoupled from render | impossible (120Hz), CI (fixed DT), burger (rates/sec tick) | One `arcade-core` loop primitive; clamp `dt` (burger: 0.25s) against tab-switch jumps. |
| Level/wave/opponent content as data tables | impossible `[type,x,w,h]`; CI `{pattern,rows,cols,hp,eggEvery}`; S&S `{name,hp,str,agi,def,gold,xp}` | Content packs and rosters are data, never engine branches. CI's `PACKS[id]` swaps an entire skin (title/palette/names) with zero engine changes — the replica/original split is a table, not a fork. |
| Read-only `window.__proto` verification hook | all four | Keep in monorepo test harness. **Must be readable in every mode** — CI's `wavesTotal` threw on title screen (verify D-22, fixed R5): a probe that throws is a probe that lies. Guard every getter against pre-game state. |
| Real-input verification (no state injection) | all four | `keydown`/`pointer`/`touchscreen.tap` only. `tab.run` can't see page globals → `tab.evaluate`. Touch produces real `pointerType==='touch'` events. |
| Save-on-transition, not on-interval | S&S (create/victory/defeat/shop-exit), CI (chapter unlock) | Single-slot localStorage, flat versioned schema; writes at state transitions keep the slot always coherent. |
| Canvas hit-region registry `{id→rect→fn}` | S&S, CI title, impossible | Works for game UI; for UI-heavy titles (burger) DOM buttons give a11y/focus free — keep the label→fn table shape either way. ≥48px targets verified by touch-only playthroughs. |

## 2. Collision & kill-condition lessons (verify-confirmed in monorepo)

These proto findings were re-discovered as monorepo defects D-33/D-34 — the carry-forward worked but landed late. Apply first:

- **Side-kill tests the FRONT edge** (`cube.x + CUBE`), not the left edge — impossible proto card #4; verify D-34 confirmed the monorepo initially tested the left edge (~94ms late at 360px/s). Fixed in-tree to exact proto parity (death x=2967).
- **Gap kill needs floor-absence + depth margin** (`floor === -Infinity && bottom > ground + margin`) — a width-only test lets the cube survive narrow gaps (verify D-33; fixed, no-jump death x=1410).
- **Bound all downward drift** — CI formation descent clamped (300/320/280) or waves softlock: unkillable enemies below the ship lane.
- **Null-safe phase lookups** — wave-script dereference during boss/intermission killed the rAF loop (CI bug #2). Any "current wave/level/phase" lookup must tolerate none.

## 3. Input maps (spec-cited, proto-proven)

| Title | Desktop (proven) | Touch (proven) |
|---|---|---|
| impossible | Space/click jump, buffer 0.10s + coyote 0.06s | tap = jump (same path) |
| CI / Cluck | WASD/arrows + Space/Z/LMB fire + X/Shift/RMB missile + Esc pause | **Layout B one-thumb**: relative drag moves ship (finger delta → ship delta, velocity zeroed while dragging), auto-fire ON, 64px MISSILE edge button checked before drag-start. Wave 1 cleared touch-only (spec 06 #4). Layout A (twin-thumb) still unproven — same plumbing: left-half pointer → stick vector, right-half → fire/missile. |
| burger | pane click actions | n/a (UI title — DOM buttons recommended) |
| S&S | canvas hit-regions ≥48px | full champion fight via `touchscreen.tap` only (spec hook #3) |

## 4. State machines — every state needs an exit

- S&S: victory/defeat/champion result screens shipped without a `confirm` transition → softlock after first win (found empirically, fixed). **Rule: encode transitions as data; test that every state has an exit.** Spec hook #2 is a state-machine property.
- Guaranteed-legal fallback action (S&S TAUNT/HOLD) keeps "player can always act" true at zero resources.
- Shop gates evaluated at render time from `{level, gold, owned}` — no separate can-buy logic to drift. S&S proto has no analogs of verify's monorepo defects D-27 (reload stat double-dip), D-28 (duplicate purchase full-price), D-30 (champion replay farm): `load()` restores stats verbatim, `owned.includes(i)` guards, `nextOpp` advances past the champion. **Monorepo must replicate all three guards** — verify found each missing there.
- CI `pointerup` on `window` (not canvas) — verify D-32 found the monorepo virtual stick stuck after pointerup outside canvas; proto already released on window-level pointerup.

## 5. Economy/loop dials (mechanisms proven, constants TBD)

- **CI:** deterministic early drops (1st kill = gift/weapon cycle, 2nd = food/missile refill) made the economy verifiable and doubles as onboarding. Telegraph-then-burst boss (0.7s warn → radial) matches "telegraphed patterns" feel.
- **Burger:** dirty-action toggles = multiplier + backlash accrual + event risk (deforest→yield, cheapFeed→disease, cutCorners→margin); two fail conditions (cash≤0, rep≤0) + board-pressure stall detector = the satire coupling. Event system = accumulator+threshold.
- **S&S:** stamina is THE pacing dial (regen 12/turn vs heavy cost 30 forces alternation); enemy AI = priority list (potion-if-hurt > heavy-if-able > attack).
- **Impossible:** fixed impulse jump, NO variable height/double jump — spec demands exact feel; respawn ≤160ms internal → ≤200ms perceived.

## 6. Known-unproven (frontier, not claims)

- CI mobile layout A (twin-thumb) — spec'd, unbuilt.
- `AudioSyncClock` (impossible) — the real remaining risk per its card; no proto coverage.
- All numeric constants — declared guesses pending ARCADE playtest (dossiers mark combat tables, wave scripts, economy rates TBD).
- S&S thumb-arc layout — spec §Controls suggests bottom-right arc; proto used a bottom strip (functional, touch-verified, not the spec's shape).
