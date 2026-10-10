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

The page has three parts. At the top there is "Start from", with six ways to begin: "Read a password",
"Quick access", "Job board", "Find a reward", "Unlock a dungeon" and "Friend Rescue". Only one is open at a time. In "Read a password" you
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
descriptions match. There's one case to avoid. When the mission doesn't look like any of the ones the game
expects (a Treasure Memo in a dungeon where the game never puts one, an outlaw hideout or a Challenge Letter
with Pokémon other than the game's, a rescue with a pair normal missions don't have), the game looks for the
text in the wrong place in memory. I thought it would show some odd text, but it freezes as soon as you
confirm the password and you have to switch the console off: I tried it with a Magnemite hideout with Meowth
and Rattata. That's why the site won't give the password for these missions and explains why, and if you
read one it warns you. "Find a reward" only lists the dungeons where a Treasure Memo has its text.

## The job board

The "Job board" card prepares a day of missions the way the game does every morning: the Job Bulletin Board,
the Outlaw Notice Board, the Spinda's Café request and the message in a bottle. I rewrote the game's rules:
which categories can come out, the Pokémon, dungeons and floors, items, rewards and restrictions. The game
also looks at your save file, though, and the site can't know it, so it imagines a game with the story
finished. The team rank is yours to pick, because it decides which missions can appear and whether they have
restrictions.

You can also set every dungeon: completed, open or closed. As in the game, normal jobs only go to completed
dungeons, while the ones that open a dungeon only show up while it's closed or not completed yet: the Gabite
Scale for Labyrinth Cave, "explore a new dungeon" for Shimmer Hill and Midnight Forest, and Spinda's Café
requests for the musical instruments of the seven dungeons that hold them. One button closes all of these
dungeons at once. Your choice is saved in your browser.

One click on a mission loads it into the form, with "Undo" to go back. The form has every variant the board
uses: the child, friend, loved one or rival to rescue, the loved one to escort the client to, the precious
treasure, the item that makes the client evolve, their favorite Gummi, fleeing outlaws and the different outlaw
lists of Magnemite and Magnezone. For the variants that use fixed pairs in the game (Beedrill looking for
Weedle, for example) there's a menu with the game's pairs, and the same goes for outlaw hideouts and normal
Challenge Letters, which have fixed trios (outlaw and accomplice, or the three challengers). With a different
pair, when the game can't find the mission text it freezes, so the site won't give the password. The jobs that open a dungeon in the game (Gabite Scale, new dungeon, musical instruments) are
there too, but I haven't tried them with a password yet: the site says so under the mission type.

In jobs that don't show a target item, and in those that pay in Poké, the password still holds a value you
can't see. When you load a mission into the form, the site remembers it: if you change something else, that
part stays as it was.

Team restrictions (a partner of a certain type or a specific Pokémon) can now also be picked in the form,
among the advanced options. "Job Summary" has a button to remove them, and the board has a box that removes
them from every mission.

## The mission floor

Below the room there's a card with the floor the mission takes you to, from the game's dungeon data: the
weather, how far you can see in hallways, the odds of finding a Kecleon Shop, a Monster House or hidden stairs,
the Pokémon that appear with their level, the items on the ground and the traps, each with the odds the game
uses to pick it. If the floor can have a Kecleon Shop or a Monster House, you can also open the list of
what they hold, and the same goes for items buried in the walls. The arrows show the other floors of the same dungeon without touching the mission, and if you
like one better you can switch to it with a click. It's mostly handy for missions you repeat: you can see at a
glance which floor is easier, or where the hidden stairs lead to the Secret Room.

For missions with a special room (Treasure Memo, challenges, hideouts) the room takes the floor's place, so
its layout, items and traps are the room's own: the card says so.

## The Wiki

The Wiki button at the top opens a window over the generator with every item, Pokémon, dungeon, ability, IQ skill and trap in the game.
You can search in English or Italian, and filter items by category. Each entry tells you where to find it,
floor by floor: for an item, the dungeons where it lies on the ground, sits in Kecleon Shops or Monster Houses,
or is buried in the walls; for a Pokémon, the dungeons where it appears, with floors, level and odds; for a
dungeon, what's on each floor. Names are links, so from a berry you can jump to a dungeon and from there to the
Pokémon that live in it.

The IQ tab lists every IQ skill with its effect (you can search by effect, such as "traps"), the IQ it needs, the
skills it can't be turned on with, and the IQ groups that can have it. A Pokémon's entry shows its IQ group and the
skills it can get.

The Traps tab explains each trap and lists the dungeons and floors where the game places it, with the highest odds.
The floor view links every trap to its entry.

Every Wiki entry has its own address, such as `#wiki/pokemon/25` or `#wiki/dungeons/12/5` (dungeon 12, floor 5):
the address bar follows what you're reading, and the Copy link button next to the title copies it, so you can send
someone straight to an entry. Opening such an address opens the Wiki on that entry.

A Pokémon's entry also shows its types, its abilities with their effect, its stats (the level-1 values from the game's
table plus the growth of each level, with a slider from level 1 to 100, and the experience points needed to reach that level and the next; I haven't compared those yet with a real playthrough) and its whole evolution family, with what each evolution needs: level,
IQ, an item, or an extra condition such as a ribbon, a move or Attack against Defense. You can also search Pokémon
by type or by ability. The Abilities tab explains each ability and lists the Pokémon that have it. The Moves tab can be filtered by type and category, and shows type, category, power, PP,
accuracy (both values the game uses, not yet checked in play), range and effect of every move and which Pokémon learn it (by level, with TM/HM or as an egg move); each
Pokémon's entry lists its own moves the same way. Types have a small pixel-art symbol drawn for this site, not the game's own, and in the move list a tiny mark in the corner tells physical, special and status moves apart.

In the "Where to find it" lists of a Pokémon or an item, the Mission here button sets up the mission for you: that
dungeon, the first floor where a mission is allowed, and the Pokémon or item as the target. It works when the chosen
job type has a free target; otherwise the button is greyed out and says why. Undo is there as usual.

The Wiki doesn't touch your mission: close it (Esc works too) and everything is as you left it, and when you
open it again you're back on the entry you were reading. If you do want to use what you found, there are
buttons to put it in the form as the reward, the item, the client, the target or the dungeon, with Undo like
the other starting points. The floor card has a button that opens the same floor in the Wiki.

## Unlocking a dungeon

The "Unlock a dungeon" card sets up the trick found by Lai-brary: a Jirachi Challenge Letter with another
dungeon written inside. When you start the mission the game announces that Star Cave has opened, but it also
opens the dungeon you picked. It only works in Explorers of Sky and you need to have reached at least Secret
Rank. The warnings are in the card: the most important one is that unlocking a story dungeon too early can
break the rest of your game, and once you save there is no going back. If you paste one of these passwords in
"Read a password", the site recognizes it and opens it in its card.

## Friend Rescue

When your team faints, the game lets you send an SOS Mail as a 54-character password and wait for a friend to
come and save you: they answer with an A-OK Mail and you get back up on the floor where you fell, without
losing money or items. The "Friend Rescue" tab does both sides. Paste your SOS Mail and it gives you the A-OK
Mail, so you can rescue yourself. Or pick a dungeon and a floor and it gives you an SOS Mail to enter with
"Receive SOS Mail", so you can go on a rescue wherever you like. The site also shows how many attempts the
game allows in that dungeon and leaves out the dungeons where rescues aren't possible. These passwords, too,
land in their own tab if you paste them into "Read a password".

Something found while testing: the SOS Mail's dungeon must already be unlocked in your game. The game accepts
the SOS Mail even if it isn't, and the dungeon shows up as "???" in the list, but when you pick the job at
Pelipper's it tells you it can't send you to a dungeon you don't know. Another one: every SOS Mail has a unique
code and the game won't accept the same code twice, so the site makes a new one at every change, and it
suggests a random Pokémon as the team name (you can type your own).

Sky also accepts SOS Mails from Explorers of Time and Darkness, and the game's list shows which version a job
comes from. In the tab you can pick the version: the dungeon is the same, but according to the guides the items
you find are the Time and Darkness ones. That's still to be tried too.

The site also tells you what a rescue is worth: the game doesn't write it in the password, it works it out from
the SOS floor. The rescuer gets the exploration points of the floor's difficulty and one item drawn at random
from that difficulty's reward list, the same one the job board uses; no money. The tab lists the possible
items with their odds. The first test agreed: a rescue at Northern Desert 2F, difficulty B, gave a Vile Seed,
which is on that list.

In the same test the rescue went all the way and the site reads the game's A-OK Mail with no trouble. It holds
the rescuer's name and code: apart from those, it is identical to the one the site makes from the SOS Mail.
That's why the site's A-OK Mails show a rescuer team named after a random Pokémon.

I worked out the format from the game's code: it uses the same encryption as Wonder Mail S with a different
character order and a simpler check. When an A-OK Mail arrives the game only checks that it is an A-OK Mail
and that its code matches an SOS Mail sent from that game, so it only works there and only once. Japanese
passwords use other characters and don't work here.

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
node --test                  # encoding, rooms, Pokémon, floors, validity, rewards, texts, job board, floor data, rescues, icons and translations (Node 18+)
python tests/ui_smoke.py     # tries the page in a real browser, needs Playwright
```

The encoding test compares 60 passwords with those of the original generator and they are identical.

## Still to be checked

- A valid password can still be refused by the game if the dungeon isn't unlocked yet, if the mission is
  already in your list or if the list is full: those depend on your save file and the site can't know them.
- The rooms without treasure other than 81 still have to be tried in the game.
- The job board follows the game's code, but I haven't compared it with a real board yet. A curious detail to
  check: when the reward is an egg, the game writes a number drawn from the item list as the species, so the
  egg species the site shows might not be the one that actually hatches.
- The jobs that open a dungeon (Gabite Scale, new dungeon, Spinda's Café musical instruments) made with a
  password still have to be tried in the game: I don't know if they open the dungeon like the board ones do.
- Friend Rescue: the site's SOS Mails work in the game all the way and the game's A-OK Mail matches the site's
  (tried on 29/09). One step is left: a site A-OK Mail entered in the game that sent a real SOS Mail. SOS
  Mails from Time and Darkness still have to be tried too.
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
  files for the item, trap and effect icons
- [Pixelify Sans](https://github.com/eifetx/Pixelify-Sans) for the title font (SIL Open Font License; here with a redrawn 5, since it looked like an S)

I developed this project together with Claude.

## License

The code is released under the MIT license, the full text is in [LICENSE](LICENSE). The license does not
cover the game texts and data in `data/`, which belong to their owners, nor the third party resources listed
above, which have their own licenses. The starting code of wondermail_pdm was published by RedCoal27 without
an explicit license; the Wonder Mail S generator both projects come from is in the public domain.

*Pokémon Mystery Dungeon: Explorers of Sky* © Nintendo, Creatures, GAME FREAK, Spike Chunsoft. This is a fan
project, non-profit and not affiliated with the rights holders.
