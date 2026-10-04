import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';

const ROOF = C('#e9ecee'), TRIM = C('#1f7a4d'), POST = C('#5d6b76'), BOOTH = C('#f1ede0'), GLASS = C('#9fd0e0'), GO = C('#37e078'), ARM = C('#f2c230'), ISLAND = C('#d8d5ca'), PURPLE = C('#6a4fb0');

// An expressway toll gate: a wide roof over the road with a booth at each side and a green
// lamp over each lane. It stands over one straight road square; cars slow down as they pass.
export default {
  id: 'toll-gate',
  name: 'Toll gate',
  meta: 'Goes over a straight road. Cars stop to pay.',
  on: 'road',
  build(g) {                                                 // the road runs along z through the middle
    const top = 0.4;
    g.slab(0, top, 0, 1.0, 0.045, 0.46, ROOF);
    g.slab(0, top - 0.012, 0, 1.02, 0.014, 0.48, TRIM);
    if (snowy()) g.slab(0, top + 0.045, 0, 0.98, 0.012, 0.44, SNOW);
    for (const s of [-1, 1]) {
      g.slab(s * 0.42, 0, 0, 0.14, 0.03, 0.44, ISLAND);                    // kerb islands at the sides
      g.slab(s * 0.42, 0.03, -0.02, 0.11, 0.2, 0.2, BOOTH);                // booth
      g.lit(0.9, () => g.slab(s * 0.42, 0.11, -0.02, 0.115, 0.08, 0.16, GLASS));
      g.slab(s * 0.42, 0.23, -0.02, 0.13, 0.014, 0.22, TRIM);
      for (const z of [-0.19, 0.19]) g.slab(s * 0.46, 0, z, 0.03, top, 0.03, POST);
      g.slab(s * 0.33, 0.14, 0.17, 0.012, 0.012, 0.012, POST);
      g.slab(s * 0.29, 0.2, 0.17, 0.014, 0.16, 0.014, ARM);                // barrier arm, raised
      g.lit(1.5, () => g.slab(s * 0.14, top - 0.05, 0.232, 0.07, 0.035, 0.01, GO));   // lane open
      g.lit(0.8, () => g.slab(s * 0.14, top + 0.06, 0.2, 0.2, 0.07, 0.014, PURPLE));  // ETC sign
    }
    g.slab(0, 0, 0, 0.03, 0.03, 0.4, ISLAND);                              // centre line kerb
    g.lit(0.5, () => g.slab(0, top + 0.06, -0.2, 0.5, 0.09, 0.014, TRIM));
  },
};
