import { describe, it, expect } from 'vitest';
import createSim, { stateOf } from './2d-motion';

describe('2d.motion physics', () => {
  it('matches the semi-implicit Euler closed form after 500 steps (t=5)', () => {
    const sim = createSim({});
    for (let i = 0; i < 500; i++) sim.advance(sim.dt);
    const { pos, t } = stateOf(sim);
    const n = 500, dt = 0.01;
    const closed = (p0: number, v0: number, a: number) => p0 + n * dt * v0 + a * dt * dt * (n * (n + 1) / 2);
    expect(t).toBeCloseTo(5, 9);
    expect(pos.x).toBeCloseTo(closed(0, 3, -3), 9);
    expect(pos.y).toBeCloseTo(closed(0, 5, 4), 9);
  });
  it('stops at t=5', () => {
    const sim = createSim({});
    for (let i = 0; i < 600; i++) sim.advance(sim.dt);
    expect(sim.done!()).toBe(true);
    expect(stateOf(sim).t).toBeCloseTo(5, 9);
  });
  it('plots (t, v.y) with pre-increment t, matching source.py plot-then-advance order', () => {
    const sim = createSim({});
    sim.advance(sim.dt);
    const points = sim.drainPlot!();
    expect(points.length).toBe(1);
    expect(points[0].x).toBeCloseTo(0, 9);
    expect(points[0].y).toBeCloseTo(5.04, 9);
  });
  it('last plotted point lands at t=4.99, one dt before the sim stops at t=5', () => {
    const sim = createSim({});
    const drained: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 600; i++) {
      sim.advance(sim.dt);
      drained.push(...sim.drainPlot!());
    }
    expect(sim.done!()).toBe(true);
    expect(drained.length).toBe(500);
    expect(drained[drained.length - 1].x).toBeCloseTo(4.99, 9);
  });
});
