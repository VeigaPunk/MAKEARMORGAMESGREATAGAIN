# Ship record — Chicken Invaders 2: The Next Wave (remake) + Cluck Horizon pack

Original reference: Chicken Invaders 2: The Next Wave (2002) — vertical
shmup: formation waves, weapon gifts, missiles, bosses. (Not Flash-era;
no official SWF — fan Flash clones are explicitly unacceptable references.)
The shmup engine also carries **Cluck Horizon**, an original-IP second
content pack: keep the dual-pack architecture, don't fork it. Player-facing
branding must be original evocations.

Status: **NOT SHIPPED** — survey complete, rendition EXTEND in progress;
replica content types, boss naming, and both end-to-end flows proven
2026-09-23 (shmup verification+fix wave). Art/audio placeholder fronts
unchanged (below).
Last updated: 2026-09-23 (shmup verification+fix wave).

## Survey — implementations found

1. `prototypes/chicken-invaders.html` (1,084 lines, zero-dep, file://) —
   richest proto, verified PASS: one engine + `PACKS{replica,cluck}`
   content-swap table; 2 chapters × 2 formation waves + boss; 3 weapon
   flavors via deterministic gift cycle; food→missiles; lives/1.2s
   respawn/2s invuln; boss telegraph-then-radial; descent clamps
   300/320/280; both mobile layouts (B one-thumb drag+auto-fire, A
   twin-thumb stick+hold-fire; toggle persisted `ci_proto_layout`;
   `touch-action:none` load-bearing). Null-guarded `__proto` getter hook
   (D-22 lesson).
2. `MAGA-everything/02-code/armor-games/packages/shmup-core` (1,294 LOC:
   sim 460 / render 235 / touch 166 / boot 167 / packs 91) +
   `apps/chicken-invaders` (9-line boot → `replica` pack) +
   `apps/chicken-invaders-original` (9-line boot → `cluck` pack).
   Chapter select 1–2 with unlock persist (`ci_proto_unlock_<pack>`), 2
   waves + boss/chapter, 3 gift weapons, missiles/drumsticks, 3 lives +
   invuln, win after CH2, touch A/B, `?debug`. Proto crash divergences
   P-1/P-2 fixed + recorded.

Docs: concept specs `04-chicken-invaders.md` + `06-chicken-invaders-original.md`
(CI2 formula recreate; Cluck: 2 sectors × 1 boss, ≥3 original weapon kits,
3 enemy types + 2 bosses, visibly distinct teal/orange palette, G2 =
originality audit), build cards.

## Decision: EXTEND `shmup-core` + both pack apps

Architecture is exactly what the mission mandates (one engine, two content
packs). Cluck full clear proven; replica partial. Do not fork.

## Known defects / unproven fronts

- FIXED (2026-09-23): **D-38** — replica `enemyTypes` now meaningfully
  distinct, mirroring the cluck pattern (`shmup-core/src/packs.ts:45-49`):
  CHICKEN 1.0×/hp2 (yellow/pink), CHICKEN SCOUT 1.15×/hp2 (pale-yellow/red),
  CHICKEN ACE 0.85×/hp4 (amber/deep-red). Consumed per-type by sim (motionT
  speed scaling, `Math.max(waveHp, variantHp)` durability) and render
  (per-type colors). Fairness: hp4 tank = ~0.7s focused pea-shooter fire;
  full clear proven deathless (below).
- FIXED (2026-09-23): **D-37** — replica boss names were derivatives of the
  original's boss names ("Big Chicken"/"Mother-Hen Ship") and the name field
  was dead data. Renamed to original evocations **THE HENERAL** (ch1) and
  **HER EGGSCELLENCY** (ch2) and made player-facing: HUD boss line renders
  `BOSS <name>` (`render.ts:214`). Live-proven in screenshots. Cluck bosses
  (MOTHER GOOSE / ROOSTER REGENT) unchanged — already original. The replica
  pack title/sub ("CHICKEN INVADERS — The Next Wave…") intentionally retains
  the spec-04-sanctioned INTERNAL replica branding with the INTERNAL-NO-PUBLIC
  watermark; public ship still needs InterAction clearance per spec.
- OPEN (other lanes): D-36 (HUD `WAVE 3/2` unclamped — visible in the
  sr1-shmup win screenshot), D-39 (hardcoded pickup/comb colors),
  D-42/43/44 LOW, D-41 (snapshot churn) — not re-verified here.
- FIXED (keep fixed): D-21, D-22 (probe-throws lesson), D-32.
- PROVEN (2026-09-23, was the r05 gap): replica game-over flow (3× death →
  game-over banner → R → title → Enter restart, lives reset) and replica
  full clear (ch1 waves+boss → chapter clear → ch2 waves+boss → win, chapter
  unlock persisted to localStorage, post-win ch2 re-select works). Method:
  per-lane headless chromium + CDP real input (see Verification) — the r05
  cross-lane tab hijack (D-63) is avoided by giving every run its own
  chromium instance and fresh `--user-data-dir` (no shared browser).

## Placeholders to resolve before ship

`packages/shmup-core/src/sim.ts:17,24` — every combat constant a declared
guess; `boot.ts:15` — guess melodies; `render.ts:7` — placeholder vector
art. Cluck art debt: 6 SVGs authored, only `title-cluck-horizon.svg` wired
(`render.ts:89`) — wire the 5 gameplay SVGs or drop them.

## Verification

Recorded commands (last observed results):
- Proto: headless chromium `file://prototypes/chicken-invaders.html`,
  real input — PASS (`verification/proto-verdicts/chicken-invaders.md`).
- Apps: `npm run dev:chicken` (5176) / `npm run dev:cluck` (5177) + CDP —
  cluck FULL clear (ch2 boss, win, game-over, unlock persist) proven;
  replica ch1+boss+chapter-clear proven (r05).
- 2026-09-23 shmup wave (this lane): typecheck + build PASS
  (`npm run typecheck -w @maga/shmup-core`, both apps; `npm run build -w
  @maga/chicken-invaders`). Live: zero-dep CDP driver
  `verification/evidence/sr1-shmup-driver.mjs` (own headless chromium per
  run, fresh `--user-data-dir`, real `Input.dispatchKeyEvent` /
  `dispatchMouseEvent` only; state via `?debug` → `window.__maga`):
  - `… types "http://localhost:5176/?debug" …` — **PASS**: per-type least-
    squares motion fit over 100 samples: ω = 0.700/0.805/0.595 exactly
    matching pack speeds 1/1.15/0.85; spawn hp 2/2/4; tracked ACE died to
    exactly 4 real-bullet hits. 0 console errors.
  - `… fullclear "http://localhost:5176/?debug" …` — **PASS**: ch1 2 waves
    + boss THE HENERAL → CHAPTER 1 CLEAR → ch2 2 waves (dives) + boss
    HER EGGSCELLENCY → win banner, score 7750, 0 deaths; unlock persisted
    (`maga:chicken-invaders:chapter-unlocked` = "2"); R → title, Digit2 +
    Enter → ch2 restarts. 0 console errors.
  - `… gameover "http://localhost:5176/?debug" …` — **PASS**: 3 egg deaths
    → `GAME OVER — R / click for title` at lives 0 → R → title → Enter →
    play, lives reset to 3. 0 console errors.
  - `… clucksmoke "http://localhost:5177/?debug" …` — **PASS** (regression
    smoke after shmup-core changes): cluck boots, ch1 wave 1 cleared → wave
    2, 22 kills, score 2250, lives 3, 0 deaths. 0 console errors.
  - Run log: `verification/evidence/sr1-shmup-run.log`; screenshots
    `sr1-shmup-replica-types.png` (3 distinct type variants),
    `sr1-shmup-replica-boss.png` (HUD `BOSS THE HENERAL`),
    `sr1-shmup-replica-gameover.png`, `sr1-shmup-replica-win.png`,
    `sr1-shmup-cluck-smoke.png`.
  - Note: three earlier driver iterations failed in ch2 (dive/egg dodging) —
    retained in the run log; the game was not touched. Final AI clears
    deathless, so ch2 constants stand as shipped (same constants cluck
    full-cleared under at r05).

- **sr1 root entry point (2026-09-23):** both packs built via `npm run
  build:fleet` (staged to `games/chicken-invaders/` and
  `games/cluck-horizon/`), served by `python3 -m http.server 8123` from
  the repo root; hub card real-mouse-click per pack -> title -> real click
  START -> mode=play, chapter 1, wave 1 live (12 chickens, both packs) —
  0 console errors, 0 non-local requests. Evidence:
  `verification/evidence/sr1-hub-run.log`, `sr1-hub-chicken-invaders.png`,
  `sr1-hub-cluck-horizon.png`.

Ship-gate checklist: pending (must include both packs, both touch layouts,
and the G2 originality audit for Cluck Horizon).

## Deferrals

None declared yet.

## Provenance declaration

Consulted: this working copy only — git history, `verification/`,
`MAGA-everything/01-design-docs/`, `prototypes/`, plus my own knowledge of
the original game. Network use: none beyond a single `npm ping` probe. No
web/GitHub searches about this project, no forks/copies, no third-party
remakes/clones of the original were consulted (fan Flash clones are
explicitly off-limits as references per the design pack).
