import { describe, it, expect } from 'vitest';
import createSim, { accelOn, orbitState } from './orbit-sandbox';

describe('orbit-sandbox physics', () => {
  it('circular orbit closes: probe returns to start after one period', () => {
    // r=12, v=sqrt(G*M/r): T = 2π·√(r³/(G·M)) = 2π·√(1728/10000) ≈ 2.6127 s
    const sim = createSim({});
    const start = orbitState(sim).probe;
    const T = 2 * Math.PI * Math.sqrt(Math.pow(12, 3) / (50 * 200));
    const steps = Math.round(T / 0.002);
    for (let i = 0; i < steps; i++) sim.advance(sim.dt);
    const end = orbitState(sim).probe;
    // semi-implicit Euler at dt=0.002: closure within 1% of the radius
    expect(Math.hypot(end.x - start.x, end.y - start.y)).toBeLessThan(0.12);
  });

  it('accelOn matches Newton for a single source', () => {
    const a = accelOn({ x: 10, y: 0 }, [{ x: 0, y: 0, m: 200 }]);
    expect(a.x).toBeCloseTo(-50 * 200 / 100, 9); // -G·M/r² toward origin
    expect(a.y).toBeCloseTo(0, 9);
  });

  it('is deterministic', () => {
    const simA = createSim({});
    const simB = createSim({});
    for (let i = 0; i < 2000; i++) {
      simA.advance(simA.dt);
      simB.advance(simB.dt);
    }
    expect(orbitState(simA)).toEqual(orbitState(simB));
  });

  it('accelOn applies the softening guard instead of dividing by zero', () => {
    const a = accelOn({ x: 0, y: 0 }, [{ x: 0, y: 0, m: 200 }]);
    expect(Number.isFinite(a.x)).toBe(true);
    expect(Number.isFinite(a.y)).toBe(true);
  });

  it('accelOn sums contributions from multiple sources', () => {
    const single1 = accelOn({ x: 5, y: 0 }, [{ x: 0, y: 0, m: 100 }]);
    const single2 = accelOn({ x: 5, y: 0 }, [{ x: 10, y: 0, m: 100 }]);
    const combined = accelOn({ x: 5, y: 0 }, [{ x: 0, y: 0, m: 100 }, { x: 10, y: 0, m: 100 }]);
    expect(combined.x).toBeCloseTo(single1.x + single2.x, 9);
    expect(combined.y).toBeCloseTo(single1.y + single2.y, 9);
  });

  it('reset restores the default circular-orbit probe and clears planets', () => {
    const sim = createSim({});
    for (let i = 0; i < 100; i++) sim.advance(sim.dt);
    sim.reset();
    const { probe, bodies } = orbitState(sim);
    expect(probe).toEqual({ x: 12, y: 0, vx: 0, vy: Math.sqrt((50 * 200) / 12), alive: true });
    expect(bodies).toEqual([]);
  });

  it('a dropped planet accelerates toward the sun', () => {
    const sim = createSim({});
    const view = { w: 640, h: 640, css: () => '' };
    // world (5, 0) maps to some px; drop there (far from the default probe at (12,0)).
    const px = { x: view.w / 2 + (5 / 40) * view.w, y: view.h / 2 };
    sim.onPointer!({ type: 'down', x: px.x, y: px.y, held: true }, view);
    sim.onPointer!({ type: 'up', x: px.x, y: px.y, held: false }, view);
    const before = orbitState(sim).bodies[0]!;
    expect(before.x).toBeCloseTo(5, 6);
    expect(before.vx).toBe(0);
    expect(before.vy).toBe(0);
    for (let i = 0; i < 50; i++) sim.advance(sim.dt);
    const after = orbitState(sim).bodies[0]!;
    // pulled toward the sun (x=0), so its x velocity should go negative
    expect(after.vx).toBeLessThan(0);
  });

  it('dropping more than 8 planets evicts the oldest', () => {
    const sim = createSim({});
    const view = { w: 640, h: 640, css: () => '' };
    for (let i = 0; i < 9; i++) {
      // spread drops out along +x so each lands far enough from the probe/sun
      const wx = 3 + i * 0.4;
      const px = view.w / 2 + (wx / 40) * view.w;
      sim.onPointer!({ type: 'down', x: px, y: view.h / 2 - 100, held: true }, view);
      sim.onPointer!({ type: 'up', x: px, y: view.h / 2 - 100, held: false }, view);
    }
    const { bodies } = orbitState(sim);
    expect(bodies.length).toBe(8);
    // the first drop (wx=3) should have been evicted; the last 8 remain
    expect(bodies[0]!.x).toBeCloseTo(3 + 1 * 0.4, 6);
  });

  it('drag-release flings the probe with v = dragVector_world * 3, screen-up = +y', () => {
    const sim = createSim({});
    const view = { w: 640, h: 640, css: () => '' };
    const probePx = { x: view.w / 2 + (12 / 40) * view.w, y: view.h / 2 };
    sim.onPointer!({ type: 'down', x: probePx.x, y: probePx.y, held: true }, view);
    sim.onPointer!({ type: 'move', x: probePx.x + 40, y: probePx.y - 20, held: true }, view);
    sim.onPointer!({ type: 'up', x: probePx.x + 40, y: probePx.y - 20, held: false }, view);
    const { probe } = orbitState(sim);
    const pxPerUnit = view.w / 40;
    expect(probe.vx).toBeCloseTo((40 / pxPerUnit) * 3, 6);
    expect(probe.vy).toBeCloseTo((20 / pxPerUnit) * 3, 6); // screen-up (negative dy) => +y world
  });

  it('cancel aborts the drag without flinging the probe', () => {
    const sim = createSim({});
    const view = { w: 640, h: 640, css: () => '' };
    const probePx = { x: view.w / 2 + (12 / 40) * view.w, y: view.h / 2 };
    const before = orbitState(sim).probe;
    sim.onPointer!({ type: 'down', x: probePx.x, y: probePx.y, held: true }, view);
    sim.onPointer!({ type: 'move', x: probePx.x + 40, y: probePx.y - 20, held: true }, view);
    sim.onPointer!({ type: 'cancel', x: probePx.x + 40, y: probePx.y - 20, held: false }, view);
    const after = orbitState(sim).probe;
    expect(after).toEqual(before);
  });

  it('probe crash freezes it (alive=false) while planets keep orbiting', () => {
    const sim = createSim({});
    const view = { w: 640, h: 640, css: () => '' };
    // Drop a planet just ahead of the probe on its circular path (far enough
    // in screen-px terms to register as a drop, not a drag on the probe): the
    // default probe starts at (12,0) moving +y along a radius-12 circle, so a
    // stationary planet at (12,2) sits almost on that path and gets swept.
    const wx = 12, wy = 2;
    const px = view.w / 2 + (wx / 40) * view.w;
    const py = view.h / 2 - (wy / 40) * view.h;
    sim.onPointer!({ type: 'down', x: px, y: py, held: true }, view);
    sim.onPointer!({ type: 'up', x: px, y: py, held: false }, view);
    for (let i = 0; i < 4000 && orbitState(sim).probe.alive; i++) sim.advance(sim.dt);
    expect(orbitState(sim).probe.alive).toBe(false);
    const frozen = orbitState(sim).probe;
    for (let i = 0; i < 100; i++) sim.advance(sim.dt);
    // probe stays frozen...
    expect(orbitState(sim).probe).toEqual(frozen);
    // ...but the planet (attracted by the sun) has kept moving.
    expect(orbitState(sim).bodies[0]!.vx !== 0 || orbitState(sim).bodies[0]!.vy !== 0).toBe(true);
  });

  it('drag on empty space LAUNCHES a planet with the drag vector (Dylan request)', () => {
    const sim = createSim({});
    const view = { w: 640, h: 640, css: () => '' };
    // press at world (-8, 0), drag +40px screen-x and -20px screen-y
    const px = view.w / 2 + (-8 / 40) * view.w;
    const py = view.h / 2;
    sim.onPointer!({ type: 'down', x: px, y: py, held: true }, view);
    sim.onPointer!({ type: 'move', x: px + 40, y: py - 20, held: true }, view);
    sim.onPointer!({ type: 'up', x: px + 40, y: py - 20, held: false }, view);
    const b = orbitState(sim).bodies[0]!;
    const pxPerUnit = view.w / 40;
    expect(b.x).toBeCloseTo(-8, 6); // spawns at the PRESS point, not the release point
    expect(b.vx).toBeCloseTo((40 / pxPerUnit) * 3, 6);
    expect(b.vy).toBeCloseTo((20 / pxPerUnit) * 3, 6); // screen-up => +y world
  });

  it('cancel aborts a planet-launch drag: no planet is spawned', () => {
    const sim = createSim({});
    const view = { w: 640, h: 640, css: () => '' };
    const px = view.w / 2 + (-8 / 40) * view.w;
    sim.onPointer!({ type: 'down', x: px, y: view.h / 2, held: true }, view);
    sim.onPointer!({ type: 'move', x: px + 60, y: view.h / 2, held: true }, view);
    sim.onPointer!({ type: 'cancel', x: px + 60, y: view.h / 2, held: false }, view);
    expect(orbitState(sim).bodies.length).toBe(0);
  });
});
