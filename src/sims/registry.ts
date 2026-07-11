import type { SimFactory } from './types';

export interface ParamSpec { key: string; label: string; values: number[]; initial: number }

export const registry: Record<string, () => Promise<{ default: SimFactory; params?: ParamSpec[] }>> = {
  // port tasks add entries here, e.g.:
  // 'pi-collisions': () => import('./pi-collisions'),
};
