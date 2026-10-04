import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';

const PAVE = C('#d3ccbb'), WALL = C('#efe7d3'), WOOD = C('#7b5a40'), ROOF = C('#3b4750'), DARK = C('#2a2f35');
const GLASS = C('#bfe0ea'), WARM = C('#ffd9a0'), SIGN = C('#1f5fae'), WHITE = C('#f6f6f1'), STEEL = C('#5d6b76'), LAMP = C('#ffe9a8');
const GATE = C('#c9ccd1'), GREEN = C('#3f9f6b'), RED = C('#c8402c'), BLUE = C('#2f6fb0'), BENCH = C('#8a5a3a');

// A ticket hall: the small entrance building of a country station, on the ground beside the
// tracks. 2 squares wide, 1 deep. A tiled roof, a row of ticket gates in the open doorway, a
// ticket machine, a post box and a bench outside. Put it next to a station and it brings that
// station more passengers; people walking on to the platform come from its end of the platform.
export default {
  id: 'ticket-hall',
  name: 'Ticket hall',
  meta: '2 x 1 squares. A station entrance on the ground. Brings passengers.',
  size: [2, 1],
  build(g, rnd) {
    const top = snowy() ? SNOW : ROOF;
    g.slab(0, 0, 0, 1.94, 0.02, 0.94, PAVE);
    // the building: two wings and an open doorway between them
    for (const s of [-1, 1]) {
      g.slab(s * 0.52, 0.02, -0.12, 0.62, 0.27, 0.5, WALL);
      g.slab(s * 0.52, 0.02, -0.12, 0.64, 0.05, 0.52, WOOD);
      g.lit(1, () => g.slab(s * 0.52, 0.1, 0.132, 0.42, 0.11, 0.012, s < 0 ? WARM : GLASS));
      g.slab(s * 0.52, 0.1, 0.136, 0.014, 0.11, 0.012, WOOD);
    }
    g.slab(0, 0.02, -0.34, 0.5, 0.27, 0.06, DARK);                               // the back of the hall, in shadow
    g.slab(0, 0.24, -0.12, 0.46, 0.05, 0.5, WALL);                               // the wall over the doorway
    for (const x of [-0.14, 0, 0.14]) {                                          // ticket gates
      g.slab(x, 0.02, 0.02, 0.05, 0.085, 0.2, GATE);
      g.lit(1.2, () => g.slab(x, 0.105, 0.1, 0.03, 0.006, 0.03, x ? GREEN : RED));
    }
    g.gable(0, 0.29, -0.12, 1.82, 0.2, 0.74, top, true);
    g.slab(0, 0.27, 0.27, 1.5, 0.014, 0.2, WOOD);                                // the porch roof, on posts
    for (const x of [-0.7, -0.26, 0.26, 0.7]) g.slab(x, 0.02, 0.35, 0.022, 0.25, 0.022, WOOD);
    g.lit(0.9, () => { g.slab(0, 0.3, 0.36, 0.62, 0.085, 0.016, SIGN); g.slab(0, 0.33, 0.37, 0.4, 0.02, 0.012, WHITE); });   // the station sign
    g.cyl(0, 0.43, 0.25, 0.05, 0.016, WHITE, 'z'); g.cyl(0, 0.43, 0.24, 0.058, 0.012, DARK, 'z');                           // the clock
    // outside: a ticket machine, a post box, a bench, a lamp
    g.slab(0.5, 0.02, 0.2, 0.1, 0.17, 0.06, BLUE);
    g.lit(1.1, () => g.slab(0.5, 0.11, 0.232, 0.07, 0.05, 0.006, GLASS));
    g.slab(0.84, 0.02, 0.36, 0.06, 0.1, 0.06, RED); g.slab(0.84, 0.12, 0.36, 0.07, 0.014, 0.07, RED);
    g.slab(-0.55, 0.05, 0.22, 0.3, 0.02, 0.07, BENCH);
    for (const x of [-0.66, -0.44]) g.slab(x, 0.02, 0.22, 0.02, 0.03, 0.06, STEEL);
    g.slab(-0.9, 0.02, 0.38, 0.014, 0.34, 0.014, STEEL);
    g.lit(1.5, () => g.sph(-0.9, 0.38, 0.38, 0.026, 0.026, 0.026, LAMP));
  },
};
