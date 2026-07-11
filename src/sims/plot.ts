export interface PlotPoint { x: number; y: number }

export function scaleToExtent(points: PlotPoint[], w: number, h: number, pad: number) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  return {
    toPx(p: PlotPoint) {
      return {
        px: pad + ((p.x - minX) / spanX) * (w - 2 * pad),
        py: h - pad - ((p.y - minY) / spanY) * (h - 2 * pad),
      };
    },
  };
}

export function createPlot(canvas: HTMLCanvasElement, opts: { title: string }) {
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
    const s = scaleToExtent(pts, w, h, 18);
    ctx.strokeStyle = css('--accent'); ctx.lineWidth = 1.5;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const { px, py } = s.toPx(p);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();
  }
  return {
    push(p: PlotPoint) { pts.push(p); redraw(); },
    reset() { pts.length = 0; redraw(); },
  };
}
