// Rival behaviour for Crown Trick. Each rival follows one readable policy:
// follow suit when it can, win a trick as cheaply as possible when winning is
// worth it, protect the Crown Jack, and shed its lowest card when a trick is
// already lost. Small seeded variations keep the three rivals from feeling
// like the same robot in three chairs.

import { trickStrength, isCrownJack } from './cards.js';

function legalCards(hand, ledSuit) {
  if (ledSuit === null) return hand.slice();
  const suited = hand.filter((c) => c.suit === ledSuit);
  return suited.length > 0 ? suited : hand.slice();
}

function lowest(cards) {
  return cards.reduce((a, b) => (a.rank <= b.rank ? a : b));
}

function lowestByStrength(cards, ledSuit, trump) {
  return cards.reduce((a, b) =>
    trickStrength(a, ledSuit, trump) <= trickStrength(b, ledSuit, trump) ? a : b,
  );
}

// Choose the card `seat` plays. `trick` holds the cards already on the table
// in play order; `leader` is the seat that led. Returns a card from `hand`.
export function chooseAiCard({ hand, trick, trump, rng }) {
  const ledSuit = trick.length > 0 ? trick[0].card.suit : null;
  const legal = legalCards(hand, ledSuit);

  // Leading a fresh trick: open with a strong-but-not-best card from the
  // longest suit, so the rival still has something to answer with later.
  if (trick.length === 0) {
    const nonTrump = legal.filter((c) => c.suit !== trump);
    const pool = nonTrump.length > 0 ? nonTrump : legal;
    const sorted = pool.slice().sort((a, b) => b.rank - a.rank);
    const pick = sorted[Math.min(1, sorted.length - 1)];
    return rng() < 0.2 ? lowest(pool) : pick;
  }

  const bestOnTable = Math.max(
    ...trick.map((p) => trickStrength(p.card, ledSuit, trump)),
  );
  const crownAtStake = trick.some((p) => isCrownJack(p.card, trump));
  const winners = legal.filter(
    (c) => trickStrength(c, ledSuit, trump) > bestOnTable,
  );

  if (winners.length > 0) {
    // The Crown Jack changes the maths: spend more to capture it, and never
    // waste the Crown Jack itself on a trick that is already safe.
    const cheap = lowestByStrength(winners, ledSuit, trump);
    if (isCrownJack(cheap, trump) && !crownAtStake && trick.length < 3) {
      const others = winners.filter((c) => c !== cheap);
      if (others.length > 0) return lowestByStrength(others, ledSuit, trump);
    }
    const eagerness = crownAtStake ? 0.95 : 0.75;
    if (rng() < eagerness) return cheap;
  }

  // Cannot (or will not) win: shed the lowest card, but hold trump cards and
  // the Crown Jack back unless there is no other choice.
  const sheddable = legal.filter(
    (c) => c.suit !== trump && !isCrownJack(c, trump),
  );
  return lowest(sheddable.length > 0 ? sheddable : legal);
}
