import { DX, DZ, H, dirs } from '../../core/constants.js';

// Straight track: rails run from one side of the square to the opposite side.
export const STRAIGHT_LEN = 1;

export function straightRoutes(m) {
  const d = dirs(m);
  return [[d[0], d[1]]];
}

// Point at t (0..1) along the rails, entering from side a.
export function straightAt(p, a, t, out) {
  return out.set(p.x + 0.5 + DX[a] * (0.5 - t), p.l * H, p.z + 0.5 + DZ[a] * (0.5 - t));
}
