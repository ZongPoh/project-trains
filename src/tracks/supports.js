import { COL } from '../core/colors.js';

// Posts and beams that hold raised track up.
export function addPost(gb, x, z, top) {
  if (top > 0.02) gb.box(x, top / 2, z, 0.06, top, 0.06, COL.post);
}

// Four corner posts and a ring of beams under a raised square.
export function addTable(gb, x, z, y) {
  const cx = x + 0.5, cz = z + 0.5, top = y - 0.035;
  for (const sx of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) addPost(gb, cx + sx, cz + sz, top);
  for (const s of [-0.5, 0.5]) {
    gb.box(cx, top - 0.025, cz + s, 1, 0.05, 0.05, COL.post);
    gb.box(cx + s, top - 0.025, cz, 0.05, 0.05, 1, COL.post);
  }
}
