// Controlla la crescita delle statistiche per livello estratta da BALANCE/m_level.bin (data/dati_gioco.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../data/dati_gioco.js');
require('../data/testi_gioco_en.js');
const { growth, monsterInfo } = window.WMSkyGameData;
const { en } = window.WMSkyGameText;
const mon = (name) => en.pokemon.indexOf(name);
const gain = (monId, stat, level) => growth.tables[growth.monsters[monId]].charCodeAt(stat * 100 + level - 1) - 97;
const atLevel = (monId, stat, level) => {
  let value = monsterInfo.stats[monId][stat];
  for (let l = 2; l <= level; l++) value += gain(monId, stat, l);
  return value;
};

test('tabelle di crescita: forma e valori', () => {
  assert.equal(growth.monsters.length, 571);
  assert.ok(growth.tables.length > 100 && growth.tables.length < 400);
  for (const table of growth.tables) {
    assert.equal(table.length, 500);
    assert.match(table, /^[a-z]+$/);
  }
  for (const index of growth.monsters) assert.ok(index >= 0 && index < growth.tables.length);
});

test('salendo di livello le statistiche non scendono', () => {
  for (let id = 1; id <= 534; id++) {
    for (let stat = 0; stat < 5; stat++) {
      assert.ok(atLevel(id, stat, 100) >= atLevel(id, stat, 50));
    }
  }
});

test('Bulbasaur: primi livelli e livello 100', () => {
  const id = mon('Bulbasaur');
  assert.deepEqual([0, 1, 2, 3, 4].map((stat) => gain(id, stat, 2)), [3, 1, 2, 2, 2]);
  assert.deepEqual([0, 1, 2, 3, 4].map((stat) => atLevel(id, stat, 100)), [180, 111, 112, 112, 107]);
});
