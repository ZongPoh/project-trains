import { C } from '../core/colors.js';
import { settings, saveSettings } from '../core/settings.js';

// The four seasons. A season changes the colour of the ground, the trees, the rice paddies,
// the hills and how far down the mountain the snow comes, and what drifts through the air.
// Each scenery item decides for itself how it looks in each season (see scenery/items).
export const SEASONS = {
  spring: {
    label: 'Spring',
    board: C('#84b56b'), lawn: C('#93c274'), water: C('#8fb9a6'), crop: C('#5d9a4a'), bank: C('#8a7a55'), mound: C('#6f9f5c'),
    hills: ['#5f8f6b', '#557f6f', '#6b9a70', '#4f7a74', '#6f9f8a'], foot: '#5d8266', snowLine: 55,
    fall: { color: 0xffc6de, count: 170, speed: 0.9, drift: 0.9, size: 0.13 },      // petals
  },
  summer: {
    label: 'Summer',
    board: C('#62a04a'), lawn: C('#6fb053'), water: C('#7fb09c'), crop: C('#3c8f35'), bank: C('#7d7550'), mound: C('#5a9a48'),
    hills: ['#3f8650', '#377a55', '#4a9156', '#33745c', '#54966e'], foot: '#417a52', snowLine: 72,
    fall: null,
  },
  autumn: {
    label: 'Autumn',
    board: C('#a3a95c'), lawn: C('#b1b364'), water: C('#b3a36c'), crop: C('#d6b548'), bank: C('#86714a'), mound: C('#a59a52'),
    hills: ['#a8884a', '#8f7a45', '#b08f48', '#7f7f4c', '#a57448'], foot: '#8f8148', snowLine: 60,
    fall: { color: 0xe27a2c, count: 130, speed: 1.3, drift: 1.4, size: 0.14 },      // leaves
  },
  winter: {
    label: 'Winter',
    board: C('#eef2f5'), lawn: C('#f4f7f9'), water: C('#cfdbe2'), crop: C('#dfe6ea'), bank: C('#b9c2c8'), mound: C('#e6ecf0'),
    hills: ['#dfe7ee', '#cfdae4', '#e9eff4', '#c3d0dc', '#d6e0e9'], foot: '#d5dfe7', snowLine: 14,
    fall: { color: 0xffffff, count: 750, speed: 1.6, drift: 0.5, size: 0.11 },      // snow
  },
};
export const SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter'];
export const SNOW = C('#f4f7fa');

export const season = () => (SEASONS[settings.season] ? settings.season : 'spring');
export const seasonLook = () => SEASONS[season()];
export const snowy = () => season() === 'winter';

// Parts of the game that have to redraw when the season changes sign up here.
const watchers = [];
export function onSeason(fn) { watchers.push(fn); }

export function setSeason(id, remember) {
  settings.season = SEASONS[id] ? id : 'spring';
  if (remember) saveSettings();
  for (const fn of watchers) fn(seasonLook());
  return seasonLook();
}

export const nextSeason = () => setSeason(SEASON_ORDER[(SEASON_ORDER.indexOf(season()) + 1) % 4], true);
