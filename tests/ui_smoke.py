#!/usr/bin/env python3
"""Prova della pagina in un browser vero (Chromium senza finestra).

Richiede Playwright:  pip install playwright  &&  python -m playwright install chromium
Uso:                  python tests/ui_smoke.py [--screenshot cartella]
"""
from __future__ import annotations

import argparse
import functools
import http.server
import json
import socketserver
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
JP_CODES = json.loads((ROOT / "tests" / "fixtures" / "codici_memo_giapponesi.json").read_text(encoding="utf-8"))
# Memo tesoro al piano 1 della Grotta Marina con la stanza 81 (fondo di Isola Zero Nord): la stanza non ha
# il tesoro della missione, quindi la missione non si completa e si può rifare per raccogliere i premi.
FARM_CODE = "=27YY RQ+4%WP CCCTTPTP21 P#%33FM =+66N"

failures: list[str] = []


def check(condition: bool, message: str) -> None:
    print(("OK   " if condition else "FAIL ") + message)
    if not condition:
        failures.append(message)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class QuietServer(socketserver.ThreadingTCPServer):
    daemon_threads = True

    def handle_error(self, request, client_address):
        # Il browser chiude le connessioni a metà quando termina: non è un errore della pagina.
        if not isinstance(sys.exc_info()[1], (BrokenPipeError, ConnectionResetError)):
            super().handle_error(request, client_address)


def serve() -> tuple[socketserver.TCPServer, str]:
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = QuietServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_address[1]}/index.html"


def open_tool_card(page, card_id: str) -> None:
    """Apre un pannello della barra «Parti da» (Leggi una password, Accesso rapido, ...)."""
    if page.evaluate(f"document.getElementById('{card_id}').hidden"):
        page.click(f"#tab-{card_id}")
        page.wait_for_timeout(80)


def panel_open(page, card_id: str) -> bool:
    return not page.evaluate(f"document.getElementById('{card_id}').hidden")


def set_select(page, element_id: str, value) -> None:
    page.evaluate(
        """([id, value]) => {
            const select = document.getElementById(id);
            select.value = String(value);
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }""",
        [element_id, value],
    )


def set_input(page, element_id: str, value) -> None:
    page.evaluate(
        """([id, value]) => {
            const input = document.getElementById(id);
            input.value = String(value);
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }""",
        [element_id, value],
    )


def decode_output(page, region: str):
    return page.evaluate(
        """(region) => {
            const code = document.getElementById('compactOutput').value;
            const result = WMSParser.decodeWithRegion(code, region);
            return result && { crcOk: result.crcOk, struct: result.struct, code };
        }""",
        region,
    )


def generate(page):
    page.evaluate("generateCode()")
    return page.input_value("#outputbox"), page.text_content("#statusLine")


def rooms_generated(page, times: int = 15) -> set[int]:
    rooms = set()
    for _ in range(times):
        generate(page)
        rooms.add(decode_output(page, "eu")["struct"]["specialFloor"])
    return rooms


def run(url: str, screenshot_dir: Path | None, offline: bool) -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        if offline:
            context.route("**/*", lambda route: route.continue_() if route.request.url.startswith("http://127.0.0.1") else route.abort())
        page = context.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" and "net::" not in message.text else None)

        page.goto(url, wait_until="load")
        page.wait_for_timeout(800)
        label = " (senza rete)" if offline else ""

        # Avvio in inglese, poi si passa all'italiano per il resto dei controlli
        check(page.evaluate("document.documentElement.lang") == "en", f"lingua predefinita inglese{label}")
        check("Wonder Mail S" in page.title(), f"titolo inglese all'avvio: {page.title()}")
        page.evaluate("applyLanguage('it')")
        check(page.evaluate("document.documentElement.lang") == "it", f"passaggio all'italiano{label}")
        check("Missioni Speciali C" in page.title(), f"titolo italiano: {page.title()}")
        check(page.is_visible("#repoLink") and "Quaolo/wondermail-it" in (page.get_attribute("#repoLink", "href") or ""),
              "pulsante del repository verso Quaolo/wondermail-it")
        check("wondermail_pdm" in page.inner_html(".origin"), "riferimento al progetto originale in fondo alla pagina")
        check(not any(panel_open(page, p) for p in ("readerCard", "presetsCard", "farmCard", "unlockCard")),
              "i pannelli di «Parti da» partono chiusi")
        check(page.evaluate("document.getElementById('startBar').getBoundingClientRect().bottom <= document.querySelector('.form-panel').getBoundingClientRect().top"),
              "la barra «Parti da» sta sopra al modulo")
        check(page.evaluate("getComputedStyle(document.querySelector('.side-panel')).position") == "sticky",
              "la colonna del risultato resta sullo schermo")
        check(page.evaluate("getComputedStyle(document.querySelector('.side-panel')).overflowY") == "visible",
              "la colonna del risultato non ha una barra di scorrimento propria")
        check(page.evaluate("!!document.querySelector('.work-main #roomCard') && !document.querySelector('.side-panel #roomCard')"),
              "la stanza sta sotto al modulo, non nella colonna del risultato")
        check(page.evaluate("!!document.querySelector('.masthead #regionBox')"), "la versione del gioco sta in testata")
        tall = page.evaluate("document.querySelector('.form-panel').getBoundingClientRect().height")
        open_tool_card(page, "farmCard")
        open_tool_card(page, "presetsCard")
        check(not panel_open(page, "farmCard") and panel_open(page, "presetsCard"), "un solo pannello aperto alla volta")
        check(abs(page.evaluate("document.querySelector('.form-panel').getBoundingClientRect().height") - tall) < 2,
              "aprire un pannello non allunga il modulo")
        page.click("#tab-presetsCard")
        check(not panel_open(page, "presetsCard"), "cliccando di nuovo la scheda il pannello si chiude")
        page.evaluate("document.getElementById('variantsBox').open = true")
        if not offline:
            before_team = page.evaluate("[...document.querySelectorAll('#heroTeam img')].map(i => i.dataset.monId)")
            page.click("#heroTeam")
            page.wait_for_timeout(150)
            after_team = page.evaluate("[...document.querySelectorAll('#heroTeam img')].map(i => i.dataset.monId)")
            check(len(before_team) == 4 and before_team != after_team, f"la squadra cambia al clic: {before_team} -> {after_team}")

        open_tool_card(page, "readerCard")
        check(page.is_visible("#importCode"), "la scheda «Leggi una password» si apre al clic")
        set_input(page, "floor", 2)
        page.wait_for_timeout(120)
        check(not panel_open(page, "readerCard"),
              "compilando la missione a mano il pannello si richiude")
        set_input(page, "floor", 1)
        code, status = generate(page)
        check(code.count("\n") == 1 and len(code.replace("\n", "").replace(" ", "")) == 34, f"password generata subito: {code!r}")
        check("Europa" in status, f"stato: {status!r}")
        decoded = decode_output(page, "eu")
        check(bool(decoded and decoded["crcOk"]), "la password generata supera il controllo CRC (EU)")
        check(page.evaluate("getItemName(109)") == "Mela", "nomi ufficiali italiani (Mela)")
        check(page.evaluate("getDungeonName(1)") == "Grotta Marina", "dungeon ufficiali italiani (Grotta Marina)")
        check(page.text_content("#jobTitle") == "Info missione", "anteprima con le frasi ufficiali (Info missione)")

        # Arbok resta Arbok (prima diventava Nidoran♂)
        set_select(page, "missionTypeBox", 0)
        set_select(page, "clientBox", 24)
        generate(page)
        decoded = decode_output(page, "eu")
        check(decoded["struct"]["client"] == 24, f"Arbok maschio codificato come 24 (ottenuto {decoded['struct']['client']})")
        page.check("#clientF")
        page.dispatch_event("#clientF", "change")
        generate(page)
        check(decode_output(page, "eu")["struct"]["client"] == 624, "Arbok femmina codificato come 624")
        check(page.text_content("#jobObjective") == "Soccorri Arbok ♀.", f"obiettivo ufficiale: {page.text_content('#jobObjective')!r}")

        # Piani e difficoltà dalle tabelle del gioco: Giungla del Mistero arriva al piano 29 (★7)
        set_select(page, "dungeonBox", 85)
        page.wait_for_timeout(120)
        check("da 1 a 29" in page.text_content("#floorLimitHint"), f"piani della Giungla del Mistero: {page.text_content('#floorLimitHint')!r}")
        set_input(page, "floor", 29)
        page.wait_for_timeout(120)
        difficulty = page.text_content("#missionDifficultyHint")
        check("★7" in difficulty and "1200" in difficulty, f"difficoltà dell'ultimo piano: {difficulty!r}")
        set_select(page, "dungeonBox", 1)
        set_input(page, "floor", 1)

        # Chansey non ha forma femminile separata: casella disattivata
        set_select(page, "clientBox", 113)
        check(page.is_disabled("#clientF"), "casella Femmina disattivata per Chansey")

        # Pokémon ammessi come nel gioco (IsMissionValid): Nidoqueen e Treecko sì, Grovyle solo come bersaglio
        def options(select_id):
            return page.evaluate(f"[...document.getElementById('{select_id}').options].map(o => +o.value)")
        clients = options("clientBox")
        check(31 in clients and 280 in clients and 281 not in clients, "committenti dal gioco: Nidoqueen e Treecko sì, Grovyle no")
        check(281 in options("targetBox"), "Grovyle può essere il bersaglio")
        set_select(page, "missionTypeBox", 2)
        check(95 not in options("clientBox") and 280 in options("clientBox"), "Onix non può unirsi alla squadra (taglia)")
        set_select(page, "missionTypeBox", 0)
        check(page.evaluate("[getPortraitPath(29), getPortraitPath(32)]") == ["0029", "0032"], "ritratti di Nidoran♀ e Nidoran♂")

        # Lettera di sfida normale: il secondo Pokémon arriva nel codice, la stanza è tra 150 e 154
        set_select(page, "missionTypeBox", 12)
        set_select(page, "missionSubTypeBox", 0)
        set_select(page, "clientBox", 6)
        set_select(page, "targetBox", 9)
        set_select(page, "target2Box", 3)
        generate(page)
        struct = decode_output(page, "eu")["struct"]
        check((struct["client"], struct["target"], struct["target2"]) == (6, 9, 3),
              f"Charizard/Blastoise/Venusaur nel codice: {(struct['client'], struct['target'], struct['target2'])}")
        rooms = rooms_generated(page)
        check(rooms <= set(range(150, 155)), f"stanze delle Lettere di sfida dal gioco (150-154): {sorted(rooms)}")
        check(page.is_visible("#roomCard") and page.locator("#roomMap .mark-boss .cell-portrait").count() == 1,
              "mappa della sfida con il ritratto dello sfidante")

        # Covo del ricercato: stanze 160-164
        set_select(page, "missionTypeBox", 10)
        set_select(page, "missionSubTypeBox", 2)
        rooms = rooms_generated(page)
        check(rooms <= set(range(160, 165)), f"stanze dei covi dal gioco (160-164): {sorted(rooms)}")
        check(page.locator("#roomPicker .room-option").count() == 6, "scelta tra «A caso» e 5 covi")

        # Valori fuori dai limiti: errore invece di un codice sbagliato
        set_select(page, "missionTypeBox", 0)
        page.evaluate("document.getElementById('advancedOptionsPanel').open = true")
        set_input(page, "specialFloor", 300)
        code, status = generate(page)
        check("255" in code and page.input_value("#compactOutput") == "", f"stanza 300 rifiutata: {code!r}")
        check("non valida" in page.text_content("#jobObjective").lower(), "anteprima segnala la combinazione non valida")
        set_input(page, "specialFloor", "")
        set_select(page, "dungeonBox", 1)
        set_input(page, "floor", 50)
        generate(page)
        check(page.input_value("#floor") == "4" and decode_output(page, "eu")["struct"]["floor"] == 4,
              "piano 50 in Grotta Marina riportato a 4 (ultimo piano)")
        page.evaluate("document.getElementById('floor').value = 'abc'")
        code, _ = generate(page)
        check("da 1 a 4" in code, f"piano non numerico rifiutato: {code!r}")
        set_input(page, "floor", 2)

        # Preset: glitch dell'uovo (ricetta di Lai-brary)
        open_tool_card(page, "presetsCard")
        page.click('.preset-btn[data-preset="egg"]')
        set_select(page, "eggPokemonBox", 25)
        generate(page)
        struct = decode_output(page, "eu")["struct"]
        recipe = {k: struct[k] for k in ("missionType", "rewardType", "reward", "client", "target", "dungeon", "floor", "targetItem", "specialFloor")}
        check(recipe == {"missionType": 6, "rewardType": 5, "reward": 25, "client": 286, "target": 286,
                         "dungeon": 91, "floor": 0, "targetItem": 92, "specialFloor": 0}, f"ricetta dell'uovo di Pikachu: {recipe}")

        # Serie di missioni: con l'uovo no, con un Memo tesoro sì
        page.click("#seriesSeeds")
        check("una alla volta" in page.text_content("#seriesStatus") and page.is_hidden("#seriesResult"),
              "niente serie per la missione uovo")
        page.evaluate("useFarmCombo(81, 1)")
        page.wait_for_timeout(100)
        base = decode_output(page, "eu")["struct"]
        page.click("#seriesFloors")
        series = page.evaluate("""() => missionSeries.entries.map((e) => {
            const r = WMSParser.decodeWithRegion(e.pretty, 'eu');
            return r && r.crcOk ? r.struct : null;
        })""")
        floors = [s and s["floor"] for s in series]
        check(floors == [1, 2, 3, 4], f"serie di piani in Grotta Marina fino all'ultimo piano: {floors}")
        check("solo 4 piani" in page.text_content("#seriesStatus"), "avviso quando i piani finiscono prima di 8")
        same = all(s and all(s[k] == base[k] for k in base if k not in ("floor", "checksum")) for s in series)
        check(same, "nella serie di piani cambia solo il piano (stanza 81 compresa)")
        page.click("#seriesSeeds")
        series = page.evaluate("""() => missionSeries.entries.map((e) => {
            const r = WMSParser.decodeWithRegion(e.pretty, 'eu');
            return r && r.crcOk ? r.struct : null;
        })""")
        seeds = {s and s["flavorText"] for s in series}
        check(len(series) == 8 and len(seeds) == 8 and series[0]["flavorText"] == base["flavorText"],
              f"serie di 8 missioni con semi tutti diversi ({len(seeds)})")
        check(all(s["floor"] == base["floor"] and s["specialFloor"] == 81 for s in series), "nella serie di semi resta tutto il resto")
        check(page.locator("#seriesList li").count() == 8, "otto righe nella serie")
        page.evaluate("applyLanguage('en')")
        check(page.text_content("#seriesList li .series-tag").startswith("Seed "), "etichette della serie tradotte")
        page.evaluate("applyLanguage('it')")
        set_input(page, "floor", 2)
        generate(page)
        check(page.is_hidden("#seriesResult"), "la serie sparisce quando cambia la password")

        # Origine del modulo e Annulla
        set_select(page, "missionTypeBox", 0)
        set_select(page, "dungeonBox", 1)
        set_input(page, "floor", 3)
        generate(page)
        before_code = page.input_value("#compactOutput")
        open_tool_card(page, "presetsCard")
        page.click('.preset-btn[data-preset="memo"]')
        page.wait_for_timeout(250)
        origin = page.text_content("#originText")
        check(page.is_visible("#originBar") and "Memo tesoro" in origin and "cambiat" in origin,
              f"la riga dell'origine dice da dove viene il modulo: {origin!r}")
        check(page.evaluate("lastHighlightCount") > 0, "i campi cambiati si evidenziano")
        page.click("#originUndo")
        page.wait_for_timeout(250)
        check(page.input_value("#compactOutput") == before_code and page.is_hidden("#originBar"),
              "«Annulla» riporta la password di prima")
        page.click('.preset-btn[data-preset="memo"]')
        page.wait_for_timeout(200)
        set_input(page, "floor", 2)
        page.wait_for_timeout(150)
        check("a mano" in page.text_content("#originText") and page.is_hidden("#originUndo"),
              "dopo una modifica a mano l'origine lo dice e «Annulla» sparisce")
        page.click("#originChange")
        page.wait_for_timeout(100)
        check(panel_open(page, "presetsCard"), "«Cambia» riapre il pannello da cui si era partiti")
        page.click("#originClose")
        check(page.is_hidden("#originBar"), "la riga dell'origine si può chiudere")

        # Sblocca un dungeon: ricetta di Lai-brary (Lettera di sfida di Jirachi, piano 0, stanza 149)
        open_tool_card(page, "unlockCard")
        set_select(page, "unlockDungeonBox", 67)
        unlock = page.evaluate("""() => {
            const r = WMSParser.decodeWithRegion(document.getElementById('unlockOutput').value, 'eu');
            return r && r.crcOk ? r.struct : null;
        }""")
        recipe = unlock and {k: unlock[k] for k in ("missionType", "missionSpecial", "client", "target", "target2", "rewardType",
                                                   "reward", "targetItem", "dungeon", "floor", "specialFloor", "restriction")}
        check(recipe == {"missionType": 11, "missionSpecial": 5, "client": 417, "target": 417, "target2": 0, "rewardType": 6,
                         "reward": 417, "targetItem": 70, "dungeon": 67, "floor": 0, "specialFloor": 149, "restriction": 0},
              f"password per sbloccare il Cratere Oscuro: {recipe}")
        check("Cratere Oscuro" in page.text_content("#unlockStatus"), "stato della scheda con il nome del dungeon")
        ids = page.evaluate("getUnlockDungeonIds()")
        check(1 in ids and 122 in ids and 0 not in ids and 105 not in ids and max(ids) == 122,
              f"elenco dei dungeon da sbloccare: {len(ids)} voci, niente dungeon di prova né senza nome")
        set_select(page, "unlockDungeonBox", 63)
        check(page.is_visible("#unlockNote"), "avviso per L'Incubo")
        set_select(page, "unlockDungeonBox", 67)
        check(page.is_hidden("#unlockNote"), "nessun avviso per il Cratere Oscuro")
        set_select(page, "regionBox", "na")
        na_code = page.input_value("#unlockOutput")
        na = page.evaluate("(c) => { const r = WMSParser.decodeWithRegion(c, 'na'); return r && r.crcOk ? r.struct.dungeon : null; }", na_code)
        check(na == 67, "cambiando regione la password si rifà per l'America")
        set_select(page, "regionBox", "eu")
        eu_code = page.input_value("#unlockOutput")
        page.evaluate("closeStartPanels()")
        open_tool_card(page, "readerCard")
        page.fill("#importCode", eu_code)
        page.click("#importCodeBtn")
        check("Cratere Oscuro" in page.text_content("#importStatus") and panel_open(page, "unlockCard"),
              "una password di sblocco letta apre la sua scheda")

        # Preset di Mewtwo: la password si aggiorna da sola
        open_tool_card(page, "presetsCard")
        page.click('.preset-btn[data-preset="mewtwo"]')
        page.wait_for_timeout(150)
        struct = decode_output(page, "eu")["struct"]
        check((struct["missionType"], struct["missionSpecial"], struct["client"], struct["specialFloor"]) == (11, 1, 150, 145),
              f"Lettera di sfida di Mewtwo senza premere Genera: {(struct['missionType'], struct['missionSpecial'], struct['client'], struct['specialFloor'])}")
        check("Mewtwo" in page.text_content('.preset-btn[data-preset="mewtwo"]'), "etichetta del preset con il nome del boss")
        check(page.text_content("#jobObjective") == "Sconfiggi Mewtwo.", f"obiettivo: {page.text_content('#jobObjective')!r}")
        cells = page.locator("#roomMap .cell").count()
        expected = page.evaluate("(() => { const r = WMSkyRooms.getRoom(145); return r.map.length * r.map[0].length; })()")
        check(cells == expected, f"mappa della stanza 145 disegnata dai dati del gioco ({cells} caselle)")

        # Lettura di una password giapponese
        open_tool_card(page, "readerCard")
        page.fill("#importCode", JP_CODES[0])
        page.click("#importCodeBtn")
        status = page.text_content("#importStatus")
        check("Giappone" in status, f"password JP riconosciuta: {status!r}")
        check(page.input_value("#regionBox") == "jp", "regione impostata su Giappone")
        check(page.evaluate("document.getElementById('missionTypeBox').value") == "13", "missione Memo tesoro riconosciuta")
        synced = page.evaluate("""() => {
            const pairs = [['clientSearch', 'clientBox'], ['rewardItemSearch', 'rewardItemBox'], ['dungeonSearch', 'dungeonBox'], ['targetItemSearch', 'targetItemBox']];
            return pairs.every(([input, select]) => {
                const box = document.getElementById(select);
                return document.getElementById(input).value === box.options[box.selectedIndex].text;
            });
        }""")
        check(synced, "i campi di ricerca mostrano i valori letti dalla password")
        check("Stanza 115" in page.text_content("#roomTitle"), f"stanza della password letta: {page.text_content('#roomTitle')!r}")
        open_tool_card(page, "readerCard")
        page.fill("#importCode", "AAAA BBBB CCCC")
        page.click("#importCodeBtn")
        check("non valida" in page.text_content("#importStatus"), "password inventata rifiutata")

        # Memo tesoro: committente libero, tesoro scelto, 30 stanze, esempio reale convertito
        set_select(page, "regionBox", "eu")
        open_tool_card(page, "presetsCard")
        page.click('.preset-btn[data-preset="memo"]')
        page.wait_for_timeout(150)
        check(page.locator("#roomPicker > .room-option").count() == 31, "scelta tra «A caso» e 30 stanze dei Memo tesoro")
        check(page.locator("#roomPicker .room-extra .room-option").count() == 27, "27 stanze senza tesoro in un gruppo a parte")
        page.evaluate("pickRoom('115')")
        page.wait_for_timeout(150)
        struct = decode_output(page, "eu")["struct"]
        check(struct["targetItem"] == 136 and struct["client"] == struct["target"] and struct["client"] != 422,
              f"Memo tesoro come quelli veri (tesoro {struct['targetItem']}, committente {struct['client']})")
        example = page.text_content("#roomExampleCode") or ""
        converted = page.evaluate("(c) => { const r = WMSParser.decode(c); return r && { region: r.region, room: r.struct.specialFloor }; }", example)
        check(converted == {"region": "eu", "room": 115}, f"esempio della stanza 115 convertito in EU: {converted}")
        page.evaluate("pickRoom('116')")
        page.wait_for_timeout(150)
        legend = page.text_content("#roomLegend")
        check("Rafficotrappola" in legend and "Tecalusso con Gommaincanto" in legend, f"legenda con i nomi ufficiali: {legend[:80]!r}")

        if screenshot_dir:
            page.evaluate("document.getElementById('roomCard').scrollIntoView()")
            page.screenshot(path=str(screenshot_dir / f"memo_it{'_offline' if offline else ''}.png"), full_page=False)

        # Codice "da farm" (stanza 81, senza tesoro) e missioni simili
        open_tool_card(page, "readerCard")
        page.fill("#importCode", FARM_CODE)
        page.click("#importCodeBtn")
        page.wait_for_timeout(150)
        check("Europa" in page.text_content("#importStatus"), "codice da farm letto (EU)")
        title = page.text_content("#roomTitle")
        check(title == "Stanza 81 · fondo di Isola Zero Nord", f"stanza 81 riconosciuta: {title!r}")
        check(page.text_content("#roomBadge") == "Si può ripetere", "stanza senza tesoro segnalata come ripetibile")
        legend = page.text_content("#roomLegend")
        check("Mascheradoro" in legend and "Gommaincanto × 2" in legend, f"premi della stanza 81 in legenda: {legend!r}")
        check(page.locator("#roomPicker .room-extra[open] .room-option.active").count() == 1,
              "stanza 81 evidenziata tra le stanze senza tesoro")
        check("non c'è in questa stanza" in page.text_content("#jobFields"), "l'anteprima avvisa che il tesoro non c'è")
        check(page.is_hidden("#roomBoxes"), "stanza 81 senza Tecalusso: niente tabella dei dungeon")

        # Stanza 92 (6 Tecalusso): il contenuto dipende dal dungeon, che si sceglie dalla tabella
        seed = decode_output(page, "eu")["struct"]["flavorText"]
        page.evaluate("pickRoom('92')")
        page.wait_for_timeout(150)
        check(page.is_visible("#roomBoxes"), "stanza 92: tabella del contenuto dei Tecalusso per dungeon")
        page.click("#roomBoxes summary")
        page.click('#roomBoxes .chip[data-dungeon="72"]')
        page.wait_for_timeout(150)
        struct = decode_output(page, "eu")["struct"]
        check((struct["dungeon"], struct["specialFloor"], struct["flavorText"]) == (72, 92, seed),
              f"dungeon scelto dalla tabella, stessa stanza e stesso seme: {(struct['dungeon'], struct['specialFloor'])}")
        facts = page.text_content("#roomFacts")
        check("Riserva Marina contengono uno a caso tra Gommabianca" in facts, f"contenuto dei Tecalusso in Riserva Marina: {facts[:90]!r}")
        page.evaluate("pickRoom('81')")
        page.wait_for_timeout(150)
        before = decode_output(page, "eu")["struct"]
        page.click("#similarNextFloor")
        page.wait_for_timeout(150)
        after = decode_output(page, "eu")["struct"]
        changed = sorted(key for key in before if key != "checksum" and before[key] != after[key])
        check(changed == ["floor"] and after["floor"] == 2, f"«Piano successivo» cambia solo il piano: {changed}, piano {after['floor']}")
        page.click("#similarNewSeed")
        page.wait_for_timeout(150)
        seeded = decode_output(page, "eu")["struct"]
        changed = sorted(key for key in after if key != "checksum" and after[key] != seeded[key])
        check(changed == ["flavorText"], f"«Nuovo seme» cambia solo il seme: {changed}")
        # Piani che il gioco rifiuta (IsForbiddenFloor): l'ultimo piano della Riserva Marina è uno di questi
        check(page.evaluate("WMSGen.getForbiddenFloors(72)").__contains__(19), "piano 19 della Riserva Marina vietato")
        check("piani 19" in page.text_content("#floorLimitHint"), f"avviso sui piani vietati: {page.text_content('#floorLimitHint')!r}")
        set_input(page, "floor", 19)
        page.evaluate("generateCode()")
        page.wait_for_timeout(150)
        check("non accetta" in page.input_value("#outputbox"), f"piano vietato rifiutato: {page.input_value('#outputbox')!r}")

        set_select(page, "dungeonBox", 1)
        last = page.evaluate("getDungeonFloorLimit(document.getElementById('dungeonBox').value)")
        set_input(page, "floor", last)
        page.evaluate("generateCode()")
        page.click("#similarNextFloor")
        page.wait_for_timeout(100)
        check(decode_output(page, "eu")["struct"]["floor"] == last and "piano successivo" in page.text_content("#statusLine"),
              f"all'ultimo piano ({last}) non si va oltre: {page.text_content('#statusLine')!r}")

        # Ricerca inversa dei premi: scelgo la Gommaincanto e uso la combinazione suggerita
        open_tool_card(page, "farmCard")
        set_select(page, "farmRewardBox", 136)
        page.wait_for_timeout(150)
        rows = page.eval_on_selector_all("#farmResults .farm-row-title", "els => els.map(e => e.textContent)")
        check(any("81" in row for row in rows) and any("92" in row for row in rows),
              f"premi della Gommaincanto: stanza 81 sul pavimento e stanza 92 nei Tecalusso: {rows}")
        page.locator("#farmResults .farm-row").nth(1).locator(".chip").first.click()
        page.wait_for_timeout(300)
        check(page.input_value("#specialFloor") == "92" and page.evaluate("document.getElementById('missionTypeBox').value") == "13",
              f"la combinazione imposta Memo tesoro nella stanza 92: {page.input_value('#specialFloor')}")
        struct = decode_output(page, "eu")["struct"]
        check(struct["specialFloor"] == 92 and struct["missionType"] == 12,
              f"password della missione da ripetere: {struct['specialFloor']}, tipo {struct['missionType']}")

        # Stanza segreta (113): contenuto dei Tecalusso per dungeon e piano
        secret_item = page.evaluate("""() => {
            const lists = WMSkyFixedRooms.secretRoom.lists;
            const elsewhere = new Set(Object.values(WMSkyFixedRooms.boxes.byDungeon).flat());
            const hit = lists.flat().find(([item]) => !elsewhere.has(item) && item !== WMSkyFixedRooms.boxes.fallback);
            return hit[0];
        }""")
        check(not panel_open(page, "farmCard"), "scelta la combinazione il pannello si richiude")
        open_tool_card(page, "farmCard")
        set_select(page, "farmRewardBox", secret_item)
        page.wait_for_timeout(150)
        rows = page.eval_on_selector_all("#farmResults .farm-row-title", "els => els.map(e => e.textContent)")
        check(any("stanza segreta 113" in row for row in rows), f"premio della stanza segreta (strumento {secret_item}): {rows}")
        page.locator("#farmResults .farm-row").last.locator(".chip").first.click()
        page.wait_for_timeout(300)
        struct = decode_output(page, "eu")["struct"]
        check(struct["specialFloor"] == 113 and struct["floor"] >= 1, f"missione nella stanza 113 al piano suggerito: {struct['floor']}")
        facts = page.text_content("#roomFacts")
        check(f"piano {struct['floor']}" in facts and "%" in facts, f"la scheda della stanza 113 dice cosa c'è nei Tecalusso: {facts[:160]!r}")

        # Strumenti divisi per categoria
        page.click("#rewardItemSearch")
        page.wait_for_timeout(100)
        headers = page.eval_on_selector_all("#rewardItemField .search-group", "els => els.map(e => e.textContent)")
        first = page.evaluate("document.querySelector('#rewardItemField .search-suggestions').firstElementChild.textContent")
        check("Sfere" in headers and "MT (mosse)" in headers and "Nessuno" in first, f"strumenti divisi per categoria: {headers}")
        page.keyboard.press("Escape")

        # Ricerca con il nome inglese
        results = page.evaluate("getSearchSuggestions(document.getElementById('rewardItemBox'), 'oran').map(s => s.text)")
        check("Baccarancia" in results, f"cercando 'oran' si trova Baccarancia: {results[:5]}")

        # Accessi rapidi a caso: ogni clic dà una missione nuova e sempre valida
        open_tool_card(page, "presetsCard")
        codes = set()
        for _ in range(5):
            page.click('.preset-btn[data-preset="standard"]')
            page.wait_for_timeout(120)
            check(page.evaluate("WMSGen.verify().length") == 0, "missione normale a caso valida")
            check(page.input_value("#specialFloor") == "", "il preset azzera la stanza speciale")
            check(page.is_hidden("#roomCard"), "nessuna stanza per le missioni normali")
            codes.add(page.input_value("#compactOutput"))
        check(len(codes) >= 4, f"ogni clic dà una missione diversa: {len(codes)} su 5")
        for _ in range(3):
            page.click('.preset-btn[data-preset="outlaw"]')
            page.wait_for_timeout(120)
            struct = decode_output(page, "eu")["struct"]
            check(struct["missionType"] == 10 and page.evaluate("WMSGen.verify().length") == 0,
                  f"ricercato a caso: tipo {struct['missionType']}")
        for _ in range(3):
            page.click('.preset-btn[data-preset="surprise"]')
            page.wait_for_timeout(120)
            check(page.evaluate("WMSGen.verify().length") == 0, "missione a sorpresa valida")
        eggs = set()
        for _ in range(4):
            page.click('.preset-btn[data-preset="egg"]')
            page.wait_for_timeout(120)
            eggs.add(page.evaluate("document.getElementById('eggPokemonBox').value"))
        check(len(eggs) >= 3, f"l'uovo cambia specie a ogni clic: {len(eggs)} su 4")
        page.click('.preset-btn[data-preset="standard"]')
        page.wait_for_timeout(120)

        if screenshot_dir:
            page.evaluate("window.scrollTo(0, 0)")
            page.screenshot(path=str(screenshot_dir / f"pagina_it{'_offline' if offline else ''}.png"), full_page=True)

        # Schermo di un telefono: niente scorrimento orizzontale
        page.set_viewport_size({"width": 360, "height": 800})
        open_tool_card(page, "presetsCard")
        page.click('.preset-btn[data-preset="memo"]')
        page.wait_for_timeout(200)
        # Su telefono: «Parti da», poi il modulo, poi il risultato; la password resta in fondo allo schermo
        tops = page.evaluate("""Object.fromEntries(['startBar', 'genForm', 'jobCard', 'resultCard', 'roomCard']
            .map((id) => [id, Math.round(document.getElementById(id).getBoundingClientRect().top + window.scrollY)]))""")
        check(tops["startBar"] < tops["genForm"] < tops["jobCard"] < tops["resultCard"] < tops["roomCard"],
              f"su telefono l'ordine è Parti da, modulo, risultato: {tops}")
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(250)
        check(page.evaluate("getComputedStyle(document.getElementById('mobilePass')).opacity") == "1"
              and len(page.text_content("#mobilePassCode").replace(" ", "")) == 34,
              "su telefono la password è nella barra in fondo")
        page.click("#mobilePassShow")
        page.wait_for_timeout(700)
        check(page.evaluate("document.body.classList.contains('result-in-view')"), "«Dettagli» porta alla scheda della password")

        overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check(overflow <= 0, f"nessuno scorrimento orizzontale su telefono ({overflow}px)")
        page.set_viewport_size({"width": 1280, "height": 900})

        # Passaggio all'inglese
        page.evaluate("applyLanguage('en')")
        check(page.evaluate("document.documentElement.lang") == "en", "lingua inglese")
        check(page.evaluate("getItemName(109)") == "Apple", "nomi ufficiali inglesi (Apple)")
        check("Wonder Mail S" in page.title(), f"titolo inglese: {page.title()}")
        check(page.evaluate("document.querySelector('[data-i18n=\"missionSection\"]').textContent") == "Mission", "testi statici in inglese")
        check(page.text_content("#jobTitle") == "Job Summary", "anteprima con le frasi ufficiali inglesi")
        if screenshot_dir:
            page.evaluate("window.scrollTo(0, 0)")
            page.screenshot(path=str(screenshot_dir / "pagina_en.png"), full_page=False)
        page.evaluate("applyLanguage('it')")

        check(not errors, f"nessun errore JavaScript{label}: {errors[:3]}")
        browser.close()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--screenshot", type=Path)
    args = parser.parse_args()
    if args.screenshot:
        args.screenshot.mkdir(parents=True, exist_ok=True)
    server, url = serve()
    try:
        run(url, args.screenshot, offline=False)
        run(url, args.screenshot, offline=True)
    finally:
        server.shutdown()
    print(f"\n{len(failures)} controlli falliti" if failures else "\nTutti i controlli superati")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
