# DOC AUDIT — Boxhead playability checklist vs spec corpus
**maga-verify · 2026-09-22 · Round 1**
**Checklist under audit:** `MAGA-everything/01-design-docs/07-acceptance/boxhead-playability-checklist.md`
**Spec corpus:** `02-concept-specs/01-boxhead.md` (concept), `03-stack-and-tickets/001-boxhead-native-tickets.md` (tickets), `02-code/armor-games/docs/from-forge/boxhead-dossier.md` (ARCADE dossier), `02-code/armor-games/docs/from-forge/001-native-stack-and-plan.md` (stack lock)

**Verdict legend:** `STATIC-PASS` = provable from source without runtime · `STATIC-FAIL` = defect provable from source · `RUNTIME` = needs the live game · `UNMEASURABLE` = no pass threshold exists in any spec (flagged, not passed) · `WAIVED` = waiver on file · `SCHEDULE` = not yet built / not yet runnable.

---

## A. Smoke / boot

| ID | Checklist item | Spec source | Measurability | Static verdict |
|----|----------------|-------------|---------------|----------------|
| A1 | `npm run dev` boots app; canvas visible; no fatal console error | tickets BH-0.3; README run path | Measurable | **SCHEDULE** — `node_modules` absent, :5173 dead (see `runtime-verdicts/00-readiness.md`) |
| A2 | Title/menu reachable; English UI; no stuck overlay | concept §Core loop step 1; tickets BH-0.4 | Measurable | **STATIC-PASS** — `game.ts:130-154` title→mode select; all strings English |
| A3 | Audio gate doesn't steal focus | concept §Audio needs; checklist-only | Measurable at runtime | **STATIC-PASS (weak)** — `Sfx` creates `AudioContext` lazily on first `blip` (`sfx.ts:23-33`); first blip fires on menu keypress (`game.ts:234` `sfx.preset('ui')`), i.e. inside a user gesture. No overlay exists to steal focus. Confirm audibly at runtime. |
| A4 | Cold restart menu→combat ≤ ~3s | concept hook 9 | Measurable (timer) | **RUNTIME** — restart path is `startRun()` on `wasPressed('fire')` (`game.ts:305`); no asset loads on retry path, so likely fast, but unproven |
| A5 | English-only strings | concept §Meta Language; README crew rule | Measurable (grep) | **STATIC-PASS** — all UI strings in `game.ts`/`index.html` English; no locale machinery exists |

## B. End-to-end core loop — Solo

| ID | Checklist item | Spec source | Measurability | Static verdict |
|----|----------------|-------------|---------------|----------------|
| B1 | Room pick from 2–3 rooms; shared top-down camera | concept §Core loop step 2; tickets BH-1.2 | Measurable | **STATIC-PASS** — `ROOMS` has 2 entries (`world.ts:21-52`); single shared camera (no camera at all — fixed stage) |
| B2 | Spawn; pistol + limited ammo; move + shoot | concept step 3; tickets BH-1.3 | Measurable | **STATIC-PASS** — `Player.ammo=24` (`entities.ts:27`), pistol default tier (`world.ts:105-110`), move+fire wired (`game.ts:332-368`) |
| B3 | Waves 1–3 completable, no softlock / stuck collision / unkillable spawn wall | concept hook 1; tickets BH-1.4 | Measurable | **STATIC-FAIL (blocker-adjacent)** — waves can be *cleared* but the run can never *end by death* in solo: `slot.alive` is never set `false` outside deathmatch, so `gameOver()` (`game.ts:326-328`) is unreachable. Player is effectively immortal; hp goes negative forever. See `divergence.md` D-01. Wave progression itself (`nextWave`, `updateSpawning`) is sound on read. |
| B4 | Mid-run swarm density "chaotic arcade" | concept §Feel targets; hook 3 | **UNMEASURABLE** — no density threshold anywhere; checklist itself defers to "side-by-side ARCADE clip when available" and no clip exists (dossier §Capture plan: blocked) | **UNMEASURABLE** — flag only. Note: `WAVE_TABLES` caps at 14 zombies (`world.ts:65-69`); whether 14 movers reads as "chaotic" is a judgment call with no reference. |
| B5 | Ammo crates restore shooting when dry; readable | concept step 4; tickets BH-1.5 | Measurable | **STATIC-PASS** — dry fire blocked + click (`game.ts:409-412`); crate +16 ammo on <15px contact (`game.ts:575-587`); yellow/banded sprite (`entities.ts:175-181`). Spawn cadence 12s, cap 2 (`game.ts:566-567`). |
| B6 | Barrels detonate, clear nearby zombies, readable radius, no crash | concept step 4; tickets BH-1.5 | Measurable | **STATIC-PASS** — bullet within 10px lights fuse (`game.ts:498-504`), 0.12s fuse, radius 55 blast kills zombies + damages player + chains (`game.ts:608-645`); `BlastRing` VFX (`entities.ts:209-229`) |
| B7 | Score on kills; streak multiplier visible; unlock cadence feels progressive | concept step 5; tickets BH-1.6 | Partially measurable — score/mult yes; "feels progressive" is subjective, thresholds TBD ARCADE | **STATIC-PASS (structure)** — `ScoreSystem` kill→+100×mult, mult≤20, decays after 3.5s (`world.ts:77-102`); HUD shows `SCORE … xN [WEAPON]` (`game.ts:678-682`). Cadence feel: RUNTIME/subjective. |
| B8 | Weapon curve pistol→shotgun→uzi→grenades; **no dead upgrade that bricks the run** | concept §Content scope; tickets BH-1.6 | Measurable | **STATIC-FAIL (minor)** — `grenades` tier (mult≥14) fires a *single* projectile at 0.8s delay (`world.ts:114-121`, `game.ts:426-432` fires extra pellets only for `shotgun`). Uzi at 0.14s is strictly better DPS. Doesn't brick the run, but the top rung is a downgrade — flagged, not a hard B8 violation. See `divergence.md` D-03. |
| B9 | Death ends run; shows wave + score; restart/menu works | concept step 6, hook 1; tickets BH-1.7 | Measurable | **STATIC-FAIL (blocker)** — unreachable in solo/co-op (see B3 / D-01). The `dead` state, banner, and restart path exist (`game.ts:237-245, 303-307`) but no code path reaches them outside deathmatch. |
| B10 | High score persists via localStorage | concept §Content scope; tickets BH-2.6 | Measurable | **STATIC-PASS (structure)** — `load('boxhead','highscore')` at boot (`game.ts:76`), `persistHigh()` on victory/gameOver (`game.ts:256-261`) via arcade-core `maga:boxhead:highscore` (`storage.ts:6-21`). Caveat: since `gameOver()` is unreachable in solo, a solo run that ends only by browser-close never persists — persistence only fires on `victory` today. RUNTIME confirm on refresh. |

## B. Modes

| ID | Checklist item | Spec source | Measurability | Static verdict |
|----|----------------|-------------|---------------|----------------|
| B11 | Solo / Co-op / Deathmatch all reachable from menu | concept step 1; tickets BH-0.4 | Measurable | **STATIC-PASS** — `showModeSelect` keys 1/2/3 (`game.ts:143-154, 284-295`) |
| B12 | Local co-op: P1+P2 move and shoot simultaneously, one keyboard, no focus steal | concept hook 2; tickets BH-2.3 | Measurable | **STATIC-PASS (structure)** — split keymaps `KEYMAP_P1_VERSUS`/`KEYMAP_P2` (`input.ts:25-48`); both slots tick each frame (`game.ts:332-369`); window-level key listeners, `preventDefault` on bound keys (`input.ts:92-113`). Forge's own headless run claims simultaneous movement (ACCEPTANCE-BN2). RUNTIME re-verify. |
| B13 | Deathmatch: players damage each other; match ends on agreed rule without crash | concept hook 6; tickets BH-2.4 | Measurable (rule itself is TBD/stub — allowed) | **STATIC-PASS (structure)** — bullets hit non-owner only (`game.ts:528-551`), first-to-5 stub, `dmEnd` banner. Barrel kills give no credit (documented stub). RUNTIME re-verify. |
| B14 | ≥1 special enemy if ARCADE confirms; else labeled stub/deferred | concept §Content scope | Conditional | **WAIVE-able / SCHEDULE** — ARCADE has confirmed nothing (dossier: all combat tables = gap). Code has `runner` zombies (red, 1.8× speed, 1hp — `entities.ts:85-92`, `world.ts:65-69`), a *variant*, not a confirmed special. Correctly deferred per checklist; not a FAIL. |

## C. Touch controls

| ID | Checklist item | Spec source | Measurability | Static verdict |
|----|----------------|-------------|---------------|----------------|
| C1 | Solo phone: stick + fire, playable ≥60s no softlock | concept §Mobile layout C; tickets BH-2.1 | Measurable | **STATIC-FAIL (portrait)** — touch zones live at fixed stage coords (stick x=78, fire x=574 on a 640-wide stage, `touch.ts:96-107`) and `fitIntegerScale` floors at 1 (`scale.ts:9-12`). On a portrait phone (e.g. 390 CSS px wide) the stage renders at 640px → right ~250px including the FIRE button is cropped off-screen. Landscape ≥640px is fine. See `divergence.md` D-04. RUNTIME confirm. |
| C2 | Fire/aim kills at wave 1–2 pace; no stuck stick | concept layout C auto-aim note | Measurable | **STATIC-PASS (structure)** — auto-aim nearest zombie on coarse pointers (`game.ts:386-396`); stick release clears state (`touch.ts:80-93`). Pace: RUNTIME. |
| C3 | HUD doesn't get permanently covered; sticks don't cover spawn lanes | checklist-only (no spec section defines clearance zones) | Measurable at runtime | **RUNTIME** — chrome alpha 0.42 (`touch.ts:30`); HUD is top-left, controls bottom corners — plausible pass, needs device. |
| C4 | Dual pads (layout A) on landscape tablet | concept §Mobile layout A; tickets BH-2.2 | Measurable | **WAIVED** by forge ("no tablet in the lab", ACCEPTANCE-BN2) — checklist allows WAIVE for G3 only "if 2P mobile claimed"; forge does not claim it. Acceptable. |
| C5 | Touch code doesn't break desktop B12; chrome hidden/inert on desktop | checklist-only | Measurable | **STATIC-PASS (structure)** — `visibleTarget()` = coarse only (`touch.ts:109-111`); `view.visible=false` on desktop; zones early-return when not visible (`touch.ts:51`). RUNTIME re-verify. |
| C6 | Landscape for 2P; solo portrait OK *if C1 green*; no broken letterbox on rotate | concept §Mobile | Measurable | **STATIC-FAIL (coupled to C1)** — portrait solo is broken by the integer-scale floor (D-04); landscape solo likely fine. "No broken letterbox on rotate" needs RUNTIME. |

## D. Display / scaling

| ID | Checklist item | Spec source | Measurability | Static verdict |
|----|----------------|-------------|---------------|----------------|
| D1 | Integer scale + letterbox; no non-uniform stretch | concept hook 8; tickets BH-0.5; dossier §Display | Measurable | **STATIC-PASS** — `fitIntegerScale` integer-only (`scale.ts:9-12`), canvas CSS sized to exact integer multiple (`main.ts:48-60`), `image-rendering: pixelated` (`index.html:10`) |
| D2 | Stage aspect provisional 640×480 (UNVERIFIED) | checklist §D2; dossier §Display ("provisional 640×480") | Measurable | **DIVERGENCE** — code uses **640×400** (`main.ts:11-12`, `game.ts:17-18`); checklist + dossier both say 640×480. All three mark it UNVERIFIED, so no spec is violated — but the docs disagree with the build. See `divergence.md` D-05. |
| D3 | Resize keeps letterbox; no clipped mandatory HUD | checklist-only | Measurable | **STATIC-PASS (structure)** — `resize` listener → `layout()` (`main.ts:61-62`). RUNTIME confirm. |
| D4 | Fullscreen optional; stage rules unchanged | checklist-only ("if offered") | Measurable | **STATIC-PASS (vacuous)** — no fullscreen offered; nothing to break. |

## E. Desktop controls

| ID | Checklist item | Spec source | Measurability | Static verdict |
|----|----------------|-------------|---------------|----------------|
| E1 | P1 move+shoot without mouse | concept §Controls; tickets BH-1.3 | Measurable | **STATIC-PASS** — WASD/arrows + Space/J (`input.ts:25-37`); facing-fire (`game.ts:403`); mouse aim optional sugar gated on `pointer.seen` (`game.ts:355-361`) |
| E2 | P2 map simultaneous with P1; defaults documented | concept §Controls; tickets BH-2.3 | Measurable | **STATIC-PASS** — `KEYMAP_P2` arrows+IJKL/numpad (`input.ts:44-48`); documented in app README table |
| E3 | User-definable rebinds for v1; persisted or documented limitation | concept §Controls ("v1 should support"); tickets BH-2.5 | Measurable | **STATIC-PASS (stub, documented)** — `setKeymaps`/`getKeymaps` + `boxhead/keymaps` localStorage (`input.ts:184-192`, `game.ts:77-82`); README documents "no in-game UI yet" — checklist explicitly allows WAIVE-by-documentation |
| E4 | Mouse optional only | concept §Controls | Measurable | **STATIC-PASS** — mouse never required on any path |
| E5 | One click → both players keep keys; no chrome steal | checklist-only | Measurable | **STATIC-PASS (structure)** — key listeners on `window`, not canvas (`input.ts:92,108`); `preventDefault` on bound keys only. RUNTIME confirm. |

## F. Load / performance budgets

| ID | Checklist item | Budget | Measurability | Static verdict |
|----|----------------|--------|---------------|----------------|
| F1 | First paint/interactive comfortable | "no multi-second blank" | Measurable | **RUNTIME** — blocked on node_modules |
| F2 | Transfer size sub-few-MB | prefer small | Measurable | **STATIC-PASS** — vendored pixi 812K + webworker 840K + ~52KB source ≈ 1.7MB uncompressed, no binary assets. Within "sub-few-MB". |
| F3 | ~60fps with 50–100 movers | desktop | Measurable | **RUNTIME** — note: wave tables cap at 14 concurrent zombies (`world.ts:65-69`); the 50–100-mover scenario the budget describes is never reached by current tables. Budget may be untestable as written → flag. |
| F4 | 30–60fps mobile | phone | Measurable | **RUNTIME** — blocked |
| F5 | No ≥500ms hitch on wave escalate | — | Measurable | **RUNTIME** — spawn path allocates per-zombie Graphics; 14 max, unlikely to hitch; unproven |
| F6 | No unbounded leak over 3 restarts | — | Measurable | **STATIC-PASS (weak)** — `clearField` destroys all entity Graphics (`game.ts:263-276`); menu children destroyed (`game.ts:108-110`). RUNTIME heap check owed. |
| F7 | Pixi 8 + arcade-core only; no second renderer | stack lock | Measurable | **STATIC-PASS** — deps: pixi.js + @maga/arcade-core only (`apps/boxhead/package.json:12-19`); no Phaser/Unity anywhere in repo |

## G. Suite matrix (G3)

| Item | Spec source | Measurability | Verdict |
|------|-------------|---------------|---------|
| Browser matrix (Chrome/Firefox/phone/tablet) | checklist §G | Measurable | **RUNTIME** — all cells pending dev server; minimum G3 bar recorded in `runtime-verdicts/` plan |

---

## Unmeasurable / undefined items (flagged, NOT passed)

| ID | Why unmeasurable |
|----|------------------|
| B4 | "Chaotic arcade" density — no numeric threshold; ARCADE reference clip blocked (dossier §Capture plan) |
| B7 (cadence part) | "Feels progressive" — thresholds TBD ARCADE by design |
| B8 (feel part) | "Feel order" — only structural order checkable; grenade downgrade flagged separately |
| B13 (rule part) | "Agreed rule" — TBD ARCADE; stub allowed by checklist |
| B14 | Conditional on ARCADE confirmation that hasn't happened — correctly deferred |
| F3 | Budget assumes 50–100 movers; wave tables max 14 — the described scenario can't occur; either tables or budget must move before this is testable |
| A4/C1/C2/F1/F4/F5/F6 | Measurable in principle, blocked on runtime (not unmeasurable — listed here only for completeness of the blocked set) |

## Checklist coverage summary

- **45 checklist rows audited; every row mapped to ≥1 spec source or marked checklist-only.**
- Checklist-only items (no defining spec section): A3, C3, C5, D3, D4, E5 — all still measurable; noted so maga-docs can backfill spec references if desired.
- **Blocker-class static finding:** B3/B9 — solo/co-op death unreachable at baseline `1c45956`; **fixed by forge `fe3ae3e` mid-audit** (D-01). Runtime re-verified PASS at `2e74d55` (`runtime-verdicts/02`).
- **Fail-class static findings:** C1/C6 portrait crop (D-04) — **fixed in `2e74d55`, live-confirmed**; B8 grenade downgrade (D-03, minor — still open); **D-14 touch end-screen trap — still open at `2e74d55`** (runtime-verdicts/02).
- **Doc divergences:** stage 640×400 vs documented 640×480 (D-05); ticket header stale (D-06); `ammoPerShot` dead conditional (D-07, cosmetic).

## Post-`2e74d55` re-verification (2026-09-22, live)

Runtime probes ran against the committed build (`runtime-verdicts/02-boxhead-post-2e74d55.md`). Updated item states:

| ID | Prior static verdict | Live verdict at `2e74d55` |
|----|----------------------|---------------------------|
| A1 | SCHEDULE | **PASS** — :5173 → 200, canvas renders, zero console errors |
| A4 | RUNTIME | **PASS** — dead→Space→playing measured ~60ms (probe 1), re-confirmed |
| B3 | STATIC-FAIL (D-01) | **PASS** — waves 1→3→victory driven end-to-end; real kill path (score 0→300, streak ×3) |
| B5 | STATIC-PASS | **PASS (live)** — crate contact → ammo 2→18 |
| B6 | STATIC-PASS | **PASS (live)** — barrel blast killed adjacent zombie |
| B9 | STATIC-FAIL (D-01) | **PASS** — dead state, banner, restart all live |
| B10 | STATIC-PASS (structure) | **PASS (live)** — `maga:boxhead:highscore`="300" persisted across reload |
| B13 | STATIC-PASS (structure) | **PASS (live)** — full match to 5–0, stub banner, no crash |
| C1 | STATIC-FAIL (D-04) | **PARTIAL** — portrait crop fixed (`2e74d55`); **D-14 still open**: touch cannot restart from dead/victory screens |
| C6 | STATIC-FAIL (coupled) | **PARTIAL** — letterbox on rotate fine; D-14 blocks the end-screen half |
| D1 | STATIC-PASS | **PASS (live)** — centered canvas, uniform scale, no warp |
| D3 | STATIC-PASS (structure) | **PASS (live)** — resize sweep re-centers each time |
| F1 | RUNTIME | **PASS** — first paint immediate, no blank-white delay observed |
| F3 | RUNTIME | **PASS (partial)** — 60.3fps live wave; 50–100-mover scenario still unreachable (D-08) |
| F6 | STATIC-PASS (weak) | **PASS (live)** — heap 8→9→9MB across 3 restarts |
| G matrix | RUNTIME | **PARTIAL** — desktop Chromium column green; Firefox/phone/tablet cells open |
