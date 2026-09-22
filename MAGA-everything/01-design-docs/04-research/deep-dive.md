# Make Armor Games Great Again — Deep Dive Research Pack
**Project:** Idea 001  
**Author context:** Research for João Veiga  
**Date:** 2026-09-22 (America/Sao_Paulo / BRT)  
**Method:** Web secondary sources (Wikipedia, developer posts, Armor Games, Kongregate, Molleindustria, MobyGames, Steam metadata). Exa MCP was rate-limited; WebSearch/WebFetch used as fallback.  
**Scope note:** “Play exactly as original, no Flash plugin” is the hard constraint for approach recommendations.

---

## 1. Swords and Sandals (S&S)

### Short identity
- **Creator / studio:** Oliver Joyce / Whiskeybarrel Studios (Australia)
- **Notable Flash entry:** *Swords and Sandals I: Gladiator* — Newgrounds upload **2006-09-25**; series portals 2005–~2011
- **Genre:** Turn-based arena fighter / light RPG (later entries add RTS, adventure, dungeon)
- **Armor Games entry point:** Portal host, not original publisher. Strong AG nostalgia centers on **S&S 2: Emperor’s Reign** (listed playable via Ruffle on Armor Games), not S&S 1. S&S 1 is shorter/simpler; S&S 2 is the cultural peak (“Gladiator, gladiator…” era expansions: dual weapons, magic, tournaments, Antares).

### Core mechanics loop
1. Create gladiator (look + skill point spread mapped to combat styles).
2. Enter arena → turn-based duel via radial action icons (attack / special / potion / etc.).
3. Win → gold + XP → buy weapons (smithy) / armor (armory) / unlock gear by level.
4. Progress tournaments / champions; optional save (historically paywalled on full versions).
5. Repeat with gear treadmill and boss champions.

S&S 2 adds ranged second weapon (finite ammo), spells, potions, richer tournaments.

### Feel & pacing
- Cartoon vector gladiators, snappy but turn-gated combat, slapstick hit reactions.
- Session rhythm: short fights (1–3 min) interleaved with shop/level-up downtime.
- Tone: tongue-in-cheek Roman fantasy, readable UI, “one more tournament” addiction.
- Distinct from action fighters: deliberate, menu-driven, RPG drip.

### Controls / session length
- Mouse-primary (click icons / shop UI); minimal keyboard.
- Typical session: **10–30 minutes** (a few fights + shopping); long campaigns hours with saves.
- Save/progress: multi-slot gladiator saves on full builds (S&S 2 marketed “save up to ten gladiators” on AG listing).

### Notable versions — primary target
| Version | Year | Notes |
|--------|------|-------|
| S&S I: Gladiator | 2006 | Entry / simpler loop |
| **S&S II: Emperor’s Reign (PRIMARY)** | **2007-01-07** | Peak popularity; AG Ruffle list; AS2; dual weapons + magic |
| S&S Crusader | 2007 | Strategy pivot — different genre |
| S&S III Solo Ultratus | 2008 | Heavier content |
| Classic Collection (Steam) | 2019 | Official packaged classics |
| S&S 2 Redux | 2017+ | AIR/Starling remake — not “original Flash” |

**Primary target: Swords and Sandals 2: Emperor’s Reign (2007 Flash)**  
Why: highest nostalgia punch on AG-era portals, already Ruffle-listed on Armor Games, AS2-era codebase Joyce himself described, richer than S&S 1 without Crusader’s genre shift.

### Technical shape (original)
- **Language:** ActionScript **2** (Joyce: Redux rebuild because original was AS2 ~10 years old).
- **Art:** Predominantly **vector** Flash cartoon characters/UI; particle combat flourishes.
- **Multiplayer:** Mainline arena = single-player; Multiplae Ultratus existed separately — out of scope for primary.
- **Save:** Local SharedObject / portal save patterns; full versions unlock anytime-save.
- **Runtime:** Classic AVM1 SWF; Redux later used AIR + Starling (AS3/GPU) — different artifact.

### Legal / IP (uncertainty flagged)
- Joyce stated he **lost brand rights** at an early employer, later regained ability to remake via **eGames.com LLC** purchasing series rights; co-credits on Redux/mobile (“© eGames.com LLC and Whiskeybarrel Studios”).
- **Likely current commercial owners:** eGames.com LLC (publisher/rights) + Whiskeybarrel (creative/dev). Flag: chain includes older names (Fizzy, 3rd SENSE) in fan discussion — **verify before shipping**.
- Armor Games was a **host/distributor**, not IP owner.

### Revival difficulty: **4 / 5**
Why: Deep combat formulas, gear trees, UI states, save schema; active commercial remakes raise licensing friction; fidelity sensitive (combat “feel” + economy balance). Emulation path lowers engine risk but not IP risk.

---

## 2. The McDonald’s Game (Molleindustria)

### Short identity
- **Creator:** **Molleindustria** (Italy; Paolo Pedercini) — user alias “Molaleandro” maps to this studio, not a separate entity.
- **Also known as:** *The McDonald’s Videogame* / anti-advergame; portal-safe variant **Burger Tycoon**.
- **Year:** Italian late **2005**; English **~2006-02-01** (Wikipedia); millions of portal plays.
- **Genre:** Satirical tycoon / newsgame / procedural rhetoric simulation.
- **Not** an Armor Games exclusive; cultural Flash-era staple on many portals.

### Core mechanics loop
1. Four simultaneous management panes: **farmland → feedlot/slaughterhouse → restaurant → HQ**.
2. Push throughput (soy/cattle/burgers/marketing) under board pressure for profit.
3. “Dirty” options (deforest, GMO feed, cattle cannibalism, bribes, PR) raise short-term profit and long-term backlash (activist/media/mad-cow risk).
4. Balance ethics vs. survival; no clean “win” — the system teaches unsustainability.
5. Failure states when cash/reputation collapse.

### Feel & pacing
- Deadpan corporate UI parody; low poly / flat Flash illustration.
- Real-time pressure across panes → frantic multi-panel attention, not twitch combat.
- Humor is structural (you *must* do harm to meet targets), not joke-text dump.
- Sessions feel like running a doomed spreadsheet with cartoons.

### Controls / session length
- Mouse: click panes, buttons, map actions.
- Session: **15–40 minutes** typical; can run longer.
- Save: generally session-based / light persistence (not deep RPG saves).

### Notable versions — primary target
| Version | Notes |
|--------|-------|
| **The McDonald’s Videogame (PRIMARY for authenticity)** | Branded satire; Macromedia Flash 7 |
| **Burger Tycoon (PRIMARY for legal-safe ship)** | Same systems; McD marks removed (bear ≠ Ronald); used on Kongregate etc. |
| 2019 HTML5/web rehost | Improved English; Molleindustria site |

**Primary target for revival MVP: Burger Tycoon (mechanics-identical, marks-scrubbed)**, with McDonald’s-branded SWF as authenticity reference only.  
Why: preserves “play exactly as original” systems while avoiding McDonald’s trademark/mascot exposure.

### Technical shape
- **Engine:** Macromedia **Flash 7** → almost certainly **AS1/AS2 (AVM1)**.
- **Art:** 2D bitmap/vector hybrid illustration; multi-panel UI.
- **Multiplayer:** None.
- **Save:** Minimal.
- **License note:** Molleindustria site: “licensed under a Creative Commons license” (exact deed **not verified** in this pass — treat as **CC family, likely NC**; confirm deed before redistribute/modify).

### Legal / IP
- **Game code/art:** Molleindustria; Creative Commons claim on official page (**uncertainty: exact CC variant**).
- **Trademarks:** McDonald’s Corp. marks in branded build — McDonald’s publicly disavowed association. **Branded redistribution = trademark risk**.
- Burger Tycoon path designed by creators to reduce IP infringement.

### Revival difficulty: **2 / 5**
Why: Modest systems complexity vs. S&S/Boxhead; AVM1-friendly; no MP. Difficulty spikes only if targeting branded assets without clearance.

---

## 3. The Impossible Game (FlukeDude)

### Short identity
- **Creator / publisher:** FlukeDude → **Fluke Games**; PC ports also Grip Games.
- **Notable version:** Xbox Live Indie Games **2009**; iOS/Android ~2010–11; Steam/PC **2014**.
- **Genre:** One-button precision platformer / music-synced runner (cube over spikes/gaps).
- **Flash relation:** Browser **“Impossible Game Lite”** (Newgrounds, FlukeDude, **2010-05-01**) — demo slice (~Fire Aura), not the full commercial game. Genre-adjacent to *Meat Boy* / *Super Meat Boy* (precision death-loop) but **separate IP** (Team Meat ≠ Fluke).

### Core mechanics loop
1. Auto-run cube; single input = jump (tap/click/button).
2. Memorize spike/gap/rhythm patterns; die → restart (normal mode: full level restart).
3. Practice mode: place checkpoint flags.
4. Beat level → medal variants; five classic levels (Fire Aura, Original, Chaoz Fantasy, Heaven, Phazd).
5. Optional level editor (PC).

### Feel & pacing
- Minimalist geometry, harsh fail-fast, music-locked timing.
- “One more try” micro-sessions; mastery is muscle memory + pattern recall.
- Aesthetic: flat colored cube, stark obstacles — readability over spectacle.

### Controls / session length
- One button / click / tap.
- Sessions: **2–15 minutes** bursts; full clears much longer for novices.
- Progress: level unlocks / medals; practice checkpoints.

### Notable versions — primary target
| Version | Platform | Notes |
|--------|----------|-------|
| XBLIG full | 360, 2009 | Canonical full game |
| Impossible Game Lite | Newgrounds Flash, 2010 | Short SWF demo |
| Mobile / Steam | 2010–2014 | Commercial ports + editor |

**Primary target for Flash-revival swarm: Impossible Game Lite (2010 SWF)** as playable exact artifact; full five-level experience requires licensed port or recreation of XBLIG/Steam design.  
Why: Only genuine Flash SWF under constraint; tiny surface area for EMULATE MVP. Flag: nostalgia audience often means the **full** game — Lite alone under-delivers.

### Technical shape
- **Lite:** Browser Flash SWF (AVM1-era likely); click-to-jump; short level then upsell.
- **Full:** Native console/mobile/PC — **not Flash**.
- **Art:** Simple bitmaps/vectors; music sync critical to feel.
- **MP / save:** Single-player; local progress / medals.

### Legal / IP
- **Owner:** Fluke Games (FlukeDude). Active sequel *The Impossible Game 2* (2022).
- No evidence Armor Games owned IP. **Commercial license required** for full game revival.

### Revival difficulty: **3 / 5** (Lite emulate = **1–2**; full exact recreate = **3–4**)
Why: Mechanics simple but timing/audio sync fidelity is unforgiving; full game isn’t a Flash binary.

---

## 4. Boxhead (Sean Cooper)

### Short identity
- **Creator:** Sean Cooper; early titles sponsored/published via **Crazy Monkey Games**; hosted on Newgrounds, Kongregate, **Armor Games**.
- **Genre:** Top-down twin-stick-ish / keyboard zombie survival shooter (blocky “box” characters).
- **Clarify numbering / multiplayer:**

| Order | Title | Approx. date | Notes |
|------|-------|--------------|-------|
| 1 | Boxhead: A Halloween Special | 2006-10 | Origin |
| 2 | Boxhead: The Rooms | 2006-12 | Arena rooms |
| 3 | Boxhead: More Rooms | 2007-02 | More arenas |
| 4 | **Boxhead: 2Play Rooms** | **2007-05** | Local 2P co-op + deathmatch |
| 5 | Boxhead: The Zombie Wars | 2008-03 | Base build + turrets |

**Multiplayer clarification (important):** 2Play / Zombie Wars co-op is **local shared-screen / shared-keyboard**, **not networked LAN**. Later Steam *BOXHEAD: Immortal* (Fire Source Studio + Sean Cooper credits) advertises P2P LAN — different product generation.

### Core mechanics loop (2Play / Rooms family)
1. Pick room/arena + mode (solo / co-op / deathmatch on 2Play).
2. Survive waves of zombies (+ “devils” / specials); pick up ammo crates; use explosive barrels.
3. Score multiplier from kill streaks → unlock/upgrade weapons (pistol → shotgun → uzi → grenades, etc.).
4. Die → end run; chase wave count / high score.
5. Zombie Wars adds: construct turrets/barricades, keep base online.

### Feel & pacing
- Chunky low-fi squares, chaotic swarm density, arcade score chasing.
- Co-op on one keyboard = social chaos (the nostalgia hook).
- Pacing: escalating wave pressure; short “just one more wave” loops.

### Controls / session length
- Keyboard WASD/arrows + shoot keys (user-definable on 2Play for both players).
- Session: **5–20 minutes** per run; marathon high-score sessions longer.
- Save: high scores / unlocks by score; not deep campaign saves (Zombie Wars has more structure).

### Notable versions — primary target
**Primary target: Boxhead: 2Play Rooms (2007)**  
Why: Armor Games catalog title; Ruffle-listed on AG; unique local-2P demoability for a swarm MVP; retains classic Rooms formula with social hook. Alternate authenticity pick: *The Rooms* (simpler solo). *Zombie Wars* if wanting base-defense differentiation (also AG Ruffle-listed).

### Technical shape
- Flash browser SWFs (mid-2000s → likely **AS2/AVM1**).
- **Art:** Bitmap/blocky sprites more than fancy vectors.
- **MP needs:** Two keyboard maps, shared camera; **no netcode** for originals.
- **Save:** Local scores; light SharedObject patterns typical.

### Legal / IP
- Creator credit: **Sean Cooper**.
- Historical sponsorship: Crazy Monkey Games.
- Modern: *BOXHEAD: Immortal* credits Fire Source Studio + Cooper — suggests ongoing commercial interest.
- **Uncertainty:** Exact ownership split Cooper / Crazy Monkey / Fire Source — **must clear before commercial ship**. AG = host, not owner.

### Revival difficulty: **3 / 5**
Why: Wave AI, weapon unlock curves, dual-keyboard input; MP is local-only (simpler than netcode). Emulation already validated on AG for several entries.

---

## 5. Chicken Invaders (InterAction Studios)

### Short identity
- **Creator / studio:** Konstantinos Prouskas / **InterAction studios** (Greece).
- **Genre:** Humorous vertical/fixed shoot-’em-up (Galaxian / Space Invaders parody with chickens).
- **Series numbering (main):**
  1. **Chicken Invaders** (DX) — **1999-07-24** (DOS prototype 1997 unreleased)
  2. **The Next Wave** — **2002-12-22** (+ Christmas 2003)
  3. **Revenge of the Yolk** — Christmas **2006** / regular **2007-01** (4P co-op)
  4. **Ultimate Omelette** — **2010**
  5. **Cluck of the Dark Side** — **2014**
  + **Universe** (MMO-ish, 2018 EA → 2022+) and Episode remasters (2023–2025)

### Flash / Armor Games reality check
- Official series = **native Windows (UveDX / custom engines)**, later Mac/Linux/mobile — **not Adobe Flash**.
- Kongregate “Chicken Invaders” by user **hopslop** (2008) is a **fan-like / unofficial Flash clone**, not InterAction’s binary.
- Relevance to “Armor Games Flash revival” is **thematic/era nostalgia**, not a recoverable AG Flash master.

### Core mechanics loop (CI2/CI3 peak era)
1. Pilot ship; dodge egg projectiles; shoot chicken formations / bosses.
2. Collect gift parcels → cycle/upgrade weapons; drumsticks/roasts → missiles.
3. Clear 10 waves per chapter → boss → next system (CI2: Pluto→Sun arc).
4. CI3+: overheat gun, unlock modifiers, more weapons, up to 4P local co-op.
5. Holiday editions reskin audio/art.

### Feel & pacing
- Bright 3D-rendered sprites, orchestral/campy humor, readable bullet patterns.
- Mid-length stages; “arcade campaign” rather than endless CI1.
- Identity = chicken gag + solid shmup fundamentals.

### Controls / session length
- Keyboard / mouse / gamepad (original CI1 keyboard-only).
- Session: **20–60+ minutes** per chapter stretch; full campaigns multi-hour.
- Progress: chapter unlocks; remasters added save features.

### Notable versions — primary target
**Primary target for “era authenticity”: Chicken Invaders 2: The Next Wave (2002) or CI3 Revenge of the Yolk (2006/7)**  
Why: CI2 defines the series formula; CI3 aligns with mid-2000s portal era and co-op spectacle. Prefer **CI2** if fidelity/scope for recreation must stay smaller.

**Not a Flash SWF target.** Any “exact original” path is desktop binary wrapping / licensed remaster, not Ruffle.

### Technical shape
- Proprietary **UveDX**-family engines; 3D-rendered 2D sprites; local co-op input.
- Not AS2/AS3. Remasters / Episode 1 (2025 Steam) use newer engines.
- Save: remasters improved; originals varied.

### Legal / IP
- **Clear owner:** InterAction studios / Prouskas — **actively commercial** (Steam, Universe, Episode remasters, announced console collection ~2026).
- Fan Flash clones = infringement risk if redistributed as “Chicken Invaders.”

### Revival difficulty: **5 / 5** (under Flash-exact constraint) / **4 / 5** (licensed desktop wrap)
Why: Wrong runtime for Ruffle; full recreate of art/audio/wave scripts is large; legal needs publisher deal. Emulating a fan SWF fails “exact as original.”

---

## Comparison: Emulation (Ruffle / SWF wrapper) vs Full Recreation

Constraint: **no Flash plugin**, **play exactly as original**.

### Swords and Sandals 2
| Approach | Trade-offs |
|----------|------------|
| **EMULATE (recommended default)** | + AG already lists S&S2 on Ruffle; preserves AS2 combat/economy. − SharedObject/save quirks; UI scale on modern displays; IP still blocks unauthorized public ship. |
| HYBRID | + Fix saves/UI chrome around emulated core. − Two stacks to maintain; still need SWF rights. |
| RECREATE | + Modern engine, mobile-ready. − High fidelity risk on combat formulas; duplicates existing Redux/commercial products; slowest. |

**Recommend: EMULATE** (with license), else don’t ship.

### McDonald’s / Burger Tycoon
| Approach | Trade-offs |
|----------|------------|
| **EMULATE** | + Flash 7 / AVM1 sweet spot for Ruffle; tiny surface. − Trademark if branded SWF; confirm CC deed for hosting. |
| HYBRID | + Swap marks → Burger Tycoon assets if needed. − Asset surgery may break “exact.” |
| RECREATE | + Clean HTML5; easy analytics. − Procedural satire balance easy to “fix”; higher effort for little gain if SWF works. |

**Recommend: EMULATE** Burger Tycoon SWF (or branded only with dual legal OK).

### The Impossible Game
| Approach | Trade-offs |
|----------|------------|
| EMULATE Lite | + True SWF path; instant. − Incomplete product vs audience memory. |
| HYBRID | + Emulate Lite shell + recreate missing levels. − Still not “exact full original.” |
| **RECREATE (for full-game promise)** | + Matches XBLIG/Steam expectation. − Timing/audio sync risk; needs Fluke license; not Flash-original binary. |

**Recommend: EMULATE** for Lite spike; **RECREATE** (licensed) if shipping “the Impossible Game” as remembered.

### Boxhead (2Play Rooms)
| Approach | Trade-offs |
|----------|------------|
| **EMULATE** | + Multiple Boxhead titles already on AG Ruffle lists; preserves wave feel/weapons. − Keyboard mapping / focus quirks in browser; local 2P needs clear control overlay. |
| HYBRID | + Add gamepad / rebind UI / stretch-safe canvas. − Drift from exact if input layer changes frame timing. |
| RECREATE | + Netcode option later. − Overkill for MVP; art/AI/balance rewrite risk. |

**Recommend: EMULATE** (primary); HYBRID only for input/UX chrome.

### Chicken Invaders
| Approach | Trade-offs |
|----------|------------|
| EMULATE | − No official SWF; fan SWFs ≠ original. Fails constraint. |
| HYBRID | − Misleading if wrapping fan content. |
| **RECREATE / licensed remaster wrap** | + Only honest path. − Highest cost; InterAction already sells remasters — partnership or skip. |

**Recommend: RECREATE** only under license (or **defer** from Flash swarm).

---

## Recommended first ship for swarm MVP

### Winner: **Boxhead: 2Play Rooms** (`boxhead-2play`)

| Criterion | Assessment |
|-----------|------------|
| Ship speed | High — Ruffle path proven on Armor Games; SWF-sized scope |
| Fidelity risk | Low under EMULATE |
| Nostalgia punch | High on AG (catalog title + co-op memories) |
| Legal risk | Medium — clear creator, but clear rights with Cooper/Crazy Monkey/Fire Source before monetize |
| Technical risk | Low–medium — local 2P input is the main browser gotcha |
| Demoability | **Best-in-set** — two players on one keyboard in 30 seconds |

### Why not others (short)
- **S&S2:** Stronger single-player brand, but heavier systems + active eGames commercial line → slower/safer-legal path.
- **McDonald’s:** Fastest legal-ish CC/AVM1 candidate, but weaker *Armor Games catalog* identity; branded version is trademark landmine.
- **Impossible Lite:** Fastest binary, weak “full game” nostalgia; full game isn’t Flash.
- **Chicken Invaders:** Fails Flash-exact premise without a publisher deal.

### Follow-up order (suggested)
1. Boxhead 2Play (MVP)  
2. Burger Tycoon (CC spike / press story)  
3. S&S2 (license negotiation parallel track)  
4. Impossible (Lite spike or Fluke deal)  
5. Chicken Invaders (partner-only / out of Flash swarm)

---

## Sources (selected)
- Wikipedia: Swords and Sandals; McDonald’s Video Game; The Impossible Game; Chicken Invaders  
- Oliver Joyce / Indie Game Buzz — S&S2 Redux AS2→AIR notes; eGames rights narrative  
- Molleindustria official McDonald’s page (CC claim; 2019 notes)  
- Armor Games: S&S2, Boxhead listings; “Flash Games Playable Using Ruffle” index  
- Kongregate: Boxhead 2Play / Zombie Wars; hopslop Chicken Invaders (unofficial)  
- Newgrounds: Impossible Game Lite  
- InterAction studios site / series wikis  
- Ruffle compatibility (AVM1 vs AVM2)  
- Steam/MobyGames metadata for Boxhead Immortal / S&S Classic Collection  

**Uncertainty flags preserved in-line; treat IP conclusions as research leads, not legal advice.**
