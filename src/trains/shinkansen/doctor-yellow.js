import { C } from '../../core/colors.js';
import { shinkansen } from './kit.js';

// Doctor Yellow: the track inspection train. Spotting it is said to bring good luck.
const YELLOW = C('#f5c614'), BLUE = C('#1b4fa0'), ROOF = C('#d9ac0a'), SKIRT = C('#7f868c'), DISH = C('#e9ecee');

export default shinkansen({
  id: 'doctor-yellow',
  name: 'Doctor Yellow',
  line: 'Inspection train',
  meta: 'Checks the track at full speed. Never stops at stations.',
  service: 'through',
  speed: 3.8,
  nose: { len: 0.34, drop: 0.3, early: 0.8, taper: 0.8, widePow: 3, blunt: 6 },
  cab: { from: 0.04, to: 0.3, down: 0.5 },
  lightsAt: 0.55,
  door: C('#e3b40f'),
  livery(p) {
    p.hull(YELLOW);
    p.band(-0.04, -0.2, BLUE);
    p.band(-0.27, -0.32, BLUE);
    p.band(-0.7, -0.98, SKIRT);
    p.roof(0.93, ROOF);
  },
  details(g, k) {
    if (k.part !== 'coach' || k.index !== 0) return;
    g.box(0, k.body.yt + 0.02, -0.12, 0.09, 0.03, 0.12, DISH);     // observation dome for the overhead wire
    g.sph(0, k.body.yt + 0.035, -0.12, 0.04, 0.02, 0.05, C('#22323c'));
  },
});
