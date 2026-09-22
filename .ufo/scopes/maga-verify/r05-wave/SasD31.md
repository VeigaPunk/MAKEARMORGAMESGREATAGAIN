# SasD31 — r05 verify: D-31 name injection (swords-and-sandals :5178)

## Verdict: FAIL (D-31 fix landed but incomplete — name payload still executes via HUD sink)

The specific renderHub change is correct and verified, but the gladiator name still reaches a
live `innerHTML` sink in `render()` (main.ts:17), so the security property "payload name must
not execute" does not hold. A second, save-reachable sink exists in `renderHub`'s `<h1>` via
`g.look`.

## Evidence

### 1. renderHub textContent fix — VERIFIED (the fix itself works)
- Source `MAGA-everything/02-code/armor-games/apps/swords-and-sandals/src/main.ts:20`:
  `renderHub()` writes `<p class="gladiator-name"></p>` via innerHTML, then
  `chrome.querySelector('.gladiator-name')!.textContent=g.name` — no HTML interpretation.
- Live: created gladiator named `<img src=x onerror=p=1>`; hub body rendered
  `<p class="gladiator-name">&lt;img src=x onerror=p=1&gt;</p>` — literal text, no element
  created, `window.__pwned`/handler never fired from this element.

### 2. DEFECT — hud.innerHTML interpolates g.name (main.ts:17) — LIVE XSS, name still executes
- `render()` runs on every screen and does:
  `hud.innerHTML=\`<span>${mode.toUpperCase()} · ${g.name||'Unnamed gladiator'}</span>...\``
- Live repro (http://localhost:5178, fresh localStorage):
  1. Create flow, spend 6 points, name = `<img src=x onerror=p=1>` (23 chars; create flow
     slices to 24 — main.ts:19 `g.name=(nameInput.value||'Unnamed Gladiator').slice(0,24)`).
  2. Click "Enter the Arena" → hub.
  3. `window.p === 1` — payload EXECUTED.
  4. `#hud` innerHTML: `<span>HUB · <img src="x" onerror="p=1"></span>` — real DOM element.
- Same payload in ARENA mode: `#hud` = `<span>ARENA · <img src="x" onerror="p=1"></span>`.
- So D-31's goal (name injection neutralized) is NOT met: the hub body is safe but the HUD
  header — visible on hub, arena, shop, complete — executes the name. Screenshot:
  `verification/evidence/r05-SasD31-hub-hud-injection.png` (broken-image glyph next to
  "HUB ·" in HUD; literal text in body below).

### 3. DEFECT — renderHub h1 interpolates g.look (main.ts:20) — XSS via crafted save
- `chrome.innerHTML=\`<h1>Hub — ${g.look}</h1>...\`` — UI path restricts look to
  Scarlet/Azure/Gold buttons, but `validSave` (main.ts:12) only checks
  `typeof g.look==='string'`.
- Live repro: set `maga:swords-and-sandals:slot` (arcade-core prefix `maga:`, storage.ts:4-16)
  to a valid save with `look:"<img src=x onerror=q=1>"` → reload → save ACCEPTED (mode=hub),
  `window.q === 1`, `<h1>Hub — <img src="x" onerror="q=1"></h1>`.
- Vector is local save tampering (single-player, no server), so severity lower than #2, but
  it is a real injection sink in current bytes.

### 4. log() sink (main.ts:14) — innerHTML but NOT name-reachable (no current exploit)
- `logEl.innerHTML=logLines.map(x=>`<div>${x}</div>`).join('')` is an innerHTML sink.
- Every `log()` argument audited: fixed strings, `opponent.name` (hardcoded opponents array,
  main.ts:10), `it.name` (hardcoded items array, main.ts:11), numbers. Gladiator name is
  never passed to `log()` — grep of all call sites confirms; dynamic test in arena with
  payload name active: log showed only "The crowd chants for Tin Can Tim." etc.,
  `logHasName: false`.
- Latent risk only: if a future change logs `g.name`, this becomes live XSS. Arena header
  `<h1>Arena: ${opponent.name}</h1>` — hardcoded, safe.

### Sink inventory (all sinks in main.ts)
| Location | Sink | Input | Exploitable via gladiator name? |
|---|---|---|---|
| :17 `render()` | `hud.innerHTML` | `g.name` | **YES — live XSS (D-41)** |
| :20 `renderHub()` | `chrome.innerHTML` | `g.look` | YES via crafted localStorage save (D-42) |
| :20 `renderHub()` | `.gladiator-name` textContent | `g.name` | No — D-31 fix, verified |
| :14 `log()` | `logEl.innerHTML` | logLines | No — name never reaches logLines (latent) |
| :21 `renderArena()` | `chrome.innerHTML` | `opponent.name` (hardcoded), `guarded` (bool) | No |
| :19 `renderCreate()` | `chrome.innerHTML` | `selectedLook` (presets only), stat numbers | No |
| :19 | `nameInput.value=g.name` | property assignment | Safe |
| :22 `renderShop()` | `chrome.innerHTML` | item names (hardcoded), numeric index | No |
| :18 `addButton()` | `button.textContent` | — | Safe |
| :27 `draw()` | canvas `fillText` | static strings | Safe (canvas inert) |

## Defects (numbered from D-41)
- **D-41 (HIGH)** `render()` main.ts:17 — `hud.innerHTML` interpolates `g.name` unescaped;
  gladiator name from the create form executes as HTML on every screen. Repro above,
  `window.p===1`. Fix: build hud spans with textContent (or escape `g.name`), mirroring the
  renderHub fix.
- **D-42 (medium)** `renderHub()` main.ts:20 interpolates `g.look` into `<h1>`; crafted
  localStorage save (validSave type-checks only) executes payload — `window.q===1` repro.
  Fix: set h1 text via textContent or restrict/escape look.
- **D-43 (low, latent)** `log()` main.ts:14 renders logLines via innerHTML; currently
  unreachable by user input (verified), but one `log(\`...${g.name}...\`)` away from XSS.
  Suggest textContent-based rendering while touching this file.

## Notes
- Create flow truncates names to 24 chars (main.ts:19) — payloads must fit; 23-char payload
  used. Truncation does not mitigate: plenty of sub-24-char payloads exist.
- Save format: `maga:swords-and-sandals:slot` (JSON, arcade-core storage.ts PREFIX `maga:`).
- Console error capture returned no entries (headless resource-load failures not surfaced);
  DOM-level proof (`window.p===1`, img element in hudHTML) is the evidence of execution.
- Tab note: my first tab (`SasD31`) was hijacked mid-test by another lane (landed on
  hardest/index.html); re-opened as `SasD31-ss-inject` and re-ran cleanly. localStorage was
  cleared afterwards; original "Probe" save was overwritten by test flow (test-only data).
- Screenshots: `verification/evidence/r05-SasD31-hub-hud-injection.png` (payload executed in
  HUD + literal text in body), `verification/evidence/r05-SasD31-arena-hud-safename.png`
  (arena HUD/header with benign name; log lines clean).
- Source path note: app lives at
  `MAGA-everything/02-code/armor-games/apps/swords-and-sandals/src/main.ts` (lane brief's
  `apps/...` path is relative to `02-code/armor-games/`).
