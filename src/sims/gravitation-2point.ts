import type { Sim2D, SimView } from './types';

// ----- physics constants (mirrors src/content/sims/gravitation-2point/source.py) -----
const G = 6.67e-11; // Universal Gravitation constant, N*m**2/kg**2
const M1 = 8e11; // rock1 mass, kg
const M2 = 8e2; // rock2 mass, kg
const R1 = 2.0; // rock1 radius (collision/contact radius)
const R2 = 0.8; // rock2 radius
const DT = 0.01;

// source.py: rock1.pos = (0,0,0); rock2.pos = (0,0,10). All motion stays in the
// plane spanned by rock2's initial offset and its initial velocity kick (both
// vpython y-components are always 0), so we port the vpython (x, z) plane to a
// 2D (x, y) plane here without loss: original z -> our y.
const POS1_INIT = { x: 0, y: 0 };
const POS2_INIT = { x: 0, y: 10 };

const GmM = G * M1 * M2;

// r_1to2 = rock2.pos - rock1.pos; starting_v = sqrt(G*rock1.m / r_1to2.mag),
// applied along x (perpendicular to the initial separation, which lies along y)
const R0 = Math.hypot(POS2_INIT.x - POS1_INIT.x, POS2_INIT.y - POS1_INIT.y);
const STARTING_V = Math.sqrt((G * M1) / R0);

const MAX_TRAIL = 500; // defensive cap on rock2's drawn trail (source: retain=35, but a generous cap is harmless here)
const MAX_PLOT_QUEUE = 20_000; // defensive cap on the drain queue

interface Vec2 { x: number; y: number }
interface PlotPoint { x: number; y: number }

interface State {
  pos1: Vec2;
  pos2: Vec2;
  v1: Vec2;
  v2: Vec2;
  n: number; // steps taken; t is derived as n*DT to avoid float accumulation drift
  t: number;
  done: boolean;
  trail: Vec2[]; // rock2 only has make_trail=True in source.py
  plotQueue: PlotPoint[];
}

function makeState(): State {
  return {
    pos1: { ...POS1_INIT },
    pos2: { ...POS2_INIT },
    v1: { x: 0, y: 0 },
    v2: { x: STARTING_V, y: 0 },
    n: 0,
    t: 0,
    done: false,
    trail: [{ ...POS2_INIT }],
    plotQueue: [],
  };
}

// Verbatim translation of the while-loop body in source.py:
//   r_1to2 = rock2.pos - rock1.pos            (computed ONCE per step, at the top)
//   F_1on2 = -GmM * r_1to2 / r_1to2.mag**3     (force on 2 due to 1)
//   F_2on1 = -F_1on2                           (equal & opposite -> exact momentum conservation)
//   rock1.a = F_2on1/m1 ; rock2.a = F_1on2/m2
//   v += a*dt ; pos += v*dt                    (semi-implicit/symplectic Euler)
//   if drawGraph: f1.plot(t, r_1to2.mag)        <- uses the PRE-step r_1to2 and PRE-increment t
//   if r_1to2.mag < (r1+r2): break              <- also uses the PRE-step r_1to2, never recomputed
//   t += dt
function stepOnce(s: State): void {
  if (s.done) return;

  const dx = s.pos2.x - s.pos1.x;
  const dy = s.pos2.y - s.pos1.y;
  const rMag = Math.hypot(dx, dy);

  // Guard the r->0 singularity (bodies coincide): source.py never guards this
  // (division by zero), but we must never let a NaN/Infinity reach draw(). If
  // rMag is degenerate, treat this step's gravitational force as zero rather
  // than blow up; `done` below still catches real collisions at r1+r2 first.
  const rMag3 = rMag * rMag * rMag;
  const F12x = rMag3 > 0 ? (-GmM * dx) / rMag3 : 0;
  const F12y = rMag3 > 0 ? (-GmM * dy) / rMag3 : 0;

  const a1x = -F12x / M1;
  const a1y = -F12y / M1;
  const a2x = F12x / M2;
  const a2y = F12y / M2;

  s.v1.x += a1x * DT;
  s.v1.y += a1y * DT;
  s.v2.x += a2x * DT;
  s.v2.y += a2y * DT;

  s.pos1.x += s.v1.x * DT;
  s.pos1.y += s.v1.y * DT;
  s.pos2.x += s.v2.x * DT;
  s.pos2.y += s.v2.y * DT;

  // plot(t, r_1to2.mag) uses the pre-step separation and pre-increment time
  const plotT = s.n * DT;
  s.plotQueue.push({ x: plotT, y: rMag });
  if (s.plotQueue.length > MAX_PLOT_QUEUE) s.plotQueue.shift();

  s.trail.push({ x: s.pos2.x, y: s.pos2.y });
  if (s.trail.length > MAX_TRAIL) s.trail.shift();

  s.n += 1;
  s.t = s.n * DT;

  if (rMag < R1 + R2) s.done = true;
}

// Maps a live Sim2D instance to its internal physics state, without putting
// `state` on the returned object itself (the Sim2D surface stays clean).
const stateRegistry = new WeakMap<Sim2D, State>();

/** Test hook: total momentum and mechanical energy computed from the ported state. */
export function diagnostics(sim: Sim2D): { momentum: Vec2; energy: number } {
  const s = stateRegistry.get(sim);
  if (!s) throw new Error('diagnostics: not a gravitation-2point sim instance');

  const momentum = {
    x: M1 * s.v1.x + M2 * s.v2.x,
    y: M1 * s.v1.y + M2 * s.v2.y,
  };

  const dx = s.pos2.x - s.pos1.x;
  const dy = s.pos2.y - s.pos1.y;
  const r = Math.hypot(dx, dy);

  const speed1sq = s.v1.x * s.v1.x + s.v1.y * s.v1.y;
  const speed2sq = s.v2.x * s.v2.x + s.v2.y * s.v2.y;
  const kinetic = 0.5 * M1 * speed1sq + 0.5 * M2 * speed2sq;
  const potential = r > 0 ? -GmM / r : -Infinity;

  return { momentum, energy: kinetic + potential };
}

// World is centered on the (near-stationary, since M1 >> M2) heavy body, with
// a fixed half-extent chosen as a multiple of the initial separation R0.
const WORLD_HALF_EXTENT = R0 * 1.5;

function worldToPx(x: number, y: number, view: SimView): { px: number; py: number } {
  const px = ((x + WORLD_HALF_EXTENT) / (2 * WORLD_HALF_EXTENT)) * view.w;
  const py = view.h - ((y + WORLD_HALF_EXTENT) / (2 * WORLD_HALF_EXTENT)) * view.h;
  return { px, py };
}

const factory = (_p: Record<string, number>): Sim2D => {
  let state = makeState();

  const sim: Sim2D = {
    dt: DT,
    plotLabel: 'separation |r| vs t',

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

      // rock2 trail
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

      // center-of-mass marker
      const comX = (M1 * state.pos1.x + M2 * state.pos2.x) / (M1 + M2);
      const comY = (M1 * state.pos1.y + M2 * state.pos2.y) / (M1 + M2);
      const comPx = worldToPx(comX, comY, view);
      ctx.strokeStyle = view.css('--text-dim');
      ctx.lineWidth = 1;
      const cross = 5;
      ctx.beginPath();
      ctx.moveTo(comPx.px - cross, comPx.py);
      ctx.lineTo(comPx.px + cross, comPx.py);
      ctx.moveTo(comPx.px, comPx.py - cross);
      ctx.lineTo(comPx.px, comPx.py + cross);
      ctx.stroke();

      // rock1 (heavy body)
      const rock1Px = worldToPx(state.pos1.x, state.pos1.y, view);
      ctx.fillStyle = view.css('--neutral');
      ctx.beginPath();
      ctx.arc(rock1Px.px, rock1Px.py, 10, 0, Math.PI * 2);
      ctx.fill();

      // rock2 (light body)
      const rock2Px = worldToPx(state.pos2.x, state.pos2.y, view);
      ctx.fillStyle = view.css('--accent-bright');
      ctx.beginPath();
      ctx.arc(rock2Px.px, rock2Px.py, 5, 0, Math.PI * 2);
      ctx.fill();

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
      state = makeState();
      stateRegistry.set(sim, state);
    },
  };

  stateRegistry.set(sim, state);
  return sim;
};

export default factory;
