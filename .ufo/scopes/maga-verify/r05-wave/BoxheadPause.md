# r05 · BoxheadPause — D-26 pause fix verification (boxhead, :5173)

Lane: BoxheadPause (leaf, no subagents) · 2026-09-22 · Server http://localhost:5173 · Source read-only.
Source under test: `MAGA-everything/02-code/armor-games/apps/boxhead/src/game.ts` (state `'paused'` added ~L307; uncommitted forge work verified as-found).

## Verdict

**PASS** — D-26 core fix verified live end-to-end. Two minor new defects found (D-41 banner overstates ENTER; D-42 world bleed-through on mode select), neither blocking the fix.

## Evidence

Static (read-only source):
- `game.ts:29` — `'paused'` added to `GameState` union.
- `game.ts:307-317` — pause branch: `playing`+`wasPressed('pause')` → `paused` + banner `'PAUSED\nESC / P — resume · M / ENTER — menu'`; `paused`+`pause` → `playing` + banner cleared; `paused`+`action`/tap → `showModeSelect()`.
- `arcade-core/src/input.ts:30` — `Escape: 'pause', KeyP: 'pause'`; `:28` — `KeyE/KeyK/KeyM: 'action'`; `:27` — `Enter: 'fire'`.
- `game.ts:351-352` — `input.endFrame()` every tick (pressed-set is single-frame).
- `game.ts:355` + `302-348` — `tickPlaying` only reachable via `case 'playing'`; paused state ticks nothing (world frozen by construction).
- `game.ts:494-506` — `waveBreak` accumulates only inside `updateSpawning`, which only runs from `tickPlaying`.

Live (http://localhost:5173/?debug, `__maga` hook, synthetic KeyboardEvents through the real Input pipeline):

| # | Scenario | Result | Measured |
|---|----------|--------|----------|
| 1 | Escape mid-run (solo, OPEN YARD, wave 1, 2 zombies) | PASS | state `playing`→`paused`; banner exactly `PAUSED\nESC / P — resume · M / ENTER — menu` |
| 2 | Freeze while paused | PASS | zombie[0] (457.44, 74.38), zombie[1] (276.05, 348.66), player (320,200) — **identical to 2 decimal places across 2.0s** (5×500ms samples + 2s A/B); `waveBreak` 0→0 |
| 3 | Screenshots 01 vs 02 (2s apart, paused) | PASS | pixel-identical 35,833 bytes each; PAUSED banner rendered center-stage |
| 4 | Escape again → resume | PASS | state→`playing`, banner `''`; zombie[0] moved (450.75,80.49)→(420.64,108.02) over 1.2s; 3rd zombie spawned (spawning resumed) |
| 5 | Pause again → M → mode select | PASS | state→`mode`, banner `''` (clean repro on fresh page load) |
| 6 | P key | PASS | `KeyP` paused (`paused` + full banner) and resumed; same binding path as Escape (`input.ts:30`) |
| 7 | Pause during waveBreak | PASS | field cleared (game's own `z.destroy()` + `spawnQueue=0`), `waveBreak=0.433` climbing → Escape → `paused`; **waveBreak frozen**: 0.433→0.433 over 1.2s; resume → 0.717 climbing → nextWave fired (wave 1→2 observed later in sequence) |
| 8 | Escape/P during `dead` | PASS (no pause) | state stayed `dead`, banner `OVERRUN ON WAVE 2 (OPEN YARD)` unchanged after Escape and after P |
| 9 | Escape/P during `victory` | PASS (no pause) | **forced-state probe** (`g.state='victory'` — victory unreachable in-lane within wave budget); Escape and P left state `victory`, banner unchanged. Input-gating only; banner rendering not exercised |
| 10 | Escape on `mode` screen | PASS (no-op) | state stayed `mode` |
| 11 | ENTER while paused | **FAIL** | pressed Enter twice in paused state (two independent runs): state stayed `paused`, banner unchanged. Banner advertises `M / ENTER — menu` but Enter is bound to `'fire'` (`input.ts:27`) and the paused branch handles only `pause`/`action` (`game.ts:310-316`) → **D-41** |
| 12 | M while paused → menu | PASS | state→`mode`, banner `''`, HUD hidden |

Screenshots (verification/evidence/):
- `r05-BoxheadPause-01-paused-esc.png` — PAUSED banner exact text, mid-run field frozen
- `r05-BoxheadPause-02-paused-2s-later.png` — pixel-identical 2s later (freeze proof)
- `r05-BoxheadPause-03-mode-after-M.png` — SELECT MODE after M-from-pause; frozen world visible behind menu (D-42 evidence)
- `r05-BoxheadPause-04-dead-esc-ignored.png` — dead screen; Escape ignored (gating proof)

## Defects

- **D-41 (minor, new)** — Pause banner overstates bindings: `PAUSED\nESC / P — resume · M / ENTER — menu` (`game.ts:309`) promises ENTER→menu, but Enter maps to `'fire'` (`arcade-core/src/input.ts:27`) and the paused branch handles only `'pause'` and `'action'` (`game.ts:310-316`). Live-verified twice: Enter while paused does nothing. Suggest: either handle `'fire'`→menu in paused state or retext banner to `M — menu` (M verified working; tap-quit path exists in code but see Notes).
- **D-42 (minor/cosmetic, pre-existing, adjacent to D-18)** — `showModeSelect()` (`game.ts:160-165`) clears banner + HUD but never hides the world (`showTitle()` does, `game.ts:150`). After pause→M (and equally dead/victory→M), the frozen field — zombies, crates, player sprite — renders behind the SELECT MODE menu text with no backdrop (screenshot 03). Reachable via the new D-26 pause→M path; fix is one line (`this.world.visible = false` in `showModeSelect`, mirror of `:150`), noting `startRun` already restores visibility (`:193`).

## Notes

- **Not yet built ≠ built wrong:** none observed — all scheduled D-26 behaviors are present in the uncommitted bytes.
- **Victory-screen test was a forced-state probe** (`g.state='victory'` set via debug hook; victory needs 3 full waves). It verifies input gating only (`Escape`/`P` unhandled in that branch), not the victory flow itself. Dead-screen test used the game's own loss path (`slots[0].alive=false` → `gameOver()` at `game.ts:372-373`).
- **Tap-to-quit while paused inconclusive:** code comment says "tapping the banner quits" (`game.ts:315`) but implementation quits on ANY `pointer.tapped`; my synthetic canvas tap did not trigger it in one contaminated attempt (see contamination). Unverified — flagged, not filed.
- **Wave discipline / contamination:** the global tab-name registry crosswired my handles 3× (resolved onto HardestBoot's and SasD31's tabs; one goto bounced with "Tab HardestBoot is busy" — no navigation landed). All verdict-relevant numbers above come from clean sequences on my own tabs (`BoxheadPauseR5x9`, `BoxheadPause-r5b`, `BoxheadPause-r5c`); forced-state probes were re-done after a full page reload to shed stale banner/field. One anomaly (Enter-on-room-select failing to start a run, once) coincided with BoxheadStress's admitted Space-press crossfire on sibling :5173 tabs — not filed as a defect. Boxhead `BEST 4200` highscore is shared localStorage across all :5173 lanes.
- Music: no audio assertions made (headless tab).
