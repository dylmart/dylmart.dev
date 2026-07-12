export interface SimView { w: number; h: number; css: (name: string) => string }
export interface Sim2D {
  /** advance physics by dt seconds (fixed step, called 0..n times per frame) */
  advance(dt: number): void;
  /** draw current state; ctx is DPR-normalized, view gives CSS-var colors */
  draw(ctx: CanvasRenderingContext2D, view: SimView): void;
  /** true when the sim has reached a terminal state (host stops stepping) */
  done?(): boolean;
  /** streaming plot points emitted since last drain, or null if the sim has no plot */
  drainPlot?(): Array<{ x: number; y: number }> | null;
  reset(): void;
  /** physics step size in seconds, and how many real seconds one sim second takes */
  readonly dt: number;
  readonly plotLabel?: string;
  /** render the plot with equal x/y pixel scale (circles stay circular) */
  readonly plotEqualAspect?: boolean;
}
export type SimFactory = (params: Record<string, number>) => Sim2D;
