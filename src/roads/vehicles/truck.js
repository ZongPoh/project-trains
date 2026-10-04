import { C } from '../../core/colors.js';

const CAB = ['#2f6fb0', '#c8402c', '#f1ede0', '#3f8f6b'].map(C), BOX = ['#e8eaec', '#d9dde0', '#cfd8d2'].map(C), STRIPE = ['#2f6fb0', '#d94f3d', '#e0b02c'].map(C);
const GLASS = C('#22323c'), TYRE = C('#1d2023'), LAMP = C('#fff3c4'), TAIL = C('#d8402f'), FRAME = C('#3a4046');

// A delivery lorry with a box body: the kind that fills the expressways at night.
export default {
  id: 'truck',
  len: 0.44,
  build(g, rnd) {
    const cab = CAB[Math.floor(rnd() * CAB.length)], box = BOX[Math.floor(rnd() * BOX.length)];
    g.slab(0, 0.035, -0.01, 0.13, 0.02, 0.42, FRAME);
    g.slab(0, 0.055, -0.065, 0.15, 0.155, 0.3, box);                     // the box
    g.slab(0, 0.11, -0.065, 0.153, 0.03, 0.302, STRIPE[Math.floor(rnd() * STRIPE.length)]);
    g.slab(0, 0.04, 0.155, 0.14, 0.13, 0.1, cab);                        // the cab
    g.lit(0.5, () => { g.slab(0, 0.105, 0.16, 0.143, 0.05, 0.07, GLASS); g.slab(0, 0.105, 0.206, 0.12, 0.05, 0.006, GLASS); });
    for (const x of [-0.07, 0.07]) for (const z of [-0.15, -0.06, 0.14]) g.cyl(x, 0.03, z, 0.03, 0.022, TYRE, 'x');
    g.lit(1.5, () => { for (const x of [-0.045, 0.045]) g.slab(x, 0.055, 0.206, 0.03, 0.02, 0.006, LAMP); });
    g.lit(0.9, () => { for (const x of [-0.05, 0.05]) g.slab(x, 0.06, -0.216, 0.03, 0.02, 0.006, TAIL); });
  },
};
