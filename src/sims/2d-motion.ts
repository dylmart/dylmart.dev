import type { Sim2D, SimView, SimPointerEvent } from './types';
import type { ParamSpec } from './registry';
import { drawArrow } from './draw';

// ----- physics constants (mirrors src/content/sims/2d-motion/source.py) -----
const AX = 0; // Dylan's request: acceleration is always aligned with the y
              // axis (the original program's a=(-3,4) diagonal is gone; only
              // the ay select varies the acceleration now).
const DT = 0.01;
const T_END = 5;
const N_END = Math.round(T_END / DT); // 500 steps; counting steps (not accumulating t) avoids float drift

const MAX_TRAIL = 2000; // defensive cap on the drawn trail polyline
const MAX_PLOT_QUEUE = 2000; // defensive cap on the drain queue (500 steps to t=5, but never unbounded)

const AIM_HIT_RADIUS_PX = 20; // pointer-down within this many px of the launch point starts drag-to-aim
const GHOST_SAMPLE_DT = 0.25; // predicted-path ghost sample spacing, in sim seconds

// Launch parameters: rendered automatically by SimCanvas2D as `.sim-params`
// selects. Defaults MUST equal the original constants (v0=(3,5), a=(-3,4)) so
// every pre-existing pinned test below still passes unchanged when no params
// are passed in.
export const params: ParamSpec[] = [
  { key: 'v0x', label: 'v₀x', values: [0, 3, 6, 9], initial: 3 },
  { key: 'v0y', label: 'v₀y', values: [2, 5, 8, 12], initial: 5 },
  { key: 'ay', label: 'aᵧ', values: [-9.8, -4, 4], initial: 4 },
];

interface Vec2 { x: number; y: number }
interface PlotPoint { x: number; y: number }

interface State {
  pos: Vec2;
  v: Vec2;
  n: number; // steps taken; t is derived as n*DT to avoid float accumulation drift
  t: number;
  done: boolean;
  trail: Vec2[];
  plotQueue: PlotPoint[];
}

function makeState(v0: Vec2): State {
  return {
    pos: { x: 0, y: 0 },
    v: { x: v0.x, y: v0.y },
    n: 0,
    t: 0,
    done: false,
    trail: [{ x: 0, y: 0 }],
    plotQueue: [],
  };
}

/**
 * Closed-form position after n fixed-size semi-implicit-Euler steps: the
 * exact discrete sum stepOnce() accumulates (NOT continuous kinematics,
 * which drifts from it by an O(dt) term). This is the single source of
 * truth for both the pinned unit test below and the predicted-path ghost
 * drawn in draw(), so the ghost can never disagree with the real trajectory
 * it's forecasting.
 */
export function closedFormPos(p0: number, v0: number, a: number, n: number, dt: number): number {
  return p0 + n * dt * v0 + (a * dt * dt * (n * (n + 1))) / 2;
}

/**
 * Pure drag-to-velocity mapping used by onPointer's drag-to-aim: a rightward
 * drag increases v0x, an upward drag (negative screen dy) increases v0y.
 */
export function aimFromDrag(drag: { dx: number; dy: number }, pxPerUnit: number): { v0x: number; v0y: number } {
  return { v0x: drag.dx / pxPerUnit, v0y: -drag.dy / pxPerUnit };
}

// Verbatim translation of the while-loop body in source.py: update velocity
// (semi-implicit Euler), then update position, then plot (t, v.y).
function stepOnce(s: State, a: Vec2): void {
  if (s.done) return;

  s.v.x += a.x * DT;
  s.v.y += a.y * DT;

  s.pos.x += s.v.x * DT;
  s.pos.y += s.v.y * DT;

  // source.py plots (t, v.y) BEFORE incrementing t, so the point paired with
  // this step's v.y is the pre-increment time, i.e. (n-1)*DT once n is bumped.
  const plotT = s.n * DT;
  s.n += 1;
  s.t = s.n * DT;

  s.trail.push({ x: s.pos.x, y: s.pos.y });
  if (s.trail.length > MAX_TRAIL) s.trail.shift();

  s.plotQueue.push({ x: plotT, y: s.v.y });
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

const factory = (p: Record<string, number>): Sim2D => {
  const a: Vec2 = { x: AX, y: p.ay ?? 4 };
  // Current launch velocity: starts from params, mutated in place by
  // drag-to-aim. Both the public reset() and the drag-end handler restart
  // the run from this same value, so re-aiming "sticks" across a Reset.
  let v0: Vec2 = { x: p.v0x ?? 3, y: p.v0y ?? 5 };
  let state = makeState(v0);

  // Live drag-to-aim gesture state (screen px), or null when not dragging.
  let drag: { current: { x: number; y: number } } | null = null;

  const sim: Sim2D = {
    dt: DT,
    plotLabel: 'v_y vs t',

    advance(dt: number) {
      if (state.done) return;
      const steps = Math.max(0, Math.round(dt / DT));
      for (let i = 0; i < steps; i++) {
        stepOnce(state, a);
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

      // Predicted trajectory ghost: sampled every GHOST_SAMPLE_DT seconds
      // from the SAME closed-form math the physics pin checks (closedFormPos),
      // so the ghost can never drift from the trail it's forecasting.
      const sampleStepN = Math.round(GHOST_SAMPLE_DT / DT);
      const ghost: Vec2[] = [];
      for (let n = 0; n <= N_END; n += sampleStepN) {
        ghost.push({
          x: closedFormPos(0, v0.x, a.x, n, DT),
          y: closedFormPos(0, v0.y, a.y, n, DT),
        });
      }
      ctx.save();
      ctx.strokeStyle = view.css('--text-dim');
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ghost.forEach((pt, i) => {
        const { px, py } = worldToPx(pt.x, pt.y, view);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();

      // Landing marker: first point where the predicted path crosses back to
      // launch height (y = 0), linearly interpolated between the two
      // bracketing ghost samples. Skipped entirely if the path never returns
      // to y = 0 within the run (e.g. the default upward-accelerating ay=4).
      for (let i = 1; i < ghost.length; i++) {
        const prev = ghost[i - 1]!, cur = ghost[i]!;
        if (prev.y > 0 && cur.y <= 0) {
          const f = prev.y / (prev.y - cur.y);
          const landX = prev.x + f * (cur.x - prev.x);
          const { px, py } = worldToPx(landX, 0, view);
          ctx.strokeStyle = view.css('--accent');
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px - 6, py - 6);
          ctx.lineTo(px, py);
          ctx.lineTo(px + 6, py - 6);
          ctx.stroke();
          break;
        }
      }

      // trail
      if (state.trail.length >= 2) {
        ctx.strokeStyle = view.css('--accent');
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        state.trail.forEach((pt, i) => {
          const { px, py } = worldToPx(pt.x, pt.y, view);
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
      const velTip = worldToPx(state.pos.x + state.v.x * 0.2, state.pos.y + state.v.y * 0.2, view);
      drawArrow(ctx, ballPx.px, ballPx.py, velTip.px, velTip.py, view.css('--neutral'), 2, 6);

      // acceleration vector, in --accent-cool, from the ball
      const accTip = worldToPx(state.pos.x + a.x * 0.3, state.pos.y + a.y * 0.3, view);
      drawArrow(ctx, ballPx.px, ballPx.py, accTip.px, accTip.py, view.css('--accent-cool'), 2, 6);

      // live aim line while a drag-to-aim gesture is in progress
      if (drag) {
        const launchPx = worldToPx(0, 0, view);
        ctx.save();
        ctx.strokeStyle = view.css('--accent-bright');
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(launchPx.px, launchPx.py);
        ctx.lineTo(drag.current.x, drag.current.y);
        ctx.stroke();
        ctx.restore();
      }

      ctx.font = '12px "Space Mono", monospace';
      ctx.fillStyle = view.css('--sim-canvas-fg-dim');
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
      state = makeState(v0);
      stateRegistry.set(sim, state);
    },

    // Drag-to-aim: pointer-down within AIM_HIT_RADIUS_PX of the launch point
    // (world origin, where every run starts) begins a drag; move live-updates
    // the aim line (truthy return -> immediate redraw even while paused); up
    // commits aimFromDrag's mapping as the new v0 and restarts the run from
    // t=0 with it.
    onPointer(ev: SimPointerEvent, view: SimView) {
      const launchPx = worldToPx(0, 0, view);
      if (ev.type === 'down') {
        const dist = Math.hypot(ev.x - launchPx.px, ev.y - launchPx.py);
        if (dist > AIM_HIT_RADIUS_PX) return;
        drag = { current: { x: ev.x, y: ev.y } };
        return true;
      }
      if (ev.type === 'move') {
        if (!drag) return;
        drag.current = { x: ev.x, y: ev.y };
        return true;
      }
      if (ev.type === 'up') {
        if (!drag) return;
        const dx = drag.current.x - launchPx.px;
        const dy = drag.current.y - launchPx.py;
        drag = null;
        const pxPerUnit = view.w / (WORLD_MAX_X - WORLD_MIN_X);
        const aim = aimFromDrag({ dx, dy }, pxPerUnit);
        v0 = { x: aim.v0x, y: aim.v0y };
        state = makeState(v0);
        stateRegistry.set(sim, state);
        return true;
      }
      if (ev.type === 'cancel') {
        // Abort the in-progress aim gesture entirely: discard the pending
        // drag without committing a new v0 or restarting the run (unlike
        // 'up', which commits). Redraw so the aim line disappears.
        if (!drag) return;
        drag = null;
        return true;
      }
    },
  };

  stateRegistry.set(sim, state);
  return sim;
};

export default factory;
