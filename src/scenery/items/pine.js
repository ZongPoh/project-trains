import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';

const TRUNK = C('#4a372c'), GREEN = [C('#2f5d3a'), C('#24492f'), C('#3b6f45')];

// A garden pine, clipped into flat "cloud" layers. Evergreen; it carries snow in winter.
export default {
  id: 'pine',
  name: 'Pine tree',
  meta: 'A clipped garden pine. Green all year.',
  build(g, rnd) {
    const h = 0.5 + rnd() * 0.2, turn = () => rnd() * 3;
    g.cyl(0, h / 2, 0, 0.04, h, TRUNK, 'y', 0.022);
    g.cyl(0.07, h * 0.45, 0.02, 0.016, 0.2, TRUNK, 'x');
    g.cyl(-0.06, h * 0.68, -0.02, 0.014, 0.16, TRUNK, 'x');
    const pads = [[0.2, h * 0.47, 0.03, 0.17, 0.07, 0.15, 0], [-0.17, h * 0.7, -0.03, 0.15, 0.065, 0.14, 1], [0.02, h + 0.03, 0, 0.18, 0.08, 0.17, 2], [0.05, h * 0.84, 0.1, 0.11, 0.05, 0.1, 0]];
    for (const [x, y, z, sx, sy, sz, c] of pads) {
      g.blob(x, y, z, sx, sy, sz, GREEN[c], turn());
      if (snowy()) g.blob(x, y + sy * 0.75, z, sx * 0.82, sy * 0.45, sz * 0.82, SNOW, turn());
    }
  },
};
