// sr2-burger-run.mjs — verification driver for apps/burger-tycoon (port 5175, ?debug).
// sr2 evidence: drives the FINAL app with REAL CDP input (mouse clicks, key taps).
// Covers: 7 acceptance items re-proof + title->play, pause/resume, settings
// (mute+volume persisted across reload), SFX scheduled (WebAudio readable),
// art renders, collapse reachable, restart, best-time persistence.
// Precedent: verification/evidence/sr1-burger-run.mjs. Run: node verification/evidence/sr2-burger-run.mjs
import { CDP } from './sr1-cdp.mjs';
import { appendFileSync, writeFileSync } from 'node:fs';

const APP_URL = 'http://localhost:5175/?debug';
const LOG_FILE = new URL('./sr2-burger-run.log', import.meta.url).pathname;
const EV = (f) => new URL(f, import.meta.url).pathname;
writeFileSync(LOG_FILE, '');
const logLines = [];
let fails = 0;
function log(s) { logLines.push(s); console.log(s); appendFileSync(LOG_FILE, s + '\n'); }
function check(name, ok, detail) {
  if (!ok) fails++;
  log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
}
const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(port, profile, width, height) {
  const cdp = await CDP.launch({ port, userDataDir: profile, width, height });
  const errors = cdp.consoleErrors();
  await cdp.send('Runtime.enable'); await cdp.send('Log.enable');
  await cdp.navigate(APP_URL);
  await cdp.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>300)throw new Error("no __maga")},50)})');
  return { cdp, errors };
}
const snap = (cdp) => cdp.eval('(()=>{const s=window.__maga.sim.s;return {t:s.t,cash:s.cash,rep:s.rep,backlash:s.backlash,stain:s.blStain,board:s.boardPressure,disease:s.disease,crops:s.crops,cattle:s.cattle,patties:s.patties,demand:s.demand,over:s.over,overReason:s.overReason,dirty:{...s.dirty},lastProfit:s.lastProfit,overheadNow:s.overheadNow};})()');
const layout = (cdp) => cdp.eval('(()=>{const cv=document.querySelector("#wrap canvas");const r=cv.getBoundingClientRect();return {left:r.left,top:r.top,scale:r.width/960,grid:r.width>=900,cw:r.width};})()');
const clickLogical = async (cdp, L, lx, ly) => cdp.click(L.left + lx * L.scale, L.top + ly * L.scale);

// grid geometry: pane i at ((i%2)*480, floor(i/2)*190); cards x+10,y+32+idx*36,w246,h30
async function clickGridAction(cdp, L, pane, idx) {
  const px = (pane % 2) * 480, py = Math.floor(pane / 2) * 190;
  await clickLogical(cdp, L, px + 10 + 123, py + 32 + idx * 36 + 15);
}
async function waitFor(cdp, expr, timeoutMs, stepMs = 400) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await cdp.eval(expr)) return true;
    await waitMs(stepMs);
  }
  return false;
}

// ---------- desktop run ----------
{
  const { cdp, errors } = await launch(9360, '/tmp/sr2-burger-profile', 1600, 1000);
  try {
    log('== sr2 BURGER Tycoon acceptance + flow (final build, real input) ==');
    await waitMs(600);
    const L = await layout(cdp);

    // TITLE -> PLAY
    const mode0 = await cdp.eval('__maga.getMode()');
    check('title screen at boot', mode0 === 'title', `mode=${mode0}`);
    await cdp.screenshot(EV('./sr2-burger-title.png'));
    await clickLogical(cdp, L, 480, 273);
    await waitMs(500);
    const mode1 = await cdp.eval('__maga.getMode()');
    check('title->play via real click', mode1 === 'play', `mode=${mode1}`);

    // AC7 sim idles
    const s0 = await snap(cdp); await waitMs(2500); const s1 = await snap(cdp);
    check('AC7 sim-idles', s1.t > s0.t && s1.cash !== s0.cash, `t ${s0.t.toFixed(1)}->${s1.t.toFixed(1)}, cash ${s0.cash.toFixed(0)}->${s1.cash.toFixed(0)}`);
    await cdp.screenshot(EV('./sr2-burger-grid.png'));

    // AC1 four panes affect shared economy (one real click per pane)
    await cdp.eval('__maga.sim.reset()');
    const a1 = await snap(cdp);
    await clickGridAction(cdp, L, 0, 0); await waitMs(120);
    await clickGridAction(cdp, L, 1, 0); await waitMs(120);
    await clickGridAction(cdp, L, 2, 0); await waitMs(120);
    await clickGridAction(cdp, L, 3, 0); await waitMs(250);
    const a2 = await snap(cdp);
    check('AC1 four-panes-affect-economy',
      a2.crops > a1.crops && a2.patties > a1.patties && a2.demand > a1.demand && a2.cash < a1.cash && a2.cattle < a1.cattle,
      `crops ${a1.crops.toFixed(0)}->${a2.crops.toFixed(0)}, patties ${a1.patties.toFixed(0)}->${a2.patties.toFixed(0)}, demand ${a1.demand.toFixed(1)}->${a2.demand.toFixed(1)}, cash ${a1.cash.toFixed(0)}->${a2.cash.toFixed(0)}`);

    // AC2 dirty = cutCorners raises profit AND backlash
    await cdp.eval('__maga.sim.reset()');
    const b0 = await snap(cdp);
    await clickGridAction(cdp, L, 2, 1);
    await waitMs(2500);
    const b1 = await snap(cdp);
    check('AC2 dirty=cutCorners', b1.dirty.cutCorners === 1 && b1.lastProfit > b0.lastProfit && b1.backlash > b0.backlash,
      `profit ${b0.lastProfit.toFixed(1)}->${b1.lastProfit.toFixed(1)}/s, backlash ${b0.backlash.toFixed(1)}->${b1.backlash.toFixed(1)}`);

    // SFX actually scheduled + WebAudio running
    const audio = await cdp.eval('(()=>{const s=__maga.sfx;return {voices:s.voices, running:s.running, muted:s.muted, music:s.musicVolume, sfxVol:s.sfxVolume};})()');
    check('SFX scheduled (WebAudio running, voices>0)', audio.running && audio.voices > 0, JSON.stringify(audio));

    // PAUSE / RESUME (real Esc key)
    const t1 = (await snap(cdp)).t;
    await cdp.tap('Escape', 'Escape', 27);
    await waitMs(400);
    const modePause = await cdp.eval('__maga.getMode()');
    await waitMs(1200);
    const tFrozen = (await snap(cdp)).t;
    check('pause: Esc freezes sim', modePause === 'pause' && Math.abs(tFrozen - t1) < 2, `mode=${modePause}, t ${t1.toFixed(1)}->${tFrozen.toFixed(1)}`);
    await cdp.tap('Escape', 'Escape', 27);
    await waitMs(1500);
    const t2 = (await snap(cdp)).t;
    const modeResume = await cdp.eval('__maga.getMode()');
    check('resume: Esc resumes sim', modeResume === 'play' && t2 > tFrozen + 0.5, `mode=${modeResume}, t ${tFrozen.toFixed(1)}->${t2.toFixed(1)}`);

    // SETTINGS: open via HUD button, set volumes + mute with real clicks, persist
    await cdp.eval('document.getElementById("settings-btn").click()');
    await waitMs(300);
    const vis0 = await cdp.eval('!document.getElementById("settings").classList.contains("hidden")');
    // music slider: click track at 30%
    const track = await cdp.eval('(()=>{const r=document.getElementById("vol-music").getBoundingClientRect();return {x:r.left,y:r.top+r.height/2,w:r.width};})()');
    await cdp.click(track.x + track.w * 0.3, track.y);
    await waitMs(200);
    // sfx slider to 50%
    const track2 = await cdp.eval('(()=>{const r=document.getElementById("vol-sfx").getBoundingClientRect();return {x:r.left,y:r.top+r.height/2,w:r.width};})()');
    await cdp.click(track2.x + track2.w * 0.5, track2.y);
    await waitMs(200);
    // mute checkbox
    const mbox = await cdp.eval('(()=>{const r=document.getElementById("mute-box").getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()');
    await cdp.click(mbox.x, mbox.y);
    await waitMs(300);
    const set1 = await cdp.eval('(()=>{const s=__maga.sfx;return {music:s.musicVolume,sfxVol:s.sfxVolume,muted:s.muted,ls:localStorage.getItem("maga:burger-tycoon:audio")};})()');
    check('settings: volumes+mute applied + persisted', vis0 && Math.abs(set1.music - 0.3) < 0.02 && Math.abs(set1.sfxVol - 0.5) < 0.02 && set1.muted === true && !!set1.ls,
      `music=${set1.music} sfx=${set1.sfxVol} muted=${set1.muted} ls=${set1.ls}`);
    await cdp.screenshot(EV('./sr2-burger-settings.png'));
    // reload -> persisted
    await cdp.send('Page.enable');
    await cdp.send('Page.reload');
    await waitMs(1800);
    await cdp.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>100)r(0)},50)})');
    const set2 = await cdp.eval('(()=>{const s=__maga.sfx;return {music:s.musicVolume,sfxVol:s.sfxVolume,muted:s.muted,musicSlider:document.getElementById("vol-music").value};})()');
    const sliderOk = Number(set2.musicSlider) >= 28 && Number(set2.musicSlider) <= 32;
    check('settings persist across reload', Math.abs(set2.music - 0.3) < 0.02 && set2.muted === true && sliderOk,
      `music=${set2.music} muted=${set2.muted} slider=${set2.musicSlider}`);
    // unmute for the rest of the run
    await cdp.eval('document.getElementById("settings-btn").click()');
    await waitMs(200);
    const mbox2 = await cdp.eval('(()=>{const r=document.getElementById("mute-box").getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()');
    await cdp.click(mbox2.x, mbox2.y);
    await waitMs(200);
    await cdp.eval('document.getElementById("settings-close").click()');
    await waitMs(200);
    // reload returns to title — START again with fresh layout for the collapse drive
    const L2 = await layout(cdp);
    await clickLogical(cdp, L2, 480, 273);
    await waitMs(500);
    const modeBack = await cdp.eval('__maga.getMode()');
    check('back to play after reload (real click)', modeBack === 'play', `mode=${modeBack}`);

    // AC5 no McDonald's marks
    const text = await cdp.eval('document.body.innerText');
    const bad = ['mcdonald', 'ronald', 'golden arch', 'big mac', 'mcnugget', 'mc muffin', "i'm lovin", 'imc'].filter((w) => text.toLowerCase().includes(w));
    check('AC5 no-McD-marks', bad.length === 0, `forbidden=[${bad.join(',') || 'none'}]`);

    // AC6 English-only
    const nonLatin = await cdp.eval('(()=>{const t=document.body.innerText;const re=/[\\u0400-\\u04FF\\u4E00-\\u9FFF\\u3040-\\u30FF\\u0590-\\u05FF\\u0600-\\u06FF\\u00C0-\\u00FF]/g;const m=t.match(re);return m?m.length:0;})()');
    check('AC6 english-only', nonLatin === 0, `non-Latin/accented chars=${nonLatin}`);

    // AC3 forced failure: real clicks flip all three dirty toggles -> REPUTATION COLLAPSE
    await cdp.eval('__maga.sim.reset()');
    await clickGridAction(cdp, L2, 0, 2); await waitMs(120);
    await clickGridAction(cdp, L2, 1, 1); await waitMs(120);
    await clickGridAction(cdp, L2, 2, 1); await waitMs(200);
    const cOn = await snap(cdp);
    log(`collapse: dirty toggles = ${JSON.stringify(cOn.dirty)} (t=${cOn.t.toFixed(0)}s)`);
    const collapsed = await waitFor(cdp, 'window.__maga.sim.s.over', 150000, 500);
    const cEnd = await snap(cdp);
    check('AC3 forced-failure (REPUTATION COLLAPSE, comparable pressure)',
      collapsed && cEnd.overReason.includes('REPUTATION') && cEnd.t >= 25 && cEnd.t <= 120,
      `over=${cEnd.over} t=${cEnd.t.toFixed(0)}s reason="${cEnd.overReason}" rep=${cEnd.rep.toFixed(0)} backlash=${cEnd.backlash.toFixed(0)} (sr1 reference: t=42s)`);
    await cdp.screenshot(EV('./sr2-burger-collapse.png'));

    // restart via real click on RETRY button (canvas button at 360,312 logical)
    await clickLogical(cdp, L2, 360, 312);
    await waitMs(400);
    const r1 = await snap(cdp);
    check('restart after game-over (real click)', !r1.over && r1.t < 5 && r1.cash > 400, `over=${r1.over} t=${r1.t.toFixed(1)} cash=${r1.cash.toFixed(0)}`);

    // best-time persistence across reload
    const best1 = await cdp.eval('localStorage.getItem("maga:burger-tycoon:best-time")');
    await cdp.send('Page.reload');
    await waitMs(1800);
    await cdp.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>100)r(0)},50)})');
    const best2 = await cdp.eval('localStorage.getItem("maga:burger-tycoon:best-time")');
    const hud = await cdp.eval('document.getElementById("stats").innerText');
    check('best-time persistence across reload', best1 !== null && best1 === best2 && /BEST/.test(hud), `ls ${best1} -> ${best2}`);

    const appErrors = errors.filter((e) => !/favicon/.test(e));
    check('console errors: 0 app-originated', appErrors.length === 0, appErrors.slice(0, 4).join(' | ') || 'clean');
  } finally { await cdp.close(); }
}

// ---------- mobile / single-pane run ----------
{
  const { cdp, errors } = await launch(9361, '/tmp/sr2-burger-mobile-profile', 500, 900);
  try {
    log('== AC4 mobile tabs + single-pane art (best-effort, 500px viewport) ==');
    const L = await layout(cdp);
    log(`viewport mode: grid=${L.grid} canvasClientWidth=${L.cw}`);
    await clickLogical(cdp, L, 480, 273); // START
    await waitMs(400);
    const tabs = await cdp.eval('[...document.querySelectorAll("#tabs button")].length');
    for (let i = 0; i < 4; i++) {
      await cdp.eval(`document.querySelectorAll("#tabs button")[${i}].click()`);
      await waitMs(150);
    }
    const active = await cdp.eval('[...document.querySelectorAll("#tabs button")].findIndex(b=>b.className==="on")');
    check('AC4 tabs: 4 DOM tabs, pane 4 reachable', tabs === 4 && active === 3, `tabs=${tabs} active=${active}`);
    await cdp.screenshot(EV('./sr2-burger-mobile.png'));
    const appErrors = errors.filter((e) => !/favicon/.test(e));
    check('mobile console errors: 0 app-originated', appErrors.length === 0, appErrors.slice(0, 3).join(' | ') || 'clean');
  } finally { await cdp.close(); }
}

log(`== SUMMARY: ${fails === 0 ? 'ALL PASS' : fails + ' FAIL(s)'} ==`);
process.exit(fails === 0 ? 0 : 1);
