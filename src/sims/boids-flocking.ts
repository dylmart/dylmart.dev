// Built native for dylmart.dev (FunProjects)
import type { Sim2D, SimView, SimPointerEvent } from './types';
import type { ParamSpec } from './registry';
import { mulberry32 } from './rng';

// ----- flocking constants (classic Reynolds boids) -----
const N = 60;
const DT = 1 / 60;
const WORLD = 100; // [0, WORLD) square, toroidal wrap
const VIEW_R = 12; // cohesion/alignment neighbor radius
const SEP_R = 3; // separation radius (subset of the VIEW_R neighbors)
const MAX_SPEED = 22;
const MAX_FORCE = 60;
const W_COH = 1.0, W_ALI = 1.2, W_SEP = 1.8, W_FLEE = 3.0;
const FLEE_R = 20; // predator influence radius; beyond this, flee contributes nothing
const INIT_SPEED = MAX_SPEED * 0.5;

const BOID_LEN = 6;
const BOID_WID = 4;
const PREDATOR_R = 7;

// Launch parameters: rendered automatically by SimCanvas2D as `.sim-params`
// selects. Changing the seed rebuilds the sim (fresh flock) per the host
// contract; the default (1337) matches the brief's pinned-test seed.
export const params: ParamSpec[] = [
  { key: 'seed', label: 'flock seed', values: [1337, 7, 42], initial: 1337 },
];

interface Vec2 { x: number; y: number }
interface Boid { x: number; y: number; vx: number; vy: number }
interface Predator { x: number; y: number }

interface State {
  boids: Boid[];
  predator: Predator | null;
}

function wrapCoord(v: number): number {
  return ((v % WORLD) + WORLD) % WORLD;
}

/**
 * Shortest signed delta from b to a on the toroidal [0, WORLD) line/axis: a -
 * b, wrapped into [-WORLD/2, WORLD/2) so a neighbor just across the wrap
 * boundary reads as close instead of nearly WORLD units away.
 */
function wrappedDelta(a: number, b: number): number {
  let d = (a - b) % WORLD;
  if (d > WORLD / 2) d -= WORLD;
  if (d < -WORLD / 2) d += WORLD;
  return d;
}

// All randomness flows through mulberry32(seed): 3 draws per boid (x, y,
// heading), in a fixed order, so the same seed always yields the same flock.
function makeState(seed: number): State {
  const rand = mulberry32(seed);
  const boids: Boid[] = [];
  for (let i = 0; i < N; i++) {
    const x = rand() * WORLD;
    const y = rand() * WORLD;
    const angle = rand() * Math.PI * 2;
    boids.push({ x, y, vx: Math.cos(angle) * INIT_SPEED, vy: Math.sin(angle) * INIT_SPEED });
  }
  return { boids, predator: null };
}

function clampMag(v: Vec2, max: number): Vec2 {
  const m = Math.hypot(v.x, v.y);
  if (m <= max || m === 0) return v;
  const s = max / m;
  return { x: v.x * s, y: v.y * s };
}

/**
 * One Reynolds steering rule: `desiredDir` is an unnormalized direction (the
 * zero vector means "this rule has no opinion" and contributes nothing).
 * Every rule maps to the same shape: normalize the direction, scale to
 * MAX_SPEED, subtract the current velocity, then clamp the result to
 * MAX_FORCE — exactly the model in the brief.
 */
function steerToward(desiredDir: Vec2, vel: Vec2): Vec2 {
  const m = Math.hypot(desiredDir.x, desiredDir.y);
  if (m === 0) return { x: 0, y: 0 };
  const desired = { x: (desiredDir.x / m) * MAX_SPEED, y: (desiredDir.y / m) * MAX_SPEED };
  return clampMag({ x: desired.x - vel.x, y: desired.y - vel.y }, MAX_FORCE);
}

/**
 * Combined weighted steering force on one boid: cohesion (toward the average
 * position of VIEW_R neighbors), alignment (toward their average velocity),
 * separation (away from SEP_R-close neighbors, closer = stronger), and flee
 * (away from the predator, only inside FLEE_R). Each term is independently
 * force-clamped by steerToward before the weights are applied.
 */
function computeSteer(self: Boid, boids: Boid[], predator: Predator | null): Vec2 {
  const vel = { x: self.vx, y: self.vy };
  let cohX = 0, cohY = 0, aliX = 0, aliY = 0, n = 0;
  let sepX = 0, sepY = 0;

  for (const other of boids) {
    if (other === self) continue;
    const dx = wrappedDelta(other.x, self.x);
    const dy = wrappedDelta(other.y, self.y);
    const dist = Math.hypot(dx, dy);
    if (dist < VIEW_R) {
      cohX += dx; cohY += dy;
      aliX += other.vx; aliY += other.vy;
      n++;
      if (dist < SEP_R && dist > 1e-9) {
        sepX -= dx / dist;
        sepY -= dy / dist;
      }
    }
  }

  const cohesion = n > 0 ? steerToward({ x: cohX / n, y: cohY / n }, vel) : { x: 0, y: 0 };
  const alignment = n > 0 ? steerToward({ x: aliX / n, y: aliY / n }, vel) : { x: 0, y: 0 };
  const separation = steerToward({ x: sepX, y: sepY }, vel);

  let flee = { x: 0, y: 0 };
  if (predator) {
    const dx = wrappedDelta(self.x, predator.x);
    const dy = wrappedDelta(self.y, predator.y);
    const dist = Math.hypot(dx, dy);
    if (dist < FLEE_R && dist > 1e-9) flee = steerToward({ x: dx, y: dy }, vel);
  }

  return {
    x: W_COH * cohesion.x + W_ALI * alignment.x + W_SEP * separation.x + W_FLEE * flee.x,
    y: W_COH * cohesion.y + W_ALI * alignment.y + W_SEP * separation.y + W_FLEE * flee.y,
  };
}

/**
 * One physics step, pure aside from mutating `state` in place (same
 * convention as every other sim's stepOnce in this codebase): compute every
 * boid's steering from the pre-step flock (order-independent), then
 * integrate velocity (steer*DT), clamp speed to MAX_SPEED, and wrap position
 * toroidally into [0, WORLD).
 */
export function stepFlock(state: State): void {
  const { boids, predator } = state;
  const steers = boids.map((b) => computeSteer(b, boids, predator));
  boids.forEach((b, i) => {
    const steer = steers[i]!;
    b.vx += steer.x * DT;
    b.vy += steer.y * DT;
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > MAX_SPEED) {
      const s = MAX_SPEED / speed;
      b.vx *= s;
      b.vy *= s;
    }
    b.x = wrapCoord(b.x + b.vx * DT);
    b.y = wrapCoord(b.y + b.vy * DT);
  });
}

// Maps a live Sim2D instance to its internal flock state, without putting
// `state` on the returned object itself (the Sim2D surface stays clean).
const stateRegistry = new WeakMap<Sim2D, State>();

/** Test hook: exposes a snapshot of the internal flock state of a sim built by the default factory. */
export function flockState(sim: Sim2D): { boids: Boid[]; predator: Predator | null } {
  const s = stateRegistry.get(sim);
  if (!s) throw new Error('flockState: not a boids-flocking sim instance');
  return {
    boids: s.boids.map((b) => ({ ...b })),
    predator: s.predator ? { ...s.predator } : null,
  };
}

function worldToPx(x: number, y: number, view: SimView): { px: number; py: number } {
  return { px: (x / WORLD) * view.w, py: (y / WORLD) * view.h };
}

function pxToWorld(px: number, py: number, view: SimView): Vec2 {
  return { x: wrapCoord((px / view.w) * WORLD), y: wrapCoord((py / view.h) * WORLD) };
}

function drawBoid(ctx: CanvasRenderingContext2D, px: number, py: number, angle: number, color: string): void {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(BOID_LEN, 0);
  ctx.lineTo(-BOID_LEN * 0.6, BOID_WID);
  ctx.lineTo(-BOID_LEN * 0.6, -BOID_WID);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const factory = (p: Record<string, number>): Sim2D => {
  const seed = p.seed ?? 1337;
  let state = makeState(seed);

  const sim: Sim2D = {
    dt: DT,

    advance(dt: number) {
      const steps = Math.max(0, Math.round(dt / DT));
      for (let i = 0; i < steps; i++) stepFlock(state);
    },

    draw(ctx: CanvasRenderingContext2D, view: SimView) {
      ctx.clearRect(0, 0, view.w, view.h);

      const boidColor = view.css('--accent-cool');
      for (const b of state.boids) {
        const { px, py } = worldToPx(b.x, b.y, view);
        const angle = Math.atan2(b.vy, b.vx);
        drawBoid(ctx, px, py, angle, boidColor);
      }

      if (state.predator) {
        const { px, py } = worldToPx(state.predator.x, state.predator.y, view);
        ctx.fillStyle = view.css('--accent');
        ctx.beginPath();
        ctx.arc(px, py, PREDATOR_R, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    reset() {
      state = makeState(seed);
      stateRegistry.set(sim, state);
    },

    // The predator tracks the pointer while held (down starts it, move
    // updates it, per the engine's SimPointerEvent.held contract); up and
    // cancel both clear it, matching every other native sim's cancel
    // semantics (abort, don't commit).
    onPointer(ev: SimPointerEvent, view: SimView) {
      if ((ev.type === 'down' || ev.type === 'move') && ev.held) {
        state.predator = pxToWorld(ev.x, ev.y, view);
        return true;
      }
      if (ev.type === 'up' || ev.type === 'cancel') {
        if (!state.predator) return;
        state.predator = null;
        return true;
      }
    },
  };

  stateRegistry.set(sim, state);
  return sim;
};

export default factory;
