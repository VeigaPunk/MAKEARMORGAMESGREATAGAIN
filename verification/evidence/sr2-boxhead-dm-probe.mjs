// sr2-boxhead-dm-probe.mjs — focused deathmatch end-rule probe: start DM,
// P1 kills P2 to first-to-5 with full state logging.
import { CDP } from './sr2-boxhead-cdp.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdp = await CDP.launch({ port: 9423, userDataDir: '/tmp/sr2-dm-profile' });
await cdp.navigate('http://127.0.0.1:8281/?debug');
await cdp.send('Runtime.enable');
for (let i = 0; i < 50; i++) { try { if (await cdp.eval('!!window.__maga')) break; } catch {} await sleep(200); }
const S = () => cdp.eval('window.__maga.state');
const K = { space: ['Space', ' ', 32], d1: ['Digit3', '3', 51], d: ['KeyD', 'd', 68], a: ['KeyA', 'a', 65], w: ['KeyW', 'w', 87], s: ['KeyS', 's', 83] };
const canvasRect = () => cdp.eval(`(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { left: r.left, top: r.top, scale: r.width / 640 }; })()`);
async function aimAt(x, y) { const r = await canvasRect(); await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.left + x * r.scale, y: r.top + y * r.scale, button: 'none' }); }
const steerTo = async (target, ms) => {
  const t0 = Date.now();
  let lastPos = null, stuck = 0;
  while (Date.now() - t0 < ms) {
    const st = await S(); const p = st.players[0];
    if (!p) return false;
    const dx = target.x - p.x, dy = target.y - p.y;
    if (Math.hypot(dx, dy) < 13) return true;
    if (lastPos && Math.hypot(p.x - lastPos.x, p.y - lastPos.y) < 1) stuck++;
    else stuck = 0;
    lastPos = { x: p.x, y: p.y };
    let key;
    if (stuck >= 2) key = Math.abs(dx) > Math.abs(dy) ? (dy > 0 ? 's' : 'w') : (dx > 0 ? 'd' : 'a');
    else key = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'd' : 'a') : (dy > 0 ? 's' : 'w');
    await cdp.key(...K[key]); await sleep(80); await cdp.keyUp(...K[key]);
  }
  return false;
};
await cdp.tap(...K.space); await sleep(250);
await cdp.tap('Digit3', '3', 51); await sleep(250); // deathmatch
await cdp.tap('Digit1', '1', 49); await sleep(400); // room 1
let s = await S();
console.log('DM start state=', s.state, s.mode, 'p2=', JSON.stringify(s.players[1]));
let lastShot = 0, lastLog = 0;
const t0 = Date.now();
while (Date.now() - t0 < 200000) {
  s = await S();
  if (s.state === 'victory') { console.log('MATCH END:', (s.banner || '').split('\n')[0]); break; }
  if (s.state !== 'playing') { await sleep(250); continue; }
  const p1 = s.players[0], p2 = s.players[1];
  if (Date.now() - lastLog > 5000) {
    lastLog = Date.now();
    console.log(`t=${((Date.now()-t0)/1000).toFixed(0)} p1 ammo=${p1.ammo} hp=${p1.hp} pos=(${p1.x.toFixed(0)},${p1.y.toFixed(0)}) p2 alive=${p2.alive} hp=${p2.hp} pos=(${p2.x.toFixed(0)},${p2.y.toFixed(0)}) kills P1=${p1.kills} P2=${p2.kills} crates=${JSON.stringify(s.crates)} bullets=${s.bullets}`);
  }
  if (!p2.alive) { await sleep(700); continue; }
  if (p1.ammo < 8 && s.crates.length) {
    await steerTo({ x: s.crates[0].x, y: s.crates[0].y }, 3000);
    await sleep(250);
    continue;
  }
  await aimAt(p2.x, p2.y);
  const now = Date.now();
  if (now - lastShot > 300) { lastShot = now; await cdp.tap(...K.space, 40); }
  await sleep(120);
}
await cdp.screenshot(new URL('.', import.meta.url).pathname + 'sr2-boxhead-dm-end.png');
console.log(s.state === 'victory' ? 'DM-PROBE PASS' : 'DM-PROBE FAIL');
await cdp.close();
process.exit(s.state === 'victory' ? 0 : 1);
