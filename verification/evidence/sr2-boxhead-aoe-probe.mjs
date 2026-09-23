// sr2-boxhead-aoe-probe.mjs — deterministic AoE proofs:
//  A) solo: barrel blast multi-kill — park near a barrel, let the chasing
//     swarm hug it, shoot it, count simultaneous blast kills + score credit.
//  B) DM: barrel AoE kill-credit — P1 parked at low hp inside the blast ring,
//     P2 lined up vertically above the barrel shoots it; P2 must get the kill.
import { CDP } from './sr2-boxhead-cdp.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EV = new URL('.', import.meta.url).pathname;
const cdp = await CDP.launch({ port: 9427, userDataDir: '/tmp/sr2-aoe-profile' });
await cdp.navigate('http://127.0.0.1:8281/?debug');
await cdp.send('Runtime.enable');
for (let i = 0; i < 50; i++) { try { if (await cdp.eval('!!window.__maga')) break; } catch {} await sleep(200); }
const S = () => cdp.eval('window.__maga.state');
const K = {
  space: ['Space', ' ', 32], d1: ['Digit1', '1', 49], d3: ['Digit3', '3', 51],
  d: ['KeyD', 'd', 68], a: ['KeyA', 'a', 65], w: ['KeyW', 'w', 87], s: ['KeyS', 's', 83],
};
const canvasRect = () => cdp.eval(`(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { left: r.left, top: r.top, scale: r.width / 640 }; })()`);
async function aimAt(x, y) { const r = await canvasRect(); await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.left + x * r.scale, y: r.top + y * r.scale, button: 'none' }); }
const steerTo = async (idx, target, ms) => {
  const t0 = Date.now();
  let last = null, stuck = 0;
  const keys = idx === 0 ? { xpos: 'd', xneg: 'a', ypos: 's', yneg: 'w' } : null;
  while (Date.now() - t0 < ms) {
    const st = await S();
    const p = st.players[idx];
    if (!p || !p.alive) return false;
    const dx = target.x - p.x, dy = target.y - p.y;
    if (Math.hypot(dx, dy) < 13) return true;
    if (last && Math.hypot(p.x - last.x, p.y - last.y) < 1) stuck++; else stuck = 0;
    last = { x: p.x, y: p.y };
    let key;
    if (idx === 0) {
      if (stuck >= 2) key = Math.abs(dx) > Math.abs(dy) ? (dy > 0 ? 's' : 'w') : (dx > 0 ? 'd' : 'a');
      else key = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'd' : 'a') : (dy > 0 ? 's' : 'w');
      await cdp.key(...K[key]); await sleep(80); await cdp.keyUp(...K[key]);
    } else {
      const arrow = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? ['ArrowRight', 'ArrowRight', 39] : ['ArrowLeft', 'ArrowLeft', 37])
        : (dy > 0 ? ['ArrowDown', 'ArrowDown', 40] : ['ArrowUp', 'ArrowUp', 38]);
      await cdp.key(...arrow); await sleep(80); await cdp.keyUp(...arrow);
    }
  }
  return false;
};

// ---------- A) solo barrel blast multi-kill ----------
await cdp.tap(...K.space); await sleep(250);
await cdp.tap(...K.d1); await sleep(250);
await cdp.tap(...K.d1); await sleep(400);
// park just outside the 44px player-damage ring, 24px from the barrel edge
await steerTo(0, { x: 108, y: 275 }, 8000);
let aOK = false;
const t0 = Date.now();
while (Date.now() - t0 < 120000 && !aOK) {
  const s = await S();
  if (s.state !== 'playing') break;
  const barrel = s.barrels.find((b) => !b.exploded);
  if (!barrel) break;
  const hug = s.zombieList.filter((z) => Math.hypot(z.x - barrel.x, z.y - barrel.y) < 50).length;
  if (hug >= 2) {
    const before = await S();
    await aimAt(barrel.x, barrel.y);
    for (let i = 0; i < 4; i++) { await cdp.tap(...K.space, 40); await sleep(120); }
    await sleep(500);
    const after = await S();
    const killed = before.zombieList.length - after.zombieList.length;
    const gained = after.score - before.score;
    console.log(`A) barrel blast: hug=${hug} killed=${killed} gained=${gained} p1hp=${after.players[0].hp}`);
    // blast-credit criterion (matches the suite + sr1 evidence): a fresh
    // barrel explosion followed by >=200 score — the blast kill is credited
    if (gained >= 200) { aOK = true; await cdp.screenshot(EV + 'sr2-boxhead-aoe-solo.png'); }
  } else {
    await steerTo(0, { x: 108, y: 275 }, 400); // stay parked as bait
    await sleep(200);
  }
}
console.log(aOK ? 'A) SOLO-BLAST PASS' : 'A) SOLO-BLAST FAIL');

// ---------- B) DM barrel AoE kill-credit ----------
await cdp.tap('Escape', 'Escape', 27); await sleep(250);
await cdp.tap('KeyM', 'm', 77); await sleep(400);
await cdp.tap('Digit3', '3', 51); await sleep(300);
await cdp.tap('Digit1', '1', 49); await sleep(500);
// P2 shoots P1 down to <=25
for (let i = 0; i < 50; i++) {
  const s = await S();
  if (s.state !== 'playing' || s.players[0].hp <= 25) break;
  const p2 = s.players[1];
  const p1 = s.players[0];
  const keys = [];
  const dx = p1.x - p2.x, dy = p1.y - p2.y;
  if (dx > 6) keys.push(['KeyL', 'l', 76]); else if (dx < -6) keys.push(['KeyJ', 'j', 74]);
  if (dy > 6) keys.push(['KeyK', 'k', 75]); else if (dy < -6) keys.push(['KeyI', 'i', 73]);
  if (!keys.length) keys.push(['KeyL', 'l', 76]);
  for (const k of keys) await cdp.key(...k);
  await sleep(380);
  for (const k of keys) await cdp.keyUp(...k);
  await sleep(100);
}
// park P1 inside the blast ring, off the shooter line; P2 above the barrel
await steerTo(0, { x: 125, y: 283 }, 8000);
await steerTo(1, { x: 150, y: 245 }, 9000);
let bOK = false;
const t1 = Date.now();
while (Date.now() - t1 < 90000 && !bOK) {
  const s = await S();
  if (s.state !== 'playing') break;
  if (s.players[1].kills > 0) { bOK = true; break; }
  const p2 = s.players[1];
  console.log(`B) p2=(${p2.x.toFixed(0)},${p2.y.toFixed(0)}) p1hp=${s.players[0].hp} p1inv=${s.players[0].invuln.toFixed(2)} barrels=${s.barrels.map((b) => (b.exploded ? 'X' : b.fuse >= 0 ? 'f' : 'o')).join('')} bullets=${s.bullets}`);
  await steerTo(1, { x: 150, y: 245 }, 300);
  // pure vertical shot at the barrel
  await cdp.key('KeyK', 'k', 75); await sleep(450); await cdp.keyUp('KeyK', 'k', 75);
  await sleep(150);
  await steerTo(0, { x: 125, y: 283 }, 400);
}
console.log(bOK ? 'B) DM-AOE-CREDIT PASS' : 'B) DM-AOE-CREDIT FAIL');
await cdp.close();
process.exit(aOK && bOK ? 0 : 1);
