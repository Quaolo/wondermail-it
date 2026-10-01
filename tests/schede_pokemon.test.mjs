// Controlla tipi, abilità, statistiche ed evoluzioni dei Pokémon estratti dal gioco (data/dati_gioco.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../data/dati_gioco.js');
require('../data/testi_gioco_it.js');
require('../data/testi_gioco_en.js');
const info = window.WMSkyGameData.monsterInfo;
const { it, en } = window.WMSkyGameText;
const mon = (name) => en.pokemon.indexOf(name);
const item = (name) => en.items.indexOf(name);
const abilityName = (id) => en.abilityNames[id];
const typeName = (id) => en.types[id];

test('tabelle di tutti i Pokémon', () => {
  for (const list of [info.types, info.abilities, info.stats]) assert.equal(list.length, 600);
  assert.equal(en.abilityNames.length, 124);
  assert.equal(it.abilityDescriptions.length, 124);
});

test('tipi e abilità: alcuni casi noti, nelle due lingue', () => {
  assert.deepEqual(info.types[mon('Charmander')].map(typeName), ['Fire', 'None']);
  assert.deepEqual(info.types[mon('Pikachu')].map(typeName), ['Electric', 'None']);
  assert.deepEqual(info.types[mon('Gengar')].map(typeName), ['Ghost', 'Poison']);
  assert.equal(abilityName(info.abilities[mon('Charmander')][0]), 'Blaze');
  assert.equal(abilityName(info.abilities[mon('Pikachu')][0]), 'Static');
  assert.deepEqual(info.abilities[mon('Eevee')].map(abilityName), ['Run Away', 'Adaptability']);
  assert.equal(it.abilityNames[info.abilities[mon('Pikachu')][0]], 'Statico');
  assert.match(it.abilityDescriptions[info.abilities[mon('Pikachu')][0]], /^Statico: /);
});

test('ogni abilità usata da un Pokémon base ha nome e descrizione', () => {
  for (let id = 1; id <= 534; id++) {
    for (const ability of info.abilities[id]) {
      if (!ability) continue;
      assert.ok(en.abilityNames[ability] && !en.abilityNames[ability].startsWith('$'), `Pokémon ${id}: abilità ${ability}`);
      assert.ok(it.abilityDescriptions[ability], `descrizione mancante per ${ability}`);
    }
  }
});

test('evoluzioni: livello, QI, strumento e requisiti in più', () => {
  const evo = (name) => info.evolutions[mon(name)];
  assert.deepEqual(evo('Charmeleon'), [mon('Charmander'), 1, 16, 0]);
  assert.deepEqual(evo('Charizard'), [mon('Charmeleon'), 1, 36, 0]);
  assert.deepEqual(evo('Vaporeon'), [mon('Eevee'), 3, item('Water Stone'), 0]);
  assert.deepEqual(evo('Espeon'), [mon('Eevee'), 2, 100, 5]);        // QI 100 + Fiocco Sole
  assert.deepEqual(evo('Hitmonlee'), [mon('Tyrogue'), 1, 20, 2]);    // Attacco > Difesa
  assert.deepEqual(evo('Hitmonchan'), [mon('Tyrogue'), 1, 20, 3]);   // Attacco < Difesa
  assert.deepEqual(evo('Mantine'), [mon('Mantyke'), 4, mon('Remoraid'), 0]);
  assert.equal(evo('Charmander'), undefined);
});

test('le evoluzioni puntano a Pokémon veri e a metodi noti', () => {
  for (const [id, [pre, method, , additional]] of Object.entries(info.evolutions)) {
    assert.ok(pre > 0 && pre < 600, `evoluzione ${id}`);
    assert.ok([1, 2, 3, 4, 5].includes(method), `metodo ${method} di ${id}`);
    assert.ok(additional >= 0 && additional <= 15, `requisito ${additional} di ${id}`);
  }
  assert.ok(Object.keys(info.evolutions).length > 200);
  for (const key of ['moveAncientPower', 'moveRollout', 'moveDoubleHit', 'moveMimic']) {
    assert.ok(it.extra[key] && en.extra[key], key);
  }
  for (const name of ['Link Cable', 'Sun Ribbon', 'Lunar Ribbon', 'Beauty Scarf']) {
    assert.ok(item(name) > 0, name);
  }
  assert.equal(item('Link Cable'), 151);
  assert.equal(item('Sun Ribbon'), 55);
  assert.equal(item('Lunar Ribbon'), 56);
  assert.equal(item('Beauty Scarf'), 54);
});
