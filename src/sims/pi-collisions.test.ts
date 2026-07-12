import { describe, it, expect } from 'vitest';
import createSim, { runToCompletion } from './pi-collisions';

describe('PiCollisions physics', () => {
  it('mass ratio 100 -> 31 collisions (digits of pi)', () => {
    expect(runToCompletion(100)).toBe(31);
  });
  it('mass ratio 10000 -> 314 collisions', () => {
    expect(runToCompletion(10_000)).toBe(314);
  });
  it('plots in energy-circle coordinates (√m2·v2, √m1·v1) with pre-collision velocities', () => {
    // n=1 → m2=100. First block-block collision: captured pre-collision
    // velocities are b1vx=0, b2vx=-10 → point (√100·-10, √1·0) = (-100, 0).
    const sim = createSim({ massExp: 1 });
    let points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 20_000_000 && points.length === 0 && !sim.done!(); i++) {
      sim.advance(sim.dt);
      points = sim.drainPlot!() ?? [];
    }
    expect(points.length).toBeGreaterThan(0);
    expect(points[0].x).toBeCloseTo(-100, 9);
    expect(points[0].y).toBeCloseTo(0, 9);
  });
  it('terminates: advance() past done() is a no-op', () => {
    const sim = createSim({ massExp: 1 });
    for (let i = 0; i < 20_000_000 && !sim.done!(); i++) sim.advance(sim.dt);
    expect(sim.done!()).toBe(true);
    const before = JSON.stringify(sim);
    sim.advance(sim.dt);
    expect(JSON.stringify(sim)).toBe(before);
  });
});
