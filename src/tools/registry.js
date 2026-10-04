// Every tool the player can hold. A tool is a plain object:
//   { id, hint(), hover(x, y), start(x, y), move(x, y), end() }
// where x, y is the pointer position on screen. All parts except id and hint are optional.
export const TOOLS = {};

export function register(...tools) {
  for (const t of tools) TOOLS[t.id] = t;
}
