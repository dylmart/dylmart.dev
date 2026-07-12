import { describe, it, expect } from 'vitest';
import createSim, { stepFlock, flockState, perceives } from './boids-flocking';

const MIN_SPEED = 8;
const MAX_SPEED = 24;
const DT = 1 / 60;

describe('boids-flocking physics', () => {
  it('is deterministic for a seed', () => {
    const simA = createSim({});
    const simB = createSim({});
    for (let i = 0; i < 600; i++) {
      simA.advance(simA.dt);
      simB.advance(simB.dt);
    }
    expect(flockState(simA)).toEqual(flockState(simB));
  });

  it('different seeds produce different flocks', () => {
    const simA = createSim({ seed: 1337 });
    const simB = createSim({ seed: 7 });
    for (let i = 0; i < 60; i++) {
      simA.advance(simA.dt);
      simB.advance(simB.dt);
    }
    expect(flockState(simA)).not.toEqual(flockState(simB));
  });

  it('respects the speed range every step (floor and clamp)', () => {
    const sim = createSim({});
    for (let i = 0; i < 600; i++) {
      sim.advance(sim.dt);
      for (const b of flockState(sim).boids) {
        const speed = Math.hypot(b.vx, b.vy);
        expect(speed).toBeGreaterThanOrEqual(MIN_SPEED - 1e-9);
        expect(speed).toBeLessThanOrEqual(MAX_SPEED + 1e-9);
      }
    }
  });

  it('stays in the world (toroidal wrap)', () => {
    const sim = createSim({});
    for (let i = 0; i < 1000; i++) sim.advance(sim.dt);
    for (const b of flockState(sim).boids) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThan(100);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeLessThan(100);
    }
  });

  it('reset restores the seeded initial flock', () => {
    const sim = createSim({ seed: 42 });
    const initial = flockState(sim);
    for (let i = 0; i < 100; i++) sim.advance(sim.dt);
    sim.reset();
    expect(flockState(sim)).toEqual(initial);
  });

  it('a held pointer sets the predator; move updates it while held', () => {
    const sim = createSim({});
    const view = { w: 500, h: 500, css: () => '' };
    expect(flockState(sim).predator).toBeNull();
    sim.onPointer!({ type: 'down', x: 250, y: 250, held: true }, view);
    expect(flockState(sim).predator).toEqual({ x: 50, y: 50 });
    sim.onPointer!({ type: 'move', x: 300, y: 300, held: true }, view);
    expect(flockState(sim).predator).toEqual({ x: 60, y: 60 });
  });

  it('releasing the pointer clears the predator', () => {
    const sim = createSim({});
    const view = { w: 500, h: 500, css: () => '' };
    sim.onPointer!({ type: 'down', x: 250, y: 250, held: true }, view);
    sim.onPointer!({ type: 'up', x: 250, y: 250, held: false }, view);
    expect(flockState(sim).predator).toBeNull();
  });

  it('cancel also clears the predator', () => {
    const sim = createSim({});
    const view = { w: 500, h: 500, css: () => '' };
    sim.onPointer!({ type: 'down', x: 250, y: 250, held: true }, view);
    expect(flockState(sim).predator).not.toBeNull();
    sim.onPointer!({ type: 'cancel', x: 250, y: 250, held: false }, view);
    expect(flockState(sim).predator).toBeNull();
  });

  it('a pointer move without a preceding down (held=false) does not set the predator', () => {
    const sim = createSim({});
    const view = { w: 500, h: 500, css: () => '' };
    sim.onPointer!({ type: 'move', x: 250, y: 250, held: false }, view);
    expect(flockState(sim).predator).toBeNull();
  });

  it('stepFlock is a pure function of its state argument', () => {
    // Velocities are kept well clear of MIN_SPEED (8) and MAX_SPEED (24) so
    // this pin isolates the separation direction from the speed clamps.
    const mkState = () => ({
      boids: [
        { x: 10, y: 10, vx: 15, vy: 0, phase: 0 },
        { x: 12, y: 10, vx: -15, vy: 0, phase: 0 },
      ],
      predator: null,
      t: 0,
      hawkChords: [],
      hawk: null,
    });
    const a = mkState();
    const b = mkState();
    stepFlock(a);
    stepFlock(b);
    expect(a).toEqual(b);
    // the pair is close (within SEP_R) and moving toward each other, so
    // separation should push them apart in x this step.
    expect(a.boids[0]!.vx).toBeLessThan(15);
    expect(a.boids[1]!.vx).toBeGreaterThan(-15);
  });

  describe('perceives (field of view)', () => {
    // boid A at (50,50) heading +x (velocity along +x)
    const a = { x: 50, y: 50, vx: 1, vy: 0, phase: 0 };

    it('does not perceive a neighbor directly behind (rear 60deg blind cone)', () => {
      const behind = { x: 45, y: 50, vx: 0, vy: 0, phase: 0 };
      expect(perceives(a, behind)).toBe(false);
    });

    it('perceives a neighbor directly ahead', () => {
      const ahead = { x: 55, y: 50, vx: 0, vy: 0, phase: 0 };
      expect(perceives(a, ahead)).toBe(true);
    });

    it('perceives a neighbor abeam (90deg < 150deg cutoff)', () => {
      const abeam = { x: 50, y: 55, vx: 0, vy: 0, phase: 0 };
      expect(perceives(a, abeam)).toBe(true);
    });
  });

  describe('hawk cadence', () => {
    it('gives the flock a calm first period (no hawk before t=9s)', () => {
      const sim = createSim({});
      const steps = Math.round(0.5 / DT);
      for (let i = 0; i < steps; i++) sim.advance(sim.dt);
      expect(flockState(sim).hawk).toBeNull();
    });

    it('is active mid-flight and gone after the flight window elapses', () => {
      const sim = createSim({});
      const steps95 = Math.round(9.5 / DT);
      for (let i = 0; i < steps95; i++) sim.advance(sim.dt);
      expect(flockState(sim).hawk).not.toBeNull();

      const steps135 = Math.round(13.5 / DT) - steps95;
      for (let i = 0; i < steps135; i++) sim.advance(sim.dt);
      expect(flockState(sim).hawk).toBeNull();
    });
  });
});
