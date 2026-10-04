// Scenery the player can place on the board. One file per item; add an item here to make it
// appear in the depot's Scenery tab. An item with a `size` of [wide, deep] covers that many squares.
import sakura from './items/sakura.js';
import pine from './items/pine.js';
import maple from './items/maple.js';
import house from './items/house.js';
import ramenShop from './items/ramen-shop.js';
import office from './items/office.js';
import pagoda from './items/pagoda.js';
import torii from './items/torii.js';
import castle from './items/castle.js';
import departmentStore from './items/department-store.js';
import ryokan from './items/ryokan.js';
import school from './items/school.js';
import apartments from './items/apartments.js';
import castleGrounds from './items/castle-grounds.js';
import stadium from './items/stadium.js';
import stationForecourt from './items/station-forecourt.js';
import stationBuilding from './items/station-building.js';
import viaductShops from './items/viaduct-shops.js';
import footbridge from './items/footbridge.js';
import tollGate from './items/toll-gate.js';
import serviceArea from './items/service-area.js';
import pedestrianDeck from './items/pedestrian-deck.js';
import carPark from './items/car-park.js';
import walkway from './items/walkway.js';
import ticketHall from './items/ticket-hall.js';

export const SCENERY = [sakura, pine, maple, house, ramenShop, office, pagoda, torii, castle,
  departmentStore, ryokan, school, apartments, castleGrounds, stadium, stationForecourt,
  stationBuilding, ticketHall, viaductShops, footbridge, tollGate, pedestrianDeck, walkway, carPark, serviceArea];

export const ITEMS = Object.fromEntries(SCENERY.map(s => [s.id, s]));
