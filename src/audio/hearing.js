import { camera } from '../core/stage.js';

// Hearing. A sound that happens somewhere on the board is only heard when the camera is close
// to it: at full strength within FULL squares of the camera, fading to nothing at REACH.
// Looking at the whole city from far off, the board is silent and only the music plays. Fly
// down to a station, or ride a train, and the sounds round the camera come up.
//   Every sound with a place asks heard(x, z) how loud to be, from 0 (out of earshot) to 1.
//   Sounds the player makes with a tool (laying track, throwing a switch) have no place and
//   are always heard, and so is the music.
export const FULL = 12, REACH = 34;

export function heard(x, z, y = 0.5) {
  const p = camera.position, d = Math.hypot(x - p.x, y - p.y, z - p.z);
  if (d >= REACH) return 0;
  if (d <= FULL) return 1;
  const k = (REACH - d) / (REACH - FULL);
  return k * k;
}
