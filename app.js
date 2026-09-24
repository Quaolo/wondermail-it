// Esegue fn a pagina pronta, dopo il resto di questo file (le costanti più in basso esistono già).
function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    window.setTimeout(fn, 0);
  }
}

const LANGUAGE_STORAGE_KEY = 'wmsky-language';
const DEFAULT_LANGUAGE = 'en';
const FALLBACK_LANGUAGE = 'en';
let currentLanguage = DEFAULT_LANGUAGE;

function getLocaleRegistry() {
  return (window.WMSkyLocaleData && window.WMSkyLocaleData.locales) || {};
}

function getAvailableLanguages() {
  const registry = getLocaleRegistry();
  const ordered = Array.isArray(window.WMSkyLocaleData && window.WMSkyLocaleData.order)
    ? window.WMSkyLocaleData.order
    : [];
  const source = ordered.length ? ordered : Object.keys(registry);
  return source.filter((code) => registry[code]);
}

function getDefaultLanguage() {
  const languages = getAvailableLanguages();
  if (languages.includes(DEFAULT_LANGUAGE)) return DEFAULT_LANGUAGE;
  if (languages.includes(FALLBACK_LANGUAGE)) return FALLBACK_LANGUAGE;
  return languages[0] || DEFAULT_LANGUAGE;
}

function getUrlLanguage() {
  try {
    const params = new URLSearchParams(window.location.search || '');
    const raw = (params.get('lang') || params.get('locale') || params.get('language') || '').trim().toLowerCase();
    return raw || null;
  } catch (e) {
    return null;
  }
}

function getLocale(code) {
  const registry = getLocaleRegistry();
  const fallback = getDefaultLanguage();
  return registry[code] || registry[fallback] || null;
}

function getLocaleMeta(code) {
  const locale = getLocale(code);
  const fallbackCode = String(code || DEFAULT_LANGUAGE).toUpperCase();
  return (locale && locale.meta) || {
    code: code || DEFAULT_LANGUAGE,
    label: fallbackCode,
    nativeLabel: fallbackCode,
    shortLabel: fallbackCode,
    flagPath: ''
  };
}

function getLocaleMessages(code) {
  const locale = getLocale(code);
  return (locale && locale.messages) || {};
}

function getLocaleLabelMap(key, code) {
  const locale = getLocale(code);
  const fallback = getLocaleRegistry()[FALLBACK_LANGUAGE];
  return (locale && locale[key]) || (fallback && fallback[key]) || {};
}

// Lettere delle difficoltà, nell'ordine del gioco; i punti esplorazione sono in data/dati_gioco.js.
const MISSION_DIFFICULTY_RANKS = ['-', 'E', 'D', 'C', 'B', 'A', 'S', '★1', '★2', '★3', '★4', '★5', '★6', '★7', '★8', '★9'];

const HARDER_MISSION_MAIN_TYPES = new Set([2, 3, 4, 5, 9, 10]);

function getStoredLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

function getCurrentLanguage() {
  const languages = getAvailableLanguages();
  if (languages.includes(currentLanguage)) {
    return currentLanguage;
  }
  return getDefaultLanguage();
}

function interpolate(template, values) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (
    values && Object.prototype.hasOwnProperty.call(values, key) ? values[key] : ''
  ));
}

// Testo dell'interfaccia nella lingua corrente, con l'inglese come riserva.
function t(key, values) {
  const currentMessages = getLocaleMessages(getCurrentLanguage());
  const fallbackMessages = getLocaleMessages(FALLBACK_LANGUAGE);
  const text = currentMessages[key] || fallbackMessages[key] || key;
  return interpolate(text, values);
}

function ensureSelectOption(select, value, text) {
  if (!select) return;
  if (setSelectByValue(select, value)) return;
  const option = document.createElement('option');
  option.value = String(value);
  option.text = text;
  select.add(option);
}

// Nomi ufficiali del gioco (lmutils.js), con le etichette delle forme prese dal file di lingua.
function getLocalizedPokemonName(monId) {
  return getMonName(monId);
}

function findMissionTypeIndex(mainType) {
  return WMSGenData.missionTypes.findIndex((entry) => entry.mainType === mainType);
}

function findSubtypeIndex(typeIndex, label) {
  const type = WMSGenData.missionTypes[typeIndex];
  if (!type || !type.subTypes) return 0;
  return Math.max(0, type.subTypes.findIndex((entry) => entry.name === label));
}

function getMissionTypeDisplayName(typeIndex) {
  const labels = getLocaleLabelMap('missionTypes', getCurrentLanguage());
  return labels[typeIndex]
    || (WMSGenData.missionTypes[typeIndex] && WMSGenData.missionTypes[typeIndex].name)
    || String(typeIndex);
}

function getMissionSubtypeDisplayName(typeIndex, subtypeIndex) {
  const labels = getLocaleLabelMap('missionSubtypes', getCurrentLanguage());
  const localized = labels[typeIndex] && labels[typeIndex][subtypeIndex];
  if (localized) return localized;
  const type = WMSGenData.missionTypes[typeIndex];
  if (type && type.subTypes && type.subTypes[subtypeIndex]) {
    return type.subTypes[subtypeIndex].name;
  }
  return String(subtypeIndex);
}

function setSelectByValue(select, value) {
  const str = String(value);
  for (let i = 0; i < select.options.length; i += 1) {
    if (select.options[i].value === str) {
      select.selectedIndex = i;
      return true;
    }
  }
  return false;
}

const searchBoxControllers = new Map();

function getSearchOptionImage(selectId, value, label) {
  const numeric = parseInt(value, 10);
  if (['clientBox', 'targetBox', 'target2Box', 'eggPokemonBox'].includes(selectId)) {
    return getPokemonImage(Number.isFinite(numeric) ? numeric : value, label);
  }
  if (selectId === 'rewardItemBox') {
    return getItemImage(Number.isFinite(numeric) ? numeric : value, label, true);
  }
  if (selectId === 'targetItemBox' || selectId === 'farmRewardBox') {
    return getItemImage(Number.isFinite(numeric) ? numeric : value, label, false);
  }
  const fallback = buildPreviewBadge(label, selectId === 'dungeonBox' ? 'pokemon' : 'item');
  return { src: fallback, fallback };
}

function setImageElementSource(image, payload) {
  if (!image || !payload) return;
  image.src = payload.src;
  image.dataset.fallback = payload.fallback;
}

function createSearchSuggestionImage(selectId, suggestion) {
  const image = document.createElement('img');
  image.className = 'search-suggestion-icon';
  image.alt = '';
  image.loading = 'lazy';
  const payload = getSearchOptionImage(selectId, suggestion.value, suggestion.text);
  setImageElementSource(image, payload);
  image.addEventListener('error', () => {
    if (image.src !== image.dataset.fallback) {
      image.src = image.dataset.fallback;
    }
  });
  return image;
}

function getSearchSuggestionDescription(selectId, value) {
  if (!isItemSelect(selectId)) return '';
  return getItemShortDescription(value);
}

function getSelectedOption(select) {
  return select && select.options[select.selectedIndex] ? select.options[select.selectedIndex] : null;
}

function syncSearchBoxSelection(controller) {
  if (!controller) return;
  const option = getSelectedOption(controller.select);
  const text = option ? option.text : '';
  controller.committedText = text;
  controller.input.value = text;
  const payload = getSearchOptionImage(controller.select.id, option ? option.value : '', text || controller.placeholder);
  setImageElementSource(controller.icon, payload);
}

function getSearchSuggestions(select, query) {
  const normalized = String(query || '').trim().toLowerCase();
  if (!select) return [];
  const grouped = isItemSelect(select.id);

  const suggestions = Array.from(select.options)
    .map((option, index) => ({
      index,
      value: option.value,
      text: option.text,
      description: getSearchSuggestionDescription(select.id, option.value),
      searchText: normalizeSearchText(option.dataset.search || option.text || ''),
      group: grouped ? getItemGroupIndex(option.value) : undefined
    }))
    .filter((entry) => !normalized || entry.searchText.includes(normalizeSearchText(normalized)));
  // Strumenti divisi per categoria (bacche, sfere, MT...), nell'ordine del gioco dentro ogni gruppo.
  if (grouped) suggestions.sort((a, b) => a.group - b.group || a.index - b.index);
  return suggestions;
}

// Gruppi degli strumenti, dalle categorie del gioco (BALANCE/item_p.bin, enum item_category).
const ITEM_GROUPS = [
  { key: 'berries', categories: [2] },
  { key: 'food', categories: [3] },
  { key: 'orbs', categories: [9] },
  { key: 'tms', categories: [5, 11] },
  { key: 'held', categories: [4] },
  { key: 'boxes', categories: [12, 13, 14] },
  { key: 'exclusive', categories: [15] },
  { key: 'thrown', categories: [0, 1] },
  { key: 'other', categories: [6, 7, 8, 10] }
];

// "Nessuno" (strumento 0) resta in cima, fuori dai gruppi.
function getItemGroupIndex(itemId) {
  const id = parseInt(itemId, 10);
  if (!(id > 0)) return -1;
  const categories = window.WMSkyGameData && window.WMSkyGameData.itemCategory;
  const category = categories ? categories[id] : undefined;
  const index = ITEM_GROUPS.findIndex((group) => group.categories.includes(category));
  return index >= 0 ? index : ITEM_GROUPS.length - 1;
}

function getItemGroupLabel(index) {
  const labels = {
    berries: t('itemGroupBerries'),
    food: t('itemGroupFood'),
    orbs: t('itemGroupOrbs'),
    tms: t('itemGroupTms'),
    held: t('itemGroupHeld'),
    boxes: t('itemGroupBoxes'),
    exclusive: t('itemGroupExclusive'),
    thrown: t('itemGroupThrown'),
    other: t('itemGroupOther')
  };
  const group = ITEM_GROUPS[index] || ITEM_GROUPS[ITEM_GROUPS.length - 1];
  return labels[group.key];
}

function closeSearchSuggestions(controller) {
  if (!controller) return;
  controller.activeIndex = -1;
  controller.suggestions.innerHTML = '';
  controller.suggestions.classList.add('hidden');
  syncSearchBoxSelection(controller);
}

function applySearchSuggestion(controller, suggestion) {
  if (!controller || !suggestion) return;
  setSelectByValue(controller.select, suggestion.value);
  controller.select.dispatchEvent(new Event('change', { bubbles: true }));
  closeSearchSuggestions(controller);
}

function renderSearchSuggestions(controller, suggestions) {
  if (!controller) return;
  controller.suggestions.innerHTML = '';

  if (!suggestions.length) {
    const empty = document.createElement('div');
    empty.className = 'search-suggestion-empty';
    empty.textContent = t('noMatches');
    controller.suggestions.appendChild(empty);
    controller.suggestions.classList.remove('hidden');
    controller.activeIndex = -1;
    return;
  }

  let lastGroup;
  suggestions.forEach((suggestion, index) => {
    if (suggestion.group !== undefined && suggestion.group >= 0 && suggestion.group !== lastGroup) {
      const header = document.createElement('div');
      header.className = 'search-group';
      header.setAttribute('role', 'presentation');
      header.textContent = getItemGroupLabel(suggestion.group);
      controller.suggestions.appendChild(header);
      lastGroup = suggestion.group;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-suggestion';
    button.dataset.index = String(index);
    if (suggestion.value === controller.select.value) {
      button.classList.add('selected');
    }
    if (index === controller.activeIndex) {
      button.classList.add('active');
    }

    const icon = createSearchSuggestionImage(controller.select.id, suggestion);
    const copy = document.createElement('span');
    copy.className = 'search-suggestion-copy';

    const text = document.createElement('span');
    text.className = 'search-suggestion-text';
    text.textContent = suggestion.text;

    copy.appendChild(text);
    if (suggestion.description) {
      const meta = document.createElement('span');
      meta.className = 'search-suggestion-meta';
      meta.textContent = suggestion.description;
      copy.appendChild(meta);
    }

    button.append(icon, copy);
    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
      applySearchSuggestion(controller, suggestion);
    });
    controller.suggestions.appendChild(button);
  });

  controller.suggestions.classList.remove('hidden');
  // Con le frecce la voce attiva resta visibile anche nelle liste lunghe.
  if (controller.scrollToActive) {
    controller.scrollToActive = false;
    const active = controller.suggestions.querySelector('.search-suggestion.active');
    if (active && typeof active.scrollIntoView === 'function') active.scrollIntoView({ block: 'nearest' });
  }
}

function updateSearchSuggestions(controller) {
  if (!controller) return;
  const suggestions = getSearchSuggestions(controller.select, controller.input.value);
  controller.currentSuggestions = suggestions;
  if (controller.activeIndex >= suggestions.length) {
    controller.activeIndex = suggestions.length ? 0 : -1;
  }
  renderSearchSuggestions(controller, suggestions);
}

function registerSearchBox(input) {
  const select = document.getElementById(input.dataset.target);
  if (!select) return;
  const group = input.parentNode;

  const combo = document.createElement('div');
  combo.className = 'search-combobox';
  group.insertBefore(combo, input);

  const icon = document.createElement('img');
  icon.className = 'search-combobox-icon';
  icon.alt = '';
  icon.addEventListener('error', () => {
    if (icon.src !== icon.dataset.fallback) {
      icon.src = icon.dataset.fallback;
    }
  });

  const field = document.createElement('div');
  field.className = 'searchbox-wrap';

  combo.append(icon, field);
  field.appendChild(input);

  const suggestions = document.createElement('div');
  suggestions.className = 'search-suggestions hidden';
  field.appendChild(suggestions);

  const controller = {
    combo,
    group,
    input,
    select,
    icon,
    suggestions,
    currentSuggestions: [],
    activeIndex: -1,
    committedText: '',
    placeholder: input.getAttribute('placeholder') || ''
  };

  input.setAttribute('autocomplete', 'off');
  input.classList.add('search-combobox-input');
  select.classList.add('enhanced-select-hidden');
  syncSearchBoxSelection(controller);

  input.addEventListener('input', () => {
    controller.activeIndex = 0;
    updateSearchSuggestions(controller);
  });

  input.addEventListener('focus', () => {
    combo.classList.add('open');
    if (input.value === controller.committedText) {
      input.value = '';
    }
    controller.activeIndex = 0;
    updateSearchSuggestions(controller);
  });

  input.addEventListener('keydown', (event) => {
    if (suggestions.classList.contains('hidden')) return;
    if (event.key === 'Escape') {
      closeSearchSuggestions(controller);
      return;
    }
    if (!controller.currentSuggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      controller.activeIndex = (controller.activeIndex + 1) % controller.currentSuggestions.length;
      controller.scrollToActive = true;
      renderSearchSuggestions(controller, controller.currentSuggestions);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      controller.activeIndex = controller.activeIndex <= 0
        ? controller.currentSuggestions.length - 1
        : controller.activeIndex - 1;
      controller.scrollToActive = true;
      renderSearchSuggestions(controller, controller.currentSuggestions);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const chosen = controller.currentSuggestions[Math.max(controller.activeIndex, 0)];
      applySearchSuggestion(controller, chosen);
    }
  });

  input.addEventListener('blur', () => {
    window.setTimeout(() => {
      combo.classList.remove('open');
      closeSearchSuggestions(controller);
      syncSearchBoxSelection(controller);
    }, 120);
  });

  select.addEventListener('change', () => {
    closeSearchSuggestions(controller);
    syncSearchBoxSelection(controller);
  });

  suggestions.addEventListener('mouseleave', () => syncSearchBoxSelection(controller));

  searchBoxControllers.set(input.id, controller);
}

function refreshSearchBoxSelections() {
  searchBoxControllers.forEach((controller) => {
    // Non toccare il campo in cui si sta scrivendo.
    if (document.activeElement === controller.input) return;
    syncSearchBoxSelection(controller);
    if (!controller.suggestions.classList.contains('hidden')) {
      updateSearchSuggestions(controller);
    }
  });
}

function initializeSearchBoxes() {
  document.querySelectorAll('.searchbox').forEach((input) => registerSearchBox(input));
}

function compactCode(pretty) {
  return WMSParser.sanitize(pretty || '');
}

// Ricerca senza badare a maiuscole e accenti ("citta" trova "Città").
function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function getCurrentTypeData() {
  try {
    return WMSGen.getTypeData();
  } catch (e) {
    return null;
  }
}

function hasOwn(data, key) {
  return !!data && Object.prototype.hasOwnProperty.call(data, key);
}

function getInitials(label) {
  return String(label || '')
    .replace(/[^\p{L}\p{N} ]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';
}

function buildPreviewBadge(label, theme) {
  const palettes = {
    pokemon: { bg1: '#1a2740', bg2: '#2b6cb0', fg: '#f7fbff' },
    item: { bg1: '#31224e', bg2: '#a96bff', fg: '#fff7ff' },
    reward: { bg1: '#3d2f12', bg2: '#db9b2e', fg: '#fff9eb' }
  };
  const colors = palettes[theme] || palettes.item;
  const initials = getInitials(label);
  const safeLabel = String(label || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${colors.bg1}"/>
          <stop offset="100%" stop-color="${colors.bg2}"/>
        </linearGradient>
      </defs>
      <rect width="88" height="88" rx="22" fill="url(#g)"/>
      <circle cx="68" cy="20" r="10" fill="rgba(255,255,255,.12)"/>
      <text x="44" y="51" font-family="Trebuchet MS, Verdana, sans-serif" font-size="28" font-weight="700" text-anchor="middle" fill="${colors.fg}">${initials}</text>
      <title>${safeLabel}</title>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizePokemonId(monId) {
  const numeric = parseInt(monId, 10);
  if (!Number.isFinite(numeric)) return null;
  return numeric >= 600 ? numeric - 600 : numeric;
}

function getLocalizedDungeonName(dungeonId, fallbackLabel) {
  const numeric = parseInt(dungeonId, 10);
  if (!Number.isFinite(numeric)) return String(fallbackLabel || '');
  return getDungeonName(numeric);
}

// Nome nell'altra lingua, per poter cercare sia "Grotta Marina" sia "Beach Cave".
function getOtherLanguageText(list, id) {
  const other = getCurrentLanguage() === 'en' ? 'it' : 'en';
  const text = getGameText(other);
  return (text && text[list] && text[list][id]) || '';
}

function relabelDungeonSelect() {
  const select = document.getElementById('dungeonBox');
  if (!select) return;

  Array.from(select.options).forEach((option) => {
    const numeric = parseInt(option.value, 10);
    if (!Number.isFinite(numeric)) return;
    option.text = getLocalizedDungeonName(numeric, option.text);
    option.dataset.search = `${option.text} ${getOtherLanguageText('dungeons', numeric)}`;
  });
}

// Piano massimo che il gioco accetta in una missione (sub_02063424 della decompilazione).
function getDungeonFloorLimit(dungeonId) {
  const numeric = parseInt(dungeonId, 10);
  const floors = window.WMSkyGameData && window.WMSkyGameData.missionFloors;
  if (!Number.isFinite(numeric) || !floors) return 99;
  const limit = floors[numeric];
  return Number.isFinite(limit) && limit >= 1 ? limit : 99;
}

function syncDungeonFloorLimit(forceClamp = false) {
  const dungeonSelect = document.getElementById('dungeonBox');
  const floorInput = document.getElementById('floor');
  const hint = document.getElementById('floorLimitHint');
  if (!dungeonSelect || !floorInput) return;

  const limit = getDungeonFloorLimit(dungeonSelect.value);
  const minFloor = isEggGlitchEnabled() ? 0 : 1;
  floorInput.min = String(minFloor);
  floorInput.max = String(limit);

  const activeEditing = document.activeElement === floorInput;
  const rawValue = String(floorInput.value || '').trim();

  if (rawValue === '') {
    if (forceClamp || !activeEditing) {
      floorInput.value = String(minFloor);
    }
  } else {
    const current = parseInt(rawValue, 10);
    if (!Number.isFinite(current) || current < minFloor) {
      if (forceClamp || !activeEditing) {
        floorInput.value = String(minFloor);
      }
    } else if (current > limit) {
      if (forceClamp || !activeEditing) {
        floorInput.value = String(limit);
      }
    }
  }

  if (hint) {
    const parts = [limit < 99 ? t('floorLimitHint', { count: limit }) : t('floorLimitUnknown')];
    // Qualche piano (di solito quello del capo) il gioco non lo accetta nelle missioni.
    const forbidden = WMSGen.getForbiddenFloors(dungeonSelect.value);
    if (forbidden.length) {
      parts.push(t('floorForbiddenHint', { floors: forbidden.join(', ') }));
    }
    hint.textContent = parts.join(' ');
  }
}

function getMissionDifficultyInfo(typeData = getCurrentTypeData()) {
  const dungeonId = parseInt(document.getElementById('dungeonBox')?.value || '', 10);
  const floorValue = parseInt(document.getElementById('floor')?.value || '', 10);
  if (!Number.isFinite(dungeonId) || !Number.isFinite(floorValue)) return null;

  const data = window.WMSkyGameData || {};
  const dungeonRanks = data.missionRanks && data.missionRanks[dungeonId];
  if (!dungeonRanks) return null;

  let rankId = parseInt(dungeonRanks[floorValue - 1], 10);
  if (!Number.isFinite(rankId)) return null;

  // Le missioni più impegnative valgono una difficoltà in più (GetMissionRankWithCapAndModifiers).
  if (typeData && HARDER_MISSION_MAIN_TYPES.has(parseInt(typeData.mainType, 10)) && rankId < 15) {
    rankId += 1;
  }

  const rank = MISSION_DIFFICULTY_RANKS[rankId];
  const points = (data.missionRankPoints || [])[rankId];
  if (!rank || !Number.isFinite(points)) return null;

  return { rankId, rank, points };
}

function updateMissionDifficultyHint() {
  const hint = document.getElementById('missionDifficultyHint');
  if (!hint) return;

  const info = getMissionDifficultyInfo();
  hint.textContent = info
    ? t('missionDifficultyHint', { rank: info.rank, points: info.points })
    : t('missionDifficultyUnknown');
}

function getSelectedRegion() {
  const value = String(document.getElementById('regionBox')?.value || 'eu').toLowerCase();
  return WMSParser.regions.includes(value) ? value : 'eu';
}

function setSelectedRegion(region) {
  const select = document.getElementById('regionBox');
  if (select && WMSParser.regions.includes(region)) {
    select.value = region;
  }
}

function getRegionName(region) {
  return t(`region_${region}`);
}

// Legge una password: vale la regione (EU, NA o JP) il cui checksum CRC32 torna.
function detectWonderMailCode(code) {
  return WMSParser.decode(code, getSelectedRegion());
}

function mergeMissionTypeData(typeIndex, subtypeIndex) {
  const base = WMSGenData.missionTypes[typeIndex];
  if (!base) return null;
  if (!base.subTypes || !Number.isFinite(subtypeIndex)) return base;
  const subtype = base.subTypes[subtypeIndex];
  return subtype ? { ...base, ...subtype } : base;
}

function findMissionSelectionForStruct(struct) {
  for (let typeIndex = 0; typeIndex < WMSGenData.missionTypes.length; typeIndex += 1) {
    const type = WMSGenData.missionTypes[typeIndex];
    if (!type || type.mainType !== struct.missionType) continue;

    if (Array.isArray(type.subTypes) && type.subTypes.length) {
      for (let subtypeIndex = 0; subtypeIndex < type.subTypes.length; subtypeIndex += 1) {
        const merged = mergeMissionTypeData(typeIndex, subtypeIndex);
        if (merged.specialType !== struct.missionSpecial) continue;
        if (Object.prototype.hasOwnProperty.call(merged, 'forceClient') && merged.forceClient !== struct.client) continue;
        if (Object.prototype.hasOwnProperty.call(merged, 'forceTarget') && merged.forceTarget !== struct.target) continue;
        return { typeIndex, subtypeIndex };
      }
    }

    if ((type.specialType || 0) === struct.missionSpecial) {
      return { typeIndex, subtypeIndex: null };
    }
  }

  return null;
}

function splitTrueMonId(monId) {
  const numeric = parseInt(monId, 10);
  if (!Number.isFinite(numeric)) return null;
  if (numeric >= 600) {
    return { baseId: numeric - 600, female: true };
  }
  return { baseId: numeric, female: false };
}

function applyPokemonToField(selectId, femaleId, monId) {
  const select = document.getElementById(selectId);
  const checkbox = femaleId ? document.getElementById(femaleId) : null;
  const split = splitTrueMonId(monId);
  if (!select || !split || split.baseId <= 0) return;

  ensureSelectOption(select, split.baseId, getLocalizedPokemonName(monId));
  setSelectByValue(select, split.baseId);
  if (checkbox) {
    checkbox.checked = !!split.female;
  }
}

function applyItemToField(selectId, itemId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const numeric = parseInt(itemId, 10);
  if (!Number.isFinite(numeric)) return;
  ensureSelectOption(select, numeric, getItemDisplayName(numeric));
  setSelectByValue(select, numeric);
}

function isEggGlitchStruct(struct) {
  if (!struct) return false;
  return parseInt(struct.missionType, 10) === 6
    && parseInt(struct.missionSpecial, 10) === 0
    && parseInt(struct.dungeon, 10) === EGG_GLITCH_DUNGEON
    && EGG_GLITCH_IMPORT_FLOORS.includes(parseInt(struct.floor, 10))
    && parseInt(struct.targetItem, 10) === EGG_GLITCH_ITEM
    && parseInt(struct.rewardType, 10) === 5
    && [EGG_GLITCH_CLIENT, EGG_GLITCH_LEGACY_CLIENT].includes(parseInt(struct.client, 10))
    && [EGG_GLITCH_CLIENT, EGG_GLITCH_LEGACY_CLIENT].includes(parseInt(struct.target, 10));
}

function importDecodedStruct(result) {
  const typeSelect = document.getElementById('missionTypeBox');
  const subSelect = document.getElementById('missionSubTypeBox');
  const dungeonSelect = document.getElementById('dungeonBox');
  const floorInput = document.getElementById('floor');
  const specialFloorInput = document.getElementById('specialFloor');
  const rewardTypeSelect = document.getElementById('rewardTypeBox');
  const output = document.getElementById('outputbox');
  const compact = document.getElementById('compactOutput');
  const rawFlavor = document.getElementById('flavorText');
  const eggGlitchToggle = document.getElementById('eggGlitch');
  const struct = result.struct;
  const eggGlitch = isEggGlitchStruct(struct);

  if (eggGlitch) {
    applyPreset('egg');
  } else if (eggGlitchToggle?.checked) {
    eggGlitchToggle.checked = false;
  }

  let missionMapped = false;
  const missionSelection = eggGlitch ? null : findMissionSelectionForStruct(struct);
  if (missionSelection && typeSelect) {
    ensureSelectOption(typeSelect, missionSelection.typeIndex, getMissionTypeDisplayName(missionSelection.typeIndex));
    setSelectByValue(typeSelect, missionSelection.typeIndex);
    WMSGen.fillSubTypeList();
    if (Number.isFinite(missionSelection.subtypeIndex) && subSelect) {
      ensureSelectOption(subSelect, missionSelection.subtypeIndex, getMissionSubtypeDisplayName(missionSelection.typeIndex, missionSelection.subtypeIndex));
      setSelectByValue(subSelect, missionSelection.subtypeIndex);
    }
    missionMapped = true;
  }

  setSelectedRegion(result.region);

  if (dungeonSelect) {
    ensureSelectOption(dungeonSelect, struct.dungeon, getLocalizedDungeonName(struct.dungeon, String(struct.dungeon)));
    setSelectByValue(dungeonSelect, struct.dungeon);
  }
  if (floorInput && Number.isFinite(struct.floor)) {
    floorInput.value = String(struct.floor);
  }
  if (specialFloorInput) {
    specialFloorInput.value = Number.isFinite(struct.specialFloor) && struct.specialFloor > 0 ? String(struct.specialFloor) : '';
  }
  if (rewardTypeSelect) {
    ensureSelectOption(rewardTypeSelect, struct.rewardType, textOfSelected('rewardTypeBox') || String(struct.rewardType));
    setSelectByValue(rewardTypeSelect, struct.rewardType);
  }

  if (eggGlitchToggle) {
    eggGlitchToggle.checked = eggGlitch;
  }
  if (eggGlitch) {
    const eggSelect = document.getElementById('eggPokemonBox');
    if (eggSelect) {
      ensureSelectOption(eggSelect, struct.reward, getEggPokemonDisplayName(struct.reward));
      setSelectByValue(eggSelect, struct.reward);
    }
  }

  applyPokemonToField('clientBox', 'clientF', struct.client);
  applyPokemonToField('targetBox', 'targetF', struct.target);
  applyPokemonToField('target2Box', 'target2F', struct.target2);
  applyItemToField('targetItemBox', struct.targetItem);
  applyItemToField('rewardItemBox', struct.reward);
  if (!eggGlitch && (struct.rewardType === 5 || struct.rewardType === 6)) {
    populateRewardPokemonList(true);
    const rewardMon = document.getElementById('rewardPokemonBox');
    if (rewardMon) {
      const value = struct.reward === struct.client ? 0 : struct.reward;
      if (value) ensureSelectOption(rewardMon, value, getLocalizedPokemonName(value));
      setSelectByValue(rewardMon, value);
    }
  }

  if (rawFlavor) {
    rawFlavor.value = Number.isFinite(struct.flavorText) ? String(struct.flavorText) : '';
  }

  WMSGen.update();
  syncDungeonFloorLimit(true);
  refreshMissionUi();

  if (output) {
    output.value = prettyMailString(result.clean, 2, 7);
  }
  if (compact) {
    compact.value = result.clean;
  }
  updateOutputCards();

  // Le restrizioni di squadra non sono gestite dal modulo: rigenerando andrebbero perse.
  const hasRestriction = struct.restriction !== 0 || struct.restrictionType !== 0;
  return missionMapped && !hasRestriction;
}

function getTreasureBoxVariantLabel(itemId) {
  const numeric = parseInt(itemId, 10);
  if (!Number.isFinite(numeric) || numeric < 364 || numeric > 399) return '';
  return String.fromCharCode(65 + ((numeric - 364) % 3));
}

function monNameFromSelect(selectId, femaleId, forcedId) {
  if (typeof forcedId === 'number') return getLocalizedPokemonName(forcedId);
  const select = document.getElementById(selectId);
  if (!select || !select.options[select.selectedIndex]) return '-';
  const female = document.getElementById(femaleId)?.checked;
  const base = parseInt(select.value, 10);
  return getLocalizedPokemonName(WMSGen.getTrueMonID(base, !!female));
}

function textOfSelected(selectId) {
  const select = document.getElementById(selectId);
  return select && select.options[select.selectedIndex] ? select.options[select.selectedIndex].text : '-';
}

// Nome ufficiale dello strumento; i forzieri con lo stesso nome ricevono una lettera (A, B, C).
function getItemDisplayName(itemId) {
  const numeric = parseInt(itemId, 10);
  const baseLabel = numeric === 0 ? t('noItem') : getItemName(numeric);
  const chestVariant = getTreasureBoxVariantLabel(numeric);
  return chestVariant ? `${baseLabel} (${t('chestVariantShort', { variant: chestVariant })})` : baseLabel;
}

function isItemSelect(selectId) {
  return selectId === 'targetItemBox' || selectId === 'rewardItemBox' || selectId === 'farmRewardBox';
}

// Pokémon a cui è dedicato uno strumento esclusivo (dalla descrizione ufficiale), per l'icona.
function getItemOwnerPokemonId(itemId) {
  const owners = window.WMSkyGameData && window.WMSkyGameData.exclusiveOwner;
  const owner = owners ? owners[parseInt(itemId, 10)] : undefined;
  return Number.isFinite(owner) ? owner : null;
}

function getItemShortDescription(itemId) {
  const numeric = parseInt(itemId, 10);
  if (!Number.isFinite(numeric) || numeric === 0) return '';
  const text = getGameText();
  return (text && text.itemShort[numeric]) || '';
}

// Descrizione ufficiale del gioco (quella lunga, se c'è).
function getItemEffectDescription(itemId) {
  const numeric = parseInt(itemId, 10);
  if (!Number.isFinite(numeric) || numeric === 0) return t('noItemSelected');
  const text = getGameText();
  return (text && (text.itemLong[numeric] || text.itemShort[numeric])) || t('noItemDescription');
}

function relabelPokemonSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  Array.from(select.options).forEach((option) => {
    const numeric = parseInt(option.value, 10);
    if (!Number.isFinite(numeric)) return;
    option.text = getLocalizedPokemonName(numeric);
  });
}

function rebuildPokemonLists() {
  if (!window.WMSGen || !WMSGen.form) return;

  const trackedIds = ['clientBox', 'targetBox', 'target2Box'];
  const previousValues = {};
  trackedIds.forEach((id) => {
    const select = document.getElementById(id);
    previousValues[id] = select ? String(select.value || '') : '';
  });

  WMSGen.fillMonsterLists();
  trackedIds.forEach((id) => {
    relabelPokemonSelect(id);
    const select = document.getElementById(id);
    if (!select) return;
    const previous = previousValues[id];
    if (setSelectByValue(select, previous)) return;
    // Un Pokémon non più in elenco (per esempio letto da una password) resta scelto.
    const numeric = parseInt(previous, 10);
    if (Number.isFinite(numeric) && numeric > 0) {
      ensureSelectOption(select, numeric, getLocalizedPokemonName(numeric));
      setSelectByValue(select, numeric);
    } else {
      select.selectedIndex = Math.max(select.selectedIndex, 0);
    }
  });

  refreshSearchBoxSelections();
}

const EGG_GLITCH_DUNGEON = 91;
const EGG_GLITCH_FLOOR = 0;
const EGG_GLITCH_IMPORT_FLOORS = [0, 10];
const EGG_GLITCH_ITEM = 92;
const EGG_GLITCH_CLIENT = 286;
const EGG_GLITCH_LEGACY_CLIENT = 176;
const EGG_GLITCH_SELECTABLE_REWARD_IDS = Array.from({ length: 600 }, (_, index) => index);

function getEggPokemonBaseId(monId) {
  const numeric = parseInt(monId, 10);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return numeric % 600;
}

function getEggPokemonSlotSuffix(monId) {
  const numeric = parseInt(monId, 10);
  if (!Number.isFinite(numeric)) return '';
  return numeric >= 600 ? ` (${t('eggPokemonAltSlot')})` : '';
}

function getEggPokemonDisplayName(monId) {
  const baseId = getEggPokemonBaseId(monId);
  if (!Number.isFinite(baseId)) return '-';
  return `${getLocalizedPokemonName(baseId)}${getEggPokemonSlotSuffix(monId)}`;
}

function populateEggPokemonList() {
  const select = document.getElementById('eggPokemonBox');
  if (!select) return;

  const previous = String(select.value || '');
  select.innerHTML = '';

  EGG_GLITCH_SELECTABLE_REWARD_IDS.forEach((value) => {
    const option = document.createElement('option');
    option.value = String(value);
    option.text = getEggPokemonDisplayName(value);
    select.add(option);
  });

  if (!setSelectByValue(select, previous)) {
    setSelectByValue(select, EGG_GLITCH_CLIENT);
  }

  refreshSearchBoxSelections();
}

// Pokémon della ricompensa (tipi 5 e 6): l'elenco dipende dal tipo di ricompensa e, per il 6, dalle Lettere
// di sfida. La prima voce (0) vuol dire "il committente", come nelle missioni della bacheca.
function populateRewardPokemonList(force) {
  const select = document.getElementById('rewardPokemonBox');
  const typeData = getCurrentTypeData();
  if (!select || !typeData) return;
  const rewardType = parseInt(document.getElementById('rewardTypeBox')?.value || '0', 10);
  if (rewardType !== 5 && rewardType !== 6) return;
  const kind = `${rewardType}:${typeData.mainType === 11 ? 'challenge' : 'other'}`;
  if (!force && select.dataset.kind === kind) return;
  const previous = String(select.value || '0');
  select.dataset.kind = kind;
  select.innerHTML = '';
  const same = document.createElement('option');
  same.value = '0';
  same.text = t('rewardPokemonClient');
  select.add(same);
  WMSGen.getRewardPokemonIds(rewardType, typeData.mainType).forEach((id) => {
    const option = document.createElement('option');
    option.value = String(id);
    option.text = getLocalizedPokemonName(id);
    select.add(option);
  });
  if (!setSelectByValue(select, previous)) setSelectByValue(select, '0');
  refreshSearchBoxSelections();
}

function updateRewardPokemonTexts(rewardType) {
  const label = document.getElementById('rewardPokemonLabel');
  const hint = document.getElementById('rewardPokemonHint');
  if (label) label.textContent = rewardType === 5 ? t('rewardPokemonEggLabel') : t('rewardPokemonJoinLabel');
  if (hint) hint.textContent = rewardType === 5 ? t('rewardPokemonEggHint') : t('rewardPokemonJoinHint');
}

function isEggGlitchEnabled() {
  return !!document.getElementById('eggGlitch')?.checked;
}

function applyEggGlitchPreset() {
  const typeSelect = document.getElementById('missionTypeBox');
  const rewardType = document.getElementById('rewardTypeBox');
  const dungeon = document.getElementById('dungeonBox');
  const floor = document.getElementById('floor');
  const targetItem = document.getElementById('targetItemBox');
  const client = document.getElementById('clientBox');
  const clientFemale = document.getElementById('clientF');

  if (typeSelect) {
    setSelectByValue(typeSelect, findMissionTypeIndex(6));
    WMSGen.fillSubTypeList();
  }
  if (rewardType) setSelectByValue(rewardType, 5);
  if (dungeon) setSelectByValue(dungeon, EGG_GLITCH_DUNGEON);
  if (floor) floor.value = String(EGG_GLITCH_FLOOR);
  if (targetItem) setSelectByValue(targetItem, EGG_GLITCH_ITEM);
  if (client) setSelectByValue(client, EGG_GLITCH_CLIENT);
  if (clientFemale) clientFemale.checked = false;
}

function relabelEggPokemonSelect() {
  const select = document.getElementById('eggPokemonBox');
  if (!select) return;

  Array.from(select.options).forEach((option) => {
    const numeric = parseInt(option.value, 10);
    if (!Number.isFinite(numeric)) return;
    option.text = getEggPokemonDisplayName(numeric);
  });
}

function relabelItemSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  Array.from(select.options).forEach((option) => {
    const numeric = parseInt(option.value, 10);
    if (!Number.isFinite(numeric)) return;

    option.text = getItemDisplayName(numeric);
    // Si trova anche con il nome nell'altra lingua, con il nome della categoria e, per gli strumenti
    // esclusivi, con il nome del Pokémon a cui sono dedicati.
    const owner = getItemOwnerPokemonId(numeric);
    option.dataset.search = [
      option.text,
      getOtherLanguageText('items', numeric),
      getItemGroupLabel(getItemGroupIndex(numeric)),
      Number.isFinite(owner) ? getMonName(owner) : ''
    ].join(' ');
    const chestVariant = getTreasureBoxVariantLabel(numeric);
    option.title = chestVariant ? t('chestVariantTitle', { variant: chestVariant }) : '';
  });
}

function relabelMissionTypeSelect() {
  const select = document.getElementById('missionTypeBox');
  if (!select) return;
  const labels = getLocaleLabelMap('missionTypes', getCurrentLanguage());

  Array.from(select.options).forEach((option) => {
    const key = parseInt(option.value, 10);
    option.text = labels[key] || option.text;
  });
}

function relabelMissionSubTypeSelect() {
  const typeSelect = document.getElementById('missionTypeBox');
  const subSelect = document.getElementById('missionSubTypeBox');
  if (!typeSelect || !subSelect) return;

  const missionKey = parseInt(typeSelect.value, 10);
  const subtypeMap = getLocaleLabelMap('missionSubtypes', getCurrentLanguage());
  const labels = subtypeMap[missionKey];
  if (!labels) return;

  Array.from(subSelect.options).forEach((option) => {
    const key = parseInt(option.value, 10);
    option.text = labels[key] || option.text;
  });
}

function relabelRewardTypeSelect() {
  const select = document.getElementById('rewardTypeBox');
  if (!select) return;
  const labels = getLocaleLabelMap('rewardTypes', getCurrentLanguage());

  Array.from(select.options).forEach((option) => {
    const key = parseInt(option.value, 10);
    option.text = labels[key] || option.text;
  });
}

function updateLanguagePicker() {
  const picker = document.getElementById('languagePicker');
  const toggle = document.getElementById('languagePickerToggle');
  const menu = document.getElementById('languagePickerMenu');
  const flag = document.getElementById('languagePickerFlag');
  const label = document.getElementById('languagePickerLabel');
  const meta = getLocaleMeta(getCurrentLanguage());

  if (picker) {
    picker.classList.toggle('open', toggle?.getAttribute('aria-expanded') === 'true');
  }
  if (toggle) {
    toggle.setAttribute('aria-label', t('selectLanguage'));
  }
  if (menu) {
    menu.setAttribute('aria-label', t('languageMenuLabel'));
  }
  if (flag) {
    flag.src = meta.flagPath || '';
    flag.alt = '';
  }
  if (label) {
    label.textContent = meta.nativeLabel;
  }

  document.querySelectorAll('.lang-picker-option').forEach((button) => {
    const active = button.dataset.lang === getCurrentLanguage();
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });
}

function closeLanguagePicker() {
  const picker = document.getElementById('languagePicker');
  const toggle = document.getElementById('languagePickerToggle');
  const menu = document.getElementById('languagePickerMenu');
  if (!toggle || !menu) return;
  toggle.setAttribute('aria-expanded', 'false');
  menu.classList.add('hidden');
  if (picker) picker.classList.remove('open');
  updateLanguagePicker();
}

function toggleLanguagePicker(forceOpen) {
  const picker = document.getElementById('languagePicker');
  const toggle = document.getElementById('languagePickerToggle');
  const menu = document.getElementById('languagePickerMenu');
  if (!toggle || !menu) return;

  const shouldOpen = typeof forceOpen === 'boolean'
    ? forceOpen
    : toggle.getAttribute('aria-expanded') !== 'true';

  toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
  menu.classList.toggle('hidden', !shouldOpen);
  if (picker) picker.classList.toggle('open', shouldOpen);
  updateLanguagePicker();
}

function renderLanguagePicker() {
  const menu = document.getElementById('languagePickerMenu');
  if (!menu) return;

  menu.innerHTML = '';
  getAvailableLanguages().forEach((code) => {
    const meta = getLocaleMeta(code);
    const button = document.createElement('button');
    const image = document.createElement('img');
    const copy = document.createElement('span');
    const name = document.createElement('span');
    const description = document.createElement('span');
    const short = document.createElement('span');

    button.type = 'button';
    button.className = 'lang-picker-option';
    button.dataset.lang = code;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', code === getCurrentLanguage() ? 'true' : 'false');

    image.className = 'lang-picker-flag';
    image.src = meta.flagPath || '';
    image.alt = '';

    copy.className = 'lang-picker-option-copy';
    name.className = 'lang-picker-option-name';
    name.textContent = meta.nativeLabel;
    description.className = 'lang-picker-option-meta';
    description.textContent = meta.label;
    copy.append(name, description);

    short.className = 'lang-picker-option-short';
    short.textContent = meta.shortLabel;

    button.append(image, copy, short);
    button.addEventListener('click', () => {
      applyLanguage(code);
      closeLanguagePicker();
    });

    menu.appendChild(button);
  });

  updateLanguagePicker();
}

// Testi statici della pagina: ogni elemento indica la sua chiave con data-i18n (testo),
// data-i18n-html (testo con markup), data-i18n-placeholder, data-i18n-title o data-i18n-aria.
function applyStaticTranslations() {
  document.documentElement.lang = getCurrentLanguage();
  document.title = t('pageTitle');
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', t('metaDescription'));

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((node) => {
    node.innerHTML = t(node.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((node) => {
    node.title = t(node.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((node) => {
    node.setAttribute('aria-label', t(node.dataset.i18nAria));
  });

  // Pulsanti delle Lettere di sfida: il nome del leggendario è quello ufficiale del gioco.
  document.querySelectorAll('.preset-btn[data-boss]').forEach((button) => {
    const label = button.querySelector('.preset-label');
    if (label) label.textContent = t('presetChallenge', { boss: getMonName(parseInt(button.dataset.boss, 10)) });
  });

  updateLanguagePicker();
}

function relabelLocalizedControls() {
  relabelMissionTypeSelect();
  relabelMissionSubTypeSelect();
  relabelRewardTypeSelect();
  relabelDungeonSelect();
  ['clientBox', 'targetBox', 'target2Box'].forEach(relabelPokemonSelect);
  relabelEggPokemonSelect();
  ['targetItemBox', 'rewardItemBox'].forEach(relabelItemSelect);
  populateFarmRewards();
  renderFarmResults();
  populateUnlockDungeons();
  populateRewardPokemonList(true);
  refreshSearchBoxSelections();
}

function applyLanguage(nextLanguage, options = {}) {
  const available = getAvailableLanguages();
  currentLanguage = available.includes(nextLanguage) ? nextLanguage : getDefaultLanguage();
  if (options.persist !== false) {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    } catch (e) {
      /* archiviazione non disponibile: la scelta vale solo per questa visita */
    }
  }

  renderLanguagePicker();
  applyStaticTranslations();
  relabelLocalizedControls();
  decoratePresetButtons();
  refreshMissionUi();
  updateOutputCards();
  Object.keys(statusMessages).forEach(renderStatus);
  renderOriginBar();
}

// Icona indicativa a partire dal nome inglese ufficiale (le parole chiave sono in inglese).
function getHeuristicItemIcon(itemId) {
  const numeric = parseInt(itemId, 10);
  const english = getGameText(FALLBACK_LANGUAGE);
  const lower = String((english && english.items[numeric]) || '').toLowerCase();

  const local = {
    apple: 'assets/item-icons-pmdo/Apple-Red.png',
    berry: 'assets/item-icons-pmdo/Berry-Oran.png',
    seed: 'assets/item-icons-pmdo/Seed-Green.png',
    drink: 'assets/item-icons-pmdo/Bottle-LightBlue.png',
    gummi: 'assets/item-icons-pmdo/Gummi-Blue.png',
    orb: 'assets/item-icons-pmdo/Orb-Blue.png',
    stick: 'assets/item-icons-pmdo/Stick-Brown.png',
    rock: 'assets/item-icons-pmdo/Rock-Gray.png',
    scarf: 'assets/item-icons-pmdo/Scarf-Blue.png',
    band: 'assets/item-icons-pmdo/Band-Brown.png',
    specs: 'assets/item-icons-pmdo/Specs-Yellow.png',
    key: 'assets/item-icons-pmdo/Key-White.png',
    chest: 'assets/item-icons-pmdo/Chest-Gold.png',
    box: 'assets/item-icons-pmdo/Box-Blue.png',
    mask: 'assets/item-icons-pmdo/Mask-Gold.png',
    star: 'assets/item-icons/Explorers-of-Sky---Star-icon.png'
  };

  if (/ticket/.test(lower)) {
    if (/gold/.test(lower)) return 'assets/item-icons/Explorers-of-Sky---Gold-Ticket.png';
    if (/silver/.test(lower)) return 'assets/item-icons/Explorers-of-Sky---Silver-Ticket.png';
    return 'assets/item-icons/Explorers-of-Sky---Prism-Ticket.png';
  }
  if (/sky gift/.test(lower)) return 'assets/item-icons/Explorers-of-Sky---Sky-Gift.png';
  if (/gracidea/.test(lower)) return 'assets/item-icons/Explorers-of-Sky---Gracidea.png';
  if (/space globe/.test(lower)) return 'assets/item-icons/Explorers-of-Sky---Space-Globe.png';
  if (Number.isFinite(numeric) && numeric >= 364 && numeric <= 399) return local.chest;
  if (/apple/.test(lower)) return local.apple;
  if (/berry|dew/.test(lower)) return local.berry;
  if (/seed/.test(lower)) return /golden/.test(lower) ? local.seed : local.seed;
  if (/gummi/.test(lower)) return local.gummi;
  if (/orb|sphere/.test(lower)) return local.orb;
  if (/elixir|drink|protein|calcium|iron|zinc|nectar|booster|capsule/.test(lower)) return local.drink;
  if (/stick|thorn|spike|fang|twig|barb/.test(lower)) return local.stick;
  if (/rock|pebble|stone|fossil|slab|part|shard/.test(lower)) return local.rock;
  if (/specs|lens|goggle|scope/.test(lower)) return local.specs;
  if (/key|cable/.test(lower)) return local.key;
  if (/chest/.test(lower)) return local.chest;
  if (/box|bag|loot/.test(lower)) return local.box;
  if (/mask/.test(lower)) return local.mask;
  if (/scarf|ribbon|bow|belt|band|cape|poncho|armor|helmet|hat|choker|sash|coat/.test(lower)) {
    return /band/.test(lower) ? local.band : local.scarf;
  }
  if (parseInt(itemId, 10) >= 1000) return local.star;
  return '';
}

function getItemImage(itemId, label, rewardStyle) {
  const fallback = buildPreviewBadge(label, rewardStyle ? 'reward' : 'item');
  const numeric = parseInt(itemId, 10);
  const ownerPokemonId = getItemOwnerPokemonId(numeric);
  if (Number.isFinite(ownerPokemonId)) {
    return getPokemonImage(ownerPokemonId, label);
  }
  const exact = window.WMSkyItemIcons && window.WMSkyItemIcons[numeric];
  const heuristic = getHeuristicItemIcon(itemId);
  return {
    src: exact || heuristic || fallback,
    fallback
  };
}

function renderEntityPreview(previewId, data) {
  const root = document.getElementById(previewId);
  if (!root) return;

  if (!data || data.hidden) {
    root.innerHTML = '';
    root.classList.add('hidden');
    return;
  }

  root.classList.remove('hidden');
  root.innerHTML = '';

  const visual = document.createElement('img');
  visual.className = 'entity-preview-visual';
  visual.alt = data.name;
  visual.src = data.image.src;
  visual.dataset.fallback = data.image.fallback;
  visual.addEventListener('error', () => {
    if (visual.src !== visual.dataset.fallback) {
      visual.src = visual.dataset.fallback;
    }
  });

  const copy = document.createElement('div');
  copy.className = 'entity-preview-copy';

  const label = document.createElement('span');
  label.className = 'entity-preview-label';
  label.textContent = data.label;

  const name = document.createElement('strong');
  name.className = 'entity-preview-name';
  name.textContent = data.name;

  copy.append(label, name);

  if (data.meta) {
    const meta = document.createElement('span');
    meta.className = 'entity-preview-meta';
    meta.textContent = data.meta;
    copy.appendChild(meta);
  }

  root.append(visual, copy);
}

function getItemPreviewData(selectId, label, meta, rewardStyle) {
  const select = document.getElementById(selectId);
  if (!select || !select.options[select.selectedIndex]) return null;
  const itemId = parseInt(select.value, 10);
  const name = select.options[select.selectedIndex].text || t('noItem');
  return {
    label,
    name,
    meta: getItemEffectDescription(itemId) || meta,
    image: getItemImage(itemId, name, rewardStyle)
  };
}

function setFieldVisibility(fieldId, visible) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.toggle('hidden', !visible);
}

function setFieldPreviewOnly(fieldId, previewOnly) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.toggle('field-preview-only', !!previewOnly);
}

function updateMissionFieldVisibility() {
  const typeData = getCurrentTypeData();
  if (!typeData) return;

  const rewardType = parseInt(document.getElementById('rewardTypeBox')?.value || '0', 10);
  const eggGlitch = isEggGlitchEnabled();
  const clientFixed = hasOwn(typeData, 'forceClient');
  const targetFixed = hasOwn(typeData, 'forceTarget');
  // Se il bersaglio coincide con il committente il campo non serve.
  const targetSameAsClient = !!typeData.clientIsTarget || (targetFixed && typeData.forceTarget === typeData.forceClient);

  setFieldVisibility('missionTypeField', !eggGlitch);
  setFieldVisibility('dungeonField', !eggGlitch);
  setFieldVisibility('floorField', !eggGlitch);
  setFieldVisibility('floorLimitHint', !eggGlitch);
  setFieldVisibility('missionDifficultyHint', !eggGlitch);
  const advancedPanel = document.getElementById('advancedOptionsPanel');
  if (advancedPanel) advancedPanel.classList.toggle('hidden', eggGlitch);
  const targetSection = document.getElementById('targetSectionCard');
  if (targetSection) targetSection.classList.toggle('hidden', eggGlitch);

  setFieldVisibility('allPokemonFormsField', !eggGlitch);
  setFieldPreviewOnly('clientField', !eggGlitch && clientFixed);
  setFieldVisibility('targetField', !eggGlitch && !targetSameAsClient);
  setFieldPreviewOnly('targetField', !eggGlitch && targetFixed);
  setFieldVisibility('target2', !eggGlitch && !!typeData.useTarget2);
  setFieldVisibility('targetItemField', !eggGlitch && !!typeData.useTargetItem);
  setFieldVisibility('rewardTypeField', !eggGlitch && !typeData.noReward);
  setFieldVisibility('rewardItemField', !eggGlitch && !typeData.noReward && rewardType >= 1 && rewardType <= 4);
  const rewardPokemon = !eggGlitch && !typeData.noReward && (rewardType === 5 || rewardType === 6);
  setFieldVisibility('rewardPokemonField', rewardPokemon);
  if (rewardPokemon) {
    populateRewardPokemonList(false);
    updateRewardPokemonTexts(rewardType);
  }
  setFieldVisibility('eggPokemonField', eggGlitch);
  setFieldVisibility('eggHelpCard', eggGlitch);
  updateTargetItemLabel(typeData);
}

function getPokemonPreviewData(selectId, femaleId, forcedId, label, meta) {
  const select = document.getElementById(selectId);
  const female = !!(femaleId && document.getElementById(femaleId)?.checked);
  const forced = Number.isFinite(forcedId);
  const baseId = forced ? forcedId : parseInt(select && select.value ? select.value : '', 10);
  const monId = forced ? forcedId : WMSGen.getTrueMonID(baseId, female);
  const name = forced ? getLocalizedPokemonName(forcedId) : monNameFromSelect(selectId, femaleId);

  return {
    label,
    name,
    meta,
    image: getPokemonImage(monId || baseId, name)
  };
}

function getEggPokemonPreviewData(selectId, label, meta) {
  const select = document.getElementById(selectId);
  if (!select || !select.options[select.selectedIndex]) return null;

  const rawId = parseInt(select.value, 10);
  if (!Number.isFinite(rawId)) return null;

  const baseId = getEggPokemonBaseId(rawId);
  const name = getEggPokemonDisplayName(rawId);

  return {
    label,
    name,
    meta,
    image: getPokemonImage(rawId, name)
  };
}

function refreshMissionUi() {
  updateMissionFieldVisibility();
  syncDungeonFloorLimit();
  updateMissionDifficultyHint();
  updateEntityPreviews();
  updateRoomPicker();
  // I menu cambiati dal codice (preset, lettura di una password) non avvisano i campi di ricerca.
  refreshSearchBoxSelections();
}

function resolveInitialLanguage() {
  const available = getAvailableLanguages();
  const fromUrl = getUrlLanguage();
  const stored = getStoredLanguage();
  if (available.includes(fromUrl)) return fromUrl;
  if (available.includes(stored)) return stored;
  return getDefaultLanguage();
}

// ---------------------------------------------------------------------------
// Barra "Parti da": un solo pannello aperto alla volta
// ---------------------------------------------------------------------------

// Leggi una password, Accesso rapido, Cerca un premio e Sblocca un dungeon sono modi diversi di cominciare:
// ne serve uno alla volta. Compilando il modulo a mano il pannello aperto si chiude, così modulo e
// risultato restano in vista.
const START_PANEL_IDS = ['readerCard', 'presetsCard', 'farmCard', 'unlockCard'];

// Diventa vero mentre un punto di partenza (preset, lettura, premio) riempie il modulo da solo.
let fillingFormFromTool = false;

function withToolCardsOpen(action) {
  fillingFormFromTool = true;
  try {
    return action();
  } finally {
    fillingFormFromTool = false;
  }
}

function isStartPanelOpen(id) {
  const panel = document.getElementById(id);
  return !!panel && !panel.hidden;
}

function openStartPanel(id) {
  START_PANEL_IDS.forEach((panelId) => {
    const panel = document.getElementById(panelId);
    const tab = document.getElementById(`tab-${panelId}`);
    const open = panelId === id;
    if (panel) panel.hidden = !open;
    if (tab) {
      tab.setAttribute('aria-selected', open ? 'true' : 'false');
      tab.classList.toggle('active', open);
    }
  });
  const panel = document.getElementById(id);
  if (panel) flashElement(panel, 'panel-in');
  if (id === 'unlockCard' && !document.getElementById('unlockOutput')?.value) generateUnlockPassword(false);
  if (id === 'readerCard') document.getElementById('importCode')?.focus({ preventScroll: true });
}

function closeStartPanels() {
  START_PANEL_IDS.forEach((panelId) => {
    const panel = document.getElementById(panelId);
    const tab = document.getElementById(`tab-${panelId}`);
    if (panel) panel.hidden = true;
    if (tab) {
      tab.setAttribute('aria-selected', 'false');
      tab.classList.remove('active');
    }
  });
}

function toggleStartPanel(id) {
  if (isStartPanelOpen(id)) closeStartPanels();
  else openStartPanel(id);
}

// Modifica a mano del modulo: si chiude il pannello aperto e la riga dell'origine lo segnala.
function closeToolCards(event) {
  if (fillingFormFromTool) return;
  const target = event && event.target;
  if (target && (target.id === 'regionBox' || target.closest?.('#startBar'))) return;
  closeStartPanels();
  if (formOrigin && !formOrigin.edited) {
    formOrigin.edited = true;
    renderOriginBar();
  }
}

// ---------------------------------------------------------------------------
// Da dove viene il contenuto del modulo, con Annulla
// ---------------------------------------------------------------------------

// { text, panel, before, changed, edited }: l'ultimo punto di partenza che ha compilato il modulo.
let formOrigin = null;
const FIELD_FLASH_MS = 1600;

function snapshotForm() {
  const form = document.getElementById('genForm');
  const values = {};
  if (form) {
    form.querySelectorAll('input[id], select[id], textarea[id]').forEach((node) => {
      values[node.id] = node.type === 'checkbox' ? node.checked : node.value;
    });
  }
  return {
    values,
    code: document.getElementById('compactOutput')?.value || '',
    region: getSelectedRegion()
  };
}

// Campi del modulo cambiati tra due fotografie: il riquadro .field che li contiene, una volta sola.
function changedFields(before, after) {
  const fields = new Set();
  Object.keys(after.values).forEach((id) => {
    if (before.values[id] === after.values[id]) return;
    const node = document.getElementById(id);
    const field = node && node.closest('.field, .check-row, .field-pair > div');
    if (field && field.offsetParent !== null) fields.add(field);
  });
  return Array.from(fields);
}

// Quanti campi ha evidenziato l'ultimo punto di partenza (lo guardano anche i test).
let lastHighlightCount = 0;

function highlightFields(fields) {
  lastHighlightCount = fields.length;
  fields.forEach((field) => {
    field.classList.remove('field-changed');
    void field.offsetWidth;
    field.classList.add('field-changed');
    window.setTimeout(() => field.classList.remove('field-changed'), FIELD_FLASH_MS);
  });
}

/**
 * Esegue un punto di partenza che compila il modulo (preset, lettura, premio, missione simile):
 * fotografa il modulo prima e dopo, evidenzia i campi cambiati e prepara «Annulla».
 * `origin` = { text, panel }: funzione che scrive l'origine (si ritraduce) e pannello da riaprire con «Cambia».
 */
function runFormAction(origin, action) {
  const before = snapshotForm();
  const result = withToolCardsOpen(action);
  const after = snapshotForm();
  const fields = changedFields(before, after);
  highlightFields(fields);
  formOrigin = Object.assign({}, origin, { before, changed: fields.length, edited: false });
  renderOriginBar();
  return result;
}

function renderOriginBar() {
  const bar = document.getElementById('originBar');
  const text = document.getElementById('originText');
  if (!bar || !text) return;
  bar.hidden = !formOrigin;
  if (!formOrigin) return;
  let state;
  if (formOrigin.edited) state = t('originEdited');
  else if (formOrigin.changed === 1) state = t('originChangedOne');
  else if (formOrigin.changed > 1) state = t('originChanged', { count: formOrigin.changed });
  else state = t('originUnchanged');
  text.textContent = `${formOrigin.text()} · ${state}`;
  const undo = document.getElementById('originUndo');
  if (undo) undo.hidden = formOrigin.edited || !formOrigin.before;
  const change = document.getElementById('originChange');
  if (change) change.hidden = !formOrigin.panel;
}

// Riporta il modulo com'era prima dell'ultimo punto di partenza. Se c'era una password valida si
// ricarica quella (stessa missione, stesso seme); altrimenti si rimettono i valori dei campi.
function undoFormAction() {
  const before = formOrigin && formOrigin.before;
  if (!before) return;
  const decoded = before.code ? WMSParser.decodeWithRegion(before.code, before.region) : null;
  withToolCardsOpen(() => {
    setSelectedRegion(before.region);
    if (decoded && decoded.crcOk) {
      importDecodedStruct(decoded);
    } else {
      restoreFormValues(before.values);
    }
  });
  const fields = changedFields(snapshotForm(), before);
  formOrigin = null;
  renderOriginBar();
  generateCode();
  highlightFields(fields);
  setStatus('statusLine', 'originUndone', null, 'ok');
}

function restoreFormValues(values) {
  const apply = (id) => {
    const node = document.getElementById(id);
    if (!node || !(id in values)) return;
    if (node.type === 'checkbox') node.checked = values[id];
    else node.value = values[id];
  };
  // Prima il tipo di missione, che decide sottotipi ed elenchi dei Pokémon, poi tutto il resto.
  apply('missionTypeBox');
  WMSGen.fillSubTypeList();
  apply('missionSubTypeBox');
  WMSGen.update();
  Object.keys(values).forEach(apply);
  WMSGen.update();
  refreshMissionUi();
  refreshSearchBoxSelections();
}

// Mela: ricompensa predefinita, così la combinazione iniziale è subito valida.
const DEFAULT_REWARD_ITEM = 109;
// Gommaincanto: il tesoro più comune nei Memo tesoro reali.
const DEFAULT_TREASURE_ITEM = 136;

onReady(() => {
  currentLanguage = resolveInitialLanguage();

  WMSGen.advanced = false;
  WMSGen.translate = t;
  WMSGen.getFloorLimit = getDungeonFloorLimit;
  WMSGen.onMonsterListsChange = rebuildPokemonLists;
  WMSGen.setup(document.getElementById('genForm'));
  WMSGen.showAllPokemon = !!document.getElementById('allPokemonForms')?.checked;
  populateEggPokemonList();
  relabelItemSelect('targetItemBox');
  relabelItemSelect('rewardItemBox');
  setSelectByValue(document.getElementById('rewardItemBox'), DEFAULT_REWARD_ITEM);
  setSelectByValue(document.getElementById('targetItemBox'), DEFAULT_TREASURE_ITEM);
  setSelectedRegion('eu');

  const watchedIds = [
    'missionTypeBox', 'missionSubTypeBox', 'dungeonBox', 'floor', 'clientBox', 'clientF',
    'targetBox', 'targetF', 'target2Box', 'target2F', 'targetItemBox', 'rewardTypeBox',
    'rewardItemBox', 'regionBox', 'flavorText', 'specialFloor', 'eggPokemonBox', 'rewardPokemonBox'
  ];

  watchedIds.forEach((id) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.addEventListener('change', (event) => {
      closeToolCards(event);
      if (id === 'floor') {
        syncDungeonFloorLimit(true);
      }
      if (isEggGlitchEnabled() && ['missionTypeBox', 'dungeonBox', 'floor', 'targetItemBox', 'rewardTypeBox', 'clientBox', 'clientF'].includes(id)) {
        applyEggGlitchPreset();
      }
      if (id === 'missionTypeBox') {
        WMSGen.fillSubTypeList();
        // La stanza speciale dipende dal tipo di missione: non portarla da un tipo all'altro.
        document.getElementById('specialFloor').value = '';
        // Uno strumento da lancio non può essere lo strumento obiettivo: meglio partire da uno valido.
        const targetItem = document.getElementById('targetItemBox');
        const mainType = WMSGen.getTypeData() ? WMSGen.getTypeData().mainType : 0;
        if (targetItem && WMSGen.getTargetItemError(parseInt(targetItem.value, 10), mainType)) {
          setSelectByValue(targetItem, DEFAULT_TREASURE_ITEM);
        }
      }
      WMSGen.update();
      refreshMissionUi();
      scheduleLiveGeneration();
    });
    node.addEventListener('input', (event) => {
      closeToolCards(event);
      refreshMissionUi();
      scheduleLiveGeneration(['floor', 'specialFloor', 'flavorText'].includes(id) ? 220 : 120);
    });
  });

  document.getElementById('allPokemonForms')?.addEventListener('change', (event) => {
    WMSGen.showAllPokemon = !!event.target.checked;
    rebuildPokemonLists();
    WMSGen.update();
    refreshMissionUi();
    scheduleLiveGeneration();
  });

  document.getElementById('eggGlitch')?.addEventListener('change', (event) => {
    if (event.target.checked) {
      applyEggGlitchPreset();
    }
    WMSGen.update();
    refreshMissionUi();
    scheduleLiveGeneration();
  });

  document.getElementById('randomSeedBtn')?.addEventListener('click', () => {
    const flavor = document.getElementById('flavorText');
    flavor.value = '';
    scheduleLiveGeneration();
  });

  initializeSearchBoxes();

  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      requestPasswordAnimation();
      applyPresetFromButton(btn.dataset.preset);
    });
  });

  document.getElementById('generateBtn').addEventListener('click', () => {
    requestPasswordAnimation();
    generateCode();
  });
  document.getElementById('importCodeBtn')?.addEventListener('click', importCode);
  document.getElementById('importCode')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      importCode();
    }
  });
  document.getElementById('copyPrettyBtn').addEventListener('click', () => copyFrom('outputbox'));
  document.getElementById('copyCompactBtn').addEventListener('click', () => copyFrom('compactOutput'));

  applyPreset('default');
  WMSGen.update();
  refreshMissionUi();
  generateCode();
});

function updateEntityPreviews() {
  const typeData = getCurrentTypeData();
  if (!typeData) return;

  // Pokémon: l'anteprima serve solo quando il Pokémon è imposto dalla missione (il campo di ricerca è
  // nascosto); negli altri casi c'è già il ritratto accanto al campo e nell'anteprima della missione.
  renderEntityPreview('clientPreview', hasOwn(typeData, 'forceClient')
    ? getPokemonPreviewData('clientBox', 'clientF', typeData.forceClient, t('clientLabel'), t('forcedMissionPokemon'))
    : null);
  renderEntityPreview('targetPreview', hasOwn(typeData, 'forceTarget')
    ? getPokemonPreviewData('targetBox', 'targetF', typeData.forceTarget, t('targetLabel'), t('forcedMissionPokemon'))
    : null);

  renderEntityPreview(
    'targetItemPreview',
    typeData.useTargetItem
      ? getItemPreviewData('targetItemBox', getTargetItemLabel(typeData), t('currentSelectedItem'), false)
      : null
  );

  const rewardType = parseInt(document.getElementById('rewardTypeBox')?.value || '0', 10);
  renderEntityPreview(
    'rewardItemPreview',
    !typeData.noReward && rewardType >= 1 && rewardType <= 4
      ? getItemPreviewData('rewardItemBox', t('rewardPreviewLabel'), t('currentSelectedItem'), true)
      : null
  );

  renderEntityPreview(
    'eggPokemonPreview',
    isEggGlitchEnabled()
      ? getEggPokemonPreviewData('eggPokemonBox', t('eggPreviewLabel'), t('eggPreviewMeta'))
      : null
  );
}

// ---------------------------------------------------------------------------
// Animazioni
// ---------------------------------------------------------------------------

function wantsLessMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// La password compare carattere per carattere, come i testi del gioco.
let typeTimer = null;

// Ferma la scrittura in corso: se arriva un errore non deve continuare a comparire la password vecchia.
function stopTyping() {
  if (typeTimer) {
    window.clearInterval(typeTimer);
    typeTimer = null;
  }
}

function showPassword(output, text, animate) {
  stopTyping();
  if (!animate || wantsLessMotion() || document.activeElement === output) {
    output.value = text;
    return;
  }
  const letters = Array.from(text);
  let shown = 0;
  output.value = '';
  typeTimer = window.setInterval(() => {
    shown += 2;
    output.value = letters.slice(0, shown).join('');
    if (shown >= letters.length) {
      window.clearInterval(typeTimer);
      typeTimer = null;
      output.value = text;
    }
  }, 18);
}

// Un lampo dorato sulla finestra quando la password è pronta.
function flashElement(node, className) {
  if (!node || wantsLessMotion()) return;
  node.classList.remove(className);
  // Riavvia l'animazione anche se era già in corso.
  void node.offsetWidth;
  node.classList.add(className);
  window.setTimeout(() => node.classList.remove(className), 700);
}

// La password si scrive da sola solo dopo un pulsante, non mentre si compila il modulo a mano.
let animateNextPassword = false;

function requestPasswordAnimation() {
  animateNextPassword = true;
}

function generateCode() {
  const output = document.getElementById('outputbox');
  const compact = document.getElementById('compactOutput');
  const card = document.getElementById('resultCard');

  const animate = animateNextPassword;
  animateNextPassword = false;
  stopTyping();
  const showErrors = (errors) => {
    output.value = errors.map((error) => `• ${error}`).join('\n');
    compact.value = '';
    setStatus('statusLine', 'blockedCombination', null, 'error');
    if (card) card.classList.add('has-errors');
    updateOutputCards();
  };

  const errors = WMSGen.verify();
  if (errors.length) {
    showErrors(errors);
    return;
  }

  let pretty;
  try {
    pretty = WMSGen.generate();
  } catch (error) {
    // Un campo non entra nei bit della password, oppure la verifica finale non è andata a buon fine.
    const fieldErrors = error && error.errors
      ? error.errors.map((entry) => t('errorFieldRange', { field: t(`field_${entry.field}`), max: entry.max }))
      : [t('errorSelfCheck')];
    showErrors(fieldErrors);
    return;
  }

  showPassword(output, pretty, animate);
  compact.value = compactCode(pretty);
  const region = getSelectedRegion();
  setStatus('statusLine', 'generatedFor', () => ({ region: getRegionName(region) }));
  if (card) {
    card.classList.remove('has-errors');
    flashElement(card, 'card-flash');
  }
  updateOutputCards();
}

let liveGenerateTimer = null;

function scheduleLiveGeneration(delay = 0) {
  if (liveGenerateTimer) {
    window.clearTimeout(liveGenerateTimer);
    liveGenerateTimer = null;
  }

  liveGenerateTimer = window.setTimeout(() => {
    liveGenerateTimer = null;
    generateCode();
  }, Math.max(0, delay));
}

// Messaggi di stato: si ricordano chiave e valori, così cambiando lingua vengono ritradotti.
const statusMessages = {};

function renderStatus(id) {
  const node = document.getElementById(id);
  const entry = statusMessages[id];
  if (!node) return;
  node.textContent = entry ? t(entry.key, typeof entry.values === 'function' ? entry.values() : entry.values) : '';
  node.dataset.state = (entry && entry.state) || '';
}

function setStatus(id, key, values, state) {
  statusMessages[id] = key ? { key, values, state } : null;
  renderStatus(id);
}

function importCode() {
  const input = document.getElementById('importCode');
  if (!input) return;
  requestPasswordAnimation();

  const raw = input.value.trim();
  if (!raw) {
    setStatus('importStatus', 'importCodeEmpty', null, 'error');
    return;
  }

  const decoded = detectWonderMailCode(raw);
  if (!decoded) {
    setStatus('importStatus', 'importCodeInvalid', null, 'error');
    return;
  }

  if (isUnlockGlitchStruct(decoded.struct) && showUnlockFromPassword(decoded)) {
    setStatus('importStatus', 'importUnlock', () => ({ dungeon: getDungeonName(decoded.struct.dungeon) }), 'ok');
    return;
  }

  const values = () => ({ region: getRegionName(decoded.region) });
  const fullyMapped = runFormAction({ text: () => t('originRead', values()), panel: 'readerCard' },
    () => importDecodedStruct(decoded));
  // Letta per intero: il pannello si richiude e restano in vista modulo e risultato.
  if (fullyMapped) closeStartPanels();
  setStatus('importStatus', fullyMapped ? 'importCodeOk' : 'importCodePartial', values, fullyMapped ? 'ok' : 'warning');
  setStatus('statusLine', null);
  const card = document.getElementById('resultCard');
  if (card) card.classList.remove('has-errors');
  const job = document.getElementById('jobCard');
  if (job) {
    job.classList.remove('flash');
    void job.offsetWidth;
    job.classList.add('flash');
  }
}

async function copyFrom(id) {
  const el = document.getElementById(id);
  if (!el || !el.value.trim()) {
    setStatus('statusLine', 'nothingToCopy', null, 'error');
    return;
  }
  const compact = id === 'compactOutput';
  try {
    await navigator.clipboard.writeText(el.value.trim());
    setStatus('statusLine', compact ? 'compactCopied' : 'codeCopied', null, 'ok');
  } catch (e) {
    setStatus('statusLine', 'copyFailed', null, 'error');
  }
}

// ---------------------------------------------------------------------------
// Missioni a caso (accessi rapidi)
// ---------------------------------------------------------------------------

// Indici di WMSGenData.missionTypes: 0-9 le missioni normali, 10 e 11 gli arresti, 12 le Lettere di sfida,
// 13 i Memo tesoro.
const RANDOM_NORMAL_TYPES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const RANDOM_OUTLAW_TYPES = [10, 11];
const RANDOM_ANY_TYPES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Un'opzione a caso tra quelle disponibili, saltando le caselle spente.
function pickRandomOption(selectId, allowed) {
  const select = document.getElementById(selectId);
  if (!select || select.disabled || !select.options.length) return null;
  let values = Array.from(select.options, (option) => option.value).filter((value) => value !== '');
  if (typeof allowed === 'function') {
    const usable = values.filter((value) => allowed(parseInt(value, 10)));
    if (usable.length) values = usable;
  }
  if (!values.length) return null;
  const value = pickRandom(values);
  setSelectByValue(select, value);
  return parseInt(value, 10);
}

function randomCheckbox(id) {
  const box = document.getElementById(id);
  if (!box || box.disabled) return;
  box.checked = Math.random() < 0.5;
}

// Un piano valido: entro il limite del dungeon e non tra quelli che il gioco rifiuta.
function pickRandomFloor(dungeonId) {
  const limit = getDungeonFloorLimit(dungeonId);
  const forbidden = WMSGen.getForbiddenFloors(dungeonId);
  const floors = [];
  for (let floor = 1; floor <= limit; floor += 1) {
    if (!forbidden.includes(floor)) floors.push(floor);
  }
  return floors.length ? pickRandom(floors) : 1;
}

/**
 * Riempie il modulo con una missione a caso di uno dei tipi indicati e la genera.
 * I valori escono dagli elenchi del modulo, che seguono già le regole del gioco; se la combinazione
 * non va bene (per esempio una consegna in un dungeon senza strumenti) si riprova con altri valori.
 * Con `plainRooms` restano fuori i sottotipi con una stanza speciale (Sala Proibita e Sala d'Oro).
 */
function randomizeMission(typeIndexes, options = {}) {
  const typeSelect = document.getElementById('missionTypeBox');
  const subSelect = document.getElementById('missionSubTypeBox');
  const floorInput = document.getElementById('floor');
  const eggGlitch = document.getElementById('eggGlitch');
  if (!typeSelect || !floorInput) return;
  if (eggGlitch) eggGlitch.checked = false;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    setSelectByValue(typeSelect, pickRandom(typeIndexes));
    WMSGen.fillSubTypeList();
    if (subSelect && subSelect.options.length) {
      setSelectByValue(subSelect, pickRandom(Array.from(subSelect.options, (option) => option.value)));
      const chosen = WMSGen.getTypeData();
      if (options.plainRooms && chosen && (chosen.specialFloor !== undefined || chosen.specialFloorFromList)) {
        setSelectByValue(subSelect, subSelect.options[0].value);
      }
    }
    document.getElementById('specialFloor').value = '';
    document.getElementById('flavorText').value = '';
    WMSGen.update();

    const typeData = WMSGen.getTypeData() || {};
    ['clientBox', 'targetBox', 'target2Box'].forEach((id) => pickRandomOption(id));
    ['clientF', 'targetF', 'target2F'].forEach(randomCheckbox);
    const dungeon = pickRandomOption('dungeonBox');
    floorInput.value = String(pickRandomFloor(dungeon));
    pickRandomOption('targetItemBox', (itemId) => !WMSGen.getTargetItemError(itemId, typeData.mainType));
    const rewardType = document.getElementById('rewardTypeBox');
    if (rewardType && !rewardType.disabled) {
      setSelectByValue(rewardType, String(Math.floor(Math.random() * 5)));
      WMSGen.update();
    }
    pickRandomOption('rewardItemBox');

    WMSGen.update();
    refreshMissionUi();
    if (!WMSGen.verify().length) return;
  }
}

// Missione uovo: la specie che esce dall'uovo cambia a ogni clic.
function randomizeEggMission() {
  applyEggGlitchPreset();
  const species = (window.WMSkyGameData && window.WMSkyGameData.missionTargets) || [];
  const select = document.getElementById('eggPokemonBox');
  if (select && species.length) setSelectByValue(select, pickRandom(species));
  WMSGen.update();
  refreshMissionUi();
}

function applyPreset(kind) {
  return withToolCardsOpen(() => applyPresetNow(kind));
}

// Preset scelto da «Accesso rapido»: come applyPreset, con origine e «Annulla».
function applyPresetFromButton(kind) {
  const button = document.querySelector(`.preset-btn[data-preset="${kind}"]`);
  return runFormAction({
    text: () => t('originPreset', { name: button ? button.textContent.trim() : kind }),
    panel: 'presetsCard'
  }, () => applyPresetNow(kind));
}

function applyPresetNow(kind) {
  const typeSelect = document.getElementById('missionTypeBox');
  const subSelect = document.getElementById('missionSubTypeBox');
  const eggGlitch = document.getElementById('eggGlitch');
  if (eggGlitch) eggGlitch.checked = kind === 'egg';

  const specialMap = {
    // All'avvio la pagina parte da una missione semplice, non da una a caso.
    default: () => {
      setSelectByValue(typeSelect, findMissionTypeIndex(0));
    },
    standard: () => {
      randomizeMission(RANDOM_NORMAL_TYPES, { plainRooms: true });
    },
    outlaw: () => {
      randomizeMission(RANDOM_OUTLAW_TYPES);
    },
    surprise: () => {
      randomizeMission(RANDOM_ANY_TYPES);
    },
    memo: () => {
      setSelectByValue(typeSelect, findMissionTypeIndex(12));
      // Come nelle missioni vere: una Gommaincanto nel Tecalusso.
      setSelectByValue(document.getElementById('targetItemBox'), DEFAULT_TREASURE_ITEM);
    },
    egg: () => {
      randomizeEggMission();
    },
    mewtwo: () => {
      setSelectByValue(typeSelect, findMissionTypeIndex(11));
      WMSGen.fillSubTypeList();
      setSelectByValue(subSelect, findSubtypeIndex(findMissionTypeIndex(11), 'Mewtwo'));
    },
    entei: () => {
      setSelectByValue(typeSelect, findMissionTypeIndex(11));
      WMSGen.fillSubTypeList();
      setSelectByValue(subSelect, findSubtypeIndex(findMissionTypeIndex(11), 'Entei'));
    },
    raikou: () => {
      setSelectByValue(typeSelect, findMissionTypeIndex(11));
      WMSGen.fillSubTypeList();
      setSelectByValue(subSelect, findSubtypeIndex(findMissionTypeIndex(11), 'Raikou'));
    },
    suicune: () => {
      setSelectByValue(typeSelect, findMissionTypeIndex(11));
      WMSGen.fillSubTypeList();
      setSelectByValue(subSelect, findSubtypeIndex(findMissionTypeIndex(11), 'Suicune'));
    },
  };

  if (specialMap[kind]) {
    specialMap[kind]();
    document.getElementById('specialFloor').value = '';
    WMSGen.fillSubTypeList();
    relabelMissionTypeSelect();
    relabelMissionSubTypeSelect();
    WMSGen.update();
    refreshMissionUi();
    // La password deve seguire subito il preset scelto.
    scheduleLiveGeneration();
  }
}

onReady(() => {
  const picker = document.getElementById('languagePicker');
  const toggle = document.getElementById('languagePickerToggle');
  renderLanguagePicker();

  if (toggle) {
    toggle.addEventListener('click', () => toggleLanguagePicker());
  }

  document.addEventListener('click', (event) => {
    if (!picker || picker.contains(event.target)) return;
    closeLanguagePicker();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLanguagePicker();
    }
  });

  document.getElementById('missionTypeBox')?.addEventListener('change', () => {
    relabelMissionTypeSelect();
    relabelMissionSubTypeSelect();
  });

  applyLanguage(currentLanguage, { persist: false });
});

// ---------------------------------------------------------------------------
// Ritratti dei Pokémon in stile Mystery Dungeon (PMDCollab SpriteCollab)
// ---------------------------------------------------------------------------

const PORTRAIT_BASE_URL = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/';

// Forme con un ritratto proprio in SpriteCollab: ID del gioco -> cartella.
const PORTRAIT_FORMS = (() => {
  const forms = {
    279: '0251/0000/0001', // Celebi rosa (cromatico)
    380: '0351/0001', 381: '0351/0002', 382: '0351/0003', // Castform Sole, Pioggia, Nuvola di Neve
    384: '0352/0001', // Kecleon viola
    419: '0386/0001', 420: '0386/0002', 421: '0386/0003', // Deoxys Attacco, Difesa, Velocità
    447: '0412/0002', 449: '0412/0001', // Burmy Manto Scarti e Manto Sabbia
    450: '0413/0001', 452: '0413/0002', // Wormadam Manto Sabbia e Manto Scarti
    461: '0421/0001', // Cherrim Forma Splendore
    463: '0422/0001', 465: '0423/0001', // Shellos e Gastrodon Mare Est
    535: '0492/0001', 536: '0487/0001', // Shaymin Forma Cielo, Giratina Forma Originale
    552: '0483/0002', // Dialga primordiale
    575: '0040/0001' // Mamma
  };
  // Unown da B a Z, ! e ?
  for (let index = 0; index < 27; index += 1) {
    forms[202 + index] = `0201/${String(index + 1).padStart(4, '0')}`;
  }
  return forms;
})();

// Le forme della storia (ID da 552 in su) usano il ritratto della specie con lo stesso nome.
function getPortraitSpecies(baseId) {
  if (baseId < 552) return baseId;
  const english = getGameText(FALLBACK_LANGUAGE);
  const names = english && english.pokemon;
  if (!names || !names[baseId]) return baseId;
  const first = names.indexOf(names[baseId]);
  return first > 0 ? first : baseId;
}

function getPortraitPath(monId) {
  const baseId = normalizePokemonId(monId);
  if (!Number.isFinite(baseId) || baseId < 1) return null;
  if (PORTRAIT_FORMS[baseId]) return PORTRAIT_FORMS[baseId];
  const species = getPortraitSpecies(baseId);
  if (PORTRAIT_FORMS[species]) return PORTRAIT_FORMS[species];
  const dexList = window.WMSkyGameData && window.WMSkyGameData.nationalDex;
  const dex = dexList && dexList[species % 600];
  return dex ? String(dex).padStart(4, '0') : null;
}

// Ritratto del Pokémon; senza rete (o senza ritratto) un riquadro con le iniziali.
function getPokemonImage(monId, label) {
  const fallback = buildPreviewBadge(label, 'pokemon');
  const path = getPortraitPath(monId);
  return { src: path ? `${PORTRAIT_BASE_URL}${path}/Normal.png` : fallback, fallback };
}

function createFallbackImage(payload, className, alt = '') {
  const image = document.createElement('img');
  image.className = className;
  image.alt = alt;
  image.decoding = 'async';
  image.src = payload.src;
  image.addEventListener('error', () => {
    if (payload.fallback && image.src !== payload.fallback) image.src = payload.fallback;
  });
  return image;
}

// Squadra decorativa in alto: Pokémon che si possono scegliere all'inizio del gioco.
const HERO_TEAM_CHOICES = [1, 4, 7, 25, 37, 52, 54, 66, 104, 133, 152, 155, 158, 258, 280, 283, 286, 328, 422, 425, 428, 438, 488, 489];

// La squadra si può cambiare cliccandoci sopra: ogni volta esce una formazione diversa.
function renderHeroTeam() {
  const team = document.getElementById('heroTeam');
  if (!team) return;
  const previous = Array.from(team.querySelectorAll('img')).map((image) => Number(image.dataset.monId));
  team.textContent = '';
  let pool = HERO_TEAM_CHOICES.filter((monId) => !previous.includes(monId));
  if (pool.length < 4) pool = HERO_TEAM_CHOICES.slice();
  for (let index = 0; index < 4 && pool.length; index += 1) {
    const [monId] = pool.splice(Math.floor(Math.random() * pool.length), 1);
    const frame = document.createElement('span');
    frame.className = 'portrait-frame hero-portrait';
    frame.style.setProperty('--delay', `${index * 0.35}s`);
    const image = document.createElement('img');
    image.alt = '';
    image.dataset.monId = String(monId);
    image.src = getPokemonImage(monId, '').src;
    // Senza rete la squadra non compare: è solo una decorazione.
    image.addEventListener('error', () => frame.remove());
    frame.appendChild(image);
    team.appendChild(frame);
  }
}

// Pulsante del repository in alto: compare solo se config.js indica un indirizzo.
function applyRepoLink() {
  const link = document.getElementById('repoLink');
  const url = window.WMSkyConfig && String(window.WMSkyConfig.repoUrl || '').trim();
  if (!link) return;
  if (url && /^https?:\/\//.test(url)) {
    link.href = url;
    link.hidden = false;
  } else {
    link.hidden = true;
  }
}

// Ritratti dei leggendari sui pulsanti delle Lettere di sfida.
function decoratePresetButtons() {
  document.querySelectorAll('.preset-btn img[data-portrait]').forEach((image) => {
    const monId = parseInt(image.dataset.portrait, 10);
    if (image.dataset.loaded === String(monId)) return;
    const payload = getPokemonImage(monId, getMonName(monId));
    image.src = payload.src;
    image.dataset.loaded = String(monId);
    image.addEventListener('error', () => {
      if (image.src !== payload.fallback) image.src = payload.fallback;
    });
  });
}

// ---------------------------------------------------------------------------
// Anteprima "Info missione" (con le frasi ufficiali del gioco)
// ---------------------------------------------------------------------------

// Frase dell'obiettivo per ogni tipo di missione del gioco (campo missionType della password).
const JOB_OBJECTIVES = {
  0: { text: 'rescue', subject: 'client' },
  1: { text: 'rescue', subject: 'target' },
  2: { text: 'escort', subject: 'target' },
  3: { text: 'explore', subject: 'client' },
  4: { text: 'prospect', subject: 'client' },
  5: { text: 'guide', subject: 'client' },
  6: { text: 'findItem', subject: 'item' },
  7: { text: 'deliverItem', subject: 'item' },
  8: { text: 'search', subject: 'target' },
  9: { text: 'takeItem', subject: 'target' },
  10: { text: 'arrest', subject: 'target' },
  11: { text: 'defeat', subject: 'client' },
  12: { text: 'findTreasure', subject: null }
};

function jobText(key) {
  const text = getGameText();
  const fallback = getGameText(FALLBACK_LANGUAGE);
  return (text && text.job && text.job[key]) || (fallback && fallback.job && fallback.job[key]) || '';
}

// Missione contenuta nella password mostrata (generata o letta).
function getOutputMission() {
  const code = document.getElementById('compactOutput')?.value || '';
  if (!code) return null;
  return WMSParser.decodeWithRegion(code, getSelectedRegion());
}

function makePersonValue(monId) {
  const wrap = document.createElement('span');
  wrap.className = 'job-person';
  const name = getLocalizedPokemonName(monId);
  wrap.append(createFallbackImage(getPokemonImage(monId, name), 'job-mini-portrait'), document.createTextNode(name));
  return wrap;
}

function makeItemValue(itemId, suffix) {
  const wrap = document.createElement('span');
  wrap.className = 'job-person';
  const name = getItemDisplayName(itemId);
  wrap.append(createFallbackImage(getItemImage(itemId, name, true), 'job-item-icon'), document.createTextNode(suffix ? `${name} ${suffix}` : name));
  return wrap;
}

function getRewardValue(struct) {
  const labels = getLocaleLabelMap('rewardTypes', getCurrentLanguage());
  const label = labels[struct.rewardType] || String(struct.rewardType);
  if (struct.rewardType >= 1 && struct.rewardType <= 4) {
    const wrap = document.createElement('span');
    wrap.className = 'job-reward';
    wrap.append(document.createTextNode(`${label} · `), makeItemValue(struct.reward));
    return wrap;
  }
  if (struct.rewardType === 5 && isEggGlitchStruct(struct)) {
    return document.createTextNode(`${label} · ${getEggPokemonDisplayName(struct.reward)}`);
  }
  if ((struct.rewardType === 5 || struct.rewardType === 6) && struct.reward > 0) {
    const wrap = document.createElement('span');
    wrap.className = 'job-reward';
    wrap.append(document.createTextNode(`${label} · `), makePersonValue(struct.reward));
    return wrap;
  }
  return document.createTextNode(label);
}

function addJobRow(list, label, value) {
  const row = document.createElement('div');
  row.className = 'job-row';
  const term = document.createElement('dt');
  term.textContent = label;
  const detail = document.createElement('dd');
  if (typeof value === 'string') detail.textContent = value;
  else detail.appendChild(value);
  row.append(term, detail);
  list.appendChild(row);
}

// Legge le righe di «Info missione» come coppie etichetta/valore, per capire cosa è cambiato.
function readJobRows(list) {
  const rows = {};
  list.querySelectorAll('.job-row').forEach((row) => {
    const label = row.querySelector('dt');
    const value = row.querySelector('dd');
    if (label && value) rows[label.textContent] = value.textContent;
  });
  return rows;
}

// Cambio di missione: la scheda fa un breve cambio pagina e i valori nuovi si accendono un istante.
function animateJobChanges(card, fields, before, previousObjective) {
  if (wantsLessMotion()) return;
  const after = readJobRows(fields);
  const changed = Object.keys(after).filter((label) => before[label] !== undefined && before[label] !== after[label]);
  const objectiveChanged = previousObjective !== document.getElementById('jobObjective').textContent;
  if (!changed.length && !objectiveChanged) return;
  if (objectiveChanged) flashElement(card, 'job-turn');
  fields.querySelectorAll('.job-row').forEach((row) => {
    const label = row.querySelector('dt');
    if (!label || changed.indexOf(label.textContent) === -1) return;
    flashElement(row.querySelector('dd'), 'value-flash');
  });
}

function renderJobCard() {
  const card = document.getElementById('jobCard');
  const title = document.getElementById('jobTitle');
  const objective = document.getElementById('jobObjective');
  const portrait = document.getElementById('jobPortrait');
  const rank = document.getElementById('jobRank');
  const fields = document.getElementById('jobFields');
  const note = document.getElementById('jobNote');
  if (!card || !title || !objective || !portrait || !rank || !fields || !note) return;

  title.textContent = jobText('title');
  const previousRows = readJobRows(fields);
  const previousObjective = objective.textContent;
  fields.innerHTML = '';
  const result = getOutputMission();
  card.classList.toggle('job-card-invalid', !result);
  if (!result) {
    renderJobLetter(null);
    objective.textContent = t('jobInvalid');
    portrait.hidden = true;
    rank.textContent = '';
    rank.hidden = true;
    note.textContent = t('jobInvalidHint');
    return;
  }

  const struct = result.struct;
  const egg = isEggGlitchStruct(struct);
  const info = JOB_OBJECTIVES[struct.missionType];
  const subjectName = info && info.subject === 'target'
    ? getLocalizedPokemonName(struct.target)
    : getLocalizedPokemonName(struct.client);
  objective.textContent = info
    ? jobText(info.text).replace('[name:0]', subjectName).replace('[item:0]', getItemDisplayName(struct.targetItem))
    : t('jobUnknownType');

  renderJobLetter(struct);

  const clientName = getLocalizedPokemonName(struct.client);
  const payload = getPokemonImage(struct.client, clientName);
  portrait.hidden = false;
  portrait.alt = clientName;
  portrait.dataset.fallback = payload.fallback;
  portrait.onerror = () => {
    if (portrait.src !== portrait.dataset.fallback) portrait.src = portrait.dataset.fallback;
  };
  portrait.src = payload.src;

  addJobRow(fields, struct.missionType === 11 ? jobText('challenger') : jobText('client'), makePersonValue(struct.client));
  if (struct.missionType === 11 && struct.missionSpecial === 0) {
    const team = document.createElement('span');
    team.className = 'job-team';
    [struct.target, struct.target2].filter((id) => id > 0).forEach((id) => team.appendChild(makePersonValue(id)));
    addJobRow(fields, t('jobTeam'), team);
  } else if (struct.target !== struct.client && ![11, 12].includes(struct.missionType)) {
    addJobRow(fields, t('jobTarget'), makePersonValue(struct.target));
  }
  if (struct.missionType === 10 && struct.target2 > 0) {
    addJobRow(fields, t('jobAccomplice'), makePersonValue(struct.target2));
  }
  const farm = struct.missionType === 12 && window.WMSkyRooms && WMSkyRooms.isWithoutTreasure(WMSkyRooms.getRoom(struct.specialFloor));
  if (struct.missionType === 12 || (struct.missionType === 3 && struct.missionSpecial === 1)) {
    let value = makeItemValue(struct.targetItem);
    if (farm) {
      // Nelle stanze senza tesoro lo strumento obiettivo non compare da nessuna parte.
      const wrap = document.createElement('span');
      const missing = document.createElement('span');
      missing.className = 'job-note';
      missing.textContent = t('jobTreasureMissing');
      wrap.append(value, missing);
      value = wrap;
    }
    addJobRow(fields, struct.missionType === 12 ? t('jobTreasure') : t('jobChamberItem'), value);
  } else if ([4, 6, 7, 9].includes(struct.missionType) && !egg) {
    addJobRow(fields, t('jobItem'), makeItemValue(struct.targetItem));
  }

  const place = `${getDungeonName(struct.dungeon)} · ${t('jobFloor', { floor: struct.floor })}`;
  addJobRow(fields, jobText('place'), place);

  const difficulty = egg ? null : getMissionDifficultyInfo();
  rank.hidden = !difficulty;
  rank.textContent = difficulty ? difficulty.rank : '';
  rank.dataset.tier = difficulty ? String(difficulty.rankId) : '';
  if (difficulty) {
    addJobRow(fields, jobText('difficulty'), t('jobDifficulty', { rank: difficulty.rank, points: difficulty.points }));
  }
  addJobRow(fields, jobText('reward'), getRewardValue(struct));
  addJobRow(fields, jobText('restrictions'), struct.restriction || struct.restrictionType ? t('jobRestrictionSet') : jobText('none'));

  if (egg) {
    note.textContent = t('jobNoteEgg');
  } else {
    note.textContent = t('jobNote', { seed: struct.flavorText, region: getRegionName(result.region) })
      + (farm ? ` ${t('jobNoteFarm')}` : '');
  }

  animateJobChanges(card, fields, previousRows, previousObjective);
}

// ---------------------------------------------------------------------------
// Titolo e descrizione della missione (testi_missione.js)
// ---------------------------------------------------------------------------

// Varianti già trovate per la missione mostrata: si azzerano quando cambia qualcosa di diverso dal seme.
let jobTextState = null;
const JOB_TEXT_BATCH = 5;

function getJobTextLanguage() {
  const lang = getCurrentLanguage();
  const texts = window.WMSkyGameText || {};
  return texts[lang] && texts[lang].missionTexts ? lang : FALLBACK_LANGUAGE;
}

// Scrive i pezzi di testo del gioco: nomi, strumenti e luoghi nella lingua corrente, con i colori del gioco.
function renderJobTextParts(node, parts) {
  node.textContent = '';
  const lang = getJobTextLanguage();
  const pieces = parts.map((part) => {
    let text = part.text;
    if (part.kind === 'pokemon') text = getLocalizedPokemonName(part.id);
    else if (part.kind === 'item') text = getItemDisplayName(part.id);
    else if (part.kind === 'dungeon') text = getDungeonName(part.id);
    else if (part.kind === 'floor') text = WMSkyJobText.formatFloor(part.value, part.dungeon, lang);
    else if (part.kind === 'team') text = t('jobTextTeam');
    return { text: text || '', color: part.kind === 'team' ? 'team' : part.color };
  });
  // Le frasi del gioco finiscono spesso con uno spazio o un a capo.
  if (pieces.length) {
    pieces[0].text = pieces[0].text.replace(/^\s+/, '');
    pieces[pieces.length - 1].text = pieces[pieces.length - 1].text.replace(/\s+$/, '');
  }
  pieces.forEach((piece) => {
    if (!piece.text) return;
    if (!piece.color) {
      node.appendChild(document.createTextNode(piece.text));
      return;
    }
    const span = document.createElement('span');
    span.className = `tx-${piece.color}`;
    span.textContent = piece.text;
    node.appendChild(span);
  });
}

// Tutto quello che conta per il testo tranne il seme: se cambia, le varianti trovate non valgono più.
function getJobTextMissionKey(struct) {
  return ['missionType', 'missionSpecial', 'dungeon', 'floor', 'client', 'target', 'target2', 'targetItem']
    .map((key) => struct[key]).join(',');
}

function renderJobLetter(struct) {
  const box = document.getElementById('jobLetter');
  if (!box) return;
  const text = struct && window.WMSkyJobText ? WMSkyJobText.describeMission(struct, getJobTextLanguage()) : null;
  box.hidden = !text;
  if (!text) {
    jobTextState = null;
    return;
  }
  renderJobTextParts(document.getElementById('jobLetterTitle'), text.title);
  renderJobTextParts(document.getElementById('jobLetterText'), text.summary);
  const guess = document.getElementById('jobLetterGuess');
  guess.hidden = !text.guessed;
  guess.textContent = text.guessed ? t('jobTextGuess') : '';

  const total = WMSkyJobText.variantCount(struct);
  const picker = document.getElementById('jobTextPicker');
  const fixed = document.getElementById('jobTextFixed');
  picker.hidden = total <= 1;
  fixed.hidden = total > 1;
  document.getElementById('jobTextPickerLabel').textContent = t('jobTextPick', { count: total });

  const key = getJobTextMissionKey(struct);
  if (!jobTextState || jobTextState.key !== key) {
    jobTextState = { key, total, variants: [], next: struct.flavorText, done: total <= 1 };
  }
  if (picker.open) renderJobTextOptions(struct);
}

function loadMoreJobTexts(struct) {
  if (!jobTextState || jobTextState.done) return;
  const found = WMSkyJobText.findVariants(struct, {
    from: jobTextState.next,
    wanted: JOB_TEXT_BATCH,
    skip: jobTextState.variants.map((variant) => variant.key)
  });
  jobTextState.variants.push(...found.variants);
  jobTextState.next = found.next;
  if (!found.variants.length || jobTextState.variants.length >= jobTextState.total) jobTextState.done = true;
}

function renderJobTextOptions(struct) {
  const list = document.getElementById('jobTextOptions');
  const more = document.getElementById('jobTextMore');
  if (!list || !jobTextState) return;
  if (!jobTextState.variants.length) loadMoreJobTexts(struct);
  const current = WMSkyJobText.textKey(struct);
  // Il testo della password mostrata sta sempre in elenco, anche se il seme è stato cambiato altrove.
  if (!jobTextState.variants.some((variant) => variant.key === current)) {
    jobTextState.variants.unshift({ seed: struct.flavorText, key: current });
  }
  const lang = getJobTextLanguage();
  list.textContent = '';
  jobTextState.variants.forEach((variant) => {
    const text = WMSkyJobText.describeMission(struct, lang, variant.seed);
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'job-text-option';
    button.dataset.seed = String(variant.seed);
    button.setAttribute('aria-current', variant.key === current ? 'true' : 'false');
    const title = document.createElement('span');
    title.className = 'job-text-option-title';
    renderJobTextParts(title, text.title);
    const body = document.createElement('span');
    body.className = 'job-text-option-text';
    renderJobTextParts(body, text.summary);
    const seed = document.createElement('span');
    seed.className = 'job-text-option-seed';
    seed.textContent = t('jobTextSeed', { seed: variant.seed });
    button.append(title, body, seed);
    item.appendChild(button);
    list.appendChild(item);
  });
  if (more) more.hidden = jobTextState.done;
}

function chooseJobText(seed) {
  runFormAction({ text: () => t('originJobText', { seed }), panel: null }, () => {
    if (!freezeOutputMission()) return;
    document.getElementById('flavorText').value = String(seed);
    refreshMissionUi();
    generateCode();
  });
}

function setupJobTextPicker() {
  const picker = document.getElementById('jobTextPicker');
  const list = document.getElementById('jobTextOptions');
  const more = document.getElementById('jobTextMore');
  if (!picker || !list || !more) return;
  picker.addEventListener('toggle', () => {
    const result = getOutputMission();
    if (picker.open && result) renderJobTextOptions(result.struct);
  });
  list.addEventListener('click', (event) => {
    const button = event.target.closest('.job-text-option');
    if (!button) return;
    chooseJobText(Number(button.dataset.seed));
  });
  more.addEventListener('click', () => {
    const result = getOutputMission();
    if (!result) return;
    loadMoreJobTexts(result.struct);
    renderJobTextOptions(result.struct);
  });
}

// ---------------------------------------------------------------------------
// Stanze speciali (stanze.js)
// ---------------------------------------------------------------------------

let roomPickerKey = '';

function getFormRoomPlan() {
  const typeData = getCurrentTypeData();
  if (!typeData || isEggGlitchEnabled() || !window.WMSkyRooms) return null;
  return WMSkyRooms.getRoomPlan(typeData);
}

function pickRoom(value) {
  const input = document.getElementById('specialFloor');
  if (!input) return;
  input.value = value;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function updateRoomPicker() {
  const field = document.getElementById('roomField');
  const picker = document.getElementById('roomPicker');
  const label = document.getElementById('roomFieldLabel');
  const hint = document.getElementById('roomHint');
  const note = document.getElementById('specialFloorNote');
  if (!field || !picker || !label || !hint) return;

  const plan = getFormRoomPlan();
  const value = String(document.getElementById('specialFloor')?.value || '').trim();
  if (note) {
    const ignored = !plan && value !== '' && !isEggGlitchEnabled();
    note.textContent = ignored ? t('specialFloorIgnored') : '';
    note.hidden = !ignored;
  }
  field.classList.toggle('hidden', !plan);
  if (!plan) {
    roomPickerKey = '';
    picker.innerHTML = '';
    return;
  }

  label.textContent = t('roomFieldLabel', { kind: WMSkyRooms.getKindLabel(plan.kind) });
  if (plan.rooms) {
    hint.textContent = plan.early ? t('roomHintMemo', { count: plan.early }) : t('roomHintList');
  } else {
    hint.textContent = plan.forced ? t('roomHintForced', { room: plan.fixed }) : t('roomHintFixed', { room: plan.fixed });
  }

  const key = `${plan.kind}|${plan.fixed || ''}|${value}|${getCurrentLanguage()}`;
  if (key === roomPickerKey) return;
  roomPickerKey = key;
  if (plan.rooms) {
    WMSkyRooms.renderPicker(picker, plan, value, pickRoom);
  } else {
    picker.innerHTML = '';
  }
}

function getRoomContext(struct, kind) {
  const person = (monId) => {
    if (!(monId > 0)) return null;
    const name = getLocalizedPokemonName(monId);
    return { name, image: getPokemonImage(monId, name) };
  };
  const context = {};
  if (kind === 'challenge' || kind === 'legendaryChallenge') {
    context.boss = person(struct.client);
    if (kind === 'challenge') {
      context.minion1 = person(struct.target);
      context.minion2 = person(struct.target2);
      context.minionLabel1 = t('tileTeamMember');
      context.minionLabel2 = t('tileTeamMember');
    }
  }
  if (kind === 'outlawHideout') {
    context.outlaw = person(struct.target);
    context.minion1 = person(struct.target2);
    context.minionLabel1 = t('tileAccomplice');
  }
  if (kind === 'treasureMemo' || kind === 'sealedChamber') {
    const name = getItemDisplayName(struct.targetItem);
    context.targetItem = { name, image: getItemImage(struct.targetItem, name, false) };
  }
  // Per le stanze con premi fissi: icone vere e contenuto dei Tecalusso nel dungeon della missione.
  context.dungeon = struct.dungeon;
  context.floor = struct.floor;
  context.dungeonName = getDungeonName(struct.dungeon);
  context.itemImage = (itemId) => getItemImage(itemId, getItemName(itemId), false);
  return context;
}

function renderRoomCard() {
  const card = document.getElementById('roomCard');
  if (!card || !window.WMSkyRooms) return;
  const result = getOutputMission();
  const struct = result && result.struct;
  const plan = struct && !isEggGlitchStruct(struct)
    ? WMSkyRooms.getRoomPlan({ mainType: struct.missionType, specialType: struct.missionSpecial })
    : null;
  card.classList.toggle('hidden', !plan);
  if (!plan) return;

  const roomId = plan.forced ? plan.fixed : struct.specialFloor;
  const room = WMSkyRooms.getRoom(roomId);
  const kind = document.getElementById('roomKind');
  const title = document.getElementById('roomTitle');
  const badge = document.getElementById('roomBadge');
  const map = document.getElementById('roomMap');
  const legend = document.getElementById('roomLegend');
  const facts = document.getElementById('roomFacts');
  const warning = document.getElementById('roomWarning');
  const example = document.getElementById('roomExample');
  const exampleText = document.getElementById('roomExampleText');
  const exampleCode = document.getElementById('roomExampleCode');

  kind.textContent = WMSkyRooms.getKindLabel(plan.kind);
  const ordinal = room && plan.rooms && room.kind === plan.kind ? WMSkyRooms.getRoomOrdinal(room) : null;
  if (ordinal) {
    title.textContent = t('roomTitleOrdinal', { room: roomId, ordinal, total: plan.rooms ? plan.rooms.length : 1 });
  } else if (room && room.dungeon !== undefined) {
    title.textContent = t('roomTitleDungeon', { room: roomId, dungeon: getDungeonName(room.dungeon) });
  } else if (room && room.kind !== plan.kind) {
    title.textContent = t('roomTitleKind', { room: roomId, kind: WMSkyRooms.getKindLabel(room.kind) });
  } else {
    title.textContent = t('roomNumber', { room: roomId });
  }

  const typed = String(document.getElementById('specialFloor')?.value || '').trim() !== '';
  const farm = plan.kind === 'treasureMemo' && WMSkyRooms.isWithoutTreasure(room);
  card.classList.toggle('room-farm', farm);
  if (farm) {
    badge.textContent = t('roomBadgeFarm');
  } else {
    badge.textContent = plan.forced || !plan.rooms
      ? t('roomBadgeFixed')
      : (typed ? t('roomBadgeChosen') : t('roomBadgeRandom'));
  }

  const context = struct ? getRoomContext(struct, plan.kind) : {};
  WMSkyRooms.renderMap(map, room, context);
  WMSkyRooms.renderLegend(legend, room, context);

  facts.innerHTML = '';
  const description = WMSkyRooms.describeRoom(room, plan, context);
  if (!room) {
    description.warning = roomId > 0 ? t('roomWarningUnknown', { room: roomId }) : t('roomWarningNone');
  }
  description.facts.forEach((fact) => {
    const item = document.createElement('li');
    item.textContent = fact;
    facts.appendChild(item);
  });
  warning.textContent = description.warning;
  warning.hidden = !description.warning;
  renderRoomBoxes(farm && WMSkyRooms.hasDungeonBoxes(room) ? struct : null);

  const sample = room && plan.kind === 'treasureMemo' ? WMSkyRooms.getMemoExample(room.id) : null;
  example.hidden = !sample;
  if (sample) {
    const region = getSelectedRegion();
    exampleText.textContent = t('roomExample', {
      dungeon: getDungeonName(sample.dungeon),
      floor: sample.floor,
      region: getRegionName(region)
    });
    exampleCode.textContent = prettyMailString(WMSParser.convertRegion(sample.code, sample.region, region), 2, 7);
  }
}

// Stanze senza tesoro: i Tecalusso si riempiono in base al dungeon della missione. La tabella del gioco
// mostra cosa si trova in ogni dungeon; toccando un dungeon lo si usa nella missione (stessa stanza e seme).
function renderRoomBoxes(struct) {
  const panel = document.getElementById('roomBoxes');
  const list = document.getElementById('roomBoxesList');
  if (!panel || !list) return;
  panel.hidden = !struct;
  list.innerHTML = '';
  if (!struct) return;

  const select = document.getElementById('dungeonBox');
  const available = new Set(select ? Array.from(select.options, (option) => option.value) : []);
  const table = WMSkyRooms.getBoxTable();
  const addRow = (dungeons, contents, current) => {
    const row = document.createElement('li');
    row.className = 'room-boxes-row';
    row.classList.toggle('current', current);
    const names = document.createElement('div');
    names.className = 'room-boxes-dungeons';
    dungeons.forEach((id) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip';
      button.dataset.dungeon = String(id);
      button.textContent = getDungeonName(id);
      button.classList.toggle('active', id === struct.dungeon);
      button.disabled = !available.has(String(id));
      button.title = t('roomBoxesUse', { dungeon: getDungeonName(id) });
      button.addEventListener('click', () => useBoxDungeon(id));
      names.appendChild(button);
    });
    if (!dungeons.length) {
      const other = document.createElement('span');
      other.className = 'room-boxes-other';
      other.textContent = t('roomBoxesOther');
      names.appendChild(other);
    }
    const items = document.createElement('p');
    items.className = 'room-boxes-items';
    items.textContent = contents;
    row.append(names, items);
    list.appendChild(row);
  };
  table.rows.forEach((row) => addRow(row.dungeons, row.contents, row.dungeons.includes(struct.dungeon)));
  const listed = table.rows.some((row) => row.dungeons.includes(struct.dungeon));
  addRow([], table.fallback, !listed);
}

function useBoxDungeon(dungeonId) {
  const select = document.getElementById('dungeonBox');
  if (!select) return;
  requestPasswordAnimation();
  freezeOutputMission();
  setSelectByValue(select, dungeonId);
  select.dispatchEvent(new Event('change', { bubbles: true }));
  generateCode();
}

// ---------------------------------------------------------------------------
// Cerca un premio (ricerca inversa per le missioni da ripetere)
// ---------------------------------------------------------------------------

// Quante stanze mostrare: le altre danno gli stessi premi, ma con meno Tecalusso.
const FARM_ROWS_SHOWN = 5;

// Nome del premio: gli strumenti esclusivi valgono tutti come uno solo.
function getFarmRewardName(itemId) {
  return WMSkyRooms.isExclusiveCode(itemId) ? t('exclusiveForTeam') : getItemDisplayName(itemId);
}

function populateFarmRewards() {
  const select = document.getElementById('farmRewardBox');
  if (!select || !window.WMSkyRooms) return;
  const previous = select.value;
  const rewards = WMSkyRooms.getFarmRewards()
    .map((itemId) => ({ itemId, name: getFarmRewardName(itemId) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  select.innerHTML = '';
  rewards.forEach((reward) => {
    const option = document.createElement('option');
    option.value = String(reward.itemId);
    option.text = reward.name;
    option.dataset.search = `${reward.name} ${getOtherLanguageText('items', reward.itemId) || ''}`;
    select.add(option);
  });
  if (!setSelectByValue(select, previous)) {
    setSelectByValue(select, DEFAULT_TREASURE_ITEM);
  }
}

// Dove si trova il premio scelto: le stanze che ce l'hanno già sul pavimento e, per i Tecalusso,
// la stanza con più Tecalusso più i dungeon che possono contenerlo.
// Nella stanza segreta si mostrano i dungeon migliori, non tutti.
const FARM_SECRET_CHIPS = 8;

function renderFarmResults() {
  const list = document.getElementById('farmResults');
  const select = document.getElementById('farmRewardBox');
  if (!list || !select || !window.WMSkyRooms) return;
  const itemId = parseInt(select.value, 10);
  list.innerHTML = '';
  if (!Number.isFinite(itemId)) return;

  const dungeonSelect = document.getElementById('dungeonBox');
  const available = new Set(dungeonSelect ? Array.from(dungeonSelect.options, (option) => option.value) : []);
  const sources = WMSkyRooms.findRewardSources(itemId);
  const onFloor = sources.filter((source) => source.floorItems);
  const withBoxes = sources.filter((source) => !source.floorItems && !source.secret
    && source.dungeons.some((entry) => available.has(String(entry.dungeon))));
  const secret = sources.filter((source) => source.secret
    && source.dungeons.some((entry) => available.has(String(entry.dungeon))));

  const addRow = (text, chips) => {
    const row = document.createElement('li');
    row.className = 'farm-row';
    const title = document.createElement('p');
    title.className = 'farm-row-title';
    title.textContent = text;
    row.appendChild(title);
    if (chips) row.appendChild(chips);
    list.appendChild(row);
  };

  const chipRow = (buttons) => {
    const chips = document.createElement('div');
    chips.className = 'farm-row-chips';
    buttons.forEach((button) => chips.appendChild(button));
    return chips;
  };

  const chip = (label, title, onClick) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = label;
    if (title) button.title = title;
    button.addEventListener('click', onClick);
    return button;
  };

  if (!onFloor.length && !withBoxes.length && !secret.length) {
    const empty = document.createElement('li');
    empty.className = 'hint';
    empty.textContent = t('farmNoResults');
    list.appendChild(empty);
    return;
  }

  // Strumenti già posati nella stanza: ci sono in qualsiasi dungeon.
  onFloor.forEach((source) => {
    addRow(t('farmOnFloor', { room: source.room, count: source.floorItems }),
      chipRow([chip(t('farmUseRoom'), t('farmUseCombo', { room: source.room }), () => useFarmCombo(source.room, null))]));
  });

  // Stanza segreta (dopo le altre righe): il contenuto dipende da dungeon e piano, per ogni dungeon il piano migliore.
  const addSecretRows = () => secret.forEach((source) => {
    const buttons = source.dungeons
      .filter((entry) => available.has(String(entry.dungeon)))
      .slice(0, FARM_SECRET_CHIPS)
      .map((entry) => chip(
        t('farmDungeonFloorChance', {
          dungeon: getDungeonName(entry.dungeon),
          floor: entry.floor,
          chance: WMSkyRooms.formatChance(entry.percent)
        }),
        t('farmUseComboFloor', { room: source.room, dungeon: getDungeonName(entry.dungeon), floor: entry.floor }),
        () => useFarmCombo(source.room, entry.dungeon, entry.floor)
      ));
    addRow(t('farmInSecretRoom', { room: source.room, boxes: source.boxes }), chipRow(buttons));
  });

  if (!withBoxes.length) {
    addSecretRows();
    return;
  }

  // Il contenuto dei Tecalusso dipende solo dal dungeon: basta la stanza che ne ha di più.
  const best = withBoxes[0];
  const buttons = best.dungeons
    .filter((entry) => available.has(String(entry.dungeon)))
    .map((entry) => chip(
      entry.chance < 1
        ? t('farmDungeonChance', { dungeon: getDungeonName(entry.dungeon), chance: Math.round(entry.chance * 100) })
        : getDungeonName(entry.dungeon),
      t('farmUseCombo', { room: best.room, dungeon: getDungeonName(entry.dungeon) }),
      () => useFarmCombo(best.room, entry.dungeon)
    ));
  addRow(t('farmInBoxes', { room: best.room, boxes: best.boxes }), chipRow(buttons));

  const others = withBoxes.slice(1, 1 + FARM_ROWS_SHOWN).map((source) => source.room);
  if (others.length) {
    const more = document.createElement('li');
    more.className = 'hint';
    more.textContent = t('farmOtherRooms', { rooms: others.join(', ') });
    list.appendChild(more);
  }
  addSecretRows();
}

// Prepara la missione: Memo tesoro nella stanza scelta, con il dungeon che contiene il premio.
function useFarmCombo(roomId, dungeonId, floorNumber = 1) {
  requestPasswordAnimation();
  runFormAction({
    text: () => (dungeonId === null
      ? t('originFarmRoom', { room: roomId })
      : t('originFarm', { room: roomId, dungeon: getDungeonName(dungeonId), floor: floorNumber })),
    panel: 'farmCard'
  }, () => {
    applyPresetNow('memo');
    const dungeonSelect = document.getElementById('dungeonBox');
    if (dungeonId !== null && dungeonSelect) {
      setSelectByValue(dungeonSelect, dungeonId);
      dungeonSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const special = document.getElementById('specialFloor');
    if (special) special.value = String(roomId);
    const floor = document.getElementById('floor');
    if (floor) floor.value = String(floorNumber);
    syncDungeonFloorLimit(true);
    WMSGen.update();
    refreshMissionUi();
  });
  closeStartPanels();
  generateCode();
}

// ---------------------------------------------------------------------------
// Sblocca un dungeon (glitch della Lettera di sfida di Jirachi, documentato da Lai-brary)
// ---------------------------------------------------------------------------

// La Lettera di sfida di Jirachi apre la Caverna Stellata quando si avvia la missione, ma il gioco apre in
// realtà il dungeon scritto nella password. Stessi valori del generatore di Lai-brary: Jirachi come
// committente, bersaglio e ricompensa (tipo 6), Baccarancia come strumento, piano 0, stanza 149.
const UNLOCK_GLITCH = {
  missionType: 11, missionSpecial: 5, client: 417, target: 417, target2: 0,
  rewardType: 6, reward: 417, targetItem: 70, floor: 0, specialFloor: 149
};
// Dungeon della storia e del post-partita (1-122). Restano fuori il dungeon di prova, gli ID senza nome,
// gli episodi speciali e i dungeon dimostrativi e fittizi (lo 0xAD blocca il gioco su console).
const UNLOCK_LAST_DUNGEON = 0x7a;
// Dungeon con un comportamento da sapere, dalla pagina di Lai-brary.
const UNLOCK_NOTES = { 29: 'sealed', 38: 'noEntry', 41: 'noEntry', 63: 'nightmare', 104: 'noMissions' };
let unlockSeed = null;

function getUnlockDungeonIds() {
  const text = getGameText(getCurrentLanguage());
  const ids = [];
  for (let id = 1; id <= UNLOCK_LAST_DUNGEON; id += 1) {
    if (text && text.dungeons && text.dungeons[id]) ids.push(id);
  }
  return ids;
}

function isUnlockGlitchStruct(struct) {
  return !!struct && ['missionType', 'missionSpecial', 'specialFloor', 'floor']
    .every((key) => parseInt(struct[key], 10) === UNLOCK_GLITCH[key]);
}

function buildUnlockStruct(dungeonId, seed) {
  return Object.assign({ nullBits: 0, mailType: 4, restriction: 0, restrictionType: 0 }, UNLOCK_GLITCH, {
    dungeon: dungeonId,
    flavorText: seed
  });
}

function populateUnlockDungeons() {
  const select = document.getElementById('unlockDungeonBox');
  if (!select) return;
  const previous = select.value || '1';
  select.textContent = '';
  getUnlockDungeonIds().forEach((id) => {
    const option = document.createElement('option');
    option.value = String(id);
    option.textContent = getDungeonName(id);
    select.appendChild(option);
  });
  setSelectByValue(select, previous);
  renderUnlockNote();
}

function renderUnlockNote() {
  const note = document.getElementById('unlockNote');
  if (!note) return;
  const kind = UNLOCK_NOTES[parseInt(document.getElementById('unlockDungeonBox')?.value, 10)];
  note.hidden = !kind;
  if (kind === 'sealed') note.textContent = t('unlockNoteSealed');
  else if (kind === 'noEntry') note.textContent = t('unlockNoteNoEntry');
  else if (kind === 'nightmare') note.textContent = t('unlockNoteNightmare');
  else if (kind === 'noMissions') note.textContent = t('unlockNoteNoMissions');
  else note.textContent = '';
}

// Scrive la password per il dungeon scelto; il seme resta lo stesso finché non si chiede un'altra password.
function generateUnlockPassword(newSeed) {
  const select = document.getElementById('unlockDungeonBox');
  const output = document.getElementById('unlockOutput');
  if (!select || !output) return;
  if (newSeed || unlockSeed === null) unlockSeed = Math.floor(Math.random() * 0x1000000);
  const dungeon = parseInt(select.value, 10) || 1;
  const region = getSelectedRegion();
  const struct = buildUnlockStruct(dungeon, unlockSeed);
  const code = WMSParser.encode(struct, region);
  const check = WMSParser.decodeWithRegion(code, region);
  if (!check || !check.crcOk || check.struct.dungeon !== dungeon || !isUnlockGlitchStruct(check.struct)) {
    output.value = '';
    setStatus('unlockStatus', 'errorSelfCheck', null, 'error');
    return;
  }
  output.value = prettyMailString(code, 2, 7);
  setStatus('unlockStatus', 'unlockReady', () => ({
    dungeon: getDungeonName(dungeon),
    region: getRegionName(region)
  }), 'ok');
  renderUnlockNote();
}

// Una password del glitch letta in «Leggi una password» va nella sua scheda, non nel modulo.
function showUnlockFromPassword(decoded) {
  const card = document.getElementById('unlockCard');
  const select = document.getElementById('unlockDungeonBox');
  if (!card || !select) return false;
  if (!getUnlockDungeonIds().includes(decoded.struct.dungeon)) return false;
  setSelectedRegion(decoded.region);
  setSelectByValue(select, decoded.struct.dungeon);
  unlockSeed = decoded.struct.flavorText;
  generateUnlockPassword(false);
  openStartPanel('unlockCard');
  flashElement(card, 'card-flash');
  return true;
}

async function copyUnlockPassword() {
  const text = document.getElementById('unlockOutput')?.value.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    setStatus('unlockStatus', 'codeCopied', null, 'ok');
  } catch (e) {
    setStatus('unlockStatus', 'copyFailed', null, 'error');
  }
}

// ---------------------------------------------------------------------------
// Missione simile
// ---------------------------------------------------------------------------

// Per il gioco due missioni sono la stessa se coincidono tipo, sottotipo, dungeon, piano, seme del
// testo, Pokémon, strumenti, ricompensa e restrizioni (AreMissionsEquivalent): la stanza speciale non
// conta. Cambiando solo il piano o il seme si ottiene una missione nuova, identica per il resto.
function freezeOutputMission() {
  const result = getOutputMission();
  if (!result) return null;
  const { struct } = result;
  const flavor = document.getElementById('flavorText');
  const special = document.getElementById('specialFloor');
  if (flavor) flavor.value = String(struct.flavorText);
  if (special && struct.specialFloor > 0 && !isEggGlitchStruct(struct)) special.value = String(struct.specialFloor);
  return struct;
}

function makeSimilarMission(kind) {
  const nextFloor = kind === 'nextFloor';
  let created = null;
  runFormAction({
    text: () => (nextFloor
      ? t('originSimilarFloor', { floor: created ? created.struct.floor : '' })
      : t('originSimilarSeed', { seed: created ? created.struct.flavorText : '' })),
    panel: null
  }, () => {
    created = makeSimilarMissionNow(nextFloor);
  });
  if (!created) {
    formOrigin = null;
    renderOriginBar();
  }
}

function makeSimilarMissionNow(nextFloor) {
  const struct = freezeOutputMission();
  if (!struct) {
    setStatus('statusLine', 'similarUnavailable', null, 'error');
    return null;
  }
  if (nextFloor) {
    const next = isEggGlitchStruct(struct) ? null : getNextAllowedFloor(struct.dungeon, struct.floor);
    if (next === null) {
      setStatus('statusLine', 'similarLastFloor', null, 'warning');
      return null;
    }
    document.getElementById('floor').value = String(next);
  } else {
    let seed;
    do {
      seed = Math.floor(Math.random() * 0x1000000);
    } while (seed === struct.flavorText);
    document.getElementById('flavorText').value = String(seed);
  }
  refreshMissionUi();
  generateCode();
  const created = getOutputMission();
  if (created) {
    const values = { floor: created.struct.floor, seed: created.struct.flavorText };
    setStatus('statusLine', nextFloor ? 'similarDoneFloor' : 'similarDoneSeed', values, 'ok');
  }
  return created;
}

// Primo piano valido sopra quello indicato: salta i piani che il gioco rifiuta. null se non ce ne sono.
function getNextAllowedFloor(dungeonId, floor) {
  const limit = getDungeonFloorLimit(dungeonId);
  const forbidden = WMSGen.getForbiddenFloors(dungeonId);
  for (let next = floor + 1; next <= limit; next += 1) {
    if (!forbidden.includes(next)) return next;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Serie di missioni gemelle
// ---------------------------------------------------------------------------

// La missione della password più altre uguali su piani di fila o con semi diversi: per il gioco sono
// tutte missioni diverse. L'elenco delle missioni del gioco ne tiene al massimo otto.
const SERIES_MAX = 8;
let missionSeries = null;

function buildMissionSeries(mode, count) {
  const result = getOutputMission();
  if (!result || !result.crcOk) return { error: 'noPassword' };
  const base = result.struct;
  if (isEggGlitchStruct(base)) return { error: 'egg' };

  const total = Math.max(2, Math.min(SERIES_MAX, count));
  const entries = [{ floor: base.floor, seed: base.flavorText }];
  const seeds = new Set([base.flavorText]);
  while (entries.length < total) {
    const last = entries[entries.length - 1];
    if (mode === 'floors') {
      const floor = getNextAllowedFloor(base.dungeon, last.floor);
      if (floor === null) break;
      entries.push({ floor, seed: base.flavorText });
    } else {
      let seed;
      do {
        seed = Math.floor(Math.random() * 0x1000000);
      } while (seeds.has(seed));
      seeds.add(seed);
      entries.push({ floor: base.floor, seed });
    }
  }

  for (const entry of entries) {
    const struct = Object.assign({}, base, { floor: entry.floor, flavorText: entry.seed });
    const code = WMSParser.encode(struct, result.region);
    const check = WMSParser.decodeWithRegion(code, result.region);
    if (!check || !check.crcOk || check.struct.floor !== entry.floor || check.struct.flavorText !== entry.seed) {
      return { error: 'selfCheck' };
    }
    entry.pretty = prettyMailString(code, 2, 7);
  }
  return { baseCode: result.clean, mode, requested: total, entries };
}

function makeMissionSeries(mode) {
  const count = parseInt(document.getElementById('seriesCount')?.value, 10) || SERIES_MAX;
  const series = buildMissionSeries(mode, count);
  if (series.error) {
    missionSeries = null;
    renderMissionSeries();
    if (series.error === 'egg') setStatus('seriesStatus', 'seriesEgg', null, 'error');
    else if (series.error === 'selfCheck') setStatus('seriesStatus', 'errorSelfCheck', null, 'error');
    else setStatus('seriesStatus', 'similarUnavailable', null, 'error');
    return;
  }
  missionSeries = series;
  renderMissionSeries();
  const values = { count: series.entries.length };
  if (series.entries.length < series.requested) {
    setStatus('seriesStatus', 'seriesShort', values, 'warning');
  } else {
    setStatus('seriesStatus', 'seriesDone', values, 'ok');
  }
  flashElement(document.getElementById('seriesResult'), 'card-flash');
}

// La serie vale finché resta la stessa password: se la password cambia, sparisce.
function renderMissionSeries() {
  const box = document.getElementById('seriesResult');
  const list = document.getElementById('seriesList');
  if (!box || !list) return;
  const current = compactCode(document.getElementById('compactOutput')?.value || '');
  if (missionSeries && missionSeries.baseCode !== current) {
    missionSeries = null;
    setStatus('seriesStatus', null);
  }
  list.textContent = '';
  box.hidden = !missionSeries;
  if (!missionSeries) return;
  missionSeries.entries.forEach((entry, index) => {
    const item = document.createElement('li');
    const tag = document.createElement('span');
    tag.className = 'series-tag';
    tag.textContent = missionSeries.mode === 'floors'
      ? t('seriesFloorTag', { floor: entry.floor })
      : t('seriesSeedTag', { seed: entry.seed });
    const code = document.createElement('code');
    code.className = 'series-code';
    code.textContent = entry.pretty;
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'ghost';
    copy.textContent = t('copy');
    copy.setAttribute('aria-label', t('seriesCopyOne', { number: index + 1 }));
    copy.addEventListener('click', () => copySeriesText(compactCode(entry.pretty), false));
    item.append(tag, code, copy);
    list.appendChild(item);
  });
}

async function copySeriesText(text, all) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus('seriesStatus', all ? 'seriesCopied' : 'codeCopied', null, 'ok');
  } catch (e) {
    setStatus('seriesStatus', 'copyFailed', null, 'error');
  }
}

// Anteprima e stanza seguono sempre la password mostrata.
function updateOutputCards() {
  renderJobCard();
  renderRoomCard();
  renderMissionSeries();
  updateMobilePass();
}

// Colonna del risultato fissa: se entra nello schermo resta in cima, altrimenti scorre con la pagina e si
// ferma quando se ne vede la fine (niente barra di scorrimento interna).
const SIDE_PANEL_GAP = 12;

function updateSidePanelSticky() {
  const panel = document.querySelector('.side-panel');
  if (!panel) return;
  const room = window.innerHeight - panel.offsetHeight - SIDE_PANEL_GAP;
  panel.style.top = `${Math.min(SIDE_PANEL_GAP, room)}px`;
}

// Telefono: la password resta raggiungibile in fondo allo schermo mentre si compila il modulo.
function updateMobilePass() {
  const bar = document.getElementById('mobilePass');
  const code = document.getElementById('mobilePassCode');
  const compact = document.getElementById('compactOutput')?.value || '';
  if (!bar || !code) return;
  bar.hidden = !compact;
  code.textContent = compact ? prettyMailString(compact, 2, 7).replace(/\n/g, ' ') : '';
}

async function copyMobilePass(button) {
  const text = prettyMailString(document.getElementById('compactOutput')?.value || '', 2, 7);
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = t('copiedShort');
  } catch (e) {
    button.textContent = t('copyFailedShort');
  }
  window.setTimeout(() => { button.textContent = t('copy'); }, 1400);
}

// Etichetta dello strumento obiettivo: nei Memo tesoro è il tesoro, nella Sala Proibita l'oggetto da trovare.
function getTargetItemLabel(typeData) {
  if (typeData && typeData.mainType === 12) return t('treasureItemLabel');
  if (typeData && typeData.mainType === 3 && typeData.specialType === 1) return t('chamberItemLabel');
  return t('targetItemLabel');
}

function updateTargetItemLabel(typeData) {
  const label = document.querySelector('label[for="targetItemSearch"]');
  if (label && typeData) label.textContent = getTargetItemLabel(typeData);
}

let roomResizeTimer = null;

onReady(() => {
  populateFarmRewards();
  renderFarmResults();
  document.getElementById('farmRewardBox')?.addEventListener('change', renderFarmResults);
  renderHeroTeam();
  document.getElementById('heroTeam')?.addEventListener('click', renderHeroTeam);
  applyRepoLink();
  document.getElementById('similarNextFloor')?.addEventListener('click', () => {
    requestPasswordAnimation();
    makeSimilarMission('nextFloor');
  });
  setupJobTextPicker();
  document.getElementById('similarNewSeed')?.addEventListener('click', () => {
    requestPasswordAnimation();
    makeSimilarMission('newSeed');
  });
  populateUnlockDungeons();
  document.querySelectorAll('.start-tab').forEach((tab) => {
    tab.addEventListener('click', () => toggleStartPanel(tab.dataset.panel));
  });
  document.getElementById('originUndo')?.addEventListener('click', undoFormAction);
  document.getElementById('originChange')?.addEventListener('click', () => {
    if (!formOrigin || !formOrigin.panel) return;
    openStartPanel(formOrigin.panel);
    document.getElementById('startBar')?.scrollIntoView({ behavior: wantsLessMotion() ? 'auto' : 'smooth', block: 'start' });
  });
  document.getElementById('originClose')?.addEventListener('click', () => {
    formOrigin = null;
    renderOriginBar();
  });
  document.getElementById('mobilePassCopy')?.addEventListener('click', (event) => copyMobilePass(event.currentTarget));
  document.getElementById('mobilePassShow')?.addEventListener('click', () => {
    document.getElementById('resultCard')?.scrollIntoView({ behavior: wantsLessMotion() ? 'auto' : 'smooth', block: 'start' });
  });
  updateSidePanelSticky();
  window.addEventListener('resize', updateSidePanelSticky);
  const sidePanel = document.querySelector('.side-panel');
  if (sidePanel && 'ResizeObserver' in window) new ResizeObserver(updateSidePanelSticky).observe(sidePanel);
  // La barra sparisce quando la scheda della password è già sullo schermo.
  const resultCard = document.getElementById('resultCard');
  if (resultCard && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => document.body.classList.toggle('result-in-view', entry.isIntersecting));
    }).observe(resultCard);
  }
  document.getElementById('unlockDungeonBox')?.addEventListener('change', () => generateUnlockPassword(false));
  document.getElementById('unlockNew')?.addEventListener('click', () => generateUnlockPassword(true));
  document.getElementById('unlockCopy')?.addEventListener('click', copyUnlockPassword);
  document.getElementById('regionBox')?.addEventListener('change', () => {
    if (document.getElementById('unlockOutput')?.value) generateUnlockPassword(false);
  });
  document.getElementById('seriesFloors')?.addEventListener('click', () => makeMissionSeries('floors'));
  document.getElementById('seriesSeeds')?.addEventListener('click', () => makeMissionSeries('seeds'));
  document.getElementById('seriesCopyAll')?.addEventListener('click', () => {
    if (!missionSeries) return;
    copySeriesText(missionSeries.entries.map((entry) => entry.pretty).join('\n\n'), true);
  });
  // La mappa si adatta alla larghezza disponibile.
  window.addEventListener('resize', () => {
    window.clearTimeout(roomResizeTimer);
    roomResizeTimer = window.setTimeout(renderRoomCard, 150);
  });
  document.getElementById('roomExampleCopy')?.addEventListener('click', async () => {
    const code = compactCode(document.getElementById('roomExampleCode')?.textContent || '');
    try {
      await navigator.clipboard.writeText(code);
      setStatus('roomExampleStatus', 'codeCopied', null, 'ok');
    } catch (e) {
      setStatus('roomExampleStatus', 'copyFailed', null, 'error');
    }
  });
});
