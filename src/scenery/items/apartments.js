import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';

const WALL = [C('#e8e3d6'), C('#dfe5e8')], RAIL = C('#f4f2ea'), GLASS = C('#5f8fb0'), DARK = C('#4a5158'), TANK = C('#b9c2c8'), TAR = C('#55595e'), LINE = C('#e9e7dc'), BEDDING = [C('#e9a3b5'), C('#9cc3e0'), C('#f1dc8a')];

// A danchi: two slab apartment blocks with balconies, 4 squares wide, 2 deep.
export default {
  id: 'apartments',
  name: 'Apartment blocks',
  meta: '4 x 2 squares. Two blocks with balconies.',
  size: [4, 2],
  build(g, rnd) {
    g.slab(0, 0, 0.55, 3.7, 0.012, 0.7, TAR);                                    // car park
    for (let i = 0; i < 12; i++) g.slab(-1.65 + i * 0.3, 0.013, 0.55, 0.015, 0.002, 0.5, LINE);
    for (const [cx, wall, floors] of [[-0.95, WALL[0], 6], [0.95, WALL[1], 7]]) {
      const w = 1.75, d = 0.6, z = -0.5, h = floors * 0.17 + 0.06;
      g.slab(cx, 0, z, w, h, d, wall);
      for (let f = 0; f < floors; f++) {
        const y = 0.06 + f * 0.17;
        g.slab(cx, y, z + d / 2 + 0.04, w, 0.05, 0.08, RAIL);                    // balcony
        for (let i = 0; i < 7; i++) {
          const x = cx - w / 2 + 0.13 + i * (w - 0.26) / 6;
          g.lit(rnd() < 0.6 ? 0.85 : 0, () => g.slab(x, y + 0.055, z + d / 2, 0.14, 0.09, 0.012, GLASS));
          if (rnd() < 0.18) g.slab(x, y + 0.04, z + d / 2 + 0.085, 0.12, 0.05, 0.01, BEDDING[Math.floor(rnd() * 3)]);   // futon airing on the rail
        }
        g.lit(rnd() < 0.5 ? 0.6 : 0, () => { for (let i = 0; i < 7; i++) g.slab(cx - w / 2 + 0.13 + i * (w - 0.26) / 6, y + 0.06, z - d / 2, 0.08, 0.07, 0.012, GLASS); });
      }
      g.slab(cx, h, z, w + 0.04, 0.025, d + 0.04, snowy() ? SNOW : DARK);
      g.cyl(cx + 0.5, h + 0.1, z, 0.09, 0.15, TANK, 'y');                         // water tank
      g.slab(cx - 0.45, h + 0.025, z, 0.25, 0.1, 0.25, DARK);
    }
  },
};
