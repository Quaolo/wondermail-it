// Titolo e descrizione delle missioni scelti dal seme (testi_missione.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../lm.js');
require('../data/dati_gioco.js');
require('../data/testi_gioco_it.js');
require('../data/testi_gioco_en.js');
require('../testi_missione.js');
const J = window.WMSkyJobText;
const P = window.WMSParser;
const TEXT = window.WMSkyGameText;

function render(parts, lang) {
  const names = TEXT[lang];
  return parts.map((part) => {
    if (part.kind === 'pokemon') return names.pokemon[part.id % 600];
    if (part.kind === 'item') return names.items[part.id];
    if (part.kind === 'dungeon') return names.dungeons[part.id];
    if (part.kind === 'floor') return J.formatFloor(part.value, part.dungeon, lang);
    if (part.kind === 'team') return '<squadra>';
    return part.text;
  }).join('').replace(/\s+/g, ' ').trim();
}

function describe(code, lang) {
  const decoded = P.decode(code, 'na');
  assert.ok(decoded && decoded.crcOk, `password ${code}`);
  const text = J.describeMission(decoded.struct, lang);
  assert.ok(text, `testo di ${code}`);
  return { title: render(text.title, lang), summary: render(text.summary, lang), text };
}

// Missioni distribuite ufficialmente (versione americana), con il testo riportato dai giocatori.
const OFFICIAL = [
  ['@+JXC7CH5H1JS4T83@M@J7@F5P#SK&9F9S', 'Explore Bottomless Sea!',
    'Find the Aqua-Monica that lies hidden deep beneath Bottomless Sea!'],
  ['7S&X8T6FCWK-3-&FPPM1C9N7PNT4QT7&RW', 'Explore Giant Volcano!',
    'Find the Fiery Drum that lies hidden deep within the Giant Volcano!'],
  ['N22#9S55M1TRJT2M09P%%3CT6N39S@N5R#', 'Explore Mt. Avalanche!',
    'Find the Icy Flute that lies hidden deep within Mt. Avalanche!'],
  ['XQ5R6620&N4F6C2RR57@5C487PR&&4X#KT', 'Treasure Memo',
    "Let's hide the treasure we can't carry in the cave near the beach."],
  ['=JY3WJ@TT&-5F--=#S2QY#0S47C#0W5C90', 'Treasure Memo',
    'I heard of a hidden treasure on the western part of an island that has a lake on it...'],
  ['-J82YSJ-P@10#QT%MN06HP7YM81&-%-6XM', 'I want to cheer up a sick friend.',
    "Can someone bring back a Gabite Scale? It's for our sick friend!"],
  ['59KHT2SK+5&&8K%MT@N@4K9RK8Q#C0CYHW', 'A challenge from Jirachi!',
    "I'm Jirachi. I'd like to have a battle with the famous Team <squadra>. ♪"],
];

test('i testi delle missioni ufficiali coincidono con quelli del gioco', () => {
  for (const [code, title, summary] of OFFICIAL) {
    const text = describe(code, 'en');
    assert.equal(text.title, title, code);
    assert.equal(text.summary, summary, code);
    assert.equal(text.text.guessed, false);
  }
});

test('anche in italiano i testi escono dagli stessi gruppi', () => {
  const memo = describe('XQ5R6620&N4F6C2RR57@5C487PR&&4X#KT', 'it');
  assert.equal(memo.title, 'Memo tesoro');
  assert.match(memo.summary, /spiaggia/i);
  const jirachi = describe('59KHT2SK+5&&8K%MT@N@4K9RK8Q#C0CYHW', 'it');
  assert.match(jirachi.title, /Jirachi/);
});

// Ogni frase che una missione può ricevere usa solo i segnaposto che quella missione riempie:
// è il controllo che ha fatto scoprire lo scarto di uno tra MISSION_STRING_IDS e il file dei testi.
test('ogni frase raggiungibile usa solo i segnaposto disponibili', () => {
  const table = window.WMSkyGameData.missionText;
  const texts = TEXT.it.missionTexts;
  const allowedTitle = { 1: [], 2: ['item'], 3: ['name'], 4: ['name'], 5: ['dungeon'] };
  const allowedSummary = {
    1: [], 2: ['item'], 3: ['name'], 4: ['name'], 5: ['name', 'item'], 6: ['item', 'floor'],
    7: ['dungeon'], 8: ['dungeon', 'floor']
  };
  let checked = 0;
  for (const template of table.templates) {
    const info = J.argumentKinds(template[1], template[2]);
    if (!info) continue;
    const walk = (link, depth) => {
      if (link === 0xFFFF || depth > 8) return;
      const [count, start] = table.groups[link & 0xFFF];
      const allowed = link & 0x1000 ? allowedSummary[info.summary] : allowedTitle[info.title];
      for (let k = 0; k < count; k += 1) {
        const line = texts[start + k];
        for (const [, tag] of line.matchAll(/\[(name|item|dungeon|floor):0\]/g)) {
          assert.ok(allowed.includes(tag), `${tag} in «${line}» (modello di tipo ${template[1]}.${template[2]})`);
        }
        checked += 1;
        walk(table.next[start + k], depth + 1);
      }
    };
    walk(template[0], 0);
  }
  assert.ok(checked > 1000);
});

test('il seme cambia il testo e le varianti si possono scegliere', () => {
  const decoded = P.decode('=27YYRQ+4%WPCCCTTPTP21P#%33FM=+66N', 'eu');
  assert.ok(decoded && decoded.crcOk);
  // Una missione di soccorso normale ha molte frasi possibili.
  const rescue = Object.assign({}, decoded.struct, { missionType: 0, missionSpecial: 0, specialFloor: 0 });
  const found = J.findVariants(rescue, { wanted: 6 });
  assert.equal(found.variants.length, 6);
  assert.ok(found.total > 6);
  const keys = new Set(found.variants.map((v) => J.textKey(rescue, v.seed)));
  assert.equal(keys.size, 6, 'semi diversi, testi diversi');
  // Il testo dipende da seme + dungeon + piano.
  const moved = Object.assign({}, rescue, { floor: rescue.floor + 1, flavorText: rescue.flavorText - 1 });
  assert.equal(J.textKey(moved), J.textKey(rescue));
});

test('senza un modello adatto il testo è segnato come dedotto', () => {
  // Memo tesoro alla Torre del Tempo: il gioco accetta la missione (piano 1 valido), ma non ha un Memo
  // pensato per quel dungeon, quindi nessun modello corrisponde. Le sale finali come la Fossa Marina non
  // vanno bene come esempio: non hanno piani validi per una missione.
  const data = window.WMSkyGameData;
  assert.ok(data.missionFloors[41] >= 1 && !(data.forbiddenFloors[41] || []).includes(1));
  const memo = { missionType: 12, missionSpecial: 0, dungeon: 41, floor: 1, flavorText: 1, client: 1, target: 1,
    target2: 0, targetItem: 1 };
  const text = J.describeMission(memo, 'it');
  assert.ok(text.guessed);
  assert.equal(text.template, -1);
});

test('i piani si scrivono come nel gioco', () => {
  assert.equal(J.formatFloor(5, 1, 'it'), 'P. -5', 'Grotta Marina scende');
  assert.equal(J.formatFloor(5, 4, 'it'), 'P. 5', 'Monte Pelopunta sale');
  assert.equal(J.formatFloor(5, 1, 'en'), 'B5F');
  assert.equal(J.formatFloor(5, 4, 'en'), '5F');
});
