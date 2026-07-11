import { describe, it, expect } from 'vitest';
import { scaleToExtent } from './plot';

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
});
