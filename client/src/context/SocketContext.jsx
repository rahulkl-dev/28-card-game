import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [turnTime, setTurnTime] = useState(15);

  useEffect(() => {
    // Uses VITE_SERVER_URL in production, or relative path in dev (handled by Vite proxy)
    const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;

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