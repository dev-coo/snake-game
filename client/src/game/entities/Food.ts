import Phaser from 'phaser';
import { Food as FoodType, Position } from '@snake-game/shared';
import { GAME_CONFIG, COLORS } from '@snake-game/shared';

/**
 * 먹이 엔티티 클래스
 * 맵에 생성되는 먹이의 정보를 관리
 */
export default class Food {
  private scene: Phaser.Scene;
  private foodData: FoodType;
  private graphics: Phaser.GameObjects.Graphics;
  private pulseScale: number = 1;
  private pulseDirection: number = 1;

  constructor(scene: Phaser.Scene, foodData: FoodType) {
    this.scene = scene;
    this.foodData = foodData;
    this.graphics = scene.add.graphics();
    
    this.render();
  }

  /**
   * 매 프레임마다 호출되는 업데이트 메서드
   * @param deltaTime - 프레임 간 시간 차이 (ms)
   */
  update(deltaTime: number): void {
    // 먹이 펄스 애니메이션
    if (this.foodData.type === 'golden') {
      this.pulseScale += this.pulseDirection * deltaTime * 0.001;
      
      if (this.pulseScale > 1.2) {
        this.pulseScale = 1.2;
        this.pulseDirection = -1;
      } else if (this.pulseScale < 0.8) {
        this.pulseScale = 0.8;
        this.pulseDirection = 1;
      }
      
      this.render();
    }
  }

  /**
   * 먹이를 화면에 렌더링
   */
  render(): void {
    this.graphics.clear();
    
    const x = this.foodData.position.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
    const y = this.foodData.position.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
    const baseRadius = GAME_CONFIG.CELL_SIZE / 3;
    
    // 먹이 타입에 따른 색상 결정
    let color: number;
    switch (this.foodData.type) {
      case 'golden':
        color = Phaser.Display.Color.HexStringToColor(COLORS.FOOD_GOLDEN).color;
        break;
      case 'speed':
        color = 0x00ffff; // 청록색
        break;
      case 'slow':
        color = 0x8b4513; // 갈색
        break;
      case 'invincible':
        color = 0xff00ff; // 마젠타
        break;
      default:
        color = Phaser.Display.Color.HexStringToColor(COLORS.FOOD_NORMAL).color;
    }
    
    // 그림자 효과
    this.graphics.fillStyle(0x000000, 0.3);
    this.graphics.fillCircle(x + 2, y + 2, baseRadius * this.pulseScale);
    
    // 먹이 본체
    this.graphics.fillStyle(color, 1);
    this.graphics.fillCircle(x, y, baseRadius * this.pulseScale);
    
    // 특수 먹이 효과
    if (this.foodData.type === 'golden') {
      // 황금 먹이 반짝임
      this.graphics.lineStyle(2, 0xffffff, 0.5);
      this.graphics.strokeCircle(x, y, baseRadius * this.pulseScale * 1.2);
    } else if (this.foodData.type === 'speed') {
      // 속도 먹이 화살표
      this.graphics.fillStyle(0xffffff, 0.8);
      this.graphics.fillTriangle(
        x, y - baseRadius * 0.5,
        x - baseRadius * 0.3, y + baseRadius * 0.3,
        x + baseRadius * 0.3, y + baseRadius * 0.3
      );
    } else if (this.foodData.type === 'invincible') {
      // 무적 먹이 별 모양
      this.drawStar(x, y, 5, baseRadius * 0.7, baseRadius * 0.3);
    }
  }

  /**
   * 별 모양 그리기 (무적 아이템용)
   */
  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    
    this.graphics.beginPath();
    this.graphics.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      const x = cx + Math.cos(rot) * outerRadius;
      const y = cy + Math.sin(rot) * outerRadius;
      this.graphics.lineTo(x, y);
      rot += step;
      
      const x2 = cx + Math.cos(rot) * innerRadius;
      const y2 = cy + Math.sin(rot) * innerRadius;
      this.graphics.lineTo(x2, y2);
      rot += step;
    }
    
    this.graphics.lineTo(cx, cy - outerRadius);
    this.graphics.closePath();
    this.graphics.fillStyle(0xffffff, 0.8);
    this.graphics.fillPath();
  }

  /**
   * 먹이 섭취 처리 및 점수 반환
   * @returns 획득한 점수
   */
  consume(): number {
    // 섭취 애니메이션 (추후 구현)
    this.destroy();
    return this.foodData.value;
  }

  /**
   * 서버로부터 받은 위치로 업데이트
   * @param newPosition - 새로운 위치
   */
  updatePosition(newPosition: Position): void {
    this.foodData.position = newPosition;
    this.render();
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    this.graphics.destroy();
  }

  // Getter 메서드들
  getPosition(): Position {
    return this.foodData.position;
  }

  getType(): string {
    return this.foodData.type;
  }

  getValue(): number {
    return this.foodData.value;
  }

  getId(): string {
    return this.foodData.id;
  }

  /**
   * 특정 위치가 이 먹이와 충돌하는지 검사
   * @param position - 검사할 위치
   * @returns 충돌 여부
   */
  checkCollision(position: Position): boolean {
    return (
      this.foodData.position.x === position.x &&
      this.foodData.position.y === position.y
    );
  }
}