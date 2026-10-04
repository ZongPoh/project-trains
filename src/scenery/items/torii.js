import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';

const RED = C('#d23a25'), BLACK = C('#23262a'), STONE = C('#8f8b80');

// Shrine gate.
export default {
  id: 'torii',
  name: 'Torii gate',
  meta: 'The red gate of a shrine.',
  build(g) {
    for (const x of [-0.27, 0.27]) {
      g.cyl(x, 0.035, 0, 0.05, 0.07, STONE, 'y');
      g.cyl(x, 0.34, 0, 0.034, 0.62, RED, 'y', 0.03);
    }
    g.slab(0, 0.46, 0, 0.66, 0.045, 0.045, RED);                    // tie beam
    g.slab(0, 0.505, 0, 0.05, 0.1, 0.03, RED);                      // centre strut
    g.slab(0, 0.6, 0, 0.78, 0.045, 0.07, RED);                      // lintel
    g.slab(0, 0.645, 0, 0.9, 0.035, 0.09, BLACK);                   // top rail
    for (const x of [-0.42, 0.42]) g.slab(x, 0.66, 0, 0.07, 0.03, 0.09, BLACK);   // upturned ends
    if (snowy()) g.slab(0, 0.68, 0, 0.76, 0.025, 0.08, SNOW);
  },
};
