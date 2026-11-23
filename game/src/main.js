// Crown Trick boot: wires the table view to the game controller, and offers
// deterministic ?shot= scenes (start / play / end) so screenshots always show
// the same rich table. ?seed= picks the deal for normal play.

import { CrownTrickGame } from './game.js';
import { TableView } from './render.js';
import { sortHand } from './cards.js';

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? '20261123') >>> 0;
const shot = params.get('shot');

const view = new TableView((card) => game.humanPlay(card));
const game = new CrownTrickGame(view, seed);

document.querySelector('#deal-btn').addEventListener('click', () => {
  document.querySelector('#start-overlay').hidden = true;
  game.startMatch();
});
document.querySelector('#again-btn').addEventListener('click', () => {
  document.querySelector('#end-overlay').hidden = true;
  game.startMatch();
});

// A dealt-but-unstarted table behind the title panel, so the start screen
// already shows the full scene the player is about to sit down at.
function backdropState() {
  game.startHand();
  const snap = game.snapshot();
  snap.turn = -1; // nobody is being prompted behind the title panel
  snap.legal = [];
  return snap;
}

if (shot === 'start') {
  view.render(backdropState());
} else if (shot === 'play') {
  // A scripted mid-hand scene: hand 2, hearts are trump, trick 8 is on the
  // table with the Crown Jack already played — and it is your move.
  const trump = 1;
  const mine = sortHand([
    { suit: 1, rank: 14 }, { suit: 1, rank: 9 },
    { suit: 0, rank: 13 }, { suit: 0, rank: 7 },
    { suit: 2, rank: 12 }, { suit: 3, rank: 10 },
  ], trump);
  const state = {
    hands: [mine,
      Array.from({ length: 5 }, () => ({ suit: 0, rank: 2 })),
      Array.from({ length: 5 }, () => ({ suit: 0, rank: 2 })),
      Array.from({ length: 5 }, () => ({ suit: 0, rank: 2 }))],
    trick: [
      { seat: 1, card: { suit: 1, rank: 8 } },
      { seat: 2, card: { suit: 1, rank: 11 } }, // the Crown Jack, on the table
      { seat: 3, card: { suit: 1, rank: 5 } },
    ],
    trump,
    turn: 0,
    leader: 1,
    scores: [16, 10, 14, 8],
    tricksWon: [3, 1, 2, 1],
    handNumber: 2,
    trickNumber: 8,
    over: false,
    legal: mine.filter((c) => c.suit === 1),
  };
  document.querySelector('#start-overlay').hidden = true;
  view.render(state);
  view.announce('The ♛ Crown Jack is on the table — win this trick to capture it (+3)!');
} else if (shot === 'end') {
  const state = backdropState();
  state.scores = [42, 31, 36, 24];
  state.tricksWon = [6, 3, 4, 0];
  state.handNumber = 4;
  state.trickNumber = 13;
  state.over = true;
  view.render(state);
  view.showMatchEnd(state, [12, 6, 8, 0]);
  document.querySelector('#start-overlay').hidden = true;
} else {
  view.render(backdropState());
}
