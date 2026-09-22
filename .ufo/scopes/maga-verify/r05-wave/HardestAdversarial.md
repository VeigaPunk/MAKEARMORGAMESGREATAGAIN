## Verdict (PARTIAL)

## Evidence
- **Corrupt save crash reproduced (high confidence):** Set `localStorage['hardest.save.v1']` to `{"unlocked":1,"best":{"1":{"deaths":"x","time":"bad"}},"deaths":0,"mute":false}` and reload `hardest/index.html`. Browser emitted repeated `Uncaught TypeError: b.time.toFixed is not a function` at `hardest/game.js:296:44`; menu render loop remained erroring. Screenshot: `verification/evidence/r05-HardestAdversarial-corrupt-save.png`.
- **Pause freeze/restart smoke:** Started level 1 through `__hardest.start(0)`, drove for 700 ms, pressed Escape, waited 500 ms. State time stayed exactly `0.6999999999999987`, status `play`, deaths `0`; R from pause produced fresh play state with time `0`, deaths `0`. Screenshot: `verification/evidence/r05-HardestAdversarial-pause-restart.png`.
- Initial/start surfaces captured: `verification/evidence/r05-HardestAdversarial-initial.png`, `verification/evidence/r05-HardestAdversarial-start.png`.
- Static medal mapping is explicit at `hardest/game.js:39`: 0 gold, 1–2 silver, 3+ bronze. Runtime medal edge transitions were not completed in this lane.

## Defects
1. **D-41 — Malformed localStorage save permanently crashes menu render.**
   - **Severity:** WARN (availability/data-integrity; local-only but trivial to trigger via DevTools or corrupted profile).
   - **Vector:** Any persisted `best[id].time` that is non-number (or null/object) reaches `b.time.toFixed(0)` in `drawMenu()` at `hardest/game.js:294-298`; `loadSave()` only catches JSON parse errors and does no schema validation. The requestAnimationFrame loop throws every frame, so the menu cannot render/interact. Impossible `unlocked` values are also accepted without bounds (though they did not crash in this probe).
   - **Suggested remediation:** Validate/sanitize loaded save shape and numeric ranges before assigning `save`; discard malformed per-level records or reset to defaults.

## Notes
- No source files modified. Teleport landing/loop, key-door death persistence, death-animation pause, tab-blur accumulator, and full medal edge cases were not conclusively exercised in the available time; no defect is asserted for those paths. The pause smoke was on a live state rather than a forced death-animation state, so it is not evidence that death-animation pause is safe.
