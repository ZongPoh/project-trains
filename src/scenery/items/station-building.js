import { C } from '../../core/colors.js';
import { drawHallSlice } from '../../tracks/features/hall.js';

const PLAT = C('#bdb8ab'), RAIL = C('#77838b'), BED = C('#8f8b7f');

// The station building is not an ordinary item: clicking a station with it builds a concourse
// across all of that station's tracks (see tools/scenery.js and tracks/features/hall.js). The
// model here is only for its picture in the depot: a building over two tracks.
export default {
  id: 'station-building',
  name: 'Station building',
  meta: 'Click a station: a concourse over the tracks. Click again to remove.',
  special: 'hall',
  build(g) {
    for (const x of [-0.5, 0.5]) {
      g.slab(x, 0, 0, 0.42, 0.03, 1.6, BED);
      for (const s of [-0.09, 0.09]) g.slab(x + s, 0.03, 0, 0.02, 0.02, 1.6, RAIL);
    }
    for (const x of [-0.93, 0, 0.93]) g.slab(x, 0, 0, x ? 0.26 : 0.5, 0.11, 1.6, PLAT);
    for (let i = 0; i < 2; i++) drawHallSlice(g, { x: -1 + i, y: 0, z: -0.5, ax: 0, first: i === 0, last: i === 1 });
  },
};
