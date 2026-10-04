import { C } from '../../core/colors.js';
import { snowy, SNOW, seasonLook } from '../seasons.js';
import castle from './castle.js';
import pine from './pine.js';
import sakura from './sakura.js';
import { move, scaled } from './_inside.js';

const STONE = C('#8d8a82'), STONE2 = C('#7c7a72'), WHITE = C('#f2efe6'), ROOF = C('#39464f'), WATER = C('#5a9fc6'), ICE = C('#cfe3ee'), BRIDGE = C('#c8402c'), PATH = C('#cdbf93');

// Castle grounds: 4 x 4 squares. A great keep inside stone walls with corner turrets, a moat
// along the front and a red bridge to the gate.
export default {
  id: 'castle-grounds',
  name: 'Castle grounds',
  meta: '4 x 4 squares. Great keep, walls, turrets and a moat.',
  size: [4, 4],
  build(g, rnd) {
    const tiles = snowy() ? SNOW : ROOF;
    g.slab(0, 0, 0, 3.9, 0.02, 3.9, snowy() ? SNOW : seasonLook().mound);
    g.slab(0, 0.02, 1.72, 3.9, 0.012, 0.42, snowy() ? ICE : WATER);              // moat along the front
    g.slab(0, 0.03, 1.72, 0.36, 0.05, 0.5, BRIDGE);                              // bridge
    for (const x of [-0.17, 0.17]) g.slab(x, 0.08, 1.72, 0.03, 0.07, 0.5, BRIDGE);
    g.slab(0, 0.021, 0.9, 0.3, 0.004, 1.2, PATH);                                // path to the keep
    // the outer wall: stone base, white plaster, tiled top
    const wall = (x, z, sx, sz) => {
      g.slab(x, 0.02, z, sx, 0.2, sz, (x + z) % 2 ? STONE : STONE2);
      g.slab(x, 0.22, z, sx * (sx > sz ? 1 : 0.7), 0.13, sz * (sz > sx ? 1 : 0.7), WHITE);
      g.gable(x, 0.35, z, sx > sz ? sx : sx + 0.08, 0.06, sz > sx ? sz : sz + 0.08, tiles, sx > sz);
    };
    wall(0, -1.75, 3.6, 0.2); wall(-1.75, 0, 0.2, 3.3); wall(1.75, 0, 0.2, 3.3);
    wall(-1.05, 1.42, 1.5, 0.2); wall(1.05, 1.42, 1.5, 0.2);                     // front wall, with a gap for the gate
    g.slab(-0.24, 0.02, 1.42, 0.1, 0.5, 0.24, STONE2); g.slab(0.24, 0.02, 1.42, 0.1, 0.5, 0.24, STONE2);   // gate
    g.gable(0, 0.52, 1.42, 0.8, 0.14, 0.4, tiles, true);
    for (const [x, z] of [[-1.72, -1.72], [1.72, -1.72], [-1.72, 1.4], [1.72, 1.4]]) {   // corner turrets
      g.pyr(x, 0.02, z, 0.5, 0.3, STONE, 0.4);
      g.slab(x, 0.32, z, 0.36, 0.2, 0.36, WHITE);
      g.lit(0.7, () => g.slab(x, 0.4, z, 0.37, 0.05, 0.37, ROOF));
      g.pyr(x, 0.52, z, 0.54, 0.14, tiles);
    }
    g.within(scaled(2.5, 0, -0.35, 0.02), () => castle.build(g, rnd));            // the keep
    for (const [x, z] of [[-1.25, 0.85], [1.25, 0.85], [-1.3, -1.2], [1.3, -1.2]]) g.within(move(x, z, 0.02), () => pine.build(g, rnd));
    for (const [x, z] of [[-0.75, 1.0], [0.75, 1.0], [-1.3, 0.1], [1.3, 0.1]]) g.within(move(x, z, 0.02), () => sakura.build(g, rnd));
  },
};
