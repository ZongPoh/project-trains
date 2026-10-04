import { DX, DZ, key, dirs } from '../core/constants.js';
import { C } from '../core/colors.js';
import { occ, eff } from '../tracks/model.js';
import { isHill } from './model.js';
import { SNOW } from '../scenery/seasons.js';

// Hills. The hill squares the player paints become one low-poly landform: a faceted surface
// that starts at tunnel height along the edge and rises towards the middle, so a wide hill
// grows into a small mountain with a rocky top. Round the outside a short slope runs down to
// the ground. A square with ground-level track in it is hollow underneath, so trains really
// run inside; the stonework round each tunnel mouth is drawn by tracks/features/tunnel.js.
const BASE = 0.62;               // height of the hill along its edge, enough to cover a train
const BORE = 0.5;                // height of the tunnel inside
const SUB = 3;                   // each square is cut into SUB x SUB facets
const SKIRT = 0.3;               // how far the outer slope reaches into the next square
const ROCK = C('#8d8a7b'), ROCK2 = C('#77756a'), CLIFF = C('#9a9686'), PINE = C('#2f5d3a'), TRUNK = C('#4a372c');
const WALL = C('#16191d'), LAMP = C('#ffd98a');

// The ground-level track in a hill square, if any.
const tunnelPiece = (x, z) => { const p = occ.get(key(x, z, 0)); return p && p.type === 'flat' ? p : null; };
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

// How far a point is from the nearest ground that is not hill, in squares.
function depth(vx, vz) {
  let best = 3.5;
  const x0 = Math.floor(vx), z0 = Math.floor(vz);
  for (let x = x0 - 4; x <= x0 + 4; x++) for (let z = z0 - 4; z <= z0 + 4; z++) {
    if (isHill(x, z)) continue;
    const dx = Math.max(x - vx, 0, vx - (x + 1)), dz = Math.max(z - vz, 0, vz - (z + 1));
    best = Math.min(best, Math.hypot(dx, dz));
  }
  return best;
}
// Height of the hill surface at a point: flat along the edge, climbing inwards, a little rough.
export function heightAt(vx, vz) {
  const d = depth(vx, vz);
  return BASE + 0.5 * Math.pow(d, 1.25) + (hash(vx, vz) - 0.5) * 0.2 * Math.min(1, d * 1.6);
}

// One painter per redraw: collects triangles by colour, then hands them over in a few batches.
export function hillPainter(gb, look, winter) {
  const bins = new Map(), heights = new Map();
  const grass = [look.mound, look.mound.clone().multiplyScalar(0.86), look.mound.clone().multiplyScalar(1.1)];
  const h = (i, j) => {                                  // cached, so squares that share a corner agree
    const k = i + ',' + j;
    if (!heights.has(k)) heights.set(k, heightAt(i / SUB, j / SUB));
    return heights.get(k);
  };
  // Add a triangle, turned so that it faces the way of the hint.
  const tri = (col, a, b, c, hx, hy, hz) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    let arr = bins.get(col);
    if (!arr) bins.set(col, arr = []);
    if (nx * hx + ny * hy + nz * hz >= 0) arr.push(...a, ...b, ...c); else arr.push(...a, ...c, ...b);
  };
  const tone = (y, slope, n) => winter ? (slope > 0.9 ? CLIFF : SNOW) : y > 1.75 || slope > 1.15 ? (n % 2 ? ROCK : ROCK2) : grass[n % 3];

  return {
    square(x, z) {
      const p = tunnelPiece(x, z), ports = p ? dirs(eff(p.ports)) : [];
      // the top surface
      for (let i = 0; i < SUB; i++) for (let j = 0; j < SUB; j++) {
        const gi = x * SUB + i, gj = z * SUB + j;
        const P = (a, b) => [(gi + a) / SUB, h(gi + a, gj + b), (gj + b) / SUB];
        const p00 = P(0, 0), p10 = P(1, 0), p01 = P(0, 1), p11 = P(1, 1), n = Math.floor(hash(gi, gj) * 6);
        const slope = (Math.max(p00[1], p10[1], p01[1], p11[1]) - Math.min(p00[1], p10[1], p01[1], p11[1])) * SUB;
        const y = (p00[1] + p11[1]) / 2;
        tri(tone(y, slope, n), p00, p01, p10, 0, 1, 0);
        tri(tone(y, slope, n + 1), p10, p01, p11, 0, 1, 0);
      }
      // the outer slope, on every side that faces open ground and has no tunnel mouth
      const open = d => !isHill(x + DX[d], z + DZ[d]);
      const skirt = d => open(d) && !ports.includes(d);
      const corner = [[x, z], [x + 1, z], [x + 1, z + 1], [x, z + 1]];           // NW, NE, SE, SW
      const ends = [[0, 1], [1, 2], [3, 2], [0, 3]];                             // the two corners of each side
      for (let d = 0; d < 4; d++) {
        if (!skirt(d)) continue;
        const [a, b] = ends[d].map(c => corner[c]);
        for (let s = 0; s < SUB; s++) {
          const t0 = s / SUB, t1 = (s + 1) / SUB;
          const ax = a[0] + (b[0] - a[0]) * t0, az = a[1] + (b[1] - a[1]) * t0, bx = a[0] + (b[0] - a[0]) * t1, bz = a[1] + (b[1] - a[1]) * t1;
          const T0 = [ax, BASE, az], T1 = [bx, BASE, bz], B0 = [ax + DX[d] * SKIRT, 0, az + DZ[d] * SKIRT], B1 = [bx + DX[d] * SKIRT, 0, bz + DZ[d] * SKIRT];
          const col = winter ? SNOW : grass[(x + z + s) % 3];
          tri(col, T0, T1, B0, DX[d], 0.4, DZ[d]); tri(col, T1, B1, B0, DX[d], 0.4, DZ[d]);
        }
      }
      // round off each outside corner, and close the end of a slope that stops at a tunnel mouth
      for (let c = 0; c < 4; c++) {
        const d1 = [0, 0, 2, 2][c], d2 = [3, 1, 1, 3][c], [cx, cz] = corner[c];
        const T = [cx, BASE, cz], col = winter ? SNOW : grass[(cx + cz) % 3];
        const B1 = [cx + DX[d1] * SKIRT, 0, cz + DZ[d1] * SKIRT], B2 = [cx + DX[d2] * SKIRT, 0, cz + DZ[d2] * SKIRT];
        if (skirt(d1) && skirt(d2)) tri(col, T, B1, B2, DX[d1] + DX[d2], 0.4, DZ[d1] + DZ[d2]);
        else if (skirt(d1) && open(d2)) tri(col, T, B1, [cx, 0, cz], DX[d2], 0, DZ[d2]);
        else if (skirt(d2) && open(d1)) tri(col, T, B2, [cx, 0, cz], DX[d1], 0, DZ[d1]);
      }
      // rock round each tunnel mouth: a panel either side of the opening and a lintel above it
      const mid = [x + 0.5, z + 0.5];
      for (const d of ports) {
        if (!open(d)) continue;
        const ns = DX[d] === 0, fx = mid[0] + DX[d] * 0.48, fz = mid[1] + DZ[d] * 0.48;
        for (const s of [-0.36, 0.36]) gb.slab(fx + (ns ? s : 0), 0, fz + (ns ? 0 : s), ns ? 0.28 : 0.04, BORE, ns ? 0.04 : 0.28, ROCK);
        gb.slab(fx, BORE, fz, ns ? 1 : 0.04, BASE - BORE + 0.01, ns ? 0.04 : 1, ROCK);
      }
      // pines where the hill is deep enough to be gentle
      const d0 = depth(mid[0], mid[1]);
      if (d0 >= 0.5 && d0 < 2.2 && hash(x * 3.1, z * 7.7) < 0.55) {
        const px = mid[0] + (hash(x, z * 2) - 0.5) * 0.5, pz = mid[1] + (hash(x * 2, z) - 0.5) * 0.5, py = heightAt(px, pz) - 0.04;
        gb.cyl(px, py + 0.09, pz, 0.022, 0.18, TRUNK, 'y');
        gb.cyl(px, py + 0.3, pz, 0.13, 0.3, winter ? SNOW : PINE, 'y', 0);
        gb.cyl(px, py + 0.47, pz, 0.09, 0.22, PINE, 'y', 0);
      }
    },
    finish() { for (const [col, arr] of bins) gb.facets(arr, col); },
  };
}

// The inside of a tunnel, for the ride-along camera: dark walls and roof on the closed sides,
// and a lamp overhead. Drawn into its own unlit mesh.
export function drawTunnelLining(gb, x, z) {
  const p = tunnelPiece(x, z);
  if (!p) return;
  const cx = x + 0.5, cz = z + 0.5, ports = dirs(eff(p.ports));
  gb.slab(cx, BORE - 0.02, cz, 0.94, 0.02, 0.94, WALL);
  for (let d = 0; d < 4; d++) {
    if (ports.includes(d)) continue;
    gb.slab(cx + DX[d] * 0.45, 0, cz + DZ[d] * 0.45, DX[d] ? 0.02 : 0.94, BORE, DX[d] ? 0.94 : 0.02, WALL);
  }
  gb.slab(cx, BORE - 0.045, cz, 0.06, 0.02, 0.06, LAMP);
}
