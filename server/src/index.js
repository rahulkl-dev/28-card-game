import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Room } from './Room.js';

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('🃏 28 Game Server is online!');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  socket.on('CREATE_ROOM', ({ name }) => {
    let code = generateRoomCode();
    while (rooms.has(code)) code = generateRoomCode();

    const room = new Room(code);
    room.addPlayer(socket.id, name);
    rooms.set(code, room);
    socket.join(code);
    room.broadcastState(io);
  });

  socket.on('JOIN_ROOM', ({ name, code }) => {
    const room = rooms.get(code);
    if (!room) return socket.emit('ERROR_MSG', 'Room not found.');
    if (room.isFull()) return socket.emit('ERROR_MSG', 'Room is already full.');

    room.addPlayer(socket.id, name);
    socket.join(code);

    if (room.isFull() && room.gameState === 'LOBBY') {
      room.startRound(io);
    } else {
      room.broadcastState(io);
    }
  });

  socket.on('BID_ACTION', ({ code, val, isHolding, isPassing }) => {
    const room = rooms.get(code);
    if (!room) return;
    const seat = Object.keys(room.seats).find(s => room.seats[s]?.socketId === socket.id);
    if (seat) {
      room.handleBid(seat, val, isHolding, isPassing);
      room.broadcastState(io);
      if (room.gameState === 'BIDDING') {
        room.startTurnTimer(io);
      }
    }
  });

  socket.on('SELECT_TRUMP', ({ code, selectorCard }) => {
    const room = rooms.get(code);
    if (!room) return;
    const seat = Object.keys(room.seats).find(s => room.seats[s]?.socketId === socket.id);
    if (seat) {
      room.selectTrump(seat, selectorCard.suit, io);
    }
  });

  socket.on('OPEN_TRUMP', ({ code }) => {
    const room = rooms.get(code);
    if (!room) return;
    const seat = Object.keys(room.seats).find(s => room.seats[s]?.socketId === socket.id);
    if (seat) {
      room.openTrump(seat, io);
    }
  });

  socket.on('PLAY_CARD', ({ code, cardId }) => {
    const room = rooms.get(code);
    if (!room) return;
    const seat = Object.keys(room.seats).find(s => room.seats[s]?.socketId === socket.id);
    if (seat) {
      room.playCard(seat, cardId, io);
      room.broadcastState(io);
    }
  });

  socket.on('NEXT_ROUND', ({ code }) => {
    const room = rooms.get(code);
    if (!room) return;
    room.startRound(io);
  });

  // WebRTC Voice Signaling
  socket.on('VOICE_SIGNAL', ({ targetSocketId, signalData }) => {
    io.to(targetSocketId).emit('VOICE_SIGNAL', {
      senderSocketId: socket.id,
      signalData
    });
  });

  socket.on('JOIN_VOICE', ({ code }) => {
    socket.to(code).emit('PEER_JOINED_VOICE', { socketId: socket.id });
  });

  socket.on('LEAVE_VOICE', ({ code }) => {
    socket.to(code).emit('PEER_LEFT_VOICE', { socketId: socket.id });
  });

  socket.on('DECLARE_JODI', ({ code }) => {
  const room = rooms.get(code);
  if (!room) return;
  const seat = Object.keys(room.seats).find(s => room.seats[s]?.socketId === socket.id);
  if (seat) {
    room.declareJodi(seat, io);
  }
    });

  // Handle Disconnect & Convert to Bot
  socket.on('disconnect', () => {
    rooms.forEach((room) => {
      const seat = Object.keys(room.seats).find(s => room.seats[s]?.socketId === socket.id);
      if (seat && room.seats[seat]) {
        room.seats[seat].isBot = true;
        room.seats[seat].name += ' (Bot)';
        room.broadcastState(io);

        // If it was their turn, trigger automated turn instantly
        if (room.currentTurnSeat === seat || room.currentBidderSeat === seat) {
          room.handleTurnTimeout(io);
        }
      }
    });
  });
});


const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🃏 28 Game Server running on port ${PORT}`);
});