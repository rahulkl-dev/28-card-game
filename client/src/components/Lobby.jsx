import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

export default function Lobby() {
  const { socket, errorMsg, setErrorMsg } = useSocket();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  // Extract ?join=ROOMCODE from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      setCode(joinCode.toUpperCase());
    }
  }, []);

  const handleCreate = () => {
    if (!name.trim()) return setErrorMsg('Please enter your name');
    socket.emit('CREATE_ROOM', { name: name.trim() });
  };

  const handleJoin = () => {
    if (!name.trim()) return setErrorMsg('Please enter your name');
    if (!code.trim()) return setErrorMsg('Please enter a room code');
    socket.emit('JOIN_ROOM', { name: name.trim(), code: code.trim().toUpperCase() });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="gold-glass p-8 rounded-3xl w-full max-w-md shadow-2xl border border-yellow-500/30 text-center">
        <div className="text-5xl mb-2">♠️</div>
        <h1 className="text-3xl font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent mb-1">
          28 Royal Bihar
        </h1>
        <p className="text-xs text-emerald-300/80 mb-6 uppercase tracking-widest font-semibold">
          Multiplayer • Live Voice • 4-Player Casino
        </p>

        {errorMsg && (
          <div className="bg-red-950/80 border border-red-500/60 text-red-300 text-xs px-3 py-2 rounded-xl mb-4">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your Nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={14}
            className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 focus:border-yellow-400 rounded-xl text-white font-bold outline-none placeholder:text-slate-500 text-sm transition"
          />

          <button
            onClick={handleCreate}
            className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-stone-950 font-black py-3 rounded-xl text-sm uppercase tracking-wider transition active:scale-95 shadow-lg shadow-yellow-500/20 cursor-pointer"
          >
            Create New Table
          </button>

          <div className="flex items-center my-3">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="px-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">or join</span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ROOM CODE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-2/3 px-4 py-3 bg-slate-950/80 border border-slate-700 focus:border-yellow-400 rounded-xl text-center font-mono font-black text-amber-300 tracking-widest uppercase outline-none placeholder:text-slate-600 text-sm transition"
            />
            <button
              onClick={handleJoin}
              className="w-1/3 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-yellow-500/40 text-white font-black py-3 rounded-xl text-sm uppercase tracking-wider transition active:scale-95 cursor-pointer"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}