import { DX, DZ, H, MAXL, opp, key, inBoard } from '../../core/constants.js';
import { COL } from '../../core/colors.js';
import { addPost } from '../supports.js';

// Ramp: two squares long, climbs one level. End 0 is the low end, end 1 the high end.

export function rampPort(p, end) {
  return end === 0
    ? { x: p.x, z: p.z, d: opp(p.dir), l: p.l }
    : { x: p.x + DX[p.dir], z: p.z + DZ[p.dir], d: p.dir, l: p.l + 1 };
}

// A ramp fills both of its squares on both of the levels it joins.
export function rampKeys(r) {
  const x2 = r.x + DX[r.dir], z2 = r.z + DZ[r.dir];
  return [key(r.x, r.z, r.l), key(r.x, r.z, r.l + 1), key(x2, z2, r.l), key(x2, z2, r.l + 1)];
}

export function rampFits(r, occ) {
  if (r.l < 0 || r.l + 1 > MAXL) return false;
  if (!inBoard(r.x, r.z) || !inBoard(r.x + DX[r.dir], r.z + DZ[r.dir])) return false;
  return rampKeys(r).every(k => !occ.has(k));
}

// Point at t (0..1) along the rails, entering from end a. The climb eases in and out.
export function rampAt(p, a, t, out) {
  const u = a === 0 ? t : 1 - t, d = p.dir, e = u * u * (3 - 2 * u);
  return out.set(p.x + 0.5 - 0.5 * DX[d] + DX[d] * 2 * u, (p.l + e) * H, p.z + 0.5 - 0.5 * DZ[d] + DZ[d] * 2 * u);
}

export function drawRampSupports(gb, p) {
  const d = p.dir, lx = -DZ[d], lz = DX[d], sx = p.x + 0.5 - 0.5 * DX[d], sz = p.z + 0.5 - 0.5 * DZ[d];
  for (let j = 0; j <= 2; j++) {
    const u = j / 2, y = (p.l + u * u * (3 - 2 * u)) * H;
    if (y < 0.12) continue;
    const px = sx + DX[d] * j, pz = sz + DZ[d] * j, top = y - 0.035;
    addPost(gb, px + lx * 0.5, pz + lz * 0.5, top);
    addPost(gb, px - lx * 0.5, pz - lz * 0.5, top);
    gb.box(px, top - 0.025, pz, lx ? 1 : 0.05, 0.05, lz ? 1 : 0.05, COL.post);
  }
}
