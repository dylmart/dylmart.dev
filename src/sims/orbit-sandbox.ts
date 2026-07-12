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
const PLANET_TRAIL_MAX = 200; // per-planet trail cap

const FADE_T = 3; // seconds a dead body's X marker + trail take to fade out

const DRAG_HIT_RADIUS_PX = 25; // pointer-down within this many px of the probe starts a drag
const FLING_SCALE = 3; // release velocity = dragVector_world * FLING_SCALE

interface Vec2 { x: number; y: number }
interface GravSource { x: number; y: number; m: number }
interface Body extends GravSource {
  vx: number; vy: number; r: number;
  alive: boolean;
  deadAt: number | null;
  trail: Vec2[];
}
interface Probe { x: number; y: number; vx: number; vy: number; alive: boolean; deadAt: number | null }

interface State {
  probe: Probe;
  bodies: Body[];
  trail: Vec2[];
  t: number;
}

function makeProbe(): Probe {
  // circular orbit at r=12: v = sqrt(G*SUN.m/r), tangential (screen: straight up)
  const r = 12;
  const v = Math.sqrt((G * SUN.m) / r);
  return { x: r, y: 0, vx: 0, vy: v, alive: true, deadAt: null };
}

function makeState(): State {
  const probe = makeProbe();
  return { probe, bodies: [], trail: [{ x: probe.x, y: probe.y }], t: 0 };
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
//   - planets feel the sun and every OTHER ALIVE planet, never the probe.
//   - the probe feels the sun and every ALIVE planet (it has ~zero mass, so
//     it never perturbs anything back).
// Dead bodies are frozen in place (skipped by integration) and are never
// gravity sources.
//
// After integrating, collisions are checked (only pairs where both sides are
// alive): probe-vs-sun/planet kills the probe AND the planet it hit (Dylan
// request 2 — every collision behaves the same); planet-vs-sun kills the
// planet (request 3); planet-vs-planet kills both. Death sets alive=false
// and deadAt=t; a dead body's X marker and trail fade over FADE_T seconds
// (see draw()), after which dead PLANETS are purged from `bodies` entirely.
// The probe is never purged — it just stops being drawn once fully faded,
// and reset() brings it back.
function stepOnce(s: State): void {
  s.t += DT;

  const aliveBodies = s.bodies.filter((b) => b.alive);
  const bodyAccels = s.bodies.map((b) => (b.alive ? accelOn(b, [SUN, ...aliveBodies.filter((o) => o !== b)]) : null));
  const probeAccel = s.probe.alive ? accelOn(s.probe, [SUN, ...aliveBodies]) : null;

  s.bodies.forEach((b, i) => {
    if (!b.alive) return;
    const a = bodyAccels[i]!;
    b.vx += a.x * DT;
    b.vy += a.y * DT;
    b.x += b.vx * DT;
    b.y += b.vy * DT;
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > PLANET_TRAIL_MAX) b.trail.shift();
  });

  if (s.probe.alive && probeAccel) {
    s.probe.vx += probeAccel.x * DT;
    s.probe.vy += probeAccel.y * DT;
    s.probe.x += s.probe.vx * DT;
    s.probe.y += s.probe.vy * DT;

    s.trail.push({ x: s.probe.x, y: s.probe.y });
    if (s.trail.length > MAX_TRAIL) s.trail.shift();
  }

  // probe vs. sun / planets: a hit kills the probe AND the planet it hit.
  if (s.probe.alive) {
    const distSun = Math.hypot(s.probe.x - SUN.x, s.probe.y - SUN.y);
    if (distSun < SUN.r) {
      s.probe.alive = false;
      s.probe.deadAt = s.t;
    } else {
      for (const b of s.bodies) {
        if (!b.alive) continue;
        const dist = Math.hypot(s.probe.x - b.x, s.probe.y - b.y);
        if (dist < b.r) {
          s.probe.alive = false;
          s.probe.deadAt = s.t;
          b.alive = false;
          b.deadAt = s.t;
          break;
        }
      }
    }
  }

  // planet vs. sun
  for (const b of s.bodies) {
    if (!b.alive) continue;
    const dist = Math.hypot(b.x - SUN.x, b.y - SUN.y);
    if (dist < SUN.r + b.r) {
      b.alive = false;
      b.deadAt = s.t;
    }
  }

  // planet vs. planet
  for (let i = 0; i < s.bodies.length; i++) {
    const bi = s.bodies[i]!;
    if (!bi.alive) continue;
    for (let j = i + 1; j < s.bodies.length; j++) {
      const bj = s.bodies[j]!;
      if (!bj.alive) continue;
      const dist = Math.hypot(bi.x - bj.x, bi.y - bj.y);
      if (dist < bi.r + bj.r) {
        bi.alive = false;
        bi.deadAt = s.t;
        bj.alive = false;
        bj.deadAt = s.t;
      }
    }
  }

  // Purge fully-faded dead planets, freeing their MAX_PLANETS slot.
  s.bodies = s.bodies.filter((b) => b.alive || s.t - b.deadAt! < FADE_T);
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
    bodies: s.bodies.map((b) => ({ ...b, trail: b.trail.map((p) => ({ ...p })) })),
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

  // Live pointer gesture (screen px), or null when idle:
  //  - 'probe': drag started on the probe; release re-flings it.
  //  - 'planet': drag started on empty space (Dylan's request: planets used
  //    to spawn at rest and just fall into the sun); release LAUNCHES a new
  //    planet from the press point with the drag vector as velocity. A plain
  //    click (drag under CLICK_EPS_PX) still drops one at rest.
  type Gesture =
    | { kind: 'probe'; current: { x: number; y: number } }
    | { kind: 'planet'; origin: Vec2; originPx: { x: number; y: number }; current: { x: number; y: number } };
  let gesture: Gesture | null = null;
  const CLICK_EPS_PX = 6;

  const sim: Sim2D = {
    dt: DT,

    advance(dt: number) {
      const steps = Math.max(0, Math.round(dt / DT));
      for (let i = 0; i < steps; i++) stepOnce(state);
    },

    draw(ctx: CanvasRenderingContext2D, view: SimView) {
      ctx.clearRect(0, 0, view.w, view.h);

      const trailColor = view.css('--text-dim');
      const planetColor = view.css('--accent-cool');
      const crashColor = view.css('--accent-bright');

      // 1 while alive; ramps down to 0 over FADE_T seconds after deadAt, then
      // stays clamped at 0 (never negative, never NaN even if deadAt is in
      // the future for some reason).
      const fadeAlpha = (deadAt: number | null): number => {
        if (deadAt === null) return 1;
        const frac = 1 - (state.t - deadAt) / FADE_T;
        return Math.max(0, Math.min(1, frac));
      };

      const drawTrail = (trail: Vec2[]) => {
        if (trail.length < 2) return;
        ctx.strokeStyle = trailColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        trail.forEach((pt, i) => {
          const { px, py } = worldToPx(pt.x, pt.y, view);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        ctx.stroke();
      };

      const drawCross = (px: number, py: number) => {
        ctx.strokeStyle = crashColor;
        ctx.lineWidth = 2;
        const cross = 7;
        ctx.beginPath();
        ctx.moveTo(px - cross, py - cross);
        ctx.lineTo(px + cross, py + cross);
        ctx.moveTo(px + cross, py - cross);
        ctx.lineTo(px - cross, py + cross);
        ctx.stroke();
      };

      // probe trail (fades with the probe once it's dead)
      const probeTrailAlpha = fadeAlpha(state.probe.deadAt);
      if (probeTrailAlpha > 0) {
        ctx.globalAlpha = probeTrailAlpha;
        drawTrail(state.trail);
        ctx.globalAlpha = 1;
      }

      // sun
      const sunPx = worldToPx(SUN.x, SUN.y, view);
      ctx.fillStyle = view.css('--accent');
      ctx.beginPath();
      ctx.arc(sunPx.px, sunPx.py, 14, 0, Math.PI * 2);
      ctx.fill();

      // planets: trail + body (alive) or fading X (dead)
      state.bodies.forEach((b) => {
        const alpha = fadeAlpha(b.deadAt);
        if (alpha <= 0) return;
        ctx.globalAlpha = alpha;
        drawTrail(b.trail);
        const { px, py } = worldToPx(b.x, b.y, view);
        if (b.alive) {
          ctx.fillStyle = planetColor;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawCross(px, py);
        }
        ctx.globalAlpha = 1;
      });

      // probe (or a fading crash marker if it collided)
      const probePx = worldToPx(state.probe.x, state.probe.y, view);
      const probeAlpha = fadeAlpha(state.probe.deadAt);
      if (probeAlpha > 0) {
        ctx.globalAlpha = probeAlpha;
        if (state.probe.alive) {
          ctx.fillStyle = planetColor;
          ctx.beginPath();
          ctx.arc(probePx.px, probePx.py, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawCross(probePx.px, probePx.py);
        }
        ctx.globalAlpha = 1;
      }

      // live aim feedback while a gesture is in progress
      if (gesture?.kind === 'probe') {
        drawArrow(ctx, probePx.px, probePx.py, gesture.current.x, gesture.current.y, view.css('--accent-cool'), 2, 6);
      } else if (gesture?.kind === 'planet') {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = planetColor;
        ctx.beginPath();
        ctx.arc(gesture.originPx.x, gesture.originPx.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        drawArrow(ctx, gesture.originPx.x, gesture.originPx.y, gesture.current.x, gesture.current.y, view.css('--accent-cool'), 2, 6);
      }

      ctx.font = '12px "Space Mono", monospace';
      ctx.fillStyle = view.css('--sim-canvas-fg-dim');
      ctx.fillText(`planets: ${state.bodies.length}`, 10, 18);
    },

    reset() {
      state = makeState();
      stateRegistry.set(sim, state);
    },

    // down within DRAG_HIT_RADIUS_PX of the probe starts a probe re-fling;
    // down anywhere else starts a planet-launch drag at the press point
    // (capped at MAX_PLANETS, oldest evicted first). move live-updates the
    // aim feedback. up commits flingFromDrag's mapping as the probe's or the
    // new planet's velocity. cancel aborts either gesture with no effect.
    onPointer(ev: SimPointerEvent, view: SimView) {
      if (ev.type === 'down') {
        const probePx = worldToPx(state.probe.x, state.probe.y, view);
        const dist = Math.hypot(ev.x - probePx.px, ev.y - probePx.py);
        if (state.probe.alive && dist <= DRAG_HIT_RADIUS_PX) {
          gesture = { kind: 'probe', current: { x: ev.x, y: ev.y } };
          return true;
        }
        const world = pxToWorld(ev.x, ev.y, view);
        gesture = { kind: 'planet', origin: world, originPx: { x: ev.x, y: ev.y }, current: { x: ev.x, y: ev.y } };
        return true;
      }
      if (ev.type === 'move') {
        if (!gesture) return;
        gesture.current = { x: ev.x, y: ev.y };
        return true;
      }
      if (ev.type === 'up') {
        if (!gesture) return;
        const g = gesture;
        gesture = null;
        const pxPerUnit = view.w / WORLD;
        if (g.kind === 'probe') {
          // Probe crashed mid-drag: abort instead of flinging a corpse.
          if (!state.probe.alive) return true;
          const probePx = worldToPx(state.probe.x, state.probe.y, view);
          const v = flingFromDrag({ dx: g.current.x - probePx.px, dy: g.current.y - probePx.py }, pxPerUnit);
          state.probe.vx = v.x;
          state.probe.vy = v.y;
          return true;
        }
        // planet launch: drag vector -> initial velocity (same mapping as the
        // probe fling); a near-click spawns it at rest.
        const dx = g.current.x - g.originPx.x;
        const dy = g.current.y - g.originPx.y;
        const v = Math.hypot(dx, dy) < CLICK_EPS_PX ? { x: 0, y: 0 } : flingFromDrag({ dx, dy }, pxPerUnit);
        state.bodies.push({
          x: g.origin.x, y: g.origin.y, vx: v.x, vy: v.y, m: PLANET_M, r: PLANET_R,
          alive: true, deadAt: null, trail: [{ x: g.origin.x, y: g.origin.y }],
        });
        if (state.bodies.length > MAX_PLANETS) state.bodies.shift();
        return true;
      }
      if (ev.type === 'cancel') {
        // Abort the in-progress gesture entirely: no fling, no planet.
        if (!gesture) return;
        gesture = null;
        return true;
      }
    },
  };

  stateRegistry.set(sim, state);
  return sim;
};

export default factory;
