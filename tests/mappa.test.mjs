// Dati dei piani dei dungeon presi da BALANCE/mappa_s.bin (data/piani.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../data/dati_gioco.js');
require('../data/piani.js');
require('../data/testi_gioco_it.js');
require('../data/testi_gioco_en.js');
const F = window.WMSkyFloors;
const { missionFloors } = window.WMSkyGameData;
const it = window.WMSkyGameText.it;
const en = window.WMSkyGameText.en;

const source = readFileSync(new URL('../lmgenerate.js', import.meta.url), 'utf8');
const context = {};
new Function('window', 'document', `${source}; this.WMSGenData = WMSGenData;`).call(context, {}, {});
const { validDungeons } = context.WMSGenData;

function floorData(dungeon, floor) {
  const entry = F.byDungeon[dungeon][floor - 1];
  if (!Array.isArray(entry)) return null;
  const layout = Object.fromEntries(F.layoutFields.map((field, index) => [field, F.layouts[entry[0]][index]]));
  return { layout, monsters: F.monsters[entry[1]], traps: F.traps[entry[2]], items: F.items[entry[3]] };
}

const total = (list, column) => list.reduce((sum, row) => sum + row[column], 0);

test('ogni piano delle missioni ha i suoi dati', () => {
  for (const dungeon of validDungeons) {
    const row = F.byDungeon[dungeon];
    assert.ok(row, `dungeon ${dungeon}`);
    for (let floor = 1; floor <= missionFloors[dungeon]; floor += 1) {
      assert.ok(floorData(dungeon, floor), `dungeon ${dungeon}, piano ${floor}`);
    }
  }
});

test('le probabilità di Pokémon, strumenti e trappole fanno 100', () => {
  // Gli strumenti sono arrotondati a due decimali uno per uno: la somma può scostarsi di qualche decimo.
  const close = (value) => Math.abs(value - 100) < 0.5;
  F.monsters.forEach((list, index) => assert.ok(!list.length || close(total(list, 2)), `Pokémon ${index}`));
  F.traps.forEach((list, index) => assert.ok(close(total(list, 1)), `trappole ${index}`));
  F.items.forEach((list, index) => assert.ok(close(total(list, 1)), `strumenti ${index}`));
});

test('Grotta Marina, piano 1: quattro Pokémon al 25%, buio e solo Mattomagiche', () => {
  const floor = floorData(1, 1);
  const names = floor.monsters.map(([monster, level]) => `${it.pokemon[monster % 600]} ${level}`).sort();
  assert.deepEqual(names, ['Corsola 2', 'Kabuto 1', 'Shellder 1', 'Shellos 2']);
  floor.monsters.forEach(([, , chance]) => assert.ok(Math.abs(chance - 25) < 0.05));
  assert.equal(floor.layout.weather, 0);
  assert.equal(floor.layout.darkness, 2);
  assert.deepEqual(floor.traps, [[17, 100]]);
  assert.equal(it.traps[17], 'Mattomagica');
});

test('Kecleon e il segnaposto finale non compaiono tra i Pokémon del piano', () => {
  for (const list of F.monsters) {
    assert.ok(list.every(([monster]) => monster !== 383 && monster !== 553));
  }
});

test('meteo, scale nascoste e posti speciali hanno i nomi del gioco', () => {
  assert.deepEqual(en.weather, ['Clear', 'Sunny', 'Sandstorm', 'Cloudy', 'Rain', 'Hail', 'Fog', 'Snow']);
  assert.equal(it.weather[5], 'Grandine');
  assert.deepEqual(it.floorPlaces, {
    kecleonShop: 'Kecleon Market', monsterHouse: 'Covo di Pokémon', secretBazaar: 'Bazar Segreto', secretRoom: 'Sala Segreta'
  });
  assert.equal(en.floorPlaces.monsterHouse, 'Monster House');
  const layouts = F.layouts.map((row) => Object.fromEntries(F.layoutFields.map((field, index) => [field, row[index]])));
  assert.ok(layouts.every((layout) => layout.weather <= 8 && layout.darkness <= 4));
  assert.ok(layouts.every((layout) => [0, 1, 255].includes(layout.hiddenStairsType)));
  assert.ok(layouts.some((layout) => layout.weather === 7), 'qualche piano con la neve');
  assert.ok(layouts.some((layout) => layout.hiddenStairs > 0), 'qualche piano con le scale nascoste');
});

test('negozio, covo e strumenti sepolti hanno i loro elenchi', () => {
  const entries = Object.values(F.byDungeon).flat().filter(Array.isArray);
  assert.ok(entries.every((entry) => entry.length === 7));
  const used = (column) => [...new Set(entries.map((entry) => entry[column]))].map((index) => F.items[index]);
  // Nel negozio di Kecleon non si vendono Poké.
  assert.ok(used(4).every((list) => list.every(([item]) => item !== 183)));
  assert.ok(used(5).length > 1 && used(6).length >= 1);
  assert.ok(F.layoutFields.includes('itemlessHouse') && F.layoutFields.includes('buriedDensity'));
});
