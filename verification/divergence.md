# DIVERGENCE LOG — spec vs observed (static)
**maga-verify · 2026-09-22 · Round 1**
Method: full read of `apps/boxhead/src/*` + `packages/arcade-core/src/*` against checklist + concept + tickets + dossier. Runtime probes began ~16:2x when `node_modules` + :5173 came up mid-round. Every entry cites both sources. Severity: **BLOCKER** > **DEFECT** > **DIVERGENCE** > **NOTE**.

**Hot-tree caveat:** forge committed `fe3ae3e` while this audit was in flight. Entries below are re-verified against post-`fe3ae3e` bytes; the commit fixed D-01 and one bug this audit had missed (D-09).

---

## D-01 · BLOCKER → **FIXED in `fe3ae3e`** — Player death unreachable in solo & co-op (B3, B9)

**Spec:** checklist B9 "Death ends run; shows wave reached + score"; concept §Core loop step 6 "On death … show wave reached + score"; tickets BH-1.7 "Death → end run → score screen → restart / menu".
**Observed:** no code path sets `PlayerSlot.alive = false` outside deathmatch.

Trace (all writes to `.alive`):
- `game.ts:190,196` — constructed `alive: true`
- `game.ts:379` — `respawn()` sets `alive = true` (deathmatch only)
- `game.ts:537` — `alive = false` — inside `if (this.mode === 'deathmatch')` bullet branch only
- `game.ts:632` — `alive = false` — inside `if (this.mode === 'deathmatch' && s.p.hp <= 0)` barrel branch only

Damage paths that never check for death:
- `game.ts:479-484` — zombie contact: `s.p.hp -= 10`, `invuln = 0.8` — no `hp <= 0` handling. HP goes negative indefinitely; `updateHud` clamps display at 0 (`Math.max(0, …)` line 673/680) so the player *looks* alive at 0 HP forever.
- `game.ts:623-637` — barrel blast in solo/co-op: `hp -= 25`, `invuln = 0.8` — no death check.

Consequence: `tickPlaying` line 326 `this.slots.every((s) => !s.alive)` can never be true in solo/co-op → `gameOver()` unreachable → `dead` state, death banner, death-persist, and death-restart are dead code in those modes. A solo run can only end via `victory` (wave 3 cleared) or closing the tab — which also means `persistHigh()` never runs on a lost run (B10 partial).

**Fix landed (verified in diff):** zombie contact now sets `alive=false` on `hp<=0` (`game.ts:484-488` post-fix); barrel blast sets `alive=false` for all modes, `respawnTimer` only in deathmatch (`game.ts:635-642`). `gameOver()` reachable again. Runtime re-verification queued (probe 2).
**Classification:** was built wrong at baseline `1c45956`; forge self-corrected before this report landed. Recorded as found-and-fixed — evidence the audit caught a real defect, not a false positive.

---

## D-02 · NOTE — Solo high-score persist only fires on victory (B10 partial)

**Spec:** checklist B10 "Best score survives refresh via localStorage".
**Observed:** `persistHigh()` is called from `nextWave()` victory branch (`game.ts:222`) and `gameOver()` (`game.ts:239`). Pre-`fe3ae3e`, a losing solo run never persisted. Post-fix, death→`gameOver`→`persistHigh` is reachable. RUNTIME confirm on refresh.
**Classification:** was consequence of D-01; resolved by the same commit. Re-verify at runtime.

---

## D-03 · DEFECT (minor) — `grenades` weapon tier is a downgrade (B8)

**Spec:** checklist B8 "Progression toward shotgun / uzi / grenades feel order present … no dead upgrade that bricks the run"; concept "weapon upgrades feel earned".
**Observed:** `fireDelay('grenades') = 0.8` vs `fireDelay('uzi') = 0.14` (`world.ts:114-121`); `tryFire` adds spread pellets only for `shotgun` (`game.ts:427-432`) — grenades fires one bullet, slower than pistol (0.34). Reaching mult 14 *reduces* firepower ~5.7× vs uzi. Doesn't brick the run (mult decays back below 14 in ~8s of no kills), so B8's hard clause ("bricks the run") is not violated — but the top rung punishes the player.
**Also:** `ammoPerShot` (`world.ts:123-125`) is `w === 'uzi' ? 1 : 1` — dead conditional, all tiers cost 1. Cosmetic.
**Classification:** built wrong (stub acknowledged in code comment "grenades not implemented yet" — forge knows; recorded so it isn't lost).

---

## D-04 · DEFECT — Portrait-phone touch controls cropped off-stage (C1, C6)

**Spec:** checklist C1 "Solo phone … playable one- or two-handed ≥60s"; C6 "solo portrait acceptable if C1 green"; concept §Mobile layout C.
**Observed:** `fitIntegerScale` returns `Math.max(1, …)` (`scale.ts:11`) — minimum scale is 1×, never fractional. Stage is 640×400 (`main.ts:11-12`). On a 390×844 portrait phone: `min(390/640, 822/400)` → floor(0.609) = 0 → clamped to **1** → canvas renders 640×400 CSS px, centered → ~125px cropped on each side. FIRE button zone center x=574, radius ~49 (`touch.ts:97,106`) → entirely off-screen right edge. Stick at x=78 survives partially. Result: portrait solo = move but **cannot fire** → unplayable, and C6's "solo portrait acceptable" condition fails.
Landscape 844×390: `min(844/640, 368/400)` → floor(0.92) = 0 → **1** → 640×400 fits (400>368 → slight vertical crop ~16px top/bottom; controls at y≈326-330 stay on-screen). Landscape playable.
**Classification:** built wrong for the portrait case. Options for forge (not ours to pick): fractional-fit floor for <1× viewports, or portrait-specific layout. Reported, not fixed.

---

## D-05 · DIVERGENCE — Stage size 640×400 in code vs 640×480 in docs (D2)

**Spec:** checklist D2 "Provisional **640×480** until ARCADE measures (UNVERIFIED)"; dossier §Display "FORGE shell provisional **640×480**"; FORGE scaffold review (tickets line 133) recorded "**640×400** provisional" — the docs disagree with each other *and* the code.
**Observed:** `STAGE_W=640, STAGE_H=400` (`main.ts:11-12`, `game.ts:17-18`, comment "provisional, UNVERIFIED").
**Classification:** documentation divergence, not a defect — everything is explicitly UNVERIFIED and the scaffold review did record 640×400. Checklist + dossier text should be reconciled (maga-docs / forge scope, not ours).

---

## D-06 · DIVERGENCE — Ticket header stale vs BH-2 acceptance on file

**Spec:** tickets header line 6: "BH-0 PASS · BH-1 PASS · **BH-2 next**".
**Observed:** `apps/boxhead/docs/ACCEPTANCE-BN2.md` exists claiming BH-2.1–2.6 complete (PASS/WAIVE) with headless evidence `proofs/bh2-2p-*.png`. The ticket status line wasn't updated.
**Classification:** stale doc line; schedule-recording nit, not a defect.

---

## D-07 · NOTE — `docs/from-forge/` duplicates are byte-identical

`diff` confirms `from-forge/01-boxhead.md` ≡ `02-concept-specs/01-boxhead.md` and `from-forge/001-boxhead-native-tickets.md` ≡ `03-stack-and-tickets/001-boxhead-native-tickets.md`. Two copies of the contract can drift; noted for maga-docs awareness. No action required of verify.

---

## D-08 · NOTE — F3 budget scenario unreachable under current wave tables

**Spec:** checklist F3 "~60 fps with ~50–100 on-screen movers".
**Observed:** `WAVE_TABLES` spawn at most 14 zombies in wave 3 (`world.ts:65-69`) + ≤2 players + ≤2 crates + bullets. The 50–100-mover condition cannot occur; F3 as written is untestable until either tables escalate (post-wave-3 content doesn't exist — `MAX_WAVE=3`, `game.ts:19`) or the budget is re-scoped. Flagged as checklist-vs-build mismatch, not a build defect.

---

## Items verified NOT divergent (spot-checked, no findings)

- English-only strings (A5): all UI text English; no locale machinery.
- Engine weight (F7): pixi.js + arcade-core only; no second renderer.
- Integer letterbox (D1): integer-only scale, pixelated rendering, centered offset.
- Rebind stub (E3): localStorage JSON merge documented; no UI — allowed by checklist.
- Deathmatch self-hit: bullets spawn 14px out, owner excluded (`game.ts:418,530`) — correct.
- Barrel chain reactions: fuse propagation present (`game.ts:640-644`).
- Menu flow: title → mode → room → playing → dead/victory → retry/menu — all transitions reachable (except `dead`, see D-01).
- `pointer.seen` aim gate: boot (0,0) no longer aims shots at the corner (`game.ts:355-361`) — forge's documented fix is real in code.

---

## D-09 · FIXED in `fe3ae3e` — Pointer/touch letterbox double-count (audit miss, forge found)

**Observed (pre-fix):** `toLogical` subtracted `cachedOffset` from coordinates that were already canvas-relative via `getBoundingClientRect()` — the CSS `translate()` offset was counted twice, shifting every pointer/touch position by the letterbox amount. At scale 1 with a wide viewport (e.g. 1920×1080: offset x≈640) all pointer aim/touch positions were off by ~640 logical px — effectively all pointer input broken whenever letterbox margins were nonzero.
**Fix:** `toLogical` now divides by scale only (`main.ts:33-36` post-fix) with an explanatory comment. Correct — `getBoundingClientRect()` includes the transform.
**Classification:** defect found by forge, not by this audit — recorded for completeness and because it changes the verdict on pointer-aim paths (E4/mouse aim, touch zones) from "suspect" to "correct as written".

## D-10 · NOTE — `crateTimer` not reset on restart

`startRun` resets wave/score/field but not `crateTimer` (`game.ts:169-216`). If a crate was due when the run ended, one spawns instantly on retry. Harmless (free ammo), not a checklist item. Recorded as trivia, not a defect.

## D-11 · NOTE — Co-op perma-death is spec-consistent

Post-fix, a dead co-op player stays dead for the run (respawn only exists in deathmatch). `gameOver` requires *all* slots dead (`game.ts:326`). Matches "both must fall" in the app README; concept leaves co-op wipe rules TBD. Not a defect — flagged so a future "dead P1 spectates" question isn't re-litigated.

---

## D-12 · FIXED (uncommitted, live-verified) — Letterbox double-centering (D1/D3)

**Observed (live, pre-fix):** canvas positioned by BOTH flex-centering (`body{display:flex;center}`) AND a CSS `translate(off)` — offset applied twice. At 1280×800 the canvas sat at x=640 (correct: 320), bottom edge clipped 21px (`shot-01-title.png`). On any viewport the stage drifted to the bottom-right corner.
**Fix (live-verified):** forge switched to fixed canvas + explicit `left/top` (`main.ts` layout()); reload shows canvas centered at x=320 (`shot-07-title-centered.png`). PASS.

## D-13 · DEFECT (uncommitted tree) — Stale end-of-run banner persists into next run

**Observed (live):** OVERRUN banner rendered over active gameplay after restart (`shot-10-coop.png`, `shot-14-touch-play.png`); `banner.text` still populated while `state='playing'`.
**Cause:** uncommitted BH-3 music edit replaced `this.banner.text = ''` with `this.sfx.startMusic(...)` in `startRun` (`game.ts:211-212`) — the clear was collateral damage. Also `gameOver`/`dmEnd`/`nextWave` lost their `sfx.preset('death'/'pickup')` jingles to `stopMusic()`.
**Classification:** defect in working tree; likely transient (forge mid-edit) but recorded — if it ships, B9's "restart works" still passes functionally while the screen lies to the player.

## D-14 · DEFECT — Touch cannot restart or exit after a run ends (C1-adjacent)

**Spec:** checklist C1 "playable ≥60s without softlock"; concept "die → see score → instantly back in".
**Observed (live):** `dead`/`victory` states only read `wasPressed('fire'|'action')` (`game.ts:303-307`); `pointer.tapped` is consulted on title/mode/room screens but NOT on end screens. On a phone there are no keys — canvas tap and FIRE-button tap both ignored; the player is trapped on the death screen. Verified: state stayed `dead` through both tap types.
**Classification:** built wrong — touch path incomplete at the exact screen the loop depends on.

## D-15 · SUSPECT — Any touch fires the weapon on coarse pointers

`wantsFire` includes `p.active && coarse` (`game.ts:362`): Input sets `pointer.active` on ANY canvas pointerdown, so on a real phone the movement stick also fires continuously → ammo drain while moving. Unconfirmed on real hardware (CDP emulation reports `pointer: fine`); flagged for device check. If confirmed: C2 defect.

## D-16 · NOTE — Invuln is wall-time; stacked zombies hit once each per frame

`invuln` decays by `deltaMS` (wall time); each zombie's contact check is independent per frame. Under tab throttling (hidden headless), one 500ms delta decays invuln fully and 4 stacked zombies each land a hit the same frame → 100→0 in ~2s observed. At real framerates this is a minor multi-hit burst, not a defect — but the design has no per-hit global cooldown. Recorded as edge-case NOTE.

## D-17 · NOTE — Badge height vs `BADGE_H` constant; mute overlaps badge on narrow screens

Badge wraps to ~55px at 390px wide; layout reserves 22px (`main.ts` `BADGE_H`) → canvas pushed down with dead space. `.mute` fixed at top:26px overlaps the wrapped badge. Cosmetic; affects C3-adjacent chrome readability on phones.

---

## Post-`2e74d55` status board (live-verified 2026-09-22)

| Entry | Status at `2e74d55` |
|-------|---------------------|
| D-01 death unreachable | **FIXED** (`fe3ae3e`) — live-confirmed: hp0→dead→banner→restart |
| D-02 persist on loss | **FIXED** (same commit) — `maga:boxhead:highscore`="300" observed |
| D-03 grenade downgrade | **OPEN** — `fireDelay('grenades')=0.8` still > uzi 0.14; acknowledged stub |
| D-04 portrait crop | **FIXED** (`2e74d55`) — live-confirmed 390×844: canvas 390×244, FIRE on-screen |
| D-05 stage 640×400 vs docs 640×480 | **OPEN** — doc reconciliation owed (maga-docs/forge) |
| D-06 stale ticket header | **OPEN** — header still says "BH-2 next" while ACCEPTANCE-BN2 exists |
| D-07 `from-forge` duplicates | OPEN (informational) |
| D-08 F3 scenario unreachable | **OPEN** — wave tables still cap at 14 movers |
| D-09 pointer double-count | **FIXED** (`fe3ae3e`) |
| D-10 crateTimer not reset | OPEN (trivia) |
| D-11 co-op perma-death | spec-consistent (closed) |
| D-12 letterbox double-center | **FIXED** (`2e74d55`) — live-confirmed centered |
| D-13 stale banner | **FIXED** (`2e74d55`) — live-confirmed `banner.text=''` on restart |
| D-14 touch end-screen trap | **OPEN — confirmed live at `2e74d55`**: tap on dead screen ignored (`game.ts:309-310`); phone player trapped. Loop-blocking on mobile. |
| D-15/RT-5 any-touch-fires | **OPEN (suspect)** — `game.ts:366` unchanged; needs real-device check |
| D-16 invuln wall-time | OPEN (edge-case note) |
| D-17 badge/mute overlap | **OPEN — confirmed live**: badge 55px vs `BADGE_H=22`; on landscape badge overlaps HUD top line |

---

## Round-2 entries (working tree post-`2e74d55` + forge `f8449eb`, live-verified 2026-09-22)

## D-18 · DEFECT (cosmetic) — End-of-run banner bleeds onto menu screens

**Observed (live):** after M/chip exit from `dead`, the "OVERRUN ON WAVE 1 …" banner renders on top of SELECT MODE text (`r02-desktop-dead.png`). `showModeSelect`/`showRoomSelect`/`showTitle` call `clearMenu()` but never reset `banner.text`; only `startRun` clears it (`game.ts:225`). Same family as D-13 (fixed on restart path) — this instance is the menu-exit path. Cosmetic, not loop-blocking.

## D-19 · DEFECT (design gap) — Grenade AoE damages the shooter (and co-op partner)

**Observed (live):** `detonate(pos, 60)` damages ALL players within `radius*0.8` = 48px for 25 HP (`game.ts:672-688`). Verified: detonation 30px from shooter → HP 100→75. A grenade hitting a zombie at melee range self-damages; in co-op it friendly-fires. Barrels sharing this code path is spec-plausible (explosions hurt), but the spec never states grenades carry self-damage — and the tier is now a *downgrade trap* at close range (uzi has no self-risk). In deathmatch, AoE kills grant no kill credit (comment: "stub"). Needs a design ruling: keep (consistent with barrels) or exempt owner.

## D-20 · DEFECT (minor) — Held key bleeds across mode→room transition

**Observed (live):** one Digit1 press on SELECT MODE both picks solo AND starts room 1 — `pressed` survives the `mode→room` state change within the same hold (`game.ts:306-319`), so SELECT ROOM never appears. Keyboard players cannot reach room 2 without a precisely-timed short tap. Tap-to-pick unaffected. Minor: workaround exists (tap), but the room screen is effectively skipped for held keys.

## D-21 · BLOCKER (proto) — chicken-invaders.html dead on arrival

**Observed (live):** `spawnWave` throws `ReferenceError: ox is not defined` (line 91; `ox/oy/cw/ch2` never declared). First throw kills the rAF loop permanently — game freezes in `mode='play'` with 0 chickens, no boss, stale title pixels. Core loop unverifiable; see `proto-verdicts/chicken-invaders.md`. Schedule fact for proto lane, not a forge defect.

---

## Post-round-2 status board (live-verified 2026-09-22, forge `f8449eb`)

| Entry | Status |
|-------|--------|
| D-03 grenade downgrade | **FIXED (f8449eb)** — lobbed AoE shell, detonates on hit/wall/expiry, radius-60 kill zone; live-verified 3 kills/1 shell. New concern → D-19 self-damage |
| D-05 stage 640×400 vs docs 640×480 | **OPEN** — doc reconciliation owed |
| D-06 stale ticket header | **OPEN** |
| D-08 F3 scenario unreachable | **OPEN** — wave cap 14 |
| D-10 crateTimer not reset | **FIXED (f8449eb)** — `crateTimer=8` on `startRun`; live-verified no instant crate |
| D-14 touch end-screen trap | **FIXED (f8449eb)** — tap retries, MENU chip exits; live-verified dead+victory paths |
| D-15/RT-5 any-touch-fires | **FIXED (f8449eb)** — `wantsFire = isDown('fire') || touch.fire`; field tap inert, FIRE zone fires, stick moves; live-verified under coarse emulation |
| D-16 invuln wall-time | OPEN (edge-case note) |
| D-17 badge/mute overlap | **FIXED (f8449eb)** — live badge height measured, mute at badgeH+4; verified 55px badge → mute top 59px |
| D-18 banner bleed on menus | **OPEN** — new, cosmetic |
| D-19 grenade self-damage | **OPEN** — new, needs design ruling |
| D-20 held-key bleed mode→room | **OPEN** — new, minor |
| D-21 chicken-invaders ReferenceError | **OPEN — BLOCKER** for proto lane |
