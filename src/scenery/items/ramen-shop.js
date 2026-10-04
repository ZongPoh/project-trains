import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';

const WOOD = C('#5a4030'), DARK = C('#33261e'), ROOF = C('#3d4852'), CLOTH = C('#b8322a'), PAPER = C('#f4ecd8');
const LANTERN = C('#d8402f'), GLOW = C('#ffd98a');

// A tiny noodle shop: curtain over the door, paper lantern outside.
export default {
  id: 'ramen-shop',
  name: 'Noodle shop',
  meta: 'Red curtain and a paper lantern.',
  build(g) {
    g.slab(0, 0, 0, 0.66, 0.3, 0.5, WOOD);
    g.slab(0, 0.3, 0.04, 0.76, 0.03, 0.66, ROOF);
    if (snowy()) { g.slab(0, 0.33, 0.04, 0.74, 0.02, 0.64, SNOW); g.slab(0, 0.38, 0, 0.5, 0.02, 0.4, SNOW); }
    g.slab(0, 0.33, 0, 0.5, 0.05, 0.4, DARK);
    g.lit(1.2, () => g.slab(0, 0.02, 0.255, 0.34, 0.2, 0.012, GLOW));   // lit doorway
    for (let i = 0; i < 4; i++) g.slab(-0.126 + i * 0.084, 0.15, 0.27, 0.078, 0.09, 0.008, CLOTH);
    g.slab(-0.25, 0.05, 0.255, 0.1, 0.2, 0.012, PAPER);             // menu board
    g.slab(0.25, 0.1, 0.255, 0.1, 0.12, 0.012, PAPER);
    g.lit(1, () => g.blob(0.29, 0.2, 0.33, 0.045, 0.06, 0.045, LANTERN));   // lantern
    g.slab(0.29, 0.255, 0.33, 0.03, 0.012, 0.03, DARK);
    g.cyl(-0.22, 0.4, -0.12, 0.025, 0.1, DARK, 'y');                // chimney
  },
};
