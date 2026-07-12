import type { SimFactory } from './types';

export interface ParamSpec {
  key: string;
  label: string;
  /** discrete choices (rendered as a select) — required unless input: 'number' */
  values?: number[];
  initial: number;
  /** free numeric entry (rendered as <input type="number">) */
  input?: 'number';
  min?: number;
  max?: number;
  step?: number;
}

export const registry: Record<string, () => Promise<{ default: SimFactory; params?: ParamSpec[] }>> = {
  'pi-collisions': () => import('./pi-collisions'),
  '2d-motion': () => import('./2d-motion'),
  'gravitation-2point': () => import('./gravitation-2point'),
  'rope-oscillations-sim': () => import('./rope-oscillations-sim'),
  'yoyo-lab3': () => import('./yoyo-lab3'),
  'electric-field-array': () => import('./electric-field-array'),
  'orbit-sandbox': () => import('./orbit-sandbox'),
  'boids-flocking': () => import('./boids-flocking'),
};
