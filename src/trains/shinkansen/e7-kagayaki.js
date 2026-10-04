import { C } from '../../core/colors.js';
import { shinkansen } from './kit.js';

// E7 / W7 Kagayaki: Tokyo to Kanazawa. Ivory body, sky-blue roof and a copper stripe.
const IVORY = C('#f1ecdc'), BLUE = C('#2f66b3'), COPPER = C('#b6733a'), SKIRT = C('#8b9197');

export default shinkansen({
  id: 'e7-kagayaki',
  name: 'E7 Kagayaki',
  line: 'Hokuriku',
  meta: 'Ivory, blue roof and a copper stripe. To Kanazawa.',
  speed: 4,
  nose: { len: 0.34, drop: 0.28, early: 0.7, taper: 0.66, widePow: 2.4, blunt: 6 },
  cab: { from: 0.05, to: 0.32, down: 0.5 },
  lightsAt: 0.5,
  livery(p) {
    p.hull(IVORY);
    p.roof(0.64, BLUE);
    p.band(-0.02, -0.1, COPPER);
    p.band(-0.1, -0.2, BLUE);
    p.band(-0.7, -0.98, SKIRT);
  },
});
