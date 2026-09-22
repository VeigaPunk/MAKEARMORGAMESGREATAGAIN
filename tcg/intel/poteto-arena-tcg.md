# Intel dossier — @poteto's arena game: **Thursday Arena**

**Status:** recovered & verified from primary sources (2026-09-22)
**Bottom line:** the game is real, live, and playable — but it is an **auto-battler**, not a conventional TCG. "Arena TCG" in the mission brief maps to *arena-style card battler*: cards exist (bots/items), there is no trading/collecting/deckbuilding.

## Identity & provenance

| Fact | Source | Confidence |
|---|---|---|
| Game name: **Thursday Arena** | https://thursdayarena.com/ + /rules | verified |
| Built during "Grok Bot Galaxy" company build, shipped **Day 3 — live ~12:18 CT 2026-09-17** | https://grokbot.guru/thursday-arena-playtest/ | verified |
| Builders: Lauren Tan (@poteto), Matt Palmer (@mattyp), Roshan Sadanani | grokbot.guru playtest report | verified |
| @poteto announced "our game is live!! help us play test it!" | x.com/poteto/status/2100635838363349026 (cited by grokbot.guru) | verified via secondary |
| Self-described buggy playtest; live bugfix stream | x.com/poteto/status/2100663630111084913 (cited) | verified via secondary |
| Free browser game, nothing to buy; practice vs AI w/o account; rated needs X sign-in | https://thursdayarena.com/rules | verified |
| Card catalog is machine-readable: `/api/catalog` (179 bots), `/api/items` (19 items) | fetched → `ta-catalog.json`, `ta-items.json` | verified |
| Cards are **community-authored** — each bot has `author`/`authorHandle` (poteto, lennysan, clairevo, ericzakariasson…) | `ta-catalog.json` | verified |
| X profile + broadcast: SSR readable via curl (ScoutXSurface); chat/replies login-walled; earlier "blocked" reports superseded | wave-1 lanes | verified |
| ZCODE→AMDPORRADA bridge: not installed on this host (no `zcode` binary; `~/.zcode` is data-only) | local probe | verified |
| Company name: **"Ship by Thursday"**; event "Grok Bot Galaxy" (Sep 15–17, SF + X livestream) | grokbot.guru + MusketeerGrok/Grok | verified via secondary |
| Co-builders: Matt Palmer (@mattyp), Roshan Sadanani, Eric Zakariasson | grokbot.guru, ScoutWebSearch | verified via secondary |
| @poteto = Lauren Tan — GitHub `lauren poteto`, SWE @xai-org, React compiler core team | github.com/poteto (ScoutWebSearch) | verified |
| Card roster = real Grok Bot marketplace templates; ~130 credited authors | MusketeerGrok + `ta-catalog.json` author fields | verified |
| Public APIs: `/api/catalog` (179 bots), `/api/items` (19), `/api/public/v1/leaderboard`, `/api/public/v1/matches` | fetched → `ta-*.json` | verified |
| Stream KPIs (Day 3): 4,884 practice sessions, 1,902 X sign-ins, 6,546 public matches | ScoutWebSearch citing stream DVR notes | secondary |
| `grokpot.ai` "Grok Arena" / $POT = **different, unshipped subplot — NOT this game** | ScoutWebSearch | verified distinction |
| Broadcast `1AxRnZbVpjaxl` = "Day 1: Grok Bot Galaxy Livestream" (@bot, Sep 15, 8h45m, 1.63M watched) — replay PUBLIC, HLS fetchable; Day 1 shows the pop-up-events platform, NO game | ScoutBroadcast (verified in managed Chromium + api.x.com live_video_stream endpoint) | verified |
| Game born Day 2 (broadcast `1PKqrNyvmYwGb`, codename "Cupcake", CHA/DEX/INT + rarity, Phaser, lanes) and launched Day 3 (`1YGNrbXEeazGw`) | ScoutBroadcast + Roenel notes | verified via secondary |
| X serves full SSR to anonymous curl — profile bio, tweets, broadcast pages readable; syndication tweet-result endpoint works login-free | ScoutXSurface | verified |
| @poteto bio: "Grok @Bot at @SpaceXAI… React compiler core team, prev cursor, meta, netflix" | ScoutXSurface | verified |
| poteto tweet 2026-09-22: "i might be addicted to making games now" (171 replies) — possible next game signal | ScoutXSurface | verified, content thin |
| poteto plays the game: leaderboard rank 13, rating 1221 (S3) | `ta-leaderboard.json` | verified |
| Community capture: github.com/Roenel/Grok-Bot-Galaxy-Notes (649 files, Day 1–3 notes/screenshots incl. Day-2 ruleset) | ScoutBroadcast/ScoutAdjacent | verified |
| Community tooling: VeigaPunk/pubstomper (bit-exact combat sim solver), itzjonas/thursday-arena-bot (Tampermonkey), mirrors | ScoutRepos | verified |
| Launch metrics: ~900 X sign-ins first hour; 1,600 players / ~5k matches by mid-afternoon; 2,138 players by Sep 18; bots on ladder (tetsuoai hit #1) | ScoutGrokBotCompany/ScoutXSearch | secondary |
| Event scale: 2.4M+ viewers claimed; The Howard SF; ~26 Grok Bot agents staffed the company | rasaljay.com via lanes | secondary |
| Card rarity split (2026-09-22): 70 common / 52 uncommon / 34 rare / 16 epic / 5 legendary / 2 mythic; S1 72 → S2 +9 → S3 +98 | ScoutGameArtifacts counting `ta-catalog.json` | verified |
| Bot cards derive from Grok Bot templates (CHA/DEX/INT + ability, rarity by stat total) — battle card shows ATK/HP/kit | ScoutAdjacent + catalog `sourcePet` field | verified |
| Monetization: $1-min billboard ad auction (Sep 24–Oct 1 slot); $POT Solana memecoin is community-launched, not team-attributed | ScoutAdjacent | verified distinction |
| Season cadence: S2 Sep 19, S3 Sep 20, S4 "Fusions and Relics" due ~Sep 23 | ScoutAdjacent | secondary |
## Rules model (from https://thursdayarena.com/rules — verbatim structure)

- **Match:** best-of-3 rounds. Each round = **shop phase → auto battle**. First to 2 round wins; tie → more round wins; equal → draw.
- **Team:** up to **3 bots**; bots persist between rounds with permanent stat gains; temporary boosts reset.
- **Shop:** 10 tokens/round, unspent tokens lost. 3 bot offers + 1 food. Bots cost 3–8 by rarity (Common→Mythic; Mythic cap 1/team, season 3+). Reroll 1 token; freeze offers; sell refunds 1 + fires sell-kit. Order bots left→right = fight order.
- **Food:** Apple +1/+1 permanent; Honey → summon 1/1 Drone on faint; Potato +2 ATK this round only. Honey/Potato exclusive.
- **Battle:** fully automatic. Start-of-battle kits → front bots hit each other simultaneously (damage = other's ATK) → faint kits → next bot forward. 40-exchange cap → most total HP wins → tiebreak ATK → draw.
- **Kits:** trigger×effect — Buy, Sell, Start of battle, Before attack, Faint, Knock out, friend-ahead-attacks.
- **Seat rules (S2+):** 3 random modifiers (front/mid/back) revealed one per round — Spotlight +2 ATK, Pit stop +3 HP, Warm-up +1/+1, Encore (kit×2), Hard hat (−1 dmg/hit), Hot seat (−1 HP/exchange).
- **Crews (S3+):** 5 crews (Sales/Ops/Marketing/Personal/Builders); 2-of or 3-of crew → team bonus at battle start.
- **Captains (S3+):** pick 1 of 3 at match start — fight captains (Drill/Medic) or shop captains (Banker/Scout/Chef/Recruiter).
- **Opponents:** ghost-board async ladder — you fight saved snapshots of players at your round, matched by "aim" (rating+23, ±recent-form adjustment). No real-time PvP.
- **Rating:** Elo K=32 attacker / K=16 ghost-defense (K=32 both at 1300+ top table). Seasons reset to 1000. Tiers Bronze→Grok; "SuperGrok" title = #1 at 1700+.

## Mechanics inventory (for the design diff)

| Mechanic | Thursday Arena | Notes |
|---|---|---|
| Resource | 10 tokens/round, use-it-or-lose-it | flat, no curve |
| Deck/collection | none — shop draft from shared pool | "TCG" framing is loose |
| Board | 3 slots, ordered queue | position = fight order only |
| Combat | automatic simultaneous front-pair hits | zero in-combat input |
| Decisions/round | ~3–6 shop choices + ordering | all agency in shop |
| Comeback | none structural — Bo3 reset + reroll luck | trailing player gets nothing |
| Match length | ≤3 shops + 3 auto-fights (~3–5 min) | very fast |
| Progression | Elo ladder, seasons, crews/captains/seat-rules added per season | seasonal complexity drip |
| Social | ghost boards, leaderboard, X sign-in | async-only |

## Where it's weak (our attack surface)

1. **Zero in-combat agency** — battles resolve themselves; the player watches. Depth-per-decision is capped by shop choices.
2. **No comeback mechanics** — lose round 1 and nothing helps you in round 2 except a fresh shop; no rubber-band.
3. **Flat economy** — 10 tokens every round regardless of state; no ramp, no tension between spend/save (except Banker captain).
4. **Readability debt at scale** — 179 bots × kits × crews × seat rules × captains is already a lot of hidden interactions for a 3-bot board; fights resolve too fast to parse causality.
5. **Not actually a TCG** — no deckbuilding, no hand management, no draw decisions. The "card game" audience gets a draft-shop auto-battler.

## Where it's strong (don't kid ourselves)

1. **Shipped and live** with real ladder/Elo/seasons in 3 days — and still growing (72→179 cards, S1→S3 in a week).
2. **Ghost-board async PvP** — clever zero-latency matchmaking; our prototype has no answer to this yet.
## Unverifiable / open

- Broadcast *chat* and X reply threads remain login-walled; replay video itself is public HLS.
- Whether "Cupcake" was only a codename — treated as Day-2 codename per ScoutAdjacent/ScoutBroadcast; grokbot.guru flags it as link metadata. `[INFERENCE]` resolved toward codename.
- Roadmap beyond S4 "Fusions and Relics" (~Sep 23).
- poteto's "i might be addicted to making games now" (2026-09-22) — next-game signal, no links yet.

## Sources

- https://thursdayarena.com/ · /rules · /cards · /api/catalog · /api/items · /api/public/v1/leaderboard · /api/public/v1/matches (fetched 2026-09-22; saved as `ta-*.json`)
- https://grokbot.guru/thursday-arena-playtest/ (playtest report + X status citations)
- https://ds4cc.com/speedrun/data/run-poteto-grokbot-company-2026-09-15.json (run record — board never names the game)
- Broadcasts (public replays): Day 1 https://x.com/i/broadcasts/1AxRnZbVpjaxl · Day 2 https://x.com/i/broadcasts/1PKqrNyvmYwGb · Day 3 https://x.com/i/broadcasts/1YGNrbXEeazGw
- https://github.com/Roenel/Grok-Bot-Galaxy-Notes (649-file community capture incl. Day-2 ruleset)
- https://github.com/VeigaPunk/pubstomper (operator's own bit-exact TA combat solver — usable for future head-to-head sims)
- Wave-1 lane reports: `.ufo/scopes/tcg-arena/r01/w1/` (18 lanes)
