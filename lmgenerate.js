/*
  Generatore di Missioni Speciali C (Wonder Mail S): dati delle missioni e lettura del modulo.

  Basato sul generatore storico di pubblico dominio ("This file is placed in the public domain and
  may be freely used, reproduced, modified, sold or whatever you want. However, it may or may not
  work; use at your own risk.").

  I nomi mostrati nell'interfaccia arrivano dai file di lingua (lang/*.js): i campi "name" qui sotto
  sono solo identificativi interni.
*/

// Formato dei tipi di missione:
//   mainType: campo missionType della password
//   specialType: campo missionSpecial (sottotipo)
//   clientIsTarget: il bersaglio coincide con il committente
//   useTargetItem: usa lo strumento obiettivo
//   useTarget2: usa il secondo bersaglio
//   forceClient / forceTarget: Pokémon imposto dalla missione
//   specialFloor: stanza speciale fissa (per Sala Proibita e Sala d'Oro il gioco usa comunque
//                 la sua stanza, qualunque numero contenga la password)
//   specialFloorFromList: stanza speciale scelta a caso da staticLists
//   noReward: nessuna scelta della ricompensa
// Ogni tipo può avere "subTypes", che sovrascrivono i valori del tipo principale.
var WMSGenData = {
  missionTypes: [
    { name: 'rescueClient', mainType: 0, specialType: 0, clientIsTarget: true },
    // Sottotipi di soccorso e accompagnamento (enum mission_subtype_rescue_target ed escort_to_target di pret):
    // cambiano solo i dialoghi. Il gioco non controlla le coppie, ma il titolo esce solo per quelle dei
    // modelli di rescue.bin (`gamePairs`: l'app le propone in un menu).
    { name: 'rescueTarget', mainType: 1, subTypes: [
      { name: 'Normal', specialType: 0 },
      { name: 'Child', specialType: 1, gamePairs: true },
      { name: 'Friend', specialType: 2, gamePairs: true },
      { name: 'Lover or rival', specialType: 3, gamePairs: true }
    ] },
    { name: 'escortToTarget', mainType: 2, subTypes: [
      { name: 'Normal', specialType: 0 },
      { name: 'Loved one', specialType: 1, gamePairs: true }
    ] },

    // Nella Sala Proibita lo strumento obiettivo è quello che si trova nella stanza.
    { name: 'exploreWithClient', mainType: 3, clientIsTarget: true, subTypes: [
      { name: 'Normal', specialType: 0 },
      { name: 'Sealed Chamber', specialType: 1, specialFloor: 165, useTargetItem: true },
      { name: 'Golden Chamber', specialType: 2, specialFloor: 111 },
      { name: 'New Dungeon', specialType: 3, advancedOnly: true }
    ] },

    { name: 'prospectWithClient', mainType: 4, specialType: 0, useTargetItem: true, clientIsTarget: true },
    { name: 'guideClient', mainType: 5, specialType: 0, clientIsTarget: true },
    // Trova lo strumento (enum mission_subtype_find_item): elenco comune, elenco raro, strumento che fa
    // evolvere il committente, Gomma del suo tipo, Scaglie di Gabite per Togetic (apre la Grotta Labirinto).
    { name: 'findItem', mainType: 6, useTargetItem: true, clientIsTarget: true, subTypes: [
      { name: 'Normal', specialType: 0 },
      { name: 'Rare treasure', specialType: 1 },
      { name: 'Evolution item', specialType: 2, gamePairs: true },
      { name: 'Favorite Gummi', specialType: 3, gamePairs: true },
      { name: 'Gabite Scale', specialType: 4, gamePairs: true, forceClient: 176 }
    ] },
    { name: 'deliverItem', mainType: 7, specialType: 0, useTargetItem: true, clientIsTarget: true },
    { name: 'searchForClient', mainType: 8, specialType: 0 },

    { name: 'takeItemFromTarget', mainType: 9, useTargetItem: true, subTypes: [
      { name: 'Normal', specialType: 0 },
      { name: 'Hidden target', specialType: 1 },
      { name: 'Fleeing target', specialType: 2 }
    ] },

    // Arresti (enum mission_subtype_outlaw): i sottotipi 0-3 sono missioni normali con elenchi di ricercati
    // diversi. Nei modelli di rescue.bin 0, 1 e 7 sono di Magnezone, 2, 3 e 5 di Magnemite, 4 e 6 di tutti e
    // due: con l'agente sbagliato il gioco accetta la password ma non ha un titolo per la missione, quindi
    // quelle combinazioni non si offrono (compaiono solo leggendo una password che le usa). Gli indici 0-3
    // sono quelli storici.
    { name: 'arrestMagnemite', mainType: 10, forceClient: 81, subTypes: [
      { name: 'Normal', specialType: 0, advancedOnly: true },
      { name: 'Escort', specialType: 4 },
      { name: 'Special floor', specialType: 6, useTarget2: true, specialFloorFromList: 'thievesden' },
      { name: 'Monster House', specialType: 7, advancedOnly: true },
      { name: 'Normal B', specialType: 1, advancedOnly: true },
      { name: 'Normal C', specialType: 2 },
      { name: 'Normal D', specialType: 3 },
      { name: 'Fleeing', specialType: 5 }
    ] },

    { name: 'arrestMagnezone', mainType: 10, forceClient: 504, subTypes: [
      { name: 'Normal', specialType: 0 },
      { name: 'Escort', specialType: 4 },
      { name: 'Special floor', specialType: 6, useTarget2: true, specialFloorFromList: 'thievesden' },
      { name: 'Monster House', specialType: 7 },
      { name: 'Normal B', specialType: 1 },
      { name: 'Normal C', specialType: 2, advancedOnly: true },
      { name: 'Normal D', specialType: 3, advancedOnly: true },
      { name: 'Fleeing', specialType: 5, advancedOnly: true }
    ] },

    { name: 'challengeLetter', mainType: 11, subTypes: [
      { name: 'Normal', specialType: 0, useTarget2: true, specialFloorFromList: 'challengerequest' },
      { name: 'Mewtwo', specialType: 1, forceClient: 150, forceTarget: 150, specialFloor: 145 },
      { name: 'Entei', specialType: 2, forceClient: 271, forceTarget: 271, specialFloor: 146 },
      { name: 'Raikou', specialType: 3, forceClient: 270, forceTarget: 270, specialFloor: 147 },
      { name: 'Suicune', specialType: 4, forceClient: 272, forceTarget: 272, specialFloor: 148 },
      { name: 'Jirachi', specialType: 5, forceClient: 417, forceTarget: 417, specialFloor: 149 }
    ] },

    // Memo tesoro: come nelle missioni vere, committente e bersaglio coincidono e lo strumento
    // obiettivo è il tesoro chiuso nel Tecalusso della stanza (PlaceFixedRoomTile, GetSpecialTargetItem).
    // Il generatore storico imponeva Turtwig, nessuna ricompensa e una Mela come tesoro.
    { name: 'treasureMemo', mainType: 12, specialType: 0, clientIsTarget: true, useTargetItem: true, specialFloorFromList: 'treasurehunt' }
  ],

  validDungeons: [
    0x01, 0x03, 0x04, 0x06, 0x07, 0x08, 0x0A, 0x0C, 0x0E, 0x11, 0x14, 0x15, 0x18,
    0x19, 0x22, 0x23, 0x2C, 0x2E, 0x2F, 0x32, 0x33, 0x3E, 0x40, 0x43, 0x46, 0x48,
    0x49, 0x4B, 0x4D, 0x4F, 0x51, 0x53, 0x55, 0x57, 0x58, 0x59, 0x5A, 0x5B, 0x5C,
    0x5D, 0x5E, 0x5F, 0x60, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x6B, 0x6C,
    0x6D, 0x6E
  ],

  // Ultimo ID dell'elenco completo dei Pokémon ("mostra tutti").
  lastRegularPokemon: 534,


  // Stanze tra cui il gioco sceglie a caso (tabelle TREASURE_MEMO_FIXED_ROOM_IDS,
  // CHALLENGE_NORMAL_FIXED_ROOM_IDS e OUTLAW_HIDEOUT_FIXED_ROOM_IDS del codice del gioco,
  // le stesse di data/stanze_fisse.js: un test controlla che coincidano).
  staticLists: {
    treasurehunt: [
      115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129,
      130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144
    ],
    challengerequest: [150, 151, 152, 153, 154],
    thievesden: [160, 161, 162, 163, 164]
  }
};

var WMSGen = {
  form: null,
  lastMissionType: 0,
  monsterListKey: null,
  // L'app lo imposta per ricostruire gli elenchi dei Pokémon mantenendo le scelte.
  onMonsterListsChange: null,
  advanced: false,
  showAllPokemon: false,

  // Agganci forniti dall'app: traduzioni e limite dei piani per dungeon.
  translate: function (key) {
    return key;
  },
  getFloorLimit: function () {
    return 99;
  },

  setup: function (form) {
    this.form = form;
    this.fillDungeonList();
    this.fillTypeList();
    this.fillSubTypeList();
    this.fillItemLists();
    this.fillMonsterLists();
    this.update();
  },

  fillDungeonList: function () {
    var box = this.form.dungeonBox;
    while (box.options.length) box.remove(0);
    for (var i = 0; i < WMSGenData.validDungeons.length; i++) {
      var id = WMSGenData.validDungeons[i];
      addOptionToSelect(box, id, getDungeonName(id));
    }
  },

  /**
   * ID reale del Pokémon: la forma femminile è ID + 600, ma solo per le specie che ce l'hanno
   * (dati di BALANCE/monster.md). Per le altre la casella "Femmina" non ha effetto.
   */
  getTrueMonID: function (id, femaleChecked) {
    var base = id % 600;
    if (femaleChecked && hasFemaleForm(base)) {
      return base + 600;
    }
    return base;
  },

  fillItemLists: function () {
    var boxes = [this.form.targetItemBox, this.form.rewardItemBox];
    var ids = getValidItemIds();
    boxes.forEach(function (box) {
      while (box.options.length) box.remove(0);
      for (var i = 0; i < ids.length; i++) {
        addOptionToSelect(box, ids[i], getItemName(ids[i]));
      }
    });
  },

  /**
   * Pokémon che il gioco accetta in una Missione Speciale C (porting di CheckMonsterForMissionType,
   * dati in data/dati_gioco.js): i bersagli devono essere una forma base valida; i committenti non
   * possono essere in MISSION_BANNED_MONSTERS (tranne negli arresti e nelle Lettere di sfida) e,
   * quando si uniscono alla squadra (accompagna, esplora, cerca, guida), devono avere taglia 1.
   */
  getMonsterIds: function (role, mainType) {
    var ids = [];
    if (this.advanced || this.showAllPokemon) {
      for (var id = 1; id <= WMSGenData.lastRegularPokemon; id++) ids.push(id);
      return ids;
    }
    var data = window.WMSkyGameData || {};
    var bannedAllowed = mainType === 10 || mainType === 11;
    if (role !== 'client' || bannedAllowed) {
      return (data.missionTargets || []).slice();
    }
    ids = (data.missionClients || []).slice();
    if (clientJoinsTeam(mainType)) {
      ids = ids.filter(function (monId) { return !hasLargeBody(monId); });
    }
    return ids;
  },

  // Gruppo di elenchi da mostrare: cambia solo quando cambiano i Pokémon ammessi.
  getMonsterListKey: function (mainType) {
    if (this.advanced || this.showAllPokemon) return 'all';
    if (mainType === 10 || mainType === 11) return 'targets';
    return clientJoinsTeam(mainType) ? 'smallClients' : 'clients';
  },

  getSelectedMainType: function () {
    var typeData = this.form && this.form.missionTypeBox ? this.getTypeData() : null;
    return typeData ? typeData.mainType : 0;
  },

  // Aggiorna gli elenchi dei Pokémon se il tipo di missione ne ammette altri.
  syncMonsterLists: function () {
    var key = this.getMonsterListKey(this.getSelectedMainType());
    if (key === this.monsterListKey) return;
    if (this.monsterListKey !== null && typeof this.onMonsterListsChange === 'function') {
      this.onMonsterListsChange();
    } else {
      this.fillMonsterLists();
    }
  },

  fillMonsterLists: function () {
    var mainType = this.getSelectedMainType();
    this.monsterListKey = this.getMonsterListKey(mainType);
    var lists = [
      [this.form.clientBox, this.getMonsterIds('client', mainType)],
      [this.form.targetBox, this.getMonsterIds('target', mainType)],
      [this.form.target2Box, this.getMonsterIds('target', mainType)]
    ];
    lists.forEach(function (entry) {
      var box = entry[0];
      var ids = entry[1];
      if (!box) return;
      while (box.options.length) box.remove(0);
      for (var i = 0; i < ids.length; i++) {
        addOptionToSelect(box, ids[i], getMonName(ids[i]));
      }
    });
  },

  fillTypeList: function () {
    var box = this.form.missionTypeBox;
    var types = WMSGenData.missionTypes;
    for (var i = 0; i < types.length; i++) {
      if (!types[i].advancedOnly || this.advanced) {
        addOptionToSelect(box, i, types[i].name);
      }
    }
  },

  fillSubTypeList: function () {
    var typeBox = this.form.missionTypeBox;
    var typeNum = 0;
    if (typeBox.options[typeBox.selectedIndex]) {
      typeNum = parseInt(typeBox.options[typeBox.selectedIndex].value, 10);
    }
    // Non azzerare il sottotipo se il browser ripete lo stesso evento.
    if (typeNum === this.lastMissionType) {
      return;
    }
    this.lastMissionType = typeNum;

    var typeData = WMSGenData.missionTypes[typeNum];
    var wrap = document.getElementById('subType');
    if (typeData && typeData.subTypes) {
      var box = this.form.missionSubTypeBox;
      while (box.options.length) box.remove(0);
      // In ordine di sottotipo del gioco: gli indici restano quelli dell'elenco.
      var order = typeData.subTypes.map(function (entry, index) { return index; });
      order.sort(function (a, b) {
        return typeData.subTypes[a].specialType - typeData.subTypes[b].specialType;
      });
      for (var j = 0; j < order.length; j++) {
        var i = order[j];
        if (!typeData.subTypes[i].advancedOnly || this.advanced) {
          addOptionToSelect(box, i, typeData.subTypes[i].name);
        }
      }
      if (wrap) wrap.style.display = 'inline';
    } else if (wrap) {
      wrap.style.display = 'none';
    }
  },

  // Controlli del gioco usati anche dall'app.
  getTargetItemError: function (itemId, mainType) {
    return getTargetItemError(parseInt(itemId, 10), parseInt(mainType, 10));
  },

  getForbiddenFloors: function (dungeonId) {
    return getForbiddenFloors(parseInt(dungeonId, 10));
  },

  getRewardPokemonIds: function (rewardType, mainType) {
    return getRewardPokemonIds(parseInt(rewardType, 10), parseInt(mainType, 10));
  },

  getComboBoxValue: function (box) {
    if (typeof box === 'string') {
      box = this.form[box];
    }
    if (box && box.options[box.selectedIndex]) {
      return box.options[box.selectedIndex].value;
    }
    return false;
  },

  getRegion: function () {
    var box = this.form.regionBox;
    var value = box ? String(box.value || '').toLowerCase() : 'eu';
    return WMSParser.regions.indexOf(value) !== -1 ? value : 'eu';
  },

  isEggGlitch: function () {
    return !!(this.form.eggGlitch && this.form.eggGlitch.checked);
  },

  /**
   * Controlla il modulo. Restituisce un elenco di messaggi di errore (vuoto = tutto a posto).
   */
  verify: function () {
    var tr = this.translate;
    var errors = [];
    if (this.isEggGlitch()) {
      return errors;
    }

    var typeData = this.getTypeData();
    if (!typeData) {
      return [tr('errorNoMission')];
    }

    var dungeon = parseInt(this.getComboBoxValue('dungeonBox'), 10);
    if (!(dungeon >= 0) || dungeon >= FIRST_INVALID_DUNGEON) {
      errors.push(tr('errorDungeonNotAllowed'));
    }
    var floorLimit = this.getFloorLimit(dungeon);
    var floor = readInteger(this.form.floor.value);
    if (floor === null || floor < 1 || floor > floorLimit) {
      errors.push(tr('errorFloorRange', { max: floorLimit }));
    } else if (getForbiddenFloors(dungeon).indexOf(floor) !== -1) {
      errors.push(tr('errorForbiddenFloor', { floor: floor }));
    }

    var specialFloor = String(this.form.specialFloor.value || '').trim();
    if (specialFloor !== '') {
      var special = readInteger(specialFloor);
      if (special === null || special < 0 || special > 255) {
        errors.push(tr('errorSpecialFloorRange'));
      }
    }

    var flavor = String(this.form.flavorText.value || '').trim();
    if (flavor !== '') {
      var flavorValue = readInteger(flavor);
      if (flavorValue === null || flavorValue < 0 || flavorValue > 0xFFFFFF) {
        errors.push(tr('errorFlavorRange'));
      }
    }

    var rewardType = parseInt(this.getComboBoxValue('rewardTypeBox'), 10);
    if (!typeData.noReward && rewardType >= 1 && rewardType <= 4) {
      var rewardItem = parseInt(this.getComboBoxValue('rewardItemBox'), 10);
      if (!rewardItem) {
        errors.push(tr('errorRewardItemRequired'));
      } else if (!isValidGameItem(rewardItem) || !isStorableItem(rewardItem)) {
        // Il gioco controlla anche la ricompensa (IsItemValid e IsStorableItem).
        errors.push(tr('errorInvalidRewardItem'));
      }
    }

    // Tipo 6: IsMissionValid vuole una specie ammessa nelle missioni e, tranne nelle Lettere di sfida,
    // una che possa fare da committente (IsMonsterMissionAllowed). Il tipo 5 (uovo) non viene controllato.
    if (!typeData.noReward && rewardType === 6) {
      var joining = parseInt(this.getComboBoxValue('rewardPokemonBox'), 10);
      if (joining > 0 && getRewardPokemonIds(6, typeData.mainType).indexOf(joining) === -1) {
        errors.push(tr('errorRewardPokemon'));
      }
    }

    // Restrizioni (IsMissionValid): un tipo sotto 18, oppure una specie che può fare da committente.
    var restriction = this.readRestriction();
    if (restriction.type === 0 && restriction.value >= 18) {
      errors.push(tr('errorRestriction'));
    } else if (restriction.type === 1 && (gameData().missionClients || []).indexOf(restriction.value) === -1) {
      errors.push(tr('errorRestriction'));
    }

    if (clientJoinsTeam(typeData.mainType) && !typeData.forceClient) {
      var client = parseInt(this.getComboBoxValue('clientBox'), 10);
      if (hasLargeBody(client)) {
        errors.push(tr('errorClientTooLarge'));
      }
    }

    if (typeData.useTargetItem) {
      var targetItem = parseInt(this.getComboBoxValue('targetItemBox'), 10);
      var itemError = getTargetItemError(targetItem, typeData.mainType);
      if (itemError === 'thrown') {
        errors.push(tr('errorThrownTargetItem'));
      } else if (itemError) {
        errors.push(tr('errorInvalidTargetItem'));
      }
    }

    // Consegna: in qualche dungeon non si possono portare strumenti, quindi non si consegna niente.
    if (typeData.mainType === 7 && getDungeonMaxItems(dungeon) === 0) {
      errors.push(tr('errorNoItemsInDungeon'));
    }

    return errors;
  },

  /**
   * Dati del tipo di missione selezionato, con il sottotipo già applicato.
   */
  getTypeData: function () {
    var typeNum = parseInt(this.getComboBoxValue('missionTypeBox'), 10);
    var typeData = WMSGenData.missionTypes[typeNum];
    if (!typeData) {
      return false;
    }
    if (typeData.subTypes) {
      var subTypeNum = parseInt(this.getComboBoxValue('missionSubTypeBox'), 10);
      var subTypeData = typeData.subTypes[subTypeNum];
      if (subTypeData) {
        var merged = {};
        var key;
        for (key in typeData) {
          if (Object.prototype.hasOwnProperty.call(typeData, key)) merged[key] = typeData[key];
        }
        for (key in subTypeData) {
          if (Object.prototype.hasOwnProperty.call(subTypeData, key)) merged[key] = subTypeData[key];
        }
        typeData = merged;
      }
    }
    return typeData;
  },

  update: function () {
    var typeData = this.getTypeData();
    if (!typeData) {
      return;
    }
    this.syncMonsterLists();
    var has = function (key) {
      return Object.prototype.hasOwnProperty.call(typeData, key);
    };

    this.form.target2Box.disabled = !typeData.useTarget2;
    this.form.target2F.disabled = !typeData.useTarget2;
    var target2Wrap = document.getElementById('target2');
    if (target2Wrap) {
      target2Wrap.style.display = typeData.useTarget2 ? 'block' : 'none';
    }

    this.form.targetItemBox.disabled = !typeData.useTargetItem;

    var rewardType = parseInt(this.getComboBoxValue('rewardTypeBox'), 10);
    this.form.rewardTypeBox.disabled = !!typeData.noReward;
    this.form.rewardItemBox.disabled = !!typeData.noReward || rewardType < 1 || rewardType > 4;

    this.form.clientBox.disabled = has('forceClient');
    this.form.targetBox.disabled = has('forceTarget') || !!typeData.clientIsTarget;

    // La casella "Femmina" serve solo se la specie ha una forma femminile.
    var form = this.form;
    var syncFemale = function (checkbox, monId, locked) {
      var available = hasFemaleForm(monId);
      if (!available) checkbox.checked = false;
      checkbox.disabled = locked || !available;
    };
    syncFemale(form.clientF, parseInt(form.clientBox.value, 10), has('forceClient'));
    syncFemale(form.targetF, parseInt(form.targetBox.value, 10), has('forceTarget') || !!typeData.clientIsTarget);
    syncFemale(form.target2F, parseInt(form.target2Box.value, 10), !typeData.useTarget2);
  },

  /**
   * Restrizione della squadra scelta nel modulo: tipo 0 con un tipo elementare (1-17), tipo 1 con una
   * specie; "nessuna" è tipo 0 con valore 0, come nelle missioni della bacheca.
   */
  readRestriction: function () {
    var kind = this.form.restrictionKindBox ? this.form.restrictionKindBox.value : 'none';
    var value = this.form.restrictionValueBox ? parseInt(this.form.restrictionValueBox.value, 10) : 0;
    if (kind === 'type' && value > 0) return { type: 0, value: value };
    if (kind === 'species' && value > 0) return { type: 1, value: value };
    return { type: 0, value: 0 };
  },

  /**
   * Costruisce la missione dai valori del modulo (senza codificarla).
   */
  buildStruct: function () {
    var eggGlitch = this.isEggGlitch();
    var typeData = this.getTypeData();
    var restriction = this.readRestriction();
    var struct = {
      nullBits: 0,
      mailType: 4,
      restriction: eggGlitch ? 0 : restriction.value,
      restrictionType: eggGlitch ? 0 : restriction.type,
      missionType: eggGlitch ? 6 : typeData.mainType,
      missionSpecial: eggGlitch ? 0 : typeData.specialType,
      rewardType: eggGlitch ? 5 : parseInt(this.getComboBoxValue('rewardTypeBox'), 10)
    };

    // Committente
    if (eggGlitch) {
      struct.client = 286;
    } else if (Object.prototype.hasOwnProperty.call(typeData, 'forceClient')) {
      struct.client = typeData.forceClient;
    } else {
      struct.client = this.getTrueMonID(parseInt(this.getComboBoxValue('clientBox'), 10), this.form.clientF.checked);
    }

    // Bersaglio
    if (eggGlitch || typeData.clientIsTarget) {
      struct.target = struct.client;
    } else if (Object.prototype.hasOwnProperty.call(typeData, 'forceTarget')) {
      struct.target = typeData.forceTarget;
    } else {
      struct.target = this.getTrueMonID(parseInt(this.getComboBoxValue('targetBox'), 10), this.form.targetF.checked);
    }

    // Secondo bersaglio: quello scelto nel modulo (prima veniva copiato dal bersaglio).
    if (!eggGlitch && typeData.useTarget2) {
      struct.target2 = this.getTrueMonID(parseInt(this.getComboBoxValue('target2Box'), 10), this.form.target2F.checked);
    } else {
      struct.target2 = 0;
    }

    // Ricompensa
    if (eggGlitch) {
      var eggPoke = parseInt(this.getComboBoxValue('eggPokemonBox'), 10);
      struct.reward = isFinite(eggPoke) ? eggPoke : 1;
    } else if (typeData.noReward) {
      // Per le missioni senza scelta: soldi + ??? con una Mela.
      struct.rewardType = 1;
      struct.reward = 109;
    } else if (struct.rewardType >= 1 && struct.rewardType <= 4) {
      struct.reward = parseInt(this.getComboBoxValue('rewardItemBox'), 10);
    } else if (struct.rewardType === 5 || struct.rewardType === 6) {
      // Uovo (5) o Pokémon che si unisce alla squadra (6): il valore è la specie (InitMissionReward).
      // Senza una scelta vale il committente, come nelle missioni della bacheca.
      var rewardMon = parseInt(this.getComboBoxValue('rewardPokemonBox'), 10);
      struct.reward = rewardMon > 0 ? rewardMon : struct.client;
    } else {
      // Il gioco vuole comunque un valore: una Mela.
      struct.reward = 109;
    }

    // Strumento obiettivo
    if (eggGlitch) {
      struct.targetItem = 92;
    } else if (typeData.useTargetItem) {
      struct.targetItem = parseInt(this.getComboBoxValue('targetItemBox'), 10);
    } else {
      struct.targetItem = 109;
    }

    // Dungeon e piano
    var dungeon = parseInt(this.getComboBoxValue('dungeonBox'), 10);
    struct.dungeon = eggGlitch ? 91 : (dungeon || 1);
    struct.floor = eggGlitch ? 0 : readInteger(this.form.floor.value);

    // Stanza speciale
    var specialFloor = String(this.form.specialFloor.value || '').trim();
    if (eggGlitch) {
      struct.specialFloor = 0;
    } else if (specialFloor !== '') {
      struct.specialFloor = readInteger(specialFloor);
    } else if (Object.prototype.hasOwnProperty.call(typeData, 'specialFloor')) {
      struct.specialFloor = typeData.specialFloor;
    } else if (typeData.specialFloorFromList) {
      var list = WMSGenData.staticLists[typeData.specialFloorFromList] || [0];
      struct.specialFloor = list[Math.floor(Math.random() * list.length)];
    } else {
      struct.specialFloor = 0;
    }

    // Seme del testo: valore scelto oppure casuale (300000-399999, come nel generatore originale).
    var flavor = String(this.form.flavorText.value || '').trim();
    struct.flavorText = flavor !== ''
      ? readInteger(flavor)
      : 300000 + Math.floor(Math.random() * 100000);

    return struct;
  },

  /**
   * Genera la password (formattata su due righe) per la regione scelta.
   * La password viene poi riletta: se non torna identica alla missione, viene scartata.
   */
  generate: function () {
    var struct = this.buildStruct();
    var region = this.getRegion();
    var code = WMSParser.encode(struct, region);

    var check = WMSParser.decodeWithRegion(code, region);
    if (!check || !check.crcOk) {
      throw new Error('La password generata non supera il controllo del checksum.');
    }
    for (var key in struct) {
      if (Object.prototype.hasOwnProperty.call(struct, key) && check.struct[key] !== struct[key]) {
        throw new Error('La password generata non corrisponde alla missione (' + key + ').');
      }
    }

    this.lastStruct = struct;
    this.lastRegion = region;
    return prettyMailString(code, 2, 7);
  }
};

function readInteger(value) {
  var text = String(value === undefined || value === null ? '' : value).trim();
  if (!/^-?\d+$/.test(text)) {
    return null;
  }
  return parseInt(text, 10);
}

function hasFemaleForm(baseId) {
  var data = window.WMSkyGameData;
  if (!data || !data.femaleForm) return false;
  if (!data._femaleFormSet) {
    data._femaleFormSet = new Set(data.femaleForm);
  }
  return data._femaleFormSet.has(baseId % 600);
}

// Tipi di missione in cui il committente si unisce alla squadra: accompagna, esplora, cerca, guida.
function clientJoinsTeam(mainType) {
  return mainType >= 2 && mainType <= 5;
}

// Pokémon che occupano più di un posto nella squadra (taglia diversa da 1 in BALANCE/monster.md).
function hasLargeBody(monId) {
  var data = window.WMSkyGameData;
  if (!data || !data.largeBody) return false;
  if (!data._largeBodySet) {
    data._largeBodySet = new Set(data.largeBody);
  }
  return data._largeBodySet.has(monId % 600);
}

// ---------------------------------------------------------------------------
// Controlli del gioco su dungeon, piani e strumenti (porting di IsMissionValid)
// ---------------------------------------------------------------------------

// Primo ID di dungeon che il gioco non accetta nelle missioni (IsInvalidForMission).
var FIRST_INVALID_DUNGEON = 0xB4;
// Primo forziere: da qui in su niente può essere lo strumento obiettivo (IsValidTargetItem).
var FIRST_BOX_ITEM = 364;
// Strumenti che non si possono tenere nel sacco (IsStorableItem): Poké, MT Usata, Uovoincanto.
var UNSTORABLE_ITEMS = [0, 183, 187, 178];
// Strumenti da lancio ammessi come obiettivo anche dove gli altri non lo sono: Punta d'Oro, Fossile Raro.
var THROWN_ITEMS_ALLOWED = [9, 10];

function gameData() {
  return window.WMSkyGameData || {};
}

function isValidGameItem(itemId) {
  var data = gameData();
  if (!data.validItems) return true;
  if (!data._validItemSet) {
    data._validItemSet = new Set(data.validItems);
  }
  return itemId > 0 && data._validItemSet.has(itemId);
}

// Specie che si possono scegliere come ricompensa. Uovo (5): le specie ammesse nelle missioni. Pokémon che si unisce (6): quelle
// ammesse nelle missioni (IsMonsterIllegalForMissions) e, fuori dalle Lettere di sfida (tipo 11), non
// escluse dai committenti (IsMonsterMissionAllowed, MISSION_BANNED_MONSTERS).
function getRewardPokemonIds(rewardType, mainType) {
  var data = gameData();
  if (rewardType === 6) {
    return ((mainType === 11 ? data.missionTargets : data.missionClients) || []).slice();
  }
  return (data.missionTargets || []).slice();
}

// Categoria 0 e 1: strumenti da lancio (IsThrownItem).
function isThrownItem(itemId) {
  var categories = gameData().itemCategory;
  return !!categories && categories[itemId] <= 1;
}

function isStorableItem(itemId) {
  return UNSTORABLE_ITEMS.indexOf(itemId) === -1;
}

// Piani che il gioco rifiuta in quel dungeon (IsForbiddenFloor).
function getForbiddenFloors(dungeonId) {
  var forbidden = gameData().forbiddenFloors;
  return (forbidden && forbidden[dungeonId]) || [];
}

// Strumenti che si possono portare nel dungeon: se sono zero, non si può consegnare niente.
function getDungeonMaxItems(dungeonId) {
  var maxItems = gameData().dungeonMaxItems;
  return maxItems && maxItems[dungeonId] !== undefined ? maxItems[dungeonId] : 99;
}

/**
 * Strumento obiettivo: il gioco vuole uno strumento vero, non un forziere e non uno strumento che
 * non entra nel sacco (CheckItemForMissionType). Nelle missioni "cerca con il committente" (tipo 4)
 * non sono ammessi gli strumenti da lancio, tranne Punta d'Oro e Fossile Raro.
 * Restituisce 'invalid', 'thrown' oppure null se lo strumento va bene.
 */
function getTargetItemError(itemId, mainType) {
  if (!itemId || itemId >= FIRST_BOX_ITEM || !isValidGameItem(itemId) || !isStorableItem(itemId)) {
    return 'invalid';
  }
  if (mainType === 4 && isThrownItem(itemId) && THROWN_ITEMS_ALLOWED.indexOf(itemId) === -1) {
    return 'thrown';
  }
  return null;
}

function getValidItemIds() {
  var data = window.WMSkyGameData;
  return data && Array.isArray(data.validItems) ? data.validItems : [];
}

function addOptionToSelect(box, value, text) {
  var element = document.createElement('option');
  element.value = String(value);
  element.text = text;
  box.add(element, null);
}
