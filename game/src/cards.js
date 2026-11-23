// The deck model for Crown Trick: a standard 52-card deck, plain data only.
// A card is { suit: 0..3, rank: 2..14 } where 11=J, 12=Q, 13=K, 14=A.

export const SUITS = [
  { glyph: '♠', name: 'Spades', red: false },
  { glyph: '♥', name: 'Hearts', red: true },
  { glyph: '♣', name: 'Clubs', red: false },
  { glyph: '♦', name: 'Diamonds', red: true },
];

export const RANK_LABEL = {
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

export function rankLabel(rank) {
  return RANK_LABEL[rank] ?? String(rank);
}

export function buildDeck() {
  const deck = [];
  for (let suit = 0; suit < 4; suit++) {
    for (let rank = 2; rank <= 14; rank++) deck.push({ suit, rank });
  }
  return deck;
}

export function cardName(card) {
  return `${rankLabel(card.rank)}${SUITS[card.suit].glyph}`;
}

export function isCrownJack(card, trump) {
  return card.suit === trump && card.rank === 11;
}

// Strength of a card inside one trick: trumps beat the led suit, the led suit
// beats everything else, and rank decides inside a suit.
export function trickStrength(card, ledSuit, trump) {
  if (card.suit === trump) return 200 + card.rank;
  if (card.suit === ledSuit) return 100 + card.rank;
  return card.rank;
}

export function sortHand(hand, trump) {
  const suitOrder = (suit) => (suit === trump ? 4 : suit);
  return hand.slice().sort((a, b) => {
    const bySuit = suitOrder(b.suit) - suitOrder(a.suit) || b.suit - a.suit;
    return bySuit !== 0 ? bySuit : b.rank - a.rank;
  });
}
