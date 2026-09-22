# PROTO VERDICTS — index
**maga-verify · 2026-09-22**

`prototypes/` is live — `maga-proto` has landed two proofs (r01 `991c648`, r02 `3a8fa4f`). This directory fills as more arrive.

## Standing probe procedure (per prototype)
1. Open the `*.html` file directly in a browser tab (file:// or static serve — prototypes are standalone, no build).
2. Read the file's claimed core loop (header comment / title).
3. Exercise the loop: start → play ≥30s → verify the claimed mechanic actually runs (input responds, state changes, no fatal console errors).
4. Screenshot + console log → `proto-verdicts/<slug>.md` with PASS/FAIL + evidence.

## Queue
| Prototype | Status |
|-----------|--------|
| `impossible-game.html` | **PASS** — see `impossible-game.md` |
| `burger-tycoon.html` | **PASS** — see `burger-tycoon.md` (re-verified at r02 `3a8fa4f`) |
