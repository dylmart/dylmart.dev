export interface PlotPoint { x: number; y: number }

/** Max points retained in a plot's rolling buffer (matches the sims' own drain-queue caps). */
export const PLOT_BUFFER_CAP = 4000;

/**
 * Appends `additions` to `buf` in place, then drops the oldest entries beyond `cap`.
 * Pure buffer-management logic pulled out of createPlot so it's testable without a
 * canvas/DOM (vitest has no jsdom here).
 */
export function appendCapped<T>(buf: T[], additions: readonly T[], cap: number): T[] {
  for (const a of additions) buf.push(a);
  if (buf.length > cap) buf.splice(0, buf.length - cap);
  return buf;
}

export function scaleToExtent(points: PlotPoint[], w: number, h: number, pad: number, equalAspect = false) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  if (equalAspect) {
    // One px-per-unit scale for both axes, data centered in the box: a circle
    // in data space renders as a circle on screen (letterboxed, not stretched).
    const scale = Math.min((w - 2 * pad) / spanX, (h - 2 * pad) / spanY);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return {
      toPx(p: PlotPoint) {
        return {
          px: w / 2 + (p.x - cx) * scale,
          py: h / 2 - (p.y - cy) * scale,
        };
      },
    };
  }
  return {
    toPx(p: PlotPoint) {
      return {
        px: pad + ((p.x - minX) / spanX) * (w - 2 * pad),
        py: h - pad - ((p.y - minY) / spanY) * (h - 2 * pad),
      };
    },
  };
}

export function createPlot(canvas: HTMLCanvasElement, opts: { title: string; equalAspect?: boolean }) {
  const ctx = canvas.getContext('2d')!;
  const pts: PlotPoint[] = [];
  const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function redraw() {
    const { width: w, height: h } = canvas;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = css('--neutral'); ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    ctx.fillStyle = css('--text-dim');
    ctx.font = '10px "Space Mono", monospace';
    ctx.fillText(opts.title.toUpperCase(), 8, 14);
    if (pts.length < 2) return;
    const s = scaleToExtent(pts, w, h, 18, opts.equalAspect ?? false);
    ctx.strokeStyle = css('--accent'); ctx.lineWidth = 1.5;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const { px, py } = s.toPx(p);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();
  }
  return {
    push(p: PlotPoint) { appendCapped(pts, [p], PLOT_BUFFER_CAP); redraw(); },
    /** Append a whole drained batch and redraw once (avoids O(n) redraws per frame). */
    pushAll(points: PlotPoint[]) {
      if (points.length === 0) return;
      appendCapped(pts, points, PLOT_BUFFER_CAP);
      redraw();
    },
    reset() { pts.length = 0; redraw(); },
  };
}
