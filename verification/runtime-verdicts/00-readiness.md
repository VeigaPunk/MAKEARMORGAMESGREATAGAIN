# RUNTIME VERDICT 00 — readiness probe
**maga-verify · 2026-09-22 · probe 1**

## Question
Is `maga-forge`'s monorepo in a runnable state (`node_modules` present, dev server reachable)?

## Evidence
```
$ ls MAGA-everything/02-code/armor-games/node_modules
ls: cannot access 'MAGA-everything/02-code/armor-games/node_modules': No such file or directory

$ curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:5173/
000   (connection refused — no listener)
```

Repo state: `git status` clean at baseline commit `1c45956` — the boxhead source on disk is the tarball baseline, not new forge commits. `package-lock.json` (39.8 KB) is present, so `npm install` has a pinned tree to resolve; it simply hasn't run in this workspace yet.

## Verdict
**NOT RUNNABLE — schedule fact, not a defect.** Per mission contract, verify never installs. Runtime probes (checklist sections A1, A4, B-series live, C, D3, E5, F1/F3–F6, G matrix) are deferred and queued below.

> **SUPERSEDED 16:31** — `node_modules` landed and :5173 came up mid-round; probes executed in `01-boxhead-desktop.md` and `02-boxhead-post-2e74d55.md`. Kept for provenance.

## Deferred probe queue (executes when :5173 answers)
1. **A1/A2/F1** — cold load, console capture, first-paint timing, screenshot title + mode + room screens.
2. **B3/B9 (D-01 confirm)** — `?debug` exposes `window.__maga.game`; drive a solo run, let zombies hit P1 until hp ≤ 0, observe whether `dead` state ever fires. Static trace says it cannot — runtime confirmation turns the static finding into a proven FAIL.
3. **B5/B6** — dry-fire click, crate pickup, barrel blast radius screenshot.
4. **B12/B13** — CDP-injected simultaneous key events for P1+P2; deathmatch damage + match end.
5. **C1/C6 (D-04 confirm)** — emulated 390×844 portrait + 844×390 landscape; screenshot touch chrome; verify FIRE reachable.
6. **D1/D3** — resize sweep, letterbox screenshots.
7. **B10** — set a score, reload, check `maga:boxhead:highscore` survives.
8. **F-series** — FPS sampling during wave 3; heap across 3 restarts; transfer size from network log.
9. **A4** — menu→combat restart timing.

## Note on serving without node_modules
`index.html` loads pixi via importmap (`./vendor/pixi.min.mjs`, vendored) — but `src/*.ts` still needs a TS-aware transform (vite/esbuild). A static file server cannot run the app. No workaround attempted; contract says wait for forge.
