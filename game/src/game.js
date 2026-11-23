// Crown Trick match controller: dealing, turn order, trick resolution and
// scoring. Rendering lives in render.js; this module owns the rules and calls
// the renderer after every change, so the table can never disagree with the
// game state.

import { buildDeck, trickStrength, isCrownJack, sortHand } from './cards.js';
import { makeRng, shuffleInPlace } from './rng.js';
import { chooseAiCard } from './ai.js';

export const PLAYER_NAMES = ['You', 'Captain Rook', 'Baroness Vex', 'Madame Fable'];
export const TARGET_SCORE = 40;
export const TRICK_POINTS = 2;
export const CROWN_JACK_POINTS = 3;
export const SWEEP_POINTS = 5;

const TURN_DELAY_MS = 620;
const TRICK_LINGER_MS = 1150;

export class CrownTrickGame {
  constructor(view, seed) {
    this.view = view;
    this.seed = seed >>> 0;
    this.resetMatch();
  }

  resetMatch() {
    this.scores = [0, 0, 0, 0];
    this.handNumber = 0;
    this.over = false;
  }

  startMatch() {
    this.resetMatch();
    this.startHand();
  }

  startHand() {
    this.handNumber += 1;
    this.trump = (this.handNumber - 1) % 4; // trump rotates ♠ ♥ ♣ ♦
    const rng = makeRng(this.seed + this.handNumber * 7919);
    const deck = shuffleInPlace(buildDeck(), rng);
    this.hands = [[], [], [], []];
    deck.forEach((card, i) => this.hands[i % 4].push(card));
    this.hands = this.hands.map((h) => sortHand(h, this.trump));
    this.tricksWon = [0, 0, 0, 0];
    this.capturedCrown = [false, false, false, false];
    this.trickNumber = 0;
    this.leader = (this.handNumber - 1) % 4; // the opening lead rotates too
    this.rng = rng;
    this.beginTrick();
  }

  beginTrick() {
    this.trickNumber += 1;
    this.trick = []; // [{ seat, card }] in play order
    this.turn = this.leader;
    this.view.render(this.snapshot());
    this.advance();
  }

  snapshot() {
    return {
      hands: this.hands,
      trick: this.trick,
      trump: this.trump,
      turn: this.turn,
      leader: this.leader,
      scores: this.scores,
      tricksWon: this.tricksWon,
      handNumber: this.handNumber,
      trickNumber: this.trickNumber,
      over: this.over,
      legal: this.turn === 0 ? this.legalPlays(0) : [],
    };
  }

  legalPlays(seat) {
    const hand = this.hands[seat];
    if (this.trick.length === 0) return hand.slice();
    const ledSuit = this.trick[0].card.suit;
    const suited = hand.filter((c) => c.suit === ledSuit);
    return suited.length > 0 ? suited : hand.slice();
  }

  advance() {
    if (this.over) return;
    if (this.trick.length === 4) return this.resolveTrick();
    if (this.turn === 0) {
      this.view.render(this.snapshot());
      this.view.announce('Your turn — pick a glowing card.');
      return;
    }
    this.view.render(this.snapshot());
    const seat = this.turn;
    window.setTimeout(() => {
      if (this.over || this.turn !== seat) return;
      const card = chooseAiCard({
        hand: this.hands[seat],
        trick: this.trick,
        trump: this.trump,
        rng: this.rng,
      });
      this.playCard(seat, card);
    }, TURN_DELAY_MS);
  }

  playCard(seat, card) {
    const hand = this.hands[seat];
    const at = hand.indexOf(card);
    if (at === -1) return;
    hand.splice(at, 1);
    this.trick.push({ seat, card });
    this.turn = (seat + 1) % 4;
    this.view.render(this.snapshot());
    this.advance();
  }

  humanPlay(card) {
    if (this.over || this.turn !== 0) return;
    if (!this.legalPlays(0).includes(card)) {
      this.view.announce('You must follow suit if you can.');
      return;
    }
    this.playCard(0, card);
  }

  resolveTrick() {
    const ledSuit = this.trick[0].card.suit;
    let winner = this.trick[0];
    for (const play of this.trick) {
      if (trickStrength(play.card, ledSuit, this.trump) >
          trickStrength(winner.card, ledSuit, this.trump)) {
        winner = play;
      }
    }
    const seat = winner.seat;
    this.tricksWon[seat] += 1;
    const crownTaken = this.trick.some((p) => isCrownJack(p.card, this.trump));
    if (crownTaken) this.capturedCrown[seat] = true;
    this.view.showTrickWinner(this.snapshot(), seat, crownTaken);
    window.setTimeout(() => {
      if (this.trickNumber === 13) return this.finishHand();
      this.leader = seat;
      this.beginTrick();
    }, TRICK_LINGER_MS);
  }

  finishHand() {
    const gained = [0, 0, 0, 0];
    for (let seat = 0; seat < 4; seat++) {
      gained[seat] = this.tricksWon[seat] * TRICK_POINTS;
      if (this.tricksWon[seat] === 13) gained[seat] += SWEEP_POINTS;
    }
    // The Crown Jack bonus goes to the seat that captured it this hand.
    for (let seat = 0; seat < 4; seat++) {
      if (this.capturedCrown && this.capturedCrown[seat]) {
        gained[seat] += CROWN_JACK_POINTS;
      }
      this.scores[seat] += gained[seat];
    }
    const best = Math.max(...this.scores);
    if (best >= TARGET_SCORE) {
      this.over = true;
      this.view.render(this.snapshot());
      this.view.showMatchEnd(this.snapshot(), gained);
      return;
    }
    this.view.announce(
      `Hand ${this.handNumber} scored. Next hand deals in a moment…`,
    );
    this.view.render(this.snapshot());
    window.setTimeout(() => this.startHand(), 1600);
  }
}
