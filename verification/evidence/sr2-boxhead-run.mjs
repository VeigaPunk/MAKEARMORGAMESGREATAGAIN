// sr2-boxhead-run.mjs — Crateheads sr2 verification suite (real-input CDP).
// Drives the BUILT game (served from apps/boxhead/dist on :8281) with real
// Input.dispatch* events; reads state through the ?debug __maga hook.
// Usage: node verification/evidence/sr2-boxhead-run.mjs
import { CDP } from './sr2-boxhead-cdp.mjs';

const PAGE_URL = 'http://127.0.0.1:8281/?debug';
const EV = new URL('.', import.meta.url).pathname;
const CDP_PORT = 9401;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
let consoleErrors = [];

function report(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
}
const assert = (name, cond, detail = '') => report(name, !!cond, detail);

let cdp;
const S = () => cdp.eval('window.__maga.state');
async function waitFor(fn, timeoutMs, poll = 120) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const v = await fn();
    if (v) return v;
    await sleep(poll);
  }
  return null;
}
async function canvasRect() {
  return cdp.eval(`(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { left: r.left, top: r.top, scale: r.width / 640 }; })()`);
}
async function aimAt(x, y) {
  const r = await canvasRect();
  await cdp.move(r.left + x * r.scale, r.top + y * r.scale);
}
const K = {
  space: ['Space', ' ', 32], enter: ['Enter', 'Enter', 13], esc: ['Escape', 'Escape', 27],
  p: ['KeyP', 'p', 80], m: ['KeyM', 'm', 77], w: ['KeyW', 'w', 87], a: ['KeyA', 'a', 65],
  s: ['KeyS', 's', 83], d: ['KeyD', 'd', 68], j: ['KeyJ', 'j', 74], k: ['KeyK', 'k', 75],
  l: ['KeyL', 'l', 76], i: ['KeyI', 'i', 73],
  d1: ['Digit1', '1', 49], d2: ['Digit2', '2', 50], d3: ['Digit3', '3', 51],
  up: ['ArrowUp', 'ArrowUp', 38], down: ['ArrowDown', 'ArrowDown', 40],
  left: ['ArrowLeft', 'ArrowLeft', 37], right: ['ArrowRight', 'ArrowRight', 39],
};
async function hold(k, ms) { await cdp.key(...K[k]); await sleep(ms); await cdp.keyUp(...K[k]); }

async function steerTo(pos, target, timeoutMs = 6000) {
  const t0 = Date.now();
  let lastPos = null, stuck = 0;
  while (Date.now() - t0 < timeoutMs) {
    const s = await S();
    const p = s.players[0];
    const dx = target.x - p.x, dy = target.y - p.y;
    if (Math.hypot(dx, dy) < 14) return true;
    // wall-hug: if the last step didn't move us, go perpendicular for a beat
    if (lastPos && Math.hypot(p.x - lastPos.x, p.y - lastPos.y) < 1) stuck++;
    else stuck = 0;
    lastPos = { x: p.x, y: p.y };
    let key;
    if (stuck >= 2) key = Math.abs(dx) > Math.abs(dy) ? (dy > 0 ? 's' : 'w') : (dx > 0 ? 'd' : 'a');
    else key = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'd' : 'a') : (dy > 0 ? 's' : 'w');
    await hold(key, 90);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Solo player-bot: run the arena ring while firing inward (the human "lap the
// walls" strategy), detour to crates only when dry and safe, lob grenades at
// clusters, shoot barrels the swarm hugs.
const RING = [{ x: 70, y: 70 }, { x: 570, y: 70 }, { x: 570, y: 330 }, { x: 70, y: 330 }];
async function soloRun(timeoutMs, { hunt = true, screenshotAtWave3 = true } = {}) {
  const t0 = Date.now();
  const stats = { tiers: new Set(), maxZombies: 0, crates: 0, blasts: 0, grenadeProof: null, shots: {} };
  let holdingFire = false;
  let wave3Shot = false;
  let lastExploded = 0;
  let ringIdx = 0;
  const pendingBlasts = [];
  let done = null;
  let lastShot = 0;
  const releaseFire = async () => { if (holdingFire) { await cdp.keyUp(...K.space); holdingFire = false; } };
  // tap-fire discipline: ~4/s ceiling — kills at the swarm's spawn rate while
  // conserving ammo (holding auto-fire burns a full magazine in seconds)
  const tapFire = async () => {
    const now = Date.now();
    if (now - lastShot < 230) return;
    lastShot = now;
    await cdp.tap(...K.space, 40);
  };
  const holdFire = tapFire;
  const ringKey = (me, threat) => {
    // lap the ring; if the swarm is close, bias the waypoint away from it
    let wp = RING[ringIdx];
    if (Math.hypot(wp.x - me.x, wp.y - me.y) < 40) { ringIdx = (ringIdx + 1) % RING.length; wp = RING[ringIdx]; }
    let tx = wp.x, ty = wp.y;
    if (threat) {
      const ax = me.x + (me.x - threat.x), ay = me.y + (me.y - threat.y);
      if (Math.hypot(ax - me.x, ay - me.y) > 0) { tx = (tx + ax) / 2; ty = (ty + ay) / 2; }
    }
    return Math.abs(tx - me.x) > Math.abs(ty - me.y) ? (tx > me.x ? 'd' : 'a') : (ty > me.y ? 's' : 'w');
  };
  while (Date.now() - t0 < timeoutMs && !done) {
    const s = await S();
    if (s.state === 'victory') { done = { ...stats, end: 'victory', state: s }; break; }
    if (s.state === 'dead') { done = { ...stats, end: 'dead', state: s }; break; }
    if (s.state !== 'playing') { await sleep(150); continue; }
    const me = s.players[0];
    const zs = s.zombieList;
    stats.maxZombies = Math.max(stats.maxZombies, zs.length);
    stats.crates = Math.max(stats.crates, s.crates.length);
    if (s.hud) {
      const m = s.hud.match(/\[(.+?)\]/);
      if (m) stats.tiers.add(m[1]);
    }
    const explodedNow = s.barrels.filter((b) => b.exploded).length;
    if (explodedNow > lastExploded) {
      pendingBlasts.push({ t: Date.now(), score: s.score });
      lastExploded = explodedNow;
    }
    for (let i = pendingBlasts.length - 1; i >= 0; i--) {
      if (Date.now() - pendingBlasts[i].t > 450) {
        if (s.score - pendingBlasts[i].score >= 200) stats.blasts++;
        pendingBlasts.splice(i, 1);
      }
    }
    if (screenshotAtWave3 && s.wave >= 3 && zs.length >= 6 && !wave3Shot) {
      wave3Shot = true;
      stats.shots.wave3 = true;
      await cdp.screenshot(EV + 'sr2-boxhead-solo-wave3.png');
    }
    if (!zs.length) { await sleep(120); continue; }
    const byD = zs.map((z) => ({ z, d: Math.hypot(z.x - me.x, z.y - me.y) })).sort((a, b) => a.d - b.d);
    const nearest = byD[0].z, nd = byD[0].d;
    // grenade tier: in hunt mode, once per run, tank a surrounded point-blank
    // lob (the player is exempt from their own blast — D-19) to prove the AoE
    // multi-kill; win mode skips this and just plays for the clear
    if (hunt && s.hud?.includes('[GRENADES]')) {
      // inside the blast ring with margin (zombies step ~7px before detonation)
      const close = zs.filter((z) => Math.hypot(z.x - me.x, z.y - me.y) < 48);
      if (close.length >= 3) {
        const cx = close.reduce((a, z) => a + z.x, 0) / close.length;
        const cy = close.reduce((a, z) => a + z.y, 0) / close.length;
        const before = await S();
        await aimAt(cx, cy);
        await cdp.tap(...K.space, 50);
        await sleep(900);
        const after = await S();
        const killed = before.zombieList.length - after.zombieList.length;
        const gained = after.score - before.score;
        if (killed >= 3 && !stats.grenadeProof) {
          stats.grenadeProof = { killed, gained, cluster: close.length };
          await cdp.screenshot(EV + 'sr2-boxhead-grenade.png');
        }
        continue;
      }
      if (!stats.grenadeProof && zs.length >= 3 && me.hp > 30) {
        // hold ground and let the pack surround the blast ring — 100hp buys
        // ~8 contact hits and the pack closes in 2-4s, so 30hp is enough
        await aimAt(nearest.x, nearest.y);
        await sleep(150);
        continue;
      }
    }
    // unlit barrel the swarm is hugging — grenades lob straight at it, guns
    // put 2-3 rounds in
    let barrelShot = false;
    const hugged = s.barrels.find((b) => !b.exploded && b.fuse < 0 && zs.filter((z) => Math.hypot(z.x - b.x, z.y - b.y) < 50).length >= 2);
    if (hugged) {
      await releaseFire();
      await aimAt(hugged.x, hugged.y);
      if (s.hud?.includes('[GRENADES]')) {
        await cdp.tap(...K.space, 50);
        await sleep(800);
      } else {
        for (let i = 0; i < 3; i++) { await cdp.tap(...K.space, 40); await sleep(90); }
      }
      barrelShot = true;
    }
    if (barrelShot) { await sleep(120); continue; }
    // movement: ring-lap always; crate runs when low and the tail is thin —
    // a long beeline with a big swarm chasing walks into the swarm, but a
    // 1-2 zombie tail can never catch a sprinting player (probe-verified)
    const threat = zs.length;
    if (me.ammo <= 6 && s.crates.length && (threat <= 4 || nd > 110)) {
      const c = s.crates.reduce((a, b) => (Math.hypot(a.x - me.x, a.y - me.y) < Math.hypot(b.x - me.x, b.y - me.y) ? a : b));
      if (Math.hypot(c.x - me.x, c.y - me.y) < 170) {
        await steerTo(me, c, 260);
      } else {
        const key = ringKey(me, nearest);
        await cdp.key(...K[key]); await sleep(150); await cdp.keyUp(...K[key]);
      }
    } else {
      // humans never stand in the swarm — lap every tick
      const key = ringKey(me, nearest);
      await cdp.key(...K[key]); await sleep(150); await cdp.keyUp(...K[key]);
    }
    await aimAt(nearest.x, nearest.y);
    // plink only at close range — bullets take 0.5s+ to cross the arena and
    // distant movers dodge them (the economy drain that stalled the run)
    if (nd < 150) await tapFire();
    await sleep(100);
  }
  await releaseFire();
  return done ?? { ...stats, end: 'timeout' };
}

async function boot() {
  await cdp.navigate(PAGE_URL);
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await waitFor(async () => cdp.eval('!!window.__maga'), 8000);
  const s = await S();
  assert('BOOT', s && s.state === 'title', `state=${s?.state}`);
}

async function main() {
  console.log(`# sr2 Crateheads verification run — ${new Date().toISOString()}`);
  console.log(`# build: apps/boxhead/dist served at ${PAGE_URL} (fresh sr2 build)`);
  cdp = await CDP.launch({ port: CDP_PORT, userDataDir: '/tmp/sr2-boxhead-profile' });
  consoleErrors = cdp.consoleErrors();
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');

  // ---------- boot + rights ----------
  await boot();
  const title = await cdp.eval('document.title');
  assert('RIGHTS-title', title === 'Crateheads', `document.title=${title}`);
  const menuText = await cdp.eval(`(() => { const t = window.__maga.game; return JSON.stringify(t['menu'].children.map(c => c.text ?? '')); })()`);
  assert('RIGHTS-title-string', !menuText.includes('BOXHEAD') && menuText.includes('CRATEHEADS'), menuText.slice(0, 120));
  const logoOk = await cdp.eval(`fetch('./art/crateheads-logo.svg').then(r => r.ok).catch(() => false)`);
  const logoTxt = await cdp.eval(`fetch('./art/crateheads-logo.svg').then(r => r.text()).then(t => t.includes('CRATEHEADS')).catch(() => false)`);
  assert('RIGHTS-logo-svg', logoOk === true && logoTxt === true, 'crateheads-logo.svg loads and spells CRATEHEADS');

  // ---------- solo waves 1–3 ----------
  await cdp.tap(...K.space); await sleep(250);
  await cdp.tap(...K.d1); await sleep(250);
  await cdp.tap(...K.d1); await sleep(400);
  let s = await S();
  assert('SOLO-start', s.state === 'playing' && s.mode === 'solo' && s.wave === 1, `wave=${s.wave} spawnQueue=${s.spawnQueue}`);
  assert('SOLO-wave-tables', s.spawnQueue >= 8 && s.maxWave === 3, `wave1 count=${s.spawnQueue} (tuned table)`);
  const runT0 = Date.now();
  const run1 = await soloRun(360000, { hunt: false });
  s = run1.state;
  assert('SOLO-victory', run1.end === 'victory', `end=${run1.end} wave=${s?.wave} score=${s?.score} time≈${Math.round((Date.now() - runT0) / 1000)}s`);
  assert('SOLO-ladder', run1.tiers.has('SHOTGUN') && run1.tiers.has('UZI') && run1.tiers.has('GRENADES'), [...run1.tiers].join(','));
  assert('SOLO-swarm', run1.maxZombies >= 6, `peak concurrent=${run1.maxZombies}`);
  assert('SOLO-crates', run1.crates >= 1, `crates seen=${run1.crates}`);
  if (run1.end === 'victory') {
    await cdp.screenshot(EV + 'sr2-boxhead-victory.png');
    assert('SOLO-banner', (s.banner || '').includes('WAVE 3 CLEARED'), s.banner?.split('\n')[0]);
    const high = await cdp.eval(`localStorage.getItem('maga:boxhead:highscore')`);
    assert('SOLO-highscore', Number(high) === s.high && s.high > 0, `stored=${high} high=${s.high}`);
  }

  // ---------- grenade AoE multi-kill (attempt 1 of 2; final verdict after run 2) ----------
  console.log(`INFO GRENADE-attempt1 proof=${JSON.stringify(run1.grenadeProof)} blasts=${run1.blasts} end=${run1.end}`);

  // ---------- death -> restart ----------
  await cdp.tap(...K.space); await sleep(500); // retry from victory
  s = await S();
  assert('RETRY-after-victory', s.state === 'playing', `state=${s.state}`);
  const deadAt = await waitFor(async () => { const v = await S(); return v.state === 'dead' ? v : null; }, 90000, 300);
  assert('DEATH-idle', !!deadAt, deadAt ? `died wave=${deadAt.wave}` : 'no death in 90s idle');
  if (deadAt) {
    assert('DEATH-banner', (deadAt.banner || '').includes('OVERRUN'), deadAt.banner?.split('\n')[0]);
    await cdp.tap(...K.space); await sleep(500);
    s = await S();
    assert('DEATH-retry', s.state === 'playing', `state=${s.state}`);
  }

  // ---------- pause (solo) + D-55 + D-56 + D-18 ----------
  await sleep(400);
  await cdp.tap(...K.esc); await sleep(300);
  s = await S();
  assert('PAUSE-esc', s.state === 'paused' && (s.banner || '').includes('PAUSED'), s.banner?.split('\n')[0]);
  const zA = (await S()).zombieList;
  await sleep(500);
  const zB = (await S()).zombieList;
  assert('PAUSE-world-frozen', JSON.stringify(zA) === JSON.stringify(zB), 'zombie positions identical 500ms');
  await cdp.tap(...K.enter); await sleep(250);
  s = await S();
  assert('D-55-enter-noop', s.state === 'paused', 'Enter in pause still paused (banner promises only M)');
  await cdp.tap(...K.p); await sleep(250);
  s = await S();
  assert('PAUSE-resume-p', s.state === 'playing', `state=${s.state}`);
  await cdp.tap(...K.esc); await sleep(250);
  await cdp.tap(...K.m); await sleep(350);
  s = await S();
  const worldVisible = await cdp.eval(`window.__maga.game.world.visible`);
  assert('D-56-world-hidden', s.state === 'mode' && worldVisible === false, `state=${s.state} world.visible=${worldVisible}`);
  assert('D-18-banner-clear', (s.banner || '') === '', `banner="${(s.banner || '').slice(0, 40)}"`);

  // ---------- high-score persist across reload ----------
  const highBefore = (await S()).high;
  await cdp.navigate(PAGE_URL);
  await waitFor(async () => cdp.eval('!!window.__maga'), 8000);
  s = await S();
  assert('PERSIST-highscore', s.high === highBefore && s.state === 'title', `high=${s.high} (was ${highBefore})`);

  // ---------- settings ----------
  const sb = await cdp.eval(`(() => { const r = document.getElementById('settings-btn').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await cdp.click(sb.x, sb.y); await sleep(250);
  const slider = await cdp.eval(`(() => { const r = document.getElementById('vol-music').getBoundingClientRect(); return { left: r.left, width: r.width, y: r.top + r.height / 2 }; })()`);
  await cdp.click(slider.left + slider.width * 0.4, slider.y); await sleep(250);
  const v1 = await cdp.eval(`({ v: document.getElementById('vol-music').value, mv: window.__maga.sfx.musicVolume, muted: window.__maga.sfx.muted })`);
  assert('SETTINGS-live', Math.abs(Number(v1.v) / 100 - v1.mv) < 0.02 && v1.muted === false, `slider=${v1.v} musicVolume=${v1.mv}`);
  const mb = await cdp.eval(`(() => { const r = document.getElementById('mute-box').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await cdp.click(mb.x, mb.y); await sleep(200);
  const mutedNow = await cdp.eval('window.__maga.sfx.muted');
  assert('SETTINGS-mute', mutedNow === true, `muted=${mutedNow}`);
  await cdp.navigate(PAGE_URL);
  await waitFor(async () => cdp.eval('!!window.__maga'), 8000);
  const v2 = await cdp.eval(`({ stored: JSON.parse(localStorage.getItem('maga:boxhead:audio')), mv: window.__maga.sfx.musicVolume, muted: window.__maga.sfx.muted })`);
  assert('SETTINGS-persist-reload', v2.stored && Math.abs(v2.stored.music - v2.mv) < 0.02 && v2.muted === true, `stored=${JSON.stringify(v2.stored)} live music=${v2.mv}`);
  // restore defaults for the rest of the run
  await cdp.eval(`(() => { const b = document.getElementById('settings-btn'); b.click(); const sEl = document.getElementById('settings'); sEl.classList.remove('hidden'); })()`);
  const sl2 = await cdp.eval(`(() => { const r = document.getElementById('vol-music').getBoundingClientRect(); return { left: r.left, width: r.width, y: r.top + r.height / 2 }; })()`);
  await cdp.click(sl2.left + sl2.width * 0.7, sl2.y); await sleep(150);
  const mb2 = await cdp.eval(`(() => { const r = document.getElementById('mute-box').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await cdp.click(mb2.x, mb2.y); await sleep(150);
  const restored = await cdp.eval(`({ mv: window.__maga.sfx.musicVolume, muted: window.__maga.sfx.muted })`);
  assert('SETTINGS-restored', Math.abs(restored.mv - 0.7) < 0.09 && restored.muted === false, JSON.stringify(restored));

  // ---------- audio scheduled ----------
  await boot(); // title (fresh state after navigations)
  await cdp.tap(...K.space); await sleep(200);
  await cdp.tap(...K.d1); await sleep(200);
  await cdp.tap(...K.d1); await sleep(600);
  await aimAt(320, 100); await cdp.tap(...K.space, 120);
  await sleep(300);
  const au = await cdp.eval(`({ running: window.__maga.sfx.running, voices: window.__maga.sfx.voices })`);
  assert('AUDIO-scheduled', au.running === true && au.voices > 0, `running=${au.running} voices=${au.voices}`);
  s = await S();
  assert('D-57-crate-timer', typeof s.crateTimer === 'number' && s.crateTimer >= 0, `crateTimer=${s.crateTimer}`);
  // ---------- focused proof run 2: barrel blast kills + grenade multi-kill ----------
  const run2 = await soloRun(300000);
  console.log(`INFO run2 end=${run2.end} blasts=${run2.blasts} grenade=${JSON.stringify(run2.grenadeProof)} tiers=${[...run2.tiers].join(',')}`);
  assert('SOLO-blast-kill', run1.blasts + run2.blasts >= 1, `blast kill events run1=${run1.blasts} run2=${run2.blasts}`);
  const grenadeProof = run1.grenadeProof ?? run2.grenadeProof;
  assert('GRENADE-aoe-multikill', !!grenadeProof,
    grenadeProof ? `killed=${grenadeProof.killed} gained=${grenadeProof.gained} cluster=${grenadeProof.cluster} (blast radius 60 AoE credit)`
      : 'two full runs, no >=3 cluster killed by one lob');
  if (run2.end === 'victory') {
    s = run2.state;
    await cdp.screenshot(EV + 'sr2-boxhead-victory.png');
  }
  // leave run for co-op section via pause->menu (works from dead/victory too: M)
  const stNow = (await S()).state;
  if (stNow === 'playing') { await cdp.tap(...K.esc); await sleep(200); }
  await cdp.tap(...K.m); await sleep(300);

  // ---------- co-op ----------
  await cdp.tap(...K.d2); await sleep(250);
  await cdp.tap(...K.d1); await sleep(400);
  s = await S();
  assert('COOP-start', s.state === 'playing' && s.mode === 'coop' && s.players.length === 2, `mode=${s.mode} players=${s.players.length}`);
  const p1a = s.players[0], p2a = s.players[1];
  await cdp.key(...K.w); await cdp.key(...K.right); await sleep(600);
  await cdp.keyUp(...K.w); await cdp.keyUp(...K.right);
  s = await S();
  const p1moved = p1a.y - s.players[0].y, p2moved = s.players[1].x - p2a.x;
  assert('COOP-simul-move', p1moved > 20 && p2moved > 20, `P1 dy=${Math.round(p1moved)} P2 dx=${Math.round(p2moved)}`);
  const a1 = s.players[0].ammo, a2 = s.players[1].ammo;
  await cdp.key(...K.space); await cdp.key(...K.l); await sleep(450);
  await cdp.keyUp(...K.space); await cdp.keyUp(...K.l);
  s = await S();
  assert('COOP-simul-fire', s.players[0].ammo < a1 && s.players[1].ammo < a2, `P1 ${a1}->${s.players[0].ammo} P2 ${a2}->${s.players[1].ammo}`);
  // friendly fire stays off: aim P1 at P2 and hold fire
  s = await S();
  await aimAt(s.players[1].x, s.players[1].y);
  await cdp.key(...K.space); await sleep(400); await cdp.keyUp(...K.space);
  s = await S();
  assert('COOP-friendly-inert', s.players[1].hp === 100, `P2 hp=${s.players[1].hp}`);
  await cdp.screenshot(EV + 'sr2-boxhead-coop.png');
  await cdp.tap(...K.esc); await sleep(200);
  assert('COOP-pause', (await S()).state === 'paused', 'ESC pauses co-op');
  await cdp.tap(...K.p); await sleep(200);
  assert('COOP-resume', (await S()).state === 'playing', 'P resumes co-op');
  await cdp.tap(...K.esc); await sleep(200);
  await cdp.tap(...K.m); await sleep(300);

  // ---------- deathmatch ----------
  await cdp.tap(...K.d3); await sleep(250);
  await cdp.tap(...K.d1); await sleep(400);
  s = await S();
  assert('DM-start', s.state === 'playing' && s.mode === 'deathmatch' && s.zombies === 0, `mode=${s.mode}`);
  assert('DM-crates-enabled', (await waitFor(async () => (await S()).crates.length > 0, 15000, 250)) !== null, 'first crate within 15s');
  // P2 aims with the fire cluster (I/J/K/L = up/left/down/right, two keys = diagonal)
  const p2FireAt = async (tx, ty, ms = 200) => {
    const st = await S();
    const p2 = st.players[1];
    const dx = tx - p2.x, dy = ty - p2.y;
    const keys = [];
    if (dx > 6) keys.push('l'); else if (dx < -6) keys.push('j');
    if (dy > 6) keys.push('k'); else if (dy < -6) keys.push('i');
    if (!keys.length) keys.push('l');
    for (const k of keys) await cdp.key(...K[k]);
    await sleep(ms);
    for (const k of keys) await cdp.keyUp(...K[k]);
  };
  const steerP2To = async (target, timeoutMs = 7000) => {
    const t0 = Date.now();
    let lastPos = null, stuck = 0;
    while (Date.now() - t0 < timeoutMs) {
      const st = await S();
      if (st.state !== 'playing') return false;
      const p2 = st.players[1];
      const dx = target.x - p2.x, dy = target.y - p2.y;
      if (Math.hypot(dx, dy) < 14) return true;
      if (lastPos && Math.hypot(p2.x - lastPos.x, p2.y - lastPos.y) < 1) stuck++;
      else stuck = 0;
      lastPos = { x: p2.x, y: p2.y };
      let key;
      if (stuck >= 2) key = Math.abs(dx) > Math.abs(dy) ? (dy > 0 ? 'down' : 'up') : (dx > 0 ? 'right' : 'left');
      else key = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      await cdp.key(...K[key]); await sleep(90); await cdp.keyUp(...K[key]);
    }
    return false;
  };
  // phase 1: P2 shoots P1 (at spawn 320,200) down to <=25 hp
  for (let i = 0; i < 50; i++) {
    s = await S();
    if (s.state !== 'playing' || s.players[0].hp <= 25) break;
    await p2FireAt(s.players[0].x, s.players[0].y, 240);
    await sleep(110);
  }
  s = await S();
  assert('DM-p2-damage', s.players[0].hp < 100 && s.players[0].hp > 0, `P1 hp=${s.players[0].hp}`);
  // phase 2: park P1 beside the (150,300) barrel, ~30px off the shooter line
  // but inside the 0.8×55=44 blast ring; P2 lines up directly above the
  // barrel for a pure vertical shot (diagonals kept firing zero bullets)
  await steerTo((await S()).players[0], { x: 125, y: 283 }, 9000);
  s = await S();
  const dBarrel = Math.hypot(s.players[0].x - 150, s.players[0].y - 300);
  assert('DM-p1-near-barrel', dBarrel < 44, `dist=${Math.round(dBarrel)}`);
  await steerP2To({ x: 150, y: 245 }, 9000);
  const p2pos = (await S()).players[1];
  console.log(`INFO DM phase2 p2=(${p2pos.x.toFixed(0)},${p2pos.y.toFixed(0)}) barrels=${JSON.stringify((await S()).barrels)}`);
  const killsBefore = (await S()).players[1].kills;
  for (let i = 0; i < 40; i++) {
    s = await S();
    if (s.state !== 'playing' || s.players[1].kills > killsBefore) break;
    if (s.barrels.some((b) => b.exploded)) break;
    await p2FireAt(150, 300, 420);
    await sleep(120);
    await steerTo((await S()).players[0], { x: 125, y: 283 }, 500); // stay parked
  }
  s = await S();
  assert('DM-aoe-kill-credit', s.players[1].kills > killsBefore, `P2 kills ${killsBefore}->${s.players[1].kills} (barrel blast, P1 hp=${s.players[0].hp})`);
  // phase 3: P1 kills P2 with mouse aim (P1's pointer-aim path — sr1's proven
  // pattern); P2 idles at spawn2. P1 refills at crates when dry.
  const t0 = Date.now();
  let lastShot = 0;
  while (Date.now() - t0 < 180000) {
    s = await S();
    if (s.state === 'victory') break;
    if (s.state !== 'playing') { await sleep(250); continue; }
    const p1 = s.players[0], p2 = s.players[1];
    if (!p2.alive) { await sleep(700); continue; } // respawn window
    if (p1.ammo < 8 && s.crates.length) {
      const c = s.crates[0];
      await steerTo(p1, { x: c.x, y: c.y }, 3000);
      await sleep(250);
      continue;
    }
    await aimAt(p2.x, p2.y);
    const now = Date.now();
    if (now - lastShot > 300) { lastShot = now; await cdp.tap(...K.space, 40); }
    await sleep(120);
  }
  assert('DM-match-end', s.state === 'victory' && (s.banner || '').includes('WINS THE DEATHMATCH'), s.banner?.split('\n')[0]);
  await cdp.screenshot(EV + 'sr2-boxhead-dm-end.png');
  const dmScore = s.banner?.match(/(\d+)–(\d+)/);
  assert('DM-target-5', !!dmScore && (Number(dmScore[1]) >= 5 || Number(dmScore[2]) >= 5), `scoreline=${dmScore?.[0]}`);
  await cdp.tap(...K.space); await sleep(400);
  assert('DM-rematch', (await S()).state === 'playing', 'SPACE rematch');
  await cdp.tap(...K.esc); await sleep(200);
  await cdp.tap(...K.m); await sleep(300);

  // ---------- touch (fresh page with touch emulation) ----------
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
  await cdp.send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' });
  await boot();
  const tapStage = async (x, y) => {
    const r = await canvasRect();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.left + x * r.scale, y: r.top + y * r.scale, id: 1 }] });
    await sleep(60);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(250);
  };
  await tapStage(320, 200); // title
  await tapStage(320, 200); // mode (tap = solo)
  await tapStage(320, 200); // room (tap = room 1)
  s = await S();
  assert('TOUCH-menus', s.state === 'playing', `state=${s.state}`);
  const tx0 = s.players[0].x;
  const r = await canvasRect();
  const stick = { x: r.left + 78 * r.scale, y: r.top + (400 - 74) * r.scale };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...stick, id: 1 }] });
  await sleep(80);
  for (let i = 1; i <= 5; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: stick.x + i * 8, y: stick.y, id: 1 }] });
    await sleep(60);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  s = await S();
  assert('TOUCH-stick', s.players[0].x > tx0 + 15, `P1 x ${Math.round(tx0)}->${Math.round(s.players[0].x)}`);
  const ta0 = s.players[0].ammo;
  const fire = { x: r.left + (640 - 66) * r.scale, y: r.top + (400 - 70) * r.scale };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...fire, id: 2 }] });
  await sleep(500);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  s = await S();
  assert('TOUCH-fire', s.players[0].ammo < ta0, `ammo ${ta0}->${s.players[0].ammo}`);
  // portrait letterbox
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 500, height: 900, deviceScaleFactor: 1, mobile: true });
  await sleep(400);
  const pr = await cdp.eval(`(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { w: r.width, h: r.height }; })()`);
  const pscale = Math.min(500 / 640, 900 / 400);
  assert('TOUCH-portrait-letterbox', Math.abs(pr.w / 640 - pscale) < 0.01 && Math.abs(pr.h / 400 - pscale) < 0.01, `canvas ${pr.w}x${pr.h} scale=${(pr.w / 640).toFixed(3)}`);
  await cdp.screenshot(EV + 'sr2-boxhead-touch.png');
  // dead-screen tap retry + MENU chip
  const deadSt = await waitFor(async () => { const v = await S(); return v.state === 'dead' ? v : null; }, 90000, 300);
  assert('TOUCH-death', !!deadSt, 'death under touch emulation');
  if (deadSt) {
    await tapStage(320, 200);
    s = await S();
    assert('TOUCH-tap-retry', s.state === 'playing', `state=${s.state}`);
    await cdp.tap(...K.esc); await sleep(200);
    const st2 = await waitFor(async () => { const v = await S(); return v.state === 'dead' ? v : null; }, 90000, 300);
    if (st2) {
      const chip = await canvasRect();
      const cx = chip.left + 320 * chip.scale, cy = chip.top + (400 - 44) * chip.scale;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
      await sleep(60);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await sleep(300);
      s = await S();
      assert('TOUCH-menu-chip', s.state === 'mode', `state=${s.state}`);
    }
  }

  // ---------- hygiene ----------
  const errs = consoleErrors.filter((e) => !e.includes('favicon'));
  assert('HYGIENE-console', errs.length === 0, errs.slice(0, 3).join(' | ') || '0 errors');
  const reqs = await cdp.eval('performance.getEntriesByType("resource").map(r => r.name).filter(n => !n.startsWith("http://127.0.0.1:8281"))');
  assert('HYGIENE-local-only', reqs.length === 0, reqs.slice(0, 3).join(' | ') || 'all local');

  const pass = results.filter((r) => r.ok).length;
  console.log(`\nCANONICAL SMOKE: ${pass}/${results.length}`);
  await cdp.close();
  process.exit(pass === results.length ? 0 : 1);
}

main().catch(async (e) => {
  console.error('SUITE ERROR', e);
  try { const s = await S(); console.error('last state', JSON.stringify(s).slice(0, 400)); } catch {}
  try { await cdp.close(); } catch {}
  process.exit(2);
});
