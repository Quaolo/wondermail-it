// Esegue fn a pagina pronta, dopo il resto di questo file (le costanti più in basso esistono già).
function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    window.setTimeout(fn, 0);
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

// Mela: ricompensa predefinita, così la combinazione iniziale è subito valida.
const DEFAULT_REWARD_ITEM = 109;
// Gommaincanto: il tesoro più comune nei Memo tesoro reali.
const DEFAULT_TREASURE_ITEM = 136;

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
  setSelectByValue(document.getElementById('targetItemBox'), DEFAULT_TREASURE_ITEM);
  setSelectedRegion('eu');

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
        // Uno strumento da lancio non può essere lo strumento obiettivo: meglio partire da uno valido.
        const targetItem = document.getElementById('targetItemBox');
        if (targetItem && WMSGenData.badTargetItems.includes(parseInt(targetItem.value, 10))) {
          setSelectByValue(targetItem, DEFAULT_TREASURE_ITEM);
        }
      }
      WMSGen.update();
      refreshMissionUi();
      scheduleLiveGeneration();
    });
    node.addEventListener('input', () => {
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

function generateCode() {
  const output = document.getElementById('outputbox');
  const compact = document.getElementById('compactOutput');
  const card = document.getElementById('resultCard');

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

  output.value = pretty;
  compact.value = compactCode(pretty);
  const region = getSelectedRegion();
  setStatus('statusLine', 'generatedFor', () => ({ region: getRegionName(region) }));
  if (card) card.classList.remove('has-errors');
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

  const fullyMapped = importDecodedStruct(decoded);
  const values = () => ({ region: getRegionName(decoded.region) });
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
      // Come nelle missioni vere: una Gommaincanto nel Tecalusso.
      setSelectByValue(document.getElementById('targetItemBox'), DEFAULT_TREASURE_ITEM);
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
  const dex = window.WMSkyPokemonSpriteDex && window.WMSkyPokemonSpriteDex[species];
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

function renderHeroTeam() {
  const team = document.getElementById('heroTeam');
  if (!team || team.childElementCount) return;
  const pool = HERO_TEAM_CHOICES.slice();
  for (let index = 0; index < 4 && pool.length; index += 1) {
    const [monId] = pool.splice(Math.floor(Math.random() * pool.length), 1);
    const frame = document.createElement('span');
    frame.className = 'portrait-frame hero-portrait';
    frame.style.setProperty('--delay', `${index * 0.35}s`);
    const image = document.createElement('img');
    image.alt = '';
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
  fields.innerHTML = '';
  const result = getOutputMission();
  card.classList.toggle('job-card-invalid', !result);
  if (!result) {
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
  if (struct.missionType === 12 || (struct.missionType === 3 && struct.missionSpecial === 1)) {
    addJobRow(fields, struct.missionType === 12 ? t('jobTreasure') : t('jobChamberItem'), makeItemValue(struct.targetItem));
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

  note.textContent = egg
    ? t('jobNoteEgg')
    : t('jobNote', { seed: struct.flavorText, region: getRegionName(result.region) });
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
  title.textContent = ordinal
    ? t('roomTitleOrdinal', { room: roomId, ordinal, total: plan.rooms ? plan.rooms.length : 1 })
    : t('roomNumber', { room: roomId });

  const typed = String(document.getElementById('specialFloor')?.value || '').trim() !== '';
  badge.textContent = plan.forced || !plan.rooms
    ? t('roomBadgeFixed')
    : (typed ? t('roomBadgeChosen') : t('roomBadgeRandom'));

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

// Anteprima e stanza seguono sempre la password mostrata.
function updateOutputCards() {
  renderJobCard();
  renderRoomCard();
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
  renderHeroTeam();
  applyRepoLink();
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
