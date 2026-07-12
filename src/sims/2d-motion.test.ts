import { describe, it, expect } from 'vitest';
import createSim, { stateOf, closedFormPos, aimFromDrag } from './2d-motion';

describe('2d.motion physics', () => {
  it('matches the semi-implicit Euler closed form after 500 steps (t=5)', () => {
    const sim = createSim({});
    for (let i = 0; i < 500; i++) sim.advance(sim.dt);
    const { pos, t } = stateOf(sim);
    const n = 500, dt = 0.01;
    expect(t).toBeCloseTo(5, 9);
    expect(pos.x).toBeCloseTo(closedFormPos(0, 3, -3, n, dt), 9);
    expect(pos.y).toBeCloseTo(closedFormPos(0, 5, 4, n, dt), 9);
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
    const points = sim.drainPlot!() ?? [];
    expect(points.length).toBe(1);
    expect(points[0].x).toBeCloseTo(0, 9);
    expect(points[0].y).toBeCloseTo(5.04, 9);
  });
  it('last plotted point lands at t=4.99, one dt before the sim stops at t=5', () => {
    const sim = createSim({});
    const drained: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 600; i++) {
      sim.advance(sim.dt);
      drained.push(...(sim.drainPlot!() ?? []));
    }
    expect(sim.done!()).toBe(true);
    expect(drained.length).toBe(500);
    expect(drained[drained.length - 1].x).toBeCloseTo(4.99, 9);
  });
  it('params default to the original constants (pins stay valid)', () => {
    const sim = createSim({});           // no params -> original behavior
    const sim2 = createSim({ v0x: 3, v0y: 5, ay: 4 });
    for (let i = 0; i < 100; i++) { sim.advance(sim.dt); sim2.advance(sim2.dt); }
    expect(stateOf(sim2).pos).toEqual(stateOf(sim).pos);
  });
  it('drag-to-aim sets v0 from the drag vector and resets the run', () => {
    const sim = createSim({});
    // drag from ball screen pos to +40px right, -80px up at 10 px/world-unit
    // (aimFromDrag is the exported pure helper; scale = pxPerUnit, y flipped)
    expect(aimFromDrag({ dx: 40, dy: -80 }, 10)).toEqual({ v0x: 4, v0y: 8 });
  });
});
