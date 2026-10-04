import { COL } from '../../core/colors.js';
import { car, wheels } from '../parts.js';

// ARCHIVED: Diesel Freight from the first prototype. Not in the depot; see README.md in this folder.

function loco(g) {
  g.box(0, .062, 0, .19, .035, .58, COL.black); g.box(0, .04, 0, .14, .03, .14, COL.dark);
  g.box(0, .16, .105, .15, .16, .33, COL.orange); g.box(0, .1, .105, .154, .02, .33, COL.yellow);
  g.box(0, .185, -.13, .2, .21, .14, COL.orange); g.box(0, .296, -.13, .21, .012, .16, COL.dark);
  g.box(0, .24, -.13, .204, .055, .1, COL.glass); g.box(0, .25, -.13, .16, .04, .144, COL.glass);
  g.box(0, .135, -.24, .16, .11, .08, COL.orange);
  g.box(0, .13, .272, .152, .1, .006, COL.yellow); g.box(0, .115, -.282, .162, .07, .006, COL.yellow);
  g.cyl(0, .252, .02, .02, .03, COL.dark, 'y'); g.cyl(0, .244, .13, .035, .008, COL.dark, 'y'); g.cyl(0, .244, .215, .035, .008, COL.dark, 'y');
  wheels(g, [-.21, -.14, .14, .21], .03, COL.dark);
}
function container(g, col) {
  const shade = col.clone().multiplyScalar(.72);
  g.box(0, .06, 0, .18, .03, .48, COL.dark); g.box(0, .175, 0, .2, .2, .44, col);
  for (const z of [-.15, -.05, .05, .15]) g.box(0, .175, z, .204, .2, .012, shade);
  wheels(g, [-.19, -.12, .12, .19], .026, COL.dark);
}
function tanker(g) {
  g.box(0, .06, 0, .18, .03, .48, COL.dark); g.cyl(0, .165, 0, .088, .4, COL.silver, 'z');
  g.sph(0, .165, .2, .088, .088, .03, COL.silver); g.sph(0, .165, -.2, .088, .088, .03, COL.silver);
  g.box(0, .165, 0, .18, .022, .4, COL.red); g.cyl(0, .26, 0, .025, .02, COL.dark, 'y');
  wheels(g, [-.19, -.12, .12, .19], .026, COL.dark);
}

export default {
  id: 'diesel',
  name: 'Diesel Freight',
  meta: 'Steady. Three containers and a tanker.',
  speed: 2,
  family: 'archive',
  cars: [
    { len: .6, make: () => car(loco) },
    { len: .5, make: () => car(g => container(g, COL.c1)) },
    { len: .5, make: () => car(g => container(g, COL.c2)) },
    { len: .5, make: () => car(tanker) },
    { len: .5, make: () => car(g => container(g, COL.c3)) },
  ],
};
