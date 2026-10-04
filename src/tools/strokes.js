import { state } from '../core/state.js';
import { hideGhost } from '../input/ghost.js';
import { newStroke } from '../save/history.js';
import { TOOLS } from './registry.js';

// One press-drag-release on the board is a "stroke". These pass it to the tool in hand.
export function strokeStart(x, y) {
  newStroke();
  const t = TOOLS[state.tool];
  if (t && t.start) t.start(x, y);
}
export function strokeMove(x, y) {
  const t = TOOLS[state.tool];
  if (t && t.move) t.move(x, y);
}
export function strokeEnd() {
  const t = TOOLS[state.tool];
  if (t && t.end) t.end();
}
export function hover(x, y) {
  const t = TOOLS[state.tool];
  if (t && t.hover) t.hover(x, y); else hideGhost();
}
