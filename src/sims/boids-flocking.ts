// Built native for dylmart.dev (FunProjects)
import type { Sim2D, SimView, SimPointerEvent } from './types';
import type { ParamSpec } from './registry';
import { mulberry32 } from './rng';

// ----- flocking constants (classic Reynolds boids, tuned for a murmuration:
// dense flock, alignment-dominant weights, narrow field of view) -----
const N = 220;
const DT = 1 / 60;
const WORLD = 100; // [0, WORLD) square, toroidal wrap
const VIEW_R = 13; // cohesion/alignment neighbor radius (+30% over the brief's 10: at 10, separate
                    // clusters lost sight of each other entirely and froze as disconnected pods
                    // instead of one flowing sheet — see boids-upgrade-report.md)
const SEP_R = 2.5; // separation radius (subset of the VIEW_R neighbors)
const MIN_SPEED = 8; // hard floor post-clamp; a stalled boid looks dead
const MAX_SPEED = 24;
const MAX_FORCE = 60;
const W_COH = 0.9, W_ALI = 1.5, W_SEP = 2.2, W_FLEE = 3.0;
const FLEE_R = 20; // predator/hawk influence radius; beyond this, flee contributes nothing
const INIT_SPEED = MAX_SPEED * 0.5;

// Deterministic wander: a per-boid seeded phase plus accumulated sim time
// drives a slowly-rotating force so idle boids still drift instead of
// locking into a rigid vector field. No rng in stepFlock — phase is drawn
// once at init, t accumulates in State.
const WANDER_FREQ = 0.9;
const WANDER_MAG = 0.15 * MAX_FORCE;

// Autonomous hawk: spawns every HAWK_PERIOD sim-seconds and flies a straight
// chord across the world at HAWK_SPEED, despawning after HAWK_FLIGHT
// seconds. Chord geometry (entry point + heading) is drawn from the seeded
// rng at init only and cycled through by flight index, so stepFlock stays
// rng-free and the whole thing is deterministic per seed.
const HAWK_PERIOD = 9;
const HAWK_FLIGHT = 4;
const HAWK_SPEED = 1.6 * MAX_SPEED;
const HAWK_CHORD_COUNT = 16;

const BOID_WID_RATIO = 2 / 3; // width/length aspect for the boid triangle
const HAWK_LEN = 14;
const PREDATOR_R = 7;

// Launch parameters: rendered automatically by SimCanvas2D as `.sim-params`
// selects. Changing the seed rebuilds the sim (fresh flock) per the host
// contract; the default (1337) matches the brief's pinned-test seed.
export const params: ParamSpec[] = [
  { key: 'seed', label: 'flock seed', values: [1337, 7, 42], initial: 1337 },
];

interface Vec2 { x: number; y: number }
interface Boid { x: number; y: number; vx: number; vy: number; phase: number }
interface Predator { x: number; y: number }
interface Hawk { x: number; y: number; vx: number; vy: number }
interface Chord { entry: Vec2; heading: Vec2 }

interface State {
  boids: Boid[];
  predator: Predator | null;
  t: number;
  hawkChords: Chord[];
  hawk: Hawk | null;
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

/**
 * True when b is inside a's ~300 degree field of view (the rear 60 degree
 * cone is blind). Heading is a's velocity direction; a boid with ~zero speed
 * has no defined heading and is treated as perceiving everything.
 */
export function perceives(a: Boid, b: Boid): boolean {
  const speed = Math.hypot(a.vx, a.vy);
  if (speed < 1e-9) return true;
  const hx = a.vx / speed;
  const hy = a.vy / speed;
  const dx = wrappedDelta(b.x, a.x);
  const dy = wrappedDelta(b.y, a.y);
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-9) return true;
  const dot = (dx / dist) * hx + (dy / dist) * hy;
  return dot > Math.cos((150 * Math.PI) / 180);
}

function computeHawk(state: Pick<State, 't' | 'hawkChords'>): Hawk | null {
  const { t, hawkChords } = state;
  if (hawkChords.length === 0) return null;
  // The flock gets one calm HAWK_PERIOD before the first strafe: at t=0 the
  // k=0 window would otherwise put a hawk on screen the moment the sim loads.
  if (t < HAWK_PERIOD) return null;
  const k = Math.floor(t / HAWK_PERIOD);
  const since = t - k * HAWK_PERIOD;
  if (since < 0 || since >= HAWK_FLIGHT) return null;
  const idx = ((k % hawkChords.length) + hawkChords.length) % hawkChords.length;
  const chord = hawkChords[idx]!;
  return {
    x: wrapCoord(chord.entry.x + chord.heading.x * HAWK_SPEED * since),
    y: wrapCoord(chord.entry.y + chord.heading.y * HAWK_SPEED * since),
    vx: chord.heading.x * HAWK_SPEED,
    vy: chord.heading.y * HAWK_SPEED,
  };
}

// All randomness flows through mulberry32(seed): per boid x, y, heading,
// wander phase (in that order), then HAWK_CHORD_COUNT chords (direction,
// lateral offset), all in a fixed order, so the same seed always yields the
// same flock and the same hawk flight path.
function makeState(seed: number): State {
  const rand = mulberry32(seed);
  const boids: Boid[] = [];
  for (let i = 0; i < N; i++) {
    const x = rand() * WORLD;
    const y = rand() * WORLD;
    const angle = rand() * Math.PI * 2;
    const phase = rand() * Math.PI * 2;
    boids.push({ x, y, vx: Math.cos(angle) * INIT_SPEED, vy: Math.sin(angle) * INIT_SPEED, phase });
  }

  const hawkChords: Chord[] = [];
  for (let i = 0; i < HAWK_CHORD_COUNT; i++) {
    const dir = rand() * Math.PI * 2;
    const offset = (rand() - 0.5) * WORLD;
    const perp = dir + Math.PI / 2;
    const cx = WORLD / 2 + Math.cos(perp) * offset;
    const cy = WORLD / 2 + Math.sin(perp) * offset;
    const back = WORLD * 0.75; // start well outside the world so the chord crosses it
    hawkChords.push({
      entry: { x: cx - Math.cos(dir) * back, y: cy - Math.sin(dir) * back },
      heading: { x: Math.cos(dir), y: Math.sin(dir) },
    });
  }

  const state: State = { boids, predator: null, t: 0, hawkChords, hawk: null };
  state.hawk = computeHawk(state);
  return state;
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

/** Flee-steering away from a point, zero contribution outside FLEE_R (shared by pointer predator and hawk). */
function fleeForce(self: Boid, point: Vec2 | null, vel: Vec2): Vec2 {
  if (!point) return { x: 0, y: 0 };
  const dx = wrappedDelta(self.x, point.x);
  const dy = wrappedDelta(self.y, point.y);
  const dist = Math.hypot(dx, dy);
  if (dist >= FLEE_R || dist <= 1e-9) return { x: 0, y: 0 };
  return steerToward({ x: dx, y: dy }, vel);
}

/**
 * Combined weighted steering force on one boid: cohesion (toward the average
 * position of VIEW_R neighbors), alignment (toward their average velocity),
 * separation (away from SEP_R-close neighbors, closer = stronger), flee
 * (away from the pointer predator and/or the hawk, summed — both can be
 * active at once), and wander (a slow, deterministic per-boid drift so the
 * flock never looks locked to a rigid vector field). Neighbors for
 * cohesion/alignment/separation are restricted to those inside `self`'s
 * field of view (perceives). Each rule term is independently force-clamped
 * by steerToward before the weights are applied.
 */
function computeSteer(self: Boid, boids: Boid[], predator: Predator | null, hawk: Hawk | null, t: number): Vec2 {
  const vel = { x: self.vx, y: self.vy };
  let cohX = 0, cohY = 0, aliX = 0, aliY = 0, n = 0;
  let sepX = 0, sepY = 0;

  for (const other of boids) {
    if (other === self) continue;
    const dx = wrappedDelta(other.x, self.x);
    const dy = wrappedDelta(other.y, self.y);
    const dist = Math.hypot(dx, dy);
    if (dist < VIEW_R && perceives(self, other)) {
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

  const fleePredator = fleeForce(self, predator, vel);
  const fleeHawk = fleeForce(self, hawk, vel);

  const wanderAngle = t * WANDER_FREQ + self.phase;
  const wanderX = WANDER_MAG * Math.cos(wanderAngle);
  const wanderY = WANDER_MAG * Math.sin(wanderAngle);

  return {
    x: W_COH * cohesion.x + W_ALI * alignment.x + W_SEP * separation.x + W_FLEE * (fleePredator.x + fleeHawk.x) + wanderX,
    y: W_COH * cohesion.y + W_ALI * alignment.y + W_SEP * separation.y + W_FLEE * (fleePredator.y + fleeHawk.y) + wanderY,
  };
}

/**
 * One physics step, pure aside from mutating `state` in place (same
 * convention as every other sim's stepOnce in this codebase): compute every
 * boid's steering from the pre-step flock (order-independent) plus the
 * pre-step hawk, integrate velocity (steer*DT), clamp speed into
 * [MIN_SPEED, MAX_SPEED], wrap position toroidally into [0, WORLD), then
 * advance sim time and recompute the hawk for the new instant. No rng, no
 * Date — time comes solely from state.t.
 */
export function stepFlock(state: State): void {
  const { boids, predator, hawk, t } = state;
  const steers = boids.map((b) => computeSteer(b, boids, predator, hawk, t));
  boids.forEach((b, i) => {
    const steer = steers[i]!;
    b.vx += steer.x * DT;
    b.vy += steer.y * DT;
    let speed = Math.hypot(b.vx, b.vy);
    if (speed > MAX_SPEED) {
      const s = MAX_SPEED / speed;
      b.vx *= s;
      b.vy *= s;
      speed = MAX_SPEED;
    }
    if (speed < MIN_SPEED) {
      if (speed > 1e-9) {
        const s = MIN_SPEED / speed;
        b.vx *= s;
        b.vy *= s;
      } else {
        // no direction to rescale (only reachable from a contrived all-zero
        // initial state, never from makeState) — pick an arbitrary heading
        // deterministically rather than divide by zero.
        b.vx = MIN_SPEED;
        b.vy = 0;
      }
    }
    b.x = wrapCoord(b.x + b.vx * DT);
    b.y = wrapCoord(b.y + b.vy * DT);
  });
  state.t += DT;
  state.hawk = computeHawk(state);
}

// Maps a live Sim2D instance to its internal flock state, without putting
// `state` on the returned object itself (the Sim2D surface stays clean).
const stateRegistry = new WeakMap<Sim2D, State>();

/** Test hook: exposes a snapshot of the internal flock state of a sim built by the default factory. */
export function flockState(sim: Sim2D): { boids: Boid[]; predator: Predator | null; hawk: Hawk | null } {
  const s = stateRegistry.get(sim);
  if (!s) throw new Error('flockState: not a boids-flocking sim instance');
  return {
    boids: s.boids.map((b) => ({ ...b })),
    predator: s.predator ? { ...s.predator } : null,
    hawk: s.hawk ? { ...s.hawk } : null,
  };
}

function worldToPx(x: number, y: number, view: SimView): { px: number; py: number } {
  return { px: (x / WORLD) * view.w, py: (y / WORLD) * view.h };
}

function pxToWorld(px: number, py: number, view: SimView): Vec2 {
  return { x: wrapCoord((px / view.w) * WORLD), y: wrapCoord((py / view.h) * WORLD) };
}

function drawBoid(ctx: CanvasRenderingContext2D, px: number, py: number, angle: number, color: string, len: number): void {
  const wid = len * BOID_WID_RATIO;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(len, 0);
  ctx.lineTo(-len * 0.6, wid);
  ctx.lineTo(-len * 0.6, -wid);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const factory = (p: Record<string, number>): Sim2D => {
  const seed = p.seed ?? 1337;
  let state = makeState(seed);
  // First draw after mount (and every draw right after reset) must be an
  // opaque clear so the motion-blur trail technique doesn't ghost the
  // previous flock/reset artifacts into the new one.
  let needsClear = true;

  const sim: Sim2D = {
    dt: DT,

    advance(dt: number) {
      const steps = Math.max(0, Math.round(dt / DT));
      for (let i = 0; i < steps; i++) stepFlock(state);
    },

    draw(ctx: CanvasRenderingContext2D, view: SimView) {
      if (needsClear) {
        ctx.fillStyle = view.css('--sim-canvas-bg');
        ctx.fillRect(0, 0, view.w, view.h);
        needsClear = false;
      } else {
        // Translucent black over the previous frame(s): the canvas persists
        // between draws (host contract), so this reads as fading
        // motion-blur trails rather than a hard-edged clear.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fillRect(0, 0, view.w, view.h);
      }

      const accentCool = view.css('--accent-cool');
      const accent = view.css('--accent');
      state.boids.forEach((b, i) => {
        const { px, py } = worldToPx(b.x, b.y, view);
        const angle = Math.atan2(b.vy, b.vx);
        const len = 5 + (i % 3);
        const color = i % 8 === 0 ? accent : accentCool;
        drawBoid(ctx, px, py, angle, color, len);
      });

      if (state.hawk) {
        const { px, py } = worldToPx(state.hawk.x, state.hawk.y, view);
        const angle = Math.atan2(state.hawk.vy, state.hawk.vx);
        drawBoid(ctx, px, py, angle, view.css('--accent-bright'), HAWK_LEN);
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
      needsClear = true;
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
