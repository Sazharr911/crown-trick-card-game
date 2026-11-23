# crown-trick-card-game

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Sazharr911/crown-trick-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Sazharr911/crown-trick-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Crown Trick** is a trick-taking card game for one player against three AI rivals — Captain Rook, Baroness Vex and Madame Fable — seated around an emerald-and-gold table. Each hand deals a full 52-card deck, thirteen tricks, with a trump suit that rotates every hand. Follow suit if you can; the highest card of the suit led takes the trick, unless a trump says otherwise. Every trick scores 2 points, capturing the **Crown Jack** (the Jack of trump, marked with a crown wherever it appears) scores +3, and sweeping all thirteen tricks adds +5. First to 40 points takes the crown.

The rivals play a real policy, not dice rolls: they win tricks as cheaply as they can, spend more when the Crown Jack is on the table, protect their own Crown Jack, and shed low cards when a trick is lost. Deals come from a seeded shuffle, so a game can be replayed exactly. The whole game is one static folder — plain HTML, CSS and ES modules, every card drawn in CSS, no libraries, no assets, no network — and it ships with deterministic `?shot=start|play|end` scenes (see `shots.json`) so its screenshots always show the same rich table.

## Run it

```sh
node serve.ts   # play the game at http://localhost:8080
node main.ts    # hand-in run: copies game/ and screenshots/ to /output and writes dossier.json
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=szkznt2e&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
