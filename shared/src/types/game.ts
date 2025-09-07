/**
 * 게임 관련 공통 타입 정의
 */

export type Direction = 'up' | 'down' | 'left' | 'right';

export type GameMode = 'classic' | 'battle';

export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  snake: Snake;
  score: number;
  isAlive: boolean;
  connectionStatus: 'connected' | 'disconnected';
}

export interface Snake {
  id: string;
  positions: Position[];
  direction: Direction;
  speed: number;
  color: string;
}

export interface Food {
  id: string;
  position: Position;
  type: FoodType;
  value: number;
}

export type FoodType = 'normal' | 'golden' | 'speed' | 'slow' | 'invincible';

export interface GameState {
  gameId: string;
  mode: GameMode;
  status: GameStatus;
  players: Player[];
  food: Food[];
  timeElapsed: number;
  timeRemaining: number;
  winner: string | null;
  gridSize: {
    width: number;
    height: number;
  };
}