import { C } from '../../core/colors.js';
import { WALK } from '../../core/constants.js';
import { snowy, SNOW } from '../seasons.js';

const STEEL = C('#7fb3a6'), DARK = C('#4f7f75'), DECK = C('#b9b7ad'), STEP = C('#c9c7bd');

// A pedestrian footbridge: the pale green steel bridges that cross busy roads all over Japan.
// It stands over one straight road square, with a flight of stairs down each side. An end
// that has a raised walkway beside it joins on to the walkway instead, and has no stairs.
export default {
  id: 'footbridge',
  name: 'Footbridge',
  meta: 'Goes over a straight road. Stairs on both sides, or joins a raised walkway.',
  on: 'road',
  linked: true,
  build(g, rnd, where) {                                     // the road runs along z through the middle
    const top = WALK - 0.03, n = 9;
    // which of its two ends (local +x, then -x) meets a walkway: `where` gives the sides of the square as the board sees them
    const joined = s => !!where && where.links[where.rot ? (s > 0 ? 0 : 2) : (s > 0 ? 1 : 3)];
    g.slab(0, top, 0, 0.98, 0.03, 0.17, DECK);
    if (snowy()) g.slab(0, top + 0.03, 0, 0.96, 0.008, 0.15, SNOW);
    for (const z of [-0.085, 0.085]) {                       // railings
      g.slab(0, top + 0.03, z, 0.98, 0.075, 0.012, STEEL);
      g.slab(0, top + 0.105, z, 0.98, 0.012, 0.018, DARK);
    }
    g.slab(0, top - 0.035, 0, 0.98, 0.035, 0.05, DARK);      // the girder
    for (const s of [-1, 1]) {
      const x = s * 0.43;
      g.slab(x, 0, 0, 0.05, top, 0.05, DARK);                // column
      if (joined(s)) continue;
      for (let i = 0; i < n; i++) {                          // stairs, running alongside the road
        const y = top * (1 - (i + 1) / (n + 1)), z = s * (0.11 + i * 0.042);
        g.slab(x, y, z, 0.11, 0.03, 0.048, STEP);
        if (i % 3 === 1) g.slab(x, 0, z, 0.03, y, 0.03, DARK);
        for (const e of [-0.055, 0.055]) g.slab(x + e, y + 0.03, z, 0.01, 0.07, 0.045, STEEL);   // handrails
      }
    }
  },
};
