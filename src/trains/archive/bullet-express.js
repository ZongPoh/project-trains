import { COL } from '../../core/colors.js';
import { car, wheels } from '../parts.js';

// ARCHIVED: the generic Bullet Express from the first prototype, replaced by the real
// Shinkansen in ../shinkansen. Not in the depot; see README.md in this folder.

function nose(g) {
  g.box(0, .15, -.14, .2, .18, .32, COL.white); g.sph(0, .14, .02, .1, .085, .28, COL.white); g.sph(0, .186, .07, .066, .045, .11, COL.glass);
  g.box(0, .115, -.14, .204, .026, .32, COL.blue); g.box(0, .19, -.16, .203, .04, .24, COL.glass); g.box(0, .045, -.13, .18, .03, .3, COL.grey);
  wheels(g, [-.24, -.16, 0, .08], .024, COL.dark);
}
function coach(g) {
  g.box(0, .15, 0, .2, .18, .55, COL.white); g.box(0, .115, 0, .204, .026, .55, COL.blue); g.box(0, .19, 0, .203, .04, .44, COL.glass);
  g.box(0, .246, 0, .1, .012, .3, COL.grey); g.box(0, .045, 0, .18, .03, .5, COL.grey);
  wheels(g, [-.2, -.12, .12, .2], .024, COL.dark);
}

export default {
  id: 'bullet',
  name: 'Bullet Express',
  meta: 'Fast. Five-car set with a nose at each end.',
  speed: 4.4,
  family: 'archive',
  cars: [
    { len: .62, make: () => car(nose) },
    { len: .56, make: () => car(coach) },
    { len: .56, make: () => car(coach) },
    { len: .56, make: () => car(coach) },
    { len: .62, make: () => car(nose, true) },
  ],
};
