import { Vector3 } from 'three';
import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';

const GRASS = C('#6fa35a'), HEDGE = C('#4f8a4a'), PATH = C('#d8cdb0'), WHEEL = C('#e9ecee'), HUB = C('#c8402c'), POD = ['#d94f3d', '#2f6fb0', '#e0b02c', '#3f8f6b', '#7a4fa3', '#e07a2c'].map(C), LANTERN = C('#ffcf7a'), TABLE = C('#8a5a3a'), CANOPY = C('#f3efe2');
const WALL = C('#e9e4d8'), TRIM = C('#b5463a'), GLASS = C('#6f9fbd'), DARK = C('#3c4248'), SIGN = C('#c8362c'), WHITE = C('#f5f3ec'), AWNING = C('#2f6fb0');

// What is on the roof. Japanese department stores put their roofs to use: each store gets one of
// a small Ferris wheel, a garden, or a beer garden strung with lanterns.
function ferrisWheel(g, x, y, z) {
  const r = 0.3, cy = y + r + 0.1, v = new Vector3();
  for (const s of [-1, 1]) {                                            // two A-frames hold the axle
    g.obox(x + s * 0.09, y + (r + 0.1) / 2, z + 0.05, v.set(-s * 0.18, r + 0.1, 0), 0.025, 0.025, Math.hypot(0.18, r + 0.1), WHEEL);
    g.obox(x + s * 0.09, y + (r + 0.1) / 2, z - 0.05, v.set(-s * 0.18, r + 0.1, 0), 0.025, 0.025, Math.hypot(0.18, r + 0.1), WHEEL);
  }
  g.cyl(x, cy, z, 0.035, 0.14, HUB, 'z');
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, b = (i + 1) / 12 * Math.PI * 2;
    const px = x + Math.cos(a) * r, py = cy + Math.sin(a) * r, qx = x + Math.cos(b) * r, qy = cy + Math.sin(b) * r;
    g.obox((px + qx) / 2, (py + qy) / 2, z, v.set(qx - px, qy - py, 0), 0.016, 0.016, Math.hypot(qx - px, qy - py) + 0.01, WHEEL);   // rim
    g.obox((px + x) / 2, (py + cy) / 2, z, v.set(px - x, py - cy, 0), 0.008, 0.008, r, WHEEL);                                       // spoke
    g.lit(0.6, () => g.slab(px, py - 0.065, z, 0.06, 0.05, 0.07, POD[i % POD.length]));                                              // the cars hang level
  }
}

function roofGarden(g, rnd, y, w, d) {
  g.slab(0.35, y, 0, w * 0.62, 0.012, d * 0.8, GRASS);
  g.slab(0.35, y + 0.012, 0, w * 0.6, 0.004, 0.08, PATH);
  for (let i = 0; i < 7; i++) g.blob(-0.35 + rnd() * 1.4, y + 0.06, (rnd() - 0.5) * d * 0.7, 0.09 + rnd() * 0.05, 0.07, 0.09, HEDGE, rnd() * 3);
  for (const x of [0, 0.7]) g.slab(x, y + 0.012, 0.12, 0.2, 0.03, 0.05, TABLE);                 // benches
}

function beerGarden(g, rnd, y, w, d) {
  g.slab(0.35, y, 0, w * 0.62, 0.012, d * 0.8, PATH);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const x = -0.25 + i * 0.6, z = -0.3 + j * 0.6;
    g.slab(x, y + 0.012, z, 0.22, 0.05, 0.12, TABLE);
    g.pyr(x, y + 0.2, z, 0.34, 0.08, CANOPY);                                                  // parasol
    g.slab(x, y + 0.012, z, 0.012, 0.19, 0.012, DARK);
  }
  g.lit(1.3, () => {                                                                           // strings of lanterns
    for (const z of [-0.62, 0, 0.62]) for (let i = 0; i < 9; i++) g.slab(-0.45 + i * 0.2, y + 0.3, z, 0.04, 0.05, 0.04, i % 2 ? LANTERN : SIGN);
  });
  for (const x of [-0.5, 1.2]) for (const z of [-0.62, 0, 0.62]) g.slab(x, y, z, 0.014, 0.34, 0.014, DARK);
}

// A department store: 3 squares wide, 2 deep. Seven floors of shopping with a rooftop sign,
// and something to do on the roof.
export default {
  id: 'department-store',
  name: 'Department store',
  meta: '3 x 2 squares. Seven floors and a rooftop sign.',
  size: [3, 2],
  build(g, rnd) {
    const w = 2.7, d = 1.7, floors = 7, fh = 0.2, h = floors * fh + 0.12;
    g.slab(0, 0, 0, w + 0.1, 0.06, d + 0.1, DARK);
    g.slab(0, 0.06, 0, w, h, d, WALL);
    g.lit(1, () => g.slab(0, 0.08, 0, w + 0.01, 0.2, d + 0.01, GLASS));          // shop windows at street level
    g.slab(0, 0.29, d / 2 + 0.07, w * 0.9, 0.03, 0.16, AWNING);                 // awning over the pavement
    for (let f = 1; f < floors; f++) {
      const y = 0.12 + f * fh;
      g.lit(rnd() < 0.75 ? 0.8 : 0, () => {
        for (let i = 0; i < 9; i++) {
          const x = -w / 2 + 0.2 + i * (w - 0.4) / 8;
          g.slab(x, y, d / 2, 0.2, 0.11, 0.012, GLASS); g.slab(x, y, -d / 2, 0.2, 0.11, 0.012, GLASS);
        }
        for (let i = 0; i < 5; i++) {
          const z = -d / 2 + 0.2 + i * (d - 0.4) / 4;
          g.slab(w / 2, y, z, 0.012, 0.11, 0.2, GLASS); g.slab(-w / 2, y, z, 0.012, 0.11, 0.2, GLASS);
        }
      });
    }
    for (const x of [-w / 2 + 0.04, w / 2 - 0.04]) g.slab(x, 0.06, d / 2 + 0.004, 0.08, h, 0.01, TRIM);   // corner pilasters
    g.slab(0, h + 0.06, 0, w + 0.06, 0.05, d + 0.06, WHITE);
    g.slab(-0.6, h + 0.11, -0.2, 0.7, 0.18, 0.6, DARK);                          // plant room
    g.lit(1.2, () => g.slab(0.5, h + 0.2, d / 2 - 0.12, 1.1, 0.32, 0.06, SIGN)); // the big sign
    g.slab(0.5, h + 0.11, d / 2 - 0.12, 0.06, 0.1, 0.06, DARK);
    g.lit(1, () => g.slab(-w / 2 - 0.02, 0.5, d / 2 - 0.3, 0.03, 0.9, 0.2, SIGN)); // hanging banner
    const kind = Math.floor(rnd() * 3), ry = h + 0.11;
    if (kind === 0) ferrisWheel(g, 0.75, ry, -0.35); else if (kind === 1) roofGarden(g, rnd, ry, w, d); else beerGarden(g, rnd, ry, w, d);
    if (snowy()) g.slab(0.3, ry, 0.5, w * 0.6, 0.02, d * 0.2, SNOW);
  },
};
