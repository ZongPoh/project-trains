import { C } from '../../core/colors.js';
import { DX, DZ, opp, WALK } from '../../core/constants.js';
import { snowy, SNOW } from '../seasons.js';

const DECK = C('#d6d0c0'), EDGE = C('#9d9c94'), COL = C('#b7b6ad'), RAIL = C('#6f8794'), GLASS = C('#bfe0ea'), STEP = C('#c9c7bd');
const TOP = WALK, WIDE = 0.34;

// A raised walkway: a footpath on pillars, the same height as the pedestrian deck and the
// footbridge, so people walk above the traffic (see city/people.js for the people). Each square
// joins the walkway squares, decks and footbridge ends beside it; an end that leads nowhere
// gets a flight of stairs down to the ground. It may be built over roads and over plain track
// on the ground, and keeps its pillars clear of both.
export default {
  id: 'walkway',
  name: 'Raised walkway',
  meta: 'A footpath above road and track. Joins up square by square; ends get stairs.',
  overRoad: true,
  overTrack: true,
  joins: true,
  build(g, rnd, where) {
    const links = where ? where.links : [false, true, false, true];
    const under = where ? [...(where.road || []), ...(where.rail || [])] : [];   // the sides a road or railway runs out by
    const open = under.length === 0;
    const dirs = [0, 1, 2, 3].filter(d => links[d]), surface = snowy() ? SNOW : DECK;
    // a length of path from the middle of the square out to side d, between a and b along that way
    const run = (d, a, b, y = TOP) => {
      const ns = DX[d] === 0, m = (a + b) / 2, len = b - a;
      g.slab(DX[d] * m, y - 0.04, DZ[d] * m, ns ? WIDE : len, 0.04, ns ? len : WIDE, EDGE);
      g.slab(DX[d] * m, y, DZ[d] * m, ns ? WIDE - 0.03 : len, 0.006, ns ? len : WIDE - 0.03, surface);
      for (const s of [-1, 1]) {                                  // balustrade down both sides
        const ox = ns ? s * (WIDE / 2 - 0.01) : DX[d] * m, oz = ns ? DZ[d] * m : s * (WIDE / 2 - 0.01);
        g.slab(ox, y, oz, ns ? 0.01 : len, 0.07, ns ? len : 0.01, GLASS);
        g.slab(ox, y + 0.07, oz, ns ? 0.016 : len, 0.01, ns ? len : 0.016, RAIL);
      }
    };
    const stairs = d => {                                         // down to the ground, out towards side d
      const ns = DX[d] === 0, n = 10;
      for (let i = 0; i < n; i++) {
        const at = -0.08 + (i + 0.5) * 0.56 / n, y = TOP * (1 - (i + 1) / (n + 1));
        g.slab(DX[d] * at, y, DZ[d] * at, ns ? WIDE - 0.04 : 0.07, 0.03, ns ? 0.07 : WIDE - 0.04, STEP);
        for (const s of [-1, 1]) {                                // a handrail that follows the steps down
          const o = s * (WIDE / 2 - 0.01);
          g.slab(ns ? o : DX[d] * at, y + 0.03, ns ? DZ[d] * at : o, ns ? 0.01 : 0.058, 0.075, ns ? 0.058 : 0.01, RAIL);
        }
        if (i % 4 === 2) g.slab(DX[d] * at, 0, DZ[d] * at, 0.04, y, 0.04, COL);
      }
    };
    const end = dirs.length === 1 && open ? opp(dirs[0]) : -1;   // a dead end on open ground: stairs
    if (end >= 0) { run(dirs[0], 0.08, 0.5); stairs(end); }
    else {
      g.slab(0, TOP - 0.04, 0, WIDE, 0.04, WIDE, EDGE);
      g.slab(0, TOP, 0, WIDE - 0.03, 0.006, WIDE - 0.03, surface);
      for (let d = 0; d < 4; d++) {
        if (links[d]) run(d, WIDE / 2, 0.5);
        else {                                                    // closed side of the middle square
          const ns = DX[d] === 0, o = WIDE / 2 - 0.01;
          g.slab(DX[d] * o, TOP, DZ[d] * o, ns ? WIDE : 0.01, 0.07, ns ? 0.01 : WIDE, GLASS);
          g.slab(DX[d] * o, TOP + 0.07, DZ[d] * o, ns ? WIDE : 0.016, 0.01, ns ? 0.016 : WIDE, RAIL);
        }
      }
    }
    // pillars: under the middle, or (over a road or railway) at the sides they do not use
    if (open) { if (end < 0) g.slab(0, 0, 0, 0.06, TOP - 0.04, 0.06, COL); else g.slab(DX[dirs[0]] * 0.4, 0, DZ[dirs[0]] * 0.4, 0.06, TOP - 0.04, 0.06, COL); }
    else {
      for (let d = 0; d < 4; d++) {
        if (under.includes(d)) continue;
        const ns = DX[d] === 0;
        g.slab(DX[d] * 0.45, 0, DZ[d] * 0.45, 0.06, TOP - 0.04, 0.06, COL);
        if (!links[d]) g.slab(DX[d] * 0.31, TOP - 0.07, DZ[d] * 0.31, ns ? 0.05 : 0.3, 0.03, ns ? 0.3 : 0.05, COL);   // a beam in to the path
      }
    }
  },
};
