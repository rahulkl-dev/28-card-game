import React from 'react';
import { useSocket } from '../context/SocketContext';

export default function PlayerHand({ gameState }) {
  const { socket } = useSocket();
  const { 
    code, 
    mySeat, 
    myHand, 
    currentTurnSeat, 
    currentBidderSeat, 
    highestBid, 
    bidWinner, 
    passedSeats, 
    isTrumpExposed, 
    trumpSuit, 
    currentTrick,
    jodiDeclared 
  } = gameState;

  const isMyBidTurn = gameState.gameState === 'BIDDING' && currentBidderSeat === mySeat && !passedSeats.includes(mySeat);
  const isMyPlayTurn = gameState.gameState === 'PLAYING' && currentTurnSeat === mySeat;
  const isIncumbent = bidWinner === mySeat && highestBid >= 16;

  const minBid = isIncumbent ? highestBid + 1 : Math.max(16, highestBid + 1);
  const bidOptions = [minBid, minBid + 1, minBid + 2, 20].filter(v => v <= 28).slice(0, 3);

  const leadCard = currentTrick[0]?.card;
  const canOpenTrump = isMyPlayTurn && !isTrumpExposed && leadCard && !myHand.some(c => c.suit === leadCard.suit);

  // Calculate Jodi availability safely
  const hasTrumpKing = isTrumpExposed && trumpSuit && myHand.some(c => c.suit === trumpSuit && c.rank === 'K');
  const hasTrumpQueen = isTrumpExposed && trumpSuit && myHand.some(c => c.suit === trumpSuit && c.rank === 'Q');
  const bidderTeam = ['South', 'North'].includes(bidWinner) ? 'SN' : 'EW';
  const myTeam = ['South', 'North'].includes(mySeat) ? 'SN' : 'EW';
  const alreadyDeclared = myTeam === bidderTeam ? jodiDeclared?.bidder : jodiDeclared?.defender;

  const canDeclareJodi = gameState.gameState === 'PLAYING' && hasTrumpKing && hasTrumpQueen && !alreadyDeclared;

  return (
    <div className="gold-glass p-3 rounded-2xl">
      <div className="flex justify-between items-center mb-2 px-2">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-yellow-400">Your Hand ({mySeat})</span>
          <div className="text-[11px] font-bold text-emerald-300">
            {isMyBidTurn ? '🔥 YOUR TURN TO BID OR PASS' : isMyPlayTurn ? '✨ YOUR TURN TO PLAY A CARD' : 'Waiting for opponents...'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bidding Controls */}
          {isMyBidTurn && (
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-yellow-500/40">
              {isIncumbent && (
                <button
                  onClick={() => socket.emit('BID_ACTION', { code, val: highestBid, isHolding: true })}
                  className="bg-emerald-500 text-black font-black px-3 py-1.5 rounded-lg text-xs"
                >
                  HOLD {highestBid}
                </button>
              )}
              {bidOptions.map(val => (
                <button
                  key={val}
                  onClick={() => socket.emit('BID_ACTION', { code, val })}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-black px-3 py-1.5 rounded-lg text-xs"
                >
                  {val}
                </button>
              ))}
              <button
                onClick={() => socket.emit('BID_ACTION', { code, isPassing: true })}
                className="bg-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                PASS
              </button>
            </div>
          )}

          {/* Open Turup */}
          {canOpenTrump && (
            <button
              onClick={() => socket.emit('OPEN_TRUMP', { code })}
              className="bg-red-600 hover:bg-red-500 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider animate-bounce shadow-lg shadow-red-900/50 cursor-pointer"
            >
              🔓 Open Turup
            </button>
          )}

          {/* Declare Jodi (Pair) */}
          {canDeclareJodi && (
            <button
              onClick={() => socket.emit('DECLARE_JODI', { code })}
              className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 text-stone-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.7)] animate-bounce cursor-pointer"
            >
              👑 Declare Jodi
            </button>
          )}
        </div>
      </div>

      {/* Card Rack */}
      <div className="flex justify-center gap-3 overflow-x-auto py-2 px-1">
        {myHand.map(card => {
          const isRed = card.suit === '♥' || card.suit === '♦';

          return (
            <button
              key={card.id}
              onClick={() => isMyPlayTurn && socket.emit('PLAY_CARD', { code, cardId: card.id })}
              disabled={!isMyPlayTurn}
              style={{ width: '56px', height: '84px' }}
              className={`casino-card flex flex-col justify-between p-1.5 font-black text-sm border border-slate-300 ${
                isRed ? 'text-red-600' : 'text-slate-950'
              } ${!isMyPlayTurn ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex justify-between items-start leading-none">
                <span className="text-sm font-black">{card.rank}</span>
                <span className="text-sm">{card.suit}</span>
              </div>
              <span className="text-3xl leading-none self-center my-0.5">{card.suit}</span>
              <div className="flex justify-between items-end leading-none text-[9px] text-slate-500">
                <span>{card.points > 0 ? `${card.points}p` : ''}</span>
                <span className="text-xs font-bold">{card.rank}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}