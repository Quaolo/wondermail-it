// Controlla le icone degli strumenti (item_icon_map.js) con l'aspetto che hanno nel gioco (BALANCE/item_p.bin).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../data/dati_gioco.js');
require('../data/testi_gioco_it.js');
require('../item_icon_map.js');
const { validItems, itemCategory, itemLook } = window.WMSkyGameData;
const icons = window.WMSkyItemIcons;
const names = window.WMSkyGameText.it.items;

// Gli strumenti esclusivi mostrano il ritratto del proprietario.
const EXCLUSIVE = 15;

test('ogni strumento ha un\'icona che esiste', () => {
  for (const id of validItems) {
    if (id === 0 || itemCategory[id] === EXCLUSIVE) continue;
    const path = icons[id];
    assert.ok(path, `${names[id]} (${id}) non ha un'icona`);
    if (!path.startsWith('http')) assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), `${path} non esiste`);
  }
});

test('gli strumenti uguali nel gioco hanno la stessa icona', () => {
  const byLook = new Map();
  for (const id of validItems) {
    if (id === 0 || itemCategory[id] === EXCLUSIVE) continue;
    const first = byLook.get(itemLook[id]);
    if (first === undefined) {
      byLook.set(itemLook[id], id);
    } else {
      assert.equal(icons[id], icons[first], `${names[id]} dovrebbe avere l'icona di ${names[first]}`);
    }
  }
});
