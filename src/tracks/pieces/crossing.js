import { opp } from '../../core/constants.js';

// Crossing: all four sides are joined. Trains always go straight over, so two trains arriving
// at once will collide.
export function crossingRoutes() {
  return [[0, 2], [1, 3]];
}

export const crossingExit = a => opp(a);
