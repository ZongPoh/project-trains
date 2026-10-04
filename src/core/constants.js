// Sizes of the layout board and of the track that sits on it.
export const G = 56;            // the board is G x G squares
export const H = 0.56;          // height of one build level
export const MAXL = 3;          // highest build level (ground is 0)
export const RAIL_TOP = 0.062;  // top of the rails above a piece's base
export const RAMP_LEN = 2.08;   // rail length of a ramp (two squares long, one level up)
export const GAP = 0.035;       // gap between coupled cars
export const COACH = 0.56;      // length of a coach (every train has three between its two end cars)
export const WALK = 0.5;        // height of the pedestrian level: raised walkways, decks and footbridges
export const CAR_PITCH = COACH + GAP;   // so the joints between cars, where the doors are, come this far apart

// Sides of a square: 0 north, 1 east, 2 south, 3 west.
export const DX = [0, 1, 0, -1];
export const DZ = [-1, 0, 1, 0];
export const DIR_NAMES = ['north', 'east', 'south', 'west'];

export const opp = d => (d + 2) & 3;
export const key = (x, z, l) => x + ',' + z + ',' + l;
export const bits = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1);
export const dirs = m => [0, 1, 2, 3].filter(d => m >> d & 1);
export const inBoard = (x, z) => x >= 0 && z >= 0 && x < G && z < G;
export const dirBetween = (ax, az, bx, bz) => DX.findIndex((v, i) => v === bx - ax && DZ[i] === bz - az);
export const levelName = l => l === 0 ? 'the ground' : 'level ' + l;
