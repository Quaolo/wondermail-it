# Lingue dell'interfaccia

Ogni lingua è un file come `lang/it.js`, caricato in `index.html` dopo `lang/locales.js` e prima di `app.js`.

```js
window.WMSkyRegisterLocale('es', {
  meta: { code: 'es', label: 'Spanish', nativeLabel: 'Español', shortLabel: 'ES', flagPath: 'assets/flags/es.svg' },
  messages: { heroTitle: '...' },   // stesse chiavi di lang/it.js
  missionTypes: { 0: '...' },       // etichette dei tipi di missione
  missionSubtypes: { 3: { 0: '...' } },
  rewardTypes: { 0: '...' },
  pokemonForms: { 201: 'Unown A' }  // etichette delle forme alternative
});
```

Le chiavi mancanti vengono prese dall'inglese. I nomi di strumenti, dungeon e Pokémon non vanno tradotti a mano:
arrivano dai testi ufficiali del gioco (`data/testi_gioco_<lingua>.js`, generati da `tools/estrai_dati.py`).
Per aggiungere una lingua europea basta aggiungere il suo file di testo (`text_f.str`, `text_g.str`, `text_s.str`)
a `SOURCES` e `LANGUAGES` nello script.
