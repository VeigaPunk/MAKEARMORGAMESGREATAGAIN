// sr1-impossible-run.mjs — verification driver for apps/impossible (port 5174).
// Verification-only: REAL key events via CDP Input.dispatchKeyEvent; __maga is read-only.
// Usage: node sr1-impossible-run.mjs [--sentinels] [--clear] [--all]
import { CDP } from './sr1-cdp.mjs';
import { readFileSync, appendFileSync } from 'node:fs';

const APP_URL = 'http://localhost:5174/?debug';
const PORT = 9333;
const THRESH_FILE = new URL('./sr1-impossible-thresholds.json', import.meta.url);
const LOG_FILE = new URL('./sr1-impossible-run.log', import.meta.url).pathname;

const logLines = [];
function log(s) { logLines.push(s); console.log(s); appendFileSync(LOG_FILE, s + '\n'); }

async function readState(cdp) {
  return cdp.eval('(()=>{const m=window.__maga;return {state:m.state,x:m.x,y:m.y,grounded:window.__proto.grounded,deaths:m.deaths,attempt:m.attempt,progress:m.progress,best:window.__proto.best};})()');
}
async function waitMs(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Poll until fn(state) is true; returns last state. Poll fast to catch 160ms death window.
async function pollUntil(cdp, fn, timeoutMs = 8000) {
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < timeoutMs) {
    last = await readState(cdp);
    if (fn(last)) return last;
    await waitMs(6);
  }
  return last;
}

async function launch() {
  const cdp = await CDP.launch({ port: PORT, userDataDir: '/tmp/sr1-impossible-profile' });
  const errors = cdp.consoleErrors();
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.navigate(APP_URL);
  await cdp.eval('new Promise(r=>{if(window.__maga)r(1);else{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1);}if(++n>300)throw new Error("__maga never appeared")},50);}})');
  return { cdp, errors };
}

// ---------- Task 1: death sentinels ----------
async function sentinels(cdp, errors) {
  log('== SENTINELS (D-33 gap / D-34 front-edge) — real key events ==');
  // Sentinel A: fresh run, no jump -> fall into gap 1400. Expect death x≈1410.
  await cdp.eval('__maga.reset()'); // reset(false) — diagnosis aid to restart attempt; sentinels measured with real keys below
  await waitMs(250);
  let st = await pollUntil(cdp, (s) => s.state === 'dead', 8000);
  const gapDeathX = st.x, gapDeaths = st.deaths;
  log(`SENTINEL A (floor-absence gap): state=${st.state} death x=${gapDeathX.toFixed(1)} (sentinel x≈1410) deaths=${gapDeaths} ${Math.abs(gapDeathX - 1410) <= 3 ? 'PASS' : 'FAIL'}`);
  await cdp.screenshot(new URL('./sr1-impossible-sentinel-gap.png', import.meta.url).pathname);
  await waitMs(300);

  // Sentinel B: jump gap1400, spike1900, dbl2400 with real keys, then run into block 3000 unjumped.
  // Expect front-edge side-kill x≈2967.
  await cdp.eval('__maga.reset()');
  await waitMs(250);
  const jumps = [1317, 1773, 2292]; // fire thresholds just before gap/spike/double
  let ji = 0;
  const t0 = Date.now();
  let died = null;
  while (Date.now() - t0 < 12000) {
    const s = await readState(cdp);
    if (s.state === 'dead') { died = s; break; }
    if (ji < jumps.length && s.x >= jumps[ji] - 6) {
      await cdp.tap('Space', ' ', 32);
      ji++;
    }
    await waitMs(4);
  }
  if (died) log(`SENTINEL B (front-edge side-kill): death x=${died.x.toFixed(1)} (sentinel x≈2967) ${Math.abs(died.x - 2967) <= 3 ? 'PASS' : 'FAIL'}`);
  else log('SENTINEL B: did not die (unexpected)');
  await cdp.screenshot(new URL('./sr1-impossible-sentinel-block.png', import.meta.url).pathname);
  log(`console errors so far: ${errors.length}`);
}

// ---------- Task 2: full clear with real input ----------
async function fullClear(cdp, errors) {
  log('== FULL CLEAR attempt (LEVEL_END 9900) — real key events, closed loop ==');
  const thresholds = JSON.parse(readFileSync(THRESH_FILE, 'utf8'));
  log(`thresholds: ${JSON.stringify(thresholds)}`);
  await cdp.eval('__maga.reset()');
  await waitMs(250);
  const LEAD = 4; // px early; fire lands ~threshold±few px after eval+dispatch+frame latency
  let ti = 0;
  const t0 = Date.now();
  let lastX = -1, stagnant = 0;
  while (Date.now() - t0 < 40000) {
    const s = await readState(cdp);
    if (s.state === 'clear') {
      log(`FULL CLEAR PASS: state=clear at x=${s.x.toFixed(1)} attempt=${s.attempt} deaths=${s.deaths} time=${((Date.now() - t0) / 1000).toFixed(1)}s best=${(s.best * 100).toFixed(0)}%`);
      await cdp.screenshot(new URL('./sr1-impossible-clear.png', import.meta.url).pathname);
      return true;
    }
    if (s.state === 'dead') {
      log(`FULL CLEAR: died at x=${s.x.toFixed(1)} (threshold idx ${ti}, next=${thresholds[ti]}) deaths=${s.deaths}`);
      await cdp.screenshot(new URL(`./sr1-impossible-clear-death-${s.deaths}.png`, import.meta.url).pathname);
      return false;
    }
    if (ti < thresholds.length && s.x >= thresholds[ti] - LEAD) {
      await cdp.tap('Space', ' ', 32, 30);
      log(`  jump fired: threshold=${thresholds[ti]} x≈${s.x.toFixed(1)} (${((Date.now() - t0) / 1000).toFixed(2)}s)`);
      ti++;
    }
    // stagnation guard (pause/key loss)
    if (Math.abs(s.x - lastX) < 0.5) { if (++stagnant > 400) { log('STAGNANT — aborting'); return false; } } else stagnant = 0;
    lastX = s.x;
    await waitMs(3);
  }
  log('FULL CLEAR: timeout');
  return false;
}

const { cdp, errors } = await launch();
const args = process.argv.slice(2);
try {
  if (args.includes('--sentinels') || args.includes('--all')) await sentinels(cdp, errors);
  if (args.includes('--clear') || args.includes('--all')) {
    let tries = 0, done = false;
    while (tries < 3 && !done) { tries++; if (tries > 1) log(`--- retry ${tries} ---`); done = await fullClear(cdp, errors); if (!done) await waitMs(400); }
    log(done ? 'FULL CLEAR RESULT: PASS' : 'FULL CLEAR RESULT: FAIL');
  }
  log(`total console errors: ${errors.length} ${errors.length ? JSON.stringify(errors.slice(0, 5)) : ''}`);
} finally {
  await cdp.close();
}
