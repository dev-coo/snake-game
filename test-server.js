// 간단한 테스트 서버 - 연결 문제 디버깅용
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS 완전 개방
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// 기본 라우트
app.get('/health', (req, res) => {
  console.log('Health check from:', req.ip);
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    headers: req.headers 
  });
});

// Socket.io 연결
io.on('connection', (socket) => {
  console.log('✅ New connection:', socket.id);
  console.log('From:', socket.handshake.address);
  console.log('Headers:', socket.handshake.headers);
  
  socket.emit('welcome', { 
    message: 'Connected to test server!',
    socketId: socket.id 
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
  });
  
  socket.on('ping', () => {
    socket.emit('pong', { time: Date.now() });
  });
});

const PORT = 3001;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log('🚀 Test server running on', `${HOST}:${PORT}`);
  console.log('');
  console.log('Test URLs:');
  console.log(`  Health check: http://localhost:${PORT}/health`);
  console.log(`  Socket.io:    ws://localhost:${PORT}/socket.io/`);
  console.log('');
  
  // 네트워크 인터페이스 표시
  const os = require('os');
  const interfaces = os.networkInterfaces();
  console.log('Available on:');
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  http://${iface.address}:${PORT}`);
      }
    });
  });
});