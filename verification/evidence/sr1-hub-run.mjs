// sr1-hub-run.mjs — zero-dependency CDP verification of the root entry point.
// Requires: python3 -m http.server 8123 (run from the repository root).
// Real input only: Input.dispatchKeyEvent / Input.dispatchMouseEvent. State
// reads via each app's own read-only hooks (?debug -> window.__maga, hardest ->
// window.__hardest). Evidence: sr1-hub*.png + sr1-hub-run.log in this dir.
import { spawn } from 'node:child_process';
import { appendFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CDP } from './sr1-cdp.mjs';

const EVD = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(EVD, '..', '..');
const BASE = 'http://localhost:8123';
const LOG = path.join(EVD, 'sr1-hub-run.log');
const SHOT = (n) => path.join(EVD, n);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

writeFileSync(LOG, '');
const logLines = [];
function log(s) {
  const t = `[${new Date().toISOString().slice(11, 19)}] ${s}`;
  console.log(t);
  logLines.push(t);
  appendFileSync(LOG, t + '\n');
}

// ---------------------------------------------------------------- chromium
const profile = mkdtempSync(path.join(tmpdir(), 'sr1-hub-prof-'));
const port = 9417;
const chrome = spawn('/usr/bin/chromium', [
  '--headless=new', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check',
  '--mute-audio', '--autoplay-policy=no-user-gesture-required',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--window-size=1280,800', '--force-device-scale-factor=1',
  'about:blank',
], { stdio: 'ignore' });
process.on('exit', () => { try { chrome.kill('SIGKILL'); } catch { /* noop */ } });

let version = null;
for (let i = 0; i < 100 && !version; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/json/version`);
    if (r.ok) version = await r.json();
  } catch { /* not up yet */ }
  await sleep(100);
}
if (!version) throw new Error('chromium devtools endpoint never came up');
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = targets.find((t) => t.type === 'page');
const cdp = new CDP();
cdp.proc = chrome;
await cdp.connect(page.webSocketDebuggerUrl);

await cdp.send('Runtime.enable');
await cdp.send('Log.enable');
await cdp.send('Page.enable');
await cdp.send('Network.enable');

const errors = [];
cdp.on('Runtime.exceptionThrown', (p) => errors.push('EXCEPTION: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text)));
cdp.on('Runtime.consoleAPICalled', (p) => {
  if (p.type === 'error') errors.push('console.error: ' + p.args.map((a) => a.value ?? a.description ?? '').join(' '));
});
cdp.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') errors.push('log: ' + p.entry.text); });

const nonLocal = [];
const failed = [];
cdp.on('Network.requestWillBeSent', (p) => {
  const u = p.request.url;
  if (u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('about:')) return;
  if (u.startsWith(BASE + '/') || u.startsWith('file://')) return;
  nonLocal.push(u);
});
cdp.on('Network.responseReceived', (p) => { if (p.response.status >= 400) failed.push(p.response.url); });

// favicon 404s are the one benign failure mode (apps ship no icon; the hub
// uses a data: icon). Whitelist "Failed to load resource" only while the ONLY
// >=400 request seen is /favicon.ico.
const realErrors = () => {
  const onlyFavicon = failed.length > 0 && failed.every((u) => u.endsWith('/favicon.ico'));
  return errors.filter((e) => {
    if (/favicon/i.test(e)) return false;
    if (onlyFavicon && /Failed to load resource/.test(e)) return false;
    return true;
  });
};

// ---------------------------------------------------------------- helpers
async function evl(expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}
async function waitLoad() {
  await evl(`new Promise(r=>{if(document.readyState==='complete')r(1);else addEventListener('load',()=>r(1),{once:true})})`);
}
async function waitFor(fn, timeoutMs, what) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { if (await fn()) return; } catch { /* not ready */ }
    await sleep(250);
  }
  throw new Error('timeout waiting for ' + what);
}
async function gotoHub() {
  await cdp.send('Page.navigate', { url: BASE + '/' });
  await waitLoad();
  await sleep(300);
}
async function clickCard(href) {
  const r = await evl(`(()=>{const a=[...document.querySelectorAll('a.card')].find(x=>x.getAttribute('href')===${JSON.stringify(href)});if(!a)return null;a.scrollIntoView({block:'center'});const x=a.getBoundingClientRect();return {x:x.left+x.width/2,y:x.top+x.height/2}})()`);
  if (!r) throw new Error('card not found: ' + href);
  await cdp.click(r.x, r.y);
}
async function clickButton(substr) {
  const r = await evl(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(${JSON.stringify(substr)})&&!x.disabled);if(!b)return null;const x=b.getBoundingClientRect();return {x:x.left+x.width/2,y:x.top+x.height/2}})()`);
  if (!r) throw new Error('button not found: ' + substr);
  await cdp.click(r.x, r.y);
  return substr;
}
async function typeText(s) {
  for (const ch of s) {
    const vk = ch.toUpperCase().charCodeAt(0);
    const code = 'Key' + ch.toUpperCase();
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: ch, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, text: ch });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: ch, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  }
}
async function clickStage(sx, sy) {
  const rect = await evl(`JSON.stringify(document.querySelector('canvas').getBoundingClientRect().toJSON())`);
  const r = JSON.parse(rect);
  const s = r.width / 960;
  await cdp.click(r.left + sx * s, r.top + sy * s);
}
async function shot(name) {
  await cdp.screenshot(SHOT(name));
  log(`screenshot -> ${name}`);
}
function gate(tag) {
  const errs = realErrors();
  const bad = nonLocal.length;
  log(`${tag}: console errors (favicon whitelisted): ${errs.length}${errs.length ? ' ' + JSON.stringify(errs.slice(0, 3)) : ''}; non-local requests: ${bad}${bad ? ' ' + JSON.stringify(nonLocal.slice(0, 3)) : ''}`);
  return errs.length === 0 && bad === 0;
}

// ---------------------------------------------------------------- scenarios
async function gameBoxhead() {
  await waitFor(() => evl(`!!window.__maga && window.__maga.state && window.__maga.state.state === 'title'`), 20000, 'boxhead title');
  log('boot: state=title');
  await cdp.tap('Space', ' ', 32); await sleep(400);
  await cdp.tap('Digit1', '1', 49); await sleep(400);
  await cdp.tap('Digit1', '1', 49); await sleep(600);
  const st = await evl(`(()=>{const s=window.__maga.state;return {state:s.state,mode:s.mode,room:s.room,wave:s.wave}})()`);
  log(`REAL KEYS (Space,1,1): state=${st.state} mode=${st.mode} room=${st.room} wave=${st.wave} ${st.state === 'playing' ? 'PASS' : 'FAIL'}`);
  await sleep(1200);
  const w2 = await evl(`window.__maga.state.wave`);
  log(`solo run live: wave=${w2}`);
  await shot('sr1-hub-boxhead.png');
  return st.state === 'playing';
}

async function gameImpossible() {
  await waitFor(() => evl(`!!window.__maga && window.__maga.mode === 'title'`), 20000, 'impossible title');
  const L = await evl(`(()=>{const cv=document.querySelector('canvas');const r=cv.getBoundingClientRect();return {left:r.left,top:r.top,scale:r.width/960}})()`);
  const chip = await evl(`(()=>{const c=window.__maga.chips.find(c=>c.id==='play');return {x:c.x+c.w/2,y:c.y+c.h/2}})()`);
  await cdp.click(L.left + chip.x * L.scale, L.top + chip.y * L.scale);
  await sleep(400);
  const mode1 = await evl('window.__maga.mode');
  const y0 = await evl('window.__maga.y');
  log(`REAL CLICK (PLAY): mode=${mode1} y=${y0.toFixed(1)}`);
  await cdp.tap('Space', ' ', 32);
  let minY = y0;
  for (let i = 0; i < 10; i++) { await sleep(50); const y = await evl('window.__maga.y'); if (y < minY) minY = y; }
  const ok = mode1 === 'run' && minY < y0 - 4;
  log(`REAL KEY (Space): jump y ${y0.toFixed(1)} -> min ${minY.toFixed(1)} ${ok ? 'PASS' : 'FAIL'}`);
  await sleep(400);
  await shot('sr1-hub-impossible-game.png');
  return ok;
}

async function gameBurger() {
  await waitFor(() => evl(`!!window.__maga && !!window.__maga.sim`), 20000, 'burger sim');
  await shot('sr1-hub-burger-tycoon-title.png');
  const L = await evl(`(()=>{const cv=document.querySelector('#wrap canvas');const r=cv.getBoundingClientRect();return {left:r.left,top:r.top,scale:r.width/960}})()`);
  await cdp.click(L.left + 480 * L.scale, L.top + 273 * L.scale); // title: START
  await sleep(500);
  const crops0 = await evl('window.__maga.sim.s.crops');
  await cdp.click(L.left + (10 + 123) * L.scale, L.top + (32 + 15) * L.scale); // farm pane, first action (sow)
  await sleep(400);
  const crops1 = await evl('window.__maga.sim.s.crops');
  const ok = crops1 > crops0;
  log(`REAL CLICK (farm: sow): crops ${crops0.toFixed(0)} -> ${crops1.toFixed(0)} ${ok ? 'PASS' : 'FAIL'}`);
  await shot('sr1-hub-burger-tycoon.png');
  return ok;
}

async function shmupStart(pack) {
  await waitFor(() => evl(`!!window.__maga && window.__maga.state && window.__maga.state.mode === 'title'`), 20000, pack + ' title');
  log(`boot: mode=title pack=${await evl('window.__maga.state.pack')}`);
  await clickStage(480, 352); // START
  await sleep(500);
  const st = await evl(`(()=>{const s=window.__maga.state;return {mode:s.mode,ch:s.chapter,wave:s.wave,shipAlive:s.shipAlive}})()`);
  log(`REAL CLICK (START): mode=${st.mode} chapter=${st.ch} wave=${st.wave} ${st.mode === 'play' ? 'PASS' : 'FAIL'}`);
  await sleep(1500);
  const w2 = await evl(`(()=>{const s=window.__maga.state;return {wave:s.wave,chickens:s.chickens.length}})()`);
  log(`wave live: wave=${w2.wave} chickens=${w2.chickens}`);
  return st.mode === 'play';
}

async function gameChicken() { const ok = await shmupStart('replica'); await shot('sr1-hub-chicken-invaders.png'); return ok; }
async function gameCluck() { const ok = await shmupStart('cluck'); await shot('sr1-hub-cluck-horizon.png'); return ok; }

async function gameSas() {
  await waitFor(() => evl(`!!window.__maga && (window.__maga.mode === 'create' || window.__maga.mode === 'title')`), 20000, 'sas title/create screen');
  const bootMode = await evl('window.__maga.mode');
  log(`boot: mode=${bootMode}`);
  if (bootMode === 'title') { await clickButton('New Gladiator'); await sleep(300); log('REAL CLICK (New Gladiator): mode=' + await evl('window.__maga.mode')); }
  await evl(`document.getElementById('name').focus()`);
  await typeText('KIMI');
  const name = await evl(`document.getElementById('name').value`);
  for (let i = 0; i < 6; i++) { await clickButton('strength'); await sleep(120); }
  const points = await evl(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('strength')).textContent`);
  log(`REAL INPUT (typed name=${name}, 6x strength+): "${points}"`);
  await clickButton('Enter the Arena');
  await sleep(400);
  const m1 = await evl('window.__maga.mode');
  log(`REAL CLICK (Enter the Arena): mode=${m1} ${m1 === 'hub' ? 'PASS' : 'FAIL'}`);
  await clickButton('Start First Bout');
  await sleep(400);
  const m2 = await evl('window.__maga.mode');
  const opp = await evl('window.__maga.opponentHp');
  log(`REAL CLICK (Start First Bout): mode=${m2} opponentHp=${opp} ${m2 === 'arena' ? 'PASS' : 'FAIL'}`);
  await shot('sr1-hub-swords-and-sandals.png');
  return m1 === 'hub' && m2 === 'arena';
}

async function gameHardest() {
  await waitFor(() => evl(`!!window.__hardest && window.__hardest.state().screen === 'menu' && window.__hardest.state().levels === 114`), 20000, 'hardest menu');
  log(`boot: screen=menu levels=${await evl('window.__hardest.state().levels')} unlocked=${await evl('window.__hardest.state().unlocked')}`);
  await cdp.tap('Enter', 'Enter', 13);
  await sleep(500);
  const st = await evl(`JSON.stringify(window.__hardest.state())`);
  const s = JSON.parse(st);
  log(`REAL KEY (Enter): screen=${s.screen} level=${s.level} ${s.screen === 'play' ? 'PASS' : 'FAIL'}`);
  await sleep(800);
  await shot('sr1-hub-hardest.png');
  return s.screen === 'play';
}

// ---------------------------------------------------------------- run
const GAMES = [
  { href: 'games/boxhead/', slug: 'boxhead', fn: gameBoxhead },
  { href: 'games/impossible-game/', slug: 'impossible-game', fn: gameImpossible },
  { href: 'games/burger-tycoon/', slug: 'burger-tycoon', fn: gameBurger },
  { href: 'games/chicken-invaders/', slug: 'chicken-invaders', fn: gameChicken },
  { href: 'games/cluck-horizon/', slug: 'cluck-horizon', fn: gameCluck },
  { href: 'games/swords-and-sandals/', slug: 'swords-and-sandals', fn: gameSas },
  { href: 'hardest/', slug: 'hardest', fn: gameHardest },
];

let allOk = true;
try {
  log(`sr1-hub-run: chromium=${version.Browser} base=${BASE} root=${ROOT}`);
  await gotoHub();
  const cards = await evl(`[...document.querySelectorAll('a.card')].map(a=>a.getAttribute('href')).join(' ')`);
  const hintShown = await evl(`getComputedStyle(document.getElementById('filehint')).display !== 'none'`);
  log(`hub: cards -> ${cards}`);
  log(`hub: 7 cards=${cards.split(' ').length === 7 ? 'PASS' : 'FAIL'}; serve hint hidden over http=${!hintShown ? 'PASS' : 'FAIL'}`);
  await shot('sr1-hub.png');
  allOk = gate('hub') && allOk;

  for (const g of GAMES) {
    log(`== ${g.slug}: click card ${g.href}`);
    const errsBefore = errors.length;
    const netBefore = nonLocal.length;
    const failedBefore = failed.length;
    await clickCard(g.href);
    let ok = false;
    try {
      await waitLoad();
      const landed = await evl(`location.href`);
      const hasCanvas = await evl(`!!document.querySelector('canvas')`);
      log(`link click -> ${landed} (canvas in DOM: ${hasCanvas}) ${landed === BASE + '/' + g.href ? 'PASS' : 'FAIL'}`);
      // plain link exercised; re-open with ?debug for the read-only probe hook
      await cdp.send('Page.navigate', { url: BASE + '/' + g.href + '?debug' });
      await waitLoad();
      ok = await g.fn();
    } catch (e) {
      log(`${g.slug}: DRIVER ERROR: ${e.message}`);
    }
    const newErrs = realErrors().filter((e, i) => errors.indexOf(e) >= errsBefore);
    const newNet = nonLocal.slice(netBefore);
    const newFailed = failed.slice(failedBefore).filter((u) => !u.endsWith('/favicon.ico'));
    const clean = newErrs.length === 0 && newNet.length === 0 && newFailed.length === 0;
    log(`${g.slug}: boot+interaction ${ok ? 'PASS' : 'FAIL'}; errors this game=${newErrs.length}${newErrs.length ? ' ' + JSON.stringify(newErrs.slice(0, 3)) : ''}; non-local this game=${newNet.length}${newNet.length ? ' ' + JSON.stringify(newNet.slice(0, 3)) : ''}; non-favicon 4xx=${newFailed.length}`);
    ok = ok && clean;
    allOk = ok && allOk;
    await gotoHub();
  }

  await cdp.send('Page.navigate', { url: 'file://' + ROOT + '/index.html' });
  await waitLoad();
  await sleep(300);
  const fileHint = await evl(`getComputedStyle(document.getElementById('filehint')).display !== 'none'`);
  const fileCards = await evl(`document.querySelectorAll('a.card').length`);
  log(`file://: renders, cards=${fileCards}, serve hint shown=${fileHint} ${fileHint && fileCards === 7 ? 'PASS' : 'FAIL'}`);
  await shot('sr1-hub-file.png');
  allOk = fileHint && fileCards === 7 && allOk;
} catch (e) {
  log(`RUN ERROR: ${e.stack || e.message}`);
  allOk = false;
} finally {
  log(`console errors total (favicon whitelisted): ${realErrors().length}; non-local requests total: ${nonLocal.length}`);
  log(`sr1-hub-run: ${allOk ? 'PASS' : 'FAIL'}`);
  try { cdp.close(); } catch { /* noop */ }
}
process.exit(allOk ? 0 : 1);
