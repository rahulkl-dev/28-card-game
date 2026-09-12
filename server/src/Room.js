import { SEATS, MIN_BID } from './constants.js';
import { createDeck } from './Deck.js';

export class Room {
  constructor(code) {
    this.code = code;
    this.seats = { South: null, East: null, North: null, West: null };
    this.hands = { South: [], East: [], North: [], West: [] };
    this.cardCounts = { South: 0, East: 0, North: 0, West: 0 };
    
    this.gameState = 'LOBBY'; // LOBBY, BIDDING, SELECT_TRUMP, PLAYING, ROUND_OVER
    this.dealerSeat = 'West';
    this.firstPlayerSeat = 'North';
    
    this.currentBidderSeat = null;
    this.highestBid = 0;
    this.bidWinner = null;
    this.passedSeats = [];
    
    this.trumpSuit = null;
    this.isTrumpExposed = false;
    this.trumpRevealerSeat = null;
    
    this.currentTurnSeat = null;
    this.currentTrick = []; // [{ player, card }]
    
    this.scores = { teamBidder: 0, teamDefender: 0 };
    this.gamePoints = { teamSouthNorth: 0, teamEastWest: 0 };
    
    this.deck = [];
    this.turnTimer = null;
    this.turnTimeRemaining = 15;

    this.jodiDeclared = { bidder: false, defender: false };
    this.effectiveBid = 0; // Tracks adjusted target after Jodi declarations
  }

  isFull() {
    return Object.values(this.seats).every(s => s !== null);
  }

  addPlayer(socketId, name) {
    const availableSeat = SEATS.find(s => this.seats[s] === null);
    if (!availableSeat) return null;
    this.seats[availableSeat] = { socketId, name, isBot: false };
    return availableSeat;
  }

  startTurnTimer(io) {
    if (this.turnTimer) clearInterval(this.turnTimer);
    this.turnTimeRemaining = 15;
    io.to(this.code).emit('TIMER_TICK', { remaining: this.turnTimeRemaining });

    this.turnTimer = setInterval(() => {
      this.turnTimeRemaining -= 1;
      io.to(this.code).emit('TIMER_TICK', { remaining: this.turnTimeRemaining });

      if (this.turnTimeRemaining <= 0) {
        clearInterval(this.turnTimer);
        this.turnTimer = null;
        this.handleTurnTimeout(io);
      }
    }, 1000);
  }

  stopTurnTimer() {
    if (this.turnTimer) {
      clearInterval(this.turnTimer);
      this.turnTimer = null;
    }
  }

  handleTurnTimeout(io) {
    if (this.gameState === 'BIDDING') {
      this.handleBid(this.currentBidderSeat, 0, false, true); // Auto-pass
      this.broadcastState(io);
      if (this.gameState === 'BIDDING') {
        this.startTurnTimer(io);
      }
    } else if (this.gameState === 'PLAYING') {
      const seat = this.currentTurnSeat;
      if (!seat) return;
      const hand = this.hands[seat];
      if (!hand || hand.length === 0) return;

      const legalCards = hand.filter(card => this.isCardLegal(card, seat));
      const cardToPlay = legalCards.length > 0 ? legalCards[0] : hand[0];

      if (cardToPlay) {
        this.playCard(seat, cardToPlay.id, io);
        this.broadcastState(io);
        if (this.gameState === 'PLAYING') {
          this.startTurnTimer(io);
        }
      }
    }
  }

  startRound(io) {
    this.deck = createDeck();
    this.gameState = 'BIDDING';
    this.highestBid = 0;
    this.bidWinner = null;
    this.passedSeats = [];
    this.trumpSuit = null;
    this.isTrumpExposed = false;
    this.currentTrick = [];
    this.scores = { teamBidder: 0, teamDefender: 0 };
    this.jodiDeclared = { bidder: false, defender: false };
    this.effectiveBid = 0;

    // Deal first 4 cards
    SEATS.forEach(seat => {
      this.hands[seat] = this.deck.splice(0, 4);
      this.cardCounts[seat] = 4;
    });

    this.currentBidderSeat = this.firstPlayerSeat;
    this.broadcastState(io);
    this.startTurnTimer(io);
  }

  handleBid(seat, val, isHolding = false, isPassing = false) {
    if (this.gameState !== 'BIDDING' || this.currentBidderSeat !== seat) return;

    if (isPassing) {
      if (!this.passedSeats.includes(seat)) {
        this.passedSeats.push(seat);
      }
    } else {
      if (val > this.highestBid || (isHolding && val === this.highestBid)) {
        this.highestBid = val;
        this.bidWinner = seat;
      }
    }

    const activeBidders = SEATS.filter(s => !this.passedSeats.includes(s));
    if (activeBidders.length <= 1) {
      if (activeBidders.length === 1 && !this.bidWinner) {
        this.bidWinner = activeBidders[0];
        this.highestBid = MIN_BID;
      }
      this.gameState = 'SELECT_TRUMP';
      this.stopTurnTimer();
      return;
    }

    // Advance to next active bidder clockwise
    let nextIdx = (SEATS.indexOf(this.currentBidderSeat) + 1) % 4;
    while (this.passedSeats.includes(SEATS[nextIdx])) {
      nextIdx = (nextIdx + 1) % 4;
    }
    this.currentBidderSeat = SEATS[nextIdx];
  }

  selectTrump(seat, suit, io) {
    if (this.gameState !== 'SELECT_TRUMP' || this.bidWinner !== seat) return;
    this.trumpSuit = suit;
    this.effectiveBid = this.highestBid;

    // Deal remaining 4 cards each
    SEATS.forEach(s => {
      this.hands[s].push(...this.deck.splice(0, 4));
      this.cardCounts[s] = 8;
    });

    this.gameState = 'PLAYING';
    this.currentTurnSeat = this.firstPlayerSeat;
    this.broadcastState(io);
    this.startTurnTimer(io);
  }

  openTrump(seat, io) {
    if (this.gameState !== 'PLAYING' || this.isTrumpExposed) return;
    this.isTrumpExposed = true;
    this.trumpRevealerSeat = seat;
    this.broadcastState(io);
  }

  isCardLegal(card, seat) {
    if (this.currentTrick.length === 0) return true;
    const leadCard = this.currentTrick[0].card;
    const hand = this.hands[seat];
    const hasLeadSuit = hand.some(c => c.suit === leadCard.suit);

    if (hasLeadSuit) {
      return card.suit === leadCard.suit;
    }
    return true;
  }

  playCard(seat, cardId, io) {
    if (this.gameState !== 'PLAYING' || this.currentTurnSeat !== seat) return;
    const hand = this.hands[seat];
    const cardIdx = hand.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return;

    const card = hand[cardIdx];
    if (!this.isCardLegal(card, seat)) return;

    hand.splice(cardIdx, 1);
    this.cardCounts[seat] = hand.length;
    this.currentTrick.push({ player: seat, card });

    if (this.currentTrick.length === 4) {
      this.stopTurnTimer();
      setTimeout(() => this.resolveTrick(io), 1000);
    } else {
      const nextIdx = (SEATS.indexOf(seat) + 1) % 4;
      this.currentTurnSeat = SEATS[nextIdx];
      this.startTurnTimer(io);
    }
  }

  resolveTrick(io) {
    const leadSuit = this.currentTrick[0].card.suit;
    let winningPlay = this.currentTrick[0];

    for (let i = 1; i < this.currentTrick.length; i++) {
      const play = this.currentTrick[i];
      const winCard = winningPlay.card;
      const curCard = play.card;

      if (this.isTrumpExposed) {
        if (curCard.suit === this.trumpSuit && winCard.suit !== this.trumpSuit) {
          winningPlay = play;
          continue;
        }
        if (curCard.suit === this.trumpSuit && winCard.suit === this.trumpSuit) {
          if (curCard.weight > winCard.weight) winningPlay = play;
          continue;
        }
      }

      if (curCard.suit === leadSuit && winCard.suit === leadSuit) {
        if (curCard.weight > winCard.weight) winningPlay = play;
      }
    }

    const trickPoints = this.currentTrick.reduce((sum, p) => sum + (p.card.points || 0), 0);
    const winnerSeat = winningPlay.player;
    const bidderTeam = ['South', 'North'].includes(this.bidWinner) ? 'SN' : 'EW';
    const winnerTeam = ['South', 'North'].includes(winnerSeat) ? 'SN' : 'EW';

    if (winnerTeam === bidderTeam) {
      this.scores.teamBidder += trickPoints;
    } else {
      this.scores.teamDefender += trickPoints;
    }

    this.currentTrick = [];
    this.currentTurnSeat = winnerSeat;

    const allCardsPlayed = Object.values(this.cardCounts).every(count => count === 0);
    if (allCardsPlayed) {
      this.gameState = 'ROUND_OVER';
      this.stopTurnTimer();

      const target = this.effectiveBid || this.highestBid;
      const won = this.scores.teamBidder >= target;
      const pointDelta = this.highestBid >= 20 ? 2 : 1;

      if (won) {
        if (bidderTeam === 'SN') this.gamePoints.teamSouthNorth += pointDelta;
        else this.gamePoints.teamEastWest += pointDelta;
      } else {
        if (bidderTeam === 'SN') this.gamePoints.teamSouthNorth -= pointDelta;
        else this.gamePoints.teamEastWest -= pointDelta;
      }
    } else {
      this.startTurnTimer(io);
    }
    this.broadcastState(io);
  }

  declareJodi(seat, io) {
    if (this.gameState !== 'PLAYING' || !this.isTrumpExposed || !this.trumpSuit) return;

    const hand = this.hands[seat];
    const hasKing = hand.some(c => c.suit === this.trumpSuit && c.rank === 'K');
    const hasQueen = hand.some(c => c.suit === this.trumpSuit && c.rank === 'Q');

    if (!hasKing || !hasQueen) return;

    const bidderTeam = ['South', 'North'].includes(this.bidWinner) ? 'SN' : 'EW';
    const playerTeam = ['South', 'North'].includes(seat) ? 'SN' : 'EW';

    if (playerTeam === bidderTeam && !this.jodiDeclared.bidder) {
      this.jodiDeclared.bidder = true;
      this.effectiveBid = Math.max(14, this.effectiveBid - 4);
      io.to(this.code).emit('GAME_EVENT', {
        type: 'JODI_DECLARED',
        message: `${seat} declared BIDDER JODI! Target reduced to ${this.effectiveBid}.`
      });
    } else if (playerTeam !== bidderTeam && !this.jodiDeclared.defender) {
      this.jodiDeclared.defender = true;
      this.effectiveBid = Math.min(28, this.effectiveBid + 4);
      io.to(this.code).emit('GAME_EVENT', {
        type: 'JODI_DECLARED',
        message: `${seat} declared DEFENDER JODI! Target increased to ${this.effectiveBid}.`
      });
    }

    this.broadcastState(io);
  }

  broadcastState(io) {
    SEATS.forEach(seat => {
      const playerObj = this.seats[seat];
      if (!playerObj || playerObj.isBot) return;

      const sanitizedState = {
        code: this.code,
        gameState: this.gameState,
        mySeat: seat,
        myHand: this.hands[seat] || [],
        cardCounts: this.cardCounts,
        seats: this.seats,
        dealerSeat: this.dealerSeat,
        firstPlayerSeat: this.firstPlayerSeat,
        currentBidderSeat: this.currentBidderSeat,
        highestBid: this.highestBid,
        bidWinner: this.bidWinner,
        passedSeats: this.passedSeats,
        trumpSuit: this.isTrumpExposed || seat === this.bidWinner ? this.trumpSuit : null,
        isTrumpExposed: this.isTrumpExposed,
        currentTurnSeat: this.currentTurnSeat,
        currentTrick: this.currentTrick,
        scores: this.scores,
        gamePoints: this.gamePoints,
        effectiveBid: this.effectiveBid || this.highestBid,
        jodiDeclared: this.jodiDeclared,
      };

      io.to(playerObj.socketId).emit('GAME_STATE_UPDATE', sanitizedState);
    });
  }
}