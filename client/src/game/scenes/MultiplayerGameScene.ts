import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, Direction, Snake as SnakeType, Food as FoodType, MultiplayerGameState as GameState } from '@snake-game/shared';
import Snake from '../entities/Snake';
import Food from '../entities/Food';
import NetworkService from '@/services/NetworkService';
import { useGameStore } from '@/store/gameStore';

export default class MultiplayerGameScene extends Phaser.Scene {
  private localPlayerId: string = '';
  private snakes: Map<string, Snake> = new Map();
  private foods: Map<string, Food> = new Map();
  private gridGraphics: Phaser.GameObjects.Graphics | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | null = null;
  private lastDirection: Direction = 'right';
  private networkService = NetworkService.getInstance();
  private lastInputTime: number = 0;
  private inputDelay: number = 50; // 입력 딜레이 (밀리초)

  constructor() {
    super({ key: 'MultiplayerGameScene' });
  }

  create() {
    this.setupGrid();
    this.setupInput();
    this.setupNetworkListeners();
    
    // 로컬 플레이어 ID 가져오기 (socket.id와 동일)
    const socket = (this.networkService as any).socket;
    if (socket) {
      this.localPlayerId = socket.id;
    }
  }

  private setupGrid(): void {
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, 0x1a1a1a, 0.3);

    // 격자 그리기
    for (let x = 0; x <= GAME_CONFIG.GRID_SIZE.WIDTH; x++) {
      this.gridGraphics.moveTo(x * GAME_CONFIG.CELL_SIZE, 0);
      this.gridGraphics.lineTo(x * GAME_CONFIG.CELL_SIZE, GAME_CONFIG.GRID_SIZE.HEIGHT * GAME_CONFIG.CELL_SIZE);
    }

    for (let y = 0; y <= GAME_CONFIG.GRID_SIZE.HEIGHT; y++) {
      this.gridGraphics.moveTo(0, y * GAME_CONFIG.CELL_SIZE);
      this.gridGraphics.lineTo(GAME_CONFIG.GRID_SIZE.WIDTH * GAME_CONFIG.CELL_SIZE, y * GAME_CONFIG.CELL_SIZE);
    }

    this.gridGraphics.strokePath();

    // 벽 그리기
    this.gridGraphics.lineStyle(3, Phaser.Display.Color.HexStringToColor(COLORS.WALL).color, 1);
    this.gridGraphics.strokeRect(
      0,
      0,
      GAME_CONFIG.GRID_SIZE.WIDTH * GAME_CONFIG.CELL_SIZE,
      GAME_CONFIG.GRID_SIZE.HEIGHT * GAME_CONFIG.CELL_SIZE
    );
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
  }

  private setupNetworkListeners(): void {
    const socket = (this.networkService as any).socket;
    if (!socket) return;

    // 게임 상태 업데이트
    socket.on('game-state', (gameState: GameState) => {
      this.updateGameState(gameState);
    });

    // 게임 오버
    socket.on('game-over', (data: any) => {
      console.log('Game over:', data);
      const store = useGameStore.getState();
      store.setGameOverReason(data.winner === this.localPlayerId ? '승리!' : '패배');
      store.setGameStatus('finished');
    });
  }

  private updateGameState(gameState: any): void {
    // 뱀 업데이트
    const playerIds = new Set(Object.keys(gameState.players));
    
    // 새로운 뱀 추가 또는 업데이트
    for (const [playerId, snakeData] of Object.entries(gameState.players)) {
      // positions를 배열로 변환
      const processedSnakeData = {
        ...snakeData,
        positions: Array.isArray(snakeData.positions) 
          ? snakeData.positions 
          : Object.values(snakeData.positions || {})
      } as SnakeType;
      
      let snake = this.snakes.get(playerId);
      
      if (!snake) {
        // 새로운 뱀 생성
        snake = new Snake(this, processedSnakeData, playerId === this.localPlayerId);
        this.snakes.set(playerId, snake);
      } else {
        // 기존 뱀 업데이트
        snake.updateFromServer(processedSnakeData);
      }
    }
    
    // 제거된 뱀 삭제
    for (const [playerId, snake] of this.snakes) {
      if (!playerIds.has(playerId)) {
        snake.destroy();
        this.snakes.delete(playerId);
      }
    }
    
    // 먹이 업데이트
    const foodIds = new Set(Object.keys(gameState.foods));
    
    // 새로운 먹이 추가 또는 업데이트
    for (const [foodId, foodData] of Object.entries(gameState.foods)) {
      let food = this.foods.get(foodId);
      
      if (!food) {
        // 새로운 먹이 생성
        food = new Food(this, foodData as FoodType);
        this.foods.set(foodId, food);
      }
    }
    
    // 제거된 먹이 삭제
    for (const [foodId, food] of this.foods) {
      if (!foodIds.has(foodId)) {
        food.destroy();
        this.foods.delete(foodId);
      }
    }
    
    // 점수 업데이트
    const store = useGameStore.getState();
    const myScore = gameState.scores[this.localPlayerId] || 0;
    // TODO: 점수 스토어 업데이트
  }

  update(time: number, delta: number) {
    // 입력 처리
    this.handleInput();
    
    // 먹이 애니메이션 업데이트
    for (const food of this.foods.values()) {
      food.update(delta);
    }
  }

  private handleInput(): void {
    if (!this.cursors || !this.wasdKeys) return;
    
    const currentTime = Date.now();
    if (currentTime - this.lastInputTime < this.inputDelay) return;

    let newDirection: Direction | null = null;

    // 방향키 입력
    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      newDirection = 'left';
    } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      newDirection = 'right';
    } else if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      newDirection = 'up';
    } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      newDirection = 'down';
    }

    if (newDirection && newDirection !== this.lastDirection) {
      // 반대 방향 체크
      const opposites: Record<Direction, Direction> = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left',
      };
      
      if (this.lastDirection !== opposites[newDirection]) {
        const roomId = useGameStore.getState().roomId;
        if (roomId) {
          const socket = (this.networkService as any).socket;
          socket.emit('game-input', { roomId, direction: newDirection });
          this.lastDirection = newDirection;
          this.lastInputTime = currentTime;
        }
      }
    }
  }

  shutdown(): void {
    // 엔티티 정리
    for (const snake of this.snakes.values()) {
      snake.destroy();
    }
    this.snakes.clear();
    
    for (const food of this.foods.values()) {
      food.destroy();
    }
    this.foods.clear();

    // 그래픽 정리
    if (this.gridGraphics) {
      this.gridGraphics.destroy();
    }
    
    // 네트워크 리스너 정리
    const socket = (this.networkService as any).socket;
    if (socket) {
      socket.off('game-state');
      socket.off('game-over');
    }
  }
}