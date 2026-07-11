import type { Sim2D, SimView } from './types';

// ----- physics constants (mirrors src/content/sims/rope-oscillations-sim/source.py) -----
// Two counter-propagating Gaussian wave pulses on a rope, superposed. There is no
// PDE integration and no pinned/driven boundary in source.py: every node's height
// is a pure closed-form function of (x, t). Pulse 1 starts centered at xMin and
// travels toward +x; pulse 2 starts centered at xMax and travels toward -x.
const A1 = 5; // meters
const LAMBDA1 = 60; // meters
const K1 = (2 * Math.PI) / LAMBDA1;

const A2 = -10; // meters
const LAMBDA2 = 20; // meters
const K2 = (2 * Math.PI) / LAMBDA2;

const TENSION = 10; // newtons
const MU = 1; // kg/m
const V = Math.sqrt(TENSION / MU); // wave speed, m/s
const OMEGA1 = K1 * V;
const OMEGA2 = K2 * V;

const X_MIN = -50; // left end of rope
const X_MAX = 50; // right end of rope
const ROPE_LENGTH = X_MAX - X_MIN;
const DX = 1; // length of one segment
const N_NODES = ROPE_LENGTH / DX + 1; // arange(xMin, xMax + dx/2, dx) -> 101 nodes
const MID_INDEX = Math.floor(N_NODES / 2); // node at x=0, where source.py samples vY0

const X1 = X_MIN; // fixed reference center for pulse 1's formula
const X2 = X_MAX; // fixed reference center for pulse 2's formula

const DT = 0.01;
// source.py: `while t < ropeLength / v`. t starts at 0 and increments by dt each
// iteration, so the loop runs while n*dt < T_END; counting steps (not accumulating
// t) avoids float drift, matching the sibling ports' pattern.
const T_END = ROPE_LENGTH / V;
const N_END = Math.floor(T_END / DT) + 1;

const MAX_PLOT_QUEUE = 4_000; // defensive cap on the drain queue (N_END ~= 3163 points, never unbounded)

interface PlotPoint { x: number; y: number }

interface State {
  y: number[]; // transverse displacement of every rope node
  n: number; // steps taken; t is derived as n*DT to avoid float accumulation drift
  t: number;
  done: boolean;
  plotQueue: PlotPoint[];
}

// Verbatim translation of source.py's per-node formula:
//   yPulse1 = A1 * exp(-(k1*(x - x1) - omega1*t)**2)
//   yPulse2 = A2 * exp(-(k2*(x - x2) + omega2*t)**2)
// This is used both for the static pre-loop init (t=0) and inside the animation
// loop, so the t=0 case is bit-identical between them (matters for the plot test).
function waveY(x: number, t: number): number {
  const yPulse1 = A1 * Math.exp(-((K1 * (x - X1) - OMEGA1 * t) ** 2));
  const yPulse2 = A2 * Math.exp(-((K2 * (x - X2) + OMEGA2 * t) ** 2));
  return yPulse1 + yPulse2;
}

function makeState(): State {
  const y: number[] = new Array(N_NODES);
  for (let i = 0; i < N_NODES; i++) {
    const x = X_MIN + i * DX;
    y[i] = waveY(x, 0);
  }
  return { y, n: 0, t: 0, done: false, plotQueue: [] };
}

// Verbatim translation of the while-loop body in source.py:
//   initialVertPos = rope[totalN/2].pos.y        (reads the value from the PREVIOUS
//                                                  iteration, or the static init for
//                                                  the very first iteration)
//   for currBall in rope: currBall.pos.y = yPulse1(t) + yPulse2(t)
//   finalVertPos = rope[totalN/2].pos.y
//   vY0 = (finalVertPos - initialVertPos) / dt
//   vY0Curve.plot(t, vY0)                        (uses the PRE-increment t)
//   t += dt
function stepOnce(s: State): void {
  if (s.done) return;

  const t = s.n * DT;
  const midBefore = s.y[MID_INDEX];

  for (let i = 0; i < N_NODES; i++) {
    const x = X_MIN + i * DX;
    s.y[i] = waveY(x, t);
  }

  const midAfter = s.y[MID_INDEX];
  const vY0 = (midAfter - midBefore) / DT;

  s.plotQueue.push({ x: t, y: vY0 });
  if (s.plotQueue.length > MAX_PLOT_QUEUE) s.plotQueue.shift();

  s.n += 1;
  s.t = s.n * DT;

  if (s.n >= N_END) s.done = true;
}

// Maps a live Sim2D instance to its internal physics state, without putting
// `state` on the returned object itself (the Sim2D surface stays clean).
const stateRegistry = new WeakMap<Sim2D, State>();

/** Test hook: transverse displacement of every rope node, left end to right end. */
export function ropeState(sim: Sim2D): number[] {
  const s = stateRegistry.get(sim);
  if (!s) throw new Error('ropeState: not a rope-oscillations-sim instance');
  return s.y.slice();
}

const WORLD_MIN_X = X_MIN;
const WORLD_MAX_X = X_MAX;
const WORLD_MIN_Y = -20; // mirrors source.py's yAxis cylinder: vec(0,-20,0) + vec(0,40,0)
const WORLD_MAX_Y = 20;

function worldToPx(x: number, y: number, view: SimView): { px: number; py: number } {
  const px = ((x - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X)) * view.w;
  const py = view.h - ((y - WORLD_MIN_Y) / (WORLD_MAX_Y - WORLD_MIN_Y)) * view.h;
  return { px, py };
}

const factory = (_p: Record<string, number>): Sim2D => {
  let state = makeState();

  const sim: Sim2D = {
    dt: DT,
    plotLabel: 'v_y0 vs t',

    advance(dt: number) {
      if (state.done) return;
      const steps = Math.max(0, Math.round(dt / DT));
      for (let i = 0; i < steps; i++) {
        stepOnce(state);
        if (state.done) break;
      }
    },

    draw(ctx: CanvasRenderingContext2D, view: SimView) {
      ctx.clearRect(0, 0, view.w, view.h);

      // x-axis line (mirrors xAxis cylinder in source.py, y = 0)
      ctx.strokeStyle = view.css('--neutral');
      ctx.lineWidth = 1;
      ctx.beginPath();
      const axisLeft = worldToPx(WORLD_MIN_X, 0, view);
      const axisRight = worldToPx(WORLD_MAX_X, 0, view);
      ctx.moveTo(axisLeft.px, axisLeft.py);
      ctx.lineTo(axisRight.px, axisRight.py);
      ctx.stroke();

      // rope polyline
      ctx.strokeStyle = view.css('--accent');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < N_NODES; i++) {
        const x = X_MIN + i * DX;
        const { px, py } = worldToPx(x, state.y[i], view);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();

      // node dots
      ctx.fillStyle = view.css('--text-dim');
      for (let i = 0; i < N_NODES; i++) {
        const x = X_MIN + i * DX;
        const { px, py } = worldToPx(x, state.y[i], view);
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // the sampled node at x=0 (source.py colors this ball blue and reads v_y0 here)
      const midX = X_MIN + MID_INDEX * DX;
      const midPx = worldToPx(midX, state.y[MID_INDEX], view);
      ctx.fillStyle = view.css('--accent-bright');
      ctx.beginPath();
      ctx.arc(midPx.px, midPx.py, 4, 0, Math.PI * 2);
      ctx.fill();

      // end markers (the two ends of the rope)
      ctx.fillStyle = view.css('--neutral');
      const leftPx = worldToPx(X_MIN, state.y[0], view);
      const rightPx = worldToPx(X_MAX, state.y[N_NODES - 1], view);
      ctx.beginPath();
      ctx.arc(leftPx.px, leftPx.py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightPx.px, rightPx.py, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '12px "Space Mono", monospace';
      ctx.fillStyle = view.css('--text-dim');
      ctx.fillText(`t = ${state.t.toFixed(2)} s`, 10, 18);
    },

    done() {
      return state.done;
    },

    drainPlot() {
      if (state.plotQueue.length === 0) return [];
      return state.plotQueue.splice(0, state.plotQueue.length);
    },

    reset() {
      state = makeState();
      stateRegistry.set(sim, state);
    },
  };

  stateRegistry.set(sim, state);
  return sim;
};

export default factory;
