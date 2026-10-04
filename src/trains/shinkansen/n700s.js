import { C } from '../../core/colors.js';
import { shinkansen } from './kit.js';

// N700S: today's Tokyo to Osaka flagship. White with blue lines and a long, sculpted nose.
const WHITE = C('#f5f6f3'), BLUE = C('#1b3f94'), ROOF = C('#c9cdd0'), SKIRT = C('#8e959b');

export default shinkansen({
  id: 'n700s',
  name: 'N700S',
  line: 'Tokaido · Sanyo',
  meta: 'The Tokyo to Osaka flagship. White with blue lines.',
  speed: 4.4,
  nose: { len: 0.38, drop: 0.26, early: 0.62, taper: 0.62, widePow: 2.6, blunt: 7 },
  cab: { from: 0.06, to: 0.3, down: 0.55 },
  lightsAt: 0.5,
  livery(p) {
    p.hull(WHITE);
    p.band(-0.04, -0.2, BLUE);
    p.band(-0.27, -0.32, BLUE);
    p.band(-0.7, -0.98, SKIRT);
    p.roof(0.93, ROOF);
  },
});
