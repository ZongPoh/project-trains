import { C } from '../../core/colors.js';
import { shinkansen } from './kit.js';

// L0 Series: the maglev. It floats above the track and holds the rail speed record, 603 km/h.
const WHITE = C('#f4f6f7'), BLUE = C('#2a5db0'), DEEP = C('#17356e'), SKIRT = C('#b9c0c6');

export default shinkansen({
  id: 'l0-maglev',
  name: 'L0 Maglev',
  line: 'Chuo, test line',
  meta: 'Floats on magnets. 603 km/h record holder.',
  speed: 6.4,
  cabLen: 0.16,
  body: { exp: 6, yb: 0.035, yt: 0.24 },
  nose: { len: 0.56, drop: 0.12, early: 0.55, taper: 0.86, widePow: 4, blunt: 12, tipExp: 4, lift: 0.004 },
  cab: { from: -0.02, to: 0.1, down: 0.62 },
  lightsAt: 0.2,
  wheels: false,
  pantograph: false,
  livery(p) {
    p.hull(WHITE);
    p.band(0.1, -0.16, BLUE);
    p.band(-0.16, -0.24, DEEP);
    p.band(-0.72, -0.98, SKIRT);
  },
});
