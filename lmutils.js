/*
  Funzioni di supporto: formattazione della password e nomi di strumenti, dungeon e Pokémon
  nella lingua corrente, presi dai testi ufficiali del gioco (data/testi_gioco_*.js).
*/

function $(id) {
  return document.getElementById(id);
}

/**
 * Formatta la password su più righe: colonna esterna, colonna centrale, colonna esterna.
 * Con 34 caratteri, 2 righe e colonna centrale da 7: "XXXXX XXXXXXX XXXXX" per riga.
 */
function prettyMailString(mailString, rows, middleColumnSize) {
  mailString = WMSParser.sanitize(mailString);
  var outerColumnSize = (mailString.length - rows * middleColumnSize) / (rows * 2);
  var lines = [];
  var pointer = 0;
  for (var row = 0; row < rows; row++) {
    var first = mailString.substr(pointer, outerColumnSize);
    pointer += outerColumnSize;
    var middle = mailString.substr(pointer, middleColumnSize);
    pointer += middleColumnSize;
    var last = mailString.substr(pointer, outerColumnSize);
    pointer += outerColumnSize;
    lines.push(first + ' ' + middle + ' ' + last);
  }
  return lines.join('\n');
}

function getActiveLanguageCode() {
  return typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'it';
}

function getGameText(lang) {
  var all = window.WMSkyGameText || {};
  return all[lang || getActiveLanguageCode()] || all.en || all.it || null;
}

function getLocaleData(lang) {
  var registry = (window.WMSkyLocaleData && window.WMSkyLocaleData.locales) || {};
  return registry[lang || getActiveLanguageCode()] || registry.en || {};
}

function getLocaleMessage(key) {
  var messages = getLocaleData().messages || {};
  return messages[key] || key;
}

/**
 * Nome ufficiale dello strumento nella lingua corrente.
 */
function getItemName(itemId) {
  var id = parseInt(itemId, 10);
  var text = getGameText();
  var name = text && isFinite(id) ? text.items[id] : null;
  return name || getLocaleMessage('unknownItem');
}

/**
 * Nome ufficiale del dungeon nella lingua corrente.
 */
function getDungeonName(dungeonId) {
  var id = parseInt(dungeonId, 10);
  var text = getGameText();
  var name = text && isFinite(id) ? text.dungeons[id] : null;
  return name || getLocaleMessage('unknownDungeon');
}

/**
 * Nome del Pokémon. Il gioco non distingue le forme alternative (tutti gli Unown si chiamano
 * "Unown"): per quelle si usano le etichette del file di lingua (pokemonForms).
 * Le forme femminili (ID + 600) sono indicate con ♀.
 */
function getMonName(monId) {
  var id = parseInt(monId, 10);
  if (!isFinite(id) || id < 0) {
    return '-';
  }
  var base = id % 600;
  var forms = getLocaleData().pokemonForms || {};
  var name = forms[base];
  if (!name) {
    var text = getGameText();
    name = text ? text.pokemon[base] : null;
  }
  if (!name || /^\?+$/.test(name) || /^reserve_/.test(name)) {
    name = getLocaleMessage('reservedPokemon').replace('{id}', String(base));
  }
  if (id >= 600 && typeof hasFemaleForm === 'function' && hasFemaleForm(base)) {
    name += ' ♀';
  }
  return name;
}
