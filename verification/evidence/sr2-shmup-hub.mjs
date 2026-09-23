#!/usr/bin/env node
/**
 * sr2-shmup-hub.mjs — hub boot-proof for the shmup twin-pack ship candidates.
 * Serves nothing itself: expects the repo root on http://127.0.0.1:8282
 * (python3 -m http.server 8282). Drives the REAL hub: loads /, clicks the
 * game card with real mouse events, then clicks START in-game, verifies
 * wave 1 live. Zero console errors + zero non-local (non-data:) requests.
 *
 * usage: node sr2-shmup-hub.mjs <logfile> <evidenceDir>
 */
import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const [logFile, evidenceDir] = process.argv.slice(2);
if (!logFile || !evidenceDir) {
  console.error('usage: node sr2-shmup-hub.mjs <logfile> <evidenceDir>');
  process.exit(2);
}
mkdirSync(evidenceDir, { recursive: true });
writeFileSync(logFile, '');

function log(line) {
  const out = `[${new Date().toISOString().slice(11, 19)}] ${line}`;
  console.log(out);
  appendFileSync(logFile, out + '\n');
}

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
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HUB = 'http://127.0.0.1:8282/';
const GAMES = [
  { href: 'games/chicken-invaders/', name: 'Chicken Storm', shot: 'sr2-shmup-hub-chicken-storm.png' },
  { href: 'games/cluck-horizon/', name: 'Cluck Horizon', shot: 'sr2-shmup-hub-cluck-horizon.png' },
];

const CHROMIUM = process.env.CHROMIUM_BIN || '/usr/bin/chromium';
const cdpPort = 9501 + (process.pid % 180);
const profileDir = mkdtempSync(path.join(tmpdir(), 'sr2-shmup-hub-prof-'));
const chrome = spawn(CHROMIUM, [
  '--headless=new',
  `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${profileDir}`,
  '--no-first-run', '--no-default-browser-check', '--mute-audio',
  '--autoplay-policy=no-user-gesture-required',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--window-size=1280,800',
  'about:blank',
], { stdio: 'ignore' });
process.on('exit', () => { try { chrome.kill('SIGKILL'); } catch { /* noop */ } });

let cdp;
async function evl(expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('page eval failed: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}
async function shot(name) {
  const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(r.data, 'base64');
  writeFileSync(path.join(evidenceDir, name), buf);
  log(`screenshot -> ${name} (${Math.round(buf.length / 1024)}KB)`);
}

async function main() {
  // devtools endpoint up
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if (r.ok) break; } catch { /* not up */ }
    await sleep(100);
  }
  const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
  const page = targets.find((t) => t.type === 'page');
  cdp = new CDP();
  await cdp.connect(page.webSocketDebuggerUrl);

  const consoleErrors = [];
  const requests = [];
  cdp.on('Runtime.exceptionThrown', (p) => {
    consoleErrors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || 'exception');
    log(`PAGE EXCEPTION: ${consoleErrors[consoleErrors.length - 1]}`);
  });
  cdp.on('Runtime.consoleAPICalled', (p) => {
    if (p.type === 'error') {
      const text = (p.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
      if (/favicon/i.test(text)) return;
      consoleErrors.push(text);
      log(`PAGE CONSOLE ERROR: ${text}`);
    }
  });
  cdp.on('Network.requestWillBeSent', (p) => requests.push(p.request.url));
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Network.enable');

  let allPass = true;
  for (const game of GAMES) {
    requests.length = 0;
    const errsBefore = consoleErrors.length;
    log(`--- hub card: ${game.name} (${game.href})`);
    await cdp.send('Page.navigate', { url: HUB });
    await sleep(800);
    // real mouse click on the hub card anchor
    const card = JSON.parse(await evl(`(() => {
      const a = document.querySelector('a.card[href="${game.href}"]');
      if (!a) return 'null';
      const r = a.getBoundingClientRect();
      return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    })()`));
    if (card === 'null') { log(`hub card NOT FOUND for ${game.href}`); allPass = false; continue; }
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: card.x, y: card.y });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: card.x, y: card.y, button: 'left', clickCount: 1 });
    await sleep(60);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: card.x, y: card.y, button: 'left', clickCount: 1 });
    await sleep(1500);
    const landed = await evl('location.href');
    log(`card click -> ${landed}`);
    // boot proof without instrumentation first: canvas appears, no errors
    let booted = false;
    for (let i = 0; i < 40; i++) {
      try { if (await evl(`!!document.querySelector('canvas')`)) { booted = true; break; } } catch { /* not ready */ }
      await sleep(250);
    }
    log(`game canvas booted (no ?debug): ${booted}`);
    if (!booted) { allPass = false; continue; }
    // re-navigate with the debug hook to drive START with state reads
    const debugUrl = landed.includes('?') ? landed + '&debug' : landed + '?debug';
    await cdp.send('Page.navigate', { url: debugUrl });
    for (let i = 0; i < 60; i++) {
      try { if (await evl('!!window.__maga')) break; } catch { /* not ready */ }
      await sleep(250);
    }
    if (!(await evl('!!window.__maga'))) { log(`debug hook FAILED for ${game.href}`); allPass = false; continue; }
    const title = await evl('window.__maga.state.mode');
    log(`game booted: mode=${title} pack=${await evl('window.__maga.state.pack')}`);
    const rect = JSON.parse(await evl(`JSON.stringify(document.querySelector('canvas').getBoundingClientRect().toJSON())`));
    const s = rect.width / 960;
    const cx = rect.left + 480 * s, cy = rect.top + 352 * s;
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cx, y: cy });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 });
    await sleep(60);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', clickCount: 1 });
    await sleep(2500);
    const st = JSON.parse(await evl('JSON.stringify({mode: window.__maga.state.mode, chapter: window.__maga.state.chapter, wave: window.__maga.state.wave, total: window.__maga.state.wavesTotal, chickens: window.__maga.state.chickens.length})'));
    log(`after START click: mode=${st.mode} ch=${st.chapter} wave=${st.wave}/${st.total} chickens=${st.chickens}`);
    await shot(game.shot);
    const errs = consoleErrors.length - errsBefore;
    const nonLocal = requests.filter((u) => !/^(https?:\/\/(127\.0\.0\.1|localhost)|data:|blob:|about:)/.test(u));
    const ok = st.mode === 'play' && st.wave === 1 && st.chickens > 0 && errs === 0 && nonLocal.length === 0;
    log(`verdict: wave1=${st.mode === 'play' && st.wave === 1 && st.chickens > 0} consoleErrors=${errs} nonLocal=${nonLocal.length} -> ${ok ? 'PASS' : 'FAIL'}`);
    if (!ok) allPass = false;
  }
  log(`HUB BOOT-PROOF: ${allPass ? 'PASS' : 'FAIL'}`);
  return allPass;
}

main()
  .then((ok) => { try { chrome.kill('SIGKILL'); } catch { /* noop */ } try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* noop */ } process.exit(ok ? 0 : 1); })
  .catch((e) => { log(`HUB DRIVER ERROR: ${e.stack || e.message}`); try { chrome.kill('SIGKILL'); } catch { /* noop */ } process.exit(1); });
