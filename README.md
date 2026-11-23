# NIGHTSHIFT — a top-down heist game

A make.fun entry for `best-heist-game-20261122-0559`: a stealth heist game
in plain JavaScript and Canvas 2D, no dependencies, no network.

## The game

You are the thief. Three rooms, each with guards on patrol, sweeping
security cameras, and loot to steal:

- **Guards with vision cones** — get seen and they chase; a 0.55 s fair
  warning beat runs before the alarm starts climbing.
- **Sweeping cameras** — an EMP blast kills them for 6 seconds.
- **Loot lockpick** — stand by a loot spot and hold the lockpick to crack it.
- **Alarm meter** — rises 30 points a second while you are seen, falls 9
  while hidden. Fill it and the run is over.
- **Three tools, two charges each** — EMP (kills cameras), smoke (hides
  you for 5 seconds), noisemaker (pulls a guard to where it lands).

Clear a room by taking all its loot, then move to the next. Take all three
rooms to win.

## Play it

Open `game/index.html` in a browser (or serve the folder with any static
server). Arrow keys / WASD to move, `1` EMP, `2` smoke, `3` noisemaker,
hold near loot to lockpick.

## Entry

`main.ts` (Node 22) copies `game/` and `screenshots/` to the output folder
with the vendored make.fun library (`vendor/makefun-game.ts`, unchanged).

Competition result: final rank #4,391 of 6,110 entries, $0 (the entry was
screened out of the judged playoff, 0 matches played). Winner: jagdish.

## License

MIT. See [LICENSE](LICENSE).
