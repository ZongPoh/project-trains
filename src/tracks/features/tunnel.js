import { DX, DZ, H, dirs } from '../../core/constants.js';
import { C } from '../../core/colors.js';
import { eff } from '../model.js';
import { isHill } from '../../terrain/model.js';

// Tunnels. Ground-level track in a hill square runs inside the hill. Wherever the rails leave
// the hill, a stone arch is drawn round the opening. Like bridges, tunnels make themselves.
const STONE = C('#b9b5aa'), KEY = C('#9d998e');

export function drawPortals(gb, p) {
  const cx = p.x + 0.5, cz = p.z + 0.5, y = p.l * H;
  for (const d of dirs(eff(p.ports))) {
    if (isHill(p.x + DX[d], p.z + DZ[d])) continue;             // the tunnel carries on into the next square
    const fx = cx + DX[d] * 0.505, fz = cz + DZ[d] * 0.505, ew = DX[d] !== 0;   // ew: the mouth faces east or west
    const wide = (w, t) => ew ? [t, w] : [w, t];                // [size along x, size along z]
    const put = (side, yy, w, h, t, col, out = 0) => {
      const [sx, sz] = wide(w, t);
      gb.box(fx + DX[d] * out + (ew ? 0 : side), yy, fz + DZ[d] * out + (ew ? side : 0), sx, h, sz, col);
    };
    put(-0.25, y + 0.25, 0.08, 0.5, 0.06, STONE, 0.01);         // side pillars
    put(0.25, y + 0.25, 0.08, 0.5, 0.06, STONE, 0.01);
    put(0, y + 0.56, 0.62, 0.12, 0.07, STONE, 0.01);            // lintel
    put(0, y + 0.56, 0.1, 0.14, 0.08, KEY, 0.012);              // keystone
    put(-0.36, y + 0.62, 0.1, 0.03, 0.08, KEY, 0.012);          // coping stones
    put(0.36, y + 0.62, 0.1, 0.03, 0.08, KEY, 0.012);
  }
}
