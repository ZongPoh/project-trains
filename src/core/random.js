// Small seeded random generator, so scenery looks the same every time it is rebuilt.
export function rng(seed) {
  let a = (seed | 0) + 0x6d2b79f5;
  return function () {
    a |= 0; a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
