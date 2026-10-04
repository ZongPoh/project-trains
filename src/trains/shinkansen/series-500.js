import { C } from '../../core/colors.js';
import { shinkansen } from './kit.js';

// 500 Series: round body and a needle nose, built for 300 km/h in 1997.
const GREY = C('#cfd4da'), CANOPY = C('#55637a'), BLUE = C('#2850a6'), SKIRT = C('#7b8590');

export default shinkansen({
  id: 'series-500',
  name: '500 Series',
  line: 'Sanyo',
  meta: 'Needle nose and a round body. A fan favourite.',
  speed: 4.6,
  cabLen: 0.22,
  body: { exp: 3 },
  nose: { len: 0.5, drop: 0.14, early: 1.15, taper: 0.22, widePow: 1.25, blunt: 10, tipExp: 2.2, lift: 0.012 },
  cab: { from: 0.05, to: 0.26, down: 0.45 },
  lightsAt: 0.42,
  door: C('#b9c0c8'),
  livery(p) {
    p.hull(GREY);
    p.roof(0.14, CANOPY);
    p.band(0.14, -0.06, BLUE);
    p.band(-0.72, -0.98, SKIRT);
  },
});
