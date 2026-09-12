import React from 'react';
import { useSocket } from '../context/SocketContext';

function PlayerSeat({ name, seat, cardCount, isCurrentTurn, isCurrentBidder, isDealer, isLead, isBidder, turnTime, isBot }) {
  const isActive = isCurrentTurn || isCurrentBidder;

  return (
    <div className="flex flex-col items-center relative">
      {/* Turn Countdown Badge */}
      {isActive && (
        <div className={`absolute -top-6 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black border z-30 shadow-lg ${
          turnTime <= 5
            ? 'bg-red-600 text-white border-red-300 animate-pulse'
            : 'bg-stone-950 text-amber-300 border-amber-400'
        }`}>
          ⏱️ {turnTime}s
        </div>
      )}

      {/* Badges */}
      <div className="flex gap-1 mb-1 items-center justify-center">
        {isDealer && (
          <span className="bg-amber-400 text-black font-black text-[9px] px-1.5 py-0.2 rounded shadow">
            DEALER
          </span>
        )}
        {isLead && (
          <span className="bg-sky-500 text-white font-black text-[9px] px-1.5 py-0.2 rounded shadow">
            LEAD 1
          </span>
        )}
        {isBidder && (
          <span className="bg-emerald-500 text-black font-black text-[9px] px-1.5 py-0.2 rounded shadow">
            BIDDER
          </span>
        )}
      </div>

      {/* Avatar Pedestal */}
      <div
        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${
          isActive
            ? 'active-turn-pulse bg-gradient-to-br from-amber-600 to-yellow-700 scale-110'
            : 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-lg'
        }`}
      >
        <span>{isBot ? '🤖' : '👤'}</span>
        <div className="absolute -bottom-2 -right-2 bg-slate-950 text-yellow-400 text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center border border-yellow-500 shadow-md">
          {cardCount}
        </div>
      </div>

      <div className="text-center mt-1">
        <div className="text-xs font-black tracking-wide text-white">{name || 'Waiting...'}</div>
        <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-300/80">{seat}</div>
      </div>
    </div>
  );
}

export default function Table({ gameState }) {
  const { turnTime } = useSocket();
  const { seats, cardCounts, currentTurnSeat, currentBidderSeat, dealerSeat, firstPlayerSeat, bidWinner, currentTrick, isTrumpExposed, trumpSuit } = gameState;

  return (
    <div className="relative flex-1 casino-felt-table rounded-[2.5rem] flex items-center justify-center p-6 my-2 min-h-[420px]">
      {/* North */}
      <div className="absolute top-4">
        <PlayerSeat 
          seat="North" 
          name={seats.North?.name} 
          cardCount={cardCounts.North} 
          isCurrentTurn={currentTurnSeat === 'North'} 
          isCurrentBidder={currentBidderSeat === 'North'} 
          isDealer={dealerSeat === 'North'} 
          isLead={firstPlayerSeat === 'North'} 
          isBidder={bidWinner === 'North'}
          turnTime={turnTime}
          isBot={seats.North?.isBot}
        />
      </div>

      {/* West */}
      <div className="absolute left-6">
        <PlayerSeat 
          seat="West" 
          name={seats.West?.name} 
          cardCount={cardCounts.West} 
          isCurrentTurn={currentTurnSeat === 'West'} 
          isCurrentBidder={currentBidderSeat === 'West'} 
          isDealer={dealerSeat === 'West'} 
          isLead={firstPlayerSeat === 'West'} 
          isBidder={bidWinner === 'West'}
          turnTime={turnTime}
          isBot={seats.West?.isBot}
        />
      </div>

      {/* East */}
      <div className="absolute right-6">
        <PlayerSeat 
          seat="East" 
          name={seats.East?.name} 
          cardCount={cardCounts.East} 
          isCurrentTurn={currentTurnSeat === 'East'} 
          isCurrentBidder={currentBidderSeat === 'East'} 
          isDealer={dealerSeat === 'East'} 
          isLead={firstPlayerSeat === 'East'} 
          isBidder={bidWinner === 'East'}
          turnTime={turnTime}
          isBot={seats.East?.isBot}
        />
      </div>

      {/* Trick Arena */}
      <div className="w-56 h-56 rounded-full border-2 border-dashed border-emerald-400/30 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center relative shadow-inner">
        {currentTrick.length === 0 && (
          <span className="text-emerald-400/30 font-black tracking-widest text-xs uppercase">
            Trick Arena
          </span>
        )}

        {currentTrick.map((p, idx) => {
          const isTrumpCard = isTrumpExposed && p.card.suit === trumpSuit;
          const posClass = 
            p.player === 'South' ? 'bottom-2' :
            p.player === 'North' ? 'top-2' :
            p.player === 'West' ? 'left-2' : 'right-2';

          return (
            <div key={idx} className={`absolute flex flex-col items-center ${posClass}`}>
              <div 
                style={{ width: '56px', height: '80px' }}
                className={`casino-card flex flex-col justify-between p-1.5 font-black border ${
                  isTrumpCard ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)]' : 'border-slate-300'
                } ${p.card.suit === '♥' || p.card.suit === '♦' ? 'text-red-600' : 'text-slate-950'}`}
              >
                <div className="flex justify-between items-start leading-none">
                  <span className="text-sm font-black">{p.card.rank}</span>
                  <span className="text-sm">{p.card.suit}</span>
                </div>
                <span className="text-2xl leading-none self-center">{p.card.suit}</span>
                <div className="flex justify-between items-end leading-none text-[9px] text-slate-500">
                  <span>{p.card.points > 0 ? `${p.card.points}p` : ''}</span>
                  <span className="text-xs font-bold">{p.card.rank}</span>
                </div>
              </div>
              <span className="text-[10px] font-black text-amber-300 mt-1 drop-shadow">{p.player}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}