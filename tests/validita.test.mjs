// Controlla i limiti che il gioco applica alle missioni (porting di IsMissionValid).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../data/dati_gioco.js');
const { forbiddenFloors, dungeonMaxItems, itemCategory } = window.WMSkyGameData;

const source = readFileSync(new URL('../lmgenerate.js', import.meta.url), 'utf8');
const context = {};
new Function('window', 'document', `${source}; this.getTargetItemError = getTargetItemError;`)
  .call(context, window, {});
const { getTargetItemError } = context;

test('i piani vietati vengono dal gioco', () => {
  // Di solito è il piano del capo: Riserva Marina 19, Grotta Infuocata 30.
  assert.deepEqual(forbiddenFloors[72], [19]);
  assert.deepEqual(forbiddenFloors[110], [30]);
  // Isola Zero Nord ne ha parecchi.
  assert.ok(forbiddenFloors[99].includes(75) && forbiddenFloors[99].length > 5);
  // Grotta Marina non ne ha.
  assert.equal(forbiddenFloors[1], undefined);
});

test('in qualche dungeon non si possono portare strumenti', () => {
  assert.equal(dungeonMaxItems[101], 0);
  assert.equal(dungeonMaxItems[102], 0);
  assert.equal(dungeonMaxItems[1] > 0, true);
});

test('lo strumento obiettivo segue le regole di CheckItemForMissionType', () => {
  // Mela: va bene ovunque.
  assert.equal(getTargetItemError(109, 6), null);
  // Niente "nessuno", forzieri (dal 364), Poké, MT Usata e Uovoincanto.
  assert.equal(getTargetItemError(0, 6), 'invalid');
  assert.equal(getTargetItemError(364, 6), 'invalid');
  assert.equal(getTargetItemError(183, 6), 'invalid');
  assert.equal(getTargetItemError(187, 6), 'invalid');
  assert.equal(getTargetItemError(178, 6), 'invalid');
  // Gli strumenti da lancio valgono solo fuori dalle missioni "cerca con il committente" (tipo 4).
  assert.ok(itemCategory[1] <= 1);
  assert.equal(getTargetItemError(1, 6), null);
  assert.equal(getTargetItemError(1, 4), 'thrown');
  // Punta d'Oro e Fossile Raro sono ammessi anche lì.
  assert.equal(getTargetItemError(9, 4), null);
  assert.equal(getTargetItemError(10, 4), null);
});
