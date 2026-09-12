export const SUITS = ['♠', '♥', '♣', '♦'];
export const RANKS = ['7', '8', 'Q', 'K', '10', 'A', '9', 'J'];

export const CARD_POINTS = { 
  'J': 3, '9': 2, 'A': 1, '10': 1, 
  'K': 0, 'Q': 0, '8': 0, '7': 0 
};

export const RANK_POWER = { 
  '7': 1, '8': 2, 'Q': 3, 'K': 4, 
  '10': 5, 'A': 6, '9': 7, 'J': 8 
};

// Counter-clockwise seating
export const SEATS = ['East', 'North', 'West', 'South'];

// Four indicator cards (one per suit) from the unplayed deck (the 6s)
export const TRUMP_SELECTOR_CARDS = [
  { suit: '♠', rank: '6', id: 'selector-spade', name: 'Spades' },
  { suit: '♥', rank: '6', id: 'selector-heart', name: 'Hearts' },
  { suit: '♣', rank: '6', id: 'selector-club', name: 'Clubs' },
  { suit: '♦', rank: '6', id: 'selector-diamond', name: 'Diamonds' }
];

export const MIN_BID = 16;
export const MAX_BID = 28;