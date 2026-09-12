import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { voiceManager } from '../utils/voice';

export default function Header({ gameState }) {
  const { socket } = useSocket();
  const { 
    highestBid, 
    effectiveBid, 
    bidWinner, 
    scores, 
    gamePoints, 
    isTrumpExposed, 
    trumpSuit, 
    dealerSeat, 
    firstPlayerSeat, 
    code 
  } = gameState;

  const [voiceActive, setVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (socket && code) {
      voiceManager.init(socket, code);
    }
    return () => voiceManager.leave();
  }, [socket, code]);

  const handleVoiceToggle = async () => {
    if (!voiceActive) {
      const ok = await voiceManager.startMicrophone();
      if (ok) setVoiceActive(true);
    } else {
      const muted = voiceManager.toggleMute();
      setIsMuted(muted);
    }
  };

  const getInviteUrl = () => {
    const origin = window.location.origin;
    return `${origin}/?join=${code}`;
  };

  const handleCopyInvite = () => {
    const url = getInviteUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const url = getInviteUrl();
    const text = encodeURIComponent(`🃏 Join my 28 Royal Bihar table!\nRoom Code: ${code}\nLink: ${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const currentTarget = effectiveBid || highestBid;

  return (
    <div className="gold-glass px-4 py-2 rounded-2xl flex justify-between items-center text-sm shadow-2xl">
      {/* Brand & Room Info with 1-Click Invite */}
      <div className="flex items-center gap-3">
        <span className="text-3xl drop-shadow">♠️</span>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-base tracking-wider bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent uppercase">
              28 Royal Bihar
            </span>
            
            {/* Click to Copy Badge */}
            <button 
              onClick={handleCopyInvite}
              title="Click to copy invite link"
              className="bg-stone-950 hover:bg-stone-900 text-amber-400 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
            >
              <span>{code}</span>
              <span className="text-[11px]">{copied ? '✅' : '📋'}</span>
            </button>

            {/* Direct WhatsApp Share */}
            <button
              onClick={handleWhatsAppShare}
              title="Invite friends via WhatsApp"
              className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-md font-bold transition cursor-pointer"
            >
              📲 Share
            </button>
          </div>
          
          <div className="text-[11px] text-emerald-300/90 font-medium">
            Dealer: <b className="text-amber-300">{dealerSeat}</b> • Lead: <b className="text-sky-300">{firstPlayerSeat}</b>
          </div>
        </div>
      </div>

      {/* Center Match Stats */}
      <div className="flex items-center gap-4 bg-slate-950/70 px-4 py-1.5 rounded-xl border border-yellow-500/20">
        <div className="text-center">
          <div className="text-[9px] text-amber-400/80 uppercase tracking-widest font-black">Score</div>
          <div className="text-xs font-black flex gap-2">
            <span className="text-emerald-400">S/N {gamePoints.teamSouthNorth}</span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400">E/W {gamePoints.teamEastWest}</span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800"></div>

        <div className="text-center">
          <div className="text-[9px] text-amber-400/80 uppercase tracking-widest font-black">Target Bid</div>
          <div className="font-black text-xs text-amber-300">
            {highestBid >= 16 ? (
              <>
                <span className="text-yellow-400 font-black">{currentTarget}</span>
                {effectiveBid && effectiveBid !== highestBid && (
                  <span className="text-[10px] text-yellow-500/70 ml-1 line-through">({highestBid})</span>
                )}
                <span className="text-[10px] ml-1 text-slate-400">({bidWinner})</span>
              </>
            ) : (
              'Min 16'
            )}
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800"></div>

        <div className="text-center">
          <div className="text-[9px] text-emerald-400/80 uppercase tracking-widest font-black">Trick Pts</div>
          <div className="text-xs font-black text-white">
            <span className="text-yellow-400">{scores.teamBidder}</span> / {scores.teamDefender}
          </div>
        </div>
      </div>

      {/* Turup Indicator & Voice Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleVoiceToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
            !voiceActive
              ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-600'
              : isMuted
              ? 'bg-red-950/80 text-red-300 border-red-500'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse'
          }`}
        >
          <span>{!voiceActive ? '🎙️' : isMuted ? '🔇' : '🟢'}</span>
          <span>{!voiceActive ? 'Join Voice' : isMuted ? 'Muted' : 'Mic Live'}</span>
        </button>

        {isTrumpExposed ? (
          <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center font-black text-2xl shadow-lg border border-amber-400 ${
            trumpSuit === '♥' || trumpSuit === '♦' ? 'text-red-600' : 'text-slate-950'
          }`}>
            {trumpSuit}
          </div>
        ) : (
          <div className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-950 to-stone-900 border border-red-500/40 text-red-300 text-xs font-black tracking-wider flex items-center gap-1">
            <span>🔒</span> HIDDEN
          </div>
        )}
      </div>
    </div>
  );
}