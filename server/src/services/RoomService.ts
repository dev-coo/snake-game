import type { GameMode } from '@snake-game/shared';
import type { Socket } from 'socket.io';

interface Player {
  id: string;
  name: string;
  socket: Socket;
  ready: boolean;
}

interface Room {
  id: string;
  mode: GameMode;
  players: Map<string, Player>;
  host: string;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  gameStartedAt?: Date;
  rematchRequests?: Set<string>;
}

class RoomService {
  private rooms: Map<string, Room> = new Map();
  
  generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  createRoom(hostId: string, hostName: string, mode: GameMode, socket: Socket): Room {
    const roomId = this.generateRoomId();
    const room: Room = {
      id: roomId,
      mode,
      players: new Map([[hostId, { 
        id: hostId, 
        name: hostName, 
        socket, 
        ready: true 
      }]]),
      host: hostId,
      status: 'waiting',
      createdAt: new Date(),
    };
    
    this.rooms.set(roomId, room);
    return room;
  }
  
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }
  
  joinRoom(roomId: string, playerId: string, playerName: string, socket: Socket): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'waiting' || room.players.size >= 2) {
      return false;
    }
    
    room.players.set(playerId, { 
      id: playerId, 
      name: playerName, 
      socket, 
      ready: false 
    });
    
    return true;
  }
  
  leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    room.players.delete(playerId);
    
    // 방이 비어있으면 삭제
    if (room.players.size === 0) {
      this.rooms.delete(roomId);
    } else if (room.host === playerId) {
      // 호스트가 나갔으면 다른 플레이어를 호스트로
      const remainingPlayer = room.players.values().next().value;
      if (remainingPlayer) {
        room.host = remainingPlayer.id;
      }
    }
  }
  
  setPlayerReady(roomId: string, playerId: string, ready: boolean): boolean {
    const room = this.rooms.get(roomId);
    const player = room?.players.get(playerId);
    
    if (!room || !player) return false;
    
    player.ready = ready;
    
    // 모든 플레이어가 준비되었는지 확인
    const allReady = Array.from(room.players.values()).every(p => p.ready);
    
    if (allReady && room.players.size === 2) {
      room.status = 'playing';
      room.gameStartedAt = new Date();
      return true;
    }
    
    return false;
  }
  
  getRoomsByStatus(status: Room['status']): Room[] {
    return Array.from(this.rooms.values()).filter(room => room.status === status);
  }
  
  cleanupEmptyRooms(): void {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.players.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }
}

module.exports = { RoomService };