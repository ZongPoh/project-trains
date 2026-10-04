import { C } from '../../core/colors.js';

const BODY = [C('#f1ede0'), C('#e8eef2')], BAND = [C('#c8402c'), C('#2f6fb0'), C('#3f8f6b')], GLASS = C('#22323c'), TYRE = C('#1d2023'), LAMP = C('#fff3c4'), TAIL = C('#d8402f');

// A town bus: cream with a coloured band and a row of lit windows.
export default {
  id: 'bus',
  len: 0.42,
  build(g, rnd) {
    const band = BAND[Math.floor(rnd() * BAND.length)];
    g.slab(0, 0.03, 0, 0.15, 0.15, 0.42, BODY[Math.floor(rnd() * 2)]);
    g.slab(0, 0.05, 0, 0.154, 0.03, 0.422, band);
    g.lit(0.8, () => { g.slab(0, 0.105, -0.01, 0.156, 0.045, 0.34, GLASS); g.slab(0, 0.1, 0.208, 0.13, 0.055, 0.008, GLASS); });
    for (const x of [-0.075, 0.075]) for (const z of [-0.13, 0.13]) g.cyl(x, 0.03, z, 0.03, 0.02, TYRE, 'x');
    g.lit(1.5, () => { for (const x of [-0.05, 0.05]) g.slab(x, 0.05, 0.21, 0.03, 0.02, 0.008, LAMP); });
    g.lit(0.9, () => { for (const x of [-0.05, 0.05]) g.slab(x, 0.05, -0.212, 0.03, 0.02, 0.006, TAIL); });
  },
};
