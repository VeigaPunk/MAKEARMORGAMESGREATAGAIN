#!/usr/bin/env node
/**
 * sr1-shmup-driver.mjs — zero-dependency CDP driver for the shmup-core apps
 * (replica :5176 / cluck :5177). Real input only: Input.dispatchKeyEvent.
 * State reads via the app's own `?debug` → `window.__maga` hook.
 *
 * usage: node sr1-shmup-driver.mjs <scenario> <url> <logfile> <evidenceDir> [--append]
 * scenarios: types | fullclear | gameover | clucksmoke
 */
import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const [scenario, url, logFile, evidenceDir, ...rest] = process.argv.slice(2);
if (!scenario || !url || !logFile || !evidenceDir) {
  console.error('usage: node sr1-shmup-driver.mjs <scenario> <url> <logfile> <evidenceDir> [--append]');
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
const cdpPort = 9300 + (process.pid % 500);
const profileDir = mkdtempSync(path.join(tmpdir(), 'sr1-shmup-prof-'));

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

/** real mouse click at stage coords (letterboxed canvas → client px) */
async function clickStage(sx, sy) {
  const rect = JSON.parse(await evl(`JSON.stringify(document.querySelector('canvas').getBoundingClientRect().toJSON())`));
  const s = rect.width / 960;
  const cx = rect.left + sx * s, cy = rect.top + sy * s;
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cx, y: cy });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', clickCount: 1 });
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
    ls: localStorage.getItem('maga:chicken-invaders:chapter-unlocked'),
    lsc: localStorage.getItem('maga:chicken-invaders-original:chapter-unlocked'),
  })`));
}
/** probe + live chicken objects (dvx/dvy for dive-threat extrapolation) */
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
    if (t < 0 || t > 2.2) continue;
    threats.push({ t, xAt: e.x + e.vx * t, margin: 36 });
  }
  for (const c of chickens || []) {
    if (!c.dive || c.y < 140) continue;
    const t = (shipY - c.y) / Math.max(80, c.dvy || 200);
    if (t < 0 || t > 2.2) continue;
    threats.push({ t, xAt: c.x + (c.dvx || 0) * t, margin: 56 });
  }
  let base = curDir || 1;
  if (shipX < 110 && base < 0) base = 1;
  if (shipX > 850 && base > 0) base = -1;
  if (targetX !== null && targetX !== undefined && !curDir && Math.abs(targetX - shipX) > 120) base = Math.sign(targetX - shipX);
  let best = base, bestScore = -Infinity;
  for (const d of [base, -base, 0]) {
    let score = Infinity;
    for (const th of threats) {
      const m = Math.abs(th.xAt - shipXAt(shipX, d, th.t)) - th.margin;
      if (m < score) score = m;
    }
    if (score === Infinity) {
      score = 50;
      if (targetX !== null && targetX !== undefined) score -= Math.abs(targetX - shipXAt(shipX, d, 1.2)) * 0.1;
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
  if (st.bossHp !== null && st.bossHp !== undefined) return st.bossX;
  // gift pickups first (weapon upgrade), when roughly reachable
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
async function bootApp() {
  await waitEndpoint();
  const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target');
  cdp = new CDP();
  await cdp.connect(page.webSocketDebuggerUrl);

  let consoleErrors = 0;
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

  await cdp.send('Page.navigate', { url });
  for (let i = 0; i < 80; i++) {
    try { if (await evl('!!window.__maga')) break; } catch { /* not ready */ }
    await sleep(250);
  }
  const up = await evl('!!window.__maga');
  if (!up) throw new Error('window.__maga never appeared (app failed to boot)');
  await sleep(400);
  const s0 = await probe();
  log(`BOOT OK: mode=${s0.s.mode} pack=${s0.s.pack} unlocked=${s0.s.unlocked} lives=${s0.s.lives} ls=${s0.ls ?? s0.lsc}`);
  return { consoleErrors: () => consoleErrors, lastErr: () => lastErr };
}

async function startChapter(ch) {
  if (ch === 2) await clickStage(545, 300); // CH 2 button
  await clickStage(480, 352); // START button
  await sleep(150);
  const s = await probe();
  log(`REAL CLICK (START ch${ch}): mode=${s.s.mode} chapter=${s.s.chapter} wave=${s.s.wave}/${s.s.wavesTotal} lives=${s.s.lives} weapon=${s.s.weaponName}`);
  return s;
}

// ---- types: D-38 behavioral proof (replica wave 1) ----
async function scenarioTypes() {
  const env = await bootApp();
  await startChapter(1);
  // wait for the full formation to settle (fly-in done)
  for (let i = 0; i < 100; i++) {
    const settled = await evl('window.__maga.sim.chickens.length > 0 && window.__maga.sim.chickens.every(c => !c.enter)');
    if (settled) break;
    await sleep(100);
  }
  log('formation settled — sampling 100× @100ms for per-type motion fit');
  await sleep(1200); // let the stray start-confirm bullet (if any) resolve
  const series = new Map(); // idx -> [{t,x,y,hp,type}]
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
  // per-chicken omega fit: x ≈ C + A·sin(ωt) + B·cos(ωt), grid search ω
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
      // normal equations for [C, A, B] in x ≈ C + A·sin(ωt) + B·cos(ωt)
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
  await shot('sr1-shmup-replica-types.png');

  // hits-to-kill on an ACE (type 2) with real fire — expect 4 hits
  log('hits-to-kill: tracking nearest ACE (type 2) by formation slot under real held fire');
  const mover = new Mover();
  await key('Space', true);
  let targetBx = null, lastHp = null, hits = 0, dead = false, cur = 0, t0 = Date.now();
  try {
    while (Date.now() - t0 < 30000 && !dead) {
      const cs = JSON.parse(await evl(`JSON.stringify(window.__maga.sim.chickens.map(c => ({bx:c.bx,x:c.x,y:c.y,hp:c.hp,type:c.type})))`));
      const ship = JSON.parse(await evl(`JSON.stringify({x: window.__maga.sim.ship.x, y: window.__maga.sim.ship.y, alive: window.__maga.sim.ship.alive})`));
      const eggs = JSON.parse(await evl(`JSON.stringify(window.__maga.sim.eggs)`));
      if (targetBx === null && cs.some((c) => c.type === 2)) {
        const a0 = cs.filter((c) => c.type === 2).reduce((a, c) => (Math.abs(c.x - ship.x) < Math.abs(a.x - ship.x) ? c : a));
        targetBx = a0.bx;
        lastHp = a0.hp;
        log(`  tracking ACE at formation bx=${targetBx | 0} hp=${lastHp}`);
      }
      const tgt = cs.find((c) => c.bx === targetBx);
      if (tgt && ship.alive) {
        cur = bestDir(ship.x, ship.y, eggs, cs, tgt.x, cur);
        await mover.set(DIRKEY[cur]);
        if (tgt.hp < lastHp) { hits += lastHp - tgt.hp; log(`  ACE hp ${lastHp} -> ${tgt.hp} (hit #${hits})`); lastHp = tgt.hp; }
      } else if (targetBx !== null && !tgt) {
        hits += lastHp; // final blow removed it from the sim
        log(`  ACE destroyed (hit #${hits})`);
        dead = true;
      }
      await sleep(100);
    }
  } finally {
    await key('Space', false).catch(() => {});
    await mover.stop().catch(() => {});
  }
  const killOk = hits >= 4;
  if (!killOk) pass = false;
  log(`ACE hits-to-kill: ${hits} hits (expected 4, hp4 tank) -> ${killOk ? 'PASS' : 'FAIL'}`);
  log(`console errors: ${env.consoleErrors()}`);
  log(`D-38 BEHAVIORAL PROOF: ${pass && env.consoleErrors() === 0 ? 'PASS' : 'FAIL'}`);
  return pass && env.consoleErrors() === 0;
}

// ---- fullclear: replica ch1+boss -> clear -> ch2+boss -> win ----
async function scenarioFullclear() {
  const env = await bootApp();
  await startChapter(1);
  const mover = new Mover();
  let deaths = 0, lastLives = 3, bossShot = false, chapterSeen = 1, cur = 0, lastMissile = 0, clearLogged = false;
  const t0 = Date.now();
  let result = 'TIMEOUT';
  await key('Space', true);
  try {
    while (Date.now() - t0 < 420000) {
      const s = await probeFull();
      const st = s.s;
      if (st.lives < lastLives) { deaths += lastLives - st.lives; log(`death (cause=${st.lastDeath?.cause}) lives ${lastLives}->${st.lives} t=${st.lastDeath?.t}s`); lastLives = st.lives; }
      if (st.chapter !== chapterSeen) { chapterSeen = st.chapter; clearLogged = false; cur = 0; log(`CHAPTER ${st.chapter} START (unlocked=${st.unlocked}) — select-unlock persisted`); }
      if (st.mode === 'clear' && !clearLogged) { clearLogged = true; log(`CHAPTER ${st.chapter} CLEAR (boss down, score=${st.score})`); }
      if (st.bossHp !== null && st.bossHp !== undefined && !bossShot) {
        bossShot = true;
        log(`CH1 BOSS SPAWN: hp=${st.bossHp}/${st.bossMax} (HUD shows pack boss name)`);
        await shot('sr1-shmup-replica-boss.png');
      }
      if (st.bossHp !== null && st.bossHp !== undefined && st.missiles > 0 && Date.now() - lastMissile > 2500) { lastMissile = Date.now(); await tap('KeyX'); }
      if (st.mode === 'win') {
        result = 'WIN';
        log(`WIN: all chapters clear score=${st.score} livesLeft=${st.lives} deaths=${deaths} unlocked=${st.unlocked} localStorage=${s.ls}`);
        break;
      }
      if (st.mode === 'gameover') { result = 'GAMEOVER'; break; }
      if (st.mode === 'play' && st.shipAlive) {
        cur = bestDir(st.shipX, st.shipY, s.e, s.ch, pickTarget(s), cur);
        await mover.set(DIRKEY[cur]);
      } else await mover.set(null);
      await sleep(100);
    }
  } finally {
    await key('Space', false).catch(() => {});
    await mover.stop().catch(() => {});
  }
  if (result !== 'WIN') {
    log(`FULLCLEAR ${result} — FAIL (see above)`);
    await shot('sr1-shmup-replica-fail.png');
    log(`console errors: ${env.consoleErrors()}`);
    return false;
  }
  await shot('sr1-shmup-replica-win.png');
  // post-win: confirmEnd -> title, then chapter-select 2 must be selectable (unlock persisted)
  await tap('KeyR');
  let s = await probe();
  log(`REAL KEY (R): win -> title mode=${s.s.mode} unlocked=${s.s.unlocked} localStorage=${s.ls}`);
  const titleOk = s.s.mode === 'title' && s.s.unlocked >= 2 && s.ls === '2';
  await tap('Digit2');
  s = await probe();
  const sel2 = s.s.titleSel;
  await tap('Enter');
  s = await probe();
  log(`REAL KEY (Digit2, Enter): chapter-select ch${sel2} -> mode=${s.s.mode} chapter=${s.s.chapter} (restart after win works)`);
  const restartOk = s.s.mode === 'play' && s.s.chapter === 2;
  log(`console errors: ${env.consoleErrors()}`);
  const pass = titleOk && restartOk && env.consoleErrors() === 0;
  log(`REPLICA FULL CLEAR + UNLOCK PERSIST: ${pass ? 'PASS' : 'FAIL'}`);
  return pass;
}

// ---- gameover: replica lose 3 lives -> game-over -> restart ----
async function scenarioGameover() {
  const env = await bootApp();
  await startChapter(1);
  const mover = new Mover();
  let deaths = 0, lastLives = 3;
  const t0 = Date.now();
  let result = 'TIMEOUT';
  while (Date.now() - t0 < 120000) {
    const s = await probe();
    const st = s.s;
    if (st.lives < lastLives) { deaths += lastLives - st.lives; log(`death (cause=${st.lastDeath?.cause}) lives ${lastLives}->${st.lives}`); lastLives = st.lives; }
    if (st.mode === 'gameover') { result = 'GAMEOVER'; break; }
    // steer INTO the nearest falling egg / lowest chicken (no fire)
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
    log(`GAMEOVER FLOW: FAIL (never reached gameover in 120s, mode=${result})`);
    log(`console errors: ${env.consoleErrors()}`);
    return false;
  }
  const s2 = await probe();
  log(`GAME OVER reached: lives=${s2.s.lives} deaths=${deaths} lastDeath=${s2.s.lastDeath?.cause} mode=${s2.s.mode}`);
  await shot('sr1-shmup-replica-gameover.png');
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
  log(`REPLICA GAME-OVER FLOW: ${pass ? 'PASS' : 'FAIL'}`);
  return pass;
}

// ---- clucksmoke: boot cluck, play ch1 stretch, confirm no regression ----
async function scenarioClucksmoke() {
  const env = await bootApp();
  await startChapter(1);
  const mover = new Mover();
  let lastLives = 3, deaths = 0, lastLog = 0, cur = 0;
  const t0 = Date.now();
  await key('Space', true);
  try {
    while (Date.now() - t0 < 30000) {
      const s = await probeFull();
      const st = s.s;
      if (st.lives < lastLives) { deaths += lastLives - st.lives; log(`death (cause=${st.lastDeath?.cause}) lives=${lastLives}->${st.lives}`); lastLives = st.lives; }
      if (Date.now() - lastLog >= 5000) {
        lastLog = Date.now();
        log(`smoke t=${((Date.now() - t0) / 1000).toFixed(0)}s mode=${st.mode} ch=${st.chapter} wave=${st.wave}/${st.wavesTotal} chickens=${st.chickens.length} bossHp=${st.bossHp} score=${st.score} lives=${st.lives} weapon=${st.weaponName}`);
      }
      if (st.mode === 'clear' || st.mode === 'win') { log('cluck smoke: reached clear/win — stopping early'); break; }
      if (st.mode === 'play' && st.shipAlive) {
        cur = bestDir(st.shipX, st.shipY, s.e, s.ch, pickTarget(s), cur);
        await mover.set(DIRKEY[cur]);
      } else await mover.set(null);
      await sleep(100);
    }
  } finally {
    await key('Space', false).catch(() => {});
    await mover.stop().catch(() => {});
  }
  const sEnd = await probe();
  await shot('sr1-shmup-cluck-smoke.png');
  log(`cluck smoke end: mode=${sEnd.s.mode} wave=${sEnd.s.wave} score=${sEnd.s.score} kills=${sEnd.s.kills} lives=${sEnd.s.lives} deaths=${deaths}`);
  log(`console errors: ${env.consoleErrors()}`);
  const pass = env.consoleErrors() === 0 && sEnd.s.score > 0;
  log(`CLUCK REGRESSION SMOKE: ${pass ? 'PASS' : 'FAIL'}`);
  return pass;
}

// ---------------------------------------------------------------- main
const SCEN = { types: scenarioTypes, fullclear: scenarioFullclear, gameover: scenarioGameover, clucksmoke: scenarioClucksmoke };
log(`sr1-shmup-driver scenario=${scenario} url=${url} pid=${process.pid}`);
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
