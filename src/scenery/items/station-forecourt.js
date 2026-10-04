import { Matrix4 } from 'three';
import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../seasons.js';
import sakura from './sakura.js';
import taxi from '../../roads/vehicles/taxi.js';
import { scaled } from './_inside.js';

const PAVE = C('#d3ccbb'), PAVE2 = C('#bfb7a4'), ASPHALT = C('#4b5057'), KERB = C('#e9e6dc'), LINE = C('#f4f2ea');
const STEEL = C('#5d6b76'), ROOF = C('#3b4854'), GLASS = C('#bfe0ea'), SIGN = C('#1f5fae'), TAXI = C('#f1c232'), WHITE = C('#f6f6f1');
const STALL = C('#8a5a3a'), AWN = C('#c8402c'), LAMP = C('#ffe9a8'), BOX = [C('#d94f3d'), C('#2f6fb0'), C('#e0b02c'), C('#3f8f6b')], TYRE = C('#1d2023'), PLANTER = C('#9a968c');

// Parked vehicles are the same models that drive on the roads, turned to stand along the kerb.
const parked = (x, z, turn) => new Matrix4().makeRotationY(turn).setPosition(x, 0, z);

function bicycle(g, x, z, col) {
  for (const dz of [-0.03, 0.03]) g.cyl(x, 0.045, z + dz, 0.02, 0.006, TYRE, 'x');
  g.box(x, 0.062, z, 0.008, 0.008, 0.07, col);
  g.box(x, 0.078, z + 0.028, 0.03, 0.006, 0.006, STEEL);                        // handlebars
  g.box(x, 0.074, z - 0.018, 0.012, 0.006, 0.02, TYRE);                         // saddle
}

function lamp(g, x, z) {
  g.box(x, 0.2, z, 0.014, 0.36, 0.014, STEEL);
  g.lit(1.5, () => g.sph(x, 0.39, z, 0.026, 0.026, 0.026, LAMP));
}

// The square in front of a station (ekimae): 3 squares wide, 2 deep. The long front edge is the
// kerb, with a bus bay and a taxi rank that open onto the road in front; behind it are a clock,
// a lunch-box stall and bicycle racks. Buses and taxis passing on a road along the kerb pull in
// and set people down, and those people join the queues on the station's platforms.
export default {
  id: 'station-forecourt',
  name: 'Station forecourt',
  meta: '3 x 2 squares. Bus stop, taxi rank, ekiben stall. Kerb to a road.',
  size: [3, 2],
  build(g, rnd) {
    const snow = snowy(), top = snow ? SNOW : ROOF;
    g.slab(0, 0, 0, 2.94, 0.024, 1.94, PAVE);                                    // paving
    for (let i = -3; i <= 3; i++) g.slab(i * 0.42, 0.0245, -0.2, 0.012, 0.002, 1.3, PAVE2);
    for (let j = -2; j <= 1; j++) g.slab(0, 0.0245, -0.2 + j * 0.42, 2.9, 0.002, 0.012, PAVE2);

    // the kerb side: a lay-by of tarmac for the bus and the taxis
    g.slab(0, 0.004, 0.83, 2.94, 0.022, 0.75, ASPHALT);                           // ...which runs out to join the road in front
    for (const x of [-1.42, 1.42]) g.slab(x, 0.0265, 0.96, 0.03, 0.002, 0.5, LINE);
    g.slab(0, 0.024, 0.45, 2.94, 0.014, 0.03, KERB);
    for (let i = 0; i < 5; i++) g.slab(-0.02 + i * 0.07, 0.027, 0.71, 0.035, 0.002, 0.44, LINE);     // zebra crossing in the middle

    // bus stop: a glass shelter, a bench, the stop sign and a bus waiting
    for (const x of [-1.38, -0.5]) g.slab(x, 0.0265, 0.7, 0.03, 0.002, 0.26, LINE);                   // the bus bay: buses on the road pull in here
    g.slab(-0.94, 0.0265, 0.575, 0.9, 0.002, 0.02, LINE);
    for (const x of [-1.25, -0.6]) g.box(x, 0.13, 0.3, 0.016, 0.22, 0.016, STEEL);
    g.box(-0.925, 0.13, 0.24, 0.66, 0.2, 0.01, GLASS);
    g.slab(-0.925, 0.24, 0.3, 0.76, 0.018, 0.2, top);
    g.slab(-0.925, 0.05, 0.27, 0.4, 0.014, 0.05, STALL);
    g.box(-0.46, 0.14, 0.38, 0.012, 0.24, 0.012, STEEL);
    g.cyl(-0.46, 0.27, 0.38, 0.045, 0.012, SIGN, 'z');
    g.cyl(-0.46, 0.27, 0.388, 0.024, 0.004, WHITE, 'z');

    // taxi rank: two cabs in line under their sign
    g.within(parked(0.42, 0.72, Math.PI / 2), () => taxi.build(g, rnd));            // one cab waiting; others pull in behind it
    g.box(1.32, 0.14, 0.38, 0.012, 0.24, 0.012, STEEL);
    g.lit(0.9, () => g.box(1.32, 0.27, 0.38, 0.11, 0.05, 0.014, TAXI));

    // the square: a clock on a post, and a cherry tree in a round planter
    g.box(0.02, 0.2, 0.2, 0.018, 0.36, 0.018, STEEL);
    g.box(0.02, 0.4, 0.2, 0.09, 0.09, 0.03, ROOF);
    g.lit(1.1, () => { for (const s of [-1, 1]) g.cyl(0.02, 0.4, 0.2 + s * 0.016, 0.034, 0.004, LAMP, 'z'); });
    g.cyl(0.0, 0.05, -0.38, 0.19, 0.06, PLANTER, 'y');
    g.within(scaled(0.85, 0, -0.38, 0.05), () => sakura.build(g, rnd));

    // the ekiben stall: lunch boxes on the counter under a striped awning
    g.slab(0.95, 0.024, -0.62, 0.62, 0.11, 0.3, STALL);
    g.slab(0.95, 0.134, -0.69, 0.62, 0.2, 0.16, WHITE);
    for (let i = 0; i < 6; i++) g.slab(0.7 + i * 0.1, 0.134, -0.52, 0.07, 0.022, 0.07, BOX[i % BOX.length]);
    g.lit(1.2, () => g.slab(0.95, 0.31, -0.6, 0.5, 0.012, 0.03, LAMP));
    for (let i = 0; i < 8; i++) g.slab(0.67 + i * 0.08, 0.334, -0.57, 0.08, 0.014, 0.44, snow ? SNOW : i % 2 ? WHITE : AWN);
    g.lit(1.0, () => g.slab(1.31, 0.2, -0.45, 0.05, 0.11, 0.05, C('#f0d9a0')));                      // paper lantern

    // bicycle racks under a low roof
    g.slab(-1.02, 0.024, -0.66, 0.74, 0.012, 0.012, STEEL);
    for (let i = 0; i < 8; i++) bicycle(g, -1.33 + i * 0.09, -0.66, BOX[Math.floor(rnd() * BOX.length)]);
    for (const x of [-1.38, -0.66]) g.box(x, 0.11, -0.8, 0.014, 0.17, 0.014, STEEL);
    g.slab(-1.02, 0.19, -0.7, 0.82, 0.014, 0.3, top);

    lamp(g, -1.38, 0.3); lamp(g, 1.38, -0.1); lamp(g, -0.4, -0.86); lamp(g, 0.45, 0.3);
  },
};
