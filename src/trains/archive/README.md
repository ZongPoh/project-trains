# Archived trains

These are the trains from the first prototype. They are kept here so the work is not lost, but
they are not loaded by the game and do not appear in the depot.

| File | Train |
|---|---|
| `steam-engine.js` | Steam Engine with tender, two wagons and a brake van |
| `diesel-freight.js` | Diesel Freight with three containers and a tanker |
| `city-metro.js` | City Metro, four cars |
| `bullet-express.js` | The generic bullet train, replaced by the real Shinkansen |

## Bringing one back

Open `src/trains/index.js`, import the file and add it to `ROSTER`:

```js
import steam from './archive/steam-engine.js';

export const ROSTER = [ /* ...the Shinkansen... */, steam ];
```

It will then show up in the depot like any other train.

Layouts saved by the first prototype still load: any archived train in them is swapped for a
Shinkansen (see `LEGACY_IDS` in `src/trains/index.js`).
