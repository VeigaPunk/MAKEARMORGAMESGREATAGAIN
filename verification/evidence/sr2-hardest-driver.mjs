// sr2-hardest-driver.mjs — sr2 real-input verification for The Cruel Maze (hardest/).
// Zero-dep Node 24 driver over system chromium via the sr1 CDP wrapper (read-only reuse).
// Real Input.dispatchKeyEvent / dispatchTouchEvent / mouse events only; __hardest reads
// for assertions. Run from anywhere:
//   node verification/evidence/sr2-hardest-driver.mjs
// Evidence: stdout (tee to sr2-hardest-run.log) + sr2-hardest-{settings,clear,medals,touch,midcorpus}.png
import { CDP } from './sr1-cdp.mjs';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EVD = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(EVD, '..', '..');
const INDEX = 'file://' + resolve(ROOT, 'hardest', 'index.html');
const SAVE_KEY = 'hardest.save.v1';
const results = [];
let step = 'boot';

function report(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} [${name}] ${detail}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(cdp, expr, timeoutMs = 15000, poll = 120) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { if (await cdp.eval(expr)) return true; } catch {}
    await sleep(poll);
  }
  return false;
}
async function state(cdp) { return cdp.eval('globalThis.__hardest.state()'); }
async function playerX(cdp) { return cdp.eval('globalThis.__hardest.engine().player.x'); }

const KEYS = {
  Enter: ['Enter', 'Enter', 13], Escape: ['Escape', 'Escape', 27],
  KeyD: ['KeyD', 'd', 68], KeyS: ['KeyS', 's', 83], KeyM: ['KeyM', 'm', 77], KeyQ: ['KeyQ', 'q', 81],
  Minus: ['Minus', '-', 189], Equal: ['Equal', '=', 187],
  ArrowRight: ['ArrowRight', 'ArrowRight', 39], ArrowLeft: ['ArrowLeft', 'ArrowLeft', 37],
};
async function tap(cdp, code, holdMs = 40) {
  const [c, k, v] = KEYS[code];
  await cdp.tap(c, k, v, holdMs);
}
async function hold(cdp, code, ms) {
  const [c, k, v] = KEYS[code];
  await cdp.key(c, k, v);
  await sleep(ms);
  await cdp.keyUp(c, k, v);
}

async function sessionFile() {
  const cdp = await CDP.launch({ port: 9223, userDataDir: '/tmp/sr2-hardest-profile', width: 1280, height: 800 });
  const errors = cdp.consoleErrors();
  try {
    step = 'boot';
    await cdp.navigate(INDEX);
    const booted = await waitFor(cdp, 'globalThis.__hardest && globalThis.__hardest.state().screen === "menu"', 20000);
    const s0 = await state(cdp);
    report('boot', booted && s0.levels === 114 && errors.length === 0,
      `menu=${s0.screen} levels=${s0.levels} volume=${s0.volume} mute=${s0.mute} consoleErrors=${errors.length}`);

    step = 'settings';
    for (let i = 0; i < 5; i++) await tap(cdp, 'Minus');
    await tap(cdp, 'KeyM');
    let s = await state(cdp);
    const saved = await cdp.eval(`JSON.parse(localStorage.getItem('${SAVE_KEY}'))`);
    const adjOk = s.volume === 0.5 && s.mute === true && saved.volume === 0.5 && saved.mute === true;
    await sleep(250); // let the menu redraw with the new settings
    await cdp.screenshot(resolve(EVD, 'sr2-hardest-settings.png'));
    await cdp.navigate(INDEX);
    await waitFor(cdp, 'globalThis.__hardest && globalThis.__hardest.state().screen === "menu"', 20000);
    s = await state(cdp);
    const persistOk = s.volume === 0.5 && s.mute === true;
    report('settings-volume-mute', adjOk && persistOk,
      `after -x5,M: volume=${s.volume} mute=${s.mute}; reload persisted=${persistOk}; localStorage=${JSON.stringify({ volume: saved.volume, mute: saved.mute })}`);
    await tap(cdp, 'KeyM'); // unmute
    for (let i = 0; i < 5; i++) await tap(cdp, 'Equal');
    s = await state(cdp);
    report('settings-volume-clamp', s.volume === 1 && s.mute === false, `after M,+x5: volume=${s.volume} mute=${s.mute}`);

    step = 'start-move-pause';
    await tap(cdp, 'Enter');
    await waitFor(cdp, 'globalThis.__hardest.state().screen === "play"', 5000);
    const x0 = await playerX(cdp);
    await hold(cdp, 'KeyD', 700);
    const x1 = await playerX(cdp);
    await tap(cdp, 'Escape');
    const paused = (await state(cdp)).screen === 'pause';
    await tap(cdp, 'Escape');
    const resumed = (await state(cdp)).screen === 'play';
    report('start-move-pause', x1 - x0 > 80 && paused && resumed,
      `Enter->L1, KeyD700ms moved ${(x1 - x0).toFixed(1)}px, pause=${paused}, resume=${resumed}`);

    step = 'death-respawn';
    await hold(cdp, 'KeyD', 1300);
    await hold(cdp, 'KeyS', 900);
    const died = await waitFor(cdp, 'globalThis.__hardest.state().deaths >= 1', 9000, 100);
    await sleep(600); // DEAD_TIME 0.25s + margin
    const sd = await state(cdp);
    const px = await playerX(cdp);
    report('death-respawn', died && sd.status === 'play' && sd.deaths >= 1 && px < 110,
      `died=${died} deaths=${sd.deaths} status=${sd.status} respawnX=${px.toFixed(1)} (S-row checkpoint, spawn=38/col2=70)`);

    step = 'clear-medal-next';
    await hold(cdp, 'KeyS', 1800);
    let cleared = false;
    for (let i = 0; i < 8 && !cleared; i++) { await hold(cdp, 'KeyD', 600); cleared = (await state(cdp)).screen === 'clear'; }
    const sc = await state(cdp);
    await sleep(250);
    await cdp.screenshot(resolve(EVD, 'sr2-hardest-clear.png'));
    const best1 = await cdp.eval(`(JSON.parse(localStorage.getItem('${SAVE_KEY}')).best || {})['1']`);
    await tap(cdp, 'Enter');
    await waitFor(cdp, 'globalThis.__hardest.state().screen === "play"', 5000);
    const sn = await state(cdp);
    await tap(cdp, 'Escape');
    await tap(cdp, 'KeyQ');
    const backAtMenu = (await state(cdp)).screen === 'menu';
    report('clear-medal-next', cleared && sc.status === 'clear' && sn.level === 2 && backAtMenu && !!best1 && !!best1.medal,
      `clear=${cleared} medal=${best1 && best1.medal} best1=${JSON.stringify(best1)} Enter->L${sn.level} quitToMenu=${backAtMenu}`);

    step = 'menu-medal-dot';
    await sleep(250);
    const unlocked = (await state(cdp)).unlocked;
    await cdp.screenshot(resolve(EVD, 'sr2-hardest-medals.png'));
    report('menu-medal-dot', unlocked >= 2 && !!best1.medal, `unlocked=${unlocked} best1.medal=${best1.medal} (D-47 render path)`);

    step = 'touch-joystick';
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    const rect = await cdp.eval(`(r => ({ l: r.left, t: r.top, w: r.width, h: r.height }))(document.getElementById('c').getBoundingClientRect())`);
    const toClient = (sx, sy) => ({ x: rect.l + sx * rect.w / 960, y: rect.t + sy * rect.h / 576 });
    // start level 2 via the menu with real keys, then drag a joystick right
    await tap(cdp, 'ArrowRight'); // sel 0 -> 1 (level 2)
    await tap(cdp, 'Enter');
    await waitFor(cdp, 'globalThis.__hardest.state().screen === "play" && globalThis.__hardest.state().level === 2', 5000);
    const tx0 = await playerX(cdp);
    const a = toClient(300, 400), b = toClient(380, 400);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: b.x, y: b.y, id: 1 }] });
    await sleep(700);
    const tx1 = await playerX(cdp);
    await cdp.screenshot(resolve(EVD, 'sr2-hardest-touch.png'));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const st2 = await state(cdp);
    report('touch-joystick', st2.level === 2 && tx1 - tx0 > 20,
      `touch drag right on canvas: player.x ${tx0.toFixed(1)} -> ${tx1.toFixed(1)} (level ${st2.level})`);

    step = 'music-bed';
    await sleep(1200);
    const sm = await state(cdp);
    report('music-bed', sm.musicTicks > 0, `scheduler ticks=${sm.musicTicks} (WebAudio recipes only; audibility not asserted under --mute-audio)`);

    step = 'level-select-midcorpus';
    await cdp.eval(`localStorage.setItem('${SAVE_KEY}', JSON.stringify({ unlocked: 60, deaths: 123, best: { '1': { deaths: 0, time: 4.2, medal: 'gold' }, '2': { deaths: 2, time: 9.1, medal: 'silver' } }, mute: false, volume: 0.8 }))`);
    await cdp.navigate(INDEX);
    await waitFor(cdp, 'globalThis.__hardest && globalThis.__hardest.state().screen === "menu"', 20000);
    const su = await state(cdp);
    let level = -1;
    for (let attempt = 0; attempt < 3 && level !== 47; attempt++) {
      if (attempt > 0) { // wrong landing: back to menu, re-aim from current selection
        await tap(cdp, 'Escape'); await tap(cdp, 'KeyQ');
        const cur = (await state(cdp)).level || 47;
        const extra = 47 - cur;
        for (let i = 0; i < Math.abs(extra); i++) await tap(cdp, extra > 0 ? 'ArrowRight' : 'ArrowLeft');
      } else {
        for (let i = 0; i < 46; i++) await tap(cdp, 'ArrowRight');
      }
      await tap(cdp, 'Enter');
      await waitFor(cdp, 'globalThis.__hardest.state().screen === "play"', 5000);
      level = (await state(cdp)).level;
    }
    const mx0 = await playerX(cdp);
    await hold(cdp, 'KeyD', 900);
    await hold(cdp, 'KeyS', 500);
    const mx1 = await playerX(cdp);
    await sleep(250);
    await cdp.screenshot(resolve(EVD, 'sr2-hardest-midcorpus.png'));
    const hud = await cdp.eval(`(L => L ? L.name : null)(globalThis.HARDEST_LEVELS.find(l => l.id === 47))`);
    report('level-select-midcorpus', su.unlocked === 60 && level === 47 && Math.abs(mx1 - mx0) > 20,
      `seeded unlocked=${su.unlocked}; 46x ArrowRight + Enter (real keys) -> level ${level} (${hud}); moved ${(mx1 - mx0).toFixed(1)}px`);

    step = 'final';
    report('console-clean', errors.length === 0, `console errors / exceptions across session: ${errors.length}`);
    if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
  } catch (e) {
    report('session-file', false, `threw during "${step}": ${e.message}`);
  } finally {
    await cdp.close();
  }
}

async function sessionHub() {
  const server = spawn('python3', ['-m', 'http.server', '8126', '--bind', '127.0.0.1', '-d', ROOT], { stdio: 'ignore' });
  let up = false;
  for (let i = 0; i < 50 && !up; i++) {
    await sleep(200);
    try { up = (await fetch('http://127.0.0.1:8126/')).ok; } catch {}
  }
  if (!up) { report('hub-http', false, 'python3 http.server did not come up on 127.0.0.1:8126'); server.kill('SIGKILL'); return; }
  const cdp = await CDP.launch({ port: 9224, userDataDir: '/tmp/sr2-hardest-profile-hub', width: 1280, height: 800 });
  const errors = cdp.consoleErrors();
  try {
    await cdp.navigate('http://127.0.0.1:8126/');
    await waitFor(cdp, 'document.readyState === "complete"', 15000);
    const card = await cdp.eval(`(() => { const a = document.querySelector('a.card[href="hardest/"]'); if (!a) return null; const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    if (!card) throw new Error('hub card for hardest/ not found');
    await cdp.click(card.x, card.y);
    const navigated = await waitFor(cdp, 'location.pathname === "/hardest/" && globalThis.__hardest && globalThis.__hardest.state().screen === "menu"', 20000);
    const s = navigated ? await state(cdp) : null;
    report('hub-http', navigated && s.levels === 114 && errors.length === 0,
      `real click on hub card -> ${navigated ? 'pathname=/hardest/ menu levels=' + s.levels : 'NO navigated'} consoleErrors=${errors.length}`);
  } catch (e) {
    report('hub-http', false, `threw: ${e.message}`);
  } finally {
    await cdp.close();
    server.kill('SIGKILL');
  }
}

await sessionFile();
await sessionHub();
const fails = results.filter((r) => !r.ok);
console.log(`\nSR2 MATRIX: ${results.length - fails.length}/${results.length} PASS${fails.length ? ' — FAILS: ' + fails.map((f) => f.name).join(', ') : ''}`);
process.exit(fails.length ? 1 : 0);
