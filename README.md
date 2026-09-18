# Generatore di Missioni Speciali C (Wonder Mail S)

Generatore e lettore di password **Missioni Speciali C** per *Pokémon Mystery Dungeon: Esploratori del Cielo*,
in italiano e inglese, con i **nomi e le descrizioni ufficiali del gioco**.

È una variante di [wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm) di RedCoal27.

## Uso

È un sito statico: nessun server e nessuna compilazione.

- Apri `index.html` con il browser, oppure
- dalla cartella del progetto: `python -m http.server 8000` e vai su <http://localhost:8000>.

La lingua si cambia dal menu in alto a destra, oppure con `?lang=en` nell'indirizzo.
Funziona anche senza internet: senza rete mancano solo le immagini dei Pokémon (restano le iniziali).

La cartuccia europea è una sola per tutte le lingue: le password della versione "Europa"
valgono anche per il gioco in italiano, ed è il gioco a mostrare i testi della missione in italiano.

## Cosa cambia rispetto all'originale

**Testi ufficiali**
- Nomi di strumenti, dungeon e Pokémon e descrizioni degli strumenti presi dai file di testo del gioco
  (versione europea, italiano e inglese). Esempi: Mela, Baccarancia, Grotta Marina, Gabitesquama.
- Terminologia del gioco italiano: *Missioni Speciali C*, *Memo tesoro*, *Sala Proibita*, *Sala d'Oro*,
  *committente*, *strumento*, *ricercato*, *covo di Pokémon*.
- La ricerca trova anche il nome nell'altra lingua (scrivi "Oran" e trovi Baccarancia).

**Correzioni**
- Lettura delle password con verifica del **checksum CRC32**: prima circa una stringa a caso su nove veniva
  accettata come password valida.
- Aggiunta la **regione giapponese**. I 19 esempi di Memo tesoro presi dalla wiki giapponese erano password
  giapponesi, non utilizzabili su una cartuccia europea, ed erano associati alle stanze sbagliate:
  ora sono associati alla stanza giusta e convertiti nella regione scelta.
- Il **secondo Pokémon** (terzo membro delle Lettere di sfida, complice nei covi) veniva ignorato e
  sostituito dal Pokémon obiettivo.
- **Arbok** maschio veniva codificato come Nidoran♂ e Nidoran♀ "femmina" produceva un ID inesistente
  (costante sbagliata nel generatore storico). Ora la casella "Femmina" usa i dati di genere del gioco
  (`monster.md`) e si disattiva per le specie senza forma femminile separata.
- **Controllo dei limiti**: un valore che non entra nella password (per esempio stanza 300) produceva una
  password sbagliata senza avviso. Ora viene segnalato, e ogni password viene riletta prima di mostrarla.
- La combinazione iniziale dava un errore (nessuno strumento come ricompensa); i messaggi di errore
  erano in francese anche in inglese; le varianti dei Memo tesoro erano numerate a partire da 2;
  l'ultima stanza di ogni elenco non veniva mai scelta a caso; scegliendo un preset la regione tornava
  sempre Europa; la stanza speciale di una password letta restava attiva cambiando tipo di missione.
- Pulizia del codice: 21 funzioni definite due o tre volte (valeva solo l'ultima), codice copiato da
  web.archive.org, caratteri corrotti nella pagina, funzioni mai eseguite.

**Novità**
- Seme del testo della missione visibile nelle opzioni avanzate: leggendo una password viene
  riportato lì, così rigenerando si ottiene la stessa missione.
- Test automatici del codificatore e dell'interfaccia.

## Aggiornare i testi ufficiali

I file in `data/` sono generati da `tools/estrai_testi.py` a partire dalla decompilazione
[pret/pmd-sky](https://github.com/pret/pmd-sky), che contiene i file di testo del gioco. Non serve nessuna ROM.

```
python tools/estrai_testi.py                       # scarica i 3 file necessari (commit fissato)
python tools/estrai_testi.py --pmd-sky ../pmd-sky  # oppure usa una copia locale del repo
```

Serve solo Python 3.9 o successivo, senza librerie esterne. Lo script controlla l'impronta SHA-1 dei file
e avvisa se la fonte è cambiata.

## Test

```
node --test                        # codificatore e traduzioni (Node 18 o successivo)
python tests/ui_smoke.py           # pagina in un browser vero (richiede Playwright)
```

Il test del codificatore confronta 60 password con quelle prodotte dal generatore originale:
per EU e NA i codici sono identici bit per bit.

## Struttura

| File | Contenuto |
|---|---|
| `index.html`, `style.css` | pagina |
| `app.js` | interfaccia |
| `lm.js` | codifica e decodifica delle password (EU, NA, JP) |
| `lmgenerate.js` | tipi di missione e lettura del modulo |
| `lmutils.js` | formattazione e nomi nella lingua corrente |
| `lang/it.js`, `lang/en.js` | testi dell'interfaccia |
| `data/` | testi e dati ufficiali del gioco (generati) |
| `memo_gallery.js` | mappe dei Memo tesoro ed esempi reali |
| `tools/estrai_testi.py` | estrazione dei testi da pret/pmd-sky |
| `tests/` | test |

## Da verificare

- Il significato dei tipi di ricompensa 4-6 non coincide del tutto con la documentazione del gioco
  ([pmdsky-debug](https://github.com/UsernameFodder/pmdsky-debug): 4 = strumento esclusivo, 5 = denaro nascosto,
  6 = uovo o nuovo membro). Le etichette sono quelle del generatore originale.
- Le stanze delle Lettere di sfida (145-160) e dei covi dei ricercati (161-165) vengono dal generatore storico,
  che le indicava come "a memoria, potrebbe essere sbagliato".
- Le password sono controllate matematicamente, non in gioco: una password valida può comunque essere
  rifiutata se il dungeon non è sbloccato o se la combinazione non è ammessa.

## Crediti

- [RedCoal27/wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm): interfaccia, mappe dei Memo tesoro, glitch dell'uovo.
- Generatore storico di Wonder Mail S (codice di pubblico dominio) e la versione francese di [SombrAbsol](https://github.com/SombrAbsol/SombrAbsol.github.io).
- [pret/pmd-sky](https://github.com/pret/pmd-sky): file di testo e dati del gioco.
- [SkyTemple](https://github.com/SkyTemple/skytemple-files): posizione dei blocchi di testo nella versione europea.
- [pmdsky-debug](https://github.com/UsernameFodder/pmdsky-debug): documentazione delle funzioni del gioco.
- [Lai-brary](https://laioxy.github.io/wondermail/): tabella della regione giapponese, glitch dell'uovo.
- [Pokémon Central Wiki](https://wiki.pokemoncentral.it/): nomi italiani delle forme alternative.

*Pokémon Mystery Dungeon: Esploratori del Cielo* © Nintendo, Creatures, GAME FREAK, Spike Chunsoft.
Progetto amatoriale senza scopo di lucro, non affiliato con i detentori dei diritti.
I testi del gioco in `data/` restano di proprietà dei rispettivi titolari.

---

## English

Wonder Mail S password generator and reader for *Pokémon Mystery Dungeon: Explorers of Sky*, in Italian and
English, using the official in-game names and descriptions extracted from the
[pret/pmd-sky](https://github.com/pret/pmd-sky) decompilation (`tools/estrai_testi.py`, no ROM needed).
Based on [RedCoal27/wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm), with CRC-verified decoding,
Japanese region support, field range checks and several bug fixes. Open `index.html` or run
`python -m http.server`; run the tests with `node --test`.
