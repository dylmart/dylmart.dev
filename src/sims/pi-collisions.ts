import type { Sim2D, SimView } from './types';
import type { ParamSpec } from './registry';

// ----- physics constants (mirrors src/content/sims/pi-collisions/source.py) -----
const M1 = 1;
const V1_INIT = 0;
const V2_INIT = -10;
const X1_INIT = 10;
const X2_INIT = 15;
const CONTACT_DIST = 1; // (block2.width + block1.width) / 2, both blocks are size 1
const WALL_TRIGGER = 0.5; // block1.height / 2
const DT = 1e-6; // physics step, seconds of sim time (verbatim source.py dt)

// visual pacing only (does not affect physics fidelity): how many raw DT
// physics steps to run per host advance() call, scaled by the wall-seconds
// dt the host passes in (which is always sim.dt, a fixed constant).
const HOST_DT = 1 / 60;
const VISUAL_STEPS_PER_HOST_DT = 2000; // tuned so n=2 (m2=10,000) is visibly smooth
const DT_VISUAL = HOST_DT / VISUAL_STEPS_PER_HOST_DT;

const MAX_PLOT_QUEUE = 4000; // defensive cap; source runs at most a few thousand collisions for n<=3

interface PlotPoint { x: number; y: number }

interface State {
  x1: number;
  x2: number;
  v1: number;
  v2: number;
  m2: number;
  collisions: number;
  done: boolean;
  plotQueue: PlotPoint[];
}

function isDone(v1: number, v2: number): boolean {
  return v1 > 0 && v1 < v2;
}

function makeState(m2: number): State {
  return {
    x1: X1_INIT,
    x2: X2_INIT,
    v1: V1_INIT,
    v2: V2_INIT,
    m2,
    collisions: 0,
    done: isDone(V1_INIT, V2_INIT),
    plotQueue: [],
  };
}

function pushPlotPoint(s: State, x: number, y: number): void {
  s.plotQueue.push({ x, y });
  if (s.plotQueue.length > MAX_PLOT_QUEUE) s.plotQueue.shift();
}

// Verbatim translation of the while-loop body in source.py: position update,
// mass-weighted overlap correction, elastic block-block collision, then wall
// bounce (in that order — a single step can trigger both, exactly as the
// original counts both toward num_collisions using the same pre-step
// velocities for the graph point).
function stepOnce(s: State): { collided: boolean } {
  if (s.done) return { collided: false };

  if (s.v1 !== 0) s.x1 += s.v1 * DT;
  if (s.v2 !== 0) s.x2 += s.v2 * DT;

  const b1vx = s.v1;
  const b2vx = s.v2;

  const overlap = CONTACT_DIST - Math.abs(s.x1 - s.x2);
  if (overlap > 0) {
    s.x1 -= overlap * (s.m2 / (M1 + s.m2));
    s.x2 += overlap * (M1 / (M1 + s.m2));
  }

  let collided = false;

  if (Math.abs(s.x1 - s.x2) <= CONTACT_DIST) {
    s.v1 = ((M1 - s.m2) / (M1 + s.m2)) * b1vx + ((2 * s.m2) / (M1 + s.m2)) * b2vx;
    s.v2 = ((s.m2 - M1) / (M1 + s.m2)) * b2vx + ((2 * M1) / (M1 + s.m2)) * b1vx;
    if (s.v1 !== 0) pushPlotPoint(s, Math.sqrt(s.m2) * b2vx, Math.sqrt(M1) * b1vx);
    s.collisions++;
    collided = true;
  }

  if (s.x1 <= WALL_TRIGGER) {
    s.v1 = -s.v1;
    if (s.v1 !== 0) pushPlotPoint(s, Math.sqrt(s.m2) * b2vx, Math.sqrt(M1) * b1vx);
    s.collisions++;
    collided = true;
  }

  s.done = isDone(s.v1, s.v2);
  return { collided };
}

export function runToCompletion(m2: number): number {
  const s = makeState(m2);
  while (!s.done) stepOnce(s);
  return s.collisions;
}

export const params: ParamSpec[] = [
  { key: 'massExp', label: 'm2 = 100^n, n =', values: [1, 2, 3, 4], initial: 2 },
];

function worldToPx(x: number, worldMin: number, worldMax: number, w: number): number {
  return ((x - worldMin) / (worldMax - worldMin)) * w;
}

const WORLD_MIN = -3;
const WORLD_MAX = 25;

const factory = (p: Record<string, number>): Sim2D => {
  const massExp = p.massExp ?? 2;
  const m2 = Math.pow(100, massExp);
  const state = makeState(m2);

  const sim = {
    dt: HOST_DT,
    // Display deviation from source.py (Dylan's request): the original plots raw
    // momenta (m2·v2, m1·v1), which is an ellipse in phase space. Plotting
    // (√m2·v2, √m1·v1) instead makes energy conservation the literal circle
    // equation, and plotEqualAspect renders it without stretching. Collision
    // physics and plot timing are unchanged.
    plotLabel: 'energy circle (√m2·v2, √m1·v1)',
    plotEqualAspect: true,
    state,

    advance(dt: number) {
      if (state.done) return;
      const steps = Math.max(0, Math.round(dt / DT_VISUAL));
      for (let i = 0; i < steps; i++) {
        stepOnce(state);
        if (state.done) break;
      }
    },

    draw(ctx: CanvasRenderingContext2D, view: SimView) {
      ctx.clearRect(0, 0, view.w, view.h);

      const floorY = view.h - 46;
      // Physics: block1 wall-bounces when its center hits x = 0.5, i.e. its left
      // face (half-width 0.5) touches x = 0 — so the wall's right face sits at 0.
      const wallLeftPx = worldToPx(-1.2, WORLD_MIN, WORLD_MAX, view.w);
      const wallRightPx = worldToPx(0, WORLD_MIN, WORLD_MAX, view.w);
      const wallTopY = Math.max(0, floorY - 130);

      ctx.strokeStyle = view.css('--neutral');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(view.w, floorY);
      ctx.stroke();

      ctx.fillStyle = view.css('--neutral');
      ctx.fillRect(wallLeftPx, wallTopY, Math.max(2, wallRightPx - wallLeftPx), floorY - wallTopY);

      // Both blocks are 1 world unit wide (CONTACT_DIST = 1 between centers), so
      // draw them at exactly 1 unit in pixels — their faces then touch precisely
      // when the physics registers a collision, instead of colliding across a
      // visible gap (a fixed 26px size didn't match the 32px world unit).
      const blockSize = view.w / (WORLD_MAX - WORLD_MIN);
      const block1Px = worldToPx(state.x1, WORLD_MIN, WORLD_MAX, view.w);
      const block2Px = worldToPx(state.x2, WORLD_MIN, WORLD_MAX, view.w);

      // block2: heavy, neutral color
      ctx.fillStyle = view.css('--neutral');
      ctx.fillRect(block2Px - blockSize / 2, floorY - blockSize, blockSize, blockSize);

      // block1: light, accent ("red" in the original) color
      ctx.fillStyle = view.css('--accent-bright');
      ctx.fillRect(block1Px - blockSize / 2, floorY - blockSize, blockSize, blockSize);

      ctx.font = '12px "Space Mono", monospace';
      ctx.fillStyle = view.css('--sim-canvas-fg');
      ctx.fillText(`collisions: ${state.collisions}`, 10, 18);
      ctx.fillStyle = view.css('--text-dim');
      ctx.fillText(`m1 = 1, m2 = ${state.m2.toLocaleString()}`, 10, 34);
    },

    done() {
      return state.done;
    },

    drainPlot() {
      if (state.plotQueue.length === 0) return [];
      return state.plotQueue.splice(0, state.plotQueue.length);
    },

    reset() {
      Object.assign(state, makeState(m2));
    },
  };

  return sim;
};

export default factory;
