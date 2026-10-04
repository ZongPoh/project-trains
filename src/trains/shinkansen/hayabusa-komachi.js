import { couple } from '../coupling.js';
import e5 from './e5-hayabusa.js';
import e6 from './e6-komachi.js';

// Hayabusa + Komachi: the green E5 and the red E6 coupled nose to nose, as they run together
// north from Tokyo before splitting at Morioka. In the game, the Operate tool splits them.
export default couple(e5, e6, {
  name: 'Hayabusa + Komachi',
  meta: 'E5 and E6 coupled nose to nose. Operate splits them.',
});
