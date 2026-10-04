import { C } from '../../core/colors.js';

const WHITE = C('#eeeeea'), BED = C('#c9ccc8'), GLASS = C('#22323c'), TYRE = C('#1d2023'), LAMP = C('#fff3c4'), TAIL = C('#d8402f');
const LOADS = ['#b58545', '#3f8f6b', '#d9a52a'].map(C);

// A kei truck: the small white pickup seen on every Japanese farm road.
export default {
  id: 'kei-truck',
  len: 0.28,
  build(g, rnd) {
    g.slab(0, 0.03, 0, 0.13, 0.03, 0.28, BED);
    g.slab(0, 0.06, 0.085, 0.13, 0.1, 0.1, WHITE);                       // cab
    g.slab(0, 0.105, 0.09, 0.135, 0.04, 0.07, GLASS);
    g.slab(0, 0.105, 0.134, 0.11, 0.04, 0.006, GLASS);
    for (const x of [-0.062, 0.062]) g.slab(x, 0.06, -0.055, 0.008, 0.04, 0.17, WHITE);   // bed sides
    g.slab(0, 0.06, -0.138, 0.13, 0.04, 0.008, WHITE);
    if (rnd() < 0.7) g.slab(0, 0.06, -0.05, 0.1, 0.045, 0.13, LOADS[Math.floor(rnd() * 3)]);   // something in the back
    for (const x of [-0.065, 0.065]) for (const z of [-0.085, 0.09]) g.cyl(x, 0.026, z, 0.026, 0.02, TYRE, 'x');
    g.lit(1.5, () => { for (const x of [-0.04, 0.04]) g.slab(x, 0.065, 0.136, 0.026, 0.018, 0.006, LAMP); });
    g.lit(0.9, () => { for (const x of [-0.045, 0.045]) g.slab(x, 0.045, -0.142, 0.024, 0.016, 0.006, TAIL); });
  },
};
