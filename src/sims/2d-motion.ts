import type { Sim2D, SimView } from './types';

// ----- physics constants (mirrors src/content/sims/2d-motion/source.py) -----
const V0 = { x: 3, y: 5 };
const A = { x: -3, y: 4 };
const DT = 0.01;
const T_END = 5;
const N_END = Math.round(T_END / DT); // 500 steps; counting steps (not accumulating t) avoids float drift

const MAX_TRAIL = 2000; // defensive cap on the drawn trail polyline
const MAX_PLOT_QUEUE = 2000; // defensive cap on the drain queue (500 steps to t=5, but never unbounded)

interface PlotPoint { x: number; y: number }

interface State {
  pos: { x: number; y: number };
  v: { x: number; y: number };
  n: number; // steps taken; t is derived as n*DT to avoid float accumulation drift
  t: number;
  done: boolean;
  trail: Array<{ x: number; y: number }>;
  plotQueue: PlotPoint[];
}

function makeState(): State {
  return {
    pos: { x: 0, y: 0 },
    v: { x: V0.x, y: V0.y },
    n: 0,
    t: 0,
    done: false,
    trail: [{ x: 0, y: 0 }],
    plotQueue: [],
  };
}

// Verbatim translation of the while-loop body in source.py: update velocity
// (semi-implicit Euler), then update position, then plot (t, v.y).
function stepOnce(s: State): void {
  if (s.done) return;

  s.v.x += A.x * DT;
  s.v.y += A.y * DT;

  s.pos.x += s.v.x * DT;
  s.pos.y += s.v.y * DT;

  s.n += 1;
  s.t = s.n * DT;

  s.trail.push({ x: s.pos.x, y: s.pos.y });
  if (s.trail.length > MAX_TRAIL) s.trail.shift();

  s.plotQueue.push({ x: s.t, y: s.v.y });
  if (s.plotQueue.length > MAX_PLOT_QUEUE) s.plotQueue.shift();

  if (s.n >= N_END) s.done = true;
}

// Maps a live Sim2D instance to its internal physics state, without putting
// `state` on the returned object itself (the Sim2D surface stays clean).
const stateRegistry = new WeakMap<Sim2D, State>();

/** Test hook: exposes the internal physics state of a sim built by the default factory. */
export function stateOf(sim: Sim2D): { pos: { x: number; y: number }; t: number } {
  const s = stateRegistry.get(sim);
  if (!s) throw new Error('stateOf: not a 2d-motion sim instance');
  return { pos: { x: s.pos.x, y: s.pos.y }, t: s.t };
}

const WORLD_MIN_X = -5;
const WORLD_MAX_X = 15;
const WORLD_MIN_Y = -5;
const WORLD_MAX_Y = 15;

function worldToPx(x: number, y: number, view: SimView): { px: number; py: number } {
  const px = ((x - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X)) * view.w;
  const py = view.h - ((y - WORLD_MIN_Y) / (WORLD_MAX_Y - WORLD_MIN_Y)) * view.h;
  return { px, py };
}

const factory = (_p: Record<string, number>): Sim2D => {
  let state = makeState();

  const sim: Sim2D = {
    dt: DT,
    plotLabel: 'v_y vs t',

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

      // x-axis line (mirrors x_axis cylinder in source.py, y = 0)
      ctx.strokeStyle = view.css('--neutral');
      ctx.lineWidth = 1;
      ctx.beginPath();
      const axisLeft = worldToPx(WORLD_MIN_X, 0, view);
      const axisRight = worldToPx(WORLD_MAX_X, 0, view);
      ctx.moveTo(axisLeft.px, axisLeft.py);
      ctx.lineTo(axisRight.px, axisRight.py);
      ctx.stroke();

      // trail
      if (state.trail.length >= 2) {
        ctx.strokeStyle = view.css('--accent');
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        state.trail.forEach((p, i) => {
          const { px, py } = worldToPx(p.x, p.y, view);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        ctx.stroke();
      }

      // ball
      const ballPx = worldToPx(state.pos.x, state.pos.y, view);
      ctx.fillStyle = view.css('--accent-bright');
      ctx.beginPath();
      ctx.arc(ballPx.px, ballPx.py, 7, 0, Math.PI * 2);
      ctx.fill();

      // velocity arrow, in --neutral
      const tipWorld = { x: state.pos.x + state.v.x * 0.2, y: state.pos.y + state.v.y * 0.2 };
      const tipPx = worldToPx(tipWorld.x, tipWorld.y, view);
      ctx.strokeStyle = view.css('--neutral');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ballPx.px, ballPx.py);
      ctx.lineTo(tipPx.px, tipPx.py);
      ctx.stroke();
      const angle = Math.atan2(tipPx.py - ballPx.py, tipPx.px - ballPx.px);
      const headLen = 6;
      ctx.beginPath();
      ctx.moveTo(tipPx.px, tipPx.py);
      ctx.lineTo(tipPx.px - headLen * Math.cos(angle - Math.PI / 6), tipPx.py - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(tipPx.px, tipPx.py);
      ctx.lineTo(tipPx.px - headLen * Math.cos(angle + Math.PI / 6), tipPx.py - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();

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
