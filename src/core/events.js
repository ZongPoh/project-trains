// A tiny notice board. Game code announces what happened ("a train crashed here");
// anything that cares, such as sound, listens. Neither side needs to know about the other.
const listeners = {};

export function on(name, fn) {
  (listeners[name] || (listeners[name] = [])).push(fn);
}

export function emit(name, data) {
  for (const fn of listeners[name] || []) fn(data || {});
}
