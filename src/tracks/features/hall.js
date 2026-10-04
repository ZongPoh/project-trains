import { C } from '../../core/colors.js';
import { snowy, SNOW } from '../../scenery/seasons.js';

// The station building: a concourse that bridges the tracks above the platforms, the way many
// Japanese stations are built (hashigami). The player adds it by clicking a station with the
// "Station building" item; it then spans every track of the station at that point. Each
// platform square under it draws its own slice, so the building is as wide as the station.
const WALL = C('#efe7d3'), BASE = C('#b9b3a3'), ROOF = C('#3d6f66'), GLASS = C('#9fd0e0'), TRIM = C('#6a4a36'), COLUMN = C('#a9a79d'), LAMP = C('#fff3c4'), DARK = C('#2a2f33');
const FLOOR = 0.62, HIGH = 0.32, LONG = 0.84;         // floor height above the rails' base, wall height, length along the track

// o: { x, z: the square, y: its base height, ax: 0 if the track runs north-south, first / last: the outer slices }
export function drawHallSlice(g, o) {
  const cx = o.x + 0.5, cz = o.z + 0.5, y = o.y;
  // sizes and offsets given as (along the track, across it), turned for the track's direction
  const size = (al, ac) => (o.ax ? [al, ac] : [ac, al]);
  const at = (al, ac) => (o.ax ? [cx + al, cz + ac] : [cx + ac, cz + al]);
  const box = (al, ac, yy, la, hh, wa, col) => { const [x, z] = at(al, ac), [sx, sz] = size(la, wa); g.box(x, yy, z, sx, hh, sz, col); };

  box(0, 0, y + FLOOR + 0.02, LONG + 0.06, 0.04, 1, BASE);                              // the floor, carried over the track
  for (const a of [-0.38, 0.38]) for (const c of [-0.46, 0.46]) box(a, c, y + FLOOR / 2, 0.05, FLOOR, 0.05, COLUMN);
  for (const s of [-1, 1]) {                                                              // the two long walls, facing up and down the line
    box(s * LONG / 2, 0, y + FLOOR + 0.04 + HIGH / 2, 0.03, HIGH, 1, WALL);
    g.lit(1, () => box(s * (LONG / 2 + 0.012), 0, y + FLOOR + 0.2, 0.012, 0.13, 0.84, GLASS));
    for (const c of [-0.28, 0, 0.28]) box(s * (LONG / 2 + 0.016), c, y + FLOOR + 0.2, 0.012, 0.13, 0.02, WALL);
    box(s * (LONG / 2 + 0.01), 0, y + FLOOR + 0.07, 0.02, 0.03, 1, TRIM);
  }
  if (o.first) box(0, -0.485, y + FLOOR + 0.04 + HIGH / 2, LONG, HIGH, 0.03, WALL);
  if (o.last) box(0, 0.485, y + FLOOR + 0.04 + HIGH / 2, LONG, HIGH, 0.03, WALL);
  for (const [on, c] of [[o.first, -0.502], [o.last, 0.502]]) {                           // a lit doorway and a clock on each end
    if (!on) continue;
    g.lit(1, () => box(0, c, y + FLOOR + 0.15, 0.3, 0.2, 0.012, LAMP));
    box(0, c * 1.004, y + FLOOR + 0.3, 0.12, 0.05, 0.014, DARK);
  }
  // the roof: a ridge running across the tracks
  const [rx, rz] = size(LONG + 0.14, 1), top = y + FLOOR + 0.04 + HIGH;
  g.gable(cx, top, cz, rx, 0.2, rz, snowy() ? SNOW : ROOF, !o.ax);
  box(0, 0, top + 0.2, 0.05, 0.03, 1, snowy() ? SNOW : ROOF);
  box(0, 0, top + 0.005, LONG + 0.16, 0.012, 1, TRIM);
}
