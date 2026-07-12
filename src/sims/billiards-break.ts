// Built native for dylmart.dev (FunProjects)
import type { Sim2D, SimView, SimPointerEvent } from './types';
import type { ParamSpec } from './registry';
import { drawArrow } from './draw';

// ----- physics constants -----
const BALL_R = 1;
const DT = 1 / 240;
const TABLE = { w: 60, h: 34 }; // world units, cushions at the edges
const FRICTION = 6; // rolling deceleration, units/s^2, opposing velocity
const STOP_EPS = 0.05; // balls stop when |v| < this

const CUE_START = { x: 15, y: TABLE.h / 2 };
// 15-ball triangle rack: apex ball closest to the cue, widening away from it.
// Row spacing (sqrt(3)*R horizontally, 2R vertically per adjacent ball in a
// row) is exactly the touching distance for unit-radius circles, so every
// ball in the rack starts in contact with its neighbors, never overlapping.
const APEX_X = 45;
const ROW_DX = BALL_R * Math.sqrt(3);
const ROW_DY = 2 * BALL_R;
const ROWS = 5; // 1+2+3+4+5 = 15 balls

const DRAG_HIT_RADIUS_PX = 25; // pointer-down within this many px of the cue ball starts a drag
const FLING_SCALE = 2.5; // release velocity = dragVector_world * FLING_SCALE
const MAX_SPEED = 60;

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface State {
  e: number; // restitution, shared by ball-ball and cushion collisions
  balls: Ball[]; // balls[0] is the cue ball, balls[1..15] the rack
}

function makeRack(): Ball[] {
  const balls: Ball[] = [];
  for (let row = 0; row < ROWS; row++) {
    const x = APEX_X + row * ROW_DX;
    for (let k = 0; k <= row; k++) {
      const y = TABLE.h / 2 + (k - row / 2) * ROW_DY;
      balls.push({ x, y, vx: 0, vy: 0 });
    }
  }
  return balls;
}

function makeState(e: number): State {
  return {
    e,
    balls: [{ x: CUE_START.x, y: CUE_START.y, vx: 0, vy: 0 }, ...makeRack()],
  };
}

/**
 * Pure elastic-disc collision between two equal-unit-mass balls: normal n =
 * (b-a)/|b-a|, relative velocity along n, impulse j = vRel·n * (1+e)/2
 * (equal masses), exchanged along the normal only — tangential components
 * are untouched. Conserves momentum for any e, and kinetic energy at e=1.
 */
export function collide(a: Ball, b: Ball, e: number): { a: Ball; b: Ball } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1e-9;
  const nx = dx / dist;
  const ny = dy / dist;
  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const vRelN = rvx * nx + rvy * ny;
  const j = (vRelN * (1 + e)) / 2;
  return {
    a: { ...a, vx: a.vx + j * nx, vy: a.vy + j * ny },
    b: { ...b, vx: b.vx - j * nx, vy: b.vy - j * ny },
  };
}

/**
 * One physics step, pure aside from mutating `state` in place (same
 * convention as every other sim's stepOnce in this codebase):
 *   1. rolling friction decelerates each moving ball, then integrates position
 *   2. cushion collisions reflect the normal velocity component by e
 *   3. a single pass over ball pairs resolves overlaps: an approaching pair
 *      (vRel·n < 0) exchanges velocity via collide(); every overlapping pair
 *      (approaching or not) is also split positionally along the normal so
 *      resting-contact balls don't stay embedded in each other.
 */
export function stepOnce(state: State): void {
  for (const b of state.balls) {
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > 0) {
      const newSpeed = Math.max(0, speed - FRICTION * DT);
      if (newSpeed < STOP_EPS) {
        b.vx = 0;
        b.vy = 0;
      } else {
        const scale = newSpeed / speed;
        b.vx *= scale;
        b.vy *= scale;
      }
    }
    b.x += b.vx * DT;
    b.y += b.vy * DT;
  }

  for (const b of state.balls) {
    if (b.x < BALL_R) {
      b.x = BALL_R;
      b.vx = -b.vx * state.e;
    } else if (b.x > TABLE.w - BALL_R) {
      b.x = TABLE.w - BALL_R;
      b.vx = -b.vx * state.e;
    }
    if (b.y < BALL_R) {
      b.y = BALL_R;
      b.vy = -b.vy * state.e;
    } else if (b.y > TABLE.h - BALL_R) {
      b.y = TABLE.h - BALL_R;
      b.vy = -b.vy * state.e;
    }
  }

  for (let i = 0; i < state.balls.length; i++) {
    for (let j = i + 1; j < state.balls.length; j++) {
      const a = state.balls[i]!;
      const b = state.balls[j]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= 2 * BALL_R || dist < 1e-9) continue;
      const nx = dx / dist;
      const ny = dy / dist;
      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const vRelN = rvx * nx + rvy * ny;
      if (vRelN < 0) {
        const { a: na, b: nb } = collide(a, b, state.e);
        a.vx = na.vx;
        a.vy = na.vy;
        b.vx = nb.vx;
        b.vy = nb.vy;
      }
      const overlap = 2 * BALL_R - dist;
      const corr = overlap / 2;
      a.x -= corr * nx;
      a.y -= corr * ny;
      b.x += corr * nx;
      b.y += corr * ny;
    }
  }
}

function anyMoving(state: State): boolean {
  return state.balls.some((b) => b.vx !== 0 || b.vy !== 0);
}

// Maps a live Sim2D instance to its internal physics state, without putting
// `state` on the returned object itself (the Sim2D surface stays clean).
const stateRegistry = new WeakMap<Sim2D, State>();

/** Test hook: exposes a snapshot of the internal ball state of a sim built by the default factory. */
export function billiardsState(sim: Sim2D): { e: number; balls: Ball[] } {
  const s = stateRegistry.get(sim);
  if (!s) throw new Error('billiardsState: not a billiards-break sim instance');
  return { e: s.e, balls: s.balls.map((b) => ({ ...b })) };
}

// Selecting a different bounciness rebuilds the sim from scratch (fresh
// factory instance, per the host's param-change contract), which re-racks.
export const params: ParamSpec[] = [{ key: 'e', label: 'bounciness e', values: [0.8, 0.95, 1], initial: 0.95 }];

function scaleOf(view: SimView): number {
  return Math.min(view.w / TABLE.w, view.h / TABLE.h);
}

function worldToPx(x: number, y: number, view: SimView): { px: number; py: number } {
  const scale = scaleOf(view);
  const offsetX = (view.w - TABLE.w * scale) / 2;
  const offsetY = (view.h - TABLE.h * scale) / 2;
  return { px: offsetX + x * scale, py: view.h - offsetY - y * scale };
}

const factory = (p: Record<string, number>): Sim2D => {
  const e = p.e ?? 0.95;
  let state = makeState(e);

  // Live drag-to-aim gesture state (screen px), or null when not dragging.
  let drag: { current: { x: number; y: number } } | null = null;

  const sim: Sim2D = {
    dt: DT,

    advance(dt: number) {
      const steps = Math.max(0, Math.round(dt / DT));
      for (let i = 0; i < steps; i++) stepOnce(state);
    },

    draw(ctx: CanvasRenderingContext2D, view: SimView) {
      ctx.clearRect(0, 0, view.w, view.h);

      const scale = scaleOf(view);
      const offsetX = (view.w - TABLE.w * scale) / 2;
      const offsetY = (view.h - TABLE.h * scale) / 2;
      ctx.strokeStyle = view.css('--neutral');
      ctx.lineWidth = 3;
      ctx.strokeRect(offsetX, offsetY, TABLE.w * scale, TABLE.h * scale);

      state.balls.forEach((b, i) => {
        const { px, py } = worldToPx(b.x, b.y, view);
        ctx.fillStyle = i === 0 ? view.css('--sim-canvas-fg') : view.css(i % 2 === 1 ? '--accent' : '--accent-cool');
        ctx.beginPath();
        ctx.arc(px, py, BALL_R * scale, 0, Math.PI * 2);
        ctx.fill();
      });

      // live aim line while a drag-to-aim gesture is in progress
      if (drag) {
        const cuePx = worldToPx(state.balls[0]!.x, state.balls[0]!.y, view);
        drawArrow(ctx, cuePx.px, cuePx.py, drag.current.x, drag.current.y, view.css('--accent-cool'), 2, 6);
      }
    },

    reset() {
      state = makeState(e);
      stateRegistry.set(sim, state);
    },

    // Aiming is disabled while any ball is moving. down within
    // DRAG_HIT_RADIUS_PX of the cue ball starts a drag; move live-updates the
    // aim line; up commits flingFromDrag-style velocity onto the cue ball
    // (v = dragVector_world * FLING_SCALE, capped at MAX_SPEED); cancel aborts
    // without shooting.
    onPointer(ev: SimPointerEvent, view: SimView) {
      if (ev.type === 'down') {
        if (anyMoving(state)) return;
        const cue = state.balls[0]!;
        const cuePx = worldToPx(cue.x, cue.y, view);
        const dist = Math.hypot(ev.x - cuePx.px, ev.y - cuePx.py);
        if (dist > DRAG_HIT_RADIUS_PX) return;
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
        const cue = state.balls[0]!;
        const cuePx = worldToPx(cue.x, cue.y, view);
        const dx = drag.current.x - cuePx.px;
        const dy = drag.current.y - cuePx.py;
        drag = null;
        const scale = scaleOf(view);
        let vx = (dx / scale) * FLING_SCALE;
        let vy = (-dy / scale) * FLING_SCALE; // screen-up (negative dy) => +y world
        const speed = Math.hypot(vx, vy);
        if (speed > MAX_SPEED) {
          const s = MAX_SPEED / speed;
          vx *= s;
          vy *= s;
        }
        cue.vx = vx;
        cue.vy = vy;
        return true;
      }
      if (ev.type === 'cancel') {
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
