// sr2-sas-hub.mjs — boot-proof the BUILT Arena of Bonks via the fleet hub.
// Serves the repo root with python3 -m http.server, clicks the hub card with a
// real mouse click (plain-link proof), then re-opens with ?debug (fleet
// precedent: sr1-hub-run.mjs) for read-only probes, and plays with real input:
// title -> create (typed name) -> hub -> arena. Gates: 0 console errors,
// 0 non-local requests. Run:
//   python3 -m http.server 8123 >/dev/null 2>&1 &  (from repo root)
//   node verification/evidence/sr2-sas-hub.mjs
import { CDP } from './sr1-cdp.mjs';
import { appendFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = 'http://localhost:8123/';
const HREF = 'games/swords-and-sandals/';
const LOG_FILE = new URL('./sr2-sas-hub.log', import.meta.url).pathname;
const EV = (f) => new URL(f, import.meta.url).pathname;
writeFileSync(LOG_FILE, '');
let fails = 0;
const log = (s) => { console.log(s); appendFileSync(LOG_FILE, s + '\n'); };
const check = (name, ok, detail) => { if (!ok) fails++; log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  [' + detail + ']' : ''}`); };
const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));

const cdp = await CDP.launch({ port: 9531, userDataDir: mkdtempSync(join(tmpdir(), 'sr2sashub-')), width: 1280, height: 800 });
const errors = cdp.consoleErrors();
const nonLocal = [];
await cdp.send('Runtime.enable'); await cdp.send('Log.enable');
cdp.on('Network.requestWillBeSent', (p) => { const u = p.request.url; if (!u.startsWith(BASE) && !u.startsWith('data:')) nonLocal.push(u); });
await cdp.send('Network.enable');
await cdp.navigate(BASE);
await cdp.eval('new Promise(r=>{if(document.readyState==="complete")r(1);else addEventListener("load",()=>r(1),{once:true})})');
await waitMs(300);

// hub card click (built game, relative href)
const card = await cdp.eval('(()=>{const a=[...document.querySelectorAll("a.card")].find(x=>x.getAttribute("href")==="games/swords-and-sandals/");if(!a)return null;a.scrollIntoView({block:"center"});const r=a.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()');
check('hub card present', !!card);
await cdp.send('Page.enable');
const loaded = new Promise((r) => cdp.on('Page.loadEventFired', () => r(1)));
await cdp.click(card.x, card.y);
await Promise.race([loaded, waitMs(6000)]);
await waitMs(400);
const landed = await cdp.eval('location.href');
const hasCanvas = await cdp.eval('!!document.querySelector("canvas")');
const titlePlain = await cdp.eval('document.title');
check('real card click lands on built game (plain link)', landed === BASE + HREF && hasCanvas, `url=${landed}`);
check('built game title renamed', titlePlain === 'Arena of Bonks — MAGA native replica', titlePlain);
// fleet precedent: re-open with ?debug for the read-only probe hook
await cdp.send('Page.navigate', { url: BASE + HREF + '?debug' });
await waitMs(700);
for (let i = 0; i < 50; i++) { if (await cdp.eval('!!window.__maga').catch(() => false)) break; await waitMs(100); }
check('built game boots to title (?debug hook)', (await cdp.eval('__maga.mode').catch(() => 'none')) === 'title');
const clickButton = async (substr) => {
  const r = await cdp.eval(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(${JSON.stringify(substr)})&&!x.disabled);if(!b)return null;b.scrollIntoView({block:'center'});const x=b.getBoundingClientRect();return {x:x.left+x.width/2,y:x.top+x.height/2}})()`);
  if (!r) throw new Error('button not found: ' + substr);
  await cdp.click(r.x, r.y);
};
await clickButton('New Gladiator');
for (let i = 0; i < 2; i++) await clickButton('strength');
await clickButton('agility'); for (let i = 0; i < 2; i++) await clickButton('vitality');
await clickButton('defense');
await cdp.eval('(()=>{const e=document.querySelector("#name");e.scrollIntoView({block:"center"})})()');
const nf = await cdp.eval('(()=>{const r=document.querySelector("#name").getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()');
await cdp.click(nf.x, nf.y);
for (const ch of 'KIMI HUB') await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Key' + ch, key: ch, windowsVirtualKeyCode: ch.toUpperCase().charCodeAt(0), nativeVirtualKeyCode: ch.toUpperCase().charCodeAt(0), text: ch });
await clickButton('Enter the Arena');
check('create -> hub in built game', (await cdp.eval('__maga.mode')) === 'hub');
await clickButton('Start First Bout');
const ar = await cdp.eval('({mode:__maga.mode,opp:__maga.opponent,oppHp:__maga.opponentHp})');
check('hub -> arena in built game (fight 1 live)', ar.mode === 'arena' && ar.opp === 0 && ar.oppHp === 34, JSON.stringify(ar));
await clickButton('Special');
await waitMs(250);
await cdp.screenshot(EV('./sr2-sas-hub.png'));
const errs = errors.filter((e) => !e.includes('favicon'));
check('0 console errors (favicon whitelisted)', errs.length === 0, errs.slice(0, 3).join(' | ') || 'clean');
check('0 non-local requests', nonLocal.length === 0, nonLocal.slice(0, 3).join(' | ') || 'all local');
await cdp.close();
log(`==== SUMMARY: ${fails === 0 ? 'ALL PASS' : fails + ' FAILURES'} ====`);
process.exit(fails === 0 ? 0 : 1);
