import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [turnTime, setTurnTime] = useState(15);

  useEffect(() => {
    // In local dev, use relative origin (Vite proxy). In production, target Render directly.
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const serverUrl = isDev 
      ? window.location.origin 
      : 'https://two8-card-game-1b5i.onrender.com';

    const s = io(serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true
    });
    setSocket(s);

    s.on('connect', () => {
      console.log('✅ Connected to Game Server!');
    });

    s.on('TIMER_TICK', ({ remaining }) => {
      setTurnTime(remaining);
    });

    s.on('GAME_STATE_UPDATE', (state) => {
      setGameState(state);
      setErrorMsg('');
    });

    s.on('ERROR_MSG', (msg) => {
      setErrorMsg(msg);
    });

    return () => s.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, gameState, errorMsg, setErrorMsg, turnTime }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);