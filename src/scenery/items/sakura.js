import { C } from '../../core/colors.js';
import { season, SNOW } from '../seasons.js';

const TRUNK = C('#5d4335');
const LEAVES = {
  spring: [C('#f7bcd2'), C('#f29fbe'), C('#fcd9e5'), C('#ee8db2')],     // in bloom
  summer: [C('#5fa551'), C('#4f9447'), C('#74b562'), C('#458a40')],
  autumn: [C('#d99a3a'), C('#c9802f'), C('#e6b24a'), C('#b96a2a')],
};

export default {
  id: 'sakura',
  name: 'Sakura tree',
  meta: 'Cherry tree. Blossom in spring, bare under snow in winter.',
  build(g, rnd) {
    const h = 0.24 + rnd() * 0.1, lean = (rnd() - 0.5) * 0.06, now = season(), turn = () => rnd() * 3;
    g.cyl(lean, h / 2, 0, 0.04, h, TRUNK, 'y', 0.026);
    const crown = [[0, 0.13, 0, 0.24, 0.17], [0.15, 0.07, 0.06, 0.16, 0.12], [-0.14, 0.08, -0.07, 0.17, 0.13], [0.01, 0.06, -0.15, 0.15, 0.11], [-0.03, 0.23, 0.03, 0.15, 0.11]];
    if (now === 'winter') {                                           // bare branches with snow on them
      for (const [x, y, z] of crown) {
        g.cyl(lean + x * 0.6, h + y * 0.55, z * 0.6, 0.012, 0.2 + y, TRUNK, 'y', 0.006);
        g.blob(lean + x * 0.85, h + y + 0.07, z * 0.85, 0.07, 0.03, 0.07, SNOW, turn());
      }
      return;
    }
    const P = LEAVES[now];
    crown.forEach(([x, y, z, r, ry], i) => g.blob(lean + x, h + y, z, r, ry, r, P[i % 4], turn()));
    if (now === 'summer') return;
    for (let i = 0; i < 6; i++) {                                     // fallen petals or leaves
      const a = rnd() * 6.28, r = 0.12 + rnd() * 0.28;
      g.slab(Math.cos(a) * r, 0.002, Math.sin(a) * r, 0.03, 0.004, 0.03, P[i % 4], turn());
    }
  },
};
