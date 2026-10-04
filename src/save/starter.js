import { G, key } from '../core/constants.js';
import { rng } from '../core/random.js';
import { state } from '../core/state.js';
import { occ, pieces } from '../tracks/model.js';
import { lay, placeRamp } from '../tracks/edit.js';
import { flush } from '../tracks/render.js';
import { setCoupling, nameIndex } from '../tracks/features/station.js';
import { spawnTrain } from '../trains/runtime.js';
import { setTerrain, terrainAt } from '../terrain/model.js';
import { setHighway } from '../terrain/highway.js';
import { placeScenery, canPlaceItem } from '../scenery/placed.js';

// The layout a new player starts with. It is a small city built to show everything the game
// can do, and it is laid out for a board of 56 squares.
//
//   The main line runs round the outside. On it: a terminal of four tracks in the south, a
//   coupling station of three in the north, a station of two with a building over its tracks
//   in the west, and a halt in the east. It bridges the river twice and tunnels through the
//   mountain. Three expresses and two locals share it.
//
//   The highway crosses the north of the board from a toll gate in the west, over the river,
//   and on into the countryside, with a slip road down to the hot-spring village on the far
//   bank. A second highway leaves it at a junction, climbs to level 2 and comes down again to
//   the east street. The city's loop line, on a viaduct, runs alongside the first.
//
//   Inside the loop line: a ground-level tram loop crossed by a shuttle (two diamond
//   crossings), a shuttle on level 2 that passes over the highway, and one on level 3.
//   The hot-spring line leaves the loop line at a switch that alternates by itself, comes
//   down a ramp, bridges the river, crosses a road at a level crossing and ends at the
//   hot-spring halt: every other train on the loop line goes there and back.
//
//   Streets form a grid with a bus stop in front of every main-line station; the high street
//   crosses the river on a road bridge. In the south a flyover carries a road over the main
//   line. People have a level of their own: decks over the streets by the terminal and the
//   north station, joined by a raised walkway, and another walkway that crosses the tram line
//   and joins a footbridge over the avenue.
export function starter() {
  state.carried = 0;
  const a = 3, b = G - 4;                                     // the main line: three squares in from the edge
  const at = (x, z, l = 0) => occ.get(key(x, z, l));
  // (a road that comes to water crosses it on a road bridge)
  const ground = (kind, x0, z0, x1 = x0, z1 = z0) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) setTerrain(x, z, kind === 'road' && terrainAt(x, z) === 'water' ? 'roadbridge' : kind); };
  const deck = (x0, z0, x1 = x0, z1 = z0, level = 1) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) setHighway(x, z, level); };
  const platform = (x0, z0, x1, z1, l, side) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) at(x, z, l).st = side; };
  const name = (x, z, l, english) => { at(x, z, l).nm = nameIndex(english) + 1; };            // on the station's first square

  /* ----- the ground ----- */
  for (let z = 0; z < G; z++) ground('water', z < 20 ? 42 : 43, z, z < 20 ? 43 : 44, z);       // the river, with a bend
  ground('water', 22, 24, 23, 25);                                                             // a pond in the park
  for (let x = b - 3; x < G; x++) for (let z = 20; z <= 34; z++) {                             // the mountain
    if (Math.abs(x - b) + Math.abs(z - 27) * 0.5 < 3.4) setTerrain(x, z, 'hill');
  }
  ground('road', 7, 0, 7, 48);            // west road: a level crossing with the main line at the top
  ground('road', 7, 8, 38, 8);            // north street
  ground('road', 7, 34, 38, 34);          // cross street
  ground('road', 7, 48, 38, 48);          // high street, in front of the terminal
  ground('road', 28, 8, 28, 48);          // the avenue, down the middle
  ground('road', 38, 8, 38, 48);          // east street, along the river
  ground('road', 48, 18, 48, 48);         // the village road on the far bank
  ground('road', 39, 48, 47, 48);         // the high street carries on over the river on a road bridge
  ground('road', 39, 31, 40, 31);         // the way up to the second highway
  ground('road', 8, 14, 9, 14);           // the way to the toll gate
  ground('road', 12, G - 1);              // the far end of the flyover road

  deck(10, 14, G - 1, 14);                // the highway: a ramp at the west end, then east across the board and beyond
  deck(48, 15, 48, 17);                   // the slip road down to the village
  deck(12, 49, 12, 54);                   // the flyover: ramp, deck over the main line, ramp
  // the second highway: from a junction on the first it climbs to level 2, passes over the
  // hot-spring line, comes down to level 1 and then down a second ramp to the road
  deck(40, 15, 40, 26, 2); deck(40, 27, 40, 30);

  /* ----- the main line ----- */
  lay([[a, a], [b, a], [b, b], [a, b], [a, a]], 0);
  lay([[19, b], [19, b - 1], [36, b - 1], [36, b]], 0);       // terminal: one loop inside the main line
  lay([[18, b], [18, b + 1], [37, b + 1], [37, b]], 0);       // and two outside
  lay([[17, b], [17, b + 2], [38, b + 2], [38, b]], 0);
  platform(21, b - 1, 34, b - 1, 0, 2); platform(21, b, 34, b, 0, 1); platform(21, b + 1, 34, b + 1, 0, 2); platform(21, b + 2, 34, b + 2, 0, 1);
  lay([[33, a], [33, a + 1], [20, a + 1], [20, a]], 0);       // north station: two loops inside
  lay([[34, a], [34, a + 2], [19, a + 2], [19, a]], 0);
  platform(22, a, 31, a, 0, 2); platform(22, a + 1, 31, a + 2, 0, 1);
  setCoupling(at(26, a), true);                               // trains couple and uncouple here
  name(21, b - 1, 0, 'Tokyo'); name(22, a, 0, 'Morioka'); name(a, 24, 0, 'Nagoya'); name(b, 40, 0, 'Karuizawa');
  lay([[a, 22], [a + 1, 22], [a + 1, 33], [a, 33]], 0);       // west station: one loop inside
  platform(a, 24, a, 31, 0, 2); platform(a + 1, 24, a + 1, 31, 0, 1);
  at(a, 27).hall = 1; at(a + 1, 27).hall = 1;                 // with a station building over the tracks
  platform(b, 40, b, 43, 0, 2);                               // the east halt: one platform, expresses run through
  for (const [x, z] of [[14, a], [38, a], [a, 38], [9, b], [b, 47], [b, 16]]) at(x, z).sig = 1;

  /* ----- the loop line, on a viaduct beside the highway ----- */
  lay([[13, 15], [37, 15], [37, 32], [13, 32], [13, 15]], 1);
  platform(16, 15, 23, 15, 1, 1); platform(16, 32, 23, 32, 1, 1);
  name(16, 15, 1, 'Ueno'); name(16, 32, 1, 'Shin-Osaka');
  // the hot-spring line: off the loop line at a switch, down a ramp, over the river on a
  // bridge and across the village road to the halt at the hot springs. The switch alternates:
  // every other train on the loop line takes the branch, and comes back to carry on round.
  lay([[41, 19], [51, 19]], 0);
  lay([[37, 19], [38, 19]], 1);                               // (the ramp joins its top end)
  placeRamp({ x: 40, z: 19, l: 0, dir: 3 }, true);
  at(37, 19, 1).alt = 1;
  platform(49, 19, 51, 19, 0, 1);
  name(49, 19, 0, 'Atami');

  /* ----- inside the loop line ----- */
  lay([[16, 18], [25, 18], [25, 28], [16, 28], [16, 18]], 0); // the tram loop
  lay([[20, 17], [20, 30]], 0);                               // a line straight across it: two diamond crossings
  platform(16, 21, 16, 25, 0, 2);
  for (const [x, z] of [[23, 18], [25, 24], [18, 28]]) at(x, z).sig = 1;
  lay([[31, 9], [31, 27]], 2);                                // a shuttle on level 2, over the highway and the loop line
  platform(31, 9, 31, 11, 2, 1); platform(31, 25, 31, 27, 2, 1);
  lay([[20, 21], [35, 21]], 3);                               // and one on level 3, over that
  platform(20, 21, 22, 21, 3, 2); platform(33, 21, 35, 21, 3, 2);
  // this is a city already: its stations count as well grown, so new buildings come slowly
  for (const p of pieces) if (p.st) p.grown = 20;
  flush();

  /* ----- buildings ----- */
  let n = 0;
  const put = (id, x, z, rot) => placeScenery(id, x, z, rot == null ? n : rot, 1000 + (n++) * 53);
  const row = (ids, x0, z, x1, step = 1, rot) => { for (let x = x0, i = 0; x <= x1; x += step, i++) put(ids[i % ids.length], x, z, rot); };

  // bus stops in front of the stations, each with its kerb on a road
  put('station-forecourt', 24, 49, 2); put('station-forecourt', 25, 6, 0); put('station-forecourt', 5, 26, 1); put('station-forecourt', 49, 40, 3);
  // the pedestrian level: decks over the high street and the north street, and a walkway joining them up
  put('pedestrian-deck', 20, 47, 0); put('pedestrian-deck', 30, 47, 0); put('pedestrian-deck', 21, 7, 0);
  for (let x = 14; x <= 36; x++) put('walkway', x, 46);
  for (let z = 40; z <= 45; z++) put('walkway', 25, z);
  for (let x = 26; x <= 31; x++) put('walkway', x, 40);       // over the avenue, to the apartments
  put('walkway', 24, 7);
  for (const [x, z] of [[7, 30], [20, 34], [33, 34], [28, 37], [48, 37], [14, 8], [38, 26], [28, 26]]) put('footbridge', x, z);
  for (let x = 23; x <= 30; x++) put('walkway', x, 26);       // out of the park, over the tram line, and on to the footbridge over the avenue
  // ticket halls: the way in to the smaller stations
  put('ticket-hall', 51, 44, 3); put('ticket-hall', 49, 20, 0); put('ticket-hall', 15, 22, 3);
  put('toll-gate', 8, 14);
  put('service-area', 8, 16, 3);
  put('car-park', 30, 49, 2);
  // under the viaducts
  for (let x = 16; x <= 23; x++) { put('viaduct-shops', x, 15); put('viaduct-shops', x, 32); }
  for (let x = 33; x <= 36; x++) put('viaduct-shops', x, 14);
  for (let z = 21; z <= 24; z++) put('viaduct-shops', 13, z);
  // the big buildings
  put('department-store', 16, 44, 0); put('department-store', 33, 44, 0);
  put('stadium', 11, 9, 0); put('school', 16, 10, 0); put('castle-grounds', 44, 5, 0);
  put('apartments', 9, 36, 0); put('apartments', 9, 39, 0); put('apartments', 30, 38, 0); put('apartments', 9, 42, 0);
  put('ryokan', 45, 21, 0);
  // north town
  row(['house', 'ramen-shop', 'house'], 21, 10, 27, 2, 2); row(['house', 'house', 'ramen-shop'], 33, 10, 37, 2, 2);
  row(['office', 'house'], 21, 12, 27, 2, 0); row(['house'], 33, 12, 37, 2, 0);
  row(['house', 'house', 'ramen-shop'], 9, 6, 19, 2, 2); row(['house', 'ramen-shop'], 30, 6, 36, 2, 2);
  // the west side, between the west road and the loop line
  for (let z = 21; z <= 31; z += 2) { put(z % 4 === 1 ? 'house' : 'ramen-shop', 9, z, 3); put('house', 11, z, 1); }
  // the business district, inside the loop line
  for (const x of [29, 33, 35]) for (const z of [17, 19, 23, 25, 29]) put('office', x, z);
  for (const z of [17, 19, 23, 25, 27, 30]) put(z % 3 ? 'office' : 'ramen-shop', 26, z);
  row(['ramen-shop', 'house', 'office'], 15, 30, 26, 2, 0);
  // the park inside the tram loop
  put('pagoda', 18, 20); put('torii', 18, 23, 1); put('torii', 18, 25, 1); put('castle', 23, 20);
  for (const [x, z] of [[17, 19], [22, 19], [24, 19], [21, 26], [22, 27], [17, 27], [24, 23], [21, 23], [19, 26], [24, 27]]) put('sakura', x, z);
  // between the cross street and the terminal
  row(['office', 'office', 'ramen-shop'], 14, 36, 26, 2, 0); row(['house', 'ramen-shop'], 14, 38, 24, 2, 0);
  row(['ramen-shop', 'house', 'house'], 14, 42, 23, 1, 2); row(['office'], 30, 42, 36, 2, 0); row(['office', 'ramen-shop'], 30, 36, 36, 2, 0);
  row(['house', 'house', 'ramen-shop'], 20, 44, 24, 1, 2); row(['ramen-shop', 'house'], 27, 44, 31, 2, 2);
  // the hot-spring village on the far bank
  put('pagoda', 46, 26); put('torii', 46, 28, 0); put('torii', 46, 30, 0); put('castle', 45, 33);
  for (const [x, z] of [[45, 36], [47, 36], [46, 38], [45, 41], [47, 43], [46, 45], [50, 37], [50, 45]]) put('house', x, z);
  put('ramen-shop', 47, 39, 1); put('ramen-shop', 46, 17, 2); put('house', 45, 24, 0);
  // trees: cherry along the river and the avenue, pines round the mountain, maples in the west
  for (let z = 1; z < G; z += 2) { put('sakura', z < 20 ? 41 : 42, z); put('sakura', z < 20 ? 44 : 45, z + 1); }
  for (let z = 10; z <= 46; z += 3) put('sakura', 27, z);
  for (let z = 1; z < G; z += 3) { put('maple', 5, z); put('pine', 54, z); }
  for (let x = 6; x < G - 4; x += 3) { put('pine', x, 1); put('maple', x, G - 1); }
  const rnd = rng(56);
  for (let i = 0; i < 260; i++) {                                          // and a scattering wherever there is room
    const x = Math.floor(rnd() * G), z = Math.floor(rnd() * G), east = x > 44;
    if (canPlaceItem('pine', x, z, 0) && rnd() < (east ? 0.9 : 0.4)) put(east ? (rnd() < 0.6 ? 'pine' : 'maple') : ['sakura', 'maple', 'pine'][Math.floor(rnd() * 3)], x, z);
  }

  /* ----- trains ----- */
  // main line: three expresses and two locals, all running the same way round
  spawnTrain('e5-hayabusa+e6-komachi', at(40, a), null, 'express');
  spawnTrain('n700s', at(12, a), null, 'express');
  spawnTrain('l0-maglev', at(a, 12), null, 'express');
  spawnTrain('series-0', at(a, 37));
  spawnTrain('e4-max', at(a, 46));
  // the loop line: three trains, which take turns to go down to the hot springs and back
  spawnTrain('e7-kagayaki', at(30, 15, 1));
  spawnTrain('e5-hayabusa', at(13, 26, 1));
  spawnTrain('e8-tsubasa', at(30, 32, 1));
  // inside the loop: a tram, Doctor Yellow inspecting the line across it (it never stops), and the two high shuttles
  spawnTrain('series-800', at(22, 28));
  spawnTrain('doctor-yellow', at(20, 26));
  spawnTrain('e6-komachi', at(31, 18, 2));
  spawnTrain('series-500', at(27, 21, 3));
}
