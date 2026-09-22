# r05 · BoxheadDMCrates — D-25 deathmatch ammo starvation, live verify

Lane: maga-verify r5 wave, leaf member (no subagents). Surface: `http://localhost:5173/?debug` (boxhead dev server), tab `BoxheadDMCrates`. Source read-only; zero edits; zero saves written (DM `dmEnd()` never calls `persistHigh`, and I exited to mode select at the end).

## Verdict

**PASS** — D-25 fix (DM ammo starvation deadlock) verified live on the current uncommitted bytes.

- Deathmatch run to completion: mutual damage, kill credit, respawn, and the **5-kill victory banner** all observed. Match ended **P2 5–3** (`state: 'victory'`, banner "P2 WINS THE DEATHMATCH 5–3").
- Ammo starvation reproduced: P1 hit `AMMO 0` twice (burned into empty space at t=82.1s and t=11.1s of run2), P2 hit dry mid-fight (t=479.3s).
- **Crates spawn in deathmatch**: first crate ~8s after run start (initial `crateTimer=8`), subsequent spawn exactly +12s (`crateTimer=12` reset), hard cap 2 on field — all three parameters confirmed against live state reads.
- **Pickups refill ammo**: pickup at dist<15 → `AMMO 0 → 16` (`CRATE_AMMO=16`), verified twice by state reads and once by screenshot pair (ammo-zero → pickup-refill).
- Match concludes **because of** the fix: a dry fighter fetched a crate mid-match and kept fighting (P2 dry at t=479.3 → refueled +16 at t=482.3 → scored the final kills). Without crates this match stalls per DD-77.

Fix proven is **uncommitted** working-tree state (`git status`: `M game.ts`; diff removes the `if (this.mode !== 'deathmatch')` gate around the crate spawner in `updateProps`, `game.ts:628-641`). Re-verify note for post-commit per DD-94: this live pass satisfies "re-probe" for D-25/DD-77 on tree bytes; the commit hash still needs to land.

## Evidence

All state values below are live `window.__maga` debug-hook reads (`?debug` → `{ game, input, touch }`, `apps/boxhead/src/main.ts:59-61`), cross-checked against HUD pixels in screenshots.

| # | Claim | Measured | Artifact |
|---|-------|----------|----------|
| 1 | DM starts, both spawn, `updateProps` runs in DM | state `playing`, mode `deathmatch`, P1 (320,200) / P2 (220,200), `crateTimer` 8→7.67 ticking with zero zombies (`spawnQueue=0`) | eval reads; `game.ts:366` `this.updateProps(dt)` is unconditional in `tickPlaying` |
| 2 | Ammo depletes | P1 `AMMO 0` after 67 trigger pulls (23 rounds; excess pulls eaten by 0.3s pistol cooldown), t=82.1s run1; again t=11.1s run2 (83 pulls) | driver log; `r05-BoxheadDMCrates-ammo-zero.png` (HUD "P1 HP 100 AMMO 0", 2 crates visible) |
| 3 | Crates spawn in DM, cadence 8s initial / 12s reset, max 2 | run2: crate #1 at t=9.3s (initial timer 8), crate #2 at t=23.2s (=#1+12.0s); `crates.length` never exceeded 2 across both runs | driver log timestamps |
| 4 | Pickup refills | `AMMO 0 → 16` at t=84.3s (run1) and in run2 fetch; screenshot pair | `r05-BoxheadDMCrates-ammo-zero.png` → `r05-BoxheadDMCrates-pickup-refill.png` (HUD "AMMO 16") |
| 5 | Dry-mid-fight recovery | P2 dry t=479.3 → crate fetched → `ammo=16` t=482.3 → fight resumed | driver log; `r05-BoxheadDMCrates-field-crates.png` |
| 6 | Mutual damage + kill credit + respawn | t=491.3 both hp hit 0 same instant, kills 0-0→1-1, both respawned at own spawn points with hp 100 / ammo 24 | driver log; final scoreline P1 3 · P2 5 implies 8 kill events processed |
| 7 | Match concludes (B13 "match ends on agreed rule") | `state='victory'`, banner "P2 WINS THE DEATHMATCH 5–3 (scoring rule is a STUB — TBD ARCADE)", target `DM_TARGET_KILLS=5` reached | `r05-BoxheadDMCrates-dm-end.png` |
| 8 | Crates visually present in DM field with HUD | two yellow crates + barrels + DM HUD | `r05-BoxheadDMCrates-field-crates.png` |

Screenshots (all `verification/evidence/`): `r05-BoxheadDMCrates-ammo-zero.png`, `r05-BoxheadDMCrates-pickup-refill.png`, `r05-BoxheadDMCrates-field-crates.png`, `r05-BoxheadDMCrates-dm-end.png`.

Static anchor (uncommitted diff, `MAGA-everything/02-code/armor-games/apps/boxhead/src/game.ts`):
- `updateProps()` old: `// ammo crate spawner (solo + co-op only)` + `if (this.mode !== 'deathmatch') { … }` gate.
- new: gate removed; comment cites DD-77/DD-18 pending ARCADE ruling; `crateTimer=12` reset, `crates.length < 2` cap, `ammo += CRATE_AMMO` (+16) pickup at dist<15.
- `tickPlaying()` calls `updateProps(dt)` unconditionally (`:366`); DM skips only `updateSpawning/updateZombies` (`:361-364`).

## Divergence entry (per assignment — NOT a defect)

### DM pickups — spec vs code direction (corrects the brief's premise)

**The brief said "spec 01-boxhead.md says no DM pickups". The spec text on disk says the opposite.**

- **Source A (docs):** `MAGA-everything/01-design-docs/02-concept-specs/01-boxhead.md` §Core loop step 7 (line 30): "Optional deathmatch — Same arenas, players vs each other **with pickups**; scoring rules TBD from ARCADE playtest." Same file §Content scope IN: "Pickups: ammo crates; explosive barrels" (mode-unqualified); acceptance hook 4: "Ammo crate pickup restores shooting when dry" (mode-unqualified). Mirror copy: `02-code/armor-games/docs/from-forge/01-boxhead.md:30`.
- **Source B (code + crosswalk):** uncommitted `game.ts` `updateProps()` — DM gate removed, comment "DD-77 / DD-18: spec has no DM pickups; crates are enabled here as the deadlock fix pending ARCADE ruling"; divergence-log entries `DD-18` ("SPEC core loop puts pickups in PvP" — code shipped none), `DD-77` (deadlock, fix = DM crates), `DD-103` ("DM crate enable flips DD-18's recorded divergence direction (spec says no DM pickups; code now ships them)").

**Entry:** the crate enable is a deliberate, commented divergence **of code from the pre-fix code's own behavior**, but relative to the *spec* it is a move **into** compliance: spec step 7 grants DM pickups, so the old gated code was the divergent side (exactly what DD-18 recorded). The divergence did not "invert" as DD-103's title claims — **DD-103 misstates the spec**: no line of `01-boxhead.md` says DM has no pickups. Both directions remain on record in the log; the gap that actually stays open for ARCADE is the *scoring rule* (still a stub) and historical fidelity of DM pickups in the 2007 original — not spec compliance of crates. Consumers should treat the DM-crate enable as spec-aligned and provisional only in the DD-94 uncommitted sense. Recorded here as divergence bookkeeping per lane assignment; the DD-103 wording error itself is filed as finding D-42 below.

## Defects (new findings)

- **D-41 (minor, behavior)** — `crateTimer` runs **unclamped negative** while the field is full (`game.ts:633-635`: decrement has no floor, spawn branch requires `crates.length < 2`). Observed live: `crateTimer = -36.5` with 2 crates on field. Consequence: after a pickup, the next crate spawns **instantly** (timer already ≤0) instead of 12s later — cadence is 12s only when the field has an open slot, and 0s after any pickup that follows a saturated period. This *amplifies* the D-25 fix (faster relief, never harmful to playability) but makes crate cadence inconsistent and would break any future tuning that assumes 12s spacing. Suggestion: clamp (`this.crateTimer = Math.max(this.crateTimer, 0)` — or reset to 12 when the spawn is skipped due to cap). Evidence: state read at driver-arm, run1 t=73.2 log line.
- **D-42 (docs, not code)** — `DD-103` (divergence-log, `01-design-docs/11-divergence/divergence-log.md:580-584`) titles the DM-crate change "spec says no DM pickups; code now ships them" and assesses "code now diverges from spec by adding content the spec doesn't describe". Both claims contradict the spec text the same entry cites (step 7: "with pickups"). DD-18's title/assessment got the direction right. Suggestion: rewrite DD-103's title/assessment to "DD-18 closes in the spec's direction; crates move code INTO spec compliance; ARCADE ruling still owed on scoring stub + historical fidelity", and fix the propagated wording in `OPEN-ITEMS.md` row 12 ("Spec says none") and `09-build-cards/boxhead.md` r08 note ("spec says no DM pickups") — those two inherit the same inversion.

## Notes

- Pre-fix starvation math still holds per life (24 rounds ÷ 10 hp/hit ÷ 100 hp = 2.4 kills/life, no kills from AoE); the fix works by adding a renewable source, not by touching combat tables. Respawn refill to 24 (`game.ts:429`) remains the other replenishment path.
- Anti-starvation is now triple-redundant in DM: crate pickups (+16), respawn refill (24), and the new Esc/P pause → M exit (`'paused'` state, verified en route: Esc → `paused`, KeyM → `mode`) — a stuck DM has two clean escape hatches even without crates.
- Verification driver caveat (not a game defect): my first two driver revisions lost ~90 rounds to a formation bug (players facing away from each other after crate-fetch shuffles); the stall was mine. Any sibling lane seeing idle DM ammo burn with hp 100-100 on :5173 around this window: that was my driver, ignore it.
- Tab crosswire contamination per wave discipline: my kernel tab handle was once re-bound to a sibling `:5175` (BurgerGrid) tab mid-session; recovered via my own named tab `BoxheadDMCrates` (never touched another lane's name). A stray Space press from BoxheadStress' crosswired probe may have landed on a :5173 tab in this window; all my evidence is internally consistent (state reads ↔ screenshots ↔ driver log), so none of my claims depend on the affected interval. No boxhead persistent state was written by this lane.
- Fix ships uncommitted (per DD-94 r09: burn still uncommitted). This verdict covers tree bytes at `/home/vgpnk/Projects/MAKEARMORGAMESGREATAGAIN/MAGA-everything/02-code/armor-games/apps/boxhead/src/game.ts`; re-anchor on commit.
