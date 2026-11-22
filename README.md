# EMBERFALL — Duel of the Four Sigils

A 1v1 tactical card duel for the desktop browser. Reduce Archmage Vaelor from 20 Life to 0 before he defeats you: summon creatures, cast spells, and clash across four sigils — Flame, Tide, Thorn and Stone — each told apart by colour and shape.

[![make.fun bounty](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/quick-gecko-11-5515/emberfall-duel/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/quick-gecko-11-5515/emberfall-duel/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

Entered in the make.fun bounty [Make the best card game](https://make.fun/bounty/best-card-game-20261122-1826).

## Play

Serve the `game/` folder with any static file server (for example `node serve.ts`, then open http://localhost:8080) and play with the mouse. No network requests, no build step.

- 20 Life each, 5-card opening hand, rising Energy each turn.
- 20 distinct cards: creatures that stay and fight, and instant spells.
- Stone Guard creatures must be attacked first; Flame allies rally each other; Tide fuels card draw and spellcraft; Thorn endures and heals.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with `vendor/makefun-game.ts`.
- `game/` — the playable game as static files (`index.html`, `style.css`, `src/` modules: cards, state, ai, render, audio, shots, main).
- `screenshots/` — real renders of the game: the battle table (cover), title screen, victory and defeat screens.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## License

MIT — see `LICENSE`.
