import { describe, it, expect } from 'vitest';
import createSim, { collide, stepOnce, billiardsState } from './billiards-break';

const VIEW = { w: 640, h: 400, css: () => '' };
const BALL_R = 1;
const TABLE = { w: 60, h: 34 };

describe('billiards-break collide()', () => {
  it('head-on equal-mass elastic collision transfers velocity exactly', () => {
    const { a, b } = collide({ x: 0, y: 0, vx: 10, vy: 0 }, { x: 2, y: 0, vx: 0, vy: 0 }, 1);
    expect(a.vx).toBeCloseTo(0, 9);
    expect(b.vx).toBeCloseTo(10, 9);
    expect(a.vy).toBeCloseTo(0, 9);
    expect(b.vy).toBeCloseTo(0, 9);
  });

  it('conserves momentum and (e=1) kinetic energy in a glancing collision', () => {
    const before = { a: { x: 0, y: 0, vx: 8, vy: 2 }, b: { x: 1.7, y: 1.05, vx: -1, vy: 0 } };
    const { a, b } = collide(before.a, before.b, 1);
    expect(a.vx + b.vx).toBeCloseTo(before.a.vx + before.b.vx, 9);
    expect(a.vy + b.vy).toBeCloseTo(before.a.vy + before.b.vy, 9);
    const ke = (o: { vx: number; vy: number }) => o.vx * o.vx + o.vy * o.vy;
    expect(ke(a) + ke(b)).toBeCloseTo(ke(before.a) + ke(before.b), 9);
  });

  it('conserves momentum (but not KE) for e < 1', () => {
    const before = { a: { x: 0, y: 0, vx: 10, vy: 0 }, b: { x: 2, y: 0, vx: 0, vy: 0 } };
    const { a, b } = collide(before.a, before.b, 0.8);
    expect(a.vx + b.vx).toBeCloseTo(before.a.vx + before.b.vx, 9);
    const ke = (o: { vx: number; vy: number }) => o.vx * o.vx + o.vy * o.vy;
    expect(ke(a) + ke(b)).toBeLessThan(ke(before.a) + ke(before.b));
  });

  it('leaves tangential velocity untouched, only the normal component is exchanged', () => {
    // pure head-on along x: the y components (tangential here) must not move
    const { a, b } = collide({ x: 0, y: 0, vx: 5, vy: 3 }, { x: 2, y: 0, vx: 0, vy: -4 }, 1);
    expect(a.vy).toBeCloseTo(3, 9);
    expect(b.vy).toBeCloseTo(-4, 9);
  });
});

describe('billiards-break stepOnce() friction', () => {
  it('stops a lone ball at the closed-form distance (v0=12, a=-6 -> stops at t=2, distance=12)', () => {
    const state = { e: 0.95, balls: [{ x: 10, y: TABLE.h / 2, vx: 12, vy: 0 }] };
    const x0 = state.balls[0]!.x;
    let steps = 0;
    while ((state.balls[0]!.vx !== 0 || state.balls[0]!.vy !== 0) && steps < 100_000) {
      stepOnce(state);
      steps++;
    }
    const dist = state.balls[0]!.x - x0;
    expect(Math.abs(dist - 12)).toBeLessThan(0.1);
    // t* = v0/a = 12/6 = 2s, at DT=1/240 that's 480 steps
    expect(Math.abs(steps - 480)).toBeLessThan(5);
  });

  it('stops a ball dead (both components zero) rather than leaving residual creep', () => {
    const state = { e: 0.95, balls: [{ x: 10, y: 10, vx: 0.03, vy: 0.02 }] };
    stepOnce(state);
    expect(state.balls[0]).toEqual({ x: 10, y: 10, vx: 0, vy: 0 });
  });
});

describe('billiards-break stepOnce() cushions', () => {
  it('reflects the normal velocity component off the right cushion, scaled by e', () => {
    const state = { e: 0.8, balls: [{ x: TABLE.w - BALL_R - 0.001, y: 17, vx: 20, vy: 0 }] };
    stepOnce(state);
    const b = state.balls[0]!;
    expect(b.x).toBeLessThanOrEqual(TABLE.w - BALL_R + 1e-9);
    expect(b.vx).toBeLessThan(0); // bounced back
  });

  it('keeps a ball center within the table bounds after many steps', () => {
    const state = { e: 1, balls: [{ x: 30, y: 17, vx: 55, vy: 37 }] };
    for (let i = 0; i < 2000; i++) stepOnce(state);
    const b = state.balls[0]!;
    expect(b.x).toBeGreaterThanOrEqual(BALL_R - 1e-6);
    expect(b.x).toBeLessThanOrEqual(TABLE.w - BALL_R + 1e-6);
    expect(b.y).toBeGreaterThanOrEqual(BALL_R - 1e-6);
    expect(b.y).toBeLessThanOrEqual(TABLE.h - BALL_R + 1e-6);
  });
});

describe('billiards-break stepOnce() ball-ball resolution', () => {
  it('separates an overlapping resting pair positionally without exploding their velocity', () => {
    const state = {
      e: 0.95,
      balls: [
        { x: 10, y: 17, vx: 0, vy: 0 },
        { x: 11.5, y: 17, vx: 0, vy: 0 }, // overlapping: dist 1.5 < 2*BALL_R
      ],
    };
    stepOnce(state);
    const dist = Math.hypot(state.balls[1]!.x - state.balls[0]!.x, state.balls[1]!.y - state.balls[0]!.y);
    expect(dist).toBeCloseTo(2 * BALL_R, 6);
    expect(state.balls[0]!.vx).toBe(0);
    expect(state.balls[1]!.vx).toBe(0);
  });

  it('is a pure function of its state argument', () => {
    const mk = () => ({
      e: 1,
      balls: [
        { x: 10, y: 17, vx: 8, vy: 0 },
        { x: 11.8, y: 17, vx: 0, vy: 0 },
      ],
    });
    const a = mk();
    const b = mk();
    stepOnce(a);
    stepOnce(b);
    expect(a).toEqual(b);
  });
});

describe('billiards-break rack layout', () => {
  it('racks the cue ball and 15 balls with no initial overlap', () => {
    const sim = createSim({});
    const { balls } = billiardsState(sim);
    expect(balls.length).toBe(16);
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const dist = Math.hypot(balls[j]!.x - balls[i]!.x, balls[j]!.y - balls[i]!.y);
        expect(dist).toBeGreaterThanOrEqual(2 * BALL_R - 1e-9);
      }
    }
  });

  it('the cue ball starts at (15, 17) at rest', () => {
    const sim = createSim({});
    const cue = billiardsState(sim).balls[0]!;
    expect(cue).toEqual({ x: 15, y: 17, vx: 0, vy: 0 });
  });

  it('all balls start at rest', () => {
    const sim = createSim({});
    for (const b of billiardsState(sim).balls) {
      expect(b.vx).toBe(0);
      expect(b.vy).toBe(0);
    }
  });
});

describe('billiards-break sim (drag-to-aim)', () => {
  it('drag-release shoots the cue ball with v = dragVector_world * 2.5, screen-up = +y', () => {
    const sim = createSim({});
    const cuePx = { x: 160, y: 200 }; // world (15,17) at VIEW 640x400, scale=640/60
    sim.onPointer!({ type: 'down', x: cuePx.x, y: cuePx.y, held: true }, VIEW);
    sim.onPointer!({ type: 'move', x: cuePx.x - 20, y: cuePx.y + 10, held: true }, VIEW);
    sim.onPointer!({ type: 'up', x: cuePx.x - 20, y: cuePx.y + 10, held: false }, VIEW);
    const cue = billiardsState(sim).balls[0]!;
    const scale = 640 / 60;
    expect(cue.vx).toBeCloseTo((-20 / scale) * 2.5, 6);
    expect(cue.vy).toBeCloseTo((-10 / scale) * 2.5, 6); // screen-down (positive dy) => -y world
  });

  it('caps the shot speed at 60', () => {
    const sim = createSim({});
    const cuePx = { x: 160, y: 200 };
    sim.onPointer!({ type: 'down', x: cuePx.x, y: cuePx.y, held: true }, VIEW);
    sim.onPointer!({ type: 'move', x: cuePx.x + 500, y: cuePx.y, held: true }, VIEW);
    sim.onPointer!({ type: 'up', x: cuePx.x + 500, y: cuePx.y, held: false }, VIEW);
    const cue = billiardsState(sim).balls[0]!;
    expect(Math.hypot(cue.vx, cue.vy)).toBeCloseTo(60, 6);
  });

  it('a pointer-down far from the cue ball does not start a drag', () => {
    const sim = createSim({});
    const before = billiardsState(sim);
    sim.onPointer!({ type: 'down', x: 400, y: 350, held: true }, VIEW);
    sim.onPointer!({ type: 'move', x: 450, y: 380, held: true }, VIEW);
    sim.onPointer!({ type: 'up', x: 450, y: 380, held: false }, VIEW);
    expect(billiardsState(sim)).toEqual(before);
  });

  it('cancel aborts the aim without shooting', () => {
    const sim = createSim({});
    const before = billiardsState(sim);
    const cuePx = { x: 160, y: 200 };
    sim.onPointer!({ type: 'down', x: cuePx.x, y: cuePx.y, held: true }, VIEW);
    sim.onPointer!({ type: 'move', x: cuePx.x - 20, y: cuePx.y + 10, held: true }, VIEW);
    sim.onPointer!({ type: 'cancel', x: cuePx.x - 20, y: cuePx.y + 10, held: false }, VIEW);
    expect(billiardsState(sim)).toEqual(before);
  });

  it('aiming is disabled while any ball moves', () => {
    const sim = createSim({});
    const cuePx = { x: 160, y: 200 };
    sim.onPointer!({ type: 'down', x: cuePx.x, y: cuePx.y, held: true }, VIEW);
    sim.onPointer!({ type: 'move', x: cuePx.x - 20, y: cuePx.y + 10, held: true }, VIEW);
    sim.onPointer!({ type: 'up', x: cuePx.x - 20, y: cuePx.y + 10, held: false }, VIEW);
    const afterShot = billiardsState(sim);
    // the cue is now moving; a fresh down-at-cue-position attempt must be ignored
    const redraw = sim.onPointer!({ type: 'down', x: cuePx.x, y: cuePx.y, held: true }, VIEW);
    expect(redraw).toBeFalsy();
    sim.onPointer!({ type: 'move', x: cuePx.x + 50, y: cuePx.y, held: true }, VIEW);
    sim.onPointer!({ type: 'up', x: cuePx.x + 50, y: cuePx.y, held: false }, VIEW);
    expect(billiardsState(sim)).toEqual(afterShot);
  });

  it('reset re-racks after a shot', () => {
    const sim = createSim({});
    const initial = billiardsState(sim);
    const cuePx = { x: 160, y: 200 };
    sim.onPointer!({ type: 'down', x: cuePx.x, y: cuePx.y, held: true }, VIEW);
    sim.onPointer!({ type: 'move', x: cuePx.x - 20, y: cuePx.y, held: true }, VIEW);
    sim.onPointer!({ type: 'up', x: cuePx.x - 20, y: cuePx.y, held: false }, VIEW);
    for (let i = 0; i < 300; i++) sim.advance(sim.dt);
    sim.reset();
    expect(billiardsState(sim)).toEqual(initial);
  });
});

describe('billiards-break determinism', () => {
  it('an identical break shot twice produces identical trajectories', () => {
    const fireBreak = (sim: ReturnType<typeof createSim>) => {
      const cuePx = { x: 160, y: 200 };
      sim.onPointer!({ type: 'down', x: cuePx.x, y: cuePx.y, held: true }, VIEW);
      sim.onPointer!({ type: 'move', x: cuePx.x + 60, y: cuePx.y, held: true }, VIEW);
      sim.onPointer!({ type: 'up', x: cuePx.x + 60, y: cuePx.y, held: false }, VIEW);
    };
    const simA = createSim({});
    const simB = createSim({});
    fireBreak(simA);
    fireBreak(simB);
    for (let i = 0; i < 3000; i++) {
      simA.advance(simA.dt);
      simB.advance(simB.dt);
    }
    expect(billiardsState(simA)).toEqual(billiardsState(simB));
  });
});
