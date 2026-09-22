# r05 — ShmupSimChurn (static review of uncommitted shmup-core churn)

Lane: ShmupSimChurn · Scope: `packages/shmup-core/src/{sim,packs,render,touch}.ts` uncommitted diff · Mode: STATIC-ONLY (no runtime, per assignment)

## Verdict

**FAIL** — churn is real and mostly coherent (type/color plumbing compiles conceptually, no dangling `pack.enemy`/`pack.boss` consumers, D-36 crash-clamp landed), but:

- **D-37 is NOT fixed**: boss names still never drawn; HUD still hardcodes literal `'BOSS'`.
- **D-39 only half-addressed**: `gift`/`food` strings still dead; comb/beak still hardcoded.
- **New defects introduced** by the churn itself (D-41 snapshot leak, D-42 frozen-statue speed gate, D-43 flat scoring vs per-type HP, D-44 phantom replica types).

## Answers to assigned questions

### (1) D-37 boss names — does render.ts draw `pack.bosses[].name`?

**No. Not fixed.** `render.ts:201` still renders:

```ts
const right = `CH ${sim.chapter} · ${sim.boss ? 'BOSS' : `WAVE ${sim.waveIdx + 1}/${sim.wavesTotal}`}\n[${sim.pack.id.toUpperCase()}]`;
```

The literal string `'BOSS'` remains. The new `pack.bosses[type]` is consumed **only** for `color`/`headColor` at `render.ts:120-122`. `BossType.name` (`'BIG HEN'`, `'MOTHER HEN'`, `'MOTHER GOOSE'`, `'ROOSTER REGENT'`) is written in packs but never read anywhere — repo-wide grep for `bosses[` finds only `render.ts:120`. The name field is dead-on-arrival, the same defect class as D-39.

### (2) D-36 wave counter — waveIdx clamped post-final-wave?

**Partially.** The crash vector is closed: `sim.ts:283` clamps the wave-def lookup:

```ts
const wdef = CHAPTERS[this.chapter - 1][Math.min(this.waveIdx, CHAPTERS[this.chapter - 1].length - 1)];
```

(comment at sim.ts:281-282 documents the P-3 fix; proto crashed here). The render HUD is incidentally safe because the `WAVE n/m` branch only renders when `!sim.boss` (render.ts:201), and boss phase is the only time `waveIdx == wavesTotal`.

**However the same leak survives in `snapshot()`** (`sim.ts:448`): `wave: this.waveIdx + 1` is unclamped, so during boss phase `__maga.state` reports e.g. `wave: 3, wavesTotal: 2` (ch1 has 2 waves → waveIdx 2 → "3/2"). Filed as D-41.

### (3) D-39 — gift/food/enemy strings dead? comb/beak hardcoded?

- `pack.gift` / `pack.food` (`'GIFT'`, `'DRUMSTICK'`, `'CRATE'`, `'RATIONS'`): **still dead.** Grep across `apps/*` + `packages/shmup-core` finds zero reads. Pickups are drawn by literal shape, not label (render.ts:159-164, `p.kind === 'gift'`); the strings never reach the screen.
- `pack.enemy` / `pack.boss` string fields: **removed** from `ContentPack` (packs.ts:25-26 replaces with `enemyTypes`/`bosses` tuples) and no consumer references them — clean cutover, no compile break.
- comb/beak: **still hardcoded** — render.ts:123-124 draws comb `0xff8787` and beak `0xffa94d` as literals. This now actively conflicts with the new per-type `headColor`: cluck types have headColors `0xffe066`/`0xffa94d`/`0xffc92a`, none of which is `0xff8787`, so the comb no longer matches the head on any cluck variant. If per-type headColor is the feature, comb/beak should derive from it (or be added to the type record).

### (4) New defects from sim.ts/packs.ts churn

- **D-41** — `sim.ts:448` `snapshot()` reports `wave: waveIdx + 1` unclamped; during boss phase consumers of `__maga.state` (boot.ts:101 exposes it under `?debug`) see `wave > wavesTotal` (e.g. 3/2). Render HUD masks it; the debug/PROOF surface does not. Clamp identically to sim.ts:283.
- **D-42** — `sim.ts:285` `if (this.pack.enemyTypes[c.type].speed <= 0) continue;` gates only *movement*. A speed-0 type would remain in `this.chickens`: still bullet-collidable, still egg-dropping (sim.ts:317-325 picks from `this.chickens` regardless), still blocking wave-clear (sim.ts:336 requires empty chickens), still body-collidable. Latent today (all shipped speeds > 0, packs.ts:45-50/70-74) but the gate encodes "frozen statue" semantics that are half-wired. Either delete the gate or define what speed ≤ 0 means.
- **D-43** — per-type durability added (`hp: Math.max(w.hp, variant.hp)`, sim.ts:182) but scoring stayed flat: `killChicken` is `this.score += 100` (sim.ts:236) regardless of `c.type`. A cluck BRUISER (hp 3, sim.ts packs.ts:72) costs 3 bullets and returns the same 100 as a 2-hp bird. If per-type HP is the feature, per-type score is the matching invariant.
- **D-44** — replica pack's three enemy types are **fully identical** (packs.ts:46-49: all `color 0xffd43b`, `headColor 0xff8787`, `speed 1`, `hp 2`). With spawn assignment `(r * w.cols + c) % 3` (sim.ts:178), types 1/2 ("CHICKEN SCOUT"/"CHICKEN ACE") are visually and behaviorally indistinguishable from type 0 in the replica app, and their names never render (D-37). Only the cluck pack exercises the differentiation. Phantom types in the primary pack.

### Non-defect notes

- **touch.ts:86-89** — `pointerup`/`pointercancel` moved from canvas to `window` (capture). Strict improvement (release outside canvas no longer strands `dragPointer`); no defect. Listeners are never removed, but `ShmupTouch` is constructed once per boot — acceptable.
- `Chicken.t` field removed with the diff — confirmed vestigial (no `c.t` readers remain).
- Boss `type: this.chapter - 1` (sim.ts:189) is in-range for the 2-entry `bosses` tuple; would become a crash (`undefined.color`) if a 3rd chapter ships without extending the tuple — same latent-guard note as D-42, not filed.
- `pack.foe`/`pack.foe2` remain live (burst colors, sim.ts:235/370/393/406/407) — no dead-color regression there.

## Evidence

- Diff artifacts: `git diff` of all four files captured (packs.ts +36/-…, sim.ts +27, render.ts 15 changed lines, touch.ts 4).
- render.ts:118-126 (drawBird variant plumbing, hardcoded comb/beak), render.ts:169/176 (callers pass `c.type`/`b.type`), render.ts:201 (HUD literal 'BOSS').
- sim.ts:171-190 (spawn typing, boss type), sim.ts:283 (wdef clamp), sim.ts:285-308 (speed gate + per-type motionT), sim.ts:336-339 (waveIdx++/spawnBoss), sim.ts:446-448 (snapshot wave leak).
- packs.ts:24-26 (interface), 45-55 (replica), 70-80 (cluck).
- Greps: `pack\.(gift|food|enemy|boss...)` → zero hits outside type defs; `bosses[` → render.ts:120 only; app sources (chicken-invaders, chicken-invaders-original) contain no `snapshot`/`wave`/`BOSS` consumers — HUD is render.ts-only; `__maga.state` exposed at boot.ts:101 under `?debug`.

## Defects

| ID | Severity | Summary | Site |
|----|----------|---------|------|
| D-37 (reaffirmed) | Med | Boss names never drawn; HUD literal 'BOSS'; `BossType.name` dead | render.ts:201, packs.ts |
| D-39 (partial) | Low | `pack.gift`/`pack.food` still dead strings; comb/beak hardcoded and now mismatched vs cluck headColor | render.ts:123-124 |
| D-41 | Low | snapshot() `wave` unclamped → wave 3/2 during boss phase | sim.ts:448 |
| D-42 | Low (latent) | speed≤0 gate freezes movement only; chicken still shoots/blocks/collides | sim.ts:285 |
| D-43 | Low | per-type HP without per-type score (BRUISER 3hp = 100 pts) | sim.ts:182 vs 236 |
| D-44 | Low | replica pack's SCOUT/ACE are phantom types (identical stats, names never rendered) | packs.ts:46-49 |

## Notes

Static-only per assignment — no runtime verification, colors/scoring claims are from source reading (labeled where inferred). Schedule fact: the type-system churn (EnemyType/BossType) landed uncommitted alongside these fixes; it is plumbing-complete for color/headColor but ships two dead `name` fields, which is why D-37 cannot be closed by this diff.
