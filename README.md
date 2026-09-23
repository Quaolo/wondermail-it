# Missioni Speciali C

**English** · [Italiano](README.it.md)

> This project started because I wanted a Wonder Mail S generator entirely in Italian, with the names and
> sentences of the Italian version of the game: *Missioni Speciali C* is what Wonder Mail S is called there.
> It then grew into a full generator in two languages, and the site now opens in English so that anyone can
> use it. Italian is one click away.

A password generator for Wonder Mail S in *Pokémon Mystery Dungeon: Explorers of Sky* (*Missioni Speciali C*
in the Italian version). It works in English and Italian, and the names, sentences and room maps come
straight from the game.

I started from RedCoal27's [wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm). Along the way the
project changed a lot: the interface is new, the data is extracted from the game instead of being copied from
wikis, and a few bugs of the old generator have been fixed.

## How to use it

The site is online here: <https://quaolo.github.io/wondermail-it/>.

To run it locally there is nothing to install, just open `index.html` in a browser. If you prefer a small
local server:

```
python -m http.server 8000
```

and then go to <http://localhost:8000>. The language can be changed from the menu in the top right corner
(your choice is remembered) or by adding `?lang=it` or `?lang=en` to the address. Everything works offline
except the Pokémon portraits, which are loaded from PMDCollab.

European passwords work for every language of the European cartridge.

## What it does

Next to the form there are two cards that open with a click: "Read a password" and "Quick access". In the
first one you paste a password and the site works out its region (Europe, America or Japan), checks that it
is valid and loads the mission into the generator, ready to be edited. The second one has shortcuts for the
most wanted missions. As soon as you start filling in the mission by hand they close by themselves, so the
preview has room. The preview shows the game's "Job Summary" screen, with client, difficulty and reward, and
it always matches the password you are about to copy.

Missions with a special room (Treasure Memos, Challenge Letters, outlaw hideouts, the Sealed Chamber and the
Golden Chamber) also show a map of the room, with what is inside and the rules that apply there. For 12 of
the 30 Treasure Memos there is also a real mission taken from the Japanese Grovyle wiki, converted for your
region.

The four Pokémon at the top are just decoration: click them and the team changes.

A few animations go along with the work: the password types itself, the windows slide in gently and the
values in "Job Summary" light up when they change. If you asked your system to reduce motion, the site turns
them off.

In "Quick access" three buttons give you a different mission on every click: a normal mission, an outlaw and
a surprise one (anything can come out, even a Challenge Letter or a Treasure Memo). The egg mission changes
species every time too. The values come from the form's own lists, so the password is always one the game
accepts.

Other handy things: items are grouped by category (berries, Gummis, orbs, TMs and so on) and can also be found
by their Italian name. From a password you can also make a twin mission, on the next floor or with a
different seed. For the game it is a different mission, so you can keep both in your list. If you want
more, "Mission series" makes up to eight at once, as many as the game's job list holds: on consecutive floors
(skipping the ones the game refuses) or with different seeds. You can copy them one by one or all together.

## Unlocking a dungeon

The "Unlock a dungeon" card sets up the trick found by Lai-brary: a Jirachi Challenge Letter with another
dungeon written inside. When you start the mission the game announces that Star Cave has opened, but it also
opens the dungeon you picked. It only works in Explorers of Sky and you need to have reached at least Secret
Rank. The warnings are in the card: the most important one is that unlocking a story dungeon too early can
break the rest of your game, and once you save there is no going back. If you paste one of these passwords in
"Read a password", the site recognizes it and opens it in its card.

## Missions that never end

The game does not check which room a Treasure Memo points to. If the mission treasure is not in the room, the
mission can't be completed and stays in your list, and every time you go back to the dungeon you find the
room's rewards again. The best known case is this European password, on the first floor of Beach Cave, which
uses room 81 (two Wonder Gummis, a Golden Mask and a Wonder Chest on every visit):

```
=27YY RQ+4%WP CCCTTPTP21 P#%33FM =+66N
```

In the "Find a reward" card, next to the form, pick the reward you want and the site tells you which room
and which dungeon it is in, with the odds for every Deluxe Box; one click sets up the mission. In the
generator these rooms are listed separately, under "Rooms without treasure". Some of them have Deluxe Boxes,
and what is inside depends on the mission's dungeon: in Marine Resort, for example, you get Gummis of every
kind. The full table is in the room card. Players have tested the trick with room 81; for the other rooms I
worked it out from the game code and haven't tried it yet.

## What changed from the original generator

- Challenge Letters use rooms 150-154 and hideouts 160-164, as in the game. They used to be 145-160 and
  161-165.
- Treasure Memos work like the real ones: client and target are the same Pokémon, the target item is in the
  Deluxe Box and you choose the reward. They used to be locked to Turtwig and the Apple.
- When reading a password the checksum is verified. Before, about one random string in nine got through.
- Japanese passwords are recognized.
- The third member of Challenge Letters and the accomplice in hideouts really end up in the password.
- A male Arbok no longer turns into Nidoran♂, and an out of range value is reported instead of giving a wrong
  password.
- The list of clients follows the game's rules. The old generator left out about twenty Pokémon the game
  accepts, including Nidoqueen, Typhlosion, Treecko, Mudkip and Chimchar. Those the game refuses as clients,
  like Grovyle or the legendaries, can still be picked as targets. When the client joins your team, Pokémon
  that are too big, like Onix, are not offered.
- Before giving you the password the site repeats the game's own checks (`IsMissionValid`): dungeon, floor
  (including the floors the game refuses, usually the boss floor), Pokémon, target item and reward. So a
  password the game would reject is flagged right away, with the reason.
- The number of floors of each dungeon and the mission difficulty come from the game's tables. They used to
  be collected by the community, and in 17 dungeons out of 54 the floor limit was wrong: in Mystery Jungle,
  for example, it stopped at 14 instead of 29, and in Amp Plains it went up to 20 instead of 10.
- Item icons follow the game data: two items that share an icon in the game share it here too, for example
  almost all seeds or the held ribbons.

## Game data

The files in `data/` are rebuilt by `tools/estrai_dati.py`, which reads the
[pret/pmd-sky](https://github.com/pret/pmd-sky) decompilation. No ROM is needed, just Python 3.9 or newer:

```
python tools/estrai_dati.py
python tools/estrai_dati.py --pmd-sky ../pmd-sky   # if you already have a copy of pret/pmd-sky
```

The script downloads the files from a fixed commit and checks that they haven't changed. From there it gets
the texts (names, descriptions, "Job Summary" sentences), item and Pokémon data (Pokédex number for the
portraits, who can be a client), the floors and difficulty of every dungeon and the special rooms.

The rest of the code is plain JavaScript with no libraries: `lm.js` encodes and decodes passwords,
`lmgenerate.js` describes the mission types, `app.js` and `stanze.js` run the page and the maps. In
`config.js` you can set the repository address to show the GitHub button at the top. The code and its
comments are in Italian, which is where the project comes from.

## Tests

```
node --test                  # encoding, rooms, Pokémon, floors, validity, rewards, icons and translations (Node 18+)
python tests/ui_smoke.py     # tries the page in a real browser, needs Playwright
```

The encoding test compares 60 passwords with those of the original generator and they are identical.

## Still to be checked

- Reward types 4 to 6 still have the names from the original generator, which don't fully match what is known
  about the game.
- A valid password can still be refused by the game if the dungeon isn't unlocked yet, if the mission is
  already in your list or if the list is full: those depend on your save file and the site can't know them.
- The rooms without treasure other than 81 still have to be tried in the game.
- The game says which items share the same icon, but not what color they are. For some of them I picked the
  colors myself and they might not match.

## Credits

- RedCoal27's [wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm), the project I started from
- the old Wonder Mail S generator, in the public domain, and the French version by
  [SombrAbsol](https://github.com/SombrAbsol/SombrAbsol.github.io)
- [pret/pmd-sky](https://github.com/pret/pmd-sky) for the game files and tables
- [SkyTemple](https://github.com/SkyTemple/skytemple-files) for the text and room formats
- [pmdsky-debug](https://github.com/UsernameFodder/pmdsky-debug) for the documentation of the game functions
- [Lai-brary](https://laioxy.github.io/wondermail/) for the Japanese table, the egg glitch and the dungeon unlock glitch
- the [Grovyle wiki](https://wiki.grovyle.net/pokedun3/) for the real Treasure Memos
- [Pokémon Central Wiki](https://wiki.pokemoncentral.it/) for the Italian names of alternate forms
- [PMDCollab SpriteCollab](https://sprites.pmdcollab.org/) for the portraits (by Spike Chunsoft and community
  artists, CC BY-NC 4.0), which are loaded from GitHub and not included here
- the [PMDO wiki](https://wiki.pmdo.pmdcollab.org/) and the [PMDO](https://github.com/audinowho/DumpAsset)
  files for the item icons
- [Pixelify Sans](https://github.com/eifetx/Pixelify-Sans) for the title font (SIL Open Font License)

I developed this project together with Claude.

## License

The code is released under the MIT license, the full text is in [LICENSE](LICENSE). The license does not
cover the game texts and data in `data/`, which belong to their owners, nor the third party resources listed
above, which have their own licenses. The starting code of wondermail_pdm was published by RedCoal27 without
an explicit license; the Wonder Mail S generator both projects come from is in the public domain.

*Pokémon Mystery Dungeon: Explorers of Sky* © Nintendo, Creatures, GAME FREAK, Spike Chunsoft. This is a fan
project, non-profit and not affiliated with the rights holders.
