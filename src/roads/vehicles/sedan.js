import { C } from '../../core/colors.js';

const PAINT = ['#c8362c', '#2f6fb0', '#e9e8e2', '#3b4046', '#d9a52a', '#4f9a6a'].map(C);
const GLASS = C('#22323c'), TYRE = C('#1d2023'), LAMP = C('#fff3c4'), TAIL = C('#d8402f');

// An ordinary family car. Modelled with its front towards +z.
export default {
  id: 'sedan',
  len: 0.3,
  build(g, rnd) {
    const paint = PAINT[Math.floor(rnd() * PAINT.length)];
    g.slab(0, 0.025, 0, 0.14, 0.055, 0.3, paint);
    g.slab(0, 0.08, -0.015, 0.125, 0.05, 0.16, paint);
    g.slab(0, 0.085, -0.015, 0.13, 0.035, 0.13, GLASS);
    g.slab(0, 0.085, -0.015, 0.11, 0.035, 0.165, GLASS);
    for (const x of [-0.07, 0.07]) for (const z of [-0.09, 0.09]) g.cyl(x, 0.028, z, 0.028, 0.02, TYRE, 'x');
    g.lit(1.5, () => { for (const x of [-0.045, 0.045]) g.slab(x, 0.045, 0.148, 0.03, 0.02, 0.008, LAMP); });
    g.lit(0.9, () => { for (const x of [-0.045, 0.045]) g.slab(x, 0.045, -0.152, 0.03, 0.02, 0.006, TAIL); });
  },
};
