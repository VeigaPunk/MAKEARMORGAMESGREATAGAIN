// sr2-sas-run.mjs — verification driver for apps/swords-and-sandals (port 5178, ?debug).
// sr2 evidence: drives the FINAL app with REAL CDP input (mouse clicks, key taps).
// Covers: rights rename, title flow, XSS injection matrix (stored name, zero
// execution), validSave corrupt-rejection 8/8, settings (volumes+mute persisted
// across reload, reachable from title/hub), audio scheduled (WebAudio readable,
// ctx running, music voices), shop buy, FULL 5-bout ladder clear with real input,
// defeat screen + retry, save/load round-trip, Esc exits, keyboard, touch smoke
// at phone viewport. Precedent: verification/evidence/sr1-cdp.mjs.
// Run: node verification/evidence/sr2-sas-run.mjs
import { CDP } from './sr1-cdp.mjs';
import { appendFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const APP_URL = 'http://localhost:5178/?debug';
const LOG_FILE = new URL('./sr2-sas-run.log', import.meta.url).pathname;
const EV = (f) => new URL(f, import.meta.url).pathname;
writeFileSync(LOG_FILE, '');
let fails = 0;
const log = (s) => { console.log(s); appendFileSync(LOG_FILE, s + '\n'); };
const check = (name, ok, detail) => { if (!ok) fails++; log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  [' + detail + ']' : ''}`); };
const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));

const state = (cdp) => cdp.eval('(()=>{const m=window.__maga;return {mode:m.mode,hp:m.hp,gold:m.gold,xp:m.xp,level:m.level,defeated:m.defeated,potions:m.potions,opp:m.opponent,oppHp:m.opponentHp,oppName:m.opponentName,stats:m.gladiatorStats}})()');
const clickButton = async (cdp, substr) => {
  const r = await cdp.eval(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(${JSON.stringify(substr)})&&!x.disabled);if(!b)return null;b.scrollIntoView({block:'center'});const x=b.getBoundingClientRect();return {x:x.left+x.width/2,y:x.top+x.height/2}})()`);
  if (!r) throw new Error('button not found: ' + substr);
  await cdp.click(r.x, r.y);
};
const typeText = async (cdp, s) => {
  for (const ch of s) {
    if (/^[a-zA-Z0-9 ]$/.test(ch)) {
      const vk = ch.toUpperCase().charCodeAt(0);
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Key' + ch.toUpperCase(), key: ch, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, text: ch });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Key' + ch.toUpperCase(), key: ch, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    } else {
      await cdp.send('Input.dispatchKeyEvent', { type: 'char', text: ch });
    }
  }
};
const installProbe = (cdp) => cdp.eval('(()=>{window.__probe={p:0};Object.defineProperty(window,"p",{set(v){window.__probe.p=v},get(){return window.__probe.p},configurable:true});return 1})()');
const clickNameField = async (cdp) => {
  const r = await cdp.eval('(()=>{const e=document.querySelector("#name");e.scrollIntoView({block:"center"});const x=e.getBoundingClientRect();return {x:x.left+x.width/2,y:x.top+x.height/2}})()');
  await cdp.click(r.x, r.y);
};
const errorsOf = (errs) => errs.filter((e) => !e.includes('favicon'));

async function freshProfile() { return mkdtempSync(join(tmpdir(), 'sr2sas-')); }
async function launchApp(port, width = 1280, height = 800) {
  const cdp = await CDP.launch({ port, userDataDir: await freshProfile(), width, height });
  const errors = cdp.consoleErrors();
  await cdp.send('Runtime.enable'); await cdp.send('Log.enable');
  await cdp.navigate(APP_URL);
  await cdp.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>300)throw new Error("no __maga")},50)})');
  return { cdp, errors };
}
const snapSave = (cdp) => cdp.eval('localStorage.getItem("maga:swords-and-sandals:slot")');

// One combat turn: Special if hp>18, else potion; returns after enemy reply.
async function combatTurn(cdp) {
  const s = await state(cdp);
  if (s.hp <= 18 && s.potions > 0) await clickButton(cdp, 'Potion');
  else await clickButton(cdp, 'Special');
  await waitMs(120);
}
async function fightUntilDone(cdp, maxTurns = 120) {
  let turns = 0;
  while (turns++ < maxTurns) {
    const s = await state(cdp);
    if (s.mode !== 'arena') return { done: true, turns, s };
    await combatTurn(cdp);
  }
  return { done: false, turns, s: await state(cdp) };
}
// Play one bout from hub: buy listed shop items first, then fight to the end.
async function playBout(cdp, buyIdx) {
  const pre = await state(cdp);
  if (buyIdx.length) {
    await clickButton(cdp, 'Smithy');
    for (const i of buyIdx) {
      const r = await cdp.eval(`(()=>{const b=document.querySelector('[data-item="${i}"]');if(!b||b.disabled)return null;const x=b.getBoundingClientRect();return {x:x.left+x.width/2,y:x.top+x.height/2}})()`);
      if (r) { await cdp.click(r.x, r.y); await waitMs(80); }
    }
    await clickButton(cdp, 'Back to Hub');
  }
  await clickButton(cdp, pre.defeated ? 'Next Opponent' : 'Start First Bout');
  await waitMs(120);
  const res = await fightUntilDone(cdp);
  return res;
}

// ---------------- desktop run ----------------
{
  const { cdp, errors } = await launchApp(9511);
  log('=== desktop run (1280x800) ===');

  // A. rights + title
  const t1 = await cdp.eval('document.title');
  check('A rights: document.title renamed', t1 === 'Arena of Bonks — MAGA native replica', t1);
  let s = await state(cdp);
  check('A title screen is the boot state', s.mode === 'title', 'mode=' + s.mode);
  await waitMs(400);
  const st1 = await cdp.screenshot(EV('./sr2-sas-title.png'));
  log('screenshot -> ' + st1);
  const bodyText = await cdp.eval('document.body.innerText');
  const htmlSrc = await cdp.eval('document.documentElement.innerHTML.slice(0,200000)');
  check('A rights: no "Swords" mark in player-facing strings', !/swords/i.test(bodyText) && !/swords/i.test(t1), 'body/title clean');
  check('A rights: no "Sandals" mark in player-facing strings', !/sandals/i.test(bodyText) && !/sandals/i.test(t1), 'body/title clean');
  const canvasClean = !/SWORDS & SANDALS/.test(htmlSrc);
  check('A rights: original wordmark gone from DOM/canvas text', canvasClean, 'src searched');
  await clickButton(cdp, 'New Gladiator');
  s = await state(cdp);
  check('A title -> create via real click', s.mode === 'create', 'mode=' + s.mode);

  // B. create gladiator (middle build from sr1) with real input
  for (let i = 0; i < 2; i++) { await clickButton(cdp, 'strength'); }
  for (let i = 0; i < 1; i++) { await clickButton(cdp, 'agility'); }
  for (let i = 0; i < 2; i++) { await clickButton(cdp, 'vitality'); }
  for (let i = 0; i < 1; i++) { await clickButton(cdp, 'defense'); }
  await clickNameField(cdp);
  await typeText(cdp, 'Maximus QA');
  await clickButton(cdp, 'Enter the Arena');
  s = await state(cdp);
  check('B create -> hub with middle build', s.mode === 'hub' && JSON.stringify(s.stats) === JSON.stringify({ strength: 4, agility: 3, vitality: 4, defense: 3 }), JSON.stringify(s));

  // C. settings from hub: open, set volumes+mute with real clicks, persist
  await clickButton(cdp, 'SETTINGS');
  const vis0 = await cdp.eval('!document.getElementById("settings").classList.contains("hidden")');
  const track = await cdp.eval('(()=>{const r=document.getElementById("vol-music").getBoundingClientRect();return {x:r.left,y:r.top+r.height/2,w:r.width}})()');
  await cdp.click(track.x + track.w * 0.3, track.y);
  const track2 = await cdp.eval('(()=>{const r=document.getElementById("vol-sfx").getBoundingClientRect();return {x:r.left,y:r.top+r.height/2,w:r.width}})()');
  await cdp.click(track2.x + track2.w * 0.5, track2.y);
  const mbox = await cdp.eval('(()=>{const r=document.getElementById("mute-box").getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()');
  await cdp.click(mbox.x, mbox.y);
  const set1 = await cdp.eval('(()=>{const s=__maga.sfx;return {music:s.musicVolume,sfxVol:s.sfxVolume,muted:s.muted,ls:localStorage.getItem("maga:swords-and-sandals:audio")}})()');
  check('C settings: volumes+mute applied + persisted', vis0 && Math.abs(set1.music - 0.3) < 0.03 && Math.abs(set1.sfxVol - 0.5) < 0.03 && set1.muted === true && !!set1.ls, JSON.stringify(set1));
  await cdp.screenshot(EV('./sr2-sas-settings.png'));
  await clickButton(cdp, 'CLOSE');
  // reload -> persists; then unmute via keyboard-driven checkbox for the rest of the run
  await cdp.navigate(APP_URL); await waitMs(400);
  const set2 = await cdp.eval('(()=>{const s=__maga.sfx;return {music:s.musicVolume,muted:s.muted,slider:document.getElementById("vol-music").value}})()');
  check('C settings persist across reload', Math.abs(set2.music - 0.3) < 0.05 && set2.muted === true && set2.slider === String(Math.round(set2.music * 100)), JSON.stringify(set2));
  await clickButton(cdp, 'SETTINGS');
  await cdp.click(mbox.x, mbox.y);
  await clickButton(cdp, 'CLOSE');
  const set3 = await cdp.eval('__maga.sfx.muted');
  check('C unmute applied', set3 === false, 'muted=' + set3);
  // Continue back into the hub (save exists only after Enter the Arena — still create here)
  s = await state(cdp);
  check('C after reload, no premature save', s.mode === 'title' && s.defeated === 0, 'mode=' + s.mode + ' savePresent=' + await cdp.eval('__maga.savePresent'));

  // D. audio scheduled: ctx running, voices>0, music voices accumulate
  await clickButton(cdp, 'New Gladiator');
  for (let i = 0; i < 2; i++) await clickButton(cdp, 'strength');
  for (let i = 0; i < 1; i++) await clickButton(cdp, 'agility');
  for (let i = 0; i < 2; i++) await clickButton(cdp, 'vitality');
  for (let i = 0; i < 1; i++) await clickButton(cdp, 'defense');
  await clickNameField(cdp);
  await typeText(cdp, 'Maximus QA');
  await clickButton(cdp, 'Enter the Arena');
  await waitMs(600);
  const au = await cdp.eval('(()=>{const s=__maga.sfx;return {voices:s.voices,running:s.running}})()');
  await waitMs(700);
  const au2 = await cdp.eval('(()=>{const s=__maga.sfx;return {voices:s.voices}})()');
  check('D audio: ctx running + voices scheduled (music accruing)', au.running && au.voices > 0 && au2.voices > au.voices, JSON.stringify(au) + ' -> ' + au2.voices);

  // E. full ladder clear (5 bouts), buying the kit across the ladder
  const plan = [[], [0], [1], [2], []];
  const names = ['Tin Can Tim', 'Baron Bonk', 'The Sand Snorter', 'Praetor Pommel', 'Emperor’s Champion'];
  const trace = [];
  let defeats = 0;
  for (let bout = 0; bout < 5; bout++) {
    if (bout === 3) { // save/load round-trip mid-ladder before bout 4
      const before = await state(cdp);
      const raw1 = await snapSave(cdp);
      await cdp.navigate(APP_URL); await waitMs(400);
      await clickButton(cdp, 'Continue');
      const after = await state(cdp);
      const raw2 = await snapSave(cdp);
      check('E save/load round-trip mid-ladder', JSON.stringify(before) === JSON.stringify(after) && raw1 === raw2, `before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
    }
    let res = await playBout(cdp, plan[bout]);
    while (!res.done) { check('E bout ' + (bout + 1) + ' finished within turn cap', false, 'turns=' + res.turns); break; }
    let guard = 0;
    while (res.s.mode === 'defeat' && guard++ < 6) {
      defeats++;
      await clickButton(cdp, 'Rise Again');
      res = await playBout(cdp, []);
    }
    const s2 = await state(cdp);
    trace.push(`fight${bout + 1} vs ${names[s2.opp - 1] ?? names[bout]}: turns=${res.turns} defeats=${guard} won=${s2.defeated === bout + 1} mode=${s2.mode} hp=${s2.hp} gold=${s2.gold} lvl=${s2.level}`);
    check(`E fight ${bout + 1} (${names[bout]}) won`, s2.defeated === bout + 1, `turns=${res.turns} defeats=${guard}`);
    if (bout === 4) {
      const h1 = await cdp.eval('document.querySelector("#chrome h1")?.textContent');
      check('E complete screen reached', s2.mode === 'complete' && h1 === 'ARENA CONQUERED', 'mode=' + s2.mode + ' h1=' + h1);
      await cdp.screenshot(EV('./sr2-sas-complete.png'));
      await clickButton(cdp, 'Return to Hub');
      check('E complete -> Return to Hub', (await state(cdp)).mode === 'hub');
      await clickButton(cdp, 'Save & Title');
      check('E hub -> Save & Title', (await state(cdp)).mode === 'title');
      const cont = await cdp.eval('[...document.querySelectorAll("button")].some(b=>b.textContent.includes("Continue"))');
      check('E title offers Continue after save', cont === true);
      await clickButton(cdp, 'Continue');
      check('E Continue -> complete mode (ladder done)', (await state(cdp)).mode === 'complete');
    }
  }
  log('E ladder trace: ' + trace.join(' || '));
  log(`E honest defeats across the run: ${defeats}`);

  // F. arena art screenshot mid-fight on a fresh profile
  const prof2 = await freshProfile();
  const cdp2 = await CDP.launch({ port: 9512, userDataDir: prof2, width: 1280, height: 800 });
  const errors2 = cdp2.consoleErrors();
  await cdp2.send('Runtime.enable'); await cdp2.send('Log.enable');
  await cdp2.navigate(APP_URL);
  await cdp2.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>300)throw new Error("no __maga")},50)})');
  await clickButton(cdp2, 'New Gladiator');
  for (let i = 0; i < 2; i++) await clickButton(cdp2, 'strength');
  await clickButton(cdp2, 'agility'); for (let i = 0; i < 2; i++) await clickButton(cdp2, 'vitality');
  await clickButton(cdp2, 'defense');
  await clickNameField(cdp2); await typeText(cdp2, 'Art Check');
  await clickButton(cdp2, 'Enter the Arena');
  await clickButton(cdp2, 'Start First Bout');
  await clickButton(cdp2, 'Attack');
  await waitMs(260);
  await cdp2.screenshot(EV('./sr2-sas-arena.png'));
  const artErrs = errorsOf(errors2);
  check('F arena art frame: no console errors during combat', artErrs.length === 0, artErrs.slice(0, 2).join(' | ') || 'clean');
  // Esc opens settings from arena (exit present), Esc closes
  await cdp2.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  await cdp2.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  const escSettings = await cdp2.eval('!document.getElementById("settings").classList.contains("hidden") && __maga.mode==="arena"');
  check('F Esc in arena opens settings (combat preserved)', escSettings === true);
  await cdp2.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  await cdp2.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  check('F Esc closes settings', await cdp2.eval('document.getElementById("settings").classList.contains("hidden")'));
  await cdp2.close();

  // G. defeat screen: fresh profile, dump all points into strength, never attack
  const cdp3 = await CDP.launch({ port: 9513, userDataDir: await freshProfile(), width: 1280, height: 800 });
  const errors3 = cdp3.consoleErrors();
  await cdp3.send('Runtime.enable'); await cdp3.send('Log.enable');
  await cdp3.navigate(APP_URL);
  await cdp3.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>300)throw new Error("no __maga")},50)})');
  await clickButton(cdp3, 'New Gladiator');
  for (let i = 0; i < 6; i++) await clickButton(cdp3, 'strength');
  await clickNameField(cdp3); await typeText(cdp3, 'Punching Bag');
  await clickButton(cdp3, 'Enter the Arena');
  const saveBefore = await snapSave(cdp3);
  await clickButton(cdp3, 'Start First Bout');
  let dstate = await state(cdp3);
  let dturns = 0;
  while (dstate.mode === 'arena' && dturns++ < 80) { await clickButton(cdp3, 'Taunt'); await waitMs(60); dstate = await state(cdp3); }
  check('G defeat screen reached by honest play', dstate.mode === 'defeat', 'mode=' + dstate.mode + ' turns=' + dturns);
  const h1d = await cdp3.eval('document.querySelector("#chrome h1")?.textContent');
  check('G defeat screen copy', h1d === 'DEFEAT', h1d);
  const saveAfter = await snapSave(cdp3);
  const gAfter = JSON.parse(saveAfter).gladiator;
  check('G defeat-safe save (hp restored, standing kept)', gAfter.hp === gAfter.maxHp && JSON.parse(saveAfter).defeated === 0, 'hp=' + gAfter.hp + '/' + gAfter.maxHp);
  await clickButton(cdp3, 'Rise Again');
  check('G defeat -> Rise Again -> hub', (await state(cdp3)).mode === 'hub');
  check('G no console errors on defeat path', errorsOf(errors3).length === 0);
  // Esc backs out: shop -> hub, hub -> title
  await clickButton(cdp3, 'Smithy');
  await cdp3.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  await cdp3.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  check('G Esc in shop backs to hub', (await state(cdp3)).mode === 'hub');
  await cdp3.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  await cdp3.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  check('G Esc in hub backs to title', (await state(cdp3)).mode === 'title');
  await cdp3.close();

  // H. XSS regression matrix (fresh profile per payload)
  const payloads = ['<img src=x onerror=window.p=1>', '<script>window.p=1</script>', '" autofocus onfocus=window.p=1 x="', 'Max "The Hammer" & Co.'];
  for (const pl of payloads) {
    const cdpX = await CDP.launch({ port: 9514, userDataDir: await freshProfile(), width: 1280, height: 800 });
    const errorsX = cdpX.consoleErrors();
    await cdpX.send('Runtime.enable'); await cdpX.send('Log.enable');
    await cdpX.navigate(APP_URL);
    await cdpX.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>300)throw new Error("no __maga")},50)})');
    await installProbe(cdpX);
    await clickButton(cdpX, 'New Gladiator');
    for (let i = 0; i < 2; i++) await clickButton(cdpX, 'strength');
    await clickButton(cdpX, 'agility'); for (let i = 0; i < 2; i++) await clickButton(cdpX, 'vitality');
    await clickButton(cdpX, 'defense');
    await clickNameField(cdpX); await typeText(cdpX, pl);
    await clickButton(cdpX, 'Enter the Arena');
    let sx = await state(cdpX);
    check(`H XSS "${pl.slice(0, 24)}" create -> hub`, sx.mode === 'hub', 'mode=' + sx.mode);
    await clickButton(cdpX, 'Smithy');
    await clickButton(cdpX, 'Back to Hub');
    await clickButton(cdpX, 'Start First Bout');
    await clickButton(cdpX, 'Attack');
    await waitMs(200);
    const exec = await cdpX.eval('window.__probe.p');
    check(`H XSS "${pl.slice(0, 24)}" zero execution through create/shop/arena`, exec === 0, 'p=' + exec);
    await cdpX.navigate(APP_URL); await waitMs(400);
    await installProbe(cdpX);
    await clickButton(cdpX, 'Continue');
    await clickButton(cdpX, 'Smithy');
    const exec2 = await cdpX.eval('window.__probe.p');
    check(`H XSS "${pl.slice(0, 24)}" zero execution after reload+shop`, exec2 === 0, 'p=' + exec2);
    const hudSafe = await cdpX.eval('document.getElementById("hud").querySelectorAll("*[src],*[onerror]").length===0');
    check(`H XSS "${pl.slice(0, 24)}" hud injected no elements`, hudSafe === true);
    if (pl.startsWith('Max')) {
      const verbatim = await cdpX.eval('document.getElementById("hud").textContent.includes(\'Max "The Hammer" & Co.\')');
      const escd = await cdpX.eval('document.getElementById("hud").innerHTML.includes("&amp;")');
      check('H benign name verbatim + escaped', verbatim && escd);
    }
    check(`H XSS "${pl.slice(0, 24)}" no console errors`, errorsOf(errorsX).length === 0, errorsOf(errorsX).slice(0, 2).join('|'));
    await cdpX.close();
    await waitMs(500);
  }
  // tampered attacker save
  {
    const cdpT = await CDP.launch({ port: 9515, userDataDir: await freshProfile(), width: 1280, height: 800 });
    const errorsT = cdpT.consoleErrors();
    await cdpT.send('Runtime.enable'); await cdpT.send('Log.enable');
    await cdpT.navigate(APP_URL);
    await cdpT.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>300)throw new Error("no __maga")},50)})');
    await cdpT.eval(`localStorage.setItem("maga:swords-and-sandals:slot",JSON.stringify({gladiator:{name:'<img src=x onerror=window.p=1>',look:'" autofocus onfocus=window.p=1 x="',stats:{strength:2,agility:2,vitality:2,defense:2},hp:30,maxHp:30,gold:0,xp:0,level:1,weapon:0,armor:0,potions:2},defeated:0,owned:[]}))`);
    await cdpT.navigate(APP_URL); await waitMs(400);
    await installProbe(cdpT);
    await clickButton(cdpT, 'Continue');
    const look = await cdpT.eval('document.querySelector(".portrait")?.getAttribute("src")');
    check('H2 tampered save: look clamped to known preset', look === 'portrait-scarlet.svg', look);
    await clickButton(cdpT, 'Smithy');
    await clickButton(cdpT, 'Back to Hub');
    await clickButton(cdpT, 'Start First Bout');
    await clickButton(cdpT, 'Attack');
    await waitMs(200);
    const exec = await cdpT.eval('window.__probe.p');
    check('H2 tampered save: zero execution through shop+arena', exec === 0, 'p=' + exec);
    check('H2 tampered save: no console errors', errorsOf(errorsT).length === 0);
    await cdpT.close();
  }
  // validSave corrupt-rejection matrix
  {
    const corrupt = ['{"gladiator":1}', '{"gladiator":{"name":"x","look":"Scarlet","stats":{"strength":2,"agility":2,"vitality":2,"defense":2},"hp":30,"maxHp":30,"gold":0,"xp":0,"level":1,"weapon":0,"armor":0,"potions":2},"defeated":-1}', '{"gladiator":{"name":"x","look":"Scarlet","stats":{"strength":2,"agility":2,"vitality":2,"defense":2},"hp":30,"maxHp":30,"gold":0,"xp":0,"level":1,"weapon":0,"armor":0,"potions":2},"defeated":99}', '{"gladiator":{"name":"x","look":"Scarlet","stats":{"strength":2,"agility":2},"hp":30,"maxHp":30,"gold":0,"xp":0,"level":1,"weapon":0,"armor":0,"potions":2},"defeated":1}', '{"gladiator":{"name":1,"look":"Scarlet","stats":{"strength":2,"agility":2,"vitality":2,"defense":2},"hp":30,"maxHp":30,"gold":0,"xp":0,"level":1,"weapon":0,"armor":0,"potions":2},"defeated":1}', '{"gladiator":{"name":"x","look":"Scarlet","stats":{"strength":2,"agility":2,"vitality":2,"defense":2},"hp":30,"maxHp":30,"gold":"0","xp":0,"level":1,"weapon":0,"armor":0,"potions":2},"defeated":1}', '{"gladiator":{"name":"x","look":"Scarlet","stats":{"strength":2,"agility":2,"vitality":2,"defense":2},"hp":30,"maxHp":30,"gold":0,"xp":0,"level":1,"weapon":0,"armor":0,"potions":2},"defeated":1,"owned":[1]}', 'garbage{{'];
    for (let i = 0; i < corrupt.length; i++) {
      const cdpC = await CDP.launch({ port: 9516, userDataDir: await freshProfile(), width: 1280, height: 800 });
      await cdpC.send('Runtime.enable');
      await cdpC.navigate(APP_URL);
      await cdpC.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>300)throw new Error("no __maga")},50)})');
      await cdpC.eval(`localStorage.setItem("maga:swords-and-sandals:slot",${JSON.stringify(corrupt[i])})`);
      await cdpC.navigate(APP_URL); await waitMs(400);
      await clickButton(cdpC, 'New Gladiator');
      const m = await cdpC.eval('__maga.mode');
      check(`I validSave corrupt #${i + 1}/${corrupt.length} rejected`, m === 'create', 'mode=' + m);
      await cdpC.close();
      await waitMs(500);
    }
    const cdpV = await CDP.launch({ port: 9517, userDataDir: await freshProfile(), width: 1280, height: 800 });
    await cdpV.send('Runtime.enable');
    await cdpV.navigate(APP_URL);
    await cdpV.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>300)throw new Error("no __maga")},50)})');
    await cdpV.eval('localStorage.setItem("maga:swords-and-sandals:slot",JSON.stringify({gladiator:{name:"Brutus","look":"Azure",stats:{strength:3,agility:2,vitality:2,defense:2},hp:32,maxHp:32,gold:10,xp:22,level:1,weapon:0,armor:0,potions:2},defeated:2,owned:[]}))');
    await cdpV.navigate(APP_URL); await waitMs(400);
    await clickButton(cdpV, 'Continue');
    const sv = await state(cdpV);
    check('I valid mid-ladder save -> hub', sv.mode === 'hub' && sv.defeated === 2, 'mode=' + sv.mode + ' defeated=' + sv.defeated);
    await cdpV.close();
  }
  // J. keyboard map (no custom bindings by design)
  {
    await cdp.navigate(APP_URL); await waitMs(400);
    await cdp.eval('new Promise(r=>{let n=0;const t=setInterval(()=>{if(window.__maga){clearInterval(t);r(1)}if(++n>300)throw new Error("no __maga")},50)})');
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Tab', key: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Tab', key: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    const stop = await cdp.eval('document.activeElement?.tagName+":"+(document.activeElement?.textContent||"").slice(0,30)');
    check('J Tab moves focus to a button', /^BUTTON/.test(stop), stop);
    let enterOk = false;
    for (let i = 0; i < 10 && !enterOk; i++) {
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Tab', key: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Tab', key: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
      const txt = await cdp.eval('document.activeElement?.textContent||""');
      if (txt.includes('New Gladiator')) enterOk = true;
    }
    if (enterOk) {
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Enter', key: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r' });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Enter', key: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
      check('J Enter activates focused title button', (await state(cdp)).mode === 'create', 'mode=' + (await state(cdp)).mode);
    } else check('J found New Gladiator by Tab', false);
    const kerrs = errorsOf(errors);
    check('J no console errors (desktop)', kerrs.length === 0, kerrs.slice(0, 2).join('|') || 'clean');
  }
  await cdp.close();
}

// ---------------- touch run (phone viewport) ----------------
{
  const { cdp, errors } = await launchApp(9521, 390, 844);
  log('=== touch run (390x844) ===');
  const t0 = await state(cdp);
  check('T boots to title at phone viewport', t0.mode === 'title', 'mode=' + t0.mode);
  await clickButton(cdp, 'New Gladiator');
  // tap look + stats (real taps, scrolled into view)
  const look = await cdp.eval('(()=>{const b=[...document.querySelectorAll("[data-look]")].find(x=>x.dataset.look==="Azure");b.scrollIntoView({block:"center"});const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()');
  await cdp.click(look.x, look.y);
  for (let i = 0; i < 2; i++) { const b = await cdp.eval('(()=>{const b=[...document.querySelectorAll("[data-stat]")].find(x=>x.dataset.stat==="vitality");b.scrollIntoView({block:"center"});const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()'); await cdp.click(b.x, b.y); }
  for (let i = 0; i < 2; i++) { const b = await cdp.eval('(()=>{const b=[...document.querySelectorAll("[data-stat]")].find(x=>x.dataset.stat==="strength");b.scrollIntoView({block:"center"});const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()'); await cdp.click(b.x, b.y); }
  for (let i = 0; i < 2; i++) { const b = await cdp.eval('(()=>{const b=[...document.querySelectorAll("[data-stat]")].find(x=>x.dataset.stat==="defense");b.scrollIntoView({block:"center"});const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()'); await cdp.click(b.x, b.y); }
  await clickNameField(cdp); await typeText(cdp, 'Tap Champ');
  await clickButton(cdp, 'Enter the Arena');
  let s = await state(cdp);
  check('T create -> hub via taps', s.mode === 'hub', 'mode=' + s.mode);
  await clickButton(cdp, 'Start First Bout');
  s = await state(cdp);
  check('T hub -> arena via tap', s.mode === 'arena' && s.opp === 0, 'mode=' + s.mode);
  // tappable-size audit at this viewport
  const sizes = await cdp.eval(`(()=>{const bad=[...document.querySelectorAll('#actions button,.chrome button')].filter(b=>{const r=b.getBoundingClientRect();return r.width<40||r.height<40}).map(b=>b.textContent.slice(0,12));return bad})()`);
  check('T all combat/shop buttons >=40px at phone viewport', sizes.length === 0, JSON.stringify(sizes));
  let guard = 0;
  while ((await state(cdp)).mode === 'arena' && guard++ < 60) { await combatTurn(cdp); }
  s = await state(cdp);
  check('T first bout winnable by taps', s.mode === 'hub' && s.defeated === 1, 'mode=' + s.mode + ' defeated=' + s.defeated);
  await cdp.screenshot(EV('./sr2-sas-touch.png'));
  const terrs = errorsOf(errors);
  check('T no console errors (touch)', terrs.length === 0, terrs.slice(0, 2).join('|') || 'clean');
  await cdp.close();
}

log(`==== SUMMARY: ${fails === 0 ? 'ALL PASS' : fails + ' FAILURES'} ====`);
process.exit(fails === 0 ? 0 : 1);
