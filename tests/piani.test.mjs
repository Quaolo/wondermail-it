// Controlla piani massimi e difficoltà delle missioni presi dal gioco (data/dati_gioco.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../data/dati_gioco.js');
const { missionFloors, missionRanks, missionRankPoints } = window.WMSkyGameData;

const source = readFileSync(new URL('../lmgenerate.js', import.meta.url), 'utf8');
const context = {};
new Function('window', 'document', `${source}; this.WMSGenData = WMSGenData;`).call(context, {}, {});
const { validDungeons } = context.WMSGenData;

test('il piano massimo di ogni dungeon viene dal gioco', () => {
  // Grotta Marina (4 piani), Giungla del Mistero (29), Mar Voragine (49).
  assert.equal(missionFloors[1], 4);
  assert.equal(missionFloors[85], 29);
  assert.equal(missionFloors[73], 49);
  // Caverna Stellata (0xAE) è l'unico dungeon con un piano in meno del solito.
  assert.equal(missionFloors[0xAE], 15);
  assert.equal(missionFloors.length, 256);
  assert.ok(missionFloors.every((floors) => floors >= 1 && floors <= 99));
});

test('ogni piano ha la sua difficoltà', () => {
  for (const dungeon of validDungeons) {
    const ranks = missionRanks[dungeon];
    assert.ok(ranks, `il dungeon ${dungeon} non ha le difficoltà`);
    assert.equal(ranks.length, missionFloors[dungeon], `difficoltà e piani diversi nel dungeon ${dungeon}`);
    assert.ok(ranks.every((rank) => rank >= 0 && rank < missionRankPoints.length));
  }
  // La difficoltà cresce scendendo: Giungla del Mistero va da E a ★7.
  assert.equal(missionRanks[85][0], 1);
  assert.equal(missionRanks[85][28], 13);
});

test('i punti esplorazione sono quelli di MISSION_RANK_POINTS', () => {
  assert.deepEqual(missionRankPoints, [5, 10, 15, 20, 30, 60, 90, 150, 250, 400, 600, 800, 1000, 1200, 1400, 1600]);
});
