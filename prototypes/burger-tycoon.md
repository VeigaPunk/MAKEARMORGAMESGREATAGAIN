# Prototype card — Burger Tycoon (mechanics proof)

**File:** `prototypes/burger-tycoon.html` — single file, zero deps, opens via `file://`.
**Spec:** `01-design-docs/02-concept-specs/03-mcdonalds-game.md` · **Dossier:** `05-dossiers/mcdonalds-game.md`
**Status:** verified in headless Chromium 2026-09-22 — full dirty→backlash→collapse chain exercised via real canvas clicks + pane hotkeys (no state injection). Sibling `maga-verify` independently PASSed boot/idle/click/pane-switch (`verification/proto-verdicts/burger-tycoon.md`).

## What the spec demands (cited)

- Core loop: "four simultaneous panes: Farmland → Feedlot/Slaughter → Restaurant → HQ… dirty options for short-term gains… raise backlash risk… fail when cash/reputation collapse" (spec §Core loop 1–5).
- Controls: "Mouse-primary: click panes, map tiles, action buttons. Keyboard: optional pane hotkeys 1–4" (spec §Controls; mobile mapping: "Tabbed panes… tabs switch Farm / Livestock / Restaurant / HQ").
- Acceptance: "All four panes reachable and affect shared economy within first 2 minutes" (#1); "at least one dirty action increases short-term profit and backlash risk" (#2); "forced failure path demonstrable" (#3); "sim keeps running when user idles" (#7); "no McDonald's trademarks" (#5) (spec §Acceptance).
- Renderer lock: Canvas2D + DOM chrome OK (spec §Meta; `03-stack-and-tickets/001-native-stack-and-plan.md`).

## What the prototype proves (all via real input events — canvas `click` hit-regions + `keydown` pane hotkeys)

| Mechanic | Evidence |
|---|---|
| 4 panes, one shared economy | Tabs/keys 1–4 switch FARMLAND/FEEDLOT/RESTAURANT/HQ; one state `S` feeds all — crops grown on Farm feed cattle, slaughter consumes herd→patties, Restaurant sells patties→cash, HQ reads the same meters. |
| Sim runs while idle | Unattended: cash $500→$515 in ~15s, board pressure 0→6, cattle consumed by feedlot (spec #7). |
| Dirty action ↑profit + ↑backlash | All 3 dirty toggles clicked: profit $5/s→$15.6/s immediately; backlash 0→100 over ~40s (spec #2). |
| Dirty→disease event | Cheap feed accumulated disease 0.6/s → at >20: "DISEASE OUTBREAK: herd culled, rep -12" logged at t=63s. |
| Backlash→reputation collapse | backlash>60 drained rep 1.5/s, >85 drained 3/s → rep 70→0 → `GAME OVER: REPUTATION COLLAPSE` at t=72s (spec #3, loop #5). |
| Forced failure demonstrable | Full causal chain observed end-to-end in one 72s run; `S.over=true` halts sim, overlay rendered. |
| Loss pressure | Overhead -$4/s always drains; board pressure rises on stalled profit, intervention at >100 costs -$60. |
| No McDonald's marks | "Burger Tycoon" branding only (spec #5). |

## What it deliberately omits (spec-deferred or out of core loop)

- **Numeric parity** — every constant is a declared guess; dossier marks thresholds, pane concurrency, win/lose formulas all TBD from ARCADE playtest.
- **Simultaneous 4-pane desktop layout** — spec §Core loop says "simultaneous panes" and feel target is "frantic multi-panel attention"; prototype serializes panes behind tabs (the spec's own *mobile* mapping). Mechanism proven; desktop layout is a monorepo decision.
- **Session pacing** — spec targets ~15–40min; all-dirty run collapses in ~72s. Constants need playtest tuning, not more mechanics.
- **Muzak/SFX, activist/media event variety** — only disease + backlash thresholds implemented.
- **Branded marks, exact Flash UI, deep save, multiplayer** — spec §Deferred.
- **One-handed portrait polish** — tabs exist and are large, but no portrait-specific layout pass.

## Recommended monorepo carry-forward (for `apps/burger-tycoon`, Canvas2D + arcade-core)

1. **Single economy state + per-pane action tables** — keep; one `S` object + `ACTIONS[pane]` made the causal chain trivially auditable.
2. **Rates-per-second tick decoupled from render** — keep; sim must run while idle (spec #7). Clamp `dt` (0.25s) against tab-switch jumps.
3. **Dirty actions as toggles: multiplier + backlash accrual + event risk** — keep mechanism (deforest→yield, cheapFeed→output+disease, cutCorners→margin); retune every constant from ARCADE playtest.
4. **Two fail conditions** (cash≤0, rep≤0) + backlash-threshold rep drain — keep; the "no clean win" satire lives in this coupling.
5. **Board pressure as stall detector** (rises when profit ≤ overhead, intervention costs cash) — keep; it is the "push throughput" pressure without a timer.
6. **Desktop: render panes simultaneously** — spec's feel target needs cross-pane visibility; tabs are the mobile mapping. Prototype proves the sim supports either presentation.
7. **Canvas hit-region registry works but DOM buttons are cheaper** — sibling verify noted actions aren't in the DOM; for a UI-heavy title, DOM buttons give a11y/focus for free. Either way, keep the label→fn table shape.
8. **Event system as accumulator+threshold** (disease 0.6/s → outbreak) — keep; extends to activist/media events.
9. **Verification pattern:** read-only `window.__proto` state hook + coordinate-click driver proves the full loop without mutating state — same standard as impossible-game.
