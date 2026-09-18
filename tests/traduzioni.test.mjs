// Controlla che italiano e inglese abbiano le stesse chiavi e che ogni testo usato dalla pagina esista.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

globalThis.window = globalThis.window || {};
require('../lang/locales.js');
require('../lang/it.js');
require('../lang/en.js');
require('../lm.js');
const { locales } = window.WMSkyLocaleData;

function usedKeys() {
  const keys = new Set();
  const add = (regex, text) => {
    for (const match of text.matchAll(regex)) keys.add(match[1]);
  };
  add(/\bt\('(\w+)'/g, read('app.js'));
  add(/translate\('(\w+)'|tr\('(\w+)'/g, read('lmgenerate.js'));
  for (const match of read('lmgenerate.js').matchAll(/tr\('(\w+)'/g)) keys.add(match[1]);
  add(/getLocaleMessage\('(\w+)'\)/g, read('lmutils.js'));
  add(/data-i18n(?:-html|-placeholder|-title)?="(\w+)"/g, read('index.html'));
  for (const field of window.WMSStruct) if (!field.noinclude) keys.add(`field_${field.name}`);
  for (const region of window.WMSParser.regions) keys.add(`region_${region}`);
  for (const v of ['top', 'middle', 'bottom']) for (const h of ['left', 'center', 'right']) keys.add(`pos_${v}_${h}`);
  for (const match of read('memo_gallery.js').matchAll(/"(?:noteKey|warningKey|observedLootKey)": "(\w+)"/g)) keys.add(match[1]);
  keys.delete(undefined);
  return keys;
}

test('italiano e inglese hanno le stesse chiavi', () => {
  const it = locales.it;
  const en = locales.en;
  assert.deepEqual(Object.keys(it.messages).sort(), Object.keys(en.messages).sort());
  for (const map of ['missionTypes', 'rewardTypes', 'pokemonForms']) {
    assert.deepEqual(Object.keys(it[map]).sort(), Object.keys(en[map]).sort(), map);
  }
  assert.deepEqual(Object.keys(it.missionSubtypes), Object.keys(en.missionSubtypes));
});

test('ogni testo usato dalla pagina esiste in entrambe le lingue', () => {
  const missing = [];
  for (const key of usedKeys()) {
    for (const lang of ['it', 'en']) {
      if (!locales[lang].messages[key]) missing.push(`${lang}:${key}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('nessuna chiave inutilizzata', () => {
  const used = usedKeys();
  const unused = Object.keys(locales.it.messages).filter((key) => !used.has(key));
  assert.deepEqual(unused, []);
});

test('una etichetta per ogni tipo di missione e sottotipo', () => {
  const source = read('lmgenerate.js');
  const context = {};
  new Function('window', 'document', `${source}; this.WMSGenData = WMSGenData;`).call(context, {}, {});
  const types = context.WMSGenData.missionTypes;
  for (const lang of ['it', 'en']) {
    const labels = locales[lang];
    types.forEach((type, index) => {
      assert.ok(labels.missionTypes[index], `${lang} missionTypes[${index}]`);
      (type.subTypes || []).forEach((_, subIndex) => {
        assert.ok(labels.missionSubtypes[index] && labels.missionSubtypes[index][subIndex], `${lang} missionSubtypes[${index}][${subIndex}]`);
      });
    });
  }
});
