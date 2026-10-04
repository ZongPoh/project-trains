import { C } from '../../core/colors.js';
import { shinkansen } from './kit.js';

// E6 Komachi: the red train to Akita. It usually runs coupled to an E5.
const RED = C('#c8102e'), WHITE = C('#f4f4f0'), SILVER = C('#aab1b7'), SKIRT = C('#878e94');

export default shinkansen({
  id: 'e6-komachi',
  name: 'E6 Komachi',
  line: 'Akita',
  meta: 'Bright red over white. Runs to Akita.',
  speed: 4.8,
  cabLen: 0.26,
  body: { w: 0.095 },
  nose: { len: 0.44, drop: 0.22, early: 0.48, taper: 0.7, widePow: 2.6, blunt: 9, lift: 0.012 },
  cab: { from: 0.03, to: 0.22, down: 0.55 },
  lightsAt: 0.32,
  livery(p) {
    p.hull(WHITE);
    p.roof(0.52, RED);
    p.band(-0.5, -0.62, SILVER);
    p.band(-0.7, -0.98, SKIRT);
  },
});
