import { describe, it, expect } from 'vitest';
import { scaleToExtent, appendCapped, PLOT_BUFFER_CAP, type PlotPoint } from './plot';

describe('plot scaling', () => {
  it('maps data extent onto pixel area with padding', () => {
    const s = scaleToExtent([{ x: 0, y: 0 }, { x: 10, y: 5 }], 200, 100, 10);
    expect(s.toPx({ x: 0, y: 0 })).toEqual({ px: 10, py: 90 });   // y axis flipped
    expect(s.toPx({ x: 10, y: 5 })).toEqual({ px: 190, py: 10 });
  });
  it('degenerate extent (single point) does not divide by zero', () => {
    const s = scaleToExtent([{ x: 3, y: 3 }], 200, 100, 10);
    const p = s.toPx({ x: 3, y: 3 });
    expect(Number.isFinite(p.px) && Number.isFinite(p.py)).toBe(true);
  });
  it('equalAspect uses one scale for both axes so circles stay circular', () => {
    // Points on a radius-5 circle in data space, drawn into a wide 200x100 box.
    const circle = [
      { x: -5, y: 0 }, { x: 5, y: 0 }, { x: 0, y: -5 }, { x: 0, y: 5 },
    ];
    const s = scaleToExtent(circle, 200, 100, 10, true);
    const right = s.toPx({ x: 5, y: 0 });
    const left = s.toPx({ x: -5, y: 0 });
    const top = s.toPx({ x: 0, y: 5 });
    const bottom = s.toPx({ x: 0, y: -5 });
    // Equal px-per-unit both axes: horizontal and vertical diameters render equal.
    expect(right.px - left.px).toBeCloseTo(bottom.py - top.py, 9);
    // Centered in the box, y flipped.
    expect((right.px + left.px) / 2).toBeCloseTo(100, 9);
    expect((top.py + bottom.py) / 2).toBeCloseTo(50, 9);
    expect(top.py).toBeLessThan(bottom.py);
    // Constrained by the short (height) dimension: 10 data units into 80px.
    expect(bottom.py - top.py).toBeCloseTo(80, 9);
  });
  it('without equalAspect the same circle stretches to fill the box (regression contrast)', () => {
    const circle = [
      { x: -5, y: 0 }, { x: 5, y: 0 }, { x: 0, y: -5 }, { x: 0, y: 5 },
    ];
    const s = scaleToExtent(circle, 200, 100, 10);
    const right = s.toPx({ x: 5, y: 0 });
    const left = s.toPx({ x: -5, y: 0 });
    const top = s.toPx({ x: 0, y: 5 });
    const bottom = s.toPx({ x: 0, y: -5 });
    expect(right.px - left.px).toBe(180);   // stretched wide
    expect(bottom.py - top.py).toBe(80);    // vs squat: the ellipse Dylan saw
  });
});

describe('plot buffer cap (appendCapped)', () => {
  it('caps a single large batch append at PLOT_BUFFER_CAP, keeping only the newest points', () => {
    const buf: PlotPoint[] = [];
    const total = PLOT_BUFFER_CAP + 500;
    const points = Array.from({ length: total }, (_, i) => ({ x: i, y: i }));
    appendCapped(buf, points, PLOT_BUFFER_CAP);
    expect(buf.length).toBe(PLOT_BUFFER_CAP);
    expect(buf[0]).toEqual({ x: total - PLOT_BUFFER_CAP, y: total - PLOT_BUFFER_CAP }); // oldest surviving point
    expect(buf[buf.length - 1]).toEqual({ x: total - 1, y: total - 1 }); // newest point kept
  });

  it('caps across many repeated single-point appends (simulates an orbit sim that never terminates)', () => {
    const buf: PlotPoint[] = [];
    const total = PLOT_BUFFER_CAP + 500;
    for (let i = 0; i < total; i++) {
      appendCapped(buf, [{ x: i, y: i }], PLOT_BUFFER_CAP);
    }
    expect(buf.length).toBe(PLOT_BUFFER_CAP);
    expect(buf[0].x).toBe(total - PLOT_BUFFER_CAP);
    expect(buf[buf.length - 1].x).toBe(total - 1);
  });

  it('does not touch the buffer when the additions batch is empty', () => {
    const buf: PlotPoint[] = [{ x: 1, y: 1 }];
    appendCapped(buf, [], PLOT_BUFFER_CAP);
    expect(buf).toEqual([{ x: 1, y: 1 }]);
  });
});
