// Controlla le trappole: nomi e descrizioni estratti dal gioco e trappole dei piani (data/piani.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../data/piani.js');
require('../data/testi_gioco_it.js');
require('../data/testi_gioco_en.js');
const floors = window.WMSkyFloors;
const { it, en } = window.WMSkyGameText;
const id = (name) => en.traps.indexOf(name);

test('nomi e descrizioni delle trappole in italiano e in inglese', () => {
  assert.equal(en.traps.length, 25);
  assert.equal(en.trapDescriptions.length, 25);
  for (let trap = 1; trap <= 24; trap++) {
    for (const text of [it, en]) {
      assert.ok(text.traps[trap], `nome mancante per ${trap}`);
      assert.ok(text.trapDescriptions[trap] && !/\[[A-Z]+:/.test(text.trapDescriptions[trap]), `descrizione da controllare per ${trap}`);
    }
  }
  assert.equal(id('Wonder Tile'), 17);
  assert.equal(it.traps[id('Wonder Tile')], 'Mattomagica');
  assert.match(en.trapDescriptions[id('Slumber Trap')], /Sleep status/);
  assert.match(en.trapDescriptions[id('Slumber Trap')], /^[^\n]*$/m);
  assert.ok(!en.trapDescriptions[id('Slumber Trap')].includes('Select detail'));
});

test('ogni piano ha trappole con probabilità che fanno 100 e ID validi', () => {
  const densityIndex = floors.layoutFields.indexOf('trapDensity');
  let checked = 0;
  for (const row of Object.values(floors.byDungeon)) {
    row.forEach((entry) => {
      if (!Array.isArray(entry) || !(floors.layouts[entry[0]][densityIndex] > 0)) return;
      const traps = floors.traps[entry[2]];
      assert.ok(traps.length > 0);
      const total = traps.reduce((sum, [trap, chance]) => sum + chance, 0);
      assert.ok(Math.abs(total - 100) < 0.5, `somma ${total}`);
      traps.forEach(([trap]) => assert.ok(trap >= 1 && trap <= 24, `trappola ${trap}`));
      checked += 1;
    });
  }
  assert.ok(checked > 1700);
});

test('Mattopunte, Levitoroccia e Fielepunte non stanno nei piani: le creano le mosse', () => {
  const used = new Set();
  Object.values(floors.traps).forEach((list) => list.forEach(([trap]) => used.add(trap)));
  for (const name of ['Spiked Tile', 'Stealth Rock', 'Toxic Spikes']) assert.ok(!used.has(id(name)), name);
  for (const name of ['Wonder Tile', 'Mud Trap', 'Warp Trap', 'Grudge Trap']) assert.ok(used.has(id(name)), name);
});
