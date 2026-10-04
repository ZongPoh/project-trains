import { C } from '../../core/colors.js';

const FLOOR = C('#4a4640'), ROOF = C('#2f3438'), LANTERN = C('#e2432f'), PAPER = C('#ffe6b0'), WARM = C('#ffd08a'), CRATE = C('#c9a15a'), STOOL = C('#7b4a2b');
const WALLS = ['#6a4a36', '#8c5a44', '#d8cdb8', '#4f5b63', '#9b3f33'].map(C);
const NOREN = ['#1f3f77', '#b3271e', '#f3efe2', '#2e6b4a', '#3a2a5e'].map(C);

// Shops under the tracks (gado-shita): the little bars and noodle counters that fill the space
// under a Japanese railway viaduct. Two to a square, each with a lit doorway, a cloth curtain
// and a red lantern. They go under straight level-1 track or highway, and turn to face outwards.
export default {
  id: 'viaduct-shops',
  name: 'Shops under the tracks',
  meta: 'Goes under raised track or highway. Lanterns and noodle bars.',
  under: true,
  build(g, rnd) {
    g.slab(0, 0, 0, 0.84, 0.012, 0.98, FLOOR);
    for (const z of [-0.245, 0.245]) {
      const wall = WALLS[Math.floor(rnd() * WALLS.length)], cloth = NOREN[Math.floor(rnd() * NOREN.length)], h = 0.33 + rnd() * 0.06;
      g.slab(0, 0.012, z, 0.7, h, 0.45, wall);
      g.slab(0, 0.012 + h, z, 0.74, 0.02, 0.47, ROOF);
      for (const s of [-1, 1]) {                                   // a front on each side of the viaduct
        g.lit(1.1, () => g.slab(s * 0.352, 0.03, z - 0.04, 0.008, 0.2, 0.26, WARM));                 // the open doorway
        for (let i = 0; i < 3; i++) g.slab(s * 0.358, 0.16, z - 0.125 + i * 0.086, 0.008, 0.075, 0.078, cloth);   // noren curtain
        g.lit(0.7, () => g.slab(s * 0.356, 0.26, z, 0.01, 0.05, 0.36, PAPER));                       // signboard
        g.lit(1.4, () => g.slab(s * 0.385, 0.13, z + 0.16, 0.04, 0.07, 0.04, LANTERN));              // red lantern
        if (rnd() < 0.6) g.slab(s * 0.41, 0.012, z + 0.02, 0.045, 0.05, 0.045, STOOL);
        if (rnd() < 0.5) g.slab(s * 0.4, 0.012, z - 0.17, 0.06, 0.07, 0.07, CRATE);
      }
    }
  },
};
