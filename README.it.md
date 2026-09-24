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

## Titolo e descrizione della missione

Nel gioco ogni missione ha un titolo e qualche riga di descrizione, e le frasi cambiano da una missione
all'altra. Non sono scritte nella password: il gioco le sceglie tra quelle che ha già, partendo da un numero
che nella password c'è (il seme del testo) insieme al dungeon e al piano. Il sito rifà la stessa scelta, quindi
in "Info missione" vedi il testo che comparirà in gioco, in italiano o in inglese.

Se il testo non ti piace, apri "Scegli il testo": trovi le frasi possibili per quella missione e con un clic
usi il seme che dà quella che preferisci. Il resto della missione non cambia. Per alcune missioni il testo è
sempre lo stesso (i Memo tesoro, per esempio, hanno una frase per ogni dungeon), e allora il sito te lo dice.

Ho controllato il risultato con alcune missioni distribuite ufficialmente, di cui si conosce il testo: titoli
e descrizioni coincidono. Un caso però l'ho solo dedotto dal codice. Quando la missione non somiglia a nessuna
di quelle previste dal gioco (un Memo tesoro in un dungeon dove il gioco non ne mette, o un soccorso con una
coppia di Pokémon che nelle missioni normali non c'è), il gioco va a leggere il testo in un punto sbagliato
della memoria. Il sito mostra quello che dovrebbe uscire, ma lo segnala come non ancora provato.

## La bacheca

La scheda "Bacheca" prepara una giornata di missioni come fa il gioco ogni mattina: la bacheca delle
missioni, quella dei ricercati, la richiesta del Caffè di Spinda e il messaggio in bottiglia. Ho riscritto le
regole del gioco: quali categorie possono uscire, i Pokémon, i dungeon e i piani, gli strumenti, le ricompense
e le restrizioni. Il gioco però guarda anche il salvataggio, e il sito non può conoscerlo, quindi immagina una
partita con la storia finita. Il grado della squadra lo scegli tu, perché decide quali missioni possono
comparire e se hanno restrizioni.

Anche i dungeon si possono impostare, uno per uno: completato, aperto o chiuso. Come nel gioco, le missioni
normali vanno solo nei dungeon completati, mentre quelle che servono ad aprire un dungeon compaiono solo
finché è chiuso o non ancora completato: le Scaglie di Gabite per la Grotta Labirinto, "esplora un dungeon
nuovo" per la Collina Folgore e la Foresta Mezzanotte, e le richieste del Caffè di Spinda per gli strumenti
musicali dei sette dungeon che li custodiscono. Un pulsante chiude in un colpo tutti questi dungeon. La scelta
resta salvata nel tuo browser.

Un clic su una missione la porta nel modulo, con "Annulla" per tornare indietro. Il modulo ha tutte le
varianti che la bacheca usa: il cucciolo, l'amico, l'amore o il rivale da soccorrere, l'amore da raggiungere,
il tesoro prezioso, lo strumento che fa evolvere il committente, la sua Gomma preferita, i ricercati in fuga e
gli elenchi di ricercati di Magnemite e Magnezone. Per le varianti che nel gioco hanno coppie fisse (Beedrill
che cerca Weedle, per esempio) c'è un menu con le coppie del gioco. Il gioco accetta anche le altre, ma solo
queste hanno un titolo. Ci sono anche le missioni che nel gioco aprono un dungeon (Scaglie di Gabite, dungeon
nuovo, strumenti musicali), ma con una password non le ho ancora provate: il sito lo scrive sotto il tipo di
missione.

Nelle missioni che non mostrano lo strumento obiettivo, e in quelle che danno Poké come ricompensa, la password
contiene comunque un valore che non si vede. Quando porti una missione nel modulo, il sito se lo ricorda: se
cambi qualcos'altro, quella parte resta com'era.

Le restrizioni (un compagno di un certo tipo o un Pokémon preciso) ora si possono anche scegliere nel modulo,
tra le opzioni avanzate. In "Info missione" c'è un pulsante per toglierle, e nella bacheca una casella che le
toglie a tutte le missioni.

## Il piano della missione

Sotto la stanza c'è una scheda con il piano dove porta la missione, presa dai dati dei dungeon del gioco: il
meteo, quanto si vede nei corridoi, la probabilità di trovare il negozio di Kecleon, un covo di Pokémon o le
scale nascoste, i Pokémon che compaiono con il loro livello, gli strumenti a terra e le trappole, ognuno con la
probabilità con cui il gioco lo sceglie. Se sul piano possono esserci il negozio di Kecleon o un covo di
Pokémon, a richiesta si apre anche l'elenco di quello che contengono, e lo stesso per gli strumenti sepolti
nei muri. Con le frecce guardi gli altri piani dello stesso dungeon senza
toccare la missione, e se uno ti piace di più lo usi con un clic. Serve soprattutto per le missioni da
ripetere: si vede subito quale piano è più comodo, o dove le scale nascoste portano alla Sala Segreta.

Per le missioni con una stanza speciale (Memo tesoro, sfide, covi) la stanza prende il posto del piano, quindi
forma, strumenti e trappole sono quelli della stanza: la scheda lo dice.

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
- Le restrizioni della squadra finiscono nella password e si vedono in "Info missione". Prima erano sempre vuote.
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
(nomi, descrizioni, frasi di "Info missione", titoli e descrizioni delle missioni con le tabelle per
sceglierli), le tabelle con cui il gioco riempie la bacheca, i dati degli strumenti e dei Pokémon (numero del Pokédex per i
ritratti, chi può fare da committente), i piani e la difficoltà di ogni dungeon, le stanze speciali e cosa
c'è su ogni piano (meteo, Pokémon, strumenti e trappole, da `mappa_s.bin`).

Il resto del codice è JavaScript senza librerie: `lm.js` codifica e decodifica le password,
`lmgenerate.js` descrive i tipi di missione, `testi_missione.js` sceglie titolo e descrizione, `bacheca.js` prepara le missioni della bacheca, `app.js` e `stanze.js` gestiscono la pagina e le mappe.
In `config.js` si può mettere l'indirizzo del repository per mostrare il pulsante GitHub in alto.

## Test

```
node --test                  # codifica, stanze, Pokémon, piani, validità, premi, testi, bacheca, dati dei piani, icone e traduzioni (Node 18+)
python tests/ui_smoke.py     # prova la pagina in un browser vero, serve Playwright
```

Il test della codifica confronta 60 password con quelle del generatore originale e sono identiche.

## Cose ancora da verificare

- Una password valida può comunque essere rifiutata dal gioco se il dungeon non è ancora sbloccato, se la
  missione è già nell'elenco o se l'elenco è pieno: quelli dipendono dal salvataggio e il sito non li conosce.
- Le stanze senza tesoro diverse dalla 81 vanno provate in gioco.
- Il testo delle missioni che il gioco non prevede (vedi sopra) è dedotto dal codice e va provato in gioco.
- La bacheca segue il codice del gioco, ma non l'ho ancora confrontata con una bacheca vera. Un dettaglio
  curioso da controllare: quando la ricompensa è un uovo, il gioco scrive come specie un numero estratto
  dall'elenco degli strumenti, quindi la specie dell'uovo che mostra il sito potrebbe non essere quella che
  nasce davvero.
- Le missioni che aprono un dungeon (Scaglie di Gabite, dungeon nuovo, strumenti musicali del Caffè di Spinda)
  create con una password vanno provate in gioco: non so se aprono il dungeon come quelle della bacheca.
- Il gioco dice quali strumenti condividono la stessa icona, ma non di che colore sono. Per alcuni i colori
  li ho scelti io e potrebbero non corrispondere.

## Crediti

- [wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm) di RedCoal27, il progetto da cui sono partito
- il vecchio generatore di Wonder Mail S, di pubblico dominio, e la versione francese di
  [SombrAbsol](https://github.com/SombrAbsol/SombrAbsol.github.io)
- [pret/pmd-sky](https://github.com/pret/pmd-sky) per i file e le tabelle del gioco
- [SkyTemple](https://github.com/SkyTemple/skytemple-files) per il formato dei testi, delle stanze e dei piani dei dungeon
- [pmdsky-debug](https://github.com/UsernameFodder/pmdsky-debug) per la documentazione delle funzioni del gioco
- [Lai-brary](https://laioxy.github.io/wondermail/) per la tabella giapponese, il glitch dell'uovo e quello per sbloccare i dungeon
- la [guida alle Wonder Mail S di Sonictrainer](https://gamefaqs.gamespot.com/ds/955859-pokemon-mystery-dungeon-explorers-of-sky/faqs/58573)
  su GameFAQs, con i testi delle missioni ufficiali usati per controllare titoli e descrizioni
- la [wiki Grovyle](https://wiki.grovyle.net/pokedun3/) per i Memo tesoro reali
- [Pokémon Central Wiki](https://wiki.pokemoncentral.it/) per i nomi italiani delle forme alternative
- [PMDCollab SpriteCollab](https://sprites.pmdcollab.org/) per i ritratti (di Spike Chunsoft e degli artisti
  della community, CC BY-NC 4.0), che vengono caricati da GitHub e non sono inclusi qui
- la [wiki di PMDO](https://wiki.pmdo.pmdcollab.org/) e i file di [PMDO](https://github.com/audinowho/DumpAsset)
  per le icone degli strumenti
- [Pixelify Sans](https://github.com/eifetx/Pixelify-Sans) per il carattere dei titoli (SIL Open Font License; qui con il 5 ridisegnato, perché sembrava una S)

Ho sviluppato il progetto insieme a Claude.

## Licenza

Il codice è rilasciato con licenza MIT, il testo completo è in [LICENSE](LICENSE). La licenza non copre i testi
e i dati del gioco in `data/`, che restano dei rispettivi proprietari, né le risorse di altri elencate qui
sopra, che hanno le loro licenze. Il codice di partenza di wondermail_pdm è stato pubblicato da RedCoal27 senza
una licenza esplicita; il generatore di Wonder Mail S da cui derivano entrambi i progetti è di pubblico dominio.

*Pokémon Mystery Dungeon: Esploratori del Cielo* © Nintendo, Creatures, GAME FREAK, Spike Chunsoft. È un
progetto amatoriale, senza scopo di lucro e non affiliato ai titolari dei diritti.
