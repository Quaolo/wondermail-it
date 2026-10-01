// Controlla le mosse e gli apprendimenti estratti da BALANCE/waza_p.bin (data/dati_gioco.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../data/dati_gioco.js');
require('../data/testi_gioco_it.js');
require('../data/testi_gioco_en.js');
const { moves } = window.WMSkyGameData;
const { it, en } = window.WMSkyGameText;
const mon = (name) => en.pokemon.indexOf(name);
const move = (name) => en.moveNames.indexOf(name);
const learned = (monId) => {
  const levelUp = [];
  for (let i = 0; i < moves.learn[monId][0].length; i += 2) levelUp.push([en.moveNames[moves.learn[monId][0][i]], moves.learn[monId][0][i + 1]]);
  return levelUp;
};

test('tabelle delle mosse e degli apprendimenti', () => {
  assert.equal(moves.data.length, 559);
  assert.equal(moves.learn.length, 553);
  for (const list of [en.moveNames, it.moveNames, en.moveDescriptions, it.moveDescriptions, en.moveRanges, it.moveRanges]) {
    assert.equal(list.length, 559);
  }
  for (const row of moves.data) assert.equal(row.length, 5);
});

test('dati di alcune mosse note (potenza, tipo, categoria, PP, precisione)', () => {
  assert.deepEqual(moves.data[move('Tackle')], [6, 1, 0, 30, 95]);
  assert.deepEqual(moves.data[move('Growl')], [0, 1, 2, 20, 100]);
  assert.deepEqual(moves.data[move('Leech Seed')], [0, 4, 2, 17, 90]);
  assert.equal(en.types[moves.data[move('Leech Seed')][1]], 'Grass');
});

test('mosse apprese salendo di livello: Bulbasaur e Pikachu', () => {
  assert.deepEqual(learned(mon('Bulbasaur')).slice(0, 4), [['Tackle', 1], ['Growl', 3], ['Leech Seed', 7], ['Vine Whip', 9]]);
  const pikachu = learned(mon('Pikachu'));
  assert.deepEqual(pikachu.slice(0, 2), [['ThunderShock', 1], ['Growl', 1]]);
  assert.ok(pikachu.some(([name, level]) => name === 'Thunder' && level === 45));
  assert.ok(moves.learn[mon('Pikachu')][1].includes(move('Iron Tail')), 'Coda Ferrea con le MT');
});

test('i livelli crescono e ogni mossa appresa ha un nome', () => {
  for (let id = 1; id <= 534; id++) {
    const [levelUp, tm, egg] = moves.learn[id];
    let last = 0;
    for (let i = 0; i < levelUp.length; i += 2) {
      assert.ok(levelUp[i + 1] >= last, `Pokémon ${id}: livelli non in ordine`);
      last = levelUp[i + 1];
    }
    const all = [...levelUp.filter((_, i) => i % 2 === 0), ...tm, ...egg];
    for (const moveId of all) assert.ok(en.moveNames[moveId], `Pokémon ${id}: mossa ${moveId} senza nome`);
  }
});

test('descrizione e raggio delle mosse, in italiano e in inglese', () => {
  assert.equal(en.moveDescriptions[move('Tackle')], 'Inflicts damage on the target.');
  assert.equal(en.moveRanges[move('Tackle')], 'Enemy in front');
  assert.equal(it.moveNames[move('Tackle')], 'Azione');
  assert.equal(it.moveDescriptions[move('Tackle')], "Causa danni all'obiettivo.");
  assert.equal(it.moveRanges[move('Growl')], 'tutti i nemici nella sala');
  assert.doesNotMatch(it.moveDescriptions[move('Leech Seed')], /\[|\]|Informazioni/);
});
