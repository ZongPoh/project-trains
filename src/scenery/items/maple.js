import { C } from '../../core/colors.js';
import { season, SNOW } from '../seasons.js';

const TRUNK = C('#4f392d');
const LEAVES = {
  spring: [C('#8fc45a'), C('#a5d06a'), C('#7ab552'), C('#b7da7c')],
  summer: [C('#4c9a44'), C('#5fa84f'), C('#3f8a3c'), C('#6fb35c')],
  autumn: [C('#d9482b'), C('#e87a2a'), C('#b92f25'), C('#f0a431')],     // momiji
};

export default {
  id: 'maple',
  name: 'Maple tree',
  meta: 'Green in summer, red and orange in autumn.',
  build(g, rnd) {
    const h = 0.28 + rnd() * 0.12, now = season(), turn = () => rnd() * 3;
    g.cyl(0, h / 2, 0, 0.038, h, TRUNK, 'y', 0.024);
    const crown = [[0, 0.14, 0, 0.22, 0.19], [0.13, 0.08, -0.05, 0.16, 0.13], [-0.13, 0.1, 0.06, 0.17, 0.14], [0, 0.27, 0.02, 0.13, 0.11]];
    if (now === 'winter') {
      for (const [x, y, z] of crown) {
        g.cyl(x * 0.6, h + y * 0.55, z * 0.6, 0.012, 0.2 + y, TRUNK, 'y', 0.006);
        g.blob(x * 0.85, h + y + 0.07, z * 0.85, 0.07, 0.03, 0.07, SNOW, turn());
      }
      return;
    }
    const P = LEAVES[now];
    crown.forEach(([x, y, z, r, ry], i) => g.blob(x, h + y, z, r, ry, r, P[i], turn()));
  },
};
