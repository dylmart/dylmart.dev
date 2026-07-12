import { describe, it, expect } from 'vitest';
import { FixedStepper, pointerStateReducer } from './host';

describe('pointer state reducer', () => {
  it('pointer reducer tracks held across down/move/up', () => {
    let held = false;
    held = pointerStateReducer('down', held);   // -> true
    expect(held).toBe(true);
    held = pointerStateReducer('move', held);   // unchanged
    expect(held).toBe(true);
    held = pointerStateReducer('up', held);     // -> false
    expect(held).toBe(false);
  });
});

describe('fixed timestep accumulator', () => {
  it('steps exactly floor(elapsed/dt) times and banks the remainder', () => {
    let n = 0;
    const s = new FixedStepper(0.01, () => n++);
    s.tick(0.035); // 3 steps, 0.005 banked
    expect(n).toBe(3);
    s.tick(0.005); // banked 0.005 + 0.005 = 1 step
    expect(n).toBe(4);
  });
  it('caps runaway frames at 120 steps', () => {
    let n = 0;
    const s = new FixedStepper(0.001, () => n++);
    s.tick(10); // would be 10000 steps
    expect(n).toBe(120);
  });
  it('speed multiplier scales elapsed time', () => {
    let n = 0;
    const s = new FixedStepper(0.01, () => n++);
    s.speed = 2;
    s.tick(0.05); // 0.1 sim-seconds -> 10 steps
    expect(n).toBe(10);
  });
});
