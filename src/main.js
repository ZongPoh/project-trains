import './style.css';
import { ok, renderer, scene, camera, canvas } from './core/stage.js';
import { state } from './core/state.js';
import { G } from './core/constants.js';
import { settings } from './core/settings.js';
import { $, fatal, toast } from './core/dom.js';
import { on, emit } from './core/events.js';
import { trainDef } from './trains/index.js';
import { stationName } from './tracks/features/station.js';
import { tuneFor } from './audio/sounds/chime.js';
import { setHighway, isHighway, rampOf, highway } from './terrain/highway.js';
import { placeScenery, walkLinks, sceneryAt } from './scenery/placed.js';
import { setTerrain } from './terrain/model.js';
import { buildBoard } from './world/board.js';
import { pieces, dirty } from './tracks/model.js';
import { flush } from './tracks/render.js';
import { updateSignals } from './tracks/features/signal.js';
import { trains } from './trains/store.js';
import { stepTrain, spawnTrain, splitTrain, reverseTrain, placeCars } from './trains/runtime.js';
import { checkCollisions } from './trains/collisions.js';
import { stepCoupling } from './trains/autocouple.js';
import { stepDoors } from './tracks/features/gates.js';
import { stepStaff } from './city/staff.js';
import { initBoard, stepBoard } from './ui/board.js';
import { stepCrashes } from './trains/crash.js';
import './scenery/mountains.js';
import { stepClouds } from './scenery/clouds.js';
import { buildLandscape } from './scenery/landscape.js';
import { restoreTime } from './scenery/daylight.js';
import { onSeason } from './scenery/seasons.js';
import { stepWeather } from './scenery/weather.js';
import { initPassengers, stepPassengers, stepGrowth, stepPeople } from './city/index.js';
import { peopleCount, strollers, walkerList } from './city/people.js';
import { applyRide, startRide, stopRide, nextView } from './input/ride.js';
import { flushTerrain } from './terrain/render.js';
import { stepCrossings, ringingCrossings } from './roads/crossings.js';
import { stepCars, carCount, carsOnHighway, carList } from './roads/cars.js';
import { initRideBar } from './ui/ridebar.js';
import { resize, resetCam, applyCam, cam } from './input/camera.js';
import { initPointer } from './input/pointer.js';
import { initObstacles } from './input/obstacles.js';
import { initWheel } from './input/wheel.js';
import { initKeyboard, stepKeyboard } from './input/keyboard.js';
import { setTool, setLevel } from './tools/index.js';
import { buildDepot } from './ui/depot.js';
import { initMenu, setPaused, showSettings } from './ui/menu.js';
import { initAudio, stepAudio } from './audio/index.js';
import { load, starter, clearWorld, serialize } from './save/layout.js';
import { readSaved, updateStats, changed, snapshot } from './save/history.js';
import { layoutFromAddress, clearAddress } from './save/share.js';

// Project Trains: a toy-train layout board with a Japanese theme.
// This file only starts things up and runs the frame loop; the game itself lives in the folders:
//   core/     renderer, shared constants, the shape builder
//   tracks/   the layout model, one file per kind of track, stations and signals
//   trains/   one file per train, how trains move, collisions and crashes
//   scenery/  sky, mountain, countryside, seasons, plus the items the player can place
//   city/     passengers on the platforms and the town that grows round busy stations
//   terrain/  the ground: water, hills and roads
//   roads/    level crossing gates, and the cars that drive on the roads
//   input/    mouse, touch, wheel, keyboard and the camera
//   tools/    one file per tool
//   ui/       the depot and the buttons
//   audio/    sound, one file per kind of sound
//   save/     saving, undo and share links

let prev = performance.now(), crashesShown = 0, carriedShown = 0;

// One step of the railway and the town: everything that stops when the game is paused.
function simulate(dt) {
  for (const t of trains.slice()) stepTrain(t, dt);
  stepCoupling();
  checkCollisions();
  stepCrashes(dt);
  stepPassengers(dt);
  stepCars(dt);
  stepDoors(dt);
  stepStaff(dt);
  stepPeople(dt);
}

function frame(now) {
  const dt = Math.min(0.05, (now - prev) / 1000);
  prev = now;
  stepKeyboard(dt);
  flush();
  flushTerrain();
  stepCrossings(dt);
  if (!state.paused) {
    simulate(dt * state.simSpeed);
    stepClouds(dt);
    stepWeather(dt);
  }
  stepBoard(dt);
  updateSignals();
  stepGrowth(dt);
  stepAudio(dt);
  if (state.crashes !== crashesShown || state.carried !== carriedShown) { crashesShown = state.crashes; carriedShown = state.carried; updateStats(); }
  if (state.townChanged) { state.townChanged = false; changed(); }
  if (!applyRide(dt)) applyCam();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

async function start() {
  buildBoard();
  buildLandscape();
  $('btn-time').textContent = 'Time of day: ' + restoreTime().label;
  resize(); resetCam();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
  initPointer(); initObstacles(); initWheel(); initKeyboard(); initMenu(); initAudio(); initRideBar(); initPassengers(); initBoard(); showSettings();
  onSeason(() => { for (const p of pieces) if (p.st) dirty.add(p); });      // snow on the station roofs
  buildDepot();

  const saved = readSaved();
  let loaded = false;
  if (saved && saved.pieces && saved.pieces.length) {
    try { load(saved); loaded = true; } catch (e) { clearWorld(); }
  }
  if (!loaded) starter();
  else if (!saved.g || saved.g < G) {
    // a board saved on the smaller map: it loads in the middle, but the new starter is bigger
    setTimeout(() => toast('Your saved board is back. For the bigger starter layout, open More and choose Load starter layout.'), 600);
  }

  // Opened from a share link: show that layout, and keep the player's own board one Undo away.
  const shared = await layoutFromAddress();
  if (shared) {
    try {
      const mine = JSON.stringify(serialize());
      load(shared); snapshot(mine); changed();
      toast('Shared layout loaded. Undo brings your own board back.');
    } catch (e) { toast('That share link could not be read.'); }
    clearAddress();
  } else if (shared === undefined) { toast('That share link could not be read.'); clearAddress(); }

  setPaused(state.paused); setLevel(0); setTool('track');
  updateStats();
  requestAnimationFrame(t => { prev = t; frame(t); });
}

if (ok) start(); else fatal();

// Handy while developing: look at the game from the browser console.
if (import.meta.env.DEV) window.PT = { walkLinks, sceneryAt, peopleCount, strollers, walkerList, turnRound: tr => { reverseTrain(tr, false); placeCars(tr); }, simulate, on, emit, carsOnHighway, carList, setHighway, isHighway, rampOf, highway, placeScenery, setTerrain, trainDef, stationName, tuneFor, state, settings, trains, pieces, ringing: ringingCrossings, carCount, startRide, stopRide, nextView, flushTerrain, stepCrossings, stepCars, stepPassengers, stepGrowth, applyRide, spawnTrain, splitTrain, cam, camera, canvas, renderer, scene, serialize, load, starter, clearWorld, stepTrain, checkCollisions, stepCrashes, flush };
