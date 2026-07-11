import { describe, it, expect } from 'vitest';
import createSim, { yoyoState } from './yoyo-lab3';

describe('yoyo.lab3 physics', () => {
  it('rolling constraint |v| = omega * R holds every 100 steps', () => {
    const sim = createSim({});
    for (let i = 0; i < 10_000; i++) {
      sim.advance(sim.dt);
      if (i % 100 === 0) {
        const { v, omega, R } = yoyoState(sim);
        expect(Math.abs(Math.abs(v) - Math.abs(omega) * R)).toBeLessThan(1e-6 * (1 + Math.abs(v)));
      }
    }
  });
  it('descends: height is monotonically non-increasing while unrolling', () => {
    const sim = createSim({});
    let prev = yoyoState(sim).y;
    for (let i = 0; i < 5_000; i++) {
      sim.advance(sim.dt);
      const { y } = yoyoState(sim);
      expect(y).toBeLessThanOrEqual(prev + 1e-12);
      prev = y;
    }
  });
  it('is deterministic', () => {
    const a = createSim({}), b = createSim({});
    for (let i = 0; i < 2_000; i++) { a.advance(a.dt); b.advance(b.dt); }
    expect(yoyoState(a)).toEqual(yoyoState(b));
  });
});
