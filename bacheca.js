/*
  Missioni della bacheca, generate con le regole del gioco.

  Porting di GenerateDailyMissions, GetRandomMissionTemplate, GenerateMission e GenerateMissionRewards
  (pret/pmd-sky, asm/main_0205E48C.s, main_0205D1F4.s, main_0205EDA4.s, main_02062A68.s), con le tabelle
  di RESCUE/rescue.bin e del codice estratte da tools/estrai_dati.py (data/dati_gioco.js: board e
  missionText.templates).

  Il gioco decide in base al salvataggio. Qui si simula una partita con la storia finita, tutti i Pokémon
  incontrati e nessuna missione già accettata. Il grado della squadra si sceglie, perché decide quali
  categorie di missioni possono uscire e se ci sono restrizioni. Anche lo stato dei dungeon si può scegliere
  (`options.dungeonModes`: 0 chiuso, 1 aperto ma non completato, 3 completato; di base tutti completati).
  Le missioni normali vanno solo nei dungeon completati (CanDungeonBeUsedForMission), mentre quelle per
  esplorare un dungeon nuovo, le Scaglie di Gabite e gli strumenti musicali compaiono solo finché il loro
  dungeon non è aperto o completato: con tutti i dungeon completati non escono, come a fine gioco.

  Il caso è quello del browser (Math.random), non il generatore del gioco: le probabilità sono le stesse,
  ma non si può riprodurre la bacheca di una partita vera.
*/
(function (root) {
  'use strict';

  // Colonne di missionText.templates.
  const T = {
    text: 0, type: 1, subtype: 2, itemCase: 3, item: 4, dungeonCase: 5, dungeon: 6,
    clientCase: 7, client: 8, targetCase: 9, target: 10, backupCase: 11, backup: 12,
    itemCount: 13, clientCount: 14, targetCount: 15, backupCount: 16
  };
  // Colonne di board.categories (struct mission_weighted_category).
  const C = { minRank: 4, minScenario: 5, secret: 6, count: 7, first: 8 };

  // Bacheche nell'ordine in cui il gioco le riempie; `weights` è la colonna dei pesi delle categorie.
  const BOARDS = [
    { id: 'bottle', weights: 3, min: 1, max: 1 },
    { id: 'cafe', weights: 2, min: 1, max: 1 },
    { id: 'job', weights: 0, min: 5, max: 8 },
    { id: 'outlaw', weights: 1, min: 5, max: 8 }
  ];
  const MAX_FAILURES = 30;          // tentativi falliti di fila prima di lasciare la bacheca com'è
  const OK = 0;
  const RETRY = 1;
  const STOP = 2;

  const DUNGEON_STAR_CAVE = 0xAE;   // un piano in meno nelle missioni
  const NO_RESTRICTION_DUNGEONS = [0x26, 0x29];
  const REVIVER_SEED = 0x49;        // una missione "prendi lo strumento" non può chiedere un Revitalseme
  const GABITE_REWARD = 0x31E;      // Ala di Togetic, ricompensa fissa della missione delle Scaglie di Gabite
  const DUST_ITEMS = 0x1FB;         // Polvere Normale: poi una polvere ogni 4 strumenti, una per tipo
  const DELIVER_FALLBACK = 0x46;    // Baccarancia
  const CHALLENGE_BANNED_EXCEPTION = [0x1EA, 0x442];
  const FIRST_BOX_ITEM = 364;
  const UNSTORABLE_ITEMS = [0, 183, 187, 178];
  const THROWN_ITEMS_ALLOWED = [9, 10];
  // MISSION_DUNGEON_UNLOCK_TABLE: dungeon che una missione può aprire (Grotta Labirinto, con le Scaglie di
  // Gabite; Collina Folgore e Foresta Mezzanotte, con "esplora un dungeon nuovo").
  const LABYRINTH_CAVE = 0x5B;
  const NEW_DUNGEON_UNLOCKS = [0x60, 0x62];
  // enum dungeon_mode di pret: chiuso, aperto, completato ma non accessibile, aperto e completato.
  const DMODE_CLOSED = 0;
  const DMODE_OPEN_AND_REQUEST = 3;

  function data() {
    return root.WMSkyGameData || {};
  }

  // ---------------------------------------------------------------------
  // Caso
  // ---------------------------------------------------------------------

  function makeRandom(source) {
    const next = source || Math.random;
    const int = (n) => (n > 0 ? Math.floor(next() * n) : 0);
    return {
      int,                                            // RandInt, RandIntSafe: da 0 a n - 1
      range: (a, b) => (a === b ? a : a + int(b - a)), // RandRangeSafe: da a a b - 1
      pick: (list) => list[int(list.length)]
    };
  }

  // RandomizeMissionCategory: indice scelto con i pesi, -1 se la somma è zero.
  function pickWeighted(weights, random) {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (total <= 0) return -1;
    const roll = random.int(total);
    let running = 0;
    for (let i = 0; i < weights.length; i += 1) {
      running += weights[i];
      if (roll < running) return i;
    }
    return -1;
  }

  // ---------------------------------------------------------------------
  // Tabelle del gioco
  // ---------------------------------------------------------------------

  let cache = null;
  function tables() {
    const game = data();
    if (cache && cache.source === game.board) return cache;
    const board = game.board;
    if (!board || !game.missionText) return null;
    const usable = new Set(board.usableMonsters);
    cache = {
      source: board,
      board,
      templates: game.missionText.templates,
      usable,
      possible: board.usableMonsters.filter((id) => id <= board.lastPossibleMonster),
      available: new Set(board.availableItems),
      targets: new Set(game.missionTargets || []),
      clients: new Set(game.missionClients || []),
      large: new Set(game.largeBody || []),
      female: new Set(game.femaleForm || []),
      valid: new Set(game.validItems || []),
      deliver: board.deliverItems.filter((item) => board.availableItems.includes(item))
    };
    return cache;
  }

  function nbFloors(dungeon) {
    const floors = (data().missionFloors || [])[dungeon] || 0;
    return floors + (dungeon === DUNGEON_STAR_CAVE ? 1 : 0);
  }

  // sub_02063424: piano più alto per una missione.
  function maxMissionFloor(type, subtype, dungeon) {
    if (type === 11 && subtype === 5) return nbFloors(dungeon);
    return (data().missionFloors || [])[dungeon] || 0;
  }

  function isForbidden(dungeon, floor) {
    return ((data().forbiddenFloors || {})[dungeon] || []).includes(floor);
  }

  // GetMissionRank: difficoltà del piano (1 per i dungeon senza tabella).
  function baseRank(dungeon, floor) {
    const ranks = (data().missionRanks || {})[dungeon];
    const rank = ranks ? ranks[floor - 1] : undefined;
    return Number.isFinite(rank) ? rank : 1;
  }

  // GetMissionRankWithCapAndModifiers.
  function missionRank(mission) {
    let rank = baseRank(mission.dungeon, mission.floor);
    if ([2, 3, 4, 5, 9, 10].includes(mission.missionType)) rank += 1;
    return Math.min(rank, 15);
  }

  // ---------------------------------------------------------------------
  // Controlli sui Pokémon e sugli strumenti
  // ---------------------------------------------------------------------

  function baseId(id) {
    return id >= 600 ? id - 600 : id;
  }

  // CanMonsterBeUsedForMission (a fine gioco: tutti incontrati, nessun divieto legato alla storia).
  function canUseMonster(id, checkBanned) {
    const tab = tables();
    const male = baseId(id);
    if (id >= 600 && !tab.female.has(male)) return false;
    // Senza il controllo dei Pokémon vietati resta la forma base (qui presa dai bersagli ammessi, che
    // escludono anche i pochi ID illegali: il gioco li scarterebbe comunque poco dopo).
    if (!checkBanned) return tab.targets.has(male);
    return tab.usable.has(male);
  }

  // CheckMonsterForMissionType: `strict` vale per il committente.
  function checkMonster(type, id, strict) {
    const tab = tables();
    if (strict && !id) return false;
    if (id >= 0x483) return false;
    const male = baseId(id);
    if (id >= 600 && !tab.female.has(male)) return false;
    if (!tab.targets.has(male)) return false;          // forma base e non illegale
    if (strict && type >= 2 && type <= 5 && tab.large.has(male)) return false;
    if (strict && ![10, 11, 14].includes(type) && !tab.clients.has(male)) return false;
    return true;
  }

  // GetSecondFormIfValid: sui piani pari il gioco usa la forma femminile, se la specie ne ha una.
  function applyGender(id, floor) {
    if (floor & 1) return id;
    return tables().female.has(id) ? id + 600 : id;
  }

  function isThrown(item) {
    const categories = data().itemCategory || [];
    return categories[item] <= 1;
  }

  // CheckItemForMissionType.
  function checkItem(type, item) {
    const tab = tables();
    if (!item || item >= FIRST_BOX_ITEM || !tab.valid.has(item)) return false;
    if (type === 4 && isThrown(item) && !THROWN_ITEMS_ALLOWED.includes(item)) return false;
    return !UNSTORABLE_ITEMS.includes(item);
  }

  // ---------------------------------------------------------------------
  // Missioni già in bacheca
  // ---------------------------------------------------------------------

  // sub_0205E258: missioni in cui il committente viene con la squadra.
  function joinsTeam(mission) {
    const type = mission.missionType;
    return type === 2 || type === 3 || type === 4 || type === 5 || (type === 10 && mission.missionSpecial === 4);
  }

  // sub_0205E090: c'è già una missione in quel dungeon (e piano)?
  function placeTaken(day, dungeon, floor, joining) {
    return day.all.some((other) => {
      if (floor < 0 || (joinsTeam(other) && joining)) return other.dungeon === dungeon;
      return other.dungeon === dungeon && other.floor === floor;
    });
  }

  // AlreadyHasSimilarMission.
  function hasSimilar(day, type, subtype) {
    return day.all.some((other) => other.missionType === type && other.missionSpecial === subtype);
  }

  // sub_02062C4C: un dungeon a caso dall'elenco, poi un piano a caso nella metà alta, saltando i piani
  // vietati e quelli già occupati; se non ce ne sono si passa al dungeon successivo.
  function pickPlace(day, dungeons, joining, random) {
    if (!dungeons.length) return null;
    const firstDungeon = random.int(dungeons.length);
    let index = firstDungeon;
    do {
      const dungeon = dungeons[index];
      const top = dungeon === DUNGEON_STAR_CAVE ? nbFloors(dungeon) : nbFloors(dungeon) + 1;
      const half = Math.floor(top / 2);
      const firstFloor = random.range(half, top);
      let floor = firstFloor;
      do {
        if (floor > 0 && !isForbidden(dungeon, floor) && !placeTaken(day, dungeon, floor, joining)) {
          return { dungeon, floor };
        }
        floor += 1;
        if (floor >= top) floor = half;
      } while (floor !== firstFloor);
      index = (index + 1) % dungeons.length;
    } while (index !== firstDungeon);
    return null;
  }

  // Stato del dungeon nella partita simulata (GetDungeonMode): di base aperto e completato.
  function dungeonMode(day, dungeon) {
    const mode = day.modes[dungeon];
    return Number.isFinite(mode) ? mode : DMODE_OPEN_AND_REQUEST;
  }

  // CanDungeonBeUsedForMission: tra i dungeon ammessi, solo quelli aperti e completati.
  function canUseDungeon(day, dungeon) {
    return tables().board.dungeons.includes(dungeon) && dungeonMode(day, dungeon) === DMODE_OPEN_AND_REQUEST;
  }

  // sub_0206282C: dungeon che "esplora un dungeon nuovo" può proporre (chiusi e mai visitati; la Grotta
  // Labirinto è esclusa perché ha la sua missione, quella delle Scaglie di Gabite).
  function newDungeonChoices(day) {
    return NEW_DUNGEON_UNLOCKS.filter((dungeon) => dungeonMode(day, dungeon) === DMODE_CLOSED
      && !day.all.some((other) => other.missionType === 3 && other.missionSpecial === 3 && other.dungeon === dungeon));
  }

  // ---------------------------------------------------------------------
  // GetRandomMissionTemplate
  // ---------------------------------------------------------------------

  function categoryWeights(board, rank) {
    return tables().board.categories.map((category) => (rank >= category[C.minRank] ? category[board.weights] : 0));
  }

  function randomTemplate(day, weights, random) {
    const tab = tables();
    const index = pickWeighted(weights, random);
    if (index < 0) return null;
    const category = tab.board.categories[index];
    const templateIndex = category[C.first] + random.int(category[C.count]);
    const template = tab.templates[templateIndex];
    const type = template[T.type];
    const subtype = template[T.subtype];
    // Scaglie di Gabite: solo finché la Grotta Labirinto è chiusa (CheckDungeonMissionUnlockConditions).
    if (type === 6 && subtype === 4 && dungeonMode(day, LABYRINTH_CAVE) !== DMODE_CLOSED) return null;
    // Sfide dei leggendari: una alla volta (il leggendario non deve essere già in squadra).
    if (type === 11 && subtype >= 1 && subtype <= 5 && hasSimilar(day, type, subtype)) return null;
    // Strumenti musicali: solo se il dungeon non è completato, una alla volta e senza altre missioni lì.
    if (type === 14 && subtype === 1) {
      const dungeon = template[T.dungeon];
      if (dungeonMode(day, dungeon) === DMODE_OPEN_AND_REQUEST) return null;
      if (hasSimilar(day, type, subtype) || placeTaken(day, dungeon, -1, false)) return null;
    }
    return { index: templateIndex, template };
  }

  // ---------------------------------------------------------------------
  // GenerateMission
  // ---------------------------------------------------------------------

  function tablePick(start, count, filter, random) {
    const table = tables().board.monsterTable.slice(start, start + count);
    const list = filter ? table.filter(filter) : table;
    return list.length ? random.pick(list) : 0;
  }

  function generateMission(day, template, random) {
    const tab = tables();
    const mission = {
      nullBits: 0, mailType: 4,
      missionType: template[T.type], missionSpecial: template[T.subtype],
      client: 0, target: 0, target2: 0, targetItem: 0,
      dungeon: 0, floor: 0, specialFloor: 0, flavorText: 0,
      rewardType: 0, reward: 0, restrictionType: 0, restriction: 0
    };
    const type = mission.missionType;
    const subtype = mission.missionSpecial;
    const joining = joinsTeam(mission);

    // Luogo
    const dungeonCase = template[T.dungeonCase];
    let place = null;
    if (dungeonCase === 0 || dungeonCase === 1) {
      const dungeon = template[T.dungeon];
      if (dungeonCase === 0 && !canUseDungeon(day, dungeon)) return RETRY;
      place = pickPlace(day, [dungeon], joining, random);
      if (!place) return joining ? RETRY : STOP;
      if (type !== 14 && place.floor > maxMissionFloor(type, subtype, dungeon)) return RETRY;
    } else if (dungeonCase === 5) {
      // Esplora un dungeon nuovo: uno dei dungeon ancora chiusi, all'ultimo piano che il gioco accetta.
      if (type !== 3 || subtype !== 3) return RETRY;
      const choices = newDungeonChoices(day);
      if (!choices.length) return RETRY;
      place = pickPlace(day, choices, joining, random);
      if (!place) return RETRY;
      let floor = maxMissionFloor(type, subtype, place.dungeon);
      while (floor > 0 && isForbidden(place.dungeon, floor)) floor -= 1;
      if (!floor) return RETRY;
      place.floor = floor;
    } else {
      place = pickPlace(day, day.usable, joining, random);
      if (!place) return joining ? RETRY : STOP;
      const members = tab.board.maxMembers[place.dungeon];
      const rank = baseRank(place.dungeon, place.floor);
      if (type >= 2 && type <= 5 && members < 4) return RETRY;
      if (type === 7 && ((data().dungeonMaxItems || [])[place.dungeon] === 0 || rank > 7)) return RETRY;
      if (type === 6 && rank > 7) return RETRY;
      if (type === 10 && subtype === 4 && members < 4) return RETRY;
    }
    mission.dungeon = place.dungeon;
    mission.floor = place.floor;
    mission.flavorText = random.int(0x1000000); // MtNext & 0xFFFFFF

    // Committente
    const clientCase = template[T.clientCase];
    let skipTargets = false;
    if (clientCase === 0 || clientCase === 1) {
      const client = template[T.client];
      if (!checkMonster(type, client, true)) return RETRY;
      if (type === 11 && subtype === 0) {
        if (!canUseMonster(client, !CHALLENGE_BANNED_EXCEPTION.includes(client))) return RETRY;
        mission.client = client;
        mission.target = template[T.target];
        mission.target2 = template[T.backup];
        skipTargets = true;
      } else {
        if (clientCase === 0 && !canUseMonster(client, true)) return RETRY;
        mission.client = client;
      }
    } else if (clientCase === 2 || clientCase === 3) {
      const start = template[T.client];
      const count = template[T.clientCount];
      const client = tablePick(start, count, clientCase === 2 ? (id) => canUseMonster(id, true) : null, random);
      if (!checkMonster(type, client, true)) return RETRY;
      mission.client = applyGender(client, mission.floor);
    } else if (clientCase === 4) {
      const client = random.pick(tab.possible);
      if (!checkMonster(type, client, true)) return RETRY;
      mission.client = applyGender(client, mission.floor);
    }

    // Bersagli (sub_0205E1E8: in molte missioni il bersaglio è il committente)
    const ownTarget = [1, 2, 8, 9, 10, 14].includes(type) || (type === 11 && subtype === 0);
    if (!skipTargets && !ownTarget) {
      mission.target = mission.client;
      mission.target2 = 0;
    } else if (!skipTargets) {
      const slots = (type === 10 && subtype === 6) || (type === 11 && subtype === 0) ? 2 : 1;
      if (slots === 1) mission.target2 = 0;
      const columns = [[T.targetCase, T.target, T.targetCount], [T.backupCase, T.backup, T.backupCount]];
      for (let slot = 0; slot < slots; slot += 1) {
        const [caseColumn, valueColumn, countColumn] = columns[slot];
        const targetCase = template[caseColumn];
        let value = 0;
        if (targetCase === 0 || targetCase === 1) {
          value = template[valueColumn];
          if (!checkMonster(type, value, false)) return RETRY;
          if (type === 10 && subtype === 6) {
            if (!canUseMonster(value, true)) return RETRY;
            mission.target = value;
            mission.target2 = template[T.backup];
            break;
          }
          if (targetCase === 0 && !canUseMonster(value, true)) return RETRY;
        } else if (targetCase === 2 || targetCase === 3) {
          value = tablePick(template[valueColumn], template[countColumn],
            targetCase === 2 ? (id) => canUseMonster(id, true) : null, random);
          if (!checkMonster(type, value, false)) return RETRY;
          value = applyGender(value, mission.floor);
        } else if (targetCase === 4 || targetCase === 6) {
          value = random.pick(tab.possible);
          if (!checkMonster(type, value, false)) return RETRY;
          value = applyGender(value, mission.floor);
        } else {
          continue;
        }
        if (slot === 0) mission.target = value;
        else mission.target2 = value;
      }
    }

    // Strumento obiettivo
    const itemCase = template[T.itemCase];
    if (itemCase === 0 || itemCase === 1) {
      const item = template[T.item];
      if (!checkItem(type, item)) return RETRY;
      if (itemCase === 0 && !tab.available.has(item)) return RETRY;
      mission.targetItem = item;
    } else if (itemCase === 2 || itemCase === 3) {
      const start = template[T.item];
      let list = tab.board.itemTable.slice(start, start + template[T.itemCount]);
      if (itemCase === 2) list = list.filter((item) => tab.available.has(item));
      if (!list.length) return RETRY;
      const item = random.pick(list);
      if (!checkItem(type, item)) return RETRY;
      mission.targetItem = item;
    } else if (itemCase === 4) {
      mission.targetItem = tab.deliver.length ? random.pick(tab.deliver) : DELIVER_FALLBACK;
    }

    // Restrizioni (sub_02062900)
    if (!NO_RESTRICTION_DUNGEONS.includes(mission.dungeon) && tab.board.maxMembers[mission.dungeon] >= 4) {
      Object.assign(mission, pickRestriction(day.rank, random));
    }

    // Casi particolari e stanze speciali
    const rooms = (root.WMSkyFixedRooms || {}).missionRooms || {};
    switch (type) {
      case 3:
        if (subtype === 1) mission.specialFloor = rooms.sealedChamber || 165;
        if (subtype === 2) mission.specialFloor = rooms.goldenChamber || 111;
        break;
      case 9:
        if (mission.targetItem === REVIVER_SEED || mission.client === mission.target) return RETRY;
        break;
      case 10:
        if (subtype === 6) mission.specialFloor = random.pick(rooms.outlawHideout || [160]);
        break;
      case 11: {
        if (subtype === 5) {
          const floor = maxMissionFloor(type, subtype, mission.dungeon);
          if (placeTaken(day, mission.dungeon, floor, true)) return RETRY;
          mission.floor = floor;
        }
        mission.specialFloor = subtype === 0
          ? random.pick(rooms.challenge || [150])
          : (rooms.legendaryChallenge || [145, 146, 147, 148, 149])[subtype - 1];
        break;
      }
      case 12:
        mission.specialFloor = random.pick(rooms.treasureMemo || [115]);
        mission.restrictionType = 0;
        mission.restriction = 0;
        break;
      case 14:
        if (subtype === 2) return RETRY;
        mission.restrictionType = 0;
        mission.restriction = 0;
        break;
      default:
        break;
    }
    return mission;
  }

  // sub_02062944: nessuna, un tipo (dal grado Oro) o una specie (dal grado Diamante).
  function pickRestriction(rank, random) {
    const tab = tables();
    const weights = tab.board.restrictionWeights.slice();
    const type = random.int(18);
    const species = random.pick(tab.possible) || 0;
    if (!(rank >= 3) || type === 0) weights[1] = 0;
    if (!(rank >= 4) || species === 0) weights[2] = 0;
    const choice = pickWeighted(weights, random);
    if (choice === 1) return { restrictionType: 0, restriction: type };
    if (choice === 2) return { restrictionType: 1, restriction: species };
    return { restrictionType: 0, restriction: 0 };
  }

  // ---------------------------------------------------------------------
  // GenerateMissionRewards
  // ---------------------------------------------------------------------

  // RollRandomItemReward: elenco dei premi della difficoltà della missione.
  function rollRewardItem(mission, random) {
    const lists = tables().board.rewardLists;
    const rank = missionRank(mission);
    const list = lists[Math.max(rank - 1, 0)] || lists[0];
    const index = pickWeighted(list.map((entry) => entry[1]), random);
    return index >= 0 ? list[index][0] : tables().board.fallbackItem;
  }

  function generateRewards(mission, random) {
    const tab = tables();
    const type = mission.missionType;
    const subtype = mission.missionSpecial;
    let weights = tab.board.rewardWeights;
    let rewardee = mission.client;
    if (type === 10) {
      weights = tab.board.outlawRewardWeights;
      rewardee = mission.target;
    } else if (type === 11 && subtype >= 1 && subtype <= 5) {
      mission.rewardType = 6;
      mission.reward = mission.client;
      return;
    } else if ((type === 6 || type === 11) && subtype === 4) {
      mission.rewardType = 4;
      mission.reward = GABITE_REWARD;
      return;
    }
    const chances = weights.slice();
    // L'oggetto misterioso ("???") solo nelle missioni più difficili.
    if (missionRank(mission) < 11) chances[4] = 0;
    const rewardType = pickWeighted(chances, random);
    mission.rewardType = rewardType;
    if (rewardType === 6) {
      mission.reward = rewardee;
    } else if (rewardType === 4) {
      mission.reward = exclusiveReward(rewardee, random);
    } else {
      let item;
      do {
        item = rollRewardItem(mission, random);
      } while (item === mission.targetItem);
      mission.reward = item;
    }
  }

  // sub_020630F0: uno strumento esclusivo del Pokémon, o la polvere del suo tipo.
  function exclusiveReward(monster, random) {
    const board = tables().board;
    const pair = board.exclusive[String(monster % 600)] || [0, 0];
    const own = pair.filter(Boolean);
    if (own.length === 2) return random.int(2) === 0 ? pair[1] : pair[0];
    if (own.length === 1) return own[0];
    const [first, second] = board.types[monster % 600] || [1, 0];
    const type = second && random.int(2) === 0 ? second : first;
    return DUST_ITEMS + (type - 1) * 4;
  }

  // ---------------------------------------------------------------------
  // GenerateDailyMissions
  // ---------------------------------------------------------------------

  // sub_0205E9A8: bacheca delle missioni in ordine di dungeon e piano (per alcune missioni solo dungeon).
  function jobBefore(a, b) {
    if ([5, 8].includes(a.missionType)) return a.dungeon < b.dungeon;
    if ([5, 8].includes(b.missionType)) return a.dungeon <= b.dungeon;
    return a.dungeon < b.dungeon || (a.dungeon === b.dungeon && a.floor < b.floor);
  }

  function outlawBefore(a, b) {
    return a.dungeon < b.dungeon || (a.dungeon === b.dungeon && a.floor < b.floor);
  }

  /**
   * Una giornata di missioni come la prepara il gioco: bacheca delle missioni, bacheca dei ricercati,
   * Caffè di Spinda e messaggio in bottiglia. `options.rank` è il grado della squadra (0-12),
   * `options.dungeonModes` lo stato dei dungeon ({ id: 0 | 1 | 3 }, quelli mancanti sono completati).
   * Restituisce { job: [...], outlaw: [...], cafe: [...], bottle: [...] } con strutture di WMSParser,
   * più `template` (indice del modello di rescue.bin) in ogni missione.
   */
  function generateDay(options) {
    const opts = options || {};
    if (!tables()) return null;
    const random = makeRandom(opts.random);
    const rank = Number.isFinite(opts.rank) ? opts.rank : 12;
    const counts = { job: random.range(4, 8) + 1, outlaw: random.range(4, 8) + 1, cafe: 1, bottle: 1 };
    const day = { rank, modes: opts.dungeonModes || {}, all: [], job: [], outlaw: [], cafe: [], bottle: [] };
    day.usable = tables().board.dungeons.filter((dungeon) => canUseDungeon(day, dungeon));
    BOARDS.forEach((board) => {
      const weights = categoryWeights(board, rank);
      if (!weights.some(Boolean)) return;
      let failures = MAX_FAILURES;
      while (day[board.id].length < counts[board.id]) {
        const picked = randomTemplate(day, weights, random);
        const result = picked ? generateMission(day, picked.template, random) : RETRY;
        if (result === STOP) break;
        if (result === RETRY) {
          failures -= 1;
          if (failures <= 0) break;
          continue;
        }
        generateRewards(result, random);
        result.template = picked.index;
        day[board.id].push(result);
        day.all.push(result);
        failures = MAX_FAILURES;
      }
    });
    day.job.sort((a, b) => (jobBefore(a, b) ? -1 : jobBefore(b, a) ? 1 : 0));
    day.outlaw.sort((a, b) => (outlawBefore(a, b) ? -1 : outlawBefore(b, a) ? 1 : 0));
    return { job: day.job, outlaw: day.outlaw, cafe: day.cafe, bottle: day.bottle, rank };
  }

  root.WMSkyBoard = {
    generateDay,
    missionRank,
    // Dungeon di cui si può scegliere lo stato: quelli delle missioni della bacheca.
    dungeons: () => (tables() ? tables().board.dungeons.slice() : []),
    // Per i test.
    _internal: { categoryWeights, checkMonster, canUseMonster, pickPlace, BOARDS }
  };
})(typeof window !== 'undefined' ? window : globalThis);
