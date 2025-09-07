import type { Request, Response } from 'express';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { RoomService } = require('./services/RoomService');
const { SocketController } = require('./controllers/SocketController');

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Services
const roomService = new RoomService();

// Controllers
const socketController = new SocketController(io, roomService);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Room list endpoint
app.get('/api/rooms', (req: Request, res: Response) => {
  const waitingRooms = roomService.getRoomsByStatus('waiting').map((room: any) => ({
    id: room.id,
    mode: room.mode,
    playerCount: room.players.size,
    host: Array.from(room.players.values()).find((p: any) => p.id === room.host)?.name,
  }));
  
  res.json({ rooms: waitingRooms });
});

// Start server
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
}).on('error', (err: any) => {
  console.error('Server start error:', err);
  process.exit(1);
});

module.exports = { app, io };