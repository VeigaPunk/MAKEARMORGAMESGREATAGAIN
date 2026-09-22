# BUILD CARD — Burger Tycoon (McDonald's Game twin)
**Slug:** `mcdonalds-game` · **Priority:** 3 (FORGE STACK-LOCKED) · **Renderer:** Canvas2D (+ DOM chrome OK) · **App:** `02-code/armor-games/apps/burger-tycoon` (scaffolded — forge R03 `f8449eb`; ⚠ slug ≠ app dir, DD-32) · SPEC feel: §Feel targets
**Card sources:** `02-concept-specs/03-mcdonalds-game.md` (SPEC), `05-dossiers/mcdonalds-game.md` (DOSSIER), `03-stack-and-tickets/001-native-stack-and-plan.md` (STACK), `04-research/deep-dive.md` §2 (RESEARCH)
**Build state:** sim port + DOM chrome landed (`src/main.ts` 219 ln + `src/sim.ts` 158 ln, `f8449eb`); INTERNAL badge ships. Burger-tycoon tickets still to mint. Mechanics proof `prototypes/burger-tycoon.html` verified (dirty→backlash→rep collapse @72s, `3a8fa4f`).
**Branding rule:** ship twin = **Burger Tycoon** (marks scrubbed); McDonald's-branded original is authenticity reference only (SPEC §Meta; DOSSIER §Target versions).

## 1. Core loop (SPEC §Core loop)
1. Run **four simultaneous panes**: Farmland → Feedlot/Slaughter → Restaurant → HQ.
2. Push throughput (crops/cattle/burgers/marketing) under board profit pressure.
3. Use **"dirty" options** for short-term gains (deforest, bad feed, PR/bribes analogues — scrubbed of McD marks) that raise backlash risk.
4. Balance survival vs ethics — system teaches unsustainability; **no clean win**.
5. Fail on cash/reputation collapse → restart.

Session: **~15–40 min** (SPEC §Core loop; DOSSIER §Controls).

## 2. Controls
### Desktop (SPEC §Controls)
- **Mouse-primary:** click panes, map tiles, action buttons.
- Optional pane hotkeys 1–4 (**TBD ARCADE**). No combat keys. ⚠ `Input.attach` preventDefaults bound keys at window level — DOM panels/text entry get hijacked (DD-37); gate or attach to canvas before hotkeys land.
### Mobile (SPEC §Controls)
- **Tabbed panes + map:** top/side tabs switch Farm/Livestock/Restaurant/HQ; tappable map/buttons.
- One-handed portrait: bottom tabs, large action buttons — enlarge Flash-era hit targets **without** changing sim rules.
- Two-handed tablet: left pane list, right detail map.

## 3. Entities (SPEC §Notes for FORGE)
`Pane`, `ResourcePool`, `DirtyAction`, `BacklashSystem`, `BoardPressure`, `MapTile`.
UI-heavy, not particle-heavy; lightweight.

## 4. Progression
- Board pressure + backlash meters — numeric thresholds **TBD ARCADE** (SPEC §Content scope).
- Dirty-option set with Burger Tycoon–safe naming (v1 IN).
- No meta unlocks/campaign saves in v1 (deferred).
- Sim keeps running when user idles — pressure continues (SPEC hook 7).

## 5. Win/lose
- **No clean win** — the satire is that sustainability is impossible (SPEC §Core loop; RESEARCH §2).
- Lose: cash or reputation collapse → run end → restart.
- Forced-failure path must be demonstrable (SPEC hook 3).

## 6. Art direction (SPEC §Art needs)
- Flat 2D illustration; multi-panel corporate parody UI.
- Prefer bears/generic execs over McD clowns (Burger Tycoon path).
- Icons for dirty actions, meters, maps.
- **Do not** modernize into glossy mobile-tycoon UI that hides the satire.

## 7. Audio recipes (SPEC §Audio needs)
- Soft corporate Muzak bed (original-inspired).
- Click UI; alarm on backlash rise; fail sting.
- Low SFX count OK — prioritize UI clarity.
- No MAESTRO bible yet — author per `06-audio/README.md` schema. Shipped audio contract today = 5 `Sfx.preset` names + note-array music slot (DD-09).

## 8. Acceptance criteria (SPEC §Acceptance hooks)
1. All four panes reachable + affect shared economy within first 2 min.
2. ≥1 dirty action increases short-term profit AND backlash risk.
3. Forced failure demonstrable (cash/reputation collapse).
4. Mobile: 5 min one-handed via tabs.
5. **No McDonald's trademarks** in INTERNAL Burger Tycoon build.
6. English-only. 7. Sim continues while user idles.

## 9. Open TBDs (SPEC §Open questions; DOSSIER §Evidence gaps)
Exact numeric thresholds (activist/media/disease triggers, board curves) · pane concurrency model · win/lose formulas · branded-vs-Burger-Tycoon systems diff · exact CC deed variant (critical before any redistribute — DOSSIER) · keyboard shortcuts · music/SFX identity.

## 10. Out of scope (SPEC §Deferred)
Branded McDonald's marks / Ronald analogues · exact Flash pixel UI clone · deep save campaigns / meta unlocks · multiplayer.

**Posture:** INTERNAL-NO-PUBLIC — localhost/internal OK; public ship needs Molleindustria CC deed verification + marks review (SPEC §Meta; shipped badge `index.html:32`). **r04 live (verify):** all 5 probed acceptance items PASS — 4 panes + shared economy, dirty→backlash, full collapse chain to `GAME OVER: REPUTATION COLLAPSE` at t=135s (proto collapsed at 72s — pacing divergence, DD-86), no McDonald's marks, sim idles forward; `?debug`→`window.__maga` hook present. **r06 WIP (uncommitted, DD-94):** ≥900px viewports render a 4-pane grid (all panes + actions visible at once); <900px keeps single-pane + keys 1-4. **DOM-chrome seam:** DOM owns panels/buttons (a11y, ≥44px targets); canvas owns the sim view (proto verdict). **Gates:** G0–G5 per STACK §3.

**r08 (uncommitted, DD-94):** burger WIP grew — `main.ts`+`sim.ts` add a 4-pane grid view (all panes + actions + meters visible at once on wide viewports) and event-log dedupe by string compare. Feature work, not defect-driven; verify's 5/5 PASS (verdict 09) predates it — re-probe pane interactions after commit.

**r09:** burn still uncommitted (same 11 files, DD-94) — 4-pane grid + event-log dedupe still in-tree only; re-probe pane interactions after commit. `prototypes/MECHANICS-DIGEST.md` §5 records the proven dirty-toggle mechanism (multiplier + backlash accrual + event risk; two fail conditions + stall detector) — the satire coupling the app must preserve.

**r12:** burn **committed `69f9b24`** — 4-pane grid (≥900px) + event-log dedupe + **`icons.ts` (175-line authored icon set)** + `drawIcon`/`drawWordmark` wired into pane rendering. Committed-but-unverified — verify's 5/5 PASS (verdict 09) predates the grid; re-probe pane interactions post-commit (DD-111). Proto digest §5 dirty-toggle mechanism remains the satire coupling to preserve.
