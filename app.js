

const EXTRA_POKEMON_IMAGE_URLS = {
  279: 'assets/pokemon-extra/celebi-shiny.png',
  384: 'assets/pokemon-extra/kecleon-purple.png',
  552: 'assets/pokemon-extra/primal-dialga.png',
  535: 'https://img.pokemondb.net/sprites/home/normal/shaymin-sky.png',
  536: 'https://img.pokemondb.net/sprites/home/normal/giratina-origin.png'
};

const EXTRA_POKEMON_IMAGE_BASE_IDS = {
  552: 525,
  555: 174,
  556: 528,
  557: 479,
  558: 106,
  559: 390,
  560: 174,
  561: 522,
  562: 524,
  563: 523,
  564: 192,
  565: 50,
  566: 51,
  567: 369,
  568: 322,
  569: 434,
  570: 483,
  571: 281,
  572: 519,
  573: 330,
  574: 533,
  575: 174,
  576: 281,
  577: 519,
  578: 519,
  579: 161,
  580: 182
};

function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

const LANGUAGE_STORAGE_KEY = 'wmsky-language';
const DEFAULT_LANGUAGE = 'it';
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

const MISSION_DIFFICULTY_TIERS = {
  0: { rank: '-', points: 5 },
  1: { rank: 'E', points: 10 },
  2: { rank: 'D', points: 15 },
  3: { rank: 'C', points: 20 },
  4: { rank: 'B', points: 30 },
  5: { rank: 'A', points: 60 },
  6: { rank: 'S', points: 90 },
  7: { rank: '★1', points: 150 },
  8: { rank: '★2', points: 250 },
  9: { rank: '★3', points: 400 },
  10: { rank: '★4', points: 600 },
  11: { rank: '★5', points: 800 },
  12: { rank: '★6', points: 1000 },
  13: { rank: '★7', points: 1200 },
  14: { rank: '★8', points: 1400 },
  15: { rank: '★9', points: 1600 }
};

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
  if (selectId === 'targetItemBox') {
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

  return Array.from(select.options)
    .map((option, index) => ({
      index,
      value: option.value,
      text: option.text,
      description: getSearchSuggestionDescription(select.id, option.value),
      searchText: normalizeSearchText(option.dataset.search || option.text || '')
    }))
    .filter((entry) => !normalized || entry.searchText.includes(normalizeSearchText(normalized)));
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

  suggestions.forEach((suggestion, index) => {
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
      renderSearchSuggestions(controller, controller.currentSuggestions);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      controller.activeIndex = controller.activeIndex <= 0
        ? controller.currentSuggestions.length - 1
        : controller.activeIndex - 1;
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

function getPokemonImageOverride(monId) {
  const normalized = normalizePokemonId(monId);
  if (!Number.isFinite(normalized) || normalized < 0) return null;
  if (EXTRA_POKEMON_IMAGE_URLS[normalized]) {
    return {
      type: 'url',
      value: EXTRA_POKEMON_IMAGE_URLS[normalized]
    };
  }
  if (EXTRA_POKEMON_IMAGE_BASE_IDS[normalized]) {
    return {
      type: 'base',
      value: EXTRA_POKEMON_IMAGE_BASE_IDS[normalized]
    };
  }
  return null;
}

function getPokemonSpriteDexId(monId) {
  const override = getPokemonImageOverride(monId);
  const normalized = override && override.type === 'base'
    ? normalizePokemonId(override.value)
    : normalizePokemonId(monId);
  if (!Number.isFinite(normalized) || normalized < 1) return null;
  if (window.WMSkyPokemonSpriteDex && window.WMSkyPokemonSpriteDex[normalized]) {
    return window.WMSkyPokemonSpriteDex[normalized];
  }
  if (normalized <= 493) return normalized;
  return null;
}

function getPokemonSpriteAsset(monId) {
  const override = getPokemonImageOverride(monId);
  if (override && override.type === 'url') return override.value;

  const normalized = override && override.type === 'base'
    ? normalizePokemonId(override.value)
    : normalizePokemonId(monId);
  if (!Number.isFinite(normalized) || normalized < 1) return null;
  if (normalized === 201) return '201';
  if (normalized >= 202 && normalized <= 226) {
    const letter = String.fromCharCode(97 + (normalized - 201));
    return `201-${letter}`;
  }
  if (normalized === 227) return '201-exclamation';
  if (normalized === 228) return '201-question';
  return String(getPokemonSpriteDexId(normalized));
}

function getPokemonImage(monId, label) {
  const spriteAsset = getPokemonSpriteAsset(monId);
  const fallback = buildPreviewBadge(label, 'pokemon');
  const spriteSource = String(spriteAsset || '');
  const isDirectAsset = spriteSource.startsWith('http')
    || spriteSource.startsWith('assets/')
    || spriteSource.startsWith('./')
    || spriteSource.startsWith('/')
    || spriteSource.startsWith('data:');
  return {
    src: spriteAsset
      ? (isDirectAsset
        ? spriteAsset
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${spriteAsset}.png`)
      : fallback,
    fallback
  };
}

function getLocalizedDungeonName(dungeonId, fallbackLabel) {
  const numeric = parseInt(dungeonId, 10);
  if (!Number.isFinite(numeric)) return String(fallbackLabel || '');
  return getDungeonName(numeric);
}

// Nome nell'altra lingua, per poter cercare sia "Grotta Marina" sia "Beach Cave".
function getOtherLanguageText(list, id) {
  const other = getCurrentLanguage() === FALLBACK_LANGUAGE ? DEFAULT_LANGUAGE : FALLBACK_LANGUAGE;
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

function getDungeonFloorLimit(dungeonId) {
  const numeric = parseInt(dungeonId, 10);
  if (!Number.isFinite(numeric) || !window.WMSkyDungeonFloorLimits) return 99;
  const limit = window.WMSkyDungeonFloorLimits[numeric];
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
    hint.textContent = limit < 99
      ? t('floorLimitHint', { count: limit })
      : t('floorLimitUnknown');
  }
}

function getMissionDifficultyInfo(typeData = getCurrentTypeData()) {
  const dungeonId = parseInt(document.getElementById('dungeonBox')?.value || '', 10);
  const floorValue = parseInt(document.getElementById('floor')?.value || '', 10);
  if (!Number.isFinite(dungeonId) || !Number.isFinite(floorValue)) return null;

  const dungeonRanks = window.WMSkyMissionRankMap && window.WMSkyMissionRankMap[dungeonId];
  if (!dungeonRanks) return null;

  let rankId = parseInt(dungeonRanks[floorValue], 10);
  if (!Number.isFinite(rankId)) return null;

  if (typeData && HARDER_MISSION_MAIN_TYPES.has(parseInt(typeData.mainType, 10)) && rankId < 15) {
    rankId += 1;
  }

  const tier = MISSION_DIFFICULTY_TIERS[rankId];
  if (!tier) return null;

  return {
    rankId,
    rank: tier.rank,
    points: tier.points
  };
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

  if (rawFlavor) {
    rawFlavor.value = Number.isFinite(struct.flavorText) ? String(struct.flavorText) : '';
  }

  WMSGen.update();
  syncDungeonFloorLimit(true);
  syncMemoSelectorFromSpecialFloor();
  refreshMissionUi();
  updateSummary();
  updateMemoVisuals();

  if (output) {
    output.value = prettyMailString(result.clean, 2, 7);
  }
  if (compact) {
    compact.value = result.clean;
  }

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
  return selectId === 'targetItemBox' || selectId === 'rewardItemBox';
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
    if (!setSelectByValue(select, previousValues[id])) {
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
    option.dataset.search = `${option.text} ${getOtherLanguageText('items', numeric)}`;
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

function localizeMemoOption(option, index, value) {
  if (!option) return;
  if (!value) {
    option.text = t('auto');
    option.dataset.shortLabel = t('auto');
    option.dataset.floorLabel = 'Auto';
    option.dataset.previewTitle = t('auto');
    return;
  }

  option.text = t('previewOption', { variant: index + 1, floor: value });
  option.dataset.shortLabel = `V${index + 1}`;
  option.dataset.floorLabel = String(value);
  option.dataset.previewTitle = t('previewTitle', { variant: index + 1, floor: value });
}

function relabelMemoSelectorOptions() {
  const select = document.getElementById('memoPreset');
  if (!select) return;

  // La prima opzione è "Automatico": le varianti partono dalla seconda.
  Array.from(select.options).forEach((option, index) => {
    localizeMemoOption(option, index - 1, option.value);
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
// data-i18n-html (testo con markup), data-i18n-placeholder o data-i18n-title.
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

  // Pulsanti delle Lettere di sfida: il nome del leggendario è quello ufficiale del gioco.
  document.querySelectorAll('.preset-btn[data-boss]').forEach((button) => {
    button.textContent = t('presetChallenge', { boss: getMonName(parseInt(button.dataset.boss, 10)) });
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
  relabelMemoSelectorOptions();
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
  renderMemoPresetPicker();
  updateMemoPresetPicker();
  refreshMissionUi();
  updateSummary();
  updateMemoVisuals();

  const status = document.getElementById('statusLine');
  if (status && !document.getElementById('outputbox')?.value.trim()) {
    status.textContent = t('statusDefault');
  }
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
  const targetFixed = !!typeData.clientIsTarget || hasOwn(typeData, 'forceTarget');

  setFieldVisibility('missionTypeField', !eggGlitch);
  setFieldVisibility('dungeonField', !eggGlitch);
  setFieldVisibility('floorField', !eggGlitch);
  setFieldVisibility('memoSelectorWrap', !eggGlitch && isTreasureMemoType(typeData));
  const advancedPanel = document.getElementById('advancedOptionsPanel');
  if (advancedPanel) advancedPanel.classList.toggle('hidden', eggGlitch);
  const targetSection = document.getElementById('targetSectionCard');
  if (targetSection) targetSection.classList.toggle('hidden', eggGlitch);

  setFieldVisibility('allPokemonFormsField', !eggGlitch);
  setFieldPreviewOnly('clientField', !eggGlitch && clientFixed);
  setFieldPreviewOnly('targetField', !eggGlitch && targetFixed);
  setFieldVisibility('target2', !eggGlitch && !!typeData.useTarget2);
  setFieldVisibility('targetItemField', !eggGlitch && !!typeData.useTargetItem);
  setFieldVisibility('rewardTypeField', !eggGlitch && !typeData.noReward);
  setFieldVisibility('rewardItemField', !eggGlitch && !typeData.noReward && rewardType >= 1 && rewardType <= 4);
  setFieldVisibility('eggPokemonField', eggGlitch);
  setFieldVisibility('eggHelpCard', eggGlitch);
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
  // I menu cambiati dal codice (preset, lettura di una password) non avvisano i campi di ricerca.
  refreshSearchBoxSelections();
}

function isTreasureMemoType(typeData) {
  return !!typeData && typeData.mainType === 12;
}

function getMemoGallery() {
  return Array.isArray(window.MemoRoomGallery) ? window.MemoRoomGallery : [];
}

function getMemoSpecialFloor() {
  const specialFloor = document.getElementById('specialFloor');
  const value = parseInt(specialFloor && specialFloor.value ? specialFloor.value : '', 10);
  return Number.isFinite(value) ? value : null;
}

function getMemoRoomBySpecialFloor(specialFloor) {
  return getMemoGallery().find((entry) => entry.specialFloor === specialFloor) || null;
}

function findMemoToken(room, token) {
  if (!room || !Array.isArray(room.grid)) return null;
  for (let y = 0; y < room.grid.length; y += 1) {
    const x = room.grid[y].indexOf(token);
    if (x >= 0) return { x, y };
  }
  return null;
}

function countMemoTokens(room, token) {
  if (!room || !Array.isArray(room.grid)) return 0;
  return room.grid.reduce((total, row) => (
    total + row.split('').filter((cell) => cell === token).length
  ), 0);
}

function getMemoWarning(room) {
  if (!room) return '';
  if (room.warningKey) return t(room.warningKey);
  return room.warning || '';
}

function resolveInitialLanguage() {
  const available = getAvailableLanguages();
  const fromUrl = getUrlLanguage();
  const stored = getStoredLanguage();
  if (available.includes(fromUrl)) return fromUrl;
  if (available.includes(stored)) return stored;
  return getDefaultLanguage();
}

// Mela: ricompensa predefinita, così la combinazione iniziale è subito valida.
const DEFAULT_REWARD_ITEM = 109;

onReady(() => {
  currentLanguage = resolveInitialLanguage();

  WMSGen.advanced = false;
  WMSGen.translate = t;
  WMSGen.getFloorLimit = getDungeonFloorLimit;
  WMSGen.setup(document.getElementById('genForm'));
  WMSGen.showAllPokemon = !!document.getElementById('allPokemonForms')?.checked;
  populateEggPokemonList();
  relabelItemSelect('targetItemBox');
  relabelItemSelect('rewardItemBox');
  setSelectByValue(document.getElementById('rewardItemBox'), DEFAULT_REWARD_ITEM);
  setSelectedRegion('eu');
  populateMemoSelector();

  const watchedIds = [
    'missionTypeBox', 'missionSubTypeBox', 'dungeonBox', 'floor', 'clientBox', 'clientF',
    'targetBox', 'targetF', 'target2Box', 'target2F', 'targetItemBox', 'rewardTypeBox',
    'rewardItemBox', 'regionBox', 'flavorText', 'specialFloor', 'eggPokemonBox'
  ];

  watchedIds.forEach((id) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.addEventListener('change', () => {
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
      }
      WMSGen.update();

      const typeData = getCurrentTypeData();
      const memoWrap = document.getElementById('memoSelectorWrap');
      if (memoWrap) {
        memoWrap.classList.toggle('hidden', !isTreasureMemoType(typeData));
      }
      if (id === 'specialFloor' || id === 'missionTypeBox' || id === 'missionSubTypeBox') {
        syncMemoSelectorFromSpecialFloor();
      }

      refreshMissionUi();
      updateSummary();
      updateMemoVisuals();
      scheduleLiveGeneration();
    });
    node.addEventListener('input', () => {
      if (id === 'specialFloor') {
        syncMemoSelectorFromSpecialFloor();
      }
      refreshMissionUi();
      updateSummary();
      updateMemoVisuals();
      scheduleLiveGeneration(['floor', 'specialFloor', 'flavorText'].includes(id) ? 220 : 120);
    });
  });

  document.getElementById('allPokemonForms')?.addEventListener('change', (event) => {
    WMSGen.showAllPokemon = !!event.target.checked;
    rebuildPokemonLists();
    WMSGen.update();
    refreshMissionUi();
    updateSummary();
    scheduleLiveGeneration();
  });

  document.getElementById('eggGlitch')?.addEventListener('change', (event) => {
    if (event.target.checked) {
      applyEggGlitchPreset();
    }
    WMSGen.update();
    refreshMissionUi();
    updateSummary();
    scheduleLiveGeneration();
  });

  document.getElementById('memoPreset').addEventListener('change', (event) => {
    const specialFloor = document.getElementById('specialFloor');
    specialFloor.value = event.target.value;
    refreshMissionUi();
    updateSummary();
    updateMemoVisuals();
    scheduleLiveGeneration();
  });

  document.getElementById('randomSeedBtn')?.addEventListener('click', () => {
    const flavor = document.getElementById('flavorText');
    flavor.value = '';
    scheduleLiveGeneration();
  });

  initializeSearchBoxes();

  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
  });

  document.getElementById('generateBtn').addEventListener('click', generateCode);
  document.getElementById('importCodeBtn')?.addEventListener('click', importCode);
  document.getElementById('importCode')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      importCode();
    }
  });
  document.getElementById('copyPrettyBtn').addEventListener('click', () => copyFrom('outputbox'));
  document.getElementById('copyCompactBtn').addEventListener('click', () => copyFrom('compactOutput'));

  applyPreset('standard');
  WMSGen.update();
  document.getElementById('memoSelectorWrap').classList.add('hidden');
  syncMemoSelectorFromSpecialFloor();
  refreshMissionUi();
  updateSummary();
  updateMemoVisuals();
  generateCode();
});

function getMemoPresetOption(optionOrValue) {
  const select = document.getElementById('memoPreset');
  if (!select) return null;

  if (!optionOrValue) {
    return select.options[select.selectedIndex] || select.options[0] || null;
  }

  if (typeof optionOrValue === 'string' || typeof optionOrValue === 'number') {
    const value = String(optionOrValue);
    return Array.from(select.options).find((option) => option.value === value) || null;
  }

  return optionOrValue;
}

function closeMemoPresetMenu() {
  const toggle = document.getElementById('memoPresetToggle');
  const panel = document.getElementById('memoPresetMenu');
  if (!toggle || !panel) return;
  toggle.setAttribute('aria-expanded', 'false');
  panel.classList.add('hidden');
  panel.closest('section')?.classList.remove('memo-picker-open');
  panel.style.removeProperty('top');
  panel.style.removeProperty('left');
  panel.style.removeProperty('right');
  panel.style.removeProperty('max-height');
  renderMemoPresetPreview();
}

function toggleMemoPresetMenu(forceOpen) {
  const toggle = document.getElementById('memoPresetToggle');
  const panel = document.getElementById('memoPresetMenu');
  if (!toggle || !panel) return;

  const shouldOpen = typeof forceOpen === 'boolean'
    ? forceOpen
    : toggle.getAttribute('aria-expanded') !== 'true';

  toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
  panel.classList.toggle('hidden', !shouldOpen);
  panel.closest('section')?.classList.toggle('memo-picker-open', shouldOpen);
  if (shouldOpen) {
    renderMemoPresetPreview();
  }
}

function applyMemoPresetValue(value) {
  const select = document.getElementById('memoPreset');
  if (!select) return;

  if (!setSelectByValue(select, String(value || ''))) {
    select.selectedIndex = 0;
  }

  updateMemoPresetPicker();
  select.dispatchEvent(new Event('change', { bubbles: true }));
  closeMemoPresetMenu();
}

function syncMemoSelectorFromSpecialFloor() {
  const memoSelect = document.getElementById('memoPreset');
  const specialFloor = document.getElementById('specialFloor');
  if (!memoSelect || !specialFloor) return;

  const current = String(specialFloor.value || '');
  if (!setSelectByValue(memoSelect, current)) {
    memoSelect.selectedIndex = 0;
  }

  updateMemoPresetPicker();
}

onReady(() => {
  const picker = document.getElementById('memoPresetPicker');
  const toggle = document.getElementById('memoPresetToggle');
  const select = document.getElementById('memoPreset');

  renderMemoPresetPicker();
  updateMemoPresetPicker();

  if (toggle) {
    toggle.addEventListener('click', () => toggleMemoPresetMenu());
  }

  if (select) {
    select.addEventListener('change', updateMemoPresetPicker);
  }

  document.addEventListener('click', (event) => {
    if (!picker || picker.contains(event.target)) return;
    closeMemoPresetMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMemoPresetMenu();
    }
  });

  ['missionTypeBox', 'missionSubTypeBox', 'specialFloor'].forEach((id) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.addEventListener('change', closeMemoPresetMenu);
    node.addEventListener('input', closeMemoPresetMenu);
  });
});

function updateEntityPreviews() {
  const typeData = getCurrentTypeData();
  if (!typeData) return;

  const clientMeta = hasOwn(typeData, 'forceClient')
    ? t('forcedMissionPokemon')
    : (document.getElementById('clientF')?.checked ? t('activeFemaleVersion') : t('activeSelection'));

  renderEntityPreview('clientPreview', getPokemonPreviewData(
    'clientBox',
    'clientF',
    typeData.forceClient,
    t('clientLabel'),
    clientMeta
  ));

  const targetMeta = typeData.clientIsTarget
    ? t('samePokemonAsClient')
    : hasOwn(typeData, 'forceTarget')
      ? t('forcedMissionPokemon')
      : (document.getElementById('targetF')?.checked ? t('activeFemaleVersion') : t('activeSelection'));

  const targetPreview = typeData.clientIsTarget
    ? getPokemonPreviewData('clientBox', 'clientF', typeData.forceClient, t('targetLabel'), targetMeta)
    : getPokemonPreviewData('targetBox', 'targetF', typeData.forceTarget, t('targetLabel'), targetMeta);

  renderEntityPreview('targetPreview', targetPreview);

  renderEntityPreview(
    'target2Preview',
    typeData.useTarget2
      ? getPokemonPreviewData(
        'target2Box',
        'target2F',
        undefined,
        t('target2PreviewLabel'),
        document.getElementById('target2F')?.checked ? t('activeFemaleVersion') : t('activeSelection')
      )
      : null
  );

  renderEntityPreview(
    'targetItemPreview',
    typeData.useTargetItem
      ? getItemPreviewData('targetItemBox', t('targetItemLabel'), t('currentSelectedItem'), false)
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

function getMemoFlagLabels(room) {
  if (!room || !room.flags) return [];

  const labels = [];
  if (room.flags.player) labels.push(t('flagPlayer'));
  if (room.flags.key) labels.push(t('flagKey'));
  if (room.flags.water) labels.push(t('flagWater'));
  if (room.flags.breakWall) labels.push(t('flagBreakWall'));
  if (room.flags.chestnut) labels.push(t('flagChestnut'));
  if (room.flags.wind) labels.push(t('flagWind'));
  if (room.flags.warp) labels.push(t('flagWarp'));
  return labels;
}

function describeMemoPosition(point, room) {
  if (!point || !room || !room.width || !room.height) return '';

  const horizontal = point.x < room.width / 3 ? 'left'
    : point.x >= (room.width * 2) / 3 ? 'right'
      : 'center';
  const vertical = point.y < room.height / 3 ? 'top'
    : point.y >= (room.height * 2) / 3 ? 'bottom'
      : 'middle';

  return t(`pos_${vertical}_${horizontal}`);
}

function buildMemoDescription(room) {
  if (!room) {
    return t('chooseVariantToShow');
  }
  if (room.missingMap) {
    const parts = [t('missingRoomDescription')];
    if (room.observedLootKey) {
      parts.push(t(room.observedLootKey));
    }
    return parts.join(' ');
  }

  const parts = [t('mapSize', { width: room.width, height: room.height })];
  const treasure = findMemoToken(room, 'T');
  const stairs = findMemoToken(room, 'S');
  const player = findMemoToken(room, 'P');
  const luxuryChestCount = countMemoTokens(room, 'L');
  const flags = getMemoFlagLabels(room);

  if (treasure) parts.push(t('treasurePosition', { position: describeMemoPosition(treasure, room) }));
  if (stairs) parts.push(t('stairsPosition', { position: describeMemoPosition(stairs, room) }));
  if (player) parts.push(t('playerPosition', { position: describeMemoPosition(player, room) }));
  if (luxuryChestCount) parts.push(t('luxuryChestCount', { count: luxuryChestCount }));
  if (flags.length) {
    parts.push(t('sourceMarker', { flags: flags.join(', ') }));
  } else {
    parts.push(t('noSpecialMarker'));
  }
  if (room.noteKey) {
    parts.push(t(room.noteKey));
  }

  return parts.join(' ');
}

function renderMemoFeatureList(container, room) {
  if (!container) return;
  container.innerHTML = '';

  const labels = room && !room.missingMap ? getMemoFlagLabels(room) : [t('sourceIncomplete')];
  if (room && room.observedLootKey) {
    labels.push(t(room.observedLootKey));
  }
  if (room && room.noteKey) {
    labels.push(t(room.noteKey));
  }

  labels.forEach((label) => {
    const chip = document.createElement('span');
    chip.className = 'memo-feature';
    chip.textContent = label;
    container.appendChild(chip);
  });
}

function renderMemoMap(container, room, large) {
  if (!container) return;
  container.innerHTML = '';
  container.classList.toggle('memo-map-empty', !room || room.missingMap || !room.grid || !room.grid.length);

  if (!room || room.missingMap || !room.grid || !room.grid.length) {
    container.textContent = room && room.missingMap ? t('mapMissing') : t('chooseVariant');
    return;
  }

  const size = large ? (room.width >= 20 ? 14 : 18) : (room.width >= 20 ? 9 : 11);
  container.style.setProperty('--memo-cols', String(room.width));
  container.style.setProperty('--memo-cell-size', `${size}px`);

  const labels = {
    '#': { className: 'wall', text: '', label: t('tileWall') },
    '.': { className: 'floor', text: '', label: t('tileFloor') },
    '~': { className: 'water', text: '', label: t('tileWater') },
    'S': { className: 'stairs', text: 'S', label: t('tileStairs') },
    'T': { className: 'treasure', text: 'T', label: t('tileTreasure') },
    'L': { className: 'luxurychest', text: 'L', label: t('tileLuxuryChest') },
    'P': { className: 'player', text: 'P', label: t('tilePlayer') },
    'K': { className: 'key', text: 'K', label: t('tileKey') },
    'B': { className: 'breakwall', text: 'B', label: t('tileBreakWall') },
    'C': { className: 'chestnut', text: 'C', label: t('tileChestnut') },
    'F': { className: 'wind', text: 'V', label: t('tileWind') },
    'W': { className: 'warp', text: 'W', label: t('tileWarp') }
  };

  room.grid.forEach((row) => {
    row.split('').forEach((token) => {
      const info = labels[token] || labels['.'];
      const cell = document.createElement('span');
      cell.className = `memo-tile memo-tile-${info.className}`;
      cell.textContent = info.text;
      cell.title = info.label;
      cell.setAttribute('aria-label', info.label);
      cell.dataset.tooltip = info.label;
      container.appendChild(cell);
    });
  });
}

function updateSummary() {
  const summary = document.getElementById('summaryText');
  if (!summary) return;

  const typeData = getCurrentTypeData();
  if (!typeData) {
    summary.textContent = t('summaryEmpty');
    return;
  }

  const mission = textOfSelected('missionTypeBox');
  const subWrap = document.getElementById('subType');
  const subtype = subWrap && subWrap.style.display !== 'none' ? textOfSelected('missionSubTypeBox') : '';
  const dungeon = textOfSelected('dungeonBox');
  const floor = document.getElementById('floor').value || '1';
  const region = getRegionName(getSelectedRegion());
  const client = monNameFromSelect('clientBox', 'clientF', typeData.forceClient);
  const target = typeData.clientIsTarget ? client : monNameFromSelect('targetBox', 'targetF', typeData.forceTarget);
  const difficulty = isEggGlitchEnabled() ? null : getMissionDifficultyInfo(typeData);

  const parts = [`${mission}${subtype && subtype !== '-' ? ` - ${subtype}` : ''}`, `${t('regionLabel')} ${region}`];

  if (isEggGlitchEnabled()) {
    parts.push(t('eggGlitchRecipe'));
  } else {
    parts.push(t('floorSummary', { dungeon, floor }));
    parts.push(t('clientSummary', { name: client }));
    if (difficulty) {
      parts.push(t('difficultySummary', { rank: difficulty.rank, points: difficulty.points }));
    }
  }

  if (!isEggGlitchEnabled() && (!typeData.clientIsTarget || typeData.forceTarget !== undefined)) {
    parts.push(t('targetSummary', { name: target }));
  }
  if (!isEggGlitchEnabled() && typeData.useTarget2) {
    parts.push(t('target2Summary', { name: monNameFromSelect('target2Box', 'target2F') }));
  }
  if (!isEggGlitchEnabled() && typeData.useTargetItem) {
    parts.push(t('targetItemSummary', { name: textOfSelected('targetItemBox') }));
  }
  if (!isEggGlitchEnabled() && !typeData.noReward) {
    parts.push(t('rewardSummary', { name: textOfSelected('rewardTypeBox') }));
  }
  if (isEggGlitchEnabled()) {
    parts.push(t('eggGlitchSummary', { name: textOfSelected('eggPokemonBox') }));
  }
  if (isTreasureMemoType(typeData)) {
    const memoPreset = document.getElementById('memoPreset');
    const specialFloor = document.getElementById('specialFloor').value || '';
    const label = memoPreset && memoPreset.selectedIndex > 0
      ? memoPreset.options[memoPreset.selectedIndex].text
      : (specialFloor ? t('specialFloorFull', { floor: specialFloor }) : t('auto'));
    parts.push(t('memoSummary', { name: label }));
  }

  summary.textContent = parts.join(' · ');
}

function generateCode() {
  const output = document.getElementById('outputbox');
  const compact = document.getElementById('compactOutput');
  const status = document.getElementById('statusLine');

  const showErrors = (errors) => {
    output.value = errors.map((error) => `• ${error}`).join('\n');
    compact.value = '';
    status.textContent = t('blockedCombination');
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

  output.value = pretty;
  compact.value = compactCode(pretty);
  status.textContent = t('generatedFor', { region: getRegionName(getSelectedRegion()) });
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

function importCode() {
  const input = document.getElementById('importCode');
  const status = document.getElementById('statusLine');
  if (!input || !status) return;

  const raw = input.value.trim();
  if (!raw) {
    status.textContent = t('importCodeEmpty');
    return;
  }

  const decoded = detectWonderMailCode(raw);
  if (!decoded) {
    status.textContent = t('importCodeInvalid');
    return;
  }

  const fullyMapped = importDecodedStruct(decoded);
  const region = getRegionName(decoded.region);
  status.textContent = fullyMapped
    ? t('importCodeOk', { region })
    : t('importCodePartial', { region });
}

async function copyFrom(id) {
  const el = document.getElementById(id);
  const status = document.getElementById('statusLine');
  if (!el || !el.value.trim()) {
    status.textContent = t('nothingToCopy');
    return;
  }
  try {
    await navigator.clipboard.writeText(el.value.trim());
    status.textContent = id === 'compactOutput' ? t('compactCopied') : t('codeCopied');
  } catch (e) {
    status.textContent = t('copyFailed');
  }
}

function updateMemoVisuals() {
  const section = document.getElementById('memoVisuals');
  const lead = document.getElementById('memoVisualLead');
  const badge = document.getElementById('memoSpotlightBadge');
  const title = document.getElementById('memoSpotlightTitle');
  const description = document.getElementById('memoSpotlightDescription');
  const meta = document.getElementById('memoSpotlightMeta');
  const warning = document.getElementById('memoSpotlightWarning');
  const location = document.getElementById('memoSpotlightLocation');
  const code = document.getElementById('memoSpotlightCode');
  const map = document.getElementById('memoSpotlightMap');
  const features = document.getElementById('memoSpotlightFeatures');
  const grid = document.getElementById('memoGalleryGrid');
  if (!section || !lead || !badge || !title || !description || !meta || !warning || !location || !code || !map || !features || !grid) return;

  const enabled = isTreasureMemoType(getCurrentTypeData());
  section.classList.toggle('hidden', !enabled);
  if (!enabled) return;

  const specialFloor = getMemoSpecialFloor();
  const entry = specialFloor ? getMemoRoomBySpecialFloor(specialFloor) : null;
  const memoSelect = document.getElementById('memoPreset');
  const currentLabel = memoSelect && memoSelect.selectedIndex > 0
    ? memoSelect.options[memoSelect.selectedIndex].text
    : (specialFloor ? t('specialFloorFull', { floor: specialFloor }) : t('auto'));

  grid.innerHTML = '';
  grid.classList.add('hidden');

  if (!specialFloor) {
    lead.textContent = t('memoChooseFloor');
    badge.textContent = t('waiting');
    title.textContent = t('noRoomSelected');
    description.textContent = t('roomMapAppears');
    meta.textContent = '';
    warning.textContent = '';
    warning.classList.add('hidden');
    location.textContent = '';
    code.textContent = '';
    code.classList.add('hidden');
    features.innerHTML = '';
    renderMemoMap(map, null, true);
    return;
  }

  if (!entry) {
    lead.textContent = t('memoMissingInData', { label: currentLabel });
    badge.textContent = t('missingSource');
    title.textContent = t('roomTitle', { floor: specialFloor });
    description.textContent = t('noUsableMap');
    meta.textContent = '';
    warning.textContent = '';
    warning.classList.add('hidden');
    location.textContent = '';
    code.textContent = '';
    code.classList.add('hidden');
    features.innerHTML = '';
    renderMemoMap(map, null, true);
    return;
  }

  lead.textContent = entry.expertOnly
    ? t('memoUsesRoomExpert', { label: currentLabel, floor: entry.specialFloor })
    : t('memoUsesRoom', { label: currentLabel, floor: entry.specialFloor });
  badge.textContent = t('specialFloorFull', { floor: specialFloor });
  title.textContent = t('roomTitle', { floor: entry.specialFloor });
  description.textContent = buildMemoDescription(entry);
  meta.textContent = entry.missingMap
    ? t('memoMissingPage')
    : entry.reconstructedFromScreens
      ? t('memoReconstructed', { width: entry.width, height: entry.height })
      : t('memoFormat', { width: entry.width, height: entry.height });
  warning.textContent = getMemoWarning(entry);
  warning.classList.toggle('hidden', !getMemoWarning(entry));

  const example = getMemoRealExample(entry.specialFloor);
  if (example) {
    const region = getSelectedRegion();
    location.textContent = t('memoExample', {
      dungeon: getDungeonName(example.dungeon),
      floor: example.floor,
      region: getRegionName(region)
    });
    code.textContent = prettyMailString(WMSParser.convertRegion(example.code, example.region, region), 2, 7);
    code.classList.remove('hidden');
  } else {
    location.textContent = t('memoNoSample');
    code.textContent = '';
    code.classList.add('hidden');
  }

  renderMemoMap(map, entry, true);
  renderMemoFeatureList(features, entry);
}

// Missione reale del gioco (codice giapponese) che usa questa stanza.
function getMemoRealExample(specialFloor) {
  const examples = Array.isArray(window.MemoRealExamples) ? window.MemoRealExamples : [];
  return examples.find((example) => example.specialFloor === specialFloor) || null;
}

function renderMemoPresetPreview(optionOrValue) {
  const option = getMemoPresetOption(optionOrValue);
  const badge = document.getElementById('memoPresetPreviewBadge');
  const title = document.getElementById('memoPresetPreviewTitle');
  const text = document.getElementById('memoPresetPreviewText');
  const warning = document.getElementById('memoPresetPreviewWarning');
  const map = document.getElementById('memoPresetPreviewMap');
  const features = document.getElementById('memoPresetPreviewFeatures');
  if (!option || !badge || !title || !text || !warning || !map || !features) return;

  const specialFloor = parseInt(option.value || '', 10);
  const room = Number.isFinite(specialFloor) ? getMemoRoomBySpecialFloor(specialFloor) : null;

  if (!Number.isFinite(specialFloor)) {
    badge.textContent = t('autoPreviewBadge');
    title.textContent = t('auto');
    text.textContent = t('autoPreviewText');
    warning.textContent = '';
    warning.classList.add('hidden');
    features.innerHTML = '';
    renderMemoMap(map, null, false);
    return;
  }

  badge.textContent = t('specialFloorFull', { floor: specialFloor });
  title.textContent = option.dataset.previewTitle || option.text;
  text.textContent = buildMemoDescription(room);
  warning.textContent = getMemoWarning(room);
  warning.classList.toggle('hidden', !getMemoWarning(room));
  renderMemoFeatureList(features, room);
  renderMemoMap(map, room, false);
}

function updateMemoPresetPicker() {
  const select = document.getElementById('memoPreset');
  const title = document.getElementById('memoPresetTitle');
  const subtitle = document.getElementById('memoPresetSubtitle');
  const optionsWrap = document.getElementById('memoPresetOptions');
  if (!select || !title || !subtitle || !optionsWrap) return;

  const option = select.options[select.selectedIndex] || select.options[0];
  if (!option) return;

  title.textContent = option.dataset.shortLabel || option.text;
  subtitle.textContent = option.value ? t('specialFloorShort', { floor: option.value }) : t('noForcedVariant');

  optionsWrap.querySelectorAll('.memo-picker-option').forEach((button) => {
    button.classList.toggle('active', button.dataset.value === option.value);
  });

  renderMemoPresetPreview(option);
}

function renderMemoPresetPicker() {
  const wrap = document.getElementById('memoSelectorWrap');
  const select = document.getElementById('memoPreset');
  const optionsWrap = document.getElementById('memoPresetOptions');
  if (!wrap || !select || !optionsWrap) return;

  const label = wrap.querySelector('label');
  const hint = wrap.querySelector('.hint');
  if (label) {
    label.htmlFor = 'memoPresetToggle';
    label.textContent = t('memoSelectorLabel');
  }
  if (hint) {
    hint.textContent = t('memoPickerHint');
  }

  optionsWrap.innerHTML = '';
  Array.from(select.options).forEach((option, index) => {
    const button = document.createElement('button');
    const name = document.createElement('span');
    const floor = document.createElement('span');

    button.type = 'button';
    button.className = 'memo-picker-option';
    button.dataset.value = option.value;

    name.className = 'memo-picker-option-name';
    name.textContent = option.value ? `V${index}` : 'Auto';

    floor.className = 'memo-picker-option-floor';
    floor.textContent = option.dataset.floorLabel || 'Auto';

    button.append(name, floor);
    button.addEventListener('mouseenter', () => renderMemoPresetPreview(option));
    button.addEventListener('focus', () => renderMemoPresetPreview(option));
    button.addEventListener('click', () => applyMemoPresetValue(option.value));
    optionsWrap.appendChild(button);
  });

  optionsWrap.addEventListener('mouseleave', updateMemoPresetPicker);
  updateMemoPresetPicker();
}

function populateMemoSelector() {
  const select = document.getElementById('memoPreset');
  if (!select || select.options.length) return;

  const values = (WMSGenData && WMSGenData.staticLists && WMSGenData.staticLists.treasurehunt) || [];
  const auto = document.createElement('option');
  auto.value = '';
  localizeMemoOption(auto, 0, '');
  select.add(auto);

  values.forEach((value, index) => {
    const option = document.createElement('option');
    option.value = String(value);
    localizeMemoOption(option, index, value);
    select.add(option);
  });

  renderMemoPresetPicker();
}

function applyPreset(kind) {
  const typeSelect = document.getElementById('missionTypeBox');
  const subSelect = document.getElementById('missionSubTypeBox');
  const eggGlitch = document.getElementById('eggGlitch');
  if (eggGlitch) eggGlitch.checked = kind === 'egg';

  const specialMap = {
    standard: () => {
      setSelectByValue(typeSelect, findMissionTypeIndex(0));
    },
    memo: () => {
      setSelectByValue(typeSelect, findMissionTypeIndex(12));
    },
    egg: () => {
      applyEggGlitchPreset();
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
    jirachi: () => {
      setSelectByValue(typeSelect, findMissionTypeIndex(11));
      WMSGen.fillSubTypeList();
      setSelectByValue(subSelect, findSubtypeIndex(findMissionTypeIndex(11), 'Jirachi'));
    }
  };

  if (specialMap[kind]) {
    specialMap[kind]();
    document.getElementById('specialFloor').value = '';
    if (kind === 'memo') {
      document.getElementById('memoPreset').selectedIndex = 0;
    }
    WMSGen.fillSubTypeList();
    relabelMissionTypeSelect();
    relabelMissionSubTypeSelect();
    WMSGen.update();
    document.getElementById('memoSelectorWrap').classList.toggle('hidden', kind !== 'memo');
    syncMemoSelectorFromSpecialFloor();
    refreshMissionUi();
    updateSummary();
    updateMemoVisuals();
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
    updateSummary();
  });

  // Cambiando regione cambia anche il codice d'esempio del Memo tesoro.
  document.getElementById('regionBox')?.addEventListener('change', updateMemoVisuals);

  applyLanguage(currentLanguage, { persist: false });
});
