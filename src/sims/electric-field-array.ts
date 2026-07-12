import type { Sim2D, SimView, SimPointerEvent } from './types';
import { drawArrow } from './draw';

// ----- physics constants (mirrors src/content/sims/electric-field-array/source.py) -----
const K = 8.99e9;
const SAT_LEV = 1;

interface Vec2 { x: number; y: number }
interface Charge { x: number; y: number; q: number }

// source.py: ball1.pos = (0,2,0), q1 = -1e-9; ball2.pos = (3,-2,0), q2 = +1e-9
const INITIAL_CHARGES: Charge[] = [
  { x: 0, y: 2, q: -1.0e-9 },
  { x: 3, y: -2, q: 1.0e-9 },
];

// Grid: x,y in arange(-5.5, 5.5, 1) -> 11 samples per axis, 121 arrows total.
const GRID_MIN = -5.5;
const GRID_STEP = 1;
const GRID_COUNT = 11;

/**
 * Pure field superposition at a point, pre-clamp: E = sum(k·q·r/|r|³), with the
 * source.py db0 guard — if the query point exactly coincides with ANY charge
 * (mag(r) == 0), the whole sum is defined as the zero vector rather than
 * blowing up on that one term.
 */
export function fieldAt(p: Vec2, charges: Charge[]): Vec2 {
  for (const c of charges) {
    if (p.x === c.x && p.y === c.y) return { x: 0, y: 0 };
  }
  let Ex = 0, Ey = 0;
  for (const c of charges) {
    const rx = p.x - c.x, ry = p.y - c.y;
    const r = Math.hypot(rx, ry);
    const r3 = r * r * r;
    Ex += (K * c.q * rx) / r3;
    Ey += (K * c.q * ry) / r3;
  }
  return { x: Ex, y: Ey };
}

/** Clamp a field vector to satLev magnitude, preserving direction (source.py: hat(E)*sat_lev). */
export function clampField(E: Vec2, satLev: number): Vec2 {
  const mag = Math.hypot(E.x, E.y);
  if (mag === 0) return { x: 0, y: 0 };
  if (mag <= satLev) return { x: E.x, y: E.y };
  return { x: (E.x / mag) * satLev, y: (E.y / mag) * satLev };
}

interface State {
  charges: Charge[];
  draggedIndex: number | null;
}

function makeState(): State {
  return { charges: INITIAL_CHARGES.map((c) => ({ ...c })), draggedIndex: null };
}

// Maps a live Sim2D instance to its internal physics state, without putting
// `state` on the returned object itself (the Sim2D surface stays clean).
const stateRegistry = new WeakMap<Sim2D, State>();

/** Test hook: exposes the live charge positions of a sim built by the default factory. */
export function chargesOf(sim: Sim2D): Charge[] {
  const s = stateRegistry.get(sim);
  if (!s) throw new Error('chargesOf: not an electric-field-array sim instance');
  return s.charges.map((c) => ({ ...c }));
}

// World is a square region centered on the origin; x,y in [-7, 7].
const WORLD_MIN = -7;
const WORLD_MAX = 7;
const WORLD_SPAN = WORLD_MAX - WORLD_MIN;

const GRAB_RADIUS_PX = 25; // pointer-down within this many px of a charge grabs it

function scaleOf(view: SimView): number {
  return Math.min(view.w, view.h) / WORLD_SPAN;
}

function worldToPx(x: number, y: number, view: SimView): { px: number; py: number } {
  const scale = scaleOf(view);
  return { px: view.w / 2 + x * scale, py: view.h / 2 - y * scale };
}

function pxToWorld(px: number, py: number, view: SimView): Vec2 {
  const scale = scaleOf(view);
  return { x: (px - view.w / 2) / scale, y: -(py - view.h / 2) / scale };
}

const factory = (_p: Record<string, number>): Sim2D => {
  let state = makeState();

  const sim: Sim2D = {
    dt: 0.01, // static field: advance() is a no-op, dt is nominal only
    hideSpeedControl: true, // speed is meaningless for a static field (Dylan)

    advance(_dt: number) {
      // no-op: the field is static, nothing to integrate
    },

    draw(ctx: CanvasRenderingContext2D, view: SimView) {
      ctx.clearRect(0, 0, view.w, view.h);

      // 121 grid arrows: shaft length = clamped |E| (<= 1 grid cell) as a
      // world-space offset from the grid point, so it never overlaps its
      // neighbor's cell.
      const dimColor = view.css('--text-dim');
      for (let i = 0; i < GRID_COUNT; i++) {
        const gx = GRID_MIN + i * GRID_STEP;
        for (let j = 0; j < GRID_COUNT; j++) {
          const gy = GRID_MIN + j * GRID_STEP;
          const E = clampField(fieldAt({ x: gx, y: gy }, state.charges), SAT_LEV);
          const from = worldToPx(gx, gy, view);
          const to = worldToPx(gx + E.x, gy + E.y, view);
          drawArrow(ctx, from.px, from.py, to.px, to.py, dimColor, 1, 4);
        }
      }

      // charges: negative --accent-cool (blue), positive --accent (orange),
      // matching both the source's blue/red convention and the site palette.
      // Halo ring while the charge is being dragged.
      state.charges.forEach((c, idx) => {
        const { px, py } = worldToPx(c.x, c.y, view);
        if (state.draggedIndex === idx) {
          ctx.strokeStyle = view.css('--text-dim');
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = view.css(c.q < 0 ? '--accent-cool' : '--accent');
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();
      });
    },

    reset() {
      state = makeState();
      stateRegistry.set(sim, state);
    },

    // Extension beyond source.py (Dylan's request): the original renders a
    // fixed charge layout; here the charges are draggable and the field
    // arrows recompute live. The field math itself stays verbatim.
    onPointer(ev: SimPointerEvent, view: SimView) {
      if (ev.type === 'down') {
        let closestIdx: number | null = null;
        let closestDist = Infinity;
        state.charges.forEach((c, idx) => {
          const { px, py } = worldToPx(c.x, c.y, view);
          const dist = Math.hypot(ev.x - px, ev.y - py);
          if (dist <= GRAB_RADIUS_PX && dist < closestDist) {
            closestDist = dist;
            closestIdx = idx;
          }
        });
        if (closestIdx === null) return;
        state.draggedIndex = closestIdx;
        return true;
      }
      if (ev.type === 'move') {
        if (state.draggedIndex === null) return;
        const world = pxToWorld(ev.x, ev.y, view);
        const c = state.charges[state.draggedIndex]!;
        c.x = world.x;
        c.y = world.y;
        return true;
      }
      if (ev.type === 'up' || ev.type === 'cancel') {
        if (state.draggedIndex === null) return;
        state.draggedIndex = null;
        return true;
      }
    },
  };

  stateRegistry.set(sim, state);
  return sim;
};

export default factory;
