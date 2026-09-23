// sr2-impossible-run.mjs — sr2 verification driver for apps/impossible (port 5174).
// Drives the FINAL BUILD (games/impossible-game served on 5174) with REAL input:
// mouse clicks, key taps, CDP touch. Covers: title->play, audio scheduling,
// jump, pause/resume (sim frozen), death->respawn <=200ms, practice checkpoint
// start + respawn-at-flag + no-best-recording, input-offset calibration
// set+persist across reload, settings volume/mute set+persist across reload,
// tap-to-jump via CDP touch (title chip + in-run). Precedent: sr1-impossible-run.mjs.
// Usage: node verification/evidence/sr2-impossible-run.mjs
import { CDP } from './sr1-cdp.mjs';
import { appendFileSync, writeFileSync } from 'node:fs';

const APP_URL = 'http://localhost:5174/?debug';
const PORT = 9371;
const LOG_FILE = new URL('./sr2-impossible-run.log', import.meta.url).pathname;
const EV = (f) => new URL(f, import.meta.url).pathname;
writeFileSync(LOG_FILE, '');
let fails = 0;
function log(s) { console.log(s); appendFileSync(LOG_FILE, s + '\n'); }
function check(name, ok, detail) {
  if (!ok) fails++;
  log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
}
const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));

const cdp = await CDP.launch({ port: PORT, userDataDir: '/tmp/sr2-impossible-profile' });
const errors = cdp.consoleErrors();
await cdp.send('Runtime.enable'); await cdp.send('Log.enable');
await cdp.navigate(APP_URL);
await cdp.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>300)r(0)},50)})');
await cdp.eval('localStorage.clear()');   // fresh-profile defaults so repeated runs are idempotent
await cdp.send('Page.reload');
await waitMs(1200);
await cdp.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>100)r(0)},50)})');

const snap = () => cdp.eval('(()=>{const m=window.__maga;return {state:m.state,x:m.x,y:m.y,deaths:m.deaths,attempt:m.attempt,mode:m.mode,screen:m.screen,practice:m.practice,lastCp:m.lastCp,inputOffset:m.inputOffset,respawnMs:m.respawnMs,paused:m.paused};})()');
async function pollUntil(fn, timeoutMs = 8000, stepMs = 6) {
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < timeoutMs) {
    last = await snap();
    if (fn(last)) return last;
    await waitMs(stepMs);
  }
  return last;
}
const layout = () => cdp.eval('(()=>{const cv=document.querySelector("canvas");const r=cv.getBoundingClientRect();return {left:r.left,top:r.top,scale:r.width/960};})()');
async function clickChip(id) {
  const L = await layout();
  const c = await cdp.eval(`(()=>{const c=window.__maga.chips.find(c=>c.id==="${id}");return c?{x:c.x,y:c.y,w:c.w,h:c.h}:null;})()`);
  if (!c) throw new Error('chip not found: ' + id);
  await cdp.click(L.left + (c.x + c.w / 2) * L.scale, L.top + (c.y + c.h / 2) * L.scale);
  await waitMs(160);
}
async function touchAt(lx, ly) {
  const L = await layout();
  const x = Math.round(L.left + lx * L.scale), y = Math.round(L.top + ly * L.scale);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  await waitMs(60);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await waitMs(120);
}
async function minYAfterJump(doJump, windowMs = 600) {
  const y0 = (await snap()).y;
  await doJump();
  const t0 = Date.now();
  let minY = y0;
  while (Date.now() - t0 < windowMs) { minY = Math.min(minY, (await snap()).y); await waitMs(8); }
  return { y0, minY };
}

try {
  log('== sr2 IMPOSSIBLE RUN — features/flow/audio on FINAL BUILD (real input) ==');

  // ---- boot / title ----
  let s = await snap();
  check('boots to title screen', s.mode === 'title' && s.screen === 'title', `mode=${s.mode} screen=${s.screen}`);
  await waitMs(400);
  await cdp.screenshot(EV('./sr2-impossible-title.png'));

  // ---- title -> play (real click on PLAY chip) ----
  await clickChip('play');
  s = await snap();
  check('title->play via real chip click', s.mode === 'run' && s.state === 'running' && s.attempt === 1, `mode=${s.mode} state=${s.state} attempt=${s.attempt}`);

  // ---- audio: music bed scheduled, WebAudio running ----
  await waitMs(1300);
  const audio = await cdp.eval('(()=>{const s=__maga.sfx;return {voices:s.voices, running:s.running, music:s.musicVolume, sfxVol:s.sfxVolume};})()');
  check('music bed scheduling (WebAudio running, voices>3)', audio.running && audio.voices > 3, JSON.stringify(audio));

  // ---- jump via real Space ----
  let r = await minYAfterJump(async () => { await cdp.tap('Space', ' ', 32, 40); });
  check('jump via real Space (y drops)', r.minY < r.y0 - 30, `y ${r.y0.toFixed(1)} -> min ${r.minY.toFixed(1)}`);

  // ---- pause / resume ----
  await cdp.tap('Escape', 'Escape', 27);
  await waitMs(300);
  const p1 = await snap();
  await waitMs(500);
  const p2 = await snap();
  check('pause: Esc freezes sim', p1.paused === true && Math.abs(p2.x - p1.x) < 0.01, `paused=${p1.paused} x ${p1.x.toFixed(2)} -> ${p2.x.toFixed(2)}`);
  await cdp.tap('Escape', 'Escape', 27);
  await waitMs(500);
  const p3 = await snap();
  check('resume: Esc resumes sim', p3.paused === false && p3.x > p2.x + 50, `x ${p2.x.toFixed(1)} -> ${p3.x.toFixed(1)}`);

  // ---- settings reachable from pause ----
  await cdp.tap('Escape', 'Escape', 27); await waitMs(250);
  await clickChip('settings');
  s = await snap();
  check('settings reachable from pause menu', s.screen === 'settings', `screen=${s.screen}`);
  await clickChip('back-settings');
  s = await snap();
  check('back from pause-settings returns to pause menu', s.screen === null && s.paused === true, `screen=${s.screen} paused=${s.paused}`);
  await clickChip('resume');
  s = await snap();
  check('resume from pause menu', s.paused === false && s.state === 'running', `paused=${s.paused} state=${s.state}`);

  // ---- death -> instant respawn (<=200ms), sentinel spot x~1410 ----
  const dDead = await pollUntil((v) => v.state === 'dead', 8000);
  check('death at gap x~1410 (no jump)', Math.abs(dDead.x - 1410) <= 3, `state=${dDead.state} x=${dDead.x.toFixed(1)} deaths=${dDead.deaths}`);
  const dLive = await pollUntil((v) => v.state === 'running', 2000);
  check('respawn <=200ms after death', dLive.respawnMs > 0 && dLive.respawnMs <= 200 && dLive.attempt === 2, `respawnMs=${dLive.respawnMs.toFixed(1)} attempt=${dLive.attempt}`);

  // ---- pause -> quit to title ----
  await cdp.tap('Escape', 'Escape', 27);
  await waitMs(250);
  await clickChip('quit');
  s = await snap();
  check('pause menu -> QUIT to title', s.mode === 'title' && s.screen === 'title', `mode=${s.mode} screen=${s.screen}`);

  // ---- practice: checkpoint start, respawn at flag, no best recording ----
  const bestBefore = await cdp.eval('window.__proto.best');
  await clickChip('practice-menu');
  s = await snap();
  check('practice select screen', s.screen === 'practice', `screen=${s.screen}`);
  await clickChip('cp-6600');
  s = await snap();
  check('practice start at FLAG 3 (x~6600)', s.mode === 'run' && s.practice === true && Math.abs(s.x - 6600) <= 60 && s.lastCp === 6600, `practice=${s.practice} x=${s.x.toFixed(1)} lastCp=${s.lastCp}`);
  await waitMs(250);
  await cdp.screenshot(EV('./sr2-impossible-practice.png'));
  const pd = await pollUntil((v) => v.state === 'dead', 8000);
  check('practice death (spike 6900, no jump)', pd.state === 'dead' && pd.x > 6850 && pd.x < 6950, `x=${pd.x.toFixed(1)}`);
  const pl = await pollUntil((v) => v.state === 'running', 2000);
  check('practice respawn at last flag (x~6600)', Math.abs(pl.x - 6600) <= 60 && pl.lastCp === 6600 && pl.practice === true, `x=${pl.x.toFixed(1)} lastCp=${pl.lastCp}`);
  const bestAfterPractice = await cdp.eval('window.__proto.best');
  check('practice: best-progress NOT recorded', Math.abs(bestAfterPractice - bestBefore) < 1e-9, `best ${bestBefore} -> ${bestAfterPractice}`);
  await cdp.tap('Escape', 'Escape', 27); await waitMs(250);
  await clickChip('quit');
  s = await snap();
  check('practice -> quit to title', s.mode === 'title', `mode=${s.mode}`);

  // ---- calibration: set 20ms, persist across reload, reset ----
  await clickChip('calibration');
  s = await snap();
  check('calibration screen', s.screen === 'calibration', `screen=${s.screen}`);
  await clickChip('offset-plus');
  await clickChip('offset-plus');
  s = await snap();
  const lsOffset = await cdp.eval('localStorage.getItem("maga:impossible:input-offset")');
  check('calibration set 20ms + persisted', s.inputOffset === 20 && lsOffset === '20', `inputOffset=${s.inputOffset} ls=${lsOffset}`);
  await cdp.screenshot(EV('./sr2-impossible-calibration.png'));
  await cdp.send('Page.reload');
  await waitMs(1500);
  await cdp.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>100)r(0)},50)})');
  s = await snap();
  check('calibration persists across reload', s.inputOffset === 20, `inputOffset=${s.inputOffset}`);
  await clickChip('calibration');
  await clickChip('offset-reset');
  const lsOffset0 = await cdp.eval('localStorage.getItem("maga:impossible:input-offset")');
  check('calibration reset to 0 (clean for clear-driver)', lsOffset0 === '0', `ls=${lsOffset0}`);
  await clickChip('back-title');

  // ---- settings: volumes + mute, persist across reload ----
  await clickChip('settings');
  s = await snap();
  check('settings screen', s.screen === 'settings', `screen=${s.screen}`);
  await clickChip('music-minus');   // 0.7 -> 0.6
  await clickChip('sfx-minus');     // 0.9 -> 0.8
  await clickChip('mute-toggle');   // muted
  const st1 = await cdp.eval('(()=>{const s=__maga.sfx;return {music:s.musicVolume,sfxVol:s.sfxVolume,muted:s.muted,ls:localStorage.getItem("maga:impossible:settings")};})()');
  check('settings applied + persisted', Math.abs(st1.music - 0.6) < 0.001 && Math.abs(st1.sfxVol - 0.8) < 0.001 && st1.muted === true && !!st1.ls, JSON.stringify(st1));
  await cdp.screenshot(EV('./sr2-impossible-settings.png'));
  await cdp.send('Page.reload');
  await waitMs(1500);
  await cdp.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>100)r(0)},50)})');
  const st2 = await cdp.eval('(()=>{const s=__maga.sfx;return {music:s.musicVolume,sfxVol:s.sfxVolume,muted:s.muted};})()');
  check('settings persist across reload', Math.abs(st2.music - 0.6) < 0.001 && Math.abs(st2.sfxVol - 0.8) < 0.001 && st2.muted === true, JSON.stringify(st2));
  await clickChip('settings');
  await clickChip('mute-toggle');   // unmute for the remaining run
  const st3 = await cdp.eval('(()=>{const s=__maga.sfx;return {muted:s.muted};})()');
  check('unmute applied', st3.muted === false, `muted=${st3.muted}`);

  // ---- touch: tap title chip, tap-to-jump in run ----
  await clickChip('back-settings'); // not on title path; ensure title
  s = await snap();
  if (s.screen !== 'title') { await cdp.tap('Escape', 'Escape', 27); await waitMs(200); }
  const playChip = await cdp.eval('(()=>{const c=window.__maga.chips.find(c=>c.id==="play");return {x:c.x+c.w/2,y:c.y+c.h/2};})()');
  await touchAt(playChip.x, playChip.y);
  s = await snap();
  check('touch tap on title PLAY chip starts run', s.mode === 'run' && s.state === 'running', `mode=${s.mode}`);
  r = await minYAfterJump(async () => { await touchAt(480, 300); });
  check('tap-to-jump via CDP touch (y drops)', r.minY < r.y0 - 30, `y ${r.y0.toFixed(1)} -> min ${r.minY.toFixed(1)}`);
  await cdp.tap('Escape', 'Escape', 27); await waitMs(250);
  await clickChip('quit');

  const appErrors = errors.filter((e) => !/favicon/.test(e));
  check('console errors: 0 app-originated', appErrors.length === 0, appErrors.slice(0, 4).join(' | ') || 'clean');
} finally {
  await cdp.close();
}
log(`== SUMMARY: ${fails === 0 ? 'ALL PASS' : fails + ' FAIL(s)'} ==`);
process.exit(fails === 0 ? 0 : 1);
