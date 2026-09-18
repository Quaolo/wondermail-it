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

failures: list[str] = []


def check(condition: bool, message: str) -> None:
    print(("OK   " if condition else "FAIL ") + message)
    if not condition:
        failures.append(message)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve() -> tuple[socketserver.TCPServer, str]:
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_address[1]}/index.html"


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

        # Avvio in italiano
        check(page.evaluate("document.documentElement.lang") == "it", f"lingua predefinita italiana{label}")
        check("Missioni Speciali C" in page.title(), f"titolo italiano: {page.title()}")
        code, status = generate(page)
        check(code.count("\n") == 1 and len(code.replace("\n", "").replace(" ", "")) == 34, f"password generata subito: {code!r}")
        check("Europa" in status, f"stato: {status!r}")
        decoded = decode_output(page, "eu")
        check(bool(decoded and decoded["crcOk"]), "la password generata supera il controllo CRC (EU)")
        check(page.evaluate("getItemName(109)") == "Mela", "nomi ufficiali italiani (Mela)")
        check(page.evaluate("getDungeonName(1)") == "Grotta Marina", "dungeon ufficiali italiani (Grotta Marina)")

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

        # Chansey non ha forma femminile separata: casella disattivata
        set_select(page, "clientBox", 113)
        check(page.is_disabled("#clientF"), "casella Femmina disattivata per Chansey")

        # Lettera di sfida normale: il secondo Pokémon ora arriva nel codice
        set_select(page, "missionTypeBox", 12)
        set_select(page, "missionSubTypeBox", 0)
        set_select(page, "clientBox", 6)
        set_select(page, "targetBox", 9)
        set_select(page, "target2Box", 3)
        generate(page)
        struct = decode_output(page, "eu")["struct"]
        check((struct["client"], struct["target"], struct["target2"]) == (6, 9, 3),
              f"Charizard/Blastoise/Venusaur nel codice: {(struct['client'], struct['target'], struct['target2'])}")

        # Valori fuori dai limiti: errore invece di un codice sbagliato
        set_select(page, "missionTypeBox", 0)
        page.evaluate("document.getElementById('advancedOptionsPanel').open = true")
        set_input(page, "specialFloor", 300)
        code, status = generate(page)
        check("255" in code and page.input_value("#compactOutput") == "", f"stanza 300 rifiutata: {code!r}")
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

        # Preset: glitch dell'uovo (ricetta di Lai-brary) e Lettera di sfida di Mewtwo
        page.click('.preset-btn[data-preset="egg"]')
        set_select(page, "eggPokemonBox", 25)
        generate(page)
        struct = decode_output(page, "eu")["struct"]
        recipe = {k: struct[k] for k in ("missionType", "rewardType", "reward", "client", "target", "dungeon", "floor", "targetItem", "specialFloor")}
        check(recipe == {"missionType": 6, "rewardType": 5, "reward": 25, "client": 286, "target": 286,
                         "dungeon": 91, "floor": 0, "targetItem": 92, "specialFloor": 0}, f"ricetta dell'uovo di Pikachu: {recipe}")
        page.click('.preset-btn[data-preset="mewtwo"]')
        generate(page)
        struct = decode_output(page, "eu")["struct"]
        check((struct["missionType"], struct["missionSpecial"], struct["client"], struct["specialFloor"]) == (11, 1, 150, 145),
              f"Lettera di sfida di Mewtwo: {(struct['missionType'], struct['missionSpecial'], struct['client'], struct['specialFloor'])}")
        check("Mewtwo" in page.text_content('.preset-btn[data-preset="mewtwo"]'), "etichetta del preset con il nome del boss")

        # Lettura di una password giapponese
        page.fill("#importCode", JP_CODES[0])
        page.click("#importCodeBtn")
        status = page.text_content("#statusLine")
        check("Giappone" in status, f"password JP riconosciuta: {status!r}")
        check(page.input_value("#regionBox") == "jp", "regione impostata su Giappone")
        check(page.evaluate("document.getElementById('missionTypeBox').value") == "13", "missione Memo tesoro riconosciuta")
        synced = page.evaluate("""() => {
            const pairs = [['clientSearch', 'clientBox'], ['rewardItemSearch', 'rewardItemBox'], ['dungeonSearch', 'dungeonBox']];
            return pairs.every(([input, select]) => {
                const box = document.getElementById(select);
                return document.getElementById(input).value === box.options[box.selectedIndex].text;
            });
        }""")
        check(synced, "i campi di ricerca mostrano i valori letti dalla password")
        page.fill("#importCode", "AAAA BBBB CCCC")
        page.click("#importCodeBtn")
        check("non valida" in page.text_content("#statusLine"), "password inventata rifiutata")

        # Memo tesoro: esempio reale convertito per la regione scelta
        set_select(page, "regionBox", "eu")
        page.click('.preset-btn[data-preset="memo"]')
        page.evaluate("applyMemoPresetValue('115')")
        page.wait_for_timeout(100)
        example = page.text_content("#memoSpotlightCode") or ""
        converted = page.evaluate("(c) => { const r = WMSParser.decode(c); return r && { region: r.region, room: r.struct.specialFloor }; }", example)
        check(converted == {"region": "eu", "room": 115}, f"esempio della stanza 115 convertito in EU: {converted}")

        # Ricerca con il nome inglese
        page.click("#rewardItemSearch") if page.is_visible("#rewardItemSearch") else None
        results = page.evaluate("getSearchSuggestions(document.getElementById('rewardItemBox'), 'oran').map(s => s.text)")
        check("Baccarancia" in results, f"cercando 'oran' si trova Baccarancia: {results[:5]}")

        if screenshot_dir:
            page.evaluate("document.getElementById('memoVisuals').scrollIntoView()")
            page.screenshot(path=str(screenshot_dir / f"memo_it{'_offline' if offline else ''}.png"), full_page=False)

        page.click('.preset-btn[data-preset="standard"]')
        check(page.input_value("#specialFloor") == "", "il preset azzera la stanza speciale")

        if screenshot_dir:
            page.evaluate("window.scrollTo(0, 0)")
            page.screenshot(path=str(screenshot_dir / f"pagina_it{'_offline' if offline else ''}.png"), full_page=True)

        # Passaggio all'inglese
        page.evaluate("applyLanguage('en')")
        check(page.evaluate("document.documentElement.lang") == "en", "lingua inglese")
        check(page.evaluate("getItemName(109)") == "Apple", "nomi ufficiali inglesi (Apple)")
        check("Wonder Mail S" in page.title(), f"titolo inglese: {page.title()}")
        check(page.evaluate("document.querySelector('[data-i18n=\"missionSection\"]').textContent") == "Mission", "testi statici in inglese")
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
