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
            
            // 클라이언트가 준비할 시간을 준 후 게임 시작
            setTimeout(() => {
              this.startGame(data.roomId);
            }, 1000);
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
      
      // 재경기 요청
      socket.on('rematch-request', (data: { roomId: string }) => {
        const room = this.roomService.getRoom(data.roomId);
        if (!room) return;
        
        // 재경기 요청 상태 저장
        if (!room.rematchRequests) {
          room.rematchRequests = new Set();
        }
        room.rematchRequests.add(socket.id);
        
        console.log('[REMATCH] Request from:', socket.id);
        console.log('[REMATCH] Current requests:', Array.from(room.rematchRequests));
        console.log('[REMATCH] Room players size:', room.players.size);
        
        // 상대방에게 재경기 요청 알림
        socket.broadcast.to(data.roomId).emit('rematch-requested', {
          playerId: socket.id,
          playerName: room.players.get(socket.id)?.name,
        });
        
        // 모두 재경기를 원하면 게임 재시작
        if (room.rematchRequests.size === room.players.size) {
          this.resetAndStartGame(data.roomId);
        }
      });
      
      // 재경기 취소
      socket.on('rematch-cancel', (data: { roomId: string }) => {
        const room = this.roomService.getRoom(data.roomId);
        if (room?.rematchRequests) {
          room.rematchRequests.delete(socket.id);
          
          socket.broadcast.to(data.roomId).emit('rematch-cancelled', {
            playerId: socket.id,
          });
        }
      });
      
      // 연결 해제
      socket.on('disconnect', () => {
        console.log(`[DISCONNECT] Client disconnecting: ${socket.id}`);
        
        // 플레이어가 속한 모든 방에서 제거
        const rooms = Array.from(socket.rooms);
        console.log(`[DISCONNECT] Player was in rooms:`, rooms);
        
        rooms.forEach((roomId: string) => {
          if (roomId !== socket.id) {
            console.log(`[DISCONNECT] Removing from room: ${roomId}`);
            this.handleLeaveRoom(socket, roomId);
          }
        });
        
        console.log(`[DISCONNECT] Client disconnected: ${socket.id}`);
      });
    });
  }
  
  private handleLeaveRoom(socket: Socket, roomId: string) {
    console.log('[LEAVE] Player leaving:', socket.id, 'from room:', roomId);
    
    const room = this.roomService.getRoom(roomId);
    console.log('[LEAVE] Room status before leave:', room?.status);
    console.log('[LEAVE] Rematch requests before leave:', room?.rematchRequests ? Array.from(room.rematchRequests) : 'none');
    console.log('[LEAVE] Room players before leave:', room ? Array.from(room.players.keys()) : 'no room');
    
    // 게임 중이거나 재경기 요청이 있었다면 정리
    if (room) {
      if (room.status === 'playing' || room.status === 'finished') {
        console.log('[LEAVE] Cleaning up game state for room:', roomId);
        this.gameService.stopGame(roomId);
        room.status = 'waiting';
      }
      
      // 재경기 요청 초기화
      if (room.rematchRequests) {
        console.log('[LEAVE] Clearing rematch requests');
        room.rematchRequests = undefined;
      }
    }
    
    socket.leave(roomId);
    this.roomService.leaveRoom(roomId, socket.id);
    
    const roomAfter = this.roomService.getRoom(roomId);
    if (roomAfter) {
      const playerList = Array.from(roomAfter.players.values()).map((p: any) => ({
        id: p.id,
        name: p.name,
        ready: p.ready,
        isHost: p.id === roomAfter.host,
      }));
      
      this.io.to(roomId).emit('room-updated', {
        players: playerList,
        status: roomAfter.status,
      });
      
      socket.broadcast.to(roomId).emit('player-left', {
        playerId: socket.id,
      });
    }
  }
  
  private startGame(roomId: string): void {
    const room = this.roomService.getRoom(roomId);
    if (!room || room.players.size !== 2) return;
    
    // 플레이어 ID를 일관된 순서로 정렬 (호스트가 항상 player1)
    const playerIds = Array.from(room.players.keys());
    const sortedPlayerIds = playerIds.sort((a, b) => {
      // 호스트가 항상 첫 번째(왼쪽 위치)
      if (a === room.host) return -1;
      if (b === room.host) return 1;
      // 호스트가 아닌 경우 ID로 정렬하여 일관성 유지
      return a.localeCompare(b);
    });
    
    console.log('[GAME] Starting game with sorted player IDs:', sortedPlayerIds);
    
    // 카운트다운 시작 알림
    let countdown = 3;
    this.io.to(roomId).emit('game-countdown', { count: countdown });
    
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.io.to(roomId).emit('game-countdown', { count: countdown });
      } else {
        clearInterval(countdownInterval);
        
        // 게임 생성 및 시작
        const gameState = this.gameService.createGame(roomId, sortedPlayerIds[0], sortedPlayerIds[1]);
        
        // 초기 게임 상태 전송
        this.io.to(roomId).emit('game-state', this.gameService.serializeGameState(gameState));
        
        // 게임 루프 시작
        this.startGameLoop(roomId);
      }
    }, 1000);
  }
  
  private startGameLoop(roomId: string): void {
    const room = this.roomService.getRoom(roomId);
    if (!room) return;
    
    this.gameService.startGameLoop(roomId, (state: any) => {
      this.io.to(roomId).emit('game-state', this.gameService.serializeGameState(state));
      
      // 게임 종료 시
      if (state.isGameOver) {
        room.status = 'finished';
        const winner = state.winner ? room.players.get(state.winner)?.name : '무승부';
        const loserInfo = (state as any).loserInfo;
        
        // 각 플레이어에게 개인화된 게임 오버 정보 전송
        for (const [playerId, player] of room.players) {
          const isWinner = playerId === state.winner;
          const socket = player.socket;
          
          if (socket) {
            socket.emit('game-over', {
              winner: state.winner,
              winnerName: winner,
              scores: Object.fromEntries(state.scores),
              isWinner,
              deathCause: !isWinner && loserInfo ? loserInfo.deathCause : null,
            });
          }
        }
        
        // 게임 정리는 하지 않음 (재경기를 위해)
      }
    });
  }
  
  private resetAndStartGame(roomId: string): void {
    console.log('[REMATCH] resetAndStartGame called for room:', roomId);
    
    const room = this.roomService.getRoom(roomId);
    if (!room) {
      console.log('[REMATCH] Room not found!');
      return;
    }
    
    // 플레이어가 2명인지 확인
    if (room.players.size !== 2) {
      console.log('[REMATCH] Not enough players:', room.players.size);
      return;
    }
    
    console.log('[REMATCH] Room players:', Array.from(room.players.keys()));
    console.log('[REMATCH] Room host:', room.host);
    console.log('[REMATCH] Room player count:', room.players.size);
    
    // 재경기 요청 초기화
    room.rematchRequests = new Set();
    room.status = 'playing';
    
    // 이전 게임 정리
    this.gameService.stopGame(roomId);
    
    // 새 게임 시작
    this.io.to(roomId).emit('rematch-starting');
    
    // 클라이언트가 씬을 재시작할 시간을 준 후 게임 시작
    setTimeout(() => {
      this.startGame(roomId);
    }, 2000);
  }
}

module.exports = { SocketController };