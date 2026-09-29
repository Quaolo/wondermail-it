/*
  Wiki: strumenti, Pokémon e dungeon con i dati del gioco, in una finestra sopra al generatore.
  Si apre e si chiude senza toccare il modulo; i pulsanti "Usa..." portano una voce nella missione
  (con Annulla, come gli altri punti di partenza). Usa le funzioni di app.js, che viene caricato prima.
*/

const WIKI_TABS = ['items', 'pokemon', 'dungeons'];
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
  selected: { items: null, pokemon: null, dungeons: null },
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

  const dex = game.nationalDex || [];
  const pokemon = [];
  for (let id = 1; id <= WMSGenData.lastRegularPokemon; id++) {
    if (isWikiRealName(itText.pokemon && itText.pokemon[id])) pokemon.push({ id, dex: dex[id] || 0 });
  }
  pokemon.sort((a, b) => (a.dex || 9999) - (b.dex || 9999) || a.id - b.id);

  return {
    items,
    pokemon,
    dungeons,
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

function wikiEntryName(tab, id) {
  if (tab === 'items') return getItemDisplayName(id);
  if (tab === 'pokemon') return getLocalizedPokemonName(id);
  return getDungeonName(id);
}

function wikiEntrySearchText(tab, id) {
  const list = tab === 'items' ? 'items' : tab === 'pokemon' ? 'pokemon' : 'dungeons';
  return normalizeSearchText(`${wikiEntryName(tab, id)} ${wikiNamesIn(list, id)}`);
}

function wikiOtherName(tab, id) {
  const list = tab === 'items' ? 'items' : tab === 'pokemon' ? 'pokemon' : 'dungeons';
  const other = getOtherLanguageText(list, id);
  const current = tab === 'items' ? getItemName(id) : tab === 'pokemon' ? (getGameText()?.pokemon?.[id] || '') : getDungeonName(id);
  return other && other !== current ? other : '';
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
  return createFallbackImage({ src: buildPreviewBadge(name, 'pokemon'), fallback: '' }, className);
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
      meta = `${entry.dex ? `#${String(entry.dex).padStart(3, '0')} · ` : ''}${where}`;
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
  head.append(frame, copy);
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

  if (data.traps && data.traps.length) {
    const names = floorGameText('traps') || [];
    const section = wikiSection(t('floorTrapsTitle'), data.traps.length);
    section.append(wikiEl('p', 'wiki-traps', data.traps
      .map(([trapId, chance]) => `${names[trapId] || trapId} ${formatChance(chance)}`).join(' · ')));
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
  if (id === null) {
    root.append(wikiEl('p', 'wiki-placeholder', t('wikiPickEntry')));
    return;
  }
  const content = wikiEl('div', 'wiki-detail-content');
  if (tab === 'items') renderItemDetail(content, id);
  else if (tab === 'pokemon') renderPokemonDetail(content, id);
  else renderDungeonDetail(content, id);
  root.append(content);
}

function renderWiki() {
  if (document.getElementById('wiki')?.hidden) return;
  renderWikiTabs();
  renderWikiGroups();
  renderWikiList();
  renderWikiDetail();
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

function wikiUseDungeon(dungeonId, floor) {
  wikiApply(() => `${getDungeonName(dungeonId)} · ${WMSkyJobText.formatFloor(floor, dungeonId, getJobTextLanguage())}`, () => {
    const select = document.getElementById('dungeonBox');
    setSelectByValue(select, dungeonId);
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const input = document.getElementById('floor');
    input.value = String(floor);
    syncDungeonFloorLimit(true);
    input.dispatchEvent(new Event('change', { bubbles: true }));
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

onReady(setupWiki);
