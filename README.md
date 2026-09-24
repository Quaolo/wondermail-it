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

The page has three parts. At the top there is "Start from", with four ways to begin: "Read a password",
"Quick access", "Find a reward" and "Unlock a dungeon". Only one is open at a time. In "Read a password" you
paste a password and the site works out its region (Europe, America or Japan), checks that it is valid and
loads the mission into the form; "Quick access" has shortcuts for the most wanted missions.

Below, on the left, is the form: whatever you started from, you can always tweak it by hand. When a starting
point fills it in, the fields that changed light up and the top of the form says where the mission comes
from, with "Undo" to go back to how it was and "Change" to reopen that panel. On the right the result is
always in view: a preview of the game's "Job Summary" screen, with client, difficulty and reward, the
password to copy; the room map sits below the form. The preview always matches the password you are about to copy. On a phone
the password also stays in a bar at the bottom of the screen.

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
by their Italian name. In "Variants", under the password, you can also make a twin mission, on the next floor or with a
different seed. For the game it is a different mission, so you can keep both in your list. If you want
more, "Mission series" makes up to eight at once, as many as the game's job list holds: on consecutive floors
(skipping the ones the game refuses) or with different seeds. You can copy them one by one or all together.

## Mission title and description

In the game every mission has a title and a few lines of description, and the sentences change from one
mission to the next. They aren't stored in the password: the game picks them from the ones it already has,
starting from a number that is in the password (the text seed) together with the dungeon and the floor. The
site makes the same choice, so "Job Summary" shows the text you will see in the game, in English or Italian.

If you don't like the text, open "Choose the text": you'll find the possible sentences for that mission, and
one click uses the seed that gives the one you prefer. The rest of the mission stays the same. Some missions
always have the same text (Treasure Memos, for example, have one sentence per dungeon), and the site tells you so.

I checked the result against some officially distributed missions whose text is known: titles and
descriptions match. One case, though, I only worked out from the code. When the mission doesn't look like any
of the ones the game expects (a Treasure Memo in a dungeon where the game never puts one, or a rescue with a
pair of Pokémon that normal missions don't have), the game reads the text from the wrong place in memory. The
site shows what should come out, but marks it as not tested yet.

## The job board

The "Job board" card prepares a day of missions the way the game does every morning: the Job Bulletin Board,
the Outlaw Notice Board, the Spinda's Café request and the message in a bottle. I rewrote the game's rules:
which categories can come out, the Pokémon, dungeons and floors, items, rewards and restrictions. The game
also looks at your save file, though, and the site can't know it, so it imagines a finished game with every
dungeon open. The team rank is yours to pick, because it decides which missions can appear and whether they
have restrictions. That's also why the missions that open a dungeon, like the musical instrument ones, never
show up: in a finished game those dungeons are already open.

One click on a mission loads it into the form, with "Undo" to go back. The form has every variant the board
uses: the child, friend, loved one or rival to rescue, the loved one to escort the client to, the precious
treasure, the item that makes the client evolve, their favorite Gummi, fleeing outlaws and the different outlaw
lists of Magnemite and Magnezone. For the variants that use fixed pairs in the game (Beedrill looking for
Weedle, for example) there's a menu with the game's pairs. The game accepts other pairs too, but only these
have a title. Togetic's Gabite Scale job is there as well: in the game it opens Labyrinth Cave, but I haven't
tried it with a password yet.

Team restrictions (a partner of a certain type or a specific Pokémon) can now also be picked in the form,
among the advanced options. "Job Summary" has a button to remove them, and the board has a box that removes
them from every mission.

## The mission floor

Below the room there's a card with the floor the mission takes you to, from the game's dungeon data: the
weather, how far you can see in hallways, the odds of finding a Kecleon Shop, a Monster House or hidden stairs,
the Pokémon that appear with their level, the items on the ground and the traps, each with the odds the game
uses to pick it. The arrows show the other floors of the same dungeon without touching the mission, and if you
like one better you can switch to it with a click. It's mostly handy for missions you repeat: you can see at a
glance which floor is easier, or where the hidden stairs lead to the Secret Room.

For missions with a special room (Treasure Memo, challenges, hideouts) the room takes the floor's place, so
its layout, items and traps are the room's own: the card says so.

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

In "Find a reward", in the bar at the top, pick the reward you want and the site tells you which room
and which dungeon it is in, with the odds for every Deluxe Box; one click sets up the mission. In the
generator these rooms are listed separately, under "Rooms without treasure". Some of them have Deluxe Boxes,
and what is inside depends on the mission's dungeon: in Marine Resort, for example, you get Gummis of every
kind. The full table is in the room card. The secret room (113) is the exception: there the game draws from
the floor's own list, so the mission floor matters too, and the site shows what comes out on every floor of
every dungeon. Players have tested the trick with room 81; for the other rooms I
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
- Reward types follow the game code (`InitMissionReward`). For the egg and for the Pokémon that joins the
  team you can pick the species: by default it is the client, as in job board missions. For the egg the game
  accepts any species, while the one joining the team has to be a Pokémon that could be a client.
- Team restrictions end up in the password and show in "Job Summary". Before, they were always empty.
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
the texts (names, descriptions, "Job Summary" sentences, mission titles and descriptions with the tables to
pick them), the tables the game uses to fill the job board, item and Pokémon data (Pokédex number for the
portraits, who can be a client), the floors and difficulty of every dungeon, the special rooms and what's on
every floor (weather, Pokémon, items and traps, from `mappa_s.bin`).

The rest of the code is plain JavaScript with no libraries: `lm.js` encodes and decodes passwords,
`lmgenerate.js` describes the mission types, `testi_missione.js` picks the title and description, `bacheca.js` prepares the job board missions, `app.js` and `stanze.js` run the page and the maps. In
`config.js` you can set the repository address to show the GitHub button at the top. The code and its
comments are in Italian, which is where the project comes from.

## Tests

```
node --test                  # encoding, rooms, Pokémon, floors, validity, rewards, texts, job board, floor data, icons and translations (Node 18+)
python tests/ui_smoke.py     # tries the page in a real browser, needs Playwright
```

The encoding test compares 60 passwords with those of the original generator and they are identical.

## Still to be checked

- A valid password can still be refused by the game if the dungeon isn't unlocked yet, if the mission is
  already in your list or if the list is full: those depend on your save file and the site can't know them.
- The rooms without treasure other than 81 still have to be tried in the game.
- The text of missions the game doesn't expect (see above) is worked out from the code and still has to be
  tried in the game.
- The job board follows the game's code, but I haven't compared it with a real board yet. A curious detail to
  check: when the reward is an egg, the game writes a number drawn from the item list as the species, so the
  egg species the site shows might not be the one that actually hatches.
- The Gabite Scale job made with a password still has to be tried in the game: I don't know if it opens
  Labyrinth Cave like the board one does.
- The game says which items share the same icon, but not what color they are. For some of them I picked the
  colors myself and they might not match.

## Credits

- RedCoal27's [wondermail_pdm](https://github.com/RedCoal27/wondermail_pdm), the project I started from
- the old Wonder Mail S generator, in the public domain, and the French version by
  [SombrAbsol](https://github.com/SombrAbsol/SombrAbsol.github.io)
- [pret/pmd-sky](https://github.com/pret/pmd-sky) for the game files and tables
- [SkyTemple](https://github.com/SkyTemple/skytemple-files) for the text, room and dungeon floor formats
- [pmdsky-debug](https://github.com/UsernameFodder/pmdsky-debug) for the documentation of the game functions
- [Lai-brary](https://laioxy.github.io/wondermail/) for the Japanese table, the egg glitch and the dungeon unlock glitch
- [Sonictrainer's Wonder Mail S FAQ](https://gamefaqs.gamespot.com/ds/955859-pokemon-mystery-dungeon-explorers-of-sky/faqs/58573)
  on GameFAQs, with the texts of official missions used to check titles and descriptions
- the [Grovyle wiki](https://wiki.grovyle.net/pokedun3/) for the real Treasure Memos
- [Pokémon Central Wiki](https://wiki.pokemoncentral.it/) for the Italian names of alternate forms
- [PMDCollab SpriteCollab](https://sprites.pmdcollab.org/) for the portraits (by Spike Chunsoft and community
  artists, CC BY-NC 4.0), which are loaded from GitHub and not included here
- the [PMDO wiki](https://wiki.pmdo.pmdcollab.org/) and the [PMDO](https://github.com/audinowho/DumpAsset)
  files for the item icons
- [Pixelify Sans](https://github.com/eifetx/Pixelify-Sans) for the title font (SIL Open Font License; here with a redrawn 5, since it looked like an S)

I developed this project together with Claude.

## License

The code is released under the MIT license, the full text is in [LICENSE](LICENSE). The license does not
cover the game texts and data in `data/`, which belong to their owners, nor the third party resources listed
above, which have their own licenses. The starting code of wondermail_pdm was published by RedCoal27 without
an explicit license; the Wonder Mail S generator both projects come from is in the public domain.

*Pokémon Mystery Dungeon: Explorers of Sky* © Nintendo, Creatures, GAME FREAK, Spike Chunsoft. This is a fan
project, non-profit and not affiliated with the rights holders.
