import { DX, DZ, H, dirs } from '../../core/constants.js';

// Curved track: a quarter circle joining two neighbouring sides of the square.
export const CURVE_LEN = Math.PI / 4;

export function curveRoutes(m) {
  const d = dirs(m);
  return [[d[0], d[1]]];
}

// Point at t (0..1) along the rails, entering from side a and leaving by side b.
export function curveAt(p, a, b, t, out) {
  const cx = p.x + 0.5, cz = p.z + 0.5, ax = DX[a], az = DZ[a], bx = DX[b], bz = DZ[b];
  const th = t * Math.PI / 2, c = Math.cos(th) * 0.5, s = Math.sin(th) * 0.5;
  return out.set(cx + 0.5 * ax + 0.5 * bx - bx * c - ax * s, p.l * H, cz + 0.5 * az + 0.5 * bz - bz * c - az * s);
}
