// Two trains coupled into one. The second set follows the first, nose to nose, the way the
// E5 Hayabusa and E6 Komachi run together. A coupled train's id is "first+second".
const cache = {};

export function couple(a, b, extra) {
  const id = a.id + '+' + b.id;
  if (!cache[id] || extra) {
    cache[id] = {
      id,
      name: a.name + ' + ' + b.name,
      meta: 'Two sets coupled nose to nose.',
      speed: Math.min(a.speed, b.speed),            // the pair runs at the pace of the slower set
      family: a.family,
      units: [a, b],
      cars: [...a.cars, ...b.cars],
      ...extra,
    };
  }
  return cache[id];
}
