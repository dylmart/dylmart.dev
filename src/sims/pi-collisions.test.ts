import { describe, it, expect } from 'vitest';
import createSim, { runToCompletion } from './pi-collisions';

describe('PiCollisions physics', () => {
  it('mass ratio 100 -> 31 collisions (digits of pi)', () => {
    expect(runToCompletion(100)).toBe(31);
  });
  it('mass ratio 10000 -> 314 collisions', () => {
    expect(runToCompletion(10_000)).toBe(314);
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
