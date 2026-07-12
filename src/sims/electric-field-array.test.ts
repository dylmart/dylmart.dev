import { describe, it, expect } from 'vitest';
import createSim, { fieldAt, clampField, chargesOf } from './electric-field-array';

const CHARGES = [{ x: 0, y: 2, q: -1.0e-9 }, { x: 3, y: -2, q: 1.0e-9 }];

describe('electric-field-array physics (fieldAt / clampField)', () => {
  it('pins E at the origin against the hand-computed source.py value', () => {
    const E = fieldAt({ x: 0, y: 0 }, CHARGES);
    // E1 = k·q1·r1/|r1|³, r1 = (0,-2): (0, 2.2475); E2, r2 = (-3, 2), |r2|³ = 13^1.5
    expect(E.x).toBeCloseTo(-3 * 8.99 / Math.pow(13, 1.5), 9);
    expect(E.y).toBeCloseTo(2.2475 + 2 * 8.99 / Math.pow(13, 1.5), 9);
  });

  it('clamps to sat_lev preserving direction', () => {
    const c = clampField({ x: 3, y: 4 }, 1); // |E|=5 -> unit*(1)
    expect(c).toEqual({ x: 0.6, y: 0.8 });
  });

  it('coincident point yields zero vector (source db0 guard)', () => {
    expect(fieldAt({ x: 0, y: 2 }, CHARGES)).toEqual({ x: 0, y: 0 });
  });

  it('leaves a field below sat_lev unchanged (no clamping needed)', () => {
    const E = { x: 0.1, y: -0.2 };
    expect(clampField(E, 1)).toEqual(E);
  });

  it('handles a zero-magnitude field without producing NaN', () => {
    expect(clampField({ x: 0, y: 0 }, 1)).toEqual({ x: 0, y: 0 });
  });
});

describe('electric-field-array sim (static field, draggable charges)', () => {
  it('starts with the two original charges at their source.py positions', () => {
    const sim = createSim({});
    const charges = chargesOf(sim);
    expect(charges).toEqual([
      { x: 0, y: 2, q: -1.0e-9 },
      { x: 3, y: -2, q: 1.0e-9 },
    ]);
  });

  it('advance() is a no-op: the field is static', () => {
    const sim = createSim({});
    const before = chargesOf(sim);
    sim.advance(sim.dt);
    sim.advance(sim.dt);
    expect(chargesOf(sim)).toEqual(before);
  });

  it('dragging a charge (down near it, move, up) updates its world position', () => {
    const sim = createSim({});
    const view = { w: 400, h: 400, css: () => '#000' };
    // charge 1 sits at world (0,2) -> screen center (200,200), scale = 400/14
    const scale = 400 / 14;
    const chargePx = { x: 200, y: 200 - 2 * scale };
    sim.onPointer!({ type: 'down', x: chargePx.x, y: chargePx.y, held: true }, view);
    sim.onPointer!({ type: 'move', x: chargePx.x + scale, y: chargePx.y, held: true }, view);
    sim.onPointer!({ type: 'up', x: chargePx.x + scale, y: chargePx.y, held: false }, view);
    const charges = chargesOf(sim);
    expect(charges[0].x).toBeCloseTo(1, 6);
    expect(charges[0].y).toBeCloseTo(2, 6);
  });

  it('a pointer-down far from any charge grabs nothing (no-op move)', () => {
    const sim = createSim({});
    const view = { w: 400, h: 400, css: () => '#000' };
    const before = chargesOf(sim);
    sim.onPointer!({ type: 'down', x: 5, y: 5, held: true }, view);
    sim.onPointer!({ type: 'move', x: 300, y: 300, held: true }, view);
    sim.onPointer!({ type: 'up', x: 300, y: 300, held: false }, view);
    expect(chargesOf(sim)).toEqual(before);
  });

  it('reset() restores the two original charge positions after a drag', () => {
    const sim = createSim({});
    const view = { w: 400, h: 400, css: () => '#000' };
    const scale = 400 / 14;
    const chargePx = { x: 200, y: 200 - 2 * scale };
    sim.onPointer!({ type: 'down', x: chargePx.x, y: chargePx.y, held: true }, view);
    sim.onPointer!({ type: 'move', x: chargePx.x + scale * 2, y: chargePx.y, held: true }, view);
    sim.onPointer!({ type: 'up', x: chargePx.x + scale * 2, y: chargePx.y, held: false }, view);
    sim.reset();
    expect(chargesOf(sim)).toEqual([
      { x: 0, y: 2, q: -1.0e-9 },
      { x: 3, y: -2, q: 1.0e-9 },
    ]);
  });
});
