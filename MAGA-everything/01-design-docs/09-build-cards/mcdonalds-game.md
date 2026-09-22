# BUILD CARD — Burger Tycoon (McDonald's Game twin)
**Slug:** `mcdonalds-game` · **Priority:** 3 (FORGE STACK-LOCKED) · **Renderer:** Canvas2D (+ DOM chrome OK) · **App:** `02-code/armor-games/apps/burger-tycoon` (not yet scaffolded)
**Card sources:** `02-concept-specs/03-mcdonalds-game.md` (SPEC), `05-dossiers/mcdonalds-game.md` (DOSSIER), `03-stack-and-tickets/001-native-stack-and-plan.md` (STACK), `04-research/deep-dive.md` §2 (RESEARCH)
**Build state:** not started. No tickets exist yet.
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
- Optional pane hotkeys 1–4 (**TBD ARCADE**). No combat keys.
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
- No MAESTRO bible yet — author per `06-audio/README.md` schema.

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
