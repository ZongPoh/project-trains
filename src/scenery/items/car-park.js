import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';
import sedan from '../../roads/vehicles/sedan.js';
import keiTruck from '../../roads/vehicles/kei-truck.js';
import { turned } from './_inside.js';

const SLAB = C('#c9c7bd'), WALL = C('#dedbd0'), COL = C('#a9a79d'), DARK = C('#3c4248'), BLUE = C('#1f5fae'), WHITE = C('#f6f6f1'), LAMP = C('#ffe9a8'), RAMP = C('#b4b2a8'), LINE = C('#f4f2ea'), STRIPE = C('#e0b02c');

// A multi-storey car park: 3 squares wide, 2 deep. Four open decks with cars showing at the
// edges, a spiral ramp at one end and a bridge at first-floor height on the other, the way
// such car parks are entered straight from an elevated road.
export default {
  id: 'car-park',
  name: 'Multi-storey car park',
  meta: '3 x 2 squares. Four decks, a spiral ramp and a big P.',
  size: [3, 2],
  build(g, rnd) {
    const w = 2.1, d = 1.7, fh = 0.28, floors = 4, x0 = -0.3;                  // the decks sit left of the spiral
    g.slab(0, 0, 0, 2.94, 0.02, 1.94, DARK);
    for (let f = 0; f <= floors; f++) {
      const y = 0.02 + f * fh;
      if (f > 0) g.slab(x0, y - 0.04, 0, w, 0.04, d, SLAB);
      if (f === floors) { if (snowy()) g.slab(x0, y, 0, w - 0.1, 0.012, d - 0.1, SNOW); }
      // parapet walls round each deck, with a yellow stripe (the ground floor is open: cars drive in)
      if (f > 0) for (const s of [-1, 1]) {
        g.slab(x0, y, s * (d / 2 - 0.02), w, 0.07, 0.03, WALL);
        g.slab(x0 + s * (w / 2 - 0.02), y, 0, 0.03, 0.07, d, WALL);
        g.slab(x0, y + 0.03, s * (d / 2 - 0.004), w, 0.012, 0.006, STRIPE);
      }
      if (f === floors) break;
      for (const x of [-0.98, -0.33, 0.33, 0.98]) for (const z of [-0.8, 0, 0.8]) g.slab(x0 + x, y, z, 0.07, fh - 0.04, 0.07, COL);   // columns
      g.lit(0.7, () => { for (const x of [-0.6, 0.1]) g.slab(x0 + x, y + fh - 0.055, 0, 0.3, 0.008, 0.04, LAMP); });                      // strip lights
      for (let i = 0; i < 7; i++) {                                              // cars parked along the two long edges
        for (const s of [-1, 1]) {
          if (rnd() < 0.35) continue;
          const k = rnd() < 0.8 ? sedan : keiTruck;
          g.within(turned(x0 - 0.86 + i * 0.28, s * 0.6, s > 0 ? 0 : Math.PI, y), () => k.build(g, rnd));
        }
      }
    }
    // cars on the roof deck too
    for (let i = 0; i < 5; i++) if (rnd() < 0.6) g.within(turned(x0 - 0.7 + i * 0.36, 0.55, 0, 0.02 + floors * fh), () => sedan.build(g, rnd));
    for (let i = 0; i <= 5; i++) g.slab(x0 - 0.88 + i * 0.36, 0.021 + floors * fh, 0.55, 0.012, 0.002, 0.36, LINE);
    // the spiral ramp at the right-hand end: a round tower, open between its floors
    const cx = 1.08, top = 0.02 + floors * fh;
    g.cyl(cx, top / 2, 0, 0.13, top, COL, 'y');
    for (let f = 0; f <= floors; f++) {
      const y = 0.02 + f * fh;
      g.cyl(cx, y + 0.02, 0, 0.36, 0.04, RAMP, 'y');                             // the ramp, seen edge on at each turn
      g.cyl(cx, y + 0.06, 0, 0.365, 0.05, WALL, 'y');                            // its outer wall
      g.cyl(cx, y + 0.062, 0, 0.34, 0.052, f === floors ? RAMP : DARK, 'y');
      if (f < floors) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.slab(cx + Math.cos(a) * 0.34, y + 0.08, Math.sin(a) * 0.34, 0.03, fh - 0.08, 0.03, COL); }
      if (f < floors) g.slab(cx - 0.42, y + fh - 0.04, 0, 0.2, 0.04, 0.3, SLAB);  // the link across to each deck
    }
    // the entrance bridge at first-floor height, and the sign
    g.slab(x0 - w / 2 - 0.14, 0.02 + fh - 0.04, 0.35, 0.3, 0.04, 0.34, SLAB);
    for (const z of [0.19, 0.51]) g.slab(x0 - w / 2 - 0.14, 0.02 + fh, z, 0.3, 0.06, 0.02, WALL);
    g.slab(x0 - w / 2 - 0.26, 0, 0.35, 0.06, fh - 0.02, 0.06, COL);
    g.slab(cx, top, 0, 0.05, 0.3, 0.05, DARK);
    g.lit(1.2, () => g.slab(cx, top + 0.3, 0, 0.3, 0.3, 0.06, BLUE));
    g.lit(1.4, () => { g.slab(cx - 0.05, top + 0.36, 0.031, 0.04, 0.18, 0.006, WHITE); g.slab(cx + 0.01, top + 0.49, 0.031, 0.1, 0.04, 0.006, WHITE); g.slab(cx + 0.01, top + 0.43, 0.031, 0.1, 0.04, 0.006, WHITE); g.slab(cx + 0.05, top + 0.45, 0.031, 0.04, 0.07, 0.006, WHITE); });
  },
};
