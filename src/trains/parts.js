import { GB, ROT180 } from '../core/builder.js';
import { COL } from '../core/colors.js';
import { trainMat } from '../core/stage.js';

// Pieces shared by every train.

// Pairs of wheels on an axle. zs = where along the car, r = wheel radius.
export function wheels(g, zs, r, col) {
  for (const z of zs) {
    for (const s of [-1, 1]) g.cyl(s * 0.09, r, z, r, 0.02, col, 'x');
    g.cyl(0, r, z, 0.008, 0.17, COL.steel, 'x');
  }
}

// Build one car as a single mesh. Cars are modelled with their front towards +z;
// rev turns the car round, for the cab at the back of a train.
export function car(fn, rev) {
  const gb = new GB();
  if (rev) gb.base = ROT180;
  fn(gb);
  const m = gb.mesh(trainMat);
  m.castShadow = true;
  return m;
}
