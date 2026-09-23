// sr2-hub-impossible-run.mjs — hub entry-point boot proof for impossible-game (sr2).
// Requires: python3 -m http.server 8123 from the REPO ROOT, and a fresh
// games/impossible-game build. Real input only.
// Evidence: verification/evidence/sr2-hub-impossible-run.log + sr2-hub-impossible-game.png.
import { CDP } from './sr1-cdp.mjs';
import { appendFileSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:8123';
const LOG_FILE = new URL('./sr2-hub-impossible-run.log', import.meta.url).pathname;
const EV = (f) => new URL(f, import.meta.url).pathname;
writeFileSync(LOG_FILE, '');
let fails = 0;
function log(s) { console.log(s); appendFileSync(LOG_FILE, s + '\n'); }
function check(name, ok, detail) {
  if (!ok) fails++;
  log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
}
const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));

const cdp = await CDP.launch({ port: 9372, userDataDir: '/tmp/sr2-hub-impossible-profile', width: 1400, height: 900 });
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
  log('== sr2 hub entry point: impossible-game boot proof (built game, real input) ==');
  await cdp.navigate(BASE + '/');
  await cdp.eval(`new Promise(r=>{if(document.readyState==='complete')r(1);else addEventListener('load',()=>r(1),{once:true})})`);
  await waitMs(300);

  // real click on the hub card
  const card = await cdp.eval(`(()=>{const a=[...document.querySelectorAll('a.card')].find(x=>x.getAttribute('href')==='games/impossible-game/');if(!a)return null;a.scrollIntoView({block:'center'});const r=a.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  check('hub card present', !!card, 'games/impossible-game/');
  await cdp.click(card.x, card.y);
  await waitMs(1500);
  const url = await cdp.eval('location.href');
  check('hub click navigates into game', url.includes('games/impossible-game/'), url);
  // the shipped game exposes the read-only hook only with ?debug — reload with it
  await cdp.send('Page.navigate', { url: BASE + '/games/impossible-game/?debug' });
  await waitMs(1200);
  await cdp.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>200)r(0)},50)})');
  const hasHook = await cdp.eval('!!window.__maga');
  check('built game boots (?debug hook)', hasHook, `url=${url}`);
  const mode0 = await cdp.eval('__maga.mode');
  check('title screen on built game', mode0 === 'title', `mode=${mode0}`);

  // real click PLAY, then a real Space jump
  const L = await cdp.eval('(()=>{const cv=document.querySelector("canvas");const r=cv.getBoundingClientRect();return {left:r.left,top:r.top,scale:r.width/960};})()');
  const playChip = await cdp.eval('(()=>{const c=window.__maga.chips.find(c=>c.id==="play");return {x:c.x+c.w/2,y:c.y+c.h/2};})()');
  await cdp.click(L.left + playChip.x * L.scale, L.top + playChip.y * L.scale);
  await waitMs(500);
  const mode1 = await cdp.eval('__maga.mode');
  const y0 = await cdp.eval('__maga.y');
  await cdp.tap('Space', ' ', 32, 40);
  const t0 = Date.now();
  let minY = y0;
  while (Date.now() - t0 < 600) { minY = Math.min(minY, await cdp.eval('__maga.y')); await waitMs(8); }
  check('real click PLAY + real Space jump on built game', mode1 === 'run' && minY < y0 - 30, `mode=${mode1} y ${y0.toFixed(1)} -> min ${minY.toFixed(1)}`);
  await cdp.screenshot(EV('./sr2-hub-impossible-game.png'));

  const appErrors = errors.filter((e) => !/favicon/.test(e));
  check('console errors: 0', appErrors.length === 0, appErrors.slice(0, 4).join(' | ') || 'clean');
  check('non-local requests: 0', nonLocal.length === 0, nonLocal.slice(0, 4).join(' | ') || 'all local');
} finally {
  await cdp.close();
}
log(`== SUMMARY: ${fails === 0 ? 'ALL PASS' : fails + ' FAIL(s)'} ==`);
process.exit(fails === 0 ? 0 : 1);
