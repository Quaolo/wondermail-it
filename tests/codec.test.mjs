// Test del codec delle password (lm.js). Esecuzione: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../lm.js');
const P = globalThis.WMSParser;

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

const FIELDS = {
  specialFloor: 8, floor: 8, dungeon: 8, flavorText: 24, restriction: 11, restrictionType: 1,
  reward: 11, rewardType: 4, targetItem: 10, target2: 11, target: 11, client: 11,
  missionSpecial: 4, missionType: 4
};

function randomStruct(rnd) {
  const struct = { nullBits: 0, mailType: 4 };
  for (const [name, bits] of Object.entries(FIELDS)) struct[name] = rnd(2 ** bits);
  return struct;
}

function prng(seed) {
  let s = seed;
  return (n) => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s % n;
  };
}

function sameFields(actual, expected) {
  for (const name of Object.keys(expected)) {
    assert.equal(actual[name], expected[name], `campo ${name}`);
  }
}

test('produce gli stessi codici del generatore originale (EU e NA)', () => {
  for (const vector of fixture('vettori_generatore_originale.json')) {
    assert.equal(P.encode(vector.struct, 'eu'), vector.eu);
    assert.equal(P.encode(vector.struct, 'na'), vector.na);
  }
});

test('codice di esempio verificato a mano', () => {
  const struct = {
    nullBits: 0, specialFloor: 0, floor: 5, dungeon: 1, flavorText: 312345, restriction: 0,
    restrictionType: 0, reward: 109, rewardType: 2, targetItem: 109, target2: 0, target: 25,
    client: 25, missionSpecial: 0, missionType: 0, mailType: 4
  };
  assert.equal(P.encode(struct, 'eu'), 'K#KC-S@Y618#TJ7C%&@%QF@S-C&175=37=');
  assert.equal(P.encode(struct, 'na'), '17CT#F87#Q%65CK@S7&JY13%C&=-=SK-@@');
});

test('andata e ritorno in tutte le regioni, con riconoscimento della regione', () => {
  const rnd = prng(2026);
  for (let i = 0; i < 300; i++) {
    const struct = randomStruct(rnd);
    for (const region of ['eu', 'na', 'jp']) {
      const code = P.encode(struct, region);
      assert.equal(code.length, 34);
      const decoded = P.decode(code);
      assert.ok(decoded, `codice ${code} non riconosciuto`);
      assert.equal(decoded.region, region);
      sameFields(decoded.struct, struct);
    }
  }
});

test('i codici dei Memo tesoro presi dalla wiki giapponese sono codici JP', () => {
  for (const code of fixture('codici_memo_giapponesi.json')) {
    assert.equal(P.decodeWithRegion(code, 'eu').crcOk, false);
    assert.equal(P.decodeWithRegion(code, 'na').crcOk, false);
    const decoded = P.decode(code);
    assert.equal(decoded.region, 'jp');
    assert.equal(decoded.struct.missionType, 12);
    assert.equal(decoded.struct.mailType, 4);
  }
});

test('conversione di regione: stessa missione, codice diverso', () => {
  for (const code of fixture('codici_memo_giapponesi.json')) {
    const original = P.decode(code);
    const eu = P.convertRegion(code, 'jp', 'eu');
    const converted = P.decode(eu);
    assert.equal(converted.region, 'eu');
    sameFields(converted.struct, original.struct);
  }
});

test('le stringhe casuali vengono rifiutate', () => {
  const rnd = prng(7);
  let accepted = 0;
  for (let i = 0; i < 5000; i++) {
    let code = '';
    for (let c = 0; c < 34; c++) code += P.bitValues.charAt(rnd(32));
    if (P.decode(code)) accepted++;
  }
  assert.equal(accepted, 0);
});

test('i valori fuori dai limiti bloccano la generazione', () => {
  const base = randomStruct(prng(1));
  const cases = [
    ['specialFloor', 256], ['floor', -1], ['flavorText', 2 ** 24], ['targetItem', 1024],
    ['client', 2048], ['dungeon', 1.5], ['reward', Number.NaN]
  ];
  for (const [field, value] of cases) {
    const struct = { ...base, [field]: value };
    assert.throws(() => P.encode(struct, 'eu'), (error) => {
      assert.equal(error.name, 'WMSFieldError');
      assert.equal(error.errors[0].field, field);
      return true;
    });
  }
});

test('pulizia della password inserita a mano', () => {
  const struct = randomStruct(prng(99));
  const code = P.encode(struct, 'eu');
  const messy = ` ${code.slice(0, 7)} ${code.slice(7, 17)}\n${code.slice(17)} `.toLowerCase();
  assert.equal(P.sanitize(messy), code);
  assert.equal(P.sanitize('ABCO0'), 'C00');
  assert.equal(P.sanitize('＆６'), '&6');
});
