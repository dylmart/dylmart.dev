import type { SimFactory } from './types';

export interface ParamSpec { key: string; label: string; values: number[]; initial: number }

export const registry: Record<string, () => Promise<{ default: SimFactory; params?: ParamSpec[] }>> = {
  'pi-collisions': () => import('./pi-collisions'),
  // remaining port tasks add entries here, e.g.:
  // '2d-motion': () => import('./2d-motion'),
};
