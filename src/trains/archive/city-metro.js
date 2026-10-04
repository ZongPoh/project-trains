import { COL } from '../../core/colors.js';
import { car, wheels } from '../parts.js';

// ARCHIVED: City Metro from the first prototype. Not in the depot; see README.md in this folder.

function metroCar(g, cab) {
  g.box(0, .155, 0, .2, .2, .52, COL.silver); g.box(0, .261, 0, .16, .012, .44, COL.dark); g.box(0, .195, 0, .204, .06, .44, COL.glass); g.box(0, .125, 0, .204, .02, .52, COL.teal);
  for (const z of [-.17, 0, .17]) g.box(0, .15, z, .207, .16, .06, COL.teal);
  if (cab) { g.box(0, .19, .261, .17, .085, .006, COL.glass); g.box(0, .105, .261, .19, .06, .006, COL.yellow); }
  wheels(g, [-.19, -.12, .12, .19], .026, COL.dark);
}

export default {
  id: 'metro',
  name: 'City Metro',
  meta: 'Quick. Four cars with a cab at each end.',
  speed: 2.8,
  family: 'archive',
  cars: [
    { len: .54, make: () => car(g => metroCar(g, true)) },
    { len: .54, make: () => car(g => metroCar(g, false)) },
    { len: .54, make: () => car(g => metroCar(g, false)) },
    { len: .54, make: () => car(g => metroCar(g, true), true) },
  ],
};
