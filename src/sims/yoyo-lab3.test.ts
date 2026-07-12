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
      const { y, v } = yoyoState(sim);
      // Dylan extension: once the string is fully paid out the yoyo rebounds
      // and climbs (v turns positive), which is outside the "while unrolling"
      // scope this pin is about — stop before asserting monotonicity through
      // the climb too.
      if (v > 0) break;
      expect(y).toBeLessThanOrEqual(prev + 1e-12);
      prev = y;
    }
  });
  it('is deterministic', () => {
    const a = createSim({}), b = createSim({});
    for (let i = 0; i < 2_000; i++) { a.advance(a.dt); b.advance(b.dt); }
    expect(yoyoState(a)).toEqual(yoyoState(b));
  });

  // Dylan-requested extension: rather than freezing once the string is fully
  // unrolled (source.py's while-loop just exits with no bounce modeled), the
  // port rebounds and climbs back up, oscillating forever. This replaces the
  // old "advance past done is a no-op" terminal-state test, since that
  // freeze behavior is deliberately removed.
  it('rebounds at the end of the string and climbs back (Dylan extension)', () => {
    // Pinned depth the pre-rebound port reached right before it used to
    // freeze (measured against the base commit, before this extension).
    const OLD_PINNED_DEPTH = -1.3205423025664007;

    const sim = createSim({});
    const startY = yoyoState(sim).y;

    const STEPS_PER_CHUNK = 100;
    const CHUNKS = 20; // 20 sim-seconds: several full descend+climb periods
    let minY = Infinity;
    let minYT = 0;
    const samples: { t: number; y: number }[] = [];

    for (let c = 0; c < CHUNKS; c++) {
      for (let i = 0; i < STEPS_PER_CHUNK; i++) {
        sim.advance(sim.dt);
        const { y } = yoyoState(sim);
        const t = (c * STEPS_PER_CHUNK + i + 1) * sim.dt;
        samples.push({ t, y });
        if (y < minY) { minY = y; minYT = t; }
      }
    }

    // (a) the bottom of the swing matches the depth the old, pre-rebound
    // pinned run reached (within 1%).
    expect(Math.abs(minY - OLD_PINNED_DEPTH)).toBeLessThan(Math.abs(OLD_PINNED_DEPTH) * 0.01);

    // (b) 2 sim-seconds after the bottom, the yoyo is climbing (height above
    // the minimum), not frozen at it.
    const twoSecondsLater = samples.find((s) => s.t >= minYT + 2);
    expect(twoSecondsLater).toBeDefined();
    expect(twoSecondsLater!.y).toBeGreaterThan(minY);

    // (c) energy symmetry: after a full period the yoyo climbs back close to
    // the start height. The bottom flip is position-triggered (unrolled
    // clamped exactly to STRING_MAX_LENGTH) but the top flip is
    // velocity-triggered (omega <= 0, per the brief's model) without an
    // equivalent position snap, so a few percent of discretization slack
    // (DT=0.01 against the alpha-driven step size near the reversal) is
    // expected here, not a bug — 3% keeps this a meaningful regression check
    // without being flaky against that known, deterministic gap.
    const peakAfterClimb = samples
      .filter((s) => s.t > minYT)
      .reduce((m, s) => Math.max(m, s.y), -Infinity);
    expect(Math.abs(peakAfterClimb - startY)).toBeLessThan(Math.abs(minY) * 0.03);
  });
});
