function getOption() {
  return false;
}

function setOption() {
  return false;
}

function buildPokemonNameRange(start, end, label) {
  const entries = {};
  for (let id = start; id <= end; id += 1) {
    entries[id] = label;
  }
  return entries;
}

const EXTRA_POKEMON_NAMES = {
  fr: {
    0: '???',
    29: 'Nidoran F',
    32: 'Nidoran M',
    535: 'Shaymin - Ciel',
    536: 'Giratina - Origine',
    ...buildPokemonNameRange(537, 551, 'Reserve'),
    552: 'Dialga Primal',
    553: 'Quelque chose',
    554: 'Statue',
    555: 'Grodoudou - Ombre',
    556: 'Regigigas - Statue',
    557: 'Archodong - Statue',
    558: 'Kicklee - Statue',
    559: 'Eoko - Cutscene',
    560: 'Grodoudou - Cutscene',
    561: 'Crehelf - Cutscene',
    562: 'Crefadet - Cutscene',
    563: 'Crefollet - Cutscene',
    564: 'Heliatronc - Cutscene',
    565: 'Taupiqueur - Cutscene',
    566: 'Triopikeur - Cutscene',
    567: 'Ecrapince - Cutscene',
    568: 'Ramboum - Cutscene',
    569: 'Keunotor - Cutscene',
    570: 'Pijako - Cutscene',
    571: 'Massko - Cutscene',
    572: 'Noctunoir - Cutscene',
    573: 'Tenefix - Cutscene',
    574: 'Darkrai - Ombre',
    575: 'Maman Grodoudou - Cutscene',
    576: 'Massko - Cutscene',
    577: 'Noctunoir - Cutscene',
    578: 'Noctunoir - Cutscene',
    579: 'Fouinette - Cutscene',
    580: 'Joliflor - Cutscene',
    ...buildPokemonNameRange(581, 599, 'Reserve - invalide')
  },
  en: {
    0: '???',
    29: 'Nidoran F',
    32: 'Nidoran M',
    535: 'Shaymin - Sky',
    536: 'Giratina - Origin',
    ...buildPokemonNameRange(537, 551, 'Reserve'),
    552: 'Primal Dialga',
    553: 'Something',
    554: 'Statue',
    555: 'Wigglytuff - Shadow',
    556: 'Regigigas - Statue',
    557: 'Bronzong - Statue',
    558: 'Hitmonlee - Statue',
    559: 'Chimecho - Cutscene',
    560: 'Wigglytuff - Cutscene',
    561: 'Uxie - Cutscene',
    562: 'Azelf - Cutscene',
    563: 'Mesprit - Cutscene',
    564: 'Sunflora - Cutscene',
    565: 'Diglett - Cutscene',
    566: 'Dugtrio - Cutscene',
    567: 'Corphish - Cutscene',
    568: 'Loudred - Cutscene',
    569: 'Bidoof - Cutscene',
    570: 'Chatot - Cutscene',
    571: 'Grovyle - Cutscene',
    572: 'Dusknoir - Cutscene',
    573: 'Sableye - Cutscene',
    574: 'Darkrai - Shadow',
    575: 'Wigglytuff Mom - Cutscene',
    576: 'Grovyle - Cutscene',
    577: 'Dusknoir - Cutscene',
    578: 'Dusknoir - Cutscene',
    579: 'Sentret - Cutscene',
    580: 'Bellossom - Cutscene',
    ...buildPokemonNameRange(581, 599, 'Reserve - Invalid')
  }
};

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
let currentLanguage = 'en';

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
  if (languages.includes('en')) return 'en';
  if (languages.includes('fr')) return 'fr';
  return languages[0] || 'en';
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
  return (locale && locale.meta) || {
    code: code || 'fr',
    label: String(code || 'fr').toUpperCase(),
    nativeLabel: String(code || 'fr').toUpperCase(),
    shortLabel: String(code || 'fr').toUpperCase(),
    flagPath: ''
  };
}

function getLocaleMessages(code) {
  const locale = getLocale(code);
  return (locale && locale.messages) || {};
}

function getLocaleLabelMap(key, code) {
  const locale = getLocale(code);
  return (locale && locale[key]) || {};
}

const UI_TEXT = {
  fr: {
    pageTitle: 'Generateur FR - Lettres Miracle S (Explorateurs du Ciel)',
    metaDescription: 'Generateur francais de Lettres Miracle S pour Pokemon Donjon Mystere : Explorateurs du Ciel, avec mode Europe, Memo mystere et Lettres de defi.',
    heroEyebrow: 'Pokemon Donjon Mystere : Explorateurs du Ciel',
    heroTitle: 'Generateur FR de Lettres Miracle S',
    heroLead: 'Version propre en francais, avec generation pour la <strong>version europeenne</strong>, les <strong>Memo mystere</strong> et les <strong>Lettres de defi</strong>.',
    badgeChars: '34 caracteres',
    badgeRegion: 'Mode Europe',
    quickAccess: 'Acces rapide',
    presetStandard: 'Mission normale',
    presetMemo: 'Memo mystere',
    presetChallenge: 'Lettre de defi - {boss}',
    presetsHint: 'Les lettres de defi et les memos mystere sont des types exclusifs a Explorateurs du Ciel.',
    missionSection: 'Mission',
    missionTypeLabel: 'Type de mission',
    dungeonLabel: 'Donjon',
    dungeonPlaceholder: 'Chercher un donjon...',
    floorLabel: 'Etage',
    memoSelectorLabel: 'Selecteur Memo mystere',
    memoHint: 'Choisit directement la variante interne du Memo mystere. "Automatique" laisse le generateur en aleatoire.',
    advancedOptions: 'Options expertes',
    flavorTextLabel: 'Type de texte',
    flavorTextHeadLabel: 'Titre du message',
    flavorTextBodyLabel: 'Contenu du message',
    flavorTextHeadAuto: 'Automatique',
    flavorTextHeadCustom: 'Personnalise',
    flavorTextBodyAuto: 'Texte automatique du jeu',
    flavorTextChoiceHintKnown: 'Choisis un texte de quete predefini quand il existe. "Personnalise" laisse la main sur la valeur brute.',
    flavorTextChoiceHintNone: 'Aucun texte de quete documente ici pour ce type de mission. Utilise "Personnalise" si tu veux forcer une valeur brute.',
    flavorTextPlaceholder: 'Automatique si vide',
    specialFloorLabel: 'Etage special',
    specialFloorPlaceholder: 'Automatique si vide',
    specialFloorHint: 'Le selecteur ci-dessus remplit ce champ automatiquement pour les Memos mystere.',
    targetSection: 'Pokemon et objet cible',
    clientLabel: 'Client',
    targetLabel: 'Cible',
    target2Label: 'Cible supplementaire',
    targetItemLabel: 'Objet cible',
    pokemonSearchPlaceholder: 'Chercher un Pokemon...',
    targetSearchPlaceholder: 'Chercher une cible...',
    target2SearchPlaceholder: 'Chercher une cible supplementaire...',
    itemSearchPlaceholder: 'Chercher un objet...',
    rewardSection: 'Recompense et region',
    rewardTypeLabel: 'Type de recompense',
    rewardItemLabel: 'Objet en recompense',
    rewardSearchPlaceholder: 'Chercher un objet de recompense...',
    female: 'Femelle',
    euToggle: 'Generer pour la version europeenne',
    euHint: 'Decoche pour les versions US/AUS. Les codes Sky ne sont pas compatibles entre regions.',
    summaryTitle: 'Resume',
    summaryEmpty: 'Choisis une mission pour voir le resume.',
    memoVisualEyebrow: 'Memo tresor',
    memoVisualTitle: 'Cartographie des salles',
    memoVisualLead: 'Cette section affiche les formes exactes relevees sur la wiki japonaise des Memos tresor.',
    memoHintBottom: "Les formes 115 a 144 viennent directement de la wiki japonaise. La variante 114 a ete reconstituee d'apres captures joueur : salle etroite avec escalier au nord, 4 coffres luxe au centre, et une mission qui semble ne jamais se valider.",
    sourceShapes: 'Wiki JP : formes',
    sourceCodes: 'Wiki JP : codes',
    importCodeLabel: 'Lire un code existant',
    importCodePlaceholder: 'Colle un code Wonder Mail S ici...',
    importCodeButton: 'Lire ce code',
    resultTitle: 'Code genere',
    generate: 'Generer',
    copy: 'Copier',
    copyCompact: 'Copier sans espaces',
    outputPlaceholder: 'Le code apparaitra ici...',
    compactLabel: 'Version compacte',
    statusDefault: 'Astuce : le mode Europe est deja active par defaut.',
    warningEyebrow: 'Avertissement',
    warningTitle: 'Contenu a relire avec prudence',
    warningLead: 'Des textes, libelles, descriptions, rapprochements et annotations ont ete ajoutes automatiquement. De nombreuses erreurs, approximations ou mauvaises interpretations peuvent encore etre presentes.',
    warningHint: 'Le site, la cartographie Memo tresor et plusieurs aides visuelles doivent etre traites comme un outil communautaire en cours de verification, pas comme une reference parfaite.',
    notesTitle: 'Notes utiles',
    note1: '<strong>Memo mystere</strong> = mission de type <em>Trouver le tresor</em>.',
    note2: '<strong>Lettres de defi</strong> = missions speciales Sky avec combat de boss.',
    note3: 'Certaines combinaisons restent rejetees par le jeu, meme si un code peut etre construit.',
    note4: 'Sur console reelle, quelques combinaisons exotiques peuvent causer un freeze ; reste sur des reglages coherents.',
    sourcesSummary: 'Credits et sources',
    creditsTitle: 'Credits',
    creditsBody1: 'Credit a <strong>_RedCoal_</strong> pour les retours, les captures, les corrections de salles et les verifications de contenu.',
    creditsBody2: "Cette refonte et ses ajouts ont ete realises full par IA avec <strong>GPT-5.4</strong>. Des erreurs peuvent etre presentes dans les textes, les labels, les associations d'images et certaines interpretations.",
    creditsBody3: "J'ai fait ce site car je trouvais l'interface des autres pas tres visuelle, et le seul site capable de generer des salles Memo tresor etait un site japonais peu comprehensible. J'ai monte celui-ci en un apres-midi avec Codex et je trouve qu'il fait bien le taff. Une partie du code provient probablement de projets deja existants ; les sources que Codex a utilisees sont listees ci-dessous.",
    generatorBaseTitle: 'Base du generateur',
    wonderMailDocsTitle: 'Documentation Wonder Mail et PMD',
    memoSourcesTitle: 'Memo tresor et sources japonaises',
    auxDataTitle: 'Images et donnees auxiliaires',
    footerText: "Interface francaise refaite a partir d'un backend historique de generation Wonder Mail S, enrichie avec des ajouts communautaires, des recoupements externes et des contenus assistes par IA.",
    auto: 'Automatique',
    noForcedVariant: 'Aucune variante forcee',
    autoPreviewBadge: 'Apercu auto',
    autoPreviewText: "Le generateur choisit une variante automatiquement. Passe la souris sur un etage pour voir sa forme ici.",
    chooseVariant: 'Choisis une variante',
    waiting: 'En attente',
    noRoomSelected: 'Aucune salle selectionnee',
    roomMapAppears: "La carte exacte ne s'affiche que quand tu choisis une variante ou un etage special.",
    missingSource: 'Source manquante',
    noUsableMap: "Aucune carte exploitable pour cet etage special pour le moment.",
    jpSource: 'Source japonaise',
    roomTitle: 'Salle {floor}',
    specialFloorShort: 'Etage {floor}',
    specialFloorFull: 'Etage special {floor}',
    previewTitle: 'Variante {variant} - Etage {floor}',
    previewOption: 'Variante {variant} (etage special {floor})',
    memoPickerHint: "Survole un etage pour voir l'apercu a droite, puis clique pour le choisir.",
    memoUsesRoom: '{label} utilise la salle {floor}. La carte ci-dessous suit la forme referencee sur la wiki japonaise.',
    memoMissingInData: "{label} reference bien un etage special, mais je n'ai pas trouve de carte correspondante dans les donnees chargees.",
    memoMissingPage: 'Cette variante est absente de la page de formes japonaise.',
    memoReconstructed: 'Reconstitution depuis captures joueur · format {width} x {height}',
    memoFormat: 'Format {width} x {height}',
    memoSampleFoundDungeon: 'Exemple de code retrouve sur {dungeon}, etage {floor}.',
    memoSampleFoundGeneric: 'Exemple de code retrouve sur le donjon {dungeon}, etage {floor}.',
    memoNoSample: "Aucun exemple de code automatique retrouve sur la page japonaise pour cette variante.",
    sourceIncomplete: 'source incomplete',
    mapMissing: 'Carte absente de la source JP',
    chooseVariantToShow: 'Choisis une variante pour afficher sa salle.',
    missingRoomDescription: "La source japonaise utilisee ne montre pas cette variante, donc on n'a pas encore sa forme exacte.",
    mapSize: 'Carte {width} x {height}.',
    treasurePosition: 'Tresor {position}.',
    stairsPosition: 'Escalier {position}.',
    playerPosition: 'Zone P {position}.',
    luxuryChestCount: '{count} coffres luxe visibles au centre de la salle.',
    sourceMarker: 'Repere source : {flags}.',
    noSpecialMarker: 'Aucun repere special signale dans le tableau source.',
    left: 'a gauche',
    right: 'a droite',
    center: 'au centre',
    top: 'en haut',
    middle: 'au milieu',
    bottom: 'en bas',
    flagPlayer: 'depart P',
    flagKey: 'cle requise',
    flagWater: 'zone bleue',
    flagBreakWall: 'mur traversable',
    flagChestnut: 'piege chestnut',
    flagWind: 'piege vent',
    flagWarp: 'piege warp',
    tileWall: 'Mur',
    tileFloor: 'Sol',
    tileWater: 'Eau',
    tileStairs: 'Escalier',
    tileTreasure: 'Tresor',
    tileLuxuryChest: 'Coffre luxe',
    tilePlayer: 'Depart joueur',
    tileKey: 'Cle requise',
    tileBreakWall: 'Mur traversable',
    tileChestnut: 'Piege chestnut',
    tileWind: 'Piege vent',
    tileWarp: 'Piege warp',
    forcedMissionPokemon: 'Pokemon impose par la mission',
    activeFemaleVersion: 'Version femelle active',
    activeSelection: 'Selection active',
    samePokemonAsClient: 'Meme Pokemon que le client',
    currentSelectedItem: 'Objet actuellement selectionne',
    rewardPreviewLabel: 'Recompense',
    target2PreviewLabel: 'Cible sup.',
    missionLabel: 'mission',
    regionLabel: 'region',
    floorSummary: '{dungeon} etage {floor}',
    clientSummary: 'client : {name}',
    targetSummary: 'cible : {name}',
    target2Summary: 'cible sup. : {name}',
    targetItemSummary: 'objet cible : {name}',
    rewardSummary: 'recompense : {name}',
    memoSummary: 'memo : {name}',
    regionEurope: 'Europe',
    regionUs: 'US/AUS',
    generatedEu: 'Code genere pour la version europeenne.',
    generatedUs: 'Code genere pour la version US/AUS.',
    blockedCombination: 'Le generateur a bloque la combinaison choisie.',
    importCodeEmpty: 'Colle d abord un code a lire.',
    importCodeInvalid: 'Impossible de lire ce code. Verifie le format ou la region.',
    importCodePartial: 'Code lu, mais certains champs ne correspondent pas a une mission exposee par l interface.',
    importCodeEu: 'Code lu et formulaire rempli depuis un code europeen.',
    importCodeUs: 'Code lu et formulaire rempli depuis un code US/AUS.',
    nothingToCopy: 'Aucun code a copier.',
    compactCopied: 'Version compacte copiee.',
    codeCopied: 'Code copie.',
    copyFailed: 'Copie impossible dans ce navigateur.',
    chestVariantTitle: 'Variante interne {variant} du coffre',
    fixedItem835Title: 'Correction du libelle : Elekid Card'
  },
  en: {
    pageTitle: 'Wonder Mail S Generator (Explorers of Sky)',
    metaDescription: 'Wonder Mail S generator for Pokemon Mystery Dungeon: Explorers of Sky, with EU mode, Treasure Memos, and Challenge Letters.',
    heroEyebrow: 'Pokemon Mystery Dungeon: Explorers of Sky',
    heroTitle: 'Wonder Mail S Generator',
    heroLead: 'Clean interface with support for the <strong>European version</strong>, <strong>Treasure Memos</strong>, and <strong>Challenge Letters</strong>.',
    badgeChars: '34 characters',
    badgeRegion: 'Europe mode',
    quickAccess: 'Quick access',
    presetStandard: 'Standard mission',
    presetMemo: 'Treasure Memo',
    presetChallenge: 'Challenge Letter - {boss}',
    presetsHint: 'Challenge letters and treasure memos are exclusive mission types from Explorers of Sky.',
    missionSection: 'Mission',
    missionTypeLabel: 'Mission type',
    dungeonLabel: 'Dungeon',
    dungeonPlaceholder: 'Search a dungeon...',
    floorLabel: 'Floor',
    memoSelectorLabel: 'Treasure Memo selector',
    memoHint: 'Directly choose the internal Treasure Memo variant. "Automatic" keeps the generator random.',
    advancedOptions: 'Advanced options',
    flavorTextLabel: 'Text type',
    flavorTextHeadLabel: 'Message title',
    flavorTextBodyLabel: 'Message body',
    flavorTextHeadAuto: 'Automatic',
    flavorTextHeadCustom: 'Custom',
    flavorTextBodyAuto: 'Automatic in-game text',
    flavorTextChoiceHintKnown: 'Choose a predefined quest text when available. "Custom" leaves the raw value under your control.',
    flavorTextChoiceHintNone: 'No quest text is documented here for this mission type. Use "Custom" if you want to force a raw value.',
    flavorTextPlaceholder: 'Automatic if empty',
    specialFloorLabel: 'Special floor',
    specialFloorPlaceholder: 'Automatic if empty',
    specialFloorHint: 'The selector above fills this field automatically for Treasure Memos.',
    targetSection: 'Pokemon and target item',
    clientLabel: 'Client',
    targetLabel: 'Target',
    target2Label: 'Extra target',
    targetItemLabel: 'Target item',
    pokemonSearchPlaceholder: 'Search a Pokemon...',
    targetSearchPlaceholder: 'Search a target...',
    target2SearchPlaceholder: 'Search an extra target...',
    itemSearchPlaceholder: 'Search an item...',
    rewardSection: 'Reward and region',
    rewardTypeLabel: 'Reward type',
    rewardItemLabel: 'Reward item',
    rewardSearchPlaceholder: 'Search a reward item...',
    female: 'Female',
    euToggle: 'Generate for the European version',
    euHint: 'Uncheck this for US/AUS. Sky codes are not cross-region compatible.',
    summaryTitle: 'Summary',
    summaryEmpty: 'Choose a mission to see the summary.',
    memoVisualEyebrow: 'Treasure Memo',
    memoVisualTitle: 'Room maps',
    memoVisualLead: 'This section shows the exact room shapes documented on the Japanese Treasure Memo wiki.',
    memoHintBottom: 'Shapes 115 to 144 come directly from the Japanese wiki. Variant 114 was rebuilt from player screenshots: narrow room with stairs to the north, 4 deluxe chests in the center, and a mission that appears to never validate.',
    sourceShapes: 'JP wiki: shapes',
    sourceCodes: 'JP wiki: codes',
    importCodeLabel: 'Read an existing code',
    importCodePlaceholder: 'Paste a Wonder Mail S code here...',
    importCodeButton: 'Read this code',
    resultTitle: 'Generated code',
    generate: 'Generate',
    copy: 'Copy',
    copyCompact: 'Copy compact',
    outputPlaceholder: 'The code will appear here...',
    compactLabel: 'Compact version',
    statusDefault: 'Tip: Europe mode is already enabled by default.',
    warningEyebrow: 'Warning',
    warningTitle: 'Review this content carefully',
    warningLead: 'Some texts, labels, descriptions, matches, and annotations were added automatically. Many errors, approximations, or bad interpretations may still be present.',
    warningHint: 'The site, the Treasure Memo mapping, and several visual helpers should be treated as a community tool under verification, not as a perfect reference.',
    notesTitle: 'Useful notes',
    note1: '<strong>Treasure Memo</strong> = mission type <em>Find the treasure</em>.',
    note2: '<strong>Challenge Letters</strong> = Sky-exclusive boss fight missions.',
    note3: 'Some combinations are still rejected by the game even if a code can be generated.',
    note4: 'On real hardware, a few unusual combinations may freeze the game; stick to coherent settings.',
    sourcesSummary: 'Credits and sources',
    creditsTitle: 'Credits',
    creditsBody1: 'Credit to <strong>_RedCoal_</strong> for feedback, screenshots, room corrections, and content verification.',
    creditsBody2: 'This overhaul and its additions were made entirely by AI with <strong>GPT-5.4</strong>. Errors may still be present in texts, labels, image matching, and some interpretations.',
    creditsBody3: 'I made this site because I found the interfaces of the other ones not very visual, and the only site that could generate Treasure Memo rooms was a Japanese site that was hard to understand. I put this one together in an afternoon with Codex, and I think it does the job well. Some of the code probably comes from existing projects; the sources Codex used are listed below.',
    generatorBaseTitle: 'Generator base',
    wonderMailDocsTitle: 'Wonder Mail and PMD references',
    memoSourcesTitle: 'Treasure Memo and Japanese sources',
    auxDataTitle: 'Images and auxiliary data',
    footerText: 'French interface rebuilt from a historical Wonder Mail S backend, extended with community additions, external cross-checks, and AI-assisted content.',
    auto: 'Automatic',
    noForcedVariant: 'No forced variant',
    autoPreviewBadge: 'Auto preview',
    autoPreviewText: 'The generator chooses a variant automatically. Hover a floor to preview its shape here.',
    chooseVariant: 'Choose a variant',
    waiting: 'Waiting',
    noRoomSelected: 'No room selected',
    roomMapAppears: 'The exact map only appears when you choose a variant or a special floor.',
    missingSource: 'Missing source',
    noUsableMap: 'No usable map is available for this special floor yet.',
    jpSource: 'Japanese source',
    roomTitle: 'Room {floor}',
    specialFloorShort: 'Floor {floor}',
    specialFloorFull: 'Special floor {floor}',
    previewTitle: 'Variant {variant} - Floor {floor}',
    previewOption: 'Variant {variant} (special floor {floor})',
    memoPickerHint: 'Hover a floor to preview it on the right, then click to select it.',
    memoUsesRoom: '{label} uses room {floor}. The map below follows the shape referenced on the Japanese wiki.',
    memoMissingInData: '{label} does reference a special floor, but I could not find a matching room map in the loaded data.',
    memoMissingPage: 'This variant is missing from the Japanese room-shape page.',
    memoReconstructed: 'Rebuilt from player screenshots · size {width} x {height}',
    memoFormat: 'Size {width} x {height}',
    memoSampleFoundDungeon: 'Example code found for {dungeon}, floor {floor}.',
    memoSampleFoundGeneric: 'Example code found for dungeon {dungeon}, floor {floor}.',
    memoNoSample: 'No automatic example code was found on the Japanese page for this variant.',
    sourceIncomplete: 'incomplete source',
    mapMissing: 'Map missing from the JP source',
    chooseVariantToShow: 'Choose a variant to show its room.',
    missingRoomDescription: 'The Japanese source page does not show this variant yet, so its exact shape is still unknown.',
    mapSize: 'Map {width} x {height}.',
    treasurePosition: 'Treasure {position}.',
    stairsPosition: 'Stairs {position}.',
    playerPosition: 'P zone {position}.',
    luxuryChestCount: '{count} deluxe chests are visible in the middle of the room.',
    sourceMarker: 'Source marker: {flags}.',
    noSpecialMarker: 'No special marker is listed in the source table.',
    left: 'on the left',
    right: 'on the right',
    center: 'in the center',
    top: 'at the top',
    middle: 'in the middle',
    bottom: 'at the bottom',
    flagPlayer: 'P start',
    flagKey: 'key required',
    flagWater: 'blue zone',
    flagBreakWall: 'breakable wall',
    flagChestnut: 'chestnut trap',
    flagWind: 'wind trap',
    flagWarp: 'warp trap',
    tileWall: 'Wall',
    tileFloor: 'Floor',
    tileWater: 'Water',
    tileStairs: 'Stairs',
    tileTreasure: 'Treasure',
    tileLuxuryChest: 'Deluxe chest',
    tilePlayer: 'Player start',
    tileKey: 'Key required',
    tileBreakWall: 'Breakable wall',
    tileChestnut: 'Chestnut trap',
    tileWind: 'Wind trap',
    tileWarp: 'Warp trap',
    forcedMissionPokemon: 'Pokemon forced by the mission',
    activeFemaleVersion: 'Female version enabled',
    activeSelection: 'Current selection',
    samePokemonAsClient: 'Same Pokemon as the client',
    currentSelectedItem: 'Currently selected item',
    rewardPreviewLabel: 'Reward',
    target2PreviewLabel: 'Extra target',
    missionLabel: 'mission',
    regionLabel: 'region',
    floorSummary: '{dungeon} floor {floor}',
    clientSummary: 'client: {name}',
    targetSummary: 'target: {name}',
    target2Summary: 'extra target: {name}',
    targetItemSummary: 'target item: {name}',
    rewardSummary: 'reward: {name}',
    memoSummary: 'memo: {name}',
    regionEurope: 'Europe',
    regionUs: 'US/AUS',
    generatedEu: 'Code generated for the European version.',
    generatedUs: 'Code generated for the US/AUS version.',
    blockedCombination: 'The generator blocked the selected combination.',
    importCodeEmpty: 'Paste a code to read first.',
    importCodeInvalid: 'Could not read this code. Check the format or region.',
    importCodePartial: 'Code read, but some fields do not map cleanly to a mission exposed by this interface.',
    importCodeEu: 'Code read and form filled from a European code.',
    importCodeUs: 'Code read and form filled from a US/AUS code.',
    nothingToCopy: 'No code to copy.',
    compactCopied: 'Compact version copied.',
    codeCopied: 'Code copied.',
    copyFailed: 'Copy failed in this browser.',
    chestVariantTitle: 'Internal chest variant {variant}',
    fixedItem835Title: 'Label fix: Elekid Card'
  }
};

const MISSION_TYPE_LABELS = {
  fr: {
    0: 'Sauver le client.',
    1: 'Sauver la cible.',
    2: "Escorter jusqu'a la cible.",
    3: 'Explorer avec le client',
    4: 'Prospecter avec le client.',
    5: 'Guider le client.',
    6: 'Trouver un objet.',
    7: 'Livrer un objet.',
    8: 'Chercher le client.',
    9: "Prendre l'objet a la cible.",
    10: 'Arreter la cible. (Magneti)',
    11: 'Arreter la cible. (Magnezone)',
    12: 'Battre la cible.',
    13: 'Trouver le tresor.'
  },
  en: {
    0: 'Rescue the client.',
    1: 'Rescue the target.',
    2: 'Escort to the target.',
    3: 'Explore with the client.',
    4: 'Search with the client.',
    5: 'Guide the client.',
    6: 'Find an item.',
    7: 'Deliver an item.',
    8: 'Search for the client.',
    9: 'Take the item from the target.',
    10: 'Stop the target. (Magnemite)',
    11: 'Stop the target. (Magnezone)',
    12: 'Defeat the target.',
    13: 'Find the treasure.'
  }
};

const MISSION_SUBTYPE_LABELS = {
  fr: {
    3: { 0: 'Normal', 1: 'Chambre Scellee', 2: 'Chambre Doree', 3: 'Nouveau Donjon' },
    9: { 0: 'Normal', 1: 'Cible cachee', 2: 'Cible en fuite' },
    10: { 0: 'Normal', 1: 'Escorte', 2: 'Etage special', 3: 'Maison de monstres' },
    11: { 0: 'Normal', 1: 'Escorte', 2: 'Etage special', 3: 'Maison de monstres' },
    12: { 0: 'Normal', 1: 'Mewtwo', 2: 'Entei', 3: 'Raikou', 4: 'Suicune', 5: 'Jirachi' }
  },
  en: {
    3: { 0: 'Normal', 1: 'Sealed Chamber', 2: 'Golden Chamber', 3: 'New Dungeon' },
    9: { 0: 'Normal', 1: 'Hidden target', 2: 'Fleeing target' },
    10: { 0: 'Normal', 1: 'Escort', 2: 'Special floor', 3: 'Monster House' },
    11: { 0: 'Normal', 1: 'Escort', 2: 'Special floor', 3: 'Monster House' },
    12: { 0: 'Normal', 1: 'Mewtwo', 2: 'Entei', 3: 'Raikou', 4: 'Suicune', 5: 'Jirachi' }
  }
};

const REWARD_TYPE_LABELS = {
  fr: {
    0: 'Argent',
    1: 'Argent + ??? (objet en recompense)',
    2: 'Objet',
    3: 'Objet + ??? (aleatoire)',
    4: '??? (objet en recompense)',
    5: '??? (oeuf)',
    6: '??? (recrutement du client)'
  },
  en: {
    0: 'Money',
    1: 'Money + ??? (reward item)',
    2: 'Item',
    3: 'Item + ??? (random)',
    4: '??? (reward item)',
    5: '??? (egg)',
    6: '??? (client recruitment)'
  }
};

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

function t(key, values) {
  const lang = getCurrentLanguage();
  const currentMessages = getLocaleMessages(lang);
  const fallbackMessages = getLocaleMessages('fr');
  const text = currentMessages[key] || fallbackMessages[key] || ((UI_TEXT[lang] && UI_TEXT[lang][key]) || (UI_TEXT.fr && UI_TEXT.fr[key]) || key);
  return interpolate(text, values);
}

function setText(selector, text) {
  const node = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (node) node.textContent = text;
}

function setHtml(selector, html) {
  const node = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (node) node.innerHTML = html;
}

function setPlaceholder(selector, text) {
  const node = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (node) node.placeholder = text;
}

function ensureSelectOption(select, value, text) {
  if (!select) return;
  if (setSelectByValue(select, value)) return;
  const option = document.createElement('option');
  option.value = String(value);
  option.text = text;
  select.add(option);
}

function getLocalizedPokemonName(monId) {
  const numeric = parseInt(monId, 10);
  if (!Number.isFinite(numeric)) return '-';
  const normalized = numeric >= 600 ? numeric - 600 : numeric;
  const lang = getCurrentLanguage();
  const localizedExtras = EXTRA_POKEMON_NAMES[lang] || EXTRA_POKEMON_NAMES.fr;
  if (localizedExtras && localizedExtras[numeric]) {
    return localizedExtras[numeric];
  }
  if (localizedExtras && localizedExtras[normalized]) {
    return localizedExtras[normalized];
  }
  if (lang !== 'en') {
    return getMonName(numeric);
  }

  if (normalized === 29) return 'Nidoran♀';
  if (normalized === 32) return 'Nidoran♂';
  if (window.WMSkyPokemonNamesEn && window.WMSkyPokemonNamesEn[normalized]) {
    return window.WMSkyPokemonNamesEn[normalized];
  }
  return getMonName(numeric);
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
    || (MISSION_TYPE_LABELS[getCurrentLanguage()] && MISSION_TYPE_LABELS[getCurrentLanguage()][typeIndex])
    || (WMSGenData.missionTypes[typeIndex] && WMSGenData.missionTypes[typeIndex].name)
    || `Type ${typeIndex}`;
}

function getMissionSubtypeDisplayName(typeIndex, subtypeIndex) {
  const labels = getLocaleLabelMap('missionSubtypes', getCurrentLanguage());
  const localized = labels[typeIndex] && labels[typeIndex][subtypeIndex];
  if (localized) return localized;
  if (MISSION_SUBTYPE_LABELS[getCurrentLanguage()]
    && MISSION_SUBTYPE_LABELS[getCurrentLanguage()][typeIndex]
    && MISSION_SUBTYPE_LABELS[getCurrentLanguage()][typeIndex][subtypeIndex]) {
    return MISSION_SUBTYPE_LABELS[getCurrentLanguage()][typeIndex][subtypeIndex];
  }
  const type = WMSGenData.missionTypes[typeIndex];
  if (type && type.subTypes && type.subTypes[subtypeIndex]) {
    return type.subTypes[subtypeIndex].name;
  }
  return `Sous-type ${subtypeIndex}`;
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
      searchText: String(option.dataset.search || option.text || '').toLowerCase()
    }))
    .filter((entry) => !normalized || entry.searchText.includes(normalized));
}

function closeSearchSuggestions(controller) {
  if (!controller) return;
  controller.activeIndex = -1;
  controller.suggestions.innerHTML = '';
  controller.suggestions.classList.add('hidden');
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
    empty.textContent = getCurrentLanguage() === 'en' ? 'No matches found.' : 'Aucun resultat.';
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
    const text = document.createElement('span');
    text.className = 'search-suggestion-text';
    text.textContent = suggestion.text;

    button.append(icon, text);
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

  const combo = document.createElement('div');
  combo.className = 'search-combobox';
  input.parentNode.insertBefore(combo, input);

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

  searchBoxControllers.set(input.id, controller);
}

function refreshSearchBoxSelections() {
  searchBoxControllers.forEach((controller) => {
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

function getCurrentTypeData() {
  try {
    return WMSGen.getTypeData();
  } catch (e) {
    return null;
  }
}

function monNameFromSelect(selectId, femaleId, forcedId) {
  if (typeof forcedId === 'number') return getMonName(forcedId);
  const select = document.getElementById(selectId);
  if (!select || !select.options[select.selectedIndex]) return '—';
  const female = document.getElementById(femaleId)?.checked;
  const base = parseInt(select.value, 10);
  return getMonName(WMSGen.getTrueMonID(base, !!female));
}

function textOfSelected(selectId) {
  const select = document.getElementById(selectId);
  return select && select.options[select.selectedIndex] ? select.options[select.selectedIndex].text : '—';
}

function hasOwn(data, key) {
  return !!data && Object.prototype.hasOwnProperty.call(data, key);
}

function getInitials(label) {
  return String(label || '')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
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
  if (getCurrentLanguage() === 'en' && window.WMSkyDungeonNamesEn && window.WMSkyDungeonNamesEn[numeric]) {
    return window.WMSkyDungeonNamesEn[numeric];
  }
  if (window.WMSkyDungeon && Object.prototype.hasOwnProperty.call(window.WMSkyDungeon, numeric)) {
    return window.WMSkyDungeon[numeric];
  }
  return String(fallbackLabel || '');
}

function relabelDungeonSelect() {
  const select = document.getElementById('dungeonBox');
  if (!select) return;

  Array.from(select.options).forEach((option) => {
    const numeric = parseInt(option.value, 10);
    if (!Number.isFinite(numeric)) return;
    option.text = getLocalizedDungeonName(numeric, option.text);
  });
}

function getDungeonFloorLimit(dungeonId) {
  const numeric = parseInt(dungeonId, 10);
  if (!Number.isFinite(numeric) || !window.WMSkyDungeonFloorLimits) return 99;
  const limit = window.WMSkyDungeonFloorLimits[numeric];
  return Number.isFinite(limit) && limit >= 1 ? limit : 99;
}

function syncDungeonFloorLimit() {
  const dungeonSelect = document.getElementById('dungeonBox');
  const floorInput = document.getElementById('floor');
  const hint = document.getElementById('floorLimitHint');
  if (!dungeonSelect || !floorInput) return;

  const limit = getDungeonFloorLimit(dungeonSelect.value);
  const minFloor = isEggGlitchEnabled() ? 0 : 1;
  floorInput.min = String(minFloor);
  floorInput.max = String(limit);

  const current = parseInt(floorInput.value, 10);
  if (!Number.isFinite(current) || current < minFloor) {
    floorInput.value = String(minFloor);
  } else if (current > limit) {
    floorInput.value = String(limit);
  }

  if (hint) {
    hint.textContent = limit < 99
      ? t('floorLimitHint', { count: limit })
      : t('floorLimitUnknown');
  }
}

function scoreDecodedStruct(struct) {
  if (!struct || typeof struct !== 'object') return -1;
  let score = 0;
  if (struct.mailType === 4) score += 20;
  if (Number.isFinite(struct.missionType) && struct.missionType >= 0 && struct.missionType <= 12) score += 8;
  if (Number.isFinite(struct.missionSpecial) && struct.missionSpecial >= 0 && struct.missionSpecial <= 15) score += 2;
  if (Number.isFinite(struct.rewardType) && struct.rewardType >= 0 && struct.rewardType <= 6) score += 4;
  if (Number.isFinite(struct.floor) && struct.floor >= 1 && struct.floor <= 99) score += 2;
  if (window.WMSkyDungeon && Object.prototype.hasOwnProperty.call(window.WMSkyDungeon, struct.dungeon)) score += 3;
  if (Number.isFinite(struct.client) && struct.client > 0 && struct.client < 1200) score += 1;
  if (Number.isFinite(struct.target) && struct.target > 0 && struct.target < 1200) score += 1;
  return score;
}

function decodeWonderMailCandidate(code, useEuSwap) {
  try {
    const clean = WMSParser.sanitize(code || '');
    if (clean.length !== 34) return null;
    const unscrambled = WMSParser.unscrambleString(clean, useEuSwap ? WMSParser.byteSwapEU : WMSParser.byteSwap);
    const encryptedBits = WMSParser.bytesToBits(unscrambled);
    if (encryptedBits.length !== 170) return null;
    const decryptedBits = WMSParser.decryptBitStream(encryptedBits, false);
    const struct = WMSParser.bitsToStructure(decryptedBits);
    const score = scoreDecodedStruct(struct);
    return { clean, struct, score, useEuSwap };
  } catch (error) {
    return null;
  }
}

function detectWonderMailCode(code) {
  const preferredEu = !!document.getElementById('useEUswap')?.checked;
  const candidates = [
    decodeWonderMailCandidate(code, true),
    decodeWonderMailCandidate(code, false)
  ].filter(Boolean);

  if (!candidates.length) return null;

  candidates.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if (left.useEuSwap === preferredEu) return -1;
    if (right.useEuSwap === preferredEu) return 1;
    return 0;
  });

  return candidates[0] && candidates[0].score >= 25 ? candidates[0] : null;
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
  if (numeric === WMSGenData.NIDORAN_FEMALE) {
    return { baseId: WMSGenData.NIDORAN_FEMALE, female: true };
  }
  if (numeric === WMSGenData.NIDORAN_MALE) {
    return { baseId: WMSGenData.NIDORAN_MALE, female: false };
  }
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
  ensureSelectOption(select, numeric, getItemDisplayName(numeric, WMSkyItem[numeric] || String(numeric)));
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
  const euToggle = document.getElementById('useEUswap');
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

  if (euToggle) {
    euToggle.checked = !!result.useEuSwap;
  }

  if (dungeonSelect) {
    ensureSelectOption(dungeonSelect, struct.dungeon, getLocalizedDungeonName(struct.dungeon, WMSkyDungeon[struct.dungeon] || String(struct.dungeon)));
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
  syncDungeonFloorLimit();
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

  return missionMapped;
}

const FLAVOR_TEXT_PRESET_CUSTOM = '__custom__';
const FLAVOR_TEXT_PRESET_AUTO = '__auto__';

const FLAVOR_TEXT_CHOICES = [
  {
    id: 'explore-sealed',
    value: '1',
    match: (typeData) => !!typeData && typeData.mainType === 3 && typeData.specialType === 1,
    head: {
      fr: 'Le mystere de la Chambre Scellee...',
      en: 'The mystery of the Sealed Chamber...'
    },
    body: {
      fr: "Il y a une Chambre Scellee la-dedans ! Viens percer ce mystere avec moi !",
      en: "There's a Sealed Chamber in there! Someone crack that mystery with me!"
    }
  },
  {
    id: 'explore-golden',
    value: '2',
    match: (typeData) => !!typeData && typeData.mainType === 3 && typeData.specialType === 2,
    head: {
      fr: 'Allons trouver la Chambre Doree !',
      en: "Let's find the Golden Chamber!"
    },
    body: {
      fr: "On dit que la Chambre Doree est remplie de tresors ! Allons la chercher ensemble !",
      en: "The Golden Chamber's supposed to be full of treasure! Let's team up and look for it!"
    }
  },
  {
    id: 'explore-new-dungeon',
    value: '3',
    match: (typeData) => !!typeData && typeData.mainType === 3 && typeData.specialType === 3,
    head: {
      fr: 'Un nouveau donjon a ete decouvert !',
      en: 'A new dungeon was discovered!'
    },
    body: {
      fr: "Un nouveau donjon serait apparu. Allons verifier ca ensemble !",
      en: "A new dungeon may have appeared. Let's check it out together!"
    }
  },
  {
    id: 'find-item-evolve',
    value: '2',
    match: (typeData) => !!typeData && typeData.mainType === 6,
    head: {
      fr: "Il me faut cet objet pour evoluer !",
      en: 'I need this item to evolve!'
    },
    body: {
      fr: "J'ai desesperement besoin de cet objet pour evoluer ! Quelqu'un peut me l'apporter ?",
      en: 'I desperately need this item to evolve! Could someone bring it to me?'
    }
  },
  {
    id: 'find-item-gabite-scale',
    value: '4',
    match: (typeData) => !!typeData && typeData.mainType === 6,
    head: {
      fr: 'Rapportez-moi une Gabite Scale !',
      en: 'Please bring me a Gabite Scale!'
    },
    body: {
      fr: "Quelqu'un pourrait me rapporter une Gabite Scale ?",
      en: 'Could someone bring back a Gabite Scale for me?'
    }
  },
  {
    id: 'outlaw-hidden',
    value: '1',
    match: (typeData) => !!typeData && typeData.mainType === 9 && typeData.specialType === 1,
    head: {
      fr: 'La cible est cachee.',
      en: 'The target is hidden.'
    },
    body: {
      fr: "La cible se cache quelque part. Aide-moi a la retrouver.",
      en: 'The target is hiding somewhere. Help me track it down.'
    }
  },
  {
    id: 'outlaw-fleeing',
    value: '2',
    match: (typeData) => !!typeData && typeData.mainType === 9 && typeData.specialType === 2,
    head: {
      fr: 'La cible prend la fuite !',
      en: 'The target is on the run!'
    },
    body: {
      fr: "La cible s'enfuit sans arret. Il faut l'attraper vite !",
      en: 'The target keeps running away. We need to catch it quickly!'
    }
  },
  {
    id: 'arrest-normal',
    value: '0',
    match: (typeData) => !!typeData && typeData.mainType === 10 && typeData.specialType === 0,
    head: {
      fr: 'Allons arreter la cible.',
      en: "Let's arrest the target."
    },
    body: {
      fr: "C'est un vrai probleme. Allons le capturer ensemble !",
      en: "They're a real problem. Let's capture them together!"
    }
  },
  {
    id: 'arrest-escort',
    value: '4',
    match: (typeData) => !!typeData && typeData.mainType === 10 && typeData.specialType === 4,
    head: {
      fr: 'Jusqu a la cible !',
      en: 'Take me to the target!'
    },
    body: {
      fr: "Je veux absolument y aller ! Escorte-moi jusque-la !",
      en: 'I really want to go there! Please escort me there!'
    }
  },
  {
    id: 'arrest-special-floor',
    value: '6',
    match: (typeData) => !!typeData && typeData.mainType === 10 && typeData.specialType === 6,
    head: {
      fr: 'La cible se cache a un etage special.',
      en: 'The target is on a special floor.'
    },
    body: {
      fr: "On a repere la cible a un etage special. Va l'arreter !",
      en: 'The target was spotted on a special floor. Go arrest them!'
    }
  },
  {
    id: 'arrest-monster-house',
    value: '7',
    match: (typeData) => !!typeData && typeData.mainType === 10 && typeData.specialType === 7,
    head: {
      fr: 'La cible est dans une Maison de monstres !',
      en: 'The target is in a Monster House!'
    },
    body: {
      fr: "La cible s'est retranchee dans une Maison de monstres. Bon courage !",
      en: "The target is holed up in a Monster House. Good luck!"
    }
  },
  {
    id: 'challenge-mewtwo',
    value: '1',
    match: (typeData) => !!typeData && typeData.mainType === 11 && typeData.specialType === 1,
    head: {
      fr: 'Lettre de defi : Mewtwo',
      en: 'Challenge Letter: Mewtwo'
    },
    body: {
      fr: 'Une lettre de defi de Mewtwo. Prepare-toi au combat.',
      en: 'A challenge letter from Mewtwo. Prepare for battle.'
    }
  },
  {
    id: 'challenge-entei',
    value: '2',
    match: (typeData) => !!typeData && typeData.mainType === 11 && typeData.specialType === 2,
    head: {
      fr: 'Lettre de defi : Entei',
      en: 'Challenge Letter: Entei'
    },
    body: {
      fr: 'Une lettre de defi d Entei. Prepare-toi au combat.',
      en: 'A challenge letter from Entei. Prepare for battle.'
    }
  },
  {
    id: 'challenge-raikou',
    value: '3',
    match: (typeData) => !!typeData && typeData.mainType === 11 && typeData.specialType === 3,
    head: {
      fr: 'Lettre de defi : Raikou',
      en: 'Challenge Letter: Raikou'
    },
    body: {
      fr: 'Une lettre de defi de Raikou. Prepare-toi au combat.',
      en: 'A challenge letter from Raikou. Prepare for battle.'
    }
  },
  {
    id: 'challenge-suicune',
    value: '4',
    match: (typeData) => !!typeData && typeData.mainType === 11 && typeData.specialType === 4,
    head: {
      fr: 'Lettre de defi : Suicune',
      en: 'Challenge Letter: Suicune'
    },
    body: {
      fr: 'Une lettre de defi de Suicune. Prepare-toi au combat.',
      en: 'A challenge letter from Suicune. Prepare for battle.'
    }
  },
  {
    id: 'challenge-jirachi',
    value: '5',
    match: (typeData) => !!typeData && typeData.mainType === 11 && typeData.specialType === 5,
    head: {
      fr: 'Lettre de defi : Jirachi',
      en: 'Challenge Letter: Jirachi'
    },
    body: {
      fr: 'Une lettre de defi de Jirachi. Prepare-toi au combat.',
      en: 'A challenge letter from Jirachi. Prepare for battle.'
    }
  }
];

function getFlavorTextChoiceLabel(entry, field) {
  const lang = getCurrentLanguage();
  return (entry && entry[field] && (entry[field][lang] || entry[field].fr || entry[field].en)) || '';
}

function getFlavorTextPresetEntries(typeData) {
  return FLAVOR_TEXT_CHOICES.filter((entry) => entry.match(typeData));
}

function setFlavorTextCustomVisibility(visible) {
  const wrap = document.getElementById('flavorTextCustomWrap');
  if (!wrap) return;
  wrap.classList.toggle('hidden', !visible);
}

function updateFlavorTextBodyOptions(entry) {
  const bodySelect = document.getElementById('flavorTextBody');
  if (!bodySelect) return;

  bodySelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = entry ? entry.id : FLAVOR_TEXT_PRESET_AUTO;
  option.textContent = entry ? getFlavorTextChoiceLabel(entry, 'body') : t('flavorTextBodyAuto');
  bodySelect.add(option);
  bodySelect.disabled = false;
}

function applyFlavorTextPresetSelection() {
  const headSelect = document.getElementById('flavorTextHead');
  const input = document.getElementById('flavorText');
  if (!headSelect || !input) return;

  const entries = getFlavorTextPresetEntries(getCurrentTypeData());
  const entry = entries.find((candidate) => candidate.id === headSelect.value) || null;

  if (headSelect.value === FLAVOR_TEXT_PRESET_CUSTOM) {
    setFlavorTextCustomVisibility(true);
    updateFlavorTextBodyOptions(null);
    return;
  }

  setFlavorTextCustomVisibility(false);
  if (entry) {
    input.value = entry.value;
    updateFlavorTextBodyOptions(entry);
  } else {
    input.value = '';
    updateFlavorTextBodyOptions(null);
  }
}

function refreshFlavorTextPresetOptions() {
  const headSelect = document.getElementById('flavorTextHead');
  const bodySelect = document.getElementById('flavorTextBody');
  const input = document.getElementById('flavorText');
  const hint = document.getElementById('flavorTextChoiceHint');
  if (!headSelect || !bodySelect || !input) return;

  const currentValue = input.value.trim();
  const entries = getFlavorTextPresetEntries(getCurrentTypeData());
  const matchingEntry = entries.find((entry) => entry.value === currentValue) || null;

  headSelect.innerHTML = '';

  const autoOption = document.createElement('option');
  autoOption.value = FLAVOR_TEXT_PRESET_AUTO;
  autoOption.textContent = t('flavorTextHeadAuto');
  headSelect.add(autoOption);

  entries.forEach((entry) => {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = getFlavorTextChoiceLabel(entry, 'head');
    headSelect.add(option);
  });

  const customOption = document.createElement('option');
  customOption.value = FLAVOR_TEXT_PRESET_CUSTOM;
  customOption.textContent = t('flavorTextHeadCustom');
  headSelect.add(customOption);

  if (currentValue === '') {
    headSelect.value = FLAVOR_TEXT_PRESET_AUTO;
  } else if (matchingEntry) {
    headSelect.value = matchingEntry.id;
  } else {
    headSelect.value = FLAVOR_TEXT_PRESET_CUSTOM;
  }

  if (hint) {
    hint.textContent = entries.length
      ? t('flavorTextChoiceHintKnown')
      : t('flavorTextChoiceHintNone');
  }

  applyFlavorTextPresetSelection();
}

function syncFlavorTextPresetFromInput() {
  refreshFlavorTextPresetOptions();
}

function getKnownItemTitle(itemId, label) {
  const numeric = parseInt(itemId, 10);
  return (window.WMSkyItemTitles && window.WMSkyItemTitles[numeric]) || label || '';
}

function getTreasureBoxVariantLabel(itemId) {
  const numeric = parseInt(itemId, 10);
  if (!Number.isFinite(numeric) || numeric < 364 || numeric > 399) return '';
  return String.fromCharCode(65 + ((numeric - 364) % 3));
}

function getItemDisplayName(itemId, fallbackLabel) {
  const numeric = parseInt(itemId, 10);
  const baseLabel = String(fallbackLabel || '');

  if (numeric === 834) return 'Elekigriffe';
  if (numeric === 835) return 'Elekicarte';

  const chestVariant = getTreasureBoxVariantLabel(numeric);
  if (chestVariant) {
    return `${baseLabel} (var. ${chestVariant})`;
  }

  return baseLabel;
}

function relabelItemSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  Array.from(select.options).forEach((option) => {
    const numeric = parseInt(option.value, 10);
    if (!Number.isFinite(numeric)) return;

    const displayName = getItemDisplayName(numeric, WMSkyItem[numeric] || option.text);
    option.text = displayName;

    const chestVariant = getTreasureBoxVariantLabel(numeric);
    if (chestVariant) {
      option.title = `Variante interne ${chestVariant} du coffre`;
    } else if (numeric === 835) {
      option.title = 'Correction du libelle: Elekid Card';
    } else {
      option.title = '';
    }
  });
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

function getItemBaseName(itemId, fallbackLabel) {
  const numeric = parseInt(itemId, 10);
  if (!Number.isFinite(numeric)) return String(fallbackLabel || '');
  if (numeric === 0) return getCurrentLanguage() === 'en' ? 'None' : 'Aucun';
  if (getCurrentLanguage() === 'en') {
    return String(getKnownItemTitle(numeric, fallbackLabel || WMSkyItem[numeric] || ''));
  }
  return String(WMSkyItem[numeric] || fallbackLabel || '');
}

function getItemDisplayName(itemId, fallbackLabel) {
  const numeric = parseInt(itemId, 10);
  const baseLabel = getItemBaseName(itemId, fallbackLabel);

  if (numeric === 834) return getCurrentLanguage() === 'en' ? 'Elekid Claw' : 'Elekigriffe';
  if (numeric === 835) return getCurrentLanguage() === 'en' ? 'Elekid Card' : 'Elekicarte';

  const chestVariant = getTreasureBoxVariantLabel(numeric);
  if (chestVariant) {
    return `${baseLabel} (${getCurrentLanguage() === 'en' ? 'Var.' : 'var.'} ${chestVariant})`;
  }

  return baseLabel;
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

    option.text = getItemDisplayName(numeric, option.text);
    const chestVariant = getTreasureBoxVariantLabel(numeric);
    if (chestVariant) {
      option.title = t('chestVariantTitle', { variant: chestVariant });
    } else if (numeric === 835) {
      option.title = t('fixedItem835Title');
    } else {
      option.title = '';
    }
  });
}

function relabelMissionTypeSelect() {
  const select = document.getElementById('missionTypeBox');
  if (!select) return;
  const labels = getLocaleLabelMap('missionTypes', getCurrentLanguage());

  Array.from(select.options).forEach((option) => {
    const key = parseInt(option.value, 10);
    option.text = labels[key] || (MISSION_TYPE_LABELS[getCurrentLanguage()] && MISSION_TYPE_LABELS[getCurrentLanguage()][key]) || option.text;
  });
}

function relabelMissionSubTypeSelect() {
  const typeSelect = document.getElementById('missionTypeBox');
  const subSelect = document.getElementById('missionSubTypeBox');
  if (!typeSelect || !subSelect) return;

  const missionKey = parseInt(typeSelect.value, 10);
  const subtypeMap = getLocaleLabelMap('missionSubtypes', getCurrentLanguage());
  const labels = subtypeMap[missionKey] || (MISSION_SUBTYPE_LABELS[getCurrentLanguage()] && MISSION_SUBTYPE_LABELS[getCurrentLanguage()][missionKey]);
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
    option.text = labels[key] || (REWARD_TYPE_LABELS[getCurrentLanguage()] && REWARD_TYPE_LABELS[getCurrentLanguage()][key]) || option.text;
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
  option.dataset.shortLabel = `${getCurrentLanguage() === 'en' ? 'V' : 'V'}${index + 1}`;
  option.dataset.floorLabel = String(value);
  option.dataset.previewTitle = t('previewTitle', { variant: index + 1, floor: value });
}

function relabelMemoSelectorOptions() {
  const select = document.getElementById('memoPreset');
  if (!select) return;

  Array.from(select.options).forEach((option, index) => {
    localizeMemoOption(option, index, option.value);
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

function applyStaticTranslations() {
  document.documentElement.lang = getCurrentLanguage();
  document.title = t('pageTitle');
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', t('metaDescription'));

  setText('.hero .eyebrow', t('heroEyebrow'));
  setText('.hero h1', t('heroTitle'));
  setHtml('.hero .lead', t('heroLead'));

  setText('.presets h2', t('quickAccess'));
  setText('.preset-btn[data-preset="standard"]', t('presetStandard'));
  setText('.preset-btn[data-preset="memo"]', t('presetMemo'));
  setText('.preset-btn[data-preset="egg"]', t('presetEgg'));
  ['mewtwo', 'entei', 'raikou', 'suicune', 'jirachi'].forEach((boss) => {
    setText(`.preset-btn[data-preset="${boss}"]`, t('presetChallenge', { boss: boss.charAt(0).toUpperCase() + boss.slice(1) }));
  });
  setText('.presets .hint', t('presetsHint'));

  setText('.form-grid > section:nth-of-type(1) > h2', t('missionSection'));
  setText('label[for="missionTypeBox"]', t('missionTypeLabel'));
  setText('label[for="dungeonSearch"]', t('dungeonLabel'));
  setPlaceholder('#dungeonSearch', t('dungeonPlaceholder'));
  setText('label[for="floor"]', t('floorLabel'));
  setText('#floorLimitHint', t('floorLimitUnknown'));
  setText('#memoSelectorWrap > label', t('memoSelectorLabel'));
  setText('#memoSelectorWrap > .hint', t('memoHint'));
  setText('.advanced-panel > summary', t('advancedOptions'));
  setText('label[for="flavorTextHead"]', t('flavorTextHeadLabel'));
  setText('label[for="flavorTextBody"]', t('flavorTextBodyLabel'));
  setText('label[for="flavorText"]', t('flavorTextCustomLabel'));
  setPlaceholder('#flavorText', t('flavorTextCustomPlaceholder'));
  setText('#flavorTextCustomHint', t('flavorTextCustomHint'));
  setText('label[for="specialFloor"]', t('specialFloorLabel'));
  setPlaceholder('#specialFloor', t('specialFloorPlaceholder'));
  setText('#specialFloor + .hint', t('specialFloorHint'));

  setText('.form-grid > section:nth-of-type(2) > h2', t('targetSection'));
  setText('#allPokemonFormsLabel', t('allPokemonFormsLabel'));
  setText('#allPokemonFormsHint', t('allPokemonFormsHint'));
  setText('label[for="clientSearch"]', t('clientLabel'));
  setPlaceholder('#clientSearch', t('pokemonSearchPlaceholder'));
  setText('label[for="targetSearch"]', t('targetLabel'));
  setPlaceholder('#targetSearch', t('targetSearchPlaceholder'));
  setText('label[for="target2Search"]', t('target2Label'));
  setPlaceholder('#target2Search', t('target2SearchPlaceholder'));
  setText('label[for="targetItemSearch"]', t('targetItemLabel'));
  setPlaceholder('#targetItemSearch', t('itemSearchPlaceholder'));

  const femaleLabels = document.querySelectorAll('.checkbox-inline');
  femaleLabels.forEach((label) => {
    const input = label.querySelector('input');
    label.textContent = '';
    if (input) {
      label.appendChild(input);
      label.append(` ${t('female')}`);
    }
  });

  setText('.form-grid > section:nth-of-type(3) > h2', t('rewardSection'));
  setText('label[for="rewardTypeBox"]', t('rewardTypeLabel'));
  setText('label[for="rewardItemSearch"]', t('rewardItemLabel'));
  setPlaceholder('#rewardItemSearch', t('rewardSearchPlaceholder'));
  setText('#eggGlitchLabel', t('eggGlitchLabel'));
  setText('#eggGlitchHint', t('eggGlitchHint'));
  setText('#eggPokemonLabel', t('eggPokemonLabel'));
  setPlaceholder('#eggPokemonSearch', t('eggPokemonPlaceholder'));
  setText('#eggPokemonHint', t('eggPokemonHint'));
  setText('#eggHelpTitle', t('eggHelpTitle'));
  setText('#eggHelpLead', t('eggHelpLead'));
  setText('#eggHelpItem1', t('eggHelpItem1'));
  setText('#eggHelpItem2', t('eggHelpItem2'));
  setText('#eggHelpItem3', t('eggHelpItem3'));
  setText('#eggHelpItem4', t('eggHelpItem4'));
  setText('#eggHelpLink', t('eggHelpLink'));
  setText('#euToggleLabel', t('euToggle'));
  setText('#euToggleHint', t('euHint'));
  setText('#summaryBox h3', t('summaryTitle'));

  setText('#memoVisuals .eyebrow', t('memoVisualEyebrow'));
  setText('#memoVisuals h2', t('memoVisualTitle'));
  setText('#memoVisualLead', t('memoVisualLead'));
  const memoLinks = document.querySelectorAll('.memo-visuals .source-link');
  if (memoLinks[0]) memoLinks[0].textContent = t('sourceShapes');
  if (memoLinks[1]) memoLinks[1].textContent = t('sourceCodes');
  const memoBottomHint = document.querySelector('#memoVisuals > .hint');
  if (memoBottomHint) memoBottomHint.textContent = t('memoHintBottom');

  setText('label[for="importCode"]', t('importCodeLabel'));
  setPlaceholder('#importCode', t('importCodePlaceholder'));
  setText('#importCodeBtn', t('importCodeButton'));

  setText('.result-card h2', t('resultTitle'));
  setText('#generateBtn', t('generate'));
  setText('#copyPrettyBtn', t('copy'));
  setText('#copyCompactBtn', t('copyCompact'));
  setPlaceholder('#outputbox', t('outputPlaceholder'));
  setText('label[for="compactOutput"]', t('compactLabel'));

  setText('.project-warning .eyebrow', t('warningEyebrow'));
  setText('.project-warning h2', t('warningTitle'));
  setText('.project-warning .lead', t('warningLead'));
  setText('.project-warning .hint', t('warningHint'));

  setText('.notes h2', t('notesTitle'));
  const notes = document.querySelectorAll('.notes li');
  if (notes[0]) notes[0].innerHTML = t('note1');
  if (notes[1]) notes[1].innerHTML = t('note2');
  if (notes[2]) notes[2].innerHTML = t('note3');
  if (notes[3]) notes[3].innerHTML = t('note4');

  setText('.sources-panel > summary', t('sourcesSummary'));
  const sourceTitles = document.querySelectorAll('.sources-block h3');
  if (sourceTitles[0]) sourceTitles[0].textContent = t('creditsTitle');
  if (sourceTitles[1]) sourceTitles[1].textContent = t('generatorBaseTitle');
  if (sourceTitles[2]) sourceTitles[2].textContent = t('wonderMailDocsTitle');
  if (sourceTitles[3]) sourceTitles[3].textContent = t('memoSourcesTitle');
  if (sourceTitles[4]) sourceTitles[4].textContent = t('auxDataTitle');
  const sourceParagraphs = document.querySelectorAll('.sources-block p');
  if (sourceParagraphs[0]) sourceParagraphs[0].innerHTML = t('creditsBody1');
  if (sourceParagraphs[1]) sourceParagraphs[1].innerHTML = t('creditsBody2');
  if (sourceParagraphs[2]) sourceParagraphs[2].innerHTML = t('creditsBody3');

  setText('.footer p', t('footerText'));
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
  refreshFlavorTextPresetOptions();
  refreshSearchBoxSelections();
}

function applyLanguage(nextLanguage) {
  const available = getAvailableLanguages();
  currentLanguage = available.includes(nextLanguage) ? nextLanguage : getDefaultLanguage();
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  } catch (e) {
    /* ignore storage failures */
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

function getHeuristicItemIcon(itemId, label) {
  const title = getKnownItemTitle(itemId, label);
  const lower = title.toLowerCase();

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
  const exact = window.WMSkyItemIcons && window.WMSkyItemIcons[numeric];
  const heuristic = getHeuristicItemIcon(itemId, label);
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

function getPokemonPreviewData(selectId, femaleId, forcedId, label, meta) {
  const select = document.getElementById(selectId);
  const female = !!document.getElementById(femaleId)?.checked;
  const forced = Number.isFinite(forcedId);
  const baseId = forced ? forcedId : parseInt(select && select.value ? select.value : '', 10);
  const monId = forced ? forcedId : WMSGen.getTrueMonID(baseId, female);
  const name = forced ? getMonName(forcedId) : monNameFromSelect(selectId, femaleId);

  return {
    label,
    name,
    meta,
    image: getPokemonImage(monId || baseId, name)
  };
}

function getItemPreviewData(selectId, label, meta, rewardStyle) {
  const select = document.getElementById(selectId);
  if (!select || !select.options[select.selectedIndex]) return null;
  const itemId = parseInt(select.value, 10);
  const name = select.options[select.selectedIndex].text || 'Aucun';
  return {
    label,
    name,
    meta,
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

function updateEntityPreviews() {
  const typeData = getCurrentTypeData();
  if (!typeData) return;

  const clientMeta = hasOwn(typeData, 'forceClient')
    ? 'Pokemon impose par la mission'
    : (document.getElementById('clientF')?.checked ? 'Version femelle active' : 'Selection active');

  renderEntityPreview('clientPreview', getPokemonPreviewData(
    'clientBox',
    'clientF',
    typeData.forceClient,
    'Client',
    clientMeta
  ));

  const targetMeta = typeData.clientIsTarget
    ? 'Meme Pokemon que le client'
    : hasOwn(typeData, 'forceTarget')
      ? 'Pokemon impose par la mission'
      : (document.getElementById('targetF')?.checked ? 'Version femelle active' : 'Selection active');

  const targetPreview = typeData.clientIsTarget
    ? getPokemonPreviewData('clientBox', 'clientF', typeData.forceClient, 'Cible', targetMeta)
    : getPokemonPreviewData('targetBox', 'targetF', typeData.forceTarget, 'Cible', targetMeta);

  renderEntityPreview('targetPreview', targetPreview);

  renderEntityPreview(
    'target2Preview',
    typeData.useTarget2
      ? getPokemonPreviewData(
        'target2Box',
        'target2F',
        undefined,
        'Cible sup.',
        document.getElementById('target2F')?.checked ? 'Version femelle active' : 'Selection active'
      )
      : null
  );

  renderEntityPreview(
    'targetItemPreview',
    typeData.useTargetItem
      ? getItemPreviewData('targetItemBox', 'Objet cible', 'Objet actuellement selectionne', false)
      : null
  );

  const rewardType = parseInt(document.getElementById('rewardTypeBox')?.value || '0', 10);
  renderEntityPreview(
    'rewardItemPreview',
    !typeData.noReward && rewardType >= 1 && rewardType <= 4
      ? getItemPreviewData('rewardItemBox', 'Recompense', 'Objet actuellement selectionne', true)
      : null
  );

  renderEntityPreview(
    'eggPokemonPreview',
    isEggGlitchEnabled()
      ? getEggPokemonPreviewData(
        'eggPokemonBox',
        getCurrentLanguage() === 'en' ? 'Egg' : 'Oeuf',
        getCurrentLanguage() === 'en' ? 'Species forced by the glitch' : 'Espece forcee par le glitch'
      )
      : null
  );
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
  updateEntityPreviews();
}

function populateMemoSelector() {
  const select = document.getElementById('memoPreset');
  if (!select || select.options.length) return;

  const values = getMemoSelectorFloors();
  const auto = document.createElement('option');
  auto.value = '';
  auto.text = 'Automatique';
  select.add(auto);

  values.forEach((value, index) => {
    const option = document.createElement('option');
    option.value = String(value);
    option.text = `Variante ${index + 1} (étage spécial ${value})`;
    select.add(option);
  });
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

function getMemoSelectorFloors() {
  return getMemoGallery()
    .filter((entry) => !entry.expertOnly)
    .map((entry) => entry.specialFloor)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
}

function getMemoDungeonName(dungeonId) {
  return getLocalizedDungeonName(dungeonId, '');
}

function getMemoFlagLabels(room) {
  if (!room || !room.flags) return [];

  const labels = [];
  if (room.flags.player) labels.push('depart P');
  if (room.flags.key) labels.push('cle requise');
  if (room.flags.water) labels.push('zone bleue');
  if (room.flags.breakWall) labels.push('mur traversable');
  if (room.flags.chestnut) labels.push('piege chestnut');
  if (room.flags.wind) labels.push('piege vent');
  if (room.flags.warp) labels.push('piege warp');
  return labels;
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

function describeMemoPosition(point, room) {
  if (!point || !room || !room.width || !room.height) return '';

  const horizontal = point.x < room.width / 3 ? 'a gauche'
    : point.x >= (room.width * 2) / 3 ? 'a droite'
      : 'au centre';
  const vertical = point.y < room.height / 3 ? 'en haut'
    : point.y >= (room.height * 2) / 3 ? 'en bas'
      : 'au milieu';

  return `${vertical}, ${horizontal}`;
}

function buildMemoDescription(room) {
  if (!room) {
    return 'Choisis une variante pour afficher sa salle.';
  }
  if (room.missingMap) {
    const parts = ["La source japonaise utilisee ne montre pas cette variante, donc on n'a pas encore sa forme exacte."];
    if (room.observedLoot) {
      parts.push(`Releve joueur: ${room.observedLoot}`);
    }
    return parts.join(' ');
  }

  const parts = [`Carte ${room.width} x ${room.height}.`];
  const treasure = findMemoToken(room, 'T');
  const stairs = findMemoToken(room, 'S');
  const player = findMemoToken(room, 'P');
  const luxuryChestCount = countMemoTokens(room, 'L');
  const flags = getMemoFlagLabels(room);

  if (treasure) parts.push(`Tresor ${describeMemoPosition(treasure, room)}.`);
  if (stairs) parts.push(`Escalier ${describeMemoPosition(stairs, room)}.`);
  if (player) parts.push(`Zone P ${describeMemoPosition(player, room)}.`);
  if (luxuryChestCount) parts.push(`${luxuryChestCount} coffres luxe visibles au centre de la salle.`);
  if (flags.length) {
    parts.push(`Repere source: ${flags.join(', ')}.`);
  } else {
    parts.push('Aucun repere special signale dans le tableau source.');
  }

  return parts.join(' ');
}

function getMemoWarning(room) {
  if (!room) return '';
  if (room.warningKey) return t(room.warningKey);
  return room.warning || '';
}

function renderMemoFeatureList(container, room) {
  if (!container) return;
  container.innerHTML = '';

  const labels = room && !room.missingMap
    ? getMemoFlagLabels(room)
    : ['source incomplete'];

  if (room && room.observedLoot) {
    labels.push(room.observedLoot);
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
    container.textContent = room && room.missingMap ? 'Carte absente de la source JP' : 'Choisis une variante';
    return;
  }

  const size = large ? (room.width >= 20 ? 14 : 18) : (room.width >= 20 ? 9 : 11);
  container.style.setProperty('--memo-cols', String(room.width));
  container.style.setProperty('--memo-cell-size', `${size}px`);

  const labels = {
    '#': { className: 'wall', text: '', label: 'Mur' },
    '.': { className: 'floor', text: '', label: 'Sol' },
    '~': { className: 'water', text: '', label: 'Eau' },
    'S': { className: 'stairs', text: 'S', label: 'Escalier' },
    'T': { className: 'treasure', text: 'T', label: 'Tresor' },
    'L': { className: 'luxurychest', text: 'L', label: 'Coffre luxe' },
    'P': { className: 'player', text: 'P', label: 'Depart joueur' },
    'K': { className: 'key', text: 'K', label: 'Cle requise' },
    'B': { className: 'breakwall', text: 'B', label: 'Mur traversable' },
    'C': { className: 'chestnut', text: 'C', label: 'Piege chestnut' },
    'F': { className: 'wind', text: 'V', label: 'Piege vent' },
    'W': { className: 'warp', text: 'W', label: 'Piege warp' }
  };

  room.grid.forEach((row) => {
    row.split('').forEach((token) => {
      const info = labels[token] || labels['.'];
      const cell = document.createElement('span');
      const tooltip = info.label;
      cell.className = `memo-tile memo-tile-${info.className}`;
      cell.textContent = info.text;
      cell.title = tooltip;
      cell.setAttribute('aria-label', tooltip);
      cell.dataset.tooltip = tooltip;
      container.appendChild(cell);
    });
  });
}

function applyMemoSpecialFloor(specialFloor) {
  const memoSelect = document.getElementById('memoPreset');
  const specialFloorInput = document.getElementById('specialFloor');
  if (!specialFloorInput) return;

  specialFloorInput.value = specialFloor ? String(specialFloor) : '';
  if (memoSelect) {
    if (!specialFloor || !setSelectByValue(memoSelect, String(specialFloor))) {
      memoSelect.selectedIndex = 0;
    }
  }

  WMSGen.update();
  updateSummary();
  updateMemoVisuals();
}

function renderMemoGallery(selectedFloor) {
  const grid = document.getElementById('memoGalleryGrid');
  if (!grid) return;

  grid.innerHTML = '';
  getMemoGallery().forEach((entry) => {
    const article = document.createElement('article');
    article.className = 'memo-card';
    article.tabIndex = 0;
    if (entry.specialFloor === selectedFloor) {
      article.classList.add('active');
    }

    const map = document.createElement('div');
    map.className = 'memo-map memo-map-card';
    renderMemoMap(map, entry, false);

    const body = document.createElement('div');
    body.className = 'memo-card-body';

    const title = document.createElement('h3');
    title.textContent = `Salle ${entry.specialFloor}`;

    const meta = document.createElement('p');
    meta.className = 'memo-card-meta';
    meta.textContent = entry.missingMap
      ? 'Carte non documentee sur la source JP'
      : `Etage special ${entry.specialFloor}`;

    const description = document.createElement('p');
    description.textContent = buildMemoDescription(entry);

    const features = document.createElement('div');
    features.className = 'memo-feature-list';
    renderMemoFeatureList(features, entry);

    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(description);
    body.appendChild(features);
    article.appendChild(map);
    article.appendChild(body);
    grid.appendChild(article);

    const activate = () => applyMemoSpecialFloor(entry.specialFloor);
    article.addEventListener('click', activate);
    article.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  });
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
    : (specialFloor ? `Etage special ${specialFloor}` : 'Automatique');

  grid.innerHTML = '';
  grid.classList.add('hidden');

  if (!specialFloor) {
    lead.textContent = 'Selectionne un etage special de Memo tresor pour afficher sa carte.';
    badge.textContent = 'En attente';
    title.textContent = 'Aucune salle selectionnee';
    description.textContent = 'La carte exacte ne s affiche que quand tu choisis une variante ou un etage special.';
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
    lead.textContent = `${currentLabel} reference bien un etage special, mais je n ai pas trouve de carte correspondante dans les donnees chargees.`;
    badge.textContent = 'Source manquante';
    title.textContent = `Salle ${specialFloor}`;
    description.textContent = 'Aucune carte exploitable pour cet etage special pour le moment.';
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

  lead.textContent = `${currentLabel} utilise la salle ${entry.specialFloor}. La carte ci-dessous suit la forme referencee sur la wiki japonaise.`;
  badge.textContent = specialFloor ? `Etage special ${specialFloor}` : 'Source JP';
  title.textContent = `Salle ${entry.specialFloor}`;
  description.textContent = buildMemoDescription(entry);
  meta.textContent = entry.missingMap
    ? 'Cette variante est absente de la page de formes japonaise.'
    : entry.reconstructedFromScreens
      ? `Reconstitution depuis captures joueur · format ${entry.width} x ${entry.height}`
      : `Format ${entry.width} x ${entry.height}`;
  warning.textContent = getMemoWarning(entry);
  warning.classList.toggle('hidden', !getMemoWarning(entry));

  if (entry.sample) {
    const dungeonName = getMemoDungeonName(entry.sample.dungeon);
    location.textContent = dungeonName
      ? `Exemple de code retrouve sur ${dungeonName}, etage ${entry.sample.floor}.`
      : `Exemple de code retrouve sur le donjon ${entry.sample.dungeon}, etage ${entry.sample.floor}.`;
    code.textContent = entry.sample.code;
    code.classList.remove('hidden');
  } else {
    location.textContent = 'Aucun exemple de code automatique retrouve sur la page japonaise pour cette variante.';
    code.textContent = '';
    code.classList.add('hidden');
  }

  renderMemoMap(map, entry, true);
  renderMemoFeatureList(features, entry);
}

function syncMemoSelectorFromSpecialFloor() {
  const memoSelect = document.getElementById('memoPreset');
  const specialFloor = document.getElementById('specialFloor');
  if (!memoSelect || !specialFloor) return;

  const current = String(specialFloor.value || '');
  if (setSelectByValue(memoSelect, current)) return;
  memoSelect.selectedIndex = 0;
}

function updateSummary() {
  const summary = document.getElementById('summaryText');
  if (!summary) return;

  const typeData = getCurrentTypeData();
  if (!typeData) {
    summary.textContent = 'Choisis une mission pour voir le résumé.';
    return;
  }

  const mission = textOfSelected('missionTypeBox');
  const subWrap = document.getElementById('subType');
  const subtype = subWrap && subWrap.style.display !== 'none' ? textOfSelected('missionSubTypeBox') : '';
  const dungeon = textOfSelected('dungeonBox');
  const floor = document.getElementById('floor').value || '1';
  const region = document.getElementById('useEUswap').checked ? 'Europe' : 'US/AUS';
  const client = monNameFromSelect('clientBox', 'clientF', typeData.forceClient);
  const target = typeData.clientIsTarget
    ? client
    : monNameFromSelect('targetBox', 'targetF', typeData.forceTarget);

  const parts = [`${mission}${subtype && subtype !== '—' ? ` — ${subtype}` : ''}`, `région ${region}`, `${dungeon} étage ${floor}`, `client : ${client}`];

  if (!typeData.clientIsTarget || typeData.forceTarget !== undefined) {
    parts.push(`cible : ${target}`);
  }
  if (typeData.useTarget2) {
    parts.push(`cible sup. : ${monNameFromSelect('target2Box', 'target2F')}`);
  }
  if (typeData.useTargetItem) {
    parts.push(`objet cible : ${textOfSelected('targetItemBox')}`);
  }
  if (!typeData.noReward) {
    parts.push(`récompense : ${textOfSelected('rewardTypeBox')}`);
  }
  if (isTreasureMemoType(typeData)) {
    const memoPreset = document.getElementById('memoPreset');
    const specialFloor = document.getElementById('specialFloor').value || '';
    const label = memoPreset && memoPreset.selectedIndex > 0
      ? memoPreset.options[memoPreset.selectedIndex].text
      : (specialFloor ? `étage spécial ${specialFloor}` : 'Automatique');
    parts.push(`mémo : ${label}`);
  }

  summary.textContent = parts.join(' · ');
}

function generateCode() {
  const output = document.getElementById('outputbox');
  const compact = document.getElementById('compactOutput');
  const status = document.getElementById('statusLine');

  const errors = WMSGen.verify();
  if (errors.length) {
    output.value = errors.map((e) => `• ${e}`).join('\n');
    compact.value = '';
    status.textContent = 'Le générateur a bloqué la combinaison choisie.';
    return;
  }

  const pretty = WMSGen.generate();
  output.value = pretty;
  compact.value = compactCode(pretty);
  status.textContent = document.getElementById('useEUswap').checked
    ? 'Code généré pour la version européenne.'
    : 'Code généré pour la version US/AUS.';
}

async function copyFrom(id) {
  const el = document.getElementById(id);
  const status = document.getElementById('statusLine');
  if (!el || !el.value.trim()) {
    status.textContent = 'Aucun code à copier.';
    return;
  }
  try {
    await navigator.clipboard.writeText(el.value.trim());
    status.textContent = id === 'compactOutput' ? 'Version compacte copiée.' : 'Code copié.';
  } catch (e) {
    status.textContent = 'Copie impossible dans ce navigateur.';
  }
}

function applyPreset(kind) {
  const typeSelect = document.getElementById('missionTypeBox');
  const subSelect = document.getElementById('missionSubTypeBox');
  const eu = document.getElementById('useEUswap');
  const eggGlitch = document.getElementById('eggGlitch');
  eu.checked = true;
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
    if (kind === 'memo') {
      document.getElementById('memoPreset').selectedIndex = 0;
      document.getElementById('specialFloor').value = '';
    }
    WMSGen.fillSubTypeList();
    WMSGen.update();
    document.getElementById('memoSelectorWrap').classList.toggle('hidden', kind !== 'memo');
    syncMemoSelectorFromSpecialFloor();
    refreshMissionUi();
    updateSummary();
    updateMemoVisuals();
  }
}

onReady(() => {
  WMSGen.advanced = false;
  WMSGen.setup(document.getElementById('genForm'));
  WMSGen.showAllPokemon = !!document.getElementById('allPokemonForms')?.checked;
  populateEggPokemonList();
  relabelItemSelect('targetItemBox');
  relabelItemSelect('rewardItemBox');
  document.getElementById('useEUswap').checked = true;
  populateMemoSelector();
  refreshFlavorTextPresetOptions();

  const watchedIds = [
    'missionTypeBox', 'missionSubTypeBox', 'dungeonBox', 'floor', 'clientBox', 'clientF',
    'targetBox', 'targetF', 'target2Box', 'target2F', 'targetItemBox', 'rewardTypeBox',
    'rewardItemBox', 'useEUswap', 'flavorText', 'specialFloor', 'eggPokemonBox'
  ];

  watchedIds.forEach((id) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.addEventListener('change', () => {
      if (isEggGlitchEnabled() && ['missionTypeBox', 'dungeonBox', 'floor', 'targetItemBox', 'rewardTypeBox', 'clientBox', 'clientF'].includes(id)) {
        applyEggGlitchPreset();
      }
      if (id === 'missionTypeBox') {
        WMSGen.fillSubTypeList();
      }
      if (id === 'flavorText') {
        syncFlavorTextPresetFromInput();
      }
      WMSGen.update();
      if (id === 'missionTypeBox' || id === 'missionSubTypeBox') {
        refreshFlavorTextPresetOptions();
      }

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
    });
    node.addEventListener('input', () => {
      if (id === 'flavorText') {
        syncFlavorTextPresetFromInput();
      }
      if (id === 'specialFloor') {
        syncMemoSelectorFromSpecialFloor();
      }
      refreshMissionUi();
      updateSummary();
      updateMemoVisuals();
    });
  });

  document.getElementById('allPokemonForms')?.addEventListener('change', (event) => {
    WMSGen.showAllPokemon = !!event.target.checked;
    rebuildPokemonLists();
    WMSGen.update();
    refreshMissionUi();
    updateSummary();
  });

  document.getElementById('eggGlitch')?.addEventListener('change', (event) => {
    if (event.target.checked) {
      applyEggGlitchPreset();
    }
    WMSGen.update();
    refreshMissionUi();
    updateSummary();
  });

  document.getElementById('memoPreset').addEventListener('change', (event) => {
    const specialFloor = document.getElementById('specialFloor');
    specialFloor.value = event.target.value;
    refreshMissionUi();
    updateSummary();
    updateMemoVisuals();
  });

  document.getElementById('flavorTextHead')?.addEventListener('change', () => {
    applyFlavorTextPresetSelection();
    refreshMissionUi();
    updateSummary();
  });

  initializeSearchBoxes();

  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
  });

  document.getElementById('generateBtn').addEventListener('click', generateCode);
  document.getElementById('importCodeBtn')?.addEventListener('click', importCode);
  document.getElementById('copyPrettyBtn').addEventListener('click', () => copyFrom('outputbox'));
  document.getElementById('copyCompactBtn').addEventListener('click', () => copyFrom('compactOutput'));

  applyPreset('standard');
  WMSGen.update();
  document.getElementById('memoSelectorWrap').classList.add('hidden');
  syncMemoSelectorFromSpecialFloor();
  refreshFlavorTextPresetOptions();
  refreshMissionUi();
  updateSummary();
  updateMemoVisuals();
});

function populateMemoSelector() {
  const select = document.getElementById('memoPreset');
  if (!select || select.options.length) return;

  const values = (WMSGenData && WMSGenData.staticLists && WMSGenData.staticLists.treasurehunt) || [];
  const auto = document.createElement('option');
  auto.value = '';
  auto.text = 'Automatique';
  auto.dataset.shortLabel = 'Automatique';
  auto.dataset.floorLabel = 'Auto';
  auto.dataset.previewTitle = 'Automatique';
  select.add(auto);

  values.forEach((value, index) => {
    const option = document.createElement('option');
    option.value = String(value);
    option.text = `Variante ${index + 1} (etage special ${value})`;
    option.dataset.shortLabel = `Variante ${index + 1}`;
    option.dataset.floorLabel = String(value);
    option.dataset.previewTitle = `Variante ${index + 1} · Etage ${value}`;
    select.add(option);
  });

  renderMemoPresetPicker();
}

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
    badge.textContent = 'Apercu auto';
    title.textContent = 'Automatique';
    text.textContent = 'Le generateur choisit une variante automatiquement. Passe la souris sur un etage pour voir sa forme ici.';
    warning.textContent = '';
    warning.classList.add('hidden');
    features.innerHTML = '';
    renderMemoMap(map, null, false);
    return;
  }

  badge.textContent = `Etage special ${specialFloor}`;
  title.textContent = option.dataset.previewTitle || option.text;
  text.textContent = buildMemoDescription(room);
  warning.textContent = getMemoWarning(room);
  warning.classList.toggle('hidden', !getMemoWarning(room));
  renderMemoFeatureList(features, room);
  renderMemoMap(map, room, false);
}

function closeMemoPresetMenu() {
  const toggle = document.getElementById('memoPresetToggle');
  const panel = document.getElementById('memoPresetMenu');
  if (!toggle || !panel) return;
  toggle.setAttribute('aria-expanded', 'false');
  panel.classList.add('hidden');
  panel.closest('section')?.classList.remove('memo-picker-open');
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

function updateMemoPresetPicker() {
  const select = document.getElementById('memoPreset');
  const title = document.getElementById('memoPresetTitle');
  const subtitle = document.getElementById('memoPresetSubtitle');
  const optionsWrap = document.getElementById('memoPresetOptions');
  if (!select || !title || !subtitle || !optionsWrap) return;

  const option = select.options[select.selectedIndex] || select.options[0];
  if (!option) return;

  title.textContent = option.dataset.shortLabel || option.text;
  subtitle.textContent = option.value ? `Etage ${option.value}` : 'Aucune variante forcee';

  optionsWrap.querySelectorAll('.memo-picker-option').forEach((button) => {
    button.classList.toggle('active', button.dataset.value === option.value);
  });

  renderMemoPresetPreview(option);
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

function renderMemoPresetPicker() {
  const wrap = document.getElementById('memoSelectorWrap');
  const select = document.getElementById('memoPreset');
  const optionsWrap = document.getElementById('memoPresetOptions');
  if (!wrap || !select || !optionsWrap) return;

  const label = wrap.querySelector('label');
  const hint = wrap.querySelector('.hint');
  if (label) {
    label.htmlFor = 'memoPresetToggle';
    label.textContent = 'Selecteur Memo mystere';
  }
  if (hint) {
    hint.textContent = "Survole un etage pour voir l'apercu a droite, puis clique pour le choisir.";
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
      ? getEggPokemonPreviewData(
        'eggPokemonBox',
        getCurrentLanguage() === 'en' ? 'Egg' : 'Oeuf',
        getCurrentLanguage() === 'en' ? 'Species forced by the glitch' : 'Espece forcee par le glitch'
      )
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

  const horizontal = point.x < room.width / 3 ? t('left')
    : point.x >= (room.width * 2) / 3 ? t('right')
      : t('center');
  const vertical = point.y < room.height / 3 ? t('top')
    : point.y >= (room.height * 2) / 3 ? t('bottom')
      : t('middle');

  return `${vertical}, ${horizontal}`;
}

function buildMemoDescription(room) {
  if (!room) {
    return t('chooseVariantToShow');
  }
  if (room.missingMap) {
    const parts = [t('missingRoomDescription')];
    if (room.observedLoot) {
      parts.push(room.observedLoot);
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
  if (room && room.observedLoot) {
    labels.push(room.observedLoot);
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
  const region = document.getElementById('useEUswap').checked ? t('regionEurope') : t('regionUs');
  const client = monNameFromSelect('clientBox', 'clientF', typeData.forceClient);
  const target = typeData.clientIsTarget ? client : monNameFromSelect('targetBox', 'targetF', typeData.forceTarget);

  const parts = [`${mission}${subtype && subtype !== '-' ? ` - ${subtype}` : ''}`, `${t('regionLabel')} ${region}`];

  if (isEggGlitchEnabled()) {
    parts.push(t('eggGlitchRecipe'));
  } else {
    parts.push(t('floorSummary', { dungeon, floor }));
    parts.push(t('clientSummary', { name: client }));
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

  const errors = WMSGen.verify();
  if (errors.length) {
    output.value = errors.map((error) => `• ${error}`).join('\n');
    compact.value = '';
    status.textContent = t('blockedCombination');
    return;
  }

  const pretty = WMSGen.generate();
  output.value = pretty;
  compact.value = compactCode(pretty);
  status.textContent = document.getElementById('useEUswap').checked ? t('generatedEu') : t('generatedUs');
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
  status.textContent = fullyMapped
    ? (decoded.useEuSwap ? t('importCodeEu') : t('importCodeUs'))
    : t('importCodePartial');
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
    lead.textContent = getCurrentLanguage() === 'en'
      ? 'Choose a Treasure Memo special floor to display its map.'
      : 'Selectionne un etage special de Memo tresor pour afficher sa carte.';
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

  if (entry.sample) {
    location.textContent = t('memoSampleAvailable');
    code.textContent = entry.sample.code;
    code.classList.remove('hidden');
  } else {
    location.textContent = t('memoNoSample');
    code.textContent = '';
    code.classList.add('hidden');
  }

  renderMemoMap(map, entry, true);
  renderMemoFeatureList(features, entry);
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
  const eu = document.getElementById('useEUswap');
  const eggGlitch = document.getElementById('eggGlitch');
  eu.checked = true;
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
    if (kind === 'memo') {
      document.getElementById('memoPreset').selectedIndex = 0;
      document.getElementById('specialFloor').value = '';
    }
    WMSGen.fillSubTypeList();
    relabelMissionTypeSelect();
    relabelMissionSubTypeSelect();
    WMSGen.update();
    refreshFlavorTextPresetOptions();
    document.getElementById('memoSelectorWrap').classList.toggle('hidden', kind !== 'memo');
    syncMemoSelectorFromSpecialFloor();
    refreshMissionUi();
    updateSummary();
    updateMemoVisuals();
  }
}

onReady(() => {
  const urlLanguage = getUrlLanguage();
  const storedLanguage = getStoredLanguage();
  if (getAvailableLanguages().includes(urlLanguage)) {
    currentLanguage = urlLanguage;
  } else {
    currentLanguage = getAvailableLanguages().includes(storedLanguage) ? storedLanguage : getDefaultLanguage();
  }

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
    refreshFlavorTextPresetOptions();
    updateSummary();
  });

  applyLanguage(currentLanguage);
});
