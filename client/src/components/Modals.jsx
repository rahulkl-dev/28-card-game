import React from 'react';
import { useSocket } from '../context/SocketContext';

const TRUMP_SELECTORS = [
  { suit: '♠', rank: '6', id: 'selector-spade' },
  { suit: '♥', rank: '6', id: 'selector-heart' },
  { suit: '♣', rank: '6', id: 'selector-club' },
  { suit: '♦', rank: '6', id: 'selector-diamond' }
];

export default function Modals({ gameState }) {
  const { socket } = useSocket();
  const { code, mySeat, bidWinner } = gameState;

  if (gameState.gameState === 'SELECT_TRUMP' && bidWinner === mySeat) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-panel border border-yellow-400 p-6 rounded-3xl text-center max-w-sm">
          <h3 className="text-yellow-300 font-bold text-base mb-1">Pick Secret Turup</h3>
          <p className="text-xs text-emerald-200 mb-4">Choose a suit to tuck face-down:</p>
          <div className="flex justify-center gap-3">
            {TRUMP_SELECTORS.map(card => (
              <button
                key={card.id}
                onClick={() => socket.emit('SELECT_TRUMP', { code, selectorCard: card })}
                className={`w-14 h-20 bg-white rounded-xl flex flex-col justify-between p-2 font-bold shadow-xl cursor-pointer ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-slate-900'}`}
              >
                <span>{card.rank}</span>
                <span className="text-2xl">{card.suit}</span>
                <span></span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.gameState === 'ROUND_OVER') {
    return (
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-panel border-2 border-yellow-400 p-6 rounded-3xl text-center max-w-sm">
          <h3 className="text-yellow-400 font-bold text-xl mb-2">Round Finished!</h3>
          <p className="text-xs text-emerald-200 mb-4">
            Bidder Team Won: <b>{gameState.scores.teamBidder}</b> pts | Target: <b>{gameState.highestBid}</b>
          </p>
          <button
            onClick={() => socket.emit('NEXT_ROUND', { code })}
            className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider"
          >
            Start Next Hand 🎴
          </button>
        </div>
      </div>
    );
  }

  return null;
}