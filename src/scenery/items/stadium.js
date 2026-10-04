import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';

const CONC = C('#c9cdd0'), DOME = C('#eef1f2'), RIB = C('#aab3b9'), GLASS = C('#5f8fb0'), DARK = C('#4a5158'), SIGN = C('#2f6fb0'), LAMP = C('#fff6d0'), PLAZA = C('#b9b4a8');

// A domed ballpark: 4 x 4 squares. White roof, ring of windows, four floodlight towers.
export default {
  id: 'stadium',
  name: 'Dome stadium',
  meta: '4 x 4 squares. A domed ballpark with floodlights.',
  size: [4, 4],
  build(g) {
    g.slab(0, 0, 0, 3.9, 0.02, 3.9, PLAZA);
    g.cyl(0, 0.3, 0, 1.62, 0.56, CONC, 'y');                                     // the bowl
    g.lit(0.9, () => g.cyl(0, 0.34, 0, 1.63, 0.1, GLASS, 'y'));                   // a ring of lit windows
    g.cyl(0, 0.6, 0, 1.68, 0.06, DARK, 'y');
    g.sph(0, 0.62, 0, 1.6, snowy() ? 0.6 : 0.56, 1.6, snowy() ? SNOW : DOME);     // the roof
    for (let i = 0; i < 12; i++) {                                               // ribs over the roof
      const a = i / 12 * Math.PI * 2;
      g.blob(Math.cos(a) * 1.05, 0.98, Math.sin(a) * 1.05, 0.5, 0.03, 0.04, RIB, -a);
    }
    g.cyl(0, 1.2, 0, 0.16, 0.06, RIB, 'y');
    g.slab(0, 0.02, 1.7, 0.9, 0.34, 0.3, CONC);                                  // main entrance
    g.lit(1, () => g.slab(0, 0.06, 1.855, 0.6, 0.18, 0.012, GLASS));
    g.lit(1.2, () => g.slab(0, 0.38, 1.72, 1.0, 0.16, 0.06, SIGN));
    for (const [x, z] of [[-1.72, -1.72], [1.72, -1.72], [-1.72, 1.72], [1.72, 1.72]]) {   // floodlights
      g.cyl(x, 0.75, z, 0.035, 1.5, DARK, 'y');
      g.slab(x - Math.sign(x) * 0.06, 1.45, z - Math.sign(z) * 0.06, 0.3, 0.2, 0.06, DARK, Math.atan2(-x, -z));
      g.lit(1.6, () => g.slab(x - Math.sign(x) * 0.09, 1.47, z - Math.sign(z) * 0.09, 0.26, 0.16, 0.03, LAMP, Math.atan2(-x, -z)));
    }
  },
};
