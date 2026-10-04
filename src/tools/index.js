// The toolbox. One file per tool; a tool added here can be selected with setTool(id).
import { register } from './registry.js';
import { track } from './track.js';
import { rampUp, rampDown } from './ramp.js';
import { station } from './station.js';
import { signal } from './signal.js';
import { operate } from './operate.js';
import { erase } from './erase.js';
import { train } from './train.js';
import { scenery } from './scenery.js';
import { look } from './look.js';
import { rideTool } from './ride.js';
import { river } from './river.js';
import { hill } from './hill.js';
import { road } from './road.js';
import { highwayTool } from './highway.js';

register(track, rampUp, rampDown, station, signal, operate, erase, train, scenery, look, rideTool, river, hill, road, highwayTool);

export { TOOLS } from './registry.js';
export { setTool, setLevel, setHint } from './select.js';
