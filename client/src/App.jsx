import React from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import Lobby from './components/Lobby';
import Header from './components/Header';
import Table from './components/Table';
import PlayerHand from './components/PlayerHand';
import Modals from './components/Modals';
import { sound } from './utils/sound';

function GameScreen() {
  const { gameState } = useSocket();

  if (!gameState) return <Lobby />;

  return (
    <div className="p-3 flex flex-col h-screen justify-between max-w-5xl mx-auto">
      <Header gameState={gameState} />
      <Table gameState={gameState} />

      {/* Direct sound test button */}
      <div className="flex justify-center gap-2 my-1">
        <button 
          onClick={() => sound.playSnap()}
          className="bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs px-3 py-1 rounded-lg font-black shadow transition active:scale-95 cursor-pointer"
        >
          🔊 Test Audio Snap
        </button>
      </div>

      <PlayerHand gameState={gameState} />
      <Modals gameState={gameState} />
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <GameScreen />
    </SocketProvider>
  );
}