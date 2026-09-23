# Ship records — index and status board

Living records for the MAKEARMORGAMESGREATAGAIN mission (contract: `MISSION.md`).
One record per roster game; update in place, never a parallel file. Records
begin with the survey + adopt/extend/replace decision and end as ship records
(acceptance checklist, exact verification commands + last observed results,
deferrals, provenance declaration).

Run log: **ship-run 2026-09-22** (goal-mode run) — reconnaissance complete,
records seeded; fix-forward wave A (hardest gate + S&S blockers) landed;
baseline re-probe wave (all six apps, real input) landed. **ship-run
2026-09-23 (sr1 root entry-point wave)** — fleet rename (The Cruel Maze),
static build pipeline (`build:fleet` -> committed `games/`), root
`index.html` hub (FLASHBACK ARCADE), full real-input click-through
verification of all seven renditions. Prior runs' status lives in git
history, `verification/`, `MAGA-everything/01-design-docs/`
(DISSECTION/OPEN-ITEMS/divergence-log), and `.ufo/handoff/` — mined as
status records, never as instructions.

## Status board (updated 2026-09-23, after sr1 waves A+B + sr2 wave C start)

| Game | Rendition | Decision | Gate / proof state (this run) | Remaining before ship | Ship status |
|---|---|---|---|---|---|
| Boxhead: 2Play Rooms | `apps/boxhead` (Pixi 8) | EXTEND | B-N1/B-N2 re-proven 37/39 real-input (sr1); `?debug` hook added | grenade AoE multi-kill unproven; DM kill-credit stub `game.ts:737-739`; D-55/56 re-confirmed, D-58 open; 51 placeholders; art/audio/menus polish | NOT SHIPPED |
| The Impossible Game | `apps/impossible` (Canvas2D) | EXTEND | **SHIP-CANDIDATE (sr2)** — "Impossible Run"; proto features home (title/practice×4 checkpoints/calibration/pause/clear); 135 BPM sync audio (per-attempt beat-0 lock); physics constants invariant — sr1 full-clear driver re-run PASS x=9900; 29/29 + hub 7/7 | medal criteria (spec TBD); 5-level full scope (spec defers); sample-accurate hit-map (impossible w/o licensed track); physical-device pass | SHIP-CANDIDATE |
| Burger Tycoon | `apps/burger-tycoon` (Canvas2D+DOM) | EXTEND | **SHIP-CANDIDATE (sr2)** — constants tuned via 4-strategy harness (all targets pass); arcade-core audio extended (music/SFX buses, 15 cues + Muzak bed); settings persisted; proto r1 art ported; 24 app + 7 hub real-input checks PASS; `games/burger-tycoon` rebuilt | headed-browser audio listen; CC deed review (operator); no win-state by design | SHIP-CANDIDATE |
| Chicken Invaders 2 (+ Cluck Horizon) | `packages/shmup-core` + 2 pack apps | EXTEND (dual-pack kept) | **both packs full clear proven** (sr1); D-37/D-38 FIXED; cluck regression clean | D-36/39/41–44 LOW; combat constants guessed; cluck gameplay SVGs unwired; audio/art polish | NOT SHIPPED |
| Swords & Sandals 2 | `apps/swords-and-sandals` (Canvas2D+DOM) | EXTEND | **SHIP-CANDIDATE (sr2)** — "Arena of Bonks"; 5th opponent Praetor Pommel (proto parity); colosseum art ported; march bed + 13 cues; settings persisted; sr2 75/75 real-input PASS (5-bout ladder clear, XSS matrix clean, save/load, touch 390×844 win) + hub 8/8 | full tournament tree (5 bouts exceeds 3–5 spec floor); exact original tables (unverifiable w/o external consult); IP written clearance (operator) | SHIP-CANDIDATE |
| The World's Hardest Game | `hardest/` (zero-dep, file://) | ADOPT + EXTEND | **SHIP-CANDIDATE (sr2)** — validator 114/114 exit 0 (re-run ×4 incl. parent); rights sweep done (L96 "The Crucible" + dedup renames); volume/mute settings persisted + WebAudio music; L114 victory screen; sr2 real-input matrix 12/12 (settings/pause/clear/medals/touch/select/hub) | headed-browser audio listen; real-input L114 (autopilot-proven); D-49/50/62 pre-existing LOW/INFO | SHIP-CANDIDATE |

Wave notes: all sr1 verification used real input events via zero-dependency
Node CDP drivers (committed under `verification/evidence/sr1-*.mjs`) against
system chromium — re-runnable offline with no new dependencies.

Global gaps: root entry point EXISTS (sr1 2026-09-23: `/index.html` hub +
committed `games/` static builds + `hardest/`); no audio anywhere beyond
synth blips; all combat/economy constants are declared guesses ("TBD
ARCADE"); art is placeholder/first-pass in the monorepo; in-app title
strings still carry original marks in three apps (hub uses evocations — see
Fleet branding below).

## Environment facts (probed 2026-09-22)

- node v24.19.0, npm 11.17.0, python3 3.14.7, npx present.
- **npm registry reachable** (`npm ping` PONG 216ms) → stack-locked TS/Vite
  monorepo path is viable; the zero-dependency fallback is NOT triggered.
  Lockfile present; `node_modules` absent → first build step is `npm install`
  in `MAGA-everything/02-code/armor-games/`.
- Browser: `/usr/bin/chromium` only. Playwright 1.63.0 resolvable via npx;
  no downloaded browsers → drive system chromium (executablePath).
- Prior verification method: headless chromium CDP against dev servers
  (ports 5173 boxhead / 5174 impossible / 5175 burger / 5176 replica /
  5177 cluck / 5178 sas) with `?debug` hooks; prototypes via file://;
  `node hardest/validate.mjs` for the hardest corpus.

## Run plan (ship-run 2026-09-22)

1. ~~**Fix-forward wave A (gates first)**~~ — **DONE (sr1):** hardest gate
   114/114 GREEN (109/111 repaired, D-45/47/65 fixed, pars + DIFFICULTY
   regenerated); S&S D-51/52/53 XSS fixed, D-54 ladder winnable + proven.
2. ~~**Baseline re-probe**~~ — **DONE (sr1):** `npm install` clean (lockfile
   unchanged); all six apps re-verified with real input (boxhead 37/39,
   impossible full clear 2/2, burger 7/7, both shmup packs full clear,
   sas 61/61).
3. ~~**Root entry point**~~ — **DONE (sr1 2026-09-23):** single `index.html`
   at repo root ("FLASHBACK ARCADE") linking exactly one rendition per
   title — six built apps via `npm run build:fleet` (staged into committed
   `games/<slug>/`, relative-base Vite builds, self-contained, zero
   external URLs at runtime) plus `hardest/` directly. Serve:
   `python3 -m http.server 8123` from the repo root →
   `http://localhost:8123/` (works from any static server / mount path;
   hub also renders from `file://` with an on-page serve hint). Verified
   with real mouse/key input through all 7 cards (boot + one interaction
   each, 0 console errors, 0 non-local requests): driver
   `verification/evidence/sr1-hub-run.mjs`, log `sr1-hub-run.log`,
   screenshots `sr1-hub*.png`.
4. **Ship-readiness per game:** resolve/tune placeholder constants, audio
   (WebAudio doctrine), authored art, menus/HUD/pause/settings/touch/
   persistence, rights renames (hardest title still original; check each
   app's player-facing strings).
5. **Final verification + records:** real-input proofs with evidence; finish
   each record's checklist/commands/deferrals/provenance.

## Fleet branding (player-facing names, rights posture)

Umbrella title (root `index.html`): **FLASHBACK ARCADE** — "six Flash-era
classics, remade". Originals are referenced by name only in code comments,
docs, and records; every player-facing name is an original evocation.

| Hub card | Rendition (href) | Name | Basis |
|---|---|---|---|
| Crateheads | `games/boxhead/` | Crateheads | **Proposed sr1 2026-09-23** (evocation; flagged for parent) |
| Impossible Run | `games/impossible-game/` | Impossible Run | **Proposed sr1 2026-09-23** (evocation; keeps the generic adjective only, flagged — alternative "One-Button Ordeal") |
| Burger Tycoon | `games/burger-tycoon/` | Burger Tycoon | Sanctioned precedent (concept spec 03; internal UI branding) |
| Chicken Storm | `games/chicken-invaders/` | Chicken Storm | **Proposed sr1 2026-09-23** (evocation; flagged for parent) |
| Cluck Horizon | `games/cluck-horizon/` | Cluck Horizon | Sanctioned original IP (concept spec 06; in-app title) |
| Arena of Bonks | `games/swords-and-sandals/` | Arena of Bonks | In-app original string (`apps/swords-and-sandals` arena title), reused |
| The Cruel Maze | `hardest/` | The Cruel Maze | **Decided sr1 2026-09-23** (renamed in `hardest/game.js`, `hardest/index.html`, `hardest/README.md`; validator re-run 114/114 after) |

Known remaining original-mark player-facing strings INSIDE the apps (out
of the sr1 slice's touch list; flagged for the ship-readiness wave):
`apps/boxhead/src/game.ts` title "BOXHEAD — 2PLAY ROOMS (native replica)";
`apps/swords-and-sandals/src/main.ts` canvas title "SWORDS & SANDALS";
shmup replica pack title "CHICKEN INVADERS" (`packages/shmup-core/src/
packs.ts`); impossible in-app strings reference the original title in
comments only. Level 96 display name "World's Hardest" (`hardest/levels/
96-worlds-hardest.js`, HUD-visible) also flagged.

## Standing directives (from the design pack; bind all records)

Stack lock (TS+Vite, Pixi 8 external via vendored importmap; Canvas2D for
impossible/burger/sas); zero binary assets — WebAudio recipes only; art
hand-authored, no external generators; English only; integer letterbox scale;
every state machine state has an exit; read-only verification hooks must be
readable in every mode ("a probe that throws is a probe that lies"); real
input events only for verification claims.
