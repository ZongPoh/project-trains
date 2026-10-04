import { Matrix4 } from 'three';

// Helpers for large buildings that contain smaller models (a pine in a garden, a keep in a castle).
export const move = (x, z, y = 0) => new Matrix4().makeTranslation(x, y, z);
export const scaled = (s, x = 0, z = 0, y = 0) => new Matrix4().makeScale(s, s, s).setPosition(x, y, z);
// Something standing at x,z and turned about the y axis (a parked car along a kerb).
export const turned = (x, z, turn, y = 0) => new Matrix4().makeRotationY(turn).setPosition(x, y, z);
