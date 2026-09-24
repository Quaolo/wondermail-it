// Missioni della bacheca generate con le regole del gioco (bacheca.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../lm.js');
require('../data/dati_gioco.js');
require('../data/testi_gioco_it.js');
require('../data/stanze_fisse.js');
require('../testi_missione.js');
require('../bacheca.js');
const B = window.WMSkyBoard;
const G = window.WMSkyGameData;

function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return (s >>> 8) / 0x1000000;
  };
}

const BOARDS = ['job', 'outlaw', 'cafe', 'bottle'];
const days = [];
for (let i = 0; i < 260; i += 1) {
  const rank = i % 13;
  days.push({ rank, day: B.generateDay({ rank, random: prng(1000 + i) }) });
}
const all = days.flatMap(({ rank, day }) => BOARDS.flatMap((board) => day[board].map((m) => ({ rank, board, m }))));

test('ogni giornata ha da 5 a 8 missioni per bacheca e una al bar e in bottiglia', () => {
  for (const { day } of days) {
    for (const board of ['job', 'outlaw']) {
      assert.ok(day[board].length >= 5 && day[board].length <= 8, `${board}: ${day[board].length}`);
    }
    assert.ok(day.cafe.length <= 1 && day.bottle.length <= 1);
  }
  assert.ok(all.length > 3000);
});

test('le missioni sono valide per il gioco e la password le conserva', () => {
  for (const { m } of all) {
    const max = m.missionType === 11 && m.missionSpecial === 5 ? G.missionFloors[m.dungeon] + 1 : G.missionFloors[m.dungeon];
    assert.ok(m.floor >= 1 && m.floor <= max, `piano ${m.floor} in ${m.dungeon}`);
    assert.ok(!(G.forbiddenFloors[m.dungeon] || []).includes(m.floor), `piano vietato ${m.dungeon}/${m.floor}`);
    assert.ok(m.dungeon < 0xB4);
    if (m.rewardType >= 1 && m.rewardType <= 4) assert.ok(G.validItems.includes(m.reward), `premio ${m.reward}`);
    const code = window.WMSParser.encode(m, 'eu');
    const back = window.WMSParser.decodeWithRegion(code, 'eu');
    assert.ok(back.crcOk);
    for (const key of ['missionType', 'missionSpecial', 'client', 'target', 'dungeon', 'floor', 'flavorText',
      'restrictionType', 'restriction', 'rewardType', 'reward', 'targetItem', 'specialFloor']) {
      assert.equal(back.struct[key], m[key], key);
    }
  }
});

// Due porting indipendenti (bacheca e testi) devono trovare lo stesso modello di missione.
test('per ogni missione il gioco ha un titolo pensato apposta', () => {
  for (const { m } of all) {
    const text = window.WMSkyJobText.describeMission(m, 'it');
    assert.ok(text && !text.guessed, `${m.missionType}.${m.missionSpecial}`);
  }
});

test('a fine gioco mancano le missioni che servono ad aprire dungeon', () => {
  for (const { m } of all) {
    assert.ok(!(m.missionType === 3 && m.missionSpecial === 3), 'esplorare un dungeon nuovo');
    assert.ok(!(m.missionType === 6 && m.missionSpecial === 4), 'Scaglie di Gabite');
    assert.ok(m.missionType !== 14, 'strumenti musicali');
  }
});

test('restrizioni e premi seguono il grado e la difficoltà', () => {
  for (const { rank, m } of all) {
    if (m.restriction && m.restrictionType === 0) assert.ok(rank >= 3 && m.restriction < 18);
    if (m.restrictionType === 1) assert.ok(rank >= 4 && G.missionClients.includes(m.restriction));
    if (m.rewardType === 4 && !(m.missionType === 6 && m.missionSpecial === 4)) assert.ok(B.missionRank(m) >= 11);
    if (m.missionType === 10) assert.notEqual(m.rewardType, 6, 'un ricercato non si unisce alla squadra');
  }
  assert.ok(all.some(({ m }) => m.restriction), 'qualche restrizione esce');
});

test('in una giornata niente due missioni nello stesso piano e una sola sfida per leggendario', () => {
  for (const { day } of days) {
    const missions = BOARDS.flatMap((board) => day[board]);
    const places = missions.map((m) => `${m.dungeon}/${m.floor}`);
    assert.equal(new Set(places).size, places.length);
    const legends = missions.filter((m) => m.missionType === 11 && m.missionSpecial > 0).map((m) => m.missionSpecial);
    assert.equal(new Set(legends).size, legends.length);
  }
});
