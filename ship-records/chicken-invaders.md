# Ship record — Chicken Invaders 2: The Next Wave (remake) + Cluck Horizon pack

Original reference: Chicken Invaders 2: The Next Wave (2002) — vertical
shmup: formation waves, weapon gifts, missiles, bosses. (Not Flash-era;
no official SWF — fan Flash clones are explicitly unacceptable references.)
The shmup engine also carries **Cluck Horizon**, an original-IP second
content pack: keep the dual-pack architecture, don't fork it. Player-facing
branding must be original evocations.

Status: **NOT SHIPPED** — survey complete, rendition EXTEND in progress.
Last updated: 2026-09-22 (ship-run 2026-09-22).

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

- OPEN: **D-38** — replica pack `enemyTypes` stat-identical
  (`shmup-core/src/packs.ts:45-49`), type assignment a no-op; spec wants
  2–3 types. Cluck side FIXED (keep).
- OPEN: **D-37** — boss names not fixed. D-36→D-41 LOW, D-39 PARTIAL,
  D-42/43/44 LOW.
- FIXED (keep fixed): D-21, D-22 (probe-throws lesson), D-32.
- UNPROVEN: replica game-over flow + replica ch2 boss (source-read only at
  r05; cross-lane tab hijack blocked live proof — D-63 shared-origin
  localStorage contamination was the process cause; isolate probe origins).

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
  replica ch1+boss+chapter-clear proven; replica game-over + ch2 boss OPEN.

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
