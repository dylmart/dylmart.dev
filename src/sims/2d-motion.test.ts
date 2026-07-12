import { describe, it, expect } from 'vitest';
import createSim, { stateOf, closedFormPos, aimFromDrag } from './2d-motion';

const DT = 0.01;

/**
 * The exact step count at which the ball's y position first drops to or
 * below the ground (y=0), derived from the SAME closed-form sum stepOnce()
 * accumulates (closedFormPos), so this is never a magic number: it's the
 * first n > 0 where n·dt·v0y + ay·dt²·n·(n+1)/2 <= 0.
 */
function landingStep(v0y: number, ay: number, dt: number): number {
  let n = 1;
  while (closedFormPos(0, v0y, ay, n, dt) > 0) n++;
  return n;
}

describe('2d.motion physics', () => {
  it('lands and freezes exactly where the closed form predicts (ground stop)', () => {
    const v0x = 3, v0y = 5, ay = -9.8;
    const n = landingStep(v0y, ay, DT);
    expect(n).toBe(102);

    const sim = createSim({});
    for (let i = 0; i < n + 10 && !sim.done!(); i++) sim.advance(sim.dt);

    expect(sim.done!()).toBe(true);
    const { pos, t } = stateOf(sim);
    expect(t).toBeCloseTo(n * DT, 9);
    expect(pos.x).toBeCloseTo(v0x * n * DT, 9);
    expect(pos.y).toBeLessThanOrEqual(0);
  });

  it('stays frozen after landing (advance is a no-op once done)', () => {
    const sim = createSim({});
    for (let i = 0; i < 120 && !sim.done!(); i++) sim.advance(sim.dt);
    expect(sim.done!()).toBe(true);
    const before = JSON.stringify(stateOf(sim));
    for (let i = 0; i < 50; i++) sim.advance(sim.dt);
    expect(JSON.stringify(stateOf(sim))).toBe(before);
  });

  it('safety cap: an upward acceleration that never lands stops at t=5 exactly', () => {
    const sim = createSim({ ay: 4 });
    for (let i = 0; i < 499; i++) {
      sim.advance(sim.dt);
      expect(sim.done!()).toBe(false);
    }
    sim.advance(sim.dt); // 500th step
    expect(sim.done!()).toBe(true);
    expect(stateOf(sim).t).toBeCloseTo(5, 9);
  });

  it('plots (t, v.y) with pre-increment t, and the plot queue drains exactly to the landing step', () => {
    const v0y = 5, ay = -9.8;
    const n = landingStep(v0y, ay, DT);

    const sim = createSim({});
    const drained: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < n + 10 && !sim.done!(); i++) {
      sim.advance(sim.dt);
      drained.push(...(sim.drainPlot!() ?? []));
    }
    expect(sim.done!()).toBe(true);

    expect(drained.length).toBe(n);
    expect(drained[0]!.x).toBeCloseTo(0, 9);
    expect(drained[0]!.y).toBeCloseTo(v0y + ay * DT, 9); // 4.902
    expect(drained[drained.length - 1]!.x).toBeCloseTo((n - 1) * DT, 9); // 1.01
  });

  it('params default to the original constants (pins stay valid)', () => {
    const sim = createSim({}); // no params -> defaults (v0x=3, v0y=5, ay=-9.8)
    const sim2 = createSim({ v0x: 3, v0y: 5, ay: -9.8 });
    // 50 steps stays well short of the n=102 landing step for these values.
    for (let i = 0; i < 50; i++) { sim.advance(sim.dt); sim2.advance(sim2.dt); }
    expect(stateOf(sim2).pos).toEqual(stateOf(sim).pos);
  });

  it('drag-to-aim sets v0 from the drag vector and resets the run', () => {
    // drag from ball screen pos to +40px right, -80px up at 10 px/world-unit
    // (aimFromDrag is the exported pure helper; scale = pxPerUnit, y flipped)
    expect(aimFromDrag({ dx: 40, dy: -80 }, 10)).toEqual({ v0x: 4, v0y: 8 });
  });

  it('non-default params change the trajectory (params are actually wired)', () => {
    const simA = createSim({});
    const simB = createSim({ v0y: 8 });
    const n = 90; // short of both sims' landing steps (102 and 163 respectively)
    for (let i = 0; i < n; i++) {
      simA.advance(simA.dt);
      simB.advance(simB.dt);
    }
    const stateA = stateOf(simA);
    const stateB = stateOf(simB);

    // (a) simB's y position should be greater than simA's (greater initial velocity)
    expect(stateB.pos.y).toBeGreaterThan(stateA.pos.y);

    // (b) simB's position matches closed form with v0y=8, ay=-9.8 to 9 decimal places
    expect(stateB.pos.y).toBeCloseTo(closedFormPos(0, 8, -9.8, n, DT), 9);

    // x positions are identical (same v0x and ax across both)
    expect(stateB.pos.x).toBeCloseTo(stateA.pos.x, 9);
  });
});
