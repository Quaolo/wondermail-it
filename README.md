# Missioni Speciali C (Wonder Mail S)

Generatore e lettore di password **Missioni Speciali C** per *Pokémon Mystery Dungeon: Esploratori del Cielo*,
in italiano e inglese, con i **nomi, le frasi e le mappe ufficiali del gioco**.

Nato da [wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm) di RedCoal27, di cui è ormai una versione
a sé: interfaccia nuova, dati estratti direttamente dal gioco e diverse correzioni.

## Uso

È un sito statico: nessun server e nessuna compilazione.

- Apri `index.html` con il browser, oppure
- dalla cartella del progetto: `python -m http.server 8000` e vai su <http://localhost:8000>.

La lingua si cambia dal menu in alto a destra, oppure con `?lang=en` nell'indirizzo.
Funziona anche senza internet: senza rete mancano solo i ritratti dei Pokémon (restano le iniziali).

La cartuccia europea è una sola per tutte le lingue: le password della versione "Europa"
valgono anche per il gioco in italiano, ed è il gioco a mostrare i testi della missione in italiano.

## Cosa offre

**Leggere e creare password**
- *Leggi una password*, in cima alla pagina: riconosce la regione (Europa, America, Giappone) grazie al checksum
  CRC32 e carica la missione nel generatore, pronta da modificare.
- Anteprima **Info missione** con le frasi ufficiali del gioco ("Soccorri…", "Sconfiggi…", "Trova il tesoro"),
  il ritratto del committente, la difficoltà e la ricompensa. L'anteprima legge la password mostrata, quindi
  corrisponde sempre a quello che arriverà nel gioco.
- Nomi e descrizioni ufficiali di strumenti, dungeon, Pokémon e trappole (versione europea, italiano e inglese).
  La ricerca trova anche il nome nell'altra lingua (scrivi "Oran" e trovi Baccarancia).

**Stanze speciali dai dati del gioco**
- Mappe di tutte le stanze che una password può indicare, disegnate da `BALANCE/fixed.bin` e dalle tabelle del
  codice: i 30 **Memo tesoro** (115-144), le **Lettere di sfida** (150-154), le sfide dei **leggendari** (145-149),
  i **covi dei ricercati** (160-164), la **Sala Proibita** (165) e la **Sala d'Oro** (111).
- Per ogni stanza: tesoro, Poké, trappole con i nomi ufficiali, porte chiuse a chiave, muri che si rompono,
  avversari con i loro ritratti, e le regole del gioco (per esempio: nelle Lettere di sfida le sfere non
  funzionano, nei Memo tesoro l'Arraffasfera non funziona).
- Per i Memo tesoro, dove esiste, una missione reale con la stessa stanza (dalla wiki giapponese Grovyle),
  convertita nella regione scelta.

**Correzioni rispetto al generatore originale**
- **Stanze delle Lettere di sfida e dei covi**: il generatore storico le sceglieva tra 145-160 e 161-165,
  "a memoria". Il codice del gioco usa 150-154 per le sfide e 160-164 per i covi (145-149 sono le sfide dei
  leggendari, 155-159 non esistono, 165 è la Sala Proibita).
- **Memo tesoro come quelli veri**: le 19 missioni reali lette dalla wiki giapponese hanno committenti diversi
  (con committente = bersaglio), una ricompensa normale e, come tesoro nel Tecalusso, lo *strumento obiettivo*
  della missione (quasi sempre una Gommaincanto). Il generatore storico imponeva Turtwig, nessuna ricompensa
  e una Mela come tesoro. Ora committente, tesoro e ricompensa si scelgono. Lo stesso vale per lo strumento
  chiuso nella Sala Proibita.
- Lettura con verifica del **checksum CRC32** (prima circa una stringa a caso su nove veniva accettata) e
  **regione giapponese**; i 19 esempi giapponesi sono ora associati alla stanza giusta.
- Il **secondo Pokémon** (terzo membro delle Lettere di sfida, complice nei covi) veniva ignorato.
- **Arbok** maschio veniva codificato come Nidoran♂; la casella "Femmina" ora usa i dati di genere del gioco.
- **Controllo dei limiti**: un valore che non entra nella password viene segnalato, e ogni password viene
  riletta prima di mostrarla.
- I pulsanti di accesso rapido aggiornano subito la password; varie altre correzioni minori.

## Configurazione

`config.js` contiene l'indirizzo del repository di questa versione (`repoUrl`). Finché è vuoto il pulsante
GitHub in alto resta nascosto; il progetto originale è citato in fondo alla pagina.

## Aggiornare i dati del gioco

I file in `data/` sono generati da `tools/estrai_dati.py` a partire dalla decompilazione
[pret/pmd-sky](https://github.com/pret/pmd-sky), che contiene i file del gioco. Non serve nessuna ROM.

```
python tools/estrai_dati.py                       # scarica i file necessari (commit fissato)
python tools/estrai_dati.py --pmd-sky ../pmd-sky  # oppure usa una copia locale del repo
```

Serve solo Python 3.9 o successivo, senza librerie esterne. Lo script controlla l'impronta SHA-1 di ogni file
e avvisa se la fonte è cambiata. Estrae:

| File generato | Contenuto | Fonte in pret/pmd-sky |
|---|---|---|
| `data/testi_gioco_it.js`, `data/testi_gioco_en.js` | nomi, descrizioni, trappole, frasi di "Info missione" | `MESSAGE/text_*.str` |
| `data/dati_gioco.js` | strumenti validi, strumenti esclusivi, forme femminili | `BALANCE/monster.md`, testi |
| `data/stanze_fisse.js` | mappe, contenuto e regole delle stanze speciali, elenchi delle stanze | `BALANCE/fixed.bin`, tabelle in `asm/` |

## Test

```
node --test                        # codificatore, stanze e traduzioni (Node 18 o successivo)
python tests/ui_smoke.py           # pagina in un browser vero, con e senza rete (richiede Playwright)
```

Il test del codificatore confronta 60 password con quelle prodotte dal generatore originale: per EU e NA i
codici sono identici bit per bit. Il test delle stanze controlla che gli elenchi del generatore coincidano con
le tabelle del gioco e che la stanza 115 coincida con la mappa della wiki giapponese.

## Struttura

| File | Contenuto |
|---|---|
| `index.html`, `style.css` | pagina e tema grafico |
| `app.js` | interfaccia, anteprima "Info missione", ritratti |
| `stanze.js` | scelta delle stanze, mappe e legenda |
| `lm.js` | codifica e decodifica delle password (EU, NA, JP) |
| `lmgenerate.js` | tipi di missione e lettura del modulo |
| `lmutils.js` | formattazione e nomi nella lingua corrente |
| `config.js` | impostazioni (indirizzo del repository) |
| `lang/it.js`, `lang/en.js` | testi dell'interfaccia |
| `data/` | testi e dati del gioco (generati) ed esempi reali di Memo tesoro |
| `assets/` | icone degli strumenti, bandiere, carattere dei titoli |
| `tools/estrai_dati.py` | estrazione dei dati da pret/pmd-sky |
| `tests/` | test |
| `docs/prossimi-passi.md` | altre funzioni ricavabili dal codice del gioco |

## Da verificare

- Il significato dei tipi di ricompensa 4-6 non coincide del tutto con la documentazione del gioco
  ([pmdsky-debug](https://github.com/UsernameFodder/pmdsky-debug): 4 = strumento esclusivo, 5 = denaro nascosto,
  6 = uovo o nuovo membro). Le etichette sono quelle del generatore originale.
- Le regole delle stanze vengono dal codice del gioco; il comportamento delle stanze fuori elenco (per esempio la
  114, mai usata dal gioco) è dedotto dal codice e da segnalazioni di giocatori, non provato.
- Le password sono controllate matematicamente, non in gioco: una password valida può comunque essere
  rifiutata se il dungeon non è sbloccato o se la combinazione non è ammessa.

## Crediti

- [RedCoal27/wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm): progetto di partenza.
- Generatore storico di Wonder Mail S (codice di pubblico dominio) e la versione francese di [SombrAbsol](https://github.com/SombrAbsol/SombrAbsol.github.io).
- [pret/pmd-sky](https://github.com/pret/pmd-sky): file e tabelle del gioco.
- [SkyTemple](https://github.com/SkyTemple/skytemple-files): posizione dei testi e formato delle stanze.
- [pmdsky-debug](https://github.com/UsernameFodder/pmdsky-debug): documentazione delle funzioni del gioco.
- [Lai-brary](https://laioxy.github.io/wondermail/): tabella della regione giapponese, glitch dell'uovo.
- [Wiki Grovyle](https://wiki.grovyle.net/pokedun3/): missioni Memo tesoro reali.
- [Pokémon Central Wiki](https://wiki.pokemoncentral.it/): nomi italiani delle forme alternative.
- [PMDCollab SpriteCollab](https://sprites.pmdcollab.org/): ritratti dei Pokémon (originali di Spike Chunsoft e
  lavori della community sotto CC BY-NC 4.0), caricati da GitHub e non inclusi nel progetto.
- [PMDO Wiki](https://wiki.pmdo.pmdcollab.org/): icone degli strumenti.
- [Pixelify Sans](https://github.com/eifetx/Pixelify-Sans): carattere dei titoli (SIL Open Font License, `assets/fonts/`).

*Pokémon Mystery Dungeon: Esploratori del Cielo* © Nintendo, Creatures, GAME FREAK, Spike Chunsoft.
Progetto amatoriale senza scopo di lucro, non affiliato con i detentori dei diritti.
I testi e i dati del gioco in `data/` restano di proprietà dei rispettivi titolari.

---

## English

Wonder Mail S password generator and reader for *Pokémon Mystery Dungeon: Explorers of Sky*, in Italian and
English, using the official in-game names, job summary sentences and room maps extracted from the
[pret/pmd-sky](https://github.com/pret/pmd-sky) decompilation (`tools/estrai_dati.py`, no ROM needed).
It started from [RedCoal27/wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm) and adds CRC-verified
decoding, Japanese region support, maps of every special room (Treasure Memos, Challenge Letters, outlaw
hideouts, Sealed and Golden Chambers) and several fixes, including the room lists used by Challenge Letters
(150-154) and outlaw hideouts (160-164). Open `index.html` or run `python -m http.server`;
run the tests with `node --test`.
