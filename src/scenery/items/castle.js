import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';

const STONE = C('#8d8a82'), WHITE = C('#f2efe6'), ROOF = C('#39464f'), GOLD = C('#d8ab3c'), DARK = C('#2b3238');

// A castle keep on its stone base.
export default {
  id: 'castle',
  name: 'Castle keep',
  meta: 'White walls on a stone base.',
  build(g) {
    const tiles = snowy() ? SNOW : ROOF;
    g.pyr(0, 0, 0, 0.92, 0.24, STONE, 0.7);
    const tiers = [[0.62, 0.17], [0.46, 0.15], [0.32, 0.13]];
    let y = 0.24;
    tiers.forEach(([w, h], i) => {
      g.slab(0, y, 0, w, h, w, WHITE);
      g.lit(0.8, () => {
        for (const s of [-1, 1]) {
          g.slab(s * w * 0.25, y + h * 0.45, 0, w * 0.12, h * 0.28, w + 0.008, DARK);
          g.slab(0, y + h * 0.45, s * w * 0.25, w + 0.008, h * 0.28, w * 0.12, DARK);
        }
      });
      y += h;
      if (i < tiers.length - 1) { g.pyr(0, y, 0, w + 0.22, 0.07, tiles, w * 0.7); y += 0.07; }
    });
    g.gable(0, y, 0, 0.46, 0.15, 0.44, tiles, true);
    y += 0.09;
    for (const x of [-0.17, 0.17]) g.slab(x, y + 0.06, 0, 0.03, 0.05, 0.02, GOLD);     // roof fish
  },
};
