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

---

## Round-3 entries (working tree post-`f8449eb` + uncommitted forge apps, live-verified 2026-09-22)

## D-22 · NOTE — `__proto.wavesTotal` throws pre-game (proto verification hook)

**Observed (live):** reading `window.__proto` wholesale on the title screen
throws `TypeError` from `get wavesTotal` — `CHAPTERS[chapter-1]` with
`chapter` still `undefined` (`prototypes/chicken-invaders.html:481`).
Gameplay unaffected; probe hazard only. Proto lane may want a `?? 0` guard.

## D-23 · NOTE — sas ladder progress (`defeated`) not persisted

**Observed (live):** after victory + reload, gold/XP/stats/name restore but
`defeated` resets to 0 → hub offers "Start First Bout" again
(`apps/swords-and-sandals/src/main.ts:12` — save stores `gladiator` only).
Minor design gap vs the complete screen's "your save remains safe" claim.

## D-24 · NOTE — sas opponent HP line froze once (unreproduced)

**Observed (live, once):** bout 1 showed `Opponent HP 34/34` static across
multiple confirmed hits while player HP updated; bouts 2+ decremented
correctly (34→19→9→0). `renderArena` re-renders each `act`/`enemyTurn`, so a
single missed render is suspected. Recorded without a repro — not a defect
filing.

## Post-round-3 status board (live-verified 2026-09-22)

| Entry | Status |
|-------|--------|
| D-05 stage 640×400 vs docs 640×480 | **OPEN** — doc reconciliation owed |
| D-06 stale ticket header | **OPEN** |
| D-08 F3 scenario unreachable | **OPEN** — wave cap 14 |
| D-16 invuln wall-time | OPEN (edge-case note) |
| D-18 banner bleed on menus | **OPEN — re-confirmed live**: after M-exit from `dead`, "OVERRUN ON WAVE 1 …" banner + stale HUD (WAVE 1/3 · HP 0 · AMMO 24) render over SELECT MODE (`r03-boxhead-menubleed.png`); `banner.text` cleared only in `startRun` (`game.ts:225`) |
| D-19 grenade self-damage | **OPEN** — `detonate` still damages all players in 0.8×radius, no owner exemption (`game.ts:674`); design ruling still owed |
| D-20 held-key bleed mode→room | **FIXED (uncommitted tree)** — held Digit1 now stops at `state='room'`; second press required to start play; live-verified |
| D-21 chicken-invaders ReferenceError | **FIXED (proto, uncommitted)** — `ox/oy/cw/ch2` declared at line 90; full loop live-verified (spawn→kill→score→die→respawn); proto-verdict flipped to PASS |
| D-22 `__proto.wavesTotal` pre-game throw | OPEN (probe hazard, proto lane) |
| D-23 sas `defeated` not persisted | OPEN (minor design gap) |
| D-24 sas opponent HP freeze | OPEN (unreproduced, watch item) |

## New-surface coverage added round 3

| Surface | Verdict file | Result |
|---------|--------------|--------|
| `apps/swords-and-sandals` (:5178) | `runtime-verdicts/06-swords-and-sandals-smoke.md` | PASS — create→hub→bout→victory/defeat→shop→save |
| `apps/chicken-invaders` replica (:5176) | `runtime-verdicts/07-shmup-apps-smoke.md` | PASS — pack correct, loop verified |
| `apps/chicken-invaders-original` cluck (:5177) | same | PASS — distinct pack, loop verified |
| `prototypes/chicken-invaders.html` | `proto-verdicts/chicken-invaders.md` | PASS (was FAIL/D-21) |

---

## Round-4 entries (working tree post-`f8449eb` + uncommitted forge apps, live-verified 2026-09-22)

## D-25 · DEFECT — Deathmatch ammo starvation: match can become unfinishable

**Observed (live):** P1 exhausted all 24 ammo reaching 1 kill (`r04-boxhead-dm-end.webp`: `P1 HP 20 AMMO 0`). Bullets deal 10 HP (`game.ts:575`); `DM_TARGET_KILLS=5` needs 50 hits; a life carries 24 rounds → max 2.4 kills/life. Ammo refills ONLY on respawn (`game.ts:407`); crate spawner gated `mode !== 'deathmatch'` (`game.ts:606-610`); grenade AoE kills grant no credit (`game.ts:684` stub). If both players empty magazines without dying, the match can never end — no crates, no melee, no timer, no exit (D-26). B13 "match ends on agreed rule" fails in mutual-exhaustion state.
**Classification:** built wrong — DM ammo economy never balanced.

## D-26 · NOTE — Pause bound but never consumed in boxhead (Esc/P inert)

`input.ts:30` binds Escape/KeyP → `'pause'`; zero consumers in `apps/boxhead/src/` (grep count 0). Impossible (`main.ts:202`) and shmup-core (`boot.ts:135`) consume it — boxhead is the outlier. No pause state, no mid-run menu exit. Checklist has no explicit pause item → NOTE; combined with D-25 a stuck DM has no escape hatch.

## D-23 · CORRECTED — sas `defeated` IS saved but never restored; reload always lands on CREATE

r3 filing said "save stores gladiator only" — **wrong**: `persist()` at `main.ts:13` saves `{gladiator, defeated}`. Real defect is the load path: `let defeated = 0` (`main.ts:11`) never restores `saveData.defeated`; `mode` always `'create'` (`main.ts:12,29`). Live-verified: post-victory reload → CREATE screen with persisted Gold/XP/Lv, arena gated behind re-allocation.

## D-27 · DEFECT — sas reload double-dip: +6 free stat points per reload

`mode='create'` every boot + points reset to 6 (`main.ts:11-12`) → each reload grants fresh allocation on the persisted gladiator. Infinite stat inflation via refresh.

## D-28 · DEFECT — sas duplicate shop purchases charge full price for no-op

Bought items never disabled (`main.ts:20`); rebuy charges full gold for `Math.max` no-op. Spec copy "buy one item" mismatched; economy hole.

## D-29 · NOTE — sas Imperial Buckler gate unreachable until ladder complete

Buckler requires L3 (`main.ts:9,14,24`), reachable only post-ladder — dead content in current build.

## D-30 · DEFECT — sas endless complete-screen replay, unbounded reward

Complete screen replayable indefinitely; reward `18 + defeated*8` gold each time (`main.ts:21,24`) — unbounded exploit.

## D-31 · NOTE — sas unescaped `g.name` into innerHTML

`main.ts:17-18` — self-XSS via local save; injection vector if saves ever shared. [INFERENCE on exploitability]

## D-32 · DEFECT → FIXED mid-round — shmup virtual stick stuck after pointerup outside canvas

`touch.ts` bound release on canvas only; outside-canvas release left ship moving (live-verified, `r04-ShmupTouch-5176-stuck-pointerup.png`). Forge fixed mid-probe: `touch.ts:89-90` now `window` + capture. Same class as boxhead D-14.

## D-33 · DEFECT (major) → **FIXED in-tree (uncommitted, live-verified)** — impossible app: gaps were not lethal

**Observed (live, pre-fix):** no-jump cube falls 171px into gap@1400, crosses, snaps back at x=1518, continues. Pre-fix `main.ts:185` only fall-kill was `cube.y > 740`; no gap-bottom check. Proto card documented this exact bug + fix (`floor === -Infinity && bottom > ground+margin`) and carry-forward #4 warned forge — initially missed, landed mid-round. 3 of 4 gaps were free passes.

## D-34 · DEFECT (major) → **FIXED in-tree (uncommitted, live-verified)** — impossible app: block side-kill tested LEFT edge

**Observed (live, pre-fix):** `solidSideAt(cube.x,…)` tested left edge; death at x=3003 for block@3000 (proto-fixed ≈2967), ~94ms late at 360px/s. Same proto carry-forward #4 — initially missed, landed mid-round.

**Fix verification (L1, post-17:42 bytes):** `main.ts:187` front-edge `solidSideAt(cube.x + CUBE,…)`; `main.ts:188` gap-bottom kill `floor === -Infinity && cube.y + CUBE > GROUND_Y + 8`. Live: no-jump dies at **x=1410**; teleport(2700)→block dies at **x=2967** — exact proto parity (`r04-impossible-gapfix.webp`, `r04-impossible-blockfix.webp`). Forge landed both mid-round after verdict circulation.

## D-35 · NOTE — impossible app: sub-frame pointer taps dropped

`main.ts:199-200` polls press-edge per frame; down+up inside one rAF gap invisible. Real clicks fine; edge case.

## D-36 · NOTE — shmup HUD `WAVE 3/2` during clear/win/gameover banners

`render.ts:201` — waveIdx not clamped post-final-wave. Cosmetic.

## D-37 · NOTE — shmup boss names never rendered

HUD shows generic `BOSS` (`render.ts:201`); `pack.bosses[].name` dead data. Spec 06 "names clearly distinct" partial.

## D-38 · NOTE — replica pack enemyTypes stat-identical

`packs.ts:45-49` — same color/speed/hp; type assignment no-op for replica. Cluck differentiated post-edit (GLIDER 1.15×, BRUISER 0.85×/hp3). Spec asks 2–3 types — replica placeholder.

## D-39 · NOTE — shmup pack gift/food/enemy strings dead; cluck birds carry replica comb/beak accents

`render.ts:114-123` hardcoded pickup visuals; `render.ts:70-71` hardcoded comb/beak colors.

## D-40 · DIVERGENCE (docs) — build-card/ticket-xref claims contradicted by runtime (DocsXref lane)

- Storage keys: docs say `boxhead/highscore`+`boxhead/keymaps`; runtime+code say `maga:boxhead:highscore` (`storage.ts:4` PREFIX='maga:').
- Integer-scale claim vs shipped fractional downscale (`2e74d55`, RT-02 portrait 390×244).
- BN1 BH-1.7 PASS signed while death was unreachable (D-01) — acceptance provenance invalid at signing.
- BH-2.1 PASS-structure signed while touch loop was blocked (D-14).
- BH-3.2 "no mute button" now false — button shipped, live-verified.
- 5 build cards say "not yet scaffolded"; all 6 apps now pass runtime smoke.
- ID-space collision: docs divergence log uses D-01…D-14, verify uses D-01…D-40 — different meanings; namespacing needed.
- Verify misses imported: docs-D-06 (stale concatenated spec-pack), docs-D-09 (audio recipe ids vs presets — partially stale post-BH-3.2).

## Post-round-4 status board (live-verified 2026-09-22)

| Entry | Status |
|-------|--------|
| D-05 stage 640×400 vs docs 640×480 | **OPEN** — doc reconciliation owed |
| D-06 stale ticket header | **OPEN** |
| D-08 F3 scenario unreachable | **OPEN** — wave cap 14 |
| D-16 invuln wall-time | OPEN (edge-case note) |
| D-18 banner bleed on menus | **OPEN** — cosmetic |
| D-19 grenade self-damage | **OPEN** — design ruling owed |
| D-22 proto `__proto.wavesTotal` pre-game throw | **OPEN — re-confirmed live** (TypeError on title screen; mid-game hook fine) |
| D-23 sas `defeated` persistence | **OPEN — root cause corrected**: saved but never restored; reload → CREATE |
| D-24 sas opponent HP freeze | WATCH — not reproduced in full bout |
| D-25 DM ammo starvation | **OPEN — new DEFECT** |
| D-26 boxhead pause inert | OPEN — new NOTE |
| D-27 sas reload stat double-dip | **OPEN — new DEFECT** |
| D-28 sas duplicate shop purchase | **OPEN — new DEFECT** |
| D-29 sas Buckler gate unreachable | OPEN — new NOTE |
| D-30 sas complete-screen replay exploit | **OPEN — new DEFECT** |
| D-31 sas name innerHTML | OPEN — new NOTE |
| D-32 shmup stick pointerup | **FIXED mid-round (uncommitted)** — window-level release |
| D-33 impossible gaps non-lethal | **FIXED in-tree (uncommitted)** — live-verified x=1410 |
| D-34 impossible block left-edge | **FIXED in-tree (uncommitted)** — live-verified x=2967 |
| D-35 impossible sub-frame taps | OPEN — new NOTE |
| D-36/37/38/39 shmup cosmetics | OPEN — new NOTEs |
| D-40 docs-vs-runtime contradictions | OPEN — reconciliation owed (maga-docs scope) |

## Round-4 coverage added

| Surface | Verdict file | Result |
|---------|--------------|--------|
| boxhead modes (B11/B12/B13/A4/E5) | `runtime-verdicts/08-boxhead-modes.md` | PASS + D-25/D-26 |
| burger-tycoon deep (acc #1/2/3/5/7) | `runtime-verdicts/09-burger-tycoon-deep.md` | PASS all five; collapse chain live |
| swords-and-sandals deep | `runtime-verdicts/10-swords-and-sandals-deep.md` | PARTIAL — D-23 corrected, D-27/28/30 defects |
| shmup apps deep (both packs) | `runtime-verdicts/11-shmup-deep.md` | PASS — D-32 found+fixed, D-36–39 notes |
| impossible app deep | `runtime-verdicts/12-impossible-deep.md` | PASS — D-33/D-34 found+fixed, live re-verified |
| proto claim cards ×3 | `proto-verdicts/claim-cards-r04.md` | impossible mostly verified; burger partial; chicken D-22 open |

---

# ROUND 5 (2026-09-22) — fix-verification wave + hardest surface

29-lane wave `r05-fixes` verified forge's uncommitted defect burn live and covered the new `hardest/` surface. Lane reports: `.ufo/scopes/maga-verify/r05-wave/`. 90 evidence files under `verification/evidence/r05-*`.

## Fix verdicts (live unless noted)

| Defect | Verdict | Evidence |
|--------|---------|----------|
| D-16 invuln wall-time | **PARTIAL** — dt clamp 0.05 landed (`game.ts:355`) but throttle-resume burst still stacks lethal contact damage (D-58) | `r05-BoxheadStress-*`, `r05-BoxheadD16-current.png` |
| D-22 proto `__proto` title throw | **FIXED** — `window.__proto` on title returns mode=title, wave=null, wavesTotal=null, no throw; combat regression watch cleared | ProtoChickenD22 live |
| D-23 sas `defeated` persist | **FIXED** — win→reload→'Next Opponent' ×2 runs; `validSave()` rejects 7/8 corrupt payloads to fresh create, 0 crashes | `r05-SasD23-04/05/06/07` |
| D-25 DM ammo starvation | **FIXED** — crates spawn in DM (first ~9.3s, cadence 12s, cap 2), pickup 0→16 ammo, match concluded P2 5-3 | `r05-BoxheadDMCrates-*` |
| D-26 pause inert | **FIXED** — ESC/P pause+resume, world frozen pixel-identical 2s, M→menu, waveBreak frozen, dead/victory/mode correctly ignore pause | `r05-BoxheadPause-01..04` |
| D-27 sas reload double-dip | **FIXED** — weapon stayed +2 across reload | `r05-SasD2728-reload-*` |
| D-28 sas duplicate purchase | **FIXED** — 'Owned'/disabled, gold unchanged on re-click, persists across reload | `r05-SasD2728-shop-owned` |
| D-29 Buckler gate | **FIXED** — gate 3→2; purchasable at Lv2 (gold-gated only) | `r05-SasD2930-d29-*` |
| D-30 complete replay exploit | **FIXED** — defeated=4 boots 'complete'; hub shows no bout button; startFight unreachable; defeated=5 rejected by validSave | `r05-SasD2930-d30-*` |
| D-31 sas name innerHTML | **PARTIAL** — renderHub textContent fix verified, but name still executes via `hud.innerHTML` (D-51 HIGH) and `g.look` via hub h1 (D-52) | `r05-SasD31-hub-hud-injection.png` |
| D-32 shmup stick release | **FIXED live** — window-level pointerup verified on BOTH apps under 390×844 coarse emulation; ship stops, fire unstuck | `r05-ShmupD32Live-*` ×10 |
| D-33/34 impossible collision | **RE-CONFIRMED on current bytes** — 27/27 no-jump deaths x=1410; teleport(2700) death x=2967 ×2 | `r05-ImpossibleFixes-*` |
| D-36 wave counter | **PARTIAL** — crash vector clamped (`sim.ts:283`); `snapshot()` still leaks wave 3/2 during boss (D-41) | static |
| D-37 boss names | **NOT FIXED** — HUD still literal 'BOSS' (`render.ts:201`); `BossType.name` dead | static |
| D-38 type visuals | **FIXED (cluck)** — 3 distinct variants live; GLIDER 1.147× faster, BRUISER 0.846×/3hp measured; replica still identical (placeholder, stands) | `r05-ShmupTypes-cluck-wave1.png` |
| D-39 dead strings | **PARTIAL** — gift/food still dead; comb/beak hardcoded now MISMATCH cluck headColors | static |
| D-40 docs contradictions | **PARTIAL** — 7/8 bullets reconciled byte-verified (DD-99/102/103 exist); DD-18 body + xref BH-2.4 stale; DD-06/09 import unactioned | DocsXref2 |
| D-08 F3 unreachable | **ENABLER LANDED** — ?stress tops ~100 movers incl runners (36/100); ~52fps median under 30-tab contention (lower bound); F3 gate still owes isolated run | `r05-BoxheadStress-*` |
| D-18 banner bleed | **OPEN** — still visible on title/room/game | `r05-BoxheadRegress-*` |
| D-19 grenade self-damage | **RESOLVED in code** — owner exempted `game.ts:679-704`; partner FF remains; design ruling formally owed | static+live |

## New defects (r05)

| ID | Sev | Summary | Site |
|----|-----|---------|------|
| D-41 | LOW | shmup `snapshot()` wave unclamped → `__maga.state` shows 3/2 during boss | `shmup-core/sim.ts:448` |
| D-42 | LOW latent | speed≤0 gate freezes movement only — chicken still shoots/collides/blocks wave-clear | `sim.ts:285` |
| D-43 | LOW | per-type HP without per-type score (BRUISER 3hp = 100pts) | `sim.ts:182` vs `:236` |
| D-44 | LOW | replica SCOUT/ACE phantom types (identical stats, names never render) | `packs.ts:46-49` |
| D-45 | HIGH | hardest corrupt `best` entry bricks level select — `b.time.toFixed` TypeError every frame; legit clears can't overwrite corrupt entry | `hardest/game.js:296`, `loadSave:13-16` |
| D-46 | LOW latent | hardest playerSpeed unvalidated — >7680px/s tunnels walls (corpus max 185) | `hardest/engine.js` moveResolve |
| D-47 | HIGH | hardest `MEDAL_COL` undefined → menu crashes ~60 ReferenceErrors/s, truncates at first medaled tile (every player who cleared a level). Sibling `MENU_COLS` crash fixed mid-wave | `hardest/game.js` drawMenu |
| D-48 | MED | hardest manifest.js stale — 96 entries vs 98 level files; 97/98 ship-invisible (validator reads dir: 98/98 pass) | `hardest/manifest.js` vs `levels/` |
| D-49 | MED | hardest autopilot re-decides per 1/240s substep; shipping loop samples input per frame — sub-frame clears unreproducible | `hardest/autopilot.js` vs `game.js:326` |
| D-50 | LOW | hardest L30 patrol [20,10]-[20,15] renders through solid wall row 12 | `hardest/levels/30-hardest.js` |
| D-51 | HIGH | sas stored XSS: `g.name` → `hud.innerHTML` executes on every screen (live `window.p===1`) | `sas/main.ts:17` |
| D-52 | MED | sas stored XSS via crafted save: `g.look` → hub `<h1>` (live `window.q===1`) | `sas/main.ts:20` |
| D-53 | LOW latent | sas `log()` innerHTML sink — not name-reachable today, one template away | `sas/main.ts:14` |
| D-54 | MED | sas ladder unwinnable from Snorter onward — measured ~26 dealt/life vs 62hp; max gold 78 buys Buckler OR Sword+Sandals; complete screen unreachable by pure play | `sas/main.ts` economy |
| D-55 | LOW | boxhead pause banner promises ENTER→menu; Enter bound to 'fire', does nothing | `game.ts:309` vs `input.ts:27` |
| D-56 | LOW | boxhead frozen world renders behind SELECT MODE after pause→M (D-18 family) | `game.ts:160-165` |
| D-57 | LOW | boxhead crateTimer unclamped negative while field full → instant respawn post-pickup | `game.ts` updateProps |
| D-58 | MED | D-16 incomplete: throttle-resume burst stacks lethal damage despite dt cap — needs wall-clock invuln | `game.ts:355` + entities |
| D-59 | MED docs | DD-103 inverts spec direction — spec 01-boxhead.md:30 says 'players vs each other WITH pickups'; crate enable moves code INTO compliance; DD-18 body + xref BH-2.4 stale | docs scope |
| D-60 | INFO | impossible `window.__proto` debug hook shadowed by Window.prototype accessor — `__proto.LEVEL` unreadable; `__maga` works | `impossible/main.ts:280-288` |
| D-61 | INFO | impossible `die()` persists unclamped progress — debug die at x>9900 writes best>1 | `impossible/main.ts:148` |
| D-62 | INFO | hardest autopilot.js not loaded by index.html — solver unreachable from shipped page | `hardest/index.html` |
| D-63 | PROCESS | shared-origin localStorage + global tab-name registry → cross-lane save/tab corruption (file:// origin shared; :5173/:5174 keys shared) | harness |

## Round-5 coverage added

| Surface | Verdict file | Result |
|---------|--------------|--------|
| boxhead fixes (D-16/25/26/08/touch/regress) | `r05-wave/Boxhead*.md` | D-25/26 FIXED live; D-16 PARTIAL (D-58); D-08 enabler landed; D-18 open |
| impossible fixes + frontier | `r05-wave/Impossible*.md` | D-33/34 re-confirmed; best-progress + __proto live; full clear still unproven (segment-verified passable) |
| burger grid refactor + collapse | `r05-wave/Burger*.md` | PASS — 4-pane grid, 10/10 actions, no-op contract, collapse chain intact |
| sas fixes (D-23/27/28/29/30/31) | `r05-wave/Sas*.md` | D-23/27/28/29/30 FIXED live; D-31 PARTIAL → D-51/52/53; NEW D-54 unwinnable ladder |
| shmup fixes (D-32/38/churn) | `r05-wave/Shmup*.md` | D-32 FIXED live both apps; D-38 cluck FIXED; D-37 not fixed; D-41–44 new |
| hardest/ (new surface) | `r05-wave/Hardest*.md` | 96/96 shipped levels completable (browser+Node); D-45/47 menu crashes HIGH; D-48 manifest stale |
| proto sas card | `r05-wave/SasProto.md` | PARTIAL — boot/create/combat-gate/persist live; loop/shop/defeat/touch/champion static |
| proto chicken D-22 | `r05-wave/ProtoChickenD22.md` | FIXED on edited bytes |
| docs reconciliation | `r05-wave/DocsXref2.md` | 7/8 reconciled; 3 stale downstream records |
