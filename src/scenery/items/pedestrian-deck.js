import { C } from '../../core/colors.js';
import { WALK } from '../../core/constants.js';
import { snowy, SNOW } from '../seasons.js';
import sakura from './sakura.js';
import { scaled } from './_inside.js';

const DECK = C('#d6d0c0'), TILE = C('#c3bca9'), EDGE = C('#9d9c94'), COL = C('#b7b6ad'), RAIL = C('#6f8794'), GLASS = C('#bfe0ea'), STEP = C('#c9c7bd');
const WOOD = C('#8a5a3a'), PLANT = C('#8f8b80'), LAMP = C('#ffe9a8'), STEEL = C('#5d6b76');

// A pedestrian deck: the raised plaza outside a big Japanese station, where people walk above
// the buses and taxis (the people are in city/people.js). 3 squares wide, 2 deep, on pillars. Unlike other buildings it may stand
// over road squares: its pillars are placed clear of any road beneath.
export default {
  id: 'pedestrian-deck',
  name: 'Pedestrian deck',
  meta: '3 x 2 squares, on pillars. May be built over a road.',
  size: [3, 2],
  overRoad: true,
  build(g, rnd) {
    const top = WALK, w = 2.6, d = 1.9, surface = snowy() ? SNOW : DECK;
    g.slab(0, top - 0.05, 0, w, 0.05, d, EDGE);
    g.slab(0, top, 0, w - 0.04, 0.008, d - 0.04, surface);
    for (const s of [-1, 1]) {                                // a strip at each end, cut short to leave room for the stairs
      g.slab(s * 1.375, top - 0.05, s * 0.425, 0.15, 0.05, 1.05, EDGE);
      g.slab(s * 1.375, top, s * 0.425, 0.15, 0.008, 1.03, surface);
    }
    for (let i = -3; i <= 3; i++) g.slab(i * 0.42, top + 0.008, 0, 0.012, 0.002, d - 0.1, TILE);
    for (let j = -2; j <= 2; j++) g.slab(0, top + 0.008, j * 0.42, w - 0.1, 0.002, 0.012, TILE);
    // pillars: between the squares and along the edges, never where a road could run
    for (const x of [-1.42, -0.5, 0.5, 1.42]) for (const z of [-0.92, 0, 0.92]) g.slab(x, 0, z, 0.07, top - 0.05, 0.07, COL);
    // a glass balustrade all round, with a gap at each staircase
    const rail = (x, z, sx, sz) => { g.slab(x, top, z, sx, 0.075, sz, GLASS); g.slab(x, top + 0.075, z, sx + 0.004, 0.012, sz + 0.004, RAIL); };
    rail(0, d / 2 - 0.02, w, 0.012); rail(0, -d / 2 + 0.02, w, 0.012);
    for (const s of [-1, 1]) {
      rail(s * 1.435, s * 0.425, 0.012, 1.05); rail(s * 1.375, s * 0.935, 0.15, 0.012);
      rail(s * 1.3, -s * 0.2, 0.012, 0.2);
    }
    // stairs down at two opposite corners, folded along the short sides
    for (const s of [-1, 1]) {
      const x = s * 1.38;
      for (let i = 0; i < 9; i++) g.slab(x, top * (1 - (i + 1) / 10), -s * (0.78 - i * 0.075), 0.13, 0.03, 0.08, STEP);
    }
    // benches, planters with small cherry trees, lamps
    for (const x of [-0.75, 0.75]) {
      g.cyl(x, top + 0.035, 0, 0.17, 0.06, PLANT, 'y');
      g.within(scaled(0.6, x, 0, top + 0.05), () => sakura.build(g, rnd));
      for (const z of [-0.32, 0.32]) g.slab(x, top + 0.03, z, 0.26, 0.022, 0.07, WOOD);
    }
    for (const [x, z] of [[0, -0.6], [0, 0.6], [-1.2, 0.5], [1.2, -0.5]]) {
      g.slab(x, top, z, 0.014, 0.3, 0.014, STEEL);
      g.lit(1.5, () => g.sph(x, top + 0.32, z, 0.026, 0.026, 0.026, LAMP));
    }
  },
};
