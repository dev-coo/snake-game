import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, Direction, Position, Snake as SnakeType, Food as FoodType } from '@snake-game/shared';
import Snake from '../entities/Snake';
import Food from '../entities/Food';
import { useGameStore } from '@/store/gameStore';

/**
 * 게임의 메인 씬 클래스
 * 실제 게임플레이가 이루어지는 곳
 */
export default class GameScene extends Phaser.Scene {
  private localSnake: Snake | null = null;
  private remoteSnake: Snake | null = null;
  private foods: Map<string, Food> = new Map();
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | null = null;
  private gridGraphics: Phaser.GameObjects.Graphics | null = null;
  private lastDirection: Direction = 'right';
  private gameStarted: boolean = false;
  private gameTimer: Phaser.Time.TimerEvent | null = null;
  private timeElapsed: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.setupGrid();
    this.setupInput();
    this.startSinglePlayerGame();
  }

  /**
   * 게임 그리드 배경 생성
   */
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

  /**
   * 입력 시스템 설정
   */
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

  /**
   * 싱글플레이어 게임 시작
   */
  private startSinglePlayerGame(): void {
    // 초기 뱀 생성
    const initialSnake: SnakeType = {
      id: 'player-1',
      positions: this.generateInitialPositions(
        Math.floor(GAME_CONFIG.GRID_SIZE.WIDTH / 3),
        Math.floor(GAME_CONFIG.GRID_SIZE.HEIGHT / 2)
      ),
      direction: 'right',
      speed: GAME_CONFIG.GAME_SPEED.NORMAL,
      color: COLORS.PLAYER1,
    };

    this.localSnake = new Snake(this, initialSnake, true);

    // 초기 먹이 생성
    this.spawnFood();
    this.spawnFood();
    this.spawnFood();

    // 게임 타이머 시작
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateGameTime,
      callbackScope: this,
      loop: true,
    });

    this.gameStarted = true;
  }

  /**
   * 초기 뱀 위치 생성
   */
  private generateInitialPositions(startX: number, startY: number): Position[] {
    const positions: Position[] = [];
    for (let i = 0; i < GAME_CONFIG.INITIAL_SNAKE_LENGTH; i++) {
      positions.push({ x: startX - i, y: startY });
    }
    return positions;
  }

  /**
   * 먹이 생성
   */
  private spawnFood(): void {
    const foodId = `food-${Date.now()}-${Math.random()}`;
    const position = this.getRandomEmptyPosition();
    
    if (position) {
      const foodData: FoodType = {
        id: foodId,
        position,
        type: 'normal',
        value: GAME_CONFIG.SCORE.FOOD_NORMAL,
      };

      const food = new Food(this, foodData);
      this.foods.set(foodId, food);
    }
  }

  /**
   * 빈 위치 랜덤 선택
   */
  private getRandomEmptyPosition(): Position | null {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const x = Math.floor(Math.random() * GAME_CONFIG.GRID_SIZE.WIDTH);
      const y = Math.floor(Math.random() * GAME_CONFIG.GRID_SIZE.HEIGHT);
      const position = { x, y };

      if (this.isPositionEmpty(position)) {
        return position;
      }
      attempts++;
    }

    return null;
  }

  /**
   * 위치가 비어있는지 확인
   */
  private isPositionEmpty(position: Position): boolean {
    // 로컬 뱀과 충돌 확인
    if (this.localSnake) {
      for (const segment of this.localSnake.getPositions()) {
        if (segment.x === position.x && segment.y === position.y) {
          return false;
        }
      }
    }

    // 원격 뱀과 충돌 확인
    if (this.remoteSnake) {
      for (const segment of this.remoteSnake.getPositions()) {
        if (segment.x === position.x && segment.y === position.y) {
          return false;
        }
      }
    }

    // 먹이와 충돌 확인
    for (const food of this.foods.values()) {
      const foodPos = food.getPosition();
      if (foodPos.x === position.x && foodPos.y === position.y) {
        return false;
      }
    }

    return true;
  }

  /**
   * 게임 시간 업데이트
   */
  private updateGameTime(): void {
    this.timeElapsed++;
    // 게임 스토어에 시간 업데이트 (추후 구현)
  }

  update(time: number, delta: number) {
    if (!this.gameStarted) return;

    // 입력 처리
    this.handleInput();

    // 엔티티 업데이트
    if (this.localSnake) {
      // 이동 전 현재 위치 저장
      const prevHead = this.localSnake.getHead();
      
      this.localSnake.update(delta);
      
      // 위치가 변경되었을 때만 충돌 검사
      const currentHead = this.localSnake.getHead();
      if (prevHead.x !== currentHead.x || prevHead.y !== currentHead.y) {
        this.checkCollisions();
      }
    }

    // 먹이 애니메이션 업데이트
    for (const food of this.foods.values()) {
      food.update(delta);
    }
  }

  /**
   * 입력 처리
   */
  private handleInput(): void {
    if (!this.localSnake || !this.cursors || !this.wasdKeys) return;

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
      this.localSnake.changeDirection(newDirection);
      this.lastDirection = newDirection;
    }
  }

  /**
   * 충돌 검사
   */
  private checkCollisions(): void {
    if (!this.localSnake) return;

    const head = this.localSnake.getHead();

    // 벽 충돌
    if (this.localSnake.checkWallCollision()) {
      this.gameOver('벽에 충돌했습니다!');
      return;
    }

    // 자기 자신과 충돌
    if (this.localSnake.checkSelfCollision()) {
      this.gameOver('자신의 몸에 충돌했습니다!');
      return;
    }

    // 먹이와 충돌
    for (const [foodId, food] of this.foods) {
      if (food.checkCollision(head)) {
        // 점수 증가
        const score = food.getValue();
        this.updateScore(score);

        // 뱀 성장
        this.localSnake.grow();

        // 먹이 제거
        food.destroy();
        this.foods.delete(foodId);

        // 새 먹이 생성
        this.spawnFood();
      }
    }
  }

  /**
   * 점수 업데이트
   */
  private updateScore(points: number): void {
    // 게임 스토어에 점수 업데이트 (추후 구현)
    console.log(`점수 획득: ${points}`);
  }

  /**
   * 게임 오버 처리
   */
  private gameOver(reason: string): void {
    this.gameStarted = false;

    // 타이머 정지
    if (this.gameTimer) {
      this.gameTimer.destroy();
    }

    // 게임 오버 처리
    console.log(`게임 오버: ${reason}`);
    
    // 게임 스토어 업데이트
    const store = useGameStore.getState();
    store.setGameStatus('finished');
    
    // 자동 이동 제거 - 사용자가 직접 선택하도록 함
  }

  /**
   * 씬 정리
   */
  shutdown(): void {
    // 엔티티 정리
    if (this.localSnake) {
      this.localSnake.destroy();
    }
    if (this.remoteSnake) {
      this.remoteSnake.destroy();
    }
    for (const food of this.foods.values()) {
      food.destroy();
    }
    this.foods.clear();

    // 그래픽 정리
    if (this.gridGraphics) {
      this.gridGraphics.destroy();
    }

    // 타이머 정리
    if (this.gameTimer) {
      this.gameTimer.destroy();
    }
  }
}