import { Container, Graphics, Text } from 'pixi.js';
import { PAL } from './art/palette';

/**
 * BH-2.1 touch layout C (solo mobile): virtual stick bottom-left + FIRE
 * button bottom-right, drawn in stage logical units. Shown only on coarse
 * pointers (or after the first touch), semi-transparent so the arena stays
 * readable. Auto-aim stays in game.ts — the fire button just holds 'fire'.
 *
 * Zones claim pointer events BEFORE Input's canvas-level tap handling would
 * misread them as aim taps: a pointer down inside a zone never becomes
 * `pointer.tapped` for menus because Game only consults the tap on menu
 * screens, where zones are hidden.
 */

const STICK_R = 34;
const FIRE_R = 26;

export class TouchControls {
  readonly view = new Container();
  /** normalized stick vector while a finger is on the pad, else null */
  stick: { x: number; y: number } | null = null;
  /** true while the fire button is held */
  fire = false;

  private shown = false;
  private coarse = false;
  /** zones only exist during gameplay — menus must see raw taps (D-14) */
  private active = false;
  private stickPointer = -1;
  private stickOrigin = { x: 0, y: 0 };
  private firePointer = -1;
  private baseAlpha = 0.42;

  private stickBase!: Graphics;
  private stickKnob!: Graphics;
  private fireBtn!: Graphics;
  private fireLabel: Text | null = null;

  constructor(
    private stageW: number,
    private stageH: number,
    canvas: HTMLCanvasElement,
    toLogical: (cx: number, cy: number) => { x: number; y: number },
  ) {
    this.coarse = matchMedia('(pointer: coarse)').matches;
    this.build();

    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return toLogical(e.clientX - r.left, e.clientY - r.top);
    };
    canvas.addEventListener('pointerdown', (e) => {
      this.coarse = this.coarse || e.pointerType === 'touch';
      if (!this.visibleTarget()) return;
      const p = toLocal(e);
      if (this.inStickZone(p)) {
        this.stickPointer = e.pointerId;
        this.stickOrigin = { x: p.x, y: p.y };
        this.stick = { x: 0, y: 0 };
        try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic/edge pointers */ }
        // zone owns this pointer — Input must not see it as aim/tap/drag (D-15)
        e.stopImmediatePropagation();
      } else if (this.inFireZone(p)) {
        this.firePointer = e.pointerId;
        this.fire = true;
        try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic/edge pointers */ }
        e.stopImmediatePropagation();
      }
      this.applyVisibility();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.stickPointer) {
        e.stopImmediatePropagation();
        const p = toLocal(e);
        const dx = p.x - this.stickOrigin.x;
        const dy = p.y - this.stickOrigin.y;
        const d = Math.hypot(dx, dy);
        if (d > 6) {
          const k = Math.min(1, d / STICK_R);
          this.stick = { x: (dx / d) * k, y: (dy / d) * k };
        } else {
          this.stick = { x: 0, y: 0 };
        }
        this.drawStick();
      }
    });
    const release = (e: PointerEvent) => {
      if (e.pointerId === this.stickPointer) {
        e.stopImmediatePropagation();
        this.stickPointer = -1;
        this.stick = null;
        this.drawStick();
      }
      if (e.pointerId === this.firePointer) {
        e.stopImmediatePropagation();
        this.firePointer = -1;
        this.fire = false;
        this.drawFire();
      }
    };
    // Release can occur outside the canvas when a finger leaves the viewport.
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
  }

  /** gameplay gate — menus/end screens leave every touch to Input (D-14) */
  setActive(v: boolean): void {
    this.active = v;
    this.applyVisibility();
  }

  private stickHome() { return { x: 78, y: this.stageH - 74 }; }
  private fireHome() { return { x: this.stageW - 66, y: this.stageH - 70 }; }

  private inStickZone(p: { x: number; y: number }): boolean {
    const h = this.stickHome();
    return Math.hypot(p.x - h.x, p.y - h.y) < STICK_R * 1.9;
  }

  private inFireZone(p: { x: number; y: number }): boolean {
    const h = this.fireHome();
    return Math.hypot(p.x - h.x, p.y - h.y) < FIRE_R * 1.9;
  }

  private visibleTarget(): boolean {
    return this.coarse && this.active;
  }

  private build(): void {
    this.stickBase = new Graphics();
    this.stickKnob = new Graphics();
    this.fireBtn = new Graphics();
    this.view.addChild(this.stickBase, this.stickKnob, this.fireBtn);
    this.view.visible = false;
    this.view.eventMode = 'none'; // pure display; canvas-level zones own hit tests
    this.drawStick();
    this.drawFire();
    this.applyVisibility();
  }

  private drawStick(): void {
    const h = this.stickHome();
    // stick base — panel backing, ring, dead-zone square (§4.13)
    this.stickBase.clear()
      .circle(h.x, h.y, STICK_R).fill({ color: PAL.panel, alpha: 0.7 })
      .circle(h.x, h.y, STICK_R).stroke({ width: 2, color: PAL.panelEdge })
      .circle(h.x, h.y, STICK_R - 8).stroke({ width: 1, color: PAL.panelEdge })
      .rect(h.x - 8, h.y - 8, 16, 16).fill({ color: PAL.void, alpha: 0.8 });
    const kx = h.x + (this.stick?.x ?? 0) * STICK_R;
    const ky = h.y + (this.stick?.y ?? 0) * STICK_R;
    // knob — ink body, accent center
    this.stickKnob.clear()
      .circle(kx, ky, 14).fill({ color: PAL.ink, alpha: 0.85 }).stroke({ width: 1, color: PAL.panelEdge })
      .rect(kx - 2, ky - 2, 4, 4).fill(PAL.accent);
  }

  private drawFire(): void {
    const h = this.fireHome();
    this.fireBtn.clear()
      .circle(h.x, h.y, FIRE_R)
      .fill({ color: this.fire ? PAL.warn : 0x8a2430, alpha: 0.85 })
      .stroke({ width: 2, color: PAL.panelEdge });
    if (!this.fireLabel) {
      this.fireLabel = new Text({ text: 'FIRE', style: { fill: PAL.ink, fontSize: 10, fontFamily: 'monospace' } });
      this.fireLabel.anchor.set(0.5);
      this.view.addChild(this.fireLabel);
    }
    this.fireLabel.x = h.x;
    this.fireLabel.y = h.y;
  }

  private applyVisibility(): void {
    const want = this.visibleTarget();
    if (want !== this.shown) {
      this.shown = want;
      this.view.visible = want;
      this.view.alpha = this.baseAlpha;
      if (this.fireLabel) this.fireLabel.visible = want;
    }
  }

  /** call each frame; re-checks the coarse-pointer media query cheaply */
  tick(): void {
    this.applyVisibility();
  }
}
