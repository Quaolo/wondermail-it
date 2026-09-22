// Controlla i dati dei Pokémon estratti dal gioco (data/dati_gioco.js): ritratti ed elenchi delle missioni.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../data/dati_gioco.js');
require('../data/testi_gioco_en.js');
const { nationalDex, missionClients, missionTargets, largeBody } = window.WMSkyGameData;
const names = window.WMSkyGameText.en.pokemon;
const id = (name) => names.indexOf(name);

test('il numero del Pokédex viene dal gioco (Nidoran♀ e Nidoran♂ non sono scambiati)', () => {
  assert.equal(nationalDex[id('Nidoran♀')], 29);
  assert.equal(nationalDex[id('Nidoran♂')], 32);
  assert.equal(nationalDex[id('Wobbuffet')], 202);
  assert.equal(nationalDex[id('Treecko')], 252);
  assert.equal(nationalDex[id('Chimchar')], 390);
});

test('i committenti sono quelli accettati da IsMissionValid', () => {
  for (const name of ['Nidoqueen', 'Typhlosion', 'Treecko', 'Sceptile', 'Mudkip', 'Chimchar', 'Pikachu']) {
    assert.ok(missionClients.includes(id(name)), `${name} deve essere un committente valido`);
  }
  // MISSION_BANNED_MONSTERS: personaggi della storia e leggendari.
  for (const name of ['Grovyle', 'Wigglytuff', 'Chatot', 'Mewtwo', 'Magnemite', 'Kecleon']) {
    assert.ok(!missionClients.includes(id(name)), `${name} non può essere committente`);
    assert.ok(missionTargets.includes(id(name)), `${name} può essere bersaglio`);
  }
  // Solo forme base: niente Unown B, Castform Sole, Deoxys Attacco, Shaymin Cielo, forme della storia.
  for (const monId of [202, 380, 419, 535, 552]) {
    assert.ok(!missionTargets.includes(monId), `${monId} non è una forma base valida`);
  }
  assert.ok(missionClients.every((monId) => missionTargets.includes(monId)));
});

test('i Pokémon grandi non possono unirsi alla squadra', () => {
  assert.ok(largeBody.includes(id('Onix')));
  assert.ok(largeBody.includes(id('Wailord')));
  assert.ok(!largeBody.includes(id('Pikachu')));
});
