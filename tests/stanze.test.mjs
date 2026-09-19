// Controlla le stanze speciali estratte dal gioco (data/stanze_fisse.js) e gli elenchi del generatore.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../data/stanze_fisse.js');
require('../data/esempi_memo.js');
require('../data/dati_gioco.js');
require('../lm.js');
const { rooms, missionRooms, legend, boxes } = window.WMSkyFixedRooms;
const { itemCategory } = window.WMSkyGameData;

const source = readFileSync(new URL('../lmgenerate.js', import.meta.url), 'utf8');
const context = {};
new Function('window', 'document', `${source}; this.WMSGenData = WMSGenData;`).call(context, {}, {});
const { staticLists, missionTypes } = context.WMSGenData;

const count = (room, char) => room.map.join('').split(char).length - 1;

test('gli elenchi del generatore coincidono con le tabelle del gioco', () => {
  assert.deepEqual(staticLists.treasurehunt, missionRooms.treasureMemo);
  assert.deepEqual(staticLists.challengerequest, missionRooms.challenge);
  assert.deepEqual(staticLists.thievesden, missionRooms.outlawHideout);
  assert.equal(missionRooms.treasureMemo.length, 30);
  assert.deepEqual(missionRooms.legendaryChallenge, [145, 146, 147, 148, 149]);
  // Le Lettere di sfida leggendarie del generatore usano le stesse stanze del gioco.
  const challenge = missionTypes.find((type) => type.name === 'challengeLetter');
  assert.deepEqual(challenge.subTypes.slice(1).map((sub) => sub.specialFloor), missionRooms.legendaryChallenge);
});

test('le mappe sono rettangolari e usano solo simboli della legenda', () => {
  for (const [id, room] of Object.entries(rooms)) {
    const width = room.map[0].length;
    for (const row of room.map) {
      assert.equal(row.length, width, `stanza ${id}: righe di lunghezza diversa`);
      for (const char of row) assert.ok(legend[char], `stanza ${id}: simbolo sconosciuto ${char}`);
    }
  }
});

test('ogni Memo tesoro ha un solo tesoro, le scale e la partenza', () => {
  for (const id of missionRooms.treasureMemo) {
    const room = rooms[id];
    assert.equal(room.kind, 'treasureMemo');
    assert.equal(count(room, 'T'), 1, `stanza ${id}: tesori`);
    assert.equal(count(room, '>'), 1, `stanza ${id}: scale`);
    assert.equal(count(room, '@'), 1, `stanza ${id}: partenza`);
  }
  // La stanza 114 esiste ma non contiene il tesoro della missione (solo 4 Tecalusso).
  assert.equal(rooms[114].kind, 'unusedTreasureMemo');
  assert.equal(count(rooms[114], 'T'), 0);
  assert.equal(count(rooms[114], 'c'), 4);
});

test('Lettere di sfida, covi e Sala Proibita hanno gli avversari e gli oggetti attesi', () => {
  for (const id of missionRooms.challenge) {
    assert.deepEqual([count(rooms[id], 'B'), count(rooms[id], 'm'), count(rooms[id], 'n')], [1, 1, 1], `sfida ${id}`);
  }
  for (const id of missionRooms.legendaryChallenge) {
    assert.equal(count(rooms[id], 'B'), 1, `leggendario ${id}`);
    assert.equal(rooms[id].props.orbs, 0, `leggendario ${id}: niente sfere`);
  }
  for (const id of missionRooms.outlawHideout) {
    assert.equal(count(rooms[id], 'O'), 1, `covo ${id}`);
    assert.ok(count(rooms[id], 'm') >= 7, `covo ${id}: complici`);
  }
  assert.equal(count(rooms[missionRooms.sealedChamber], 't'), 1);
  assert.equal(count(rooms[missionRooms.sealedChamber], 'E'), 1);
  assert.equal(count(rooms[missionRooms.goldenChamber], 'c'), 2);
});

test('stanze senza tesoro: premi fissi e nessun tesoro della missione', () => {
  assert.deepEqual(missionRooms.withoutTreasure, [...Array.from({ length: 24 }, (_, i) => 81 + i), 111, 113, 114]);
  for (const id of missionRooms.withoutTreasure) {
    const room = rooms[id];
    assert.ok(room, `manca la stanza ${id}`);
    assert.equal(count(room, 'T'), 0, `stanza ${id}: non deve avere il tesoro della missione`);
    assert.ok(room.items && room.items.length > 0, `stanza ${id}: nessun premio`);
    for (const [x, y] of room.items) assert.ok(room.map[y] && room.map[y][x] !== '#', `stanza ${id}: premio in un muro`);
  }
  // Il codice da farm segnalato dai giocatori usa la 81: 2 Gommaincanto, Mascheradoro, Fantascrigno.
  assert.deepEqual(rooms[81].items.map(([, , item]) => item).sort((a, b) => a - b), [57, 67, 136, 136]);
  assert.equal(rooms[81].kind, 'dungeonEnd');
  assert.equal(rooms[113].items.length, 5);
  // Tecalusso: contenuto scelto in base al dungeon della missione, Revitalseme se il dungeon non è in tabella.
  assert.equal(boxes.fallback, 73);
  assert.equal(boxes.byDungeon[72].length, 17);
});

test('categorie degli strumenti dal gioco', () => {
  assert.equal(itemCategory.length, 1400);
  // Baccacedro, Gommaincanto, Mascheradoro, Tecalusso, Setabianca (esclusivo).
  assert.deepEqual([71, 136, 57, 385, 506].map((id) => itemCategory[id]), [2, 3, 4, 12, 15]);
});

test('la stanza 115 coincide con la mappa della wiki giapponese', () => {
  assert.deepEqual(rooms[115].map, [
    '############',
    '####....####',
    '##........##',
    '##........##',
    '#.......@.~#',
    '#...~~~...~#',
    '#...~~~~~~~#',
    '#>.....T~~~#',
    '##.......~##',
    '##........##',
    '####....####',
    '############'
  ]);
});

test('gli esempi reali usano la stanza, il dungeon e il piano indicati', () => {
  for (const example of window.WMSkyMemoExamples) {
    const decoded = window.WMSParser.decodeWithRegion(example.code, example.region);
    assert.ok(decoded && decoded.crcOk, example.code);
    const { struct } = decoded;
    assert.deepEqual([struct.specialFloor, struct.dungeon, struct.floor], [example.specialFloor, example.dungeon, example.floor]);
    assert.ok(rooms[example.specialFloor], `manca la stanza ${example.specialFloor}`);
    // Nelle missioni vere committente e bersaglio coincidono.
    assert.equal(struct.client, struct.target);
  }
});
