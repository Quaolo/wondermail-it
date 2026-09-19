/*
  Stanze speciali delle missioni (Memo tesoro, Lettere di sfida, covi dei ricercati, Sala Proibita,
  Sala d'Oro): scelta della stanza, miniature e mappa, disegnate dai dati del gioco
  (data/stanze_fisse.js, generato da tools/estrai_dati.py).

  Usa le funzioni globali di app.js e lmutils.js: t(), getGameText(), getItemName(), getDungeonName().
*/
(function (root) {
  'use strict';

  // Simboli delle mappe di data/stanze_fisse.js -> tipo di casella.
  const CELL_TYPES = {
    '#': 'wall', 'b': 'crack', '.': 'floor', '~': 'water', '_': 'chasm', '>': 'stairs',
    '@': 'leader', '1': 'partner', '2': 'partner', '3': 'partner',
    'K': 'door', 'E': 'escortDoor', 'T': 'treasure', 't': 'targetItem', '$': 'poke',
    'c': 'box', 'i': 'item', 'B': 'boss', 'm': 'minion1', 'n': 'minion2', 'O': 'outlaw', 'p': 'pokemon',
    'G': 'gust', 'W': 'warp', 'X': 'chestnut', '^': 'trap'
  };

  // Ordine della legenda.
  const LEGEND_ORDER = [
    'leader', 'partner', 'stairs', 'treasure', 'targetItem', 'box', 'item', 'poke',
    'boss', 'outlaw', 'minion1', 'minion2', 'pokemon',
    'door', 'escortDoor', 'gust', 'warp', 'chestnut', 'trap', 'crack', 'water', 'chasm'
  ];

  const ICON = 'assets/item-icons-pmdo/';
  const ITEM_ICONS = {
    treasure: `${ICON}Box-Blue.png`,
    box: `${ICON}Box-Blue.png`,
    item: `${ICON}Chest-Gold.png`,
    targetItem: `${ICON}Chest-Gold.png`,
    poke: `${ICON}Money-Yellow.png`,
    door: `${ICON}Key-White.png`,
    escortDoor: `${ICON}Key-White.png`,
    chestnut: `${ICON}Chestnut-Brown.png`
  };

  // ID ufficiali usati per i nomi nella legenda.
  const TRAP_IDS = { gust: 7, warp: 6, chestnut: 16 };
  const ITEM_IDS = { poke: 183, box: 385, treasure: 385, door: 182, trawlOrb: 322, reviverSeed: 73, oranBerry: 70 };

  // Colori delle miniature (un pixel per casella).
  const THUMB_COLORS = {
    wall: '#221c38', crack: '#6d5442', floor: '#cdb78d', water: '#3d7fd6', chasm: '#05050a',
    stairs: '#ffffff', leader: '#4fd46a', partner: '#4fd46a', door: '#b39bff', escortDoor: '#b39bff',
    treasure: '#ffd23f', targetItem: '#ffd23f', box: '#ffd23f', item: '#ffd23f', poke: '#e8a92c',
    boss: '#ff4d6d', outlaw: '#ff4d6d', minion1: '#ff8fa3', minion2: '#ff8fa3', pokemon: '#ff8fa3',
    gust: '#63d4ff', warp: '#b27dff', chestnut: '#9b5a2c', trap: '#ff6b6b'
  };

  function getData() {
    return root.WMSkyFixedRooms || null;
  }

  function getRoom(id) {
    const data = getData();
    const numeric = parseInt(id, 10);
    if (!data || !Number.isFinite(numeric)) return null;
    const room = data.rooms[String(numeric)];
    return room
      ? { id: numeric, kind: room.kind, map: room.map, props: room.props, items: room.items || [], dungeon: room.dungeon }
      : null;
  }

  function hasRoom(id) {
    return !!getRoom(id);
  }

  /**
   * Quali stanze usa un tipo di missione (typeData di lmgenerate.js):
   *   rooms: stanze tra cui scegliere (il gioco ne sceglie una a caso)
   *   fixed: stanza unica; forced = il gioco la usa qualunque numero contenga la password
   */
  function getRoomPlan(typeData) {
    const data = getData();
    if (!typeData || !data) return null;
    const lists = data.missionRooms;
    const main = parseInt(typeData.mainType, 10);
    const sub = parseInt(typeData.specialType, 10) || 0;
    if (main === 12) {
      return { kind: 'treasureMemo', rooms: lists.treasureMemo, early: lists.treasureMemoEarly, extra: lists.withoutTreasure };
    }
    if (main === 11 && sub === 0) return { kind: 'challenge', rooms: lists.challenge };
    if (main === 11 && lists.legendaryChallenge[sub - 1]) {
      return { kind: 'legendaryChallenge', fixed: lists.legendaryChallenge[sub - 1] };
    }
    if (main === 10 && sub === 6) return { kind: 'outlawHideout', rooms: lists.outlawHideout };
    if (main === 3 && sub === 1) return { kind: 'sealedChamber', fixed: lists.sealedChamber, forced: true };
    if (main === 3 && sub === 2) return { kind: 'goldenChamber', fixed: lists.goldenChamber, forced: true };
    return null;
  }

  function getKindLabel(kind) {
    const labels = {
      treasureMemo: t('roomKindTreasureMemo'),
      unusedTreasureMemo: t('roomKindUnusedMemo'),
      challenge: t('roomKindChallenge'),
      legendaryChallenge: t('roomKindLegendary'),
      outlawHideout: t('roomKindHideout'),
      sealedChamber: t('roomKindSealed'),
      goldenChamber: t('roomKindGolden'),
      secretRoom: t('roomKindSecret'),
      dungeonEnd: t('roomKindDungeonEnd')
    };
    return labels[kind] || t('roomKindOther');
  }

  // Numero progressivo della stanza nel suo elenco (Memo tesoro 1-30, sfida 1-5...).
  function getRoomOrdinal(room) {
    const data = getData();
    if (!data || !room) return null;
    const list = data.missionRooms[room.kind];
    if (!Array.isArray(list)) return null;
    const index = list.indexOf(room.id);
    return index >= 0 ? index + 1 : null;
  }

  function countCells(room) {
    const counts = {};
    room.map.forEach((row) => {
      for (const char of row) {
        const type = CELL_TYPES[char] || 'floor';
        counts[type] = (counts[type] || 0) + 1;
      }
    });
    return counts;
  }

  function trapName(type) {
    const text = getGameText();
    return (text && text.traps && text.traps[TRAP_IDS[type]]) || type;
  }

  function extraText(key) {
    const text = getGameText();
    return (text && text.extra && text.extra[key]) || key;
  }

  // Strumento posato su una casella (stanze con premi fissi).
  function itemAt(room, x, y) {
    const entry = (room.items || []).find(([ix, iy]) => ix === x && iy === y);
    return entry ? entry[2] : null;
  }

  function isWithoutTreasure(room) {
    const data = getData();
    return !!(data && room && data.missionRooms.withoutTreasure.includes(room.id));
  }

  // Cosa può contenere un Tecalusso: dipende dal dungeon della missione.
  function describeBoxContents(dungeonId) {
    const data = getData();
    const boxes = data && data.boxes;
    if (!boxes) return '';
    const list = boxes.byDungeon[String(dungeonId)];
    if (!list) return getItemName(boxes.fallback);
    // Il gioco sceglie una voce dell'elenco a caso (ov29_023442B8): le voci ripetute sono più probabili.
    const counts = new Map();
    list.forEach((item) => {
      const name = boxes.exclusiveCodes.includes(item) ? t('exclusiveForTeam') : getItemName(item);
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    const entries = Array.from(counts);
    if (entries.length === 1) return entries[0][0];
    if (entries.every(([, count]) => count === entries[0][1])) {
      return t('boxAnyOf', { items: entries.map(([name]) => name).join(', ') });
    }
    return entries.map(([name, count]) => `${name} ${Math.round((count / list.length) * 100)}%`).join(', ');
  }

  /**
   * Contenuto dei Tecalusso per ogni dungeon (tabella ov29_02353050 letta da PlaceFixedRoomTile).
   * I dungeon con lo stesso elenco stanno nella stessa riga; i dungeon che non sono in tabella danno
   * sempre il ripiego (Revitalseme) e non compaiono.
   */
  function getBoxTable() {
    const data = getData();
    const boxes = data && data.boxes;
    if (!boxes) return { rows: [], fallback: '' };
    const rows = new Map();
    Object.keys(boxes.byDungeon).forEach((key) => {
      const list = boxes.byDungeon[key];
      const signature = list.join(',');
      if (signature === String(boxes.fallback)) return;
      if (!rows.has(signature)) rows.set(signature, { dungeons: [], contents: describeBoxContents(key) });
      rows.get(signature).dungeons.push(parseInt(key, 10));
    });
    return { rows: Array.from(rows.values()), fallback: getItemName(boxes.fallback) };
  }

  // Tecalusso che il gioco riempie con la tabella dei dungeon (non il tesoro della missione né la stanza segreta).
  function hasDungeonBoxes(room) {
    return !!room && room.kind !== 'secretRoom' && Array.isArray(room.items)
      && room.items.some(([, , item]) => item === ITEM_IDS.box);
  }

  function getCellLabel(type, context) {
    const person = (entry, fallback) => (entry && entry.name ? `${fallback}: ${entry.name}` : fallback);
    const labels = {
      wall: () => t('tileWall'),
      crack: () => t('tileCrack', { skill: extraText('absoluteMover') }),
      floor: () => t('tileFloor'),
      water: () => t('tileWater'),
      chasm: () => t('tileChasm'),
      stairs: () => t('tileStairs'),
      leader: () => t('tileLeader'),
      partner: () => t('tilePartner'),
      door: () => t('tileDoor', { key: getItemName(ITEM_IDS.door) }),
      escortDoor: () => t('tileEscortDoor'),
      treasure: () => (context.targetItem && context.targetItem.name
        ? t('tileTreasureWith', { box: getItemName(ITEM_IDS.treasure), item: context.targetItem.name })
        : t('tileTreasure', { box: getItemName(ITEM_IDS.treasure) })),
      targetItem: () => person(context.targetItem, t('tileTargetItem')),
      box: () => t('tileBox', { box: getItemName(ITEM_IDS.box) }),
      item: () => t('tileItem'),
      poke: () => getItemName(ITEM_IDS.poke),
      boss: () => person(context.boss, t('tileBoss')),
      outlaw: () => person(context.outlaw, t('tileOutlaw')),
      minion1: () => person(context.minion1, context.minionLabel1 || t('tileMinion')),
      minion2: () => person(context.minion2, context.minionLabel2 || t('tileMinion')),
      pokemon: () => t('tilePokemon'),
      gust: () => trapName('gust'),
      warp: () => trapName('warp'),
      chestnut: () => trapName('chestnut'),
      trap: () => t('tileTrap')
    };
    return (labels[type] || labels.floor)();
  }

  // Terreno sotto a un oggetto o a un Pokémon: sempre pavimento (così fa il gioco).
  function baseClass(type) {
    if (['wall', 'crack', 'water', 'chasm'].includes(type)) return type;
    if (type === 'door' || type === 'escortDoor') return 'wall';
    return 'floor';
  }

  function portraitFor(type, context) {
    const map = { boss: context.boss, outlaw: context.outlaw, minion1: context.minion1, minion2: context.minion2 };
    return map[type] && map[type].image ? map[type].image : null;
  }

  function iconFor(type, context) {
    if (type === 'targetItem' && context.targetItem && context.targetItem.image) return context.targetItem.image;
    return ITEM_ICONS[type] ? { src: ITEM_ICONS[type], fallback: ITEM_ICONS[type] } : null;
  }

  function createImage(payload, className) {
    const image = document.createElement('img');
    image.className = className;
    image.alt = '';
    image.decoding = 'async';
    image.src = payload.src;
    if (payload.fallback && payload.fallback !== payload.src) {
      image.addEventListener('error', () => {
        if (image.src !== payload.fallback) image.src = payload.fallback;
      }, { once: true });
    }
    return image;
  }

  /**
   * Mappa grande: una griglia di caselle con le icone degli strumenti e i ritratti dei Pokémon.
   * context: { boss, outlaw, minion1, minion2, targetItem } con { name, image: { src, fallback } }.
   */
  function renderMap(container, room, context = {}) {
    container.innerHTML = '';
    if (!room) {
      container.classList.add('room-map-empty');
      return;
    }
    container.classList.remove('room-map-empty');
    const width = room.map[0].length;
    const height = room.map.length;
    container.style.setProperty('--cols', String(width));
    container.style.setProperty('--rows', String(height));
    // Caselle di un numero intero di pixel: con misure frazionarie le righe della griglia sfarfallano.
    const parent = container.parentElement;
    let available = 344;
    if (parent && parent.clientWidth) {
      const style = root.getComputedStyle(parent);
      available = parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 16;
    }
    const cell = Math.max(8, Math.min(22, Math.floor(available / width)));
    container.style.setProperty('--cell', `${cell}px`);
    container.setAttribute('role', 'img');
    container.setAttribute('aria-label', t('roomMapLabel', { room: room.id, width, height }));

    const fragment = document.createDocumentFragment();
    room.map.forEach((row, y) => {
      [...row].forEach((char, x) => {
        const type = CELL_TYPES[char] || 'floor';
        const cell = document.createElement('span');
        cell.className = `cell cell-${baseClass(type)} mark-${type}`;
        const placedItem = (type === 'item' || type === 'box') ? itemAt(room, x, y) : null;
        if (placedItem !== null && context.itemImage) {
          cell.title = getItemName(placedItem);
          cell.appendChild(createImage(context.itemImage(placedItem), 'cell-icon'));
        } else if (type !== baseClass(type)) {
          cell.title = getCellLabel(type, context);
          const portrait = portraitFor(type, context);
          const icon = iconFor(type, context);
          if (portrait) {
            cell.appendChild(createImage(portrait, 'cell-portrait'));
          } else if (icon) {
            cell.appendChild(createImage(icon, 'cell-icon'));
          }
        } else if (type === 'crack' || type === 'water' || type === 'chasm') {
          cell.title = getCellLabel(type, context);
        }
        fragment.appendChild(cell);
      });
    });
    container.appendChild(fragment);
  }

  // Miniatura: un quadratino per casella, su un canvas.
  function renderThumbnail(canvas, room, scale = 3) {
    const width = room.map[0].length;
    const height = room.map.length;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    room.map.forEach((row, y) => {
      [...row].forEach((char, x) => {
        const type = CELL_TYPES[char] || 'floor';
        ctx.fillStyle = THUMB_COLORS[type] || THUMB_COLORS.floor;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      });
    });
  }

  function renderLegend(list, room, context = {}) {
    list.innerHTML = '';
    if (!room) return;
    const counts = countCells(room);
    // Strumenti posati: una voce per strumento, con la sua icona.
    const placed = new Map();
    (room.items || []).forEach(([, , item]) => placed.set(item, (placed.get(item) || 0) + 1));
    LEGEND_ORDER.forEach((type) => {
      if (!counts[type]) return;
      if ((type === 'item' || type === 'box') && placed.size && context.itemImage) {
        placed.forEach((count, item) => {
          const inGroup = type === 'box' ? countCellsOfItem(room, 'c', item) : countCellsOfItem(room, 'i', item);
          if (!inGroup) return;
          const entry = document.createElement('li');
          entry.className = 'legend-item';
          const swatch = document.createElement('span');
          swatch.className = 'cell cell-floor legend-swatch';
          swatch.appendChild(createImage(context.itemImage(item), 'cell-icon'));
          const label = document.createElement('span');
          label.textContent = inGroup > 1 ? `${getItemName(item)} × ${inGroup}` : getItemName(item);
          entry.append(swatch, label);
          list.appendChild(entry);
        });
        return;
      }
      const item = document.createElement('li');
      item.className = 'legend-item';
      const swatch = document.createElement('span');
      swatch.className = `cell cell-${baseClass(type)} mark-${type} legend-swatch`;
      const portrait = portraitFor(type, context);
      const icon = iconFor(type, context);
      if (portrait) swatch.appendChild(createImage(portrait, 'cell-portrait'));
      else if (icon) swatch.appendChild(createImage(icon, 'cell-icon'));
      const label = document.createElement('span');
      label.textContent = counts[type] > 1 && !['water', 'crack', 'chasm'].includes(type)
        ? `${getCellLabel(type, context)} × ${counts[type]}`
        : getCellLabel(type, context);
      item.append(swatch, label);
      list.appendChild(item);
    });
  }

  function countCellsOfItem(room, char, item) {
    return (room.items || []).filter(([x, y, id]) => id === item && room.map[y][x] === char).length;
  }

  /**
   * Cose da sapere su una stanza: regole del gioco (sfere, mosse...) e avvisi.
   * Restituisce { facts: [testo], warning: testo o '' }.
   */
  function describeRoom(room, plan, context = {}) {
    const facts = [];
    let warning = '';
    if (!room) return { facts, warning };
    const counts = countCells(room);
    const props = room.props || {};
    const item = context.targetItem && context.targetItem.name;

    const farm = plan && plan.kind === 'treasureMemo' && isWithoutTreasure(room);
    if (farm) {
      const fixedItems = (room.items || []).filter(([x, y]) => room.map[y][x] === 'i').map(([, , id]) => id);
      if (fixedItems.length) {
        const names = new Map();
        fixedItems.forEach((id) => names.set(getItemName(id), (names.get(getItemName(id)) || 0) + 1));
        facts.push(t('roomFactFixedLoot', { items: Array.from(names, ([name, count]) => (count > 1 ? `${name} × ${count}` : name)).join(', ') }));
      }
      if (counts.box) {
        const boxes = {
          count: counts.box,
          box: getItemName(ITEM_IDS.box),
          dungeon: context.dungeonName || '',
          contents: describeBoxContents(context.dungeon),
          // GetRandomSecretRoomItem: elenco "stanza segreta" del piano, Baccarancia se è vuoto.
          fallback: getItemName(ITEM_IDS.oranBerry)
        };
        if (room.kind === 'secretRoom') facts.push(t('roomFactSecretBoxes', boxes));
        else facts.push(counts.box === 1 ? t('roomFactBox', boxes) : t('roomFactBoxes', boxes));
      }
    }
    if (room.kind === 'treasureMemo') {
      facts.push(item
        ? t('roomFactTreasureWith', { box: getItemName(ITEM_IDS.treasure), item })
        : t('roomFactTreasure', { box: getItemName(ITEM_IDS.treasure) }));
      const ordinal = getRoomOrdinal(room);
      const data = getData();
      if (ordinal && data && ordinal > data.missionRooms.treasureMemoEarly) {
        facts.push(t('roomFactLateMemo'));
      }
    }
    if (room.kind === 'challenge') facts.push(t('roomFactChallenge'));
    if (room.kind === 'legendaryChallenge') facts.push(t('roomFactLegendary'));
    if (room.kind === 'outlawHideout') facts.push(t('roomFactHideout', { count: (counts.minion1 || 0) + (counts.minion2 || 0) }));
    if (room.kind === 'sealedChamber') facts.push(item ? t('roomFactSealedWith', { item }) : t('roomFactSealed'));
    if (room.kind === 'goldenChamber' && !farm) facts.push(t('roomFactGolden', { count: counts.box || 0, box: getItemName(ITEM_IDS.box) }));
    if (counts.door) facts.push(t('roomFactKeyDoor', { key: getItemName(ITEM_IDS.door) }));
    if (counts.crack) facts.push(t('roomFactCrack', { skill: extraText('absoluteMover') }));
    if (counts.water) facts.push(t('roomFactWater'));

    if (room.id < 165) {
      if (!props.orbs) facts.push(t('roomFactNoOrbs'));
      if (!props.moves) facts.push(t('roomFactNoMoves'));
      if (!props.warps) facts.push(t('roomFactNoWarps'));
      if (!props.trawl) facts.push(t('roomFactNoTrawl', { orb: getItemName(ITEM_IDS.trawlOrb) }));
    }

    if (plan && plan.forced) facts.push(t('roomFactForced'));
    if (farm) {
      warning = room.id === 81 ? t('roomWarningFarmKnown') : t('roomWarningFarm');
    } else if (room.kind === 'unusedTreasureMemo') {
      facts.push(t('roomFactUnusedMemoLoot', { count: counts.box || 0, box: getItemName(ITEM_IDS.box), seed: getItemName(ITEM_IDS.reviverSeed) }));
      warning = t('roomWarningUnusedMemo');
    } else if (room.kind === 'secretRoom') {
      warning = t('roomWarningSecretRoom');
    } else if (plan && plan.kind && room.kind !== plan.kind) {
      warning = t('roomWarningWrongKind', { kind: getKindLabel(room.kind) });
    }
    return { facts, warning };
  }

  function getMemoExample(roomId) {
    const examples = Array.isArray(root.WMSkyMemoExamples) ? root.WMSkyMemoExamples : [];
    return examples.find((example) => example.specialFloor === roomId) || null;
  }

  /**
   * Scelta della stanza: un pulsante "a caso" e una miniatura per ogni stanza dell'elenco.
   * onPick(valore) riceve '' per "a caso" oppure il numero della stanza.
   */
  function renderPicker(container, plan, selected, onPick) {
    container.innerHTML = '';
    if (!plan || !Array.isArray(plan.rooms)) return;
    const selectedValue = selected === null || selected === undefined ? '' : String(selected);

    const makeButton = (value, label, room) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'room-option';
      button.dataset.room = value;
      button.setAttribute('role', 'option');
      const active = value === selectedValue;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
      if (room) {
        const canvas = document.createElement('canvas');
        canvas.className = 'room-thumb';
        renderThumbnail(canvas, room, 2);
        button.appendChild(canvas);
        button.title = `${getKindLabel(room.kind)} · ${t('roomNumber', { room: room.id })}`;
      } else {
        const dice = document.createElement('span');
        dice.className = 'room-random';
        dice.textContent = '?';
        button.appendChild(dice);
        button.title = t('roomRandomTitle');
      }
      const caption = document.createElement('span');
      caption.className = 'room-option-label';
      caption.textContent = label;
      button.appendChild(caption);
      if (room && plan.early && plan.rooms.indexOf(room.id) >= plan.early) {
        button.classList.add('room-late');
      }
      button.addEventListener('click', () => onPick(value));
      return button;
    };

    container.appendChild(makeButton('', t('roomRandom'), null));
    plan.rooms.forEach((id) => {
      const room = getRoom(id);
      if (room) container.appendChild(makeButton(String(id), String(id), room));
    });

    // Stanze che il gioco non usa per questa missione ma che una password può indicare.
    if (Array.isArray(plan.extra) && plan.extra.length) {
      const group = document.createElement('details');
      group.className = 'room-extra';
      group.open = plan.extra.map(String).includes(selectedValue);
      const summary = document.createElement('summary');
      summary.textContent = t('roomExtraTitle', { count: plan.extra.length });
      const note = document.createElement('p');
      note.className = 'hint';
      note.textContent = t('roomExtraHint');
      const grid = document.createElement('div');
      grid.className = 'room-extra-grid';
      plan.extra.forEach((id) => {
        const room = getRoom(id);
        if (!room) return;
        const button = makeButton(String(id), String(id), room);
        const dungeon = room.dungeon !== undefined ? getDungeonName(room.dungeon) : getKindLabel(room.kind);
        button.title = `${t('roomNumber', { room: id })} · ${dungeon}`;
        grid.appendChild(button);
      });
      group.append(summary, note, grid);
      container.appendChild(group);
    }
  }

  root.WMSkyRooms = {
    getRoom,
    hasRoom,
    getRoomPlan,
    getKindLabel,
    getRoomOrdinal,
    renderMap,
    renderThumbnail,
    renderLegend,
    renderPicker,
    describeRoom,
    describeBoxContents,
    getBoxTable,
    hasDungeonBoxes,
    isWithoutTreasure,
    getMemoExample
  };
})(typeof window !== 'undefined' ? window : globalThis);
