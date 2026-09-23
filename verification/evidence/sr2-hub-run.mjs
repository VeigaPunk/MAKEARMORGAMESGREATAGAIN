// sr2-hub-run.mjs — hub entry-point boot proof for burger-tycoon (sr2).
// Requires: python3 -m http.server 8123 from the REPO ROOT, and a fresh
// games/burger-tycoon build (npm run build:fleet). Real input only.
// Evidence: verification/evidence/sr2-hub-run.log + sr2-hub-burger.png.
import { CDP } from './sr1-cdp.mjs';
import { appendFileSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:8123';
const LOG_FILE = new URL('./sr2-hub-run.log', import.meta.url).pathname;
const EV = (f) => new URL(f, import.meta.url).pathname;
writeFileSync(LOG_FILE, '');
let fails = 0;
function log(s) { console.log(s); appendFileSync(LOG_FILE, s + '\n'); }
function check(name, ok, detail) {
  if (!ok) fails++;
  log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
}
const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));

const cdp = await CDP.launch({ port: 9370, userDataDir: '/tmp/sr2-hub-profile', width: 1400, height: 900 });
const errors = cdp.consoleErrors();
const nonLocal = [];
await cdp.send('Runtime.enable'); await cdp.send('Log.enable'); await cdp.send('Network.enable');
cdp.on('Network.requestWillBeSent', (p) => {
  const u = p.request.url;
  if (u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('about:')) return;
  if (u.startsWith(BASE + '/')) return;
  nonLocal.push(u);
});
try {
  log('== sr2 hub entry point: burger-tycoon boot proof (built game, real input) ==');
  await cdp.navigate(BASE + '/');
  await cdp.eval(`new Promise(r=>{if(document.readyState==='complete')r(1);else addEventListener('load',()=>r(1),{once:true})})`);
  await waitMs(300);

  // real click on the hub card
  const card = await cdp.eval(`(()=>{const a=[...document.querySelectorAll('a.card')].find(x=>x.getAttribute('href')==='games/burger-tycoon/');if(!a)return null;a.scrollIntoView({block:'center'});const r=a.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  check('hub card present', !!card, 'games/burger-tycoon/');
  await cdp.click(card.x, card.y);
  await waitMs(1500);
  const url = await cdp.eval('location.href');
  check('hub click navigates into game', url.includes('games/burger-tycoon/'), url);
  // the shipped game exposes the read-only hook only with ?debug — reload with it
  await cdp.send('Page.navigate', { url: BASE + '/games/burger-tycoon/?debug' });
  await waitMs(1200);
  await cdp.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>200)r(0)},50)})');
  const hasHook = await cdp.eval('!!window.__maga');
  check('built game boots (?debug hook)', hasHook, `url=${url}`);
  const mode0 = await cdp.eval('__maga.getMode()');
  check('title screen on built game', mode0 === 'title', `mode=${mode0}`);

  // real click START, then a real action click (sow)
  const L = await cdp.eval('(()=>{const cv=document.querySelector("#wrap canvas");const r=cv.getBoundingClientRect();return {left:r.left,top:r.top,scale:r.width/960};})()');
  await cdp.click(L.left + 480 * L.scale, L.top + 273 * L.scale);
  await waitMs(500);
  const s0 = await cdp.eval('__maga.sim.s.crops');
  await cdp.click(L.left + (0 + 10 + 123) * L.scale, L.top + (0 + 32 + 15) * L.scale);
  await waitMs(400);
  const s1 = await cdp.eval('__maga.sim.s.crops');
  check('real click action on built game (sow)', s1 > s0, `crops ${s0.toFixed(0)}->${s1.toFixed(0)}`);
  await cdp.screenshot(EV('./sr2-hub-burger.png'));

  const appErrors = errors.filter((e) => !/favicon/.test(e));
  check('console errors: 0', appErrors.length === 0, appErrors.slice(0, 4).join(' | ') || 'clean');
  check('non-local requests: 0', nonLocal.length === 0, nonLocal.slice(0, 4).join(' | ') || 'all local');
} finally {
  await cdp.close();
}
log(`== SUMMARY: ${fails === 0 ? 'ALL PASS' : fails + ' FAIL(s)'} ==`);
process.exit(fails === 0 ? 0 : 1);
