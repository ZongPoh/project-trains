import { C } from '../../core/colors.js';
import { shinkansen } from './kit.js';

// 800 Series Tsubame: Kyushu's bullet train. White with red lines above and below the windows.
const WHITE = C('#f6f5f1'), RED = C('#c4161c'), GOLD = C('#c9a24a'), SKIRT = C('#4b5157'), ROOF = C('#d2d3cf');

export default shinkansen({
  id: 'series-800',
  name: '800 Tsubame',
  line: 'Kyushu',
  meta: 'Kyushu’s swallow. White with a red line.',
  speed: 3.9,
  nose: { len: 0.32, drop: 0.3, early: 0.9, taper: 0.6, widePow: 2.2, blunt: 5, tipExp: 2.4 },
  cab: { from: 0.06, to: 0.34, down: 0.48 },
  lightsAt: 0.6,
  livery(p) {
    p.hull(WHITE);
    p.roof(0.93, ROOF);
    p.band(0.78, 0.62, RED);
    p.band(-0.06, -0.16, RED);
    p.band(-0.19, -0.22, GOLD);
    p.band(-0.7, -0.98, SKIRT);
  },
});
