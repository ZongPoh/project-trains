import { $ } from '../core/dom.js';
import { on } from '../core/events.js';
import { trainDef } from '../trains/index.js';
import { serviceOf } from '../trains/service.js';
import { ride, stopRide, nextView, nextTrain, VIEW_NAMES } from '../input/ride.js';

// The bar shown while riding a train. The building tools and the depot are hidden meanwhile.
export function initRideBar() {
  $('ride-view').addEventListener('click', nextView);
  $('ride-next').addEventListener('click', nextTrain);
  $('ride-leave').addEventListener('click', stopRide);
  on('ride', e => {
    const riding = !!e.train;
    $('ui').classList.toggle('riding', riding);
    $('ridebar').hidden = !riding;
    if (!riding) return;
    const def = trainDef(e.train.type);
    $('ride-name').textContent = (def ? def.name : 'Train') + ' · ' + serviceOf(e.train).name + ' · ' + VIEW_NAMES[ride.view];
  });
}
