import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';
import pine from './pine.js';
import sedan from '../../roads/vehicles/sedan.js';
import keiTruck from '../../roads/vehicles/kei-truck.js';
import truck from '../../roads/vehicles/truck.js';
import bus from '../../roads/vehicles/bus.js';
import { move, turned } from './_inside.js';

const TAR = C('#4b5057'), LINE = C('#f4f2ea'), KERB = C('#e0ddd2'), PAVE = C('#cfc8b8'), WALL = C('#efe7d3'), WOOD = C('#7b5a40'), ROOF = C('#3b4750');
const GLASS = C('#bfe0ea'), WARM = C('#ffd9a0'), SIGN = C('#1f7a4d'), WHITE = C('#f6f6f1'), STEEL = C('#5d6b76'), LAMP = C('#ffe9a8'), RED = C('#c8402c');
const VEND = ['#c8402c', '#2f6fb0', '#f1ede0', '#3f8f6b'].map(C);

// A service area: the rest stop on a Japanese expressway. 4 squares wide, 2 deep. Parking for
// cars, lorries and a coach along the front, and at the back a food hall with a row of vending
// machines, a fuel stand and a tall sign. Put its front edge along a road and some drivers
// turn in and park in a bay for a rest; buses and lorries stop in the lane along the front.
export default {
  id: 'service-area',
  name: 'Service area',
  meta: '4 x 2 squares. Rest stop: parking, food hall, fuel. Kerb to a road.',
  size: [4, 2],
  build(g, rnd) {
    const snow = snowy(), top = snow ? SNOW : ROOF;
    g.slab(0, 0, 0, 3.94, 0.02, 1.94, TAR);                                       // the car park
    g.slab(0, 0.002, 1.08, 3.94, 0.018, 0.26, TAR);                               // the way in and out, along the road
    g.slab(0, 0.004, -0.62, 3.94, 0.024, 0.68, PAVE);                             // paving round the buildings
    // parking bays along the front, nose in
    for (let i = 0; i <= 9; i++) g.slab(-1.75 + i * 0.26, 0.021, 0.5, 0.014, 0.002, 0.44, LINE);
    const kinds = [sedan, sedan, keiTruck, sedan];
    for (let i = 0; i < 9; i++) {
      if (rnd() < 0.3 || i === 0 || i === 4) continue;           // the first and fifth bays are kept for cars that drive in (roads/cars.js)
      const k = kinds[Math.floor(rnd() * kinds.length)];
      g.within(turned(-1.62 + i * 0.26, 0.5, rnd() < 0.5 ? 0 : Math.PI), () => k.build(g, rnd));
    }
    // long bays for a lorry and a coach
    for (const x of [0.72, 1.3, 1.88]) g.slab(x, 0.021, 0.42, 0.014, 0.002, 0.62, LINE);
    g.within(turned(1.01, 0.4, 0), () => truck.build(g, rnd));
    g.within(turned(1.59, 0.42, Math.PI), () => bus.build(g, rnd));
    // the food hall
    g.slab(-0.75, 0.028, -0.62, 1.9, 0.26, 0.5, WALL);
    g.slab(-0.75, 0.028, -0.62, 1.92, 0.05, 0.52, WOOD);
    g.lit(1, () => g.slab(-0.75, 0.09, -0.366, 1.7, 0.15, 0.012, WARM));          // a wall of windows
    for (let i = 0; i < 6; i++) g.slab(-1.55 + i * 0.32, 0.09, -0.36, 0.02, 0.15, 0.014, WOOD);
    g.gable(-0.75, 0.288, -0.62, 2.1, 0.2, 0.74, top, true);
    g.lit(0.9, () => g.slab(-0.75, 0.3, -0.3, 0.9, 0.09, 0.02, RED));             // the sign over the door
    g.slab(-0.75, 0.25, -0.3, 1.2, 0.016, 0.16, WOOD);                            // porch roof
    for (const x of [-1.3, -0.2]) g.slab(x, 0.028, -0.24, 0.025, 0.225, 0.025, WOOD);
    // vending machines in a row
    for (let i = 0; i < 5; i++) {
      const x = 0.42 + i * 0.1;
      g.slab(x, 0.028, -0.8, 0.085, 0.17, 0.07, VEND[i % VEND.length]);
      g.lit(1.1, () => g.slab(x, 0.1, -0.763, 0.07, 0.07, 0.006, GLASS));
    }
    g.slab(0.62, 0.21, -0.8, 0.58, 0.014, 0.16, top);
    // the fuel stand
    for (const x of [1.25, 1.75]) g.slab(x, 0.024, -0.6, 0.035, 0.3, 0.035, STEEL);
    g.slab(1.5, 0.324, -0.6, 0.78, 0.035, 0.5, WHITE);
    g.slab(1.5, 0.318, -0.6, 0.8, 0.012, 0.52, RED);
    g.lit(1.3, () => g.slab(1.5, 0.312, -0.6, 0.5, 0.008, 0.3, LAMP));
    for (const x of [1.38, 1.62]) { g.slab(x, 0.024, -0.6, 0.06, 0.13, 0.05, RED); g.slab(x, 0.154, -0.6, 0.064, 0.02, 0.054, WHITE); }
    // the tall sign by the road, and lamps
    g.slab(-1.82, 0.02, 0.8, 0.03, 0.62, 0.03, STEEL);
    g.lit(0.8, () => { g.slab(-1.82, 0.52, 0.8, 0.26, 0.2, 0.03, SIGN); g.slab(-1.82, 0.6, 0.8, 0.18, 0.05, 0.034, WHITE); g.slab(-1.82, 0.54, 0.8, 0.1, 0.03, 0.034, WHITE); });
    for (const [x, z] of [[-0.6, 0.1], [0.6, 0.1], [1.9, 0.85]]) {
      g.slab(x, 0.02, z, 0.014, 0.36, 0.014, STEEL);
      g.lit(1.5, () => g.sph(x, 0.4, z, 0.026, 0.026, 0.026, LAMP));
    }
    for (const [x, z] of [[-1.85, -0.75], [1.9, -0.9], [0.1, -0.85]]) g.within(move(x, z), () => pine.build(g, rnd));
  },
};
