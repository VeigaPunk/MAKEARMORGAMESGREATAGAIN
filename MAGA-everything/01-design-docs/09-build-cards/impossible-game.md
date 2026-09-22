# BUILD CARD — The Impossible Game (Lite-faithful native replica)
**Slug:** `impossible-game` · **Priority:** 2 (FORGE STACK-LOCKED) · **Renderer:** Canvas2D · **App:** `02-code/armor-games/apps/impossible` (scaffolded — forge R01 amend `2e74d55`; mechanics proof `prototypes/impossible-game.html` verified `991c648`) · SPEC scope/feel/rights: §Meta (Fluke rights gate), §Feel targets, §Content scope—Playable v1 (IN)
**Card sources:** `02-concept-specs/02-impossible-game.md` (SPEC), `05-dossiers/impossible-game.md` (DOSSIER), `03-stack-and-tickets/001-native-stack-and-plan.md` (STACK), `04-research/deep-dive.md` §3 (RESEARCH)
**Build state:** scaffold + declared-guess playable slice landed (`src/main.ts` 274 ln: 120Hz fixed-step, LEVEL data, die/respawn/clear, `?debug` hook). Impossible-specific tickets still to mint — forge mints them from this card + SPEC. Every tunable is a declared guess pending ARCADE.

## 1. Core loop (SPEC §Core loop)
1. Select level — v1 = **Lite-faithful slice** (Fire Aura–like opener; geometry **TBD ARCADE** / Lite reference).
2. Cube auto-runs; **single input = jump**.
3. Memorize spikes/gaps/rhythm; death → **full restart** (normal mode).
4. Optional practice mode w/ checkpoint flags (include if cheap, else defer).
5. Clear → medal/clear fanfare → unlock next. **Shipped v1 slice:** banner + `pickup` sfx only — medal/unlock await ARCADE criteria (§9); PROOF must not audit for a medal that is deliberately absent.

## 2. Controls
### Desktop (SPEC §Controls)
- Jump: Space / Up / Z / Left click (support several).
- Restart: R after death or auto. Pause: Esc. **Shipped superset:** R restarts mid-run unconditionally; P is a second pause key (DD-71 — benign, noted so PROOF doesn't score a deviation).
### Mobile (SPEC §Controls — timing fidelity risk)
- **Tap jump (primary):** whole playfield or large lower button; **high risk** — touch latency + palm rejection can desync music-locked jumps. Mitigate: low-latency path, predictive audio sync, optional input-offset calibration.
- **Hold-to-buffer:** jump registers on press not release — default mobile.
- One-handed thumb zone bottom-center required.
- **PROOF scores desktop as canonical; mobile = playable best-effort** (SPEC callout).

## 3. Entities (SPEC §Notes for FORGE)
`Runner`, `Spike`, `Block`, `Gap`, `Checkpoint`, `LevelTrack`, `AudioSyncClock`.
Fixed timestep: **FORGE decided** — 1/120s accumulator (`main.ts` DT); declared-guess pending ARCADE timing validation. `AudioSyncClock` deferred (§7).

## 4. Progression
- v1: 1–2 levels, original-like spike/gap vocabulary (geometry TBD).
- Normal fail → full restart; death particles + instant restart.
- Medals: criteria **TBD ARCADE** (DOSSIER §Evidence gaps).
- Deferred: full five classic levels (Fire Aura, Original, Chaoz Fantasy, Heaven, Phazd — RESEARCH §3), level editor, sequel features.

## 5. Win/lose
- Win: clear level → medal/fanfare → next unlock.
- Lose: any obstacle hit → death → restart at level start (≤200ms respawn feel, SPEC hook 2).
- No lives/economy — pure skill loop.

## 6. Art direction (SPEC §Art needs)
- Flat colored cube; stark spikes/blocks; high-contrast BG per level.
- **Do NOT** Geometry-Dash-ify with icon kits; keep Impossible's stark readability.
- UI: restart prompt, optional progress bar.
- **Page chrome (shipped):** INTERNAL-NO-PUBLIC rights badge + mute button (`index.html`); badge height offsets the letterbox — PIXEL/PROOF must account for it. Stage 960×540 shipped, undocumented in spec (DD-39).

## 7. Audio recipes (SPEC §Audio needs — highest audio priority of all six)
- Level music **drives obstacle timing** — sync is load-bearing; licensed or original-inspired (no rips).
- Death click/crash; optional jump tick; clear jingle.
- `AudioSyncClock` entity exists precisely because music↔obstacle sync must survive tab backgrounding (SPEC hook 5). **Deferred in scaffold** — no licensed track exists (`main.ts:9`); hook 5 unassessable until a MAESTRO track lands (DD-41). Landing API exists: `Sfx.startMusic/stopMusic` (BH-3.2).
- No MAESTRO bible exists yet for this title — recipes must be authored (audio README schema, `06-audio/README.md`). Shipped audio contract today = 5 `Sfx.preset` names + note-array music slot (DD-09).

## 8. Acceptance criteria (SPEC §Acceptance hooks)
1. Desktop expert can clear level 1; jump latency within FORGE ms budget.
2. Death → respawn ≤200ms feel.
3. Obstacle hits consistent (no tunneling).
4. Mobile tap-on-press completes first 10s without dead zones.
5. Audio/obstacle sync holds after tab background resume (or documented reset). **Blocked:** unassessable until a track exists (DD-41).
6. English-only. 7. No softlock holding jump at spawn.

## 9. Open TBDs (SPEC §Open questions; DOSSIER §Evidence gaps)
**Still fully open:** medal criteria · track-to-obstacle sync map · input latency vs beat · Lite vs full Fire Aura geometry · death/restart frame counts · whether AG ever hosted Lite (unestablished) · Fluke license status · practice-mode placement (DD-44). **Declared in scaffold, awaiting ARCADE measurement:** hitbox 34px · jump buffer 100ms · coyote 60ms · respawn 160ms · proto-vocabulary geometry (`main.ts:12-20,28-48`). ⚠ coyote/buffer are added forgiveness mechanics — fidelity risk if Lite has neither (DD-45).

## 10. Out of scope (SPEC §Deferred)
Full five levels + all medals · level editor · practice checkpoints (if not v1) · sequel features · expanding Lite slice into "full game" while calling it Lite (SPEC §Notes for FORGE — explicit prohibition).

**Posture:** INTERNAL-NO-PUBLIC — localhost/internal OK; public ship needs written Fluke Games clearance (SPEC §Meta). **PROOF hook:** `?debug` → `window.__maga` (`src/main.ts:264-274`; DD-62); uncommitted tree adds a `__proto` getter object alongside it (verify D-22 probe hazard fix, DD-94). **Sibling:** `hardest/` (maga-hardest) owns the full World's Hardest Game build — `engine.js` pure-logic + `LEVEL-FORMAT.md` data-driven level contract (tile map + patrols; autopilot must clear ≤120s/400 deaths via `node hardest/validate.mjs`) + `levels/` corpus (30 files, committed `62ed5a7` — **30/30 PASS at r06**, DD-93; manifest/autopilot transients DD-91/DD-92 resolved — re-run the validator after any sibling edit); this spec is its input, read-only for forge. **Gates:** G0–G5 per STACK §3 apply to every title.

**r07 (verify verdict 12, uncommitted):** deep probe of committed app filed **D-33** (gaps non-lethal — 3 of 4 free passes) + **D-34** (block side-kill tests left edge, ~34px penetration) — both are the proto card's carry-forward item #4, and both are already fixed in the uncommitted forge tree (`solidSideAt(cube.x + CUBE,…)` + `floor === -Infinity` gap-kill; DD-96). **D-35** minor: sub-frame taps dropped. Proto claim card cross-verified: 8/10 claims CONFIRMED; full-clear + no-spawn-softlock unproven (autoplayer limiter — DD-97). Re-verify after forge commits the burn.

**r08:** D-33/D-34 in-tree fixes **live-verified by verify r04b `c6808ce`** — no-jump dies x=1410, block dies x=2967, exact proto parity; verdict 12 → PASS (DD-96). D-35 open; forge burn still uncommitted (DD-94). `hardest/` corpus now **32 levels committed** `fe83d90` — `LEVEL-FORMAT.md` documents `y`/`D` key-doors + `T` teleports + medals/tiers/audio (DD-98); `node hardest/validate.mjs` → 32/32 PASS.
