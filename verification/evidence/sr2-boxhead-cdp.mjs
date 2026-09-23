// sr2-boxhead-cdp.mjs — zero-dependency Chromium CDP driver (Node 24 fetch+WebSocket).
// Verification-only: real Input.dispatchKeyEvent / dispatchMouseEvent / dispatchTouchEvent.
// Pattern precedent: verification/evidence/sr1-cdp.mjs (sr1 wave).
export class CDP {
  constructor() { this.id = 0; this.pending = new Map(); this.handlers = new Map(); this.ws = null; }

  static async launch({ port, userDataDir, width = 1280, height = 800 }) {
    const args = [
      '--headless=new', `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      '--no-first-run', '--no-default-browser-check', '--disable-gpu',
      '--disable-dev-shm-usage', '--mute-audio', '--autoplay-policy=no-user-gesture-required',
      `--window-size=${width},${height}`, '--force-device-scale-factor=1',
      'about:blank',
    ];
    const proc = spawn('/usr/bin/chromium', args, { stdio: 'ignore' });
    proc.on('error', (e) => console.error('chromium spawn error', e));
    let version = null;
    for (let i = 0; i < 100; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${port}/json/version`);
        if (r.ok) { version = await r.json(); break; }
      } catch { /* not up yet */ }
      await new Promise((r2) => setTimeout(r2, 100));
    }
    if (!version) throw new Error('chromium debugger endpoint did not come up');
    let targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    let page = targets.find((t) => t.type === 'page');
    if (!page) {
      page = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    }
    const cdp = new CDP();
    cdp.proc = proc;
    await cdp.connect(page.webSocketDebuggerUrl);
    return cdp;
  }

  connect(url) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;
      ws.onopen = () => resolve();
      ws.onerror = (e) => reject(new Error('ws error: ' + (e.message || 'unknown')));
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id !== undefined && this.pending.has(msg.id)) {
          const { resolve: r, reject: j } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) j(new Error(msg.error.message + ' (' + msg.error.code + ')'));
          else r(msg.result);
        } else if (msg.method && this.handlers.has(msg.method)) {
          for (const h of this.handlers.get(msg.method)) h(msg.params);
        }
      };
    });
  }
  on(method, cb) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(cb);
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('timeout: ' + method)); } }, 30000);
    });
  }
  async navigate(url) {
    await this.send('Page.enable');
    await this.send('Page.navigate', { url });
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  }
  async key(code, key, vk) {
    await this.send('Input.dispatchKeyEvent', { type: 'keyDown', code, key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  }
  async keyUp(code, key, vk) {
    await this.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  }
  async tap(code, key, vk, holdMs = 40) {
    await this.key(code, key, vk);
    await new Promise((r) => setTimeout(r, holdMs));
    await this.keyUp(code, key, vk);
  }
  async click(x, y) {
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' });
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  }
  async move(x, y) {
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' });
  }
  async screenshot(path) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(path, Buffer.from(r.data, 'base64'));
    return path;
  }
  consoleErrors() {
    const errors = [];
    this.on('Runtime.exceptionThrown', (p) => errors.push('EXCEPTION: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text)));
    this.on('Runtime.consoleAPICalled', (p) => {
      if (p.type === 'error') errors.push('console.error: ' + p.args.map((a) => a.value ?? a.description ?? '').join(' '));
    });
    this.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') errors.push('log: ' + p.entry.text); });
    return errors;
  }
  async close() { try { this.ws?.close(); } catch {} try { this.proc?.kill('SIGKILL'); } catch {} }
}

import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
