import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';
import pine from './pine.js';
import { move } from './_inside.js';

const WOOD = C('#6a4a36'), WALL = C('#efe7d3'), ROOF = C('#3b4750'), STONE = C('#9a968c'), WATER = C('#6fb7c9'), PAPER = C('#f6ecd2'), MOSS = C('#6d9a57'), LANTERN = C('#8f8b80');

// A ryokan, a traditional inn: 3 squares wide, 2 deep, with a garden and a hot spring pool.
export default {
  id: 'ryokan',
  name: 'Ryokan inn',
  meta: '3 x 2 squares. Inn with a garden and hot spring.',
  size: [3, 2],
  build(g, rnd) {
    const roof = snowy() ? SNOW : ROOF;
    g.slab(0, 0, 0, 2.9, 0.02, 1.9, snowy() ? SNOW : MOSS);                      // garden ground
    // the main house along the back, two storeys
    g.slab(-0.2, 0.02, -0.4, 2.2, 0.05, 0.9, STONE);
    g.slab(-0.2, 0.07, -0.4, 2.0, 0.3, 0.72, WALL);
    g.slab(-0.2, 0.07, -0.4, 2.02, 0.05, 0.74, WOOD);
    g.lit(0.9, () => { for (let i = 0; i < 6; i++) g.slab(-1.05 + i * 0.34, 0.14, -0.035, 0.24, 0.18, 0.012, PAPER); });   // paper screens
    g.gable(-0.2, 0.37, -0.4, 2.3, 0.1, 1.0, roof, true);
    g.slab(-0.2, 0.42, -0.45, 1.5, 0.26, 0.55, WALL);
    g.lit(0.8, () => { for (let i = 0; i < 4; i++) g.slab(-0.8 + i * 0.4, 0.48, -0.17, 0.26, 0.14, 0.012, PAPER); });
    g.gable(-0.2, 0.68, -0.45, 1.8, 0.24, 0.8, roof, true);
    g.slab(-0.2, 0.9, -0.45, 1.8, 0.03, 0.05, roof);
    g.slab(-0.2, 0.07, 0.03, 2.0, 0.03, 0.14, WOOD);                             // veranda
    // a side wing
    g.slab(1.05, 0.02, 0.15, 0.7, 0.28, 1.2, WALL);
    g.gable(1.05, 0.3, 0.15, 0.86, 0.2, 1.36, roof);
    // the hot spring, ringed with stones
    g.slab(-0.75, 0.02, 0.55, 0.86, 0.04, 0.56, STONE);
    g.lit(0.25, () => g.slab(-0.75, 0.045, 0.55, 0.7, 0.02, 0.4, WATER));
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; g.blob(-0.75 + Math.cos(a) * 0.42, 0.05, 0.55 + Math.sin(a) * 0.27, 0.07, 0.05, 0.07, STONE, a); }
    // a stone lantern and a garden pine
    g.slab(0.15, 0.02, 0.6, 0.08, 0.12, 0.08, LANTERN);
    g.lit(1.2, () => g.slab(0.15, 0.14, 0.6, 0.1, 0.06, 0.1, PAPER));
    g.pyr(0.15, 0.2, 0.6, 0.16, 0.05, LANTERN);
    for (const [x, z] of [[0.5, 0.45], [-1.25, -0.05]]) g.within(move(x, z), () => pine.build(g, rnd));
  },
};
