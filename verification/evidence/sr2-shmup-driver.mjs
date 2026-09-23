#!/usr/bin/env node
/**
 * sr2-shmup-driver.mjs — zero-dependency CDP driver for the shmup twin-pack
 * SHIP-CANDIDATE proof (built games served over http, ports per lane).
 * Real input only: Input.dispatchKeyEvent / dispatchMouseEvent /
 * dispatchTouchEvent. State reads via the app's own ?debug → window.__maga.
 *
 * usage: node sr2-shmup-driver.mjs <scenario> <url> <logfile> <evidenceDir> [--append]
 * scenarios: types | fullclear | gameover | settings | audio | touch | pause
 */
import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const [scenario, url, logFile, evidenceDir, ...rest] = process.argv.slice(2);
if (!scenario || !url || !logFile || !evidenceDir) {
  console.error('usage: node sr2-shmup-driver.mjs <scenario> <url> <logfile> <evidenceDir> [--append]');
  process.exit(2);
}
mkdirSync(evidenceDir, { recursive: true });
if (!rest.includes('--append')) writeFileSync(logFile, '');

let lineBuf = '';
function log(line) {
  const stamp = new Date().toISOString().slice(11, 19);
  const out = `[${stamp}] ${line}`;
  console.log(out);
  appendFileSync(logFile, out + '\n');
}

// ---------------------------------------------------------------- CDP client
class CDP {
  constructor() { this.id = 0; this.pending = new Map(); this.handlers = new Map(); }
  async connect(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => {
      this.ws.addEventListener('open', res, { once: true });
      this.ws.addEventListener('error', (e) => rej(new Error('ws error: ' + (e.message || ''))), { once: true });
    });
    this.ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id !== undefined && this.pending.has(m.id)) {
        const { res, rej } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? rej(new Error(m.error.message)) : res(m.result);
      } else if (m.method && this.handlers.has(m.method)) {
        this.handlers.get(m.method).forEach((fn) => fn(m.params));
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }
  close() { try { this.ws.close(); } catch { /* noop */ } }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- chromium
const CHROMIUM = process.env.CHROMIUM_BIN || '/usr/bin/chromium';
const cdpPort = 9501 + (process.pid % 180);
const profileDir = mkdtempSync(path.join(tmpdir(), 'sr2-shmup-prof-'));

const chrome = spawn(CHROMIUM, [
  '--headless=new',
  `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${profileDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--mute-audio',
  '--autoplay-policy=no-user-gesture-required',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--window-size=1152,648',
  'about:blank',
], { stdio: 'ignore' });

async function killChrome() {
  try { chrome.kill('SIGKILL'); } catch { /* noop */ }
  try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* noop */ }
}
process.on('exit', () => { try { chrome.kill('SIGKILL'); } catch { /* noop */ } });

async function waitEndpoint() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      if (r.ok) return;
    } catch { /* not up yet */ }
    await sleep(100);
  }
  throw new Error('chromium devtools endpoint never came up');
}

// ---------------------------------------------------------------- input
const KEYS = {
  ArrowLeft: { key: 'ArrowLeft', vkey: 37 },
  ArrowRight: { key: 'ArrowRight', vkey: 39 },
  ArrowUp: { key: 'ArrowUp', vkey: 38 },
  ArrowDown: { key: 'ArrowDown', vkey: 40 },
  Space: { key: ' ', vkey: 32 },
  KeyZ: { key: 'z', vkey: 90 },
  KeyX: { key: 'x', vkey: 88 },
  Enter: { key: 'Enter', vkey: 13 },
  KeyR: { key: 'r', vkey: 82 },
  Digit1: { key: '1', vkey: 49 },
  Digit2: { key: '2', vkey: 50 },
  Escape: { key: 'Escape', vkey: 27 },
};

let cdp;
async function key(code, down) {
  const k = KEYS[code];
  await cdp.send('Input.dispatchKeyEvent', {
    type: down ? 'keyDown' : 'keyUp',
    code,
    key: k.key,
    windowsVirtualKeyCode: k.vkey,
    nativeVirtualKeyCode: k.vkey,
  });
}
async function tap(code, holdMs = 60) { await key(code, true); await sleep(holdMs); await key(code, false); }

/** stage-space → client px transform (letterboxed canvas) */
async function stageRect() {
  return JSON.parse(await evl(`JSON.stringify(document.querySelector('canvas').getBoundingClientRect().toJSON())`));
}
async function toClient(sx, sy) {
  const rect = await stageRect();
  const s = rect.width / 960;
  return { x: rect.left + sx * s, y: rect.top + sy * s, s };
}
/** real mouse click at stage coords */
async function clickStage(sx, sy) {
  const { x, y } = await toClient(sx, sy);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

// touch input (layout A twin-thumb / layout B one-thumb smoke)
async function touch(type, points) {
  await cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: points.map((p, i) => ({ x: p.x, y: p.y, id: p.id ?? i })),
  });
}
async function touchStage(type, sPoints) {
  const all = [];
  for (const sp of sPoints) all.push(await toClient(sp.x, sp.y));
  await touch(type, all.map((p, i) => ({ x: p.x, y: p.y, id: sPoints[i].id ?? i })));
}

class Mover {
  constructor() { this.held = null; }
  async set(dir) {
    if (dir === this.held) return;
    if (this.held) await key(this.held, false);
    if (dir) await key(dir, true);
    this.held = dir;
  }
  async stop() { await this.set(null); }
}

// ---------------------------------------------------------------- state reads
async function evl(expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('page eval failed: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}
async function probe() {
  return JSON.parse(await evl(`JSON.stringify({
    s: window.__maga ? window.__maga.state : null,
    e: window.__maga ? window.__maga.sim.eggs : null,
    w: window.__maga ? window.__maga.sim.waveT : null,
    voices: window.__maga ? window.__maga.sfx.voices : null,
    running: window.__maga ? window.__maga.sfx.running : null,
    musicVol: window.__maga ? window.__maga.sfx.musicVolume : null,
    sfxVol: window.__maga ? window.__maga.sfx.sfxVolume : null,
    muted: window.__maga ? window.__maga.sfx.muted : null,
    ls: localStorage.getItem('maga:chicken-invaders:chapter-unlocked'),
    lsc: localStorage.getItem('maga:chicken-invaders-original:chapter-unlocked'),
    lsa: localStorage.getItem('maga:chicken-invaders:audio'),
    lsac: localStorage.getItem('maga:chicken-invaders-original:audio'),
  })`));
}
async function probeFull() {
  const p = await probe();
  p.ch = JSON.parse(await evl(`JSON.stringify(window.__maga.sim.chickens.map(c => ({x:c.x,y:c.y,hp:c.hp,type:c.type,dive:c.dive,dvx:c.dvx,dvy:c.dvy})))`));
  return p;
}
async function shot(name) {
  const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(r.data, 'base64');
  writeFileSync(path.join(evidenceDir, name), buf);
  log(`screenshot -> ${name} (${Math.round(buf.length / 1024)}KB)`);
}

// ---------------------------------------------------------------- play AI
/** spacetime dodge: compare each threat's impact x against the ship's own
 *  predicted x at that time for each candidate direction; between threats,
 *  orbit (direction persistence) with wall flips + weak target pull */
function shipXAt(shipX, dir, t) {
  if (!dir) return shipX;
  const room = dir > 0 ? 930 - shipX : shipX - 30;
  return shipX + dir * Math.min(380 * t, room);
}
function bestDir(shipX, shipY, eggs, chickens, targetX, curDir) {
  const threats = [];
  for (const e of eggs || []) {
    if (e.vy <= 0) continue;
    const t = (shipY - e.y) / e.vy;
    if (t < 0 || t > 2.6) continue;
    threats.push({ t, xAt: e.x + e.vx * t, margin: 44 });
  }
  for (const c of chickens || []) {
    if (!c.dive || c.y < 140) continue;
    const t = (shipY - c.y) / Math.max(80, c.dvy || 200);
    if (t < 0 || t > 2.6) continue;
    threats.push({ t, xAt: c.x + (c.dvx || 0) * t, margin: 56 });
  }
  let base = curDir || 1;
  if (shipX < 110 && base < 0) base = 1;
  if (shipX > 850 && base > 0) base = -1;
  if (targetX !== null && targetX !== undefined && !curDir && Math.abs(targetX - shipX) > 120) base = Math.sign(targetX - shipX);
  let best = base, bestScore = -Infinity;
  for (const d of [base, -base, 0]) {
    let margin = Infinity;
    for (const th of threats) {
      const m = Math.abs(th.xAt - shipXAt(shipX, d, th.t)) - th.margin;
      if (m < margin) margin = m;
    }
    // threats close: pure dodge. Target-column alignment only in genuine
    // lulls (no threats at all) — never weave through aimed fire chasing
    // the oscillating boss; a parked ship dodges volleys and lets the
    // boss cross its bullet stream.
    let score;
    if (margin < 55) score = margin;
    else {
      score = 60 + margin * 0.1;
      if (targetX !== null && targetX !== undefined && !threats.length) score -= Math.abs(targetX - shipXAt(shipX, d, 1.2)) * 0.15;
    }
    if (d === 0 && threats.length) score -= 40; // never freeze under fire
    if (d !== base) score -= 8;                 // orbit continuity bias
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}
const DIRKEY = { [-1]: 'ArrowLeft', 0: null, 1: 'ArrowRight' };
function pickTarget(s) {
  const st = s.s;
  // boss fights: park near center — the boss oscillates through the bullet
  // stream; chasing it through aimed volleys is what killed earlier AIs
  if (st.bossHp !== null && st.bossHp !== undefined) return 480;
  for (const p of st.pickups || []) {
    if (p.kind === 'gift' && Math.abs(p.x - st.shipX) < 190 && p.y > 100 && p.y < st.shipY - 30) return p.x;
  }
  const cs = st.chickens || [];
  if (!cs.length) return null;
  const maxY = Math.max(...cs.map((c) => c.y));
  const low = cs.filter((c) => c.y > maxY - 40);
  return low.reduce((a, c) => a + c.x, 0) / low.length;
}

// ---------------------------------------------------------------- scenarios
async function bootApp(urlOverride) {
  await waitEndpoint();
  const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target');
  cdp = new CDP();
  await cdp.connect(page.webSocketDebuggerUrl);

  let consoleErrors = 0;
  const requests = [];
  let lastErr = '';
  cdp.on('Runtime.exceptionThrown', (p) => {
    consoleErrors++;
    lastErr = p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || 'exception';
    log(`PAGE EXCEPTION: ${lastErr}`);
  });
  cdp.on('Runtime.consoleAPICalled', (p) => {
    if (p.type === 'error') {
      const text = (p.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
      if (/favicon/i.test(text)) return;
      consoleErrors++;
      lastErr = text;
      log(`PAGE CONSOLE ERROR: ${text}`);
    }
  });
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Network.enable');
  const isLocal = (u) => /^(https?:\/\/(127\.0\.0\.1|localhost)|data:|blob:|about:)/.test(u);
  cdp.on('Network.requestWillBeSent', (p) => {
    requests.push(p.request.url);
    if (!isLocal(p.request.url)) log(`NON-LOCAL REQUEST: ${p.request.url}`);
  });

  await cdp.send('Page.navigate', { url: urlOverride || url });
  for (let i = 0; i < 80; i++) {
    try { if (await evl('!!window.__maga')) break; } catch { /* not ready */ }
    await sleep(250);
  }
  const up = await evl('!!window.__maga');
  if (!up) throw new Error('window.__maga never appeared (app failed to boot)');
  await sleep(400);
  const s0 = await probe();
  log(`BOOT OK: mode=${s0.s.mode} pack=${s0.s.pack} unlocked=${s0.s.unlocked} lives=${s0.s.lives} ls=${s0.ls ?? s0.lsc}`);
  const nonLocal = requests.filter((u) => !isLocal(u));
  return { consoleErrors: () => consoleErrors, lastErr: () => lastErr, nonLocal: () => nonLocal };
}

async function startChapter(ch) {
  if (ch === 2) await clickStage(545, 300); // CH 2 button
  await clickStage(480, 352); // START button
  await sleep(150);
  const s = await probe();
  log(`REAL CLICK (START ch${ch}): mode=${s.s.mode} chapter=${s.s.chapter} wave=${s.s.wave}/${s.s.wavesTotal} lives=${s.s.lives} weapon=${s.s.weaponName}`);
  return s;
}

// ---- types: per-type behavioral proof (replica wave 1 regression) ----
async function scenarioTypes() {
  const env = await bootApp();
  await startChapter(1);
  for (let i = 0; i < 100; i++) {
    const settled = await evl('window.__maga.sim.chickens.length > 0 && window.__maga.sim.chickens.every(c => !c.enter)');
    if (settled) break;
    await sleep(100);
  }
  log('formation settled — sampling 100× @100ms for per-type motion fit');
  await sleep(1200);
  const series = new Map();
  for (let n = 0; n < 100; n++) {
    const cs = JSON.parse(await evl(`JSON.stringify(window.__maga.sim.chickens.map(c => ({x:c.x,y:c.y,hp:c.hp,type:c.type,dive:c.dive,enter:c.enter})))`));
    const t = await evl('window.__maga.sim.waveT');
    cs.forEach((c, i) => {
      if (c.enter || c.dive) return;
      if (!series.has(i)) series.set(i, []);
      series.get(i).push({ t, x: c.x, y: c.y, hp: c.hp, type: c.type });
    });
    await sleep(100);
  }
  const byType = new Map();
  for (const [, pts] of series) {
    if (pts.length < 20) continue;
    let best = { sse: Infinity, w: 0 };
    for (let w = 0.30; w <= 1.30; w += 0.005) {
      let sS = 0, sC = 0, sSS = 0, sSC = 0, sCC = 0, sX = 0, sXS = 0, sXC = 0;
      for (const p of pts) {
        const sn = Math.sin(w * p.t), csn = Math.cos(w * p.t);
        sS += sn; sC += csn; sSS += sn * sn; sSC += sn * csn; sCC += csn * csn;
        sX += p.x; sXS += p.x * sn; sXC += p.x * csn;
      }
      const n = pts.length;
      const A = [[n, sS, sC], [sS, sSS, sSC], [sC, sSC, sCC]];
      const b = [sX, sXS, sXC];
      let ok = true;
      for (let col = 0; col < 3; col++) {
        let piv = col;
        for (let r2 = col + 1; r2 < 3; r2++) if (Math.abs(A[r2][col]) > Math.abs(A[piv][col])) piv = r2;
        if (Math.abs(A[piv][col]) < 1e-9) { ok = false; break; }
        [A[col], A[piv]] = [A[piv], A[col]];
        [b[col], b[piv]] = [b[piv], b[col]];
        for (let r2 = col + 1; r2 < 3; r2++) {
          const f = A[r2][col] / A[col][col];
          for (let k = col; k < 3; k++) A[r2][k] -= f * A[col][k];
          b[r2] -= f * b[col];
        }
      }
      if (!ok) continue;
      const x3 = new Array(3).fill(0);
      for (let r2 = 2; r2 >= 0; r2--) {
        let sum = b[r2];
        for (let k = r2 + 1; k < 3; k++) sum -= A[r2][k] * x3[k];
        x3[r2] = sum / A[r2][r2];
      }
      let sse = 0;
      for (const p of pts) {
        const pred = x3[0] + x3[1] * Math.sin(w * p.t) + x3[2] * Math.cos(w * p.t);
        sse += (p.x - pred) ** 2;
      }
      if (sse < best.sse) best = { sse, w };
    }
    const type = pts[0].type;
    if (!byType.has(type)) byType.set(type, { omegas: [], hps: [] });
    byType.get(type).omegas.push(best.w);
    byType.get(type).hps.push(Math.max(...pts.map((p) => p.hp)));
  }
  const NAMES = ['CHICKEN', 'CHICKEN SCOUT', 'CHICKEN ACE'];
  const EXP = { 0: 0.7, 1: 0.805, 2: 0.595 };
  let pass = true;
  for (const [type, d] of [...byType.entries()].sort((a, b) => a[0] - b[0])) {
    const wMean = d.omegas.reduce((a, c) => a + c, 0) / d.omegas.length;
    const exp = EXP[type];
    const ok = Math.abs(wMean - exp) < 0.03 && d.omegas.length >= 2;
    if (!ok) pass = false;
    log(`TYPE ${type} ${NAMES[type]}: n=${d.omegas.length} omega=${wMean.toFixed(3)} (expected ${exp.toFixed(3)}) hp@spawn=${[...new Set(d.hps)].join('/')} -> ${ok ? 'DISTINCT' : 'MISMATCH'}`);
  }
  // descent clamp proof: no chicken in a straight-pattern wave settles below the floor
  const maxY = await evl('Math.max(0, ...window.__maga.sim.chickens.map(c => c.y))');
  const clampOk = maxY <= 301;
  log(`DESCENT CLAMP: max chicken y=${maxY.toFixed(1)} (floor 300) -> ${clampOk ? 'CLAMPED' : 'VIOLATED'}`);
  if (!clampOk) pass = false;
  log(`console errors: ${env.consoleErrors()}`);
  log(`TYPES REGRESSION: ${pass && env.consoleErrors() === 0 ? 'PASS' : 'FAIL'}`);
  return pass && env.consoleErrors() === 0;
}

// ---- fullclear: both chapters + both bosses -> win, unlock persist ----
async function scenarioFullclear() {
  const env = await bootApp();
  const pack = url.includes('cluck') ? 'cluck' : 'replica';
  await startChapter(1);
  // let the formation fly in and combat start before the art-in-action shot
  for (let i = 0; i < 60; i++) {
    const settled = await evl('window.__maga.sim.chickens.length > 0 && window.__maga.sim.chickens.every(c => !c.enter)');
    if (settled) break;
    await sleep(100);
  }
  await key('Space', true);
  await sleep(1500);
  await shot(`sr2-shmup-${pack}-art.png`); // wave-1 combat, baked/authored art in action
  const mover = new Mover();
  const vMove = new Mover();
  let deaths = 0, lastLives = 3, bossShot = false, chapterSeen = 1, cur = 0, lastMissile = 0, clearLogged = false, bossName = '';
  const t0 = Date.now();
  let result = 'TIMEOUT';
  try {
    while (Date.now() - t0 < 420000) {
      const s = await probeFull();
      const st = s.s;
      if (st.lives < lastLives) { deaths += lastLives - st.lives; log(`death (cause=${st.lastDeath?.cause}) lives ${lastLives}->${st.lives} t=${st.lastDeath?.t}s`); lastLives = st.lives; }
      if (st.chapter !== chapterSeen) { chapterSeen = st.chapter; clearLogged = false; cur = 0; log(`CHAPTER ${st.chapter} START (unlocked=${st.unlocked})`); }
      if (st.mode === 'clear' && !clearLogged) { clearLogged = true; log(`CHAPTER ${st.chapter} CLEAR (boss down, score=${st.score})`); }
      if (st.bossHp !== null && st.bossHp !== undefined && !bossShot) {
        bossShot = true; bossName = st.bossName;
        log(`BOSS SPAWN: ${st.bossName} hp=${st.bossHp}/${st.bossMax} (name rendered in HUD)`);
        // let the boss fly in and start its pattern before the screenshot
        for (let i = 0; i < 40; i++) {
          const by = await evl('window.__maga.sim.boss ? window.__maga.sim.boss.y : 0');
          if (by > 70) break;
          await sleep(150);
        }
        await sleep(900);
        await shot(`sr2-shmup-${pack}-boss.png`);
      }
      if (st.bossHp !== null && st.bossHp !== undefined && st.missiles > 0 && Date.now() - lastMissile > 2500) { lastMissile = Date.now(); await tap('KeyX'); }
      if (st.mode === 'win') {
        result = 'WIN';
        log(`WIN: all chapters clear score=${st.score} livesLeft=${st.lives} deaths=${deaths} unlocked=${st.unlocked} localStorage=${s.ls ?? s.lsc}`);
        break;
      }
      if (st.mode === 'gameover') { result = 'GAMEOVER'; break; }
      if (st.mode === 'play' && st.shipAlive && !st.paused) {
        cur = bestDir(st.shipX, st.shipY, s.e, s.ch, pickTarget(s), cur);
        await mover.set(DIRKEY[cur]);
        // stay low under pressure: maximizes egg fall distance and spread
        await vMove.set((s.e || []).length ? 'ArrowDown' : null);
      } else { await mover.set(null); await vMove.set(null); }
      await sleep(100);
    }
  } finally {
    await key('Space', false).catch(() => {});
    await mover.stop().catch(() => {});
    await vMove.stop().catch(() => {});
  }
  if (result !== 'WIN') {
    log(`FULLCLEAR ${result} — FAIL (see above)`);
    await shot(`sr2-shmup-${pack}-fail.png`);
    log(`console errors: ${env.consoleErrors()}`);
    return false;
  }
  await shot(`sr2-shmup-${pack}-win.png`);
  await tap('KeyR');
  let s = await probe();
  log(`REAL KEY (R): win -> title mode=${s.s.mode} unlocked=${s.s.unlocked} localStorage=${s.ls ?? s.lsc}`);
  const titleOk = s.s.mode === 'title' && s.s.unlocked >= 2 && (s.ls === '2' || s.lsc === '2');
  await tap('Digit2');
  s = await probe();
  const sel2 = s.s.titleSel;
  await tap('Enter');
  s = await probe();
  log(`REAL KEY (Digit2, Enter): chapter-select ch${sel2} -> mode=${s.s.mode} chapter=${s.s.chapter} (restart after win works)`);
  const restartOk = s.s.mode === 'play' && s.s.chapter === 2;
  log(`console errors: ${env.consoleErrors()} nonLocalRequests=${env.nonLocal().length}`);
  const pass = titleOk && restartOk && env.consoleErrors() === 0 && env.nonLocal().length === 0;
  log(`${pack.toUpperCase()} FULL CLEAR + UNLOCK PERSIST: ${pass ? 'PASS' : 'FAIL'}`);
  return pass;
}

// ---- gameover: lose 3 lives -> game-over -> restart ----
async function scenarioGameover() {
  const env = await bootApp();
  const pack = url.includes('cluck') ? 'cluck' : 'replica';
  await startChapter(1);
  const mover = new Mover();
  let deaths = 0, lastLives = 3;
  const t0 = Date.now();
  let result = 'TIMEOUT';
  while (Date.now() - t0 < 150000) {
    const s = await probe();
    const st = s.s;
    if (st.lives < lastLives) { deaths += lastLives - st.lives; log(`death (cause=${st.lastDeath?.cause}) lives ${lastLives}->${st.lives}`); lastLives = st.lives; }
    if (st.mode === 'gameover') { result = 'GAMEOVER'; break; }
    if (st.mode === 'play' && st.shipAlive && st.invuln <= 0) {
      let threat = null;
      for (const e of s.e || []) {
        if (e.vy <= 0) continue;
        const t = (st.shipY - e.y) / e.vy;
        if (t < 0 || t > 2.5) continue;
        const xAt = e.x + e.vx * t;
        const d = Math.abs(xAt - st.shipX);
        if (d < 90 && (!threat || d < threat.d)) threat = { d, xAt };
      }
      let dir = null;
      if (threat) dir = threat.xAt < st.shipX ? 'ArrowLeft' : 'ArrowRight';
      else if (st.chickens && st.chickens.length) {
        const lowest = st.chickens.reduce((a, c) => (c.y > a.y ? c : a));
        dir = lowest.x < st.shipX - 10 ? 'ArrowLeft' : lowest.x > st.shipX + 10 ? 'ArrowRight' : null;
      }
      await mover.set(dir);
    } else await mover.set(null);
    await sleep(100);
  }
  await mover.stop();
  if (result !== 'GAMEOVER') {
    log(`GAMEOVER FLOW: FAIL (never reached gameover in 150s, mode=${result})`);
    log(`console errors: ${env.consoleErrors()}`);
    return false;
  }
  const s2 = await probe();
  log(`GAME OVER reached: lives=${s2.s.lives} deaths=${deaths} lastDeath=${s2.s.lastDeath?.cause} mode=${s2.s.mode}`);
  if (pack === 'replica') await shot('sr2-shmup-replica-gameover.png');
  await tap('KeyR');
  let s3 = await probe();
  const backToTitle = s3.s.mode === 'title';
  log(`REAL KEY (R): gameover -> title mode=${s3.s.mode}`);
  await tap('Enter');
  s3 = await probe();
  const restarted = s3.s.mode === 'play';
  log(`REAL KEY (Enter): title -> restart mode=${s3.s.mode} chapter=${s3.s.chapter} lives=${s3.s.lives}`);
  log(`console errors: ${env.consoleErrors()}`);
  const pass = backToTitle && restarted && env.consoleErrors() === 0;
  log(`${pack.toUpperCase()} GAME-OVER FLOW: ${pass ? 'PASS' : 'FAIL'}`);
  return pass;
}

// ---- settings: volume/mute persist across reload ----
async function scenarioSettings() {
  const env = await bootApp();
  const ns = url.includes('cluck') ? 'chicken-invaders-original' : 'chicken-invaders';
  // open the panel with a real click on the gear button
  const gear = await evl(`(() => { const r = document.getElementById('settings-btn').getBoundingClientRect(); return JSON.stringify({x: r.left + r.width / 2, y: r.top + r.height / 2}); })()`);
  const g = JSON.parse(gear);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.x, y: g.y });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: g.x, y: g.y, button: 'left', clickCount: 1 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: g.x, y: g.y, button: 'left', clickCount: 1 });
  await sleep(150);
  const panelOpen = await evl(`!document.getElementById('settings').classList.contains('hidden')`);
  log(`REAL CLICK (gear): settings panel open=${panelOpen}`);
  // set sliders + mute via DOM events (panel input path)
  await evl(`(() => {
    const m = document.getElementById('vol-music'); m.value = '30'; m.dispatchEvent(new Event('input'));
    const x = document.getElementById('vol-sfx'); x.value = '45'; x.dispatchEvent(new Event('input'));
    const b = document.getElementById('mute-box'); b.checked = true; b.dispatchEvent(new Event('change'));
    return localStorage.getItem('maga:${ns}:audio');
  })()`).then((v) => log(`after input: localStorage audio=${v}`));
  let s = await probe();
  const applied = s.musicVol === 0.3 && s.sfxVol === 0.45 && s.muted === true;
  log(`live apply: musicVolume=${s.musicVol} sfxVolume=${s.sfxVol} muted=${s.muted} -> ${applied ? 'APPLIED' : 'FAIL'}`);
  // reload — must persist
  await cdp.send('Page.navigate', { url });
  for (let i = 0; i < 80; i++) {
    try { if (await evl('!!window.__maga')) break; } catch { /* not ready */ }
    await sleep(250);
  }
  s = await probe();
  const persisted = s.musicVol === 0.3 && s.sfxVol === 0.45 && s.muted === true &&
    (s.lsa !== null || s.lsac !== null);
  log(`after reload: musicVolume=${s.musicVol} sfxVolume=${s.sfxVol} muted=${s.muted} stored=${s.lsa ?? s.lsac} -> ${persisted ? 'PERSISTED' : 'FAIL'}`);
  // unmute again for later scenarios in this profile (fresh profile per run anyway)
  log(`console errors: ${env.consoleErrors()}`);
  const pass = panelOpen && applied && persisted && env.consoleErrors() === 0;
  log(`SETTINGS PERSIST: ${pass ? 'PASS' : 'FAIL'}`);
  return pass;
}

// ---- audio: music + sfx voices scheduled on the real mix ----
async function scenarioAudio() {
  const env = await bootApp();
  await startChapter(1);
  await key('Space', true); // hold fire -> shot voices
  await sleep(4000);
  await key('Space', false);
  const s = await probe();
  log(`audio after 4s held fire: voices=${s.voices} ctxRunning=${s.running}`);
  const ok = s.voices > 10 && s.running === true;
  log(`console errors: ${env.consoleErrors()}`);
  log(`AUDIO SCHEDULED (voices/running): ${ok ? 'PASS' : 'FAIL'}`);
  return ok && env.consoleErrors() === 0;
}

// ---- touch: layout B drag + layout A hold-fire + missile button ----
async function scenarioTouch() {
  const env = await bootApp();
  // no Emulation.* calls: they hang under fleet contention and the zones do
  // not need them — ShmupTouch claims real pointer events and self-reports
  // coarse once a drag starts.
  await startChapter(1);
  const st0 = await probe();
  const x0 = st0.s.shipX;

  // layout B: one-thumb drag on the left pad moves the ship (and auto-fires)
  await touchStage('touchStart', [{ x: 250, y: 400, id: 1 }]);
  await touchStage('touchMove', [{ x: 350, y: 400, id: 1 }]);
  await sleep(700);
  const st1 = await probe();
  const dragMoved = Math.abs(st1.s.shipX - x0) > 25;
  log(`LAYOUT B drag: shipX ${x0.toFixed(0)} -> ${st1.s.shipX.toFixed(0)} (moved=${dragMoved})`);
  // release OUTSIDE the canvas window — stick must not stick (D-32 regression)
  const outside = await evl(`(() => { const c = document.querySelector('canvas').getBoundingClientRect(); return JSON.stringify({x: c.left - 30, y: c.top - 30}); })()`).then(JSON.parse);
  await touch('touchEnd', [{ x: outside.x, y: outside.y, id: 1 }]);
  await sleep(400);
  const st2 = await probe();
  const dragNull = await evl('window.__maga.touch.drag === null');
  log(`release outside canvas: drag cleared=${dragNull} (D-32)`);

  // layout A: hold the FIRE button (auto-fire evidence via bullets) then missile
  await touchStage('touchStart', [{ x: 894, y: 470, id: 2 }]); // FIRE zone hold
  await sleep(900);
  const fireHeld = await evl('window.__maga.sim.fireHeld');
  const fired = fireHeld === true || (await evl('window.__maga.sim.bullets.length')) > 0;
  const firePt = await toClient(894, 470);
  await touch('touchEnd', [{ x: firePt.x, y: firePt.y, id: 2 }]);
  log(`LAYOUT A hold-fire: fireHeld=${fireHeld} -> ${fired ? 'FIRING' : 'FAIL'}`);
  const missiles0 = st0.s.missiles;
  await touchStage('touchStart', [{ x: 810, y: 488, id: 3 }]); // MISSILE zone tap
  await sleep(120);
  const misPt = await toClient(810, 488);
  await touch('touchEnd', [{ x: misPt.x, y: misPt.y, id: 3 }]);
  await sleep(300);
  const st4 = await probe();
  const missileOk = st4.s.missiles === missiles0 - 1;
  log(`missile button: missiles ${missiles0} -> ${st4.s.missiles} -> ${missileOk ? 'LAUNCHED' : 'FAIL'}`);
  log(`console errors: ${env.consoleErrors()}`);
  const pass = dragMoved && dragNull && fired && missileOk && env.consoleErrors() === 0;
  log(`TOUCH A/B SMOKE: ${pass ? 'PASS' : 'FAIL'}`);
  return pass;
}

// ---- pause: esc pause / resume / quit-to-title ----
async function scenarioPause() {
  const env = await bootApp();
  await startChapter(1);
  await sleep(600);
  await tap('Escape');
  let s = await probe();
  const pausedOk = s.s.paused === true && s.s.mode === 'play';
  log(`REAL KEY (Esc): paused=${s.s.paused} mode=${s.s.mode}`);
  // world must freeze: two snapshots 800ms apart identical
  const snapA = JSON.stringify((await probeFull()).ch);
  const waveA = await evl('window.__maga.sim.waveT');
  await sleep(800);
  const snapB = JSON.stringify((await probeFull()).ch);
  const waveB = await evl('window.__maga.sim.waveT');
  const frozen = snapA === snapB && waveA === waveB;
  log(`world frozen while paused: ${frozen}`);
  await tap('Escape');
  s = await probe();
  const resumed = s.s.paused === false;
  log(`REAL KEY (Esc): resumed paused=${s.s.paused}`);
  await tap('Escape');
  await sleep(150);
  await tap('KeyR'); // action while paused -> quit to title
  s = await probe();
  const quitOk = s.s.mode === 'title' && s.s.paused === false;
  log(`REAL KEY (Esc, R): quit-to-title mode=${s.s.mode} paused=${s.s.paused}`);
  log(`console errors: ${env.consoleErrors()}`);
  const pass = pausedOk && frozen && resumed && quitOk && env.consoleErrors() === 0;
  log(`PAUSE FLOW: ${pass ? 'PASS' : 'FAIL'}`);
  return pass;
}

// ---------------------------------------------------------------- main
const SCEN = {
  types: scenarioTypes,
  fullclear: scenarioFullclear,
  gameover: scenarioGameover,
  settings: scenarioSettings,
  audio: scenarioAudio,
  touch: scenarioTouch,
  pause: scenarioPause,
};
log(`sr2-shmup-driver scenario=${scenario} url=${url} pid=${process.pid} cdp=${cdpPort}`);
let ok = false;
try {
  ok = await SCEN[scenario]();
} catch (e) {
  log(`DRIVER ERROR: ${e.stack || e.message}`);
} finally {
  await killChrome();
}
log(`${scenario.toUpperCase()} ${ok ? 'PASS' : 'FAIL'} — exit ${ok ? 0 : 1}`);
process.exit(ok ? 0 : 1);
