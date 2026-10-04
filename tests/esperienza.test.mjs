// Controlla le curve di esperienza per livello (campo ExpReq di BALANCE/m_level.bin) in data/dati_gioco.js
// e la funzione wikiExpCurve di wiki.js che le decodifica.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../data/dati_gioco.js');
require('../data/testi_gioco_en.js');
const { growth } = window.WMSkyGameData;
const { en } = window.WMSkyGameText;
const mon = (name) => en.pokemon.indexOf(name);

// La funzione vera di wiki.js, senza caricare il resto della pagina.
const wikiSource = fs.readFileSync(new URL('../wiki.js', import.meta.url), 'utf8');
const wikiExpCurve = new Function('window', `${wikiSource.match(/const wikiExpCache[\s\S]*?\n}\n/)[0]}; return wikiExpCurve;`)(window);

test('curve di esperienza: forma dei dati', () => {
  assert.equal(growth.expMonsters.length, 571);
  assert.equal(growth.expMonsters.length, growth.monsters.length);
  assert.equal(growth.expCurves.length, 273);
  for (const curve of growth.expCurves) {
    // 4 cifre per la prima differenza e 3 per ognuna delle 98 variazioni
    assert.equal(curve.length, 4 + 98 * 3);
    assert.match(curve, /^[0-9a-z]+$/);
  }
  for (const index of growth.expMonsters) assert.ok(index >= 0 && index < growth.expCurves.length);
  assert.equal(new Set(growth.expCurves).size, growth.expCurves.length);
});

test('ogni curva decodificata: 100 livelli, livello 1 a 0, sempre crescente', () => {
  for (let id = 0; id < growth.expMonsters.length; id++) {
    const curve = wikiExpCurve(id);
    assert.equal(curve.length, 100);
    assert.equal(curve[0], 0);
    for (let level = 1; level < 100; level++) {
      assert.ok(Number.isInteger(curve[level]), `ID ${id} livello ${level + 1}`);
      assert.ok(curve[level] > curve[level - 1], `ID ${id} livello ${level + 1}`);
    }
    assert.ok(curve[99] < 10_000_000);
  }
});

test('ID senza curva: nessun valore', () => {
  assert.equal(wikiExpCurve(-1), null);
  assert.equal(wikiExpCurve(100000), null);
});

test('alcuni Pokémon: valori letti da m_level.bin (livelli 1, 2, 3, 10, 50, 100)', () => {
  const expected = {
    Bulbasaur: [0, 9, 23, 1711, 577298, 2547402],
    Pikachu: [0, 8, 22, 1679, 566349, 2499090],
    Mewtwo: [0, 16, 38, 1990, 653290, 2882022],
    Magikarp: [0, 13, 32, 1944, 646683, 2853219],
    Rayquaza: [0, 10, 25, 1894, 639001, 2819675],
  };
  for (const [name, values] of Object.entries(expected)) {
    const curve = wikiExpCurve(mon(name));
    assert.deepEqual([1, 2, 3, 10, 50, 100].map((level) => curve[level - 1]), values, name);
  }
});
