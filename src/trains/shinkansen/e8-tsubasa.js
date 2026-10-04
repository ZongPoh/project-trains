import { C } from '../../core/colors.js';
import { shinkansen } from './kit.js';

// E8 Tsubasa: new in 2024 for the Yamagata line. Purple roof, yellow stripe, white body.
const PURPLE = C('#4a2a7d'), YELLOW = C('#f0a81c'), WHITE = C('#f5f4f1'), SKIRT = C('#8b9197');

export default shinkansen({
  id: 'e8-tsubasa',
  name: 'E8 Tsubasa',
  line: 'Yamagata',
  meta: 'New in 2024. Purple roof with a yellow stripe.',
  speed: 4.2,
  body: { w: 0.095 },
  nose: { len: 0.36, drop: 0.24, early: 0.6, taper: 0.68, widePow: 2.6, blunt: 8 },
  cab: { from: 0.04, to: 0.28, down: 0.52 },
  lightsAt: 0.45,
  livery(p) {
    p.hull(WHITE);
    p.roof(0.6, PURPLE);
    p.band(0.6, 0.5, YELLOW);
    p.band(-0.7, -0.98, SKIRT);
  },
});
