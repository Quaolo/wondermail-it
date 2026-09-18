#!/usr/bin/env python3
"""Estrae i testi ufficiali di Pokémon Mystery Dungeon: Esploratori del Cielo (versione europea)
e genera i file di dati usati dall'app:

    data/testi_gioco_it.js   nomi e descrizioni in italiano
    data/testi_gioco_en.js   nomi e descrizioni in inglese (EU)
    data/dati_gioco.js       dati che non dipendono dalla lingua

La fonte sono i file MESSAGE/text_*.str e BALANCE/monster.md della decompilazione pret/pmd-sky
(https://github.com/pret/pmd-sky). Nessuna ROM richiesta.

Uso:
    python tools/estrai_testi.py                      # scarica i file necessari da GitHub (commit fissato)
    python tools/estrai_testi.py --pmd-sky ../pmd-sky # usa una copia locale del repo

Solo libreria standard di Python 3.9+.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = Path(__file__).resolve().parent / ".cache"

# Commit di pret/pmd-sky da cui sono stati estratti i dati inclusi nel progetto.
PMD_SKY_COMMIT = "a3d641227a8e61c887987f17a3d0b7fad6d8f671"
SOURCES = {
    "it": ("files/MESSAGE/text_i.str", "1bfb05b1b78750bc9c76188fa24845ef9c24d2f1"),
    "en": ("files/language-specific/EU/MESSAGE/text_e.str", "29ca4095afdeabccfd2b274a9ef29e7171fb9ed5"),
    "monster": ("files/BALANCE/monster.md", "ce2cfa13835296d79b761bb10d65ace3b56cf501"),
}
LANGUAGES = ("it", "en")

# Posizione dei blocchi di frasi nei file di testo della versione europea.
# Numeri ricavati dalla configurazione pubblica di SkyTemple (pmd2data.xml, gioco EoS_EU).
BLOCKS = {
    "items": (6775, 1400),       # nomi degli strumenti, per ID
    "pokemon": (8736, 600),      # nomi dei Pokémon, per ID (le femmine sono ID + 600)
    "itemLong": (10706, 1400),   # descrizioni lunghe degli strumenti
    "itemShort": (12106, 1400),  # descrizioni brevi degli strumenti
    "dungeons": (16566, 256),    # nomi dei dungeon, per ID
}
TOTAL_STRINGS = 18482

# Strumenti validi nel gioco ma esclusi dalle liste anche nella versione originale dell'app.
EXCLUDED_ITEMS = {194}

DUMMY_PREFIX = "[M:D1]"


# ---------------------------------------------------------------------------
# Lettura dei file .str
# ---------------------------------------------------------------------------

def decode_pmd_bytes(raw: bytes) -> str:
    """Windows-1252, con due eccezioni del gioco (0xBD = ♂, 0xBE = ♀).
    Il byte 0x81 introduce un simbolo Shift-JIS a due byte (♪, ★, frecce...)."""
    out = []
    i = 0
    while i < len(raw):
        b = raw[i]
        if b == 0x81 and i + 1 < len(raw):
            out.append(raw[i:i + 2].decode("shift_jis", errors="replace"))
            i += 2
            continue
        if b == 0xBD:
            out.append("♂")
        elif b == 0xBE:
            out.append("♀")
        else:
            out.append(bytes([b]).decode("cp1252", errors="replace"))
        i += 1
    return "".join(out)


def read_str_file(data: bytes) -> list[str]:
    """Il file inizia con una tabella di puntatori little-endian a 32 bit;
    ogni puntatore indica una frase terminata da un byte zero."""
    first = struct.unpack_from("<I", data, 0)[0]
    strings = []
    for offset in range(0, first, 4):
        pointer = struct.unpack_from("<I", data, offset)[0]
        if pointer >= len(data):
            break
        end = data.index(b"\x00", pointer)
        strings.append(decode_pmd_bytes(data[pointer:end]))
    return strings


def load_source(lang: str, pmd_sky: Path | None) -> bytes:
    rel_path, expected_sha1 = SOURCES[lang]
    if pmd_sky:
        data = (pmd_sky / rel_path).read_bytes()
    else:
        CACHE.mkdir(exist_ok=True)
        cached = CACHE / f"{PMD_SKY_COMMIT[:12]}_{Path(rel_path).name}"
        if not cached.exists():
            url = f"https://raw.githubusercontent.com/pret/pmd-sky/{PMD_SKY_COMMIT}/{rel_path}"
            print(f"Scarico {url}")
            with urllib.request.urlopen(url, timeout=60) as response:
                cached.write_bytes(response.read())
        data = cached.read_bytes()
    sha1 = hashlib.sha1(data).hexdigest()
    if sha1 != expected_sha1:
        print(f"Attenzione: {rel_path} ha SHA-1 {sha1}, atteso {expected_sha1}. "
              "Controlla che i blocchi di frasi siano ancora nelle stesse posizioni.", file=sys.stderr)
    return data


# ---------------------------------------------------------------------------
# Pulizia dei codici di controllo del gioco
# ---------------------------------------------------------------------------

TAG = re.compile(r"\[[^\]]*\]")


def clean_name(text: str) -> str | None:
    if text.startswith(DUMMY_PREFIX):
        return None
    return TAG.sub("", text).strip()


# Riga di aiuto per i pulsanti del DS in fondo a molte descrizioni ("Evidenzia link: ... / Apri link: ...").
HELP_LINE = re.compile(r"\s*(?:Select detail|Evidenzia link):.*$", re.S)


def clean_description(text: str) -> str | None:
    if text.startswith(DUMMY_PREFIX):
        return None
    text = HELP_LINE.sub("", text)
    text = text.replace("[equip_list]", "")        # elenco della squadra, calcolato dal gioco (MT)
    # Righe di intestazione ("Rarità: ★★", "Strumento per: Eevee"): separatore visibile al posto dell'a capo.
    text = re.sub(r"^((?:Rarity|Rarità|Item for|Strumento per): [^\n]*)\n", r"\1 · ", text, flags=re.M)
    text = text.replace("[M:S3]", "★")           # stelle di rarità
    text = re.sub(r"\[CLUM_SET:[^\]]*\]", " ", text)  # allineamento in colonne
    text = re.sub(r"\[BAR\]", " ", text)
    text = TAG.sub("", text)                       # colori, collegamenti, icone
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def build_language(strings: list[str]) -> dict:
    def block(name, cleaner):
        start, count = BLOCKS[name]
        return [cleaner(s) for s in strings[start:start + count]]

    return {
        "items": block("items", clean_name),
        "itemShort": block("itemShort", clean_description),
        "itemLong": block("itemLong", clean_description),
        "pokemon": block("pokemon", clean_name),
        "dungeons": block("dungeons", clean_name),
    }


def read_genders(monster_md: bytes) -> list[int]:
    """BALANCE/monster.md: intestazione di 8 byte ("MD\\0\\0" + numero di voci), poi voci da 68 byte.
    Il genere è il byte 0x12 (0 = non valido, 1 = maschio, 2 = femmina, 3 = senza genere).
    La voce ID + 600 è la seconda forma di genere della specie ID."""
    if monster_md[:4] != b"MD\x00\x00":
        raise ValueError("monster.md non riconosciuto")
    count = struct.unpack_from("<I", monster_md, 4)[0]
    return [monster_md[8 + i * 68 + 0x12] for i in range(count)]


def build_shared(en_strings: list[str], genders: list[int]) -> dict:
    items_start, count = BLOCKS["items"]
    long_start, _ = BLOCKS["itemLong"]
    poke_start, poke_count = BLOCKS["pokemon"]

    valid_items = [
        i for i in range(count)
        if not en_strings[items_start + i].startswith(DUMMY_PREFIX) and i not in EXCLUDED_ITEMS
    ]

    # Primo ID che porta un certo nome (le forme alternative vengono dopo la forma base).
    pokemon_by_name = {}
    for pid in range(1, poke_count):
        name = clean_name(en_strings[poke_start + pid])
        if name and name not in pokemon_by_name:
            pokemon_by_name[name] = pid

    # Strumenti esclusivi: "Item for: [CS:K]Eevee[CR]" -> Pokémon proprietario (serve per l'icona).
    exclusive_owner = {}
    for iid in range(count):
        match = re.search(r"Item for: \[CS:K\](.+?)\[CR\]", en_strings[long_start + iid])
        if match and match.group(1) in pokemon_by_name:
            exclusive_owner[iid] = pokemon_by_name[match.group(1)]

    # Specie che hanno davvero una forma femminile separata (ID + 600).
    female_form = [pid for pid in range(1, poke_count)
                   if pid + 600 < len(genders) and genders[pid + 600] == 2]

    return {"validItems": valid_items, "exclusiveOwner": exclusive_owner, "femaleForm": female_form}


def write_js(path: Path, variable: str, payload: dict, header: str) -> None:
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    path.write_text(
        f"// {header}\n"
        "// File generato da tools/estrai_testi.py: non modificarlo a mano.\n"
        f"{variable} = {body};\n",
        encoding="utf-8",
    )
    shown = path.relative_to(ROOT) if path.is_relative_to(ROOT) else path
    print(f"Scritto {shown} ({path.stat().st_size // 1024} KB)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--pmd-sky", type=Path, help="cartella di una copia locale di pret/pmd-sky")
    parser.add_argument("--out", type=Path, default=ROOT / "data", help="cartella di destinazione")
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    texts = {}
    for lang in LANGUAGES:
        strings = read_str_file(load_source(lang, args.pmd_sky))
        if len(strings) != TOTAL_STRINGS:
            print(f"Attenzione: {lang} contiene {len(strings)} frasi invece di {TOTAL_STRINGS}.", file=sys.stderr)
        texts[lang] = strings
    genders = read_genders(load_source("monster", args.pmd_sky))

    source = f"pret/pmd-sky@{PMD_SKY_COMMIT[:12]}"
    for lang, label in (("it", "italiano"), ("en", "inglese (EU)")):
        payload = build_language(texts[lang])
        payload["source"] = f"{source} {SOURCES[lang][0]}"
        write_js(
            args.out / f"testi_gioco_{lang}.js",
            f"window.WMSkyGameText = window.WMSkyGameText || {{}};\nwindow.WMSkyGameText.{lang}",
            payload,
            f"Testi ufficiali in {label} di PMD: Esploratori del Cielo, © Nintendo, Creatures, GAME FREAK, Spike Chunsoft.",
        )

    shared = build_shared(texts["en"], genders)
    shared["source"] = source
    write_js(args.out / "dati_gioco.js", "window.WMSkyGameData", shared,
             "Dati di PMD: Esploratori del Cielo che non dipendono dalla lingua.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
