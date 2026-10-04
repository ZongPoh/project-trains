// The handful of values that many parts of the game read: which tool is in hand, which level
// is being built on, and how the simulation is running.
const media = q => !!(window.matchMedia && window.matchMedia(q).matches);

export const state = {
  tool: 'track',
  level: 0,
  trainType: 'n700s',
  sceneryType: 'sakura',
  sceneryRot: 0,        // which way a large building faces
  rotDir: 1,            // which way the ramp tool points on empty ground
  manualCell: '',       // square where the player turned the ramp by hand
  lastHover: null,      // last mouse position over the board
  paused: media('(prefers-reduced-motion: reduce)'),
  simSpeed: 1,
  crashes: 0,
  carried: 0,           // passengers delivered so far
  townChanged: false,   // a building has just grown; save at the next chance
  coarse: media('(pointer:coarse)'),
};
