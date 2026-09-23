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
| Boxhead: 2Play Rooms | `apps/boxhead` (Pixi 8) | EXTEND | **SHIP-CANDIDATE (sr2)** — "Crateheads"; constants tuned (waves 8/14/22, ladder 3/6/10); DM AoE kill-credit implemented; D-55/56/57/18 closed, D-58 resume grace; sound bible ~20 cues + beds; full procedural art; canonical 53/55 + AoE probes PASS; hub boot clean | grenade ≥3 multi-kill unproven (credit path proven via barrels); D-58 live repro; G device matrix; C4 dual-pad | SHIP-CANDIDATE |
| The Impossible Game | `apps/impossible` (Canvas2D) | EXTEND | **SHIP-CANDIDATE (sr2)** — "Impossible Run"; proto features home (title/practice×4 checkpoints/calibration/pause/clear); 135 BPM sync audio (per-attempt beat-0 lock); physics constants invariant — sr1 full-clear driver re-run PASS x=9900; 29/29 + hub 7/7 | medal criteria (spec TBD); 5-level full scope (spec defers); sample-accurate hit-map (impossible w/o licensed track); physical-device pass | SHIP-CANDIDATE |
| Burger Tycoon | `apps/burger-tycoon` (Canvas2D+DOM) | EXTEND | **SHIP-CANDIDATE (sr2)** — constants tuned via 4-strategy harness (all targets pass); arcade-core audio extended (music/SFX buses, 15 cues + Muzak bed); settings persisted; proto r1 art ported; 24 app + 7 hub real-input checks PASS; `games/burger-tycoon` rebuilt | headed-browser audio listen; CC deed review (operator); no win-state by design | SHIP-CANDIDATE |
| Chicken Invaders 2 (+ Cluck Horizon) | `packages/shmup-core` + 2 pack apps | EXTEND (dual-pack kept) | **SHIP-CANDIDATE (sr2)** — "Chicken Storm" + "Cluck Horizon"; constants tuned (clamps restored); composed beds + 16 cues; cluck SVGs wired + proto sprites ported; D-36/39/41/42/43/44 fixed; both packs WIN re-proven (replica 10925/1d, cluck 10025/0d); touch A/B; hub boots clean | clearances (operator); cluck single-frame SVGs; ARCADE-capture tail odds per convention | SHIP-CANDIDATE |
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
4. ~~**Ship-readiness per game**~~ — **DONE (sr2 2026-09-23):** all six titles
   at SHIP-CANDIDATE — constants tuned with recorded rationale (declared
   guesses eliminated), WebAudio music + SFX per doctrine, authored art,
   title/menus/HUD/pause/settings (volume/mute persisted)/touch/persistence,
   rights renames applied in-app. Per-title results in the records; evidence
   `verification/evidence/sr2-*`.
5. ~~**Final verification + records**~~ — **DONE (sr3 2026-09-23):** closing
   fleet audit below; all recorded verification re-runs offline with zero new
   dependencies; records complete (checklists, commands + last observed
   results, deferrals, provenance).

## Fleet branding (player-facing names, rights posture)

Umbrella title (root `index.html`): **FLASHBACK ARCADE** — "six Flash-era
classics, remade". Originals are referenced by name only in code comments,
docs, and records; every player-facing name is an original evocation.

| Hub card | Rendition (href) | Name | Basis |
|---|---|---|---|
| Crateheads | `games/boxhead/` | Crateheads | **Decided sr1, applied in-app sr2** (wordmark + strings; bundle grep clean) |
| Impossible Run | `games/impossible-game/` | Impossible Run | **Decided sr3 2026-09-23 (final):** keeps only the generic adjective + genre noun per the Burger Tycoon precedent (drop the mark, keep descriptive generics); the full-title mark is "The Impossible Game", which appears nowhere player-facing. Alternative "One-Button Ordeal" rejected — loses legibility without reducing risk. |
| Burger Tycoon | `games/burger-tycoon/` | Burger Tycoon | Sanctioned precedent (concept spec 03; internal UI branding) |
| Chicken Storm | `games/chicken-invaders/` | Chicken Storm | **Decided sr1, applied in-app sr2** (pack title + strings; subtitle scrubbed) |
| Cluck Horizon | `games/cluck-horizon/` | Cluck Horizon | Sanctioned original IP (concept spec 06; in-app title) |
| Arena of Bonks | `games/swords-and-sandals/` | Arena of Bonks | In-app original string (`apps/swords-and-sandals` arena title), reused |
| The Cruel Maze | `hardest/` | The Cruel Maze | **Decided sr1 2026-09-23** (renamed in `hardest/game.js`, `hardest/index.html`, `hardest/README.md`; validator re-run 114/114 after) |

sr2 wave applied every rename in-app (Crateheads wordmark, Chicken Storm
pack title, Arena of Bonks title, Impossible Run title, The Cruel Maze +
level-name sweep). sr3 audit: original marks appear in shipped artifacts
only as storage-key slugs (`maga:boxhead:*` — recorded must-not-regress
keys), path slugs, and code comments (explicitly permitted).

## Closing fleet audit (sr3, 2026-09-23 — final committed tree)

| Gate | Command | Result |
|---|---|---|
| Hardest corpus validator | `node hardest/validate.mjs` | **114/114 exit 0** |
| Typecheck (8 workspaces) | `npm run typecheck -w @maga/<each>` | **8/8 PASS** |
| Fleet click-through | `python3 -m http.server 8123` + `node verification/evidence/sr1-hub-run.mjs` | **PASS — all 7 games boot + real-input interaction, 0 console errors, 0 non-local requests** (driver updated for sr2 title flows; refreshed evidence committed) |
| file:// hub | (same driver) | PASS — 7 cards + serve hint |
| Rights audit | grep shipped `games/`+`hardest/`+`index.html` for original marks | clean (slugs/comments/keys only) |
| External-URL audit | grep shipped artifacts for http(s) refs | none (pixi/w3 inert strings only) |

## Standing directives (from the design pack; bind all records)

Stack lock (TS+Vite, Pixi 8 external via vendored importmap; Canvas2D for
impossible/burger/sas); zero binary assets — WebAudio recipes only; art
hand-authored, no external generators; English only; integer letterbox scale;
every state machine state has an exit; read-only verification hooks must be
readable in every mode ("a probe that throws is a probe that lies"); real
input events only for verification claims.
