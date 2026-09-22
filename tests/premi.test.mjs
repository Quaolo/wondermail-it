// Controlla la ricerca inversa dei premi delle missioni da ripetere (stanze.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
// stanze.js usa queste funzioni dell'app: qui bastano dei sostituti.
globalThis.t = (key) => key;
globalThis.getItemName = (id) => `strumento ${id}`;
globalThis.getDungeonName = (id) => `dungeon ${id}`;
globalThis.getGameText = () => ({});
require('../data/stanze_fisse.js');
require('../data/dati_gioco.js');
require('../stanze.js');
const { getFarmRewards, findRewardSources, isExclusiveCode } = window.WMSkyRooms;
const { boxes, missionRooms } = window.WMSkyFixedRooms;

const GOMMAINCANTO = 136;
const REVITALSEME = 73;

test('i premi da ripetere sono quelli delle stanze senza tesoro', () => {
  const rewards = getFarmRewards();
  assert.ok(rewards.includes(GOMMAINCANTO));
  assert.ok(rewards.includes(REVITALSEME));
  assert.ok(rewards.includes(57), 'Mascheradoro, posata nella stanza 81');
  // Gli strumenti esclusivi valgono come uno solo.
  const exclusive = rewards.filter(isExclusiveCode);
  assert.equal(exclusive.length, 1);
  // Niente premi inventati: ogni voce viene dalle stanze o dalla tabella dei Tecalusso.
  const fromBoxes = new Set([boxes.fallback, ...Object.values(boxes.byDungeon).flat()]);
  const fromRooms = new Set(missionRooms.withoutTreasure
    .flatMap((id) => (window.WMSkyFixedRooms.rooms[id].items || []).map(([, , item]) => item)));
  assert.ok(rewards.every((item) => fromBoxes.has(item) || fromRooms.has(item)));
});

test('per ogni premio si sa stanza e dungeon', () => {
  const sources = findRewardSources(GOMMAINCANTO);
  // Nella stanza 81 ce ne sono due già sul pavimento, in qualsiasi dungeon.
  const floor = sources.find((source) => source.floorItems);
  assert.equal(floor.room, 81);
  assert.equal(floor.floorItems, 2);
  // Nei Tecalusso: la stanza migliore è la 92, che ne ha sei.
  const withBoxes = sources.filter((source) => !source.floorItems);
  assert.equal(withBoxes[0].room, 92);
  assert.equal(withBoxes[0].boxes, 6);
  // Acque Traditrici: due voci su cinque sono Gommaincanto.
  const dungeon = withBoxes[0].dungeons.find((entry) => entry.dungeon === 108);
  assert.equal(Math.round(dungeon.chance * 100), 40);
});

test('il Revitalseme si trova anche nei dungeon fuori tabella', () => {
  const sources = findRewardSources(REVITALSEME).filter((source) => !source.floorItems);
  assert.ok(sources[0].fallback, 'i dungeon senza elenco danno sempre il Revitalseme');
});
