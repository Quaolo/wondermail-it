#!/usr/bin/env python3
"""Estrae testi e dati ufficiali di Pokémon Mystery Dungeon: Esploratori del Cielo (versione europea)
e genera i file usati dall'app:

    data/testi_gioco_it.js   nomi e descrizioni in italiano
    data/testi_gioco_en.js   nomi e descrizioni in inglese (EU)
    data/dati_gioco.js       dati che non dipendono dalla lingua
    data/stanze_fisse.js     mappe delle stanze speciali (Memo tesoro, Lettere di sfida, covi...)

Nei file di testo c'è anche il titolo e la descrizione delle missioni, con le tabelle che il gioco usa
per sceglierli dal seme della password (RESCUE/rescue.bin e MISSION_STRING_IDS).

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
    # Contenuto dei Tecalusso delle stanze: tabella dungeon -> elenco (overlay 29) ed elenchi (overlay 10).
    "boxTable": ("asm/overlay_29_rodata_02352A6C.s", "7948735707040fccc65902b4d36891701e8618ef"),
    "boxLists1": ("asm/overlay_10_rodata_022C464C.s", "7e0e63b832dba93e321a0220a1527380508c0e20"),
    "boxLists2": ("asm/overlay_10_rodata_022C48E4.s", "48845e7cfcc43b4d0ba76111d2a3ae86f15c5cfc"),
    "boxLists3": ("asm/overlay_10_rodata_022C490C.s", "9f4128a23347f2f15c92c89793d20150b62389ce"),
    # Dati degli strumenti (categoria di ogni strumento), versione europea.
    "itemP": ("files/language-specific/EU/BALANCE/item_p.bin", "22e33f76a2c9e443c67d6d0434161c1265110ce7"),
    # Pokémon che il gioco non accetta come committenti (MISSION_BANNED_MONSTERS, usato da IsMissionValid)
    # e punti esplorazione di ogni difficoltà (MISSION_RANK_POINTS).
    "mainRodata": ("asm/main_rodata_020A2808.s", "4e4adb2ac6130def826082136e95e63b0b3ed5f5"),
    # Piani di ogni dungeon (DUNGEON_DATA_LIST) e difficoltà per piano (MISSION_FLOOR_RANKS_*).
    "dungeonRodata": ("asm/main_rodata_0209CECC.s", "6396ccea23e32e04153f6e745fc8cc8588bb64c1"),
    # Piani dei dungeon di Esploratori del Cielo: da qui gli strumenti dei Tecalusso della stanza segreta.
    "mappa": ("files/BALANCE/mappa_s.bin", "a800bd977c9005ef18ec51e31a5e5b56ff4c0691"),
    # Titolo e descrizione delle missioni: gruppi di frasi e modelli di missione (uguale in tutte le regioni).
    "rescue": ("files/RESCUE/rescue.bin", "4f0f2adecafdbcda41d789fbdc99bd571d88b900"),
    # Formato del piano nei testi ("P. 5", "B5F"), nelle stringhe della versione europea.
    "textRodata": ("asm/main_rodata_020925A0.s", "0a5b1d035edd4ea4e62b5085994e066059f4ee05"),
    # Prima istruzione dell'ITCM: è quello che il gioco legge quando non trova un modello (vedi sotto).
    "itcm": ("asm/itcm.s", "8483fc985b6591eb2e47b3b2e003960a17337e07"),
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


MONSTER_ENTRY = 68


def read_monsters(monster_md: bytes) -> dict:
    """BALANCE/monster.md: intestazione di 8 byte ("MD\\0\\0" + numero di voci), poi voci da 68 byte
    (struct monster_data_table_entry di pret/pmd-sky). Servono il numero del Pokédex nazionale (0x04),
    il genere (0x12: 0 = non valido, 1 = maschio, 2 = femmina, 3 = senza genere) e la taglia (0x13).
    La voce ID + 600 è la seconda forma di genere della specie ID."""
    if monster_md[:4] != b"MD\x00\x00":
        raise ValueError("monster.md non riconosciuto")
    count = struct.unpack_from("<I", monster_md, 4)[0]
    entries = [8 + i * MONSTER_ENTRY for i in range(count)]
    return {
        "dex": [struct.unpack_from("<h", monster_md, o + 4)[0] for o in entries],
        "gender": [monster_md[o + 0x12] for o in entries],
        "bodySize": [monster_md[o + 0x13] for o in entries],
    }


def read_label_halfwords(source: bytes, label: str) -> list[int]:
    """Elenco di valori a 16 bit che finisce con 0, scritto come .byte dopo un'etichetta del file .s."""
    text = source.decode("utf-8")
    match = re.search(rf"^{label}:\n(.*?)(?=^\s*\.global|\Z)", text, re.M | re.S)
    if not match:
        raise ValueError(f"{label} non trovato")
    data = [int(value, 16) for value in re.findall(r"0x([0-9A-Fa-f]{2})", match.group(1))]
    values = [data[i] | data[i + 1] << 8 for i in range(0, len(data) - 1, 2)]
    return values[:values.index(0)]


def get_base_form(monster_id: int) -> int:
    """Porting di GetBaseForm: le forme alternative diventano la forma base (Castform, Unown, Deoxys,
    Cherrim, Shaymin Forma Cielo, Giratina Forma Originale). Burmy, Wormadam, Shellos e Gastrodon no."""
    if 202 <= monster_id <= 228:
        return 201
    forms = {380: 379, 381: 379, 382: 379, 980: 979, 981: 979, 982: 979,
             419: 418, 420: 418, 421: 418, 461: 460, 1061: 1060, 535: 534, 536: 529}
    return forms.get(monster_id, monster_id)


def is_monster_illegal_for_missions(monster_id: int, genders: list[int]) -> bool:
    """Porting di IsMonsterValid e IsMonsterIllegalForMissions: niente ID vuoti, forme della storia
    (535-552), Kecleon viola (384), Celebi rosa (279) e seconde forme che non sono femmine."""
    valid = 0 < monster_id < 0x229 or (0x258 <= monster_id < 0x481 and genders[monster_id] == 2)
    return not valid or 0x217 <= monster_id <= 0x228 or monster_id in (0x180, 0x117)


def build_mission_pokemon(monsters: dict, banned: list[int]) -> dict:
    """Pokémon che IsMissionValid accetta (CheckMonsterForMissionType):
    - bersagli: forma base, non illegale;
    - committenti: in più non in MISSION_BANNED_MONSTERS (tranne arresti e Lettere di sfida);
    - taglia: per accompagna, esplora, cerca con il committente e guida serve taglia 1."""
    banned_set = set(banned)
    targets = [pid for pid in range(1, 600)
               if get_base_form(pid) == pid and not is_monster_illegal_for_missions(pid, monsters["gender"])]
    clients = [pid for pid in targets if pid not in banned_set]
    large = [pid for pid in targets if monsters["bodySize"][pid] != 1]
    return {"missionTargets": targets, "missionClients": clients, "largeBody": large}


def read_item_categories(item_p: bytes) -> list[int]:
    """BALANCE/item_p.bin (contenitore SIR0): una voce da 16 byte per strumento; il byte 4 è la
    categoria (enum item_category di pmdsky-debug: 0-1 da lanciare, 2 bacche e semi, 3 cibo,
    4 da tenere, 5 MT, 6 Poké, 8 altro, 9 sfere, 10 Combinatore, 11 MT usata, 12-14 forzieri,
    15 strumenti esclusivi)."""
    if item_p[:4] != b"SIR0":
        raise ValueError("item_p.bin non riconosciuto")
    start, end = struct.unpack_from("<II", item_p, 4)
    categories = []
    for offset in range(start, end - 15, 16):
        item_id = struct.unpack_from("<H", item_p, offset + 6)[0]
        if item_id != len(categories):
            raise ValueError("item_p.bin: strumenti fuori ordine")
        categories.append(item_p[offset + 4])
    return categories


def read_item_looks(item_p: bytes) -> list[int]:
    """Aspetto dell'icona di ogni strumento in BALANCE/item_p.bin: byte 5 = disegno (sprite_id),
    byte 0xC = tavolozza (palette_id). Restituisce disegno * 16 + tavolozza: due strumenti con lo
    stesso valore hanno la stessa icona nel gioco."""
    start, end = struct.unpack_from("<II", item_p, 4)
    return [item_p[offset + 5] * 16 + item_p[offset + 0xC] for offset in range(start, end - 15, 16)]


# Il gioco tratta a parte gli ultimi ID dei dungeon: vedi GetNbFloors e DungeonFloorToGroupFloor.
FIRST_SPECIAL_DUNGEON = 0xB4   # da qui in poi non c'è una voce in DUNGEON_DATA_LIST
LAST_DUNGEON_ID = 0xFF
MISSION_RANK_GROUPS = 0x64     # oltre questo gruppo la difficoltà è sempre 1


def read_label_words(data: bytes, labels: dict, label: str) -> list[int]:
    """Tabella di puntatori: legge i .word dall'etichetta fino a quella successiva."""
    start = labels[label]
    end = min([offset for offset in sorted(set(labels.values())) if offset > start] + [len(data)])
    return [struct.unpack_from("<I", data, start + i)[0] for i in range(0, end - start, 4)]


def build_mission_floors(rodata: bytes, points_source: bytes) -> dict:
    """Piani e difficoltà delle missioni, dalle tabelle del gioco.

    `DUNGEON_DATA_LIST` ha una voce di 4 byte per dungeon: numero di piani, gruppo, piani dei dungeon
    che lo precedono nel gruppo. `sub_02063424` (piano massimo di una missione) restituisce il numero
    di piani, uno in meno per il dungeon 0xAE. `GetMissionRank` converte dungeon e piano in gruppo e
    piano del gruppo (`DungeonFloorToGroupFloor`) e legge `MISSION_FLOOR_RANKS_PTRS[gruppo][piano]`."""
    data, labels = assemble(rodata.decode("utf-8"))
    base = labels["DUNGEON_DATA_LIST"]
    entry = lambda dungeon, field: data[base + 4 * dungeon + field]

    def floor_count(dungeon: int) -> int:
        if dungeon < FIRST_SPECIAL_DUNGEON:
            return entry(dungeon, 0)
        if dungeon <= 0xBD:
            return 5
        if dungeon == 0xBE:
            return 1
        return 0x30

    def group_floor(dungeon: int, floor: int) -> tuple[int, int]:
        if FIRST_SPECIAL_DUNGEON <= dungeon <= 0xBD:
            return 0x35, floor + 5 * (dungeon - FIRST_SPECIAL_DUNGEON)
        if dungeon == 0xBE:
            return 0x35, floor + 0x32
        if 0xBF <= dungeon <= 0xD3:
            return 0x35, floor + 0x33
        return entry(dungeon, 1), floor + entry(dungeon, 2)

    # Come il gioco: la difficoltà è il byte all'indirizzo del gruppo più il piano del gruppo
    # (gli elenchi sono uno dopo l'altro in memoria).
    pointers = read_label_words(data, labels, "MISSION_FLOOR_RANKS_PTRS")

    # Piani che il gioco rifiuta (IsForbiddenFloor: coppie gruppo/piano del gruppo, chiuse da 0x64).
    forbidden = set()
    offset = labels["MISSION_FLOORS_FORBIDDEN"]
    while data[offset] != MISSION_RANK_GROUPS:
        forbidden.add((data[offset], data[offset + 1]))
        offset += 2

    # Strumenti che si possono portare nel dungeon (serve alle missioni di consegna).
    restrictions = labels["DUNGEON_RESTRICTIONS"]
    max_items = [data[restrictions + 0xC * dungeon + 5] for dungeon in range(FIRST_SPECIAL_DUNGEON)]
    # Dungeon che salgono (bit 0 dei flag, DungeonGoesUp): i piani si scrivono "5F" invece di "B5F".
    ascends = [data[restrictions + 0xC * dungeon] & 1 for dungeon in range(FIRST_SPECIAL_DUNGEON)]

    # Piano massimo accettato in una missione, per ogni ID di dungeon.
    floors = [floor_count(dungeon) - (1 if dungeon == 0xAE else 0)
              for dungeon in range(LAST_DUNGEON_ID + 1)]
    # Difficoltà di ogni piano (solo i dungeon veri: per gli altri il gioco restituisce sempre 1).
    ranks = {}
    for dungeon in range(FIRST_SPECIAL_DUNGEON):
        group, _ = group_floor(dungeon, 1)
        if group >= MISSION_RANK_GROUPS or not floor_count(dungeon):
            continue
        ranks[dungeon] = [data[pointers[group] + group_floor(dungeon, floor)[1]]
                          for floor in range(1, floor_count(dungeon) + 1)]

    forbidden_floors = {}
    for dungeon in range(FIRST_SPECIAL_DUNGEON):
        floors_out = [floor for floor in range(1, floors[dungeon] + 1)
                      if group_floor(dungeon, floor) in forbidden]
        if floors_out:
            forbidden_floors[dungeon] = floors_out

    points = read_label_words(*assemble_rank_points(points_source), "MISSION_RANK_POINTS")
    return {"missionFloors": floors, "missionRanks": ranks, "missionRankPoints": points,
            "forbiddenFloors": forbidden_floors, "dungeonMaxItems": max_items,
            "dungeonAscends": ascends}


# ---------------------------------------------------------------------------
# Titolo e descrizione delle missioni (RESCUE/rescue.bin, MISSION_STRING_IDS)
# ---------------------------------------------------------------------------
#
# GenerateMissionDetailsStruct cerca il primo modello di rescue.bin che corrisponde alla missione
# (MatchMissionTemplateToMission, con uno dei controlli di MISSION_VALIDATION_FUNCTION_LIST).
# AppendMissionTitle e AppendMissionSummary partono dal campo text_string_offset del modello: ogni
# passo sceglie una frase di un gruppo (RESCUE_BIN gruppi: numero di frasi, prima frase) con un
# generatore lineare (sub_020022D0) inizializzato con seme + dungeon + piano, e passa al gruppo
# indicato per quella frase (0x1000 = descrizione, 0xFFFF = fine).

RESCUE_GROUPS = 482
RESCUE_STRINGS = 964
RESCUE_TEMPLATES = 600
RESCUE_TEMPLATE_SIZE = 0x22
# I valori di MISSION_STRING_IDS sono di uno più alti dell'indice della frase nel file .str.
# Con l'indice diretto 26 frasi hanno segnaposto che la missione non riempie (e compare perfino
# "Job Summary"); con -1 tornano tutte e i testi delle missioni ufficiali coincidono con quelli del gioco.
MISSION_STRING_SHIFT = -1
# Formato di [floor:0] per lingua (sub_02024598: coppie salita/discesa indicizzate da GetLanguage).
FLOOR_FORMATS = {"en": ("_0209A1A8", "_0209A1C8"), "it": ("_0209A1D8", "_0209A208")}


def build_mission_text_tables(rescue: bytes, rodata: bytes, itcm: bytes) -> dict:
    header = struct.unpack_from("<6I", rescue, 0)
    groups = [list(struct.unpack_from("<HH", rescue, header[0] + 4 * i)) for i in range(RESCUE_GROUPS)]
    following = list(struct.unpack_from(f"<{RESCUE_STRINGS}H", rescue, header[1]))
    templates = []
    for index in range(RESCUE_TEMPLATES):
        base = header[4] + RESCUE_TEMPLATE_SIZE * index
        text, item_case, _, item = struct.unpack_from("<4H", rescue, base)
        dungeon_case = struct.unpack_from("<H", rescue, base + 8)[0]
        dungeon = struct.unpack_from("<H", rescue, base + 0xC)[0] & 0xFF
        client_case, _, client, target_case, _, target, backup_case, _, backup = \
            struct.unpack_from("<9H", rescue, base + 0xE)
        mission_type, subtype = rescue[base + 0x20], rescue[base + 0x21]
        templates.append([text, mission_type, subtype, item_case, item, dungeon_case, dungeon,
                          client_case, client, target_case, target, backup_case, backup])

    # Senza modello il gioco legge text_string_offset all'indirizzo 0, dove l'ARM9 vede l'inizio dell'ITCM:
    # la prima istruzione (stmdb sp!, {...}) ha nella metà bassa l'elenco dei registri.
    first = re.search(r"stmdb sp!, \{([^}]*)\}", itcm.decode("utf-8"))
    registers = {"sb": 9, "sl": 10, "fp": 11, "ip": 12, "sp": 13, "lr": 14, "pc": 15}
    mask = 0
    for name in (part.strip() for part in first.group(1).split(",")):
        mask |= 1 << (registers[name] if name in registers else int(name[1:]))

    data, labels = assemble(rodata.decode("utf-8"))
    ids = list(struct.unpack_from(f"<{RESCUE_STRINGS}h", data, labels["MISSION_STRING_IDS"]))
    return {"groups": groups, "next": following, "templates": templates, "missingTemplateText": mask, "stringIds": ids}


def clean_mission_text(text: str) -> str:
    """Tiene i segnaposto ([name:0], [item:0], [dungeon:0], [floor:0], [team]), i colori ([CS:x]...[CR])
    e gli a capo; toglie le icone."""
    text = re.sub(r"\[M:[^\]]*\]", "", text)
    return text.replace("\r", "")


def build_mission_texts(strings: list[str], ids: list[int]) -> list[str]:
    return [clean_mission_text(strings[string_id + MISSION_STRING_SHIFT]) for string_id in ids]


def read_floor_formats(text_rodata: bytes) -> dict:
    data, labels = assemble(text_rodata.decode("utf-8"))

    def c_string(label: str) -> str:
        start = labels[label]
        raw = data[start:data.index(b"\x00", start)].decode("ascii")
        return re.sub(r"\[[^\]]*\]", "", raw).replace("%d", "{floor}")

    return {lang: [c_string(up), c_string(down)] for lang, (up, down) in FLOOR_FORMATS.items()}


# ---------------------------------------------------------------------------
# Stanza segreta (113): strumenti dei Tecalusso, da BALANCE/mappa_s.bin
# ---------------------------------------------------------------------------

MAPPA_FLOOR_SIZE = 18          # voce di un piano: nove u16 (forma, Pokémon, trappole, sei elenchi di strumenti)
MAPPA_SECRET_ROOM_LIST = 8     # ultimo elenco del piano: SPAWN_SECRET_ROOM (dopo normali, negozio, casa dei mostri,
                               # sepolti e bazar)
MAPPA_SKIP = 0x7530            # nel formato degli elenchi, un valore oltre 30000 salta (valore - 30000) voci
MAPPA_CATEGORIES = 0x10        # le prime 16 voci sono le categorie, poi vengono gli strumenti
MAPPA_LAST_ITEM = 363
SECRET_ROOM_FALLBACK = 70      # Baccarancia: GetRandomSecretRoomItem la dà quando GetItemIdToSpawn trova una Poké


def read_mappa_item_list(data: bytes, offset: int) -> tuple[dict, dict]:
    """Un elenco di strumenti di mappa_s.bin (formato documentato da SkyTemple, MappaItemList): soglie
    cumulative su 10000, prima per categoria e poi per strumento, con i salti codificati come 30000 + n."""
    categories, items = {}, {}
    in_categories, index = True, 0
    while index <= MAPPA_LAST_ITEM:
        value = struct.unpack_from("<H", data, offset)[0]
        offset += 2
        if MAPPA_SKIP < value < 0xFFFF:
            index += value - MAPPA_SKIP
        else:
            (categories if in_categories else items)[index] = value
            index += 1
        if in_categories and index >= MAPPA_CATEGORIES - 1:
            in_categories, index = False, index - MAPPA_CATEGORIES
    return categories, items


def pick_counts(thresholds: list[tuple[int, int]]) -> dict:
    """Come GetItemIdToSpawn: estrae 0-9999 e prende la prima voce (in ordine) con soglia >= numero.
    Restituisce per ogni voce quanti dei 10000 numeri la scelgono. Le soglie 0 si saltano e 0xFFFF,
    letto come -1, non viene mai scelto."""
    counts, covered = {}, -1
    for key, value in thresholds:
        if value == 0:
            continue
        top = min(value if value < 0x8000 else -1, 9999)
        if top > covered:
            counts[key] = top - covered
            covered = top
    return counts


def secret_room_items(categories: dict, items: dict, item_category: list[int]) -> list[list]:
    """Probabilità (in %) di ogni strumento in un Tecalusso della stanza segreta, per l'elenco dato."""
    result = {}
    for category, count in pick_counts(sorted(categories.items())).items():
        in_category = [(item, value) for item, value in sorted(items.items())
                       if item < len(item_category) and item_category[item] == category]
        picked = pick_counts(in_category)
        for item, item_count in picked.items():
            result[item] = result.get(item, 0) + count * item_count
        # Numeri non coperti: il gioco restituisce una Poké, cioè una Baccarancia.
        result[SECRET_ROOM_FALLBACK] = result.get(SECRET_ROOM_FALLBACK, 0) + count * (10000 - sum(picked.values()))
    uncovered = 10000 - sum(pick_counts(sorted(categories.items())).values())
    result[SECRET_ROOM_FALLBACK] = result.get(SECRET_ROOM_FALLBACK, 0) + uncovered * 10000
    return sorted([[item, round(weight / 1e6, 3)] for item, weight in result.items() if weight],
                  key=lambda entry: (-entry[1], entry[0]))


def build_secret_room(mappa: bytes, rodata: bytes, item_category: list[int]) -> dict:
    """Contenuto dei Tecalusso della stanza segreta per ogni dungeon e piano delle missioni.

    PlaceFixedRoomTile riempie i Tecalusso della stanza 113 con GetRandomSecretRoomItem, che pesca
    dall'elenco SPAWN_SECRET_ROOM del piano caricato da LoadMappaFileAttributes: il gruppo e il piano del
    gruppo vengono da DUNGEON_DATA_LIST (come per la difficoltà delle missioni)."""
    if mappa[:4] != b"SIR0":
        raise ValueError("mappa_s.bin non riconosciuto")
    header = struct.unpack_from("<I", mappa, 4)[0]
    floor_lists, _, item_lists = struct.unpack_from("<3I", mappa, header)
    layouts = struct.unpack_from("<I", mappa, header + 4)[0]
    groups = [struct.unpack_from("<I", mappa, offset)[0] for offset in range(floor_lists, layouts, 4)]

    def group_size(group: int) -> int:
        """Piani nell'elenco del gruppo: il primo è vuoto, e l'elenco finisce con una voce vuota."""
        count, offset = 0, groups[group] + MAPPA_FLOOR_SIZE
        while offset < floor_lists and mappa[offset:offset + MAPPA_FLOOR_SIZE] != bytes(MAPPA_FLOOR_SIZE):
            count, offset = count + 1, offset + MAPPA_FLOOR_SIZE
        return count

    data, labels = assemble(rodata.decode("utf-8"))
    base = labels["DUNGEON_DATA_LIST"]
    list_ids, by_dungeon = {}, {}
    for dungeon in range(1, FIRST_SPECIAL_DUNGEON):
        floors, group, preceding = data[base + 4 * dungeon], data[base + 4 * dungeon + 1], data[base + 4 * dungeon + 2]
        if not floors or group >= len(groups):
            continue
        row = []
        for floor in range(1, floors + 1):
            if floor + preceding > group_size(group):
                row.append(-1)   # piano che il gruppo non ha (Antro Nascosto): nessun dato
                continue
            entry = groups[group] + MAPPA_FLOOR_SIZE * (floor + preceding)
            list_index = struct.unpack_from("<H", mappa, entry + 2 * MAPPA_SECRET_ROOM_LIST)[0]
            row.append(list_ids.setdefault(list_index, len(list_ids)))
        by_dungeon[str(dungeon)] = row

    lists = [None] * len(list_ids)
    for list_index, position in list_ids.items():
        offset = struct.unpack_from("<I", mappa, item_lists + 4 * list_index)[0]
        lists[position] = secret_room_items(*read_mappa_item_list(mappa, offset), item_category)
    return {"fallback": SECRET_ROOM_FALLBACK, "lists": lists, "byDungeon": by_dungeon}


def assemble_rank_points(source: bytes) -> tuple[bytes, dict]:
    data, labels = assemble(source.decode("utf-8"))
    return data, labels


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
    etichetta. Gestisce il preprocessore (#ifdef, #if defined(...), #elif, #else, #endif, #define) per la
    versione europea e le direttive .byte, .hword, .word e .space.
    I .word che puntano a un'etichetta dello stesso file diventano la posizione di quell'etichetta."""
    data = bytearray()
    labels: dict[str, int] = {}
    values: dict[str, int] = {}
    relocations: list[tuple[int, str]] = []
    # Pila dei blocchi condizionali: [attivo il blocco esterno, un ramo già preso, attivo questo ramo]
    stack: list[list[bool]] = []

    def active() -> bool:
        return stack[-1][2] if stack else True

    def condition(expr: str) -> bool:
        expr = re.sub(r"defined\s*\(\s*(\w+)\s*\)|defined\s+(\w+)",
                      lambda m: str((m.group(1) or m.group(2)) in defines), expr)
        expr = expr.replace("&&", " and ").replace("||", " or ").replace("!", " not ")
        if not re.fullmatch(r"[\sA-Za-z()]+", expr) or re.search(r"[A-Za-z]+", expr.replace("True", "").replace("False", "").replace("and", "").replace("or", "").replace("not", "")):
            raise ValueError(f"condizione non gestita: {expr}")
        return bool(eval(expr, {"__builtins__": {}}))  # solo True/False e operatori logici, controllato sopra

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
            directive, _, rest = line.partition(" ")
            rest = rest.strip()
            if directive in ("#ifdef", "#ifndef", "#if"):
                if directive == "#if":
                    cond = condition(rest)
                else:
                    cond = (rest in defines) == (directive == "#ifdef")
                outer = active()
                stack.append([outer, cond, outer and cond])
            elif directive == "#elif":
                top = stack[-1]
                cond = not top[1] and condition(rest)
                top[2] = top[0] and cond
                top[1] = top[1] or cond
            elif directive == "#else":
                top = stack[-1]
                top[2] = top[0] and not top[1]
                top[1] = True
            elif directive == "#endif":
                stack.pop()
            elif directive == "#define" and active():
                name, _, value = rest.partition(" ")
                values[name] = evaluate(value) if value.strip() else 1
            continue
        if not active():
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
# Ultimi piani dei dungeon che si sbloccano dopo la storia, con i loro premi (enum fixed_room_id di
# pmdsky-debug). Usati come stanza di un Memo tesoro non hanno il tesoro della missione: la missione non
# si completa e si può ripetere. Il nome inglese serve a trovare l'ID del dungeon nei testi del gioco.
DUNGEON_END_ROOMS = {
    81: "Zero Isle North", 82: "Zero Isle East", 83: "Zero Isle West", 84: "Zero Isle South",
    85: "Oran Forest", 86: "Marine Resort", 87: "Serenity River", 88: "Landslide Cave",
    89: "Lush Prairie", 90: "Tiny Meadow", 91: "Surrounded Sea", 92: "Concealed Ruins",
    93: "Lake Afar", 94: "Happy Outlook", 95: "Mt. Mistral", 96: "Shimmer Hill",
    97: "Lost Wilderness", 98: "Midnight Forest", 99: "Zero Isle Center", 100: "Oblivion Forest",
    101: "Treacherous Waters", 102: "Southeastern Islands", 103: "Inferno Cave", 104: "Midnight Forest",
}
# Il contenuto dei Tecalusso dipende dal dungeon della missione (tabella ov29_02353050 letta da
# PlaceFixedRoomTile); fuori dalla tabella il gioco ci mette un Revitalseme.
BOX_TABLE_LABEL = "ov29_02353050"
BOX_FALLBACK_ITEM = 73
GOLDEN_CHAMBER_BOX_LABEL = "ov10_022C4B34"   # premi della Sala d'Oro (solo con la missione della Sala d'Oro)
# Negli elenchi, 0x579-0x57B indicano uno strumento esclusivo per un membro della squadra.
EXCLUSIVE_ITEM_CODES = range(0x579, 0x57D)


def crop(rows: list[str]) -> tuple[list[str], int, int]:
    """Taglia i muri esterni lasciando un bordo di una casella. Restituisce anche lo spostamento."""
    cells = [(x, y) for y, row in enumerate(rows) for x, char in enumerate(row) if char != "#"]
    if not cells:
        return rows, 0, 0
    x0 = max(min(x for x, _ in cells) - 1, 0)
    x1 = min(max(x for x, _ in cells) + 1, len(rows[0]) - 1)
    y0 = max(min(y for _, y in cells) - 1, 0)
    y1 = min(max(y for _, y in cells) + 1, len(rows) - 1)
    return [row[x0:x1 + 1] for row in rows[y0:y1 + 1]], x0, y0


def read_item_list(data: bytes, offset: int) -> list[int]:
    """Elenco di ID di strumenti a 16 bit terminato da zero."""
    items = []
    while offset + 2 <= len(data):
        value = struct.unpack_from("<h", data, offset)[0]
        if value == 0:
            break
        items.append(value)
        offset += 2
    return items


def read_box_lists(table_src: bytes, *list_srcs: bytes) -> tuple[dict, list[int]]:
    """Contenuto possibile dei Tecalusso per dungeon ({ID dungeon: [strumenti]}) e premi della Sala d'Oro."""
    source = table_src.decode("utf-8")
    table = source[source.index(f"{BOX_TABLE_LABEL}:"):]
    pairs = re.findall(r"\.byte (0x[0-9A-Fa-f]+), 0x00, 0x00, 0x00\s*\n\s*\.word (\w+)", table)
    assembled = [assemble(src.decode("utf-8")) for src in list_srcs]

    def lookup(label: str) -> list[int]:
        for data, labels in assembled:
            if label in labels:
                return read_item_list(data, labels[label])
        raise ValueError(f"elenco {label} non trovato")

    lists = {}
    for dungeon, label in pairs:
        lists[str(int(dungeon, 16))] = lookup(label)
    return lists, lookup(GOLDEN_CHAMBER_BOX_LABEL)


def build_rooms(fixed: bytes, entities_src: bytes, properties_src: bytes, ids1: bytes, ids2: bytes,
                box_table: bytes, box_lists1: bytes, box_lists2: bytes, box_lists3: bytes,
                en_strings: list[str]) -> dict:
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
    # Dungeon a cui appartiene l'ultimo piano (ID dai nomi inglesi del gioco).
    dungeon_start, dungeon_count = BLOCKS["dungeons"]
    dungeon_names = [clean_name(text) for text in en_strings[dungeon_start:dungeon_start + dungeon_count]]
    room_dungeons = {}
    for room_id, name in DUNGEON_END_ROOMS.items():
        kinds[room_id] = "dungeonEnd"
        room_dungeons[room_id] = dungeon_names.index(name)
    # Stanze senza il tesoro della missione ma con dei premi: in un Memo tesoro la missione non finisce mai.
    mission_rooms["withoutTreasure"] = sorted(list(DUNGEON_END_ROOMS) + [GOLDEN_CHAMBER, SECRET_ROOM, UNUSED_TREASURE_MEMO])
    box_lists, golden_items = read_box_lists(box_table, box_lists1, box_lists2, box_lists3)

    output = {}
    for room_id in sorted(kinds):
        room = rooms[room_id]
        rows = []
        placed = []
        for y in range(room["h"]):
            row = ""
            for x, action in enumerate(room["actions"][y * room["w"]:(y + 1) * room["w"]]):
                if action in BASE_ACTIONS:
                    row += BASE_ACTIONS[action]
                elif 0x10 <= action < 0x10 + len(entities):
                    char = entity_char(entities[action - 0x10])
                    if char in "ic":
                        placed.append((x, y, entities[action - 0x10]["item"]))
                    row += char
                else:
                    raise ValueError(f"stanza {room_id}: azione sconosciuta {action:#x}")
            rows.append(row)
        props = properties[room_id]
        if room_id >= SEALED_CHAMBER:
            # Per le stanze inserite in un piano normale il gioco ignora questi divieti.
            props = {**props, "orbs": 1, "warps": 1, "trawl": 1}
        cropped, x0, y0 = crop(rows)
        entry = {"kind": kinds[room_id], "props": props, "map": cropped}
        if room_id in room_dungeons:
            entry["dungeon"] = room_dungeons[room_id]
        if placed:
            entry["items"] = [[x - x0, y - y0, item] for x, y, item in placed]
        output[str(room_id)] = entry
    boxes = {"fallback": BOX_FALLBACK_ITEM, "byDungeon": box_lists, "goldenChamber": golden_items,
             "exclusiveCodes": list(EXCLUSIVE_ITEM_CODES)}
    return {"missionRooms": mission_rooms, "legend": LEGEND, "boxes": boxes, "rooms": output}


# ---------------------------------------------------------------------------
# Scrittura
# ---------------------------------------------------------------------------

def compact(value) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(", ", ": "))


def format_rooms(payload: dict) -> str:
    """Una riga per ogni riga della mappa, così le differenze tra versioni restano leggibili."""
    lines = ["{"]
    for key in ("source", "missionRooms", "legend", "boxes", "secretRoom"):
        lines.append(f" {compact(key)}: {compact(payload[key])},")
    lines.append(' "rooms": {')
    room_items = list(payload["rooms"].items())
    for index, (room_id, room) in enumerate(room_items):
        head = {key: value for key, value in room.items() if key != "map"}
        lines.append(f"  {compact(room_id)}: {compact(head)[:-1]}, \"map\": [")
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
    monsters = read_monsters(load_source("monster", args.pmd_sky))
    genders = monsters["gender"]

    source = f"pret/pmd-sky@{PMD_SKY_COMMIT[:12]}"
    main_rodata = load_source("mainRodata", args.pmd_sky)
    mission_text = build_mission_text_tables(load_source("rescue", args.pmd_sky), main_rodata,
                                             load_source("itcm", args.pmd_sky))
    mission_ids = mission_text.pop("stringIds")
    floor_formats = read_floor_formats(load_source("textRodata", args.pmd_sky))
    for lang, label in (("it", "italiano"), ("en", "inglese (EU)")):
        payload = build_language(texts[lang])
        payload["missionTexts"] = build_mission_texts(texts[lang], mission_ids)
        payload["floorFormat"] = floor_formats[lang]
        payload["source"] = f"{source} {SOURCES[lang][0]}"
        write_js(
            args.out / f"testi_gioco_{lang}.js",
            f"window.WMSkyGameText = window.WMSkyGameText || {{}};\nwindow.WMSkyGameText.{lang}",
            payload,
            f"Testi ufficiali in {label} di PMD: Esploratori del Cielo, © Nintendo, Creatures, GAME FREAK, Spike Chunsoft.",
        )

    shared = build_shared(texts["en"], genders)
    item_p = load_source("itemP", args.pmd_sky)
    shared["itemCategory"] = read_item_categories(item_p)
    shared["itemLook"] = read_item_looks(item_p)
    banned = read_label_halfwords(main_rodata, "MISSION_BANNED_MONSTERS")
    shared.update(build_mission_floors(load_source("dungeonRodata", args.pmd_sky), main_rodata))
    shared.update(build_mission_pokemon(monsters, banned))
    # Numero del Pokédex nazionale di ogni ID del gioco (per i ritratti di PMDCollab).
    shared["nationalDex"] = monsters["dex"][:600]
    shared["missionText"] = mission_text
    shared["source"] = source
    write_js(args.out / "dati_gioco.js", "window.WMSkyGameData", shared,
             "Dati di PMD: Esploratori del Cielo che non dipendono dalla lingua.")

    rooms = build_rooms(*(load_source(key, args.pmd_sky) for key in
                          ("fixed", "fixedEntities", "fixedProperties", "roomIds1", "roomIds2",
                           "boxTable", "boxLists1", "boxLists2", "boxLists3")), texts["en"])
    rooms["secretRoom"] = build_secret_room(load_source("mappa", args.pmd_sky), load_source("dungeonRodata", args.pmd_sky),
                                            shared["itemCategory"])
    rooms["source"] = f"{source} {SOURCES['fixed'][0]}"
    write_js(args.out / "stanze_fisse.js", "window.WMSkyFixedRooms", rooms,
             "Stanze speciali di PMD: Esploratori del Cielo (forme e contenuto dai dati del gioco).",
             body=format_rooms(rooms))
    return 0


if __name__ == "__main__":
    sys.exit(main())
