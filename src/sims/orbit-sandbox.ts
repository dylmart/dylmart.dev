// Built native for dylmart.dev (FunProjects)
import type { Sim2D, SimView, SimPointerEvent } from './types';
import { drawArrow } from './draw';

// ----- physics constants -----
const G = 50; // sim-units gravitational constant
const DT = 0.002; // physics step, s
const SUN = { x: 0, y: 0, m: 200, r: 1.4 }; // fixed central star
// PROBE_M = 0.001: the probe is massless-ish. Its own mass never enters
// accelOn (a body's acceleration under gravity doesn't depend on its own
// mass), and it's too small to be a meaningful source for anything else, so
// the probe is simply never included as a gravitational source.
const WORLD = 40; // world spans [-20, 20] square, centered

const PLANET_M = 20;
const PLANET_R = 0.7;
const MAX_PLANETS = 8;

const MAX_TRAIL = 600; // defensive cap on the probe's drawn trail

const DRAG_HIT_RADIUS_PX = 25; // pointer-down within this many px of the probe starts a drag
const FLING_SCALE = 3; // release velocity = dragVector_world * FLING_SCALE

interface Vec2 { x: number; y: number }
interface GravSource { x: number; y: number; m: number }
interface Body extends GravSource { vx: number; vy: number; r: number }
interface Probe { x: number; y: number; vx: number; vy: number; alive: boolean }

interface State {
  probe: Probe;
  bodies: Body[];
  trail: Vec2[];
}

function makeProbe(): Probe {
  // circular orbit at r=12: v = sqrt(G*SUN.m/r), tangential (screen: straight up)
  const r = 12;
  const v = Math.sqrt((G * SUN.m) / r);
  return { x: r, y: 0, vx: 0, vy: v, alive: true };
}

function makeState(): State {
  const probe = makeProbe();
  return { probe, bodies: [], trail: [{ x: probe.x, y: probe.y }] };
}

/**
 * Pure Newtonian acceleration on a point from a list of gravitational
 * sources: a = Σ G·m_i·(r_i - p)/|r_i - p|³, with a softening guard so a
 * source that (nearly) coincides with p never produces a divide-by-zero or
 * blow-up: if |r|² < 1e-6, treat it as 1e-6.
 */
export function accelOn(p: Vec2, sources: GravSource[]): Vec2 {
  let ax = 0, ay = 0;
  for (const s of sources) {
    const dx = s.x - p.x;
    const dy = s.y - p.y;
    let r2 = dx * dx + dy * dy;
    if (r2 < 1e-6) r2 = 1e-6;
    const invR3 = 1 / (r2 * Math.sqrt(r2));
    ax += G * s.m * dx * invR3;
    ay += G * s.m * dy * invR3;
  }
  return { x: ax, y: ay };
}

/**
 * Pure drag-to-fling mapping: a rightward drag flings the probe in +x, an
 * upward drag (negative screen dy) flings it in +y (screen-up = +y world),
 * same sign convention as 2d-motion's aimFromDrag. The release velocity is
 * the drag vector (converted to world units) scaled by FLING_SCALE.
 */
export function flingFromDrag(drag: { dx: number; dy: number }, pxPerUnit: number): Vec2 {
  return { x: (drag.dx / pxPerUnit) * FLING_SCALE, y: (-drag.dy / pxPerUnit) * FLING_SCALE };
}

// One n-body step, semi-implicit Euler (v += a*dt, then p += v*dt), same
// order as 2d-motion. All accelerations are computed from the PRE-step
// positions first (order-independent), then everything is integrated:
//   - planets feel the sun and every OTHER planet, never the probe.
//   - the probe feels the sun and every planet (it has ~zero mass, so it
//     never perturbs anything back).
// After integrating, the probe is collision-checked against the sun and
// every planet; a hit freezes it (alive=false) but never stops the planets.
function stepOnce(s: State): void {
  const bodyAccels = s.bodies.map((b, i) =>
    accelOn(b, [SUN, ...s.bodies.filter((_, j) => j !== i)]),
  );
  const probeAccel = s.probe.alive ? accelOn(s.probe, [SUN, ...s.bodies]) : null;

  s.bodies.forEach((b, i) => {
    const a = bodyAccels[i]!;
    b.vx += a.x * DT;
    b.vy += a.y * DT;
    b.x += b.vx * DT;
    b.y += b.vy * DT;
  });

  if (s.probe.alive && probeAccel) {
    s.probe.vx += probeAccel.x * DT;
    s.probe.vy += probeAccel.y * DT;
    s.probe.x += s.probe.vx * DT;
    s.probe.y += s.probe.vy * DT;

    const sources: Array<{ x: number; y: number; r: number }> = [SUN, ...s.bodies];
    for (const src of sources) {
      const dist = Math.hypot(s.probe.x - src.x, s.probe.y - src.y);
      if (dist < src.r) { s.probe.alive = false; break; }
    }

    s.trail.push({ x: s.probe.x, y: s.probe.y });
    if (s.trail.length > MAX_TRAIL) s.trail.shift();
  }
}

// Maps a live Sim2D instance to its internal physics state, without putting
// `state` on the returned object itself (the Sim2D surface stays clean).
const stateRegistry = new WeakMap<Sim2D, State>();

/** Test hook: exposes a snapshot of the internal physics state of a sim built by the default factory. */
export function orbitState(sim: Sim2D): { probe: Probe; bodies: Body[] } {
  const s = stateRegistry.get(sim);
  if (!s) throw new Error('orbitState: not an orbit-sandbox sim instance');
  return {
    probe: { ...s.probe },
    bodies: s.bodies.map((b) => ({ ...b })),
  };
}

const WORLD_HALF = WORLD / 2;

function worldToPx(x: number, y: number, view: SimView): { px: number; py: number } {
  const px = ((x + WORLD_HALF) / WORLD) * view.w;
  const py = view.h - ((y + WORLD_HALF) / WORLD) * view.h;
  return { px, py };
}

function pxToWorld(px: number, py: number, view: SimView): Vec2 {
  const x = (px / view.w) * WORLD - WORLD_HALF;
  const y = ((view.h - py) / view.h) * WORLD - WORLD_HALF;
  return { x, y };
}

const factory = (_p: Record<string, number>): Sim2D => {
  let state = makeState();

  // Live drag-to-fling gesture state (screen px), or null when not dragging.
  let drag: { current: { x: number; y: number } } | null = null;

  const sim: Sim2D = {
    dt: DT,

    advance(dt: number) {
      const steps = Math.max(0, Math.round(dt / DT));
      for (let i = 0; i < steps; i++) stepOnce(state);
    },

    draw(ctx: CanvasRenderingContext2D, view: SimView) {
      ctx.clearRect(0, 0, view.w, view.h);

      // probe trail
      if (state.trail.length >= 2) {
        ctx.strokeStyle = view.css('--text-dim');
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        state.trail.forEach((pt, i) => {
          const { px, py } = worldToPx(pt.x, pt.y, view);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        ctx.stroke();
      }

      // sun
      const sunPx = worldToPx(SUN.x, SUN.y, view);
      ctx.fillStyle = view.css('--accent');
      ctx.beginPath();
      ctx.arc(sunPx.px, sunPx.py, 14, 0, Math.PI * 2);
      ctx.fill();

      // planets
      ctx.fillStyle = view.css('--neutral');
      state.bodies.forEach((b) => {
        const { px, py } = worldToPx(b.x, b.y, view);
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // probe (or crash marker if it collided)
      const probePx = worldToPx(state.probe.x, state.probe.y, view);
      if (state.probe.alive) {
        ctx.fillStyle = view.css('--accent-cool');
        ctx.beginPath();
        ctx.arc(probePx.px, probePx.py, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = view.css('--accent-bright');
        ctx.lineWidth = 2;
        const cross = 7;
        ctx.beginPath();
        ctx.moveTo(probePx.px - cross, probePx.py - cross);
        ctx.lineTo(probePx.px + cross, probePx.py + cross);
        ctx.moveTo(probePx.px + cross, probePx.py - cross);
        ctx.lineTo(probePx.px - cross, probePx.py + cross);
        ctx.stroke();
      }

      // live aim line while a drag-to-fling gesture is in progress
      if (drag) {
        drawArrow(ctx, probePx.px, probePx.py, drag.current.x, drag.current.y, view.css('--accent-cool'), 2, 6);
      }

      ctx.font = '12px "Space Mono", monospace';
      ctx.fillStyle = view.css('--text-dim');
      ctx.fillText(`planets: ${state.bodies.length}`, 10, 18);
    },

    reset() {
      state = makeState();
      stateRegistry.set(sim, state);
    },

    // down within DRAG_HIT_RADIUS_PX of the probe starts a drag-to-fling
    // gesture; down anywhere else drops a planet at the pointer's world
    // position (capped at MAX_PLANETS, oldest evicted first). move
    // live-updates the aim line. up commits flingFromDrag's mapping as the
    // probe's new velocity. cancel aborts the drag without flinging.
    onPointer(ev: SimPointerEvent, view: SimView) {
      if (ev.type === 'down') {
        const probePx = worldToPx(state.probe.x, state.probe.y, view);
        const dist = Math.hypot(ev.x - probePx.px, ev.y - probePx.py);
        if (dist <= DRAG_HIT_RADIUS_PX) {
          drag = { current: { x: ev.x, y: ev.y } };
          return true;
        }
        const world = pxToWorld(ev.x, ev.y, view);
        state.bodies.push({ x: world.x, y: world.y, vx: 0, vy: 0, m: PLANET_M, r: PLANET_R });
        if (state.bodies.length > MAX_PLANETS) state.bodies.shift();
        return true;
      }
      if (ev.type === 'move') {
        if (!drag) return;
        drag.current = { x: ev.x, y: ev.y };
        return true;
      }
      if (ev.type === 'up') {
        if (!drag) return;
        const probePx = worldToPx(state.probe.x, state.probe.y, view);
        const dx = drag.current.x - probePx.px;
        const dy = drag.current.y - probePx.py;
        drag = null;
        const pxPerUnit = view.w / WORLD;
        const v = flingFromDrag({ dx, dy }, pxPerUnit);
        state.probe.vx = v.x;
        state.probe.vy = v.y;
        return true;
      }
      if (ev.type === 'cancel') {
        // Abort the in-progress fling gesture entirely: discard the pending
        // drag without touching the probe's velocity (unlike 'up', which
        // commits). Redraw so the aim line disappears.
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
