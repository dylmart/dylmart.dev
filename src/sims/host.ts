import type { Sim2D, SimView } from './types';
import { createPlot } from './plot';

export class FixedStepper {
  private acc = 0;
  speed = 1;
  constructor(private dt: number, private step: () => void) {}
  tick(elapsed: number) {
    this.acc += elapsed * this.speed;
    let n = 0;
    while (this.acc >= this.dt && n < 120) { this.step(); this.acc -= this.dt; n++; }
    if (n === 120) this.acc = 0; // dump backlog after a hitch (tab was hidden)
  }
}

export interface HostHandles { play(): void; pause(): void; reset(): void; setSpeed(x: number): void }

export function mountSim(
  sim: Sim2D,
  canvas: HTMLCanvasElement,
  plotCanvas: HTMLCanvasElement | null,
  onStateChange: (running: boolean) => void,
): HostHandles {
  const ctx = canvas.getContext('2d')!;
  const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
  canvas.width = cssW * dpr; canvas.height = cssH * dpr;
  ctx.scale(dpr, dpr);
  const view: SimView = { w: cssW, h: cssH, css };
  const plot = plotCanvas ? createPlot(plotCanvas, { title: sim.plotLabel ?? 'plot' }) : null;

  const stepper = new FixedStepper(sim.dt, () => sim.advance(sim.dt));
  let running = false, last = 0, raf = 0;

  function frame(t: number) {
    if (!running) return;
    if (!canvas.isConnected) { running = false; cancelAnimationFrame(raf); return; }
    stepper.tick(Math.min((t - last) / 1000, 0.25));
    last = t;
    sim.draw(ctx, view);
    if (plot && sim.drainPlot) plot.pushAll(sim.drainPlot() ?? []);
    if (sim.done?.()) { running = false; onStateChange(false); return; }
    raf = requestAnimationFrame(frame);
  }
  const handles: HostHandles = {
    play() { if (running) return; running = true; last = performance.now(); onStateChange(true); raf = requestAnimationFrame(frame); },
    pause() { running = false; cancelAnimationFrame(raf); onStateChange(false); },
    reset() { handles.pause(); sim.reset(); plot?.reset(); sim.draw(ctx, view); },
    setSpeed(x: number) { stepper.speed = x; },
  };
  sim.draw(ctx, view); // first paint
  return handles;
}
