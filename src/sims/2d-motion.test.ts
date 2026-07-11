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
});
