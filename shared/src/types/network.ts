/**
 * 네트워크 통신 관련 타입 정의
 */

import { Direction, GameState } from './game';

export interface ClientMessage {
  type: 'join' | 'move' | 'leave' | 'restart' | 'createRoom' | 'joinRoom';
  playerId: string;
  roomId?: string;
  data?: any;
}

export interface MoveData {
  direction: Direction;
  timestamp: number;
}

export interface JoinData {
  playerName: string;
  roomId?: string;
}

export interface ServerMessage {
  type: 'gameState' | 'gameStart' | 'gameEnd' | 'playerJoined' | 'playerLeft' | 'error' | 'roomCreated';
  data: any;
  timestamp: number;
}

export interface ErrorData {
  code: string;
  message: string;
}

export interface RoomInfo {
  roomId: string;
  players: string[];
  status: 'waiting' | 'playing' | 'finished';
}