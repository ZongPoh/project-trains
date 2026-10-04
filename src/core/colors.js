import * as THREE from 'three';

// Colours are written as normal hex and converted once to the linear space three.js lights in.
export const C = hex => new THREE.Color(hex).convertSRGBToLinear();

const HEX = {
  // track
  ballast: '#8f8b7f', deck: '#cbc6b8', post: '#77838b', sleeper: '#4c3a2c', rail: '#bcc2c6',
  guide: '#f0b21e',
  // station and signal
  platform: '#bdb8ab', platformEdge: '#f4f2ea', tactile: '#f2c230', canopy: '#3b4854', canopyTrim: '#eef0ea',
  mast: '#2a2f33', signBoard: '#f6f6f1', shed: '#5d6b76', shedAccent: '#1f5a48',
  queue: '#f4f2ea', fence: '#e6ebee', fenceRail: '#55626c', gate: '#f3f5f6', gateBand: '#2f8f6b',
  // shared train colours
  black: '#1d2023', dark: '#3a4046', steel: '#9aa2a8', glass: '#22323c', coal: '#17181a', wood: '#b58545',
  brown: '#7b4a2b', green: '#1f5f41', red: '#b3271e', brass: '#cfa53c', lamp: '#ffe9a8',
  orange: '#e0701c', yellow: '#f1c232', silver: '#c9ced2', white: '#f3f4f1', blue: '#1c4fa0',
  grey: '#8b9298', teal: '#0f8a86', c1: '#2f6fb0', c2: '#b7402a', c3: '#3f8f6b',
};

export const COL = {};
for (const k in HEX) COL[k] = C(HEX[k]);
