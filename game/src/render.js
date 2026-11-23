// Crown Trick's table renderer: turns a game snapshot into DOM. Cards are
// pure CSS (no images), so the game loads instantly and screenshots stay
// crisp at any size.

import { SUITS, rankLabel, isCrownJack, cardName } from './cards.js';
import { PLAYER_NAMES } from './game.js';

const $ = (sel) => document.querySelector(sel);

export function cardElement(card, trump, extraClass = '') {
  const el = document.createElement('div');
  const suit = SUITS[card.suit];
  el.className = `card ${suit.red ? 'red' : 'black'} ${extraClass}`.trim();
  el.dataset.label = cardName(card);
  const crown = isCrownJack(card, trump);
  el.innerHTML = `
    <span class="corner top"><b>${rankLabel(card.rank)}</b><i>${suit.glyph}</i></span>
    <span class="pip">${suit.glyph}</span>
    <span class="corner bottom"><b>${rankLabel(card.rank)}</b><i>${suit.glyph}</i></span>
    ${crown ? '<span class="crown-mark">♛</span>' : ''}`;
  if (crown) el.classList.add('crown-card');
  return el;
}

function backElement() {
  const el = document.createElement('div');
  el.className = 'card card-back';
  el.innerHTML = '<span class="back-crown">♛</span>';
  return el;
}

export class TableView {
  constructor(onHumanPlay) {
    this.onHumanPlay = onHumanPlay;
    this.bannerTimer = null;
  }

  announce(text) {
    const banner = $('#banner');
    banner.textContent = text;
    banner.classList.add('show');
    $('#sr-status').textContent = text;
    window.clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => banner.classList.remove('show'), 3400);
  }

  render(state) {
    // HUD
    $('#hand-label').textContent = `Hand ${state.handNumber}`;
    $('#trick-label').textContent = `Trick ${Math.min(state.trickNumber, 13)} of 13`;
    const trumpSuit = SUITS[state.trump];
    const trumpEl = $('#trump-suit');
    trumpEl.textContent = trumpSuit.glyph;
    trumpEl.className = trumpSuit.red ? 'red' : 'black';
    $('#trump-medal').title = `Trump is ${trumpSuit.name}`;

    // Seats: scores, trick pips, active-turn glow
    for (let seat = 0; seat < 4; seat++) {
      const seatEl = $(`#seat-${seat}`);
      seatEl.querySelector('.seat-score').textContent = state.scores[seat];
      seatEl.classList.toggle('active', state.turn === seat && !state.over);
      const pips = seatEl.querySelector('.trick-pips');
      pips.innerHTML = '';
      for (let i = 0; i < state.tricksWon[seat]; i++) {
        const pip = document.createElement('span');
        pip.className = 'pip-dot';
        pips.appendChild(pip);
      }
      const tricks = state.tricksWon[seat];
      const pipLabel = document.createElement('span');
      pipLabel.className = 'pip-label';
      pipLabel.textContent = tricks === 1 ? '1 trick' : `${tricks} tricks`;
      pips.appendChild(pipLabel);
    }

    // Rival hands: face-down fans sized to the cards they hold
    for (const seat of [1, 2, 3]) {
      const holder = document.querySelector(`[data-hand="${seat}"]`);
      holder.innerHTML = '';
      state.hands[seat].forEach(() => holder.appendChild(backElement()));
    }

    // The live trick in the middle of the table
    for (let seat = 0; seat < 4; seat++) {
      const slot = document.querySelector(`[data-slot="${seat}"]`);
      slot.innerHTML = '';
    }
    let crownInPlay = false;
    for (const play of state.trick) {
      const slot = document.querySelector(`[data-slot="${play.seat}"]`);
      slot.appendChild(cardElement(play.card, state.trump, 'played'));
      if (isCrownJack(play.card, state.trump)) crownInPlay = true;
    }
    $('#crown-jack-badge').hidden = !crownInPlay;

    // The player's own hand: playable cards glow, the rest wait quietly
    const handEl = $('#player-hand');
    handEl.innerHTML = '';
    const legal = new Set(state.legal);
    state.hands[0].forEach((card, index) => {
      const el = cardElement(card, state.trump, 'hand-card');
      el.style.setProperty('--fan', `${(index - (state.hands[0].length - 1) / 2) * 3.2}deg`);
      if (state.turn === 0 && legal.has(card)) {
        el.classList.add('playable');
        el.addEventListener('click', () => this.onHumanPlay(card));
      } else if (state.turn === 0) {
        el.classList.add('blocked');
      }
      handEl.appendChild(el);
    });
    $('#hint-line').textContent = state.turn === 0
      ? 'Your turn — click a glowing card. You must follow suit if you can.'
      : `${PLAYER_NAMES[state.turn]} is thinking…`;
  }

  showTrickWinner(state, winnerSeat, crownTaken) {
    this.render(state);
    const slot = document.querySelector(`[data-slot="${winnerSeat}"]`);
    if (slot.firstChild) slot.firstChild.classList.add('winner-card');
    const name = winnerSeat === 0 ? 'You win' : `${PLAYER_NAMES[winnerSeat]} wins`;
    this.announce(
      crownTaken
        ? `${name} the trick — and capture the ♛ Crown Jack (+3)!`
        : `${name} the trick.`,
    );
  }

  showMatchEnd(state, gained) {
    const order = [0, 1, 2, 3].sort((a, b) => state.scores[b] - state.scores[a]);
    const winner = order[0];
    $('#end-title').textContent =
      winner === 0 ? 'You take the crown!' : `${PLAYER_NAMES[winner]} takes the crown`;
    $('#end-subtitle').textContent =
      winner === 0
        ? 'The table is yours. The rivals demand a rematch.'
        : 'So close — the crown changes hands this time.';
    const table = $('#standings');
    table.innerHTML = order
      .map(
        (seat, i) => `<tr class="${seat === 0 ? 'you-row' : ''}">
          <td>${i + 1}</td><td>${seat === winner ? '♛ ' : ''}${PLAYER_NAMES[seat]}</td>
          <td>${state.tricksWon[seat]} tricks</td><td><b>${state.scores[seat]}</b></td></tr>`,
      )
      .join('');
    $('#end-overlay').hidden = false;
    this.announce($('#end-title').textContent);
  }
}
