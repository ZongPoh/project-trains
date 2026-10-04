import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';

const WALL = [C('#efe9da'), C('#e6dcc6'), C('#f3f0e6')], ROOF = [C('#3f4c59'), C('#51483f'), C('#39505a')];
const WOOD = C('#6b4a35'), GLASS = C('#9fc3d4'), STONE = C('#9a968c');

// A small house with a tiled roof and deep eaves.
export default {
  id: 'house',
  name: 'House',
  meta: 'Tiled roof, white walls.',
  build(g, rnd) {
    const wall = WALL[Math.floor(rnd() * 3)], two = rnd() < 0.4;
    const tiles = ROOF[Math.floor(rnd() * 3)], roof = snowy() ? SNOW : tiles;      // snow lies on the roof in winter
    g.slab(0, 0, 0, 0.7, 0.03, 0.6, STONE);
    g.slab(0, 0.03, 0, 0.6, 0.24, 0.5, wall);
    g.slab(0, 0.03, 0.255, 0.12, 0.17, 0.012, WOOD);                 // door
    const home = rnd() < 0.8;                                        // some houses are dark: nobody in
    g.lit(home ? 1 : 0, () => { for (const x of [-0.19, 0.19]) g.slab(x, 0.12, 0.255, 0.12, 0.09, 0.012, GLASS); });
    g.slab(0, 0.03, 0, 0.61, 0.03, 0.51, WOOD);
    if (two) {
      g.gable(0, 0.27, 0, 0.74, 0.06, 0.64, roof, true);            // skirt roof
      g.slab(0, 0.3, 0, 0.44, 0.17, 0.36, wall);
      g.lit(home && rnd() < 0.6 ? 1 : 0, () => { for (const x of [-0.12, 0.12]) g.slab(x, 0.36, 0.185, 0.1, 0.07, 0.012, GLASS); });
      g.gable(0, 0.47, 0, 0.56, 0.15, 0.5, roof, true);
      g.slab(0, 0.61, 0, 0.56, 0.02, 0.04, roof);
    } else {
      g.gable(0, 0.27, 0, 0.74, 0.2, 0.66, roof, true);
      g.slab(0, 0.46, 0, 0.74, 0.02, 0.04, roof);
    }
  },
};
