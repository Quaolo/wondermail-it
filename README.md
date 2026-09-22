# Missioni Speciali C

Un generatore di password per le Missioni Speciali C di *Pokémon Mystery Dungeon: Esploratori del Cielo*
(le Wonder Mail S della versione inglese). È in italiano e in inglese, e i nomi, le frasi e le mappe delle
stanze vengono direttamente dal gioco.

Sono partito da [wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm) di RedCoal27. Strada facendo
il progetto è cambiato parecchio: l'interfaccia è nuova, i dati sono estratti dal gioco invece che copiati
dalle wiki e alcuni errori del vecchio generatore sono stati corretti.

## Come si usa

Non c'è niente da installare, basta aprire `index.html` nel browser. Se preferisci un piccolo server locale:

```
python -m http.server 8000
```

e poi vai su <http://localhost:8000>. La lingua si cambia dal menu in alto a destra, oppure aggiungendo
`?lang=en` all'indirizzo. Funziona anche offline, tranne i ritratti dei Pokémon che vengono caricati da
PMDCollab.

Le password europee vanno bene per tutte le lingue della cartuccia europea, italiano compreso.

## Cosa fa

Di fianco al modulo ci sono due schede che si aprono con un clic: "Leggi una password" e "Accesso rapido".
Nella prima incolli una password e il sito capisce di che regione è (Europa, America o Giappone), controlla
che sia valida e carica la missione nel generatore, pronta da modificare; nella seconda trovi le scorciatoie
per le missioni più cercate. Quando cominci a compilare la missione a mano si richiudono da sole, così resta
spazio all'anteprima. Di fianco al
modulo c'è l'anteprima della schermata "Info missione" del gioco, con committente, difficoltà e ricompensa.
L'anteprima è sempre quella della password che stai per copiare.

Le missioni con una stanza speciale (Memo tesoro, Lettere di sfida, covi dei ricercati, Sala Proibita e Sala
d'Oro) mostrano anche la mappa della stanza, con quello che c'è dentro e le regole che valgono lì. Per 12 dei
30 Memo tesoro c'è anche una missione vera presa dalla wiki giapponese Grovyle, convertita per la tua regione.

I quattro Pokémon in alto sono solo decorativi: se ci clicchi sopra cambia la squadra.

Altre cose comode: gli strumenti sono divisi per categoria (bacche, gomme, sfere, MT e così via) e si trovano
anche cercando il nome inglese. Da una password puoi poi ricavare una missione gemella, al piano successivo o
con un seme diverso. Per il gioco è una missione diversa, quindi puoi tenerle tutte e due nell'elenco.

## Missioni che non finiscono mai

Il gioco non controlla quale stanza è scritta in un Memo tesoro. Se nella stanza non c'è il tesoro della
missione, la missione non si completa e rimane nell'elenco, e ogni volta che torni nel dungeon ritrovi i premi
della stanza. Il caso più conosciuto è questa password europea, al primo piano della Grotta Marina, che usa
la stanza 81 (due Gommaincanto, una Mascheradoro e un Fantascrigno a ogni visita):

```
=27YY RQ+4%WP CCCTTPTP21 P#%33FM =+66N
```

Nel generatore queste stanze sono raccolte a parte, sotto "Stanze senza tesoro". Alcune contengono dei
Tecalusso e quello che c'è dentro dipende dal dungeon della missione: in Riserva Marina, per esempio, ci sono
Gomme di tutti i tipi. La tabella completa è nella scheda della stanza. Il trucco è stato provato dai giocatori
con la stanza 81; per le altre l'ho ricavato dal codice del gioco e non l'ho ancora verificato.

## Cosa cambia rispetto al generatore originale

- Le Lettere di sfida usano le stanze 150-154 e i covi 160-164, come nel gioco. Prima erano 145-160 e 161-165.
- I Memo tesoro sono fatti come quelli veri: committente e bersaglio coincidono, nel Tecalusso c'è lo
  strumento obiettivo e la ricompensa si sceglie. Prima erano bloccati su Turtwig e sulla Mela.
- Quando legge una password controlla il checksum. Prima passava anche una stringa a caso su nove.
- Riconosce le password giapponesi.
- Il terzo membro delle Lettere di sfida e il complice dei covi finiscono davvero nella password.
- Arbok maschio non diventa più Nidoran♂, e un valore fuori limite viene segnalato invece di dare una
  password sbagliata.
- L'elenco dei committenti segue le regole del gioco. Il vecchio generatore lasciava fuori una ventina di
  Pokémon che il gioco accetta, tra cui Nidoqueen, Typhlosion, Treecko, Mudkip e Chimchar. Quelli che il gioco
  rifiuta come committenti, come Grovyle o i leggendari, si possono comunque scegliere come bersaglio. Quando il
  committente si unisce alla squadra, i Pokémon troppo grandi come Onix non compaiono.
- Le icone degli strumenti seguono i dati del gioco: due strumenti che lì hanno la stessa icona ce l'hanno
  anche qui, per esempio quasi tutti i semi o i nastri da tenere.

## Dati del gioco

I file in `data/` si rigenerano con `tools/estrai_dati.py`, che legge la decompilazione
[pret/pmd-sky](https://github.com/pret/pmd-sky). Non serve la ROM, basta Python 3.9 o più recente:

```
python tools/estrai_dati.py
python tools/estrai_dati.py --pmd-sky ../pmd-sky   # se hai già una copia di pret/pmd-sky
```

Lo script scarica i file da un commit preciso e controlla che non siano cambiati. Da lì ricava i testi
(nomi, descrizioni, frasi di "Info missione"), i dati degli strumenti e dei Pokémon (numero del Pokédex per i
ritratti, chi può fare da committente) e le stanze speciali.

Il resto del codice è JavaScript senza librerie: `lm.js` codifica e decodifica le password,
`lmgenerate.js` descrive i tipi di missione, `app.js` e `stanze.js` gestiscono la pagina e le mappe.
In `config.js` si può mettere l'indirizzo del repository per mostrare il pulsante GitHub in alto.

## Test

```
node --test                  # codifica, stanze, Pokémon, icone e traduzioni (Node 18 o più recente)
python tests/ui_smoke.py     # prova la pagina in un browser vero, serve Playwright
```

Il test della codifica confronta 60 password con quelle del generatore originale e sono identiche.

## Cose ancora da verificare

- I tipi di ricompensa dal 4 al 6 hanno ancora i nomi del generatore originale, che non tornano del tutto con
  quello che si sa del gioco.
- Una password valida può comunque essere rifiutata dal gioco, per esempio se il dungeon non è ancora
  sbloccato o se la combinazione non è ammessa.
- Le stanze senza tesoro diverse dalla 81 vanno provate in gioco.
- Il gioco dice quali strumenti condividono la stessa icona, ma non di che colore sono. Per alcuni i colori
  li ho scelti io e potrebbero non corrispondere.

Le idee per le prossime versioni sono in [docs/prossimi-passi.md](docs/prossimi-passi.md).

## Crediti

- [wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm) di RedCoal27, il progetto da cui sono partito
- il vecchio generatore di Wonder Mail S, di pubblico dominio, e la versione francese di
  [SombrAbsol](https://github.com/SombrAbsol/SombrAbsol.github.io)
- [pret/pmd-sky](https://github.com/pret/pmd-sky) per i file e le tabelle del gioco
- [SkyTemple](https://github.com/SkyTemple/skytemple-files) per il formato dei testi e delle stanze
- [pmdsky-debug](https://github.com/UsernameFodder/pmdsky-debug) per la documentazione delle funzioni del gioco
- [Lai-brary](https://laioxy.github.io/wondermail/) per la tabella giapponese e il glitch dell'uovo
- la [wiki Grovyle](https://wiki.grovyle.net/pokedun3/) per i Memo tesoro reali
- [Pokémon Central Wiki](https://wiki.pokemoncentral.it/) per i nomi italiani delle forme alternative
- [PMDCollab SpriteCollab](https://sprites.pmdcollab.org/) per i ritratti (di Spike Chunsoft e degli artisti
  della community, CC BY-NC 4.0), che vengono caricati da GitHub e non sono inclusi qui
- la [wiki di PMDO](https://wiki.pmdo.pmdcollab.org/) e i file di [PMDO](https://github.com/audinowho/DumpAsset)
  per le icone degli strumenti
- [Pixelify Sans](https://github.com/eifetx/Pixelify-Sans) per il carattere dei titoli (SIL Open Font License)

Ho sviluppato il progetto insieme a Claude, l'assistente di intelligenza artificiale di Anthropic.

## Licenza

Il codice è rilasciato con licenza MIT, il testo completo è in [LICENSE](LICENSE). La licenza non copre i testi
e i dati del gioco in `data/`, che restano dei rispettivi proprietari, né le risorse di altri elencate qui
sopra, che hanno le loro licenze. Il codice di partenza di wondermail_pdm è stato pubblicato da RedCoal27 senza
una licenza esplicita; il generatore di Wonder Mail S da cui derivano entrambi i progetti è di pubblico dominio.

*Pokémon Mystery Dungeon: Esploratori del Cielo* © Nintendo, Creatures, GAME FREAK, Spike Chunsoft. È un
progetto amatoriale, senza scopo di lucro e non affiliato ai titolari dei diritti.

## English

A Wonder Mail S password generator and reader for *Pokémon Mystery Dungeon: Explorers of Sky*, in Italian and
English. Names, job summary sentences and room maps come straight from the game data, extracted from the
[pret/pmd-sky](https://github.com/pret/pmd-sky) decompilation (no ROM needed). It started from RedCoal27's
[wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm) and now has a new interface, Japanese password
support, CRC checks, maps of every special room and a few fixes. It also covers the "endless" Treasure Memo
trick: a memo pointing to a room without the mission treasure never ends and can be replayed for the room's
rewards. Open `index.html` to use it and run `node --test` for the tests. Developed together with Claude
(Anthropic). The code is MIT licensed; game texts and data belong to their owners.
