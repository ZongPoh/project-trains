import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';

const RED = C('#c23a2c'), ROOF = C('#333d44'), STONE = C('#9c988d'), GOLD = C('#d5a63a'), WHITE = C('#efe8d6');

// Five-storey pagoda.
export default {
  id: 'pagoda',
  name: 'Pagoda',
  meta: 'Five storeys in red, with a golden spire.',
  build(g) {
    const tiles = snowy() ? SNOW : ROOF;
    g.slab(0, 0, 0, 0.8, 0.05, 0.8, STONE);
    let y = 0.05, w = 0.44;
    for (let i = 0; i < 5; i++) {
      g.slab(0, y, 0, w, 0.13, w, RED);
      g.lit(0.55, () => g.slab(0, y + 0.085, 0, w + 0.012, 0.03, w + 0.012, WHITE));   // lantern-lit gallery
      g.pyr(0, y + 0.13, 0, w + 0.3, 0.075, tiles, w * 0.72);
      y += 0.205; w -= 0.062;
    }
    g.pyr(0, y, 0, w + 0.16, 0.1, tiles);
    g.cyl(0, y + 0.21, 0, 0.012, 0.26, GOLD, 'y');
    for (let i = 0; i < 4; i++) g.cyl(0, y + 0.13 + i * 0.045, 0, 0.03 - i * 0.004, 0.012, GOLD, 'y');
  },
};
