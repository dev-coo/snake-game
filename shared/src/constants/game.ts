/**
 * 게임 관련 상수 정의
 */

export const GAME_CONFIG = {
  GRID_SIZE: {
    WIDTH: 40,
    HEIGHT: 40,
  },
  CELL_SIZE: 15, // 픽셀
  GAME_SPEED: {
    SLOW: 200,    // ms per move
    NORMAL: 150,
    FAST: 100,
  },
  TIME_LIMIT: {
    CLASSIC: 180,  // 3분 (초)
    BATTLE: 300,   // 5분 (초)
  },
  INITIAL_SNAKE_LENGTH: 3,
  SCORE: {
    FOOD_NORMAL: 1,
    FOOD_GOLDEN: 3,
    KILL_OPPONENT: 50,
  },
  MAX_FOOD_COUNT: 3,
} as const;

export const COLORS = {
  PLAYER1: '#00ff00',
  PLAYER2: '#ff0066',
  FOOD_NORMAL: '#ffcc00',
  FOOD_GOLDEN: '#ffd700',
  WALL: '#333333',
  GRID: '#1a1a1a',
  BACKGROUND: '#0a0a0a',
} as const;

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
} as const;