import { COL } from '../../core/colors.js';
import { car, wheels } from '../parts.js';

// ARCHIVED: Steam Engine from the first prototype. Not in the depot; see README.md in this folder.

function loco(g) {
  g.box(0, .06, 0, .17, .03, .54, COL.black);
  g.box(0, .065, .272, .2, .04, .016, COL.red); g.box(0, .065, -.272, .2, .04, .016, COL.red);
  g.box(0, .175, -.185, .2, .21, .17, COL.green); g.box(0, .288, -.185, .22, .016, .21, COL.black); g.box(0, .215, -.185, .204, .055, .09, COL.glass);
  g.cyl(0, .15, .05, .068, .3, COL.green, 'z'); g.cyl(0, .15, .23, .072, .07, COL.black, 'z');
  g.cyl(0, .245, .225, .018, .07, COL.black, 'y', .027); g.cyl(0, .225, .07, .028, .04, COL.brass, 'y'); g.cyl(0, .222, -.03, .012, .03, COL.brass, 'y');
  g.sph(0, .15, .266, .022, .022, .01, COL.lamp);
  wheels(g, [-.02, .09, .2], .042, COL.red); wheels(g, [-.2], .028, COL.black);
  for (const s of [-1, 1]) g.box(s * .104, .042, .09, .006, .012, .24, COL.steel);
}
function tender(g) {
  g.box(0, .06, 0, .17, .03, .28, COL.black); g.box(0, .135, 0, .2, .12, .27, COL.green); g.box(0, .2, 0, .16, .025, .2, COL.coal);
  wheels(g, [-.08, .08], .028, COL.black);
}
function wagon(g, load) {
  g.box(0, .06, 0, .17, .03, .38, COL.black); g.box(0, .085, 0, .2, .02, .37, COL.brown);
  for (const s of [-1, 1]) { g.box(s * .094, .125, 0, .012, .07, .37, COL.brown); g.box(0, .125, s * .179, .2, .07, .012, COL.brown); }
  if (load === 'logs') { g.cyl(-.05, .125, 0, .03, .32, COL.wood, 'z'); g.cyl(.05, .125, 0, .03, .32, COL.wood, 'z'); g.cyl(0, .177, 0, .03, .32, COL.wood, 'z'); }
  else { g.box(0, .13, 0, .17, .06, .34, COL.coal); g.sph(0, .16, -.07, .07, .03, .09, COL.coal); g.sph(0, .16, .08, .07, .03, .08, COL.coal); }
  wheels(g, [-.12, .12], .028, COL.black);
}
function brakeVan(g) {
  g.box(0, .06, 0, .17, .03, .34, COL.black); g.box(0, .16, 0, .19, .17, .3, COL.red); g.box(0, .252, 0, .21, .016, .34, COL.black); g.box(0, .19, 0, .194, .05, .09, COL.glass);
  wheels(g, [-.1, .1], .028, COL.black);
}

export default {
  id: 'steam',
  name: 'Steam Engine',
  meta: 'Slow. Tender, two wagons and a brake van.',
  speed: 1.5,
  family: 'archive',
  cars: [
    { len: .56, make: () => car(loco) },
    { len: .3, make: () => car(tender) },
    { len: .4, make: () => car(g => wagon(g, 'logs')) },
    { len: .4, make: () => car(g => wagon(g, 'coal')) },
    { len: .36, make: () => car(brakeVan) },
  ],
};
