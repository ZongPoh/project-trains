import { C } from '../../core/colors.js';
import { shinkansen } from './kit.js';

// E4 Max: the double-decker. Two rows of windows and a huge duck-bill nose. Retired in 2021.
const WHITE = C('#f3f4f1'), BLUE = C('#1d4a9a'), YELLOW = C('#f2c230'), SKIRT = C('#8b9197'), ROOF = C('#c5cace');

export default shinkansen({
  id: 'e4-max',
  name: 'E4 Max',
  line: 'Joetsu, retired 2021',
  meta: 'Double-decker with two rows of windows.',
  speed: 3.6,
  body: { yt: 0.33, exp: 5 },
  nose: { len: 0.4, drop: 0.2, early: 0.5, taper: 0.8, widePow: 3, blunt: 6, lift: 0.01 },
  cab: { from: 0.05, to: 0.26, down: 0.55 },
  lightsAt: 0.45,
  windows: { y: 0.262, y2: 0.168, h: 0.032 },
  pantograph: true,
  livery(p) {
    p.hull(WHITE);
    p.band(-0.34, -0.44, YELLOW);
    p.band(-0.44, -0.98, BLUE);
    p.roof(0.94, ROOF);
  },
});
