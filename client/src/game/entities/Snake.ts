import Phaser from 'phaser';
import { Direction, Position, Snake as SnakeType } from '@snake-game/shared';
import { GAME_CONFIG, DIRECTIONS, COLORS } from '@snake-game/shared';

/**
 * 스네이크 엔티티 클래스
 * 각 플레이어가 조종하는 뱀의 상태와 동작을 관리
 */
export default class Snake {
  private scene: Phaser.Scene;
  private snakeData: SnakeType;
  private graphics: Phaser.GameObjects.Graphics;
  private moveTimer: number = 0;
  private isLocalPlayer: boolean;

  constructor(scene: Phaser.Scene, snakeData: SnakeType, isLocalPlayer: boolean = false) {
    this.scene = scene;
    this.snakeData = snakeData;
    this.isLocalPlayer = isLocalPlayer;
    this.graphics = scene.add.graphics();
    
    this.render();
  }

  /**
   * 매 프레임마다 호출되는 업데이트 메서드
   * @param deltaTime - 프레임 간 시간 차이 (ms)
   */
  update(deltaTime: number): void {
    if (this.isLocalPlayer) {
      this.moveTimer += deltaTime;
      
      if (this.moveTimer >= this.snakeData.speed) {
        this.move();
        this.moveTimer = 0;
      }
    }
  }

  /**
   * 현재 방향으로 한 칸 이동
   */
  move(): void {
    const head = this.snakeData.positions[0];
    const direction = DIRECTIONS[this.snakeData.direction.toUpperCase() as keyof typeof DIRECTIONS];
    
    const newHead: Position = {
      x: head.x + direction.x,
      y: head.y + direction.y,
    };

    // 새로운 머리 추가
    this.snakeData.positions.unshift(newHead);
    
    // 꼬리 제거 (성장하지 않는 경우)
    this.snakeData.positions.pop();
    
    this.render();
  }

  /**
   * 먹이 섭취 시 길이 증가
   */
  grow(): void {
    const tail = this.snakeData.positions[this.snakeData.positions.length - 1];
    this.snakeData.positions.push({ ...tail });
  }

  /**
   * 방향 변경
   * @param newDirection - 새로운 이동 방향
   */
  changeDirection(newDirection: Direction): void {
    // 180도 회전 방지
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left',
    };

    if (this.snakeData.direction !== opposites[newDirection]) {
      this.snakeData.direction = newDirection;
    }
  }

  /**
   * 자기 몸과의 충돌 검사
   * @returns 충돌 여부
   */
  checkSelfCollision(): boolean {
    const head = this.snakeData.positions[0];
    
    // 머리가 몸통의 다른 부분과 충돌하는지 검사
    for (let i = 1; i < this.snakeData.positions.length; i++) {
      const segment = this.snakeData.positions[i];
      if (head.x === segment.x && head.y === segment.y) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 벽과의 충돌 검사
   * @returns 충돌 여부
   */
  checkWallCollision(): boolean {
    const head = this.snakeData.positions[0];
    
    return (
      head.x < 0 ||
      head.x >= GAME_CONFIG.GRID_SIZE.WIDTH ||
      head.y < 0 ||
      head.y >= GAME_CONFIG.GRID_SIZE.HEIGHT
    );
  }

  /**
   * 다른 뱀과의 충돌 검사
   * @param otherSnake - 충돌 검사할 다른 뱀
   * @returns 충돌 여부
   */
  checkCollisionWithSnake(otherSnake: Snake): boolean {
    const head = this.snakeData.positions[0];
    
    for (const segment of otherSnake.getPositions()) {
      if (head.x === segment.x && head.y === segment.y) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 뱀을 화면에 렌더링
   */
  render(): void {
    this.graphics.clear();
    
    // 뱀 몸통 그리기
    this.snakeData.positions.forEach((segment, index) => {
      const alpha = index === 0 ? 1 : 0.8; // 머리는 더 진하게
      
      this.graphics.fillStyle(
        Phaser.Display.Color.HexStringToColor(this.snakeData.color).color,
        alpha
      );
      
      this.graphics.fillRect(
        segment.x * GAME_CONFIG.CELL_SIZE,
        segment.y * GAME_CONFIG.CELL_SIZE,
        GAME_CONFIG.CELL_SIZE - 2, // 격자 구분을 위한 여백
        GAME_CONFIG.CELL_SIZE - 2
      );
      
      // 머리에 눈 그리기
      if (index === 0 && this.isLocalPlayer) {
        this.graphics.fillStyle(0xffffff, 1);
        const eyeSize = 3;
        const eyeOffset = GAME_CONFIG.CELL_SIZE / 3;
        
        // 방향에 따라 눈 위치 조정
        let eye1X = segment.x * GAME_CONFIG.CELL_SIZE + eyeOffset;
        let eye1Y = segment.y * GAME_CONFIG.CELL_SIZE + eyeOffset;
        let eye2X = segment.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE - eyeOffset - eyeSize;
        let eye2Y = segment.y * GAME_CONFIG.CELL_SIZE + eyeOffset;
        
        this.graphics.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
        this.graphics.fillRect(eye2X, eye2Y, eyeSize, eyeSize);
      }
    });
  }

  /**
   * 서버로부터 받은 상태로 업데이트
   * @param newPositions - 새로운 위치 배열
   * @param direction - 새로운 방향
   */
  updateFromServer(newPositions: Position[], direction: Direction): void {
    this.snakeData.positions = newPositions;
    this.snakeData.direction = direction;
    this.render();
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    this.graphics.destroy();
  }

  // Getter 메서드들
  getHead(): Position {
    return this.snakeData.positions[0];
  }

  getPositions(): Position[] {
    return this.snakeData.positions;
  }

  getDirection(): Direction {
    return this.snakeData.direction;
  }

  getId(): string {
    return this.snakeData.id;
  }

  isAlive(): boolean {
    return !this.checkWallCollision() && !this.checkSelfCollision();
  }
}