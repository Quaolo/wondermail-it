// Controlla le abilità QI estratte dal gioco (data/dati_gioco.js e testi): soglie, gruppi e testi.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../data/dati_gioco.js');
require('../data/testi_gioco_it.js');
require('../data/testi_gioco_en.js');
const { iq } = window.WMSkyGameData;
const { it, en } = window.WMSkyGameText;
const id = (name) => en.iqNames.indexOf(name);

test('ogni tabella ha una voce per ognuna delle 69 abilità', () => {
  assert.equal(iq.thresholds.length, 69);
  assert.equal(iq.restrictions.length, 69);
  assert.equal(it.iqNames.length, 69);
  assert.equal(en.iqDescriptions.length, 69);
  assert.equal(iq.groups.length, 16);
});

test('soglie di QI del gioco (IQ_SKILLS)', () => {
  assert.equal(iq.thresholds[id('Type-Advantage Master')], 105);
  assert.equal(iq.thresholds[id('Absolute Mover')], 990);
  assert.equal(iq.thresholds[id('Efficiency Expert')], 10);
  assert.equal(iq.thresholds[id('Item Catcher')], -1);
  assert.equal(iq.thresholds[id('PP Checker')], 9999);
});

test('il nome italiano e quello inglese combaciano con il resto del sito', () => {
  assert.equal(it.iqNames[id('Absolute Mover')], 'Super Podista');
  assert.equal(it.iqNames[id('Absolute Mover')], it.extra.absoluteMover);
  assert.equal(en.iqNames[id('Absolute Mover')], en.extra.absoluteMover);
});

test('i gruppi: forma e contenuto', () => {
  const sizes = iq.groups.map((group) => group.length);
  assert.deepEqual(sizes, [24, 24, 24, 24, 24, 24, 24, 24, 8, 8, 24, 24, 8, 8, 8, 8]);
  for (const group of iq.groups) assert.equal(new Set(group).size, group.length, 'abilità ripetuta in un gruppo');
  // Le abilità che non si possono ottenere (9999) non stanno in nessun gruppo.
  const inGroups = new Set(iq.groups.flat());
  iq.thresholds.forEach((threshold, skill) => {
    if (threshold === 9999) assert.ok(!inGroups.has(skill), `${en.iqNames[skill] || skill} non dovrebbe stare in un gruppo`);
  });
});

test('ogni abilità dei gruppi ha nome e descrizione in italiano e in inglese', () => {
  for (const skill of new Set(iq.groups.flat())) {
    for (const text of [it, en]) {
      assert.ok(text.iqNames[skill], `nome mancante per ${skill}`);
      assert.ok(text.iqDescriptions[skill] && !text.iqDescriptions[skill].includes('$$$'), `descrizione mancante per ${skill}`);
      assert.ok(!/\[[A-Z]+:/.test(text.iqDescriptions[skill]), `codici del gioco nella descrizione di ${skill}`);
    }
  }
});

test('restrizioni: abilità dello stesso tipo non si attivano insieme', () => {
  assert.equal(iq.restrictions[id('Absolute Mover')], iq.restrictions[id('All-Terrain Hiker')]);
  assert.notEqual(iq.restrictions[id('Absolute Mover')], iq.restrictions[id('Trap Seer')]);
});

test('la Fuga (Soccorritore) dipende dalla storia, non dal QI', () => {
  assert.deepEqual(iq.story, [id('Escapist')]);
});

test('ogni Pokémon ha un gruppo QI valido', () => {
  assert.equal(iq.monsterGroup.length, 600);
  for (let monId = 1; monId <= 534; monId++) {
    const group = iq.monsterGroup[monId];
    assert.ok(group >= 0 && group < 16, `Pokémon ${monId}: gruppo ${group}`);
    assert.ok(iq.groups[group].length > 0, `Pokémon ${monId}: gruppo vuoto`);
  }
});
