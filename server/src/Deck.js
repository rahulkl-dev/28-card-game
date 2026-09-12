import { SUITS, RANKS, CARD_POINTS, RANK_POWER } from './constants.js';

export function createDeck() {
  const deck = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({
        id: `${rank}${suit}`,
        suit,
        rank,
        points: CARD_POINTS[rank],
        power: RANK_POWER[rank]
      });
    });
  });

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}