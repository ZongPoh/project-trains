import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';

const SKIN = [C('#c8d0d6'), C('#b9c2c9'), C('#d9d6cd'), C('#a9b7c4')], GLASS = [C('#5f8fb0'), C('#4f7a98'), C('#7aa7bf')];
const DARK = C('#4a5158'), WHITE = C('#eef0ee'), RED = C('#d1362b');

// A city office block. Height varies from one to the next.
export default {
  id: 'office',
  name: 'Office block',
  meta: 'A city tower. Each one is a different height.',
  build(g, rnd) {
    const floors = 5 + Math.floor(rnd() * 6), fh = 0.15, h = floors * fh + 0.08;
    const skin = SKIN[Math.floor(rnd() * 4)], glass = GLASS[Math.floor(rnd() * 3)];
    const w = 0.62 + rnd() * 0.14, d = 0.56 + rnd() * 0.14;
    g.slab(0, 0, 0, w + 0.04, 0.08, d + 0.04, DARK);
    g.slab(0, 0.08, 0, w, h - 0.08, d, skin);
    for (let f = 0; f < floors; f++) {                               // a ribbon of glass on every floor
      const y = 0.12 + f * fh;
      g.lit(rnd() < 0.62 ? 0.85 : 0, () => {                         // some floors work late
        g.slab(0, y, 0, w + 0.008, 0.075, d * 0.86, glass);
        g.slab(0, y, 0, w * 0.86, 0.075, d + 0.008, glass);
      });
    }
    g.slab(0, h, 0, w + 0.02, 0.025, d + 0.02, WHITE);
    if (snowy()) g.slab(0, h + 0.025, 0, w, 0.03, d, SNOW);
    g.slab(w * 0.18, h + 0.025, -d * 0.15, 0.2, 0.07, 0.16, DARK);   // roof plant
    g.cyl(-w * 0.25, h + 0.13, d * 0.2, 0.008, 0.22, DARK, 'y');     // mast with a warning light
    g.lit(1.5, () => g.blob(-w * 0.25, h + 0.25, d * 0.2, 0.018, 0.018, 0.018, RED));
  },
};
