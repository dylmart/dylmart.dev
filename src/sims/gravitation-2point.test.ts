import { describe, it, expect } from 'vitest';
import createSim, { diagnostics } from './gravitation-2point';

describe('Gravitation.2point physics', () => {
  it('conserves total momentum to machine precision over 10k steps', () => {
    const sim = createSim({});
    const p0 = diagnostics(sim).momentum;
    for (let i = 0; i < 10_000; i++) sim.advance(sim.dt);
    const p1 = diagnostics(sim).momentum;
    expect(Math.hypot(p1.x - p0.x, p1.y - p0.y)).toBeLessThan(1e-9 * (1 + Math.hypot(p0.x, p0.y)));
  });
  it('energy drift stays under 2% over 10k steps', () => {
    const sim = createSim({});
    const e0 = diagnostics(sim).energy;
    for (let i = 0; i < 10_000; i++) sim.advance(sim.dt);
    expect(Math.abs((diagnostics(sim).energy - e0) / e0)).toBeLessThan(0.02);
  });
  it('is deterministic', () => {
    const a = createSim({}), b = createSim({});
    for (let i = 0; i < 1_000; i++) { a.advance(a.dt); b.advance(b.dt); }
    expect(diagnostics(a)).toEqual(diagnostics(b));
  });
  it('plots (t, |r|) with pre-update pairing, matching source.py plot order', () => {
    const sim = createSim({});
    sim.advance(sim.dt);
    const points = sim.drainPlot!() ?? [];
    expect(points.length).toBe(1);
    expect(points[0].x).toBeCloseTo(0, 9);
    expect(points[0].y).toBeCloseTo(10, 9);
  });
});
