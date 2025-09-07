import { io, Socket } from 'socket.io-client';
import { GameMode } from '@snake-game/shared';
import { useGameStore } from '@/store/gameStore';

interface NetworkServiceEvents {
  // 서버 -> 클라이언트
  'room-created': (data: { roomId: string; playerId: string }) => void;
  'room-joined': (data: { roomId: string; playerId: string }) => void;
  'join-failed': (data: { reason: string }) => void;
  'room-updated': (data: { players: PlayerInfo[]; status: string }) => void;
  'game-starting': () => void;
  'player-left': (data: { playerId: string }) => void;
  
  // 클라이언트 -> 서버
  'create-room': (data: { playerName: string; mode: GameMode }) => void;
  'join-room': (data: { roomId: string; playerName: string }) => void;
  'player-ready': (data: { roomId: string; ready: boolean }) => void;
  'leave-room': (data: { roomId: string }) => void;
}

interface PlayerInfo {
  id: string;
  name: string;
  ready: boolean;
  isHost: boolean;
}

class NetworkService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private roomUpdateCallback: ((data: any) => void) | null = null;
  
  constructor() {
    this.serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
  }
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }
      
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      
      this.socket.on('connect', () => {
        console.log('Connected to server');
        resolve();
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });
      
      this.setupEventHandlers();
    });
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  createRoom(playerName: string, mode: GameMode): void {
    if (!this.socket) return;
    
    this.socket.emit('create-room', { playerName, mode });
  }
  
  joinRoom(roomId: string, playerName: string): void {
    if (!this.socket) return;
    
    this.socket.emit('join-room', { roomId, playerName });
  }
  
  setReady(roomId: string, ready: boolean): void {
    if (!this.socket) return;
    
    this.socket.emit('player-ready', { roomId, ready });
  }
  
  leaveRoom(roomId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('leave-room', { roomId });
  }
  
  requestRematch(roomId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('rematch-request', { roomId });
  }
  
  cancelRematch(roomId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('rematch-cancel', { roomId });
  }
  
  onRoomUpdate(callback: (data: any) => void): void {
    this.roomUpdateCallback = callback;
  }
  
  offRoomUpdate(): void {
    this.roomUpdateCallback = null;
  }
  
  private setupEventHandlers(): void {
    if (!this.socket) return;
    
    // 방 생성 성공
    this.socket.on('room-created', (data) => {
      console.log('Room created:', data);
      const store = useGameStore.getState();
      store.setRoomId(data.roomId);
      store.setGameStatus('waiting-room');
    });
    
    // 방 참가 성공
    this.socket.on('room-joined', (data) => {
      console.log('Joined room:', data);
      const store = useGameStore.getState();
      store.setRoomId(data.roomId);
      store.setGameStatus('waiting-room');
    });
    
    // 방 참가 실패
    this.socket.on('join-failed', (data) => {
      console.error('Failed to join room:', data.reason);
      // TODO: 에러 메시지 표시
    });
    
    // 방 상태 업데이트
    this.socket.on('room-updated', (data) => {
      console.log('Room updated:', data);
      if (this.roomUpdateCallback) {
        this.roomUpdateCallback(data);
      }
    });
    
    // 게임 시작
    this.socket.on('game-starting', () => {
      console.log('Game starting!');
      const store = useGameStore.getState();
      store.setGameStatus('playing');
    });
    
    // 플레이어 나감
    this.socket.on('player-left', (data) => {
      console.log('Player left:', data.playerId);
      // TODO: 플레이어 목록 업데이트
    });
  }
  
  // 싱글톤 인스턴스
  private static instance: NetworkService;
  
  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }
}

export default NetworkService;