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
    origin: process.env.CLIENT_URL || '*',  // 모든 origin 허용
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Services
const roomService = new RoomService();

// Controllers
const socketController = new SocketController(io, roomService);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,  // WebSocket 연결을 위해 비활성화
}));
app.use(cors({
  origin: true,  // 모든 origin 허용
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
const HOST = process.env.HOST || '0.0.0.0';  // 모든 네트워크 인터페이스에서 리스닝

httpServer.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Health check available at http://${HOST}:${PORT}/health`);
  
  // 로컬 네트워크 IP 주소 출력
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  console.log('\nServer is accessible at:');
  console.log(`  - http://localhost:${PORT}`);
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const interfaces = networkInterfaces[interfaceName];
    interfaces.forEach((iface: any) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  - http://${iface.address}:${PORT}`);
      }
    });
  });
}).on('error', (err: any) => {
  console.error('Server start error:', err);
  process.exit(1);
});

module.exports = { app, io };