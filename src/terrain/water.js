import { DX, DZ } from '../core/constants.js';
import { C } from '../core/colors.js';
import { isWater } from './model.js';

// Water: a flat blue square with a sandy bank along every side that meets land.
const BANK = C('#cdbf93'), SNOWBANK = C('#eef2f5');

export function drawWater(gb, x, z, look, winter) {
  gb.slab(x + 0.5, 0.001, z + 0.5, 1, 0.012, 1, look.river);
  for (let d = 0; d < 4; d++) {
    if (isWater(x + DX[d], z + DZ[d])) continue;
    const along = DX[d] === 0;                               // this bank runs east-west
    gb.slab(x + 0.5 + DX[d] * 0.45, 0.004, z + 0.5 + DZ[d] * 0.45, along ? 1 : 0.1, 0.016, along ? 0.1 : 1, winter ? SNOWBANK : BANK);
  }
}

// A river carried on past the edge of the board, out into the countryside.
export function drawWaterBeyond(gb, x, z, d, far, look, winter) {
  const ns = DX[d] === 0, mx = x + 0.5 + DX[d] * (0.5 + far / 2), mz = z + 0.5 + DZ[d] * (0.5 + far / 2);
  gb.slab(mx, -0.024, mz, ns ? 1.2 : far, 0.012, ns ? far : 1.2, winter ? SNOWBANK : BANK);
  gb.slab(mx, -0.02, mz, ns ? 1 : far, 0.014, ns ? far : 1, look.river);
}
