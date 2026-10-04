import { C } from '../../core/colors.js';

const BODY = [C('#1f2a44'), C('#e3b21c'), C('#2e7d5b')], GLASS = C('#22323c'), TYRE = C('#1d2023'), SIGN = C('#fff6d0'), LAMP = C('#fff3c4'), TAIL = C('#d8402f');

// A taxi, with its lit roof sign.
export default {
  id: 'taxi',
  len: 0.31,
  build(g, rnd) {
    const paint = BODY[Math.floor(rnd() * BODY.length)];
    g.slab(0, 0.025, 0, 0.14, 0.06, 0.31, paint);
    g.slab(0, 0.085, -0.02, 0.128, 0.055, 0.17, paint);
    g.slab(0, 0.092, -0.02, 0.132, 0.035, 0.14, GLASS);
    g.slab(0, 0.092, -0.02, 0.112, 0.035, 0.175, GLASS);
    g.lit(1.2, () => g.slab(0, 0.14, -0.02, 0.05, 0.02, 0.025, SIGN));
    for (const x of [-0.07, 0.07]) for (const z of [-0.095, 0.095]) g.cyl(x, 0.028, z, 0.028, 0.02, TYRE, 'x');
    g.lit(1.5, () => { for (const x of [-0.045, 0.045]) g.slab(x, 0.048, 0.153, 0.03, 0.02, 0.008, LAMP); });
    g.lit(0.9, () => { for (const x of [-0.045, 0.045]) g.slab(x, 0.048, -0.157, 0.03, 0.02, 0.006, TAIL); });
  },
};
