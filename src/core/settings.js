// The player's preferences, remembered in this browser.
const STORE = 'project-trains.settings.v1';

export const settings = {
  time: 'day',        // day, sunset or night
  sound: true,
  careful: true,      // drivers watch for other trains; off means trains can crash
  season: 'spring',   // spring, summer, autumn or winter
  growth: true,       // busy stations grow new buildings
};

try { Object.assign(settings, JSON.parse(localStorage.getItem(STORE) || '{}')); } catch (e) { /* first visit, or storage blocked */ }

export function saveSettings() {
  try { localStorage.setItem(STORE, JSON.stringify(settings)); } catch (e) { /* storage blocked */ }
}
