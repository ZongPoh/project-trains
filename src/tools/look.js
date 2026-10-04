import { state } from '../core/state.js';

// Look tool: dragging orbits the camera instead of building. The orbiting itself is done
// by input/pointer.js; this only supplies the hint.
export const look = {
  id: 'look',
  hint: () => state.coarse ? 'Drag to orbit the board. Tilt down low to see the sky and the mountain.' : 'Drag to orbit the board. Scroll to zoom. Tilt down low to see the sky and the mountain.',
};
