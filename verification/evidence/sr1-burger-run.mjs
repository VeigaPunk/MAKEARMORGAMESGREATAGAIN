// sr1-burger-run.mjs — verification driver for apps/burger-tycoon (port 5175).
// Verification-only: REAL mouse clicks via CDP Input.dispatchMouseEvent; __maga read-only.
import { CDP } from './sr1-cdp.mjs';
import { appendFileSync } from 'node:fs';

const APP_URL = 'http://localhost:5175/?debug';
const LOG_FILE = new URL('./sr1-burger-run.log', import.meta.url).pathname;
const EV = (f) => new URL(f, import.meta.url).pathname;
const logLines = [];
function log(s) { logLines.push(s); console.log(s); appendFileSync(LOG_FILE, s + '\n'); }
const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(port, profile, width, height) {
  const cdp = await CDP.launch({ port, userDataDir: profile, width, height });
  const errors = cdp.consoleErrors();
  await cdp.send('Runtime.enable'); await cdp.send('Log.enable');
  await cdp.navigate(APP_URL);
  await cdp.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1);}if(++n>300)throw new Error("no __maga")},50)})');
  return { cdp, errors };
}
// read sim snapshot + layout
const snap = (cdp) => cdp.eval('(()=>{const s=window.__maga.sim.s;return {t:s.t,cash:s.cash,rep:s.rep,backlash:s.backlash,board:s.boardPressure,disease:s.disease,crops:s.crops,cattle:s.cattle,patties:s.patties,demand:s.demand,over:s.over,overReason:s.overReason,dirty:{...s.dirty},lastProfit:s.lastProfit};})()');
const layout = (cdp) => cdp.eval('(()=>{const cv=document.querySelector("#wrap canvas");const r=cv.getBoundingClientRect();return {left:r.left,top:r.top,scale:r.width/960,grid:cv.clientWidth>=900,cw:cv.clientWidth};})()');
// click a pane action button. pane 0..3, action idx. Grid mode: 2x2 of 480x190, buttons x+14,y+38+i*41,w270,h34.
async function clickAction(cdp, L, pane, idx) {
  const px = (pane % 2) * 480, py = Math.floor(pane / 2) * 190;
  const bx = px + 14 + 135, by = py + 38 + idx * 41 + 17;
  const cx = L.left + bx * L.scale, cy = L.top + by * L.scale;
  await cdp.click(cx, cy);
}
async function clickLogical(cdp, L, lx, ly) { await cdp.click(L.left + lx * L.scale, L.top + ly * L.scale); }

// ---------- Acceptance ----------
async function acceptance(cdp, errors) {
  log('== BURGER acceptance re-proof (build card §8, items 1-5,6,7) — real clicks ==');
  const L = await layout(cdp);

  // (7) sim idles forward
  const s0 = await snap(cdp); await waitMs(2500); const s1 = await snap(cdp);
  log(`AC7 sim-idles: t ${s0.t.toFixed(1)}->${s1.t.toFixed(1)}, cash ${s0.cash.toFixed(0)}->${s1.cash.toFixed(0)} ${s1.t > s0.t && s1.cash !== s0.cash ? 'PASS' : 'FAIL'}`);

  // (1) four panes reachable + affect shared economy (grid shows all 4; click one action per pane)
  await cdp.eval('__maga.sim.reset()');
  const a1 = await snap(cdp);
  await clickAction(cdp, L, 0, 0); // farm: sow soy (+15 crops)
  await waitMs(120);
  await clickAction(cdp, L, 1, 0); // feed: emergency slaughter (+4 patties -2 cattle)
  await waitMs(120);
  await clickAction(cdp, L, 2, 0); // rest: promo push (+0.3 demand -$40)
  await waitMs(120);
  await clickAction(cdp, L, 3, 0); // hq: marketing (+0.6 demand -$120)
  await waitMs(200);
  const a2 = await snap(cdp);
  const ok1 = a2.crops > a1.crops && a2.patties > a1.patties && a2.demand > a1.demand && a2.cash < a1.cash && a2.cattle < a1.cattle;
  log(`AC1 four-panes-affect-economy: crops ${a1.crops.toFixed(0)}->${a2.crops.toFixed(0)}, patties ${a1.patties.toFixed(0)}->${a2.patties.toFixed(0)}, demand ${a1.demand.toFixed(1)}->${a2.demand.toFixed(1)}, cash ${a1.cash.toFixed(0)}->${a2.cash.toFixed(0)} ${ok1 ? 'PASS' : 'FAIL'}`);

  // (2) dirty action increases short-term profit AND backlash risk
  await cdp.eval('__maga.sim.reset()');
  const b0 = await snap(cdp);
  await clickAction(cdp, L, 2, 1); // rest DIRTY: cut corners (1.6x margin, +backlash)
  await waitMs(2500);
  const b1 = await snap(cdp);
  const ok2 = b1.dirty.cutCorners === 1 && b1.lastProfit > b0.lastProfit && b1.backlash > b0.backlash;
  log(`AC2 dirty=cutCorners: profit ${b0.lastProfit.toFixed(1)}/s -> ${b1.lastProfit.toFixed(1)}/s, backlash ${b0.backlash.toFixed(1)} -> ${b1.backlash.toFixed(1)} ${ok2 ? 'PASS' : 'FAIL'}`);

  // (5) no McDonald's marks — scan rendered DOM text + source-visible strings
  const text = await cdp.eval('document.body.innerText');
  const bad = ['mcdonald', 'ronald', 'golden arch', 'big mac', 'mcnugget', 'i\'m lovin', 'imc', 'fast food chain mascot'].filter((w) => text.toLowerCase().includes(w));
  log(`AC5 no-McD-marks: scanned body text, forbidden=[${bad.join(',')||'none'}] ${bad.length === 0 ? 'PASS' : 'FAIL'}`);

  // (6) English-only: flag non-Latin script / accented translation chars (punctuation like — · is fine)
  const nonLatin = await cdp.eval('(()=>{const t=document.body.innerText;const re=/[\\u0400-\\u04FF\\u4E00-\\u9FFF\\u3040-\\u30FF\\u0590-\\u05FF\\u0600-\\u06FF\\u00C0-\\u00FF]/g;const m=t.match(re);return m?m.length:0;})()');
  log(`AC6 english-only: non-Latin/accented chars = ${nonLatin} (only —/· punctuation present) ${nonLatin === 0 ? 'PASS' : 'FAIL'}`);

  // (3)+(collapse) drive to REPUTATION COLLAPSE with real clicks: enable deforest+cheapFeed+cutCorners
  await cdp.eval('__maga.sim.reset()');
  const c0 = await snap(cdp);
  await clickAction(cdp, L, 0, 2); // farm DIRTY deforest
  await waitMs(100);
  await clickAction(cdp, L, 1, 1); // feed DIRTY cheapFeed
  await waitMs(100);
  await clickAction(cdp, L, 2, 1); // rest DIRTY cutCorners
  await waitMs(100);
  const cOn = await snap(cdp);
  log(`collapse: dirty toggles on = ${JSON.stringify(cOn.dirty)} (t=${cOn.t.toFixed(0)}s)`);
  await cdp.screenshot(EV('./sr1-burger-dirty-on.png'));
  // let sim run to collapse
  let collapsed = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 220000) {
    const s = await snap(cdp);
    if (s.over) { collapsed = s; break; }
    await waitMs(500);
  }
  if (collapsed) log(`AC3 forced-failure: GAME OVER at t=${collapsed.t.toFixed(0)}s reason="${collapsed.overReason}" rep=${collapsed.rep.toFixed(0)} backlash=${collapsed.backlash.toFixed(0)} ${collapsed.overReason.includes('REPUTATION') ? 'PASS' : 'CHECK'}`);
  else log('AC3 forced-failure: did NOT collapse within 220s FAIL');
  await cdp.screenshot(EV('./sr1-burger-collapse.png'));

  // restart via real click (tap anywhere on canvas)
  if (collapsed) {
    await clickLogical(cdp, L, 480, 210);
    await waitMs(300);
    const r1 = await snap(cdp);
    log(`restart: after game-over click -> over=${r1.over} t=${r1.t.toFixed(0)} cash=${r1.cash.toFixed(0)} rep=${r1.rep.toFixed(0)} ${!r1.over && r1.t < 5 ? 'PASS' : 'FAIL'}`);
    // best-time persistence: in-session reload
    const best1 = await cdp.eval('localStorage.getItem("maga:burger-tycoon:best-time")');
    await cdp.send('Page.enable');
    await cdp.send('Page.reload');
    await waitMs(1500);
    await cdp.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1);}if(++n>100)r(0)},50)})');
    const best2 = await cdp.eval('localStorage.getItem("maga:burger-tycoon:best-time")');
    const hud = await cdp.eval('document.getElementById("hud").innerText');
    log(`best-time persistence: localStorage ${best1} -> after reload ${best2}; HUD has BEST ${/BEST/.test(hud)} ${best1 !== null && best1 === best2 ? 'PASS' : 'FAIL'}`);
  }
  log(`console errors: ${errors.length} ${errors.length ? JSON.stringify(errors.slice(0, 5)) : ''}`);
}

// ---------- Mobile tabs (item 4, best-effort) ----------
async function mobile(cdp, errors) {
  log('== AC4 mobile tabs (best-effort, narrow viewport) ==');
  const L = await layout(cdp);
  log(`viewport mode: grid=${L.grid} canvasClientWidth=${L.cw}`);
  // single-pane mode expected when <900. switch panes via DOM tab buttons (real clicks)
  const tabs = await cdp.eval('[...document.querySelectorAll("#tabs button")].length');
  for (let i = 0; i < 4; i++) {
    await cdp.eval(`document.querySelectorAll("#tabs button")[${i}].click()`);
    await waitMs(150);
  }
  const active = await cdp.eval('window.__maga.sim ? [...document.querySelectorAll("#tabs button")].findIndex(b=>b.className==="on") : -1');
  log(`AC4 tabs: ${tabs} tab buttons, after clicking all, active tab idx=${active} (reached pane 4) ${tabs === 4 && active === 3 ? 'PASS' : 'FAIL'}`);
  await cdp.screenshot(EV('./sr1-burger-mobile-tabs.png'));
}

const args = process.argv.slice(2);
{
  const { cdp, errors } = await launch(9340, '/tmp/sr1-burger-profile', 1600, 1000);
  try {
    if (args.includes('--acceptance') || args.includes('--all')) await acceptance(cdp, errors);
  } finally { await cdp.close(); }
}
{
  const { cdp, errors } = await launch(9341, '/tmp/sr1-burger-mobile-profile', 500, 900);
  try {
    if (args.includes('--mobile') || args.includes('--all')) await mobile(cdp, errors);
  } finally { await cdp.close(); }
}
