/*
  Titolo e descrizione della missione, scelti dal gioco a partire dal seme della password.

  Rifà quello che fanno GenerateMissionDetailsStruct, AppendMissionTitle e AppendMissionSummary
  (pret/pmd-sky, asm/main_0205EDA4.s) con le tabelle di RESCUE/rescue.bin e MISSION_STRING_IDS,
  estratte da tools/estrai_dati.py in data/dati_gioco.js (missionText) e nei file dei testi
  (missionTexts, floorFormat).

  1. Il gioco cerca il primo modello di missione di rescue.bin che corrisponde alla missione. Il controllo
     dipende dal tipo: a volte bastano tipo e sottotipo, a volte servono anche committente, bersaglio,
     strumento o dungeon uguali a quelli del modello.
  2. Dal modello parte una catena di gruppi di frasi: da ogni gruppo esce una frase a caso, e ogni frase
     dice qual è il gruppo successivo. Le prime frasi formano il titolo, le altre la descrizione.
  3. Il caso viene da un generatore lineare (x = x * 0x5D588B65 + 1) che parte da seme + dungeon + piano:
     cambiando il piano cambia anche il testo.

  Nessuna dipendenza dal resto dell'app: restituisce pezzi di testo con i segnaposto già riconosciuti
  (nome, strumento, luogo, piano, squadra) e l'app li trasforma in nomi.
*/
(function (root) {
  'use strict';

  const END = 0xFFFF;
  const SUMMARY = 0x1000;
  const INDEX = 0x0FFF;
  const MAX_STEPS = 16; // le catene del gioco sono lunghe al massimo 3 passi: evita cicli su dati strani

  // Colonne dei modelli in dati_gioco.js (missionText.templates).
  const T = {
    text: 0, type: 1, subtype: 2, itemCase: 3, item: 4, dungeonCase: 5, dungeon: 6,
    clientCase: 7, client: 8, targetCase: 9, target: 10, backupCase: 11, backup: 12
  };

  function gameData() {
    return root.WMSkyGameData || {};
  }

  function tables() {
    return gameData().missionText || null;
  }

  function texts(lang) {
    const all = root.WMSkyGameText || {};
    return (all[lang] && all[lang].missionTexts) ? all[lang] : all.it || all.en || null;
  }

  // sub_02060274: quale controllo usare per trovare il modello, e quali valori riempiono i segnaposto
  // del titolo (titleArgs) e della descrizione (summaryArgs).
  // 1 nessuno, 2 strumento, 3 committente, 4 bersaglio, 5 luogo (titolo) o bersaglio + strumento
  // (descrizione), 6 strumento + piano, 7 luogo, 8 luogo + piano.
  function describe(type, subtype) {
    switch (type) {
      case 0: return { check: 0, title: 1, summary: 1 };
      case 1:
        if (subtype === 0) return { check: 1, title: 4, summary: 4 };
        if (subtype === 1) return { check: 5, title: 1, summary: 1 };
        return { check: 5, title: 1, summary: 4 };
      case 2:
        if (subtype === 0) return { check: 1, title: 4, summary: 4 };
        if (subtype === 1) return { check: 5, title: 1, summary: 4 };
        return null;
      case 3: return { check: 1, title: 1, summary: subtype === 0 ? 8 : 7 };
      case 4: return subtype === 0 ? { check: 3, title: 1, summary: 5 } : null;
      case 5: return { check: 0, title: 5, summary: 7 };
      case 6:
        return {
          check: 1,
          title: subtype === 1 || subtype === 4 ? 1 : 2,
          summary: subtype === 4 ? 1 : 2
        };
      case 7: return { check: 0, title: 2, summary: 2 };
      case 8: return { check: 0, title: 1, summary: 4 };
      case 9: return { check: 1, title: 1, summary: [5, 6, 5][subtype] || null };
      case 10: return { check: subtype === 6 ? 6 : 4, title: 4, summary: 1 };
      case 11: return { check: subtype === 0 ? 6 : 4, title: 3, summary: 7 };
      case 12: return { check: 7, title: 1, summary: 1 };
      case 14: return subtype === 1 ? { check: 7, title: 1, summary: 1 } : null;
      default: return null;
    }
  }

  // DexNumbersEqual: due ID valgono uguali se hanno lo stesso numero del Pokédex (maschio/femmina).
  function sameSpecies(a, b) {
    const dex = gameData().nationalDex || [];
    const da = dex[a % 600];
    const db = dex[b % 600];
    return da !== undefined && db !== undefined ? da === db : a % 600 === b % 600;
  }

  function isOpen(value) {
    return value === 0 || value === 1;
  }

  // MISSION_VALIDATION_FUNCTION_LIST.
  function matches(check, template, mission) {
    if (template[T.type] !== mission.missionType) return false;
    if (check === 0) return true;
    if (template[T.subtype] !== mission.missionSpecial) return false;
    switch (check) {
      case 1: return true;
      case 2:
      case 3: return isOpen(template[T.itemCase]) && template[T.item] === mission.targetItem;
      case 4: return isOpen(template[T.clientCase]) && sameSpecies(template[T.client], mission.client);
      case 5:
        return isOpen(template[T.clientCase]) && isOpen(template[T.targetCase])
          && sameSpecies(template[T.client], mission.client) && sameSpecies(template[T.target], mission.target);
      case 6:
        return isOpen(template[T.clientCase]) && isOpen(template[T.targetCase]) && isOpen(template[T.backupCase])
          && sameSpecies(template[T.client], mission.client) && sameSpecies(template[T.target], mission.target)
          && sameSpecies(template[T.backup], mission.target2);
      case 7: return isOpen(template[T.dungeonCase]) && template[T.dungeon] === mission.dungeon;
      default: return false;
    }
  }

  // MatchMissionTemplateToMission: primo modello che va bene; per il controllo 3 si riprova con tipo e sottotipo.
  function findTemplate(check, mission) {
    const list = tables().templates;
    for (let i = 0; i < list.length; i += 1) {
      if (matches(check, list[i], mission)) return i;
    }
    return check === 3 ? findTemplate(1, mission) : -1;
  }

  // sub_020022D0.
  function nextRandom(state, count) {
    state.value = (Math.imul(state.value, 0x5D588B65) + 1) >>> 0;
    return Math.floor(((state.value >>> 16) * count) / 0x10000) & 0xFFFF;
  }

  function seedState(mission, seed) {
    return { value: ((seed >>> 0) + mission.dungeon + mission.floor) >>> 0 };
  }

  // Catena delle frasi: restituisce gli indici scelti per titolo e descrizione.
  function pickLines(start, mission, seed) {
    const table = tables();
    const state = seedState(mission, seed);
    const title = [];
    const summary = [];
    let link = start;
    for (let step = 0; link !== END && step < MAX_STEPS; step += 1) {
      const group = table.groups[link & INDEX];
      if (!group || !group[0]) break;
      const index = group[1] + nextRandom(state, group[0]);
      (link & SUMMARY ? summary : title).push(index);
      link = table.next[index];
      if (link === undefined) break;
    }
    return { title, summary };
  }

  function analyse(mission) {
    const table = tables();
    if (!table || !mission) return null;
    const info = describe(mission.missionType, mission.missionSpecial);
    if (!info) return null;
    const template = findTemplate(info.check, mission);
    // Senza modello il gioco legge l'indirizzo 0 (inizio dell'ITCM): è un caso dedotto, non provato.
    const start = template >= 0 ? table.templates[template][T.text] : table.missingTemplateText;
    return { info, template, start };
  }

  // Segnaposto riempiti per ogni tipo di argomento (FormatMissionHeader e MakeMissionDetails).
  const ARGS = {
    1: [],
    2: ['item'],
    3: ['client'],
    4: ['target'],
    5: ['target', 'item'],
    6: ['item', 'floor'],
    7: ['dungeon'],
    8: ['dungeon', 'floor'],
    title5: ['dungeon']
  };

  function argValues(kind, isTitle, mission) {
    const list = isTitle && kind === 5 ? ARGS.title5 : ARGS[kind] || [];
    const values = {};
    list.forEach((name) => {
      if (name === 'client' || name === 'target') values.name = name === 'client' ? mission.client : mission.target;
      if (name === 'item') values.item = mission.targetItem;
      if (name === 'dungeon') values.dungeon = mission.dungeon;
      if (name === 'floor') values.floor = mission.floor;
    });
    return values;
  }

  const TAG = /\[([^\]]*)\]/g;

  // Divide una frase in pezzi: testo semplice, colori e segnaposto.
  function parseLine(text, values, color) {
    const parts = [];
    let current = color || '';
    let last = 0;
    const push = (part) => parts.push(part);
    text.replace(TAG, (match, tag, offset) => {
      if (offset > last) push({ text: text.slice(last, offset), color: current });
      last = offset + match.length;
      const colon = tag.indexOf(':');
      const name = colon >= 0 ? tag.slice(0, colon) : tag;
      const arg = colon >= 0 ? tag.slice(colon + 1) : '';
      if (name === 'CS') current = arg;
      else if (name === 'CR') current = color || '';
      else if (name === 'name') push({ kind: 'pokemon', id: values.name, color: 'N' });
      else if (name === 'item') push({ kind: 'item', id: values.item, color: 'I' });
      else if (name === 'dungeon') push({ kind: 'dungeon', id: values.dungeon, color: 'P' });
      else if (name === 'floor') push({ kind: 'floor', value: values.floor, dungeon: values.dungeon, color: 'V' });
      else if (name === 'team') push({ kind: 'team', color: current });
      return match;
    });
    if (last < text.length) push({ text: text.slice(last), color: current });
    return parts;
  }

  function buildParts(indexes, kind, isTitle, mission, lang) {
    const source = texts(lang);
    if (!source) return [];
    const values = argValues(kind, isTitle, mission);
    // [floor:0] ha anche il dungeon, per sapere se si sale o si scende.
    if (values.floor !== undefined) values.dungeon = mission.dungeon;
    const parts = [];
    indexes.forEach((index) => {
      const line = source.missionTexts[index];
      if (typeof line === 'string') parts.push(...parseLine(line, values));
    });
    return parts;
  }

  /**
   * Titolo e descrizione di una missione (struttura di WMSParser) nella lingua indicata.
   * Restituisce null se il gioco non mostra un testo per quel tipo di missione.
   * { title: [pezzi], summary: [pezzi], template: indice o -1, guessed: true se manca il modello }
   */
  function describeMission(mission, lang, seed) {
    const found = analyse(mission);
    if (!found) return null;
    const useSeed = seed === undefined ? mission.flavorText : seed;
    const lines = pickLines(found.start, mission, useSeed);
    return {
      template: found.template,
      guessed: found.template < 0,
      lines,
      title: buildParts(lines.title, found.info.title, true, mission, lang),
      summary: buildParts(lines.summary, found.info.summary, false, mission, lang)
    };
  }

  // Chiave che identifica un testo (a parità di missione conta solo quali frasi escono).
  function linesKey(lines) {
    return `${lines.title.join(',')}|${lines.summary.join(',')}`;
  }

  /**
   * Cerca semi che danno testi diversi, partendo da `from` e provando al massimo `limit` semi.
   * Restituisce [{ seed, key }] con un seme per ogni testo diverso (al massimo `wanted`), più
   * `next` (da dove continuare) e `total` (quante combinazioni esistono, se si possono contare).
   */
  function findVariants(mission, options) {
    const found = analyse(mission);
    if (!found) return { variants: [], next: 0, total: 0 };
    const opts = options || {};
    const wanted = opts.wanted || 8;
    const limit = opts.limit || 4000;
    const skip = new Set(opts.skip || []);
    const variants = [];
    let seed = (opts.from || 0) >>> 0;
    for (let tries = 0; tries < limit && variants.length < wanted; tries += 1, seed = (seed + 1) & 0xFFFFFF) {
      const key = linesKey(pickLines(found.start, mission, seed));
      if (skip.has(key)) continue;
      skip.add(key);
      variants.push({ seed, key });
    }
    return { variants, next: seed, total: countVariants(found.start) };
  }

  // Numero di testi possibili (prodotto dei gruppi lungo la catena, sommato sui rami).
  function countVariants(start, depth) {
    const table = tables();
    if (start === END || (depth || 0) > MAX_STEPS) return 1;
    const group = table.groups[start & INDEX];
    if (!group || !group[0]) return 1;
    let total = 0;
    for (let k = 0; k < group[0]; k += 1) total += countVariants(table.next[group[1] + k], (depth || 0) + 1);
    return total;
  }

  // Quanti testi diversi può avere questa missione (1 = il seme non cambia niente).
  function variantCount(mission) {
    const found = analyse(mission);
    return found ? countVariants(found.start) : 0;
  }

  function textKey(mission, seed) {
    const found = analyse(mission);
    return found ? linesKey(pickLines(found.start, mission, seed === undefined ? mission.flavorText : seed)) : '';
  }

  // Formato del piano nei testi: "P. 5" / "P. -5" in italiano, "5F" / "B5F" in inglese.
  function formatFloor(floor, dungeon, lang) {
    const source = texts(lang);
    const formats = (source && source.floorFormat) || ['{floor}', '-{floor}'];
    const up = (gameData().dungeonAscends || [])[dungeon];
    return formats[up ? 0 : 1].replace('{floor}', String(floor));
  }

  root.WMSkyJobText = { describeMission, findVariants, variantCount, textKey, formatFloor, argumentKinds: describe };
})(typeof window !== 'undefined' ? window : globalThis);
