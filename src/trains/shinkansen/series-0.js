import { C } from '../../core/colors.js';
import { shinkansen } from './kit.js';

// 0 Series (1964): the first bullet train. Cream and blue, with the round "bullet" nose.
const CREAM = C('#f3eeda'), BLUE = C('#1f4b9c'), NOSE = C('#dfe3e6'), LAMP = C('#fff0b8');

export default shinkansen({
  id: 'series-0',
  name: '0 Series',
  line: 'Tokaido, 1964',
  meta: 'The 1964 original. Cream and blue, round nose.',
  speed: 3.2,
  cabLen: 0.36,
  nose: { len: 0.24, drop: 0.38, early: 1.7, taper: 0.7, widePow: 2, blunt: 2.6, tipExp: 2.1, lift: 0.03 },
  cab: { from: -0.28, to: 0.2, down: 0.62 },
  lights: false,
  door: C('#e6e0c8'),
  livery(p) {
    p.hull(CREAM);
    p.band(0.56, 0.12, BLUE);        // window band
    p.band(-0.5, -0.98, BLUE);       // skirt
  },
  details(g, k) {
    if (k.part !== 'nose') return;
    const tip = k.at(0.93), eye = k.at(0.52);
    g.sph(0, tip.y, tip.z, 0.034, 0.034, 0.03, NOSE);                       // the round nose cap
    g.lit(1.6, () => { for (const s of [-1, 1]) g.sph(s * eye.w * 0.6, eye.y + eye.h * 0.3, eye.z + 0.01, 0.02, 0.02, 0.018, LAMP); });
  },
});
