# Missioni Speciali C

[English](README.md) · **Italiano**

> Questo progetto è nato per avere il generatore di Wonder Mail S tutto in italiano, con i nomi e le frasi
> della nostra versione del gioco: *Missioni Speciali C* è proprio il nome italiano delle Wonder Mail S.
> Col tempo è diventato un generatore completo in due lingue, e oggi il sito si apre in inglese perché
> possa usarlo chiunque. L'italiano resta a un clic di distanza.

Un generatore di password per le Missioni Speciali C di *Pokémon Mystery Dungeon: Esploratori del Cielo*
(le Wonder Mail S della versione inglese). È in italiano e in inglese, e i nomi, le frasi e le mappe delle
stanze vengono direttamente dal gioco.

Sono partito da [wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm) di RedCoal27. Strada facendo
il progetto è cambiato parecchio: l'interfaccia è nuova, i dati sono estratti dal gioco invece che copiati
dalle wiki e alcuni errori del vecchio generatore sono stati corretti.

## Come si usa

Il sito è online qui: <https://quaolo.github.io/wondermail-it/>.

In locale non c'è niente da installare, basta aprire `index.html` nel browser. Se preferisci un piccolo server locale:

```
python -m http.server 8000
```

e poi vai su <http://localhost:8000>. Il sito si apre in inglese: l'italiano si sceglie dal menu in alto a
destra (la scelta viene ricordata) oppure aggiungendo `?lang=it` all'indirizzo. Funziona anche offline, tranne i ritratti dei Pokémon che vengono caricati da
PMDCollab.

Le password europee vanno bene per tutte le lingue della cartuccia europea, italiano compreso.

## Cosa fa

La pagina è divisa in tre parti. In alto c'è "Parti da", con quattro modi di cominciare: "Leggi una
password", "Accesso rapido", "Cerca un premio" e "Sblocca un dungeon". Se ne apre uno alla volta. In "Leggi
una password" incolli una password e il sito capisce di che regione è (Europa, America o Giappone), controlla
che sia valida e carica la missione nel modulo; in "Accesso rapido" trovi le scorciatoie per le missioni più
cercate.

Sotto, a sinistra, c'è il modulo: qualunque sia il punto di partenza, lo puoi sempre ritoccare a mano. Quando
un punto di partenza lo compila, i campi cambiati si illuminano e in cima compare da dove viene la missione,
con "Annulla" per tornare a com'era prima e "Cambia" per riaprire il pannello. A destra resta sempre in vista
il risultato: l'anteprima della schermata "Info missione" del gioco, con committente, difficoltà e
ricompensa, e la password da copiare; la mappa della stanza sta sotto al modulo. L'anteprima è sempre quella
della password che stai per copiare. Su telefono la password resta anche in una barra in fondo allo schermo.

Le missioni con una stanza speciale (Memo tesoro, Lettere di sfida, covi dei ricercati, Sala Proibita e Sala
d'Oro) mostrano anche la mappa della stanza, con quello che c'è dentro e le regole che valgono lì. Per 12 dei
30 Memo tesoro c'è anche una missione vera presa dalla wiki giapponese Grovyle, convertita per la tua regione.

I quattro Pokémon in alto sono solo decorativi: se ci clicchi sopra cambia la squadra.

Qualche animazione accompagna il lavoro: la password si scrive da sola, le finestre entrano con calma e i
valori di "Info missione" si accendono quando cambiano. Se hai chiesto al sistema di ridurre le animazioni,
il sito le toglie.

Negli accessi rapidi tre pulsanti tirano fuori una missione diversa a ogni clic: una missione normale, un
arresto e una a sorpresa (può uscire di tutto, anche una Lettera di sfida o un Memo tesoro). Anche la missione
uovo cambia specie ogni volta. I valori escono dagli elenchi del modulo, quindi la password è sempre una che
il gioco accetta.

Altre cose comode: gli strumenti sono divisi per categoria (bacche, gomme, sfere, MT e così via) e si trovano
anche cercando il nome inglese. In "Varianti", sotto la password, puoi poi ricavare una missione gemella, al piano successivo o
con un seme diverso. Per il gioco è una missione diversa, quindi puoi tenerle tutte e due nell'elenco.
Se ne vuoi di più, "Serie di missioni" te ne prepara fino a otto in un colpo, quante ne tiene l'elenco del
gioco: su piani di fila (saltando quelli che il gioco rifiuta) o con semi diversi. Si copiano una per una
oppure tutte insieme.

## Sbloccare un dungeon

La scheda "Sblocca un dungeon" prepara il trucco scoperto da Lai-brary: una Lettera di sfida di Jirachi con un
altro dungeon scritto dentro. Quando avvii la missione il gioco annuncia che si è aperta la Caverna Stellata,
ma apre anche il dungeon che hai scelto. Funziona solo in Esploratori del Cielo e serve essere arrivati almeno
al grado Segreto. Nella scheda ci sono le avvertenze: la più importante è che sbloccare un dungeon della storia
prima del tempo può rovinare il resto della partita, e dopo aver salvato non si torna indietro. Se incolli una
di queste password in "Leggi una password", il sito la riconosce e la apre nella sua scheda.

## Missioni che non finiscono mai

Il gioco non controlla quale stanza è scritta in un Memo tesoro. Se nella stanza non c'è il tesoro della
missione, la missione non si completa e rimane nell'elenco, e ogni volta che torni nel dungeon ritrovi i premi
della stanza. Il caso più conosciuto è questa password europea, al primo piano della Grotta Marina, che usa
la stanza 81 (due Gommaincanto, una Mascheradoro e un Fantascrigno a ogni visita):

```
=27YY RQ+4%WP CCCTTPTP21 P#%33FM =+66N
```

In "Cerca un premio", nella barra in alto, scegli il premio che ti interessa e il sito ti dice
in quale stanza e in quale dungeon si trova, con la probabilità per ogni Tecalusso; un clic prepara la
missione. Nel generatore queste stanze sono raccolte a parte, sotto "Stanze senza tesoro". Alcune contengono dei
Tecalusso e quello che c'è dentro dipende dal dungeon della missione: in Riserva Marina, per esempio, ci sono
Gomme di tutti i tipi. La tabella completa è nella scheda della stanza. Fa eccezione la stanza segreta
(la 113): lì il gioco pesca dall'elenco del piano, quindi conta anche il piano della missione, e il sito
mostra cosa esce su ogni piano di ogni dungeon. Il trucco è stato provato dai giocatori
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
- Prima di dare la password il sito rifà i controlli del gioco (`IsMissionValid`): dungeon, piano (compresi
  i piani che il gioco non accetta, di solito quello del capo), Pokémon, strumento obiettivo e ricompensa.
  Così una password rifiutata dal gioco te la segnala subito, con il motivo.
- Il numero di piani di ogni dungeon e la difficoltà delle missioni vengono dalle tabelle del gioco. Prima
  erano raccolte dalla community e in 17 dungeon su 54 il limite dei piani era sbagliato: per esempio nella
  Giungla del Mistero si fermava al 14 invece che al 29, e nelle Pianure Saetta arrivava al 20 invece che al 10.
- I tipi di ricompensa seguono il codice del gioco (`InitMissionReward`). Con l'uovo e con il Pokémon che si
  unisce alla squadra si può scegliere la specie: di base è il committente, come nelle missioni della bacheca.
  Per l'uovo il gioco accetta qualsiasi specie, mentre chi si unisce alla squadra deve essere un Pokémon che
  potrebbe fare da committente.
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
ritratti, chi può fare da committente), i piani e la difficoltà di ogni dungeon e le stanze speciali.

Il resto del codice è JavaScript senza librerie: `lm.js` codifica e decodifica le password,
`lmgenerate.js` descrive i tipi di missione, `app.js` e `stanze.js` gestiscono la pagina e le mappe.
In `config.js` si può mettere l'indirizzo del repository per mostrare il pulsante GitHub in alto.

## Test

```
node --test                  # codifica, stanze, Pokémon, piani, validità, premi, icone e traduzioni (Node 18+)
python tests/ui_smoke.py     # prova la pagina in un browser vero, serve Playwright
```

Il test della codifica confronta 60 password con quelle del generatore originale e sono identiche.

## Cose ancora da verificare

- Una password valida può comunque essere rifiutata dal gioco se il dungeon non è ancora sbloccato, se la
  missione è già nell'elenco o se l'elenco è pieno: quelli dipendono dal salvataggio e il sito non li conosce.
- Le stanze senza tesoro diverse dalla 81 vanno provate in gioco.
- Il gioco dice quali strumenti condividono la stessa icona, ma non di che colore sono. Per alcuni i colori
  li ho scelti io e potrebbero non corrispondere.

## Crediti

- [wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm) di RedCoal27, il progetto da cui sono partito
- il vecchio generatore di Wonder Mail S, di pubblico dominio, e la versione francese di
  [SombrAbsol](https://github.com/SombrAbsol/SombrAbsol.github.io)
- [pret/pmd-sky](https://github.com/pret/pmd-sky) per i file e le tabelle del gioco
- [SkyTemple](https://github.com/SkyTemple/skytemple-files) per il formato dei testi e delle stanze
- [pmdsky-debug](https://github.com/UsernameFodder/pmdsky-debug) per la documentazione delle funzioni del gioco
- [Lai-brary](https://laioxy.github.io/wondermail/) per la tabella giapponese, il glitch dell'uovo e quello per sbloccare i dungeon
- la [wiki Grovyle](https://wiki.grovyle.net/pokedun3/) per i Memo tesoro reali
- [Pokémon Central Wiki](https://wiki.pokemoncentral.it/) per i nomi italiani delle forme alternative
- [PMDCollab SpriteCollab](https://sprites.pmdcollab.org/) per i ritratti (di Spike Chunsoft e degli artisti
  della community, CC BY-NC 4.0), che vengono caricati da GitHub e non sono inclusi qui
- la [wiki di PMDO](https://wiki.pmdo.pmdcollab.org/) e i file di [PMDO](https://github.com/audinowho/DumpAsset)
  per le icone degli strumenti
- [Pixelify Sans](https://github.com/eifetx/Pixelify-Sans) per il carattere dei titoli (SIL Open Font License)

Ho sviluppato il progetto insieme a Claude.

## Licenza

Il codice è rilasciato con licenza MIT, il testo completo è in [LICENSE](LICENSE). La licenza non copre i testi
e i dati del gioco in `data/`, che restano dei rispettivi proprietari, né le risorse di altri elencate qui
sopra, che hanno le loro licenze. Il codice di partenza di wondermail_pdm è stato pubblicato da RedCoal27 senza
una licenza esplicita; il generatore di Wonder Mail S da cui derivano entrambi i progetti è di pubblico dominio.

*Pokémon Mystery Dungeon: Esploratori del Cielo* © Nintendo, Creatures, GAME FREAK, Spike Chunsoft. È un
progetto amatoriale, senza scopo di lucro e non affiliato ai titolari dei diritti.
