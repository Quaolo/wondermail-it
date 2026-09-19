#!/usr/bin/env python3
"""Estrae testi e dati ufficiali di Pokémon Mystery Dungeon: Esploratori del Cielo (versione europea)
e genera i file usati dall'app:

    data/testi_gioco_it.js   nomi e descrizioni in italiano
    data/testi_gioco_en.js   nomi e descrizioni in inglese (EU)
    data/dati_gioco.js       dati che non dipendono dalla lingua
    data/stanze_fisse.js     mappe delle stanze speciali (Memo tesoro, Lettere di sfida, covi...)

La fonte è la decompilazione pret/pmd-sky (https://github.com/pret/pmd-sky):
file di testo (MESSAGE/text_*.str), dati (BALANCE/monster.md, BALANCE/fixed.bin) e alcune tabelle
del codice (asm/*.s). Nessuna ROM richiesta.

Uso:
    python tools/estrai_dati.py                      # scarica i file necessari da GitHub (commit fissato)
    python tools/estrai_dati.py --pmd-sky ../pmd-sky # usa una copia locale del repo

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
    # Stanze fisse: forme (fixed.bin) e cosa compare su ogni casella (tabelle dell'overlay 29).
    "fixed": ("files/BALANCE/fixed.bin", "0112e41cc349297d8a0dabd7c391880bb1de245e"),
    "fixedEntities": ("asm/overlay_29_rodata_0234FD04.s", "a15ff2bb9af0dc9b20f89df2cacd45a338f30bf1"),
    "fixedProperties": ("asm/overlay_10_022C5938.s", "c16bd28f1d90c92a4ba64b01ddf7b4061a095cc1"),
    # Elenchi delle stanze scelte dal gioco per covi, Lettere di sfida e Memo tesoro.
    "roomIds1": ("asm/main_rodata_020A18BC.s", "d5a7484b5a17aeec212c78e70c29d6540263f691"),
    "roomIds2": ("asm/main_rodata_020A190C.s", "843e52aeaa00c242a6cb05d71a4d31e332435225"),
}
LANGUAGES = ("it", "en")

# Posizione dei blocchi di frasi nei file di testo della versione europea.
# Numeri ricavati dalla configurazione pubblica di SkyTemple (pmd2data.xml, gioco EoS_EU).
BLOCKS = {
    "items": (6775, 1400),       # nomi degli strumenti, per ID
    "pokemon": (8736, 600),      # nomi dei Pokémon, per ID (le femmine sono ID + 600)
    "itemLong": (10706, 1400),   # descrizioni lunghe degli strumenti
    "itemShort": (12106, 1400),  # descrizioni brevi degli strumenti
    "traps": (13506, 25),        # nomi delle trappole, per ID
    "dungeons": (16566, 256),    # nomi dei dungeon, per ID
}
TOTAL_STRINGS = 18482

# Frasi della schermata "Info missione" del gioco (blocchi "Mission Detail Strings" e
# "Mission Objective Strings" della versione europea). [name:0] e [item:0] vanno sostituiti.
JOB_TEXTS = {
    "title": 15391,         # Info missione
    "client": 15392,        # Committ.:
    "challenger": 15393,    # Sfidante:
    "objective": 15395,     # Obiettivo:
    "place": 15396,         # Luogo:
    "restrictions": 15397,  # Restrizioni:
    "none": 15398,          # Nessuna
    "difficulty": 15401,    # Difficoltà:
    "reward": 15404,        # Ricompensa:
    "wonderMail": 15410,    # Miss. Sp. C:
    "findItem": 15418,
    "deliverItem": 15419,
    "rescue": 15420,
    "escort": 15422,
    "explore": 15423,
    "prospect": 15424,
    "guide": 15425,
    "search": 15426,
    "takeItem": 15427,
    "arrest": 15429,
    "defeat": 15430,
    "findTreasure": 15432,
}
# Altre frasi usate dalla legenda delle mappe.
EXTRA_TEXTS = {
    "absoluteMover": 9971,  # abilità QI che rompe i muri (Super Podista)
}

# Strumenti validi nel gioco ma esclusi dalle liste anche nella versione originale dell'app.
EXCLUDED_ITEMS = {194}

DUMMY_PREFIX = "[M:D1]"


# ---------------------------------------------------------------------------
# Scaricamento dei file sorgente
# ---------------------------------------------------------------------------

def load_source(key: str, pmd_sky: Path | None) -> bytes:
    rel_path, expected_sha1 = SOURCES[key]
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
              "Il file è cambiato: controlla che i dati estratti siano ancora corretti.", file=sys.stderr)
    return data


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


def clean_job_text(text: str) -> str:
    """Toglie colori e spazi finali, lasciando i segnaposto [name:0] e [item:0]."""
    text = re.sub(r"\[(?!name:0\]|item:0\])[^\]]*\]", "", text)
    return re.sub(r"\s+", " ", text).strip()


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
        "traps": block("traps", clean_name),
        "job": {key: clean_job_text(strings[index]) for key, index in JOB_TEXTS.items()},
        "extra": {key: clean_job_text(strings[index]) for key, index in EXTRA_TEXTS.items()},
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


# ---------------------------------------------------------------------------
# Tabelle del codice (file .s della decompilazione)
# ---------------------------------------------------------------------------

NUMBER = re.compile(r"^(0x[0-9a-fA-F]+|\d+)$")


def assemble(source: str, defines: frozenset = frozenset({"EUROPE"})) -> tuple[bytes, dict]:
    """Assemblatore minimo per i file di dati di pret/pmd-sky: restituisce i byte e la posizione di ogni
    etichetta. Gestisce #ifdef/#else/#endif (versione europea), #define, .byte, .hword, .word e .space.
    I .word che puntano a un'etichetta dello stesso file diventano la posizione di quell'etichetta."""
    data = bytearray()
    labels: dict[str, int] = {}
    values: dict[str, int] = {}
    relocations: list[tuple[int, str]] = []
    active = [True]

    def evaluate(expr: str) -> int:
        expr = expr.strip()
        if NUMBER.match(expr):
            return int(expr, 0)
        expanded = re.sub(r"[A-Za-z_]\w*", lambda m: str(values.get(m.group(0), m.group(0))), expr)
        if not re.fullmatch(r"[0-9xa-fA-F+\-*() ]+", expanded):
            raise ValueError(expr)
        return int(eval(expanded, {"__builtins__": {}}))  # solo numeri e operatori, controllato sopra

    for raw in source.splitlines():
        line = raw.split("@")[0].strip()
        if not line:
            continue
        if line.startswith("#"):
            parts = line.split()
            if parts[0] == "#ifdef":
                active.append(active[-1] and parts[1] in defines)
            elif parts[0] == "#ifndef":
                active.append(active[-1] and parts[1] not in defines)
            elif parts[0] == "#else":
                parent = active[-2]
                active[-1] = parent and not active[-1]
            elif parts[0] == "#endif":
                active.pop()
            elif parts[0] == "#define" and active[-1]:
                values[parts[1]] = evaluate(" ".join(parts[2:])) if len(parts) > 2 else 1
            continue
        if not active[-1]:
            continue
        label = re.match(r"^([A-Za-z_]\w*):", line)
        if label:
            labels[label.group(1)] = len(data)
            line = line[label.end():].strip()
            if not line:
                continue
        directive, _, args = line.partition(" ")
        if directive == ".byte":
            data += bytes(evaluate(x) & 0xFF for x in args.split(","))
        elif directive in (".hword", ".short", ".2byte"):
            for x in args.split(","):
                data += struct.pack("<H", evaluate(x) & 0xFFFF)
        elif directive in (".word", ".4byte"):
            for x in args.split(","):
                x = x.strip()
                try:
                    data += struct.pack("<I", evaluate(x) & 0xFFFFFFFF)
                except ValueError:
                    relocations.append((len(data), x))
                    data += b"\0\0\0\0"
        elif directive == ".space":
            data += bytes(evaluate(args))
    for offset, symbol in relocations:
        if symbol in labels:
            struct.pack_into("<I", data, offset, labels[symbol])
        else:
            struct.pack_into("<I", data, offset, 0xFFFFFFFF)
    return bytes(data), labels


def read_entity_table(source: bytes) -> list[dict]:
    """FIXED_ROOM_ENTITY_SPAWN_TABLE: 269 voci da 12 byte, ciascuna con tre puntatori (strumento, Pokémon,
    casella). Le azioni di fixed.bin da 0x10 in su indicano la voce (azione - 0x10)."""
    data, labels = assemble(source.decode("utf-8"))
    tile0 = labels["FIXED_ROOM_TILE_SPAWN_TABLE"]
    monster0 = labels["FIXED_ROOM_MONSTER_SPAWN_TABLE"]
    item0 = labels["FIXED_ROOM_ITEM_SPAWN_TABLE"]
    entity0 = labels["FIXED_ROOM_ENTITY_SPAWN_TABLE"]
    entities = []
    for index in range(269):
        item_ptr, monster_ptr, tile_ptr = struct.unpack_from("<III", data, entity0 + index * 12)
        item_id = struct.unpack_from("<H", data, item_ptr)[0]
        monster_id, _stats, behavior = struct.unpack_from("<HBB", data, monster_ptr)
        trap_id, _flags, _room, flags3 = data[tile_ptr:tile_ptr + 4]
        if not (item0 <= item_ptr < entity0 and monster0 <= monster_ptr < item0 and tile0 <= tile_ptr < monster0):
            raise ValueError(f"voce {index} della tabella delle entità fuori posto")
        entities.append({
            "item": item_id, "monster": monster_id, "behavior": behavior,
            "trap": trap_id, "trapVisible": bool(flags3 & 1), "secondary": bool(flags3 & 8),
        })
    return entities


def read_room_properties(source: bytes) -> list[dict]:
    """FIXED_ROOM_PROPERTIES_TABLE: 256 voci da 12 byte (struct fixed_room_properties_entry di pmdsky-debug)."""
    data, labels = assemble(source.decode("utf-8"))
    start = labels["FIXED_ROOM_PROPERTIES_TABLE"]
    props = []
    for room in range(256):
        entry = data[start + room * 12:start + room * 12 + 12]
        props.append({
            "lit": entry[4],        # stanza illuminata
            "lateTraps": entry[5],  # funzionano Attirotrappola, Precipitotrappola e Pokétrappola
            "moves": entry[6],      # si possono usare le mosse
            "orbs": entry[7],       # si possono usare le sfere
            "warps": entry[8],      # teletrasporti, spinte e salti
            "trawl": entry[9],      # funziona l'Arraffasfera
        })
    return props


def read_room_ids(source: bytes, label: str) -> list[int]:
    data, labels = assemble(source.decode("utf-8"))
    ids = []
    for byte in data[labels[label]:]:
        if byte == 0:
            break
        ids.append(byte)
    return ids


def read_fixed_bin(data: bytes) -> list[dict]:
    """BALANCE/fixed.bin (contenitore SIR0): elenco di stanze; ogni stanza ha larghezza, altezza e
    le azioni di ogni casella compresse (valore a 16 bit + numero di ripetizioni - 1).
    I 12 bit bassi del valore sono l'azione, i 4 alti un parametro (la direzione dei Pokémon)."""
    if data[:4] != b"SIR0":
        raise ValueError("fixed.bin non riconosciuto")
    cursor = struct.unpack_from("<I", data, 4)[0]
    rooms = []
    while data[cursor:cursor + 4] != b"\xaa\xaa\xaa\xaa":
        pointer = struct.unpack_from("<I", data, cursor)[0]
        width, height, _unk = struct.unpack_from("<HHH", data, pointer)
        actions = []
        position = pointer + 6
        while len(actions) < width * height:
            value, repeat = struct.unpack_from("<HH", data, position)
            position += 4
            actions += [value & 0xFFF] * (repeat + 1)
        rooms.append({"w": width, "h": height, "actions": actions})
        cursor += 4
    return rooms


# ---------------------------------------------------------------------------
# Stanze speciali
# ---------------------------------------------------------------------------

# Simboli delle mappe generate (vedi anche la legenda scritta nel file).
LEGEND = {
    "#": "muro",
    "b": "muro che si rompe camminandoci contro con l'abilità QI Super Podista",
    ".": "pavimento",
    "~": "terreno secondario (acqua, lava o altro a seconda del dungeon)",
    "_": "baratro",
    ">": "scale",
    "@": "partenza del capo squadra",
    "1": "partenza di un compagno", "2": "partenza di un compagno", "3": "partenza di un compagno",
    "K": "porta chiusa a chiave (serve una Chiave)",
    "E": "porta che si apre solo con il committente",
    "T": "Tecalusso con lo strumento della missione",
    "t": "strumento della missione",
    "$": "Poké",
    "c": "scrigno",
    "i": "strumento",
    "B": "capo: chi lancia la Lettera di sfida",
    "m": "Pokémon del primo gruppo di gregari (secondo membro della sfida, o complice del ricercato)",
    "n": "Pokémon del secondo gruppo di gregari (terzo membro della sfida)",
    "O": "ricercato",
    "p": "Pokémon",
    "G": "Rafficotrappola",
    "W": "Teletrappola",
    "X": "Castagnotrappola",
    "^": "altra trappola",
}

BASE_ACTIONS = {
    0x00: ".", 0x01: "b", 0x02: "#", 0x03: "#", 0x04: "@", 0x05: "~", 0x06: "_", 0x07: "_",
    0x08: ">", 0x09: ".", 0x0A: "_", 0x0B: ".", 0x0C: "K", 0x0D: "E", 0x0E: "#", 0x0F: "#",
    0x60: "1", 0x61: "2", 0x62: "3", 0x63: ".", 0x6B: ">", 0x6C: ".", 0x6D: ".",
}

# ID speciali usati nelle tabelle delle stanze fisse (vedi PlaceFixedRoomTile e GetMatchingMonsterId).
ITEM_MISSION_TARGET = 0x578          # strumento della missione (Sala Proibita)
ITEM_MISSION_TARGET_IN_BOX = 0x579   # Tecalusso che contiene lo strumento della missione (Memo tesoro)
ITEM_RANDOM_BOX = range(0x582, 0x58C)
ITEM_POKE = 183
TREASURE_BOXES = range(364, 400)     # scrigni (categorie "treasure box" 1-3)
MONSTER_NONE = 0x483
# GetMissionTargetEnemy e GetMissionEnemyMinionGroup(0/1): il bersaglio è il ricercato (o, nelle
# Lettere di sfida, il committente che lancia la sfida); i due gruppi di gregari sono il secondo
# e il terzo Pokémon della missione.
MONSTER_OUTLAW = 0x484               # il ricercato della missione
MONSTER_MINIONS_1 = (0x485, 0x487)   # primo gruppo di gregari
MONSTER_MINIONS_2 = (0x488,)         # secondo gruppo di gregari
MONSTER_CHALLENGE_LEADER = 0x486     # il capo: chi lancia la Lettera di sfida
TRAP_NONE = 25
TRAP_CHARS = {7: "G", 6: "W", 16: "X"}


def entity_char(entity: dict) -> str:
    monster, item, trap = entity["monster"], entity["item"], entity["trap"]
    if monster and monster != MONSTER_NONE:
        if monster == MONSTER_OUTLAW:
            return "O"
        if monster == MONSTER_CHALLENGE_LEADER:
            return "B"
        if monster in MONSTER_MINIONS_1:
            return "m"
        if monster in MONSTER_MINIONS_2:
            return "n"
        return "p"
    if item:
        if item == ITEM_MISSION_TARGET_IN_BOX:
            return "T"
        if item == ITEM_MISSION_TARGET:
            return "t"
        if item == ITEM_POKE:
            return "$"
        if item in ITEM_RANDOM_BOX or item in TREASURE_BOXES:
            return "c"
        return "i"
    if trap != TRAP_NONE:
        return TRAP_CHARS.get(trap, "^")
    return "~" if entity["secondary"] else "."


# Stanze che una password Missioni Speciali C può usare, con il loro ruolo nel gioco.
# Le stanze delle Lettere di sfida leggendarie non stanno in una tabella: le sceglie il codice
# (GetMissionSpecificFixedRoom), una per sottotipo: Mewtwo, Entei, Raikou, Suicune, Jirachi.
LEGENDARY_CHALLENGE_ROOMS = [145, 146, 147, 148, 149]
GOLDEN_CHAMBER = 111
SECRET_ROOM = 113
UNUSED_TREASURE_MEMO = 114
SEALED_CHAMBER = 165
# Finché la storia non è abbastanza avanti il gioco genera solo le prime 15 stanze dei Memo tesoro.
TREASURE_MEMO_EARLY_COUNT = 15


def crop(rows: list[str]) -> list[str]:
    """Taglia i muri esterni lasciando un bordo di una casella."""
    cells = [(x, y) for y, row in enumerate(rows) for x, char in enumerate(row) if char != "#"]
    if not cells:
        return rows
    x0 = max(min(x for x, _ in cells) - 1, 0)
    x1 = min(max(x for x, _ in cells) + 1, len(rows[0]) - 1)
    y0 = max(min(y for _, y in cells) - 1, 0)
    y1 = min(max(y for _, y in cells) + 1, len(rows) - 1)
    return [row[x0:x1 + 1] for row in rows[y0:y1 + 1]]


def build_rooms(fixed: bytes, entities_src: bytes, properties_src: bytes, ids1: bytes, ids2: bytes) -> dict:
    rooms = read_fixed_bin(fixed)
    entities = read_entity_table(entities_src)
    properties = read_room_properties(properties_src)
    mission_rooms = {
        "treasureMemo": read_room_ids(ids2, "TREASURE_MEMO_FIXED_ROOM_IDS"),
        "treasureMemoEarly": TREASURE_MEMO_EARLY_COUNT,
        "challenge": read_room_ids(ids1, "CHALLENGE_NORMAL_FIXED_ROOM_IDS"),
        "legendaryChallenge": LEGENDARY_CHALLENGE_ROOMS,
        "outlawHideout": read_room_ids(ids1, "OUTLAW_HIDEOUT_FIXED_ROOM_IDS"),
        "goldenChamber": GOLDEN_CHAMBER,
        "sealedChamber": SEALED_CHAMBER,
    }
    kinds = {GOLDEN_CHAMBER: "goldenChamber", SECRET_ROOM: "secretRoom",
             UNUSED_TREASURE_MEMO: "unusedTreasureMemo", SEALED_CHAMBER: "sealedChamber"}
    for key in ("treasureMemo", "challenge", "legendaryChallenge", "outlawHideout"):
        for room_id in mission_rooms[key]:
            kinds[room_id] = key

    output = {}
    for room_id in sorted(kinds):
        room = rooms[room_id]
        rows = []
        for y in range(room["h"]):
            row = ""
            for action in room["actions"][y * room["w"]:(y + 1) * room["w"]]:
                if action in BASE_ACTIONS:
                    row += BASE_ACTIONS[action]
                elif 0x10 <= action < 0x10 + len(entities):
                    row += entity_char(entities[action - 0x10])
                else:
                    raise ValueError(f"stanza {room_id}: azione sconosciuta {action:#x}")
            rows.append(row)
        props = properties[room_id]
        if room_id >= SEALED_CHAMBER:
            # Per le stanze inserite in un piano normale il gioco ignora questi divieti.
            props = {**props, "orbs": 1, "warps": 1, "trawl": 1}
        output[str(room_id)] = {"kind": kinds[room_id], "map": crop(rows), "props": props}
    return {"missionRooms": mission_rooms, "legend": LEGEND, "rooms": output}


# ---------------------------------------------------------------------------
# Scrittura
# ---------------------------------------------------------------------------

def compact(value) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(", ", ": "))


def format_rooms(payload: dict) -> str:
    """Una riga per ogni riga della mappa, così le differenze tra versioni restano leggibili."""
    lines = ["{"]
    for key in ("source", "missionRooms", "legend"):
        lines.append(f" {compact(key)}: {compact(payload[key])},")
    lines.append(' "rooms": {')
    room_items = list(payload["rooms"].items())
    for index, (room_id, room) in enumerate(room_items):
        lines.append(f"  {compact(room_id)}: {{\"kind\": {compact(room['kind'])}, \"props\": {compact(room['props'])}, \"map\": [")
        lines += [f"   {compact(row)}," for row in room["map"][:-1]] + [f"   {compact(room['map'][-1])}"]
        lines.append("  ]}" + ("," if index < len(room_items) - 1 else ""))
    lines += [" }", "}"]
    return "\n".join(lines)


def write_js(path: Path, variable: str, payload: dict, header: str, body: str | None = None) -> None:
    if body is None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    path.write_text(
        f"// {header}\n"
        "// File generato da tools/estrai_dati.py: non modificarlo a mano.\n"
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

    rooms = build_rooms(*(load_source(key, args.pmd_sky) for key in
                          ("fixed", "fixedEntities", "fixedProperties", "roomIds1", "roomIds2")))
    rooms["source"] = f"{source} {SOURCES['fixed'][0]}"
    write_js(args.out / "stanze_fisse.js", "window.WMSkyFixedRooms", rooms,
             "Stanze speciali di PMD: Esploratori del Cielo (forme e contenuto dai dati del gioco).",
             body=format_rooms(rooms))
    return 0


if __name__ == "__main__":
    sys.exit(main())
