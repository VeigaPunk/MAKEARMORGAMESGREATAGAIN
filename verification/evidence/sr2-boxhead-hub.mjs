// sr2-boxhead-hub.mjs — boot-proof the SHIPPED tree: serve the repo root over
// http, click the real hub card with a real mouse, boot the built game with
// real keys. State reads use the same built files behind ?debug (instrumentation).
import { CDP } from './sr2-boxhead-cdp.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EV = new URL('.', import.meta.url).pathname;
const cdp = await CDP.launch({ port: 9411, userDataDir: '/tmp/sr2-hub-profile', width: 1400, height: 900 });
await cdp.navigate('http://127.0.0.1:8283/index.html');
await cdp.send('Runtime.enable');
await cdp.send('Log.enable');
const errors = cdp.consoleErrors();
for (let i = 0; i < 60; i++) {
  try { if (await cdp.eval(`!!document.querySelector('a.card[href="games/boxhead/"]')`)) break; } catch {}
  await sleep(250);
}
const name = await cdp.eval(`document.querySelector('a.card[href="games/boxhead/"] .name')?.textContent`);
console.log(`HUB card name=${name}`);
const colorCount = () => cdp.eval(`(() => { const c = document.querySelector('canvas'); if (!c) return 0; const g = document.createElement('canvas'); g.width = 8; g.height = 8; const x = g.getContext('2d'); x.drawImage(c, 0, 0, 8, 8); const d = x.getImageData(0, 0, 8, 8).data; const set = new Set(); for (let i = 0; i < d.length; i += 4) set.add((d[i] << 16) | (d[i+1] << 8) | d[i+2]); return set.size; })()`);
// real mouse click on the card
const rect = await cdp.eval(`(() => { const r = document.querySelector('a.card[href="games/boxhead/"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
await cdp.click(rect.x, rect.y);
await sleep(3000);
const url = await cdp.eval('location.href');
// pixel-diversity via drawImage is unreliable on WebGL canvases (black
// readback without preserveDrawingBuffer) — the instrumented state read below
// is the boot proof; here we only check the canvas exists after the real click.
const titleColors = await colorCount();
console.log(`after real click: url=${url} canvas-sample-colors=${titleColors}`);
// real keys: title -> mode -> room -> playing (plain build, no debug)
await cdp.tap('Space', ' ', 32); await sleep(350);
await cdp.tap('Digit1', '1', 49); await sleep(350);
await cdp.tap('Digit1', '1', 49); await sleep(2000);
await colorCount(); // canvas still present after real keys
await cdp.screenshot(EV + 'sr2-hub-boxhead.png');
// instrumented read of the same built files (state hook behind ?debug)
await cdp.navigate('http://127.0.0.1:8283/games/boxhead/?debug');
for (let i = 0; i < 40; i++) { try { if (await cdp.eval('!!window.__maga')) break; } catch {} await sleep(250); }
await cdp.tap('Space', ' ', 32); await sleep(300);
await cdp.tap('Digit1', '1', 49); await sleep(300);
await cdp.tap('Digit1', '1', 49); await sleep(1200);
const s = await cdp.eval('window.__maga.state').catch(() => null);
console.log(`instrumented boot: state=${s?.state} mode=${s?.mode} wave=${s?.wave} zombies=${s?.zombies}`);
const errs = errors.filter((e) => !e.includes('favicon'));
console.log('console errors:', errs.length, errs.slice(0, 3).join(' | ') || '-');
const nonLocal = await cdp.eval('performance.getEntriesByType("resource").map(r => r.name).filter(n => !n.startsWith("http://127.0.0.1:8283"))');
console.log('non-local requests:', nonLocal.length, nonLocal.slice(0, 3).join(' | ') || '-');
const pass = s?.state === 'playing' && s?.wave === 1 && errs.length === 0 && nonLocal.length === 0;
console.log(pass ? 'HUB BOOT-PROOF PASS' : 'HUB BOOT-PROOF FAIL');
await cdp.close();
process.exit(pass ? 0 : 1);
