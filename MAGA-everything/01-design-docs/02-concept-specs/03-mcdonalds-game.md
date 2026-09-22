# Burger Tycoon / The McDonald's Game — Native Replica Concept Spec

## Meta

| Field | Value |
|-------|-------|
| **Slug** | `mcdonalds-game` |
| **Internal working title** | **Burger Tycoon** (preferred in docs/UI for INTERNAL builds to reduce trademark surface) |
| **João / public-facing name note** | João named **The McDonald's Game** — dual-name in meta; branded marks only if cleared. Authenticity reference = Molleindustria *The McDonald's Videogame* (~2006); ship twin = Burger Tycoon systems. |
| **Target version for feel** | Burger Tycoon mechanics twin of 2005/6 Flash satire; 2019 HTML5 rehost as secondary reference only |
| **Status** | concept |
| **Rights** | **INTERNAL-NO-PUBLIC** — localhost OK; confirm Molleindustria CC deed before any redistribute; McDonald's Corp. marks = trademark risk — prefer Burger Tycoon branding internally. |
| **Ship path** | Native from-scratch multi-pane sim (**Canvas2D** + DOM chrome OK). **Not** Ruffle as ship vehicle. |
| **Renderer (locked)** | **Canvas2D** (+ optional DOM chrome for panels) |
| **Stack lock** | `/workspace/armor-games-research/specs/001-native-stack-and-plan.md` |
| **Language** | English only |
| **Priority** | **3** (FORGE STACK-LOCKED — cite `/workspace/armor-games-research/specs/001-native-stack-and-plan.md`) |
| **Idea** | 001 — Make Armor Games Great Again (post-pivot) |

## Core loop

1. Run four simultaneous panes: **Farmland → Feedlot/Slaughter → Restaurant → HQ**.
2. Push throughput (crops/cattle/burgers/marketing) under board profit pressure.
3. Use “dirty” options for short-term gains (deforest, bad feed, PR/bribes analogues scrubbed of McD marks) that raise backlash risk.
4. Balance survival vs ethics; system teaches unsustainability — no clean win.
5. Fail when cash/reputation collapse; restart run.

Session: ~15–40 minutes.

## Feel targets

- Deadpan corporate UI parody; frantic multi-panel attention (not twitch combat).
- Humor is **structural** (harm required to hit targets), not joke spam.
- Constant soft panic: something always needs a click in another pane.
- Flat illustration era look.

## Controls

### Desktop (keyboard/mouse)

- **Mouse-primary:** click panes, map tiles, action buttons.
- Keyboard: optional pane hotkeys 1–4 — **TBD from ARCADE playtest**.
- No combat keys.

### Mobile (touch mapping)

| Layout | Mapping |
|--------|---------|
| **Tabbed panes + map** | Top/side tabs switch Farm / Livestock / Restaurant / HQ; main area is tappable map/buttons. |
| **One-handed** | Thumb reaches tabs along bottom; large action buttons; avoid tiny Flash-era hit targets — enlarge for touch **without** changing sim rules. |
| **Two-handed tablet** | Left pane list, right detail map. |

Must remain playable one-handed in portrait with tab switcher.

## Content scope — Playable v1 (IN)

- Four panes with core dirty-option set (Burger Tycoon–safe naming).
- Board pressure + backlash meters (numeric thresholds **TBD from ARCADE playtest**).
- Fail/restart; English UI using **Burger Tycoon** branding.
- Desktop mouse + mobile tabs.

## Content scope — Deferred

- Branded McDonald's marks / Ronald analogues.
- Exact Flash pixel UI clone.
- Deep save campaigns / meta unlocks.
- Multiplayer.

## Art needs (for PIXEL)

- Flat 2D illustration; multi-panel corporate parody UI.
- Prefer bears/generic execs over McD clowns (Burger Tycoon path).
- Icons for dirty actions, meters, maps.
- **Do not** modernize into glossy mobile-tycoon UI that hides satire.

## Audio needs (for MAESTRO)

- Soft corporate Muzak bed (original-inspired).
- Click UI; alarm when backlash rises; fail sting.
- Low SFX count OK — prioritise UI clarity.

## Acceptance hooks (for PROOF)

1. All four panes reachable and affect shared economy within first 2 minutes.
2. At least one dirty action increases short-term profit and backlash risk.
3. Forced failure path demonstrable (run out of cash/reputation).
4. Mobile: complete 5 minutes one-handed via tabs.
5. No McDonald's trademarks in INTERNAL Burger Tycoon build.
6. English-only.
7. Sim keeps running when user idles (pressure continues).

## Open questions / ARCADE gaps

- Exact numeric thresholds (activist/media/disease triggers, board curves).
- Pane concurrency model details.
- Win/lose formulas.
- Branded vs Burger Tycoon systems diff.
- CC deed exact variant.

**TBD from ARCADE playtest** for economics numbers.

## Notes for FORGE

**Stack (FORGE STACK-LOCKED — cite `/workspace/armor-games-research/specs/001-native-stack-and-plan.md`):**
- App: `armor-games/apps/burger-tycoon` — **Canvas2D** (+ DOM chrome OK for panels) + TypeScript + Vite + `arcade-core`.
- Slot #3: systems/UI without twitch; friendlier legal path than branded McD marks.
- Prior EMULATE brief superseded.


- Entities: `Pane`, `ResourcePool`, `DirtyAction`, `BacklashSystem`, `BoardPressure`, `MapTile`.
- Lightweight; UI-heavy not particle-heavy.
- **No stack prescription.**
