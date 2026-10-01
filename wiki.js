/*
  Wiki: strumenti, Pokémon e dungeon con i dati del gioco, in una finestra sopra al generatore.
  Si apre e si chiude senza toccare il modulo; i pulsanti "Usa..." portano una voce nella missione
  (con Annulla, come gli altri punti di partenza). Usa le funzioni di app.js, che viene caricato prima.
*/

const WIKI_TABS = ['items', 'pokemon', 'dungeons', 'iq', 'traps', 'abilities', 'moves'];
const WIKI_PLACES_SHOWN = 12;
const WIKI_FLOOR_ITEMS_SHOWN = 12;
// Luoghi di un piano in cui compaiono strumenti: colonna di WMSkyFloors.byDungeon e campo del piano che dice
// se il luogo può esserci (a terra ci sono sempre).
const WIKI_ITEM_PLACES = [
  { key: 'ground', column: 3, layoutField: null },
  { key: 'shop', column: 4, layoutField: 'kecleonShop' },
  { key: 'house', column: 5, layoutField: 'monsterHouse' },
  { key: 'buried', column: 6, layoutField: 'buriedDensity' }
];

let wikiIndex = null;
const wikiState = {
  tab: 'items',
  query: '',
  itemGroup: -1,
  selected: { items: null, pokemon: null, dungeons: null, iq: null, traps: null, abilities: null, moves: null },
  floor: 1,
  history: [],
  lastFocus: null
};

// ---------------------------------------------------------------------------
// Indice: dove si trova ogni strumento e ogni Pokémon, piano per piano
// ---------------------------------------------------------------------------

function isWikiRealName(name) {
  return !!name && !/^\?+$/.test(name) && !/^reserve_/i.test(name);
}

function wikiNamesIn(list, id) {
  return ['it', 'en'].map((lang) => {
    const text = getGameText(lang);
    return (text && text[list] && text[list][id]) || '';
  }).join(' ');
}

function buildWikiIndex() {
  const floors = window.WMSkyFloors || {};
  const game = window.WMSkyGameData || {};
  const itText = getGameText('it') || {};
  const itemPlaces = new Map();
  const monPlaces = new Map();
  const trapPlaces = new Map();
  const dungeons = [];

  const addTo = (map, id, dungeon) => {
    if (!map.has(id)) map.set(id, new Map());
    const byDungeon = map.get(id);
    if (!byDungeon.has(dungeon)) byDungeon.set(dungeon, []);
    return byDungeon.get(dungeon);
  };

  Object.keys(floors.byDungeon || {}).forEach((key) => {
    const dungeon = parseInt(key, 10);
    const row = floors.byDungeon[key];
    if (!Array.isArray(row) || !isWikiRealName(itText.dungeons && itText.dungeons[dungeon])) return;
    let floorCount = 0;
    row.forEach((entry, index) => {
      if (!Array.isArray(entry)) return;
      const floor = index + 1;
      floorCount = floor;
      const layout = floors.layouts[entry[0]] || [];
      const layoutValue = (field) => layout[floors.layoutFields.indexOf(field)];
      (floors.monsters[entry[1]] || []).forEach(([monId, level, chance]) => {
        addTo(monPlaces, monId % 600, dungeon).push([floor, level, chance]);
      });
      // Senza trappole (densità 0) l'elenco dei pesi non conta.
      if (layoutValue('trapDensity') > 0) {
        (floors.traps[entry[2]] || []).forEach(([trapId, chance]) => {
          addTo(trapPlaces, trapId, dungeon).push([floor, chance]);
        });
      }
      WIKI_ITEM_PLACES.forEach((place) => {
        if (place.layoutField && !(layoutValue(place.layoutField) > 0)) return;
        (floors.items[entry[place.column]] || []).forEach(([itemId, chance]) => {
          const list = addTo(itemPlaces, itemId, dungeon);
          list.push([place.key, floor, chance]);
        });
      });
    });
    if (floorCount) dungeons.push({ id: dungeon, floors: floorCount });
  });

  const items = (game.validItems || [])
    .filter((id) => id > 0 && isWikiRealName(itText.items && itText.items[id]))
    .map((id) => ({ id, group: getItemGroupIndex(id) }));

  const traps = ((itText.traps || []).map((name, id) => ({ id, name })))
    .filter(({ id, name }) => id > 0 && isWikiRealName(name))
    .map(({ id }) => ({ id }));

  // Abilità: quali Pokémon (della Wiki) la hanno.
  const abilityMons = new Map();
  const monInfo = game.monsterInfo || null;
  const abilityEntries = ((itText.abilityNames || []).map((name, id) => ({ id, name })))
    .filter(({ id, name }) => id > 0 && isWikiRealName(name) && !String(name).startsWith('$'))
    .map(({ id }) => ({ id }));

  const dex = game.nationalDex || [];
  const iqData = game.iq || null;
  const pokemon = [];
  for (let id = 1; id <= WMSGenData.lastRegularPokemon; id++) {
    if (isWikiRealName(itText.pokemon && itText.pokemon[id])) {
      pokemon.push({ id, dex: dex[id] || 0, iqGroup: iqData ? iqData.monsterGroup[id] : -1 });
    }
  }
  pokemon.sort((a, b) => (a.dex || 9999) - (b.dex || 9999) || a.id - b.id);
  if (monInfo) {
    pokemon.forEach((entry) => {
      new Set(monInfo.abilities[entry.id] || []).forEach((ability) => {
        if (!ability) return;
        if (!abilityMons.has(ability)) abilityMons.set(ability, []);
        abilityMons.get(ability).push(entry.id);
      });
    });
  }

  // Mosse: quali Pokémon (della Wiki) le imparano e come (livello, MT/MN, uovo).
  const moveData = game.moves || null;
  const moveLearners = new Map();
  const moves = [];
  if (moveData) {
    (itText.moveNames || []).forEach((name, id) => {
      if (id > 0 && id < moveData.data.length && isWikiRealName(name)) moves.push({ id });
    });
    pokemon.forEach((entry) => {
      const learn = moveData.learn[entry.id];
      if (!learn) return;
      const add = (moveId, kind, level) => {
        if (!moveLearners.has(moveId)) moveLearners.set(moveId, { level: [], tm: [], egg: [] });
        moveLearners.get(moveId)[kind].push(kind === 'level' ? [entry.id, level] : entry.id);
      };
      for (let i = 0; i < learn[0].length; i += 2) add(learn[0][i], 'level', learn[0][i + 1]);
      learn[1].forEach((moveId) => add(moveId, 'tm'));
      learn[2].forEach((moveId) => add(moveId, 'egg'));
    });
  }

  // Abilità QI: quali Pokémon stanno in ogni gruppo QI e in quali gruppi compare ogni abilità.
  const groupMons = new Map();
  pokemon.forEach((entry) => {
    if (!(entry.iqGroup >= 0)) return;
    if (!groupMons.has(entry.iqGroup)) groupMons.set(entry.iqGroup, []);
    groupMons.get(entry.iqGroup).push(entry.id);
  });
  const skillGroups = new Map();
  if (iqData) {
    iqData.groups.forEach((skills, group) => {
      if (!groupMons.has(group)) return;
      skills.forEach((skill) => {
        if (!skillGroups.has(skill)) skillGroups.set(skill, []);
        skillGroups.get(skill).push(group);
      });
    });
  }
  const iq = Array.from(skillGroups.keys())
    .map((id) => ({ id, key: wikiIqSortKey(id) }))
    .sort((a, b) => a.key - b.key || a.id - b.id);

  return {
    items,
    pokemon,
    monIds: new Set(pokemon.map((entry) => entry.id)),
    dungeons,
    iq,
    traps,
    abilities: abilityEntries,
    abilityMons,
    moves,
    moveLearners,
    trapPlaces,
    groupMons,
    skillGroups,
    itemPlaces,
    monPlaces,
    clients: new Set(game.missionClients || []),
    targets: new Set(game.missionTargets || [])
  };
}

function getWikiIndex() {
  if (!wikiIndex) wikiIndex = buildWikiIndex();
  return wikiIndex;
}

// ---------------------------------------------------------------------------
// Nomi e testi
// ---------------------------------------------------------------------------

const WIKI_NAME_LISTS = { items: 'items', pokemon: 'pokemon', dungeons: 'dungeons', iq: 'iqNames', traps: 'traps', abilities: 'abilityNames', moves: 'moveNames' };
// Schede con una descrizione ufficiale: si cerca anche lì.
const WIKI_DESCRIPTION_LISTS = { iq: 'iqDescriptions', traps: 'trapDescriptions', abilities: 'abilityDescriptions', moves: 'moveDescriptions' };

function wikiEntryName(tab, id) {
  if (tab === 'items') return getItemDisplayName(id);
  if (tab === 'pokemon') return getLocalizedPokemonName(id);
  if (tab === 'iq') return (getGameText()?.iqNames || [])[id] || '';
  if (tab === 'traps') return (getGameText()?.traps || [])[id] || '';
  if (tab === 'abilities') return (getGameText()?.abilityNames || [])[id] || '';
  if (tab === 'moves') return (getGameText()?.moveNames || [])[id] || '';
  return getDungeonName(id);
}

function wikiMonInfo() {
  return window.WMSkyGameData?.monsterInfo || null;
}

function wikiRealAbility(abilityId) {
  const name = (getGameText()?.abilityNames || [])[abilityId];
  return abilityId > 0 && isWikiRealName(name) && !String(name).startsWith('$');
}

// Un Pokémon si cerca anche per tipo e per abilità ("elettro", "static").
function wikiPokemonExtraSearch(monId) {
  const info = wikiMonInfo();
  if (!info) return '';
  const parts = [];
  (info.types[monId] || []).forEach((type) => { if (type) parts.push(wikiNamesIn('types', type)); });
  (info.abilities[monId] || []).forEach((ability) => { if (wikiRealAbility(ability)) parts.push(wikiNamesIn('abilityNames', ability)); });
  return ` ${parts.join(' ')}`;
}

// Abilità QI e trappole si cercano anche per effetto ("brutti colpi", "sonno"...).
function wikiEntrySearchText(tab, id) {
  let extra = WIKI_DESCRIPTION_LISTS[tab] ? ` ${wikiNamesIn(WIKI_DESCRIPTION_LISTS[tab], id)}` : '';
  if (tab === 'pokemon') extra = wikiPokemonExtraSearch(id);
  return normalizeSearchText(`${wikiEntryName(tab, id)} ${wikiNamesIn(WIKI_NAME_LISTS[tab], id)}${extra}`);
}

function wikiOtherName(tab, id) {
  const other = getOtherLanguageText(WIKI_NAME_LISTS[tab], id);
  const current = tab === 'items' ? getItemName(id) : tab === 'pokemon' ? (getGameText()?.pokemon?.[id] || '') : wikiEntryName(tab, id);
  return other && other !== current ? other : '';
}

// ---------------------------------------------------------------------------
// Abilità QI
// ---------------------------------------------------------------------------

function wikiIqData() {
  return window.WMSkyGameData?.iq || null;
}

// Gruppi QI: A, B, C... come l'ordine delle tabelle del gioco.
function wikiIqGroupLabel(group) {
  return String.fromCharCode(65 + group);
}

function wikiIqIsStory(skillId) {
  return !!wikiIqData()?.story.includes(skillId);
}

// Ordine degli elenchi: prima ciò che c'è subito o dalla storia, poi per QI crescente.
function wikiIqSortKey(skillId) {
  const iq = wikiIqData();
  if (!iq) return 0;
  if (iq.story.includes(skillId)) return -1;
  return iq.thresholds[skillId];
}

function wikiIqRequirement(skillId, long) {
  if (wikiIqIsStory(skillId)) return t('wikiIqStory');
  const needed = wikiIqData().thresholds[skillId];
  if (needed < 0) return t('wikiIqAlways');
  return long ? t('wikiIqNeededLong', { iq: needed }) : t('wikiIqNeeded', { iq: needed });
}

// Abilità che non si possono attivare insieme a questa (stesso numero in IQ_SKILL_RESTRICTIONS).
function wikiIqExclusiveWith(skillId) {
  const iq = wikiIqData();
  const group = iq.restrictions[skillId];
  return getWikiIndex().iq
    .map((entry) => entry.id)
    .filter((id) => id !== skillId && iq.restrictions[id] === group);
}

// "1-4, 7, 9-10"
function wikiFloorRanges(floors) {
  const sorted = Array.from(new Set(floors)).sort((a, b) => a - b);
  const parts = [];
  let start = null;
  let prev = null;
  sorted.forEach((floor) => {
    if (start === null) {
      start = floor;
    } else if (floor !== prev + 1) {
      parts.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = floor;
    }
    prev = floor;
  });
  if (start !== null) parts.push(start === prev ? `${start}` : `${start}-${prev}`);
  return parts.join(', ');
}

function wikiFloorCountText(count) {
  return count === 1 ? t('wikiFloorCountOne') : t('wikiFloorCount', { count });
}

function wikiPlaceLabel(key) {
  const places = floorGameText('floorPlaces') || {};
  if (key === 'shop') return t('floorShopItems', { place: places.kecleonShop || 'Kecleon' });
  if (key === 'house') return t('floorHouseItems', { place: places.monsterHouse || '' });
  if (key === 'buried') return t('floorBuriedItems');
  return t('floorItems');
}

function wikiRankOf(dungeon, floor) {
  const ranks = window.WMSkyGameData && window.WMSkyGameData.missionRanks && window.WMSkyGameData.missionRanks[dungeon];
  const rankId = ranks ? parseInt(ranks[floor - 1], 10) : NaN;
  return Number.isFinite(rankId) ? MISSION_DIFFICULTY_RANKS[rankId] : '';
}

// ---------------------------------------------------------------------------
// Elementi dell'interfaccia
// ---------------------------------------------------------------------------

function wikiEl(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function wikiImage(tab, id, className) {
  const name = wikiEntryName(tab, id);
  if (tab === 'items') return createFallbackImage(getItemImage(id, name, true), className);
  if (tab === 'pokemon') return createFallbackImage(getPokemonImage(id, name), className);
  const theme = tab === 'iq' ? 'reward' : (tab === 'traps' || tab === 'moves') ? 'item' : 'pokemon';
  return createFallbackImage({ src: buildPreviewBadge(name, theme), fallback: '' }, className);
}

// Collegamento a un'altra voce della Wiki (dungeon, Pokémon, strumento).
function wikiLink(tab, id, text, floor) {
  const button = wikiEl('button', 'wiki-link', text);
  button.type = 'button';
  button.addEventListener('click', () => wikiGo(tab, id, floor));
  return button;
}

function wikiSection(title, count) {
  const section = wikiEl('section', 'wiki-section');
  const head = wikiEl('h3', 'wiki-section-title', title);
  if (Number.isFinite(count)) head.append(wikiEl('span', 'wiki-count', ` ${count}`));
  section.append(head);
  return section;
}

// Elenco lungo: i primi `shown` visibili, gli altri in un <details>.
function wikiAppendList(parent, rows, shown, moreLabel) {
  const list = wikiEl('ul', 'wiki-rows');
  rows.slice(0, shown).forEach((row) => list.append(row));
  parent.append(list);
  if (rows.length > shown) {
    const more = wikiEl('details', 'wiki-more');
    more.append(wikiEl('summary', '', moreLabel(rows.length - shown)));
    const extra = wikiEl('ul', 'wiki-rows');
    rows.slice(shown).forEach((row) => extra.append(row));
    more.append(extra);
    parent.append(more);
  }
}

// Primo piano utilizzabile in una missione: quello preferito se va bene, altrimenti il più basso tra quelli dati.
function wikiUsableFloor(dungeonId, floors, preferred) {
  const missionFloors = window.WMSkyGameData?.missionFloors?.[dungeonId];
  if (!(missionFloors >= 1) || !document.querySelector(`#dungeonBox option[value="${dungeonId}"]`)) return 0;
  const limit = getDungeonFloorLimit(dungeonId);
  const forbidden = WMSGen.getForbiddenFloors(dungeonId);
  const ok = (floor) => floor <= limit && !forbidden.includes(floor);
  if (ok(preferred)) return preferred;
  return floors.slice().sort((a, b) => a - b).find(ok) || 0;
}

// «Missione qui»: porta nel modulo questa voce come obiettivo, nel dungeon e piano della riga.
function wikiMissionHereButton(kind, id, dungeonId, floors, preferred, fieldHint) {
  const floor = wikiUsableFloor(dungeonId, floors, preferred);
  const button = wikiEl('button', 'ghost wiki-row-action', t('wikiMissionHere'));
  button.type = 'button';
  const hint = fieldHint || (floor ? '' : t('wikiMissionHereUnusable'));
  if (hint) {
    button.disabled = true;
    button.title = hint;
  } else {
    button.title = t('wikiMissionHereTitle', { name: wikiEntryName(kind, id), floor });
    button.addEventListener('click', () => wikiUseHere(kind, id, dungeonId, floor));
  }
  return button;
}

function wikiActionButton(text, action, disabledHint) {
  const button = wikiEl('button', 'wiki-action', text);
  button.type = 'button';
  if (disabledHint) {
    button.disabled = true;
    button.title = disabledHint;
  }
  button.addEventListener('click', action);
  return button;
}

// ---------------------------------------------------------------------------
// Elenco a sinistra
// ---------------------------------------------------------------------------

function getWikiEntries(tab, query = wikiState.query) {
  const index = getWikiIndex();
  const normalized = normalizeSearchText(String(query || '').trim());
  let entries = index[tab];
  if (tab === 'items' && wikiState.itemGroup >= 0) {
    entries = entries.filter((entry) => entry.group === wikiState.itemGroup);
  }
  if (normalized) {
    entries = entries.filter((entry) => wikiEntrySearchText(tab, entry.id).includes(normalized));
  }
  if (tab === 'items') {
    entries = entries.slice().sort((a, b) => a.group - b.group || a.id - b.id);
  }
  if ((WIKI_DESCRIPTION_LISTS[tab] || tab === 'pokemon') && normalized) {
    // Prima chi ha la parola nel nome, poi chi ce l'ha nell'effetto.
    const inName = (entry) => normalizeSearchText(`${wikiEntryName(tab, entry.id)} ${wikiNamesIn(WIKI_NAME_LISTS[tab], entry.id)}`).includes(normalized) ? 0 : 1;
    entries = entries.slice().sort((a, b) => inName(a) - inName(b));
  }
  return entries;
}

function renderWikiTabs() {
  WIKI_TABS.forEach((tab) => {
    const button = document.getElementById(`wikiTab-${tab}`);
    if (!button) return;
    const active = tab === wikiState.tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
    const count = button.querySelector('.wiki-tab-count');
    // Con una ricerca le schede dicono quante voci trovano, così si vede subito dove guardare.
    if (count) count.textContent = wikiState.query.trim() ? String(getWikiEntries(tab).length) : '';
  });
}

function renderWikiGroups() {
  const box = document.getElementById('wikiGroups');
  if (!box) return;
  box.hidden = wikiState.tab !== 'items';
  if (box.hidden) return;
  box.textContent = '';
  const groups = [-1].concat(ITEM_GROUPS.map((_, index) => index));
  groups.forEach((group) => {
    const chip = wikiEl('button', `chip wiki-group${group === wikiState.itemGroup ? ' active' : ''}`,
      group < 0 ? t('wikiAll') : getItemGroupLabel(group));
    chip.type = 'button';
    chip.setAttribute('aria-pressed', group === wikiState.itemGroup ? 'true' : 'false');
    chip.addEventListener('click', () => {
      wikiState.itemGroup = group;
      renderWikiList();
      renderWikiGroups();
    });
    box.append(chip);
  });
}

function renderWikiList() {
  const list = document.getElementById('wikiList');
  if (!list) return;
  const tab = wikiState.tab;
  const entries = getWikiEntries(tab);
  const index = getWikiIndex();
  list.textContent = '';
  document.getElementById('wikiEmpty').hidden = entries.length > 0;
  let lastGroup;
  let section = list;
  entries.forEach((entry) => {
    if (tab === 'items' && entry.group !== lastGroup) {
      section = wikiEl('div', 'search-section');
      section.append(wikiEl('div', 'search-group', getItemGroupLabel(entry.group)));
      list.append(section);
      lastGroup = entry.group;
    }
    const button = wikiEl('button', 'wiki-entry');
    button.type = 'button';
    button.dataset.id = String(entry.id);
    if (wikiState.selected[tab] === entry.id) button.classList.add('selected');
    const image = wikiImage(tab, entry.id, 'wiki-entry-icon');
    image.loading = 'lazy';
    const copy = wikiEl('span', 'wiki-entry-copy');
    copy.append(wikiEl('span', 'wiki-entry-name', wikiEntryName(tab, entry.id)));
    let meta = '';
    if (tab === 'items') meta = getItemShortDescription(entry.id);
    else if (tab === 'pokemon') {
      const places = index.monPlaces.get(entry.id);
      let where = t('wikiNotInDungeons');
      if (places) where = places.size === 1 ? t('wikiInDungeonsOne') : t('wikiInDungeons', { count: places.size });
      const typeNames = wikiTypeNames(entry.id).join('/');
      meta = [entry.dex ? `#${String(entry.dex).padStart(3, '0')}` : '', typeNames, where].filter(Boolean).join(' · ');
    } else if (tab === 'iq') {
      meta = wikiIqRequirement(entry.id);
    } else if (tab === 'abilities') {
      const count = (index.abilityMons.get(entry.id) || []).length;
      meta = !count ? t('wikiAbilityNobody') : count === 1 ? t('wikiAbilityMonsOne') : t('wikiAbilityMons', { count });
    } else if (tab === 'moves') {
      meta = wikiMoveSummary(entry.id);
    } else if (tab === 'traps') {
      const places = index.trapPlaces.get(entry.id);
      meta = !places ? t('wikiTrapNotOnFloors')
        : places.size === 1 ? t('wikiInDungeonsOne') : t('wikiInDungeons', { count: places.size });
    } else {
      meta = wikiFloorCountText(entry.floors);
    }
    if (meta) copy.append(wikiEl('span', 'wiki-entry-meta', meta));
    button.append(image, copy);
    button.addEventListener('click', () => wikiSelect(tab, entry.id, { fromList: true }));
    section.append(button);
  });
  document.getElementById('wikiResultCount').textContent = entries.length === 1
    ? t('wikiResultsOne') : t('wikiResults', { count: entries.length });
}

// ---------------------------------------------------------------------------
// Scheda di una voce
// ---------------------------------------------------------------------------

function wikiHeader(tab, id, subtitle) {
  const head = wikiEl('header', 'wiki-detail-head');
  const frame = wikiEl('span', `wiki-detail-frame wiki-frame-${tab}`);
  frame.append(wikiImage(tab, id, 'wiki-detail-icon'));
  const copy = wikiEl('div', 'wiki-detail-copy');
  if (subtitle) copy.append(wikiEl('p', 'wiki-kicker', subtitle));
  copy.append(wikiEl('h2', 'wiki-detail-title', wikiEntryName(tab, id)));
  const other = wikiOtherName(tab, id);
  if (other) copy.append(wikiEl('p', 'wiki-other-name', other));
  const share = wikiEl('button', 'ghost wiki-copy-link', t('wikiCopyLink'));
  share.type = 'button';
  share.title = t('wikiCopyLinkTitle');
  share.addEventListener('click', () => wikiCopyLink(share));
  head.append(frame, copy, share);
  return head;
}

function renderItemDetail(root, itemId) {
  const index = getWikiIndex();
  root.append(wikiHeader('items', itemId, getItemGroupLabel(getItemGroupIndex(itemId))));
  root.append(wikiEl('p', 'wiki-description', getItemEffectDescription(itemId)));

  const actions = wikiEl('div', 'wiki-actions');
  actions.append(wikiActionButton(t('wikiUseReward'), () => wikiUseItem('rewardItemBox', itemId)));
  const targetVisible = !document.getElementById('targetItemField')?.classList.contains('hidden');
  actions.append(wikiActionButton(t('wikiUseTargetItem'), () => wikiUseItem('targetItemBox', itemId),
    targetVisible ? '' : t('wikiTargetItemUnused')));
  if (window.WMSkyRooms && WMSkyRooms.getFarmRewards().includes(itemId)) {
    actions.append(wikiActionButton(t('wikiFindReward'), () => wikiFindReward(itemId)));
  }
  root.append(actions);

  const places = index.itemPlaces.get(itemId);
  if (!places) {
    root.append(wikiEl('p', 'hint', t('wikiItemNowhere')));
    return;
  }
  WIKI_ITEM_PLACES.forEach((place) => {
    const rows = [];
    places.forEach((list, dungeon) => {
      const found = list.filter(([key]) => key === place.key);
      if (!found.length) return;
      const best = found.reduce((max, [, floor, chance]) => (chance > max.chance ? { floor, chance } : max), { floor: 0, chance: -1 });
      const row = wikiEl('li', 'wiki-row');
      row.append(wikiLink('dungeons', dungeon, getDungeonName(dungeon), best.floor));
      row.append(wikiEl('span', 'wiki-row-meta', `${t('wikiFloors', { floors: wikiFloorRanges(found.map(([, floor]) => floor)) })} · ${t('wikiUpTo', { chance: formatChance(best.chance) })}`));
      row.append(wikiMissionHereButton('items', itemId, dungeon, found.map(([, floor]) => floor), best.floor,
        targetVisible ? '' : t('wikiTargetItemUnused')));
      rows.push(row);
    });
    if (!rows.length) return;
    const section = wikiSection(wikiPlaceLabel(place.key), rows.length);
    wikiAppendList(section, rows, WIKI_PLACES_SHOWN, (count) => t('wikiMoreDungeons', { count }));
    root.append(section);
  });
}

function renderPokemonDetail(root, monId) {
  const index = getWikiIndex();
  const dex = (window.WMSkyGameData?.nationalDex || [])[monId];
  root.append(wikiHeader('pokemon', monId, dex ? `#${String(dex).padStart(3, '0')}` : ''));

  const typeRow = wikiTypeChips(monId);
  if (typeRow) root.append(typeRow);

  const badges = wikiEl('p', 'wiki-badges');
  badges.append(wikiEl('span', `wiki-badge${index.clients.has(monId) ? '' : ' off'}`,
    index.clients.has(monId) ? t('wikiClientOk') : t('wikiClientNo')));
  badges.append(wikiEl('span', `wiki-badge${index.targets.has(monId) ? '' : ' off'}`,
    index.targets.has(monId) ? t('wikiTargetOk') : t('wikiTargetNo')));
  root.append(badges);

  const actions = wikiEl('div', 'wiki-actions');
  actions.append(wikiActionButton(t('wikiUseClient'), () => wikiUsePokemon('clientBox', 'clientF', monId),
    document.getElementById('clientField')?.classList.contains('field-preview-only') ? t('wikiFieldFixed') : ''));
  const targetField = document.getElementById('targetField');
  const targetFree = targetField && !targetField.classList.contains('hidden') && !targetField.classList.contains('field-preview-only');
  actions.append(wikiActionButton(t('wikiUseTarget'), () => wikiUsePokemon('targetBox', 'targetF', monId),
    targetFree ? '' : t('wikiFieldFixed')));
  root.append(actions);

  renderPokemonAbilities(root, monId);
  renderPokemonStats(root, monId);
  renderPokemonEvolution(root, monId);
  renderPokemonMoves(root, monId);
  renderPokemonIq(root, monId);

  const places = index.monPlaces.get(monId);
  if (!places) {
    root.append(wikiEl('p', 'hint', t('wikiPokemonNowhere')));
    return;
  }
  const rows = [];
  places.forEach((list, dungeon) => {
    const levels = list.map(([, level]) => level);
    const best = list.reduce((max, [floor, , chance]) => (chance > max.chance ? { floor, chance } : max), { floor: 0, chance: -1 });
    const minLevel = Math.min(...levels);
    const maxLevel = Math.max(...levels);
    const row = wikiEl('li', 'wiki-row');
    row.append(wikiLink('dungeons', dungeon, getDungeonName(dungeon), best.floor));
    row.append(wikiEl('span', 'wiki-row-meta', [
      t('wikiFloors', { floors: wikiFloorRanges(list.map(([floor]) => floor)) }),
      minLevel === maxLevel ? t('floorLevel', { level: minLevel }) : t('wikiLevels', { min: minLevel, max: maxLevel }),
      t('wikiUpTo', { chance: formatChance(best.chance) })
    ].join(' · ')));
    row.append(wikiMissionHereButton('pokemon', monId, dungeon, list.map(([floor]) => floor), best.floor,
      targetFree ? '' : t('wikiFieldFixed')));
    rows.push(row);
  });
  const section = wikiSection(t('wikiWhereFound'), rows.length);
  wikiAppendList(section, rows, WIKI_PLACES_SHOWN, (count) => t('wikiMoreDungeons', { count }));
  root.append(section);
}

// ---------------------------------------------------------------------------
// Tipi, abilità, statistiche ed evoluzione di un Pokémon
// ---------------------------------------------------------------------------

// Colori dei tipi, per ID del tipo (0 = nessuno, 18 = neutro).
const WIKI_TYPE_COLORS = ['', '#c2c2a1', '#f5894a', '#7aa2f7', '#7ed957', '#f8d030', '#9ee3e3', '#d9534f', '#c06ac0',
  '#e6c875', '#b7a6f5', '#fb7aa0', '#b6c93a', '#c9b04a', '#8b73b8', '#8a5cf7', '#8a7060', '#c4c4d8', '#9a9a9a'];

function wikiTypeNames(monId) {
  const info = wikiMonInfo();
  const names = getGameText()?.types || [];
  return info ? (info.types[monId] || []).filter((type) => type > 0 && names[type]).map((type) => names[type]) : [];
}

function wikiTypeChips(monId) {
  const info = wikiMonInfo();
  const names = getGameText()?.types || [];
  const types = info ? (info.types[monId] || []).filter((type) => type > 0 && names[type]) : [];
  if (!types.length) return null;
  const row = wikiEl('p', 'wiki-types');
  Array.from(new Set(types)).forEach((type) => row.append(wikiTypeChip(type)));
  return row;
}

function wikiTypeChip(type) {
  const chip = wikiEl('span', 'wiki-type', (getGameText()?.types || [])[type] || '');
  chip.style.setProperty('--type-color', WIKI_TYPE_COLORS[type] || '#9a9a9a');
  return chip;
}

// La descrizione del gioco comincia con il nome ("Statico: ..."): si toglie, il nome è già il titolo.
function wikiAbilityDescription(abilityId) {
  const text = getGameText();
  const name = (text?.abilityNames || [])[abilityId] || '';
  const description = String((text?.abilityDescriptions || [])[abilityId] || '').replace(/\s+/g, ' ').trim();
  return description.startsWith(`${name}:`) ? description.slice(name.length + 1).trim() : description;
}

// Scheda di un'abilità: effetto e Pokémon che la hanno.
function renderAbilityDetail(root, abilityId) {
  const mons = getWikiIndex().abilityMons.get(abilityId) || [];
  root.append(wikiHeader('abilities', abilityId, ''));
  root.append(wikiEl('p', 'wiki-description', wikiAbilityDescription(abilityId)));
  const section = wikiSection(t('wikiAbilityWho'), mons.length);
  if (!mons.length) {
    section.append(wikiEl('p', 'hint', t('wikiAbilityNobodyText')));
  } else {
    const chips = wikiEl('div', 'wiki-chips');
    mons.forEach((monId) => chips.append(wikiLink('pokemon', monId, wikiEntryName('pokemon', monId))));
    section.append(chips);
  }
  root.append(section);
}

// ---------------------------------------------------------------------------
// Mosse
// ---------------------------------------------------------------------------

function wikiMoveData(moveId) {
  const row = window.WMSkyGameData?.moves?.data[moveId];
  return row ? { power: row[0], type: row[1], category: row[2], pp: row[3], accuracy: row[4] } : null;
}

function wikiMoveCategory(category) {
  return [t('wikiMovePhysical'), t('wikiMoveSpecial'), t('wikiMoveStatus')][category] || '';
}

// Valori della tabella delle mosse: sopra il 100% la mossa non sbaglia mai.
function wikiMoveAccuracy(accuracy) {
  return accuracy > 100 ? t('wikiMoveNeverMisses') : `${accuracy}%`;
}

// Riga breve per elenchi: tipo · categoria · potenza · PP.
function wikiMoveSummary(moveId) {
  const move = wikiMoveData(moveId);
  if (!move) return '';
  const typeName = (getGameText()?.types || [])[move.type] || '';
  return [typeName, wikiMoveCategory(move.category), move.power > 0 ? t('wikiMovePowerValue', { power: move.power }) : '',
    t('wikiMovePpValue', { pp: move.pp })].filter(Boolean).join(' · ');
}

function wikiMoveLearnerGroup(parent, title, chipsData, open) {
  if (!chipsData.length) return;
  const details = wikiEl('details', 'wiki-more wiki-iq-group');
  details.open = open;
  details.append(wikiEl('summary', '', `${title} · ${chipsData.length}`));
  const chips = wikiEl('div', 'wiki-chips');
  chipsData.forEach(({ monId, level }) => {
    const name = wikiEntryName('pokemon', monId);
    chips.append(wikiLink('pokemon', monId, level ? `${name} · ${t('floorLevel', { level })}` : name));
  });
  details.append(chips);
  parent.append(details);
}

// Scheda di una mossa: tipo, valori, effetto e Pokémon che la imparano.
function renderMoveDetail(root, moveId) {
  const move = wikiMoveData(moveId);
  const text = getGameText();
  root.append(wikiHeader('moves', moveId, ''));
  if (move) {
    const row = wikiEl('p', 'wiki-types');
    row.append(wikiTypeChip(move.type), wikiEl('span', 'wiki-badge', wikiMoveCategory(move.category)));
    root.append(row);
  }
  const description = (text?.moveDescriptions || [])[moveId];
  root.append(wikiEl('p', description ? 'wiki-description' : 'hint', description || t('wikiMoveNoDescription')));
  if (move) {
    const list = wikiEl('ul', 'floor-stats wiki-floor-stats');
    list.append(makeFloorStat(t('wikiMovePower'), move.power > 0 ? String(move.power) : '—'));
    list.append(makeFloorStat(t('wikiMovePp'), String(move.pp)));
    list.append(makeFloorStat(t('wikiMoveAccuracy'), wikiMoveAccuracy(move.accuracy)));
    const range = (text?.moveRanges || [])[moveId];
    if (range) list.append(makeFloorStat(t('wikiMoveRange'), range));
    root.append(list, wikiEl('p', 'hint', t('wikiMoveHint')));
  }
  const learners = getWikiIndex().moveLearners.get(moveId);
  const section = wikiSection(t('wikiMoveLearners'));
  if (!learners) {
    section.append(wikiEl('p', 'hint', t('wikiMoveNobody')));
  } else {
    wikiMoveLearnerGroup(section, t('wikiMoveByLevel'), learners.level.map(([monId, level]) => ({ monId, level })), learners.level.length <= 40);
    wikiMoveLearnerGroup(section, t('wikiMoveByTm'), learners.tm.map((monId) => ({ monId })), false);
    wikiMoveLearnerGroup(section, t('wikiMoveByEgg'), learners.egg.map((monId) => ({ monId })), learners.egg.length <= 40);
  }
  root.append(section);
}

// Mosse di un Pokémon: salendo di livello (con il livello), con MT/MN e da uovo.
function renderPokemonMoves(root, monId) {
  const learn = window.WMSkyGameData?.moves?.learn[monId];
  const names = getGameText()?.moveNames || [];
  if (!learn) return;
  const real = (moveId) => moveId > 0 && isWikiRealName(names[moveId]);
  const levelUp = [];
  for (let i = 0; i < learn[0].length; i += 2) if (real(learn[0][i])) levelUp.push([learn[0][i], learn[0][i + 1]]);
  const tm = learn[1].filter(real);
  const egg = learn[2].filter(real);
  if (!levelUp.length && !tm.length && !egg.length) return;
  const section = wikiSection(t('wikiMoves'), levelUp.length + tm.length + egg.length);
  const addGroup = (title, entries, open) => {
    if (!entries.length) return;
    const details = wikiEl('details', 'wiki-more wiki-iq-group');
    details.open = open;
    details.append(wikiEl('summary', '', `${title} · ${entries.length}`));
    const list = wikiEl('ul', 'wiki-rows');
    entries.forEach(([moveId, level]) => {
      const row = wikiEl('li', 'wiki-row');
      row.append(wikiLink('moves', moveId, level ? `${t('floorLevel', { level })} · ${names[moveId]}` : names[moveId]));
      row.append(wikiEl('span', 'wiki-row-meta', wikiMoveSummary(moveId)));
      list.append(row);
    });
    details.append(list);
    section.append(details);
  };
  addGroup(t('wikiMoveByLevel'), levelUp, true);
  addGroup(t('wikiMoveByTm'), tm.map((moveId) => [moveId, 0]), false);
  addGroup(t('wikiMoveByEgg'), egg.map((moveId) => [moveId, 0]), false);
  root.append(section);
}

function renderPokemonAbilities(root, monId) {
  const info = wikiMonInfo();
  const text = getGameText();
  const abilities = info ? Array.from(new Set(info.abilities[monId] || [])).filter(wikiRealAbility) : [];
  if (!abilities.length) return;
  const section = wikiSection(t('wikiAbilities'), abilities.length);
  const list = wikiEl('ul', 'wiki-rows');
  abilities.forEach((abilityId) => {
    const name = text.abilityNames[abilityId];
    const description = wikiAbilityDescription(abilityId);
    const row = wikiEl('li', 'wiki-row wiki-ability');
    row.append(wikiLink('abilities', abilityId, name));
    if (description) row.append(wikiEl('span', 'wiki-row-meta', description));
    list.append(row);
  });
  section.append(list);
  root.append(section);
}

// Statistiche della tabella dei Pokémon: i valori di partenza, che poi crescono con i livelli.
function renderPokemonStats(root, monId) {
  const info = wikiMonInfo();
  const stats = info && info.stats[monId];
  if (!stats || !stats.some((value) => value > 0)) return;
  const section = wikiSection(t('wikiStatsTitle'));
  const list = wikiEl('ul', 'floor-stats wiki-floor-stats');
  const labels = [t('wikiStatHp'), t('wikiStatAtk'), t('wikiStatSpAtk'), t('wikiStatDef'), t('wikiStatSpDef')];
  const values = labels.map((label, position) => {
    const item = makeFloorStat(label, String(stats[position]));
    list.append(item);
    return item.querySelector('strong');
  });
  const growth = wikiGrowthTable(monId);
  if (growth) {
    const control = wikiEl('label', 'wiki-level');
    const output = wikiEl('output', 'wiki-level-value', '1');
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '1';
    slider.max = String(WIKI_MAX_LEVEL);
    slider.value = '1';
    slider.addEventListener('input', () => {
      const level = parseInt(slider.value, 10);
      output.textContent = String(level);
      values.forEach((strong, position) => { strong.textContent = String(wikiStatAtLevel(monId, growth, position, level)); });
    });
    control.append(wikiEl('span', '', t('wikiStatsLevel')), slider, output);
    section.append(control);
  }
  section.append(list, wikiEl('p', 'hint', t('wikiStatsHint')));
  root.append(section);
}

const WIKI_MAX_LEVEL = 100;

// Tabella di crescita del Pokémon (500 lettere: 5 statistiche x 100 livelli) o null se il gioco non ce l'ha.
function wikiGrowthTable(monId) {
  const growth = window.WMSkyGameData?.growth;
  const table = growth && growth.tables[growth.monsters[monId]];
  return table || null;
}

// Statistica a un livello: valore a livello 1 più gli aumenti dei livelli 2..L.
function wikiStatAtLevel(monId, table, position, level) {
  let value = wikiMonInfo().stats[monId][position];
  for (let step = 1; step < level; step++) value += table.charCodeAt(position * WIKI_MAX_LEVEL + step) - 97;
  return value;
}

// Cosa serve per un'evoluzione: requisito principale e, se c'è, quello in più.
function wikiEvolutionCondition(evolution) {
  const [, method, param1, param2] = evolution;
  const text = getGameText();
  const parts = [];
  if (method === 1) parts.push(t('wikiEvoLevel', { level: param1 }));
  else if (method === 2) parts.push(t('wikiEvoIq', { iq: param1 }));
  else if (method === 3) parts.push(t('wikiEvoItem', { item: getItemName(param1) }));
  else if (method === 4) parts.push(t('wikiEvoRecruited', { name: getLocalizedPokemonName(param1) }));
  else if (param2 === 0 || (param2 >= 8 && param2 <= 9)) parts.push(t('wikiEvoNoReq'));
  const item = (id) => getItemName(id);
  const move = (key) => (text?.extra || {})[key] || '';
  if (param2 === 1) parts.push(t('wikiEvoWith', { item: item(151) }));
  else if (param2 === 2) parts.push(t('wikiEvoAtkGtDef'));
  else if (param2 === 3) parts.push(t('wikiEvoAtkLtDef'));
  else if (param2 === 4) parts.push(t('wikiEvoAtkEqDef'));
  else if (param2 === 5) parts.push(t('wikiEvoWith', { item: item(55) }));
  else if (param2 === 6) parts.push(t('wikiEvoWith', { item: item(56) }));
  else if (param2 === 7) parts.push(t('wikiEvoWith', { item: item(54) }));
  else if (param2 === 8 || param2 === 9) parts.push(t('wikiEvoInternal'));
  else if (param2 === 10) parts.push(t('wikiEvoMale'));
  else if (param2 === 11) parts.push(t('wikiEvoFemale'));
  else if (param2 === 12) parts.push(t('wikiEvoKnows', { move: move('moveAncientPower') }));
  else if (param2 === 13) parts.push(t('wikiEvoKnows', { move: move('moveRollout') }));
  else if (param2 === 14) parts.push(t('wikiEvoKnows', { move: move('moveDoubleHit') }));
  else if (param2 === 15) parts.push(t('wikiEvoKnows', { move: move('moveMimic') }));
  return parts.join(' · ');
}

// Tutta la famiglia evolutiva, dalla forma base in giù: una riga per ogni passaggio.
function renderPokemonEvolution(root, monId) {
  const info = wikiMonInfo();
  const valid = getWikiIndex().monIds;
  if (!info) return;
  const edges = new Map();
  Object.keys(info.evolutions).forEach((key) => {
    const to = parseInt(key, 10);
    const evolution = info.evolutions[key];
    if (!valid.has(to) || !valid.has(evolution[0])) return;
    if (!edges.has(evolution[0])) edges.set(evolution[0], []);
    edges.get(evolution[0]).push({ to, evolution });
  });
  let root_ = monId;
  const seen = new Set([monId]);
  while (info.evolutions[root_] && valid.has(info.evolutions[root_][0]) && !seen.has(info.evolutions[root_][0])) {
    root_ = info.evolutions[root_][0];
    seen.add(root_);
  }
  const rows = [];
  const walk = (from, visited) => {
    (edges.get(from) || []).forEach(({ to, evolution }) => {
      if (visited.has(to)) return;
      const row = wikiEl('li', 'wiki-row wiki-evo');
      [from, to].forEach((id, position) => {
        if (position) row.append(wikiEl('span', 'wiki-evo-arrow', '→'));
        row.append(wikiImage('pokemon', id, 'wiki-row-portrait'));
        if (id === monId) row.append(wikiEl('strong', 'wiki-current', getLocalizedPokemonName(id)));
        else row.append(wikiLink('pokemon', id, getLocalizedPokemonName(id)));
      });
      const condition = wikiEvolutionCondition(evolution);
      if (condition) row.append(wikiEl('span', 'wiki-row-meta wiki-evo-condition', condition));
      rows.push(row);
      walk(to, new Set([...visited, to]));
    });
  };
  walk(root_, new Set([root_]));
  if (!rows.length) return;
  const section = wikiSection(t('wikiEvolutionTitle'));
  const list = wikiEl('ul', 'wiki-rows');
  rows.forEach((row) => list.append(row));
  section.append(list);
  root.append(section);
}

// Abilità QI di un Pokémon: quelle del suo gruppo QI, con il QI che serve per ottenerle.
function renderPokemonIq(root, monId) {
  const iq = wikiIqData();
  const group = iq ? iq.monsterGroup[monId] : -1;
  if (!iq || !(group >= 0)) return;
  const skills = (iq.groups[group] || []).filter((id) => iq.thresholds[id] !== 9999)
    .sort((a, b) => wikiIqSortKey(a) - wikiIqSortKey(b) || a - b);
  if (!skills.length) return;
  const section = wikiSection(t('wikiIqSection'), skills.length);
  section.append(wikiEl('p', 'hint', t('wikiIqGroup', { group: wikiIqGroupLabel(group) })));
  const rows = skills.map((id) => {
    const row = wikiEl('li', 'wiki-row');
    row.append(wikiLink('iq', id, wikiEntryName('iq', id)));
    row.append(wikiEl('span', 'wiki-row-meta', wikiIqRequirement(id)));
    return row;
  });
  wikiAppendList(section, rows, 99, (count) => t('wikiMoreItems', { count }));
  root.append(section);
}

// Scheda di un'abilità QI: effetto, quando si ottiene, incompatibilità e Pokémon che la possono avere.
function renderIqDetail(root, skillId) {
  const index = getWikiIndex();
  root.append(wikiHeader('iq', skillId, wikiIqRequirement(skillId, true)));
  const text = getGameText();
  root.append(wikiEl('p', 'wiki-description', (text?.iqDescriptions || [])[skillId] || ''));
  if (wikiIqIsStory(skillId)) root.append(wikiEl('p', 'hint', t('wikiIqStoryNote')));

  const exclusive = wikiIqExclusiveWith(skillId);
  if (exclusive.length) {
    const section = wikiSection(t('wikiIqExclusive'), exclusive.length);
    const rows = exclusive.map((id) => {
      const row = wikiEl('li', 'wiki-row');
      row.append(wikiLink('iq', id, wikiEntryName('iq', id)));
      row.append(wikiEl('span', 'wiki-row-meta', wikiIqRequirement(id)));
      return row;
    });
    wikiAppendList(section, rows, 99, (count) => t('wikiMoreItems', { count }));
    root.append(section);
  }

  const groups = index.skillGroups.get(skillId) || [];
  const section = wikiSection(t('wikiIqGroupsTitle'), groups.length);
  section.append(wikiEl('p', 'hint', t('wikiIqHow')));
  groups.forEach((group) => {
    const mons = index.groupMons.get(group) || [];
    const details = wikiEl('details', 'wiki-more wiki-iq-group');
    details.open = groups.length === 1;
    details.append(wikiEl('summary', '', t('wikiIqGroupRow', { group: wikiIqGroupLabel(group), count: mons.length })));
    const chips = wikiEl('div', 'wiki-chips');
    mons.forEach((monId) => chips.append(wikiLink('pokemon', monId, wikiEntryName('pokemon', monId))));
    details.append(chips);
    section.append(details);
  });
  root.append(section);
}

// Scheda di una trappola: effetto e dungeon dove il gioco la mette (con piani e probabilità massima).
function renderTrapDetail(root, trapId) {
  const index = getWikiIndex();
  root.append(wikiHeader('traps', trapId, ''));
  root.append(wikiEl('p', 'wiki-description', (getGameText()?.trapDescriptions || [])[trapId] || ''));
  const places = index.trapPlaces.get(trapId);
  if (!places) {
    root.append(wikiEl('p', 'hint', t('wikiTrapNowhere')));
    return;
  }
  const rows = [];
  places.forEach((list, dungeon) => {
    const best = list.reduce((max, [floor, chance]) => (chance > max.chance ? { floor, chance } : max), { floor: 0, chance: -1 });
    const row = wikiEl('li', 'wiki-row');
    row.append(wikiLink('dungeons', dungeon, getDungeonName(dungeon), best.floor));
    row.append(wikiEl('span', 'wiki-row-meta', `${t('wikiFloors', { floors: wikiFloorRanges(list.map(([floor]) => floor)) })} · ${t('wikiUpTo', { chance: formatChance(best.chance) })}`));
    rows.push(row);
  });
  const section = wikiSection(t('wikiWhereFound'), rows.length);
  wikiAppendList(section, rows, WIKI_PLACES_SHOWN, (count) => t('wikiMoreDungeons', { count }));
  root.append(section);
}

function renderDungeonDetail(root, dungeonId) {
  const entry = getWikiIndex().dungeons.find((dungeon) => dungeon.id === dungeonId);
  if (!entry) return;
  const missionFloors = (window.WMSkyGameData?.missionFloors || [])[dungeonId];
  const forbidden = WMSGen.getForbiddenFloors(dungeonId);
  const subtitle = [wikiFloorCountText(entry.floors)];
  if (missionFloors >= 1) subtitle.push(t('wikiMissionFloors', { count: missionFloors }));
  root.append(wikiHeader('dungeons', dungeonId, subtitle.join(' · ')));

  const firstRank = wikiRankOf(dungeonId, 1);
  const lastRank = wikiRankOf(dungeonId, Math.min(entry.floors, missionFloors || entry.floors));
  const facts = [];
  if (firstRank) facts.push(t('wikiDifficulty', { ranks: firstRank === lastRank ? firstRank : `${firstRank} → ${lastRank}` }));
  if (forbidden.length) facts.push(t('floorForbiddenHint', { floors: forbidden.join(', ') }));
  if (!(missionFloors >= 1)) facts.push(t('wikiNoMissions'));
  if (facts.length) root.append(wikiEl('p', 'wiki-description', facts.join(' ')));

  // Piano guardato: frecce come nella scheda del piano.
  let floor = Math.min(Math.max(1, wikiState.floor || 1), entry.floors);
  while (floor < entry.floors && !getFloorData(dungeonId, floor)) floor += 1;
  wikiState.floor = floor;
  const data = getFloorData(dungeonId, floor);
  const lang = getJobTextLanguage();

  const nav = wikiEl('div', 'floor-nav wiki-floor-nav');
  const prev = wikiEl('button', 'ghost', '‹');
  prev.type = 'button';
  prev.setAttribute('aria-label', t('floorPrev'));
  prev.disabled = floor <= 1;
  prev.addEventListener('click', () => wikiMoveFloor(dungeonId, -1));
  const next = wikiEl('button', 'ghost', '›');
  next.type = 'button';
  next.setAttribute('aria-label', t('floorNext'));
  next.disabled = floor >= entry.floors;
  next.addEventListener('click', () => wikiMoveFloor(dungeonId, 1));
  const label = wikiEl('strong', 'wiki-floor-label', WMSkyJobText.formatFloor(floor, dungeonId, lang));
  const rank = wikiRankOf(dungeonId, floor);
  nav.append(prev, label, next);
  if (rank) nav.append(wikiEl('span', 'wiki-badge', t('wikiRank', { rank })));
  root.append(nav);

  const usable = missionFloors >= 1 && floor <= getDungeonFloorLimit(dungeonId) && !forbidden.includes(floor)
    && !!document.querySelector(`#dungeonBox option[value="${dungeonId}"]`);
  const actions = wikiEl('div', 'wiki-actions');
  actions.append(wikiActionButton(t('wikiUseDungeon'), () => wikiUseDungeon(dungeonId, floor),
    usable ? '' : t('wikiDungeonUnusable')));
  root.append(actions);

  if (!data) return;
  const stats = wikiEl('ul', 'floor-stats wiki-floor-stats');
  const places = floorGameText('floorPlaces') || {};
  const layout = data.layout;
  const weather = layout.weather === WEATHER_RANDOM ? t('floorWeatherRandom')
    : ((floorGameText('weather') || [])[layout.weather] || String(layout.weather));
  stats.append(makeFloorStat(t('floorWeather'), weather));
  stats.append(makeFloorStat(t('floorVision'), layout.darkness
    ? t('floorVisionRange', { tiles: layout.darkness }) : t('floorVisionClear')));
  stats.append(makeFloorStat(places.kecleonShop || 'Kecleon', formatChance(layout.kecleonShop), !layout.kecleonShop));
  stats.append(makeFloorStat(places.monsterHouse || 'Monster House', formatChance(layout.monsterHouse), !layout.monsterHouse));
  root.append(stats);

  const monSection = wikiSection(t('floorMonsters'), (data.monsters || []).length);
  const monRows = (data.monsters || []).map(([monId, level, chance]) => {
    const row = wikiEl('li', 'wiki-row wiki-row-icon');
    const base = monId % 600;
    row.append(wikiImage('pokemon', base, 'wiki-row-portrait'));
    row.append(wikiLink('pokemon', base, getLocalizedPokemonName(monId)));
    row.append(wikiEl('span', 'wiki-row-meta', `${t('floorLevel', { level })} · ${formatChance(chance)}`));
    return row;
  });
  if (monRows.length) wikiAppendList(monSection, monRows, 99, (count) => t('wikiMoreItems', { count }));
  else monSection.append(wikiEl('p', 'hint', t('floorMonstersEmpty')));
  root.append(monSection);

  const itemSections = [
    ['ground', data.items, true],
    ['shop', data.shop, layout.kecleonShop > 0],
    ['house', data.house, layout.monsterHouse > 0],
    ['buried', data.buried, layout.buriedDensity > 0]
  ];
  itemSections.forEach(([key, items, shown]) => {
    if (!shown || !items || !items.length) return;
    const section = wikiSection(wikiPlaceLabel(key), items.length);
    const rows = items.map(([itemId, chance]) => {
      const row = wikiEl('li', 'wiki-row wiki-row-icon');
      row.append(wikiImage('items', itemId, 'job-item-icon'));
      row.append(wikiLink('items', itemId, getItemDisplayName(itemId)));
      row.append(wikiEl('span', 'wiki-row-meta', formatChance(chance)));
      return row;
    });
    wikiAppendList(section, rows, WIKI_FLOOR_ITEMS_SHOWN, (count) => t('wikiMoreItems', { count }));
    root.append(section);
  });

  if (layout.trapDensity > 0 && data.traps && data.traps.length) {
    const section = wikiSection(t('floorTrapsTitle'), data.traps.length);
    const line = wikiEl('p', 'wiki-traps');
    data.traps.forEach(([trapId, chance], position) => {
      if (position) line.append(' · ');
      line.append(wikiLink('traps', trapId, wikiEntryName('traps', trapId)), ` ${formatChance(chance)}`);
    });
    section.append(line);
    root.append(section);
  }
}

function renderWikiDetail() {
  const root = document.getElementById('wikiDetail');
  if (!root) return;
  const tab = wikiState.tab;
  const id = wikiState.selected[tab];
  root.textContent = '';
  const back = document.getElementById('wikiBack');
  if (back) back.hidden = !wikiState.history.length;
  document.getElementById('wikiBody')?.classList.toggle('has-detail', id !== null);
  wikiSyncHash();
  if (id === null) {
    root.append(wikiEl('p', 'wiki-placeholder', t('wikiPickEntry')));
    return;
  }
  const content = wikiEl('div', 'wiki-detail-content');
  if (tab === 'items') renderItemDetail(content, id);
  else if (tab === 'pokemon') renderPokemonDetail(content, id);
  else if (tab === 'iq') renderIqDetail(content, id);
  else if (tab === 'traps') renderTrapDetail(content, id);
  else if (tab === 'abilities') renderAbilityDetail(content, id);
  else if (tab === 'moves') renderMoveDetail(content, id);
  else renderDungeonDetail(content, id);
  root.append(content);
}

function renderWiki() {
  if (document.getElementById('wiki')?.hidden) return;
  renderWikiTabs();
  renderWikiGroups();
  renderWikiList();
  renderWikiDetail();
  wikiSyncHash();
}

// ---------------------------------------------------------------------------
// Indirizzi diretti: #wiki/pokemon/25, #wiki/dungeons/12/5 (piano), #wiki/iq/13...
// ---------------------------------------------------------------------------

const WIKI_HASH_PREFIX = '#wiki/';

function wikiHashFor(tab, id, floor) {
  if (id === null || id === undefined) return `${WIKI_HASH_PREFIX}${tab}`;
  return `${WIKI_HASH_PREFIX}${tab}/${id}${tab === 'dungeons' && floor > 1 ? `/${floor}` : ''}`;
}

// Legge un indirizzo e controlla che la voce esista davvero; altrimenti null.
function parseWikiHash(hash) {
  if (!String(hash || '').startsWith(WIKI_HASH_PREFIX)) return null;
  const [tab, rawId, rawFloor] = hash.slice(WIKI_HASH_PREFIX.length).split('/');
  if (!WIKI_TABS.includes(tab)) return null;
  if (rawId === undefined || rawId === '') return { tab, id: null, floor: 1 };
  if (!/^\d+$/.test(rawId)) return null;
  const id = parseInt(rawId, 10);
  const entry = getWikiIndex()[tab].find((item) => item.id === id);
  if (!entry) return null;
  let floor = 1;
  if (tab === 'dungeons' && rawFloor !== undefined) {
    floor = /^\d+$/.test(rawFloor) ? parseInt(rawFloor, 10) : 1;
    if (floor < 1 || floor > entry.floors) floor = 1;
  }
  return { tab, id, floor };
}

// Tiene l'indirizzo della pagina allineato con quello che si sta guardando (senza riempire la cronologia).
function wikiSyncHash() {
  const wiki = document.getElementById('wiki');
  const open = wiki && !wiki.hidden;
  const current = window.location.hash;
  let next = '';
  if (open) {
    const tab = wikiState.tab;
    next = wikiHashFor(tab, wikiState.selected[tab], wikiState.floor);
  } else if (!current.startsWith(WIKI_HASH_PREFIX)) {
    return;
  }
  if (next === current || (!next && !current)) return;
  try {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${next}`);
  } catch (error) {
    // Alcuni browser non lo permettono per i file locali: la Wiki funziona lo stesso.
  }
}

function applyWikiHash() {
  const target = parseWikiHash(window.location.hash);
  if (!target) return;
  openWiki(target.tab, target.id, target.floor);
}

function wikiCopyLink(button) {
  wikiSyncHash();
  const url = window.location.href;
  const done = (ok) => {
    const label = button.textContent;
    button.textContent = ok ? t('wikiLinkCopied') : t('wikiLinkNotCopied');
    window.setTimeout(() => { button.textContent = label; }, 2200);
  };
  const fallback = () => {
    const box = document.createElement('textarea');
    box.value = url;
    box.style.position = 'fixed';
    box.style.opacity = '0';
    document.body.append(box);
    box.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (error) { ok = false; }
    box.remove();
    done(ok);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => done(true), fallback);
  } else {
    fallback();
  }
}

// ---------------------------------------------------------------------------
// Navigazione
// ---------------------------------------------------------------------------

function wikiRemember() {
  wikiState.history.push({ tab: wikiState.tab, id: wikiState.selected[wikiState.tab], floor: wikiState.floor });
  if (wikiState.history.length > 30) wikiState.history.shift();
}

function wikiSelect(tab, id, options = {}) {
  if (!options.fromHistory && wikiState.selected[wikiState.tab] !== null) wikiRemember();
  wikiState.tab = tab;
  wikiState.selected[tab] = id;
  if (tab === 'dungeons') wikiState.floor = options.floor || 1;
  if (options.fromList) {
    renderWikiTabs();
    document.querySelectorAll('#wikiList .wiki-entry.selected').forEach((node) => node.classList.remove('selected'));
    document.querySelector(`#wikiList .wiki-entry[data-id="${id}"]`)?.classList.add('selected');
    renderWikiDetail();
  } else {
    renderWiki();
    wikiScrollListTo(id);
  }
  const detail = document.getElementById('wikiDetail');
  if (detail) detail.scrollTop = 0;
}

// Porta in vista la voce scelta nell'elenco, senza far scorrere la pagina sotto.
function wikiScrollListTo(id) {
  const list = document.getElementById('wikiList');
  const entry = list && list.querySelector(`.wiki-entry[data-id="${id}"]`);
  if (!entry) return;
  const top = entry.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
  if (top < list.scrollTop + 40 || top > list.scrollTop + list.clientHeight - 60) {
    list.scrollTop = Math.max(0, top - list.clientHeight / 3);
  }
}

// Da un collegamento: si cambia scheda senza filtri, così la voce è sicuramente nell'elenco.
function wikiGo(tab, id, floor) {
  if (tab !== wikiState.tab) {
    wikiState.query = '';
    const search = document.getElementById('wikiSearch');
    if (search) search.value = '';
  }
  if (tab === 'items') wikiState.itemGroup = -1;
  wikiSelect(tab, id, { floor });
}

function wikiGoBack() {
  const last = wikiState.history.pop();
  if (!last) return;
  if (last.tab !== wikiState.tab) {
    wikiState.query = '';
    const search = document.getElementById('wikiSearch');
    if (search) search.value = '';
  }
  wikiSelect(last.tab, last.id, { fromHistory: true, floor: last.floor });
}

function wikiShowTab(tab) {
  if (!WIKI_TABS.includes(tab)) return;
  wikiState.tab = tab;
  renderWiki();
}

function wikiMoveFloor(dungeonId, step) {
  const entry = getWikiIndex().dungeons.find((dungeon) => dungeon.id === dungeonId);
  if (!entry) return;
  let floor = wikiState.floor + step;
  while (floor >= 1 && floor <= entry.floors && !getFloorData(dungeonId, floor)) floor += step;
  if (floor < 1 || floor > entry.floors) return;
  wikiState.floor = floor;
  renderWikiDetail();
}

function openWiki(tab, id, floor) {
  const wiki = document.getElementById('wiki');
  if (!wiki) return;
  wikiState.lastFocus = document.activeElement;
  wiki.hidden = false;
  document.body.classList.add('wiki-shown');
  if (tab) {
    wikiState.tab = tab;
    if (id !== undefined && id !== null) {
      wikiState.query = '';
      document.getElementById('wikiSearch').value = '';
      wikiState.selected[tab] = id;
      if (tab === 'dungeons') wikiState.floor = floor || 1;
    }
  }
  renderWiki();
  flashElement(wiki.querySelector('.wiki-window'), 'panel-in');
  if (window.matchMedia('(min-width: 721px)').matches) document.getElementById('wikiSearch')?.focus({ preventScroll: true });
  else document.getElementById('wikiClose')?.focus({ preventScroll: true });
}

function closeWiki() {
  const wiki = document.getElementById('wiki');
  if (!wiki || wiki.hidden) return;
  wiki.hidden = true;
  document.body.classList.remove('wiki-shown');
  wikiSyncHash();
  const focus = wikiState.lastFocus;
  wikiState.lastFocus = null;
  if (focus && typeof focus.focus === 'function' && document.contains(focus)) focus.focus({ preventScroll: true });
}

// ---------------------------------------------------------------------------
// Dalla Wiki al modulo
// ---------------------------------------------------------------------------

function wikiApply(name, action) {
  requestPasswordAnimation();
  runFormAction({ text: () => t('originWiki', { name: name() }) }, () => {
    action();
    WMSGen.update();
    refreshMissionUi();
  });
  closeWiki();
  generateCode();
}

function wikiUseItem(selectId, itemId) {
  wikiApply(() => getItemDisplayName(itemId), () => {
    if (selectId === 'rewardItemBox') {
      // Una ricompensa in Poké o in Pokémon non ha strumento: si passa a "strumento".
      const rewardType = document.getElementById('rewardTypeBox');
      const value = parseInt(rewardType?.value || '0', 10);
      if (rewardType && !(value >= 1 && value <= 4)) {
        rewardType.value = '2';
        rewardType.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    applyItemToField(selectId, itemId);
    document.getElementById(selectId)?.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function wikiUsePokemon(selectId, femaleId, monId) {
  wikiApply(() => getLocalizedPokemonName(monId), () => {
    applyPokemonToField(selectId, femaleId, monId);
    document.getElementById(selectId)?.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function wikiSetDungeonAndFloor(dungeonId, floor) {
  const select = document.getElementById('dungeonBox');
  setSelectByValue(select, dungeonId);
  select.dispatchEvent(new Event('change', { bubbles: true }));
  const input = document.getElementById('floor');
  input.value = String(floor);
  syncDungeonFloorLimit(true);
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function wikiUseDungeon(dungeonId, floor) {
  wikiApply(() => `${getDungeonName(dungeonId)} · ${WMSkyJobText.formatFloor(floor, dungeonId, getJobTextLanguage())}`, () => {
    wikiSetDungeonAndFloor(dungeonId, floor);
  });
}

// Dungeon, piano e obiettivo (Pokémon o strumento) in un colpo solo.
function wikiUseHere(kind, id, dungeonId, floor) {
  const where = `${getDungeonName(dungeonId)} · ${WMSkyJobText.formatFloor(floor, dungeonId, getJobTextLanguage())}`;
  wikiApply(() => `${wikiEntryName(kind, id)} · ${where}`, () => {
    wikiSetDungeonAndFloor(dungeonId, floor);
    const field = kind === 'pokemon' ? 'targetBox' : 'targetItemBox';
    if (kind === 'pokemon') applyPokemonToField('targetBox', 'targetF', id);
    else applyItemToField('targetItemBox', id);
    document.getElementById(field)?.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function wikiFindReward(itemId) {
  closeWiki();
  openStartPanel('farmCard');
  const select = document.getElementById('farmRewardBox');
  if (select && setSelectByValue(select, itemId)) select.dispatchEvent(new Event('change', { bubbles: true }));
  document.getElementById('startBar')?.scrollIntoView({ block: 'start', behavior: wantsLessMotion() ? 'auto' : 'smooth' });
}

// ---------------------------------------------------------------------------
// Avvio
// ---------------------------------------------------------------------------

let wikiSearchTimer = null;

function setupWiki() {
  document.getElementById('wikiOpen')?.addEventListener('click', () => openWiki());
  document.getElementById('wikiClose')?.addEventListener('click', closeWiki);
  document.getElementById('wikiBack')?.addEventListener('click', wikiGoBack);
  document.getElementById('wikiBackdrop')?.addEventListener('click', closeWiki);
  document.getElementById('wikiListBack')?.addEventListener('click', () => {
    wikiState.selected[wikiState.tab] = null;
    renderWikiDetail();
    renderWikiList();
  });
  WIKI_TABS.forEach((tab) => {
    document.getElementById(`wikiTab-${tab}`)?.addEventListener('click', () => wikiShowTab(tab));
  });
  const search = document.getElementById('wikiSearch');
  search?.addEventListener('input', () => {
    window.clearTimeout(wikiSearchTimer);
    wikiSearchTimer = window.setTimeout(() => {
      wikiState.query = search.value;
      renderWikiTabs();
      renderWikiList();
    }, 90);
  });
  // Invio apre la prima voce trovata.
  search?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    wikiState.query = search.value;
    const first = getWikiEntries(wikiState.tab)[0];
    if (first) wikiSelect(wikiState.tab, first.id, { fromList: false });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || document.getElementById('wiki')?.hidden) return;
    event.preventDefault();
    closeWiki();
  });
  // Dalla scheda del piano: il dungeon della missione nella Wiki, allo stesso piano.
  document.getElementById('floorWiki')?.addEventListener('click', () => {
    if (floorView) openWiki('dungeons', floorView.dungeon, floorView.floor);
  });
}

function startWiki() {
  setupWiki();
  applyWikiHash();
  window.addEventListener('hashchange', applyWikiHash);
}

onReady(startWiki);
