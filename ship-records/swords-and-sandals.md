# Ship record — Swords & Sandals 2: Emperor's Reign (remake, "Arena of Bonks")

Original reference: Swords & Sandals 2: Emperor's Reign (2007) — gladiator
RPG: character creation, shops, turn-based arena ladder, persistence.
Highest legal-friction title in the roster (DD-27) — player-facing names,
titles, characters, and art MUST be original evocations.

Status: **SHIP-CANDIDATE (internal)** — blockers-fixed (D-51/52/53, D-54) and
the sr2 wave complete: rights rename, audio+settings, title/defeat flows, r1
art home, 5-bout ladder (proto parity), full re-verification with real input
(75/75 desktop+touch, hub boot-proof clean). One standing non-code blocker:
**IP written clearance** (INTERNAL-NO-PUBLIC badge retained, fleet-consistent).
Last updated: 2026-09-23 (ship-run 2026-09-23, sr2 wave).

## Survey — implementations found

1. `prototypes/swords-and-sandals.html` (822 lines, zero-dep, file://) —
   full v1 loop: create → 5 scripted opponents → champion; turn-gated
   combat; render-time shop gates; defeat-safe save; enemy AI priority list;
   r1 colosseum art. `__proto` here is a **function** — drivers must call it.
   Deferred marker at line 742: full tournament tree.
2. `MAGA-everything/02-code/armor-games/apps/swords-and-sandals` (TS/Vite,
   Canvas2D+DOM) — this rendition, EXTENDED through sr1 (blockers) and sr2
   (this wave). Dev `npm run dev:sands` (port 5178), `?debug` → `__maga`.

Docs: concept spec `05-swords-and-sandals.md` (slice floor: create gladiator
+ 3–5 scripted fights + small shop, one save slot).

## Decision: EXTEND `apps/swords-and-sandals` (binding)

Loop and save validator proven here; proto is the mechanics contract.
sr2 kept the sr1-tuned constants (proven winnable — no retune) and ported
the proto's r1 presentation layer rather than inventing new art.

## What sr2 changed (2026-09-23)

- **Rights rename (item 1).** Player-facing title is now **Arena of Bonks**
  everywhere: canvas wordmark (was `SWORDS & SANDALS`), `index.html`
  `<title>` ("Arena of Bonks — MAGA native replica"), title-screen H1.
  String sweep: no "Swords"/"Sandals" in any player-facing string (verified
  by driver scan of body text + title + DOM source). Opponent/shop names
  audited — Tin Can Tim, Baron Bonk, The Sand Snorter, Emperor's Champion
  (evocations, kept), + new "Praetor Pommel"; gear names generic (Bent
  Bronze Sword / Lucky Sandals / Imperial Buckler). Decisions: the
  INTERNAL-NO-PUBLIC badge (names the original's rights holders as a
  clearance reminder) is retained, fleet-consistent with burger/hardest; the
  storage keys `maga:swords-and-sandals:*` are machine-side and unchanged
  for save compatibility. No source marks anywhere player-facing.
- **Audio (item 2).** `packages/arcade-core/src/sfx.ts` consumed as-is
  (frozen this wave — untouched). New `src/audio.ts`: arena march bed
  (D-dorian i–VI–VII loop via `startMusic` music bus) + 13 cues wired to
  real events: swing (Attack), swingHeavy (Special), thud (landed hits),
  clink (guarded/blocked enemy blow), glug (potion), taunt (Taunt/pass —
  the proto's sanctioned pass action, same mechanics as the old End Turn),
  crowd swell (kill), fanfare (complete), sting (defeat), buy, coin, click,
  start. **Settings**: music/SFX volume sliders + mute-all, persisted at
  `maga:swords-and-sandals:audio`, reachable from the fixed SETTINGS button
  (title/hub/everywhere) and via Esc from the arena.
- **Flow completeness (item 3).** Title screen added (Continue when a save
  exists, New Gladiator otherwise) — boot always lands there. Defeat screen
  added (honest-play reachable): defeat-safe save kept (hp restored,
  standing/gold kept), "Rise Again" → hub, retry works. Complete screen →
  Return to Hub → Save & Title → Continue all verified. Esc backs out of
  shop/create/hub (→ title) and opens settings from the arena (combat
  preserved); every state has an exit. Touch: buttons ≥48px CSS min-height,
  actions bar sticky at ≤600px width; tap-through verified at 390×844
  (create → first bout won by taps; ≥40px audit clean).
- **Art (item 4).** Proto r1 colosseum ported to `src/arena.ts` and adapted
  to the app's 800×420 stage: 3 arched tiers with crowd stipple + per-frame
  twinkle, hanging banners, wall band, sun-baked sand with rake arcs,
  stains, broken-sword/shield decals, torch braziers with 2-frame flames +
  glow, drifting dust motes. Articulated gladiators (per-look skin/tint,
  4 armor tiers, weapon silhouettes club/sword/axe/dagger/tower-shield,
  helms, idle bob); per-opponent skin/weapon/champion-gold. Combat feedback:
  lunge offsets, hurt flicker, screen shake, floating damage/MISS/potion/
  gold text, engraved nameplates + gradient HP bars over both fighters.
  Title/create/hub/shop/complete/defeat vignettes; champion confetti. The 3
  portrait SVGs kept (wired in create/hub). No external assets.
- **Constants (item 5).** sr1 tuning is the proven baseline — NOT retuned:
  Snorter 56/9/4, Champion 66/10/6, rewards 25+10d, shop 20/32/48 (kit
  100g), potion 16, formulas/mechanics unchanged. Code annotates the
  baseline with a pointer to this record (D-54). Remaining proto
  DECLARED-GUESSES status recorded in the app README table (formulas kept;
  difficulty now PROVEN; audio roster resolved). Content: added the 5th
  mid-ladder opponent **Praetor Pommel** (hp 60 / str 9 / def 5, slot 4 of
  5, reward 55g) — proto-parity count, cheap, and re-proven winnable
  (ladder clear below). Tournament tree beyond the 5-bout ladder stays
  deferred (recorded below).

## Known defects

- FIXED (2026-09-22, sr1): D-51/52/53 stored XSS (escaping + name charset +
  look clamp; matrix re-proven sr2 below); D-54 unwinnable ladder
  (constants-only retune, full clear proven).
- FIXED (2026-09-23, sr2): D-31 subsumed (the `hud.innerHTML` sink it flagged
  is the escaped sink; log pane is textContent-built). Missing title/defeat
  screens, missing audio/settings, art placeholder, 4-bout ladder.
- OPEN: D-24 (WATCH — opponent HP line froze once, unreproduced across sr1
  full clear + sr2 five-bout clear; HP now also drawn as canvas bars).
- STANDING BLOCKER (non-code): IP written clearance — INTERNAL-NO-PUBLIC
  badge retained until then; not a code defect.

## Verification

All recorded commands re-run with zero new dependencies and zero network
beyond localhost. Last observed results 2026-09-23 (sr2):

- `cd MAGA-everything/02-code/armor-games && npm run typecheck -w
  @maga/swords-and-sandals` — clean.
- `npm run build -w @maga/swords-and-sandals` — clean (30.6KB bundle,
  10.5KB gzip).
- `npm run dev:sands` (port 5178) + zero-dep CDP driver
  (`verification/evidence/sr2-sas-run.mjs`, real Input.dispatchKeyEvent /
  dispatchMouseEvent, reads via `window.__maga` only, fresh user-data-dir
  per launch) — `verification/evidence/sr2-sas-run.log`: **75/75 PASS**
  (0 failures):
  - Rights: title/`<title>`/canvas/DOM sweep — no source mark; wordmark gone.
  - Title → create with real typing; middle build str4/agi3/vit4/def3.
  - Settings: sliders + mute via real clicks → `sfx.musicVolume/sfxVolume/
    muted` applied + persisted; survive reload; reachable from title/hub
    (SETTINGS button) and arena (Esc).
  - Audio: `__maga.sfx.running===true`, voices accruing (music bed
    scheduled on first gesture, voices 12 → 17 across 700ms).
  - **Full 5-bout ladder clear, real input** (strategy: Special every turn,
    potion when HP ≤ 18; kit sword→sandals→buckler across the ladder):
    fight1 Tin Can Tim 8 turns; fight2 Baron Bonk 10; save/load round-trip
    mid-ladder (state + raw save bytes identical); fight3 The Sand Snorter
    7 turns (1 honest defeat, retry loop works); fight4 Praetor Pommel 14
    turns; fight5 Emperor's Champion 10 turns → **ARENA CONQUERED**,
    defeated=5, Return to Hub → Save & Title → Continue → complete mode.
  - Defeat path (fresh profile, never attacks): DEFEAT screen by honest
    play, defeat-safe save (hp=maxHp, standing kept), Rise Again → hub.
  - Esc: arena → settings (combat preserved) → close; shop → hub; hub →
    title.
  - XSS matrix (4 payload names incl. benign control, real typing, through
    create → hub → shop → arena → combat → reload → shop): zero execution
    (`window.p` never set), no injected HUD elements, benign name verbatim
    + `&amp;`-escaped, zero console errors (favicon 404 eliminated by
    `data:` icon). Tampered attacker-save (payload name + attribute-breaking
    look): look clamped to Scarlet, zero execution through shop+arena.
  - `validSave()` corrupt-rejection matrix: 8/8 corrupt saves → fresh
    create; valid mid-ladder save → hub (defeated=2).
  - Keyboard: Tab reaches buttons (gear first), Enter activates the focused
    title button (keyDown with `text:'\r'` — noted for future drivers:
    CDP Enter without `text` does not activate buttons in this chromium).
  - Touch (390×844): boots to title; create → hub → arena → first bout won
    by taps; all combat/shop buttons ≥40px; no console errors.
- Fleet staging: `npm run build -w @maga/swords-and-sandals`, clean copy of
  `dist/` → `games/swords-and-sandals/` (same semantics as
  `tools/build-fleet.mjs`; only this title staged).
- Hub boot-proof (built game): `python3 -m http.server 8123` from repo root
  + `node verification/evidence/sr2-sas-hub.mjs` — **8/8 PASS**: real hub-card
  click lands on the built game (plain link), title renamed, boots to title,
  create → hub → arena (fight 1 live, opp HP 34), combat frame clean,
  **0 console errors, 0 non-local requests**. Evidence:
  `verification/evidence/sr2-sas-hub.log`, `sr2-sas-hub.png`.

Ship-gate checklist: full ladder clear with real input — PASS (5/5 bouts);
XSS matrix clean — PASS; keyboard — PASS (native DOM, real events);
save/load round-trip — PASS; settings persist — PASS; audio scheduled —
PASS; touch smoke — PASS; rights sweep — PASS; built-game hub boot — PASS
(0 errors / 0 non-local).

Evidence files: `sr2-sas-run.mjs`, `sr2-sas-run.log` (75 checks),
`sr2-sas-title.png`, `sr2-sas-settings.png`, `sr2-sas-arena.png`,
`sr2-sas-complete.png`, `sr2-sas-touch.png`, `sr2-sas-hub.mjs`,
`sr2-sas-hub.log`, `sr2-sas-hub.png`.

## Deferrals

- Full tournament tree (proto line 742): still deferred — the spec slice
  floor (3–5 scripted fights + small shop) is now exceeded at 5 fights + 3
  items, proven winnable end-to-end. A bracket/tree remains future content.
- Exact original combat tables/prices remain unverified against the
  original (no external consultation allowed); the sr1-tuned numbers stand
  as the declared, proven baseline.
- IP written clearance: operator-side blocker, badge retained.

## Provenance declaration

Consulted: this working copy only — git history, `verification/`,
`MAGA-everything/01-design-docs/`, `prototypes/`, plus my own knowledge of
the original game. Network use: none beyond localhost dev/probe servers.
No web/GitHub searches about this project, no forks/copies, no third-party
remakes of the original were consulted.
