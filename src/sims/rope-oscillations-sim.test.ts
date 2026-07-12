import { describe, it, expect } from 'vitest';
import createSim, { ropeState } from './rope-oscillations-sim';

describe('rope.oscillations physics', () => {
  it('starts with the left end at the peak of pulse 1 (A1) and the right end at the peak of pulse 2 (A2)', () => {
    // source.py's pre-loop init places pulse 1 (A1=5) centered at xMin and pulse 2
    // (A2=-10) centered at xMax; at t=0 the far pulse's Gaussian tail is 0 there.
    const sim = createSim({});
    const y = ropeState(sim);
    expect(y[0]).toBe(5);
    expect(y[y.length - 1]).toBe(-10);
  });

  it('ends swap amplitudes once the counter-propagating pulses have crossed the whole rope', () => {
    // Both pulses travel at the same wave speed v and start at opposite ends, so by
    // t = ropeLength/v (where source.py's while loop stops), pulse 1 has arrived at
    // the right end and pulse 2 has arrived at the left end.
    const sim = createSim({});
    for (let i = 0; i < 5_000; i++) sim.advance(sim.dt);
    expect(sim.done!()).toBe(true);
    const y = ropeState(sim);
    expect(y[0]).toBeCloseTo(-10, 2);
    expect(y[y.length - 1]).toBeCloseTo(5, 2);
    expect(Number.isFinite(y[0])).toBe(true);
    expect(Number.isFinite(y[y.length - 1])).toBe(true);
  });

  it('matches the closed-form two-pulse Gaussian superposition at an arbitrary mid-run time', () => {
    // Independent re-derivation of source.py's per-node formula (not a call into the
    // implementation) to guard against a regression drifting the whole rope shape.
    const sim = createSim({});
    const n = 1_500;
    for (let i = 0; i < n; i++) sim.advance(sim.dt);
    const y = ropeState(sim);
    const dt = 0.01;
    // Each step reads t from the step counter BEFORE incrementing it (matching
    // source.py's plot-then-advance order), so after n advances the rope reflects
    // t = (n-1)*dt, not n*dt.
    const t = (n - 1) * dt;
    const A1 = 5, A2 = -10;
    const k1 = (2 * Math.PI) / 60;
    const k2 = (2 * Math.PI) / 20;
    const v = Math.sqrt(10);
    const omega1 = k1 * v;
    const omega2 = k2 * v;
    const xMin = -50, xMax = 50;
    const closedFormAt = (x: number) => {
      const yPulse1 = A1 * Math.exp(-((k1 * (x - xMin) - omega1 * t) ** 2));
      const yPulse2 = A2 * Math.exp(-((k2 * (x - xMax) + omega2 * t) ** 2));
      return yPulse1 + yPulse2;
    };
    expect(y[0]).toBeCloseTo(closedFormAt(xMin), 9);
    expect(y[50]).toBeCloseTo(closedFormAt(0), 9);
    expect(y[100]).toBeCloseTo(closedFormAt(xMax), 9);
  });

  it('displacement stays bounded (no numerical explosion) over 50k steps', () => {
    const sim = createSim({});
    let maxAbs = 0;
    for (let i = 0; i < 50_000; i++) {
      sim.advance(sim.dt);
      for (const y of ropeState(sim)) maxAbs = Math.max(maxAbs, Math.abs(y));
    }
    const amplitude = 10; // |A2|, the larger of the two drive amplitudes in source.py
    expect(maxAbs).toBeLessThan(amplitude * 50);
    // The two Gaussian pulses barely overlap anywhere along the rope, so the true
    // peak never exceeds the larger single-pulse amplitude.
    expect(maxAbs).toBeLessThan(11);
  });

  it('is deterministic', () => {
    const a = createSim({}), b = createSim({});
    for (let i = 0; i < 2_000; i++) { a.advance(a.dt); b.advance(b.dt); }
    expect(ropeState(a)).toEqual(ropeState(b));
  });

  it('stops advancing once source.py\'s while-loop condition (t < ropeLength / v) is exhausted', () => {
    const sim = createSim({});
    for (let i = 0; i < 4_000; i++) sim.advance(sim.dt);
    expect(sim.done!()).toBe(true);
  });

  it('plots (t, v_y0) with pre/post-update pairing, matching source.py\'s initialVertPos/finalVertPos order', () => {
    const sim = createSim({});
    sim.advance(sim.dt);
    const points = sim.drainPlot!() ?? [];
    expect(points.length).toBe(1);
    // On the very first iteration, source.py's static pre-loop init already used the
    // t=0 formula, so initialVertPos and finalVertPos are computed from the identical
    // expression at t=0 and vY0 = (same - same) / dt = 0 exactly.
    expect(points[0].x).toBe(0);
    expect(points[0].y).toBe(0);
  });
});
