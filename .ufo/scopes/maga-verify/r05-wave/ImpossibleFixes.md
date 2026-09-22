# ImpossibleFixes — r05 verification (D-33/34 re-verify + new features)

Lane: ImpossibleFixes (scout, leaf — no subagents) · Server :5174 · Source read-only `MAGA-everything/02-code/armor-games/apps/impossible/src/main.ts` (289 lines, uncommitted forge bytes; served bytes == working tree, verified via `curl /src/main.ts`).

## Verdict: **PASS**

D-33 and D-34 both verified fixed on current bytes at exact proto parity. Both new r5 features (best-progress persistence, `window.__proto` hook) work. 1 process defect filed (D-41), 2 notes.

## Evidence

### D-33 — gaps lethal (gap-bottom kill) — PASS
- Served bytes line 196: `if (floor === -Infinity && cube.y + CUBE > GROUND_Y + 8) return die();` (curl of `http://localhost:5174/src/main.ts`, matches tree main.ts:188).
- Live: **27/27 consecutive no-jump deaths at exactly x=1410, y=404.1, grounded=false** (observer sampled every state/attempt transition from page load; attempts 1–27, zero variance). Physics-exact: foot enters gap@1400 (footX = x+17 > 1400 → x=1383), falls 8.1px in ~79ms at GRAV 2600 → 1410. Proto parity (r4 baseline x=1410).
- Frame capture: `verification/evidence/r05-ImpossibleFixes-gap-death-x1410.png` — DEAD banner, HUD `ATTEMPT 1 / DEATHS 1 / 14%`, cube at gap left lip (screen x≈220-250 = world 1410 after camX=1190 offset), gap rendered 210–340 screen px.

### D-34 — block side-kill on front edge — PASS
- Served bytes line 195: `solidSideAt(cube.x + CUBE, cube.y)` (front edge; pre-fix tested left edge → death x=3003, ~94ms late).
- Live (twice, independent runs): `__maga.teleport(2700)` → death at **exactly x=2967, y=396 (ground level), grounded=true** — front edge 2967+34=3001 crosses block@3000 the same step. Proto parity (r4: x=2967). Attempt 108 and attempt 33 runs identical.
- Frame capture: `verification/evidence/r05-ImpossibleFixes-block-death-x2967.png`.

### New feature 1 — best-progress persistence — PASS (both trigger paths)
- Source: `main.ts:105` `best = load('impossible','best-progress',0)`; `main.ts:149-150` die-path save; `main.ts:192` clear-path save; arcade-core `storage.ts:6-11` → key `maga:impossible:best-progress`, JSON-encoded.
- Die path: clean-key boot → natural gap death → LS = `0.14242424242424243` (=1410/9900) → **page reload → `__proto.best` = 0.14242424242424243**. Full write+read cycle verified.
- Clear path: teleport(9850) → state=clear → LS = `"1"` (JSON of `best=1`, clear-path fingerprint) — observed on two independent tabs.
- Teleport-death path also persists: block death wrote best=0.2996969696969697 (=2967/9900), LS matched.

### New feature — `window.__proto` debug hook (?debug) — PASS (getters)
All required getters read live and cross-checked against physics/geometry:
`state` ("running"/"dead"/"clear") · `x` (609 mid-run; 1410/2967 at deaths) · `y` (396 ground = GROUND_Y−CUBE; 250.8 mid-jump) · `attempt` · `deaths` · `grounded` (true↔false through jump) · `progress` (0.061515 = 609/9900 exact) · `paused` (false→true→false via synthetic KeyP keydown/keyup) · `best` · `LEVEL_END` (9900) · bonus `camX` (389 = x−220 ✓) · `LEVEL` (22 entries = source).
- Jump kinematics (via `__maga.jump`): 70-frame sample, minY 250.8 vs predicted apex 247.1 (JUMP_V²/2GRAV = 880²/5200), airborne then landed y=396.

### Artifacts
- `verification/evidence/r05-ImpossibleFixes-gap-death-x1410.png` (960×540, death frame, HUD 14%)
- `verification/evidence/r05-ImpossibleFixes-block-death-x2967.png` (death frame at block)
- `verification/evidence/r05-ImpossibleFixes-level-clear-banner.png` (clear banner + best display)

## Defects
- **D-41 (proposal, process/tooling — not app code): shared-origin localStorage + global browser tab-name registry = cross-lane save corruption.** ImpossibleClear's probe wrote `best-progress = 1.0001010101010102` (>100%, a teleport+`die()` artifact) into the shared `maga:impossible:best-progress` key; my r05c boot loaded it (best getter 1.0001 while deaths=0). Any lane driving :5174 rewrites every other lane's persistence evidence. Suggest: verify waves use per-lane storage keys (`?debug=laneName` → suffixed persist namespace) or per-lane browser profiles. Disclosed to HardestBoot (my one handle-cross was read-only) and ImpossibleClear (who confirmed and stood down).
- **Note:** `__proto` hook is getters-only; all actions (`teleport`/`jump`/`reset`/`die`) live only on legacy `window.__maga`. Either mirror actions onto `__proto` or document the split — the r05 wave spec assumed teleport on `__proto`.
- **Note (cosmetic):** `die()` persists `cube.x/LEVEL_END` unclamped — debug-hook `die()` after teleport past LEVEL_END writes best >1 (observed 1.0001). Unreachable in gameplay (clear fires at ≥9900 first); harmless but ugly in saved data.
- D-35 (sub-frame taps) not re-probed (out of my step list) — source still shows per-frame press-edge poll (`pollInput`).

## Notes
- Wave hygiene: tab-handle crossing hit this lane 3× (once read-only against `HardestBoot`'s tab, disclosed; twice stale-handle reads). Per new wave discipline all critical measurements were re-taken on freshly-opened suffixed tabs with in-page lane markers (`ImpossibleFixes-r05c-kww7c` read back through the same handle) — the headline numbers above are from clean-handle runs.
- `maga:impossible:best-progress` restored to its pre-run value `1.0001010101010102` (ImpossibleClear's artifact — no pristine value existed; key was already polluted before my first write).
- All three of my tabs closed; no dev servers touched; source tree untouched (read-only).
