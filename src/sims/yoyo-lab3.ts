import type { Sim2D, SimView } from './types';

// ----- physics constants (mirrors src/content/sims/yoyo-lab3/source.py) -----
// source.py offers three yoyo configurations, selected via an external
// `yoyo_type_menu` (not present in this 321-line source file — it is bound
// from an HTML wrapper outside the vpython program). We port the "Square
// Sides" branch (the first `if` arm), matching `do_square = True # default`
// in the UI-setup comments — the only hint left of which configuration is
// the default.
const G = 9.8; // meters per second squared

const BLOCK_DIAGONAL = 0.242; // m
const INDIV_PLATE_MASS = 0.42295; // kg
const BLOCK_AXEL_MASS = 0.055; // kg
const BLOCK_AXEL_DIAM = 0.0508; // m
const BLOCK_STRING_LENGTH = 1.315; // m

// axle = cylinder(radius=0.05, ...) is set once, before the branch, and the
// Square Sides branch never reassigns axle.radius (unlike the two Disks
// branches, which set axle.radius = CYL{1,2}_AXEL_RAD) — so the effective
// rolling radius for this configuration is the cylinder's original 0.05 m,
// not BLOCK_AXEL_DIAM / 2 (0.0254 m).
const R = 0.05; // axle.radius, m — the rolling/unrolling radius

// I_CM = (1/6)*INDIV_PLATE_MASS*BLOCK_DIAGONAL**2 + (1/8)*BLOCK_AXEL_MASS*BLOCK_AXEL_DIAM**2
const I_CM =
  (1 / 6) * INDIV_PLATE_MASS * BLOCK_DIAGONAL ** 2 +
  (1 / 8) * BLOCK_AXEL_MASS * BLOCK_AXEL_DIAM ** 2;

const TOTAL_MASS = 2 * INDIV_PLATE_MASS + BLOCK_AXEL_MASS;

// yoyo.alpha = vec(0, 0, (axle.radius * total_mass * g) / (I_CM + total_mass * axle.radius**2))
// Computed once before run_sim() and never updated inside the loop — a
// constant angular acceleration for the whole unrolling phase.
const ALPHA = (R * TOTAL_MASS * G) / (I_CM + TOTAL_MASS * R ** 2);

const STRING_MAX_LENGTH = BLOCK_STRING_LENGTH; // string_max_length in the Square Sides branch

const DT = 0.01; // run_sim(): dt = 0.01 (sim_speed only scales the `rate()` playback speed)

// source.py's while-loop has no bound on step count (it runs until the
// string is fully unrolled), but the port must never allow an unbounded
// loop inside a single advance() call; steps-per-call is already capped by
// the host's FixedStepper, this constant just documents the natural
// scale: string unrolls to STRING_MAX_LENGTH in well under 200 steps.
const MAX_STEPS_PER_ADVANCE_CALL = 100_000;

interface State {
  y: number; // height, meters (starts at 0, decreases while unrolling)
  v: number; // vertical velocity, m/s (signed; negative = falling)
  omega: number; // angular velocity about the axle's z-axis, rad/s
  theta: number; // visual spin angle, radians (for drawing the spoke)
  unrolled: number; // string length paid out so far, meters (clamped [0, STRING_MAX_LENGTH])
  // Dylan-requested extension beyond source.py: 1 = descending/unwinding,
  // -1 = climbing/rewinding. See stepOnce for the rebound model.
  direction: 1 | -1;
  n: number; // steps taken; t is derived as n*DT to avoid float accumulation drift
  t: number;
}

function makeState(): State {
  return { y: 0, v: 0, omega: 0, theta: 0, unrolled: 0, direction: 1, n: 0, t: 0 };
}

// Verbatim translation of the while-loop body in source.py's run_sim():
//   yoyo.omega += yoyo.alpha * dt
//   dtheta = dot(yoyo.omega, rot_axis) * dt          (uses omega AFTER the increment above)
//   yoyo.rotate(axis=-rot_axis, origin=yoyo.pos, angle=dtheta)   (visual spin only)
//   yoyo.vel = cross(vec(axle.radius, 0, 0), yoyo.omega)          -> vel = (0, -R*omega, 0)
//   yoyo.pos += yoyo.vel * dt
//   S = axle.radius * dtheta
//   string.length += S
//   while (string.length - string_start_length) < string_max_length
// Dylan-requested extension beyond source.py: source.py's while-loop simply
// exits once the string is fully paid out, with no bounce or free-fall phase
// modeled afterward. Here the yoyo instead rebounds at the bottom of the
// string and climbs back up by rewinding, flipping again at the top — an
// energy-conserving mirror of the descent (same |alpha|, same
// rolling-without-slipping kinematics run in reverse) so it oscillates
// forever instead of freezing.
function stepOnce(s: State): void {
  s.omega += s.direction * ALPHA * DT;
  if (s.direction === -1 && s.omega < 0) s.omega = 0; // clamp omega >= 0 at the top-of-climb flip

  const dtheta = s.omega * DT;
  s.theta += -dtheta;

  // cross(vec(R, 0, 0), vec(0, 0, omega)) = (0, -R*omega, 0) while descending;
  // mirrored while climbing (rewinding raises the yoyo instead of dropping
  // it), so v = -direction * R * omega covers both phases.
  s.v = -s.direction * R * s.omega;
  s.y += s.v * DT;

  s.unrolled += s.direction * R * s.omega * DT;
  if (s.unrolled > STRING_MAX_LENGTH) s.unrolled = STRING_MAX_LENGTH;
  if (s.unrolled < 0) s.unrolled = 0;

  s.n += 1;
  s.t = s.n * DT;

  if (s.direction === 1 && s.unrolled >= STRING_MAX_LENGTH) {
    s.direction = -1; // bottom of the string: rebound, begin climbing
  } else if (s.direction === -1 && s.omega <= 0) {
    s.direction = 1; // top of the climb: begin descending again
  }
}

// Maps a live Sim2D instance to its internal physics state, without putting
// `state` on the returned object itself (the Sim2D surface stays clean).
const stateRegistry = new WeakMap<Sim2D, State>();

/** Test hook: rolling-constraint quantities read off the ported state. */
export function yoyoState(sim: Sim2D): { y: number; v: number; omega: number; R: number } {
  const s = stateRegistry.get(sim);
  if (!s) throw new Error('yoyoState: not a yoyo-lab3 sim instance');
  return { y: s.y, v: s.v, omega: s.omega, R };
}

// World is centered on the fixed x=0 drop line (the yoyo never moves in x —
// cross(vec(R,0,0), vec(0,0,omega)) has no x or z component). y ranges from
// the ceiling anchor down past the fully-unrolled string length.
const WORLD_MIN_X = -0.3;
const WORLD_MAX_X = 0.3;
const CEILING_Y = 0.1;
const WORLD_MAX_Y = CEILING_Y + 0.05;
const WORLD_MIN_Y = -(STRING_MAX_LENGTH + 0.15);

function worldToPx(x: number, y: number, view: SimView): { px: number; py: number } {
  const px = ((x - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X)) * view.w;
  const py = view.h - ((y - WORLD_MIN_Y) / (WORLD_MAX_Y - WORLD_MIN_Y)) * view.h;
  return { px, py };
}

const DISK_PX_RADIUS = 26; // fixed pixel radius, independent of world scale (mirrors other ports' fixed-px markers)
const AXLE_PX_RADIUS = 5;

const factory = (_p: Record<string, number>): Sim2D => {
  let state = makeState();

  const sim: Sim2D = {
    dt: DT,

    advance(dt: number) {
      const steps = Math.min(Math.max(0, Math.round(dt / DT)), MAX_STEPS_PER_ADVANCE_CALL);
      for (let i = 0; i < steps; i++) {
        stepOnce(state);
      }
    },

    draw(ctx: CanvasRenderingContext2D, view: SimView) {
      ctx.clearRect(0, 0, view.w, view.h);

      // ceiling mount (mirrors source.py's `ceiling` box)
      const ceilingPx = worldToPx(0, CEILING_Y, view);
      ctx.strokeStyle = view.css('--neutral');
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ceilingPx.px - 24, ceilingPx.py - 4, 48, 8);

      // string: from the ceiling anchor down to the yoyo's axle
      const yoyoPx = worldToPx(0, state.y, view);
      ctx.strokeStyle = view.css('--text-dim');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ceilingPx.px, ceilingPx.py);
      ctx.lineTo(yoyoPx.px, yoyoPx.py);
      ctx.stroke();

      // spinning disk body
      ctx.fillStyle = view.css('--surface');
      ctx.strokeStyle = view.css('--accent');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(yoyoPx.px, yoyoPx.py, DISK_PX_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // spoke, so the disk's rotation is visible
      ctx.strokeStyle = view.css('--accent-bright');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(yoyoPx.px, yoyoPx.py);
      ctx.lineTo(
        yoyoPx.px + DISK_PX_RADIUS * Math.cos(state.theta),
        yoyoPx.py + DISK_PX_RADIUS * Math.sin(state.theta),
      );
      ctx.stroke();

      // axle
      ctx.fillStyle = view.css('--accent-bright');
      ctx.beginPath();
      ctx.arc(yoyoPx.px, yoyoPx.py, AXLE_PX_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // mono readouts
      ctx.font = '12px "Space Mono", monospace';
      ctx.fillStyle = view.css('--text-dim');
      ctx.fillText(`t = ${state.t.toFixed(2)} s`, 10, 18);
      ctx.fillText(`y = ${state.y.toFixed(3)} m`, 10, 34);
      ctx.fillText(`ω = ${state.omega.toFixed(2)} rad/s`, 10, 50);
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
