// sr2-boxhead-grenade-probe.mjs — focused grenade AoE multi-kill attempt.
// Build mult to the grenade tier with ring-lap + close-range plinking, then
// STOP and let the swarm surround: the moment >=3 zombies are inside the
// 60px blast ring, lob one grenade at the centroid (owner-exempt per D-19,
// so point-blank is safe) and count simultaneous kills.
import { CDP } from './sr2-boxhead-cdp.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdp = await CDP.launch({ port: 9419, userDataDir: '/tmp/sr2-grenade2-profile' });
await cdp.navigate('http://127.0.0.1:8281/?debug');
await cdp.send('Runtime.enable');
for (let i = 0; i < 50; i++) { try { if (await cdp.eval('!!window.__maga')) break; } catch {} await sleep(200); }
const S = () => cdp.eval('window.__maga.state');
const K = { space: ['Space', ' ', 32], d: ['KeyD', 'd', 68], a: ['KeyA', 'a', 65], w: ['KeyW', 'w', 87], s: ['KeyS', 's', 83], d1: ['Digit1', '1', 49] };
const RING = [{ x: 70, y: 70 }, { x: 570, y: 70 }, { x: 570, y: 330 }, { x: 70, y: 330 }];
let ringIdx = 0, lastShot = 0;
const canvasRect = () => cdp.eval(`(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { left: r.left, top: r.top, scale: r.width / 640 }; })()`);
async function aimAt(x, y) { const r = await canvasRect(); await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.left + x * r.scale, y: r.top + y * r.scale, button: 'none' }); }
const ringKey = (me, threat) => {
  let wp = RING[ringIdx];
  if (Math.hypot(wp.x - me.x, wp.y - me.y) < 40) { ringIdx = (ringIdx + 1) % RING.length; wp = RING[ringIdx]; }
  let tx = wp.x, ty = wp.y;
  if (threat) {
    const ax = me.x + (me.x - threat.x), ay = me.y + (me.y - threat.y);
    tx = (tx + ax) / 2; ty = (ty + ay) / 2;
  }
  return Math.abs(tx - me.x) > Math.abs(ty - me.y) ? (tx > me.x ? 'd' : 'a') : (ty > me.y ? 's' : 'w');
};
const tapFire = async () => { const n = Date.now(); if (n - lastShot < 230) return; lastShot = n; await cdp.tap(...K.space, 40); };

await cdp.tap(...K.space); await sleep(250);
await cdp.tap(...K.d1); await sleep(250);
await cdp.tap(...K.d1); await sleep(400);

let proof = null, lobs = 0, maxTier = 'pistol';
const t0 = Date.now();
while (Date.now() - t0 < 300000 && !proof) {
  const s = await S();
  if (s.state === 'victory' || s.state === 'dead') { console.log('RUN-END', s.state, s.banner?.split('\n')[0]); break; }
  if (s.state !== 'playing') { await sleep(150); continue; }
  const me = s.players[0];
  const zs = s.zombieList;
  if (!zs.length) { await sleep(120); continue; }
  const byD = zs.map((z) => ({ z, d: Math.hypot(z.x - me.x, z.y - me.y) })).sort((a, b) => a.d - b.d);
  const nearest = byD[0].z, nd = byD[0].d;
  const tier = (s.hud.match(/\[(.+?)\]/) || [])[1];
  if (tier) maxTier = tier;
  if (tier === 'GRENADES') {
    const close = zs.filter((z) => Math.hypot(z.x - me.x, z.y - me.y) < 62);
    if (close.length >= 3 && me.hp > 20) {
      const cx = close.reduce((a, z) => a + z.x, 0) / close.length;
      const cy = close.reduce((a, z) => a + z.y, 0) / close.length;
      const before = await S();
      await aimAt(cx, cy);
      await cdp.tap(...K.space, 50);
      lobs++;
      await sleep(900);
      const after = await S();
      const killed = before.zombieList.length - after.zombieList.length;
      const gained = after.score - before.score;
      console.log(`LOB#${lobs} close=${close.length} killed=${killed} gained=${gained} hp=${me.hp}->${after.players[0].hp}`);
      if (killed >= 3) {
        proof = { killed, gained, cluster: close.length };
        await cdp.screenshot(new URL('.', import.meta.url).pathname + 'sr2-boxhead-grenade.png');
      }
      continue;
    }
    // not enough close yet: stand still, let them surround (hp>20 is safe)
    await aimAt(nearest.x, nearest.y);
    await sleep(150);
    continue;
  }
  // below grenade tier: ring-lap + close-range plinking to build mult
  const key = ringKey(me, nearest);
  await cdp.key(...K[key]); await sleep(150); await cdp.keyUp(...K[key]);
  await aimAt(nearest.x, nearest.y);
  if (nd < 150) await tapFire();
  await sleep(80);
}
console.log(`maxTier=${maxTier} lobs=${lobs}`);
console.log(proof ? `GRENADE-PROOF ${JSON.stringify(proof)}` : 'GRENADE-UNPROVEN');
await cdp.close();
process.exit(proof ? 0 : 1);
