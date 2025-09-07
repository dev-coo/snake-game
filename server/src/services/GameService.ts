import type { MultiplayerGameState as GameState, Snake, Food, Direction, Position } from '@snake-game/shared';
import { GAME_CONFIG, COLORS } from '@snake-game/shared';

interface GameRoom {
  roomId: string;
  gameState: GameState;
  gameLoop?: NodeJS.Timeout;
  lastUpdateTime: number;
}

class GameService {
  private games: Map<string, GameRoom> = new Map();
  
  createGame(roomId: string, player1Id: string, player2Id: string): GameState {
    // 초기 게임 상태 생성
    const initialState: GameState = {
      players: new Map(),
      foods: new Map(),
      scores: new Map([[player1Id, 0], [player2Id, 0]]),
      gameTime: 0,
      isGameOver: false,
      winner: null,
    } as any;
    
    // 플레이어 1 뱀 생성 (왼쪽)
    const snake1: Snake = {
      id: player1Id,
      positions: this.generateInitialPositions(
        10,  // 왼쪽에서 10칸
        Math.floor(GAME_CONFIG.GRID_SIZE.HEIGHT / 2)
      ),
      direction: 'right',
      speed: GAME_CONFIG.GAME_SPEED.NORMAL,
      color: COLORS.PLAYER1,
    };
    
    // 플레이어 2 뱀 생성 (오른쪽)
    const snake2: Snake = {
      id: player2Id,
      positions: this.generateInitialPositions(
        GAME_CONFIG.GRID_SIZE.WIDTH - 10,  // 오른쪽에서 10칸
        Math.floor(GAME_CONFIG.GRID_SIZE.HEIGHT / 2)
      ),
      direction: 'left',
      speed: GAME_CONFIG.GAME_SPEED.NORMAL,
      color: COLORS.PLAYER2,
    };
    
    initialState.players.set(player1Id, snake1);
    initialState.players.set(player2Id, snake2);
    
    // 초기 먹이 생성
    for (let i = 0; i < 5; i++) {
      const food = this.generateFood(initialState);
      if (food) {
        initialState.foods.set(food.id, food);
      }
    }
    
    const gameRoom: GameRoom = {
      roomId,
      gameState: initialState,
      lastUpdateTime: Date.now(),
    };
    
    this.games.set(roomId, gameRoom);
    return initialState;
  }
  
  private generateInitialPositions(startX: number, startY: number): Position[] {
    const positions: Position[] = [];
    // 플레이어 1은 오른쪽으로, 플레이어 2는 왼쪽으로 향하도록
    const isPlayer1 = startX < GAME_CONFIG.GRID_SIZE.WIDTH / 2;
    
    for (let i = 0; i < GAME_CONFIG.INITIAL_SNAKE_LENGTH; i++) {
      if (isPlayer1) {
        positions.push({ x: startX - i, y: startY });
      } else {
        positions.push({ x: startX + i, y: startY });
      }
    }
    return positions;
  }
  
  private generateFood(gameState: GameState): Food | null {
    const maxAttempts = 100;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const x = Math.floor(Math.random() * GAME_CONFIG.GRID_SIZE.WIDTH);
      const y = Math.floor(Math.random() * GAME_CONFIG.GRID_SIZE.HEIGHT);
      const position = { x, y };
      
      if (this.isPositionEmpty(position, gameState)) {
        return {
          id: `food-${Date.now()}-${Math.random()}`,
          position,
          type: 'normal',
          value: GAME_CONFIG.SCORE.FOOD_NORMAL,
        };
      }
      attempts++;
    }
    
    return null;
  }
  
  private isPositionEmpty(position: Position, gameState: GameState): boolean {
    // 뱀들과 충돌 확인
    for (const snake of gameState.players.values()) {
      for (const segment of snake.positions) {
        if (segment.x === position.x && segment.y === position.y) {
          return false;
        }
      }
    }
    
    // 먹이와 충돌 확인
    for (const food of gameState.foods.values()) {
      if (food.position.x === position.x && food.position.y === position.y) {
        return false;
      }
    }
    
    return true;
  }
  
  updateDirection(roomId: string, playerId: string, direction: Direction): void {
    const game = this.games.get(roomId);
    if (!game) return;
    
    const snake = game.gameState.players.get(playerId);
    if (!snake) return;
    
    // 반대 방향으로는 이동 불가
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left',
    };
    
    if (snake.direction !== opposites[direction]) {
      snake.direction = direction;
    }
  }
  
  updateGameState(roomId: string): GameState | null {
    const game = this.games.get(roomId);
    if (!game || game.gameState.isGameOver) return null;
    
    const now = Date.now();
    const deltaTime = now - game.lastUpdateTime;
    game.lastUpdateTime = now;
    
    // 게임 시간 업데이트
    game.gameState.gameTime += deltaTime / 1000;
    
    // 각 뱀 이동
    for (const [playerId, snake] of game.gameState.players) {
      this.moveSnake(snake, game.gameState, playerId);
    }
    
    return game.gameState;
  }
  
  private moveSnake(snake: Snake, gameState: GameState, playerId: string): void {
    const head = { ...snake.positions[0] };
    
    // 방향에 따른 이동
    switch (snake.direction) {
      case 'up':
        head.y -= 1;
        break;
      case 'down':
        head.y += 1;
        break;
      case 'left':
        head.x -= 1;
        break;
      case 'right':
        head.x += 1;
        break;
    }
    
    // 벽 충돌 검사
    if (head.x < 0 || head.x >= GAME_CONFIG.GRID_SIZE.WIDTH ||
        head.y < 0 || head.y >= GAME_CONFIG.GRID_SIZE.HEIGHT) {
      this.handlePlayerDeath(playerId, gameState, 'wall');
      return;
    }
    
    // 자기 자신 충돌 검사
    for (let i = 1; i < snake.positions.length; i++) {
      if (head.x === snake.positions[i].x && head.y === snake.positions[i].y) {
        this.handlePlayerDeath(playerId, gameState, 'self');
        return;
      }
    }
    
    // 다른 뱀과 충돌 검사
    for (const [otherId, otherSnake] of gameState.players) {
      if (otherId === playerId) continue;
      
      for (const segment of otherSnake.positions) {
        if (head.x === segment.x && head.y === segment.y) {
          this.handlePlayerDeath(playerId, gameState, 'opponent');
          return;
        }
      }
    }
    
    // 먹이 충돌 검사
    let ateFood = false;
    for (const [foodId, food] of gameState.foods) {
      if (head.x === food.position.x && head.y === food.position.y) {
        // 점수 증가
        const currentScore = gameState.scores.get(playerId) || 0;
        gameState.scores.set(playerId, currentScore + food.value);
        
        // 먹이 제거
        gameState.foods.delete(foodId);
        
        // 새 먹이 생성
        const newFood = this.generateFood(gameState);
        if (newFood) {
          gameState.foods.set(newFood.id, newFood);
        }
        
        ateFood = true;
        break;
      }
    }
    
    // 뱀 이동
    snake.positions.unshift(head);
    
    // 먹이를 먹지 않았으면 꼬리 제거
    if (!ateFood) {
      snake.positions.pop();
    }
  }
  
  private handlePlayerDeath(playerId: string, gameState: GameState, deathCause: 'wall' | 'self' | 'opponent'): void {
    const player = gameState.players.get(playerId);
    if (player) {
      // 사망 원인 저장
      (player as any).deathCause = deathCause;
    }
    
    gameState.players.delete(playerId);
    
    // 남은 플레이어가 1명이면 게임 종료
    if (gameState.players.size === 1) {
      gameState.isGameOver = true;
      gameState.winner = gameState.players.keys().next().value;
      (gameState as any).loserInfo = {
        playerId,
        deathCause
      };
    }
  }
  
  startGameLoop(roomId: string, updateCallback: (state: GameState) => void): void {
    const game = this.games.get(roomId);
    if (!game) return;
    
    game.gameLoop = setInterval(() => {
      const updatedState = this.updateGameState(roomId);
      if (updatedState) {
        updateCallback(updatedState);
        
        if (updatedState.isGameOver && game.gameLoop) {
          clearInterval(game.gameLoop);
          game.gameLoop = undefined;
        }
      }
    }, GAME_CONFIG.GAME_SPEED.NORMAL);
  }
  
  stopGame(roomId: string): void {
    const game = this.games.get(roomId);
    if (game?.gameLoop) {
      clearInterval(game.gameLoop);
      game.gameLoop = undefined;
    }
    this.games.delete(roomId);
  }
  
  getGameState(roomId: string): GameState | null {
    return this.games.get(roomId)?.gameState || null;
  }
  
  // Socket.io 전송을 위해 Map을 일반 객체로 변환
  serializeGameState(gameState: GameState): any {
    const players: any = {};
    for (const [id, snake] of gameState.players) {
      players[id] = {
        id: snake.id,
        positions: JSON.parse(JSON.stringify(snake.positions)), // JSON 직렬화로 확실하게 배열 보장
        direction: snake.direction,
        speed: snake.speed,
        color: snake.color,
      };
    }
    
    const foods: any = {};
    for (const [id, food] of gameState.foods) {
      foods[id] = JSON.parse(JSON.stringify(food)); // 전체 객체 직렬화
    }
    
    return JSON.parse(JSON.stringify({
      players,
      foods,
      scores: Object.fromEntries(gameState.scores),
      gameTime: gameState.gameTime,
      isGameOver: gameState.isGameOver,
      winner: gameState.winner,
    }));
  }
}

module.exports = { GameService };