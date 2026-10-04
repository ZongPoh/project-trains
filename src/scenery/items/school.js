import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';
import sakura from './sakura.js';
import { move } from './_inside.js';

const WALL = C('#eee6d2'), GLASS = C('#86b3cc'), TRIM = C('#8a5a44'), DARK = C('#3c4248'), YARD = C('#c9b48a'), LINE = C('#f4f1e6'), CLOCK = C('#fbfaf3'), GREEN = C('#3f8f6b');

// A school: 4 squares wide, 2 deep. A long classroom block with a clock, and a sports ground.
export default {
  id: 'school',
  name: 'School',
  meta: '4 x 2 squares. Classrooms, clock and sports ground.',
  size: [4, 2],
  build(g, rnd) {
    g.slab(0, 0, 0.42, 3.8, 0.015, 1.0, snowy() ? SNOW : YARD);                  // sports ground
    g.slab(0.3, 0.016, 0.42, 1.6, 0.003, 0.03, LINE);                            // running track lines
    for (const z of [0.12, 0.72]) g.slab(0.3, 0.016, z, 1.6, 0.003, 0.02, LINE);
    for (const x of [-0.5, 1.1]) g.slab(x, 0.016, 0.42, 0.02, 0.003, 0.6, LINE);
    for (const x of [1.55, 1.75]) g.slab(x, 0, 0.1, 0.02, 0.2, 0.02, DARK);      // goal
    g.slab(1.65, 0.19, 0.1, 0.22, 0.02, 0.02, DARK);
    // classroom block, three floors
    const w = 3.6, d = 0.62, h = 0.72, z = -0.55;
    g.slab(0, 0, z, w + 0.06, 0.05, d + 0.06, DARK);
    g.slab(0, 0.05, z, w, h, d, WALL);
    for (let f = 0; f < 3; f++) {
      g.lit(f === 2 || rnd() < 0.4 ? 0 : 0.7, () => {
        for (let i = 0; i < 14; i++) g.slab(-w / 2 + 0.2 + i * (w - 0.4) / 13, 0.12 + f * 0.23, z + d / 2, 0.17, 0.12, 0.012, GLASS);
      });
      g.slab(0, 0.26 + f * 0.23, z + d / 2 + 0.01, w, 0.015, 0.03, TRIM);
    }
    g.slab(0, 0.77, z, w + 0.04, 0.03, d + 0.04, snowy() ? SNOW : DARK);
    // the entrance tower with the clock
    g.slab(0, 0.05, z + 0.08, 0.5, 0.98, 0.7, WALL);
    g.lit(0.8, () => g.slab(0, 0.06, z + 0.435, 0.26, 0.2, 0.012, GLASS));
    g.cyl(0, 0.86, z + 0.44, 0.1, 0.02, CLOCK, 'z');
    g.slab(0, 0.855, z + 0.452, 0.012, 0.07, 0.004, DARK); g.slab(0.025, 0.855, z + 0.452, 0.05, 0.012, 0.004, DARK);
    g.pyr(0, 1.03, z + 0.08, 0.56, 0.12, snowy() ? SNOW : GREEN);
    // cherry trees at the gate
    for (const x of [-1.6, -1.15]) g.within(move(x, 0.55), () => sakura.build(g, rnd));
  },
};
