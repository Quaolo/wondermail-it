// Password dei soccorsi (soccorso.js): SOS, E-mail di OK, Ringraziamento.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || globalThis;
require('../lm.js');
require('../soccorso.js');
require('../data/dati_gioco.js');
const P = globalThis.WMSParser;
const R = globalThis.WMSkyRescue;
const game = globalThis.WMSkyGameData;

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

function crc32(bytes) {
  let c = ~0;
  for (const b of bytes) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function prng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x80000000;
  };
}

test('i passaggi comuni con le Wonder Mail S leggono i 60 vettori come il gioco (CRC32 giusto)', () => {
  // Il gioco usa le stesse funzioni (caratteri -> bit, cifratura) per le Wonder Mail S, con 34 caratteri,
  // la loro permutazione e un CRC32 al posto della somma: se il CRC torna, i passaggi sono giusti.
  const { codeToBytes, cipher } = R.internal;
  for (const vector of fixture('vettori_generatore_originale.json')) {
    const bytes = codeToBytes(vector.eu, 34, P.swapTables.eu);
    const stored = (bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24) >>> 0;
    const data = cipher(bytes[0], bytes.slice(4, 21), -1);
    assert.equal(crc32(data), stored, vector.eu);
  }
});

test('un SOS si scrive e si rilegge uguale, e occupa esattamente i 256 bit dei dati', () => {
  const random = prng(7);
  for (let i = 0; i < 200; i++) {
    const name = R.nameToBytes(['Squadra', 'Luce♀', 'Élite', 'ABCDEFGHIJ'][i % 4]);
    const sos = R.makeSos({ dungeon: 1 + Math.floor(random() * 127), floor: 1 + Math.floor(random() * 99),
      language: 4, teamName: name, random });
    const code = R.encode(sos);
    assert.equal(code.length, 54);
    const back = R.decode(code);
    assert.ok(back.ok, code);
    for (const key of ['type', 'dungeon', 'floor', 'seed', 'idLow', 'idHigh', 'language', 'flag', 'sky']) {
      assert.equal(back.mail[key], sos[key], key);
    }
    assert.deepEqual(back.mail.teamName, sos.teamName);
    assert.equal(back.mail.bits, 256);
  }
});

test("l'E-mail di OK ha tipo 4, lo stesso codice del SOS e nessuno strumento", () => {
  const random = prng(11);
  const sos = R.makeSos({ dungeon: 6, floor: 8, language: 4, teamName: R.nameToBytes('Paolo'), random });
  const okCode = R.encode(R.okFromSos(sos));
  const ok = R.decode(okCode);
  assert.ok(ok.ok);
  assert.equal(ok.mail.type, R.TYPES.ok);
  assert.equal(ok.mail.idLow, sos.idLow);
  assert.equal(ok.mail.idHigh, sos.idHigh);
  assert.equal(ok.mail.dungeon, 6);
  assert.equal(ok.mail.floor, 8);
  assert.equal(ok.mail.item1, 0);
  assert.equal(ok.mail.item2, 0);
  assert.equal(R.nameFromBytes(ok.mail.teamName), 'Paolo');
  assert.ok(ok.mail.bits <= 256);
  assert.notEqual(okCode, R.encode(sos));
});

test('un carattere sbagliato viene quasi sempre scoperto dal controllo', () => {
  const random = prng(3);
  const code = R.encode(R.makeSos({ dungeon: 17, floor: 3, language: 1, teamName: R.nameToBytes('Test'), random }));
  let caught = 0;
  let total = 0;
  for (let i = 0; i < code.length; i++) {
    const other = code[i] === '&' ? '6' : '&';
    const broken = code.slice(0, i) + other + code.slice(i + 1);
    total++;
    if (!R.decode(broken).ok) caught++;
  }
  assert.ok(caught >= total - 3, `${caught}/${total}`);
  assert.equal(R.decode(code.slice(1)).reason, 'length');
});

test('nome della squadra nel set di caratteri del gioco', () => {
  assert.deepEqual(R.nameToBytes('Ab♂'), [0x41, 0x62, 0xBD, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(R.nameFromBytes(R.nameToBytes('Città♀')), 'Città♀');
  assert.equal(R.nameToBytes('Troppo lungo!'), null);
  assert.equal(R.nameToBytes('日本'), null);
});

test('tentativi di soccorso per dungeon dal gioco (0xFF = niente SOS)', () => {
  assert.equal(game.rescueAttempts[6], 10);     // Grotta della Cascata
  assert.equal(game.rescueAttempts[64], 20);    // Valle Dimensionale
  assert.equal(game.rescueAttempts[1], 255);    // Grotta Marina
  // Nella password il dungeon ha 7 bit: nessun dungeon vero con i soccorsi sta oltre il 127 (dal 177 in
  // su ci sono luoghi della città, che non sono dungeon).
  game.rescueAttempts.slice(0, 0xB0).forEach((value, dungeon) => {
    if (value !== 255) assert.ok(dungeon < 128, `dungeon ${dungeon}`);
  });
});

test('SOS di Tempo e Oscurità: solo il bit della versione, senza quello del Cielo', () => {
  for (const version of ['sky', 'time', 'darkness']) {
    const sos = R.makeSos({ dungeon: 6, floor: 2, language: 4, teamName: R.nameToBytes('Test'), version });
    const back = R.decode(R.encode(sos));
    assert.ok(back.ok);
    assert.equal(R.gameVersion(back.mail), version);
    // L'E-mail di OK conserva la versione dell'SOS, come fa il gioco quando risponde a Tempo/Oscurità.
    assert.equal(R.gameVersion(R.decode(R.encode(R.okFromSos(back.mail))).mail), version);
  }
});

test('ogni SOS nuovo ha un codice diverso (il gioco rifiuta i codici già ricevuti)', () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const sos = R.makeSos({ dungeon: 6, floor: 2, language: 4, teamName: R.nameToBytes('Test') });
    seen.add(`${sos.idHigh}:${sos.idLow}`);
  }
  assert.equal(seen.size, 200);
});

// Prova di Paolo del 29/09: SOS creato dal sito, soccorso fatto nel gioco, E-mail di OK scritta dal gioco.
const REAL_SOS = '+@RFF# FWM@Y0 0JPKC013N&MS +79@++ +5N-P#5=63+T 5F93YM S0TQH#';
const REAL_OK = 'J=7==38KQRJTQ90N-3H6H&F-6C=50615+X1P1+092QPPNC0#6RYCN8';

test("un'E-mail di OK scritta dal gioco si legge ed è quella che il sito ricava dall'SOS", () => {
  const sos = R.decode(REAL_SOS);
  const ok = R.decode(REAL_OK);
  assert.ok(sos.ok && ok.ok);
  assert.equal(sos.mail.type, R.TYPES.sos);
  assert.equal(ok.mail.type, R.TYPES.ok);
  assert.equal(ok.mail.dungeon, 20);          // Deserto del Nord
  assert.equal(ok.mail.floor, 2);
  assert.equal(ok.mail.idLow, sos.mail.idLow);
  assert.equal(ok.mail.idHigh, sos.mail.idHigh);
  assert.equal(R.nameFromBytes(sos.mail.teamName), 'Harl');
  assert.equal(R.nameFromBytes(ok.mail.teamName), 'Astra'); // la squadra di chi ha soccorso
  assert.equal(R.gameVersion(ok.mail), 'sky');
  // Con nome e codice di chi soccorre, il sito scrive la stessa identica password del gioco.
  const mine = R.okFromSos(sos.mail, { teamName: ok.mail.teamName, otherLow: ok.mail.otherLow, otherHigh: ok.mail.otherHigh });
  assert.equal(R.encode(mine), R.sanitize(REAL_OK));
});

test('difficoltà del soccorso della prova: Deserto del Nord P. -2 è B, come diceva il gioco', () => {
  assert.equal(game.missionRanks[20][1], 4);        // B
  assert.equal(game.missionRankPoints[4], 30);
  // Il Semeturpe (94) ricevuto come premio è nell'elenco dei premi della difficoltà B.
  assert.ok(game.board.rewardLists[3].some(([item]) => item === 94));
});
