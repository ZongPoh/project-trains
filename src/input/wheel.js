import { canvas } from '../core/stage.js';
import { zoomBy } from './camera.js';
import { ride, rideZoom } from './ride.js';

// Mouse wheel and trackpad scroll: zoom the board.
export function initWheel() {
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const f = Math.exp(e.deltaY * 0.0012);
    if (ride.train) rideZoom(f); else zoomBy(f);
  }, { passive: false });

  // Over the depot, the wheel scrolls the row of cards sideways.
  for (const row of document.querySelectorAll('.cards')) {
    row.addEventListener('wheel', e => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || row.scrollWidth <= row.clientWidth) return;
      e.preventDefault();
      row.scrollLeft += e.deltaY;
    }, { passive: false });
  }
}
