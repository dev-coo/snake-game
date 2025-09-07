import type { Server, Socket } from 'socket.io';
import type { GameMode, Direction } from '@snake-game/shared';

const { RoomService } = require('../services/RoomService');
const { GameService } = require('../services/GameService');

class SocketController {
  private gameService: any;
  
  constructor(
    private io: Server,
    private roomService: any
  ) {
    this.gameService = new GameService();
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // 방 생성
      socket.on('create-room', (data: { playerName: string; mode: GameMode }) => {
        const room = this.roomService.createRoom(
          socket.id,
          data.playerName,
          data.mode,
          socket
        );
        
        socket.join(room.id);
        socket.emit('room-created', { 
          roomId: room.id,
          playerId: socket.id 
        });
        
        console.log(`Room ${room.id} created by ${data.playerName}`);
      });
      
      // 방 참가
      socket.on('join-room', (data: { roomId: string; playerName: string }) => {
        const success = this.roomService.joinRoom(
          data.roomId,
          socket.id,
          data.playerName,
          socket
        );
        
        if (success) {
          socket.join(data.roomId);
          socket.emit('room-joined', { 
            roomId: data.roomId,
            playerId: socket.id 
          });
          
          // 방의 모든 플레이어에게 업데이트 알림
          const room = this.roomService.getRoom(data.roomId);
          if (room) {
            const playerList = Array.from(room.players.values()).map((p: any) => ({
              id: p.id,
              name: p.name,
              ready: p.ready,
              isHost: p.id === room.host,
            }));
            
            this.io.to(data.roomId).emit('room-updated', {
              players: playerList,
              status: room.status,
            });
          }
          
          console.log(`${data.playerName} joined room ${data.roomId}`);
        } else {
          socket.emit('join-failed', { 
            reason: 'Room not found or full' 
          });
        }
      });
      
      // 준비 상태 변경
      socket.on('player-ready', (data: { roomId: string; ready: boolean }) => {
        const allReady = this.roomService.setPlayerReady(
          data.roomId,
          socket.id,
          data.ready
        );
        
        const room = this.roomService.getRoom(data.roomId);
        if (room) {
          const playerList = Array.from(room.players.values()).map((p: any) => ({
            id: p.id,
            name: p.name,
            ready: p.ready,
            isHost: p.id === room.host,
          }));
          
          this.io.to(data.roomId).emit('room-updated', {
            players: playerList,
            status: room.status,
          });
          
          // 게임 시작
          if (allReady) {
            this.io.to(data.roomId).emit('game-starting');
            console.log(`Game starting in room ${data.roomId}`);
            
            // 게임 초기화
            this.startGame(data.roomId);
          }
        }
      });
      
      // 방 나가기
      socket.on('leave-room', (data: { roomId: string }) => {
        this.handleLeaveRoom(socket, data.roomId);
      });
      
      // 게임 입력 처리
      socket.on('game-input', (data: { roomId: string; direction: Direction }) => {
        this.gameService.updateDirection(data.roomId, socket.id, data.direction);
      });
      
      // 연결 해제
      socket.on('disconnect', () => {
        // 플레이어가 속한 모든 방에서 제거
        const rooms = Array.from(socket.rooms);
        rooms.forEach((roomId: string) => {
          if (roomId !== socket.id) {
            this.handleLeaveRoom(socket, roomId);
          }
        });
        
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }
  
  private handleLeaveRoom(socket: Socket, roomId: string) {
    socket.leave(roomId);
    this.roomService.leaveRoom(roomId, socket.id);
    
    const room = this.roomService.getRoom(roomId);
    if (room) {
      const playerList = Array.from(room.players.values()).map((p: any) => ({
        id: p.id,
        name: p.name,
        ready: p.ready,
        isHost: p.id === room.host,
      }));
      
      this.io.to(roomId).emit('room-updated', {
        players: playerList,
        status: room.status,
      });
      
      socket.broadcast.to(roomId).emit('player-left', {
        playerId: socket.id,
      });
    }
  }
  
  private startGame(roomId: string): void {
    const room = this.roomService.getRoom(roomId);
    if (!room || room.players.size !== 2) return;
    
    const playerIds = Array.from(room.players.keys());
    const gameState = this.gameService.createGame(roomId, playerIds[0], playerIds[1]);
    
    // 초기 게임 상태 전송
    this.io.to(roomId).emit('game-state', gameState);
    
    // 게임 루프 시작
    this.gameService.startGameLoop(roomId, (state: any) => {
      this.io.to(roomId).emit('game-state', state);
      
      // 게임 종료 시
      if (state.isGameOver) {
        room.status = 'finished';
        const winner = state.winner ? room.players.get(state.winner)?.name : '무승부';
        
        this.io.to(roomId).emit('game-over', {
          winner: state.winner,
          winnerName: winner,
          scores: Object.fromEntries(state.scores),
        });
        
        // 게임 정리
        setTimeout(() => {
          this.gameService.stopGame(roomId);
        }, 5000);
      }
    });
  }
}

module.exports = { SocketController };