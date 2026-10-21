// Browser verification for both Frostbite cabinets, with real input.
//   node games/frostbite/tools/verify.mjs <base-url> <out-dir> [--covers <dir>]
// <base-url> points at the frostbite folder, served over HTTP
// (e.g. http://127.0.0.1:8765/games/frostbite/).
//
// Desktop: start with an arrow key, then the shared bot plays through
// synthetic keydown/keyup events for 40 s; it must build blocks and enter an
// igloo. Phones (iPhone and Android profiles, portrait and landscape): no
// horizontal overflow, pads on screen, a tap on a pad starts the game,
// holding ▶ walks, ▼ jumps, a swipe on the picture jumps. Every page must
// log zero console errors and make zero off-site requests.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch (e) { pw = createRequire('/opt/node22/lib/node_modules/')('playwright'); }
const { chromium, devices } = pw;

const BASE = process.argv[2] || 'http://127.0.0.1:8765/games/frostbite/';
const OUT = process.argv[3] || './frostbite-evidence';
const coversAt = process.argv.indexOf('--covers');
const COVERS = coversAt > 0 ? process.argv[coversAt + 1] : null;
mkdirSync(OUT, { recursive: true });
const brain = readFileSync(new URL('./brain.js', import.meta.url), 'utf8');
const host = new URL(BASE).host;

let fails = 0;
const log = [];
function check(name, ok, detail) {
  if (!ok) fails++;
  const line = `${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`;
  console.log(line);
  log.push(line);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function watch(page) {
  const errors = [], offsite = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol === 'data:' || u.protocol === 'blob:') return;
    if (u.host !== host) offsite.push(r.url());
  });
  return { errors, offsite };
}

// Count simulation events in the page.
const TAP = `(() => {
  const g = window.__frostbite.game;
  if (window.__tap) return;
  const stats = window.__tap = { blocks: 0, igloos: 0, jumps: 0, deaths: {}, maxLevel: g.level, types: {} };
  const orig = g.update.bind(g);
  g.update = function (dt, inp) {
    const ev = orig(dt, inp);
    for (const e of ev) {
      stats.types[e.type] = (stats.types[e.type] || 0) + 1;
      if (e.type === 'block') stats.blocks++;
      if (e.type === 'inside') stats.igloos++;
      if (e.type === 'jump') stats.jumps++;
      if (e.type === 'drown' || e.type === 'bear' || e.type === 'freeze') stats.deaths[e.type] = (stats.deaths[e.type] || 0) + 1;
    }
    stats.maxLevel = Math.max(stats.maxLevel, g.level);
    return ev;
  };
})()`;

// The bot drives the real keyboard handlers.
const DRIVE = `(() => {
  const g = window.__frostbite.game;
  const decide = window.FrostbiteBrain(window.FrostbiteCore);
  const map = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', fire: 'Space' };
  const held = {};
  window.__drive = true;
  function tick() {
    if (!window.__drive) { for (const k in held) if (held[k]) window.dispatchEvent(new KeyboardEvent('keyup', { code: map[k], bubbles: true })); return; }
    const inp = decide(g);
    for (const k in map) {
      if (inp[k] && !held[k]) { window.dispatchEvent(new KeyboardEvent('keydown', { code: map[k], bubbles: true, cancelable: true })); held[k] = true; }
      else if (!inp[k] && held[k]) { window.dispatchEvent(new KeyboardEvent('keyup', { code: map[k], bubbles: true, cancelable: true })); held[k] = false; }
    }
    if (g.state === 'over') window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true }));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})()`;

async function desktop(browser, version) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const w = watch(page);
  await page.goto(BASE + version + '/');
  await page.waitForFunction(() => window.__frostbite && window.__frostbite.game);
  await wait(400);
  check(`${version} desktop: boots to title`, await page.evaluate(() => window.__frostbite.game.state) === 'title');
  await page.screenshot({ path: `${OUT}/${version}-desktop-title.png` });
  // Game select switch works on the title screen.
  await page.keyboard.press('KeyG');
  await wait(100);
  const mode2 = await page.evaluate(() => window.__frostbite.game.mode);
  await page.keyboard.press('Digit1');
  await wait(100);
  check(`${version} desktop: G / 1-4 select the game`, mode2 === 2 && await page.evaluate(() => window.__frostbite.game.mode) === 1, `G→${mode2}`);
  await page.evaluate(TAP);
  await page.keyboard.press('ArrowDown');
  await wait(200);
  check(`${version} desktop: an arrow key starts the game`, ['ready', 'play'].includes(await page.evaluate(() => window.__frostbite.game.state)));
  await wait(900);
  // Real arrow keys: walk right on the shore, then pause / resume.
  const x0 = await page.evaluate(() => window.__frostbite.game.bailey.x);
  await page.keyboard.down('ArrowRight'); await wait(350); await page.keyboard.up('ArrowRight');
  const x1 = await page.evaluate(() => window.__frostbite.game.bailey.x);
  check(`${version} desktop: → walks`, x1 > x0 + 8, `${x0.toFixed(1)} → ${x1.toFixed(1)}`);
  await page.keyboard.press('KeyP');
  await wait(150);
  const paused = await page.evaluate(() => window.__frostbite.isPaused());
  const tPaused = await page.evaluate(() => window.__frostbite.game.frame);
  await wait(300);
  const frozen = await page.evaluate(() => window.__frostbite.game.frame) === tPaused;
  await page.keyboard.press('KeyP');
  check(`${version} desktop: P pauses and resumes`, paused && frozen && !(await page.evaluate(() => window.__frostbite.isPaused())));
  await page.addScriptTag({ content: brain });
  await page.evaluate(DRIVE);
  await wait(16000);
  await page.screenshot({ path: `${OUT}/${version}-desktop-play.png` });
  await wait(24000);
  await page.evaluate(() => { window.__drive = false; });
  const stats = await page.evaluate(() => window.__tap);
  check(`${version} desktop: bot builds with real key events`, stats.blocks >= 12 && stats.jumps >= 20, `blocks ${stats.blocks}, jumps ${stats.jumps}`);
  check(`${version} desktop: igloo entered and bonus tallied`, stats.igloos >= 1 && (stats.types.tally || 0) > 0, `igloos ${stats.igloos}, max level ${stats.maxLevel}, deaths ${JSON.stringify(stats.deaths)}`);
  check(`${version} desktop: zero console errors`, w.errors.length === 0, w.errors.slice(0, 3).join(' | '));
  check(`${version} desktop: zero off-site requests`, w.offsite.length === 0, w.offsite.slice(0, 3).join(' | '));
  await page.close();
}

async function phone(browser, version, profile, landscape) {
  const d = { ...devices[profile] };
  delete d.defaultBrowserType;
  if (landscape) d.viewport = { width: d.viewport.height, height: d.viewport.width };
  const ctx = await browser.newContext(d);
  const page = await ctx.newPage();
  const w = watch(page);
  const tag = `${version} ${profile}${landscape ? ' landscape' : ''}`;
  const file = `${version}-${profile.replace(/\s+/g, '-').toLowerCase()}${landscape ? '-land' : ''}`;
  await page.goto(BASE + version + '/');
  await page.waitForFunction(() => window.__frostbite && window.__frostbite.game);
  await wait(500);
  const geo = await page.evaluate(() => {
    const r = (sel) => { const el = document.querySelector(sel); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
    return {
      vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight,
      canvas: r('canvas'), left: r('[data-pad="left"]'), right: r('[data-pad="right"]'), up: r('[data-pad="up"]'), down: r('[data-pad="down"]'), fire: r('[data-pad="fire"]')
    };
  });
  check(`${tag}: no horizontal overflow`, geo.sw <= geo.vw + 1, `${geo.sw} vs ${geo.vw}`);
  const inView = (p) => p && p.w > 30 && p.l >= -1 && p.t >= -1 && p.r <= geo.vw + 1 && p.b <= geo.vh + 1;
  check(`${tag}: all five pads on screen`, ['left', 'right', 'up', 'down', 'fire'].every((k) => inView(geo[k])),
    ['left', 'right', 'up', 'down', 'fire'].map((k) => `${k}:${geo[k] ? Math.round(geo[k].l) + ',' + Math.round(geo[k].t) : 'none'}`).join(' '));
  if (version === 'classic') {
    const c = geo.canvas;
    const overlap = ['left', 'right', 'up', 'down', 'fire'].some((k) => geo[k] && geo[k].l < c.r && geo[k].r > c.l && geo[k].t < c.b && geo[k].b > c.t);
    check(`${tag}: pads do not cover the picture`, !overlap, `canvas ${Math.round(c.w)}x${Math.round(c.h)}`);
  }
  const cdp = await ctx.newCDPSession(page);
  const touch = async (p, ms) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1 }] });
    await wait(ms);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  await page.evaluate(TAP);
  await touch(geo.down, 80);
  await wait(150);
  check(`${tag}: tapping a pad starts the game`, ['ready', 'play'].includes(await page.evaluate(() => window.__frostbite.game.state)));
  await page.waitForFunction(() => window.__frostbite.game.state === 'play', null, { timeout: 4000 });
  const x0 = await page.evaluate(() => window.__frostbite.game.bailey.x);
  await touch(geo.right, 400);
  const x1 = await page.evaluate(() => window.__frostbite.game.bailey.x);
  check(`${tag}: holding ▶ walks`, x1 > x0 + 8, `${x0.toFixed(1)} → ${x1.toFixed(1)}`);
  const j0 = await page.evaluate(() => window.__tap.jumps);
  await touch(geo.down, 120);
  await wait(450);
  const j1 = await page.evaluate(() => window.__tap.jumps);
  check(`${tag}: ▼ jumps onto the ice`, j1 > j0, `jumps ${j0} → ${j1}`);
  await page.screenshot({ path: `${OUT}/${file}.png` });
  // Swipe up on the picture (remastered fills the screen; classic has its canvas).
  await page.waitForFunction(() => { const g = window.__frostbite.game; return g.state === 'play' && !g.bailey.air; }, null, { timeout: 6000 });
  const cv = geo.canvas;
  const sx = version === 'classic' ? cv.x : geo.vw / 2, sy = version === 'classic' ? cv.y : geo.vh * 0.45;
  const j2 = await page.evaluate(() => window.__tap.jumps);
  const dirSwipe = await page.evaluate(() => window.__frostbite.game.bailey.row < 0 ? 40 : -40);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy, id: 2 }] });
  for (let k = 1; k <= 5; k++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx, y: sy + (dirSwipe * k) / 5, id: 2 }] });
    await wait(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await wait(400);
  const j3 = await page.evaluate(() => window.__tap.jumps);
  check(`${tag}: swipe on the picture jumps`, j3 > j2, `jumps ${j2} → ${j3}`);
  check(`${tag}: zero console errors`, w.errors.length === 0, w.errors.slice(0, 3).join(' | '));
  check(`${tag}: zero off-site requests`, w.offsite.length === 0, w.offsite.slice(0, 3).join(' | '));
  await ctx.close();
}

// A posed board for the covers: a level with the bear, a half-built igloo,
// critters out and the builder standing on the second row of ice.
async function cover(browser, version, level, blocks, file, size) {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  await page.goto(BASE + version + '/');
  await page.waitForFunction(() => window.__frostbite && window.__frostbite.game);
  await page.addStyleTag({ content: '#topbar,.overlay,#banner,#touch{display:none!important}' });
  await page.evaluate(({ level, blocks }) => {
    const api = window.__frostbite, g = api.game, C = window.FrostbiteCore.C;
    g.newGame();
    const p = g.player();
    p.level = level; p.blocks = blocks; p.score = 2840 + level * 1000;
    g.buildLevel();
    for (let i = 0; i < 600 && g.critters.length < 3; i++) { g.stepRows(); g.stepCritters(true); }
    g.state = 'play';
    g.temp = 31;
    g.rows[1].blue = true; g.rows[2].blue = true;
    const piece = g.rowPieces(1, 0).filter((q) => q.x > 40 && q.x < 100)[0] || g.rowPieces(1, 0)[0];
    Object.assign(g.bailey, { x: piece.x + piece.w / 2 - 4, row: 1, y: window.FrostbiteCore.feetY(1), face: 1 });
    g.bear.x = 70;
    api.setPaused(true);
  }, { level, blocks });
  await wait(1200);
  if (version === 'classic') await (await page.$('canvas')).screenshot({ path: file });
  else await page.screenshot({ path: file, type: file.endsWith('.jpg') ? 'jpeg' : 'png', quality: file.endsWith('.jpg') ? 88 : undefined });
  await page.close();
}

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const coversOnly = process.argv.includes('--covers-only');
try {
  if (!coversOnly) for (const v of ['classic', 'remastered']) await desktop(browser, v);
  for (const v of coversOnly ? [] : ['classic', 'remastered']) {
    await phone(browser, v, 'iPhone 13', false);
    await phone(browser, v, 'Pixel 7', false);
    await phone(browser, v, 'iPhone 13', true);
    await phone(browser, v, 'Galaxy S9+', true);
  }
  // The landing page.
  if (!coversOnly) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const w = watch(page);
  await page.goto(BASE);
  const links = await page.evaluate(() => [...document.querySelectorAll('a.btn')].map((a) => a.getAttribute('href')));
  check('landing: links both cabinets', links.includes('./classic/') && links.includes('./remastered/'), links.join(' '));
  const imgs = await page.evaluate(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
  check('landing: cover images load', imgs);
  await page.screenshot({ path: `${OUT}/landing-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 375, height: 800 });
  await wait(200);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  check('landing: no horizontal overflow at 375px', ov);
  await page.screenshot({ path: `${OUT}/landing-phone.png`, fullPage: true });
  check('landing: zero console errors', w.errors.length === 0, w.errors.join(' | '));
  await page.close();
  }
  if (COVERS) {
    await cover(browser, 'classic', 4, 9, `${COVERS}/classic.png`, { width: 1280, height: 1000 });
    await cover(browser, 'remastered', 6, 11, `${COVERS}/remastered.jpg`, { width: 1280, height: 800 });
    console.log('covers written to', COVERS);
  }
} finally {
  await browser.close();
}
writeFileSync(`${OUT}/verify.log`, log.join('\n') + `\n${fails ? fails + ' FAILED' : 'ALL PASS'}\n`);
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
