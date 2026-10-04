import { C } from '../../core/colors.js';
import { shinkansen } from './kit.js';

// E5 Hayabusa: the 320 km/h train to the north. Green over white with a pink stripe.
const GREEN = C('#0c7d62'), WHITE = C('#f2f3ee'), PINK = C('#e23f8c'), SKIRT = C('#8a9197');

export default shinkansen({
  id: 'e5-hayabusa',
  name: 'E5 Hayabusa',
  line: 'Tohoku · Hokkaido',
  meta: 'Fastest in service. Green, white and a pink stripe.',
  speed: 5,
  cabLen: 0.24,
  nose: { len: 0.48, drop: 0.2, early: 0.42, taper: 0.74, widePow: 3, blunt: 9, lift: 0.01 },
  cab: { from: 0.03, to: 0.2, down: 0.55 },
  lightsAt: 0.3,
  livery(p) {
    p.hull(WHITE);
    p.roof(0.6, GREEN);
    p.band(0.04, -0.08, PINK);
    p.band(-0.7, -0.98, SKIRT);
  },
});
